"use client";

import { useState } from "react";
import { RotateCcw } from "lucide-react";
import { DISTRICTS } from "@/infrastructure/data/constants";
import { activeListings } from "@/application/filters";
import { useStore } from "@/infrastructure/store";
import { cn } from "@/lib/utils";
import type { ListingMode } from "@/domain/types";

const ROOM_CHOICES = [1, 2, 3, 4] as const;

export function AdvancedFiltersModal() {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);

  const initial = useStore.getState();
  const [mode, setMode] = useState<ListingMode>(initial.mode);
  const [rooms, setRooms] = useState<number | null>(
    initial.filterRooms && initial.filterRooms.length === 1 ? initial.filterRooms[0] : null
  );
  const [district, setDistrict] = useState<string | null>(initial.filterDistrict);
  const [priceMin, setPriceMin] = useState<string>(
    initial.filterPriceMin != null ? String(initial.filterPriceMin) : ""
  );
  const [priceMax, setPriceMax] = useState<string>(
    initial.filterPriceMax != null ? String(initial.filterPriceMax) : ""
  );
  const [areaMin, setAreaMin] = useState<string>(
    initial.filterAreaMin != null ? String(initial.filterAreaMin) : ""
  );
  const [areaMax, setAreaMax] = useState<string>(
    initial.filterAreaMax != null ? String(initial.filterAreaMax) : ""
  );
  const [verified, setVerified] = useState(initial.filterVerified);
  const [ipoteh, setIpoteh] = useState(initial.filterIpoteh);
  const [newProj, setNewProj] = useState(initial.filterNewProject);
  const [school, setSchool] = useState(initial.filterSchool);
  const [income, setIncome] = useState(initial.filterIncome);

  const districtCount = (d: string) =>
    activeListings().filter((l) => l.district === d && l.mode === mode).length;

  const isRent = mode === "rent";
  const priceMaxPlaceholder = isRent ? "2,000,000" : "600,000,000";

  const num = (v: string): number | null => {
    const n = parseFloat(v);
    return Number.isFinite(n) && n > 0 ? n : null;
  };

  const apply = () => {
    const store = useStore.getState();
    store.setMode(mode);
    store.setFilterDistrict(district);
    store.setFilterRooms(rooms ? [rooms] : null);
    store.setPriceRange(num(priceMin), num(priceMax));
    store.setAreaRange(num(areaMin), num(areaMax));
    if (verified !== store.filterVerified) store.toggleVerified();
    if (ipoteh !== store.filterIpoteh) store.toggleIpoteh();
    if (newProj !== store.filterNewProject) store.toggleNewProject();
    if (school !== store.filterSchool) store.toggleSchool();
    if (income !== store.filterIncome) store.toggleIncome();
    closeModal();
    pushToast("Шүүлтүүр шинэчлэгдлээ", "success");
  };

  const clear = () => {
    useStore.getState().clearAllFilters();
    closeModal();
    pushToast("Шүүлтүүр арилгалаа", "info");
  };

  return (
    <div className="-m-6 max-h-[80vh] overflow-y-auto">
      <div className="p-6">
        <div className="mb-5 flex items-start justify-between gap-3">
          <div>
            <h3 className="text-xl font-bold tracking-tight">Дэлгэрэнгүй шүүлтүүр</h3>
            <p className="text-xs mt-1" style={{ color: "var(--text-3)" }}>
              Шаардлагатай шүүлтүүрээ сонгож &quot;Хэрэглэх&quot; дарна уу.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          <div>
            <Label>Горим</Label>
            <div className="flex gap-2">
              {(["sale", "rent"] as const).map((m) => (
                <Chip key={m} active={mode === m} onClick={() => setMode(m)}>
                  {m === "sale" ? "Худалдах" : "Түрээслэх"}
                </Chip>
              ))}
            </div>

            <Label className="mt-5">Өрөөний тоо</Label>
            <div className="flex flex-wrap gap-2">
              {ROOM_CHOICES.map((n) => (
                <Chip
                  key={n}
                  active={rooms === n}
                  onClick={() => setRooms(rooms === n ? null : n)}
                >
                  {n}
                  {n === 4 ? "+" : ""} өрөө
                </Chip>
              ))}
              <Chip active={rooms === null} onClick={() => setRooms(null)}>
                Бүгд
              </Chip>
            </div>

            <Label className="mt-5">
              {isRent ? "Сарын түрээс (₮)" : "Үнэ (₮)"}
            </Label>
            <div className="grid grid-cols-2 gap-2">
              <NumField
                label="Доод"
                placeholder="0"
                value={priceMin}
                onChange={setPriceMin}
              />
              <NumField
                label="Дээд"
                placeholder={priceMaxPlaceholder}
                value={priceMax}
                onChange={setPriceMax}
              />
            </div>

            <Label className="mt-5">Талбай (м²)</Label>
            <div className="grid grid-cols-2 gap-2">
              <NumField
                label="Доод"
                placeholder="40"
                value={areaMin}
                onChange={setAreaMin}
              />
              <NumField
                label="Дээд"
                placeholder="200"
                value={areaMax}
                onChange={setAreaMax}
              />
            </div>

            <Label className="mt-5">Онцлог</Label>
            <div className="space-y-1.5">
              <CheckRow checked={verified} onChange={setVerified} label="Зөвхөн Verified" />
              <CheckRow checked={ipoteh} onChange={setIpoteh} label="Ипотектэй" />
              <CheckRow checked={newProj} onChange={setNewProj} label="Шинэ төсөл" />
              <CheckRow checked={school} onChange={setSchool} label="Сургууль ойр" />
              <CheckRow checked={income} onChange={setIncome} label="Орлого өгөх" />
            </div>
          </div>

          <div>
            <Label>Байршил (Дүүрэг)</Label>
            <div className="space-y-0.5">
              <RadioRow
                checked={district === null}
                onChange={() => setDistrict(null)}
                label="Бүх дүүрэг"
              />
              {DISTRICTS.map((d) => (
                <RadioRow
                  key={d}
                  checked={district === d}
                  onChange={() => setDistrict(d)}
                  label={d}
                  count={districtCount(d)}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      <div
        className="flex items-center justify-between gap-3 px-6 py-4"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button
          type="button"
          onClick={clear}
          className="text-sm inline-flex items-center gap-1.5"
          style={{ color: "var(--text-3)" }}
        >
          <RotateCcw className="w-3.5 h-3.5" /> Бүгдийг арилгах
        </button>
        <div className="flex gap-2">
          <button type="button" onClick={closeModal} className="bm-btn-outline !py-2.5">
            Цуцлах
          </button>
          <button type="button" onClick={apply} className="bm-btn-gold">
            Хэрэглэх
          </button>
        </div>
      </div>
    </div>
  );
}

function Label({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn("text-xs font-semibold mb-2", className)}
      style={{ color: "var(--text-3)", letterSpacing: ".06em" }}
    >
      {children}
    </div>
  );
}

function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn("bm-chip", active && "active")}
      style={
        active
          ? {
              borderColor: "var(--gold-brand)",
              background: "var(--gold-soft)",
              color: "var(--gold-brand)",
            }
          : undefined
      }
    >
      {children}
    </button>
  );
}

function NumField({
  label,
  placeholder,
  value,
  onChange,
}: {
  label: string;
  placeholder: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-[11px]" style={{ color: "var(--text-3)" }}>
        {label}
      </label>
      <input
        type="number"
        inputMode="numeric"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="input num"
      />
    </div>
  );
}

function CheckRow({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
}) {
  return (
    <label className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer text-sm">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="accent-[var(--gold-brand)]"
      />
      {label}
    </label>
  );
}

function RadioRow({
  checked,
  onChange,
  label,
  count,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
  count?: number;
}) {
  return (
    <label className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-[var(--surface-2)] cursor-pointer">
      <input
        type="radio"
        name="adv-district"
        checked={checked}
        onChange={onChange}
        className="accent-[var(--gold-brand)]"
      />
      <span className="flex-1 text-sm">{label}</span>
      {count !== undefined && (
        <span className="text-xs" style={{ color: "var(--text-3)" }}>
          {count}
        </span>
      )}
    </label>
  );
}
