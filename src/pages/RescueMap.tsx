import { useEffect, useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ManagerLayout } from '@/components/ui/ManagerSidebar'
import { useLocation } from 'react-router-dom'

// ── Fix Leaflet's broken default icon paths when bundled with Vite/Webpack ────
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png'
import markerIcon from 'leaflet/dist/images/marker-icon.png'
import markerShadow from 'leaflet/dist/images/marker-shadow.png'
import { Locate, LocateFixed } from 'lucide-react'

delete (L.Icon.Default.prototype as any)._getIconUrl
L.Icon.Default.mergeOptions({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
})

// ── Types ─────────────────────────────────────────────────────────────────────
type Position = {
    lat: number
    lng: number
}

// ── Helpers ───────────────────────────────────────────────────────────────────
const DEFAULT_CENTER: [number, number] = [21.0278, 105.8342] // Hà Nội
const DEFAULT_ZOOM = 13

const userLocationIcon = new L.Icon({
    iconUrl: markerIcon,
    iconRetinaUrl: markerIcon2x,
    shadowUrl: markerShadow,
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41],
})

// ── ChangeView — must be rendered inside MapContainer ─────────────────────────
function ChangeView({ center, zoom }: { center: [number, number]; zoom: number }) {
    const map = useMap()
    useEffect(() => {
        map.setView(center, zoom)
    }, [map, center[0], center[1], zoom])
    return null
}

function LocateControl({
    onLocated,
    onError,
    setLocating,
}: {
    onLocated: (pos: Position) => void
    onError: (message: string) => void
    setLocating: (v: boolean) => void
}) {
    const map = useMap()

    const handleLocate = () => {
        if (!navigator.geolocation) {
            onError('Trình duyệt không hỗ trợ định vị vị trí.')
            return
        }

        setLocating(true)
        navigator.geolocation.getCurrentPosition(
            (pos) => {
                const next = { lat: pos.coords.latitude, lng: pos.coords.longitude }
                onLocated(next)
                map.flyTo([next.lat, next.lng], Math.max(map.getZoom(), 16), { duration: 0.8 })
                setLocating(false)
            },
            (err) => {
                console.error(err)
                onError('Không lấy được vị trí hiện tại. Hãy kiểm tra quyền truy cập vị trí.')
                setLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10000 },
        )
    }

    return (
        <div className="absolute bottom-10 right-3 z-1000">
            <button
                type="button"
                onClick={handleLocate}
                className="p-2 rounded-xl text-sm font-medium shadow-lg border bg-white/90 text-gray-700 border-gray-200 backdrop-blur-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
                aria-label="Hiển thị vị trí hiện tại"
            >
                <LocateFixed className="w-5 h-5" />
            </button>
        </div>
    )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function RescueMap() {
    const location = useLocation()
    const state = location.state as { lat?: number; lng?: number } | null

    // Vị trí đội cứu hộ (truyền từ màn hình trước qua location.state)
    const rescuePosition: Position | null =
        state?.lat && state?.lng ? { lat: state.lat, lng: state.lng } : null

    // Vị trí thiết bị hiện tại (geolocation)
    const [position, setPosition] = useState<Position | null>(null)
    const [error, setError] = useState<string | null>(null)
    const [locating, setLocating] = useState(true)

    useEffect(() => {
        if (!navigator.geolocation) {
            setError('Trình duyệt không hỗ trợ định vị vị trí.')
            setLocating(false)
            return
        }

        navigator.geolocation.getCurrentPosition(
            (pos) => {
                setPosition({ lat: pos.coords.latitude, lng: pos.coords.longitude })
                setLocating(false)
            },
            (err) => {
                console.error(err)
                setError('Không lấy được vị trí hiện tại. Hãy kiểm tra quyền truy cập vị trí.')
                setLocating(false)
            },
            { enableHighAccuracy: true, timeout: 10000 },
        )
    }, [])

    const center: [number, number] = rescuePosition
        ? [rescuePosition.lat, rescuePosition.lng]
        : position
            ? [position.lat, position.lng]
            : DEFAULT_CENTER

    const zoom = rescuePosition || position ? 16 : DEFAULT_ZOOM

    return (
        <ManagerLayout>
            {/* Fill the remaining height inside the layout's <main> */}
            <div className="relative flex flex-col" style={{ height: '100%', minHeight: 0 }}>

                {/* Status bar */}
                {(locating || error) && (
                    <div
                        className={`absolute top-3 left-1/2 -translate-x-1/2 z-1000 px-4 py-2 rounded-xl text-sm font-medium shadow-lg border backdrop-blur-sm pointer-events-none ${error
                            ? 'bg-red-50/90 text-red-700 border-red-200'
                            : 'bg-white/90 text-gray-600 border-gray-200'
                            }`}
                    >
                        {error ?? '📍 Đang lấy vị trí hiện tại...'}
                    </div>
                )}

                <MapContainer
                    // MapContainer expects a LatLngExpression — use tuple, never a plain object
                    center={center}
                    zoom={zoom}
                    // Make the map fill its parent div fully
                    style={{ width: '100%', flex: 1, minHeight: 0 }}
                    className="flex-1 relative"
                >
                    <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    />

                    {/* Smoothly pan to location once it's available */}
                    {(rescuePosition || position) && <ChangeView center={center} zoom={zoom} />}

                    <LocateControl
                        onLocated={(pos) => {
                            setError(null)
                            setPosition(pos)
                        }}
                        onError={(message) => {
                            setError(message)
                        }}
                        setLocating={setLocating}
                    />

                    {rescuePosition && (
                        <Marker
                            position={[rescuePosition.lat, rescuePosition.lng]}
                            icon={userLocationIcon}
                        >
                            <Popup>🚑 Vị trí đội cứu hộ</Popup>
                        </Marker>
                    )}

                    {position && (
                        <Marker position={[position.lat, position.lng]} icon={userLocationIcon}>
                            <Popup>📍 Vị trí hiện tại của bạn</Popup>
                        </Marker>
                    )}
                </MapContainer>
            </div>
        </ManagerLayout>
    )
}