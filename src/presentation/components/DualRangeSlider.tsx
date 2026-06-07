"use client";

import { useEffect, useMemo, useState } from "react";

export interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  value: [number, number];
  onChange: (next: [number, number]) => void;
  format?: (v: number) => string;
  unit?: string;
  ariaLabel?: string;
}

export function DualRangeSlider({
  min,
  max,
  step = 1,
  value,
  onChange,
  format = (v) => String(v),
  unit = "",
  ariaLabel = "Range",
}: DualRangeSliderProps) {
  const [lo, hi] = value;
  const [local, setLocal] = useState<[number, number]>([lo, hi]);

  useEffect(() => {
    setLocal([lo, hi]);
  }, [lo, hi]);

  const safeMin = Math.min(min, max);
  const safeMax = Math.max(min, max);
  const span = Math.max(1, safeMax - safeMin);
  const pctLo = ((Math.max(safeMin, Math.min(local[0], safeMax)) - safeMin) / span) * 100;
  const pctHi = ((Math.max(safeMin, Math.min(local[1], safeMax)) - safeMin) / span) * 100;

  const setLo = (n: number) => {
    const next: [number, number] = [Math.min(n, local[1] - step), local[1]];
    setLocal(next);
    onChange(next);
  };
  const setHi = (n: number) => {
    const next: [number, number] = [local[0], Math.max(n, local[0] + step)];
    setLocal(next);
    onChange(next);
  };

  const labels = useMemo(
    () => ({
      lo: format(local[0]) + (unit ? unit : ""),
      hi: format(local[1]) + (unit ? unit : ""),
    }),
    [local, format, unit]
  );

  return (
    <div className="dual-range" aria-label={ariaLabel}>
      <div className="dual-range-vals">
        <span className="num">{labels.lo}</span>
        <span style={{ color: "var(--text-3)" }}>—</span>
        <span className="num">{labels.hi}</span>
      </div>
      <div className="dual-range-track">
        <div
          className="dual-range-fill"
          style={{ left: `${pctLo}%`, right: `${100 - pctHi}%` }}
        />
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          step={step}
          value={local[0]}
          onChange={(e) => setLo(Number(e.target.value))}
          aria-label={`${ariaLabel} — доод`}
          className="dual-range-input dual-range-input-lo"
        />
        <input
          type="range"
          min={safeMin}
          max={safeMax}
          step={step}
          value={local[1]}
          onChange={(e) => setHi(Number(e.target.value))}
          aria-label={`${ariaLabel} — дээд`}
          className="dual-range-input dual-range-input-hi"
        />
      </div>
    </div>
  );
}
