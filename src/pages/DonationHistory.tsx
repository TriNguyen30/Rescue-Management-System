import React, { useEffect, useState, useMemo } from "react";
import {
    AreaChart,
    Area,
    BarChart,
    Bar,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    ResponsiveContainer,
    Legend,
} from "recharts";
import {
    TrendingUp,
    TrendingDown,
    Banknote,
    Users,
    CheckCircle2,
    XCircle,
    Clock,
    ChevronLeft,
    ChevronRight,
    Filter,
    RefreshCw,
    Download,
    BarChart3,
    Receipt
} from "lucide-react";
import { getDonations, DonationItem, DonationStatus } from "@/services/donation.service";

// ── Helpers ────────────────────────────────────────────────────────────────────
const fmtVND = (n: number) =>
    new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

const fmtDate = (iso: string) =>
    new Date(iso).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit", year: "numeric" });

const fmtTime = (iso: string) =>
    new Date(iso).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit" });

const statusMeta: Record<DonationStatus, { label: string; color: string; icon: React.ReactNode }> = {
    SUCCESS: {
        label: "Thành công",
        color: "bg-emerald-50 text-emerald-700 border-emerald-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
    },
    PENDING: {
        label: "Đang chờ",
        color: "bg-amber-50 text-amber-700 border-amber-200",
        icon: <Clock className="w-3.5 h-3.5" />,
    },
    FAILED: {
        label: "Thất bại",
        color: "bg-red-50 text-red-700 border-red-200",
        icon: <XCircle className="w-3.5 h-3.5" />,
    },
};

// ── Chart data aggregation ─────────────────────────────────────────────────────
function aggregateByDay(items: DonationItem[]) {
    const map: Record<string, { date: string; total: number; success: number; count: number }> = {};
    items.forEach((d) => {
        const key = d.createdAt.slice(0, 10);
        if (!map[key]) map[key] = { date: key, total: 0, success: 0, count: 0 };
        map[key].count++;
        if (d.status === "SUCCESS") {
            map[key].total += d.amount;
            map[key].success++;
        }
    });
    return Object.values(map)
        .sort((a, b) => a.date.localeCompare(b.date))
        .slice(-30)
        .map((d) => ({
            ...d,
            label: new Date(d.date).toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" }),
        }));
}

function aggregateByMonth(items: DonationItem[]) {
    const map: Record<string, { month: string; total: number; count: number }> = {};
    items.forEach((d) => {
        const key = d.createdAt.slice(0, 7);
        if (!map[key]) map[key] = { month: key, total: 0, count: 0 };
        map[key].count++;
        if (d.status === "SUCCESS") map[key].total += d.amount;
    });
    return Object.values(map)
        .sort((a, b) => a.month.localeCompare(b.month))
        .map((d) => ({
            ...d,
            label: new Date(d.month + "-01").toLocaleDateString("vi-VN", { month: "short", year: "numeric" }),
        }));
}

// ── Custom tooltip ─────────────────────────────────────────────────────────────
function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-white border border-gray-100 rounded-2xl shadow-xl p-3 text-xs min-w-[150px]">
            <p className="font-bold text-gray-700 mb-2">{label}</p>
            {payload.map((p: any) => (
                <div key={p.name} className="flex justify-between gap-4">
                    <span style={{ color: p.color }} className="font-medium">{p.name}</span>
                    <span className="font-bold text-gray-800">
                        {typeof p.value === "number" && p.value > 1000
                            ? fmtVND(p.value)
                            : p.value}
                    </span>
                </div>
            ))}
        </div>
    );
}

// ── Stat card ──────────────────────────────────────────────────────────────────
function StatCard({
    label, value, sub, icon, color, trend,
}: {
    label: string; value: string; sub?: string;
    icon: React.ReactNode; color: string; trend?: "up" | "down" | null;
}) {
    return (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex gap-4 items-start">
            <div className={`w-11 h-11 rounded-xl flex items-center justify-center border shrink-0 ${color}`}>
                {icon}
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-xs text-gray-400 font-medium mb-0.5">{label}</p>
                <p className="text-xl font-bold text-gray-900 truncate">{value}</p>
                {sub && (
                    <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                        {trend === "up" && <TrendingUp className="w-3 h-3 text-emerald-500" />}
                        {trend === "down" && <TrendingDown className="w-3 h-3 text-red-400" />}
                        {sub}
                    </p>
                )}
            </div>
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────────
const PAGE_SIZE_OPTIONS = [10, 20, 50];

export default function DonationHistory() {
    const [allItems, setAllItems] = useState<DonationItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // table state
    const [page, setPage] = useState(1);
    const [limit, setLimit] = useState(10);
    const [statusFilter, setStatusFilter] = useState<DonationStatus | "">("");
    const [totalPages, setTotalPages] = useState(1);
    const [tableItems, setTableItems] = useState<DonationItem[]>([]);
    const [tableLoading, setTableLoading] = useState(false);

    // chart view
    const [chartView, setChartView] = useState<"day" | "month">("day");

    // ── Fetch all items for analytics (paginate with max limit=100) ──
    const fetchAll = async () => {
        setLoading(true);
        setError(null);
        try {
            const collected: DonationItem[] = [];
            let currentPage = 1;
            let pages = 1;
            do {
                const res = await getDonations({ page: currentPage, limit: 100 });
                collected.push(...(res?.data ?? []));
                pages = res?.meta?.totalPages ?? 1;
                currentPage++;
            } while (currentPage <= pages);
            setAllItems(collected);
        } catch (err) {
            console.error("fetchAll error:", err);
            setError("Không thể tải dữ liệu. Vui lòng thử lại.");
        } finally {
            setLoading(false);
        }
    };

    // ── Fetch table page ──
    const fetchTable = async () => {
        setTableLoading(true);
        try {
            const res = await getDonations({
                page,
                limit,
                status: statusFilter || undefined,
            });
            console.log("fetchTable res:", res);
            setTableItems(res?.data ?? []);
            setTotalPages(res?.meta?.totalPages ?? 1);
        } catch (err) {
            console.error("fetchTable error:", err);
            setTableItems([]);
        } finally {
            setTableLoading(false);
        }
    };

    useEffect(() => { fetchAll(); }, []);
    useEffect(() => { fetchTable(); }, [page, limit, statusFilter]);

    // ── Analytics ──
    const stats = useMemo(() => {
        const success = allItems.filter((d) => d.status === "SUCCESS");
        const totalRevenue = success.reduce((s, d) => s + d.amount, 0);

        const today = new Date().toISOString().slice(0, 10);
        const todayItems = success.filter((d) => d.createdAt.startsWith(today));
        const todayRevenue = todayItems.reduce((s, d) => s + d.amount, 0);

        const thisMonth = new Date().toISOString().slice(0, 7);
        const monthItems = success.filter((d) => d.createdAt.startsWith(thisMonth));
        const monthRevenue = monthItems.reduce((s, d) => s + d.amount, 0);

        const successRate = allItems.length
            ? Math.round((success.length / allItems.length) * 100)
            : 0;

        return { totalRevenue, todayRevenue, monthRevenue, successRate, total: allItems.length, successCount: success.length };
    }, [allItems]);

    const dayData = useMemo(() => aggregateByDay(allItems), [allItems]);
    const monthData = useMemo(() => aggregateByMonth(allItems), [allItems]);
    const chartData = chartView === "day" ? dayData : monthData;

    return (
        <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Header ── */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-3">
                        <div className="w-10 h-10 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                            <Receipt className="w-6 h-6" />
                        </div>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Lịch sử quyên góp</h1>
                            <p className="text-sm text-gray-500 mt-0.5">Phân tích và quản lý giao dịch theo ngày & tháng</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={fetchAll}
                            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors shadow-sm"
                        >
                            <RefreshCw className="w-4 h-4" />
                            Làm mới
                        </button>
                        <button className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-blue-200 bg-blue-50 text-sm font-semibold text-blue-700 hover:bg-blue-100 transition-colors shadow-sm">
                            <Download className="w-4 h-4" />
                            Xuất CSV
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="bg-red-50 border border-red-200 text-red-700 text-sm rounded-2xl px-4 py-3 font-medium">
                        {error}
                    </div>
                )}

                {/* ── Stat cards ── */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        label="Tổng thu (thành công)"
                        value={loading ? "—" : fmtVND(stats.totalRevenue)}
                        sub={`${stats.successCount} giao dịch thành công`}
                        icon={<Banknote className="w-5 h-5" />}
                        color="bg-emerald-50 text-emerald-700 border-emerald-100"
                        trend="up"
                    />
                    <StatCard
                        label="Hôm nay"
                        value={loading ? "—" : fmtVND(stats.todayRevenue)}
                        sub="giao dịch thành công hôm nay"
                        icon={<TrendingUp className="w-5 h-5" />}
                        color="bg-blue-50 text-blue-700 border-blue-100"
                    />
                    <StatCard
                        label="Tháng này"
                        value={loading ? "—" : fmtVND(stats.monthRevenue)}
                        sub="tổng doanh thu tháng hiện tại"
                        icon={<BarChart3 className="w-5 h-5" />}
                        color="bg-violet-50 text-violet-700 border-violet-100"
                        trend="up"
                    />
                    <StatCard
                        label="Tỷ lệ thành công"
                        value={loading ? "—" : `${stats.successRate}%`}
                        sub={`${stats.total} giao dịch tổng cộng`}
                        icon={<Users className="w-5 h-5" />}
                        color="bg-amber-50 text-amber-700 border-amber-100"
                    />
                </div>

                {/* ── Charts ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                        <h2 className="text-base font-bold text-gray-800">
                            Biểu đồ quyên góp
                        </h2>
                        <div className="flex rounded-xl border border-gray-200 overflow-hidden text-xs font-semibold">
                            {(["day", "month"] as const).map((v) => (
                                <button
                                    key={v}
                                    onClick={() => setChartView(v)}
                                    className={`px-4 py-1.5 transition-colors ${chartView === v ? "bg-blue-600 text-white" : "bg-white text-gray-500 hover:bg-gray-50"}`}
                                >
                                    {v === "day" ? "Theo ngày" : "Theo tháng"}
                                </button>
                            ))}
                        </div>
                    </div>

                    {loading ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Đang tải dữ liệu...</div>
                    ) : chartData.length === 0 ? (
                        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">Không có dữ liệu</div>
                    ) : (
                        <div className="grid lg:grid-cols-2 gap-6">
                            {/* Area chart — revenue */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Doanh thu (VNĐ)</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <AreaChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }}>
                                        <defs>
                                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.18} />
                                                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false}
                                            tickFormatter={(v) => v >= 1_000_000 ? `${(v / 1_000_000).toFixed(0)}M` : `${(v / 1000).toFixed(0)}K`} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Area type="monotone" dataKey="total" name="Doanh thu" stroke="#3b82f6" strokeWidth={2.5}
                                            fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: "#3b82f6" }} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>

                            {/* Bar chart — transaction count */}
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Số giao dịch</p>
                                <ResponsiveContainer width="100%" height={220}>
                                    <BarChart data={chartData} margin={{ top: 5, right: 5, left: 0, bottom: 5 }} barSize={chartView === "day" ? 8 : 20}>
                                        <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                                        <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} />
                                        <YAxis tick={{ fontSize: 11, fill: "#9ca3af" }} tickLine={false} axisLine={false} allowDecimals={false} />
                                        <Tooltip content={<CustomTooltip />} />
                                        <Legend wrapperStyle={{ fontSize: 11 }} />
                                        <Bar dataKey="success" name="Thành công" fill="#10b981" radius={[4, 4, 0, 0]} />
                                        <Bar dataKey="count" name="Tổng giao dịch" fill="#e5e7eb" radius={[4, 4, 0, 0]} />
                                    </BarChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                    )}
                </div>

                {/* ── Table ── */}
                <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                    {/* Table toolbar */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 px-5 py-4 border-b border-gray-100">
                        <h2 className="text-base font-bold text-gray-800">Danh sách giao dịch</h2>
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-gray-400 shrink-0" />
                            <select
                                value={statusFilter}
                                onChange={(e) => { setStatusFilter(e.target.value as DonationStatus | ""); setPage(1); }}
                                className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-400"
                            >
                                <option value="">Tất cả trạng thái</option>
                                <option value="SUCCESS">Thành công</option>
                                <option value="PENDING">Đang chờ</option>
                                <option value="FAILED">Thất bại</option>
                            </select>
                            <select
                                value={limit}
                                onChange={(e) => { setLimit(Number(e.target.value)); setPage(1); }}
                                className="text-sm border border-gray-200 rounded-xl px-3 py-1.5 bg-white text-gray-700 font-medium focus:outline-none focus:border-blue-400"
                            >
                                {PAGE_SIZE_OPTIONS.map((s) => (
                                    <option key={s} value={s}>{s} / trang</option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="bg-gray-50 border-b border-gray-100">
                                    {["Mã đơn", "Số tiền", "Lời nhắn", "Trạng thái", "Mã giao dịch VNPay", "Thời gian"].map((h) => (
                                        <th key={h} className="text-left text-xs font-bold text-gray-400 uppercase tracking-wider px-4 py-3 whitespace-nowrap">
                                            {h}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50">
                                {tableLoading ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Đang tải...</td>
                                    </tr>
                                ) : tableItems.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="text-center py-12 text-gray-400 text-sm">Không có giao dịch nào</td>
                                    </tr>
                                ) : (
                                    tableItems.map((item) => {
                                        const s = statusMeta[item.status];
                                        return (
                                            <tr key={item._id} className="hover:bg-gray-50/60 transition-colors">
                                                <td className="px-4 py-3 font-mono text-xs text-gray-500 whitespace-nowrap">
                                                    {item.orderId}
                                                </td>
                                                <td className="px-4 py-3 font-bold text-gray-900 whitespace-nowrap">
                                                    {fmtVND(item.amount)}
                                                </td>
                                                <td className="px-4 py-3 text-gray-500 max-w-[200px] truncate">
                                                    {item.message || <span className="text-gray-300 italic">—</span>}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-bold ${s.color}`}>
                                                        {s.icon}{s.label}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-3 font-mono text-xs text-gray-400 whitespace-nowrap">
                                                    {item.vnp_TransactionNo || <span className="text-gray-300">—</span>}
                                                </td>
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <span className="text-gray-700 font-medium">{fmtDate(item.createdAt)}</span>
                                                    <span className="text-gray-400 ml-1.5 text-xs">{fmtTime(item.createdAt)}</span>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    <div className="flex items-center justify-between px-5 py-4 border-t border-gray-100 bg-gray-50/50">
                        <p className="text-xs text-gray-400 font-medium">
                            Trang <strong className="text-gray-700">{page}</strong> / {totalPages}
                        </p>
                        <div className="flex items-center gap-1">
                            <button
                                disabled={page <= 1}
                                onClick={() => setPage((p) => Math.max(1, p - 1))}
                                className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                const p = Math.max(1, Math.min(page - 2, totalPages - 4)) + i;
                                if (p < 1 || p > totalPages) return null;
                                return (
                                    <button key={p} onClick={() => setPage(p)}
                                        className={`w-8 h-8 rounded-xl border text-xs font-bold transition-colors ${p === page ? "bg-blue-600 text-white border-blue-600" : "border-gray-200 bg-white text-gray-600 hover:bg-gray-50"}`}>
                                        {p}
                                    </button>
                                );
                            })}
                            <button
                                disabled={page >= totalPages}
                                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                                className="w-8 h-8 rounded-xl border border-gray-200 bg-white flex items-center justify-center text-gray-500 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}