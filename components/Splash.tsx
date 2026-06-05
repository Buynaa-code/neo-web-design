"use client";

import { useEffect, useState } from "react";

const MIN_MS = 4200;
const MAX_MS = 8000;

export function Splash() {
  const [done, setDone] = useState(false);
  const [removed, setRemoved] = useState(false);

  useEffect(() => {
    if (typeof document === "undefined") return;
    document.body.classList.add("neo-splash-lock");
    const start = Date.now();

    let safetyTimer: ReturnType<typeof setTimeout>;
    let removeTimer: ReturnType<typeof setTimeout>;

    const finish = () => {
      const wait = Math.max(0, MIN_MS - (Date.now() - start));
      setTimeout(() => {
        setDone(true);
        document.body.classList.remove("neo-splash-lock");
        removeTimer = setTimeout(() => setRemoved(true), 700);
      }, wait);
    };

    if (document.readyState === "complete") {
      finish();
    } else {
      window.addEventListener("load", finish, { once: true });
    }
    safetyTimer = setTimeout(finish, MAX_MS);

    return () => {
      clearTimeout(safetyTimer);
      clearTimeout(removeTimer);
      document.body.classList.remove("neo-splash-lock");
      window.removeEventListener("load", finish);
    };
  }, []);

  if (removed) return null;

  return (
    <div
      id="neo-splash"
      className={done ? "neo-splash-done" : undefined}
      role="status"
      aria-label="NEOMAP уншиж байна"
    >
      <div className="neo-splash-glow neo-splash-glow-1" />
      <div className="neo-splash-glow neo-splash-glow-2" />
      <div className="neo-splash-grid" />
      <div className="neo-splash-vignette" />

      <div className="neo-splash-stage">
        <div className="neo-splash-mark">
          <span className="neo-splash-ring neo-splash-ring-1" />
          <span className="neo-splash-ring neo-splash-ring-2" />
          <span className="neo-splash-ring neo-splash-ring-3" />
          <svg className="neo-splash-pin" viewBox="0 0 240 240" aria-hidden="true">
            <defs>
              <linearGradient id="neoSplashGoldGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#FFE9A7" />
                <stop offset="55%" stopColor="#E8C661" />
                <stop offset="100%" stopColor="#A87E1A" />
              </linearGradient>
            </defs>
            <path
              className="np-pin-outline"
              d="M 120,225 C 95,212 56,182 48,135 C 42,75 90,28 120,28 C 150,28 198,75 192,135 C 184,182 145,212 120,225 Z"
              fill="none"
              stroke="url(#neoSplashGoldGrad)"
              strokeWidth="12"
              strokeLinecap="round"
              strokeLinejoin="round"
              pathLength="100"
            />
            <g fill="url(#neoSplashGoldGrad)">
              <polygon className="np-bldg np-bldg-1" points="68,130 68,102 84,102 84,130" />
              <polygon className="np-bldg np-bldg-2" points="87,130 87,80 105,80 105,130" />
              <polygon className="np-bldg np-bldg-3" points="108,130 108,58 120,42 132,58 132,130" />
              <polygon className="np-bldg np-bldg-4" points="135,130 135,90 152,72 168,86 168,130" />
            </g>
            <g stroke="url(#neoSplashGoldGrad)" strokeWidth="5" strokeLinecap="round" fill="none">
              <line className="np-line np-line-h" x1="60" y1="150" x2="180" y2="150" pathLength="100" />
              <line className="np-line np-line-1" x1="120" y1="178" x2="66" y2="150" pathLength="100" />
              <line className="np-line np-line-2" x1="120" y1="178" x2="98" y2="150" pathLength="100" />
              <line className="np-line np-line-3" x1="120" y1="178" x2="142" y2="150" pathLength="100" />
              <line className="np-line np-line-4" x1="120" y1="178" x2="174" y2="150" pathLength="100" />
              <line className="np-line np-line-5" x1="120" y1="178" x2="84" y2="216" pathLength="100" />
              <line className="np-line np-line-6" x1="120" y1="178" x2="120" y2="222" pathLength="100" />
              <line className="np-line np-line-7" x1="120" y1="178" x2="156" y2="216" pathLength="100" />
            </g>
            <circle className="np-dot" cx="120" cy="178" r="6" fill="url(#neoSplashGoldGrad)" />
          </svg>
          <span className="neo-splash-orbit">
            <span className="neo-splash-orbit-dot" />
          </span>
        </div>

        <h1 className="neo-splash-wordmark" aria-label="NEOMAP">
          <span>N</span>
          <span>E</span>
          <span>O</span>
          <span>M</span>
          <span>A</span>
          <span>P</span>
        </h1>

        <p className="neo-splash-tagline">
          Үл хөдлөх<span className="dot" />оюунлаг газар зураг
        </p>

        <div className="neo-splash-progress">
          <div className="neo-splash-progress-fill" />
        </div>
      </div>

      <div className="neo-splash-sig">© NEOMAP · Улаанбаатар</div>
    </div>
  );
}
