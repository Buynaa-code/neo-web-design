"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Briefcase, GraduationCap, Home as HomeIcon, MapPin, Trash2, X } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore, type MyPlace } from "@/lib/store";
import { DISTRICTS } from "@/data/constants";
import { cn } from "@/lib/utils";

const KIND_META: Record<MyPlace["kind"], { label: string; icon: LucideIcon }> = {
  home: { label: "Гэр", icon: HomeIcon },
  work: { label: "Ажил", icon: Briefcase },
  school: { label: "Сургууль", icon: GraduationCap },
  daycare: { label: "Цэцэрлэг", icon: MapPin },
  other: { label: "Бусад", icon: MapPin },
};

const DISTRICT_CENTERS: Record<string, { lat: number; lng: number }> = {
  "Хан-Уул": { lat: 47.892, lng: 106.929 },
  "Баянзүрх": { lat: 47.918, lng: 106.998 },
  "Сүхбаатар": { lat: 47.925, lng: 106.918 },
  "Чингэлтэй": { lat: 47.928, lng: 106.91 },
  "Сонгинохайрхан": { lat: 47.91, lng: 106.79 },
  "Налайх": { lat: 47.778, lng: 107.245 },
  "Баянгол": { lat: 47.913, lng: 106.872 },
  "Багануур": { lat: 47.812, lng: 108.348 },
  "Багахангай": { lat: 47.711, lng: 107.535 },
};

export function PlacePicker() {
  const picker = useStore((s) => s.placePicker);
  const close = useStore((s) => s.closePlacePicker);
  const addOrUpdate = useStore((s) => s.addOrUpdatePlace);
  const removePlace = useStore((s) => s.removePlace);
  const myPlaces = useStore((s) => s.myPlaces);
  const pushToast = useStore((s) => s.pushToast);

  const [kind, setKind] = useState<MyPlace["kind"]>("home");
  const [label, setLabel] = useState("Гэр");
  const [district, setDistrict] = useState<string>(DISTRICTS[0]);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!picker) return;
    setKind(picker.kind);
    setLabel(picker.label || KIND_META[picker.kind].label);
    if (picker.editId) {
      const existing = myPlaces.find((p) => p.id === picker.editId);
      if (existing) {
        const dist =
          Object.entries(DISTRICT_CENTERS).find(
            ([, c]) =>
              Math.abs(c.lat - existing.lat) < 0.05 && Math.abs(c.lng - existing.lng) < 0.05
          )?.[0] ?? DISTRICTS[0];
        setDistrict(dist);
      }
    } else {
      setDistrict(DISTRICTS[0]);
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

  if (!mounted || !picker) return null;

  const center = DISTRICT_CENTERS[district] ?? DISTRICT_CENTERS["Хан-Уул"];

  const save = () => {
    const place: MyPlace = {
      id: picker.editId ?? `place-${Date.now()}`,
      kind,
      label: label.trim() || KIND_META[kind].label,
      lat: center.lat,
      lng: center.lng,
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
      <div className="modal" data-size="md" style={{ padding: 0 }}>
        <div
          className="p-5 flex items-center justify-between"
          style={{ borderBottom: "1px solid var(--border)" }}
        >
          <div>
            <h3 className="font-semibold text-lg">
              {picker.editId ? "Байршил засах" : "Байршил нэмэх"}
            </h3>
            <p className="text-xs text-[var(--text-3)] mt-0.5">
              Хайлт танай байршилд тулгуурлан илүү тохирох болно
            </p>
          </div>
          <button
            type="button"
            onClick={close}
            className="text-[var(--text-3)] hover:text-[var(--text)]"
            aria-label="Хаах"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
          <div>
            <div className="text-xs font-semibold text-[var(--text-2)] mb-2">Төрөл</div>
            <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
              {(Object.keys(KIND_META) as MyPlace["kind"][]).map((k) => {
                const meta = KIND_META[k];
                const active = kind === k;
                return (
                  <button
                    key={k}
                    type="button"
                    onClick={() => {
                      setKind(k);
                      if (label === KIND_META[kind].label) setLabel(meta.label);
                    }}
                    className={cn(
                      "src-chip py-3 flex flex-col items-center gap-1",
                      active && "selected"
                    )}
                  >
                    <meta.icon className="w-4 h-4" />
                    <span className="text-xs">{meta.label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <label className="block">
            <div className="text-xs font-semibold text-[var(--text-2)] mb-1.5">Нэр</div>
            <input
              className="input"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="Жишээ: Гэр"
            />
          </label>

          <div>
            <div className="text-xs font-semibold text-[var(--text-2)] mb-2">Дүүрэг</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISTRICTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setDistrict(d)}
                  className={cn("src-chip py-2.5", district === d && "selected")}
                >
                  {d}
                </button>
              ))}
            </div>
            <p className="text-[11px] text-[var(--text-3)] mt-2">
              Газрын зураг дээр PIN тавих боломж удахгүй нэмэгдэнэ. Одоохондоо дүүргээр сонгоно.
            </p>
          </div>

          {myPlaces.length > 0 && !picker.editId && (
            <div>
              <div className="text-xs font-semibold text-[var(--text-2)] mb-2">
                Хадгалсан байршлууд
              </div>
              <div className="space-y-2">
                {myPlaces.map((p) => {
                  const meta = KIND_META[p.kind] ?? KIND_META.other;
                  return (
                    <div
                      key={p.id}
                      className="card p-3 flex items-center gap-3"
                    >
                      <div
                        className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                        style={{
                          background: "var(--primary-soft)",
                          color: "var(--primary)",
                        }}
                      >
                        <meta.icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-medium text-sm">{p.label}</div>
                        <div className="text-xs text-[var(--text-3)]">
                          {p.lat.toFixed(3)}, {p.lng.toFixed(3)}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => removePlace(p.id)}
                        className="btn btn-ghost !text-xs !py-2"
                        style={{ color: "var(--danger)" }}
                        aria-label="Устгах"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div
          className="p-4 flex gap-2 justify-between"
          style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
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
        </div>
      </div>
    </div>,
    document.body
  );
}
