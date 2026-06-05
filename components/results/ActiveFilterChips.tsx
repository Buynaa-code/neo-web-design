"use client";

import { X } from "lucide-react";
import { fmtCompact } from "@/data/formatters";
import { LIFESTYLE_DEFS } from "@/lib/filters";
import { useStore } from "@/lib/store";

export function ActiveFilterChips() {
  const filterDistrict = useStore((s) => s.filterDistrict);
  const setFilterDistrict = useStore((s) => s.setFilterDistrict);
  const filterRooms = useStore((s) => s.filterRooms);
  const setFilterRooms = useStore((s) => s.setFilterRooms);
  const filterLifestyle = useStore((s) => s.filterLifestyle);
  const toggleLifestyle = useStore((s) => s.toggleLifestyle);
  const filterPriceMin = useStore((s) => s.filterPriceMin);
  const filterPriceMax = useStore((s) => s.filterPriceMax);
  const setPriceRange = useStore((s) => s.setPriceRange);
  const filterVerified = useStore((s) => s.filterVerified);
  const filterIpoteh = useStore((s) => s.filterIpoteh);
  const filterNewProject = useStore((s) => s.filterNewProject);
  const toggleVerified = useStore((s) => s.toggleVerified);
  const toggleIpoteh = useStore((s) => s.toggleIpoteh);
  const toggleNewProject = useStore((s) => s.toggleNewProject);
  const clearAllFilters = useStore((s) => s.clearAllFilters);

  const chips: Array<{ key: string; label: string; remove: () => void }> = [];
  if (filterDistrict)
    chips.push({
      key: "district",
      label: filterDistrict,
      remove: () => setFilterDistrict(null),
    });
  if (filterRooms?.length)
    chips.push({
      key: "rooms",
      label: filterRooms.join("/") + " өрөө",
      remove: () => setFilterRooms(null),
    });
  if (filterPriceMin != null || filterPriceMax != null)
    chips.push({
      key: "price",
      label: `${filterPriceMin ? fmtCompact(filterPriceMin) : "≥ 0"} → ${filterPriceMax ? fmtCompact(filterPriceMax) : "∞"}`,
      remove: () => setPriceRange(null, null),
    });
  if (filterVerified)
    chips.push({ key: "verified", label: "Баталгаажсан", remove: toggleVerified });
  if (filterIpoteh)
    chips.push({ key: "ipoteh", label: "Ипотек боломжтой", remove: toggleIpoteh });
  if (filterNewProject)
    chips.push({ key: "new", label: "Шинэ төсөл", remove: toggleNewProject });
  for (const k of filterLifestyle) {
    const meta = LIFESTYLE_DEFS.find((d) => d.key === k);
    if (meta)
      chips.push({
        key: `life-${k}`,
        label: meta.label,
        remove: () => toggleLifestyle(k),
      });
  }

  if (!chips.length) return null;

  return (
    <div className="active-filter-chips">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          className="active-filter-chip"
          onClick={c.remove}
        >
          {c.label}
          <X className="w-3 h-3" />
        </button>
      ))}
      <button
        type="button"
        className="active-filter-clear"
        onClick={clearAllFilters}
      >
        Бүгдийг арилгах
      </button>
    </div>
  );
}
