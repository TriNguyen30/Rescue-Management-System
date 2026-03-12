import { useState, useEffect } from "react";
import { AlertCircle, Calendar, Loader2, MapPin, RefreshCw, Users } from "lucide-react";
import { getAssignedTasks } from "@/services/rescue-request.service";
import type { RescueRequest } from "@/types/rescue-requests";
import { getRescueTeams } from "@/services/rescue-team.service";
import type { RescueTeam } from "@/types/rescue-teams";
import { useNavigate } from "react-router-dom";
import Modal from "@/components/ui/Modal";

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

export default function RescueTeamDashboard() {
    const navigate = useNavigate();
    const [teamId, setTeamId] = useState("");
    const [teamName, setTeamName] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [tasks, setTasks] = useState<RescueRequest[]>([]);

    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [teamsError, setTeamsError] = useState<string | null>(null);
    const [teams, setTeams] = useState<RescueTeam[]>([]);

    const fetchTasks = async (id: string) => {
        if (!id.trim()) {
            setError("Vui lòng chọn đội cứu hộ trước.");
            return;
        }
        setLoading(true);
        setError(null);
        try {
            const data = await getAssignedTasks(id.trim());
            setTasks(data);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Không thể tải danh sách nhiệm vụ");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (!teamModalOpen) return;
        setTeamsLoading(true);
        setTeamsError(null);
        getRescueTeams()
            .then((data) => setTeams(data))
            .catch((e) => setTeamsError(e instanceof Error ? e.message : "Không thể tải danh sách đội cứu hộ"))
            .finally(() => setTeamsLoading(false));
    }, [teamModalOpen]);

    const handlePickTeam = (team: RescueTeam) => {
        setTeamId(team._id);
        setTeamName(team.teamName);
        setTeamModalOpen(false);
        // load tasks ngay sau khi chọn
        fetchTasks(team._id);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-5xl mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
                    <div>
                        <h1 className="text-2xl font-bold text-gray-900">Nhiệm vụ được phân công</h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Xem các yêu cầu cứu hộ mà đội được điều phối viên giao.
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                        <button
                            type="button"
                            onClick={() => setTeamModalOpen(true)}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg border border-gray-300 bg-white text-sm font-medium text-gray-700 hover:border-blue-400 hover:text-blue-700"
                        >
                            <Users className="w-4 h-4" />
                            {teamName ? `Đội: ${teamName}` : "Chọn đội cứu hộ"}
                        </button>
                        <button
                            onClick={() => teamId && fetchTasks(teamId)}
                            disabled={loading || !teamId}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-medium hover:bg-blue-700 disabled:opacity-60"
                        >
                            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <RefreshCw className="w-4 h-4" />}
                            Làm mới
                        </button>
                    </div>
                </div>

                {error && (
                    <div className="mb-6 p-4 rounded-xl bg-red-50 border border-red-200 flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-5 h-5 shrink-0" />
                        <span>{error}</span>
                    </div>
                )}

                {loading && tasks.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 text-gray-500">
                        <Loader2 className="w-12 h-12 animate-spin mb-4" />
                        <p>Đang tải danh sách nhiệm vụ...</p>
                    </div>
                ) : tasks.length === 0 ? (
                    <div className="rounded-xl border border-gray-200 bg-white p-12 text-center text-gray-500">
                        <p>Chưa có nhiệm vụ nào được giao cho đội này.</p>
                    </div>
                ) : (
                    <div className="space-y-4">
                        {tasks.map((task) => {
                            const [lng, lat] = task.location?.coordinates ?? [0, 0];
                            return (
                                <div
                                    key={task._id}
                                    className="rounded-xl border border-gray-200 bg-white p-5 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                                    onClick={() => navigate(`/rescue-team/assigned-task/${task._id}`)}
                                >
                                    <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                                        <div className="flex-1 space-y-2">
                                            <div className="flex flex-wrap items-center gap-2">
                                                <span className="font-mono font-semibold text-gray-900">
                                                    {task.requestCode}
                                                </span>
                                                {task.urgencyLevel && (
                                                    <span className="inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700">
                                                        {task.urgencyLevel}
                                                    </span>
                                                )}
                                            </div>
                                            <p className="text-gray-700">{task.description}</p>
                                            <div className="flex flex-wrap gap-4 text-sm text-gray-500">
                                                <span className="inline-flex items-center gap-1.5">
                                                    <MapPin className="w-4 h-4" />
                                                    {lat.toFixed(4)}, {lng.toFixed(4)}
                                                </span>
                                                <span className="inline-flex items-center gap-1.5">
                                                    <Calendar className="w-4 h-4" />
                                                    {formatDate(task.createdAt)}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            <Modal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="Chọn đội cứu hộ" size="lg">
                {teamsLoading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Đang tải danh sách đội...
                    </div>
                ) : teamsError ? (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                        {teamsError}
                        <button
                            type="button"
                            onClick={() => {
                                setTeamsLoading(true);
                                setTeamsError(null);
                                getRescueTeams()
                                    .then((data) => setTeams(data))
                                    .catch((e) =>
                                        setTeamsError(
                                            e instanceof Error ? e.message : "Không thể tải danh sách đội cứu hộ",
                                        ),
                                    )
                                    .finally(() => setTeamsLoading(false));
                            }}
                            className="ml-2 underline font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : teams.length === 0 ? (
                    <div className="text-sm text-gray-500 py-6">Chưa có đội cứu hộ nào.</div>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                        {teams.map((team) => (
                            <button
                                key={team._id}
                                type="button"
                                onClick={() => handlePickTeam(team)}
                                className="w-full text-left rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors p-4"
                            >
                                <div className="flex items-start justify-between gap-3">
                                    <div className="min-w-0">
                                        <p className="font-semibold text-gray-900 truncate">{team.teamName}</p>
                                        <p className="text-xs text-gray-500 mt-1 truncate">
                                            Trưởng nhóm: {team.leaderId?.fullName} • Thành viên:{" "}
                                            {team.members?.length ?? 0} • Xe: {team.vehicles?.length ?? 0}
                                        </p>
                                    </div>
                                    <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                                        {team.status}
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </Modal>
        </div>
    );
}
