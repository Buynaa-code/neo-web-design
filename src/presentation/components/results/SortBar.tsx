"use client";

import { ArrowUpDown } from "lucide-react";
import { ModeToggle } from "@/components/ModeToggle";
import { useStore } from "@/infrastructure/store";

const SORTS = [
  { key: "newest", label: "Шинээр орсон" },
  { key: "price-asc", label: "Үнэ багаасаа" },
  { key: "price-desc", label: "Үнэ ихээсээ" },
  { key: "area-desc", label: "Том талбайтай" },
  { key: "ppm-asc", label: "₮/м² хямд" },
] as const;

export function SortBar({ resultCount }: { resultCount: number }) {
  const sortBy = useStore((s) => s.sortBy);
  const setSort = useStore((s) => s.setSort);

  return (
    <div className="sort-bar">
      <ModeToggle />
      <div className="sort-bar-meta">
        <strong>{resultCount.toLocaleString("en-US")}</strong> үр дүн
      </div>
      <label className="sort-bar-control">
        <ArrowUpDown className="w-4 h-4" />
        <select
          value={sortBy}
          onChange={(e) => setSort(e.target.value as typeof sortBy)}
        >
          {SORTS.map((s) => (
            <option key={s.key} value={s.key}>
              {s.label}
            </option>
          ))}
        </select>
      </label>
    </div>
  );
}
