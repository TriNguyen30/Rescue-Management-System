import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Phone, User, Calendar, MapPin, AlertCircle, Loader2 } from "lucide-react";
import { getRescueRequestById, verifyRescueRequest, assignRescueRequest } from "@/services/rescue-coordinator.service";
import type { RescueRequest, UrgencyLevel, SupplyItemDto } from "@/types/rescue-requests";
import { API_BASE_URL } from "@/config/env";
import Modal from "@/components/ui/Modal";
import { getRescueTeams } from "@/services/rescue-team.service";
import type { RescueTeam } from "@/types/rescue-teams";
import { getVehicles } from "@/services/vehicle.service";
import type { VehicleItem } from "@/types/vehicle";
import { getInventoryItems } from "@/services/inventory.service";
import type { InventoryItem } from "@/types/inventory";

const STATUS_META: Record<string, { label: string; bg: string; color: string }> = {
    PENDING: { label: "Chờ xử lý", bg: "bg-blue-50", color: "text-blue-700" },
    IN_PROGRESS: { label: "Đang xử lý", bg: "bg-amber-50", color: "text-amber-700" },
    DONE: { label: "Hoàn thành", bg: "bg-green-50", color: "text-green-700" },
};

const URGENCY_META: Record<string, { label: string; color: string }> = {
    LOW: { label: "Nhẹ", color: "text-green-600" },
    MEDIUM: { label: "Trung bình", color: "text-amber-600" },
    HIGH: { label: "Khẩn cấp", color: "text-orange-600" },
    CRITICAL: { label: "Nguy kịch", color: "text-red-600" },
};

function formatDate(iso: string) {
    return new Date(iso).toLocaleString("vi-VN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
}

function imgUrl(path: string) {
    return path.startsWith("/") ? `${API_BASE_URL || ""}${path}` : path;
}

export default function RequestDetails() {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [request, setRequest] = useState<RescueRequest | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [lightbox, setLightbox] = useState<string | null>(null);
    const [verifying, setVerifying] = useState(false);
    const [verifyError, setVerifyError] = useState<string | null>(null);
    const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>("HIGH");
    const [assigning, setAssigning] = useState(false);
    const [assignError, setAssignError] = useState<string | null>(null);
    const [teamId, setTeamId] = useState("");
    const [teamNameSelected, setTeamNameSelected] = useState<string | null>(null);
    const [vehicleId, setVehicleId] = useState("");
    const [vehicleLabelSelected, setVehicleLabelSelected] = useState<string | null>(null);
    const [supplies, setSupplies] = useState<SupplyItemDto[]>([]);

    const [teamModalOpen, setTeamModalOpen] = useState(false);
    const [teamsLoading, setTeamsLoading] = useState(false);
    const [teamsError, setTeamsError] = useState<string | null>(null);
    const [availableTeams, setAvailableTeams] = useState<RescueTeam[]>([]);

    const [vehicleModalOpen, setVehicleModalOpen] = useState(false);
    const [vehiclesLoading, setVehiclesLoading] = useState(false);
    const [vehiclesError, setVehiclesError] = useState<string | null>(null);
    const [availableVehicles, setAvailableVehicles] = useState<VehicleItem[]>([]);

    const [suppliesModalOpen, setSuppliesModalOpen] = useState(false);
    const [inventoryLoading, setInventoryLoading] = useState(false);
    const [inventoryError, setInventoryError] = useState<string | null>(null);
    const [inventoryItems, setInventoryItems] = useState<InventoryItem[]>([]);
    const [suppliesDraft, setSuppliesDraft] = useState<SupplyItemDto[]>([]);

    useEffect(() => {
        if (!id) return;
        setLoading(true);
        setError(null);
        getRescueRequestById(id)
            .then(setRequest)
            .catch((e) => setError(e instanceof Error ? e.message : "Không thể tải thông tin yêu cầu"))
            .finally(() => setLoading(false));
    }, [id]);

    // Đóng lightbox khi nhấn Escape
    useEffect(() => {
        if (!lightbox) return;
        const handler = (e: KeyboardEvent) => {
            if (e.key === "Escape") setLightbox(null);
        };
        window.addEventListener("keydown", handler);
        return () => window.removeEventListener("keydown", handler);
    }, [lightbox]);

    useEffect(() => {
        if (!teamModalOpen) return;
        setTeamsLoading(true);
        setTeamsError(null);
        getRescueTeams()
            .then((teams) => {
                setAvailableTeams(teams.filter((t) => t.status === "AVAILABLE"));
            })
            .catch((e) => setTeamsError(e instanceof Error ? e.message : "Không thể tải danh sách đội cứu hộ"))
            .finally(() => setTeamsLoading(false));
    }, [teamModalOpen]);

    useEffect(() => {
        if (!vehicleModalOpen) return;
        setVehiclesLoading(true);
        setVehiclesError(null);
        getVehicles()
            .then((vehicles) => {
                // status in DB uses strings, we treat "AVAILABLE" as ready
                setAvailableVehicles(vehicles.filter((v) => v.status === "AVAILABLE"));
            })
            .catch((e) => setVehiclesError(e instanceof Error ? e.message : "Không thể tải danh sách phương tiện"))
            .finally(() => setVehiclesLoading(false));
    }, [vehicleModalOpen]);

    useEffect(() => {
        if (!suppliesModalOpen) return;
        setSuppliesDraft(supplies.length ? supplies : []);
        setInventoryLoading(true);
        setInventoryError(null);
        getInventoryItems()
            .then(setInventoryItems)
            .catch((e) => setInventoryError(e instanceof Error ? e.message : "Không thể tải danh sách vật tư"))
            .finally(() => setInventoryLoading(false));
    }, [suppliesModalOpen]);

    const handleVerify = async () => {
        if (!id) return;
        setVerifying(true);
        setVerifyError(null);
        try {
            const updated = await verifyRescueRequest(id, selectedUrgency);
            setRequest(updated);
            // Sau khi xác minh thành công, reload lại trang giống F5
            window.location.reload();
        } catch (e) {
            setVerifyError(e instanceof Error ? e.message : "Không thể xác minh yêu cầu");
        } finally {
            setVerifying(false);
        }
    };

    const handleAssign = async () => {
        if (!id || !teamId.trim()) return;
        setAssigning(true);
        setAssignError(null);
        try {
            const payload = {
                teamId: teamId.trim(),
                vehicleId: vehicleId.trim() || undefined,
                supplies: supplies.filter((s) => s.inventoryId && s.quantity > 0),
            };
            const updated = await assignRescueRequest(id, payload);
            setRequest(updated);
            window.location.reload();
        } catch (e) {
            setAssignError(e instanceof Error ? e.message : "Không thể điều phối yêu cầu");
        } finally {
            setAssigning(false);
        }
    };

    const handlePickTeam = (team: RescueTeam) => {
        setTeamId(team._id);
        setTeamNameSelected(team.teamName);
        setTeamModalOpen(false);
    };

    const handlePickVehicle = (vehicle: VehicleItem) => {
        const id = vehicle._id || vehicle.id || "";
        setVehicleId(id);
        setVehicleLabelSelected(`${vehicle.plateNumber}${vehicle.type ? ` • ${vehicle.type}` : ""}`);
        setVehicleModalOpen(false);
    };

    const getInventoryItemById = (id: string) => inventoryItems.find((x) => (x._id || x.id) === id);

    const handleDraftAddSupply = (inventoryId: string) => {
        setSuppliesDraft((prev) => {
            if (prev.some((s) => s.inventoryId === inventoryId)) return prev;
            return [...prev, { inventoryId, quantity: 1 }];
        });
    };

    const handleDraftQtyChange = (inventoryId: string, value: string) => {
        const qty = Math.max(0, Math.floor(Number(value) || 0));
        const item = getInventoryItemById(inventoryId);
        const max = item?.quantity ?? 0;
        const nextQty = Math.min(qty, max);
        setSuppliesDraft((prev) => prev.map((s) => (s.inventoryId === inventoryId ? { ...s, quantity: nextQty } : s)));
    };

    const handleDraftRemoveSupply = (inventoryId: string) => {
        setSuppliesDraft((prev) => prev.filter((s) => s.inventoryId !== inventoryId));
    };

    const applySuppliesDraft = () => {
        // enforce stock caps and remove empty
        const sanitized = suppliesDraft
            .map((s) => {
                const item = getInventoryItemById(s.inventoryId);
                const max = item?.quantity ?? 0;
                return { ...s, quantity: Math.min(Math.max(0, s.quantity), max) };
            })
            .filter((s) => s.inventoryId && s.quantity > 0);
        setSupplies(sanitized);
        setSuppliesModalOpen(false);
    };

    if (!id) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <p className="text-gray-500">Thiếu ID yêu cầu</p>
            </div>
        );
    }

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center text-gray-500">
                <Loader2 className="w-12 h-12 animate-spin mb-4" />
                <p>Đang tải...</p>
            </div>
        );
    }

    if (error || !request) {
        return (
            <div className="min-h-screen bg-gray-50 p-4">
                <div className="max-w-2xl mx-auto">
                    <div className="rounded-xl bg-red-50 border border-red-200 p-6 flex items-center gap-3 text-red-700">
                        <AlertCircle className="w-6 h-6 shrink-0" />
                        <span>{error ?? "Không tìm thấy yêu cầu"}</span>
                    </div>
                    <button
                        onClick={() => navigate("/coordinator")}
                        className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700"
                    >
                        <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                    </button>
                </div>
            </div>
        );
    }

    const statusMeta = STATUS_META[request.status] ?? { label: request.status, bg: "bg-gray-50", color: "text-gray-700" };
    const urgencyMeta = request.urgencyLevel ? (URGENCY_META[request.urgencyLevel] ?? { label: request.urgencyLevel, color: "text-gray-600" }) : null;
    const [lng, lat] = request.location?.coordinates ?? [0, 0];

    return (
        <div className="min-h-screen bg-gray-50">
            <div className="max-w-2xl mx-auto px-4 py-8">
                <button
                    onClick={() => navigate("/coordinator")}
                    className="inline-flex items-center gap-2 text-sm font-medium text-gray-600 hover:text-gray-900 mb-6"
                >
                    <ArrowLeft className="w-4 h-4" /> Quay lại danh sách
                </button>

                <div className="rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                            <span className="font-mono text-lg font-semibold text-gray-900">{request.requestCode}</span>
                            <span className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusMeta.bg} ${statusMeta.color}`}>
                                {statusMeta.label}
                            </span>
                            {urgencyMeta && (
                                <span className={`text-sm font-medium ${urgencyMeta.color}`}>{urgencyMeta.label}</span>
                            )}
                        </div>
                        <p className="text-gray-600">{request.description}</p>

                        {/* Xác minh & phân loại khẩn cấp */}
                        <div className="mt-4 flex flex-wrap items-center gap-3">
                            <label className="flex items-center gap-2 text-sm text-gray-700">
                                <span className="font-medium">Mức độ khẩn cấp:</span>
                                <select
                                    value={selectedUrgency}
                                    onChange={(e) => setSelectedUrgency(e.target.value as UrgencyLevel)}
                                    className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    <option value="LOW">Nhẹ</option>
                                    <option value="MEDIUM">Trung bình</option>
                                    <option value="HIGH">Khẩn cấp</option>
                                    <option value="CRITICAL">Nguy kịch</option>
                                </select>
                            </label>
                            <button
                                onClick={handleVerify}
                                disabled={verifying}
                                className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {verifying ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang xác minh...
                                    </>
                                ) : (
                                    "Xác minh yêu cầu"
                                )}
                            </button>
                        </div>

                        {verifyError && <p className="mt-2 text-sm text-red-600">{verifyError}</p>}

                        {/* Điều phối yêu cầu */}
                        <div className="mt-6 border-t border-gray-100 pt-4 space-y-3">
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Điều phối cứu hộ</p>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Đội cứu hộ *</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setTeamModalOpen(true)}
                                            className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-left hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {teamNameSelected ? teamNameSelected : "Chọn đội đang sẵn sàng..."}
                                        </button>
                                        {teamId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setTeamId("");
                                                    setTeamNameSelected(null);
                                                }}
                                                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
                                            >
                                                Bỏ chọn
                                            </button>
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-xs font-medium text-gray-500 mb-1">Phương tiện</label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setVehicleModalOpen(true)}
                                            className="flex-1 border border-gray-300 rounded-md px-2 py-1.5 text-sm text-left hover:border-blue-300 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            {vehicleLabelSelected ? vehicleLabelSelected : "Chọn phương tiện sẵn sàng (tùy chọn)..."}
                                        </button>
                                        {vehicleId && (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setVehicleId("");
                                                    setVehicleLabelSelected(null);
                                                }}
                                                className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
                                            >
                                                Bỏ chọn
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-gray-500">Vật tư mang theo</span>
                                    <button
                                        type="button"
                                        onClick={() => setSuppliesModalOpen(true)}
                                        className="text-xs font-medium text-blue-600 hover:text-blue-700"
                                    >
                                        Chọn vật tư
                                    </button>
                                </div>
                                {supplies.length > 0 ? (
                                    <div className="space-y-2">
                                        {supplies.map((s) => {
                                            const inv = inventoryItems.find((x) => (x._id || x.id) === s.inventoryId);
                                            const name = inv?.itemName ?? s.inventoryId;
                                            const unit = inv?.unit ? ` ${inv.unit}` : "";
                                            return (
                                                <div
                                                    key={s.inventoryId}
                                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-200 px-3 py-2"
                                                >
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-medium text-gray-800 truncate">{name}</p>
                                                        <p className="text-xs text-gray-500 truncate">{s.inventoryId}</p>
                                                    </div>
                                                    <div className="flex items-center gap-2 shrink-0">
                                                        <span className="text-sm font-semibold text-gray-800">
                                                            {s.quantity}
                                                            {unit}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() => setSupplies((prev) => prev.filter((x) => x.inventoryId !== s.inventoryId))}
                                                            className="text-xs text-red-500 hover:text-red-600 px-1"
                                                        >
                                                            Xóa
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                ) : (
                                    <p className="text-xs text-gray-500">Chưa chọn vật tư.</p>
                                )}
                            </div>

                            <button
                                type="button"
                                onClick={handleAssign}
                                disabled={assigning || !teamId.trim()}
                                className="mt-2 inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 disabled:cursor-not-allowed"
                            >
                                {assigning ? (
                                    <>
                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                        Đang điều phối...
                                    </>
                                ) : (
                                    "Điều phối yêu cầu"
                                )}
                            </button>

                            {assignError && <p className="mt-1 text-sm text-red-600">{assignError}</p>}
                        </div>
                    </div>

                    <div className="p-6 space-y-4">
                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Người gửi</p>
                            <div className="flex flex-col gap-2 text-gray-800">
                                <span className="inline-flex items-center gap-2">
                                    <User className="w-4 h-4 text-gray-400" />
                                    {request.userId?.fullName ?? "—"}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-gray-400" />
                                    <a href={`tel:${request.userId?.phone}`} className="hover:text-blue-600">
                                        {request.userId?.phone ?? "—"}
                                    </a>
                                </span>
                            </div>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Vị trí</p>
                            <span className="inline-flex items-center gap-2 text-gray-800">
                                <MapPin className="w-4 h-4 text-gray-400" />
                                {lat.toFixed(6)}, {lng.toFixed(6)}
                            </span>
                        </div>

                        <div>
                            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Thời gian</p>
                            <div className="flex flex-col gap-1 text-gray-800 text-sm">
                                <span className="inline-flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Tạo: {formatDate(request.createdAt)}
                                </span>
                                <span className="inline-flex items-center gap-2">
                                    <Calendar className="w-4 h-4 text-gray-400" />
                                    Cập nhật: {formatDate(request.updatedAt)}
                                </span>
                            </div>
                        </div>

                        {request.assignedTeamId && (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">
                                    Đội được phân công
                                </p>
                                <p className="text-gray-800">
                                    {request.assignedTeamId?.teamName ?? "—"}
                                </p>
                            </div>
                        )}

                        {request.images?.length ? (
                            <div>
                                <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">Ảnh hiện trường</p>
                                <div className="flex flex-wrap gap-3">
                                    {request.images.map((img, i) => (
                                        <button
                                            key={i}
                                            onClick={() => setLightbox(imgUrl(img))}
                                            className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 hover:scale-105 transition-all cursor-zoom-in"
                                        >
                                            <img src={imgUrl(img)} alt="" className="w-32 h-32 object-cover" />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : null}
                    </div>
                </div>
            </div>

            {/* Lightbox */}
            {lightbox && (
                <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm"
                    onClick={() => setLightbox(null)}
                >
                    <div
                        className="relative max-w-3xl max-h-[90vh] mx-4"
                        onClick={(e) => e.stopPropagation()}
                    >
                        <img
                            src={lightbox}
                            alt="Ảnh hiện trường"
                            className="rounded-xl max-h-[85vh] max-w-full object-contain shadow-2xl"
                        />
                        <button
                            onClick={() => setLightbox(null)}
                            className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-white shadow-lg flex items-center justify-center text-gray-500 hover:text-gray-900 transition-colors text-sm font-bold"
                            aria-label="Đóng"
                        >
                            X
                        </button>
                    </div>
                </div>
            )}

            <Modal open={teamModalOpen} onClose={() => setTeamModalOpen(false)} title="Chọn đội cứu hộ (Sẵn sàng)" size="lg">
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
                                    .then((teams) => setAvailableTeams(teams.filter((t) => t.status === "AVAILABLE")))
                                    .catch((e) => setTeamsError(e instanceof Error ? e.message : "Không thể tải danh sách đội cứu hộ"))
                                    .finally(() => setTeamsLoading(false));
                            }}
                            className="ml-2 underline font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : availableTeams.length === 0 ? (
                    <div className="text-sm text-gray-500 py-6">Không có đội nào đang ở trạng thái sẵn sàng.</div>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                        {availableTeams.map((team) => (
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
                                            Trưởng nhóm: {team.leaderId?.fullName} • Thành viên: {team.members?.length ?? 0} • Xe:{" "}
                                            {team.vehicles?.length ?? 0}
                                        </p>
                                    </div>
                                    <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                        Sẵn sàng
                                    </span>
                                </div>
                            </button>
                        ))}
                    </div>
                )}
            </Modal>

            <Modal open={vehicleModalOpen} onClose={() => setVehicleModalOpen(false)} title="Chọn phương tiện (Sẵn sàng)" size="lg">
                {vehiclesLoading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Đang tải danh sách phương tiện...
                    </div>
                ) : vehiclesError ? (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                        {vehiclesError}
                        <button
                            type="button"
                            onClick={() => {
                                setVehiclesLoading(true);
                                setVehiclesError(null);
                                getVehicles()
                                    .then((vehicles) => setAvailableVehicles(vehicles.filter((v) => v.status === "AVAILABLE")))
                                    .catch((e) => setVehiclesError(e instanceof Error ? e.message : "Không thể tải danh sách phương tiện"))
                                    .finally(() => setVehiclesLoading(false));
                            }}
                            className="ml-2 underline font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : availableVehicles.length === 0 ? (
                    <div className="text-sm text-gray-500 py-6">Không có phương tiện nào đang ở trạng thái sẵn sàng.</div>
                ) : (
                    <div className="space-y-2 max-h-[60vh] overflow-auto pr-1">
                        {availableVehicles.map((v) => {
                            const id = v._id || v.id || "";
                            return (
                                <button
                                    key={id || v.plateNumber}
                                    type="button"
                                    onClick={() => handlePickVehicle(v)}
                                    className="w-full text-left rounded-xl border border-gray-200 hover:border-blue-300 hover:bg-blue-50/30 transition-colors p-4"
                                >
                                    <div className="flex items-start justify-between gap-3">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-gray-900 truncate">{v.plateNumber}</p>
                                            <p className="text-xs text-gray-500 mt-1 truncate">
                                                {v.type ? `Loại: ${v.type} • ` : ""}
                                                Sức chứa: {v.capacity}
                                            </p>
                                            {id && <p className="text-[11px] text-gray-400 mt-1 truncate">{id}</p>}
                                        </div>
                                        <span className="shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium bg-green-50 text-green-700">
                                            Sẵn sàng
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </div>
                )}
            </Modal>

            <Modal open={suppliesModalOpen} onClose={() => setSuppliesModalOpen(false)} title="Chọn vật tư (không vượt tồn kho)" size="xl">
                {inventoryLoading ? (
                    <div className="flex items-center justify-center py-10 text-gray-500">
                        <Loader2 className="w-6 h-6 animate-spin mr-2" />
                        Đang tải danh sách vật tư...
                    </div>
                ) : inventoryError ? (
                    <div className="rounded-xl bg-red-50 border border-red-200 p-4 text-sm text-red-700">
                        {inventoryError}
                        <button
                            type="button"
                            onClick={() => {
                                setInventoryLoading(true);
                                setInventoryError(null);
                                getInventoryItems()
                                    .then(setInventoryItems)
                                    .catch((e) => setInventoryError(e instanceof Error ? e.message : "Không thể tải danh sách vật tư"))
                                    .finally(() => setInventoryLoading(false));
                            }}
                            className="ml-2 underline font-medium"
                        >
                            Thử lại
                        </button>
                    </div>
                ) : (
                    <div className="space-y-4">
                        <div className="flex items-center justify-between">
                            <p className="text-sm text-gray-600">
                                Đã chọn: <span className="font-semibold text-gray-900">{suppliesDraft.length}</span>
                            </p>
                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => setSuppliesDraft([])}
                                    className="px-3 py-1.5 rounded-md text-sm font-medium text-gray-600 border border-gray-300 hover:bg-gray-50"
                                >
                                    Xóa hết
                                </button>
                                <button
                                    type="button"
                                    onClick={applySuppliesDraft}
                                    className="px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700"
                                >
                                    Áp dụng
                                </button>
                            </div>
                        </div>

                        {/* Selected list */}
                        {suppliesDraft.length > 0 && (
                            <div className="rounded-xl border border-gray-200 p-3 space-y-2">
                                {suppliesDraft.map((s) => {
                                    const inv = getInventoryItemById(s.inventoryId);
                                    const max = inv?.quantity ?? 0;
                                    return (
                                        <div
                                            key={s.inventoryId}
                                            className="grid grid-cols-[1fr,120px,auto] gap-2 items-center"
                                        >
                                            <div className="min-w-0">
                                                <p className="text-sm font-medium text-gray-900 truncate">{inv?.itemName ?? s.inventoryId}</p>
                                                <p className="text-xs text-gray-500 truncate">
                                                    Tồn kho: {max} {inv?.unit ?? ""} • {s.inventoryId}
                                                </p>
                                            </div>
                                            <input
                                                type="number"
                                                min={0}
                                                max={max}
                                                value={s.quantity}
                                                onChange={(e) => handleDraftQtyChange(s.inventoryId, e.target.value)}
                                                className="border border-gray-300 rounded-md px-2 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => handleDraftRemoveSupply(s.inventoryId)}
                                                className="text-xs text-red-500 hover:text-red-600 px-1"
                                            >
                                                Xóa
                                            </button>
                                        </div>
                                    );
                                })}
                            </div>
                        )}

                        {/* Inventory list */}
                        <div className="space-y-2 max-h-[45vh] overflow-auto pr-1">
                            {inventoryItems.map((inv) => {
                                const id = inv._id || inv.id || "";
                                const disabled = !id || inv.quantity <= 0;
                                const selected = suppliesDraft.some((s) => s.inventoryId === id);
                                return (
                                    <button
                                        key={id || inv.itemName}
                                        type="button"
                                        disabled={disabled || selected}
                                        onClick={() => id && handleDraftAddSupply(id)}
                                        className={`w-full text-left rounded-xl border p-4 transition-colors ${
                                            disabled
                                                ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                                                : selected
                                                  ? "border-blue-200 bg-blue-50/40 text-gray-500 cursor-not-allowed"
                                                  : "border-gray-200 hover:border-blue-300 hover:bg-blue-50/30"
                                        }`}
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div className="min-w-0">
                                                <p className="font-semibold truncate">{inv.itemName}</p>
                                                <p className="text-xs mt-1 truncate">
                                                    Tồn kho: {inv.quantity} {inv.unit} • {inv.category}
                                                </p>
                                                {id && <p className="text-[11px] text-gray-400 mt-1 truncate">{id}</p>}
                                            </div>
                                            <span
                                                className={`shrink-0 inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${
                                                    inv.quantity > 0 ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-500"
                                                }`}
                                            >
                                                {inv.quantity > 0 ? "Còn hàng" : "Hết hàng"}
                                            </span>
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                )}
            </Modal>
        </div>
    );
}