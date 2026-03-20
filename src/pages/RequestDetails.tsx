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

/* ─── Reusable Card ─── */
function Card({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white rounded-2xl border border-gray-100 shadow-sm p-6 ${className}`}>
      {children}
    </div>
  );
}

function SectionTitle({ icon, children }: { icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <span className="text-gray-400">{icon}</span>
      <h3 className="font-semibold text-gray-800 text-sm tracking-wide uppercase">{children}</h3>
    </div>
  );
}

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

  const [request, setRequest]   = useState<RescueRequest | null>(null);
  const [teams, setTeams]       = useState<RescueTeam[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
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

  /* ─── States ─── */
  if (!id) return <div className="p-10 text-center text-gray-500">Thiếu ID yêu cầu</div>;

  if (loading) return (
    <div className="h-screen flex items-center justify-center bg-gray-50">
      <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
    </div>
  );

  if (error || !request) return (
    <div className="p-6 flex items-center gap-2 text-red-600">
      <AlertCircle size={18} /> {error}
    </div>
  );

  const [lng, lat] = request.location?.coordinates ?? [0, 0];
  const images = request.images ?? [];
  const assignedTeam =
    request.assignedTeamId && typeof request.assignedTeamId === "object"
      ? (request.assignedTeamId as NonNullable<RescueRequest["assignedTeamId"]>)
      : null;
  const isAssigned = Boolean(request.assignedTeamId);
  const assignedVehicleNames =
    assignedTeam?.vehicles?.map((vid: string) => vehicleMap[vid]?.plateNumber).filter(Boolean) ?? [];

  /* ─── Render ─── */
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto px-4 py-8 space-y-5">

        {/* Back */}
        <button
          onClick={() => navigate("/coordinator")}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
        >
          <ArrowLeft size={16} /> Quay lại danh sách
        </button>

        {/* ── Thông tin yêu cầu ── */}
        <Card>
          <div className="flex items-start justify-between gap-4 flex-wrap">
            <div>
              <p className="text-xs text-gray-400 mb-1 font-mono">{request.requestCode}</p>
              <h2 className="text-xl font-bold text-gray-900 leading-tight">{request.description}</h2>
            </div>
            {request.urgencyLevel && (
              <span className={`shrink-0 text-xs font-semibold px-3 py-1 rounded-full ${URGENCY_BADGE[request.urgencyLevel] ?? "bg-gray-100 text-gray-600"}`}>
                {URGENCY_LABEL[request.urgencyLevel] ?? request.urgencyLevel}
              </span>
            )}
          </div>

          <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-3">
            {[
              { icon: <User size={15}/>,   label: "Người gửi",  value: request.userId?.fullName },
              { icon: <Phone size={15}/>,  label: "Số điện thoại", value: request.userId?.phone },
              { icon: <MapPin size={15}/>, label: "Vị trí",     value: `${lat.toFixed(6)}, ${lng.toFixed(6)}` },
              { icon: <Clock size={15}/>,  label: "Thời gian",  value: formatDate(request.createdAt) }
            ].map(({ icon, label, value }) => (
              <div key={label} className="flex items-start gap-2.5 p-3 bg-gray-50 rounded-xl">
                <span className="mt-0.5 text-gray-400 shrink-0">{icon}</span>
                <div>
                  <p className="text-[11px] text-gray-400 font-medium">{label}</p>
                  <p className="text-sm text-gray-800 font-medium">{value || "—"}</p>
                </div>
              </div>
            ))}
          </div>
        </Card>

        {/* ── Đội đã điều phối ── */}
        {assignedTeam && (
          <div className="bg-blue-50 border border-blue-200 rounded-2xl px-6 py-4 flex items-start gap-3">
            <Truck size={18} className="text-blue-500 mt-0.5 shrink-0" />
            <div>
              <p className="text-sm font-semibold text-blue-800">Đội cứu hộ đã điều phối</p>
              <p className="text-sm text-blue-700 mt-0.5">{assignedTeam.teamName}</p>
              {assignedVehicleNames.length > 0 && (
                <p className="text-xs text-blue-500 mt-0.5">Phương tiện: {assignedVehicleNames.join(", ")}</p>
              )}
            </div>
          </div>
        )}

        {/* ── Xác minh ── */}
        <Card>
          <SectionTitle icon={<ShieldCheck size={16}/>}>Xác minh yêu cầu</SectionTitle>
          <div className="flex items-center gap-3 flex-wrap">
            <Select
              value={selectedUrgency}
              onChange={v => setSelectedUrgency(v as UrgencyLevel)}
              className="w-44"
              disabled={isAssigned}
            >
              <option value="LOW">Nhẹ</option>
              <option value="MEDIUM">Trung bình</option>
              <option value="HIGH">Khẩn cấp</option>
              <option value="CRITICAL">Nguy kịch</option>
            </Select>
            <Btn onClick={handleVerify} disabled={verifying || isAssigned} variant="primary"
              icon={verifying ? <Loader2 size={14} className="animate-spin"/> : undefined}>
              {verifying ? "Đang xác minh…" : "Xác minh"}
            </Btn>
            {isAssigned && (
              <span className="text-xs text-gray-500">
                Yêu cầu đã được điều phối, không thể xác minh nữa.
              </span>
            )}
          </div>
        </Card>

        {/* ── Điều phối ── */}
        <Card>
          <SectionTitle icon={<Truck size={16}/>}>Điều phối cứu hộ</SectionTitle>

          <div className="flex flex-wrap gap-3 mb-5">
            <Select value={teamId} onChange={setTeamId} className="flex-1 min-w-[180px]">
              <option value="">Chọn đội cứu hộ</option>
              {teams.filter(t => t.status === "AVAILABLE").map(t => (
                <option key={t._id} value={t._id}>{t.teamName}</option>
              ))}
            </Select>
            <Select value={vehicleId} onChange={setVehicleId} className="flex-1 min-w-[160px]">
              <option value="">Chọn phương tiện</option>
              {vehicles.filter(v => v.status === "AVAILABLE").map(v => (
                <option key={v._id} value={v._id}>{v.plateNumber}</option>
              ))}
            </Select>
          </div>

          {/* Supplies */}
          <div className="border-t border-gray-100 pt-4 space-y-3">
            <div className="flex items-center gap-2 text-sm font-medium text-gray-600">
              <Package size={14}/> Vật tư mang theo
            </div>

            <div className="flex flex-wrap gap-2 items-center">
              <Select value={newSupplyInventoryId} onChange={setNewSupplyInventoryId} className="flex-1 min-w-[180px]">
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
                placeholder="Số lượng"
                className="h-9 w-28 px-3 rounded-lg border border-gray-200 bg-gray-50 text-sm text-gray-700
                  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition"
              />
              <Btn onClick={handleAddSupply} variant="ghost" size="sm" icon={<Plus size={14}/>}>Thêm</Btn>
            </div>

            {supplies.length > 0 && (
              <div className="rounded-xl border border-gray-100 divide-y divide-gray-50 overflow-hidden">
                {supplies.map(s => {
                  const item = inventoryMap[s.inventoryId];
                  if (!item) return null;
                  return (
                    <div key={s.inventoryId}
                      className="flex items-center justify-between px-4 py-2.5 bg-white text-sm hover:bg-gray-50 transition">
                      <span className="text-gray-700">
                        <span className="font-medium">{item.itemName}</span>
                        <span className="text-gray-400 ml-2">{s.quantity} / {item.quantity}</span>
                      </span>
                      <button onClick={() => handleRemoveSupply(s.inventoryId)}
                        className="text-gray-300 hover:text-red-500 transition ml-4">
                        <Trash2 size={14}/>
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          <div className="mt-5 pt-4 border-t border-gray-100">
            <Btn onClick={handleAssign} disabled={assigning || !teamId} variant="success"
              icon={assigning ? <Loader2 size={14} className="animate-spin"/> : <Truck size={14}/>}>
              {assigning ? "Đang điều phối…" : "Xác nhận điều phối"}
            </Btn>
          </div>
        </Card>

        {/* ── Bản đồ ── */}
        {requestPoint && (
          <Card className="!p-0 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
              <MapPin size={15} className="text-gray-400"/>
              <span className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Bản đồ vị trí</span>
            </div>
            <div className="h-[380px]">
              <MapContainer center={requestPoint} zoom={13} style={{ height: "100%" }}>
                <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
                <Marker position={requestPoint} icon={victimIcon}>
                  <Popup><b>Người cần cứu</b><br/>{request.userId?.fullName}</Popup>
                </Marker>
                {teamPoints.map(p => (
                  <Marker key={p.team._id} position={p.position}>
                    <Popup>🚑 {p.team.teamName}</Popup>
                  </Marker>
                ))}
              </MapContainer>
            </div>
          </Card>
        )}

        {/* ── Hình ảnh ── */}
        {images.length > 0 && (
          <Card>
            <SectionTitle icon={<Package size={16}/>}>Hình ảnh đính kèm</SectionTitle>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {images.map((img, i) => (
                <div key={i} onClick={() => setLightbox({ images, index: i })}
                  className="aspect-square rounded-xl overflow-hidden cursor-zoom-in
                    ring-1 ring-gray-100 hover:ring-blue-400 transition">
                  <img src={imgUrl(img)} className="w-full h-full object-cover"/>
                </div>
              ))}
            </div>
          </Card>
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