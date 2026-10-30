import { useCallback, useEffect, useMemo, useState } from "react";
import {
    AlertCircle, ChevronDown, Loader2, RefreshCw, Truck,
    Users, ShieldAlert, Wifi, WifiOff, Radio, Crown,
    CheckCircle2, Clock, XCircle,
} from "lucide-react";
import {
    getRescueTeams,
    getRescueTeamsAvailable,
    updateRescueTeamStatus,
} from "@/services/rescue-team.service";
import type { RescueTeam, RescueTeamStatus } from "@/types/rescue-teams";
import { useToast } from "@/components/ui/Toast";

// ── Config ─────────────────────────────────────────────────────────────────────
const STATUS_OPTIONS: RescueTeamStatus[] = ["AVAILABLE", "BUSY", "OFFLINE"];

const STATUS_META: Record<RescueTeamStatus, {
    label: string;
    bg: string; text: string; border: string; dot: string;
    ringColor: string;
    icon: React.ReactNode;
    cardAccent: string;
}> = {
    AVAILABLE: {
        label: "Sẵn sàng",
        bg: "bg-emerald-50", text: "text-emerald-700", border: "border-emerald-200",
        dot: "bg-emerald-500", ringColor: "ring-emerald-200",
        icon: <CheckCircle2 className="w-3.5 h-3.5" />,
        cardAccent: "border-l-emerald-400",
    },
    BUSY: {
        label: "Đang bận",
        bg: "bg-amber-50", text: "text-amber-700", border: "border-amber-200",
        dot: "bg-amber-500", ringColor: "ring-amber-200",
        icon: <Clock className="w-3.5 h-3.5" />,
        cardAccent: "border-l-amber-400",
    },
    OFFLINE: {
        label: "Ngoại tuyến",
        bg: "bg-gray-100", text: "text-gray-500", border: "border-gray-200",
        dot: "bg-gray-400", ringColor: "ring-gray-200",
        icon: <XCircle className="w-3.5 h-3.5" />,
        cardAccent: "border-l-gray-300",
    },
};

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
function getInitials(name?: string) {
    if (!name) return "?";
    const p = name.trim().split(" ");
    return p.length === 1 ? p[0][0].toUpperCase() : (p[0][0] + p[p.length - 1][0]).toUpperCase();
}

function sortTeams(a: RescueTeam, b: RescueTeam): number {
    const order: Record<RescueTeamStatus, number> = { AVAILABLE: 0, BUSY: 1, OFFLINE: 2 };
    return (order[a.status] ?? 2) - (order[b.status] ?? 2) || a.teamName.localeCompare(b.teamName, "vi");
}

// ── Stat Card ──────────────────────────────────────────────────────────────────
function StatCard({
    label, value, sub, icon, color, border,
}: { label: string; value: number; sub?: string; icon: React.ReactNode; color: string; border: string }) {
    return (
        <div className={`relative bg-white rounded-2xl border ${border} shadow-sm p-5 flex items-center gap-4 overflow-hidden`}>
            <div className={`w-11 h-11 rounded-xl ${color} flex items-center justify-center shrink-0`}>
                {icon}
            </div>
            <div className="min-w-0">
                <p className="text-2xl font-black text-gray-900 leading-none">{value}</p>
                <p className="text-xs font-semibold text-gray-500 mt-1 leading-tight">{label}</p>
                {sub && <p className="text-[10px] text-gray-400 mt-0.5">{sub}</p>}
            </div>
        </div>
    );
}

// ── Status Badge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RescueTeamStatus }) {
    const m = STATUS_META[status] ?? STATUS_META.OFFLINE;
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold border ${m.bg} ${m.text} ${m.border}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${m.dot} ${status === "AVAILABLE" ? "animate-pulse" : ""}`} />
            {m.label}
        </span>
    );
}

// ── Status Select ──────────────────────────────────────────────────────────────
function StatusSelect({
    team, isUpdating, onChange,
}: { team: RescueTeam; isUpdating: boolean; onChange: (s: RescueTeamStatus) => void }) {
    const current = STATUS_META[team.status] ?? STATUS_META.OFFLINE;
    return (
        <div className="space-y-1.5">
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Đổi trạng thái</p>
            <div className="relative">
                <select
                    id={`status-${team._id}`}
                    value={team.status}
                    disabled={isUpdating}
                    onChange={(e) => onChange(e.target.value as RescueTeamStatus)}
                    className={`w-full appearance-none rounded-xl border-2 py-2.5 pl-3.5 pr-9 text-sm font-semibold
            focus:outline-none focus:ring-2 transition-all disabled:opacity-60 cursor-pointer
            ${current.border} ${current.text} bg-white focus:ring-2 ${current.ringColor}`}
                >
                    {STATUS_OPTIONS.map((s) => (
                        <option key={s} value={s}>{STATUS_META[s].label}</option>
                    ))}
                </select>
                {isUpdating
                    ? <Loader2 className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />
                    : <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />}
            </div>
        </div>
    );
}

// ── Team Card ──────────────────────────────────────────────────────────────────
function TeamCard({
    team, inDispatchList, isUpdating, onStatusChange,
}: {
    team: RescueTeam;
    inDispatchList: boolean;
    isUpdating: boolean;
    onStatusChange: (s: RescueTeamStatus) => void;
}) {
    const meta = STATUS_META[team.status] ?? STATUS_META.OFFLINE;
    const initials = getInitials(team.teamName);
    const color = avatarColor(team._id);
    const isOffline = team.status === "OFFLINE";

    return (
        <div className={`rt-card bg-white rounded-2xl border-l-4 border border-gray-100 shadow-sm
      hover:shadow-md transition-all duration-200 overflow-hidden
      ${meta.cardAccent} ${isOffline ? "opacity-70" : ""}`}>

            <div className="p-5 flex flex-col sm:flex-row sm:items-start gap-4">

                {/* ── Avatar + name block ── */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    {/* Team avatar */}
                    <div className={`w-12 h-12 rounded-2xl ${color} flex items-center justify-center text-base font-black shrink-0`}>
                        {initials}
                    </div>

                    <div className="flex-1 min-w-0 space-y-2">
                        {/* Name + badges */}
                        <div className="flex flex-wrap items-center gap-2">
                            <h2 className="text-base font-bold text-gray-900 truncate">{team.teamName}</h2>
                            <StatusBadge status={team.status} />
                            {inDispatchList && (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg text-[10px] font-bold bg-blue-50 text-blue-600 border border-blue-200">
                                    <Radio className="w-2.5 h-2.5" />
                                    Có thể điều phối
                                </span>
                            )}
                        </div>

                        {/* Leader */}
                        <div className="flex items-center gap-1.5 text-sm text-gray-600">
                            {/* <Crown className="w-3.5 h-3.5 text-amber-500 shrink-0" /> */}
                            <span className="font-medium">Leader: </span>
                            <span className="font-medium">{team.leaderId?.fullName ?? "—"}</span>
                        </div>

                        {/* Stats row */}
                        <div className="flex flex-wrap gap-4 text-xs text-gray-500">
                            <span className="inline-flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                                    <Users className="w-3 h-3 text-gray-500" />
                                </div>
                                <span><span className="font-bold text-gray-700">{team.members?.length ?? 0}</span> thành viên</span>
                            </span>
                            <span className="inline-flex items-center gap-1.5">
                                <div className="w-5 h-5 rounded-md bg-gray-100 flex items-center justify-center">
                                    <Truck className="w-3 h-3 text-gray-500" />
                                </div>
                                <span><span className="font-bold text-gray-700">{team.vehicles?.length ?? 0}</span> phương tiện</span>
                            </span>
                        </div>
                    </div>
                </div>

                {/* ── Status select ── */}
                <div className="w-full sm:w-44 shrink-0">
                    <StatusSelect team={team} isUpdating={isUpdating} onChange={onStatusChange} />
                </div>
            </div>
        </div>
    );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export default function RescueTeamStatus() {
    const { success: toastSuccess, error: toastError } = useToast();
    const [teams, setTeams] = useState<RescueTeam[]>([]);
    const [availableIds, setAvailableIds] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [availableError, setAvailableError] = useState<string | null>(null);
    const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});

    const load = useCallback(async () => {
        setLoading(true); setError(null); setAvailableError(null);
        try {
            const [allResult, availResult] = await Promise.allSettled([
                getRescueTeams(),
                getRescueTeamsAvailable(),
            ]);
            if (allResult.status === "fulfilled") {
                setTeams([...allResult.value].sort(sortTeams));
            } else {
                setError(allResult.reason instanceof Error ? allResult.reason.message : "Không thể tải danh sách đội cứu hộ");
                setTeams([]);
            }
            if (availResult.status === "fulfilled") {
                setAvailableIds(new Set(availResult.value.map((t) => t._id)));
            } else {
                setAvailableError(availResult.reason instanceof Error ? availResult.reason.message : "Không thể kiểm tra đội sẵn sàng");
                setAvailableIds(new Set());
            }
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { void load(); }, [load]);

    const refreshAvailableList = useCallback(async () => {
        try {
            const avail = await getRescueTeamsAvailable();
            setAvailableIds(new Set(avail.map((t) => t._id)));
            setAvailableError(null);
        } catch (e) {
            setAvailableError(e instanceof Error ? e.message : "Không thể làm mới danh sách đội sẵn sàng");
        }
    }, []);

    const handleStatusChange = async (team: RescueTeam, nextStatus: RescueTeamStatus) => {
        const id = team._id;
        if (team.status === nextStatus) return;
        const prevStatus = team.status;
        setTeams((prev) => [...prev.map((t) => (t._id === id ? { ...t, status: nextStatus } : t))].sort(sortTeams));
        setUpdatingStatus((prev) => ({ ...prev, [id]: true }));
        try {
            const updated = await updateRescueTeamStatus(id, nextStatus);
            setTeams((prev) => [...prev.map((t) => (t._id === id ? { ...t, ...updated } : t))].sort(sortTeams));
            await refreshAvailableList();
            toastSuccess("Đã cập nhật trạng thái đội.");
        } catch (e: unknown) {
            setTeams((prev) => [...prev.map((t) => (t._id === id ? { ...t, status: prevStatus } : t))].sort(sortTeams));
            const msg =
                (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
                (e instanceof Error ? e.message : null) ||
                "Không thể cập nhật trạng thái đội.";
            toastError(msg);
        } finally {
            setUpdatingStatus((prev) => { const { [id]: _, ...rest } = prev; return rest; });
        }
    };

    const counts = useMemo(() => {
        let available = 0, busy = 0, offline = 0;
        for (const t of teams) {
            if (t.status === "AVAILABLE") available++;
            else if (t.status === "BUSY") busy++;
            else offline++;
        }
        return { available, busy, offline };
    }, [teams]);

    return (
        <>
            <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800;900&display=swap');
        .rt-root { font-family: 'Plus Jakarta Sans', sans-serif; }
        @keyframes rt-up { from{opacity:0;transform:translateY(12px)} to{opacity:1;transform:translateY(0)} }
        .rt-card { animation: rt-up 0.25s cubic-bezier(.22,1,.36,1) both; }
        .rt-card:nth-child(1){animation-delay:.04s}
        .rt-card:nth-child(2){animation-delay:.08s}
        .rt-card:nth-child(3){animation-delay:.12s}
        .rt-card:nth-child(4){animation-delay:.16s}
        .rt-card:nth-child(5){animation-delay:.20s}
        .rt-card:nth-child(6){animation-delay:.24s}
        .rt-card:nth-child(7){animation-delay:.28s}
        .rt-card:nth-child(8){animation-delay:.32s}
        .rt-card:nth-child(9){animation-delay:.36s}
        .rt-card:nth-child(10){animation-delay:.40s}
      `}</style>

            <div className="rt-root min-h-screen bg-[#f5f6fa] px-4 py-8">
                <div className="max-w-5xl mx-auto space-y-6">

                    {/* ── Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-11 h-11 rounded-2xl bg-white border border-gray-100 shadow-sm flex items-center justify-center shrink-0">
                                <ShieldAlert className="w-5 h-5 text-blue-500" />
                            </div>
                            <div>
                                <h1 className="text-xl font-extrabold text-gray-900 tracking-tight">Trạng thái đội cứu hộ</h1>
                                <p className="text-xs text-gray-500 mt-0.5">
                                    Cập nhật trạng thái từng đội · Đồng bộ từ máy chủ sau khi lưu
                                </p>
                            </div>
                        </div>
                        <button
                            type="button"
                            onClick={() => void load()}
                            disabled={loading}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-white border border-gray-200 shadow-sm text-sm font-semibold text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-60 transition-all shrink-0 cursor-pointer"
                        >
                            {loading
                                ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                                : <RefreshCw className="w-4 h-4" />}
                            Làm mới
                        </button>
                    </div>

                    {/* ── Errors ── */}
                    {error && (
                        <div className="rounded-2xl border border-red-200 bg-white shadow-sm overflow-hidden">
                            <div className="h-1 bg-gradient-to-r from-red-400 to-rose-500" />
                            <div className="px-5 py-4 flex items-start gap-3">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-bold text-red-700">Không thể tải dữ liệu</p>
                                    <p className="text-xs text-red-600 mt-0.5">{error}</p>
                                </div>
                            </div>
                        </div>
                    )}

                    {availableError && !error && (
                        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 flex items-start gap-3 text-sm text-amber-800">
                            <AlertCircle className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                            <span>Không tải được danh sách điều phối: {availableError}</span>
                        </div>
                    )}

                    {/* ── Loading skeleton ── */}
                    {loading && teams.length === 0 && !error && (
                        <div className="space-y-3">
                            {[...Array(4)].map((_, i) => (
                                <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                                    <div className="flex items-start gap-3">
                                        <div className="w-12 h-12 rounded-2xl bg-gray-100" />
                                        <div className="flex-1 space-y-2">
                                            <div className="h-4 bg-gray-100 rounded w-40" />
                                            <div className="h-3 bg-gray-100 rounded w-28" />
                                            <div className="h-3 bg-gray-100 rounded w-36" />
                                        </div>
                                        <div className="w-44 h-10 bg-gray-100 rounded-xl" />
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}

                    {!loading && !error && teams.length === 0 && (
                        <div className="rounded-2xl border border-gray-100 bg-white p-16 text-center">
                            <div className="w-14 h-14 rounded-2xl bg-gray-100 flex items-center justify-center mx-auto mb-4">
                                <Users className="w-6 h-6 text-gray-400" />
                            </div>
                            <p className="text-sm font-semibold text-gray-600">Chưa có dữ liệu đội cứu hộ</p>
                        </div>
                    )}

                    {!error && teams.length > 0 && (
                        <>
                            {/* ── Stat Cards ── */}
                            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                <StatCard
                                    label="Sẵn sàng"
                                    value={counts.available}
                                    icon={<Wifi className="w-5 h-5 text-emerald-600" />}
                                    color="bg-emerald-100"
                                    border="border-emerald-200"
                                />
                                <StatCard
                                    label="Sẵn sàng điều phối"
                                    value={availableIds.size}
                                    sub="API /rescue-teams/available"
                                    icon={<Radio className="w-5 h-5 text-blue-600" />}
                                    color="bg-blue-100"
                                    border="border-blue-200"
                                />
                                <StatCard
                                    label="Đang bận"
                                    value={counts.busy}
                                    icon={<Clock className="w-5 h-5 text-amber-600" />}
                                    color="bg-amber-100"
                                    border="border-amber-200"
                                />
                                <StatCard
                                    label="Ngoại tuyến"
                                    value={counts.offline}
                                    icon={<WifiOff className="w-5 h-5 text-gray-500" />}
                                    color="bg-gray-100"
                                    border="border-gray-200"
                                />
                            </div>

                            {/* ── Section labels + team cards ── */}
                            {(["AVAILABLE", "BUSY", "OFFLINE"] as RescueTeamStatus[]).map((status) => {
                                const group = teams.filter((t) => t.status === status);
                                if (group.length === 0) return null;
                                const m = STATUS_META[status];
                                return (
                                    <section key={status} className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{m.label}</span>
                                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${m.bg} ${m.text}`}>
                                                {group.length}
                                            </span>
                                        </div>
                                        {group.map((team) => (
                                            <TeamCard
                                                key={team._id}
                                                team={team}
                                                inDispatchList={availableIds.has(team._id)}
                                                isUpdating={Boolean(updatingStatus[team._id])}
                                                onStatusChange={(s) => void handleStatusChange(team, s)}
                                            />
                                        ))}
                                    </section>
                                );
                            })}
                        </>
                    )}
                </div>
            </div>
        </>
    );
}