"use client";

import { useEffect, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Check } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { getListing } from "@/infrastructure/data/listings";
import { cn } from "@/lib/utils";

const TIMES = ["10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];

function buildDates(): string[] {
  const out: string[] = [];
  const now = new Date();
  for (let i = 1; i <= 6; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() + i);
    out.push(`${d.getMonth() + 1}/${d.getDate()}`);
  }
  return out;
}

export function ScheduleScreen() {
  const router = useRouter();
  const listingId = useStore((s) => s.scheduleListingId ?? s.currentListingId);
  const scheduleDate = useStore((s) => s.scheduleDate);
  const scheduleTime = useStore((s) => s.scheduleTime);
  const setScheduleDate = useStore((s) => s.setScheduleDate);
  const setScheduleTime = useStore((s) => s.setScheduleTime);
  const pushToast = useStore((s) => s.pushToast);

  const dates = useMemo(() => buildDates(), []);
  const listing = listingId ? getListing(listingId) : undefined;

  useEffect(() => {
    if (!scheduleDate || !dates.includes(scheduleDate)) {
      setScheduleDate(dates[0]);
    }
  }, [dates, scheduleDate, setScheduleDate]);

  const submit = () => {
    if (!scheduleTime) {
      pushToast("Цаг сонгоно уу", "danger");
      return;
    }
    router.push("/confirmation");
  };

  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6">
      <button
        type="button"
        onClick={() => (listingId ? router.push(`/property/${listingId}`) : router.back())}
        className="text-xs text-[var(--text-3)] hover:text-[var(--text)] flex items-center gap-1 mb-3"
      >
        <ArrowLeft className="w-3.5 h-3.5" /> Зар руу буцах
      </button>
      <h1 className="text-2xl font-semibold mb-1">Үзэлт товлох</h1>
      <p className="text-sm text-[var(--text-3)] mb-6">
        {listing ? `${listing.khotkhon} · ${listing.district}` : "Зар сонгоогүй байна"}
      </p>

      <div className="card p-5 mb-4">
        <div className="eyebrow mb-3">Огноо</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 mb-5">
          {dates.map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => setScheduleDate(d)}
              className={cn("src-chip py-3", scheduleDate === d && "selected")}
            >
              {d}
            </button>
          ))}
        </div>
        <div className="eyebrow mb-3">Цаг</div>
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
          {TIMES.map((t) => (
            <button
              key={t}
              type="button"
              onClick={() => setScheduleTime(t)}
              className={cn("src-chip py-3", scheduleTime === t && "selected")}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={submit}
        disabled={!listing}
        className="btn btn-cta w-full disabled:opacity-50"
      >
        Үзэлт батлах <Check className="w-4 h-4" />
      </button>
    </div>
  );
}
