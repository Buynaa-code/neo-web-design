"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/types";
import { fmtMapPinPrice } from "@/data/formatters";
import { useStore } from "@/lib/store";
import { normalisedToLatLng } from "@/lib/utils";

const UB_CENTER: [number, number] = [47.9077, 106.8832];

function buildPriceIcon(listing: Listing, highlighted: boolean): L.DivIcon {
  const label = fmtMapPinPrice(listing);
  const tone =
    listing.status === "new"
      ? "neo-pin-new"
      : listing.status === "hot"
        ? "neo-pin-hot"
        : listing.status === "drop"
          ? "neo-pin-drop"
          : "";
  return L.divIcon({
    className: `neo-pin ${tone} ${highlighted ? "highlighted" : ""}`,
    html: `<span class="neo-pin-bubble">${label}</span>`,
    iconSize: [56, 28],
    iconAnchor: [28, 28],
  });
}

function FitBounds({ listings }: { listings: Listing[] }) {
  const map = useMap();
  useEffect(() => {
    if (!listings.length) return;
    const bounds = L.latLngBounds(
      listings.map((l) => normalisedToLatLng(l.lat, l.lng))
    );
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 14 });
  }, [listings, map]);
  return null;
}

function PanToHighlight({ listings }: { listings: Listing[] }) {
  const map = useMap();
  const highlightedId = useStore((s) => s.highlightedId);
  useEffect(() => {
    if (!highlightedId) return;
    const l = listings.find((x) => x.id === highlightedId);
    if (!l) return;
    const [lat, lng] = normalisedToLatLng(l.lat, l.lng);
    map.panTo([lat, lng], { animate: true });
  }, [highlightedId, listings, map]);
  return null;
}

export function ResultsLeaflet({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const highlightedId = useStore((s) => s.highlightedId);
  const setHighlightedId = useStore((s) => s.setHighlightedId);

  const markers = useMemo(
    () =>
      listings.map((l) => {
        const [lat, lng] = normalisedToLatLng(l.lat, l.lng);
        return { l, lat, lng };
      }),
    [listings]
  );

  return (
    <MapContainer
      center={UB_CENTER}
      zoom={12}
      scrollWheelZoom
      className="neomap-leaflet"
      style={{ position: "absolute", inset: 0 }}
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      <FitBounds listings={listings} />
      <PanToHighlight listings={listings} />
      {markers.map(({ l, lat, lng }) => (
        <Marker
          key={l.id}
          position={[lat, lng]}
          icon={buildPriceIcon(l, highlightedId === l.id)}
          eventHandlers={{
            click: () => setHighlightedId(l.id),
          }}
        >
          <Popup>
            <div className="neo-pin-popup">
              <strong>{l.khotkhon}</strong>
              <div>
                {l.district} · {l.rooms} өрөө · {l.area}м²
              </div>
              <button
                type="button"
                className="btn-primary text-xs mt-2"
                onClick={() => router.push(`/property/${l.id}`)}
              >
                Дэлгэрэнгүй
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
