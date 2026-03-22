import React, { useCallback, useEffect, useMemo, useState } from "react";
import { AdminLayout } from "@/components/ui/AdminSidebar";
import {
  FileText,
  Download,
  Printer,
  RefreshCw,
  Loader2,
  AlertTriangle,
  Users,
  HeartPulse,
  CarFront,
  ToolCase,
  Bell,
  Package,
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
} from "recharts";
import { getRescueTeams } from "@/services/rescue-team.service";
import { getVehicles } from "@/services/vehicle.service";
import { getInventoryItems } from "@/services/inventory.service";
import { getRescueRequests } from "@/services/rescue-request.service";
import { getUsers } from "@/services/user.service";
import type { RescueRequest } from "@/types/rescue-requests";
import { loadSystemParams } from "@/lib/admin-config-storage";

const REQUEST_STATUS_LABEL: Record<string, string> = {
  PENDING: "Chờ xử lý",
  VERIFIED: "Đã xác minh",
  IN_PROGRESS: "Đang xử lý",
  COMPLETED: "Hoàn thành",
  CANCELLED: "Đã hủy",
};

const URGENCY_LABEL: Record<string, string> = {
  LOW: "Thấp",
  MEDIUM: "Trung bình",
  HIGH: "Cao",
  CRITICAL: "Khẩn cấp",
};

const CHART_COLORS = ["#2563eb", "#16a34a", "#ca8a04", "#9333ea", "#dc2626", "#64748b"];

function startOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function endOfDay(d: Date) {
  const x = new Date(d);
  x.setHours(23, 59, 59, 999);
  return x;
}

function parseDate(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

export default function AdminOperationsReport() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [teams, setTeams] = useState<Awaited<ReturnType<typeof getRescueTeams>>>([]);
  const [vehicles, setVehicles] = useState<Awaited<ReturnType<typeof getVehicles>>>([]);
  const [inventory, setInventory] = useState<Awaited<ReturnType<typeof getInventoryItems>>>([]);
  const [requests, setRequests] = useState<RescueRequest[]>([]);
  const [userCount, setUserCount] = useState<number | null>(null);

  const [fromDate, setFromDate] = useState(() => {
    const p = loadSystemParams();
    const d = new Date();
    d.setDate(d.getDate() - p.reportDefaultDays);
    return d.toISOString().slice(0, 10);
  });
  const [toDate, setToDate] = useState(() => new Date().toISOString().slice(0, 10));

  const loadAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [t, v, inv, req, users] = await Promise.all([
        getRescueTeams(),
        getVehicles(),
        getInventoryItems(),
        getRescueRequests(),
        getUsers().catch(() => []),
      ]);
      setTeams(t ?? []);
      setVehicles(v ?? []);
      setInventory(inv ?? []);
      setRequests(Array.isArray(req) ? req : []);
      setUserCount(Array.isArray(users) ? users.length : null);
    } catch (e: unknown) {
      setError(
        (e as { response?: { data?: { message?: string } } })?.response?.data?.message ||
          (e as Error)?.message ||
          "Không thể tải dữ liệu báo cáo.",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const rangeStart = useMemo(() => startOfDay(parseDate(fromDate) ?? new Date()), [fromDate]);
  const rangeEnd = useMemo(() => endOfDay(parseDate(toDate) ?? new Date()), [toDate]);

  const requestsInRange = useMemo(() => {
    return requests.filter((r) => {
      const c = r.createdAt ? new Date(r.createdAt) : null;
      if (!c || Number.isNaN(c.getTime())) return false;
      return c >= rangeStart && c <= rangeEnd;
    });
  }, [requests, rangeStart, rangeEnd]);

  const completedInRange = useMemo(
    () => requestsInRange.filter((r) => r.status === "COMPLETED").length,
    [requestsInRange],
  );

  const statusChartData = useMemo(() => {
    const map = new Map<string, number>();
    requestsInRange.forEach((r) => {
      const k = String(r.status || "UNKNOWN");
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: REQUEST_STATUS_LABEL[name] ?? name,
      value,
    }));
  }, [requestsInRange]);

  const urgencyChartData = useMemo(() => {
    const map = new Map<string, number>();
    requestsInRange.forEach((r) => {
      const k = r.urgencyLevel || "UNKNOWN";
      map.set(k, (map.get(k) ?? 0) + 1);
    });
    return Array.from(map.entries()).map(([name, value]) => ({
      name: URGENCY_LABEL[name] ?? name,
      value,
    }));
  }, [requestsInRange]);

  const inventoryTotalQty = useMemo(
    () => inventory.reduce((s, i) => s + (i.quantity ?? 0), 0),
    [inventory],
  );

  const orgName = loadSystemParams().organizationName;

  const exportCsv = () => {
    const lines: string[] = [];
    lines.push(`Báo cáo tổng hợp cứu trợ — ${orgName}`);
    lines.push(`Kỳ báo cáo,${fromDate},${toDate}`);
    lines.push("");
    lines.push("Chỉ số,Số liệu");
    lines.push(`Tổng yêu cầu (trong kỳ),${requestsInRange.length}`);
    lines.push(`Yêu cầu hoàn thành (trong kỳ),${completedInRange}`);
    lines.push(`Đội cứu hộ (toàn hệ thống),${teams.length}`);
    lines.push(`Phương tiện (toàn hệ thống),${vehicles.length}`);
    lines.push(`Tổng tồn kho (số lượng),${inventoryTotalQty}`);
    lines.push(`Người dùng (ước lượng),${userCount ?? "N/A"}`);
    lines.push("");
    lines.push("Trạng thái yêu cầu (trong kỳ),Số lượng");
    statusChartData.forEach((r) => lines.push(`${r.name},${r.value}`));
    const blob = new Blob(["\uFEFF" + lines.join("\n")], { type: "text/csv;charset=utf-8" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `bao-cao-cuu-tro-${fromDate}_${toDate}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const handlePrint = () => window.print();

  return (
    <AdminLayout>
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8 print:bg-white print:p-4">
        <div className="max-w-6xl mx-auto space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 print:hidden">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Báo cáo cứu trợ & hoạt động</h1>
                <p className="text-sm text-gray-500 mt-0.5">
                  Tổng hợp yêu cầu, đội, phương tiện và tồn kho theo khoảng thời gian
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={loadAll}
                disabled={loading}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />
                Làm mới
              </button>
              <button
                type="button"
                onClick={exportCsv}
                disabled={loading || !!error}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl disabled:opacity-50"
              >
                <Download className="w-4 h-4" />
                Xuất CSV
              </button>
              <button
                type="button"
                onClick={handlePrint}
                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-200 rounded-xl hover:bg-gray-50"
              >
                <Printer className="w-4 h-4" />
                In báo cáo
              </button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap items-end gap-4 p-4 bg-white rounded-2xl border border-gray-100 shadow-sm print:hidden">
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase mb-1">Từ ngày</label>
              <input
                id="report-from-date"
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl"
                aria-label="Từ ngày"
              />
            </div>
            <div>
              <label htmlFor="report-to-date" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Đến ngày</label>
              <input
                id="report-to-date"
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="px-3 py-2 text-sm border border-gray-200 rounded-xl"
                aria-label="Đến ngày"
              />
            </div>
            <p className="text-xs text-gray-400 pb-2">
              Lọc theo <strong>ngày tạo</strong> yêu cầu cứu hộ
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-gray-400">
              <Loader2 className="w-10 h-10 animate-spin text-blue-600 mb-3" />
              <p className="text-sm">Đang tải dữ liệu...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-3 p-4 rounded-2xl bg-red-50 border border-red-100 text-red-800">
              <AlertTriangle className="w-6 h-6 shrink-0" />
              <p>{error}</p>
            </div>
          ) : (
            <>
              <div className="text-center print:block hidden print:mb-6">
                <h2 className="text-xl font-bold">{orgName}</h2>
                <p className="text-sm text-gray-600">
                  Báo cáo từ {fromDate} đến {toDate}
                </p>
              </div>

              {/* KPI cards */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-blue-600 mb-2">
                    <Bell className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase text-gray-500">Yêu cầu (kỳ)</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{requestsInRange.length}</p>
                  <p className="text-xs text-gray-400 mt-1">Hoàn thành: {completedInRange}</p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-emerald-600 mb-2">
                    <HeartPulse className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase text-gray-500">Đội cứu hộ</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{teams.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Sẵn sàng: {teams.filter((t) => t.status === "AVAILABLE").length}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-indigo-600 mb-2">
                    <CarFront className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase text-gray-500">Phương tiện</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{vehicles.length}</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Đang dùng: {vehicles.filter((v) => v.status === "IN_USE").length}
                  </p>
                </div>
                <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center gap-2 text-amber-600 mb-2">
                    <ToolCase className="w-5 h-5" />
                    <span className="text-xs font-semibold uppercase text-gray-500">Tồn kho</span>
                  </div>
                  <p className="text-2xl font-bold text-gray-900">{inventoryTotalQty.toLocaleString("vi-VN")}</p>
                  <p className="text-xs text-gray-400 mt-1">{inventory.length} mặt hàng</p>
                </div>
              </div>

              {userCount !== null && (
                <div className="flex items-center gap-3 p-4 bg-white rounded-2xl border border-gray-100 text-sm text-gray-600">
                  <Users className="w-5 h-5 text-gray-400" />
                  <span>
                    Tổng người dùng trong hệ thống: <strong className="text-gray-900">{userCount}</strong>
                  </span>
                </div>
              )}

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Yêu cầu theo trạng thái (trong kỳ)</h3>
                  {statusChartData.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">Không có dữ liệu trong kỳ</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={statusChartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                          <CartesianGrid strokeDasharray="3 3" className="stroke-gray-100" />
                          <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" height={70} />
                          <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                          <Tooltip formatter={(v: number) => [v, "Số lượng"]} />
                          <Bar dataKey="value" fill="#2563eb" radius={[6, 6, 0, 0]} name="Yêu cầu" />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>

                <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm">
                  <h3 className="text-sm font-bold text-gray-900 mb-4">Mức độ khẩn (trong kỳ)</h3>
                  {urgencyChartData.length === 0 ? (
                    <p className="text-sm text-gray-400 py-8 text-center">Không có dữ liệu trong kỳ</p>
                  ) : (
                    <div className="h-[280px] w-full">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={urgencyChartData}
                            cx="50%"
                            cy="50%"
                            innerRadius={50}
                            outerRadius={85}
                            paddingAngle={2}
                            dataKey="value"
                            nameKey="name"
                            label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                          >
                            {urgencyChartData.map((_, i) => (
                              <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip formatter={(v: number) => [v, "Yêu cầu"]} />
                          <Legend />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  )}
                </div>
              </div>

              <div className="p-5 bg-white rounded-2xl border border-gray-100 shadow-sm print:break-inside-avoid">
                <h3 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                  <Package className="w-4 h-4" />
                  Tóm tắt điều hành
                </h3>
                <ul className="text-sm text-gray-600 space-y-2 list-disc list-inside">
                  <li>
                    Trong khoảng thời gian đã chọn, hệ thống ghi nhận{" "}
                    <strong>{requestsInRange.length}</strong> yêu cầu cứu hộ, trong đó{" "}
                    <strong>{completedInRange}</strong> đã hoàn thành.
                  </li>
                  <li>
                    Nguồn lực hiện có: <strong>{teams.length}</strong> đội,{" "}
                    <strong>{vehicles.length}</strong> phương tiện, tổng số lượng tồn kho ước tính{" "}
                    <strong>{inventoryTotalQty.toLocaleString("vi-VN")}</strong> đơn vị.
                  </li>
                  <li>Báo cáo có thể xuất CSV hoặc in để lưu hồ sơ.</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </AdminLayout>
  );
}
