import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle, Loader2, RefreshCw, Search, X, Eye,
    ShieldAlert, Clock, CheckCircle2, Flame, AlertTriangle,
    ChevronRight, SlidersHorizontal, Users, Bell
} from "lucide-react";
import Pagination from "@/components/ui/Pagination";
import { PageProvider, usePage } from "@/context/PageContext";
import { getRescueRequests } from "@/services/rescue-request.service";
import type { RescueRequest } from "@/types/rescue-requests";

// ── Status config ──────────────────────────────────────────────────────────────
const STATUS_META: Record<string, {
    label: string;
    bg: string;
    text: string;
    border: string;
    dot: string;
    icon: React.ReactNode;
}> = {
    PENDING: {
        label: "Chờ xử lý",
        bg: "bg-blue-50",
        text: "text-blue-700",
        border: "border-blue-200",
        dot: "bg-blue-500",
        icon: <Clock className="w-3 h-3" />,
    },
    IN_PROGRESS: {
        label: "Đang xử lý",
        bg: "bg-amber-50",
        text: "text-amber-700",
        border: "border-amber-200",
        dot: "bg-amber-500",
        icon: <Loader2 className="w-3 h-3 animate-spin" />,
    },
    DONE: {
        label: "Hoàn thành",
        bg: "bg-emerald-50",
        text: "text-emerald-700",
        border: "border-emerald-200",
        dot: "bg-emerald-500",
        icon: <CheckCircle2 className="w-3 h-3" />,
    },
};

// ── Urgency config ─────────────────────────────────────────────────────────────
const URGENCY_META: Record<string, {
    label: string;
    text: string;
    bg: string;
    border: string;
    icon: React.ReactNode;
}> = {
    LOW: { label: "Nhẹ", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", icon: <ShieldAlert className="w-3 h-3" /> },
    MEDIUM: { label: "Trung bình", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", icon: <AlertTriangle className="w-3 h-3" /> },
    HIGH: { label: "Khẩn cấp", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", icon: <Flame className="w-3 h-3" /> },
    CRITICAL: { label: "Nguy kịch", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", icon: <Flame className="w-3 h-3" /> },
};

// ── Helpers ────────────────────────────────────────────────────────────────────
function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function getInitials(name?: string) {
    if (!name) return "?";
    const parts = name.trim().split(" ");
    return parts.length === 1
        ? parts[0][0].toUpperCase()
        : (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
    "bg-violet-100 text-violet-700",
    "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700",
    "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700",
    "bg-cyan-100 text-cyan-700",
    "bg-pink-100 text-pink-700",
    "bg-indigo-100 text-indigo-700",
];

function avatarColor(str: string) {
    const h = str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
    label, value, icon, color,
}: { label: string; value: number; icon: React.ReactNode; color: string }) {
    return (
        <div className={`relative overflow-hidden rounded-2xl border ${color} bg-white p-5 flex items-center gap-4 shadow-sm`}>
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${color.replace("border-", "bg-").replace("-200", "-100")}`}>
                {icon}
            </div>
            <div>
                <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-1">{label}</p>
            </div>
        </div>
    );
}

// ── Main export ────────────────────────────────────────────────────────────────
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

    useEffect(() => { fetchRequests(); }, []);

    const statuses = useMemo(() => {
        const set = new Set<string>();
        requests.forEach((r) => r.status && set.add(r.status));
        return Array.from(set);
    }, [requests]);

    const stats = useMemo(() => ({
        total: requests.length,
        pending: requests.filter((r) => r.status === "PENDING").length,
        inProgress: requests.filter((r) => r.status === "IN_PROGRESS").length,
        done: requests.filter((r) => r.status === "DONE").length,
    }), [requests]);

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

    useEffect(() => { setTotalItems(filtered.length); }, [filtered.length, setTotalItems]);
    useEffect(() => { setPage(1); }, [search, statusFilter, setPage]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap');
        .rr-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes rr-fade { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        .rr-row { animation: rr-fade 0.2s ease both; }
        .rr-row:nth-child(1)  { animation-delay: 0.03s }
        .rr-row:nth-child(2)  { animation-delay: 0.06s }
        .rr-row:nth-child(3)  { animation-delay: 0.09s }
        .rr-row:nth-child(4)  { animation-delay: 0.12s }
        .rr-row:nth-child(5)  { animation-delay: 0.15s }
        .rr-row:nth-child(6)  { animation-delay: 0.18s }
        .rr-row:nth-child(7)  { animation-delay: 0.21s }
        .rr-row:nth-child(8)  { animation-delay: 0.24s }
        .rr-row:nth-child(9)  { animation-delay: 0.27s }
        .rr-row:nth-child(10) { animation-delay: 0.30s }
        .rr-card-hover { transition: box-shadow 0.18s, transform 0.18s; }
        .rr-card-hover:hover { box-shadow: 0 4px 24px 0 rgba(59,130,246,0.10); transform: translateY(-1px); }
      `}</style>

            <div className="rr-root min-h-screen bg-[#f5f6fa] p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">

                    {/* ── Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            {/* Icon */}
                            <div className="w-10 h-10 rounded-xl bg-red-100 flex items-center justify-center">
                                <Bell className="w-5 h-5 text-red-600" />
                            </div>

                            {/* Text */}
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">
                                    Yêu cầu cứu hộ
                                </h1>
                                <p className="text-sm text-gray-500">
                                    Theo dõi & điều phối toàn bộ yêu cầu cứu hộ trong hệ thống
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={fetchRequests}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 transition-all shadow-sm cursor-pointer shrink-0"
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                : <RefreshCw className="w-4 h-4" />}
                            Làm mới
                        </button>
                    </div>

                    {/* ── Stat Cards ── */}
                    {!loading && !error && (
                        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                            <StatCard label="Tổng yêu cầu" value={stats.total} icon={<Users className="w-5 h-5 text-gray-500" />} color="border-gray-200" />
                            <StatCard label="Chờ xử lý" value={stats.pending} icon={<Clock className="w-5 h-5 text-blue-500" />} color="border-blue-200" />
                            <StatCard label="Đang xử lý" value={stats.inProgress} icon={<Flame className="w-5 h-5 text-amber-500" />} color="border-amber-200" />
                            <StatCard label="Hoàn thành" value={stats.done} icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} color="border-emerald-200" />
                        </div>
                    )}

                    {/* ── Filters ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                            <input
                                value={search}
                                onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo mã, mô tả, người gửi, SĐT hoặc đội cứu hộ..."
                                className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none bg-gray-50 focus:bg-white transition placeholder:text-gray-400"
                            />
                            {search && (
                                <button
                                    type="button"
                                    onClick={() => setSearch("")}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                >
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                            <SlidersHorizontal className="w-4 h-4 text-gray-400 hidden sm:block" />
                            <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-bold">
                                {(["ALL", ...Object.keys(STATUS_META)] as string[]).map((s) => (
                                    <button
                                        key={s}
                                        onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-2.5 transition-colors whitespace-nowrap cursor-pointer
                      ${statusFilter === s
                                                ? "bg-gray-900 text-white"
                                                : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}
                                    >
                                        {s === "ALL" ? "Tất cả" : STATUS_META[s]?.label || s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* ── Error ── */}
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 flex items-start gap-3">
                            <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 shrink-0" />
                            <div className="flex-1">
                                <p className="font-semibold text-red-700 text-sm">Không thể tải dữ liệu</p>
                                <p className="text-xs text-red-600 mt-0.5">{error}</p>
                            </div>
                            <button type="button" onClick={fetchRequests} className="text-xs font-bold text-red-600 underline shrink-0">
                                Thử lại
                            </button>
                        </div>
                    )}

                    {/* ── Table card ── */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-400">
                                <Loader2 className="w-7 h-7 animate-spin text-blue-400" />
                                <span className="text-sm font-medium">Đang tải danh sách...</span>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="py-20 text-center">
                                <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                    <Search className="w-6 h-6 text-gray-400" />
                                </div>
                                <p className="text-sm font-semibold text-gray-600">Không có yêu cầu phù hợp</p>
                                <p className="text-xs text-gray-400 mt-1">Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm</p>
                            </div>
                        ) : (
                            <>
                                {/* ── Table header ── */}
                                <div className="hidden md:grid grid-cols-[140px_1fr_1fr_130px_150px_160px_56px] gap-x-3 px-5 py-3 border-b border-gray-100 bg-gray-50/80">
                                    {["Mã / Mức độ", "Người gửi", "Mô tả", "Trạng thái", "Đội được gán", "Tạo lúc", ""].map((h) => (
                                        <span key={h} className="text-[11px] font-bold text-gray-400 uppercase tracking-wider">{h}</span>
                                    ))}
                                </div>

                                {/* ── Rows ── */}
                                <div className="divide-y divide-gray-50">
                                    {paginated.map((r) => {
                                        const status = STATUS_META[r.status] || {
                                            label: r.status, bg: "bg-gray-50", text: "text-gray-600",
                                            border: "border-gray-200", dot: "bg-gray-400", icon: null,
                                        };
                                        const urgency = r.urgencyLevel ? URGENCY_META[r.urgencyLevel] : null;
                                        const initials = getInitials(r.userId?.fullName);
                                        const color = avatarColor(r.userId?.fullName || r._id);

                                        return (
                                            <div
                                                key={r._id}
                                                className="rr-row rr-card-hover hidden md:grid grid-cols-[140px_1fr_1fr_130px_150px_160px_56px] gap-x-3 px-5 py-4 items-center group"
                                            >
                                                {/* Code + urgency */}
                                                <div className="flex flex-col gap-1 min-w-0">
                                                    <span className="text-sm font-bold text-gray-900 font-mono truncate">{r.requestCode}</span>
                                                    {urgency && (
                                                        <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border w-fit ${urgency.bg} ${urgency.text} ${urgency.border}`}>
                                                            {urgency.icon}{urgency.label}
                                                        </span>
                                                    )}
                                                </div>

                                                {/* Sender */}
                                                <div className="flex items-center gap-2.5 min-w-0">
                                                    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-xs font-black shrink-0`}>
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold text-gray-800 truncate">{r.userId?.fullName || "—"}</p>
                                                        <p className="text-[11px] text-gray-400 truncate">{r.userId?.phone || ""}</p>
                                                    </div>
                                                </div>

                                                {/* Description */}
                                                <p className="text-sm text-gray-600 line-clamp-2 pr-2">{r.description || "—"}</p>

                                                {/* Status badge */}
                                                <div>
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${status.bg} ${status.text} ${status.border}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${status.dot}`} />
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {/* Assigned team */}
                                                <div className="min-w-0">
                                                    {r.assignedTeamId?.teamName ? (
                                                        <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-gray-700 truncate">
                                                            <Users className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                                                            {r.assignedTeamId.teamName}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-300 italic">Chưa gán</span>
                                                    )}
                                                </div>

                                                {/* Date */}
                                                <p className="text-xs text-gray-400 tabular-nums">{formatDate(r.createdAt)}</p>

                                                {/* Action */}
                                                <div className="flex justify-end">
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/manager/requests/${r._id}`)}
                                                        className="w-8 h-8 rounded-xl bg-gray-100 hover:bg-blue-100 flex items-center justify-center text-gray-400 hover:text-blue-600 transition-all group-hover:bg-blue-50 cursor-pointer"
                                                        title="Xem chi tiết"
                                                    >
                                                        <ChevronRight className="w-4 h-4" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}

                                    {/* ── Mobile cards ── */}
                                    {paginated.map((r) => {
                                        const status = STATUS_META[r.status] || {
                                            label: r.status, bg: "bg-gray-50", text: "text-gray-600",
                                            border: "border-gray-200", dot: "bg-gray-400", icon: null,
                                        };
                                        const urgency = r.urgencyLevel ? URGENCY_META[r.urgencyLevel] : null;
                                        const initials = getInitials(r.userId?.fullName);
                                        const color = avatarColor(r.userId?.fullName || r._id);

                                        return (
                                            <div
                                                key={`mob-${r._id}`}
                                                className="rr-row md:hidden p-4 flex flex-col gap-3"
                                            >
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-9 h-9 rounded-full ${color} flex items-center justify-center text-xs font-black shrink-0`}>
                                                            {initials}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-gray-900">{r.userId?.fullName || "—"}</p>
                                                            <p className="text-[11px] text-gray-400 font-mono">{r.requestCode}</p>
                                                        </div>
                                                    </div>
                                                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${status.bg} ${status.text} ${status.border} shrink-0`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
                                                        {status.label}
                                                    </span>
                                                </div>

                                                {r.description && (
                                                    <p className="text-xs text-gray-500 line-clamp-2">{r.description}</p>
                                                )}

                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        {urgency && (
                                                            <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${urgency.bg} ${urgency.text} ${urgency.border}`}>
                                                                {urgency.icon}{urgency.label}
                                                            </span>
                                                        )}
                                                        <span className="text-[11px] text-gray-400">{formatDate(r.createdAt)}</span>
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => navigate(`/manager/requests/${r._id}`)}
                                                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
                                                    >
                                                        Chi tiết <ChevronRight className="w-3.5 h-3.5" />
                                                    </button>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {/* ── Pagination ── */}
                                <div className="px-5 py-4 border-t border-gray-100 flex items-center justify-between gap-4">
                                    <p className="text-xs text-gray-400 font-medium">
                                        Hiển thị <span className="font-bold text-gray-600">{paginated.length}</span> / <span className="font-bold text-gray-600">{filtered.length}</span> yêu cầu
                                    </p>
                                    <Pagination />
                                </div>
                            </>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}