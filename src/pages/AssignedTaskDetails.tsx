import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, MapPin, Navigation2, Image as ImageIcon } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { getRescueRequestById, updateRescueRequestStatus } from "@/services/rescue-request.service";
import { getResuceTeamById } from "@/services/rescue-team.service";
import type { RescueRequest, RescueRequestStatus } from "@/types/rescue-requests";
import type { RescueTeam } from "@/types/rescue-teams";
import { API_BASE_URL } from "@/config/env";
import { uploadFile } from "@/services/upload.service";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete (L.Icon.Default.prototype as any)._getIconUrl;

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
});

const teamIcon = new L.Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

const requestIcon = teamIcon;

function FitBounds({ route }: { route: [number, number][] }) {
  const map = useMap();

  useEffect(() => {
    if (route.length > 0) {
      const bounds = L.latLngBounds(route);
      map.fitBounds(bounds, { padding: [50, 50] });
    }
  }, [route]);

  return null;
}

const imgUrl = (path: string) => (path.startsWith("/") ? `${API_BASE_URL || ""}${path}` : path);

export default function AssignedTaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RescueRequest | null>(null);
  const [team, setTeam] = useState<RescueTeam | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updateStatusError, setUpdateStatusError] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<RescueRequestStatus | "">("");
  const [cancelReason, setCancelReason] = useState("");
  const [evidenceFile, setEvidenceFile] = useState<File | null>(null);
  const [evidencePreview, setEvidencePreview] = useState<string | null>(null);

  useEffect(() => {
    if (!id) return;

    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);

      try {
        const req = await getRescueRequestById(id);
        if (cancelled) return;

        setRequest(req);

        const teamId = req.assignedTeamId?._id;

        if (teamId) {
          const t = await getResuceTeamById(teamId);
          if (!cancelled) setTeam(t);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Không thể tải thông tin nhiệm vụ");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [id]);

  useEffect(() => {
    if (request?.status) {
      setSelectedStatus(request.status as RescueRequestStatus);
    }
  }, [request]);

  useEffect(() => {
    return () => {
      if (evidencePreview) URL.revokeObjectURL(evidencePreview);
    };
  }, [evidencePreview]);

  const handleUpdateStatus = async () => {
    if (!id || !selectedStatus) return;
    setUpdatingStatus(true);
    setUpdateStatusError(null);
    try {
      if (selectedStatus === "COMPLETED") {
        if (!evidenceFile) {
          setUpdateStatusError("Vui lòng tải lên ảnh chứng thực khi hoàn thành.");
          return;
        }
      }

      if (selectedStatus === "CANCELLED") {
        if (!cancelReason.trim()) {
          setUpdateStatusError("Vui lòng nhập lý do hủy.");
          return;
        }
      }

      let evidenceImage: string | undefined = undefined;

      if (selectedStatus === "COMPLETED" && evidenceFile) {
        const res = await uploadFile(evidenceFile);
        const data = res.data as { path?: string; url?: string; data?: { path?: string } };
        const path = data?.path ?? data?.url ?? data?.data?.path;
        if (typeof path !== "string" || !path) {
          throw new Error("Upload ảnh chứng thực thất bại");
        }
        evidenceImage = path;
      }

      const updated = await updateRescueRequestStatus(id, {
        status: selectedStatus,
        evidenceImage,
        cancelReason: selectedStatus === "CANCELLED" ? cancelReason.trim() : undefined,
      });
      setRequest(updated);
      if (selectedStatus !== "COMPLETED") {
        if (evidencePreview) URL.revokeObjectURL(evidencePreview);
        setEvidenceFile(null);
        setEvidencePreview(null);
      }
      if (selectedStatus !== "CANCELLED") setCancelReason("");
    } catch (e) {
      setUpdateStatusError(
        e instanceof Error ? e.message : "Không thể cập nhật tiến độ nhiệm vụ",
      );
    } finally {
      setUpdatingStatus(false);
    }
  };

  const teamPoint = useMemo(() => {
    if (!team?.currentLocation?.coordinates) return null;
    const [lng, lat] = team.currentLocation.coordinates;
    return { lat, lng };
  }, [team]);

  const requestPoint = useMemo(() => {
    if (!request?.location?.coordinates) return null;
    const [lng, lat] = request.location.coordinates;
    return { lat, lng };
  }, [request]);

  useEffect(() => {
    const fetchRoute = async () => {
      if (!teamPoint || !requestPoint) return;

      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${teamPoint.lng},${teamPoint.lat};${requestPoint.lng},${requestPoint.lat}?overview=full&geometries=geojson`;

        const res = await fetch(url);
        const data = await res.json();

        const coordinates = data.routes[0].geometry.coordinates;

        const latlngs = coordinates.map(
          (c: [number, number]) => [c[1], c[0]] as [number, number]
        );

        setRoute(latlngs);
      } catch (err) {
        console.error("Route error:", err);
      }
    };

    fetchRoute();
  }, [teamPoint, requestPoint]);

  const mapCenter: [number, number] | null = useMemo(() => {
    if (teamPoint) return [teamPoint.lat, teamPoint.lng];
    if (requestPoint) return [requestPoint.lat, requestPoint.lng];
    return null;
  }, [teamPoint, requestPoint]);

  if (!id) {
    return (
      <div className="h-screen flex items-center justify-center">
        Thiếu ID nhiệm vụ
      </div>
    );
  }

  if (loading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center text-gray-500">
        <Loader2 className="w-12 h-12 animate-spin mb-4" />
        Đang tải chi tiết nhiệm vụ...
      </div>
    );
  }

  if (error || !request) {
    return (
      <div className="h-screen flex flex-col items-center justify-center gap-4">
        <div className="rounded-xl bg-red-50 border border-red-200 p-6 flex items-center gap-3 text-red-700">
          <AlertCircle className="w-6 h-6 shrink-0" />
          {error ?? "Không tìm thấy nhiệm vụ"}
        </div>

        <button
          onClick={() => navigate("/rescue-team")}
          className="inline-flex items-center gap-2 text-blue-600"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50">
      {/* SIDEBAR */}
      <div className="w-full lg:w-[360px] bg-white border-r border-gray-200 p-5 overflow-y-auto">
        <button
          onClick={() => navigate("/rescue-team")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div className="space-y-4">
          <div className="border rounded-xl p-4">
            <div className="flex items-center justify-between gap-2 mb-2">
              <p className="font-mono font-semibold text-lg">
                {request.requestCode}
              </p>
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 text-gray-700">
                Trạng thái: {request.status}
              </span>
            </div>

            {request.urgencyLevel && (
              <p className="text-xs font-semibold text-red-600 mb-2">
                Mức độ khẩn cấp: {request.urgencyLevel}
              </p>
            )}

            <p className="text-gray-700">
              {request.description}
            </p>

            <div className="mt-4 space-y-2">
              <p className="text-xs font-semibold text-gray-500 uppercase">
                Cập nhật tiến độ
              </p>
              <div className="flex flex-col sm:flex-row gap-2 sm:items-center">
                <select
                  value={selectedStatus}
                  onChange={(e) =>
                    setSelectedStatus(e.target.value as RescueRequestStatus | "")
                  }
                  className="border border-gray-300 rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">-- Chọn trạng thái --</option>
                  <option value="IN_PROGRESS">Đang thực hiện</option>
                  <option value="COMPLETED">Hoàn thành</option>
                  <option value="CANCELLED">Hủy</option>
                </select>
                <button
                  type="button"
                  onClick={handleUpdateStatus}
                  disabled={updatingStatus || !selectedStatus }
                  className="inline-flex items-center justify-center px-3 py-1.5 rounded-md text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {updatingStatus ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Đang lưu...
                    </>
                  ) : (
                    "Lưu tiến độ"
                  )}
                </button>
              </div>

              {selectedStatus === "COMPLETED" && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Ảnh chứng thực (bắt buộc)
                  </p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const f = e.target.files?.[0] ?? null;
                      if (evidencePreview) URL.revokeObjectURL(evidencePreview);
                      setEvidenceFile(f);
                      setEvidencePreview(f ? URL.createObjectURL(f) : null);
                    }}
                    className="block w-full text-sm text-gray-700"
                  />
                  {evidencePreview && (
                    <img
                      src={evidencePreview}
                      alt="Ảnh chứng thực"
                      className="w-full max-w-[260px] rounded-lg border border-gray-200 object-cover"
                    />
                  )}
                </div>
              )}

              {selectedStatus === "CANCELLED" && (
                <div className="mt-3 space-y-2">
                  <p className="text-xs font-semibold text-gray-500 uppercase">
                    Lý do hủy
                  </p>
                  <textarea
                    value={cancelReason}
                    onChange={(e) => setCancelReason(e.target.value)}
                    rows={3}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Ví dụ: Đã có đội khác đến cứu..."
                  />
                </div>
              )}

              {updateStatusError && (
                <p className="text-xs text-red-600">{updateStatusError}</p>
              )}

              {request.status === "COMPLETED" && request.evidenceImage && (
                <div className="mt-3 space-y-2 pt-3 border-t border-gray-100">
                  <p className="text-xs font-semibold text-gray-500 uppercase flex items-center gap-1">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Ảnh chứng thực
                  </p>
                  <a
                    href={imgUrl(request.evidenceImage)}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 hover:scale-105 transition-all w-fit"
                  >
                    <img
                      src={imgUrl(request.evidenceImage)}
                      alt="Ảnh chứng thực"
                      className="w-full max-w-[260px] object-cover rounded-lg"
                    />
                  </a>
                </div>
              )}

              {request.status === "CANCELLED" && request.cancelReason && (
                <div className="mt-3 pt-3 border-t border-gray-100 space-y-1">
                  <p className="text-xs font-semibold text-red-500 uppercase">Lý do hủy</p>
                  <p className="text-sm text-gray-700">{request.cancelReason}</p>
                </div>
              )}
            </div>
          </div>

          <div className="border rounded-xl p-4 text-sm space-y-2">
            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              <span>
                Vị trí người cần cứu:&nbsp;
                {requestPoint
                  ? `${requestPoint.lat.toFixed(5)}, ${requestPoint.lng.toFixed(5)}`
                  : "Không có vị trí"}
              </span>
            </div>

            <div className="flex gap-2">
              <span className="w-4 h-4" />
              <span>
                Người cần cứu:&nbsp;
                {request.userId?.fullName || "—"}
                {request.userId?.phone ? ` • ${request.userId.phone}` : ""}
              </span>
            </div>

            <div className="flex gap-2">
              <Navigation2 className="w-4 h-4 text-gray-400" />
              <span>
                Vị trí đội cứu hộ:&nbsp;
                {teamPoint
                  ? `${teamPoint.lat.toFixed(5)}, ${teamPoint.lng.toFixed(5)}`
                  : "Không có vị trí đội cứu hộ"}
              </span>
            </div>
          </div>

          {request.images && request.images.length > 0 && (
            <div className="border rounded-xl p-4 space-y-3">
              <h2 className="text-sm font-semibold text-gray-800 uppercase tracking-wide flex items-center gap-2">
                <ImageIcon className="w-4 h-4" />
                Ảnh hiện trường
              </h2>
              <div className="flex flex-wrap gap-3">
                {request.images.map((img, idx) => (
                  <a
                    key={idx}
                    href={imgUrl(img)}
                    target="_blank"
                    rel="noreferrer"
                    className="block rounded-lg overflow-hidden border border-gray-200 hover:border-blue-300 hover:scale-105 transition-all"
                  >
                    <img
                      src={imgUrl(img)}
                      alt={`Ảnh hiện trường ${idx + 1}`}
                      className="w-24 h-24 object-cover"
                    />
                  </a>
                ))}
              </div>
            </div>
          )}

          {team && (
            <div className="border rounded-xl p-4 space-y-2 text-sm">
              <p className="font-semibold text-xs uppercase text-gray-500">
                Đội cứu hộ
              </p>

              <p className="font-medium">
                {team.teamName}
              </p>

              <p className="text-gray-500">
                Trưởng nhóm: {team.leaderId?.fullName} • {team.leaderId?.phone}
              </p>

              {request.assignedTeamId?.vehicles && request.assignedTeamId.vehicles.length > 0 && (
                <div className="pt-2 border-t border-gray-100 mt-2">
                  <p className="font-semibold text-xs text-gray-500 mb-1">
                    Phương tiện sử dụng (ID):
                  </p>
                  <ul className="list-disc list-inside space-y-0.5 text-xs text-gray-700 font-mono">
                    {request.assignedTeamId.vehicles.map((v) => (
                      <li key={v}>{v}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* MAP */}
      <div className="hidden lg:block flex-1">
        {mapCenter ? (
          <MapContainer
            center={mapCenter}
            zoom={14}
            style={{ width: "100%", height: "100%" }}
          >
            <TileLayer
              attribution="&copy; OpenStreetMap contributors"
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {teamPoint && (
              <Marker position={[teamPoint.lat, teamPoint.lng]} icon={teamIcon}>
                <Popup>Đội cứu hộ</Popup>
              </Marker>
            )}

            {requestPoint && (
              <Marker position={[requestPoint.lat, requestPoint.lng]} icon={requestIcon}>
                <Popup>Người cần cứu</Popup>
              </Marker>
            )}

            {route.length > 0 && (
              <>
                <Polyline positions={route} weight={5} color="blue" />
                <FitBounds route={route} />
              </>
            )}
          </MapContainer>
        ) : (
          <div className="flex items-center justify-center h-full text-gray-500">
            Không có dữ liệu bản đồ
          </div>
        )}
      </div>
    </div>
  );
}