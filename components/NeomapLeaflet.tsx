"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { LISTINGS } from "@/data/listings";
import { fmtMapPinPrice } from "@/data/formatters";
import { useStore } from "@/lib/store";
import { normalisedToLatLng } from "@/lib/utils";
import type { Listing } from "@/lib/types";

const UB_CENTER: [number, number] = [47.9077, 106.8832];

function buildPriceIcon(listing: Listing): L.DivIcon {
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
    className: `neo-pin ${tone}`,
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
    map.fitBounds(bounds, { padding: [40, 40] });
  }, [listings, map]);
  return null;
}

export function NeomapLeaflet() {
  const router = useRouter();
  const mode = useStore((s) => s.mode);
  const highlightedId = useStore((s) => s.highlightedId);
  const setHighlightedId = useStore((s) => s.setHighlightedId);

  const listings = useMemo(
    () => LISTINGS.filter((l) => l.mode === mode),
    [mode]
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
      {listings.map((l) => {
        const [lat, lng] = normalisedToLatLng(l.lat, l.lng);
        return (
          <Marker
            key={l.id}
            position={[lat, lng]}
            icon={buildPriceIcon(l)}
            eventHandlers={{
              click: () => setHighlightedId(l.id),
            }}
          >
            <Popup>
              <div className="neo-pin-popup">
                <strong>{l.khotkhon}</strong>
                <div>{l.district} · {l.rooms} өрөө · {l.area}м²</div>
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
        );
      })}
    </MapContainer>
  );
}
