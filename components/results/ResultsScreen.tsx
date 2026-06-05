"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useStore } from "@/lib/store";
import { filteredListings } from "@/lib/filters";
import { FilterSidebar } from "./FilterSidebar";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { ResultsList } from "./ResultsList";
import { ResultsMap } from "./ResultsMap";
import { SortBar } from "./SortBar";

export function ResultsScreen() {
  const params = useSearchParams();
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const mobileView = useStore((s) => s.mobileView);
  const setMobileView = useStore((s) => s.setMobileView);

  const state = useStore((s) => ({
    mode: s.mode,
    filterDistrict: s.filterDistrict,
    filterRooms: s.filterRooms,
    filterBusStop: s.filterBusStop,
    filterLifestyle: s.filterLifestyle,
    filterVerified: s.filterVerified,
    filterIpoteh: s.filterIpoteh,
    filterNewProject: s.filterNewProject,
    filterSchool: s.filterSchool,
    filterIncome: s.filterIncome,
    filterPriceMin: s.filterPriceMin,
    filterPriceMax: s.filterPriceMax,
    filterPpmMin: s.filterPpmMin,
    filterPpmMax: s.filterPpmMax,
    filterAreaMin: s.filterAreaMin,
    filterAreaMax: s.filterAreaMax,
    drawnPolygon: s.drawnPolygon,
    sortBy: s.sortBy,
  }));

  useEffect(() => {
    const m = params.get("mode");
    if (m === "sale" || m === "rent") {
      if (m !== mode) setMode(m);
    }
  }, [params, mode, setMode]);

  const listings = useMemo(() => filteredListings(state), [state]);

  return (
    <div className="results-shell">
      <div className="results-grid">
        <div className="results-sidebar-col">
          <FilterSidebar />
        </div>

        <div className="results-main-col">
          <SortBar resultCount={listings.length} />
          <ActiveFilterChips />
          <div className="results-mobile-toggle" role="tablist">
            <button
              type="button"
              className={mobileView === "list" ? "active" : undefined}
              onClick={() => setMobileView("list")}
            >
              Жагсаалт
            </button>
            <button
              type="button"
              className={mobileView === "map" ? "active" : undefined}
              onClick={() => setMobileView("map")}
            >
              Газрын зураг
            </button>
          </div>
          <div className="results-content" data-mobile-view={mobileView}>
            <div className="results-list-col">
              <ResultsList listings={listings} />
            </div>
            <div className="results-map-col">
              <ResultsMap listings={listings} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
