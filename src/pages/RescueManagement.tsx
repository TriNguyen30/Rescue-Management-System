import React, {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";
import {
  LifeBuoy,
  Users,
  Search,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  MapPin,
  Calendar,
  Eye,
  Edit3,
  Check,
} from "lucide-react";
import { ManagerLayout } from "@/components/ui/ManagerSidebar";
import { useNavigate } from "react-router-dom";
import {
  getRescueTeams,
  createRescueTeam,
  updateRescueTeam,
} from "@/services/rescue-team.service";
import { getUsers } from "@/services/user.service";
import { getVehicles } from "@/services/vehicle.service";
import { reverseGeocode } from "@/services/geocode.service";
import type {
  RescueTeam,
  CreateRescueTeamPayload,
  UpdateRescueTeamPayload,
  RescueTeamStatus,
} from "@/types/rescue-teams";
import type { User } from "@/types/user";
import type { VehicleItem } from "@/types/vehicle";
import { useToast } from "@/components/ui/Toast";

type FormState = {
  teamName: string;
  leaderId: string;
  memberIds: string[];
  vehicleIds: string[];
};

const initialForm: FormState = {
  teamName: "",
  leaderId: "",
  memberIds: [],
  vehicleIds: [],
};

const STATUS_LABELS: Record<RescueTeamStatus, string> = {
  AVAILABLE: "Sẵn sàng",
  BUSY: "Đang bận",
  OFFLINE: "Ngoại tuyến",
};

const STATUS_COLORS: Record<
  RescueTeamStatus,
  { bg: string; text: string; dot: string }
> = {
  AVAILABLE: {
    bg: "bg-emerald-50 border-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  BUSY: {
    bg: "bg-blue-50 border-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  OFFLINE: {
    bg: "bg-gray-50 border-gray-200",
    text: "text-gray-700",
    dot: "bg-gray-400",
  },
};

// ── Edit Rescue Team Modal ────────────────────────────────────────────────────
function EditRescueTeamModal({
  team,
  onClose,
  onSaved,
  users,
  vehicles,
}: {
  team: RescueTeam;
  onClose: () => void;
  onSaved: (updated: RescueTeam) => void;
  users: User[];
  vehicles: VehicleItem[];
}) {
  const [teamName, setTeamName] = useState(team.teamName || "");
  const [leaderId, setLeaderId] = useState(
    typeof team.leaderId === "object" ? team.leaderId?._id ?? "" : team.leaderId ?? ""
  );
  const [memberIds, setMemberIds] = useState<string[]>(
    team.members?.map((m) => m._id) ?? []
  );
  const [vehicleIds, setVehicleIds] = useState<string[]>(
    team.vehicles?.map((v) => v._id) ?? []
  );
  const [status, setStatus] = useState<RescueTeamStatus>(team.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { success, error: toastError } = useToast();

  const handleMemberSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setMemberIds(selected);
  };

  const handleVehicleSelectChange = (
    e: React.ChangeEvent<HTMLSelectElement>
  ) => {
    const selected = Array.from(e.target.selectedOptions).map(
      (opt) => opt.value
    );
    setVehicleIds(selected);
  };

  const handleSave = async () => {
    if (!teamName.trim()) { setError("Tên đội không được để trống."); return; }
    if (!leaderId.trim()) { setError("Vui lòng chọn đội trưởng."); return; }
    if (memberIds.length === 0) { setError("Vui lòng chọn ít nhất một thành viên."); return; }

    setSaving(true);
    setError("");
    try {
      const members = Array.from(
        new Set([leaderId, ...memberIds])
      );
      const vehicles = vehicleIds.filter(Boolean);

      const payload: UpdateRescueTeamPayload = {
        teamName: teamName.trim(),
        leaderId: leaderId.trim(),
        members,
        vehicles,
        status,
      };

      const updated = await updateRescueTeam(team._id!, payload);
      onSaved(updated);
      onClose();
      success("Đội cứu hộ đã được cập nhật thành công.");
    } catch (e: any) {
      setError(e?.response?.data?.message || "Cập nhật đội cứu hộ thất bại.");
      toastError(e?.response?.data?.message || e?.message || "Cập nhật đội cứu hộ thất bại.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
              Chỉnh sửa đội cứu hộ
            </p>
            <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Đóng"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Team name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Tên đội cứu hộ
            </label>
            <input
              value={teamName}
              onChange={(e) => setTeamName(e.target.value)}
              placeholder="VD: Đội cứu hộ Q1"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
            />
          </div>

          {/* Leader ID */}
          <div>
            <label htmlFor="edit_leader_id" className="block text-sm font-medium text-gray-700 mb-1.5">
              Đội trưởng
            </label>
            <div className="relative">
              <select
                id="edit_leader_id"
                value={leaderId}
                onChange={(e) => {
                  const nextLeader = e.target.value;
                  setLeaderId(nextLeader);
                  // ensure leader is never included in members
                  setMemberIds((prev) => prev.filter((id) => id !== nextLeader));
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer"
              >
                <option value="">Chọn đội trưởng</option>
                {users.map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.username} {u.phone ? `(${u.phone})` : ""}
                  </option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Member IDs */}
          <div>
            <label htmlFor="edit_member_ids" className="block text-sm font-medium text-gray-700 mb-1.5">
              Thành viên
              <span className="text-gray-400 font-normal"> (có thể chọn nhiều)</span>
            </label>
            <select
              id="edit_member_ids"
              multiple
              value={memberIds}
              onChange={handleMemberSelectChange}
              className="w-full min-h-[90px] px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
            >
              {users
                .filter((u) => u.id !== leaderId)
                .map((u) => (
                  <option key={u.id} value={u.id}>
                    {u.fullName || u.username} {u.phone ? `(${u.phone})` : ""}
                  </option>
                ))}
            </select>
          </div>

          {/* Vehicle IDs */}
          <div>
            <label htmlFor="edit_vehicle_ids" className="block text-sm font-medium text-gray-700 mb-1.5">
              Phương tiện
              <span className="text-gray-400 font-normal"> (có thể chọn nhiều)</span>
            </label>
            <select
              id="edit_vehicle_ids"
              multiple
              value={vehicleIds}
              onChange={handleVehicleSelectChange}
              className="w-full min-h-[90px] px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
            >
              {vehicles.map((v) => (
                <option key={v._id || v.id} value={v._id || v.id!}>
                  {v.plateNumber} - {v.type}{" "}
                  {typeof v.capacity === "number"
                    ? `(Sức chứa: ${v.capacity.toLocaleString("vi-VN")})`
                    : ""}
                </option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700 mb-1.5">
              Trạng thái
            </label>
            <div className="relative">
              <select
                id="edit_status"
                value={status}
                onChange={(e) => setStatus(e.target.value as RescueTeamStatus)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer"
              >
                <option value="AVAILABLE">Sẵn sàng</option>
                <option value="BUSY">Đang bận</option>
                <option value="OFFLINE">Ngoại tuyến</option>
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          {/* Actions */}
          <div className="flex gap-3 pt-1">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-60"
            >
              Hủy
            </button>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving}
              className="flex-1 bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              {saving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {saving ? "Đang lưu..." : "Lưu thay đổi"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RescueManagement() {
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<RescueTeamStatus | "ALL">("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const [selectedTeam, setSelectedTeam] = useState<RescueTeam | null>(null);
  const [editTeam, setEditTeam] = useState<RescueTeam | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [locationAddressLoading, setLocationAddressLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();


  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRescueTeams();
      setTeams(data || []);
    } catch (e: any) {
      setError(
        e?.response?.data?.message || e?.message || "Không thể tải danh sách đội cứu hộ."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [userData, vehicleData] = await Promise.all([
          getUsers(),
          getVehicles(),
        ]);
        setUsers(userData.filter((u) => u.role === "RESCUE_TEAM"));
        setVehicles(vehicleData || []);
      } catch (e) {
        console.error("Không thể tải dữ liệu người dùng / phương tiện", e);
      }
    };
    fetchLookups();
  }, []);

  useEffect(() => {
    if (!selectedTeam?.currentLocation?.coordinates?.length) {
      setLocationAddress(null);
      setLocationAddressLoading(false);
      return;
    }
    const [lon, lat] = selectedTeam.currentLocation.coordinates;
    setLocationAddressLoading(true);
    setLocationAddress(null);
    setLocationError("");
    reverseGeocode(lat, lon)
      .then(setLocationAddress)
      .catch(() => setLocationError("Không thể tải địa chỉ."))
      .finally(() => setLocationAddressLoading(false));
  }, [selectedTeam?._id, selectedTeam?.currentLocation?.coordinates]);

  const statuses = useMemo<RescueTeamStatus[]>(() => {
    const set = new Set<RescueTeamStatus>();
    teams.forEach((t) => t.status && set.add(t.status));
    return Array.from(set);
  }, [teams]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return teams.filter((t) => {
      const matchSearch =
        !q ||
        t.teamName.toLowerCase().includes(q) ||
        t.leaderId?.fullName?.toLowerCase().includes(q) ||
        t.members?.some((m) => m.fullName?.toLowerCase().includes(q)) ||
        t.vehicles?.some((v) => v.plateNumber?.toLowerCase().includes(q));
      const matchStatus = statusFilter === "ALL" || t.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [teams, search, statusFilter]);

  const availableCount = useMemo(() => teams.filter((t) => t.status === "AVAILABLE").length, [teams]);
  const busyCount = useMemo(() => teams.filter((t) => t.status === "BUSY").length, [teams]);

  const handleOpenModal = () => { setForm(initialForm); setFormError(""); setModalOpen(true); };
  const handleChange = (field: "teamName" | "leaderId", value: string) =>
    setForm((prev) => {
      if (field === "leaderId") {
        // ensure leader is never included in members
        const nextLeaderId = value;
        return {
          ...prev,
          leaderId: nextLeaderId,
          memberIds: prev.memberIds.filter((id) => id !== nextLeaderId),
        };
      }
      return { ...prev, [field]: value };
    });
  const handleMultiChange = (field: "memberIds" | "vehicleIds", values: string[]) =>
    setForm((prev) => ({ ...prev, [field]: values }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.teamName.trim()) { setFormError("Vui lòng nhập tên đội cứu hộ."); return; }
    if (!form.leaderId.trim()) { setFormError("Vui lòng chọn đội trưởng."); return; }

    const members = Array.from(new Set([form.leaderId, ...form.memberIds]));
    const vehicles = form.vehicleIds.filter(Boolean);
    const payload: CreateRescueTeamPayload = {
      teamName: form.teamName.trim(),
      leaderId: form.leaderId.trim(),
      members,
      vehicles,
    };
    setSubmitting(true);
    try {
      const created = await createRescueTeam(payload);
      setTeams((prev) => [created, ...prev]);
      setForm(initialForm);
      setModalOpen(false);
      toastSuccess("Đội cứu hộ đã được tạo thành công.");
    } catch (e: any) {
      setFormError(e?.response?.data?.message || e?.message || "Không thể tạo đội cứu hộ mới.");
      toastError("Không thể tạo đội cứu hộ mới.", e?.response?.data?.message || e?.message || "Không thể tạo đội cứu hộ mới.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (team: RescueTeam, nextStatus: RescueTeamStatus) => {
    const id = team._id;
    if (!id || team.status === nextStatus) return;
    const prevStatus = team.status;
    setError("");
    setTeams((prev) => prev.map((t) => (t._id === id ? { ...t, status: nextStatus } : t)));
    setUpdatingStatus((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await updateRescueTeam(id, { status: nextStatus });
      setTeams((prev) => prev.map((t) => (t._id === id ? { ...t, ...updated } : t)));
      toastSuccess("Đội cứu hộ đã được cập nhật trạng thái thành công.");
    } catch (e: any) {
      setTeams((prev) => prev.map((t) => (t._id === id ? { ...t, status: prevStatus } : t)));
      setError(e?.response?.data?.message || e?.message || "Không thể cập nhật trạng thái đội cứu hộ.");
      toastError("Không thể cập nhật trạng thái đội cứu hộ.", e?.response?.data?.message || e?.message || "Không thể cập nhật trạng thái đội cứu hộ.");
    } finally {
      setUpdatingStatus((prev) => { const { [id]: _removed, ...rest } = prev; return rest; });
    }
  };

  // Note: location updates are now handled only when viewing details; "use my location"
  // has been removed in favor of direct map navigation and reverse geocoding.

  return (
    <ManagerLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý đội cứu hộ</h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Theo dõi đội cứu hộ, nhân sự, phương tiện và trạng thái sẵn sàng
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchTeams}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer"
              >
                <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : "text-gray-400"}`} />
                Làm mới
              </button>
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 rounded-xl shadow-sm transition-colors cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Thêm đội cứu hộ
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Tổng số đội</p>
                <p className="text-xl font-bold text-gray-900">{teams.length}</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Đội sẵn sàng</p>
                <p className="text-xl font-bold text-gray-900">{availableCount}</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                <Loader2 className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Đang xử lý nhiệm vụ</p>
                <p className="text-xl font-bold text-gray-900">{busyCount}</p>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên đội, đội trưởng, thành viên hoặc biển số xe..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
              />
              {search && (
                <button
                  type="button"
                  onClick={() => setSearch("")}
                  aria-label="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:inline">Lọc theo trạng thái</span>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as RescueTeamStatus | "ALL")}
                  aria-label="Lọc theo trạng thái"
                  className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer"
                >
                  <option value="ALL">Tất cả</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>{STATUS_LABELS[s] || s}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
                <span className="text-sm">Đang tải danh sách đội cứu hộ...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-red-500 px-4 text-center">
                <AlertTriangle className="w-8 h-8" />
                <p className="text-sm">{error}</p>
                <button onClick={fetchTeams} className="text-xs text-emerald-500 hover:underline">Thử lại</button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                <LifeBuoy className="w-10 h-10 text-gray-200" />
                <p className="text-sm">Chưa có đội cứu hộ nào phù hợp bộ lọc.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Tên đội</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Đội trưởng</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Thành viên</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Phương tiện</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Vị trí</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Cập nhật</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((team) => {
                      const meta = STATUS_COLORS[team.status] || STATUS_COLORS.AVAILABLE;
                      const id = team._id;
                      const isUpdating = id ? Boolean(updatingStatus[id]) : false;
                      const coordinates = team.currentLocation?.coordinates;

                      return (
                        <tr key={team._id} className="group hover:bg-emerald-50/40 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{team.teamName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex flex-col">
                              <span className="font-medium">{team.leaderId?.fullName || "—"}</span>
                              <span className="text-xs text-gray-400">{team.leaderId?.phone || ""}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">
                            {team.members?.length ? (
                              <span>{team.members.length} thành viên</span>
                            ) : (
                              <span className="text-gray-300">Chưa có thành viên</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
                            {team.vehicles?.length ? (
                              <span>{team.vehicles.length} phương tiện</span>
                            ) : (
                              <span className="text-gray-300">Chưa gán phương tiện</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                            {coordinates?.length === 2 ? (
                              <div className="inline-flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                <span>{coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.bg} ${meta.text}`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
                                {STATUS_LABELS[team.status] || team.status}
                              </span>
                              <div className="relative">
                                <select
                                  value={team.status}
                                  disabled={!id || isUpdating}
                                  onChange={(e) => handleUpdateStatus(team, e.target.value as RescueTeamStatus)}
                                  className="pl-2 pr-7 py-1 text-[11px] border border-gray-200 rounded-lg bg-gray-50 hover:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                  aria-label="Cập nhật trạng thái đội"
                                >
                                  <option value="AVAILABLE">Sẵn sàng</option>
                                  <option value="BUSY">Đang bận</option>
                                  <option value="OFFLINE">Ngoại tuyến</option>
                                </select>
                                {isUpdating && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                )}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                            {team.updatedAt || team.createdAt ? (
                              <div className="inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                <span>{new Date((team.updatedAt || team.createdAt) as string).toLocaleDateString("vi-VN")}</span>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          {/* ── Actions column ── */}
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button
                                type="button"
                                onClick={() => setEditTeam(team)}
                                aria-label="Chỉnh sửa đội"
                                title="Chỉnh sửa đội"
                                className="p-1.5 rounded-lg hover:bg-emerald-100 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() => setSelectedTeam(team)}
                                aria-label="Xem chi tiết đội"
                                title="Xem chi tiết đội"
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-500 transition-colors cursor-pointer"
                              >
                                <Eye className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Create Modal */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Đội cứu hộ</p>
                  <h3 className="text-lg font-bold text-gray-900">Thêm đội cứu hộ mới</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  aria-label="Đóng"
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label htmlFor="team_name" className="block text-sm font-medium text-gray-700 mb-1.5">Tên đội cứu hộ</label>
                    <input id="team_name" value={form.teamName} onChange={(e) => handleChange("teamName", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                      placeholder="VD: Đội cứu hộ Q1" />
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="leader_id" className="block text-sm font-medium text-gray-700 mb-1.5">Đội trưởng</label>
                    <div className="relative">
                      <select
                        id="leader_id"
                        value={form.leaderId}
                        onChange={(e) => handleChange("leaderId", e.target.value)}
                        aria-label="Chọn đội trưởng"
                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer"
                      >
                        <option value="">Chọn đội trưởng</option>
                        {users.map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName || u.username} {u.phone ? `(${u.phone})` : ""}
                          </option>
                        ))}
                      </select>
                      <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="member_ids" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Thành viên
                      <span className="text-gray-400 font-normal"> (có thể chọn nhiều)</span>
                    </label>
                    <select
                      id="member_ids"
                      multiple
                      value={form.memberIds}
                      onChange={(e) =>
                        handleMultiChange(
                          "memberIds",
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                      aria-label="Chọn thành viên đội cứu hộ"
                      className="w-full min-h-[90px] px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    >
                      {users
                        .filter((u) => u.id !== form.leaderId)
                        .map((u) => (
                          <option key={u.id} value={u.id}>
                            {u.fullName || u.username} {u.phone ? `(${u.phone})` : ""}
                          </option>
                        ))}
                    </select>
                  </div>
                  <div className="sm:col-span-2">
                    <label htmlFor="vehicle_ids" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Phương tiện
                      <span className="text-gray-400 font-normal"> (có thể chọn nhiều)</span>
                    </label>
                    <select
                      id="vehicle_ids"
                      multiple
                      value={form.vehicleIds}
                      onChange={(e) =>
                        handleMultiChange(
                          "vehicleIds",
                          Array.from(e.target.selectedOptions).map((opt) => opt.value)
                        )
                      }
                      aria-label="Chọn phương tiện cho đội cứu hộ"
                      className="w-full min-h-[90px] px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    >
                      {vehicles.map((v) => (
                        <option key={v._id || v.id} value={v._id || v.id!}>
                          {v.plateNumber} - {v.type}{" "}
                          {typeof v.capacity === "number"
                            ? `(Sức chứa: ${v.capacity.toLocaleString("vi-VN")})`
                            : ""}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
                {formError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setModalOpen(false)} disabled={submitting}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer">
                    Hủy
                  </button>
                  <button type="submit" disabled={submitting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-emerald-500 hover:bg-emerald-600 disabled:bg-emerald-300 rounded-xl transition-colors cursor-pointer">
                    {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Plus className="w-4 h-4" />Lưu đội cứu hộ</>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Edit Modal */}
        {editTeam && (
          <EditRescueTeamModal
            team={editTeam}
            users={users}
            vehicles={vehicles}
            onClose={() => setEditTeam(null)}
            onSaved={(updated) => {
              setTeams((prev) => prev.map((t) => t._id === updated._id ? updated : t));
              setEditTeam(null);
            }}
          />
        )}

        {/* Detail Modal */}
        {selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chi tiết đội cứu hộ</p>
                  <h3 className="text-lg font-bold text-gray-900">{selectedTeam.teamName}</h3>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${STATUS_COLORS[selectedTeam.status]?.bg || STATUS_COLORS.AVAILABLE.bg} ${STATUS_COLORS[selectedTeam.status]?.text || STATUS_COLORS.AVAILABLE.text}`}>
                    <span className={`w-1.5 h-1.5 rounded-full ${STATUS_COLORS[selectedTeam.status]?.dot || STATUS_COLORS.AVAILABLE.dot}`} />
                    {STATUS_LABELS[selectedTeam.status] || selectedTeam.status}
                  </span>
                  {/* Edit shortcut from detail modal */}
                  <button
                    type="button"
                    onClick={() => { setSelectedTeam(null); setEditTeam(selectedTeam); }}
                    aria-label="Chỉnh sửa đội"
                    title="Chỉnh sửa đội"
                    className="p-2 rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedTeam(null)}
                    aria-label="Đóng"
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>
              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Đội trưởng</h4>
                    {selectedTeam.leaderId ? (
                      <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{selectedTeam.leaderId.fullName}</p>
                        <p className="text-xs text-gray-500">{selectedTeam.leaderId.phone || "—"}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Chưa gán đội trưởng.</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thông tin chung</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-xs text-gray-400">Thành viên</p>
                        <p className="font-semibold text-gray-900">{selectedTeam.members?.length || 0}</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-400">Phương tiện</p>
                        <p className="font-semibold text-gray-900">{selectedTeam.vehicles?.length || 0}</p>
                      </div>
                      <div className="col-span-2">
                        <div className="flex items-center justify-between gap-2 flex-wrap">
                          <div>
                            <p className="text-xs text-gray-400">Vị trí hiện tại</p>
                            {locationAddressLoading ? (
                              <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                <Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Đang tải địa chỉ...</span>
                              </div>
                            ) : locationError ? (
                              <p className="text-xs text-amber-600 mt-0.5">{locationError}</p>
                            ) : locationAddress ? (
                              <div className="inline-flex items-center gap-1.5 text-xs text-gray-700 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-300 shrink-0" /><span>{locationAddress}</span>
                              </div>
                            ) : selectedTeam.currentLocation?.coordinates?.length === 2 ? (
                              <div className="inline-flex items-center gap-1.5 text-xs text-gray-500 mt-0.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                <span>{selectedTeam.currentLocation.coordinates[1].toFixed(4)}, {selectedTeam.currentLocation.coordinates[0].toFixed(4)}</span>
                              </div>
                            ) : (
                              <p className="text-xs text-gray-300 mt-0.5">—</p>
                            )}
                          </div>
                          <div className="flex items-center gap-2">
                            {selectedTeam.currentLocation?.coordinates?.length === 2 && (
                              <>
                                <a
                                  href={`https://www.google.com/maps?q=${selectedTeam.currentLocation.coordinates[1]},${selectedTeam.currentLocation.coordinates[0]}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors cursor-pointer"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  Mở Google Maps
                                </a>
                                <button
                                  type="button"
                                  onClick={() =>
                                    navigate("/manager/rescue-map", {
                                      state: {
                                        lat: selectedTeam.currentLocation.coordinates[1],
                                        lng: selectedTeam.currentLocation.coordinates[0],
                                      },
                                    })
                                  }
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-100 transition-colors cursor-pointer"
                                  aria-label="Xem đội trên bản đồ hệ thống"
                                  title="Xem đội trên bản đồ hệ thống"
                                >
                                  <MapPin className="w-3.5 h-3.5" />
                                  Xem bản đồ hệ thống
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thành viên</h4>
                    <span className="text-xs text-gray-400">{selectedTeam.members?.length || 0} người</span>
                  </div>
                  {selectedTeam.members?.length ? (
                    <div className="max-h-40 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100">
                      {selectedTeam.members.map((m) => (
                        <div key={m._id} className="px-3 py-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{m.fullName}</p>
                            <p className="text-xs text-gray-500">{m.phone || "—"}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Chưa có thành viên nào trong đội.</p>
                  )}
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Phương tiện</h4>
                    <span className="text-xs text-gray-400">{selectedTeam.vehicles?.length || 0} phương tiện</span>
                  </div>
                  {selectedTeam.vehicles?.length ? (
                    <div className="max-h-40 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100">
                      {selectedTeam.vehicles.map((v) => (
                        <div key={v._id} className="px-3 py-2 flex items-center justify-between">
                          <div>
                            <p className="text-sm font-semibold text-gray-900">{v.plateNumber}</p>
                            <p className="text-xs text-gray-500">{v.type} • Sức chứa: {v.capacity?.toLocaleString("vi-VN")}</p>
                          </div>
                          <span className="text-[11px] text-gray-500">{v.status}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-gray-400">Chưa gán phương tiện cho đội.</p>
                  )}
                </div>
                <div className="flex flex-wrap items-center justify-between gap-3 text-xs text-gray-400 border-t border-gray-100 pt-3">
                  <div className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-300" />
                    <span>Tạo lúc: {selectedTeam.createdAt ? new Date(selectedTeam.createdAt).toLocaleString("vi-VN") : "—"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <Calendar className="w-3.5 h-3.5 text-gray-300" />
                    <span>Cập nhật: {selectedTeam.updatedAt ? new Date(selectedTeam.updatedAt).toLocaleString("vi-VN") : "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}