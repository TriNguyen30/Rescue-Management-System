import { useState, useEffect } from "react";
import { AlertCircle, Phone, User, Calendar, MapPin, RefreshCw, Loader2 } from "lucide-react";
import { getRescueRequests } from "@/services/rescue-coordinator.service";
import type { RescueRequest } from "@/types/rescue-requests";

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

function StatusBadge({ status }: { status: string }) {
    const meta = STATUS_META[status] ?? { label: status, bg: "bg-gray-50", color: "text-gray-700" };
    return (
        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${meta.bg} ${meta.color}`}>
            {meta.label}
        </span>
    );
}

function UrgencyBadge({ level }: { level?: string }) {
    if (!level) return null;
    const meta = URGENCY_META[level] ?? { label: level, color: "text-gray-600" };
    return <span className={`text-xs font-medium ${meta.color}`}>{meta.label}</span>;
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function CoordinatorDashboard() {
    const [requests, setRequests] = useState<RescueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRescueRequests();
            setRequests(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không thể tải danh sách yêu cầu cứu hộ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-6xl mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Danh sách yêu cầu cứu hộ</h1>
                        <p className="text-sm text-gray-500 mt-1">Điều phối và theo dõi các yêu cầu cứu hộ</p>
                    </div>
                    <button
                        onClick={fetchRequests}
                        disabled={loading}
                        className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-50 transition-colors"
                    >
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                        Làm mới
                    </button>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                        <button onClick={fetchRequests} className="ml-auto text-sm font-medium underline">
                            Thử lại
                        </button>
                    </div>
                )}

                {loading && requests.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-gray-500">
                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                        <p>Đang tải danh sách...</p>
                    </div>
                ) : requests.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
                        <p>Chưa có yêu cầu cứu hộ nào</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {requests.map((req) => {
                            const [lng, lat] = req.location?.coordinates ?? [0, 0];
                            return (
                                <div
                                    key={req._id}
                                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow"
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1 space-y-3">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-semibold text-gray-900">{req.requestCode}</span>
                                                <StatusBadge status={req.status} />
                                                <UrgencyBadge level={req.urgencyLevel} />
                                            </div>
                                            <p className="text-gray-700">{req.description}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <User className="w-4 h-4" />
                                                    {req.userId?.fullName ?? "—"}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Phone className="w-4 h-4" />
                                                    {req.userId?.phone ?? "—"}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    {lat.toFixed(4)}, {lng.toFixed(4)}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(req.createdAt)}
                                                </span>
                                            </div>
                                            {req.images?.length ? (
                                                <div className="flex gap-2 flex-wrap">
                                                    {req.images.slice(0, 3).map((img, i) => (
                                                        <img
                                                            key={i}
                                                            src={img.startsWith("/") ? `${import.meta.env.VITE_API_BASE_URL || ""}${img}` : img}
                                                            alt=""
                                                            className="w-16 h-16 object-cover rounded-lg border border-gray-200"
                                                        />
                                                    ))}
                                                    {req.images.length > 3 && (
                                                        <span className="text-xs text-gray-400 self-center">+{req.images.length - 3}</span>
                                                    )}
                                                </div>
                                            ) : null}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}
