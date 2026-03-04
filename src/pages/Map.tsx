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

type Position = {
  lat: number
  lng: number
}

function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center, zoom)
  }, [map, center, zoom])
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
      (pos) => {
        setPosition({
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
        })
      },
      (err) => {
        console.error(err)
        setError('Không lấy được vị trí hiện tại. Hãy kiểm tra quyền truy cập vị trí.')
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    )
  }, [])

  return (
    <div className="w-full" style={{ height: 'calc(100vh - 64px)' }}>
      {error && (
        <div className="p-4 text-sm text-red-600">
          {error}
        </div>
      )}

      <MapContainer
        center={position ?? { lat: 21.0278, lng: 105.8342 }} // Hà Nội fallback
        zoom={position ? 16 : 13}
        className="w-full h-full"
      >
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {position && (
          <ChangeView center={[position.lat, position.lng]} zoom={16} />
        )}

        {position && (
          <Marker position={position} icon={userLocationIcon}>
            <Popup>Vị trí hiện tại của bạn</Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  )
}
