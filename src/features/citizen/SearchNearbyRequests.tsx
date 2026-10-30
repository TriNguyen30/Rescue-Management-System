import { useEffect, useMemo, useState, useCallback } from "react";
import { MapContainer, Marker, Popup, Polyline, TileLayer, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { Loader2, MapPin, LocateFixed, AlertCircle, Search, Radio, ChevronRight, Navigation, X } from "lucide-react";

import type { RescueRequest } from "@/types/rescue-requests";
import { getNearbyRescueRequests } from "@/services/rescue-request.service";
import { API_BASE_URL } from "@/config/env";

import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

function FlyToLocation({ position }: { position: [number, number] | null }) {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.flyTo(position, 14, { duration: 1.2 });
    }
  }, [position, map]);
  return null;
}

function FitRoute({ points }: { points: [number, number][] }) {
  const map = useMap();
  useEffect(() => {
    if (points.length >= 2) {
      map.fitBounds(L.latLngBounds(points), { padding: [48, 48], maxZoom: 16, animate: true });
    }
  }, [points, map]);
  return null;
}

const DEFAULT_CENTER: [number, number] = [21.0278, 105.8342];
const DEFAULT_RADIUS = 5000;

const imgUrl = (path: string) =>
  path.startsWith("/") ? `${API_BASE_URL || ""}${path}` : path;

const URGENCY_CONFIG: Record<string, { label: string; color: string; dot: string }> = {
  critical: { label: "Nguy kịch",  color: "text-red-600 bg-red-50 border-red-200",        dot: "bg-red-500" },
  high:     { label: "Khẩn cấp",  color: "text-orange-600 bg-orange-50 border-orange-200", dot: "bg-orange-500" },
  medium:   { label: "Trung bình", color: "text-yellow-700 bg-yellow-50 border-yellow-200", dot: "bg-yellow-400" },
  low:      { label: "Thấp",       color: "text-green-600 bg-green-50 border-green-200",   dot: "bg-green-500" },
};

const STATUS_COLORS: Record<string, string> = {
  pending:    "text-amber-700 bg-amber-50 border-amber-200",
  processing: "text-blue-700 bg-blue-50 border-blue-200",
  resolved:   "text-emerald-700 bg-emerald-50 border-emerald-200",
  cancelled:  "text-gray-500 bg-gray-100 border-gray-200",
};

export default function SearchNearbyRequests() {
  const [center, setCenter] = useState<{ lat: number; lng: number } | null>(null);
  const [latitude, setLatitude] = useState<string>("");
  const [longitude, setLongitude] = useState<string>("");
  const [radius, setRadius] = useState<number>(DEFAULT_RADIUS);
  const [items, setItems] = useState<RescueRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<string | null>(null);
  const [locating, setLocating] = useState(false);
  const [routePoints, setRoutePoints] = useState<[number, number][]>([]);
  const [routeInfo, setRouteInfo] = useState<{ distance: string; duration: string } | null>(null);
  const [routeLoading, setRouteLoading] = useState(false);

  const fetchRoute = useCallback(async (from: { lat: number; lng: number }, to: [number, number]) => {
    setRouteLoading(true);
    setRoutePoints([]);
    setRouteInfo(null);
    try {
      const url = `https://router.project-osrm.org/route/v1/driving/${from.lng},${from.lat};${to[1]},${to[0]}?overview=full&geometries=geojson`;
      const res = await fetch(url);
      const data = await res.json();
      if (data.code !== "Ok" || !data.routes?.[0]) throw new Error("No route");
      const coords: [number, number][] = data.routes[0].geometry.coordinates.map(
        ([lng, lat]: [number, number]) => [lat, lng]
      );
      setRoutePoints(coords);
      const dist = data.routes[0].distance; // meters
      const dur = data.routes[0].duration;  // seconds
      setRouteInfo({
        distance: dist >= 1000 ? `${(dist / 1000).toFixed(1)} km` : `${Math.round(dist)} m`,
        duration: dur >= 3600
          ? `${Math.floor(dur / 3600)}h ${Math.floor((dur % 3600) / 60)}p`
          : `${Math.ceil(dur / 60)} phút`,
      });
    } catch {
      setRoutePoints([]);
      setRouteInfo(null);
    } finally {
      setRouteLoading(false);
    }
  }, []);

  const locateMe = () => {
    setError(null);
    if (!navigator.geolocation) { setError("Trình duyệt không hỗ trợ định vị."); return; }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const next = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setCenter(next);
        setLatitude(String(next.lat));
        setLongitude(String(next.lng));
        setLocating(false);
      },
      (e) => {
        console.error(e);
        setError("Không lấy được vị trí. Vui lòng nhập thủ công.");
        setLocating(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  useEffect(() => { locateMe(); }, []);

  const centerTuple = useMemo<[number, number]>(() => {
    if (center) return [center.lat, center.lng];
    return DEFAULT_CENTER;
  }, [center]);

  const handleSearch = async () => {
    setError(null);
    setLoading(true);
    try {
      const lat = Number(latitude);
      const lng = Number(longitude);
      if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
        setError("Vui lòng nhập đúng latitude và longitude.");
        return;
      }
      if (!Number.isFinite(radius) || radius <= 0) {
        setError("Bán kính phải lớn hơn 0.");
        return;
      }
      const data = await getNearbyRescueRequests(lat, lng, radius);
      setItems(data);
      setCenter({ lat, lng });
    } catch (e) {
      setError(e instanceof Error ? e.message : "Không thể tải các yêu cầu.");
    } finally {
      setLoading(false);
    }
  };

  const requestMarkers = useMemo(() => {
    return items
      .filter((r) => r.location?.coordinates?.length === 2)
      .map((r) => {
        const [reqLng, reqLat] = r.location.coordinates;
        return { req: r, position: [reqLat, reqLng] as [number, number] };
      });
  }, [items]);

  const urgencyKey = (level?: string) => (level || "").toLowerCase();

  return (
    <div
      className="min-h-screen bg-gray-50"
      style={{ fontFamily: "'DM Sans', 'Helvetica Neue', sans-serif" }}
    >
      <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 sm:py-8 space-y-5">

        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div
              className="flex items-center justify-center w-10 h-10 rounded-xl shadow-sm"
              style={{ background: "linear-gradient(135deg, #ef4444, #b91c1c)" }}
            >
              <Radio className="w-5 h-5 text-white" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-gray-900 tracking-tight">Yêu cầu cứu hộ lân cận</h1>
              <p className="text-xs text-gray-500 mt-0.5">Tìm kiếm theo vị trí & bán kính</p>
            </div>
          </div>

          {center && (
            <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-mono text-gray-600 bg-white border border-gray-200 shadow-sm">
              <MapPin className="w-3.5 h-3.5 text-blue-500" />
              {center.lat.toFixed(4)}, {center.lng.toFixed(4)}
            </div>
          )}
        </div>

        {/* Search Panel */}
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm p-4 sm:p-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Latitude
              </label>
              <input
                value={latitude}
                onChange={(e) => setLatitude(e.target.value)}
                placeholder="vd: 10.8443"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Longitude
              </label>
              <input
                value={longitude}
                onChange={(e) => setLongitude(e.target.value)}
                placeholder="vd: 106.7871"
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 placeholder-gray-400 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-400 uppercase tracking-widest mb-1.5">
                Bán kính (m)
              </label>
              <input
                type="number"
                min={1}
                value={radius}
                onChange={(e) => setRadius(Number(e.target.value))}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none focus:border-blue-400 focus:ring-2 focus:ring-blue-100 transition"
              />
            </div>

            <div className="flex items-end gap-2">
              <button
                type="button"
                onClick={locateMe}
                disabled={locating}
                title="Lấy vị trí hiện tại"
                className="flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-xl border border-gray-200 bg-white text-sm font-semibold text-gray-600 hover:bg-gray-50 transition shadow-sm disabled:opacity-60"
              >
                {locating
                  ? <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  : <LocateFixed className="w-4 h-4 text-blue-500" />
                }
                <span className="hidden sm:inline">GPS</span>
              </button>

              <button
                type="button"
                onClick={handleSearch}
                disabled={loading}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-bold text-white transition disabled:opacity-50 disabled:cursor-not-allowed"
                style={{
                  background: "linear-gradient(135deg, #3b82f6, #1d4ed8)",
                  boxShadow: "0 2px 8px rgba(59,130,246,0.25)",
                }}
              >
                {loading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Search className="w-4 h-4" />
                }
                Tìm kiếm
              </button>
            </div>
          </div>

          {error && (
            <div className="mt-3 flex items-start gap-2 px-3 py-2.5 rounded-xl text-sm text-red-600 bg-red-50 border border-red-200">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Main content */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">

          {/* List */}
          <div className="lg:col-span-2">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
                <span className="text-sm font-semibold text-gray-800">Danh sách</span>
                {items.length > 0 && (
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full text-blue-600 bg-blue-50 border border-blue-100">
                    {items.length} kết quả
                  </span>
                )}
              </div>

              <div className="overflow-y-auto" style={{ maxHeight: 490 }}>
                {items.length === 0 && !loading ? (
                  <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
                    <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                      <Search className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-sm text-gray-500">Chưa có dữ liệu</p>
                    <p className="text-xs text-gray-400 mt-1">
                      Bấm <span className="text-gray-600 font-medium">Tìm kiếm</span> để bắt đầu
                    </p>
                  </div>
                ) : (
                  <div className="p-3 space-y-2">
                    {items.map((r) => {
                      const uKey = urgencyKey(r.urgencyLevel);
                      const urg = URGENCY_CONFIG[uKey];
                      const statusColor = STATUS_COLORS[r.status] || STATUS_COLORS.cancelled;
                      const isSelected = selected === r._id;

                      return (
                        <div
                          key={r._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelected(null);
                              setRoutePoints([]);
                              setRouteInfo(null);
                            } else {
                              setSelected(r._id);
                              if (center && r.location?.coordinates?.length === 2) {
                                const [rLng, rLat] = r.location.coordinates;
                                fetchRoute(center, [rLat, rLng]);
                              }
                            }
                          }}
                          className="group cursor-pointer rounded-xl p-3 transition-all border"
                          style={{
                            background: isSelected ? "#eff6ff" : "#f9fafb",
                            borderColor: isSelected ? "#bfdbfe" : "#f3f4f6",
                          }}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-blue-600">
                              {r.requestCode}
                            </span>
                            {urg && (
                              <span className={`inline-flex items-center gap-1 text-[10px] font-bold px-1.5 py-0.5 rounded-full border ${urg.color} flex-shrink-0`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${urg.dot}`} />
                                {urg.label}
                              </span>
                            )}
                          </div>

                          <p className="mt-1.5 text-sm text-gray-700 line-clamp-2 leading-relaxed">
                            {r.description}
                          </p>

                          <div className="mt-2 flex items-center justify-between gap-2">
                            <span className={`inline-block text-[10px] font-semibold px-2 py-0.5 rounded-full border ${statusColor}`}>
                              {r.status}
                            </span>
                            {r.userId?.fullName && (
                              <span className="text-[10px] text-gray-400 truncate max-w-[120px]">
                                {r.userId.fullName}
                              </span>
                            )}
                            <ChevronRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-500 transition flex-shrink-0" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Map */}
          <div className="lg:col-span-3">
            <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
              <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-100">
                <div className="flex gap-1.5">
                  <span className="w-3 h-3 rounded-full bg-red-400" />
                  <span className="w-3 h-3 rounded-full bg-yellow-400" />
                  <span className="w-3 h-3 rounded-full bg-green-400" />
                </div>
                <span className="text-xs text-gray-500 ml-2 font-medium">Bản đồ khu vực</span>
                {routeLoading && (
                  <span className="ml-auto flex items-center gap-1.5 text-[10px] text-blue-500">
                    <Loader2 className="w-3 h-3 animate-spin" /> Đang tính đường...
                  </span>
                )}
                {routeInfo && !routeLoading && (
                  <span className="ml-auto flex items-center gap-2">
                    <span className="flex items-center gap-1 text-[11px] font-semibold text-blue-600 bg-blue-50 border border-blue-100 px-2 py-0.5 rounded-full">
                      <Navigation className="w-3 h-3" />
                      {routeInfo.distance} · {routeInfo.duration}
                    </span>
                    <button
                      onClick={() => { setSelected(null); setRoutePoints([]); setRouteInfo(null); }}
                      className="text-gray-400 hover:text-gray-600 transition"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </span>
                )}
                {!routeLoading && !routeInfo && requestMarkers.length > 0 && (
                  <span className="ml-auto text-[10px] text-gray-400">{requestMarkers.length} điểm</span>
                )}
              </div>

              <div style={{ height: 490 }}>
                <MapContainer
                  center={centerTuple}
                  zoom={center ? 14 : 13}
                  style={{ width: "100%", height: "100%" }}
                >
                  <TileLayer
                    attribution="&copy; OpenStreetMap contributors"
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />

                  <FlyToLocation position={routePoints.length === 0 && center ? [center.lat, center.lng] : null} />
                  {routePoints.length >= 2 && <FitRoute points={routePoints} />}

                  {routePoints.length >= 2 && (
                    <>
                      {/* Route shadow */}
                      <Polyline
                        positions={routePoints}
                        pathOptions={{ color: "#93c5fd", weight: 7, opacity: 0.5 }}
                      />
                      {/* Route line */}
                      <Polyline
                        positions={routePoints}
                        pathOptions={{ color: "#2563eb", weight: 4, opacity: 0.95, dashArray: undefined }}
                      />
                    </>
                  )}
                  {center && (
                    <Marker position={[center.lat, center.lng]}>
                      <Popup>
                        <div style={{ fontFamily: "DM Sans, sans-serif" }}>
                          <strong>📍 Vị trí tìm kiếm</strong>
                          <div style={{ fontSize: 11, color: "#64748b", marginTop: 2 }}>
                            {center.lat.toFixed(5)}, {center.lng.toFixed(5)}
                          </div>
                        </div>
                      </Popup>
                    </Marker>
                  )}

                  {requestMarkers.map(({ req, position }) => (
                    <Marker key={req._id} position={position}>
                      <Popup>
                        <div style={{ fontFamily: "DM Sans, sans-serif", minWidth: 180 }}>
                          <div style={{ fontWeight: 700, fontSize: 13, color: "#1d4ed8", fontFamily: "monospace" }}>
                            {req.requestCode}
                          </div>
                          <p style={{ fontSize: 12, color: "#374151", margin: "4px 0" }}>{req.description}</p>
                          <div style={{ fontSize: 11, color: "#6b7280" }}>
                            Trạng thái: <strong style={{ color: "#111827" }}>{req.status}</strong>
                          </div>
                          {req.userId?.fullName && (
                            <div style={{ fontSize: 11, color: "#6b7280", marginTop: 2 }}>
                              Người gửi: <strong style={{ color: "#111827" }}>{req.userId.fullName}</strong>
                            </div>
                          )}
                          {req.images?.[0] && (
                            <img
                              src={imgUrl(req.images[0])}
                              alt={req.description}
                              style={{ width: "100%", height: 80, objectFit: "cover", borderRadius: 6, marginTop: 6 }}
                            />
                          )}
                        </div>
                      </Popup>
                    </Marker>
                  ))}
                </MapContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}