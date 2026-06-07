"use client";

import { useEffect } from "react";
import { MapContainer, Marker, TileLayer, useMap, useMapEvents } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

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

function CenterOn({ lat, lng }: { lat: number; lng: number }) {
  const map = useMap();
  useEffect(() => {
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      map.setView([lat, lng], Math.max(map.getZoom(), 14), { animate: true });
    }
  }, [lat, lng, map]);
  return null;
}

export function PlacePickerMap({
  lat,
  lng,
  kind,
  onPick,
}: {
  lat: number;
  lng: number;
  kind: string;
  onPick: (lat: number, lng: number) => void;
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
      <MapClickHandler onPick={onPick} />
      {hasMarker && <CenterOn lat={lat} lng={lng} />}
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
