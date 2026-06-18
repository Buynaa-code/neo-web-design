"use client";

import { useMemo } from "react";
import { baseListingsForMode } from "@/application/filters";
import { useStore } from "@/infrastructure/store";
import { ListingCard } from "./ListingCard";

export function RecentlyAdded() {
  const mode = useStore((s) => s.mode);
  const listingsVersion = useStore((s) => s.listingsVersion);
  const listings = useMemo(
    () =>
      baseListingsForMode(mode)
        .slice()
        .sort((a, b) => a.listedDays - b.listedDays)
        .slice(0, 6),
    [mode, listingsVersion]
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
