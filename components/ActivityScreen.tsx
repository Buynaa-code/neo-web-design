"use client";

import Link from "next/link";
import Image from "next/image";
import { VIEWINGS, PAST_VIEWINGS } from "@/data/saved";
import { getListing, photoUrl } from "@/data/listings";
import type { Viewing } from "@/lib/types";

function ViewingRow({ v, past = false }: { v: Viewing; past?: boolean }) {
  const l = getListing(v.listingId);
  if (!l) return null;
  return (
    <div className="card p-4 flex items-center gap-4">
      <div className="relative w-14 h-14 rounded-lg overflow-hidden shrink-0">
        <Image
          src={photoUrl(l, 0, "200/200")}
          alt={l.khotkhon}
          fill
          sizes="56px"
          className="object-cover"
        />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{l.khotkhon}</div>
        <div className="text-xs text-[var(--text-3)] mt-0.5">
          {v.date} · {v.time}
          {v.dayLabel ? ` · ${v.dayLabel}` : ""}
          {past && v.outcome ? ` · ${v.outcome}` : ""}
        </div>
      </div>
      <Link href={`/property/${l.id}`} className="btn btn-secondary !text-xs !py-2">
        Үзэх
      </Link>
    </div>
  );
}

export function ActivityScreen() {
  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-semibold mb-1">Үзэлтүүд</h1>
      <p className="text-sm text-[var(--text-3)] mb-5">
        Товлосон болон өнгөрсөн уулзалтууд
      </p>

      <div className="eyebrow mb-2">Удахгүй болох</div>
      <div className="space-y-2 mb-6">
        {VIEWINGS.length === 0 ? (
          <div className="card p-6 text-sm text-[var(--text-3)] text-center">
            Идэвхтэй уулзалт алга
          </div>
        ) : (
          VIEWINGS.map((v) => <ViewingRow key={v.id} v={v} />)
        )}
      </div>

      {PAST_VIEWINGS.length > 0 && (
        <>
          <div className="eyebrow mb-2">Өнгөрсөн</div>
          <div className="space-y-2">
            {PAST_VIEWINGS.map((v) => (
              <ViewingRow key={v.id} v={v} past />
            ))}
          </div>
        </>
      )}
    </div>
  );
}
