import { useEffect, useMemo, useState } from 'react'
import { useLocation } from 'react-router-dom'
import LocationPickerMap, { type LocationPickerMarker } from '@/features/map/LocationPickerMap'

type Position = {
    lat: number
    lng: number
}

const DEFAULT_CENTER: Position = { lat: 21.0278, lng: 105.8342 }

export default function RescueMap() {
    const location = useLocation()
    const state = location.state as { lat?: number; lng?: number } | null

    const rescuePosition: Position | null =
        state?.lat && state?.lng ? { lat: state.lat, lng: state.lng } : null

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

    const focus = rescuePosition ?? position ?? DEFAULT_CENTER

    const extraMarkers = useMemo<LocationPickerMarker[]>(() => {
        const markers: LocationPickerMarker[] = []
        if (rescuePosition && position) {
            markers.push({
                id: 'user',
                lat: position.lat,
                lng: position.lng,
                color: '#16a34a',
                popupHtml: '<strong>📍 Vị trí hiện tại của bạn</strong>',
            })
        }
        if (rescuePosition) {
            markers.push({
                id: 'team',
                lat: rescuePosition.lat,
                lng: rescuePosition.lng,
                color: '#2563eb',
                popupHtml: '<strong>🚑 Vị trí đội cứu hộ</strong>',
            })
        }
        return markers
    }, [rescuePosition, position])

    const zoomToLocation = useMemo(
        () => ({
            lat: focus.lat,
            lng: focus.lng,
            zoom: rescuePosition || position ? 16 : 13,
        }),
        [focus.lat, focus.lng, rescuePosition, position],
    )

    return (
        <div className="relative flex flex-col" style={{ height: '100%', minHeight: 0 }}>
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

            <LocationPickerMap
                latitude={focus.lat}
                longitude={focus.lng}
                onChange={(lat, lng) => {
                    setError(null)
                    setPosition({ lat, lng })
                    setLocating(false)
                }}
                extraMarkers={extraMarkers}
                zoomToLocation={zoomToLocation}
                fill
                showFullscreen={false}
                showCoordinateChip={false}
            />
        </div>
    )
}
