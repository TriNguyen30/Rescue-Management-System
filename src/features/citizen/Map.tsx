import { useEffect, useMemo, useState } from 'react'
import { RescueRequestPanel } from '@/features/citizen/Citizen'
import LocationPickerMap from '@/features/map/LocationPickerMap'
import { ListFilter } from 'lucide-react'

const DEFAULT_CENTER = { lat: 21.0278, lng: 105.8342 }

type Position = { lat: number; lng: number }

export default function Map() {
  const [position, setPosition] = useState<Position | null>(null)
  const [picked, setPicked] = useState<Position | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [panelOpen, setPanelOpen] = useState(true)

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

  const effective = picked ?? position ?? DEFAULT_CENTER
  const panelLocation = useMemo(() => {
    if (!picked && !position) return null
    return { lat: effective.lat, lng: effective.lng }
  }, [picked, position, effective.lat, effective.lng])

  const zoomToLocation = useMemo(
    () => ({ lat: effective.lat, lng: effective.lng, zoom: picked || position ? 16 : 13 }),
    [effective.lat, effective.lng, picked, position],
  )

  return (
    <div
      className="w-full"
      style={{ height: 'calc(100dvh - var(--navbar-height, 64px))' }}
    >
      <div className="flex h-full">
        {panelOpen && (
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
                    {`${effective.lat.toFixed(5)}, ${effective.lng.toFixed(5)}`}
                  </span>
                  {picked && (
                    <button
                      type="button"
                      className="ml-auto text-xs font-semibold text-blue-600 hover:text-blue-700 cursor-pointer"
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
        )}

        <div className="relative flex-1 min-w-0">
          <div className="absolute bottom-10 right-14 z-[1000] flex items-center gap-2">
            <button
              type="button"
              className="p-2 rounded-xl text-sm font-medium shadow-lg border bg-white/90 text-gray-700 border-gray-200 backdrop-blur-sm hover:bg-white focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 cursor-pointer"
              aria-label={panelOpen ? 'Ẩn form cứu hộ' : 'Hiện form cứu hộ'}
              onClick={() => setPanelOpen((v) => !v)}
            >
              <ListFilter className="w-6 h-6" />
            </button>
          </div>
          {error && (
            <div className="absolute top-3 left-1/2 -translate-x-1/2 z-[1000] bg-white border border-red-200 text-red-600 text-sm font-medium px-4 py-2 rounded-xl shadow-md pointer-events-none">
              {error}
            </div>
          )}
          <LocationPickerMap
            latitude={effective.lat}
            longitude={effective.lng}
            onChange={(lat, lng) => setPicked({ lat, lng })}
            zoomToLocation={zoomToLocation}
            fill
            showFullscreen={false}
          />
        </div>
      </div>
    </div>
  )
}
