import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import {
    AlertCircle, Phone, User, Calendar, MapPin, RefreshCw, Loader2,
    ChevronRight, Flame, ShieldAlert, Clock, CheckCircle2, Search, X,
    LayoutDashboard, Hourglass, ClipboardList
} from "lucide-react";
import { getRescueRequests } from "@/services/rescue-request.service";
import type { RescueRequest } from "@/types/rescue-requests";

// ── Config ─────────────────────────────────────────────────────────────────────
const STATUS_META: Record<string, {
    label: string; bg: string; text: string; border: string; dot: string; icon: React.ReactNode;
}> = {
    PENDING: { label: "Chờ xử lý", bg: "bg-sky-50", text: "text-sky-700", border: "border-sky-200", dot: "bg-sky-400", icon: <Hourglass className="w-3 h-3" /> },
    IN_PROGRESS: { label: "Đang xử lý", bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200", dot: "bg-amber-500", icon: <Loader2 className="w-3 h-3 animate-spin" /> },
    DONE: { label: "Hoàn thành", bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200", dot: "bg-emerald-500", icon: <CheckCircle2 className="w-3 h-3" /> },
};

const URGENCY_META: Record<string, {
    label: string; text: string; bg: string; border: string; accent: string; icon: React.ReactNode;
}> = {
    LOW: { label: "Nhẹ", text: "text-emerald-700", bg: "bg-emerald-50", border: "border-emerald-200", accent: "border-l-emerald-400", icon: <ShieldAlert className="w-3 h-3" /> },
    MEDIUM: { label: "Trung bình", text: "text-amber-700", bg: "bg-amber-50", border: "border-amber-200", accent: "border-l-amber-400", icon: <ShieldAlert className="w-3 h-3" /> },
    HIGH: { label: "Khẩn cấp", text: "text-orange-700", bg: "bg-orange-50", border: "border-orange-200", accent: "border-l-orange-500", icon: <Flame className="w-3 h-3" /> },
    CRITICAL: { label: "Nguy kịch", text: "text-red-700", bg: "bg-red-50", border: "border-red-200", accent: "border-l-red-500", icon: <Flame className="w-3 h-3" /> },
};

const AVATAR_COLORS = [
    "bg-violet-100 text-violet-700", "bg-blue-100 text-blue-700",
    "bg-emerald-100 text-emerald-700", "bg-rose-100 text-rose-700",
    "bg-amber-100 text-amber-700", "bg-cyan-100 text-cyan-700",
];
function avatarColor(str: string) {
    const h = str.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return AVATAR_COLORS[h % AVATAR_COLORS.length];
}
function getInitials(name?: string) {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit", month: "2-digit", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({ label, value, icon, color, border }: {
    label: string; value: number; icon: React.ReactNode; color: string; border: string;
}) {
    return (
        <div className={`bg-white rounded-2xl border ${border} shadow-sm p-4 flex items-center gap-3`}>
            <div className={`w-10 h-10 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div>
                <p className="text-xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-[11px] font-semibold text-gray-500 mt-0.5">{label}</p>
            </div>
        </div>
    );
}

// ── Request Card ───────────────────────────────────────────────────────────────
function RequestCard({ req, onClick }: { req: RescueRequest; onClick: () => void }) {
    const [lng, lat] = req.location?.coordinates ?? [0, 0];
    const statusMeta = STATUS_META[req.status] ?? { label: req.status, bg: "bg-gray-50", text: "text-gray-700", border: "border-gray-200", dot: "bg-gray-400", icon: null };
    const urgencyMeta = req.urgencyLevel ? URGENCY_META[req.urgencyLevel] : null;
    const initials = getInitials(req.userId?.fullName);
    const color = avatarColor(req.userId?.fullName || req._id);
    const isPending = req.status === "PENDING";

    return (
        <div
            role="button"
            tabIndex={0}
            onClick={onClick}
            onKeyDown={(e) => e.key === "Enter" && onClick()}
            className={`cd-card group relative bg-white rounded-2xl border border-l-4 shadow-sm
        hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 cursor-pointer overflow-hidden
        ${urgencyMeta ? urgencyMeta.accent : "border-l-gray-200"}`}
        >
            <div className="p-5 flex gap-4">
                {/* Avatar */}
                <div className="shrink-0 mt-0.5">
                    <div className={`w-11 h-11 rounded-2xl ${color} flex items-center justify-center text-sm font-black`}>
                        {initials}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 min-w-0 space-y-2.5">
                    {/* Row 1 — code + badges */}
                    <div className="flex flex-wrap items-center gap-2">
                        <span className="font-mono text-sm font-bold text-gray-900">{req.requestCode}</span>

                        {/* Status */}
                        <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg text-[11px] font-bold border ${statusMeta.bg} ${statusMeta.text} ${statusMeta.border}`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${statusMeta.dot}`} />
                            {statusMeta.label}
                        </span>

                        {/* Urgency — hide for PENDING */}
                        {!isPending && urgencyMeta && (
                            <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold border ${urgencyMeta.bg} ${urgencyMeta.text} ${urgencyMeta.border}`}>
                                {urgencyMeta.icon}
                                {urgencyMeta.label}
                            </span>
                        )}
                    </div>

                    {/* Description */}
                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-2">{req.description}</p>

                    {/* Meta row */}
                    <div className="flex flex-wrap gap-x-5 gap-y-1.5 text-xs text-gray-500">
                        <span className="inline-flex items-center gap-1.5">
                            <User className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            <span className="font-medium text-gray-700">{req.userId?.fullName ?? "—"}</span>
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            {req.userId?.phone ?? "—"}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <MapPin className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            {lat.toFixed(4)}, {lng.toFixed(4)}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                            <Calendar className="w-3.5 h-3.5 shrink-0 text-gray-400" />
                            {formatDate(req.createdAt)}
                        </span>
                    </div>

                    {/* Images */}
                    {req.images?.length ? (
                        <div className="flex items-center gap-2">
                            {req.images.slice(0, 4).map((img, i) => (
                                <img key={i}
                                    src={img.startsWith("/") ? `${import.meta.env.VITE_API_BASE_URL || ""}${img}` : img}
                                    alt=""
                                    className="w-14 h-14 object-cover rounded-xl border border-gray-100 shadow-sm"
                                />
                            ))}
                            {req.images.length > 4 && (
                                <div className="w-14 h-14 rounded-xl border border-gray-100 bg-gray-50 flex items-center justify-center text-xs font-bold text-gray-400">
                                    +{req.images.length - 4}
                                </div>
                            )}
                        </div>
                    ) : null}
                </div>

                {/* Chevron */}
                <div className="shrink-0 flex items-center">
                    <div className="w-8 h-8 rounded-xl bg-gray-100 group-hover:bg-blue-100 flex items-center justify-center transition-colors">
                        <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-blue-500 transition-colors" />
                    </div>
                </div>
            </div>

            {/* Critical pulse bar */}
            {req.urgencyLevel === "CRITICAL" && (
                <div className="h-0.5 w-full bg-gradient-to-r from-red-400 to-rose-500 animate-pulse" />
            )}
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function CoordinatorDashboard() {
    const navigate = useNavigate();
    const [requests, setRequests] = useState<RescueRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [statusFilter, setStatusFilter] = useState("ALL");

    const fetchRequests = async () => {
        setLoading(true); setError(null);
        try {
            const data = await getRescueRequests();
            setRequests(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không thể tải danh sách yêu cầu cứu hộ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchRequests(); }, []);

    const counts = useMemo(() => ({
        total: requests.length,
        pending: requests.filter(r => r.status === "PENDING").length,
        inProgress: requests.filter(r => r.status === "IN_PROGRESS").length,
        done: requests.filter(r => r.status === "DONE").length,
    }), [requests]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return requests.filter(r => {
            const matchQ = !q ||
                r.requestCode?.toLowerCase().includes(q) ||
                r.description?.toLowerCase().includes(q) ||
                r.userId?.fullName?.toLowerCase().includes(q) ||
                r.userId?.phone?.includes(q);
            const matchStatus = statusFilter === "ALL" || r.status === statusFilter;
            return matchQ && matchStatus;
        });
    }, [requests, search, statusFilter]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .cd-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes cd-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .cd-card { animation: cd-up 0.25s cubic-bezier(.22,1,.36,1) both; }
        .cd-card:nth-child(1){animation-delay:.04s}.cd-card:nth-child(2){animation-delay:.08s}
        .cd-card:nth-child(3){animation-delay:.12s}.cd-card:nth-child(4){animation-delay:.16s}
        .cd-card:nth-child(5){animation-delay:.20s}.cd-card:nth-child(6){animation-delay:.24s}
        .cd-card:nth-child(7){animation-delay:.28s}.cd-card:nth-child(8){animation-delay:.32s}
        .cd-card:nth-child(9){animation-delay:.36s}.cd-card:nth-child(10){animation-delay:.40s}
      `}</style>

            <div className="cd-root min-h-screen bg-[#f5f6fa] px-4 py-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* ── Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                <ClipboardList className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Danh sách yêu cầu cứu hộ</h1>
                                <p className="text-xs text-gray-500 mt-0.5">Điều phối và theo dõi các yêu cầu cứu hộ</p>
                            </div>
                        </div>
                        <button
                            onClick={fetchRequests}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 transition-all shrink-0 cursor-pointer"
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                : <RefreshCw className="w-4 h-4" />}
                            Làm mới
                        </button>
                    </div>

                    {/* ── Error ── */}
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
                            <div className="px-5 py-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-red-700">Không thể tải dữ liệu</p>
                                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                                </div>
                                <button onClick={fetchRequests} className="text-xs font-bold text-red-600 underline shrink-0">Thử lại</button>
                            </div>
                        </div>
                    )}

                    {/* ── Stat cards ── */}
                    {!loading && !error && requests.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                            <StatCard label="Tổng yêu cầu" value={counts.total} icon={<LayoutDashboard className="w-5 h-5 text-gray-500" />} color="bg-gray-100" border="border-gray-200" />
                            <StatCard label="Chờ xử lý" value={counts.pending} icon={<Hourglass className="w-5 h-5 text-sky-500" />} color="bg-sky-100" border="border-sky-200" />
                            <StatCard label="Đang xử lý" value={counts.inProgress} icon={<Flame className="w-5 h-5 text-amber-500" />} color="bg-amber-100" border="border-amber-200" />
                            <StatCard label="Hoàn thành" value={counts.done} icon={<CheckCircle2 className="w-5 h-5 text-emerald-500" />} color="bg-emerald-100" border="border-emerald-200" />
                        </div>
                    )}

                    {/* ── Filters ── */}
                    {!loading && requests.length > 0 && (
                        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-3 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                            <div className="relative flex-1">
                                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
                                <input
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    placeholder="Tìm theo mã, mô tả, tên hoặc SĐT..."
                                    className="w-full pl-10 pr-9 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-400 outline-none bg-gray-50 focus:bg-white transition placeholder:text-gray-400"
                                />
                                {search && (
                                    <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors">
                                        <X className="w-4 h-4" />
                                    </button>
                                )}
                            </div>
                            <div className="flex rounded-xl overflow-hidden border border-gray-200 text-xs font-bold shrink-0">
                                {(["ALL", "PENDING", "IN_PROGRESS", "DONE"] as const).map((s) => (
                                    <button key={s} onClick={() => setStatusFilter(s)}
                                        className={`px-3 py-2.5 transition-colors whitespace-nowrap cursor-pointer
                      ${statusFilter === s ? "bg-blue-500 text-white" : "text-gray-500 hover:bg-gray-50 hover:text-gray-700"}`}>
                                        {s === "ALL" ? "Tất cả" : STATUS_META[s]?.label ?? s}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* ── Content ── */}
                    {loading && requests.length === 0 ? (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                    <div className="flex gap-4">
                                        <div className="w-11 h-11 rounded-2xl bg-gray-100 shrink-0" />
                                        <div className="flex-1 space-y-2.5">
                                            <div className="flex gap-2">
                                                <div className="h-4 bg-gray-100 rounded w-28" />
                                                <div className="h-4 bg-gray-100 rounded w-20" />
                                            </div>
                                            <div className="h-3 bg-gray-100 rounded w-3/4" />
                                            <div className="h-3 bg-gray-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : requests.length === 0 ? (
                        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <LayoutDashboard className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">Chưa có yêu cầu cứu hộ nào</p>
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="rounded-2xl border border-gray-100 bg-white p-12 text-center">
                            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
                            <p className="text-sm font-semibold text-gray-500">Không có kết quả phù hợp</p>
                            <p className="text-xs text-gray-400 mt-1">Thử điều chỉnh bộ lọc hoặc từ khoá tìm kiếm</p>
                        </div>
                    ) : (
                        <div className="space-y-3">
                            <p className="text-xs text-gray-400 font-medium px-1">
                                Hiển thị <span className="font-bold text-gray-600">{filtered.length}</span> / <span className="font-bold text-gray-600">{requests.length}</span> yêu cầu
                            </p>
                            {filtered.map((req) => (
                                <RequestCard
                                    key={req._id}
                                    req={req}
                                    onClick={() => navigate(`/coordinator/requests/${req._id}`)}
                                />
                            ))}
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}