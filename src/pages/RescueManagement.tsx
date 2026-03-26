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
  Trash2,
  Clock,
  Tag,
  CarFront,
} from "lucide-react";
import { ManagerLayout } from "@/components/ui/ManagerSidebar";
import { useNavigate } from "react-router-dom";
import {
  getRescueTeams,
  getResuceTeamById,
  createRescueTeam,
  updateRescueTeam,
  deleteRescueTeam,
  assignMemberToRescueTeam,
  removeMemberFromRescueTeam,
  assignVehicleToRescueTeam,
  removeVehicleFromRescueTeam,
  updateRescueTeamStatus,
} from "@/services/rescue-team.service";
import { getUsers } from "@/services/user.service";
import { getVehicles } from "@/services/vehicle.service";
import { reverseGeocode } from "@/services/geocode.service";
import type {
  RescueTeam,
  CreateRescueTeamPayload,
  UpdateRescueTeamPayload,
  RescueTeamStatus,
  AssignMemberToRescueTeamPayload,
  AssignVehicleToRescueTeamPayload,
} from "@/types/rescue-teams";
import type { User } from "@/types/user";
import type { VehicleItem } from "@/types/vehicle";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";

/** Resolve canonical id for a RescueTeam (always uses _id). */
const resolveTeamId = (team: RescueTeam): string => team._id!;

/** Resolve canonical id for a VehicleItem (supports both id and _id). */
const resolveVehicleId = (v: VehicleItem): string => (v._id ?? v.id)!;

type FormState = {
  teamName: string;
  leaderId: string;
  baseArea: string;
  latitude: string,
  longitude: string,
  memberIds: string[];
  vehicleIds: string[];
};

const initialForm: FormState = {
  teamName: "",
  leaderId: "",
  baseArea: "",
  latitude: "",
  longitude: "",
  memberIds: [],
  vehicleIds: [],
};

/** Payload shape required by assign/remove rescue-team endpoints */
function teamRef(teamId: string): { id: string; _id: string } {
  return { id: teamId, _id: teamId };
}

function memberAssignPayload(teamId: string, userId: string): AssignMemberToRescueTeamPayload {
  return { ...teamRef(teamId), userId };
}

function vehicleAssignPayload(teamId: string, vehicleId: string): AssignVehicleToRescueTeamPayload {
  return { ...teamRef(teamId), vehicleId };
}

const STATUS_LABELS: Record<RescueTeamStatus, string> = {
  AVAILABLE: "Sẵn sàng",
  BUSY: "Đang bận",
  OFFLINE: "Ngoại tuyến",
};

const STATUS_COLORS: Record<RescueTeamStatus, { bg: string; text: string; dot: string }> = {
  AVAILABLE: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  BUSY: { bg: "bg-blue-50 border-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  OFFLINE: { bg: "bg-gray-50 border-gray-200", text: "text-gray-700", dot: "bg-gray-400" },
};

// ── Shared helpers ────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: RescueTeamStatus }) {
  const meta = STATUS_COLORS[status] ?? STATUS_COLORS.OFFLINE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── Checkbox multi-select (members / vehicles) ────────────────────────────────
function CheckboxMultiSelect({
  id,
  label,
  hint,
  options,
  value,
  onChange,
  searchable = true,
  maxHeightClass = "max-h-[220px]",
  placeholder = "Tìm theo tên, số điện thoại...",
}: {
  id: string;
  label: string;
  hint?: string;
  options: { value: string; label: string }[];
  value: string[];
  onChange: (vals: string[]) => void;
  searchable?: boolean;
  maxHeightClass?: string;
  placeholder?: string;
}) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return options;
    return options.filter(
      (o) =>
        o.label.toLowerCase().includes(q) ||
        o.value.toLowerCase().includes(q),
    );
  }, [options, query]);

  const toggle = (val: string) => {
    if (value.includes(val)) {
      onChange(value.filter((v) => v !== val));
    } else {
      onChange([...value, val]);
    }
  };

  const selectAllFiltered = () => {
    const next = new Set(value);
    filtered.forEach((o) => next.add(o.value));
    onChange(Array.from(next));
  };

  const clearSelection = () => onChange([]);

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p id={`${id}-legend`} className="text-sm font-medium text-gray-700">
          {label}
          {hint && <span className="text-gray-400 font-normal ml-1">{hint}</span>}
        </p>
        <span className="text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-lg">
          {value.length} đã chọn
        </span>
      </div>

      {searchable && options.length > 4 && (
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          <input
            type="search"
            id={`${id}_search`}
            placeholder={placeholder || "Tìm theo tên, số điện thoại..."}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
            aria-label="Lọc danh sách"
          />
        </div>
      )}

      {options.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs">
          <button
            type="button"
            onClick={selectAllFiltered}
            className="text-emerald-600 hover:text-emerald-800 font-medium underline-offset-2 hover:underline"
          >
            Chọn tất cả {query.trim() ? "trong kết quả" : ""}
          </button>
          <span className="text-gray-300">|</span>
          <button
            type="button"
            onClick={clearSelection}
            className="text-gray-500 hover:text-gray-800 font-medium underline-offset-2 hover:underline"
          >
            Bỏ chọn hết
          </button>
        </div>
      )}

      <div
        role="group"
        aria-labelledby={`${id}-legend`}
        className={`${maxHeightClass} overflow-y-auto rounded-xl border border-gray-200 bg-white shadow-inner`}
      >
        {filtered.length === 0 ? (
          <p className="px-4 py-8 text-sm text-center text-gray-400">
            {options.length === 0 ? "Chưa có dữ liệu." : "Không có mục phù hợp bộ lọc."}
          </p>
        ) : (
          <ul className="divide-y divide-gray-100" id={id}>
            {filtered.map((o) => {
              const checked = value.includes(o.value);
              return (
                <li key={o.value}>
                  <label
                    className={`flex items-start gap-3 px-3 py-2.5 cursor-pointer transition-colors ${checked
                      ? "bg-emerald-50/80 hover:bg-emerald-50"
                      : "hover:bg-gray-50"
                      }`}
                  >
                    <span className="pt-0.5 shrink-0">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() => toggle(o.value)}
                        className="h-4 w-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500 focus:ring-offset-0 cursor-pointer"
                      />
                    </span>
                    <span className="text-sm text-gray-800 leading-snug flex-1 select-none">{o.label}</span>
                    {checked && (
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" aria-hidden />
                    )}
                  </label>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

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
  const [teamName, setTeamName] = useState(team.teamName ?? "");
  const [leaderId, setLeaderId] = useState(
    typeof team.leaderId === "object" ? (team.leaderId?._id ?? "") : (team.leaderId ?? "")
  );
  const [memberIds, setMemberIds] = useState<string[]>(
    team.members?.map((m) => m._id).filter(Boolean) ?? []
  );
  const [vehicleIds, setVehicleIds] = useState<string[]>(
    team.vehicles?.map((v) => v._id).filter(Boolean) ?? []
  );
  const [status, setStatus] = useState<RescueTeamStatus>(team.status);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { success, error: toastError } = useToast();

  const handleSave = async () => {
    if (!teamName.trim()) { setError("Tên đội không được để trống."); return; }
    if (!leaderId.trim()) { setError("Vui lòng chọn đội trưởng."); return; }

    const teamId = resolveTeamId(team);
    const leaderOld =
      typeof team.leaderId === "object" && team.leaderId
        ? team.leaderId._id
        : String(team.leaderId ?? "");
    const prevUserIds = new Set(
      [leaderOld, ...(team.members?.map((m) => m._id).filter(Boolean) ?? [])].filter(Boolean) as string[],
    );
    const newUserIds = new Set(
      [leaderId.trim(), ...memberIds].filter(Boolean),
    );
    const prevVehicleIds = new Set(
      team.vehicles?.map((v) => v._id).filter(Boolean) ?? [],
    );
    const newVehicleIds = new Set(vehicleIds.filter(Boolean));

    setSaving(true);
    setError("");
    try {
      const patchPayload: UpdateRescueTeamPayload = {
        teamName: teamName.trim(),
        leaderId: leaderId.trim(),
        latitude: parseFloat(latitude) || 0,
        longitude: parseFloat(longitude) || 0,
      };
      await updateRescueTeam(teamId, patchPayload);
      if (status !== team.status) {
        await updateRescueTeamStatus(teamId, status);
      }

      const toRemoveUsers = [...prevUserIds].filter((id) => !newUserIds.has(id));
      const toAddUsers = [...newUserIds].filter((id) => !prevUserIds.has(id));
      for (const userId of toRemoveUsers) {
        await removeMemberFromRescueTeam(memberAssignPayload(teamId, userId));
      }
      for (const userId of toAddUsers) {
        await assignMemberToRescueTeam(memberAssignPayload(teamId, userId));
      }

      const toRemoveVehicles = [...prevVehicleIds].filter((id) => !newVehicleIds.has(id));
      const toAddVehicles = [...newVehicleIds].filter((id) => !prevVehicleIds.has(id));
      for (const vid of toRemoveVehicles) {
        await removeVehicleFromRescueTeam(vehicleAssignPayload(teamId, vid));
      }
      for (const vid of toAddVehicles) {
        await assignVehicleToRescueTeam(vehicleAssignPayload(teamId, vid));
      }

      const updated = await getResuceTeamById(teamId);
      onSaved(updated);
      onClose();
      success("Đội cứu hộ đã được cập nhật thành công.");
    } catch (e: any) {
      const msg = e?.response?.data?.message || "Cập nhật đội cứu hộ thất bại.";
      setError(msg);
      toastError(msg);
    } finally {
      setSaving(false);
    }
  };

  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.fullName || u.username}${u.phone ? ` (${u.phone})` : ""}`,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: resolveVehicleId(v),
    label: `${v.plateNumber} - ${v.type}${typeof v.capacity === "number" ? ` (Sức chứa: ${v.capacity.toLocaleString("vi-VN")})` : ""}`,
  }));

  const [latitude, setLatitude] = useState(
    team.currentLocation?.coordinates?.[1]?.toString() || ""
  );
  const [longitude, setLongitude] = useState(
    team.currentLocation?.coordinates?.[0]?.toString() || ""
  );

  const handlePasteMapLink = (url: string) => {
    let lat = "";
    let lng = "";

    // Case 1: @lat,lng
    const atMatch = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (atMatch) {
      lat = atMatch[1];
      lng = atMatch[2];
    }

    // Case 2: ?q=lat,lng
    const qMatch = url.match(/[?&]q=(-?\d+\.\d+),(-?\d+\.\d+)/);
    if (!lat && qMatch) {
      lat = qMatch[1];
      lng = qMatch[2];
    }

    // ✅ Case 3: raw "lat, lng"
    const rawMatch = url.match(/^\s*(-?\d+\.\d+)\s*,\s*(-?\d+\.\d+)\s*$/);
    if (!lat && rawMatch) {
      lat = rawMatch[1];
      lng = rawMatch[2];
    }

    if (lat && lng) {
      setLatitude(lat);
      setLongitude(lng);
    } else {
      console.log("Không parse được:", url);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chỉnh sửa đội cứu hộ</p>
            <h3 className="text-lg font-bold text-gray-900">{team.teamName}</h3>
          </div>
          <button type="button" onClick={onClose} aria-label="Đóng"
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Team name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên đội cứu hộ</label>
            <input value={teamName} onChange={(e) => setTeamName(e.target.value)}
              placeholder="VD: Đội cứu hộ Q1"
              className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
          </div>

          <div className="space-y-3">
            {/* Coordinates */}
            <div className="grid grid-cols-2 gap-3">
              {/* Latitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Vĩ độ (Latitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value)}
                  placeholder="VD: 10.7769"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl 
        focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
        outline-none bg-gray-50 focus:bg-white transition"
                />
              </div>

              {/* Longitude */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Kinh độ (Longitude)
                </label>
                <input
                  type="number"
                  step="any"
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value)}
                  placeholder="VD: 106.7009"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl 
        focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
        outline-none bg-gray-50 focus:bg-white transition"
                />
              </div>
            </div>

            {/* Paste Google Maps link */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Dán link Google Maps
              </label>
              <input
                type="text"
                placeholder="VD: https://www.google.com/maps/@10.7769,106.7009,15z"
                onChange={(e) => handlePasteMapLink(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl 
      focus:ring-2 focus:ring-emerald-500 focus:border-transparent 
      outline-none bg-gray-50 focus:bg-white transition"
              />
            </div>

            {/* Preview link */}
            {latitude && longitude && (
              <div className="flex items-center gap-2">
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                >
                  <MapPin className="w-4 h-4" />
                  Xem trên Google Maps
                </a>
              </div>
            )}
          </div>

          {/* Leader */}
          <div>
            <label htmlFor="edit_leader_id" className="block text-sm font-medium text-gray-700 mb-1.5">Đội trưởng</label>
            <div className="relative">
              <select id="edit_leader_id" value={leaderId}
                onChange={(e) => {
                  const next = e.target.value;
                  setLeaderId(next);
                  setMemberIds((prev) => prev.filter((id) => id !== next));
                }}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer">
                <option value="">Chọn đội trưởng</option>
                {userOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {/* Members */}
          <CheckboxMultiSelect
            id="edit_member_ids"
            label="Thành viên"
            hint="(tick để chọn nhiều người)"
            options={userOptions.filter((o) => o.value !== leaderId)}
            value={memberIds}
            onChange={setMemberIds}
          />

          {/* Vehicles */}
          <CheckboxMultiSelect
            id="edit_vehicle_ids"
            placeholder="Tìm theo biển số xe..."
            label="Phương tiện"
            hint="(tick để chọn nhiều xe)"
            options={vehicleOptions}
            value={vehicleIds}
            onChange={setVehicleIds}
          />

          {/* Status */}
          <div>
            <label htmlFor="edit_status" className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
            <div className="relative">
              <select id="edit_status" value={status} onChange={(e) => setStatus(e.target.value as RescueTeamStatus)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer">
                {(Object.entries(STATUS_LABELS) as [RescueTeamStatus, string][]).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
              <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>

          {error && (
            <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
              <AlertTriangle className="w-4 h-4 shrink-0" /> {error}
            </div>
          )}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose} disabled={saving}
              className="flex-1 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors cursor-pointer disabled:opacity-60">
              Hủy
            </button>
            <button type="button" onClick={handleSave} disabled={saving}
              className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
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
  const [deleteTeam, setDeleteTeam] = useState<RescueTeam | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [locationAddress, setLocationAddress] = useState<string | null>(null);
  const [locationAddressLoading, setLocationAddressLoading] = useState(false);
  const [locationError, setLocationError] = useState("");
  const [users, setUsers] = useState<User[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const navigate = useNavigate();
  const { success: toastSuccess, error: toastError } = useToast();
  const [geocoding, setGeocoding] = useState(false);

  const handleGeocode = async () => {
    const lat = parseFloat(form.latitude);
    const lon = parseFloat(form.longitude);
    if (isNaN(lat) || isNaN(lon)) return;
    setGeocoding(true);
    try {
      const address = await reverseGeocode(lat, lon);
      setForm((prev) => ({ ...prev, baseArea: address }));
    } catch {
      // silently ignore
    } finally {
      setGeocoding(false);
    }
  };

  // ── Data fetching ─────────────────────────────────────────────────────────
  const fetchTeams = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getRescueTeams();
      setTeams(data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Không thể tải danh sách đội cứu hộ.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchTeams(); }, [fetchTeams]);

  useEffect(() => {
    const fetchLookups = async () => {
      try {
        const [userData, vehicleData] = await Promise.all([getUsers(), getVehicles()]);
        setUsers(userData.filter((u) => u.role === "RESCUE_TEAM"));
        setVehicles(vehicleData ?? []);
      } catch (e) {
        console.error("Không thể tải dữ liệu người dùng / phương tiện", e);
      }
    };
    fetchLookups();
  }, []);

  // Reset location state when selected team changes
  useEffect(() => {
    if (!selectedTeam) {
      setLocationAddress(null);
      setLocationAddressLoading(false);
      setLocationError("");
      return;
    }
    const coords = selectedTeam.currentLocation?.coordinates;
    if (!coords?.length) {
      setLocationAddress(null);
      setLocationAddressLoading(false);
      return;
    }
    const [lon, lat] = coords;
    setLocationAddressLoading(true);
    setLocationAddress(null);
    setLocationError("");
    reverseGeocode(lat, lon)
      .then(setLocationAddress)
      .catch(() => setLocationError("Không thể tải địa chỉ."))
      .finally(() => setLocationAddressLoading(false));
  }, [selectedTeam?._id]);           // only re-run when the selected team ID changes

  // ── Derived state ─────────────────────────────────────────────────────────
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

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOpenModal = () => { setForm(initialForm); setFormError(""); setModalOpen(true); };

  const handleChange = (field: "teamName" | "leaderId" | "baseArea", value: string) =>
    setForm((prev) => {
      if (field === "leaderId") {
        return { ...prev, leaderId: value, memberIds: prev.memberIds.filter((id) => id !== value) };
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

    const payload: CreateRescueTeamPayload = {
      teamName: form.teamName.trim(),
      leaderId: form.leaderId.trim(),
      baseArea: form.baseArea.trim() || "—",
      latitude: parseFloat(form.latitude) || 0,
      longitude: parseFloat(form.longitude) || 0,
    };
    setSubmitting(true);
    try {
      const created = await createRescueTeam(payload);
      const teamId = resolveTeamId(created);

      const desiredUsers = Array.from(new Set([form.leaderId.trim(), ...form.memberIds]));
      for (const userId of desiredUsers) {
        try {
          await assignMemberToRescueTeam(memberAssignPayload(teamId, userId));
        } catch {
          /* leader có thể đã được gán khi tạo đội */
        }
      }
      for (const vehicleId of form.vehicleIds.filter(Boolean)) {
        try {
          await assignVehicleToRescueTeam(vehicleAssignPayload(teamId, vehicleId));
        } catch {
          /* xe có thể đã gán hoặc lỗi tạm thời */
        }
      }

      const fresh = await getResuceTeamById(teamId);
      setTeams((prev) => [fresh, ...prev.filter((t) => resolveTeamId(t) !== teamId)]);
      setForm(initialForm);
      setModalOpen(false);
      toastSuccess("Đội cứu hộ đã được tạo thành công.");
      fetchTeams();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Không thể tạo đội cứu hộ mới.";
      setFormError(msg);
      toastError(msg);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (team: RescueTeam, nextStatus: RescueTeamStatus) => {
    const id = resolveTeamId(team);
    if (team.status === nextStatus) return;
    const prevStatus = team.status;

    setTeams((prev) => prev.map((t) => resolveTeamId(t) === id ? { ...t, status: nextStatus } : t));
    setUpdatingStatus((prev) => ({ ...prev, [id]: true }));
    try {
      const updated = await updateRescueTeamStatus(id, nextStatus);
      setTeams((prev) => prev.map((t) => resolveTeamId(t) === id ? { ...t, ...updated } : t));
      toastSuccess("Cập nhật trạng thái đội cứu hộ thành công.");
      fetchTeams();
    } catch (e: any) {
      setTeams((prev) => prev.map((t) => resolveTeamId(t) === id ? { ...t, status: prevStatus } : t));
      const msg = e?.response?.data?.message || e?.message || "Không thể cập nhật trạng thái đội cứu hộ.";
      toastError(msg);
    } finally {
      setUpdatingStatus((prev) => { const { [id]: _, ...rest } = prev; return rest; });
    }
  };

  const confirmDeleteTeam = async () => {
    const team = deleteTeam;
    const id = team ? resolveTeamId(team) : null;
    if (!id || deletingId) return;

    setDeletingId(id);
    try {
      await deleteRescueTeam(id);
      setTeams((prev) => prev.filter((t) => resolveTeamId(t) !== id));
      setDeleteTeam(null);
      toastSuccess("Đã xóa đội cứu hộ thành công.");
      fetchTeams();
    } catch (e: any) {
      const msg = e?.response?.data?.message || e?.message || "Xóa đội cứu hộ thất bại.";
      toastError(msg);
    } finally {
      setDeletingId(null);
    }
  };

  // ── Reusable form fields (create + edit share same structure) ─────────────
  const userOptions = users.map((u) => ({
    value: u.id,
    label: `${u.fullName || u.username}${u.phone ? ` (${u.phone})` : ""}`,
  }));

  const vehicleOptions = vehicles.map((v) => ({
    value: resolveVehicleId(v),
    label: `${v.plateNumber} - ${v.type}${typeof v.capacity === "number" ? ` (Sức chứa: ${v.capacity.toLocaleString("vi-VN")})` : ""}`,
  }));

  useEffect(() => {
    fetch("https://provinces.open-api.vn/api/?depth=1")
      .then(res => res.json())
      .then(data => setProvinces(data));
  }, []);

  const handlePasteMapLink = (url: string) => {
    const match = url.match(/@(-?\d+\.\d+),(-?\d+\.\d+)/);

    if (match) {
      const lat = match[1];
      const lng = match[2];

      setForm((prev) => ({
        ...prev,
        latitude: lat,
        longitude: lng,
      }));
      handleGeocode(); // gọi luôn
    }
  };

  return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Quản lý đội cứu hộ</h1>
                <p className="text-sm text-gray-400 mt-0.5">Theo dõi đội cứu hộ, nhân sự, phương tiện và trạng thái sẵn sàng</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={fetchTeams} disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : "text-gray-400"}`} />
                Làm mới
              </button>
              <button onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm transition-colors cursor-pointer">
                <Plus className="w-4 h-4" />
                Thêm đội cứu hộ
              </button>
            </div>
          </div>

          {/* Summary cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <LifeBuoy className="w-5 h-5" />
              </div>
              <div>
                <p className="text-xs text-gray-400">Tổng số đội</p>
                <p className="text-xl font-bold text-gray-900">{teams.length}</p>
              </div>
            </div>
            <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
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
              <input value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên đội, đội trưởng, thành viên hoặc biển số xe..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
              {search && (
                <button type="button" onClick={() => setSearch("")} aria-label="Xóa tìm kiếm"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:inline">Lọc theo trạng thái</span>
              <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as RescueTeamStatus | "ALL")}
                aria-label="Lọc theo trạng thái"
                className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer">
                <option value="ALL">Tất cả</option>
                {statuses.map((s) => <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>)}
              </select>
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
                      <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Hành động</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((team) => {
                      const id = resolveTeamId(team);
                      const isUpdating = Boolean(updatingStatus[id]);
                      const coordinates = team.currentLocation?.coordinates;

                      return (
                        <tr key={id} className="group hover:bg-emerald-50/40 transition-colors">
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">{team.teamName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            <div className="flex flex-col">
                              <span className="font-medium">{team.leaderId?.fullName || "—"}</span>
                              <span className="text-xs text-gray-400">{team.leaderId?.phone || ""}</span>
                            </div>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">
                            {team.members?.length
                              ? <span>{team.members.length} thành viên</span>
                              : <span className="text-gray-300">Chưa có thành viên</span>}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
                            {team.vehicles?.length
                              ? <span>{team.vehicles.length} phương tiện</span>
                              : <span className="text-gray-300">Chưa gán phương tiện</span>}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-500 hidden lg:table-cell">
                            {coordinates?.length === 2 ? (
                              <div className="inline-flex items-center gap-1.5">
                                <MapPin className="w-3.5 h-3.5 text-gray-300" />
                                <span>{coordinates[1].toFixed(4)}, {coordinates[0].toFixed(4)}</span>
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <StatusBadge status={team.status} />
                              {/* <div className="relative">
                                <select value={team.status} disabled={isUpdating}
                                  onChange={(e) => handleUpdateStatus(team, e.target.value as RescueTeamStatus)}
                                  className="pl-2 pr-7 py-1 text-[11px] border border-gray-200 rounded-lg bg-gray-50 hover:bg-white focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none transition cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed"
                                  aria-label="Cập nhật trạng thái đội">
                                  {(Object.entries(STATUS_LABELS) as [RescueTeamStatus, string][]).map(([val, label]) => (
                                    <option key={val} value={val}>{label}</option>
                                  ))}
                                </select>
                                {isUpdating && (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-gray-400 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
                                )}
                              </div> */}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                            {team.updatedAt || team.createdAt ? (
                              <div className="inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                <span>{new Date((team.updatedAt || team.createdAt) as string).toLocaleDateString("vi-VN")}</span>
                              </div>
                            ) : <span className="text-gray-300">—</span>}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              <button type="button" onClick={() => setSelectedTeam(team)}
                                aria-label="Xem chi tiết" title="Xem chi tiết"
                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer">
                                <Eye className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => setEditTeam(team)}
                                aria-label="Chỉnh sửa đội" title="Chỉnh sửa đội"
                                className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer">
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button type="button" onClick={() => setDeleteTeam(team)}
                                aria-label="Xóa đội" title="Xóa đội"
                                disabled={deletingId === id}
                                className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50">
                                {deletingId === id
                                  ? <Loader2 className="w-4 h-4 animate-spin" />
                                  : <Trash2 className="w-4 h-4" />}
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

        {/* ── Create Modal ── */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div>
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Đội cứu hộ</p>
                  <h3 className="text-lg font-bold text-gray-900">Thêm đội cứu hộ mới</h3>
                </div>
                <button type="button" onClick={() => setModalOpen(false)} aria-label="Đóng"
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                  <X className="w-5 h-5" />
                </button>
              </div>
              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div>
                  <label htmlFor="team_name" className="block text-sm font-medium text-gray-700 mb-1.5">Tên đội cứu hộ</label>
                  <input id="team_name" value={form.teamName} onChange={(e) => handleChange("teamName", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    placeholder="VD: Đội cứu hộ Q1" />
                </div>
                <div>
                  <label htmlFor="base_area" className="block text-sm font-medium text-gray-700 mb-1.5">Khu vực hoạt động</label>
                  <input id="base_area" value={form.baseArea} onChange={(e) => handleChange("baseArea", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    placeholder="VD: Quận 1, TP.HCM (để trống sẽ dùng mặc định)" />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="latitude" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Vĩ độ (Latitude)
                    </label>
                    <input
                      id="latitude"
                      type="number"
                      step="any"
                      value={form.latitude}
                      onChange={(e) => setForm((prev) => ({ ...prev, latitude: e.target.value }))}
                      onBlur={handleGeocode}
                      placeholder="VD: 10.7769"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label htmlFor="longitude" className="block text-sm font-medium text-gray-700 mb-1.5">
                      Kinh độ (Longitude)
                    </label>
                    <input
                      id="longitude"
                      type="number"
                      step="any"
                      value={form.longitude}
                      onChange={(e) => setForm((prev) => ({ ...prev, longitude: e.target.value }))}
                      onBlur={handleGeocode}
                      placeholder="VD: 106.7009"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Dán link Google Maps
                  </label>
                  <input
                    type="text"
                    placeholder="VD: https://www.google.com/maps/@10.7769,106.7009,15z"
                    onBlur={(e) => handlePasteMapLink(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl"
                  />
                  {form.latitude && form.longitude && (
                    <div className="flex items-center gap-2 mt-2">
                      <a
                        href={`https://www.google.com/maps?q=${form.latitude},${form.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline flex items-center gap-1"
                      >
                        <MapPin className="w-4 h-4" />
                        Xem trên Google Maps
                      </a>
                    </div>
                  )}
                </div>

                {/* Address preview below the coord fields */}
                {geocoding && (
                  <div className="inline-flex items-center gap-1.5 text-xs text-gray-400">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" /> Đang tra cứu địa chỉ...
                  </div>
                )}
                <div>
                  <label htmlFor="leader_id" className="block text-sm font-medium text-gray-700 mb-1.5">Đội trưởng</label>
                  <div className="relative">
                    <select id="leader_id" value={form.leaderId} onChange={(e) => handleChange("leaderId", e.target.value)}
                      aria-label="Chọn đội trưởng"
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer">
                      <option value="">Chọn đội trưởng</option>
                      {userOptions.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                    </select>
                    <svg className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </div>
                <CheckboxMultiSelect
                  id="member_ids"
                  label="Thành viên"
                  hint="(tick để chọn nhiều người)"
                  options={userOptions.filter((o) => o.value !== form.leaderId)}
                  value={form.memberIds}
                  onChange={(vals) => handleMultiChange("memberIds", vals)}
                />
                <CheckboxMultiSelect
                  id="vehicle_ids"
                  placeholder="Tìm theo biển số xe..."
                  label="Phương tiện"
                  hint="(tick để chọn nhiều xe)"
                  options={vehicleOptions}
                  value={form.vehicleIds}
                  onChange={(vals) => handleMultiChange("vehicleIds", vals)}
                />

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

        {/* ── Edit Modal ── */}
        {editTeam && (
          <EditRescueTeamModal
            team={editTeam}
            users={users}
            vehicles={vehicles}
            onClose={() => setEditTeam(null)}
            onSaved={(updated) => {
              setTeams((prev) => prev.map((t) => resolveTeamId(t) === resolveTeamId(updated) ? updated : t));
              setEditTeam(null);
              fetchTeams();
            }}
          />
        )}

        {/* ── Delete confirmation modal ── */}
        <Modal
          open={!!deleteTeam}
          onClose={() => { if (!deletingId) setDeleteTeam(null); }}
          title="Xác nhận xóa đội cứu hộ"
          size="sm"
        >
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Bạn có chắc muốn xóa đội cứu hộ
              <span className="font-semibold text-gray-900"> {deleteTeam?.teamName}</span>? Hành động này không thể hoàn tác.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDeleteTeam(null)} disabled={!!deletingId}
                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60 cursor-pointer">
                Hủy
              </button>
              <button type="button" onClick={confirmDeleteTeam} disabled={!!deletingId}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors cursor-pointer">
                {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                {deletingId ? "Đang xóa..." : "Xóa"}
              </button>
            </div>
          </div>
        </Modal>

        {/* ── Detail Modal ── */}
        {selectedTeam && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 sticky top-0 bg-white z-10">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
                    <LifeBuoy className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chi tiết đội cứu hộ</p>
                    <h3 className="text-lg font-bold text-gray-900">{selectedTeam.teamName}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={selectedTeam.status} />
                  <button type="button" onClick={() => { setSelectedTeam(null); setEditTeam(selectedTeam); }}
                    aria-label="Chỉnh sửa đội" title="Chỉnh sửa đội"
                    className="p-2 rounded-xl hover:bg-emerald-50 text-gray-400 hover:text-emerald-600 transition-colors cursor-pointer">
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button type="button" onClick={() => setSelectedTeam(null)} aria-label="Đóng"
                    className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="p-6 space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Leader */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Tag className="w-3.5 h-3.5" /> Đội trưởng
                    </h4>
                    {selectedTeam.leaderId ? (
                      <div className="p-3 rounded-2xl border border-gray-100 bg-gray-50">
                        <p className="text-sm font-semibold text-gray-900">{selectedTeam.leaderId.fullName}</p>
                        <p className="text-xs text-gray-500">{selectedTeam.leaderId.phone || "—"}</p>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-400">Chưa gán đội trưởng.</p>
                    )}
                  </div>

                  {/* General info */}
                  <div className="space-y-2">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Thông tin chung</h4>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-xs text-gray-400">Thành viên</p>
                        <p className="font-bold text-gray-900 text-lg">{selectedTeam.members?.length || 0}</p>
                      </div>
                      <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <p className="text-xs text-gray-400">Phương tiện</p>
                        <p className="font-bold text-gray-900 text-lg">{selectedTeam.vehicles?.length || 0}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Location */}
                <div className="space-y-2">
                  <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                    <MapPin className="w-3.5 h-3.5" /> Vị trí hiện tại
                  </h4>
                  <div className="flex items-center justify-between gap-3 flex-wrap p-3 rounded-xl bg-gray-50 border border-gray-100">
                    <div>
                      {locationAddressLoading ? (
                        <div className="inline-flex items-center gap-1.5 text-xs text-gray-500">
                          <Loader2 className="w-3.5 h-3.5 animate-spin" /><span>Đang tải địa chỉ...</span>
                        </div>
                      ) : locationError ? (
                        <p className="text-xs text-amber-600">{locationError}</p>
                      ) : locationAddress ? (
                        <p className="text-sm text-gray-700">{locationAddress}</p>
                      ) : selectedTeam.currentLocation?.coordinates?.length === 2 ? (
                        <p className="text-xs text-gray-500 font-mono">
                          {selectedTeam.currentLocation.coordinates[1].toFixed(5)}, {selectedTeam.currentLocation.coordinates[0].toFixed(5)}
                        </p>
                      ) : (
                        <p className="text-sm text-gray-300">Chưa có vị trí.</p>
                      )}
                    </div>
                    {selectedTeam.currentLocation?.coordinates?.length === 2 && (
                      <div className="flex items-center gap-2 shrink-0">
                        <a
                          href={`https://www.google.com/maps?q=${selectedTeam.currentLocation.coordinates[1]},${selectedTeam.currentLocation.coordinates[0]}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg border border-blue-100 transition-colors cursor-pointer"
                        >
                          <MapPin className="w-3.5 h-3.5" />
                          Google Maps
                        </a>
                        <button type="button"
                          onClick={() => navigate("/manager/rescue-map", {
                            state: {
                              lat: selectedTeam.currentLocation.coordinates[1],
                              lng: selectedTeam.currentLocation.coordinates[0],
                            },
                          })}
                          className="inline-flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg border border-gray-200 transition-colors cursor-pointer">
                          <MapPin className="w-3.5 h-3.5" />
                          Bản đồ hệ thống
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                {/* Members list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5" /> Thành viên
                    </h4>
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

                {/* Vehicles list */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <h4 className="text-xs font-semibold text-gray-400 uppercase tracking-wider flex items-center gap-1.5">
                      <CarFront className="w-3.5 h-3.5" /> Phương tiện
                    </h4>
                    <span className="text-xs text-gray-400">{selectedTeam.vehicles?.length || 0} phương tiện</span>
                  </div>
                  {selectedTeam.vehicles?.length ? (
                    <div className="max-h-40 overflow-y-auto rounded-2xl border border-gray-100 bg-gray-50/60 divide-y divide-gray-100">
                      {selectedTeam.vehicles.map((v) => (
                        <div key={resolveVehicleId(v)} className="px-3 py-2 flex items-center justify-between">
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

                {/* Timestamps */}
                <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 border-t border-gray-100 pt-3">
                  <div className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-300" />
                    <span>Tạo: {selectedTeam.createdAt ? new Date(selectedTeam.createdAt).toLocaleString("vi-VN") : "—"}</span>
                  </div>
                  <div className="inline-flex items-center gap-1.5">
                    <Clock className="w-3.5 h-3.5 text-gray-300" />
                    <span>Cập nhật: {selectedTeam.updatedAt ? new Date(selectedTeam.updatedAt).toLocaleString("vi-VN") : "—"}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
  );
}