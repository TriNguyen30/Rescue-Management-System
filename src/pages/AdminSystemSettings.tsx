import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/components/ui/AdminSidebar";
import {
  Settings,
  Tags,
  Sliders,
  Plus,
  Trash2,
  Save,
  Loader2,
  Info,
} from "lucide-react";
import { useToast } from "@/components/ui/Toast";
import {
  loadCategories,
  saveCategories,
  loadSystemParams,
  saveSystemParams,
  DEFAULT_INVENTORY_CATEGORIES,
  type SystemParameters,
} from "@/lib/admin-config-storage";

export default function AdminSystemSettings() {
  const { success, error: toastError } = useToast();
  const [categories, setCategories] = useState<string[]>([]);
  const [newCat, setNewCat] = useState("");
  const [params, setParams] = useState<SystemParameters | null>(null);
  const [saving, setSaving] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    setCategories(loadCategories());
    setParams(loadSystemParams());
    setLoaded(true);
  }, []);

  const updateParam = <K extends keyof SystemParameters>(key: K, value: SystemParameters[K]) => {
    setParams((p) => (p ? { ...p, [key]: value } : p));
  };

  const handleSaveCategories = () => {
    try {
      saveCategories(categories);
      success("Đã lưu danh mục", "Danh sách danh mục vật tư đã được cập nhật.");
    } catch (e) {
      toastError("Lỗi", "Không thể lưu danh mục.");
    }
  };

  const handleSaveParams = async () => {
    if (!params) return;
    setSaving(true);
    try {
      saveSystemParams(params);
      success("Đã lưu tham số", "Cấu hình hệ thống đã được ghi nhận trên trình duyệt.");
    } catch (e) {
      toastError("Lỗi", "Không thể lưu tham số.");
    } finally {
      setSaving(false);
    }
  };

  const addCategory = () => {
    const t = newCat.trim();
    if (!t || categories.includes(t)) return;
    setCategories((c) => [...c, t]);
    setNewCat("");
  };

  const removeCategory = (idx: number) => {
    setCategories((c) => c.filter((_, i) => i !== idx));
  };

  const resetCategoriesDefault = () => {
    setCategories([...DEFAULT_INVENTORY_CATEGORIES]);
  };

  if (!loaded || !params) {
    return (
      <AdminLayout>
        <div className="min-h-[40vh] flex items-center justify-center text-gray-400">
          <Loader2 className="w-8 h-8 animate-spin" />
        </div>
      </AdminLayout>
    );
  }

  return (
      <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="flex items-start gap-3">
            <div className="w-11 h-11 rounded-2xl bg-blue-100 text-blue-700 flex items-center justify-center shrink-0">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Cấu hình hệ thống</h1>
              <p className="text-sm text-gray-500 mt-0.5">
                Danh mục vật tư và tham số vận hành (lưu cục bộ trên trình duyệt)
              </p>
            </div>
          </div>

          <div className="flex items-start gap-2 p-4 rounded-2xl bg-amber-50 border border-amber-100 text-sm text-amber-900">
            <Info className="w-5 h-5 shrink-0 mt-0.5" />
            <p>
              Dữ liệu được lưu trong <strong>localStorage</strong> của trình duyệt. Khi có API cấu hình từ
              backend, có thể thay thế phần lưu trữ này mà không đổi giao diện.
            </p>
          </div>

          {/* Categories */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Tags className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Danh mục vật tư / cứu trợ</h2>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Dùng làm gợi ý khi phân loại tồn kho và báo cáo. Thêm, xóa hoặc khôi phục mặc định.
              </p>
              <ul className="space-y-2">
                {categories.map((c, idx) => (
                  <li
                    key={`${c}-${idx}`}
                    className="flex items-center justify-between gap-3 px-3 py-2 rounded-xl bg-gray-50 border border-gray-100"
                  >
                    <span className="text-sm font-medium text-gray-800">{c}</span>
                    <button
                      type="button"
                      onClick={() => removeCategory(idx)}
                      className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 transition-colors"
                      aria-label={`Xóa ${c}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap gap-2">
                <input
                  value={newCat}
                  onChange={(e) => setNewCat(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addCategory())}
                  placeholder="Tên danh mục mới..."
                  className="flex-1 min-w-[200px] px-3 py-2 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
                <button
                  type="button"
                  onClick={addCategory}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 rounded-xl"
                >
                  <Plus className="w-4 h-4" />
                  Thêm
                </button>
                <button
                  type="button"
                  onClick={resetCategoriesDefault}
                  className="px-4 py-2 text-sm font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl"
                >
                  Khôi phục mặc định
                </button>
                <button
                  type="button"
                  onClick={handleSaveCategories}
                  className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-blue-700 bg-blue-50 border border-blue-100 hover:bg-blue-100 rounded-xl"
                >
                  <Save className="w-4 h-4" />
                  Lưu danh mục
                </button>
              </div>
            </div>
          </section>

          {/* System parameters */}
          <section className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2">
              <Sliders className="w-5 h-5 text-blue-600" />
              <h2 className="text-lg font-bold text-gray-900">Tham số hệ thống</h2>
            </div>
            <div className="p-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label htmlFor="admin-org-name" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Tên tổ chức / chương trình</label>
                <input
                  id="admin-org-name"
                  value={params.organizationName}
                  onChange={(e) => updateParam("organizationName", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="admin-support-email" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Email hỗ trợ</label>
                <input
                  id="admin-support-email"
                  type="email"
                  value={params.supportEmail}
                  onChange={(e) => updateParam("supportEmail", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="admin-support-phone" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Điện thoại hỗ trợ</label>
                <input
                  id="admin-support-phone"
                  value={params.supportPhone}
                  onChange={(e) => updateParam("supportPhone", e.target.value)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="admin-relief-hotline" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Đường dây nóng cứu trợ</label>
                <input
                  id="admin-relief-hotline"
                  value={params.reliefHotline}
                  onChange={(e) => updateParam("reliefHotline", e.target.value)}
                  placeholder="VD: 1800-xxxx"
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="admin-map-zoom" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Mức zoom bản đồ mặc định</label>
                <input
                  id="admin-map-zoom"
                  type="number"
                  min={4}
                  max={18}
                  value={params.defaultMapZoom}
                  onChange={(e) => updateParam("defaultMapZoom", Number(e.target.value) || 12)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="admin-items-per-page" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Số mục / trang (danh sách)</label>
                <input
                  id="admin-items-per-page"
                  type="number"
                  min={5}
                  max={100}
                  value={params.itemsPerPage}
                  onChange={(e) => updateParam("itemsPerPage", Number(e.target.value) || 10)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div>
                <label htmlFor="admin-report-days" className="block text-xs font-semibold text-gray-500 uppercase mb-1">Báo cáo: số ngày mặc định</label>
                <input
                  id="admin-report-days"
                  type="number"
                  min={1}
                  max={365}
                  value={params.reportDefaultDays}
                  onChange={(e) => updateParam("reportDefaultDays", Number(e.target.value) || 30)}
                  className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex items-center gap-3 p-4 rounded-xl bg-gray-50 border border-gray-100">
                <input
                  id="public_map"
                  type="checkbox"
                  checked={params.enablePublicRescueMap}
                  onChange={(e) => updateParam("enablePublicRescueMap", e.target.checked)}
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="public_map" className="text-sm text-gray-700 cursor-pointer">
                  Cho phép hiển thị bản đồ cứu hộ công khai (theo chính sách sản phẩm)
                </label>
              </div>
            </div>
            <div className="px-5 pb-5">
              <button
                type="button"
                onClick={handleSaveParams}
                disabled={saving}
                className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-300 rounded-xl"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                Lưu tham số hệ thống
              </button>
            </div>
          </section>
        </div>
      </div>
  );
}
