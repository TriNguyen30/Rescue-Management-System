import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { AlertCircle, Loader2, RefreshCw, Search, X } from "lucide-react";
import { ManagerLayout } from "@/components/ui/ManagerSidebar";
import Pagination from "@/components/ui/Pagination";
import { PageProvider, usePage } from "@/context/PageContext";
import { getRescueRequests } from "@/services/rescue-request.service";
import type { RescueRequest } from "@/types/rescue-requests";
import { Eye } from "lucide-react";

const STATUS_META: Record<string, { label: string; bg: string; text: string }> = {
    PENDING: { label: "Chờ xử lý", bg: "bg-blue-50 border-blue-100", text: "text-blue-700" },
    IN_PROGRESS: { label: "Đang xử lý", bg: "bg-amber-50 border-amber-100", text: "text-amber-700" },
    DONE: { label: "Hoàn thành", bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700" },
};

const URGENCY_META: Record<string, { label: string; text: string }> = {
    LOW: { label: "Nhẹ", text: "text-emerald-600" },
    MEDIUM: { label: "Trung bình", text: "text-amber-600" },
    HIGH: { label: "Khẩn cấp", text: "text-orange-600" },
    CRITICAL: { label: "Nguy kịch", text: "text-red-600" },
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

export default function RTRequestManagement() {
    return (
        <PageProvider initialPageSize={10}>
            <RTRequestManagementContent />
        </PageProvider>
    );
}

function RTRequestManagementContent() {
    const navigate = useNavigate();
    const { page, pageSize, setPage, setTotalItems } = usePage();
    const [requests, setRequests] = useState<RescueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("ALL");

    const fetchRequests = async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await getRescueRequests();
            setRequests(data || []);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không thể tải danh sách yêu cầu cứu hộ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchRequests();
    }, []);

    const statuses = useMemo(() => {
        const set = new Set<string>();
        requests.forEach((r) => r.status && set.add(r.status));
        return Array.from(set);
    }, [requests]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return requests.filter((r) => {
            const matchQ =
                !q ||
                r.requestCode?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q) ||
                r.userId?.fullName?.toLowerCase().includes(q) ||
                r.userId?.phone?.toLowerCase().includes(q) ||
                r.assignedTeamId?.teamName?.toLowerCase().includes(q);

            const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
            return matchQ && matchStatus;
        });
    }, [requests, search, statusFilter]);

    const paginated = useMemo(() => {
        const start = (page - 1) * pageSize;
        return filtered.slice(start, start + pageSize);
    }, [filtered, page, pageSize]);

    useEffect(() => {
        setTotalItems(filtered.length);
    }, [filtered.length, setTotalItems]);

    useEffect(() => {
        setPage(1);
    }, [search, statusFilter, setPage]);

    return (
        <ManagerLayout>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-5">
                    <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Yêu cầu cứu hộ</h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Theo dõi danh sách yêu cầu cứu hộ và xem chi tiết để điều phối.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={fetchRequests}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Làm mới
                        </button>
                    </div>

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo mã yêu cầu, mô tả, người gửi, SĐT hoặc đội được gán..."
                                className="w-full pl-9 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    aria-label="Xóa tìm kiếm"
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 hidden sm:inline">Trạng thái</span>
                            <select
                                value={statusFilter}
                                onChange={(e) => setStatusFilter(e.target.value)}
                                aria-label="Lọc theo trạng thái"
                                className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer"
                            >
                                <option value="ALL">Tất cả</option>
                                {statuses.map((s) => (
                                    <option key={s} value={s}>
                                        {STATUS_META[s]?.label || s}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-red-700 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-medium">Không thể tải dữ liệu</p>
                                <p className="text-sm mt-1">{error}</p>
                            </div>
                            <button type="button" onClick={fetchRequests} className="text-sm font-semibold underline">
                                Thử lại
                            </button>
                        </div>
                    )}

                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center gap-3 py-20 text-gray-500">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Đang tải danh sách yêu cầu...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-16 text-center text-gray-500">
                                <p className="text-sm">Không có yêu cầu nào phù hợp.</p>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="overflow-x-auto">
                                    <table className="w-full">
                                        <thead>
                                            <tr className="border-b border-gray-100 bg-gray-50/70">
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Mã
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Người gửi
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                                                    Mô tả
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                                                    Trạng thái
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                                                    Đội được gán
                                                </th>
                                                <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                                                    Tạo lúc
                                                </th>
                                                <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">
                                                    Hành động
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-50">
                                            {paginated.map((r) => {
                                                const status = STATUS_META[r.status] || {
                                                    label: r.status,
                                                    bg: "bg-gray-50 border-gray-200",
                                                    text: "text-gray-700",
                                                };
                                                const urgency = r.urgencyLevel ? URGENCY_META[r.urgencyLevel] : null;

                                                return (
                                                    <tr key={r._id} className="hover:bg-blue-50/30 transition-colors">
                                                        <td className="px-4 py-3 text-sm font-mono font-semibold text-gray-900">
                                                            <div className="flex flex-col">
                                                                <span>{r.requestCode}</span>
                                                                {urgency && (
                                                                    <span className={`text-xs font-semibold ${urgency.text}`}>
                                                                        {urgency.label}
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700">
                                                            <div className="flex flex-col">
                                                                <span className="font-medium">{r.userId?.fullName || "—"}</span>
                                                                <span className="text-xs text-gray-400">{r.userId?.phone || ""}</span>
                                                            </div>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
                                                            <span className="line-clamp-2">{r.description}</span>
                                                        </td>
                                                        <td className="px-4 py-3">
                                                            <span
                                                                className={`inline-flex px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status.bg} ${status.text}`}
                                                            >
                                                                {status.label}
                                                            </span>
                                                        </td>
                                                        <td className="px-4 py-3 text-sm text-gray-700 hidden lg:table-cell">
                                                            {r.assignedTeamId?.teamName ? (
                                                                <span className="font-medium">{r.assignedTeamId.teamName}</span>
                                                            ) : (
                                                                <span className="text-gray-300">Chưa gán</span>
                                                            )}
                                                        </td>
                                                        <td className="px-4 py-3 text-xs text-gray-500 hidden sm:table-cell">
                                                            {formatDate(r.createdAt)}
                                                        </td>
                                                        <td className="px-4 py-3 text-right">
                                                            <button
                                                                type="button"
                                                                onClick={() => navigate(`/manager/requests/${r._id}`)}
                                                                aria-label="Xem chi tiết yêu cầu"
                                                                title="Xem chi tiết yêu cầu"
                                                                className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                <div className="px-4 pb-4">
                                    <Pagination />
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </ManagerLayout>
    );
}
