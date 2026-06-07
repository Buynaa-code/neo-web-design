"use client";

import {
  ArrowUpDown,
  BedDouble,
  Building2,
  Calendar,
  Check,
  Flame,
  Heart,
  Home,
  House,
  KeyRound,
  LayoutGrid,
  MapPin,
  MapPinned,
  Ruler,
  Search,
  SlidersHorizontal,
  Sparkles,
  TrendingDown,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

import { DISTRICTS } from "@/data/constants";
import {
  fmtCompact,
  fmtPpm,
  listingMinutesAgo,
  listingPrice,
} from "@/data/formatters";
import { activeListings, filteredListings, getPropertyKind, hasIpoteh, isListingVerified, isNewProject } from "@/lib/filters";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { photoUrl } from "@/data/listings";
import type { Listing } from "@/lib/types";
import { ResultsMap } from "@/components/results/ResultsMap";
import { HomeAIChat } from "@/components/HomeAIChat";
import { DualRangeSlider } from "@/components/DualRangeSlider";
import Link from "next/link";
import { useRouter } from "next/navigation";

const roomOptions = [1, 2, 3, 4] as const;

const salePricePresets = [
  { label: "<150сая", min: null, max: 150_000_000 },
  { label: "150-300", min: 150_000_000, max: 300_000_000 },
  { label: "300-500", min: 300_000_000, max: 500_000_000 },
  { label: "500сая+", min: 500_000_000, max: null },
];

const rentPricePresets = [
  { label: "<1сая", min: null, max: 1_000_000 },
  { label: "1-2сая", min: 1_000_000, max: 2_000_000 },
  { label: "2-3сая", min: 2_000_000, max: 3_000_000 },
  { label: "3сая+", min: 3_000_000, max: null },
];

const sortOrder = ["newest", "price-asc", "price-desc", "area-asc", "area-desc", "ppm-asc"] as const;

const sortLabels: Record<(typeof sortOrder)[number], string> = {
  newest: "Шинэ нэмэгдсэн",
  "price-asc": "Үнэ: бага",
  "price-desc": "Үнэ: их",
  "area-asc": "Талбай: бага",
  "area-desc": "Талбай: их",
  "ppm-asc": "₮/м² бага",
};

type FilterSnapshot = Parameters<typeof filteredListings>[0];

export function HomeSplitScreen() {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);
  const sortBy = useStore((s) => s.sortBy);
  const setSort = useStore((s) => s.setSort);
  const filterDistrict = useStore((s) => s.filterDistrict);
  const setFilterDistrict = useStore((s) => s.setFilterDistrict);
  const filterRooms = useStore((s) => s.filterRooms);
  const setFilterRooms = useStore((s) => s.setFilterRooms);
  const filterVerified = useStore((s) => s.filterVerified);
  const filterIpoteh = useStore((s) => s.filterIpoteh);
  const filterNewProject = useStore((s) => s.filterNewProject);
  const filterSchool = useStore((s) => s.filterSchool);
  const filterIncome = useStore((s) => s.filterIncome);
  const filterLifestyle = useStore((s) => s.filterLifestyle);
  const toggleLifestyle = useStore((s) => s.toggleLifestyle);
  const toggleVerified = useStore((s) => s.toggleVerified);
  const toggleIpoteh = useStore((s) => s.toggleIpoteh);
  const toggleNewProject = useStore((s) => s.toggleNewProject);
  const toggleSchool = useStore((s) => s.toggleSchool);
  const toggleIncome = useStore((s) => s.toggleIncome);
  const filterPriceMin = useStore((s) => s.filterPriceMin);
  const filterPriceMax = useStore((s) => s.filterPriceMax);
  const setPriceRange = useStore((s) => s.setPriceRange);
  const filterPpmMin = useStore((s) => s.filterPpmMin);
  const filterPpmMax = useStore((s) => s.filterPpmMax);
  const filterAreaMin = useStore((s) => s.filterAreaMin);
  const filterAreaMax = useStore((s) => s.filterAreaMax);
  const filterPropertyKind = useStore((s) => s.filterPropertyKind);
  const setFilterPropertyKind = useStore((s) => s.setFilterPropertyKind);
  const drawnPolygon = useStore((s) => s.drawnPolygon);
  const clearAllFilters = useStore((s) => s.clearAllFilters);
  const openPlacePicker = useStore((s) => s.openPlacePicker);
  const myPlaces = useStore((s) => s.myPlaces);

  const snapshot = useMemo<FilterSnapshot>(
    () => ({
      mode,
      filterDistrict,
      filterRooms,
      filterBusStop: null,
      filterLifestyle,
      filterVerified,
      filterIpoteh,
      filterNewProject,
      filterSchool,
      filterIncome,
      filterPriceMin,
      filterPriceMax,
      filterPpmMin,
      filterPpmMax,
      filterAreaMin,
      filterAreaMax,
      filterPropertyKind,
      drawnPolygon,
      sortBy,
    }),
    [
      mode,
      filterDistrict,
      filterRooms,
      filterLifestyle,
      filterVerified,
      filterIpoteh,
      filterNewProject,
      filterSchool,
      filterIncome,
      filterPriceMin,
      filterPriceMax,
      filterPpmMin,
      filterPpmMax,
      filterAreaMin,
      filterAreaMax,
      filterPropertyKind,
      drawnPolygon,
      sortBy,
    ]
  );

  const listings = useMemo(() => filteredListings(snapshot), [snapshot]);
  const baseListings = useMemo(
    () => activeListings().filter((listing) => listing.mode === mode),
    [mode]
  );

  const activeFilterCount = [
    filterPropertyKind,
    filterDistrict,
    filterRooms?.length,
    filterPriceMin || filterPriceMax,
    filterVerified,
    filterIpoteh,
    filterNewProject,
    filterSchool,
    filterIncome,
    filterLifestyle.length,
  ].filter(Boolean).length;

  const cycleSort = () => {
    const current = sortOrder.indexOf(sortBy);
    setSort(sortOrder[(current + 1) % sortOrder.length]);
  };

  return (
    <section className="home-split home-split-next" aria-label="NEOMAP нүүр">
      <aside className="home-filter-col" aria-label="Шүүлтүүр">
        <div className="home-panel-top">
          <div className="bk-mode-pill" role="tablist" aria-label="Зарын төрөл">
            <button
              type="button"
              className={mode === "sale" ? "active" : undefined}
              onClick={() => setMode("sale")}
              role="tab"
              aria-selected={mode === "sale"}
            >
              <Home className="size-3.5" />
              Худалдах
            </button>
            <button
              type="button"
              className={mode === "rent" ? "active" : undefined}
              onClick={() => setMode("rent")}
              role="tab"
              aria-selected={mode === "rent"}
            >
              <KeyRound className="size-3.5" />
              Түрээс
            </button>
          </div>
          {mode === "sale" ? (
            <PropertyKindSegment
              baseListings={baseListings}
              value={filterPropertyKind}
              onChange={setFilterPropertyKind}
            />
          ) : null}
        </div>

        {activeFilterCount ? (
          <div className="bk-active-summary">
            <span className="bk-active-summary-text">
              <strong>{activeFilterCount}</strong> шүүлтүүр идэвхтэй
            </span>
            <button type="button" className="bk-active-clear" onClick={clearAllFilters}>
              <X className="size-3.5" />
              Арилгах
            </button>
          </div>
        ) : null}

        <aside className="bk-sidebar" aria-label="Шүүлтүүрийн самбар">
          <div className="bk-side-title">Шүүх:</div>
          <DistrictFilter baseListings={baseListings} />
          <RoomFilter
            baseListings={baseListings}
            filterRooms={filterRooms ?? []}
            setFilterRooms={setFilterRooms}
          />
          <PriceRangeFilter
            mode={mode}
            baseListings={baseListings}
            filterPriceMin={filterPriceMin}
            filterPriceMax={filterPriceMax}
            setPriceRange={setPriceRange}
          />
          <AreaRangeFilter
            baseListings={baseListings}
            filterAreaMin={filterAreaMin}
            filterAreaMax={filterAreaMax}
          />
          <YearRangeFilter baseListings={baseListings} />
          <StatusFilter baseListings={baseListings} />
          <PopularFilter
            baseListings={baseListings}
            filterVerified={filterVerified}
            filterIpoteh={filterIpoteh}
            filterNewProject={filterNewProject}
            filterSchool={filterSchool}
            filterIncome={filterIncome}
            furnishedActive={filterLifestyle.includes("furnished")}
            toggleVerified={toggleVerified}
            toggleIpoteh={toggleIpoteh}
            toggleNewProject={toggleNewProject}
            toggleSchool={toggleSchool}
            toggleIncome={toggleIncome}
            toggleFurnished={() => toggleLifestyle("furnished")}
          />
        </aside>
      </aside>

      <aside className="home-list-col" aria-label="Зарын жагсаалт">
        <div className="bk-home">
          <div className="bk-sortrow">
            <div className="bk-sort-count">
              <strong className="num">{listings.length}</strong> / {baseListings.length} зар
            </div>
            <button type="button" className="bk-sort" onClick={cycleSort}>
              <ArrowUpDown className="size-3.5" />
              {sortLabels[sortBy]}
            </button>
          </div>

          {listings.length ? (
            <>
              {listings.slice(0, 30).map((listing) => (
                <HomeListingRow key={listing.id} listing={listing} />
              ))}
              {listings.length > 30 && (
                <div className="text-center mt-3">
                  <Link href="/results" className="bk-mapbtn inline-flex">
                    Бүх <span className="num mx-1">{listings.length}</span> зар →
                  </Link>
                </div>
              )}
            </>
          ) : (
            <div className="bk-empty">
              <h3>Үр дүн олдсонгүй</h3>
              <div>Шүүлтүүрээ багасгаж үзнэ үү.</div>
              <button type="button" className="bk-smart-find" onClick={clearAllFilters}>
                Шүүлтүүр цэвэрлэх
              </button>
            </div>
          )}
        </div>
      </aside>

      <div className="home-map-area home-map-hero" aria-label="Газрын зураг">
        <ResultsMap listings={listings} />
        <div className="home-map-overlay">
          <div className="home-topbar">
            <div className="home-topbar-right">
              <Link href="/results" className="home-filter-btn" title="Дэлгэрэнгүй шүүлтүүр">
                <SlidersHorizontal className="size-4" />
                <span>Дэлгэрэнгүй</span>
              </Link>
              <button
                type="button"
                className="home-icon-btn"
                onClick={() => openPlacePicker({ kind: "home", label: "Гэр" })}
                title="Миний газар"
              >
                <MapPinned className="size-4" />
                {myPlaces.length ? <span className="home-icon-badge num">{myPlaces.length}</span> : null}
              </button>
              <Link href="/saved" className="home-icon-btn" title="Хадгалсан">
                <Heart className="size-4" />
              </Link>
            </div>
          </div>
          <div className="home-stats-strip">
            <span className="stat-item">
              <MapPin className="size-3.5 text-[color:var(--gold-brand)]" />
              <span>
                <span className="stat-val num">{listings.length}</span> зар
              </span>
            </span>
          </div>
          <HomeAIChat />
        </div>
      </div>
    </section>
  );
}

function PropertyKindSegment({
  baseListings,
  value,
  onChange,
}: {
  baseListings: Listing[];
  value: "apartment" | "house" | "other" | null;
  onChange: (kind: "apartment" | "house" | "other" | null) => void;
}) {
  const counts = useMemo(() => {
    const acc = { apartment: 0, house: 0, other: 0 };
    for (const l of baseListings) acc[getPropertyKind(l)]++;
    return acc;
  }, [baseListings]);

  const items: Array<{
    key: "apartment" | "house" | "other";
    label: string;
    Icon: typeof Building2;
    count: number;
  }> = [
    { key: "apartment", label: "Орон сууц", Icon: Building2, count: counts.apartment },
    { key: "house", label: "Байшин", Icon: House, count: counts.house },
    { key: "other", label: "Бусад", Icon: LayoutGrid, count: counts.other },
  ];

  return (
    <div className="bk-kind-pill" role="tablist" aria-label="Үл хөдлөхийн төрөл">
      {items.map(({ key, label, Icon, count }) => {
        const active = value === key;
        return (
          <button
            key={key}
            type="button"
            className={active ? "active" : undefined}
            onClick={() => onChange(active ? null : key)}
            role="tab"
            aria-selected={active}
            disabled={count === 0 && !active}
          >
            <Icon className="size-3.5" />
            <span>{label}</span>
            <span className="bk-kind-pill-count num">{count}</span>
          </button>
        );
      })}
    </div>
  );
}

function DistrictFilter({ baseListings }: { baseListings: Listing[] }) {
  const [query, setQuery] = useState("");
  const filterDistrict = useStore((s) => s.filterDistrict);
  const setFilterDistrict = useStore((s) => s.setFilterDistrict);
  const districts = DISTRICTS.map((district) => ({
    district,
    count: baseListings.filter((listing) => listing.district === district).length,
  })).filter((item) => item.count > 0 && item.district.toLowerCase().includes(query.toLowerCase()));

  return (
    <section className="bk-side-section">
      <div className="bk-side-heading">
        <span className="bk-side-heading-left">Дүүрэг</span>
      </div>
      <div className="bk-side-section-body">
        <div className="relative mb-2">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-[color:var(--text-3)]" />
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            className="bk-smart-input !min-h-0 !py-2 !pl-8"
            placeholder="Хайх..."
          />
        </div>
        {districts.map(({ district, count }) => (
          <CheckRow
            key={district}
            checked={filterDistrict === district}
            label={district}
            count={count}
            onChange={() => setFilterDistrict(filterDistrict === district ? null : district)}
          />
        ))}
      </div>
    </section>
  );
}

function PopularFilter({
  baseListings,
  filterVerified,
  filterIpoteh,
  filterNewProject,
  filterSchool,
  filterIncome,
  furnishedActive,
  toggleVerified,
  toggleIpoteh,
  toggleNewProject,
  toggleSchool,
  toggleIncome,
  toggleFurnished,
}: {
  baseListings: Listing[];
  filterVerified: boolean;
  filterIpoteh: boolean;
  filterNewProject: boolean;
  filterSchool: boolean;
  filterIncome: boolean;
  furnishedActive: boolean;
  toggleVerified: () => void;
  toggleIpoteh: () => void;
  toggleNewProject: () => void;
  toggleSchool: () => void;
  toggleIncome: () => void;
  toggleFurnished: () => void;
}) {
  const rows = [
    {
      label: "Баталгаажсан",
      count: baseListings.filter(isListingVerified).length,
      active: filterVerified,
      toggle: toggleVerified,
    },
    {
      label: "Ипотек боломжтой",
      count: baseListings.filter(hasIpoteh).length,
      active: filterIpoteh,
      toggle: toggleIpoteh,
    },
    {
      label: "Шинэ төсөл",
      count: baseListings.filter(isNewProject).length,
      active: filterNewProject,
      toggle: toggleNewProject,
    },
    {
      label: "Тавилгатай",
      count: baseListings.filter((listing) => listing.features?.some((feature) => /тавилгатай/i.test(feature))).length,
      active: furnishedActive,
      toggle: toggleFurnished,
    },
    {
      label: "Сургууль ойр",
      count: baseListings.filter((listing) => ["Сүхбаатар", "Чингэлтэй", "Хан-Уул"].includes(listing.district)).length,
      active: filterSchool,
      toggle: toggleSchool,
    },
    {
      label: "Хөрөнгө оруулалт",
      count: baseListings.filter((listing) => listing.price >= 300_000_000).length,
      active: filterIncome,
      toggle: toggleIncome,
    },
  ].filter((row) => row.count > 0);

  return (
    <section className="bk-side-section">
      <div className="bk-side-heading">
        <span className="bk-side-heading-left">Түгээмэл шүүлтүүр</span>
      </div>
      <div className="bk-side-section-body">
        {rows.map((row) => (
          <CheckRow
            key={row.label}
            checked={row.active}
            label={row.label}
            count={row.count}
            onChange={row.toggle}
          />
        ))}
      </div>
    </section>
  );
}

function PriceFilter({
  mode,
  filterPriceMin,
  filterPriceMax,
  setPriceRange,
}: {
  mode: "sale" | "rent";
  filterPriceMin: number | null;
  filterPriceMax: number | null;
  setPriceRange: (min: number | null, max: number | null) => void;
}) {
  const presets = mode === "rent" ? rentPricePresets : salePricePresets;
  return (
    <section className="bk-side-section">
      <div className="bk-side-heading">
        <span className="bk-side-heading-left">Үнэ</span>
      </div>
      <div className="bk-side-section-body">
        <div className="bk-price-tabs">
          <button type="button" className="bk-price-tab active">Нийт</button>
          <button type="button" className="bk-price-tab">₮/м²</button>
        </div>
        <div className="bk-range-vals">
          <span className="bk-range-val">{filterPriceMin ? fmtCompact(filterPriceMin) : "0 ₮"}</span>
          <span className="bk-range-val">{filterPriceMax ? fmtCompact(filterPriceMax) : mode === "rent" ? "3сая+ ₮" : "2тэрбум ₮+"}</span>
        </div>
        <div className="bk-price-presets mt-2">
          {presets.map((preset) => {
            const active = filterPriceMin === preset.min && filterPriceMax === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                className={cn("bk-price-preset", active && "active")}
                onClick={() =>
                  active ? setPriceRange(null, null) : setPriceRange(preset.min, preset.max)
                }
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function RoomFilter({
  baseListings,
  filterRooms,
  setFilterRooms,
}: {
  baseListings: Listing[];
  filterRooms: number[];
  setFilterRooms: (rooms: number[] | null) => void;
}) {
  const toggleRoom = (room: number) => {
    const next = filterRooms.includes(room)
      ? filterRooms.filter((item) => item !== room)
      : [...filterRooms, room];
    setFilterRooms(next.length ? next.sort((a, b) => a - b) : null);
  };

  return (
    <section className="bk-side-section">
      <div className="bk-side-heading">
        <span className="bk-side-heading-left">Үл хөдлөхийн төрөл</span>
      </div>
      <div className="bk-side-section-body">
        {roomOptions.map((room) => (
          <CheckRow
            key={room}
            checked={filterRooms.includes(room)}
            label={`${room}${room === 4 ? "+" : ""} өрөө`}
            count={baseListings.filter((listing) => room === 4 ? listing.rooms >= 4 : listing.rooms === room).length}
            onChange={() => toggleRoom(room)}
          />
        ))}
      </div>
    </section>
  );
}

function CheckRow({
  checked,
  label,
  count,
  onChange,
}: {
  checked: boolean;
  label: string;
  count: number;
  onChange: () => void;
}) {
  return (
    <label className="bk-check">
      <input type="checkbox" checked={checked} onChange={onChange} />
      <span className="bk-check-label">{label}</span>
      <span className="bk-check-count num">{count}</span>
    </label>
  );
}

function HomeListingRow({ listing }: { listing: Listing }) {
  const router = useRouter();
  const highlightedId = useStore((s) => s.highlightedId);
  const highlightSource = useStore((s) => s.highlightSource);
  const setHighlightedId = useStore((s) => s.setHighlightedId);
  const isSaved = useStore((s) => s.savedListingIds.includes(listing.id));
  const toggleSaved = useStore((s) => s.toggleSavedListing);
  const isRent = listing.mode === "rent";
  const articleRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (highlightedId !== listing.id) return;
    if (highlightSource !== "map") return;
    articleRef.current?.scrollIntoView({ block: "nearest", behavior: "smooth" });
  }, [highlightedId, highlightSource, listing.id]);

  return (
    <article
      ref={articleRef}
      className={cn(
        "bk-card",
        (listing.status === "hot" || highlightedId === listing.id) && "bk-card-active"
      )}
      data-listing-id={listing.id}
      onMouseEnter={() => setHighlightedId(listing.id, "list")}
      onMouseLeave={() => setHighlightedId(null)}
      onClick={() => router.push(`/property/${listing.id}`)}
      role="link"
      style={{ cursor: "pointer" }}
    >
      <div
        className="bk-card-img"
        style={{ backgroundImage: `url('${photoUrl(listing, 0, "300/300")}')` }}
      />
      <div className="bk-card-body bm-listing-row-body">
        <div className="bm-listing-row-top">
          <div className="min-w-0">
            <Link
              href={`/property/${listing.id}`}
              className="bm-listing-row-title bk-card-title text-left"
              onClick={(event) => event.stopPropagation()}
            >
              {listing.khotkhon}
            </Link>
            <div className="bm-listing-row-loc">
              {listing.district} дүүрэг, {listing.khoroo}-р хороо
            </div>
          </div>
          <button
            type="button"
            className={cn("bm-listing-heart", isSaved && "saved")}
            onClick={(event) => {
              event.stopPropagation();
              toggleSaved(listing.id);
            }}
            title="Хадгалах"
          >
            <Heart className="size-4" fill={isSaved ? "currentColor" : "none"} />
          </button>
        </div>
        <div className="bm-listing-row-specs">
          <span>
            <BedDouble className="size-3.5" />
            {listing.rooms} өрөө
          </span>
          <span>
            <Ruler className="size-3.5" />
            <span className="num">{listing.area}</span> м²
          </span>
          <span>
            <Building2 className="size-3.5" />
            {listing.floor} давхар
          </span>
        </div>
        <div>
          <div className="bm-listing-row-price num">{listingPrice(listing)}</div>
          {isRent ? null : <div className="bm-listing-row-ppm num">{fmtPpm(listing)}</div>}
        </div>
        <div className="bm-listing-row-bottom">
          {hasIpoteh(listing) ? (
            <span className="bm-tag">
              <Check className="size-3" />
              Ипотектэй
            </span>
          ) : (
            <span />
          )}
          <span className="bm-time">{listingMinutesAgo(listing)}</span>
        </div>
      </div>
    </article>
  );
}

/* ─── New range-based filters ─── */

function PriceRangeFilter({
  mode,
  baseListings,
  filterPriceMin,
  filterPriceMax,
  setPriceRange,
}: {
  mode: "sale" | "rent";
  baseListings: Listing[];
  filterPriceMin: number | null;
  filterPriceMax: number | null;
  setPriceRange: (min: number | null, max: number | null) => void;
}) {
  const presets = mode === "rent" ? rentPricePresets : salePricePresets;

  const { dataMin, dataMax, step } = useMemo(() => {
    if (mode === "rent") {
      return { dataMin: 200_000, dataMax: 6_000_000, step: 100_000 };
    }
    return { dataMin: 50_000_000, dataMax: 2_000_000_000, step: 10_000_000 };
  }, [mode]);

  const value: [number, number] = [
    filterPriceMin ?? dataMin,
    filterPriceMax ?? dataMax,
  ];

  const countInRange = baseListings.filter(
    (l) => l.price >= value[0] && l.price <= value[1]
  ).length;

  return (
    <section className="bk-side-section">
      <div className="bk-side-heading">
        <span className="bk-side-heading-left">
          {mode === "rent" ? "Сарын түрээс" : "Төсөв"} (₮)
        </span>
        <span className="bk-side-heading-count num">{countInRange}</span>
      </div>
      <div className="bk-side-section-body">
        <DualRangeSlider
          min={dataMin}
          max={dataMax}
          step={step}
          value={value}
          onChange={([lo, hi]) =>
            setPriceRange(lo > dataMin ? lo : null, hi < dataMax ? hi : null)
          }
          format={(v) => fmtCompact(v).replace("₮", "")}
          ariaLabel="Үнэ"
        />
        <div className="bk-price-presets mt-1">
          {presets.map((preset) => {
            const active =
              filterPriceMin === preset.min && filterPriceMax === preset.max;
            return (
              <button
                key={preset.label}
                type="button"
                className={cn("bk-price-preset", active && "active")}
                onClick={() =>
                  active
                    ? setPriceRange(null, null)
                    : setPriceRange(preset.min, preset.max)
                }
              >
                {preset.label}
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}

function AreaRangeFilter({
  baseListings,
  filterAreaMin,
  filterAreaMax,
}: {
  baseListings: Listing[];
  filterAreaMin: number | null;
  filterAreaMax: number | null;
}) {
  const setAreaRange = useStore((s) => s.setAreaRange);
  const dataMin = 25;
  const dataMax = 250;
  const value: [number, number] = [
    filterAreaMin ?? dataMin,
    filterAreaMax ?? dataMax,
  ];
  const count = baseListings.filter(
    (l) => l.area >= value[0] && l.area <= value[1]
  ).length;
  return (
    <section className="bk-side-section">
      <div className="bk-side-heading">
        <span className="bk-side-heading-left">
          <Ruler className="size-3.5 inline mr-1" />
          Талбай (м²)
        </span>
        <span className="bk-side-heading-count num">{count}</span>
      </div>
      <div className="bk-side-section-body">
        <DualRangeSlider
          min={dataMin}
          max={dataMax}
          step={5}
          value={value}
          onChange={([lo, hi]) =>
            setAreaRange(lo > dataMin ? lo : null, hi < dataMax ? hi : null)
          }
          format={(v) => `${v}`}
          unit="м²"
          ariaLabel="Талбай"
        />
      </div>
    </section>
  );
}

function YearRangeFilter({ baseListings }: { baseListings: Listing[] }) {
  const [range, setRange] = useState<[number, number]>(() => {
    const years = baseListings.map((l) => l.year).filter(Boolean);
    if (!years.length) return [2000, new Date().getFullYear() + 1];
    return [Math.min(...years), Math.max(...years)];
  });
  const dataMin = 2000;
  const dataMax = new Date().getFullYear() + 1;
  const count = baseListings.filter(
    (l) => l.year >= range[0] && l.year <= range[1]
  ).length;
  return (
    <section className="bk-side-section">
      <div className="bk-side-heading">
        <span className="bk-side-heading-left">
          <Calendar className="size-3.5 inline mr-1" />
          Ашиглалтад орсон он
        </span>
        <span className="bk-side-heading-count num">{count}</span>
      </div>
      <div className="bk-side-section-body">
        <DualRangeSlider
          min={dataMin}
          max={dataMax}
          step={1}
          value={range}
          onChange={setRange}
          format={(v) => `${v}`}
          ariaLabel="Он"
        />
      </div>
    </section>
  );
}

function StatusFilter({ baseListings }: { baseListings: Listing[] }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const options = [
    { key: "hot", label: "Эрэлттэй", icon: Flame, tone: "var(--danger)" },
    { key: "new", label: "Шинэ", icon: Sparkles, tone: "var(--success)" },
    { key: "drop", label: "Үнэ буурсан", icon: TrendingDown, tone: "var(--gold-brand)" },
  ];
  const countFor = (key: string) =>
    baseListings.filter((l) => l.status === key).length;
  const toggle = (k: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(k)) next.delete(k);
      else next.add(k);
      return next;
    });
  };
  return (
    <section className="bk-side-section">
      <div className="bk-side-heading">
        <span className="bk-side-heading-left">Зарын төлөв</span>
      </div>
      <div className="bk-side-section-body">
        <div className="bk-status-chips">
          {options.map((o) => {
            const active = selected.has(o.key);
            const n = countFor(o.key);
            return (
              <button
                key={o.key}
                type="button"
                onClick={() => toggle(o.key)}
                className={cn("bk-status-chip", active && "active")}
                disabled={n === 0}
                style={
                  active
                    ? {
                        borderColor: o.tone,
                        background:
                          o.tone === "var(--gold-brand)"
                            ? "var(--gold-soft)"
                            : `color-mix(in srgb, ${o.tone} 12%, transparent)`,
                        color: o.tone,
                      }
                    : undefined
                }
              >
                <o.icon className="w-3 h-3" />
                {o.label}
                <span className="num text-[10px] opacity-60">({n})</span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
