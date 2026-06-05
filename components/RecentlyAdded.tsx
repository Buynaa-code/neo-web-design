"use client";

import { useMemo } from "react";
import { LISTINGS } from "@/data/listings";
import { useStore } from "@/lib/store";
import { ListingCard } from "./ListingCard";

export function RecentlyAdded() {
  const mode = useStore((s) => s.mode);
  const listings = useMemo(
    () =>
      LISTINGS.filter((l) => l.mode === mode)
        .slice()
        .sort((a, b) => a.listedDays - b.listedDays)
        .slice(0, 6),
    [mode]
  );

  return (
    <section className="home-recent">
      <header className="home-recent-head">
        <h2 className="home-section-title">Шинээр нэмэгдсэн</h2>
        <p className="home-section-sub">
          {mode === "rent" ? "Түрээслүүлэх" : "Худалдах"} зарууд — сүүлд орсон
        </p>
      </header>
      <div className="home-recent-grid">
        {listings.map((l) => (
          <ListingCard key={l.id} listing={l} />
        ))}
      </div>
    </section>
  );
}
