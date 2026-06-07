"use client";

import {
  BedDouble,
  Briefcase,
  GraduationCap,
  Home,
  KeyRound,
  PawPrint,
  Sofa,
  Sparkles,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";
import { DISTRICTS } from "@/infrastructure/data/constants";
import { fmtCompact } from "@/infrastructure/data/formatters";
import { LIFESTYLE_DEFS } from "@/application/filters";
import { useStore } from "@/infrastructure/store";
import { cn } from "@/lib/utils";

const LIFESTYLE_ICONS: Record<string, LucideIcon> = {
  users: Users,
  briefcase: Briefcase,
  "graduation-cap": GraduationCap,
  "trending-up": TrendingUp,
  "paw-print": PawPrint,
  sofa: Sofa,
  banknote: KeyRound,
  home: Home,
};

const ROOM_OPTIONS = [1, 2, 3, 4] as const;

const PRICE_PRESETS_SALE: Array<{ label: string; min: number | null; max: number | null }> = [
  { label: "300сая хүртэл", min: null, max: 300_000_000 },
  { label: "300-500сая", min: 300_000_000, max: 500_000_000 },
  { label: "500сая-1тэр", min: 500_000_000, max: 1_000_000_000 },
  { label: "1тэр+", min: 1_000_000_000, max: null },
];

const PRICE_PRESETS_RENT: Array<{ label: string; min: number | null; max: number | null }> = [
  { label: "1сая хүртэл", min: null, max: 1_000_000 },
  { label: "1-2сая", min: 1_000_000, max: 2_000_000 },
  { label: "2-3сая", min: 2_000_000, max: 3_000_000 },
  { label: "3сая+", min: 3_000_000, max: null },
];

export function FilterSidebar() {
  const mode = useStore((s) => s.mode);
  const filterDistrict = useStore((s) => s.filterDistrict);
  const setFilterDistrict = useStore((s) => s.setFilterDistrict);
  const filterRooms = useStore((s) => s.filterRooms) ?? [];
  const setFilterRooms = useStore((s) => s.setFilterRooms);
  const filterLifestyle = useStore((s) => s.filterLifestyle);
  const toggleLifestyle = useStore((s) => s.toggleLifestyle);
  const filterVerified = useStore((s) => s.filterVerified);
  const filterIpoteh = useStore((s) => s.filterIpoteh);
  const filterNewProject = useStore((s) => s.filterNewProject);
  const toggleVerified = useStore((s) => s.toggleVerified);
  const toggleIpoteh = useStore((s) => s.toggleIpoteh);
  const toggleNewProject = useStore((s) => s.toggleNewProject);
  const filterPriceMin = useStore((s) => s.filterPriceMin);
  const filterPriceMax = useStore((s) => s.filterPriceMax);
  const setPriceRange = useStore((s) => s.setPriceRange);
  const clearAllFilters = useStore((s) => s.clearAllFilters);

  const presets = mode === "rent" ? PRICE_PRESETS_RENT : PRICE_PRESETS_SALE;

  const toggleRoom = (n: number) => {
    const set = new Set(filterRooms);
    if (set.has(n)) set.delete(n);
    else set.add(n);
    const arr = Array.from(set).sort((a, b) => a - b);
    setFilterRooms(arr.length ? arr : null);
  };

  return (
    <aside className="filter-sidebar" aria-label="Шүүлтүүр">
      <header className="filter-sidebar-head">
        <h3>Шүүлтүүр</h3>
        <button type="button" className="filter-clear" onClick={clearAllFilters}>
          Цэвэрлэх
        </button>
      </header>

      <section className="filter-group">
        <h4>Дүүрэг</h4>
        <div className="filter-chips">
          {DISTRICTS.map((d) => (
            <button
              key={d}
              type="button"
              className={cn("filter-chip", filterDistrict === d && "active")}
              onClick={() => setFilterDistrict(filterDistrict === d ? null : d)}
            >
              {d}
            </button>
          ))}
        </div>
      </section>

      <section className="filter-group">
        <h4>Өрөө</h4>
        <div className="filter-chips">
          {ROOM_OPTIONS.map((n) => {
            const active = filterRooms.includes(n);
            return (
              <button
                key={n}
                type="button"
                className={cn("filter-chip", active && "active")}
                onClick={() => toggleRoom(n)}
              >
                <BedDouble className="w-3 h-3" />
                {n}
              </button>
            );
          })}
        </div>
      </section>

      <section className="filter-group">
        <h4>Үнэ</h4>
        <div className="filter-chips">
          {presets.map((p) => {
            const active = filterPriceMin === p.min && filterPriceMax === p.max;
            return (
              <button
                key={p.label}
                type="button"
                className={cn("filter-chip", active && "active")}
                onClick={() =>
                  active ? setPriceRange(null, null) : setPriceRange(p.min, p.max)
                }
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <div className="filter-price-summary">
          {filterPriceMin || filterPriceMax ? (
            <>
              {filterPriceMin ? fmtCompact(filterPriceMin) : "—"} →{" "}
              {filterPriceMax ? fmtCompact(filterPriceMax) : "ямар ч"}
            </>
          ) : (
            <span className="text-(--text-3)">Сонгогдоогүй</span>
          )}
        </div>
      </section>

      <section className="filter-group">
        <h4>Алдартай шүүлтүүр</h4>
        <div className="filter-toggle-list">
          <Toggle
            checked={filterVerified}
            onChange={toggleVerified}
            label="Баталгаажсан агент"
          />
          <Toggle
            checked={filterIpoteh}
            onChange={toggleIpoteh}
            label="Ипотек боломжтой"
          />
          <Toggle
            checked={filterNewProject}
            onChange={toggleNewProject}
            label="Шинэ төсөл"
          />
        </div>
      </section>

      <section className="filter-group">
        <h4>Амьдралын хэв маяг</h4>
        <div className="filter-chips">
          {LIFESTYLE_DEFS.map((l) => {
            const Icon = LIFESTYLE_ICONS[l.icon] ?? Sparkles;
            const active = filterLifestyle.includes(l.key);
            return (
              <button
                key={l.key}
                type="button"
                className={cn("filter-chip", active && "active")}
                onClick={() => toggleLifestyle(l.key)}
              >
                <Icon className="w-3 h-3" />
                {l.label}
              </button>
            );
          })}
        </div>
      </section>
    </aside>
  );
}

function Toggle({
  checked,
  onChange,
  label,
}: {
  checked: boolean;
  onChange: () => void;
  label: string;
}) {
  return (
    <label className={cn("filter-toggle", checked && "active")}>
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="filter-toggle-knob" />
      <span className="filter-toggle-label">{label}</span>
    </label>
  );
}

