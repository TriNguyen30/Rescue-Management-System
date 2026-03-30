import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X,
  MapPin,
  Clock,
  User,
  Phone,
  ShieldCheck,
  Truck,
  Package,
  Plus,
  Trash2
} from "lucide-react";

import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { API_BASE_URL } from "@/config/env";
import { getRescueRequestById, verifyRescueRequest, assignRescueRequest } from "@/services/rescue-request.service";
import { getRescueTeams } from "@/services/rescue-team.service";
import { getVehicles } from "@/services/vehicle.service";
import { getInventoryItems } from "@/services/inventory.service";

import type { RescueRequest, UrgencyLevel } from "@/types/rescue-requests";
import type { RescueTeam } from "@/types/rescue-teams";
import type { VehicleItem } from "@/types/vehicle";
import type { InventoryItem } from "@/types/inventory";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({ iconUrl: markerIcon, iconRetinaUrl: markerIcon2x, shadowUrl: markerShadow });

const victimIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32]
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

function imgUrl(path: string) {
  return path.startsWith("/") ? `${API_BASE_URL || ""}${path}` : path;
}

const URGENCY_LABEL: Record<string, string> = {
  LOW: "Nhẹ",
  MEDIUM: "Trung bình",
  HIGH: "Khẩn cấp",
  CRITICAL: "Nguy kịch"
};

const URGENCY_BADGE: Record<string, string> = {
  LOW:      "bg-emerald-50 text-emerald-700 border border-emerald-200",
  MEDIUM:   "bg-amber-50  text-amber-700  border border-amber-200",
  HIGH:     "bg-orange-50 text-orange-700 border border-orange-200",
  CRITICAL: "bg-red-50    text-red-700    border border-red-200"
};

/* ─── Select ─── */
function Select({ value, onChange, children, className = "", disabled }: {
  value: string;
  onChange: (v: string) => void;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}) {
  return (
    <select
      value={value}
      onChange={e => onChange(e.target.value)}
      disabled={disabled}
      className={`h-9 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700
        focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
        transition ${className}`}
    >
      {children}
    </select>
  );
}

/* ─── Button variants ─── */
function Btn({
  onClick, disabled, variant = "primary", size = "md", children, icon
}: {
  onClick?: () => void; disabled?: boolean; variant?: "primary"|"success"|"ghost"|"danger";
  size?: "sm"|"md"; children: React.ReactNode; icon?: React.ReactNode;
}) {
  const base = "inline-flex items-center gap-2 font-medium rounded-lg transition focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed";
  const sizes = { sm: "h-8 px-3 text-xs", md: "h-9 px-4 text-sm" };
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500",
    success: "bg-emerald-600 hover:bg-emerald-700 text-white focus:ring-emerald-500",
    ghost:   "bg-gray-100 hover:bg-gray-200 text-gray-700 focus:ring-gray-300",
    danger:  "bg-red-50 hover:bg-red-100 text-red-600 focus:ring-red-400"
  };
  return (
    <button onClick={onClick} disabled={disabled} className={`${base} ${sizes[size]} ${variants[variant]}`}>
      {icon}{children}
    </button>
  );
}

/* ═══════════════════════════════════════════════════ */

export default function RequestDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest]     = useState<RescueRequest | null>(null);
  const [teams, setTeams]         = useState<RescueTeam[]>([]);
  const [vehicles, setVehicles]   = useState<VehicleItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  const [selectedUrgency, setSelectedUrgency] = useState<UrgencyLevel>("HIGH");
  const [teamId, setTeamId]       = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const [supplies, setSupplies] =
    useState<{ inventoryId: string; quantity: number }[]>([]);
  const [newSupplyInventoryId, setNewSupplyInventoryId] = useState("");
  const [newSupplyQuantity, setNewSupplyQuantity]       = useState<number | "">("");

  const [verifying, setVerifying] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const [lightbox, setLightbox]   = useState<{ images: string[]; index: number } | null>(null);

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => { document.body.style.overflow = ""; };
  }, [lightbox]);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getRescueRequestById(id),
      getRescueTeams(),
      getVehicles(),
      getInventoryItems()
    ])
      .then(([req, t, v, inv]) => { setRequest(req); setTeams(t); setVehicles(v); setInventory(inv); })
      .catch(e => setError(e instanceof Error ? e.message : "Không thể tải dữ liệu"))
      .finally(() => setLoading(false));
  }, [id]);

  const requestPoint = useMemo(() => {
    if (!request?.location?.coordinates) return null;
    const [lng, lat] = request.location.coordinates;
    return [lat, lng] as [number, number];
  }, [request]);

  const teamPoints = useMemo(() =>
    teams.filter(t => t.currentLocation?.coordinates).map(t => {
      const [lng, lat] = t.currentLocation.coordinates;
      return { team: t, position: [lat, lng] as [number, number] };
    }), [teams]);

  const inventoryMap = useMemo(() =>
    inventory.reduce<Record<string, InventoryItem>>((acc, item) => {
      const key = item._id || item.id;
      if (key) acc[key] = item;
      return acc;
    }, {}), [inventory]);

  const vehicleMap = useMemo(() =>
    vehicles.reduce<Record<string, VehicleItem>>((acc, v) => {
      const key = v._id || v.id;
      if (key) acc[key] = v;
      return acc;
    }, {}), [vehicles]);

  const getRemainingQuantity = (inventoryId: string) => {
    const item = inventoryMap[inventoryId];
    if (!item) return 0;
    const used = supplies.find(s => s.inventoryId === inventoryId)?.quantity ?? 0;
    return Math.max(item.quantity - used, 0);
  };

  const handleAddSupply = () => {
    if (!newSupplyInventoryId || !newSupplyQuantity) return;
    if (newSupplyQuantity > getRemainingQuantity(newSupplyInventoryId)) {
      alert("Số lượng vật tư vượt quá số lượng trong kho"); return;
    }
    setSupplies(prev => {
      const idx = prev.findIndex(s => s.inventoryId === newSupplyInventoryId);
      if (idx !== -1) {
        const updated = [...prev];
        updated[idx] = { ...updated[idx], quantity: newSupplyQuantity };
        return updated;
      }
      return [...prev, { inventoryId: newSupplyInventoryId, quantity: newSupplyQuantity }];
    });
    setNewSupplyInventoryId(""); setNewSupplyQuantity("");
  };

  const handleRemoveSupply = (inventoryId: string) =>
    setSupplies(prev => prev.filter(s => s.inventoryId !== inventoryId));

  const handleVerify = async () => {
    if (!id) return;
    setVerifying(true);
    try { await verifyRescueRequest(id, selectedUrgency); window.location.reload(); }
    catch (e) { alert(e instanceof Error ? e.message : "Không thể xác minh yêu cầu"); }
    finally { setVerifying(false); }
  };

  const handleAssign = async () => {
    if (!id || !teamId) return;
    for (const s of supplies) {
      const item = inventoryMap[s.inventoryId];
      if (!item) { alert("Vật tư không hợp lệ"); return; }
      if (s.quantity <= 0) { alert("Số lượng phải lớn hơn 0"); return; }
      if (s.quantity > item.quantity) { alert("Vượt quá số lượng trong kho"); return; }
    }
    setAssigning(true);
    try {
      await assignRescueRequest(id, { teamId, vehicleId: vehicleId || undefined, supplies });
      alert("Điều phối thành công"); window.location.reload();
    } catch (e) { alert(e instanceof Error ? e.message : "Không thể điều phối"); }
    finally { setAssigning(false); }
  };

  /* ─── Loading / Error states ─── */
  if (!id) return <div className="p-10 text-center text-gray-500">Thiếu ID yêu cầu</div>;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (error || !request) return (
    <div className="h-screen flex flex-col items-center justify-center gap-4">
      <div className="rounded-xl bg-red-50 border border-red-200 p-6 flex items-center gap-3 text-red-700">
        <AlertCircle className="w-6 h-6 shrink-0" />
        {error ?? "Không tìm thấy yêu cầu"}
      </div>
      <button
        onClick={() => navigate("/coordinator")}
        className="inline-flex items-center gap-2 text-blue-600"
      >
        <ArrowLeft className="w-4 h-4" /> Quay lại
      </button>
    </div>
  );

  const [lng, lat] = request.location?.coordinates ?? [0, 0];
  const images = request.images ?? [];
  const assignedTeam =
    request.assignedTeamId && typeof request.assignedTeamId === "object"
      ? (request.assignedTeamId as NonNullable<RescueRequest["assignedTeamId"]>)
      : null;
  const isAssigned = Boolean(request.assignedTeamId);
  const assignedVehiclePlateNumbers = (() => {
    const r = request as any;

    const candidates: Array<string | undefined> = [];

    // Common patterns from backend responses
    candidates.push(
      typeof r?.vehicleId === "string" ? r.vehicleId : undefined,
      typeof r?.assignedVehicleId === "string" ? r.assignedVehicleId : undefined,
      typeof r?.vehicle?._id === "string" ? r.vehicle._id : undefined,
      typeof r?.assignedVehicle?._id === "string" ? r.assignedVehicle._id : undefined,
      typeof r?.assignedVehicleId?._id === "string" ? r.assignedVehicleId._id : undefined,
      typeof r?.vehicleId?._id === "string" ? r.vehicleId._id : undefined,
    );

    // Some APIs return an array
    if (Array.isArray(r?.vehicles)) {
      for (const v of r.vehicles) {
        if (typeof v === "string") candidates.push(v);
        if (v && typeof v === "object" && typeof v._id === "string") candidates.push(v._id);
      }
    }

    // Legacy: sometimes stored under team assignment
    if (Array.isArray(assignedTeam?.vehicles)) {
      for (const v of assignedTeam.vehicles as any[]) {
        if (typeof v === "string") candidates.push(v);
        if (v && typeof v === "object" && typeof v._id === "string") candidates.push(v._id);
      }
    }

    const ids = Array.from(new Set(candidates.filter(Boolean))) as string[];

    const byId = ids
      .map((id) => vehicleMap[id]?.plateNumber)
      .filter(Boolean) as string[];

    const direct =
      (typeof r?.vehicle?.plateNumber === "string" ? [r.vehicle.plateNumber] : [])
        .concat(typeof r?.assignedVehicle?.plateNumber === "string" ? [r.assignedVehicle.plateNumber] : []);

    return Array.from(new Set([...direct, ...byId]));
  })();
  const assignedVehicleCount = assignedVehiclePlateNumbers.length;

  const assignedSupplies = (
    (request as any)?.supplies ??
    (request as any)?.suppliesMangTheo ??
    (request as any)?.assignedSupplies ??
    (request as any)?.supplyItems ??
    []
  ) as { inventoryId: string; quantity: number }[];

  /* ─── Render: sidebar + map layout ─── */
  return (
    <div className="min-h-screen flex bg-gray-50">

      {/* ══ SIDEBAR ══ */}
      <div className="w-full lg:w-[400px] bg-white border-r border-gray-200 flex flex-col overflow-y-auto shrink-0">

        {/* Header */}
        <div className="p-5 border-b border-gray-100">
          <button
            onClick={() => navigate("/coordinator")}
            className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition mb-4"
          >
            <ArrowLeft size={16} /> Quay lại danh sách
          </button>

          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="font-mono text-xs text-gray-400 mb-0.5">{request.requestCode}</p>
              <p className="font-semibold text-gray-900 leading-snug">{request.description}</p>
            </div>
            {request.urgencyLevel && (
              <span className={`shrink-0 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${URGENCY_BADGE[request.urgencyLevel] ?? "bg-gray-100 text-gray-600"}`}>
                {URGENCY_LABEL[request.urgencyLevel] ?? request.urgencyLevel}
              </span>
            )}
          </div>
        </div>

        <div className="flex-1 p-5 space-y-4 overflow-y-auto">

          {/* ── Thông tin người gửi ── */}
          <div className="border rounded-xl p-4 text-sm space-y-2">
            <div className="flex gap-2 items-center">
              <User size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-700">{request.userId?.fullName || "—"}</span>
            </div>
            <div className="flex gap-2 items-center">
              <Phone size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-700">{request.userId?.phone || "—"}</span>
            </div>
            <div className="flex gap-2 items-center">
              <MapPin size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-700">{`${lat.toFixed(6)}, ${lng.toFixed(6)}`}</span>
            </div>
            <div className="flex gap-2 items-center">
              <Clock size={14} className="text-gray-400 shrink-0" />
              <span className="text-gray-700">{formatDate(request.createdAt)}</span>
            </div>
          </div>

          {/* ── Đội đã điều phối ── */}
          {assignedTeam && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl px-4 py-3 flex items-start gap-2.5">
              <Truck size={15} className="text-blue-500 mt-0.5 shrink-0" />
              <div className="text-sm">
                <p className="font-semibold text-blue-800">Đội đã điều phối</p>
                <p className="text-blue-700">{assignedTeam.teamName}</p>
                {assignedVehicleCount > 0 && (
                  <p className="text-xs text-blue-500 mt-0.5">
                    Phương tiện ({assignedVehicleCount}):{" "}
                    {assignedVehiclePlateNumbers.join(", ")}
                  </p>
                )}
                {assignedSupplies?.length > 0 && (
                  <div className="mt-1.5 text-xs space-y-1">
                    <p className="text-blue-600 font-medium">
                      Vật tư mang theo
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {assignedSupplies.map((s) => {
                        const item = inventoryMap[s.inventoryId];
                        return (
                          <span
                            key={s.inventoryId}
                            className="inline-flex items-center gap-1 px-2 py-0.5 rounded border border-blue-200 bg-white/60 text-blue-700"
                          >
                            {item?.itemName ?? s.inventoryId}:{" "}
                            {s.quantity}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* ── Xác minh ── */}
          <div className="border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
              <ShieldCheck size={13} /> Xác minh yêu cầu
            </p>
            <div className="flex flex-wrap items-center gap-2">
              <Select
                value={selectedUrgency}
                onChange={v => setSelectedUrgency(v as UrgencyLevel)}
                className="flex-1 min-w-[130px]"
                disabled={isAssigned}
              >
                <option value="LOW">Nhẹ</option>
                <option value="MEDIUM">Trung bình</option>
                <option value="HIGH">Khẩn cấp</option>
                <option value="CRITICAL">Nguy kịch</option>
              </Select>
              <Btn
                onClick={handleVerify}
                disabled={verifying || isAssigned}
                variant="primary"
                icon={verifying ? <Loader2 size={13} className="animate-spin"/> : undefined}
              >
                {verifying ? "Đang xác minh…" : "Xác minh"}
              </Btn>
            </div>
            {isAssigned && (
              <p className="text-xs text-gray-400">Yêu cầu đã được điều phối, không thể xác minh nữa.</p>
            )}
          </div>

          {/* ── Điều phối ── */}
          <div className="border rounded-xl p-4 space-y-3">
            <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
              <Truck size={13} /> Điều phối cứu hộ
            </p>

            <Select value={teamId} onChange={setTeamId} className="w-full">
              <option value="">Chọn đội cứu hộ</option>
              {teams.filter(t => t.status === "AVAILABLE").map(t => (
                <option key={t._id} value={t._id}>{t.teamName}</option>
              ))}
            </Select>

            <Select value={vehicleId} onChange={setVehicleId} className="w-full">
              <option value="">Chọn phương tiện</option>
              {vehicles.filter(v => v.status === "AVAILABLE").map(v => (
                <option key={v._id} value={v._id}>{v.plateNumber}</option>
              ))}
            </Select>

            {/* Supplies */}
            <div className="border-t border-gray-100 pt-3 space-y-2">
              <p className="text-xs font-medium text-gray-500 flex items-center gap-1.5">
                <Package size={12}/> Vật tư mang theo
              </p>
              <div className="flex gap-2 flex-wrap">
                <Select value={newSupplyInventoryId} onChange={setNewSupplyInventoryId} className="flex-1 min-w-[140px]">
                  <option value="">Chọn vật tư…</option>
                  {inventory.map(item => {
                    const key = item._id || item.id;
                    if (!key) return null;
                    const remaining = getRemainingQuantity(key);
                    if (remaining <= 0) return null;
                    return <option key={key} value={key}>{item.itemName} (còn {remaining})</option>;
                  })}
                </Select>
                <input
                  type="number" min={1}
                  value={newSupplyQuantity}
                  onChange={e => {
                    const val = e.target.value;
                    if (!val) { setNewSupplyQuantity(""); return; }
                    const num = Number(val);
                    if (!Number.isNaN(num)) setNewSupplyQuantity(num);
                  }}
                  placeholder="SL"
                  className="h-9 w-20 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700
                    focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
                />
                <Btn onClick={handleAddSupply} variant="ghost" size="sm" icon={<Plus size={13}/>}>Thêm</Btn>
              </div>

              {supplies.length > 0 && (
                <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                  {supplies.map(s => {
                    const item = inventoryMap[s.inventoryId];
                    if (!item) return null;
                    return (
                      <div key={s.inventoryId}
                        className="flex items-center justify-between px-3 py-2 bg-white text-sm hover:bg-gray-50 transition">
                        <span className="text-gray-700">
                          <span className="font-medium">{item.itemName}</span>
                          <span className="text-gray-400 ml-2">{s.quantity} / {item.quantity}</span>
                        </span>
                        <button onClick={() => handleRemoveSupply(s.inventoryId)}
                          className="text-gray-300 hover:text-red-500 transition ml-3">
                          <Trash2 size={13}/>
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="pt-1">
              <Btn
                onClick={handleAssign}
                disabled={assigning || !teamId}
                variant="success"
                icon={assigning ? <Loader2 size={13} className="animate-spin"/> : <Truck size={13}/>}
              >
                {assigning ? "Đang điều phối…" : "Xác nhận điều phối"}
              </Btn>
            </div>
          </div>

          {/* ── Hình ảnh ── */}
          {images.length > 0 && (
            <div className="border rounded-xl p-4 space-y-3">
              <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1.5">
                <Package size={13}/> Hình ảnh đính kèm
              </p>
              <div className="flex flex-wrap gap-2">
                {images.map((img, i) => (
                  <div
                    key={i}
                    onClick={() => setLightbox({ images, index: i })}
                    className="w-20 h-20 rounded-lg overflow-hidden cursor-zoom-in ring-1 ring-gray-200 hover:ring-blue-400 transition"
                  >
                    <img src={imgUrl(img)} alt={`Ảnh ${i + 1}`} className="w-full h-full object-cover" />
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>

      {/* ══ MAP (full remaining width) ══ */}
      <div className="hidden lg:block flex-1">
        {requestPoint ? (
          <MapContainer
            center={requestPoint}
            zoom={13}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <Marker position={requestPoint} icon={victimIcon}>
              <Popup>
                <b>Người cần cứu</b><br />{request.userId?.fullName}
              </Popup>
            </Marker>
            {teamPoints.map(p => (
              <Marker key={p.team._id} position={p.position}>
                <Popup>🚑 {p.team.teamName}</Popup>
              </Marker>
            ))}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Không có dữ liệu bản đồ
          </div>
        )}
      </div>

      {/* ── Lightbox ── */}
      {lightbox && createPortal(
        <div
          onClick={() => setLightbox(null)}
          className="fixed inset-0 bg-black/90 flex items-center justify-center"
          style={{ zIndex: 99999 }}
        >
          <button onClick={e => { e.stopPropagation(); setLightbox(null); }}
            className="fixed top-5 right-5 text-white/70 hover:text-white transition"
            style={{ zIndex: 100000 }}>
            <X size={26}/>
          </button>
          <button
            onClick={e => { e.stopPropagation(); setLightbox(prev => prev && { ...prev, index: (prev.index - 1 + prev.images.length) % prev.images.length }); }}
            className="fixed left-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
            style={{ zIndex: 100000 }}>
            <ChevronLeft size={40}/>
          </button>
          <img
            src={imgUrl(lightbox.images[lightbox.index])}
            onClick={e => e.stopPropagation()}
            className="max-h-[82vh] max-w-[88vw] rounded-xl object-contain shadow-2xl"
          />
          <button
            onClick={e => { e.stopPropagation(); setLightbox(prev => prev && { ...prev, index: (prev.index + 1) % prev.images.length }); }}
            className="fixed right-5 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition"
            style={{ zIndex: 100000 }}>
            <ChevronRight size={40}/>
          </button>
          <div className="fixed bottom-5 left-1/2 -translate-x-1/2 text-white/50 text-sm" style={{ zIndex: 100000 }}>
            {lightbox.index + 1} / {lightbox.images.length}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
}