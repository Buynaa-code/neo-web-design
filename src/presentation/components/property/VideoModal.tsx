"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { getListing } from "@/infrastructure/data/listings";

let listeners: Set<(listingId: number | null) => void> = new Set();
let current: number | null = null;

export function openVideoModal(listingId: number) {
  current = listingId;
  listeners.forEach((l) => l(current));
}

export function closeVideoModal() {
  current = null;
  listeners.forEach((l) => l(null));
}

/** Plays a listing's uploaded walkthrough clip (`Listing.videoUrl`) full-screen. */
export function VideoModal() {
  const [listingId, setListingId] = useState<number | null>(current);
  const [mounted, setMounted] = useState(false);
  // Re-render if the seed dataset is swapped for real listings while open.
  useStore((s) => s.listingsVersion);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const handler = (id: number | null) => setListingId(id);
    listeners.add(handler);
    return () => {
      listeners.delete(handler);
    };
  }, []);

  useEffect(() => {
    if (listingId == null) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeVideoModal();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [listingId]);

  if (!mounted || listingId == null) return null;

  const listing = getListing(listingId);
  if (!listing?.videoUrl) return null;

  return createPortal(
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      style={{ background: "rgba(0,0,0,.92)", backdropFilter: "blur(8px)" }}
      onClick={(e) => {
        if (e.target === e.currentTarget) closeVideoModal();
      }}
    >
      <button
        type="button"
        onClick={closeVideoModal}
        className="absolute top-4 right-4 w-10 h-10 rounded-full text-white flex items-center justify-center backdrop-blur z-10"
        style={{ background: "rgba(255,255,255,.1)" }}
        aria-label="Хаах"
      >
        <X className="w-5 h-5" />
      </button>

      <video
        src={listing.videoUrl}
        controls
        autoPlay
        className="max-w-[1200px] max-h-[85vh] w-[92%] rounded-lg bg-black"
      />
    </div>,
    document.body
  );
}
