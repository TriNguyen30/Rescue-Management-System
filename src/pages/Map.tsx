import { useEffect, useMemo, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap, useMapEvents } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { RescueRequestPanel } from '@/pages/Citizen'

const userLocationIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
})

const DEFAULT_CENTER: [number, number] = [21.0278, 105.8342]

type Position = { lat: number; lng: number }

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center[0], center[1], zoom])
  return null
}

function LocationPicker({ onPick }: { onPick: (p: Position) => void }) {
  useMapEvents({
    click: (e) => onPick({ lat: e.latlng.lat, lng: e.latlng.lng }),
  })
  return null
}

export default function Map() {
  const [position, setPosition] = useState<Position | null>(null)
  const [picked, setPicked] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!navigator.geolocation) {
      setError('Trình duyệt không hỗ trợ định vị vị trí.')
      return
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      (err) => {
        console.error(err)
        setError('Không lấy được vị trí hiện tại. Hãy kiểm tra quyền truy cập vị trí.')
      },
      { enableHighAccuracy: true, timeout: 10000 },
    )
  }, [])

  const effective = picked ?? position
  const center: [number, number] = effective ? [effective.lat, effective.lng] : DEFAULT_CENTER
  const zoom = effective ? 16 : 13

  const panelLocation = useMemo(() => {
    if (!effective) return null
    return { lat: effective.lat, lng: effective.lng }
  }, [effective?.lat, effective?.lng])

  return (
    <div
      className="w-full"
      style={{ height: 'calc(100dvh - var(--navbar-height, 64px))' }}
    >
      <div className="flex h-full">
        {/* Sidebar: Citizen rescue request form */}
        <aside className="hidden lg:block w-[450px] shrink-0 border-r border-gray-100 bg-gray-50 overflow-y-auto">
          <div className="p-4">
            <div className="mb-3 rounded-2xl border border-gray-100 bg-white p-3 text-sm text-gray-600">
              <p className="font-semibold text-gray-800">Chọn vị trí trên bản đồ</p>
              <p className="text-xs text-gray-500 mt-1">
                Click vào bản đồ để chọn vị trí chính xác. Tọa độ sẽ tự điền vào form.
              </p>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-xs text-gray-400">Đang chọn:</span>
                <span className="text-xs font-mono text-gray-700">
                  {effective ? `${effective.lat.toFixed(5)}, ${effective.lng.toFixed(5)}` : '—'}
                </span>
                {picked && (
                  <button
                    type="button"
                    className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700"
                    onClick={() => setPicked(null)}
                  >
                    Dùng GPS
                  </button>
                )}
              </div>
            </div>
            <RescueRequestPanel embedded externalLocation={panelLocation} />
          </div>
        </aside>

        {/* Map */}
        <div className="relative flex-1">
          {error && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-xl shadow-md pointer-events-none">
              {error}
            </div>
          )}
          <MapContainer center={center} zoom={zoom} style={{ width: '100%', height: '100%' }}>
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />
            <LocationPicker onPick={setPicked} />
            {effective && <ChangeView center={center} zoom={zoom} />}
            {effective && (
              <Marker position={center} icon={userLocationIcon}>
                <Popup>{picked ? '📍 Vị trí bạn chọn' : '📍 Vị trí hiện tại của bạn'}</Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  )
}