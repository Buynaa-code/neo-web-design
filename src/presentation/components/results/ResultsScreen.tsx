"use client";

import { useEffect, useMemo } from "react";
import { useSearchParams } from "next/navigation";
import { useShallow } from "zustand/react/shallow";
import {
  BookmarkPlus,
  CheckCircle2,
  Flame,
  MapPin,
  Maximize2,
  Minimize2,
  PenLine,
  Sparkles,
  SlidersHorizontal,
  Trash2,
  TrendingUp,
} from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { filteredListings, baseListingsForMode } from "@/application/filters";
import { fmtCompact } from "@/infrastructure/data/formatters";
import { FilterSidebar } from "./FilterSidebar";
import { ActiveFilterChips } from "./ActiveFilterChips";
import { ResultsList } from "./ResultsList";
import { ResultsMap } from "./ResultsMap";
import { SortBar } from "./SortBar";
import { AdvancedFiltersModal } from "./AdvancedFiltersModal";
import { AISearchBar } from "./AISearchBar";
import { SaveSearchModal } from "./SavedSearchModals";
import { DetailedStatsModal } from "./DetailedStatsModal";

export function ResultsScreen() {
  const params = useSearchParams();
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const mobileView = useStore((s) => s.mobileView);
  const setMobileView = useStore((s) => s.setMobileView);

  const state = useStore(
    useShallow((s) => ({
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
      filterPropertyKind: s.filterPropertyKind,
      drawnPolygon: s.drawnPolygon,
      sortBy: s.sortBy,
    }))
  );

  useEffect(() => {
    const m = params.get("mode");
    if (m === "sale" || m === "rent") {
      if (m !== mode) setMode(m);
    }
  }, [params, mode, setMode]);

  const listings = useMemo(() => filteredListings(state), [state]);

  const stats = useMemo(() => {
    const base = baseListingsForMode(state.mode).filter(
      (l) => !state.filterDistrict || l.district === state.filterDistrict
    );
    if (!base.length) return { avgPrice: 0, count: 0, avgPpm: 0 };
    const avgPrice = Math.round(base.reduce((s, l) => s + l.price, 0) / base.length);
    const avgPpm = Math.round(
      base.reduce((s, l) => s + (l.area ? l.price / l.area : 0), 0) / base.length
    );
    return { avgPrice, count: base.length, avgPpm };
  }, [state.mode, state.filterDistrict]);

  const districtLabel = state.filterDistrict ?? "Бүх дүүрэг";
  const pushToast = useStore((s) => s.pushToast);
  const openModal = useStore((s) => s.openModal);
  const openAdvanced = () => openModal(<AdvancedFiltersModal />, "lg");
  const fullMap = useStore((s) => s.fullMap);
  const setFullMap = useStore((s) => s.setFullMap);
  const mapMode = useStore((s) => s.mapMode);
  const setMapMode = useStore((s) => s.setMapMode);
  const drawingPolygon = useStore((s) => s.drawingPolygon);
  const setDrawingPolygon = useStore((s) => s.setDrawingPolygon);
  const drawnPolygon = useStore((s) => s.drawnPolygon);
  const setDrawnPolygon = useStore((s) => s.setDrawnPolygon);

  useEffect(() => {
    if (!fullMap) return;
    document.body.classList.add("map-fs-open");
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setFullMap(false);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.classList.remove("map-fs-open");
      document.removeEventListener("keydown", onKey);
    };
  }, [fullMap, setFullMap]);

  return (
    <div className={`results-shell${fullMap ? " full-map" : ""}`}>
      <AISearchBar />
      <div className="results-hero">
        <div>
          <h1 className="results-title">Хайлтын үр дүн</h1>
          <p className="results-subtitle">
            <span className="num">{listings.length}</span> үл хөдлөх хөрөнгө олдлоо ·{" "}
            {districtLabel}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="btn btn-secondary"
            onClick={openAdvanced}
          >
            <SlidersHorizontal className="w-4 h-4" /> Дэлгэрэнгүй шүүлтүүр
          </button>
          <button
            type="button"
            className="btn btn-secondary"
            onClick={() => openModal(<SaveSearchModal />, "md")}
          >
            <BookmarkPlus className="w-4 h-4" /> Хайлтаа хадгалах
          </button>
        </div>
      </div>

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
              <div className="results-map-wrap">
                <ResultsMap listings={listings} />
                <div className="results-map-tools">
                  <div className="results-map-pill" role="tablist" aria-label="Map mode">
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mapMode === "pins"}
                      className={mapMode === "pins" ? "active" : undefined}
                      onClick={() => setMapMode("pins")}
                      title="Pin горим"
                    >
                      <MapPin className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Pin</span>
                    </button>
                    <button
                      type="button"
                      role="tab"
                      aria-selected={mapMode === "heatmap"}
                      className={mapMode === "heatmap" ? "active" : undefined}
                      onClick={() => setMapMode("heatmap")}
                      title="Heatmap"
                    >
                      <Flame className="w-3.5 h-3.5" />
                      <span className="hidden sm:inline">Heatmap</span>
                    </button>
                  </div>
                  <button
                    type="button"
                    className={`results-map-icon-btn${drawingPolygon ? " active" : ""}`}
                    onClick={() => {
                      if (drawingPolygon) {
                        setDrawingPolygon(false);
                      } else {
                        setDrawnPolygon(null);
                        setDrawingPolygon(true);
                        pushToast("Газрын зураг дээр товшиж бүс зурна (давхар click дуусгах)", "info");
                      }
                    }}
                    title={drawingPolygon ? "Зурах горим зогсоох" : "Бүс зурж шүүх"}
                  >
                    <PenLine className="w-3.5 h-3.5" />
                  </button>
                  {drawnPolygon && drawnPolygon.length > 0 && (
                    <button
                      type="button"
                      className="results-map-icon-btn"
                      onClick={() => {
                        setDrawnPolygon(null);
                        setDrawingPolygon(false);
                        pushToast("Бүс арилгалаа", "info");
                      }}
                      title="Бүс арилгах"
                      style={{ color: "var(--danger)" }}
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
                <button
                  type="button"
                  className="results-map-fs-btn"
                  onClick={() => setFullMap(!fullMap)}
                  title={fullMap ? "Жагсаалт нээх" : "Газрын зургийг дэлгэх"}
                  aria-label={fullMap ? "Хаах" : "Бүтэн дэлгэц"}
                >
                  {fullMap ? (
                    <Minimize2 className="w-4 h-4" />
                  ) : (
                    <Maximize2 className="w-4 h-4" />
                  )}
                  <span className="hidden sm:inline">
                    {fullMap ? "Жагсаалт нээх" : "Бүтэн дэлгэц"}
                  </span>
                </button>
              </div>
              <div className="results-side-stack">
                <div className="results-side-block">
                  <div className="results-side-title">
                    <span>
                      Зах зээлийн тойм{" "}
                      <span className="results-side-sub">({districtLabel})</span>
                    </span>
                    <button
                      type="button"
                      onClick={() =>
                        openModal(
                          <DetailedStatsModal
                            initialDistrict={state.filterDistrict ?? "all"}
                          />,
                          "lg"
                        )
                      }
                      className="text-xs font-medium hover:underline ml-auto"
                      style={{ color: "var(--gold-brand)" }}
                    >
                      Дэлгэрэнгүй →
                    </button>
                  </div>
                  <div className="results-stats-grid">
                    <Stat
                      label="Дундаж үнэ"
                      value={stats.avgPrice ? fmtCompact(stats.avgPrice) : "—"}
                      delta="▲ 4.6%"
                    />
                    <Stat
                      label="Идэвхтэй зар"
                      value={String(stats.count || "—")}
                      delta="▲ 12.1%"
                      separators
                    />
                    <Stat
                      label="₮/м²"
                      value={
                        stats.avgPpm ? stats.avgPpm.toLocaleString("en-US") + "₮" : "—"
                      }
                      delta="▲ 3.8%"
                    />
                  </div>
                </div>

                <div className="results-side-block results-ai-pick">
                  <div className="results-ai-pick-head">
                    <div className="results-ai-pick-icon">
                      <Sparkles className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="text-sm font-semibold">AI санал болгох</div>
                      <div
                        className="text-[11px]"
                        style={{ color: "var(--text-3)" }}
                      >
                        Таны хайлтад тохирох боломжууд
                      </div>
                    </div>
                  </div>
                  <div className="results-ai-pick-line">
                    <CheckCircle2 className="w-4 h-4" />
                    60–120 м² талбайтай 3 өрөө хамгийн эрэлттэй
                  </div>
                  <div className="results-ai-pick-line">
                    <TrendingUp className="w-4 h-4" />
                    {districtLabel} сүүлийн 30 хоногт +4.6% өсөв
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  delta,
  separators,
}: {
  label: string;
  value: string;
  delta: string;
  separators?: boolean;
}) {
  return (
    <div
      className="results-stat"
      style={
        separators
          ? {
              borderLeft: "1px solid var(--border)",
              borderRight: "1px solid var(--border)",
            }
          : undefined
      }
    >
      <div className="results-stat-label">{label}</div>
      <div className="num results-stat-value">{value}</div>
      <div className="results-stat-delta">{delta}</div>
    </div>
  );
}
