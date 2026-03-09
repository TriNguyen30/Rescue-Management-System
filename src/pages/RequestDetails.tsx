import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, User, Calendar, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { getRescueRequestById } from "@/services/rescue-coordinator.service";
import type { RescueRequest } from "@/types/rescue-requests";
import { API_BASE_URL } from "@/config/env";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    PENDING: { label: "Chờ xử lý", bg: "bg-blue-50", color: "text-blue-700" },
    IN_PROGRESS: { label: "Đang xử lý", bg: "bg-amber-50", color: "text-amber-700" },
    DONE: { label: "Hoàn thành", bg: "bg-green-50", color: "text-green-700" },
};

const URGENCY_META: Record<string, { label: string; color: string }> = {
    LOW: { label: "Nhẹ", color: "text-green-600" },
    MEDIUM: { label: "Trung bình", color: "text-amber-600" },
    HIGH: { label: "Khẩn cấp", color: "text-orange-600" },
    CRITICAL: { label: "Nguy kịch", color: "text-red-600" },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function imgUrl(path: string) {
    return path.startsWith("/") ? `${API_BASE_URL || ""}${path}` : path;
}

export default function RequestDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [request, setRequest] = useState<RescueRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState<string | null>(null);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        getRescueRequestById(id)
            .then(setRequest)
            .catch((e) => setError(e instanceof Error ? e.message : "Không thể tải thông tin yêu cầu"))
            .finally(() => setLoading(false));
    }, [id]);

    // Đóng lightbox khi nhấn Escape
    useEffect(() => {
        if (!lightbox) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightbox(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightbox]);

    if (!id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Thiếu ID yêu cầu</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p>Đang tải...</p>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="rounded-xl bg-red-50 border border-red-200 p-6 flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        <span>{error ?? "Không tìm thấy yêu cầu"}</span>
                    </div>
                    <button
                        onClick={() => navigate("/coordinator")}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const statusMeta = STATUS_META[request.status] ?? { label: request.status, bg: "bg-gray-50", color: "text-gray-700" };
    const urgencyMeta = request.urgencyLevel ? (URGENCY_META[request.urgencyLevel] ?? { label: request.urgencyLevel, color: "text-gray-600" }) : null;
    const [lng, lat] = request.location?.coordinates ?? [0, 0];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigate("/coordinator")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-mono text-lg font-semibold text-gray-900">{request.requestCode}</span>
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.color}`}>
                                {statusMeta.label}
                            </span>
                            {urgencyMeta && (
                                <span className={`text-sm font-medium ${urgencyMeta.color}`}>{urgencyMeta.label}</span>
                            )}
                        </div>
                        <p className="text-gray-600">{request.description}</p>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Người gửi</p>
                            <div className="flex flex-col gap-2 text-gray-800">
                                <span className="inline-flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {request.userId?.fullName ?? "—"}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <a href={`tel:${request.userId?.phone}`} className="hover:text-blue-600">
                                        {request.userId?.phone ?? "—"}
                                    </a>
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vị trí</p>
                            <span className="inline-flex items-center gap-2 text-gray-800">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {lat.toFixed(6)}, {lng.toFixed(6)}
                            </span>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Thời gian</p>
                            <div className="flex flex-col gap-1 text-gray-800 text-sm">
                                <span className="inline-flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Tạo: {formatDate(request.createdAt)}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Cập nhật: {formatDate(request.updatedAt)}
                                </span>
                            </div>
                        </div>

                        {request.assignedTeamId && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Đội được phân công</p>
                                <p className="text-gray-800">{request.assignedTeamId}</p>
                            </div>
                        )}

                        {request.images?.length ? (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ảnh hiện trường</p>
                                <div className="flex flex-wrap gap-3">
                                    {request.images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setLightbox(imgUrl(img))}
                                            className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 hover:scale-105 transition-all cursor-zoom-in"
                                        >
                                            <img src={imgUrl(img)} alt="" className="w-32 h-32 object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative max-w-3xl max-h-[90vh] mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightbox}
                            alt="Ảnh hiện trường"
                            className="rounded-xl max-h-[85vh] max-w-full object-contain shadow-2xl"
                        />
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-bold"
                            aria-label="Đóng"
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}