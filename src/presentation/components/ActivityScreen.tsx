"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useStore } from "@/infrastructure/store";
import { getListing, photoUrl } from "@/infrastructure/data/listings";
import { toListing } from "@/infrastructure/api/listings";
import {
  useAppointments,
  useAppointmentMutations,
} from "@/application/queries/appointments";
import { useViews } from "@/application/queries/activity";
import type { Appointment } from "@/domain/schemas/api";
import type { Listing, Viewing } from "@/domain/types";

const UPCOMING_STATUSES = new Set(["pending", "confirmed"]);

const VIEWING_STATUSES = new Set<Viewing["status"]>([
  "pending",
  "confirmed",
  "completed",
  "cancelled",
]);

function toViewingStatus(status: string): Viewing["status"] {
  return VIEWING_STATUSES.has(status as Viewing["status"])
    ? (status as Viewing["status"])
    : "pending";
}

/** Whole-day difference between an ISO `YYYY-MM-DD` date and today. */
function dayDiff(isoDate: string): number {
  const target = new Date(`${isoDate}T00:00:00`);
  if (Number.isNaN(target.getTime())) return NaN;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((target.getTime() - today.getTime()) / 86_400_000);
}

function dayLabelFor(diff: number): string | undefined {
  if (Number.isNaN(diff)) return undefined;
  if (diff === 0) return "Өнөөдөр";
  if (diff === 1) return "Маргааш";
  if (diff === 2) return "Нөгөөдөр";
  if (diff > 2) return `${diff} хоног`;
  return undefined;
}

function countdownFor(diff: number): string | undefined {
  if (Number.isNaN(diff) || diff < 0) return undefined;
  return `${diff} хоног`;
}

/** Map an API appointment to the UI `Viewing` shape, deriving date labels. */
function toViewing(a: Appointment): Viewing {
  const diff = dayDiff(a.date);
  return {
    id: a.id,
    listingId: a.listingId,
    date: a.date,
    time: a.time,
    status: toViewingStatus(a.status),
    dayLabel: dayLabelFor(diff),
    countdown: countdownFor(diff),
    note: a.note ?? undefined,
    outcome: a.outcome ?? undefined,
  };
}

function ViewingRow({
  v,
  listing,
  past = false,
  onCancel,
  cancelling = false,
}: {
  v: Viewing;
  listing?: Listing;
  past?: boolean;
  onCancel?: (id: number) => void;
  cancelling?: boolean;
}) {
  // Prefer the embedded listing; fall back to mock data; render minimally if neither.
  const title = listing?.khotkhon || "Зар";
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--surface-2)]">
        {listing ? (
          <Image
            src={photoUrl(listing, 0, "200/200")}
            alt={title}
            fill
            sizes="56px"
            className="object-cover"
          />
        ) : null}
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{title}</div>
        <div className="text-xs text-[var(--text-3)] mt-0.5">
          {v.date} · {v.time}
          {v.dayLabel ? ` · ${v.dayLabel}` : ""}
          {past && v.outcome ? ` · ${v.outcome}` : ""}
        </div>
      </div>
      {!past && onCancel ? (
        <button
          type="button"
          onClick={() => onCancel(v.id)}
          disabled={cancelling}
          className="btn btn-secondary !text-xs !py-2 disabled:opacity-50"
        >
          Цуцлах
        </button>
      ) : null}
      {listing ? (
        <Link
          href={`/property/${listing.id}`}
          className="btn btn-secondary !text-xs !py-2"
        >
          Үзэх
        </Link>
      ) : null}
    </div>
  );
}

export function ActivityScreen() {
  // Subscribe so rows re-render (and re-run getListing) when mock data loads.
  useStore((s) => s.listingsVersion);
  const { data, isLoading } = useAppointments();
  const { remove } = useAppointmentMutations();
  const { data: viewsData } = useViews();
  const recentlyViewed = viewsData?.listings ?? [];

  const { upcoming, past } = useMemo(() => {
    const appointments = data ?? [];
    return {
      upcoming: appointments.filter((a) => UPCOMING_STATUSES.has(a.status)),
      past: appointments.filter((a) => !UPCOMING_STATUSES.has(a.status)),
    };
  }, [data]);

  // Resolve a Listing for a row from the embedded resource or the mock fallback.
  const listingFor = (a: Appointment): Listing | undefined =>
    a.listing ? toListing(a.listing) : getListing(a.listingId);

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-semibold mb-1">Үзэлтүүд</h1>
      <p className="text-sm text-[var(--text-3)] mb-5">
        Товлосон болон өнгөрсөн уулзалтууд
      </p>

      <div className="eyebrow mb-2">Удахгүй болох</div>
      <div className="space-y-2 mb-6">
        {isLoading ? (
          <div className="card p-6 text-sm text-[var(--text-3)] text-center">
            Ачааллаж байна…
          </div>
        ) : upcoming.length === 0 ? (
          <div className="card p-6 text-sm text-[var(--text-3)] text-center">
            Идэвхтэй уулзалт алга
          </div>
        ) : (
          upcoming.map((a) => (
            <ViewingRow
              key={a.id}
              v={toViewing(a)}
              listing={listingFor(a)}
              onCancel={(id) => remove.mutate(id)}
              cancelling={remove.isPending}
            />
          ))
        )}
      </div>

      {!isLoading && past.length > 0 && (
        <>
          <div className="eyebrow mb-2">Өнгөрсөн</div>
          <div className="space-y-2">
            {past.map((a) => (
              <ViewingRow key={a.id} v={toViewing(a)} listing={listingFor(a)} past />
            ))}
          </div>
        </>
      )}

      {recentlyViewed.length > 0 && (
        <>
          <div className="eyebrow mb-2 mt-6">Сүүлд үзсэн</div>
          <div className="space-y-2">
            {recentlyViewed.map((listing) => (
              <div key={listing.id} className="card p-4 flex items-center gap-4">
                <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0 bg-[var(--surface-2)]">
                  <Image
                    src={photoUrl(listing, 0, "200/200")}
                    alt={listing.khotkhon || "Зар"}
                    fill
                    sizes="56px"
                    className="object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm truncate">
                    {listing.khotkhon || "Зар"}
                  </div>
                  <div className="text-xs text-[var(--text-3)] mt-0.5 truncate">
                    {listing.district} · {listing.rooms} өрөө · {listing.area}м²
                  </div>
                </div>
                <Link
                  href={`/property/${listing.id}`}
                  className="btn btn-secondary !text-xs !py-2"
                >
                  Үзэх
                </Link>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
