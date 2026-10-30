import { useEffect, useRef, useState } from "react";
import vietmapgl from "@vietmap/vietmap-gl-js/dist/vietmap-gl.js";
import "@vietmap/vietmap-gl-js/dist/vietmap-gl.css";
import { VIETMAP_TILEMAP_KEY } from "@/config/env";
import {
    vietmapAutocomplete,
    getPlaceCoordinates,
    type VietMapSearchResult,
} from "@/features/map/api/geocoding";
import { Search } from "lucide-react";

export type LocationPickerMarker = {
    id: string;
    lat: number;
    lng: number;
    color?: string;
    popupHtml?: string;
};

interface LocationPickerMapProps {
    latitude: number;
    longitude: number;
    onChange?: (lat: number, lng: number) => void;
    zoomToLocation?: { lat: number; lng: number; zoom: number } | null;
    extraMarkers?: LocationPickerMarker[];
    /** Route as [lat, lng][] (same order as the previous Leaflet maps). */
    route?: [number, number][];
    fitTo?: "route" | "markers" | null;
    fill?: boolean;
    height?: number | string;
    className?: string;
    interactive?: boolean;
    showSearch?: boolean;
    showFullscreen?: boolean;
    showCoordinateChip?: boolean;
    showLocate?: boolean;
    initialZoom?: number;
}

const DEFAULT_CENTER: [number, number] = [106.6297, 10.8231]; // Mapbox GL uses [lng, lat]
const ROUTE_SOURCE = "location-picker-route";
const ROUTE_LAYER = "location-picker-route-line";
const ROUTE_GLOW_LAYER = "location-picker-route-glow";

export default function LocationPickerMap({
    latitude,
    longitude,
    onChange,
    zoomToLocation,
    extraMarkers = [],
    route,
    fitTo = null,
    fill = false,
    height = 300,
    className,
    interactive = true,
    showSearch = true,
    showFullscreen = true,
    showCoordinateChip = true,
    showLocate = true,
    initialZoom = 13,
}: LocationPickerMapProps) {
    const mapContainerRef = useRef<HTMLDivElement>(null);
    const mapRef = useRef<vietmapgl.Map | null>(null);
    const markerRef = useRef<vietmapgl.Marker | null>(null);
    const extraMarkerRefs = useRef<vietmapgl.Marker[]>([]);
    const mapLoadedRef = useRef(false);

    const onChangeRef = useRef(onChange);
    useEffect(() => {
        onChangeRef.current = onChange;
    }, [onChange]);

    const interactiveRef = useRef(interactive);
    useEffect(() => {
        interactiveRef.current = interactive;
    }, [interactive]);

    const [isFullscreen, setIsFullscreen] = useState(false);
    const [searchQuery, setSearchQuery] = useState("");
    const [searchResults, setSearchResults] = useState<VietMapSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const searchTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (!mapContainerRef.current) return;

        const initialCenter: [number, number] =
            latitude !== 0 && longitude !== 0 ? [longitude, latitude] : DEFAULT_CENTER;

        const map = new vietmapgl.Map({
            container: mapContainerRef.current,
            style: `https://maps.vietmap.vn/api/maps/light/styles.json?apikey=${VIETMAP_TILEMAP_KEY}`,
            center: initialCenter,
            zoom: initialZoom,
            pitch: 0,
            hash: false,
        });

        mapRef.current = map;

        map.on("load", () => {
            mapLoadedRef.current = true;
            if (latitude !== 0 && longitude !== 0) {
                placeMarker(map, markerRef, longitude, latitude);
            }
        });

        map.on("click", (e) => {
            if (!interactiveRef.current) return;
            const handler = onChangeRef.current;
            if (!handler) return;

            const { lng, lat } = e.lngLat;
            handler(lat, lng);

            placeMarker(map, markerRef, lng, lat);
            map.flyTo({ center: [lng, lat], speed: 1.5 });
        });

        const resizeObserver = new ResizeObserver(() => {
            map.resize();
        });
        resizeObserver.observe(mapContainerRef.current);

        return () => {
            resizeObserver.disconnect();
            extraMarkerRefs.current.forEach((m) => m.remove());
            extraMarkerRefs.current = [];
            mapLoadedRef.current = false;
            map.remove();
            mapRef.current = null;
            markerRef.current = null;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    useEffect(() => {
        if (!mapRef.current) return;
        if (latitude !== 0 && longitude !== 0) {
            placeMarker(mapRef.current, markerRef, longitude, latitude);
        }
    }, [latitude, longitude]);

    useEffect(() => {
        if (!mapRef.current || !zoomToLocation) return;
        mapRef.current.flyTo({
            center: [zoomToLocation.lng, zoomToLocation.lat],
            zoom: zoomToLocation.zoom,
            speed: 1.5,
        });
    }, [zoomToLocation]);

    useEffect(() => {
        const timeout = setTimeout(() => {
            if (mapRef.current) mapRef.current.resize();
        }, 100);
        return () => clearTimeout(timeout);
    }, [isFullscreen, fill]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        extraMarkerRefs.current.forEach((m) => m.remove());
        extraMarkerRefs.current = [];

        extraMarkers.forEach((m) => {
            const el = document.createElement("div");
            el.className = "custom-marker";
            el.innerHTML = getPinHtml(m.color ?? "#2563eb");

            const marker = new vietmapgl.Marker({ element: el }).setLngLat([m.lng, m.lat]);
            if (m.popupHtml) {
                marker.setPopup(new vietmapgl.Popup({ offset: 28 }).setHTML(m.popupHtml));
            }
            marker.addTo(map);
            extraMarkerRefs.current.push(marker);
        });
    }, [extraMarkers]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const applyRoute = () => {
            const coords = (route ?? []).map(([lat, lng]) => [lng, lat] as [number, number]);
            const data: GeoJSON.Feature<GeoJSON.LineString> = {
                type: "Feature",
                properties: {},
                geometry: { type: "LineString", coordinates: coords },
            };

            const source = map.getSource(ROUTE_SOURCE) as { setData: (d: unknown) => void } | undefined;
            if (source) {
                source.setData(data);
            } else if (coords.length >= 2) {
                map.addSource(ROUTE_SOURCE, { type: "geojson", data });
                map.addLayer({
                    id: ROUTE_GLOW_LAYER,
                    type: "line",
                    source: ROUTE_SOURCE,
                    paint: {
                        "line-color": "#93c5fd",
                        "line-width": 8,
                        "line-opacity": 0.5,
                    },
                });
                map.addLayer({
                    id: ROUTE_LAYER,
                    type: "line",
                    source: ROUTE_SOURCE,
                    paint: {
                        "line-color": "#2563eb",
                        "line-width": 4,
                        "line-opacity": 0.95,
                    },
                });
            }

            if (fitTo === "route" && coords.length >= 2) {
                const bounds = coords.reduce(
                    (b, c) => b.extend(c),
                    new vietmapgl.LngLatBounds(coords[0], coords[0]),
                );
                map.fitBounds(bounds, { padding: 50, maxZoom: 16, duration: 800 });
            }
        };

        if (mapLoadedRef.current) applyRoute();
        else map.once("load", applyRoute);
    }, [route, fitTo]);

    useEffect(() => {
        const map = mapRef.current;
        if (!map || fitTo !== "markers") return;

        const points: [number, number][] = [];
        if (latitude !== 0 && longitude !== 0) points.push([longitude, latitude]);
        extraMarkers.forEach((m) => points.push([m.lng, m.lat]));
        if (points.length < 1) return;

        const bounds = points.reduce(
            (b, c) => b.extend(c),
            new vietmapgl.LngLatBounds(points[0], points[0]),
        );
        const run = () => map.fitBounds(bounds, { padding: 60, maxZoom: 15, duration: 800 });
        if (mapLoadedRef.current) run();
        else map.once("load", run);
    }, [fitTo, extraMarkers, latitude, longitude]);

    const handleZoomIn = () => mapRef.current?.zoomIn();
    const handleZoomOut = () => mapRef.current?.zoomOut();
    const handleLocate = () => {
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition((position) => {
                const lat = position.coords.latitude;
                const lng = position.coords.longitude;
                mapRef.current?.flyTo({ center: [lng, lat], zoom: 15 });
                onChangeRef.current?.(lat, lng);

                if (mapRef.current) placeMarker(mapRef.current, markerRef, lng, lat);
            });
        }
    };

    const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const val = e.target.value;
        setSearchQuery(val);

        if (searchTimeoutRef.current) clearTimeout(searchTimeoutRef.current);

        if (!val.trim()) {
            setSearchResults([]);
            return;
        }

        setIsSearching(true);
        searchTimeoutRef.current = setTimeout(async () => {
            try {
                const center = mapRef.current?.getCenter();
                const focus = center ? { lat: center.lat, lng: center.lng } : undefined;
                const data = await vietmapAutocomplete(val, focus);
                setSearchResults(data);
            } catch (error) {
                console.error("Search error", error);
            } finally {
                setIsSearching(false);
            }
        }, 500);
    };

    const handleSelectResult = async (result: VietMapSearchResult) => {
        const coords = await getPlaceCoordinates(result.ref_id);
        if (!coords) return;
        const { lat, lng } = coords;

        onChangeRef.current?.(lat, lng);
        setSearchQuery(result.display);
        setSearchResults([]);

        if (mapRef.current) {
            mapRef.current.flyTo({ center: [lng, lat], zoom: 15 });
            placeMarker(mapRef.current, markerRef, lng, lat);
        }
    };

    const wrapperStyle: React.CSSProperties = isFullscreen
        ? {
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 9999,
            backgroundColor: "var(--fd-surface)",
            display: "flex",
            flexDirection: "column",
        }
        : fill
            ? {
                position: "relative",
                zIndex: 1,
                height: "100%",
                width: "100%",
                overflow: "hidden",
            }
            : {
                position: "relative",
                zIndex: 1,
                height,
                borderRadius: 12,
                overflow: "hidden",
                border: "1px solid var(--color-border-light)",
            };

    return (
        <div className={className} style={wrapperStyle}>
            <div
                ref={mapContainerRef}
                style={{
                    flex: 1,
                    height: "100%",
                    width: "100%",
                    cursor: interactive ? "crosshair" : "grab",
                }}
            />

            {showSearch && (
                <div
                    style={{
                        position: "absolute",
                        top: 12,
                        left: 12,
                        right: 60,
                        maxWidth: 320,
                        zIndex: 1000,
                    }}
                    onMouseDown={(e) => e.stopPropagation()}
                    onMouseUp={(e) => e.stopPropagation()}
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                            {isSearching ? (
                                <svg
                                    className="animate-spin h-4 w-4 text-primary"
                                    xmlns="http://www.w3.org/2000/svg"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                >
                                    <circle
                                        className="opacity-25"
                                        cx="12"
                                        cy="12"
                                        r="10"
                                        stroke="currentColor"
                                        strokeWidth="4"
                                    ></circle>
                                    <path
                                        className="opacity-75"
                                        fill="currentColor"
                                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                                    ></path>
                                </svg>
                            ) : (
                                <Search size={16} className="text-gray-400" />
                            )}
                        </div>
                        <input
                            type="text"
                            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-primary focus:border-primary sm:text-sm shadow-sm"
                            placeholder="Tìm kiếm địa điểm..."
                            value={searchQuery}
                            onChange={handleSearchChange}
                        />
                    </div>

                    {searchResults.length > 0 && (
                        <div className="absolute top-full mt-1 w-full bg-white rounded-md shadow-lg max-h-60 scroll-fade overflow-y-auto border border-gray-100 divide-y divide-gray-100">
                            {searchResults.map((result, i) => (
                                <button
                                    key={i}
                                    className="w-full text-left px-4 py-2.5 text-sm hover:bg-gray-50 text-gray-700 truncate"
                                    onClick={() => handleSelectResult(result)}
                                    title={result.display}
                                    type="button"
                                >
                                    {result.display}
                                </button>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {showCoordinateChip && (latitude !== 0 || longitude !== 0) && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 28,
                        left: "50%",
                        transform: "translateX(-50%)",
                        zIndex: 1000,
                        background: "white",
                        borderRadius: 8,
                        boxShadow: "0 2px 8px rgba(0,0,0,0.2)",
                        padding: "6px 14px",
                        display: "flex",
                        alignItems: "center",
                        gap: 6,
                        fontSize: 12,
                        color: "#3c4043",
                        whiteSpace: "nowrap",
                        border: "0.5px solid rgba(0,0,0,0.08)",
                    }}
                >
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="#ea4335">
                        <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z" />
                    </svg>
                    {latitude.toFixed(5)}° N, {longitude.toFixed(5)}° E
                </div>
            )}

            <div
                onMouseDown={(e) => e.stopPropagation()}
                onMouseUp={(e) => e.stopPropagation()}
                onClick={(e) => e.stopPropagation()}
                style={{
                    position: "absolute",
                    top: 12,
                    right: 12,
                    zIndex: 1000,
                    display: "flex",
                    flexDirection: "column",
                    gap: 2,
                }}
            >
                {showFullscreen && (
                    <button
                        type="button"
                        onClick={() => setIsFullscreen(!isFullscreen)}
                        style={{ ...locateBtnStyle, marginBottom: 8 }}
                        title={isFullscreen ? "Thoát toàn màn hình" : "Toàn màn hình"}
                    >
                        {isFullscreen ? (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#5f6368"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M8 3v3a2 2 0 0 1-2 2H3m18 0h-3a2 2 0 0 1-2-2V3m0 18v-3a2 2 0 0 1 2-2h3M3 16h3a2 2 0 0 1 2 2v3" />
                            </svg>
                        ) : (
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="#5f6368"
                                strokeWidth="2.5"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M8 3H5a2 2 0 0 0-2 2v3m18 0V5a2 2 0 0 0-2-2h-3m0 18h3a2 2 0 0 0 2-2v-3M3 16v3a2 2 0 0 0 2 2h3" />
                            </svg>
                        )}
                    </button>
                )}

                <div
                    style={{
                        background: "white",
                        borderRadius: 2,
                        boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
                        overflow: "hidden",
                        border: "0.5px solid rgba(0,0,0,0.1)",
                    }}
                >
                    <button type="button" onClick={handleZoomIn} style={zoomBtnStyle} title="Zoom in">
                        +
                    </button>
                    <div style={{ height: "0.5px", background: "#e0e0e0" }} />
                    <button
                        type="button"
                        onClick={handleZoomOut}
                        style={{ ...zoomBtnStyle, fontSize: 24 }}
                        title="Zoom out"
                    >
                        −
                    </button>
                </div>

                {showLocate && (
                    <button type="button" onClick={handleLocate} style={locateBtnStyle} title="My location">
                        <svg
                            width="18"
                            height="18"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="#4285F4"
                            strokeWidth="2.5"
                            strokeLinecap="round"
                        >
                            <circle cx="12" cy="12" r="3" />
                            <path d="M12 2v3M12 19v3M2 12h3M19 12h3" />
                        </svg>
                    </button>
                )}
            </div>

            <style>{`
        .custom-marker {
          width: 30px;
          height: 42px;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          margin-top: -21px;
        }
        @keyframes pulse {
          0%   { transform:scale(0.5); opacity:0.8; }
          100% { transform:scale(2.2); opacity:0; }
        }
      `}</style>
        </div>
    );
}

const zoomBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    background: "none",
    border: "none",
    cursor: "pointer",
    fontSize: 20,
    color: "#3c4043",
    fontWeight: 300,
    lineHeight: 1,
};

const locateBtnStyle: React.CSSProperties = {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: 40,
    height: 40,
    background: "white",
    borderRadius: 2,
    boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
    border: "0.5px solid rgba(0,0,0,0.1)",
    cursor: "pointer",
    marginTop: 4,
};

function placeMarker(
    map: vietmapgl.Map,
    markerRef: React.MutableRefObject<vietmapgl.Marker | null>,
    lng: number,
    lat: number,
) {
    if (markerRef.current) {
        markerRef.current.setLngLat([lng, lat]);
        return;
    }

    const el = document.createElement("div");
    el.className = "custom-marker";
    el.innerHTML = getPinHtml();

    markerRef.current = new vietmapgl.Marker({ element: el }).setLngLat([lng, lat]).addTo(map);
}

function getPinHtml(color = "#ea4335") {
    return `
    <div style="position:relative;width:30px;height:42px;">
      <div style="
        position:absolute;top:0;left:0;right:0;bottom:0;
        animation:pulse 1.8s ease-out infinite;
        border-radius:50%;
        background:${color}40;
        width:44px;height:44px;
        top:-7px;left:-7px;
      "></div>
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 30 42" width="30" height="42"
        style="filter:drop-shadow(0 2px 4px rgba(0,0,0,0.4));position:relative;z-index:1;">
        <path d="M15 0C7.27 0 1 6.27 1 14c0 10.5 14 28 14 28S29 24.5 29 14C29 6.27 22.73 0 15 0z" fill="${color}"/>
        <circle cx="15" cy="14" r="6" fill="white"/>
      </svg>
    </div>
  `;
}
