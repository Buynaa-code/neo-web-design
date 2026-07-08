"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { getListing, photoUrl } from "@/infrastructure/data/listings";

interface LightboxState {
  listingId: number;
  index: number;
}

let listeners: Set<(state: LightboxState | null) => void> = new Set();
let current: LightboxState | null = null;

export function openLightbox(listingId: number, index = 0) {
  current = { listingId, index };
  listeners.forEach((l) => l(current));
}

export function closeLightbox() {
  current = null;
  listeners.forEach((l) => l(null));
}

function totalPhotos(listing: { photoUrls?: string[] }): number {
  return listing.photoUrls?.length ?? 0;
}

export function Lightbox() {
  const [state, setState] = useState<LightboxState | null>(current);
  const [mounted, setMounted] = useState(false);
  // Re-render if the seed dataset is swapped for real listings while open, so
  // getListing() below resolves against the current data.
  useStore((s) => s.listingsVersion);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = (s: LightboxState | null) => setState(s);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (!state) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeLightbox();
      else if (e.key === "ArrowRight") move(1);
      else if (e.key === "ArrowLeft") move(-1);
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state?.listingId]);

  if (!mounted || !state) return null;

  const listing = getListing(state.listingId);
  if (!listing) return null;
  const total = totalPhotos(listing);
  if (total === 0) return null;
  const i = ((state.index % total) + total) % total;

  function move(delta: number) {
    if (!current) return;
    const listing = getListing(current.listingId);
    if (!listing) return;
    const tot = totalPhotos(listing);
    if (tot === 0) return;
    current = { ...current, index: (current.index + delta + tot) % tot };
    listeners.forEach((l) => l(current));
  }

  function jumpTo(k: number) {
    if (!current) return;
    current = { ...current, index: k };
    listeners.forEach((l) => l(current));
  }

  const thumbCount = Math.min(total, 12);

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.92)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeLightbox();
      }}
    >
      <button
        type="button"
        onClick={closeLightbox}
        className="absolute top-4 right-4 w-10 h-10 rounded-full text-white flex items-center justify-center backdrop-blur z-10"
        style={{ background: "rgba(255,255,255,.1)" }}
        aria-label="Хаах"
      >
        <X className="w-5 h-5" />
      </button>

      <div className="absolute top-4 left-4 z-10 text-white">
        <div className="text-xs opacity-70 uppercase tracking-wider">
          {listing.district} · {listing.khotkhon}
        </div>
        <div className="text-sm font-medium mt-0.5">
          {listing.rooms} өрөө · {listing.area}м²
        </div>
      </div>

      <div className="absolute top-4 left-1/2 -translate-x-1/2 z-10 text-white text-sm backdrop-blur rounded-full px-3 py-1 num"
        style={{ background: "rgba(255,255,255,.1)" }}
      >
        {i + 1} / {total}
      </div>

      <button
        type="button"
        onClick={() => move(-1)}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-white flex items-center justify-center backdrop-blur z-10"
        style={{ background: "rgba(255,255,255,.1)" }}
        aria-label="Өмнөх"
      >
        <ChevronLeft className="w-6 h-6" />
      </button>
      <button
        type="button"
        onClick={() => move(1)}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 rounded-full text-white flex items-center justify-center backdrop-blur z-10"
        style={{ background: "rgba(255,255,255,.1)" }}
        aria-label="Дараах"
      >
        <ChevronRight className="w-6 h-6" />
      </button>

      <div
        className="max-w-[1200px] max-h-[80vh] w-[92%] aspect-[4/3] bg-cover bg-center bg-no-repeat rounded-lg"
        style={{ backgroundImage: `url('${photoUrl(listing, i)}')` }}
        role="img"
        aria-label={`${listing.khotkhon} зураг ${i + 1}`}
      />

      <div
        className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 flex gap-1.5 max-w-[88vw] overflow-x-auto px-4 py-2 rounded-full backdrop-blur"
        style={{ background: "rgba(0,0,0,.4)" }}
      >
        {Array.from({ length: thumbCount }, (_, k) => (
          <button
            key={k}
            type="button"
            onClick={() => jumpTo(k)}
            className="w-12 h-9 rounded shrink-0 bg-cover bg-center transition"
            style={{
              backgroundImage: `url('${photoUrl(listing, k)}')`,
              opacity: k === i ? 1 : 0.45,
              outline: k === i ? "2px solid #fff" : "none",
              outlineOffset: 1,
            }}
            aria-label={`${k + 1} рүү шилжих`}
          />
        ))}
      </div>
    </div>,
    document.body
  );
}

// Helper for outside components — read current state
export function useLightboxOpen() {
  return Boolean(current);
}
