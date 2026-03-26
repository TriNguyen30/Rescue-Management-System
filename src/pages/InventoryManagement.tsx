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
    Trash2,
    Eye,
    Tag,
    FileText,
    ShieldAlert,
    ToggleLeft,
    ToggleRight,
    Clock,
} from "lucide-react";
import {
    getInventoryItems,
    createInventoryItem,
    updateInventoryItem,
    updateInventoryStock,
    deleteInventoryItem,
} from "@/services/inventory.service";
import { InventoryItem, CreateInventoryItemPayload, UpdateInventoryItemPayload } from "@/types/inventory";
import { ManagerLayout } from "@/components/ui/ManagerSidebar";
import { useToast } from "@/components/ui/Toast";
import Modal from "@/components/ui/Modal";

/** Resolve the canonical id from an InventoryItem (supports both `id` and `_id`). */
const resolveId = (item: InventoryItem): string => (item.id ?? item._id)!;

type FormState = {
    itemName: string;
    quantity: string;
    unit: string;
    category: string;
    description: string;
    lowStockThreshold: string;
    isActive: boolean;
};

const initialForm: FormState = {
    itemName: "",
    quantity: "",
    unit: "",
    category: "",
    description: "",
    lowStockThreshold: "",
    isActive: true,
};

// ── View Detail Modal ─────────────────────────────────────────────────────────
function ViewDetailModal({
    item,
    onClose,
    onEdit,
    onUpdateStock,
}: {
    item: InventoryItem;
    onClose: () => void;
    onEdit: () => void;
    onUpdateStock: () => void;
}) {
    const isLowStock = item.lowStockThreshold != null && item.quantity <= item.lowStockThreshold;

    const formatDate = (val?: string | null) =>
        val ? new Date(val).toLocaleString("vi-VN", { dateStyle: "medium", timeStyle: "short" }) : "—";

    const CATEGORY_OPTIONS = [
        { label: "Lương thực", value: "FOOD" },
        { label: "Nước", value: "WATER" },
        { label: "Y tế", value: "MEDICAL" },
        { label: "Thiết bị", value: "EQUIPMENT" },
        { label: "Quần áo", value: "CLOTHING" },
        { label: "Khác", value: "OTHER" },
    ];

    const getCategoryLabel = (value: string) => {
        const found = CATEGORY_OPTIONS.find(c => c.value === value);
        return found ? found.label : value;
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg">
                {/* Header */}
                <div className="flex items-start justify-between px-6 py-4 border-b border-gray-100">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                            <Package className="w-5 h-5" />
                        </div>
                        <div>
                            <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Chi tiết vật tư</p>
                            <h3 className="text-lg font-bold text-gray-900 leading-tight">{item.itemName}</h3>
                        </div>
                    </div>
                    <button type="button" onClick={onClose} className="p-2 rounded-xl hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors cursor-pointer mt-0.5">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Body */}
                <div className="p-6 space-y-5">
                    {/* Stock highlight */}
                    <div className={`flex items-center justify-between p-4 rounded-2xl border ${isLowStock ? "bg-amber-50 border-amber-200" : "bg-blue-50 border-blue-100"}`}>
                        <div>
                            <p className="text-xs font-medium text-gray-500 mb-0.5">Tồn kho hiện tại</p>
                            <p className={`text-3xl font-bold ${isLowStock ? "text-amber-600" : "text-blue-600"}`}>
                                {item.quantity.toLocaleString("vi-VN")}
                                <span className="text-base font-semibold ml-1.5">{item.unit}</span>
                            </p>
                        </div>
                        {isLowStock && (
                            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-100 text-amber-700 text-xs font-semibold">
                                <AlertTriangle className="w-3.5 h-3.5" />
                                Sắp hết hàng
                            </div>
                        )}
                    </div>

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <Tag className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Danh mục</p>
                                <p className="text-sm font-semibold text-gray-800">{getCategoryLabel(item.category) || "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <Hash className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Đơn vị</p>
                                <p className="text-sm font-semibold text-gray-800">{item.unit || "—"}</p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <ShieldAlert className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Ngưỡng cảnh báo</p>
                                <p className="text-sm font-semibold text-gray-800">
                                    {item.lowStockThreshold != null
                                        ? `${item.lowStockThreshold.toLocaleString("vi-VN")} ${item.unit}`
                                        : "Chưa đặt"}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            {item.isActive !== false
                                ? <ToggleRight className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                                : <ToggleLeft className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />}
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Trạng thái</p>
                                <p className={`text-sm font-semibold ${item.isActive !== false ? "text-emerald-600" : "text-gray-400"}`}>
                                    {item.isActive !== false ? "Đang hoạt động" : "Ngừng hoạt động"}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Description */}
                    {item.description && (
                        <div className="flex items-start gap-2.5 p-3 rounded-xl bg-gray-50 border border-gray-100">
                            <FileText className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                            <div>
                                <p className="text-[11px] text-gray-400 font-medium uppercase tracking-wider mb-0.5">Ghi chú / Mô tả</p>
                                <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.description}</p>
                            </div>
                        </div>
                    )}

                    {/* Timestamps */}
                    <div className="flex items-center gap-4 text-xs text-gray-400 pt-1 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                            <Clock className="w-3.5 h-3.5" />
                            <span>Tạo: {formatDate(item.createdAt)}</span>
                        </div>
                        {item.updatedAt && item.updatedAt !== item.createdAt && (
                            <div className="flex items-center gap-1.5">
                                <Clock className="w-3.5 h-3.5" />
                                <span>Cập nhật: {formatDate(item.updatedAt)}</span>
                            </div>
                        )}
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                        <button
                            type="button"
                            onClick={() => { onClose(); onUpdateStock(); }}
                            className="flex-1 inline-flex items-center justify-center gap-2 py-2.5 text-sm font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-xl transition-colors cursor-pointer"
                        >
                            <TrendingUp className="w-4 h-4" />
                            Cập nhật kho
                        </button>
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
    const [itemName, setItemName] = useState(item.itemName ?? "");
    const [quantity, setQuantity] = useState(String(item.quantity ?? ""));
    const [unit, setUnit] = useState(item.unit ?? "");
    const [category, setCategory] = useState(item.category ?? "");
    const [description, setDescription] = useState(item.description ?? "");
    const [lowStockThreshold, setLowStockThreshold] = useState(
        item.lowStockThreshold != null ? String(item.lowStockThreshold) : ""
    );
    const [isActive, setIsActive] = useState(item.isActive ?? true);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState("");
    const { success, error: toastError } = useToast();

    const CATEGORY_OPTIONS = [
        { label: "Lương thực", value: "FOOD" },
        { label: "Nước", value: "WATER" },
        { label: "Y tế", value: "MEDICAL" },
        { label: "Thiết bị", value: "EQUIPMENT" },
        { label: "Quần áo", value: "CLOTHING" },
        { label: "Khác", value: "OTHER" },
    ];

    const getCategoryLabel = (value: string) => {
        const found = CATEGORY_OPTIONS.find(c => c.value === value);
        return found ? found.label : value;
    };

    const handleSave = async () => {
        const quantityNumber = Number(quantity);
        if (!itemName.trim()) { setError("Vui lòng nhập tên vật tư."); return; }
        if (!Number.isFinite(quantityNumber) || quantityNumber < 0) { setError("Số lượng không hợp lệ."); return; }
        if (!unit.trim()) { setError("Vui lòng nhập đơn vị."); return; }

        const parsedThreshold = lowStockThreshold.trim() !== "" ? Number(lowStockThreshold) : undefined;
        if (parsedThreshold !== undefined && (!Number.isFinite(parsedThreshold) || parsedThreshold < 0)) {
            setError("Ngưỡng cảnh báo tồn kho không hợp lệ.");
            return;
        }

        setSaving(true);
        setError("");
        try {
            const payload: UpdateInventoryItemPayload = {
                itemName: itemName.trim(),
                quantity: quantityNumber,
                unit: unit.trim(),
                category: category.trim() as "FOOD" | "WATER" | "MEDICAL" | "EQUIPMENT" | "CLOTHING" | "OTHER",
                description: description.trim() || undefined,
                lowStockThreshold: parsedThreshold,
                isActive,
            };
            const updated = await updateInventoryItem(resolveId(item), payload);
            onSaved(updated);
            onClose();
            success("Vật tư đã được cập nhật thành công.");
        } catch (e: any) {
            const message = e?.response?.data?.message || "Cập nhật vật tư thất bại.";
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
                            <select value={category} onChange={(e) => setCategory(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                            >
                                <option value="">Chọn danh mục</option>
                                {CATEGORY_OPTIONS.map((c) => (
                                    <option key={c.value} value={c.value}>
                                        {c.label}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                Ngưỡng cảnh báo tồn kho
                                <span className="text-xs text-gray-400 font-normal ml-1">(tuỳ chọn)</span>
                            </label>
                            <input
                                type="number"
                                min={0}
                                value={lowStockThreshold}
                                onChange={(e) => setLowStockThreshold(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                                placeholder="Ví dụ: 10"
                            />
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
    const { success, error: toastError } = useToast();

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
            const updated = await updateInventoryStock(resolveId(item), parsedAmount);
            onSaved(updated);
            onClose();
            success("Cập nhật tồn kho thành công.");
        } catch (e: any) {
            const message = e?.response?.data?.message || "Cập nhật số lượng thất bại.";
            setError(message);
            toastError(message);
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
                    <div className="flex items-center justify-between p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <span className="text-sm text-gray-500">Tồn kho hiện tại</span>
                        <span className="text-sm font-bold text-gray-900">
                            {item.quantity.toLocaleString("vi-VN")} {item.unit}
                        </span>
                    </div>

                    {/* Low stock threshold hint */}
                    {item.lowStockThreshold != null && (
                        <div className={`flex items-center justify-between p-3 rounded-xl border ${item.quantity <= item.lowStockThreshold ? "bg-amber-50 border-amber-100" : "bg-gray-50 border-gray-100"}`}>
                            <span className="text-sm text-gray-500">Ngưỡng cảnh báo</span>
                            <span className={`text-sm font-semibold ${item.quantity <= item.lowStockThreshold ? "text-amber-600" : "text-gray-700"}`}>
                                {item.lowStockThreshold.toLocaleString("vi-VN")} {item.unit}
                            </span>
                        </div>
                    )}

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
    const [viewItem, setViewItem] = useState<InventoryItem | null>(null);
    const [stockItem, setStockItem] = useState<InventoryItem | null>(null);
    const [deleteItem, setDeleteItem] = useState<InventoryItem | null>(null);
    const [deletingId, setDeletingId] = useState<string | null>(null);
    const { success, error: toastError } = useToast();

    const fetchItems = useCallback(async () => {
        setLoading(true);
        setError("");
        try {
            const data = await getInventoryItems();
            setItems(data ?? []);
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
    const handleChange = (field: keyof FormState, value: string | boolean) =>
        setForm((prev) => ({ ...prev, [field]: value }));

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError("");
        const quantityNumber = Number(form.quantity);
        if (!form.itemName.trim()) { setFormError("Vui lòng nhập tên vật tư."); return; }
        if (!Number.isFinite(quantityNumber) || quantityNumber < 0) { setFormError("Số lượng không hợp lệ."); return; }
        if (!form.unit.trim()) { setFormError("Vui lòng nhập đơn vị."); return; }

        const parsedThreshold = form.lowStockThreshold.trim() !== "" ? Number(form.lowStockThreshold) : undefined;
        if (parsedThreshold !== undefined && (!Number.isFinite(parsedThreshold) || parsedThreshold < 0)) {
            setFormError("Ngưỡng cảnh báo tồn kho không hợp lệ.");
            return;
        }

        const payload: CreateInventoryItemPayload = {
            itemName: form.itemName.trim(),
            quantity: quantityNumber,
            unit: form.unit.trim(),
            category: form.category.trim(),
            description: form.description.trim() || undefined,
            lowStockThreshold: parsedThreshold,
            isActive: form.isActive,
        };
        setSubmitting(true);
        try {
            const created = await createInventoryItem(payload);
            setItems((prev) => [created, ...prev]);
            setModalOpen(false);
            success("Vật tư đã được tạo thành công.");
            fetchItems();
        } catch (e: any) {
            const message = e?.response?.data?.message || e?.message || "Không thể tạo vật tư.";
            setFormError(message);
            toastError(message);
        } finally {
            setSubmitting(false);
        }
    };

    const patchItem = (updated: InventoryItem) =>
        setItems((prev) => prev.map((i) => resolveId(i) === resolveId(updated) ? updated : i));

    const confirmDeleteItem = async () => {
        const item = deleteItem;
        const id = item ? resolveId(item) : null;
        if (!id || deletingId) return;

        setDeletingId(id);
        try {
            await deleteInventoryItem(id);
            setItems((prev) => prev.filter((i) => resolveId(i) !== id));
            setDeleteItem(null);
            success("Đã xóa vật tư thành công.");
            fetchItems();
        } catch (e: any) {
            const message = e?.response?.data?.message || e?.message || "Xóa vật tư thất bại.";
            toastError(message);
        } finally {
            setDeletingId(null);
        }
    };

    const CATEGORY_OPTIONS = [
        { label: "Lương thực", value: "FOOD" },
        { label: "Nước", value: "WATER" },
        { label: "Y tế", value: "MEDICAL" },
        { label: "Thiết bị", value: "EQUIPMENT" },
        { label: "Quần áo", value: "CLOTHING" },
        { label: "Khác", value: "OTHER" },
    ];

    const getCategoryLabel = (value: string) => {
        const found = CATEGORY_OPTIONS.find(c => c.value === value);
        return found ? found.label : value;
    };

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
                                            <th className="px-4 py-3 text-right text-xs font-semibold text-gray-500 uppercase tracking-wider w-36">Hành động</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-50">
                                        {filtered.map((item) => {
                                            const id = resolveId(item);
                                            const isLowStock =
                                                item.lowStockThreshold != null &&
                                                item.quantity <= item.lowStockThreshold;
                                            return (
                                                <tr key={id} className="group hover:bg-blue-50/40 transition-colors">
                                                    <td className="px-4 py-3">
                                                        <div className="flex flex-col">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-sm font-semibold text-gray-900">{item.itemName}</span>
                                                                {!item.isActive && (
                                                                    <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-gray-100 text-gray-400 border border-gray-200">
                                                                        Ngừng HĐ
                                                                    </span>
                                                                )}
                                                                {isLowStock && (
                                                                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-[10px] font-medium bg-amber-50 text-amber-600 border border-amber-200">
                                                                        <AlertTriangle className="w-2.5 h-2.5" />
                                                                        Sắp hết
                                                                    </span>
                                                                )}
                                                            </div>
                                                            {item.description && (
                                                                <span className="text-xs text-gray-400 line-clamp-1">{item.description}</span>
                                                            )}
                                                        </div>
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <span className={`text-sm font-medium ${isLowStock ? "text-amber-600" : "text-gray-700"}`}>
                                                            {item.quantity.toLocaleString("vi-VN")}
                                                        </span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-gray-500 hidden sm:table-cell">{item.unit}</td>
                                                    <td className="px-4 py-3 hidden md:table-cell">
                                                        {item.category ? (
                                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-medium bg-blue-50 text-blue-600 border border-blue-100">
                                                                {getCategoryLabel(item.category)}
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
                                                    <td className="px-4 py-3 text-right">
                                                        <div className="flex items-center justify-end gap-1">
                                                            <button
                                                                type="button"
                                                                onClick={() => setViewItem(item)}
                                                                aria-label="Xem chi tiết"
                                                                title="Xem chi tiết"
                                                                className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-700 transition-colors cursor-pointer"
                                                            >
                                                                <Eye className="w-4 h-4" />
                                                            </button>
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
                                                            <button
                                                                type="button"
                                                                onClick={() => setDeleteItem(item)}
                                                                aria-label="Xóa vật tư"
                                                                title="Xóa vật tư"
                                                                disabled={deletingId === id}
                                                                className="p-1.5 rounded-lg hover:bg-red-100 text-gray-400 hover:text-red-600 transition-colors cursor-pointer disabled:opacity-50"
                                                            >
                                                                {deletingId === id ? (
                                                                    <Loader2 className="w-4 h-4 animate-spin" />
                                                                ) : (
                                                                    <Trash2 className="w-4 h-4" />
                                                                )}
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
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">Danh mục</label>
                                        <select
                                            value={form.category}
                                            onChange={(e) => handleChange("category", e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl"
                                        >
                                            <option value="">Chọn danh mục</option>
                                            {CATEGORY_OPTIONS.map((c) => (
                                                <option key={c.value} value={c.value}>
                                                    {c.label}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                            Ngưỡng cảnh báo tồn kho
                                            <span className="text-xs text-gray-400 font-normal ml-1">(tuỳ chọn)</span>
                                        </label>
                                        <input
                                            type="number"
                                            min={0}
                                            value={form.lowStockThreshold}
                                            onChange={(e) => handleChange("lowStockThreshold", e.target.value)}
                                            className="w-full px-3 py-2.5 text-sm border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none bg-gray-50 focus:bg-white transition"
                                            placeholder="Ví dụ: 10"
                                        />
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

                {/* View Detail Modal */}
                {viewItem && (
                    <ViewDetailModal
                        item={viewItem}
                        onClose={() => setViewItem(null)}
                        onEdit={() => setEditItem(viewItem)}
                        onUpdateStock={() => setStockItem(viewItem)}
                    />
                )}

                {/* Edit Modal */}
                {editItem && (
                    <EditInventoryModal
                        item={editItem}
                        onClose={() => setEditItem(null)}
                        onSaved={(updated) => { patchItem(updated); setEditItem(null); fetchItems(); }}
                    />
                )}

                {/* Update Stock Modal */}
                {stockItem && (
                    <UpdateStockModal
                        item={stockItem}
                        onClose={() => setStockItem(null)}
                        onSaved={(updated) => { patchItem(updated); setStockItem(null); fetchItems(); }}
                    />
                )}

                {/* Delete confirmation modal */}
                <Modal
                    open={!!deleteItem}
                    onClose={() => { if (!deletingId) setDeleteItem(null); }}
                    title="Xác nhận xóa vật tư"
                    size="sm"
                >
                    <div className="space-y-4">
                        <p className="text-sm text-gray-600">
                            Bạn có chắc muốn xóa vật tư
                            <span className="font-semibold text-gray-900"> {deleteItem?.itemName}</span>? Hành động này không thể hoàn tác.
                        </p>
                        <div className="flex justify-end gap-2">
                            <button
                                type="button"
                                onClick={() => setDeleteItem(null)}
                                disabled={!!deletingId}
                                className="px-4 py-2 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors disabled:opacity-60 cursor-pointer"
                            >
                                Hủy
                            </button>
                            <button
                                type="button"
                                onClick={confirmDeleteItem}
                                disabled={!!deletingId}
                                className="inline-flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-500 hover:bg-red-600 disabled:bg-red-300 rounded-xl transition-colors cursor-pointer"
                            >
                                {deletingId ? <Loader2 className="w-4 h-4 animate-spin" /> : null}
                                {deletingId ? "Đang xóa..." : "Xóa"}
                            </button>
                        </div>
                    </div>
                </Modal>
            </div>
        </ManagerLayout>
    );
}