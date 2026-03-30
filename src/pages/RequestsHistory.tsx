import { useEffect, useState, useCallback } from "react";
import {
    AlertCircle, Clock, Loader2, MapPin,
    ChevronLeft, ChevronRight, X, ShieldCheck,
    FileText, ImageIcon, CheckCircle2, Siren,
} from "lucide-react";

import { confirmRescuedRescueRequest, getMyRescueRequests } from "@/services/rescue-request.service";
import type { RescueRequest } from "@/types/rescue-requests";
import { API_BASE_URL } from "@/config/env";

const imgUrl = (path: string) =>
    path.startsWith("/") ? `${API_BASE_URL || ""}${path}` : path;

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_META: Record<string, { label: string; dot: string; pill: string; text: string }> = {
    PENDING: { label: "Chờ xử lý", dot: "bg-blue-400", pill: "bg-blue-50 border-blue-200", text: "text-blue-700" },
    VERIFIED: { label: "Đã xác minh", dot: "bg-emerald-400", pill: "bg-emerald-50 border-emerald-200", text: "text-emerald-700" },
    ASSIGNED: { label: "Đã điều phối", dot: "bg-violet-400", pill: "bg-violet-50 border-violet-200", text: "text-violet-700" },
    IN_PROGRESS: { label: "Đang xử lý", dot: "bg-amber-400", pill: "bg-amber-50 border-amber-200", text: "text-amber-700" },
    COMPLETED: { label: "Hoàn thành", dot: "bg-green-500", pill: "bg-green-50 border-green-200", text: "text-green-700" },
    CANCELLED: { label: "Đã hủy", dot: "bg-red-400", pill: "bg-red-50 border-red-200", text: "text-red-700" },
};

const URGENCY_META: Record<string, { label: string; color: string; bg: string }> = {
    LOW: { label: "Thấp", color: "text-gray-600", bg: "bg-gray-100" },
    MEDIUM: { label: "Trung bình", color: "text-amber-700", bg: "bg-amber-50" },
    HIGH: { label: "Cao", color: "text-orange-700", bg: "bg-orange-50" },
    CRITICAL: { label: "Khẩn cấp", color: "text-red-700", bg: "bg-red-50" },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
interface LightboxState { images: string[]; index: number; }

function Lightbox({ state, onClose }: { state: LightboxState; onClose: () => void }) {
    const { images, index: init } = state;
    const [current, setCurrent] = useState(init);
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

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md"
            onClick={onClose}
        >
            <button onClick={onClose}
                className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                <X className="w-5 h-5" />
            </button>

            {images.length > 1 && (
                <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/60 text-xs font-semibold tracking-widest uppercase">
                    {current + 1} / {images.length}
                </span>
            )}

            {images.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); prev(); }}
                    className="absolute left-3 sm:left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}

            <div className="relative max-w-4xl max-h-[90vh] mx-16" onClick={(e) => e.stopPropagation()}>
                <img key={current} src={imgUrl(images[current])} alt={`Ảnh ${current + 1}`}
                    className="rounded-2xl max-h-[85vh] max-w-full object-contain shadow-2xl" />
            </div>

            {images.length > 1 && (
                <button onClick={(e) => { e.stopPropagation(); next(); }}
                    className="absolute right-3 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors">
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}

            {images.length > 1 && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-2">
                    {images.map((_, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }}
                            className={`transition-all rounded-full ${i === current ? "bg-white w-5 h-2" : "bg-white/35 w-2 h-2"}`} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Request Card ──────────────────────────────────────────────────────────────
function RequestCard({
    req, onLightbox, confirmingId, onConfirm,
}: {
    req: RescueRequest;
    onLightbox: (s: LightboxState) => void;
    confirmingId: string | null;
    onConfirm: (id: string) => void;
}) {
    const sm = STATUS_META[req.status] ?? { label: req.status, dot: "bg-gray-400", pill: "bg-gray-100 border-gray-200", text: "text-gray-600" };
    const urgency = req.urgencyLevel ? URGENCY_META[req.urgencyLevel] ?? null : null;
    const images = req.images ?? [];
    const [lng, lat] = req.location?.coordinates ?? [0, 0];
    const canConfirm = ["ASSIGNED", "IN_PROGRESS", "PENDING"].includes(req.status);
    const isCompleted = req.status === "COMPLETED";

    return (
        <div className={`group relative bg-white rounded-2xl border shadow-sm hover:shadow-md transition-all duration-200 overflow-hidden
      ${isCompleted ? "border-green-100" : "border-gray-100 hover:border-blue-100"}`}>

            {/* Colored left accent bar */}
            <div className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${sm.dot}`} />

            <div className="pl-5 pr-4 py-4 flex gap-4">

                {/* Image grid */}
                <div className="shrink-0">
                    {images.length === 0 ? (
                        <div className="w-20 h-20 rounded-xl bg-gray-50 border border-gray-100 flex flex-col items-center justify-center gap-1">
                            <ImageIcon className="w-5 h-5 text-gray-300" />
                            <span className="text-[10px] text-gray-300">Không có ảnh</span>
                        </div>
                    ) : images.length === 1 ? (
                        <button onClick={() => onLightbox({ images, index: 0 })}
                            className="w-20 h-20 rounded-xl overflow-hidden border border-gray-100 hover:border-blue-300 hover:scale-[1.03] transition-all cursor-zoom-in shrink-0">
                            <img src={imgUrl(images[0])} alt="" className="w-full h-full object-cover" />
                        </button>
                    ) : (
                        <div className="grid grid-cols-2 gap-1 w-[84px]">
                            {images.slice(0, 4).map((img, i) => (
                                <button key={i} onClick={() => onLightbox({ images, index: i })}
                                    className="relative w-10 h-10 rounded-lg overflow-hidden border border-gray-100 hover:border-blue-300 hover:scale-[1.05] transition-all cursor-zoom-in">
                                    <img src={imgUrl(img)} alt="" className="w-full h-full object-cover" />
                                    {i === 3 && images.length > 4 && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <span className="text-white text-[10px] font-black">+{images.length - 4}</span>
                                        </div>
                                    )}
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0 space-y-2">

                    {/* Top row: code + badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900 tracking-tight">{req.requestCode}</span>

                        {/* Status pill */}
                        <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full border text-[11px] font-bold ${sm.pill} ${sm.text}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${sm.dot}`} />
                            {sm.label}
                        </span>

                        {/* Urgency */}
                        {urgency && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-bold ${urgency.bg} ${urgency.color}`}>
                                <Siren className="w-3 h-3" />
                                {urgency.label}
                            </span>
                        )}

                        {/* Image count */}
                        {images.length > 1 && (
                            <button onClick={() => onLightbox({ images, index: 0 })}
                                className="inline-flex items-center gap-1 text-[11px] font-semibold text-gray-400 hover:text-blue-500 transition-colors">
                                <ImageIcon className="w-3 h-3" />
                                {images.length} ảnh
                            </button>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-600 leading-relaxed line-clamp-2">{req.description}</p>

                    {/* Meta row */}
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-400">
                        <span className="inline-flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            {formatDate(req.createdAt)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5" />
                            {lat.toFixed(5)}, {lng.toFixed(5)}
                        </span>
                    </div>

                    {/* Confirm button */}
                    {canConfirm && (
                        <div className="pt-1">
                            <button
                                onClick={() => onConfirm(req._id)}
                                disabled={confirmingId === req._id}
                                className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 disabled:cursor-not-allowed text-white text-xs font-bold transition-colors shadow-sm shadow-emerald-200">
                                {confirmingId === req._id
                                    ? <><Loader2 className="w-3.5 h-3.5 animate-spin" />Đang xác nhận...</>
                                    : <><ShieldCheck className="w-3.5 h-3.5" />Xác nhận đã an toàn</>}
                            </button>
                        </div>
                    )}

                    {/* Completed checkmark */}
                    {isCompleted && (
                        <div className="inline-flex items-center gap-1.5 text-xs text-green-600 font-semibold">
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            Yêu cầu đã được giải quyết
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

// ── Main ──────────────────────────────────────────────────────────────────────
export default function RequestsHistory() {
    const [items, setItems] = useState<RescueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState<LightboxState | null>(null);
    const [confirmingId, setConfirmingId] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;
        (async () => {
            setLoading(true);
            setError(null);
            try {
                const data = await getMyRescueRequests();
                if (!cancelled)
                    setItems([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
            } catch (e) {
                if (!cancelled)
                    setError(e instanceof Error ? e.message : "Không thể tải lịch sử yêu cầu cứu hộ.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        })();
        return () => { cancelled = true; };
    }, []);

    const handleConfirm = async (id: string) => {
        if (confirmingId) return;
        setConfirmingId(id);
        try {
            const updated = await confirmRescuedRescueRequest(id);
            setItems((prev) => prev.map((x) => (x._id === id ? updated : x)));
        } catch (e) {
            alert(e instanceof Error ? e.message : "Không thể xác nhận an toàn");
        } finally {
            setConfirmingId(null);
        }
    };

    // ── Loading ──
    if (loading) return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-3 text-gray-400">
            <div className="w-12 h-12 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center">
                <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
            </div>
            <p className="text-sm font-medium">Đang tải lịch sử yêu cầu cứu hộ...</p>
        </div>
    );

    // ── Error ──
    if (error) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-5 flex gap-3 shadow-sm">
                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-bold text-red-700">Không thể tải dữ liệu</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
            </div>
        </div>
    );

    // ── Empty ──
    if (!items.length) return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4">
            <div className="max-w-sm w-full text-center space-y-3">
                <div className="w-16 h-16 rounded-2xl bg-gray-100 border border-gray-200 flex items-center justify-center mx-auto">
                    <FileText className="w-8 h-8 text-gray-300" />
                </div>
                <p className="text-base font-bold text-gray-800">Chưa có yêu cầu cứu hộ nào</p>
                <p className="text-sm text-gray-500 leading-relaxed">
                    Hãy gửi yêu cầu khi cần trợ giúp khẩn cấp. Đội cứu hộ sẽ phản hồi sớm nhất có thể.
                </p>
            </div>
        </div>
    );

    // ── Summary counts ──
    const counts = Object.fromEntries(
        Object.keys(STATUS_META).map((s) => [s, items.filter((r) => r.status === s).length])
    );

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-8">
            <div className="max-w-3xl mx-auto space-y-6">

                {/* Header */}
                <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-500 flex items-center justify-center shadow-sm">
                        <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div>
                        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Lịch sử yêu cầu cứu hộ</h1>
                        <p className="text-sm text-gray-500 mt-0.5">
                            {items.length} yêu cầu · {counts.COMPLETED ?? 0} hoàn thành · {counts.IN_PROGRESS ?? 0} đang xử lý
                        </p>
                    </div>
                </div>

                {/* Status summary chips */}
                <div className="flex flex-wrap gap-2">
                    {Object.entries(STATUS_META).map(([key, meta]) => {
                        const c = counts[key] ?? 0;
                        if (!c) return null;
                        return (
                            <span key={key} className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full border text-xs font-bold ${meta.pill} ${meta.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                {meta.label}: {c}
                            </span>
                        );
                    })}
                </div>

                {/* Cards */}
                <div className="space-y-3">
                    {items.map((req) => (
                        <RequestCard
                            key={req._id}
                            req={req}
                            onLightbox={setLightbox}
                            confirmingId={confirmingId}
                            onConfirm={handleConfirm}
                        />
                    ))}
                </div>
            </div>

            {lightbox && <Lightbox state={lightbox} onClose={() => setLightbox(null)} />}
        </div>
    );
}