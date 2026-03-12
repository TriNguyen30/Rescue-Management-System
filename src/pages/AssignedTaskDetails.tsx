import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2, AlertCircle, MapPin, Navigation2 } from "lucide-react";
import { MapContainer, TileLayer, Marker, Polyline, Popup, useMap } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

import { getRescueRequestById } from "@/services/rescue-request.service";
import { getResuceTeamById } from "@/services/rescue-team.service";
import type { RescueRequest } from "@/types/rescue-requests";
import type { RescueTeam } from "@/types/rescue-teams";

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

export default function AssignedTaskDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RescueRequest | null>(null);
  const [team, setTeam] = useState<RescueTeam | null>(null);
  const [route, setRoute] = useState<[number, number][]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
    <div className="h-screen flex bg-gray-50">

      {/* SIDEBAR */}
      <div className="w-[340px] bg-white border-r border-gray-200 p-5 overflow-y-auto">

        <button
          onClick={() => navigate("/rescue-team")}
          className="inline-flex items-center gap-2 text-sm text-gray-600 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Quay lại
        </button>

        <div className="space-y-4">

          <div className="border rounded-xl p-4">
            <p className="font-mono font-semibold text-lg">
              {request.requestCode}
            </p>

            <p className="text-gray-700 mt-2">
              {request.description}
            </p>
          </div>

          <div className="border rounded-xl p-4 text-sm space-y-2">

            <div className="flex gap-2">
              <MapPin className="w-4 h-4 text-gray-400" />
              {requestPoint
                ? `${requestPoint.lat.toFixed(5)}, ${requestPoint.lng.toFixed(5)}`
                : "Không có vị trí"}
            </div>

            <div className="flex gap-2">
              <Navigation2 className="w-4 h-4 text-gray-400" />
              {teamPoint
                ? `${teamPoint.lat.toFixed(5)}, ${teamPoint.lng.toFixed(5)}`
                : "Không có vị trí đội cứu hộ"}
            </div>

          </div>

          {team && (
            <div className="border rounded-xl p-4">
              <p className="font-semibold text-sm uppercase text-gray-500">
                Đội cứu hộ
              </p>

              <p className="font-medium mt-1">
                {team.teamName}
              </p>

              <p className="text-sm text-gray-500">
                {team.leaderId?.fullName}
              </p>

              <p className="text-sm text-gray-500">
                {team.leaderId?.phone}
              </p>
            </div>
          )}

        </div>
      </div>

      {/* MAP */}
      <div className="flex-1">

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