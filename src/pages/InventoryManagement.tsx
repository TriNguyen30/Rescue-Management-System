import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
    Boxes,
    Search,
    Plus,
    X,
    Loader2,
    Package,
    Layers,
    Hash,
    Calendar,
    AlertTriangle,
    Edit3,
    Check,
    TrendingUp,
    TrendingDown,
} from "lucide-react";
import {
    getInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    updateInventoryStock,
} from "@/services/inventory.service";
import { InventoryItem, CreateInventoryItemPayload, UpdateInventoryItemPayload } from "@/types/inventory";
import { ManagerLayout } from "@/components/ui/ManagerSidebar";

type FormState = {
    itemName: string;
    quantity: string;
    unit: string;
    category: string;
    description: string;
};

const initialForm: FormState = {
    itemName: "",
    quantity: "",
    unit: "",
    category: "",
    description: "",
};

// ── Edit Inventory Item Modal ─────────────────────────────────────────────────
function EditInventoryModal({
    item,
    onClose,
    onSaved,
}: {
    item: InventoryItem;
    onClose: () => void;
    onSaved: (updated: InventoryItem) => void;
}) {
    const [itemName, setItemName] = useState(item.itemName || "");
    const [quantity, setQuantity] = useState(String(item.quantity ?? ""));
    const [unit, setUnit] = useState(item.unit || "");
    const [category, setCategory] = useState(item.category || "");
    const [description, setDescription] = useState(item.description || "");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const handleSave = async () => {
        const quantityNumber = Number(quantity);
        if (!itemName.trim()) { setError("Vui lòng nhập tên vật tư."); return; }
        if (!Number.isFinite(quantityNumber) || quantityNumber < 0) { setError("Số lượng không hợp lệ."); return; }
        if (!unit.trim()) { setError("Vui lòng nhập đơn vị."); return; }

        setSaving(true);
        setError("");
        try {
            const payload: UpdateInventoryItemPayload = {
                itemName: itemName.trim(),
                quantity: quantityNumber,
                unit: unit.trim(),
                category: category.trim(),
                description: description.trim() || undefined,
            };
            const updated = await updateInventoryItem(item.id || item._id!, payload);
            onSaved(updated);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || "Cập nhật vật tư thất bại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chỉnh sửa vật tư</p>
                        <h3 className="text-lg font-bold text-gray-900">{item.itemName}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên vật tư</label>
                            <input value={itemName} onChange={(e) => setItemName(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                                placeholder="Ví dụ: Gạo, nước sạch..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng</label>
                            <input type="number" min={0} value={quantity} onChange={(e) => setQuantity(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Đơn vị</label>
                            <input value={unit} onChange={(e) => setUnit(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                                placeholder="Ví dụ: kg, thùng, chai..." />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
                            <input value={category} onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                                placeholder="Ví dụ: Lương thực, Thiết yếu" />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú / mô tả</label>
                        <textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition resize-none"
                            placeholder="Thông tin thêm về tình trạng, nơi lưu trữ..." />
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

// ── Update Stock Modal ────────────────────────────────────────────────────────
function UpdateStockModal({
    item,
    onClose,
    onSaved,
}: {
    item: InventoryItem;
    onClose: () => void;
    onSaved: (updated: InventoryItem) => void;
}) {
    const [amount, setAmount] = useState("");
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");

    const parsedAmount = Number(amount);
    const isValid = amount.trim() !== "" && Number.isFinite(parsedAmount) && parsedAmount !== 0;
    const preview = isValid ? item.quantity + parsedAmount : item.quantity;
    const isPositive = parsedAmount > 0;

    const handleSave = async () => {
        if (!isValid) { setError("Vui lòng nhập số lượng thay đổi (dương để nhập kho, âm để xuất kho)."); return; }
        if (preview < 0) { setError("Số lượng tồn kho không thể âm."); return; }

        setSaving(true);
        setError("");
        try {
            const updated = await updateInventoryStock(item.id || item._id!, parsedAmount);
            onSaved(updated);
            onClose();
        } catch (e: any) {
            setError(e?.response?.data?.message || "Cập nhật số lượng thất bại.");
        } finally {
            setSaving(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
                <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
                    <div>
                        <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Cập nhật tồn kho</p>
                        <h3 className="text-lg font-bold text-gray-900">{item.itemName}</h3>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="p-6 space-y-4">
                    {/* Current stock display */}
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-sm text-gray-500">Tồn kho hiện tại</span>
                        <span className="text-sm font-bold text-gray-900">
                            {item.quantity.toLocaleString("vi-VN")} {item.unit}
                        </span>
                    </div>

                    {/* Amount input */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                            Số lượng thay đổi
                            <span className="text-xs text-gray-400 font-normal ml-1.5">(+ nhập kho / − xuất kho)</span>
                        </label>
                        <input
                            type="number"
                            value={amount}
                            onChange={(e) => { setAmount(e.target.value); setError(""); }}
                            onKeyDown={(e) => e.key === "Enter" && handleSave()}
                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                            placeholder="Ví dụ: 50 hoặc -20"
                        />
                    </div>

                    {/* Preview */}
                    {isValid && (
                        <div className={`flex items-center justify-between p-3 rounded-xl border ${preview < 0 ? "bg-red-50 border-red-100" : isPositive ? "bg-emerald-50 border-emerald-100" : "bg-amber-50 border-amber-100"}`}>
                            <div className={`flex items-center gap-1.5 text-sm font-medium ${preview < 0 ? "text-red-600" : isPositive ? "text-emerald-600" : "text-amber-600"}`}>
                                {isPositive
                                    ? <TrendingUp className="w-4 h-4" />
                                    : <TrendingDown className="w-4 h-4" />}
                                {isPositive ? "Sau khi nhập kho" : "Sau khi xuất kho"}
                            </div>
                            <span className={`text-sm font-bold ${preview < 0 ? "text-red-600" : "text-gray-900"}`}>
                                {preview.toLocaleString("vi-VN")} {item.unit}
                            </span>
                        </div>
                    )}

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
                        <button type="button" onClick={handleSave} disabled={saving || !isValid || preview < 0}
                            className="flex-1 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white text-sm font-semibold py-2.5 rounded-xl flex items-center justify-center gap-2 transition-all cursor-pointer">
                            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            {saving ? "Đang lưu..." : "Xác nhận"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function InventoryManagement() {
    const [items, setItems] = useState<InventoryItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");
    const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
    const [modalOpen, setModalOpen] = useState(false);
    const [form, setForm] = useState<FormState>(initialForm);
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState("");
    const [editItem, setEditItem] = useState<InventoryItem | null>(null);
    const [stockItem, setStockItem] = useState<InventoryItem | null>(null);

    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getInventoryItems();
            setItems(data || []);
        } catch (e: any) {
            setError(e?.response?.data?.message || e?.message || "Không thể tải kho vật tư.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchItems(); }, [fetchItems]);

    const categories = useMemo(() => {
        const set = new Set<string>();
        items.forEach((item) => { if (item.category) set.add(item.category); });
        return Array.from(set);
    }, [items]);

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        return items.filter((item) => {
            const matchSearch =
                !q ||
                item.itemName.toLowerCase().includes(q) ||
                item.description?.toLowerCase().includes(q) ||
                item.unit.toLowerCase().includes(q);
            const matchCategory = categoryFilter === "ALL" || item.category === categoryFilter;
            return matchSearch && matchCategory;
        });
    }, [items, search, categoryFilter]);

    const handleOpenModal = () => { setForm(initialForm); setFormError(""); setModalOpen(true); };
    const handleChange = (field: keyof FormState, value: string) => setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        const quantityNumber = Number(form.quantity);
        if (!form.itemName.trim()) { setFormError("Vui lòng nhập tên vật tư."); return; }
        if (!Number.isFinite(quantityNumber) || quantityNumber < 0) { setFormError("Số lượng không hợp lệ."); return; }
        if (!form.unit.trim()) { setFormError("Vui lòng nhập đơn vị."); return; }

        const payload: CreateInventoryItemPayload = {
            itemName: form.itemName.trim(),
            quantity: quantityNumber,
            unit: form.unit.trim(),
            category: form.category.trim(),
            description: form.description.trim() || undefined,
        };
        setSubmitting(true);
        try {
            const created = await createInventoryItem(payload);
            setItems((prev) => [created, ...prev]);
            setModalOpen(false);
        } catch (e: any) {
            setFormError(e?.response?.data?.message || e?.message || "Không thể tạo vật tư.");
        } finally {
            setSubmitting(false);
        }
    };

    const patchItem = (updated: InventoryItem) =>
        setItems((prev) => prev.map((i) => (i.id || i._id) === (updated.id || updated._id) ? updated : i));

    return (
        <ManagerLayout>
            <div className="min-h-screen bg-gray-50 p-4 sm:p-6 lg:p-8">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center">
                                <Boxes className="w-5 h-5" />
                            </div>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">Quản lý kho vật tư</h1>
                                <p className="text-sm text-gray-400 mt-0.5">Theo dõi vật tư cứu trợ, số lượng và phân loại</p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2">
                            <button onClick={fetchItems} disabled={loading}
                                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-xl hover:bg-gray-50 transition-colors shadow-sm cursor-pointer">
                                <Loader2 className={`w-4 h-4 ${loading ? "animate-spin" : "text-gray-400"}`} />
                                Làm mới
                            </button>
                            <button onClick={handleOpenModal}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-blue-500 hover:bg-blue-600 rounded-xl shadow-sm transition-colors cursor-pointer">
                                <Plus className="w-4 h-4" />
                                Thêm vật tư
                            </button>
                        </div>
                    </div>

                    {/* Summary cards */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Package className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Tổng số vật tư</p>
                                <p className="text-xl font-bold text-gray-900">{items.length}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                                <Layers className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Số loại danh mục</p>
                                <p className="text-xl font-bold text-gray-900">{categories.length}</p>
                            </div>
                        </div>
                        <div className="p-4 bg-white rounded-2xl border border-gray-100 shadow-sm flex items-center gap-3">
                            <div className="w-9 h-9 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Hash className="w-5 h-5" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-400">Tổng số lượng (ước tính)</p>
                                <p className="text-xl font-bold text-gray-900">
                                    {items.reduce((sum, i) => sum + (i.quantity || 0), 0).toLocaleString("vi-VN")}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Filters */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex flex-col sm:flex-row gap-3 items-stretch sm:items-center">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input value={search} onChange={(e) => setSearch(e.target.value)}
                                placeholder="Tìm theo tên vật tư, mô tả, đơn vị..."
                                className="w-full pl-9 pr-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
                            {search && (
                                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 cursor-pointer">
                                    <X className="w-4 h-4" />
                                </button>
                            )}
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-400 hidden sm:inline">Lọc theo danh mục</span>
                            <select value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}
                                className="pl-3 pr-8 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white appearance-none transition cursor-pointer">
                                <option value="ALL">Tất cả</option>
                                {categories.map((c) => <option key={c} value={c}>{c}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* Table */}
                    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center gap-3 py-20 text-gray-400">
                                <Loader2 className="w-5 h-5 animate-spin" />
                                <span className="text-sm">Đang tải dữ liệu kho...</span>
                            </div>
                        ) : error ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-red-500 px-4 text-center">
                                <AlertTriangle className="w-8 h-8" />
                                <p className="text-sm">{error}</p>
                                <button onClick={fetchItems} className="text-xs text-blue-500 hover:underline">Thử lại</button>
                            </div>
                        ) : filtered.length === 0 ? (
                            <div className="flex flex-col items-center justify-center gap-3 py-16 text-gray-400">
                                <Package className="w-10 h-10 text-gray-200" />
                                <p className="text-sm">Chưa có vật tư nào phù hợp bộ lọc.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead>
                                        <tr className="border-b border-gray-100 bg-gray-50/60">
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Vật tư</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider">Số lượng</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden sm:table-cell">Đơn vị</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden md:table-cell">Danh mục</th>
                                            <th className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider hidden lg:table-cell">Ngày cập nhật</th>
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-28">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filtered.map((item) => (
                                            <tr key={item.id || item._id} className="group hover:bg-blue-50/40 transition-colors">
                                                <td className="px-4 py-3">
                                                    <div className="flex flex-col">
                                                        <span className="text-sm font-semibold text-gray-900">{item.itemName}</span>
                                                        {item.description && (
                                                            <span className="text-xs text-gray-400 line-clamp-1">{item.description}</span>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-700 font-medium">
                                                    {item.quantity.toLocaleString("vi-VN")}
                                                </td>
                                                <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{item.unit}</td>
                                                <td className="px-4 py-3 hidden md:table-cell">
                                                    {item.category ? (
                                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                            {item.category}
                                                        </span>
                                                    ) : (
                                                        <span className="text-xs text-gray-300">—</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-3 text-xs text-gray-400 hidden lg:table-cell">
                                                    {item.updatedAt || item.createdAt ? (
                                                        <div className="inline-flex items-center gap-1.5">
                                                            <Calendar className="w-3.5 h-3.5 text-gray-300" />
                                                            <span>{new Date((item.updatedAt || item.createdAt) as string).toLocaleDateString("vi-VN")}</span>
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
                                                            onClick={() => setStockItem(item)}
                                                            aria-label="Cập nhật tồn kho"
                                                            title="Cập nhật tồn kho"
                                                            className="p-1.5 rounded-lg hover:bg-indigo-100 text-gray-400 hover:text-indigo-600 transition-colors cursor-pointer"
                                                        >
                                                            <TrendingUp className="w-4 h-4" />
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setEditItem(item)}
                                                            aria-label="Chỉnh sửa vật tư"
                                                            title="Chỉnh sửa vật tư"
                                                            className="p-1.5 rounded-lg hover:bg-blue-100 text-gray-400 hover:text-blue-600 transition-colors cursor-pointer"
                                                        >
                                                            <Edit3 className="w-4 h-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
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
                                    <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Kho vật tư</p>
                                    <h3 className="text-lg font-bold text-gray-900">Thêm vật tư mới</h3>
                                </div>
                                <button onClick={() => setModalOpen(false)} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer">
                                    <X className="w-5 h-5" />
                                </button>
                            </div>
                            <form onSubmit={handleSubmit} className="p-6 space-y-4">
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Tên vật tư</label>
                                        <input value={form.itemName} onChange={(e) => handleChange("itemName", e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                                            placeholder="Ví dụ: Gạo, nước sạch..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Số lượng</label>
                                        <input type="number" min={0} value={form.quantity} onChange={(e) => handleChange("quantity", e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Đơn vị</label>
                                        <input value={form.unit} onChange={(e) => handleChange("unit", e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                                            placeholder="Ví dụ: kg, thùng, chai..." />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục (phân cách bằng dấu phẩy)</label>
                                        <input value={form.category} onChange={(e) => handleChange("category", e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                                            placeholder="Ví dụ: Lương thực, Thiết yếu" />
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1.5">Ghi chú / mô tả</label>
                                    <textarea rows={3} value={form.description} onChange={(e) => handleChange("description", e.target.value)}
                                        className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition resize-none"
                                        placeholder="Thông tin thêm về tình trạng, nơi lưu trữ..." />
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
                                        {submitting ? <><Loader2 className="w-4 h-4 animate-spin" />Đang lưu...</> : <><Plus className="w-4 h-4" />Lưu vật tư</>}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                {/* Edit Modal */}
                {editItem && (
                    <EditInventoryModal
                        item={editItem}
                        onClose={() => setEditItem(null)}
                        onSaved={(updated) => { patchItem(updated); setEditItem(null); }}
                    />
                )}

                {/* Update Stock Modal */}
                {stockItem && (
                    <UpdateStockModal
                        item={stockItem}
                        onClose={() => setStockItem(null)}
                        onSaved={(updated) => { patchItem(updated); setStockItem(null); }}
                    />
                )}
            </div>
        </ManagerLayout>
    );
}