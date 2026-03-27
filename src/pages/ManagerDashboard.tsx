import React, { useCallback, useEffect, useMemo, useState } from "react";
import { ManagerLayout } from "@/components/ui/ManagerSidebar";
import {
  LayoutDashboard,
  HeartPulse,
  CarFront,
  ToolCase,
  Bell,
  Loader2,
  AlertTriangle,
  RefreshCw,
  TrendingUp,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import { getRescueTeams } from "@/services/rescue-team.service";
import { getVehicles } from "@/services/vehicle.service";
import { getInventoryItems } from "@/services/inventory.service";
import { getRescueRequests } from "@/services/rescue-request.service";
import type { RescueTeam } from "@/types/rescue-teams";
import type { VehicleItem } from "@/types/vehicle";
import type { InventoryItem } from "@/types/inventory";
import type { RescueRequest } from "@/types/rescue-requests";

const TEAM_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Sẵn sàng",
  BUSY: "Đang bận",
  OFFLINE: "Ngoại tuyến",
};

const REQUEST_STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  VERIFIED: "Đã xác minh",
  IN_PROGRESS: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const VEHICLE_STATUS_LABEL: Record<string, string> = {
  AVAILABLE: "Sẵn sàng",
  IN_USE: "Đang dùng",
  MAINTENANCE: "Bảo trì",
};

const CHART_COLORS = ["#3b82f6", "#10b981", "#f59e0b", "#8b5cf6", "#ec4899", "#64748b"];

function countBy<T>(items: T[], keyFn: (t: T) => string): { name: string; value: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const k = keyFn(item) || "Khác";
    map.set(k, (map.get(k) ?? 0) + 1);
  }
  return Array.from(map.entries()).map(([name, value]) => ({ name, value }));
}

function aggregateInventoryByCategory(items: InventoryItem[]): { name: string; quantity: number }[] {
  const map = new Map<string, number>();
  for (const item of items) {
    const cat = item.category?.trim() || "Không phân loại";
    map.set(cat, (map.get(cat) ?? 0) + (item.quantity ?? 0));
  }
  return Array.from(map.entries())
    .map(([name, quantity]) => ({ name, quantity }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 8);
}

export default function ManagerDashboard() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [requests, setRequests] = useState<RescueRequest[]>([]);

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    const results = await Promise.allSettled([
      getRescueTeams(),
      getVehicles(),
      getInventoryItems(),
      getRescueRequests(),
    ]);

    const errs: string[] = [];
    if (results[0].status === "fulfilled") setTeams(results[0].value);
    else errs.push("đội cứu hộ");
    if (results[1].status === "fulfilled") setVehicles(results[1].value);
    else errs.push("phương tiện");
    if (results[2].status === "fulfilled") setInventory(results[2].value);
    else errs.push("kho vật tư");
    if (results[3].status === "fulfilled") setRequests(results[3].value);
    else errs.push("yêu cầu cứu hộ");

    if (errs.length === 4) {
      setError("Không thể tải dữ liệu thống kê. Vui lòng thử lại.");
    } else if (errs.length > 0) {
      setError(`Một số nguồn dữ liệu không tải được: ${errs.join(", ")}.`);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const teamChartData = useMemo(() => {
    const raw = countBy(teams, (t) => t.status || "UNKNOWN");
    return raw.map((d) => ({
      ...d,
      label: TEAM_STATUS_LABEL[d.name] ?? d.name,
    }));
  }, [teams]);

  const vehicleChartData = useMemo(() => {
    const raw = countBy(vehicles, (v) => v.status || "UNKNOWN");
    return raw.map((d) => ({
      ...d,
      label: VEHICLE_STATUS_LABEL[d.name] ?? d.name,
    }));
  }, [vehicles]);

  const requestChartData = useMemo(() => {
    const raw = countBy(requests, (r) => String(r.status || "UNKNOWN"));
    return raw.map((d) => ({
      ...d,
      label: REQUEST_STATUS_LABEL[d.name] ?? d.name,
    }));
  }, [requests]);

  const inventoryByCategory = useMemo(() => aggregateInventoryByCategory(inventory), [inventory]);

  const totalInventoryQty = useMemo(
    () => inventory.reduce((s, i) => s + (i.quantity ?? 0), 0),
    [inventory],
  );

  const vehicleUtilization = useMemo(() => {
    const total = vehicles.length || 1;
    const inUse = vehicles.filter((v) => v.status === "IN_USE").length;
    return Math.round((inUse / total) * 100);
  }, [vehicles]);

  const teamAvailability = useMemo(() => {
    const total = teams.length || 1;
    const avail = teams.filter((t) => t.status === "AVAILABLE").length;
    return Math.round((avail / total) * 100);
  }, [teams]);

  const pieDataTeams = useMemo(
    () => teamChartData.map((d) => ({ name: d.label, value: d.value })),
    [teamChartData],
  );

  return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-11 h-11 rounded-2xl bg-emerald-100 text-emerald-700 flex items-center justify-center shadow-sm">
                <LayoutDashboard className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Tổng quan vận hành</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Thống kê sử dụng nguồn lực: đội cứu hộ, phương tiện, kho và yêu cầu
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={loadAll}
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 shadow-sm transition-colors disabled:opacity-60 cursor-pointer"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
              Làm mới dữ liệu
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <p>{error}</p>
            </div>
          )}

          {loading ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-gray-500">
              <Loader2 className="w-10 h-10 animate-spin text-emerald-600" />
              <p className="text-sm">Đang tải thống kê...</p>
            </div>
          ) : (
            <>
              {/* KPI cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Đội cứu hộ</span>
                    <HeartPulse className="w-5 h-5 text-rose-500" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{teams.length}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Sẵn sàng: {teams.filter((t) => t.status === "AVAILABLE").length} · Đang bận:{" "}
                    {teams.filter((t) => t.status === "BUSY").length}
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Phương tiện</span>
                    <CarFront className="w-5 h-5 text-blue-500" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{vehicles.length}</p>
                  <p className="mt-1 text-xs text-gray-500 flex items-center gap-1">
                    <TrendingUp className="w-3.5 h-3.5" />
                    Tỷ lệ đang dùng: {vehicleUtilization}%
                  </p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Kho vật tư</span>
                    <ToolCase className="w-5 h-5 text-amber-500" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">
                    {totalInventoryQty.toLocaleString("vi-VN")}
                  </p>
                  <p className="mt-1 text-xs text-gray-500">{inventory.length} mặt hàng</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-semibold uppercase tracking-wider text-gray-400">Yêu cầu cứu hộ</span>
                    <Bell className="w-5 h-5 text-violet-500" />
                  </div>
                  <p className="mt-3 text-3xl font-bold text-gray-900">{requests.length}</p>
                  <p className="mt-1 text-xs text-gray-500">
                    Đang xử lý:{" "}
                    {requests.filter((r) => r.status === "IN_PROGRESS" || r.status === "VERIFIED").length}
                  </p>
                </div>
              </div>

              {/* Utilization strip */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Đội sẵn sàng (ước lượng)</h3>
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-emerald-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, teamAvailability)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">{teamAvailability}% đội ở trạng thái sẵn sàng</p>
                </div>
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-3">Phương tiện đang hoạt động</h3>
                  <div className="h-3 w-full rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500 transition-all duration-500"
                      style={{ width: `${Math.min(100, vehicleUtilization)}%` }}
                    />
                  </div>
                  <p className="mt-2 text-xs text-gray-500">
                    {vehicles.filter((v) => v.status === "IN_USE").length} / {vehicles.length} xe đang sử dụng
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Teams pie */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Trạng thái đội cứu hộ</h3>
                  <p className="text-xs text-gray-500 mb-4">Phân bổ theo trạng thái hoạt động</p>
                  {pieDataTeams.length === 0 ? (
                    <p className="text-sm text-gray-400 py-12 text-center">Chưa có dữ liệu đội</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={pieDataTeams}
                            cx="50%"
                            cy="50%"
                            innerRadius={56}
                            outerRadius={88}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) =>
                              `${name} ${(percent * 100).toFixed(0)}%`
                            }
                          >
                            {pieDataTeams.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => [v, "Số đội"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Vehicles bar */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Phương tiện theo trạng thái</h3>
                  <p className="text-xs text-gray-500 mb-4">Số lượng xe theo từng trạng thái</p>
                  {vehicleChartData.length === 0 ? (
                    <p className="text-sm text-gray-400 py-12 text-center">Chưa có phương tiện</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={vehicleChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                          <XAxis dataKey="label" tick={{ fontSize: 12 }} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => [v, "Xe"]} />
                          <Bar dataKey="value" fill="#3b82f6" radius={[6, 6, 0, 0]} name="Số lượng" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Requests area */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Yêu cầu cứu hộ theo trạng thái</h3>
                  <p className="text-xs text-gray-500 mb-4">Khối lượng yêu cầu theo từng giai đoạn xử lý</p>
                  {requestChartData.length === 0 ? (
                    <p className="text-sm text-gray-400 py-12 text-center">Chưa có yêu cầu</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={requestChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                              <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                          <XAxis dataKey="label" tick={{ fontSize: 11 }} interval={0} angle={-12} textAnchor="end" height={56} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => [v, "Yêu cầu"]} />
                          <Area
                            type="monotone"
                            dataKey="value"
                            stroke="#8b5cf6"
                            fillOpacity={1}
                            fill="url(#colorReq)"
                            name="Số lượng"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                {/* Inventory by category */}
                <div className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm">
                  <h3 className="text-sm font-semibold text-gray-800 mb-1">Tồn kho theo danh mục</h3>
                  <p className="text-xs text-gray-500 mb-4">Tổng số lượng (đơn vị theo từng mặt hàng)</p>
                  {inventoryByCategory.length === 0 ? (
                    <p className="text-sm text-gray-400 py-12 text-center">Chưa có dữ liệu kho</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart
                          data={inventoryByCategory}
                          layout="vertical"
                          margin={{ top: 8, right: 16, left: 8, bottom: 0 }}
                        >
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" horizontal={false} />
                          <XAxis type="number" tick={{ fontSize: 11 }} />
                          <YAxis type="category" dataKey="name" width={100} tick={{ fontSize: 11 }} />
                          <Tooltip formatter={(v: number) => [v.toLocaleString("vi-VN"), "Số lượng"]} />
                          <Bar dataKey="quantity" fill="#f59e0b" radius={[0, 6, 6, 0]} name="Tồn kho" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
  );
}
