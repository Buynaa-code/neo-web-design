"use client";

import dynamic from "next/dynamic";
import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import {
  Briefcase,
  GraduationCap,
  Home as HomeIcon,
  MapPin,
  Pencil,
  Search,
  Trash2,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore, type MyPlace } from "@/infrastructure/store";
import { searchPlaces, UB_PLACES, type UbPlace } from "@/infrastructure/data/ub-places";
import { cn } from "@/lib/utils";

const PlacePickerMap = dynamic(
  () =>
    import("@/components/place-picker/PlacePickerMap").then(
      (m) => m.PlacePickerMap
    ),
  {
    ssr: false,
    loading: () => (
      <div
        className="absolute inset-0 flex items-center justify-center text-xs"
        style={{ background: "var(--surface-2)", color: "var(--text-3)" }}
      >
        Газрын зураг ачаалж байна...
      </div>
    ),
  }
);

const UB_CENTER = { lat: 47.9077, lng: 106.8832 };

const KIND_META: Record<
  MyPlace["kind"],
  { label: string; icon: LucideIcon; defaultName: string; suggestPool?: UbPlace["kind"][] }
> = {
  home: { label: "Гэр", icon: HomeIcon, defaultName: "Гэр" },
  work: {
    label: "Ажил",
    icon: Briefcase,
    defaultName: "Ажил",
    suggestPool: ["office", "mall"],
  },
  school: {
    label: "Сургууль",
    icon: GraduationCap,
    defaultName: "Сургууль",
    suggestPool: ["school"],
  },
  daycare: {
    label: "Цэцэрлэг",
    icon: MapPin,
    defaultName: "Цэцэрлэг",
    suggestPool: ["school"],
  },
  other: {
    label: "Бусад",
    icon: MapPin,
    defaultName: "Байршил",
  },
};

const KIND_ORDER: MyPlace["kind"][] = ["home", "work", "school", "daycare", "other"];

export function PlacePicker() {
  const picker = useStore((s) => s.placePicker);
  const close = useStore((s) => s.closePlacePicker);
  const addOrUpdate = useStore((s) => s.addOrUpdatePlace);
  const removePlace = useStore((s) => s.removePlace);
  const myPlaces = useStore((s) => s.myPlaces);
  const pushToast = useStore((s) => s.pushToast);
  const openPlacePicker = useStore((s) => s.openPlacePicker);

  const [kind, setKind] = useState<MyPlace["kind"]>("home");
  const [label, setLabel] = useState("Гэр");
  const [lat, setLat] = useState<number>(UB_CENTER.lat);
  const [lng, setLng] = useState<number>(UB_CENTER.lng);
  const [hasPicked, setHasPicked] = useState(false);
  const [query, setQuery] = useState("");
  const [showResults, setShowResults] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!picker) return;
    setKind(picker.kind);
    setLabel(picker.label || KIND_META[picker.kind].defaultName);
    setQuery("");
    setShowResults(false);
    if (picker.editId) {
      const existing = myPlaces.find((p) => p.id === picker.editId);
      if (existing) {
        setLat(existing.lat);
        setLng(existing.lng);
        setHasPicked(true);
      }
    } else {
      setLat(UB_CENTER.lat);
      setLng(UB_CENTER.lng);
      setHasPicked(false);
    }
  }, [picker, myPlaces]);

  useEffect(() => {
    if (!picker) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [picker, close]);

  // Default suggestions when query is empty — show pool relevant to kind
  const suggestPool = KIND_META[kind].suggestPool;
  const defaultSuggestions = useMemo(() => {
    if (!suggestPool || suggestPool.length === 0) return [] as UbPlace[];
    return UB_PLACES.filter((p) => suggestPool.includes(p.kind)).slice(0, 6);
  }, [suggestPool]);

  const searchResults = useMemo(() => {
    if (!query.trim()) return defaultSuggestions;
    return searchPlaces(query, 8);
  }, [query, defaultSuggestions]);

  if (!mounted || !picker) return null;

  const pickFromMap = (newLat: number, newLng: number) => {
    setLat(newLat);
    setLng(newLng);
    setHasPicked(true);
    setShowResults(false);
  };

  const pickFromSearch = (p: UbPlace) => {
    setLat(p.lat);
    setLng(p.lng);
    setHasPicked(true);
    setQuery(p.name);
    setShowResults(false);
    if (label === KIND_META[kind].defaultName || !label.trim()) {
      setLabel(p.name);
    }
  };

  const save = () => {
    if (!hasPicked) {
      pushToast("Газрын зураг дээр байршлаа сонгоно уу", "danger");
      return;
    }
    const place: MyPlace = {
      id: picker.editId ?? `place-${Date.now()}`,
      kind,
      label: label.trim() || KIND_META[kind].defaultName,
      lat,
      lng,
    };
    addOrUpdate(place);
    pushToast(picker.editId ? "Байршил шинэчиллээ" : "Байршил нэмлээ", "success");
    close();
  };

  const onRemove = () => {
    if (!picker.editId) return;
    removePlace(picker.editId);
    pushToast("Байршил устгагдлаа", "info");
    close();
  };

  return createPortal(
    <div
      className="modal-backdrop active"
      onClick={(e) => {
        if (e.target === e.currentTarget) close();
      }}
    >
      <div className="place-picker-modal">
        <header className="place-picker-head">
          <div>
            <h3 className="text-lg font-semibold">
              {picker.editId ? "Байршил засах" : "Байршил нэмэх"}
            </h3>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              Нэрээр хайх эсвэл газрын зураг дээр товшиж сонгоно уу
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-[var(--text-3)] hover:text-[var(--text)] w-8 h-8 rounded-full flex items-center justify-center"
            style={{ background: "var(--surface-2)" }}
            aria-label="Хаах"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="place-picker-body">
          <div className="place-picker-form">
            <div>
              <div className="text-xs font-semibold text-[var(--text-2)] mb-2">
                Төрөл
              </div>
              <div className="grid grid-cols-5 gap-1.5">
                {KIND_ORDER.map((k) => {
                  const meta = KIND_META[k];
                  const active = kind === k;
                  return (
                    <button
                      key={k}
                      type="button"
                      onClick={() => {
                        const prevDefault = KIND_META[kind].defaultName;
                        setKind(k);
                        if (label === prevDefault) {
                          setLabel(meta.defaultName);
                        }
                        setQuery("");
                      }}
                      className={cn(
                        "src-chip py-2 flex flex-col items-center gap-1",
                        active && "selected"
                      )}
                    >
                      <meta.icon className="w-4 h-4" />
                      <span className="text-[10px]">{meta.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <div className="text-xs font-semibold text-[var(--text-2)] mb-2">
                Нэрээр хайх
              </div>
              <div className="relative">
                <Search
                  className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5"
                  style={{ color: "var(--text-3)" }}
                />
                <input
                  className="input"
                  style={{ paddingLeft: 30 }}
                  placeholder={
                    kind === "school"
                      ? "Сургууль / цэцэрлэгийн нэр..."
                      : kind === "work"
                        ? "Ажлын газар, оффисын нэр..."
                        : "Газрын нэр (Хүннү молл, Time Tower...)"
                  }
                  value={query}
                  onChange={(e) => {
                    setQuery(e.target.value);
                    setShowResults(true);
                  }}
                  onFocus={() => setShowResults(true)}
                />
              </div>
              {showResults && searchResults.length > 0 && (
                <div className="place-picker-search-results">
                  {searchResults.map((p) => (
                    <button
                      key={`${p.name}-${p.lat}-${p.lng}`}
                      type="button"
                      onClick={() => pickFromSearch(p)}
                      className="place-picker-result"
                    >
                      <span className="place-picker-result-icon">
                        {p.kind === "school"
                          ? "🎓"
                          : p.kind === "office"
                            ? "💼"
                            : p.kind === "mall"
                              ? "🛍️"
                              : p.kind === "hospital"
                                ? "🏥"
                                : p.kind === "transport"
                                  ? "🚏"
                                  : "📍"}
                      </span>
                      <div className="flex-1 min-w-0 text-left">
                        <div className="text-sm font-medium truncate">{p.name}</div>
                        <div
                          className="text-[11px] truncate"
                          style={{ color: "var(--text-3)" }}
                        >
                          {p.district} дүүрэг
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
              {showResults && query.trim() && searchResults.length === 0 && (
                <div className="text-xs text-[var(--text-3)] py-2 text-center">
                  Тохирох газар олдсонгүй. Газрын зураг дээр товшиж сонгоно уу.
                </div>
              )}
            </div>

            <label className="block">
              <div className="text-xs font-semibold text-[var(--text-2)] mb-1.5">
                Хадгалах нэр
              </div>
              <input
                className="input"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                placeholder={KIND_META[kind].defaultName}
              />
            </label>

            <div
              className="text-[11px] flex items-center gap-1.5"
              style={{ color: hasPicked ? "var(--text-2)" : "var(--text-3)" }}
            >
              <MapPin className="w-3 h-3" />
              {hasPicked ? (
                <span className="num">
                  {lat.toFixed(5)}, {lng.toFixed(5)}
                </span>
              ) : (
                "Газрын зураг дээр товшиж байршлаа сонгоно уу"
              )}
            </div>

            {myPlaces.length > 0 && !picker.editId && (
              <div>
                <div className="text-xs font-semibold text-[var(--text-2)] mb-2">
                  Хадгалсан байршил
                </div>
                <div className="space-y-1.5 max-h-32 overflow-y-auto pr-1">
                  {myPlaces.map((p) => {
                    const meta = KIND_META[p.kind] ?? KIND_META.other;
                    return (
                      <div
                        key={p.id}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: "var(--surface-2)" }}
                      >
                        <meta.icon className="w-3.5 h-3.5 shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium truncate">{p.label}</div>
                          <div
                            className="text-[10px] num"
                            style={{ color: "var(--text-3)" }}
                          >
                            {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() =>
                            openPlacePicker({
                              editId: p.id,
                              kind: p.kind,
                              label: p.label,
                            })
                          }
                          className="p-1.5 rounded hover:bg-[var(--surface)] text-[var(--text-3)]"
                          aria-label="Засах"
                        >
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            removePlace(p.id);
                            pushToast("Байршил устгагдлаа", "info");
                          }}
                          className="p-1.5 rounded hover:bg-[var(--surface)]"
                          style={{ color: "var(--danger)" }}
                          aria-label="Устгах"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          <div className="place-picker-map-col">
            <div className="place-picker-map-wrap">
              <PlacePickerMap
                lat={lat}
                lng={lng}
                kind={kind}
                onPick={pickFromMap}
              />
              {!hasPicked && (
                <div className="place-picker-map-hint">
                  Газрын зураг дээр товшиж байршлаа сонгоно уу
                </div>
              )}
            </div>
          </div>
        </div>

        <footer
          className="p-4 flex gap-2 justify-between flex-wrap"
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--surface-2)",
          }}
        >
          {picker.editId ? (
            <button
              type="button"
              onClick={onRemove}
              className="btn btn-ghost"
              style={{ color: "var(--danger)" }}
            >
              <Trash2 className="w-4 h-4" /> Устгах
            </button>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <button type="button" onClick={close} className="btn btn-secondary">
              Болих
            </button>
            <button type="button" onClick={save} className="btn btn-primary">
              Хадгалах
            </button>
          </div>
        </footer>
      </div>
    </div>,
    document.body
  );
}
