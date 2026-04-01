import { useEffect, useState, useCallback } from "react";
import {
    AlertCircle, Clock, Loader2, MapPin, ChevronLeft, ChevronRight,
    X, Ban, ShieldAlert, CheckCircle2, Truck, Hourglass,
    XCircle, ShieldCheck, FileX, ImageOff, History,
} from "lucide-react";

import { cancelRescueRequest, getMyRescueRequests } from "@/services/rescue-request.service";
import type { RescueRequest } from "@/types/rescue-requests";
import { API_BASE_URL } from "@/config/env";

const imgUrl = (path: string) =>
    path.startsWith("/") ? `${API_BASE_URL || ""}${path}` : path;

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_META: Record<string, {
    label: string;
    bg: string;
    text: string;
    border: string;
    icon: React.ReactNode;
    dot: string;
    step: number;
}> = {
    PENDING: { label: "Chờ xử lý", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", icon: <Hourglass className="w-3.5 h-3.5" />, dot: "bg-sky-400", step: 1 },
    VERIFIED: { label: "Đã xác minh", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", icon: <ShieldCheck className="w-3.5 h-3.5" />, dot: "bg-emerald-400", step: 2 },
    ASSIGNED: { label: "Đã điều phối", bg: "bg-violet-50", text: "text-violet-700", border: "border-violet-200", icon: <Truck className="w-3.5 h-3.5" />, dot: "bg-violet-400", step: 3 },
    IN_PROGRESS: { label: "Đang xử lý", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", icon: <Loader2 className="w-3.5 h-3.5 animate-spin" />, dot: "bg-amber-400", step: 4 },
    COMPLETED: { label: "Hoàn thành", bg: "bg-green-50", text: "text-green-700", border: "border-green-200", icon: <CheckCircle2 className="w-3.5 h-3.5" />, dot: "bg-green-500", step: 5 },
    CANCELLED: { label: "Đã hủy", bg: "bg-red-50", text: "text-red-700", border: "border-red-200", icon: <XCircle className="w-3.5 h-3.5" />, dot: "bg-red-400", step: 0 },
};

const URGENCY_META: Record<string, { label: string; text: string; bg: string; border: string }> = {
    LOW: { label: "Nhẹ", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200" },
    MEDIUM: { label: "Trung bình", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200" },
    HIGH: { label: "Khẩn cấp", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200" },
    CRITICAL: { label: "Nguy kịch", text: "text-red-700", bg: "bg-red-50", border: "border-red-200" },
};

const CANCELLABLE_STATUSES = ["PENDING", "VERIFIED"];

const STEPS = ["Chờ xử lý", "Đã xác minh", "Điều phối", "Đang xử lý", "Hoàn thành"];

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ── Lightbox ───────────────────────────────────────────────────────────────────
interface LightboxState { images: string[]; index: number; }

function Lightbox({ state, onClose }: { state: LightboxState; onClose: () => void }) {
    const { images, index: initialIndex } = state;
    const [current, setCurrent] = useState(initialIndex);
    const prev = useCallback(() => setCurrent((i) => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length]);

    useEffect(() => {
        const h = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose, prev, next]);

    const hasMany = images.length > 1;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md" onClick={onClose}>
            <button onClick={onClose}
                className="absolute top-5 right-5 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                aria-label="Đóng">
                <X className="w-5 h-5" />
            </button>

            {hasMany && (
                <span className="absolute top-5 left-1/2 -translate-x-1/2 text-white/70 text-sm font-medium bg-black/30 px-3 py-1 rounded-full">
                    {current + 1} / {images.length}
                </span>
            )}

            {hasMany && (
                <button onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-4 sm:left-7 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                    aria-label="Ảnh trước">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            <div className="relative max-w-3xl max-h-[90vh] mx-20" onClick={(e) => e.stopPropagation()}>
                <img key={current} src={imgUrl(images[current])} alt={`Ảnh ${current + 1}`}
                    className="rounded-2xl max-h-[85vh] max-w-full object-contain shadow-2xl" />
            </div>

            {hasMany && (
                <button onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-4 sm:right-7 w-11 h-11 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors"
                    aria-label="Ảnh tiếp">
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}

            {hasMany && (
                <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                            className={`rounded-full transition-all ${i === current ? "w-5 h-2 bg-white" : "w-2 h-2 bg-white/40 hover:bg-white/70"}`} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Cancel Modal ───────────────────────────────────────────────────────────────
function CancelModal({ requestCode, onConfirm, onClose }: {
    requestCode: string;
    onConfirm: (reason: string) => Promise<void>;
    onClose: () => void;
}) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) { setError("Vui lòng nhập lý do hủy."); return; }
        setSubmitting(true); setError(null);
        try { await onConfirm(trimmed); onClose(); }
        catch (e) { setError(e instanceof Error ? e.message : "Không thể hủy. Vui lòng thử lại."); }
        finally { setSubmitting(false); }
    };

    useEffect(() => {
        const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", h);
        return () => window.removeEventListener("keydown", h);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 backdrop-blur-sm px-4 pb-4 sm:pb-0"
            onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl overflow-hidden" onClick={(e) => e.stopPropagation()}>
                {/* Red accent top bar */}
                <div className="h-1.5 bg-gradient-to-r from-red-400 to-rose-500" />

                <div className="p-5 space-y-4">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-2xl bg-red-100 flex items-center justify-center shrink-0">
                                <Ban className="w-5 h-5 text-red-600" />
                            </div>
                            <div>
                                <h2 className="text-base font-bold text-gray-900">Hủy yêu cầu cứu hộ</h2>
                                <p className="text-xs text-gray-400 font-mono mt-0.5">{requestCode}</p>
                            </div>
                        </div>
                        <button onClick={onClose}
                            className="w-8 h-8 rounded-full hover:bg-gray-100 flex items-center justify-center text-gray-400 transition-colors shrink-0">
                            <X className="w-4 h-4" />
                        </button>
                    </div>

                    <p className="text-sm text-gray-600 leading-relaxed">
                        Vui lòng cho biết lý do bạn muốn hủy yêu cầu. Hành động này{" "}
                        <span className="font-semibold text-gray-800">không thể hoàn tác</span>.
                    </p>

                    <div className="space-y-1.5">
                        <label className="text-[11px] font-bold text-gray-500 uppercase tracking-wider">
                            Lý do hủy <span className="text-red-500">*</span>
                        </label>
                        <textarea
                            value={reason}
                            onChange={(e) => { setReason(e.target.value); setError(null); }}
                            placeholder="Ví dụ: Nước đã rút, tôi an toàn rồi..."
                            rows={3}
                            autoFocus
                            className={`w-full rounded-xl border-2 px-3.5 py-2.5 text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none transition-all
                ${error ? "border-red-300 focus:border-red-400 bg-red-50/30" : "border-gray-200 focus:border-blue-400 bg-gray-50 focus:bg-white"}`}
                        />
                        <div className="flex items-center justify-between">
                            {error
                                ? <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>
                                : <span />}
                            <p className="text-xs text-gray-400 ml-auto">{reason.trim().length} ký tự</p>
                        </div>
                    </div>

                    <div className="flex gap-2.5 pt-1">
                        <button onClick={onClose} disabled={submitting}
                            className="flex-1 rounded-xl border-2 border-gray-200 bg-white hover:bg-gray-50 text-gray-700 text-sm font-semibold py-2.5 transition-colors disabled:opacity-50">
                            Quay lại
                        </button>
                        <button onClick={handleSubmit} disabled={submitting || !reason.trim()}
                            className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-bold py-2.5 transition-colors flex items-center justify-center gap-2">
                            {submitting
                                ? <><Loader2 className="w-4 h-4 animate-spin" />Đang hủy...</>
                                : <><Ban className="w-4 h-4" />Xác nhận hủy</>}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Request Card ───────────────────────────────────────────────────────────────
function RequestCard({
    req,
    onOpenLightbox,
    onCancel,
}: {
    req: RescueRequest;
    onOpenLightbox: (images: string[], index: number) => void;
    onCancel: (req: RescueRequest) => void;
}) {
    const statusMeta = STATUS_META[req.status] ?? {
        label: req.status, bg: "bg-gray-50", text: "text-gray-700",
        border: "border-gray-200", dot: "bg-gray-400",
        icon: null, step: 0,
    };
    const urgencyMeta = req.urgencyLevel ? URGENCY_META[req.urgencyLevel] : null;
    const [lng, lat] = req.location?.coordinates ?? [0, 0];
    const images = req.images ?? [];
    const canCancel = CANCELLABLE_STATUSES.includes(req.status);
    const isCancelled = req.status === "CANCELLED";

    return (
        <div className={`rh-card rounded-2xl bg-white border shadow-sm overflow-hidden transition-all hover:shadow-md
      ${isCancelled ? "border-red-100 opacity-75" : "border-gray-100"}`}>

            {/* Top accent stripe based on urgency */}
            {urgencyMeta && !isCancelled && (
                <div className={`h-1 w-full ${req.urgencyLevel === "CRITICAL" ? "bg-gradient-to-r from-red-400 to-rose-500" :
                    req.urgencyLevel === "HIGH" ? "bg-gradient-to-r from-orange-400 to-amber-400" :
                        req.urgencyLevel === "MEDIUM" ? "bg-gradient-to-r from-amber-300 to-yellow-400" :
                            "bg-gradient-to-r from-emerald-300 to-teal-400"
                    }`} />
            )}
            {isCancelled && <div className="h-1 w-full bg-gradient-to-r from-red-200 to-red-300" />}

            <div className="p-4 flex gap-4">
                {/* ── Image thumbnail ── */}
                <div className="shrink-0">
                    {images[0] ? (
                        <button
                            onClick={() => onOpenLightbox(images, 0)}
                            className="relative w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-xl overflow-hidden block group cursor-zoom-in">
                            <img src={imgUrl(images[0])} alt={req.description}
                                className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-110" />
                            {images.length > 1 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity rounded-xl">
                                    <span className="text-white text-xs font-bold">+{images.length - 1} ảnh</span>
                                </div>
                            )}
                        </button>
                    ) : (
                        <div className="w-[88px] h-[88px] sm:w-24 sm:h-24 rounded-xl bg-gray-100 flex flex-col items-center justify-center gap-1 text-gray-400">
                            <ImageOff className="w-5 h-5" />
                            <span className="text-[10px]">Không có ảnh</span>
                        </div>
                    )}
                </div>

                {/* ── Content ── */}
                <div className="flex-1 min-w-0 space-y-2">
                    {/* Row 1: code + badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900">{req.requestCode}</span>

                        {/* Status badge */}
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border
              ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${statusMeta.dot}`} />
                            {statusMeta.label}
                        </span>

                        {/* Urgency badge */}
                        {urgencyMeta && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border
                ${urgencyMeta.bg} ${urgencyMeta.text} ${urgencyMeta.border}`}>
                                <ShieldAlert className="w-2.5 h-2.5" />
                                {urgencyMeta.label}
                            </span>
                        )}
                    </div>

                    {/* Row 2: description */}
                    <p className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{req.description}</p>

                    {/* Row 3: meta */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5 shrink-0" />
                            {formatDate(req.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0" />
                            {lat.toFixed(4)}, {lng.toFixed(4)}
                        </span>
                    </div>

                    {/* Cancelled reason if any */}
                    {isCancelled && (req as any).cancelReason && (
                        <p className="text-xs text-red-500 bg-red-50 rounded-lg px-2.5 py-1.5 border border-red-100">
                            Lý do: {(req as any).cancelReason}
                        </p>
                    )}

                    {/* Cancel button */}
                    {canCancel && (
                        <div className="pt-1">
                            <button
                                onClick={() => onCancel(req)}
                                className="inline-flex items-center gap-1.5 rounded-xl border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 transition-colors">
                                <Ban className="w-3.5 h-3.5" />
                                Hủy yêu cầu
                            </button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function RequestsHistory() {
    const [items, setItems] = useState<RescueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState<LightboxState | null>(null);
    const [cancelTarget, setCancelTarget] = useState<RescueRequest | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true); setError(null);
            try {
                const data = await getMyRescueRequests();
                if (!cancelled)
                    setItems([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Không thể tải lịch sử yêu cầu.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleCancel = async (reason: string) => {
        if (!cancelTarget) return;
        const updated = await cancelRescueRequest(cancelTarget._id, reason);
        setItems((prev) => prev.map((x) => (x._id === cancelTarget._id ? updated : x)));
    };

    // ── States ──────────────────────────────────────────────────────────────────
    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 text-gray-500">
            <div className="w-14 h-14 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center">
                <Loader2 className="w-7 h-7 animate-spin text-blue-500" />
            </div>
            <p className="text-sm font-medium">Đang tải lịch sử yêu cầu cứu hộ...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
                <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
                <div className="px-5 py-4 flex gap-3">
                    <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                    <div>
                        <p className="text-sm font-bold text-red-700">Không thể tải lịch sử</p>
                        <p className="text-sm text-red-600 mt-1">{error}</p>
                    </div>
                </div>
            </div>
        </div>
    );

    if (!items.length) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-sm w-full text-center space-y-4">
                <div className="w-20 h-20 rounded-3xl bg-white border border-gray-100 shadow-sm flex items-center justify-center mx-auto">
                    <FileX className="w-9 h-9 text-gray-300" />
                </div>
                <div>
                    <p className="text-base font-bold text-gray-800">Chưa có yêu cầu nào</p>
                    <p className="text-sm text-gray-500 mt-1 leading-relaxed">
                        Bạn chưa gửi yêu cầu cứu hộ nào. Hãy tạo yêu cầu khi cần trợ giúp khẩn cấp.
                    </p>
                </div>
            </div>
        </div>
    );

    const active = items.filter(r => !["COMPLETED", "CANCELLED"].includes(r.status));
    const completed = items.filter(r => r.status === "COMPLETED");
    const cancelled = items.filter(r => r.status === "CANCELLED");

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .rh-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes rh-up { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
        .rh-card { animation: rh-up 0.3s cubic-bezier(.22,1,.36,1) both; }
        .rh-card:nth-child(1){animation-delay:.04s}
        .rh-card:nth-child(2){animation-delay:.08s}
        .rh-card:nth-child(3){animation-delay:.12s}
        .rh-card:nth-child(4){animation-delay:.16s}
        .rh-card:nth-child(5){animation-delay:.20s}
        .rh-card:nth-child(6){animation-delay:.24s}
        .rh-card:nth-child(7){animation-delay:.28s}
        .rh-card:nth-child(8){animation-delay:.32s}
      `}</style>

            <div className="rh-root min-h-screen bg-[#f5f6fa] px-4 py-7">
                <div className="max-w-2xl mx-auto space-y-6">

                    {/* ── Header ── */}
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                            <History className="w-5 h-5 text-blue-500" />
                        </div>
                        <div>
                            <h1 className="text-lg font-extrabold text-gray-900 tracking-tight">Lịch sử yêu cầu cứu hộ</h1>
                            <p className="text-xs text-gray-500 mt-0.5">{items.length} yêu cầu · Sắp xếp theo thời gian gần nhất</p>
                        </div>
                    </div>

                    {/* ── Active requests ── */}
                    {active.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Đang hoạt động</span>
                                <span className="text-[10px] font-bold bg-blue-100 text-blue-600 px-1.5 py-0.5 rounded-full">{active.length}</span>
                            </div>
                            {active.map(req => (
                                <RequestCard key={req._id} req={req}
                                    onOpenLightbox={(imgs, i) => setLightbox({ images: imgs, index: i })}
                                    onCancel={setCancelTarget} />
                            ))}
                        </section>
                    )}

                    {/* ── Completed ── */}
                    {completed.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Đã hoàn thành</span>
                                <span className="text-[10px] font-bold bg-emerald-100 text-emerald-600 px-1.5 py-0.5 rounded-full">{completed.length}</span>
                            </div>
                            {completed.map(req => (
                                <RequestCard key={req._id} req={req}
                                    onOpenLightbox={(imgs, i) => setLightbox({ images: imgs, index: i })}
                                    onCancel={setCancelTarget} />
                            ))}
                        </section>
                    )}

                    {/* ── Cancelled ── */}
                    {cancelled.length > 0 && (
                        <section className="space-y-3">
                            <div className="flex items-center gap-2">
                                <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Đã hủy</span>
                                <span className="text-[10px] font-bold bg-red-100 text-red-500 px-1.5 py-0.5 rounded-full">{cancelled.length}</span>
                            </div>
                            {cancelled.map(req => (
                                <RequestCard key={req._id} req={req}
                                    onOpenLightbox={(imgs, i) => setLightbox({ images: imgs, index: i })}
                                    onCancel={setCancelTarget} />
                            ))}
                        </section>
                    )}

                </div>
            </div>

            {lightbox && <Lightbox state={lightbox} onClose={() => setLightbox(null)} />}

            {cancelTarget && (
                <CancelModal
                    requestCode={cancelTarget.requestCode}
                    onConfirm={handleCancel}
                    onClose={() => setCancelTarget(null)}
                />
            )}
        </>
    );
}