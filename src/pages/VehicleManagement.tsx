import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  CarFront,
  Search,
  Plus,
  X,
  Loader2,
  AlertTriangle,
  Users,
  Hash,
  Calendar,
  Edit3,
  Trash2,
  Eye,
  Check,
  Tag,
  Clock,
  ToggleLeft,
  ToggleRight,
  FileText,
  TrendingUp,
} from "lucide-react";
import {
  getVehicles,
  createVehicle,
  updateVehicle,
  updateVehicleStatus,
  deleteVehicle,
} from "@/services/vehicle.service";
import {
  VehicleItem,
  CreateVehicleItemPayload,
  UpdateVehicleItemPayload,
} from "@/types/vehicle";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";

/** Resolve canonical id supporting both `id` and `_id`. */
const resolveId = (v: VehicleItem): string => (v.id ?? v._id)!;

// ── Constants ────────────────────────────────────────────────────────────────
const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Sẵn sàng",
  IN_USE: "Đang hoạt động",
  MAINTENANCE: "Bảo trì",
  BROKEN: "Hư hỏng",
};

const STATUS_COLORS: Record<string, { bg: string; text: string; dot: string }> = {
  AVAILABLE: { bg: "bg-emerald-50 border-emerald-100", text: "text-emerald-700", dot: "bg-emerald-500" },
  IN_USE: { bg: "bg-blue-50 border-blue-100", text: "text-blue-700", dot: "bg-blue-500" },
  MAINTENANCE: { bg: "bg-amber-50 border-amber-100", text: "text-amber-700", dot: "bg-amber-500" },
  BROKEN: { bg: "bg-red-50 border-red-100", text: "text-red-700", dot: "bg-red-500" },
};

type FormState = {
  name: string;
  plateNumber: string;
  type: string;
  capacity: number | string;
  status: string;
  assignedTeam: string;
  isActive: boolean;
};

const initialForm: FormState = {
  name: "",
  plateNumber: "",
  type: "",
  capacity: 1,
  status: "AVAILABLE",
  assignedTeam: "",
  isActive: true,
};

// ── StatusBadge ───────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: string }) {
  const meta = STATUS_COLORS[status] ?? STATUS_COLORS.AVAILABLE;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.bg} ${meta.text}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${meta.dot}`} />
      {STATUS_LABELS[status] ?? status}
    </span>
  );
}

// ── View Detail Modal ─────────────────────────────────────────────────────────
function ViewDetailModal({
  vehicle,
  onClose,
  onEdit,
}: {
  vehicle: VehicleItem;
  onClose: () => void;
  onEdit: () => void;
}) {
  const formatDate = (val?: string | null) =>
    val ? new Date(val).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" }) : "—";

  const VEHICLE_TYPE_OPTIONS = [
    { label: "Thuyền", value: "BOAT" },
    { label: "Xe hơi", value: "CAR" },
    { label: "Trực thăng", value: "HELICOPTER" },
    { label: "Xe tải", value: "TRUCK" },
    { label: "Xuồng", value: "CANOE" },
  ];

  const getVehicleTypeLabel = (value: string) => {
    const found = VEHICLE_TYPE_OPTIONS.find(v => v.value === value);
    return found ? found.label : value;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        {/* Header */}
        <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <CarFront className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chi tiết phương tiện</p>
              <h3 className="text-lg font-bold text-gray-900 leading-tight">{vehicle.plateNumber}</h3>
              {vehicle.name && <p className="text-sm text-gray-500">{vehicle.name}</p>}
            </div>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer mt-0.5">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-5">
          {/* Status highlight */}
          <div className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 border border-gray-100">
            <div>
              <p className="text-xs font-medium text-gray-500 mb-1">Trạng thái hiện tại</p>
              <StatusBadge status={vehicle.status} />
            </div>
            <div className="text-right">
              <p className="text-xs font-medium text-gray-500 mb-0.5">Sức chứa</p>
              <p className="text-2xl font-bold text-blue-600">
                {vehicle.capacity?.toLocaleString("vi-VN")}
                <span className="text-sm font-semibold text-gray-400 ml-1">chỗ / kg</span>
              </p>
            </div>
          </div>

          {/* Info grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Tag className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Loại xe</p>
                <p className="text-sm font-semibold text-gray-800">{getVehicleTypeLabel(vehicle.type) || "—"}</p>
              </div>
            </div>
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              <Users className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Đội phụ trách</p>
                <p className="text-sm font-semibold text-gray-800">
                  {vehicle.assignedTeamId?.teamName || "Chưa phân công"}
                </p>
              </div>
            </div>
            {vehicle.name && (
              <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Tên xe</p>
                  <p className="text-sm font-semibold text-gray-800">{vehicle.name}</p>
                </div>
              </div>
            )}
            <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
              {vehicle.isActive !== false
                ? <ToggleRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                : <ToggleLeft className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
              <div>
                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Hoạt động</p>
                <p className={`text-sm font-semibold ${vehicle.isActive !== false ? "text-emerald-600" : "text-gray-400"}`}>
                  {vehicle.isActive !== false ? "Đang hoạt động" : "Ngừng hoạt động"}
                </p>
              </div>
            </div>
          </div>

          {/* Timestamps */}
          <div className="flex flex-wrap items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100">
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5" />
              <span>Tạo: {formatDate(vehicle.createdAt)}</span>
            </div>
            {vehicle.updatedAt && vehicle.updatedAt !== vehicle.createdAt && (
              <div className="flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5" />
                <span>Cập nhật: {formatDate(vehicle.updatedAt)}</span>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2 pt-1">
            <button
              type="button"
              onClick={() => { onClose(); onEdit(); }}
              className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl transition-colors cursor-pointer"
            >
              <Edit3 className="w-4 h-4" />
              Chỉnh sửa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Edit Vehicle Modal ────────────────────────────────────────────────────────
function EditVehicleModal({
  vehicle,
  onClose,
  onSaved,
}: {
  vehicle: VehicleItem;
  onClose: () => void;
  onSaved: (updated: VehicleItem) => void;
}) {
  const [name, setName] = useState(vehicle.name ?? "");
  const [plateNumber, setPlateNumber] = useState(vehicle.plateNumber ?? "");
  const [type, setType] = useState(vehicle.type ?? "");
  const [capacity, setCapacity] = useState(String(vehicle.capacity ?? ""));
  const [status, setStatus] = useState(vehicle.status ?? "AVAILABLE");
  const [assignedTeam, setAssignedTeam] = useState(vehicle.assignedTeamId?.teamName ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const { success, error: toastError } = useToast();

  const VEHICLE_TYPE_OPTIONS = [
    { label: "Thuyền", value: "BOAT" },
    { label: "Xe hơi", value: "CAR" },
    { label: "Trực thăng", value: "HELICOPTER" },
    { label: "Xe tải", value: "TRUCK" },
    { label: "Xuồng", value: "CANOE" },
  ];

  const handleSave = async () => {
    if (!plateNumber.trim()) { setError("Vui lòng nhập biển số xe."); return; }
    if (!type.trim()) { setError("Vui lòng nhập loại xe."); return; }
    const capacityNumber = Number(capacity);
    if (!Number.isFinite(capacityNumber) || capacityNumber < 0) {
      setError("Sức chứa không hợp lệ."); return;
    }

    setSaving(true);
    setError("");
    try {
      // 1. Update main fields (no status here)
      const payload: UpdateVehicleItemPayload = {
        name: name.trim() || undefined,
        plateNumber: plateNumber.trim(),
        type: type.trim(),
        capacity: capacityNumber,
        assignedTeam: assignedTeam.trim() || undefined,
      };
      let updated = await updateVehicle(resolveId(vehicle), payload);

      // 2. Only call status API if it actually changed
      if (status !== vehicle.status) {
        updated = await updateVehicleStatus(resolveId(vehicle), { status });
      }

      onSaved(updated);
      onClose();
      success("Phương tiện đã được cập nhật thành công.");
    } catch (e: any) {
      const message = e?.response?.data?.message || "Cập nhật phương tiện thất bại.";
      setError(message);
      toastError(message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chỉnh sửa phương tiện</p>
            <h3 className="text-lg font-bold text-gray-900">{vehicle.plateNumber}</h3>
          </div>
          <button type="button" onClick={onClose}
            className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Tên xe <span className="text-gray-400 font-normal">(tuỳ chọn)</span>
              </label>
              <input value={name} onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                placeholder="VD: Xe cứu hộ số 1" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Biển số xe</label>
              <input value={plateNumber} onChange={(e) => setPlateNumber(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                placeholder="VD: 51F-123.45" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại xe</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition cursor-pointer">
                {VEHICLE_TYPE_OPTIONS.map((opt) => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sức chứa (người / kg)</label>
              <input type="number" min={0} value={capacity} onChange={(e) => setCapacity(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Trạng thái</label>
              {/* onChange only updates local state — API fires on Save */}
              <select value={status} onChange={(e) => setStatus(e.target.value)}
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition cursor-pointer">
                {Object.entries(STATUS_LABELS).map(([val, label]) => (
                  <option key={val} value={val}>{label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Đội phụ trách</label>
              <input value={assignedTeam} disabled
                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl bg-gray-50 cursor-not-allowed"
                placeholder="VD: Đội cứu hộ Q1" />
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
export default function VehicleManagement() {
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<FormState>(initialForm);
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState("");
  const [viewVehicle, setViewVehicle] = useState<VehicleItem | null>(null);
  const [editVehicle, setEditVehicle] = useState<VehicleItem | null>(null);
  const [deleteVehicleItem, setDeleteVehicleItem] = useState<VehicleItem | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const { success, error: toastError } = useToast();


  // ── Bulk selection state ──────────────────────────────────────────────────
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);
  const [bulkDeleting, setBulkDeleting] = useState(false);

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getVehicles();
      setVehicles(data ?? []);
    } catch (e: any) {
      setError(e?.response?.data?.message || e?.message || "Không thể tải danh sách phương tiện.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchVehicles(); }, [fetchVehicles]);

  const statuses = useMemo(() => {
    const set = new Set<string>();
    vehicles.forEach((v) => v.status && set.add(v.status));
    return Array.from(set);
  }, [vehicles]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return vehicles.filter((v) => {
      const matchSearch =
        !q ||
        v.plateNumber.toLowerCase().includes(q) ||
        v.type.toLowerCase().includes(q) ||
        v.name?.toLowerCase().includes(q) ||
        v.assignedTeam?.toLowerCase().includes(q);
      const matchStatus = statusFilter === "ALL" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, statusFilter]);

  // ── Checkbox helpers ──────────────────────────────────────────────────────
  const filteredIds = useMemo(() => filtered.map(resolveId), [filtered]);
  const allSelected = filteredIds.length > 0 && filteredIds.every(id => selectedIds.has(id));
  const someSelected = filteredIds.some(id => selectedIds.has(id));
  const selectedCount = filteredIds.filter(id => selectedIds.has(id)).length;

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.delete(id));
        return next;
      });
    } else {
      setSelectedIds(prev => {
        const next = new Set(prev);
        filteredIds.forEach(id => next.add(id));
        return next;
      });
    }
  };

  const toggleSelectOne = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // ── Bulk delete ───────────────────────────────────────────────────────────
  const handleBulkDelete = async () => {
    const ids = filteredIds.filter(id => selectedIds.has(id));
    if (!ids.length) return;

    setBulkDeleting(true);
    const failed: string[] = [];
    try {
      for (const id of ids) {
        try {
          await deleteVehicle(id);
        } catch {
          failed.push(id);
        }
      }
      setVehicles(prev =>
        prev.filter(v => !ids.includes(resolveId(v)) || failed.includes(resolveId(v)))
      );
      setSelectedIds(new Set());
      setBulkDeleteOpen(false);
      if (failed.length === 0) {
        success(`Đã xóa ${ids.length} phương tiện thành công.`);
      } else {
        toastError(`Xóa thành công ${ids.length - failed.length}/${ids.length} phương tiện. ${failed.length} phương tiện xóa thất bại.`);
      }
      fetchVehicles();
    } finally {
      setBulkDeleting(false);
    }
  };


  const handleOpenModal = () => { setForm(initialForm); setFormError(""); setModalOpen(true); };
  const handleChange = (field: keyof FormState, value: string | boolean) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");
    if (!form.plateNumber.trim()) { setFormError("Vui lòng nhập biển số xe."); return; }
    if (!form.type.trim()) { setFormError("Vui lòng nhập loại xe."); return; }
    const capacityNumber = Number(form.capacity);
    if (!Number.isFinite(capacityNumber) || capacityNumber < 0) { setFormError("Sức chứa không hợp lệ."); return; }

    const payload: CreateVehicleItemPayload = {
      name: form.name.trim() || undefined,
      plateNumber: form.plateNumber.trim(),
      type: form.type.trim(),
      capacity: capacityNumber,
    };

    setSubmitting(true);
    try {
      const created = await createVehicle(payload);
      setVehicles((prev) => [created, ...prev]);
      setModalOpen(false);
      success("Phương tiện đã được tạo thành công.");
      fetchVehicles();
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || "Không thể tạo phương tiện.";
      setFormError(message);
      toastError(message);
    } finally {
      setSubmitting(false);
    }
  };

  const patchVehicle = (updated: VehicleItem) =>
    setVehicles((prev) => prev.map((v) => resolveId(v) === resolveId(updated) ? updated : v));


  const confirmDelete = async () => {
    const item = deleteVehicleItem;
    const id = item ? resolveId(item) : null;
    if (!id || deletingId) return;

    setDeletingId(id);
    try {
      await deleteVehicle(id);
      setVehicles((prev) => prev.filter((v) => resolveId(v) !== id));
      setDeleteVehicleItem(null);
      success("Đã xóa phương tiện thành công.");
      fetchVehicles();
    } catch (e: any) {
      const message = e?.response?.data?.message || e?.message || "Xóa phương tiện thất bại.";
      toastError(message);
    } finally {
      setDeletingId(null);
    }
  };

  const totalCapacity = useMemo(() => vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0), [vehicles]);
  const inUseCount = useMemo(() => vehicles.filter((v) => v.status === "IN_USE").length, [vehicles]);

  const VEHICLE_TYPE_OPTIONS = [
    { label: "Thuyền", value: "BOAT" },
    { label: "Xe hơi", value: "CAR" },
    { label: "Trực thăng", value: "HELICOPTER" },
    { label: "Xe tải", value: "TRUCK" },
    { label: "Xuồng", value: "CANOE" },
  ];

  const getVehicleTypeLabel = (value: string) => {
    const found = VEHICLE_TYPE_OPTIONS.find(v => v.value === value);
    return found ? found.label : value;
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
              <CarFront className="w-5 h-5" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Quản lý phương tiện</h1>
              <p className="text-sm text-gray-400 mt-0.5">Theo dõi xe cứu hộ, trạng thái và đội phụ trách</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button onClick={fetchVehicles} disabled={loading}
              className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
              <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : "text-gray-400"}`} />
              Làm mới
            </button>
            <button onClick={handleOpenModal}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm transition-colors cursor-pointer">
              <Plus className="w-4 h-4" />
              Thêm phương tiện
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
              <CarFront className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Tổng số phương tiện</p>
              <p className="text-xl font-bold text-gray-900">{vehicles.length}</p>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Đang hoạt động</p>
              <p className="text-xl font-bold text-gray-900">{inUseCount}</p>
            </div>
          </div>
          <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
              <Hash className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xs text-gray-400">Tổng sức chứa</p>
              <p className="text-xl font-bold text-gray-900">{totalCapacity.toLocaleString("vi-VN")}</p>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input value={search} onChange={(e) => setSearch(e.target.value)}
              placeholder="Tìm theo biển số, tên xe, loại xe, đội phụ trách..."
              className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
            {search && (
              <button type="button" onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:inline">Lọc theo trạng thái</span>
            <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}
              className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer">
              <option value="ALL">Tất cả</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{STATUS_LABELS[s] ?? s}</option>
              ))}
            </select>
          </div>
        </div>

        {/* Bulk action bar — only shown when items are selected */}
        {selectedCount > 0 && (
          <div className="flex items-center justify-between gap-3 px-4 py-3 bg-red-50 border border-red-200 rounded-2xl">
            <div className="flex items-center gap-2.5">
              <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center shrink-0">
                <Check className="w-3.5 h-3.5 text-red-600" />
              </div>
              <span className="text-sm font-semibold text-red-700">
                Đã chọn {selectedCount} loại xe
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedIds(new Set())}
                className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors cursor-pointer"
              >
                Bỏ chọn
              </button>
              <button
                type="button"
                onClick={() => setBulkDeleteOpen(true)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-red-500 hover:bg-red-600 rounded-lg transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Xóa {selectedCount} mục
              </button>
            </div>
          </div>
        )}

        {/* Table */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          {loading ? (
            <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Đang tải danh sách phương tiện...</span>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-red-500 px-4 text-center">
              <AlertTriangle className="w-8 h-8" />
              <p className="text-sm">{error}</p>
              <button onClick={fetchVehicles} className="text-xs text-blue-500 hover:underline">Thử lại</button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
              <CarFront className="w-10 h-10 text-gray-200" />
              <p className="text-sm">Chưa có phương tiện nào phù hợp bộ lọc.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50/60">
                    {/* Select-all checkbox */}
                    <th className="w-10 px-4 py-3">
                      <input
                        type="checkbox"
                        checked={allSelected}
                        ref={(el) => {
                          if (el) el.indeterminate = someSelected && !allSelected;
                        }}
                        onChange={toggleSelectAll}
                        className="w-4 h-4 rounded border-gray-300 text-blue-500 accent-blue-500 cursor-pointer"
                        aria-label="Chọn tất cả"
                      />
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Biển số</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Loại xe</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Sức chứa</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Trạng thái</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Đội phụ trách</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày cập nhật</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Hành động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {filtered.map((v) => {
                    const id = resolveId(v);
                    const isChecked = selectedIds.has(id);
                    const isUpdating = Boolean(updatingStatus[id]);
                    return (
                      <tr
                        key={id}
                        className={`group transition-colors ${isChecked ? "bg-red-50/60 hover:bg-red-50" : "hover:bg-blue-50/40"}`}
                      >
                        {/* Row checkbox */}
                        <td className="w-10 px-4 py-3">
                          <input
                            type="checkbox"
                            checked={isChecked}
                            onChange={() => toggleSelectOne(id)}
                            className="w-4 h-4 rounded border-gray-300 text-blue-500 accent-blue-500 cursor-pointer"
                            aria-label={`Chọn ${v.name || "phương tiện"}`}
                          />
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex flex-col">
                            <span className="text-sm font-semibold text-gray-900">{v.plateNumber}</span>
                            {v.name && <span className="text-xs text-gray-400">{v.name}</span>}
                            {v.isActive === false && (
                              <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-400 border border-gray-200 w-fit mt-0.5">
                                Ngừng HĐ
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{getVehicleTypeLabel(v.type)}</td>
                        <td className="px-4 py-3 text-sm text-gray-700 hidden sm:table-cell">
                          {v.capacity?.toLocaleString("vi-VN")}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <StatusBadge status={v.status} />
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
                          {v.assignedTeamId ? v.assignedTeamId.teamName : <span className="text-gray-300">Chưa phân công</span>}
                        </td>
                        <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                          {v.updatedAt || v.createdAt ? (
                            <div className="inline-flex items-center gap-1.5">
                              <Calendar className="w-3.5 h-3.5 text-gray-300" />
                              <span>{new Date((v.updatedAt || v.createdAt) as string).toLocaleDateString("vi-VN")}</span>
                            </div>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              type="button"
                              onClick={() => setViewVehicle(v)}
                              aria-label="Xem chi tiết"
                              title="Xem chi tiết"
                              className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setEditVehicle(v)}
                              aria-label="Chỉnh sửa"
                              title="Chỉnh sửa"
                              className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setDeleteVehicleItem(v)}
                              aria-label="Xóa"
                              title="Xóa"
                              disabled={deletingId === id}
                              className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                            >
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

      {/* Create Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div>
                <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Phương tiện</p>
                <h3 className="text-lg font-bold text-gray-900">Thêm phương tiện mới</h3>
              </div>
              <button type="button" onClick={() => setModalOpen(false)}
                className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên xe <span className="text-gray-400 font-normal">(tuỳ chọn)</span></label>
                  <input value={form.name} onChange={(e) => handleChange("name", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    placeholder="VD: Xe cứu hộ số 1" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Biển số xe</label>
                  <input value={form.plateNumber} onChange={(e) => handleChange("plateNumber", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    placeholder="VD: 51F-123.45" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Loại xe</label>
                  <select value={form.type} onChange={(e) => handleChange("type", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl" >
                    <option value="">Chọn loại xe</option>
                    {VEHICLE_TYPE_OPTIONS.map((opt) => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">Sức chứa (người / kg)</label>
                  <input type="number" min={0} value={form.capacity} onChange={(e) => handleChange("capacity", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
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
                  className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-xl transition-colors cursor-pointer">
                  {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Plus className="w-4 h-4" />Lưu phương tiện</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* View Detail Modal */}
      {viewVehicle && (
        <ViewDetailModal
          vehicle={viewVehicle}
          onClose={() => setViewVehicle(null)}
          onEdit={() => setEditVehicle(viewVehicle)}
        />
      )}

      {/* Edit Modal */}
      {editVehicle && (
        <EditVehicleModal
          vehicle={editVehicle}
          onClose={() => setEditVehicle(null)}
          onSaved={(updated) => { patchVehicle(updated); setEditVehicle(null); fetchVehicles(); }}
        />
      )}

      {/* Delete confirmation modal */}
      <Modal
        open={!!deleteVehicleItem}
        onClose={() => { if (!deletingId) setDeleteVehicleItem(null); }}
        title="Xác nhận xóa phương tiện"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa phương tiện
            <span className="font-semibold text-gray-900"> {deleteVehicleItem?.plateNumber}</span>? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleteVehicleItem(null)} disabled={!!deletingId}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60 cursor-pointer">
              Hủy
            </button>
            <button type="button" onClick={confirmDelete} disabled={!!deletingId}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors cursor-pointer">
              {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
              {deletingId ? "Đang xóa..." : "Xóa"}
            </button>
          </div>
        </div>
      </Modal>

      {/* Bulk delete confirmation modal */}
      <Modal
        open={bulkDeleteOpen}
        onClose={() => { if (!bulkDeleting) setBulkDeleteOpen(false); }}
        title="Xác nhận xóa hàng loạt"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa
            <span className="font-semibold text-gray-900"> {selectedCount} vật tư</span> đã chọn? Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setBulkDeleteOpen(false)} disabled={bulkDeleting}
              className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60 cursor-pointer">
              Hủy
            </button>
            <button type="button" onClick={handleBulkDelete} disabled={bulkDeleting}
              className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors cursor-pointer">
              {bulkDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
              {bulkDeleting ? "Đang xóa..." : `Xóa ${selectedCount} mục`}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}