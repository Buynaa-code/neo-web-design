"use client";

import Image from "next/image";
import Link from "next/link";
import { Bed, Heart, ImageOff, MapPin, Maximize, Star } from "lucide-react";
import type { Listing } from "@/domain/types";
import { getAgent } from "@/infrastructure/data/agents";
import { photoUrl } from "@/infrastructure/data/listings";
import { STATUS_PILL } from "@/infrastructure/data/constants";
import {
  fmtListingArea,
  listingPrice,
  listingTimeAgo,
} from "@/infrastructure/data/formatters";
import { useStore } from "@/infrastructure/store";
import { useToggleFavorite } from "@/application/queries/saved";
import { getToken } from "@/infrastructure/api/token";
import { cn } from "@/lib/utils";

export function ListingCard({ listing }: { listing: Listing }) {
  const isSaved = useStore((s) => s.savedListingIds.includes(listing.id));
  const toggleSaved = useStore((s) => s.toggleSavedListing);
  const pushToast = useStore((s) => s.pushToast);
  const toggleFavorite = useToggleFavorite();

  // Local store drives instant feedback; when signed in, persist to the server
  // so the Saved screen (server favorites) stays in sync.
  const handleToggleSaved = () => {
    toggleSaved(listing.id);
    if (getToken()) toggleFavorite.mutate({ listingId: listing.id, favorited: isSaved });
    pushToast(
      isSaved ? "Хадгалснаас хаслаа" : "Хадгалсан жагсаалтад нэмэгдлээ",
      "success"
    );
  };
  const agent = getAgent(listing.agentId);
  const [pillClass, pillLabel] = STATUS_PILL[listing.status] ?? ["", ""];
  const cover = photoUrl(listing, 0);

  return (
    <article className="card listing-card group">
      <div className="listing-card-media">
        <Link href={`/property/${listing.id}`} className="block relative h-full w-full">
          {cover ? (
            <Image
              src={cover}
              alt={`${listing.khotkhon} — ${listing.district}`}
              width={560}
              height={420}
              className="w-full h-full object-cover transition group-hover:scale-[1.02]"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center bg-muted text-muted-foreground">
              <ImageOff className="size-6" />
            </div>
          )}
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
          onClick={handleToggleSaved}
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
