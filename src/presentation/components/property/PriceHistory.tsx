"use client";

import { TrendingDown, TrendingUp } from "lucide-react";
import type { Listing, PricePoint } from "@/domain/types";
import { fmtCompact } from "@/infrastructure/data/formatters";

export function PriceHistory({ listing }: { listing: Listing }) {
  const history = listing.priceHistory;
  if (!history || history.length < 2) return null;

  const sorted = [...history].sort((a, b) => a.d.localeCompare(b.d));
  const first = sorted[0].p;
  const last = sorted[sorted.length - 1].p;
  const delta = last - first;
  const pct = first > 0 ? Math.round((delta / first) * 1000) / 10 : 0;
  const down = delta < 0;

  return (
    <section className="card p-4">
      <div className="flex items-start justify-between mb-3 gap-3">
        <div>
          <div className="text-sm font-semibold">Үнийн түүх</div>
          <div className="text-xs text-[var(--text-3)] mt-0.5">
            {sorted[0].d} – {sorted[sorted.length - 1].d}
          </div>
        </div>
        <div className="text-right">
          <div
            className="num text-sm font-bold inline-flex items-center gap-1"
            style={{ color: down ? "var(--success)" : "var(--danger)" }}
          >
            {down ? <TrendingDown className="w-3.5 h-3.5" /> : <TrendingUp className="w-3.5 h-3.5" />}
            {down ? "" : "+"}
            {pct}%
          </div>
          <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
            {fmtCompact(Math.abs(delta))} {down ? "буурсан" : "өссөн"}
          </div>
        </div>
      </div>

      <Sparkline points={sorted} down={down} />

      <div className="grid grid-cols-3 gap-2 mt-3 text-center">
        <Cell label="Эхний" value={fmtCompact(first)} />
        <Cell label="Одоо" value={fmtCompact(last)} bold />
        <Cell
          label="Хамгийн өндөр"
          value={fmtCompact(Math.max(...sorted.map((p) => p.p)))}
        />
      </div>
    </section>
  );
}

function Sparkline({ points, down }: { points: PricePoint[]; down: boolean }) {
  const W = 320;
  const H = 80;
  const pad = 6;
  const xs = points.map((_, i) => (i / (points.length - 1 || 1)) * (W - pad * 2) + pad);
  const vals = points.map((p) => p.p);
  const minV = Math.min(...vals);
  const maxV = Math.max(...vals);
  const range = maxV - minV || 1;
  const ys = vals.map((v) => pad + (1 - (v - minV) / range) * (H - pad * 2));
  const linePath = xs
    .map((x, i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${ys[i].toFixed(2)}`)
    .join(" ");
  const areaPath = `${linePath} L ${xs[xs.length - 1].toFixed(2)} ${H - pad} L ${xs[0].toFixed(
    2
  )} ${H - pad} Z`;

  const tone = down ? "var(--success)" : "var(--danger)";

  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      preserveAspectRatio="none"
      className="w-full"
      style={{ height: H }}
      aria-label="Үнийн түүхний график"
    >
      <defs>
        <linearGradient id="sparkfill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={tone} stopOpacity="0.25" />
          <stop offset="100%" stopColor={tone} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={areaPath} fill="url(#sparkfill)" />
      <path d={linePath} fill="none" stroke={tone} strokeWidth="2" strokeLinejoin="round" />
      {xs.map((x, i) => (
        <circle key={i} cx={x} cy={ys[i]} r={i === xs.length - 1 ? 3.2 : 2.2} fill={tone} />
      ))}
    </svg>
  );
}

function Cell({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div>
      <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
        {label}
      </div>
      <div
        className="num text-xs mt-0.5"
        style={{ fontWeight: bold ? 700 : 600, color: bold ? "var(--text)" : "var(--text-2)" }}
      >
        {value}
      </div>
    </div>
  );
}
