"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { MapContainer, Marker, Popup, TileLayer, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/types";
import { fmtMapPinPrice } from "@/data/formatters";
import { useStore, type MyPlace } from "@/lib/store";
import { normalisedToLatLng } from "@/lib/utils";

const PLACE_KIND_META: Record<MyPlace["kind"], { icon: string; tone: string }> = {
  home: { icon: "🏠", tone: "#0F766E" },
  work: { icon: "💼", tone: "#1D4ED8" },
  school: { icon: "🎓", tone: "#7E22CE" },
  daycare: { icon: "🧸", tone: "#DB2777" },
  other: { icon: "📍", tone: "#C9A227" },
};

function buildPlaceIcon(p: MyPlace): L.DivIcon {
  const meta = PLACE_KIND_META[p.kind] ?? PLACE_KIND_META.other;
  return L.divIcon({
    className: "neo-place-pin",
    html: `<span class="neo-place-bubble" style="--place-tone:${meta.tone}"><span class="neo-place-icon">${meta.icon}</span><span class="neo-place-label">${p.label}</span></span>`,
    iconSize: [120, 32],
    iconAnchor: [60, 32],
  });
}

const UB_CENTER: [number, number] = [47.9077, 106.8832];

function buildPriceIcon(listing: Listing, highlighted: boolean): L.DivIcon {
  const price = fmtMapPinPrice(listing);
  const area = `${listing.area}м²`;
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
    html: `<span class="neo-pin-bubble"><span class="pin-price">${price}</span><span class="pin-area">${area}</span></span>`,
    iconSize: [72, 44],
    iconAnchor: [36, 44],
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
  const highlightSource = useStore((s) => s.highlightSource);
  useEffect(() => {
    if (!highlightedId) return;
    if (highlightSource === "map") return;
    const l = listings.find((x) => x.id === highlightedId);
    if (!l) return;
    const [lat, lng] = normalisedToLatLng(l.lat, l.lng);
    map.panTo([lat, lng], { animate: true });
  }, [highlightedId, highlightSource, listings, map]);
  return null;
}

export function ResultsLeaflet({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const highlightedId = useStore((s) => s.highlightedId);
  const setHighlightedId = useStore((s) => s.setHighlightedId);
  const myPlaces = useStore((s) => s.myPlaces);
  const openPlacePicker = useStore((s) => s.openPlacePicker);

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
            click: () => setHighlightedId(l.id, "map"),
            mouseover: () => setHighlightedId(l.id, "map"),
            mouseout: () => setHighlightedId(null),
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
      {myPlaces.map((p) => (
        <Marker key={p.id} position={[p.lat, p.lng]} icon={buildPlaceIcon(p)}>
          <Popup>
            <div className="neo-pin-popup">
              <strong>{p.label}</strong>
              <div>
                {p.kind === "home"
                  ? "Гэр"
                  : p.kind === "work"
                    ? "Ажил"
                    : p.kind === "school"
                      ? "Сургууль"
                      : p.kind === "daycare"
                        ? "Цэцэрлэг"
                        : "Бусад"}
              </div>
              <button
                type="button"
                className="btn-primary text-xs mt-2"
                onClick={() =>
                  openPlacePicker({ editId: p.id, kind: p.kind, label: p.label })
                }
              >
                Засах
              </button>
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}
