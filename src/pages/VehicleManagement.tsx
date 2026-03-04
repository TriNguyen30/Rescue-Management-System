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
} from "lucide-react";
import { getVehicles, createVehicle } from "@/services/vehicle.service";
import { VehicleItem, CreateVehicleItemPayload } from "@/types/vehicle";
import { ManagerLayout } from "@/components/ui/ManagerSidebar";

type FormState = {
  plateNumber: string;
  type: string;
  capacity: string;
  status: string;
  assignedTeam: string;
};

const initialForm: FormState = {
  plateNumber: "",
  type: "",
  capacity: "",
  status: "AVAILABLE",
  assignedTeam: "",
};

const STATUS_LABELS: Record<string, string> = {
  AVAILABLE: "Sẵn sàng",
  IN_USE: "Đang hoạt động",
  MAINTENANCE: "Bảo trì",
  OUT_OF_SERVICE: "Ngừng hoạt động",
};

const STATUS_COLORS: Record<
  string,
  { bg: string; text: string; dot: string }
> = {
  AVAILABLE: {
    bg: "bg-emerald-50 border-emerald-100",
    text: "text-emerald-700",
    dot: "bg-emerald-500",
  },
  IN_USE: {
    bg: "bg-blue-50 border-blue-100",
    text: "text-blue-700",
    dot: "bg-blue-500",
  },
  MAINTENANCE: {
    bg: "bg-amber-50 border-amber-100",
    text: "text-amber-700",
    dot: "bg-amber-500",
  },
  OUT_OF_SERVICE: {
    bg: "bg-gray-50 border-gray-100",
    text: "text-gray-600",
    dot: "bg-gray-400",
  },
};

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

  const fetchVehicles = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const data = await getVehicles();
      setVehicles(data || []);
    } catch (e: any) {
      setError(
        e?.response?.data?.message ||
          e?.message ||
          "Không thể tải danh sách phương tiện."
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchVehicles();
  }, [fetchVehicles]);

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
        v.assignedTeam?.toLowerCase().includes(q);
      const matchStatus =
        statusFilter === "ALL" || v.status === statusFilter;
      return matchSearch && matchStatus;
    });
  }, [vehicles, search, statusFilter]);

  const handleOpenModal = () => {
    setForm(initialForm);
    setFormError("");
    setModalOpen(true);
  };

  const handleChange = (field: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!form.plateNumber.trim()) {
      setFormError("Vui lòng nhập biển số phương tiện.");
      return;
    }
    if (!form.type.trim()) {
      setFormError("Vui lòng nhập loại phương tiện.");
      return;
    }
    const capacityNumber = Number(form.capacity);
    if (!Number.isFinite(capacityNumber) || capacityNumber < 0) {
      setFormError("Sức chứa không hợp lệ.");
      return;
    }
    if (!form.status.trim()) {
      setFormError("Vui lòng chọn trạng thái.");
      return;
    }

    const payload: CreateVehicleItemPayload = {
      plateNumber: form.plateNumber.trim(),
      type: form.type.trim(),
      capacity: capacityNumber,
      status: form.status.trim(),
      assignedTeam: form.assignedTeam.trim() || undefined,
    };

    setSubmitting(true);
    try {
      const created = await createVehicle(payload);
      setVehicles((prev) => [created, ...prev]);
      setModalOpen(false);
    } catch (e: any) {
      setFormError(
        e?.response?.data?.message || e?.message || "Không thể tạo phương tiện."
      );
    } finally {
      setSubmitting(false);
    }
  };

  const totalCapacity = useMemo(
    () => vehicles.reduce((sum, v) => sum + (v.capacity || 0), 0),
    [vehicles]
  );

  const inUseCount = useMemo(
    () => vehicles.filter((v) => v.status === "IN_USE").length,
    [vehicles]
  );

  return (
    <ManagerLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                <CarFront className="w-5 h-5" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">
                  Quản lý phương tiện
                </h1>
                <p className="text-sm text-gray-400 mt-0.5">
                  Theo dõi xe cứu hộ, trạng thái và đội phụ trách
                </p>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={fetchVehicles}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm"
              >
                <Loader2
                  className={`w-4 h-4 ${
                    loading ? "animate-spin" : "text-gray-400"
                  }`}
                />
                Làm mới
              </button>
              <button
                onClick={handleOpenModal}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm transition-colors"
              >
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
                <p className="text-xl font-bold text-gray-900">
                  {vehicles.length}
                </p>
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
                <p className="text-xl font-bold text-gray-900">
                  {totalCapacity.toLocaleString("vi-VN")}
                </p>
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
                placeholder="Tìm theo biển số, loại xe, đội phụ trách..."
                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-400 hidden sm:inline">
                Lọc theo trạng thái
              </span>
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition"
                >
                  <option value="ALL">Tất cả</option>
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {STATUS_LABELS[s] || s}
                    </option>
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
                <span className="text-sm">Đang tải danh sách phương tiện...</span>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-red-500 px-4 text-center">
                <AlertTriangle className="w-8 h-8" />
                <p className="text-sm">{error}</p>
                <button
                  onClick={fetchVehicles}
                  className="text-xs text-blue-500 hover:underline"
                >
                  Thử lại
                </button>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                <CarFront className="w-10 h-10 text-gray-200" />
                <p className="text-sm">
                  Chưa có phương tiện nào phù hợp bộ lọc.
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50/60">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Biển số
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Loại xe
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">
                        Sức chứa
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">
                        Trạng thái
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">
                        Đội phụ trách
                      </th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">
                        Ngày cập nhật
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {filtered.map((v) => {
                      const meta = STATUS_COLORS[v.status] || STATUS_COLORS.AVAILABLE;
                      return (
                        <tr
                          key={v.id || v._id}
                          className="hover:bg-blue-50/40 transition-colors"
                        >
                          <td className="px-4 py-3 text-sm font-semibold text-gray-900">
                            {v.plateNumber}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {v.type}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700">
                            {v.capacity?.toLocaleString("vi-VN")}
                          </td>
                          <td className="px-4 py-3 hidden sm:table-cell">
                            <span
                              className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium border ${meta.bg} ${meta.text}`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${meta.dot}`}
                              />
                              {STATUS_LABELS[v.status] || v.status}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-700 hidden md:table-cell">
                            {v.assignedTeam || (
                              <span className="text-gray-300">Chưa phân công</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                            {v.updatedAt || v.createdAt ? (
                              <div className="inline-flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                <span>
                                  {new Date(
                                    (v.updatedAt || v.createdAt) as string
                                  ).toLocaleDateString("vi-VN")}
                                </span>
                              </div>
                            ) : (
                              <span className="text-gray-300">—</span>
                            )}
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
                  <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">
                    Phương tiện
                  </p>
                  <h3 className="text-lg font-bold text-gray-900">
                    Thêm phương tiện mới
                  </h3>
                </div>
                <button
                  onClick={() => setModalOpen(false)}
                  className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="p-6 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Biển số xe
                    </label>
                    <input
                      value={form.plateNumber}
                      onChange={(e) =>
                        handleChange("plateNumber", e.target.value)
                      }
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                      placeholder="VD: 51F-123.45"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Loại xe
                    </label>
                    <input
                      value={form.type}
                      onChange={(e) => handleChange("type", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                      placeholder="VD: Xe tải, xuồng cao tốc..."
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Sức chứa (người / kg)
                    </label>
                    <input
                      type="number"
                      min={0}
                      value={form.capacity}
                      onChange={(e) => handleChange("capacity", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Trạng thái
                    </label>
                    <select
                      value={form.status}
                      onChange={(e) => handleChange("status", e.target.value)}
                      className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    >
                      <option value="AVAILABLE">Sẵn sàng</option>
                      <option value="IN_USE">Đang hoạt động</option>
                      <option value="MAINTENANCE">Bảo trì</option>
                      <option value="OUT_OF_SERVICE">Ngừng hoạt động</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Đội phụ trách
                  </label>
                  <input
                    value={form.assignedTeam}
                    onChange={(e) =>
                      handleChange("assignedTeam", e.target.value)
                    }
                    className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                    placeholder="VD: Đội cứu hộ Q1"
                  />
                </div>

                {formError && (
                  <div className="flex items-center gap-2 text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-xl">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> {formError}
                  </div>
                )}

                <div className="flex justify-end gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setModalOpen(false)}
                    className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
                    disabled={submitting}
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 rounded-xl transition-colors"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Đang lưu...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4" />
                        Lưu phương tiện
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </ManagerLayout>
  );
}
