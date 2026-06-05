"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";
import type { Listing } from "@/lib/types";
import { ListingCard } from "@/components/ListingCard";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

export function ResultsList({ listings }: { listings: Listing[] }) {
  const page = useStore((s) => s.page);
  const pageSize = useStore((s) => s.pageSize);
  const setPage = useStore((s) => s.setPage);
  const setHighlightedId = useStore((s) => s.setHighlightedId);
  const highlightedId = useStore((s) => s.highlightedId);

  const totalPages = Math.max(1, Math.ceil(listings.length / pageSize));
  const start = (page - 1) * pageSize;
  const slice = listings.slice(start, start + pageSize);

  if (!listings.length) {
    return (
      <div className="results-empty">
        <p>Тохирох зар олдсонгүй.</p>
        <p className="text-(--text-3) text-sm">Шүүлтүүрийг сулруулаад дахин үзнэ үү.</p>
      </div>
    );
  }

  return (
    <div className="results-list">
      <div className="results-list-grid">
        {slice.map((l) => (
          <div
            key={l.id}
            className={cn(
              "results-list-item",
              highlightedId === l.id && "highlighted"
            )}
            onMouseEnter={() => setHighlightedId(l.id)}
            onMouseLeave={() => setHighlightedId(null)}
          >
            <ListingCard listing={l} />
          </div>
        ))}
      </div>
      {totalPages > 1 && (
        <nav className="results-pager" aria-label="Хуудаслалт">
          <button
            type="button"
            className="results-pager-btn"
            onClick={() => setPage(Math.max(1, page - 1))}
            disabled={page === 1}
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <span className="results-pager-info">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            className="results-pager-btn"
            onClick={() => setPage(Math.min(totalPages, page + 1))}
            disabled={page === totalPages}
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </nav>
      )}
    </div>
  );
}
