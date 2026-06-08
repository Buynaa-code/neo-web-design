"use client";

import { useState, useMemo } from "react";
import { ArrowUpRight, BarChart3, TrendingDown, TrendingUp } from "lucide-react";
import { DISTRICTS } from "@/infrastructure/data/constants";
import { fmtCompact } from "@/infrastructure/data/formatters";
import { baseListingsForMode, hasIpoteh, isListingVerified, isNewProject } from "@/application/filters";
import { useStore } from "@/infrastructure/store";
import { cn } from "@/lib/utils";
import type { Listing, ListingMode } from "@/domain/types";

const MONTHS = [
  "6-р",
  "7-р",
  "8-р",
  "9-р",
  "10-р",
  "11-р",
  "12-р",
  "1-р",
  "2-р",
  "3-р",
  "4-р",
  "5-р",
];

interface StatsResult {
  count: number;
  avgPrice: number;
  avgPpm: number;
  avgDays: number;
  newCount: number;
  hotCount: number;
  dropCount: number;
  newProjPct: number;
  verifiedPct: number;
  ipotehPct: number;
}

function computeStats(scope: Listing[]): StatsResult {
  const count = scope.length;
  if (!count) {
    return {
      count: 0,
      avgPrice: 0,
      avgPpm: 0,
      avgDays: 0,
      newCount: 0,
      hotCount: 0,
      dropCount: 0,
      newProjPct: 0,
      verifiedPct: 0,
      ipotehPct: 0,
    };
  }
  const avgPrice = Math.round(scope.reduce((s, l) => s + l.price, 0) / count);
  const avgPpm = Math.round(
    scope.reduce((s, l) => s + (l.area ? l.price / l.area : 0), 0) / count
  );
  const avgDays = Math.round(scope.reduce((s, l) => s + (l.listedDays || 0), 0) / count);
  const newCount = scope.filter((l) => l.status === "new").length;
  const hotCount = scope.filter((l) => l.status === "hot").length;
  const dropCount = scope.filter((l) => l.status === "drop").length;
  const newProjPct = Math.round((scope.filter(isNewProject).length / count) * 100);
  const verifiedPct = Math.round((scope.filter(isListingVerified).length / count) * 100);
  const ipotehPct = Math.round((scope.filter(hasIpoteh).length / count) * 100);
  return {
    count,
    avgPrice,
    avgPpm,
    avgDays,
    newCount,
    hotCount,
    dropCount,
    newProjPct,
    verifiedPct,
    ipotehPct,
  };
}

function buildTrend(baseVal: number, mode: ListingMode, districtSalt: number) {
  const swing = mode === "rent" ? 0.05 : 0.08;
  return MONTHS.map((m, i) => {
    const wave = Math.sin((i + districtSalt) * 0.65) * swing * 0.4;
    const growth = (i / 11) * swing;
    return { m, v: Math.round(baseVal * (1 - swing + growth + wave)) };
  });
}

export function DetailedStatsModal({
  initialDistrict = "all",
}: {
  initialDistrict?: string;
}) {
  const closeModal = useStore((s) => s.closeModal);
  const mode = useStore((s) => s.mode);
  const [district, setDistrict] = useState<string>(initialDistrict);

  const all = useMemo(() => baseListingsForMode(mode), [mode]);
  const scoped = useMemo(
    () => (district === "all" ? all : all.filter((l) => l.district === district)),
    [all, district]
  );
  const stats = useMemo(() => computeStats(scoped), [scoped]);

  const baseVal = stats.avgPpm || (mode === "rent" ? 22_000 : 3_200_000);
  const trend = useMemo(
    () => buildTrend(baseVal, mode, district.length || 3),
    [baseVal, mode, district]
  );
  const trendMin = Math.min(...trend.map((t) => t.v));
  const trendMax = Math.max(...trend.map((t) => t.v));
  const trendDelta = trend[11].v - trend[0].v;
  const trendPct =
    trend[0].v ? Math.round((trendDelta / trend[0].v) * 100 * 10) / 10 : 0;

  const districtRows = useMemo(
    () =>
      DISTRICTS.map((d) => {
        const arr = all.filter((l) => l.district === d);
        if (!arr.length) return { d, ppm: 0, n: 0 };
        const p = Math.round(
          arr.reduce((s, l) => s + (l.area ? l.price / l.area : 0), 0) / arr.length
        );
        return { d, ppm: p, n: arr.length };
      })
        .filter((r) => r.n > 0)
        .sort((a, b) => b.ppm - a.ppm),
    [all]
  );
  const districtMax = districtRows[0]?.ppm || 1;

  const roomBuckets = useMemo(
    () =>
      [1, 2, 3, 4].map((n) => ({
        n,
        label: n === 4 ? "4+ өрөө" : `${n} өрөө`,
        count: scoped.filter((l) => (n === 4 ? l.rooms >= 4 : l.rooms === n)).length,
      })),
    [scoped]
  );
  const roomMax = Math.max(1, ...roomBuckets.map((b) => b.count));

  const topKhot = useMemo(() => {
    const map = new Map<string, number>();
    scoped.forEach((l) => map.set(l.khotkhon, (map.get(l.khotkhon) || 0) + 1));
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);
  }, [scoped]);
  const khotMaxN = topKhot[0]?.[1] || 1;

  const statusGroups = [
    { key: "new", label: "Шинэ", n: stats.newCount, color: "var(--success)" },
    { key: "hot", label: "Эрэлттэй", n: stats.hotCount, color: "var(--danger)" },
    { key: "drop", label: "Үнэ буурсан", n: stats.dropCount, color: "var(--gold-brand)" },
    {
      key: "active",
      label: "Идэвхтэй",
      n: Math.max(0, stats.count - stats.newCount - stats.hotCount - stats.dropCount),
      color: "var(--text-2)",
    },
  ];
  const statusTotal = Math.max(1, statusGroups.reduce((s, g) => s + g.n, 0));

  const modeLabel = mode === "rent" ? "Түрээс" : "Зарах";
  const titleScope = district === "all" ? "Бүх дүүрэг" : `${district} дүүрэг`;

  return (
    <div className="-m-6">
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="min-w-0">
          <h3 className="font-semibold text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5" style={{ color: "var(--gold-brand)" }} />
            Дэлгэрэнгүй статистик
          </h3>
          <p className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
            {modeLabel} · {titleScope} · 2026 оны 5-р сарын байдлаар
          </p>
        </div>
      </div>

      <div
        className="px-5 pt-4 pb-3 flex items-center gap-2 overflow-x-auto"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <DistrictTab active={district === "all"} onClick={() => setDistrict("all")}>
          Бүх дүүрэг
        </DistrictTab>
        {DISTRICTS.map((d) => (
          <DistrictTab
            key={d}
            active={district === d}
            onClick={() => setDistrict(d)}
          >
            {d}
          </DistrictTab>
        ))}
      </div>

      <div className="p-5 space-y-4 max-h-[70vh] overflow-y-auto">
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <KPI
            label={mode === "rent" ? "Дундаж түрээс" : "Дундаж үнэ"}
            value={stats.count ? `${fmtCompact(stats.avgPrice).replace("₮", "")}₮` : "—"}
            delta={`${trendPct >= 0 ? "+" : ""}${trendPct}% (12 сар)`}
            up={trendPct >= 0}
          />
          <KPI
            label="1м² дундаж үнэ"
            value={stats.count ? `${stats.avgPpm.toLocaleString("en-US")}₮` : "—"}
            delta={`${trendPct >= 0 ? "+" : ""}${trendPct}% емнөх жил`}
            up={trendPct >= 0}
          />
          <KPI
            label="Идэвхтэй зар"
            value={stats.count ? String(stats.count) : "—"}
            delta={`${stats.newCount} шинэ`}
            up
          />
          <KPI
            label="Дундаж зарагдсан"
            value={stats.count ? `${stats.avgDays} хоног` : "—"}
            delta={`${stats.verifiedPct}% verified`}
            up={stats.verifiedPct >= 50}
          />
        </div>

        <div className="card p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="font-semibold text-sm">
              12 сарын ₮/м² чиг хандлага
            </div>
            <div
              className="text-xs num font-semibold inline-flex items-center gap-1"
              style={{ color: trendPct >= 0 ? "var(--success)" : "var(--danger)" }}
            >
              {trendPct >= 0 ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              {trendPct >= 0 ? "+" : ""}
              {trendPct}%
            </div>
          </div>
          <div className="flex items-end gap-1.5 h-32">
            {trend.map((t, i) => {
              const h =
                trendMax === trendMin
                  ? 50
                  : ((t.v - trendMin) / (trendMax - trendMin)) * 88 + 12;
              const isLast = i === 11;
              return (
                <div
                  key={t.m}
                  className="flex-1 flex flex-col items-center gap-1"
                >
                  <div
                    style={{
                      height: `${h}%`,
                      width: "100%",
                      borderRadius: "4px 4px 0 0",
                      background: isLast
                        ? "var(--gold-brand)"
                        : "var(--primary-soft)",
                    }}
                    title={`${t.m} сар: ${t.v.toLocaleString("en-US")}₮/м²`}
                  />
                  <div
                    className="text-[9px]"
                    style={{ color: "var(--text-3)" }}
                  >
                    {t.m}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="grid lg:grid-cols-2 gap-3">
          <div className="card p-4">
            <div className="font-semibold text-sm mb-3">Дүүргээр ₮/м²</div>
            <div className="space-y-2">
              {districtRows.slice(0, 8).map((r) => {
                const pct = (r.ppm / districtMax) * 100;
                const isActive = r.d === district;
                return (
                  <div key={r.d}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span
                        className={cn(isActive && "font-bold")}
                        style={{ color: isActive ? "var(--gold-brand)" : "var(--text-2)" }}
                      >
                        {r.d}
                      </span>
                      <span className="num text-[var(--text-3)]">
                        {r.ppm.toLocaleString("en-US")}₮
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: isActive
                            ? "var(--gold-brand)"
                            : "var(--primary)",
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold text-sm mb-3">Өрөөгөөр тархалт</div>
            <div className="flex items-end justify-around h-32 gap-3">
              {roomBuckets.map((r) => {
                const h = (r.count / roomMax) * 100;
                return (
                  <div
                    key={r.n}
                    className="flex-1 flex flex-col items-center gap-1.5"
                  >
                    <div className="num text-[10px]" style={{ color: "var(--text-3)" }}>
                      {r.count}
                    </div>
                    <div
                      style={{
                        height: `${Math.max(8, h)}%`,
                        width: "100%",
                        background: "linear-gradient(180deg, var(--primary), var(--primary-dark))",
                        borderRadius: "6px 6px 0 0",
                      }}
                    />
                    <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
                      {r.label}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold text-sm mb-3">Төлвийн хуваарилалт</div>
            <div className="space-y-2">
              {statusGroups.map((g) => {
                const pct = (g.n / statusTotal) * 100;
                return (
                  <div key={g.key}>
                    <div className="flex items-center justify-between mb-1 text-xs">
                      <span className="inline-flex items-center gap-1.5">
                        <span
                          className="w-2 h-2 rounded-full"
                          style={{ background: g.color }}
                        />
                        {g.label}
                      </span>
                      <span className="num text-[var(--text-3)]">
                        {g.n} ({pct.toFixed(0)}%)
                      </span>
                    </div>
                    <div
                      className="h-1.5 rounded-full overflow-hidden"
                      style={{ background: "var(--surface-2)" }}
                    >
                      <div
                        style={{
                          width: `${pct}%`,
                          height: "100%",
                          background: g.color,
                          borderRadius: 999,
                        }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card p-4">
            <div className="font-semibold text-sm mb-3">Топ хороололууд</div>
            {topKhot.length === 0 ? (
              <div className="text-xs text-[var(--text-3)]">Мэдээлэл алга</div>
            ) : (
              <div className="space-y-2">
                {topKhot.map(([name, n]) => {
                  const pct = (n / khotMaxN) * 100;
                  return (
                    <div key={name}>
                      <div className="flex items-center justify-between mb-1 text-xs">
                        <span className="truncate">{name}</span>
                        <span className="num text-[var(--text-3)] ml-2">
                          {n} зар
                        </span>
                      </div>
                      <div
                        className="h-1.5 rounded-full overflow-hidden"
                        style={{ background: "var(--surface-2)" }}
                      >
                        <div
                          style={{
                            width: `${pct}%`,
                            height: "100%",
                            background: "var(--gold-brand)",
                            borderRadius: 999,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        <div className="grid sm:grid-cols-3 gap-3">
          <Pct label="Шинэ төсөл" value={stats.newProjPct} />
          <Pct label="Verified" value={stats.verifiedPct} />
          <Pct label="Ипотек боломжтой" value={stats.ipotehPct} />
        </div>
      </div>

      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Хаах
        </button>
      </div>
    </div>
  );
}

function DistrictTab({
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
      className="px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition"
      style={
        active
          ? {
              background: "var(--gold-brand)",
              color: "#0A1F44",
              fontWeight: 700,
            }
          : { background: "var(--surface-2)", color: "var(--text-2)" }
      }
    >
      {children}
    </button>
  );
}

function KPI({
  label,
  value,
  delta,
  up,
}: {
  label: string;
  value: string;
  delta: string;
  up: boolean;
}) {
  return (
    <div className="card p-4">
      <div className="text-xs" style={{ color: "var(--text-3)" }}>
        {label}
      </div>
      <div className="num text-xl font-bold mt-1">{value}</div>
      <div
        className="text-[11px] mt-1 inline-flex items-center gap-1"
        style={{ color: up ? "var(--success)" : "var(--danger)" }}
      >
        <ArrowUpRight className="w-3 h-3" />
        {delta}
      </div>
    </div>
  );
}

function Pct({ label, value }: { label: string; value: number }) {
  return (
    <div className="card p-4 text-center">
      <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
        {label}
      </div>
      <div className="num text-2xl font-bold mt-1">{value}%</div>
    </div>
  );
}
