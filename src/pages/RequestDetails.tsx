import { useState, useEffect, useMemo } from "react";
import { createPortal } from "react-dom";
import { useParams, useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  X
} from "lucide-react";

import {
  MapContainer,
  TileLayer,
  Marker,
  Popup
} from "react-leaflet";

import L from "leaflet";
import "leaflet/dist/leaflet.css";

import { API_BASE_URL } from "@/config/env";

import {
  getRescueRequestById,
  verifyRescueRequest,
  assignRescueRequest
} from "@/services/rescue-request.service";

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

L.Icon.Default.mergeOptions({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow
});

/* victim icon */

const victimIcon = new L.Icon({
  iconUrl: "https://maps.google.com/mapfiles/ms/icons/red-dot.png",
  iconSize: [32, 32]
});

function formatDate(iso: string) {
  return new Date(iso).toLocaleString("vi-VN");
}

function imgUrl(path: string) {
  return path.startsWith("/")
    ? `${API_BASE_URL || ""}${path}`
    : path;
}

const URGENCY_LABEL: Record<string, string> = {
  LOW: "Nhẹ",
  MEDIUM: "Trung bình",
  HIGH: "Khẩn cấp",
  CRITICAL: "Nguy kịch"
};

const URGENCY_COLOR: Record<string, string> = {
  LOW: "bg-green-100 text-green-700",
  MEDIUM: "bg-yellow-100 text-yellow-700",
  HIGH: "bg-orange-100 text-orange-700",
  CRITICAL: "bg-red-100 text-red-700"
};

export default function RequestDetails() {

  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<RescueRequest | null>(null);
  const [teams, setTeams] = useState<RescueTeam[]>([]);
  const [vehicles, setVehicles] = useState<VehicleItem[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [selectedUrgency, setSelectedUrgency] =
    useState<UrgencyLevel>("HIGH");

  const [teamId, setTeamId] = useState("");
  const [vehicleId, setVehicleId] = useState("");

  const [supplies, setSupplies] =
    useState<{ inventoryId: string; quantity: number }[]>([]);

  const [newSupplyInventoryId, setNewSupplyInventoryId] =
    useState("");
  const [newSupplyQuantity, setNewSupplyQuantity] =
    useState<number | "">("");

  const [verifying, setVerifying] = useState(false);
  const [assigning, setAssigning] = useState(false);

  const [lightbox, setLightbox] =
    useState<{ images: string[]; index: number } | null>(null);

  /* LOCK SCROLL khi lightbox mở */

  useEffect(() => {
    document.body.style.overflow = lightbox ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [lightbox]);

  /* FETCH */

  useEffect(() => {

    if (!id) return;

    setLoading(true);

    Promise.all([
      getRescueRequestById(id),
      getRescueTeams(),
      getVehicles(),
      getInventoryItems()
    ])
      .then(([req, teams, vehicles, inv]) => {
        setRequest(req);
        setTeams(teams);
        setVehicles(vehicles);
        setInventory(inv);
      })
      .catch((e) =>
        setError(e instanceof Error ? e.message : "Không thể tải dữ liệu")
      )
      .finally(() => setLoading(false));

  }, [id]);

  /* LOCATION REQUEST */

  const requestPoint = useMemo(() => {

    if (!request?.location?.coordinates) return null;

    const [lng, lat] = request.location.coordinates;

    return [lat, lng] as [number, number];

  }, [request]);

  /* TEAM LOCATIONS */

  const teamPoints = useMemo(() => {

    return teams
      .filter((t) => t.currentLocation?.coordinates)
      .map((t) => {

        const [lng, lat] = t.currentLocation.coordinates;

        return {
          team: t,
          position: [lat, lng] as [number, number]
        };

      });

  }, [teams]);

  const inventoryMap = useMemo(() => {

    return inventory.reduce<Record<string, InventoryItem>>(
      (acc, item) => {
        const key = item._id || item.id;

        if (key) {
          acc[key] = item;
        }

        return acc;
      },
      {}
    );

  }, [inventory]);

  /* Vehicle lookup map */
  const vehicleMap = useMemo(() => {
    return vehicles.reduce<Record<string, VehicleItem>>(
      (acc, v) => {
        acc[v._id] = v;
        return acc;
      },
      {}
    );
  }, [vehicles]);

  const getRemainingQuantity = (inventoryId: string) => {

    const item = inventoryMap[inventoryId];

    if (!item) return 0;

    const used =
      supplies.find((s) => s.inventoryId === inventoryId)
        ?.quantity ?? 0;

    return Math.max(item.quantity - used, 0);

  };

  const handleAddSupply = () => {

    if (!newSupplyInventoryId || !newSupplyQuantity) return;

    const remaining =
      getRemainingQuantity(newSupplyInventoryId);

    if (newSupplyQuantity > remaining) {

      alert(
        "Số lượng vật tư vượt quá số lượng trong kho"
      );

      return;

    }

    setSupplies((prev) => {

      const existingIndex = prev.findIndex(
        (s) => s.inventoryId === newSupplyInventoryId
      );

      if (existingIndex !== -1) {

        const updated = [...prev];

        updated[existingIndex] = {
          ...updated[existingIndex],
          quantity: newSupplyQuantity
        };

        return updated;

      }

      return [
        ...prev,
        {
          inventoryId: newSupplyInventoryId,
          quantity: newSupplyQuantity
        }
      ];

    });

    setNewSupplyInventoryId("");
    setNewSupplyQuantity("");

  };

  const handleRemoveSupply = (inventoryId: string) => {

    setSupplies((prev) =>
      prev.filter((s) => s.inventoryId !== inventoryId)
    );

  };

  /* VERIFY */

  const handleVerify = async () => {

    if (!id) return;

    setVerifying(true);

    try {

      await verifyRescueRequest(id, selectedUrgency);

      window.location.reload();

    } catch (e) {

      alert(
        e instanceof Error
          ? e.message
          : "Không thể xác minh yêu cầu"
      );

    } finally {

      setVerifying(false);

    }

  };

  /* ASSIGN */

  const handleAssign = async () => {

    if (!id || !teamId) return;

    for (const s of supplies) {

      const item = inventoryMap[s.inventoryId];

      if (!item) {

        alert("Vật tư không hợp lệ");
        return;

      }

      if (s.quantity <= 0) {

        alert("Số lượng vật tư phải lớn hơn 0");
        return;

      }

      if (s.quantity > item.quantity) {

        alert(
          "Số lượng vật tư vượt quá số lượng trong kho"
        );

        return;

      }

    }

    setAssigning(true);

    try {

      const payload = {
        teamId,
        vehicleId: vehicleId || undefined,
        supplies
      };

      await assignRescueRequest(id, payload);

      alert("Điều phối thành công");

      window.location.reload();

    } catch (e) {

      alert(
        e instanceof Error
          ? e.message
          : "Không thể điều phối"
      );

    } finally {

      setAssigning(false);

    }

  };

  if (!id)
    return <div className="p-10 text-center">Thiếu ID</div>;

  if (loading)
    return (
      <div className="h-screen flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin" />
      </div>
    );

  if (error || !request)
    return (
      <div className="p-6 text-red-600">
        <AlertCircle />
        {error}
      </div>
    );

  const [lng, lat] =
    request.location?.coordinates ?? [0, 0];

  const images = request.images ?? [];

  /* assignedTeamId được populate thành object từ API */
  const assignedTeam =
    request.assignedTeamId &&
    typeof request.assignedTeamId === "object"
      ? (request.assignedTeamId as RescueTeam)
      : null;

  /* Phương tiện của team: map sang plateNumber */
  const assignedVehicleNames =
    assignedTeam?.vehicles
      ?.map((vid: string) => vehicleMap[vid]?.plateNumber)
      .filter(Boolean) ?? [];

  return (

    <div className="max-w-5xl mx-auto p-6 space-y-6">

      <button
        onClick={() => navigate("/coordinator")}
        className="flex items-center gap-2"
      >
        <ArrowLeft />
        Quay lại
      </button>

      {/* INFO */}

      <div className="bg-white p-6 rounded-xl border space-y-4">

        <div className="flex items-center gap-3 flex-wrap">
          <h2 className="font-bold text-lg">
            {request.requestCode}
          </h2>

          {request.urgencyLevel && (
            <span
              className={`text-xs font-semibold px-2 py-1 rounded-full ${
                URGENCY_COLOR[request.urgencyLevel] ??
                "bg-gray-100 text-gray-600"
              }`}
            >
              {URGENCY_LABEL[request.urgencyLevel] ??
                request.urgencyLevel}
            </span>
          )}
        </div>

        <p>{request.description}</p>

        <div>
          <b>Người gửi:</b> {request.userId?.fullName}
        </div>

        <div>
          <b>SĐT:</b> {request.userId?.phone}
        </div>

        <div>
          <b>Vị trí:</b>
          {lat.toFixed(6)}, {lng.toFixed(6)}
        </div>

        <div>
          <b>Thời gian:</b>
          {formatDate(request.createdAt)}
        </div>

      </div>

      {/* ASSIGNED TEAM */}

      {assignedTeam && (
        <div className="bg-blue-50 border border-blue-200 p-6 rounded-xl space-y-2">

          <h3 className="font-semibold text-blue-800">
            Đội cứu hộ đã điều phối
          </h3>

          <div>
            <b>Tên đội:</b> {assignedTeam.teamName}
          </div>

          {assignedVehicleNames.length > 0 && (
            <div>
              <b>Phương tiện:</b>{" "}
              {assignedVehicleNames.join(", ")}
            </div>
          )}

        </div>
      )}

      {/* VERIFY */}

      <div className="bg-white p-6 rounded-xl border space-y-3">

        <h3 className="font-semibold">
          Xác minh yêu cầu
        </h3>

        <select
          value={selectedUrgency}
          onChange={(e) =>
            setSelectedUrgency(
              e.target.value as UrgencyLevel
            )
          }
          className="border px-2 py-1 rounded"
        >
          <option value="LOW">Nhẹ</option>
          <option value="MEDIUM">Trung bình</option>
          <option value="HIGH">Khẩn cấp</option>
          <option value="CRITICAL">Nguy kịch</option>
        </select>

        <button
          onClick={handleVerify}
          disabled={verifying}
          className="bg-blue-600 text-white px-4 py-2 rounded"
        >
          {verifying
            ? "Đang xác minh..."
            : "Xác minh"}
        </button>

      </div>

      {/* ASSIGN */}

      <div className="bg-white p-6 rounded-xl border space-y-3">

        <h3 className="font-semibold">
          Điều phối cứu hộ
        </h3>

        <select
          value={teamId}
          onChange={(e) => setTeamId(e.target.value)}
        >
          <option value="">
            Chọn đội cứu hộ
          </option>

          {teams
            .filter((t) => t.status === "AVAILABLE")
            .map((t) => (
              <option
                key={t._id}
                value={t._id}
              >
                {t.teamName}
              </option>
            ))}

        </select>

        <select
          value={vehicleId}
          onChange={(e) =>
            setVehicleId(e.target.value)
          }
        >
          <option value="">
            Chọn phương tiện
          </option>

          {vehicles
            .filter((v) => v.status === "AVAILABLE")
            .map((v) => (
              <option
                key={v._id}
                value={v._id}
              >
                {v.plateNumber}
              </option>
            ))}

        </select>

        {/* SUPPLIES */}

        <div className="mt-4 space-y-2">

          <div className="font-medium">
            Vật tư mang theo
          </div>

          <div className="flex flex-wrap gap-2 items-center">

            <select
              value={newSupplyInventoryId}
              onChange={(e) =>
                setNewSupplyInventoryId(e.target.value)
              }
              className="border px-2 py-1 rounded"
            >
              <option value="">
                Chọn vật tư
              </option>

              {inventory.map((item) => {

                const key = item._id || item.id;

                if (!key) return null;

                const remaining =
                  getRemainingQuantity(key);

                if (remaining <= 0) return null;

                return (
                  <option
                    key={key}
                    value={key}
                  >
                    {item.itemName} (còn {remaining})
                  </option>
                );

              })}

            </select>

            <input
              type="number"
              min={1}
              value={newSupplyQuantity}
              onChange={(e) => {

                const val = e.target.value;

                if (!val) {
                  setNewSupplyQuantity("");
                  return;
                }

                const num = Number(val);

                if (Number.isNaN(num)) return;

                setNewSupplyQuantity(num);

              }}
              className="border px-2 py-1 rounded w-24"
              placeholder="Số lượng"
            />

            <button
              type="button"
              onClick={handleAddSupply}
              className="bg-gray-800 text-white px-3 py-1 rounded"
            >
              Thêm
            </button>

          </div>

          {supplies.length > 0 && (

            <div className="border rounded p-2 space-y-1 text-sm">

              {supplies.map((s) => {

                const item =
                  inventoryMap[s.inventoryId];

                if (!item) return null;

                return (
                  <div
                    key={s.inventoryId}
                    className="flex items-center justify-between gap-2"
                  >
                    <span>
                      {item.itemName}: {s.quantity} /{" "}
                      {item.quantity}
                    </span>

                    <button
                      type="button"
                      onClick={() =>
                        handleRemoveSupply(
                          s.inventoryId
                        )
                      }
                      className="text-red-600 text-xs"
                    >
                      Xóa
                    </button>
                  </div>
                );

              })}

            </div>

          )}

        </div>

        <button
          onClick={handleAssign}
          disabled={assigning}
          className="bg-green-600 text-white px-4 py-2 rounded"
        >
          {assigning
            ? "Đang điều phối..."
            : "Điều phối"}
        </button>

      </div>

      {/* MAP */}

      <div className="border rounded-xl overflow-hidden">

        <div className="h-[400px]">

          {requestPoint && (

            <MapContainer
              center={requestPoint}
              zoom={13}
              style={{ height: "100%" }}
            >

              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />

              <Marker
                position={requestPoint}
                icon={victimIcon}
              >
                <Popup>
                  <b>Người cần cứu</b>
                  <br />
                  {request.userId?.fullName}
                </Popup>
              </Marker>

              {teamPoints.map((p) => (
                <Marker
                  key={p.team._id}
                  position={p.position}
                >
                  <Popup>
                    🚑 {p.team.teamName}
                  </Popup>
                </Marker>
              ))}

            </MapContainer>

          )}

        </div>

      </div>

      {/* IMAGES */}

      {images.length > 0 && (

        <div className="flex gap-3 flex-wrap">

          {images.map((img, i) => (

            <img
              key={i}
              src={imgUrl(img)}
              onClick={() =>
                setLightbox({ images, index: i })
              }
              className="w-32 h-32 object-cover rounded cursor-zoom-in"
            />

          ))}

        </div>

      )}

      {/* LIGHTBOX — render vào document.body để thoát khỏi stacking context của Leaflet */}

      {lightbox && createPortal(
        <div
          onClick={() => setLightbox(null)}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(0,0,0,0.85)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 99999
          }}
        >
          {/* Nút đóng */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox(null);
            }}
            style={{
              position: "fixed",
              top: 20,
              right: 20,
              color: "#fff",
              background: "none",
              border: "none",
              cursor: "pointer",
              zIndex: 100000,
              lineHeight: 1
            }}
          >
            <X size={28} />
          </button>

          {/* Prev */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((prev) =>
                prev && {
                  ...prev,
                  index:
                    (prev.index - 1 + prev.images.length) %
                    prev.images.length
                }
              );
            }}
            style={{
              position: "fixed",
              left: 20,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#fff",
              background: "none",
              border: "none",
              cursor: "pointer",
              zIndex: 100000
            }}
          >
            <ChevronLeft size={40} />
          </button>

          {/* Ảnh */}
          <img
            src={imgUrl(lightbox.images[lightbox.index])}
            onClick={(e) => e.stopPropagation()}
            style={{
              maxHeight: "80vh",
              maxWidth: "90vw",
              borderRadius: 8,
              display: "block"
            }}
          />

          {/* Next */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setLightbox((prev) =>
                prev && {
                  ...prev,
                  index:
                    (prev.index + 1) % prev.images.length
                }
              );
            }}
            style={{
              position: "fixed",
              right: 20,
              top: "50%",
              transform: "translateY(-50%)",
              color: "#fff",
              background: "none",
              border: "none",
              cursor: "pointer",
              zIndex: 100000
            }}
          >
            <ChevronRight size={40} />
          </button>
        </div>,
        document.body
      )}

    </div>

  );

}