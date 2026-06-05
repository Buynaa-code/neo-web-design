"use client";

import Image from "next/image";
import Link from "next/link";
import { Bed, Heart, MapPin, Maximize, Star } from "lucide-react";
import type { Listing } from "@/lib/types";
import { getAgent } from "@/data/agents";
import { photoUrl } from "@/data/listings";
import { STATUS_PILL } from "@/data/constants";
import {
  fmtListingArea,
  listingPrice,
  listingTimeAgo,
} from "@/data/formatters";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const isSaved = useStore((s) => s.savedListingIds.includes(listing.id));
  const toggleSaved = useStore((s) => s.toggleSavedListing);
  const pushToast = useStore((s) => s.pushToast);
  const agent = getAgent(listing.agentId);
  const [pillClass, pillLabel] = STATUS_PILL[listing.status] ?? ["", ""];

  return (
    <article className="card listing-card group">
      <div className="listing-card-media">
        <Link href={`/property/${listing.id}`} className="block relative h-full w-full">
          <Image
            src={photoUrl(listing, 0, "560/420")}
            alt={`${listing.khotkhon} — ${listing.district}`}
            width={560}
            height={420}
            className="w-full h-full object-cover transition group-hover:scale-[1.02]"
          />
          {pillLabel && (
            <span className={cn("listing-pill", pillClass)} aria-label={pillLabel}>
              {pillLabel}
            </span>
          )}
        </Link>
        <button
          type="button"
          className={cn("listing-save-btn", isSaved && "saved")}
          aria-pressed={isSaved}
          aria-label={isSaved ? "Хадгалснаас хасах" : "Хадгалах"}
          onClick={() => {
            toggleSaved(listing.id);
            pushToast(
              isSaved ? "Хадгалснаас хаслаа" : "Хадгалсан жагсаалтад нэмэгдлээ",
              "success"
            );
          }}
        >
          <Heart
            className="w-4 h-4"
            fill={isSaved ? "currentColor" : "none"}
          />
        </button>
      </div>
      <div className="listing-card-body">
        <div className="flex items-start justify-between gap-2">
          <h3 className="listing-card-title">
            <Link href={`/property/${listing.id}`}>{listing.khotkhon}</Link>
          </h3>
          <strong className="listing-card-price">
            {listingPrice(listing)}
          </strong>
        </div>
        <p className="listing-card-meta">
          <MapPin className="w-3.5 h-3.5" />
          {listing.district}
          {listing.khoroo ? `, ${listing.khoroo}-р хороо` : ""}
        </p>
        <ul className="listing-card-specs">
          <li>
            <Bed className="w-3.5 h-3.5" />
            {listing.rooms} өрөө
          </li>
          <li>
            <Maximize className="w-3.5 h-3.5" />
            {fmtListingArea(listing.area)}
          </li>
          <li>{listing.floor}</li>
        </ul>
        <footer className="listing-card-foot">
          <span className="listing-card-time">{listingTimeAgo(listing)}</span>
          {agent && (
            <span className="listing-card-agent">
              <Star className="w-3 h-3" fill="currentColor" />
              {agent.rating.toFixed(1)} · {agent.agency}
            </span>
          )}
        </footer>
      </div>
    </article>
  );
}
