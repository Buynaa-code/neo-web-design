"use client";

import dynamic from "next/dynamic";
import type { Listing } from "@/lib/types";

const ResultsLeaflet = dynamic(
  () => import("./ResultsLeaflet").then((m) => m.ResultsLeaflet),
  {
    ssr: false,
    loading: () => (
      <div className="results-map-loading" role="status" aria-busy="true">
        <div className="results-map-loading-bar" />
      </div>
    ),
  }
);

export function ResultsMap({ listings }: { listings: Listing[] }) {
  return (
    <div className="results-map">
      <ResultsLeaflet listings={listings} />
    </div>
  );
}
