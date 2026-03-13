import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'

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

export default function Map() {
  const [position, setPosition] = useState<Position | null>(null)
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

  const center: [number, number] = position ? [position.lat, position.lng] : DEFAULT_CENTER
  const zoom = position ? 16 : 13

  return (
    // Use 100dvh (dynamic viewport height) so the map always fills the screen
    // minus the navbar, with no scroll on this page specifically.
    <div className="relative w-full" style={{ height: 'calc(100dvh - var(--navbar-height, 64px))' }}>
      {error && (
        <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-xl shadow-md pointer-events-none">
          {error}
        </div>
      )}
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ width: '100%', height: '100%' }}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        {position && <ChangeView center={center} zoom={zoom} />}
        {position && (
          <Marker position={center} icon={userLocationIcon}>
            <Popup>📍 Vị trí hiện tại của bạn</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}