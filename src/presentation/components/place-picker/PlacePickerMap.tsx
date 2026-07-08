"use client";

import { useEffect } from "react";
import { GeoJSON, MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import type { GeoJsonObject } from "geojson";

const UB_CENTER: [number, number] = [47.9077, 106.8832];

const KIND_EMOJI: Record<string, string> = {
  home: "🏠",
  work: "💼",
  school: "🎓",
  daycare: "🧸",
  other: "📍",
};

function buildPickerIcon(emoji: string): L.DivIcon {
  return L.divIcon({
    className: "place-picker-pin",
    html: `<span class="place-picker-pin-inner">${emoji}</span>`,
    iconSize: [36, 36],
    iconAnchor: [18, 36],
  });
}

function MapClickHandler({
  onPick,
}: {
  onPick: (lat: number, lng: number) => void;
}) {
  useMapEvents({
    click(e) {
      onPick(e.latlng.lat, e.latlng.lng);
    },
  });
  return null;
}

interface Bbox {
  minLat: number;
  minLng: number;
  maxLat: number;
  maxLng: number;
}

export interface MapPolygon {
  geometry: GeoJsonObject;
  /** Per-feature styling from the API's own LayerCacheDataResource — not hardcoded. */
  borderColor?: string | null;
  fillColor?: string | null;
  fillOpacity?: number | null;
  borderWidth?: number | null;
}

function CenterOn({
  lat,
  lng,
  zoom = 14,
  onSettled,
}: {
  lat: number;
  lng: number;
  zoom?: number;
  onSettled?: (bbox: Bbox) => void;
}) {
  const map = useMap();
  useEffect(() => {
    if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
    map.setView([lat, lng], Math.max(map.getZoom(), zoom), { animate: true });
    if (!onSettled) return;
    // `moveend` fires once the pan/zoom animation finishes, when getBounds()
    // reflects the final (real, rendered-viewport-sized) extent.
    const handleSettled = () => {
      const bounds = map.getBounds();
      onSettled({
        minLat: bounds.getSouth(),
        minLng: bounds.getWest(),
        maxLat: bounds.getNorth(),
        maxLng: bounds.getEast(),
      });
    };
    map.once("moveend", handleSettled);
    return () => {
      map.off("moveend", handleSettled);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lat, lng, zoom, map]);
  return null;
}

/**
 * Leaflet computes tile coverage from the container size at init. When the map
 * mounts inside a container whose size isn't final yet (a wizard step, a modal),
 * tiles fail to fill and the map shows blank. Recomputing after mount + on
 * resize fixes it.
 */
function InvalidateOnMount() {
  const map = useMap();
  useEffect(() => {
    const fix = () => map.invalidateSize();
    const timers = [50, 250, 600].map((ms) => setTimeout(fix, ms));
    window.addEventListener("resize", fix);
    return () => {
      timers.forEach(clearTimeout);
      window.removeEventListener("resize", fix);
    };
  }, [map]);
  return null;
}

export function PlacePickerMap({
  lat,
  lng,
  kind,
  onPick,
  pinZoom,
  onSettled,
  polygons,
}: {
  lat: number;
  lng: number;
  kind: string;
  onPick: (lat: number, lng: number) => void;
  /** Zoom level to re-center to once a pin is dropped/dragged. Default 14. */
  pinZoom?: number;
  /** Fires with the map's real rendered bbox once it settles after re-centering. */
  onSettled?: (bbox: Bbox) => void;
  /** Building/parcel outlines to draw over the map (e.g. from a neodata bbox lookup). */
  polygons?: MapPolygon[];
}) {
  const emoji = KIND_EMOJI[kind] ?? "📍";
  const hasMarker = Number.isFinite(lat) && Number.isFinite(lng);

  return (
    <MapContainer
      center={hasMarker ? [lat, lng] : UB_CENTER}
      zoom={12}
      scrollWheelZoom
      style={{ position: "absolute", inset: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <InvalidateOnMount />
      <MapClickHandler onPick={onPick} />
      {hasMarker && <CenterOn lat={lat} lng={lng} zoom={pinZoom} onSettled={onSettled} />}
      {polygons?.map((p, i) => (
        <GeoJSON
          key={i}
          data={p.geometry}
          style={{
            color: p.borderColor || "#c9a15f",
            weight: p.borderWidth ?? 2,
            fillColor: p.fillColor || p.borderColor || "#c9a15f",
            fillOpacity: p.fillOpacity ?? 0.15,
          }}
        />
      ))}
      {hasMarker && (
        <Marker
          position={[lat, lng]}
          icon={buildPickerIcon(emoji)}
          draggable
          eventHandlers={{
            dragend(e) {
              const m = e.target as L.Marker;
              const p = m.getLatLng();
              onPick(p.lat, p.lng);
            },
          }}
        />
      )}
    </MapContainer>
  );
}
