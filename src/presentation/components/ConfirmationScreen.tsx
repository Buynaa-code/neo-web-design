"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { getListing } from "@/infrastructure/data/listings";
import { useAppointmentMutations } from "@/application/queries/appointments";

/** Convert the picker's `M/D` (current/next year) into an ISO `YYYY-MM-DD`. */
function toIsoDate(label: string): string {
  const parts = label.split("/").map((n) => Number(n));
  if (parts.length !== 2 || parts.some((n) => Number.isNaN(n))) return label;
  const [month, day] = parts;
  const now = new Date();
  let year = now.getFullYear();
  // If the picked month/day is in the past, it must refer to next year.
  if (month - 1 < now.getMonth() || (month - 1 === now.getMonth() && day < now.getDate())) {
    year += 1;
  }
  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

export function ConfirmationScreen() {
  const router = useRouter();
  const listingId = useStore((s) => s.scheduleListingId ?? s.currentListingId);
  const date = useStore((s) => s.scheduleDate);
  const time = useStore((s) => s.scheduleTime);
  const listingsVersion = useStore((s) => s.listingsVersion);
  const { create } = useAppointmentMutations();
  const bookedRef = useRef(false);
  const listing = useMemo(
    () => (listingId ? getListing(listingId) : undefined),
    [listingId, listingsVersion]
  );

  useEffect(() => {
    if (!listingId || !date || !time) {
      router.replace("/");
      return;
    }
    // Persist the booking exactly once per confirmation mount.
    if (!bookedRef.current) {
      bookedRef.current = true;
      create.mutate({ listing_id: listingId, date: toIsoDate(date), time });
    }
  }, [listingId, date, time, router, create]);

  if (!listingId || !date || !time) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-12 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
      >
        <Check className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-semibold mb-2">Үзэлт баталгаажлаа</h1>
      <p className="text-[var(--text-2)] mb-6">
        {listing?.khotkhon ?? "Зар"} · {date ?? ""} {time ?? ""}
      </p>
      <div className="flex justify-center gap-2">
        <Link href="/activity" className="btn btn-cta">
          Миний үзэлтүүд
        </Link>
        <Link href="/" className="btn btn-secondary">
          Эхлэл рүү
        </Link>
      </div>
    </div>
  );
}
