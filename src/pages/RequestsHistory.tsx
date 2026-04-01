import { useEffect, useState, useCallback } from "react";
import { AlertCircle, Clock, Loader2, MapPin, ChevronLeft, ChevronRight, X, Ban } from "lucide-react";

import { cancelRescueRequest, getMyRescueRequests } from "@/services/rescue-request.service";
import type { RescueRequest } from "@/types/rescue-requests";
import { API_BASE_URL } from "@/config/env";

const imgUrl = (path: string) => (path.startsWith("/") ? `${API_BASE_URL || ""}${path}` : path);

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    PENDING: { label: "Chờ xử lý", bg: "bg-blue-50", color: "text-blue-700" },
    VERIFIED: { label: "Đã xác minh", bg: "bg-emerald-50", color: "text-emerald-700" },
    ASSIGNED: { label: "Đã điều phối", bg: "bg-violet-50", color: "text-violet-700" },
    IN_PROGRESS: { label: "Đang xử lý", bg: "bg-amber-50", color: "text-amber-700" },
    COMPLETED: { label: "Hoàn thành", bg: "bg-green-50", color: "text-green-700" },
    CANCELLED: { label: "Đã hủy", bg: "bg-red-50", color: "text-red-700" },
};

const CANCELLABLE_STATUSES = ["PENDING", "VERIFIED"];

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ── Lightbox ──────────────────────────────────────────────────────────────────
interface LightboxState { images: string[]; index: number; }

function Lightbox({ state, onClose }: { state: LightboxState; onClose: () => void }) {
    const { images, index: initialIndex } = state;
    const [current, setCurrent] = useState(initialIndex);
    const prev = useCallback(() => setCurrent((i) => (i - 1 + images.length) % images.length), [images.length]);
    const next = useCallback(() => setCurrent((i) => (i + 1) % images.length), [images.length]);

    useEffect(() => {
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") onClose();
            if (e.key === "ArrowLeft") prev();
            if (e.key === "ArrowRight") next();
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose, prev, next]);

    const hasMany = images.length > 1;
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm" onClick={onClose}>
            <button onClick={onClose} className="absolute top-4 right-4 w-9 h-9 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors" aria-label="Đóng">
                <X className="w-5 h-5" />
            </button>
            {hasMany && <span className="absolute top-4 left-1/2 -translate-x-1/2 text-white/80 text-sm font-medium">{current + 1} / {images.length}</span>}
            {hasMany && (
                <button onClick={(e) => { e.stopPropagation(); prev(); }} className="absolute left-3 sm:left-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors" aria-label="Ảnh trước">
                    <ChevronLeft className="w-6 h-6" />
                </button>
            )}
            <div className="relative max-w-3xl max-h-[90vh] mx-16" onClick={(e) => e.stopPropagation()}>
                <img key={current} src={imgUrl(images[current])} alt={`Ảnh ${current + 1}`} className="rounded-xl max-h-[85vh] max-w-full object-contain shadow-2xl" />
            </div>
            {hasMany && (
                <button onClick={(e) => { e.stopPropagation(); next(); }} className="absolute right-3 sm:right-6 w-10 h-10 rounded-full bg-white/10 hover:bg-white/25 flex items-center justify-center text-white transition-colors" aria-label="Ảnh tiếp">
                    <ChevronRight className="w-6 h-6" />
                </button>
            )}
            {hasMany && (
                <div className="absolute bottom-5 left-1/2 -translate-x-1/2 flex gap-1.5">
                    {images.map((_, i) => (
                        <button key={i} onClick={(e) => { e.stopPropagation(); setCurrent(i); }} className={`w-2 h-2 rounded-full transition-colors ${i === current ? "bg-white" : "bg-white/40"}`} />
                    ))}
                </div>
            )}
        </div>
    );
}

// ── Cancel Modal ──────────────────────────────────────────────────────────────
interface CancelModalProps {
    requestCode: string;
    onConfirm: (reason: string) => Promise<void>;
    onClose: () => void;
}

function CancelModal({ requestCode, onConfirm, onClose }: CancelModalProps) {
    const [reason, setReason] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleSubmit = async () => {
        const trimmed = reason.trim();
        if (!trimmed) { setError("Vui lòng nhập lý do hủy yêu cầu."); return; }
        setSubmitting(true);
        setError(null);
        try {
            await onConfirm(trimmed);
            onClose();
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không thể hủy yêu cầu. Vui lòng thử lại.");
        } finally {
            setSubmitting(false);
        }
    };

    useEffect(() => {
        const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [onClose]);

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm px-4" onClick={onClose}>
            <div className="w-full max-w-md rounded-2xl bg-white shadow-2xl p-5 space-y-4" onClick={(e) => e.stopPropagation()}>
                {/* Header */}
                <div className="flex items-start justify-between gap-3">
                    <div className="flex items-center gap-2">
                        <div className="w-9 h-9 rounded-full bg-red-100 flex items-center justify-center shrink-0">
                            <Ban className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                            <h2 className="text-base font-bold text-slate-900">Hủy yêu cầu cứu hộ</h2>
                            <p className="text-xs text-slate-500 font-mono">{requestCode}</p>
                        </div>
                    </div>
                    <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-slate-100 flex items-center justify-center text-slate-400 transition-colors" aria-label="Đóng">
                        <X className="w-4 h-4" />
                    </button>
                </div>

                <p className="text-sm text-slate-600">
                    Vui lòng cho biết lý do bạn muốn hủy yêu cầu này. Hành động này <span className="font-semibold text-slate-800">không thể hoàn tác</span>.
                </p>

                {/* Textarea */}
                <div className="space-y-1.5">
                    <label className="text-xs font-semibold text-slate-700 uppercase tracking-wide">
                        Lý do hủy <span className="text-red-500">*</span>
                    </label>
                    <textarea
                        value={reason}
                        onChange={(e) => { setReason(e.target.value); setError(null); }}
                        placeholder="Ví dụ: Nước đã rút, tôi an toàn rồi..."
                        rows={3}
                        className={`w-full rounded-xl border px-3 py-2.5 text-sm text-slate-800 placeholder-slate-400 resize-none focus:outline-none focus:ring-2 transition-all ${error ? "border-red-400 focus:ring-red-200" : "border-slate-200 focus:ring-blue-200 focus:border-blue-400"}`}
                        autoFocus
                    />
                    {error && <p className="text-xs text-red-600 flex items-center gap-1"><AlertCircle className="w-3 h-3" />{error}</p>}
                    <p className="text-xs text-slate-400 text-right">{reason.trim().length} ký tự</p>
                </div>

                {/* Actions */}
                <div className="flex gap-2 pt-1">
                    <button onClick={onClose} disabled={submitting} className="flex-1 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 text-sm font-semibold py-2.5 transition-colors disabled:opacity-50">
                        Quay lại
                    </button>
                    <button
                        onClick={handleSubmit}
                        disabled={submitting || !reason.trim()}
                        className="flex-1 rounded-xl bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white text-sm font-semibold py-2.5 transition-colors flex items-center justify-center gap-2"
                    >
                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Đang hủy...</> : <><Ban className="w-4 h-4" />Xác nhận hủy</>}
                    </button>
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
    const [cancelTarget, setCancelTarget] = useState<RescueRequest | null>(null);

    useEffect(() => {
        let cancelled = false;
        const load = async () => {
            setLoading(true); setError(null);
            try {
                const data = await getMyRescueRequests();
                if (!cancelled) {
                    setItems([...data].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
                }
            } catch (e) {
                if (!cancelled) setError(e instanceof Error ? e.message : "Không thể tải lịch sử yêu cầu cứu hộ. Vui lòng thử lại.");
            } finally {
                if (!cancelled) setLoading(false);
            }
        };
        load();
        return () => { cancelled = true; };
    }, []);

    const handleCancel = async (reason: string) => {
        if (!cancelTarget) return;
        const updated = await cancelRescueRequest(cancelTarget._id, reason);
        setItems((prev) => prev.map((x) => (x._id === cancelTarget._id ? updated : x)));
    };

    if (loading) return (
        <div className="min-h-screen flex flex-col items-center justify-center text-gray-500">
            <Loader2 className="w-10 h-10 animate-spin mb-3" />
            <p>Đang tải lịch sử yêu cầu cứu hộ...</p>
        </div>
    );

    if (error) return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full rounded-2xl border border-red-200 bg-red-50 px-5 py-4 flex gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
                <div>
                    <p className="text-sm font-semibold text-red-700">Không thể tải lịch sử yêu cầu</p>
                    <p className="text-sm text-red-600 mt-1">{error}</p>
                </div>
            </div>
        </div>
    );

    if (!items.length) return (
        <div className="min-h-screen flex items-center justify-center px-4">
            <div className="max-w-md w-full text-center">
                <p className="text-lg font-semibold text-gray-800 mb-2">Bạn chưa có yêu cầu cứu hộ nào</p>
                <p className="text-sm text-gray-500">Hãy quay lại trang gửi yêu cầu để tạo yêu cầu cứu hộ khi cần trợ giúp khẩn cấp.</p>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-gray-50 px-4 py-6">
            <div className="max-w-3xl mx-auto space-y-4">
                <div>
                    <h1 className="text-xl font-bold text-slate-900">Lịch sử yêu cầu cứu hộ</h1>
                    <p className="text-sm text-slate-500 mt-1">Danh sách các yêu cầu cứu hộ bạn đã gửi trước đây.</p>
                </div>

                <div className="space-y-3">
                    {items.map((req) => {
                        const statusMeta = STATUS_META[req.status] ?? { label: req.status, bg: "bg-slate-100", color: "text-slate-700" };
                        const [lng, lat] = req.location?.coordinates ?? [0, 0];
                        const images = req.images ?? [];
                        const canCancel = CANCELLABLE_STATUSES.includes(req.status);

                        return (
                            <div key={req._id} className="rounded-2xl border border-slate-200 bg-white px-4 py-3 shadow-sm flex gap-3">
                                {/* Thumbnail */}
                                {images[0] ? (
                                    <button onClick={() => setLightbox({ images, index: 0 })} className="w-24 h-24 rounded-xl overflow-hidden border border-slate-200 shrink-0 cursor-zoom-in hover:border-blue-300 hover:scale-105 transition-all">
                                        <img src={imgUrl(images[0])} alt={req.description} className="w-full h-full object-cover" />
                                    </button>
                                ) : (
                                    <div className="w-24 h-24 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 text-xs shrink-0">Không có ảnh</div>
                                )}

                                <div className="flex-1 min-w-0 space-y-1.5">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        <span className="font-mono text-sm font-semibold text-slate-900">{req.requestCode}</span>
                                        <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${statusMeta.bg} ${statusMeta.color}`}>{statusMeta.label}</span>
                                        {req.urgencyLevel && <span className="text-[11px] font-semibold text-red-600 uppercase">{req.urgencyLevel}</span>}
                                        {images.length > 1 && (
                                            <button onClick={() => setLightbox({ images, index: 0 })} className="text-[11px] font-medium text-slate-500 hover:text-blue-600 transition-colors">
                                                +{images.length - 1} ảnh
                                            </button>
                                        )}
                                    </div>

                                    <p className="text-sm text-slate-700 line-clamp-2">{req.description}</p>

                                    <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500">
                                        <span className="inline-flex items-center gap-1"><Clock className="w-3 h-3" /><span>Gửi lúc: {formatDate(req.createdAt)}</span></span>
                                        <span className="inline-flex items-center gap-1"><MapPin className="w-3 h-3" /><span>{lat.toFixed(4)}, {lng.toFixed(4)}</span></span>
                                    </div>

                                    {/* Cancel button */}
                                    {canCancel && (
                                        <div className="pt-1.5">
                                            <button
                                                onClick={() => setCancelTarget(req)}
                                                className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 hover:bg-red-100 text-red-600 text-xs font-semibold px-3 py-1.5 transition-colors"
                                            >
                                                <Ban className="w-3.5 h-3.5" />
                                                Hủy yêu cầu
                                            </button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
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
        </div>
    );
}