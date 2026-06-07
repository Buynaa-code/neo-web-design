"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import {
  CircleMarker,
  MapContainer,
  Marker,
  Polygon,
  Popup,
  TileLayer,
  useMap,
  useMapEvents,
} from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { Listing } from "@/lib/types";
import { fmtMapPinPrice } from "@/data/formatters";
import { useStore, type MyPlace } from "@/lib/store";
import { normalisedToLatLng } from "@/lib/utils";
import { fmtMinutes, listingToPlace } from "@/lib/travel";

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

function PolygonDrawer() {
  const drawing = useStore((s) => s.drawingPolygon);
  const polygon = useStore((s) => s.drawnPolygon);
  const setPolygon = useStore((s) => s.setDrawnPolygon);
  const setDrawing = useStore((s) => s.setDrawingPolygon);

  useMapEvents({
    click(e) {
      if (!drawing) return;
      // store uses { x: lat, y: lng }
      const next = [...(polygon ?? []), { x: e.latlng.lat, y: e.latlng.lng }];
      setPolygon(next);
    },
    dblclick() {
      if (drawing) setDrawing(false);
    },
  });

  if (!polygon || polygon.length === 0) return null;
  const positions = polygon.map((p) => [p.x, p.y] as [number, number]);
  return (
    <Polygon
      positions={positions.length >= 3 ? positions : [...positions, positions[0]]}
      pathOptions={{
        color: "var(--gold-brand)",
        fillColor: "var(--gold-brand)",
        fillOpacity: 0.12,
        weight: 2,
      }}
    />
  );
}

function TravelMini({ listing, places }: { listing: Listing; places: MyPlace[] }) {
  if (places.length === 0) return null;
  const nearest = places
    .map((p) => ({ p, est: listingToPlace(listing, p) }))
    .sort((a, b) => a.est.car.minutes - b.est.car.minutes)
    .slice(0, 2);
  return (
    <div
      className="neo-pin-travel"
      style={{
        marginTop: 6,
        paddingTop: 6,
        borderTop: "1px solid rgba(0,0,0,.1)",
        fontSize: 11,
      }}
    >
      {nearest.map(({ p, est }) => (
        <div
          key={p.id}
          style={{ display: "flex", alignItems: "center", gap: 4 }}
        >
          <span>
            {p.kind === "home"
              ? "🏠"
              : p.kind === "work"
                ? "💼"
                : p.kind === "school"
                  ? "🎓"
                  : p.kind === "daycare"
                    ? "🧸"
                    : "📍"}
          </span>
          <span style={{ fontWeight: 600 }}>{p.label}:</span>
          <span style={{ marginLeft: "auto" }}>
            🚗 {fmtMinutes(est.car.minutes)} · 🚶 {fmtMinutes(est.walk.minutes)}
          </span>
        </div>
      ))}
    </div>
  );
}

function priceTone(l: Listing): string {
  if (l.status === "hot") return "#C44545";
  if (l.status === "new") return "#1F6B47";
  if (l.status === "drop") return "#C9A35F";
  return "#0A1F44";
}

export function ResultsLeaflet({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const highlightedId = useStore((s) => s.highlightedId);
  const setHighlightedId = useStore((s) => s.setHighlightedId);
  const myPlaces = useStore((s) => s.myPlaces);
  const openPlacePicker = useStore((s) => s.openPlacePicker);
  const mapMode = useStore((s) => s.mapMode);

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
      <PolygonDrawer />
      {mapMode === "heatmap"
        ? markers.map(({ l, lat, lng }) => (
            <CircleMarker
              key={l.id}
              center={[lat, lng]}
              radius={highlightedId === l.id ? 24 : 18}
              pathOptions={{
                color: priceTone(l),
                fillColor: priceTone(l),
                fillOpacity: highlightedId === l.id ? 0.45 : 0.25,
                weight: 1,
              }}
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
                  <TravelMini listing={l} places={myPlaces} />
                  <button
                    type="button"
                    className="btn-primary text-xs mt-2"
                    onClick={() => router.push(`/property/${l.id}`)}
                  >
                    Дэлгэрэнгүй
                  </button>
                </div>
              </Popup>
            </CircleMarker>
          ))
        : markers.map(({ l, lat, lng }) => (
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
                  <TravelMini listing={l} places={myPlaces} />
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
