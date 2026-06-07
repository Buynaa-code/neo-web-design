"use client";

import dynamic from "next/dynamic";

const NeomapLeaflet = dynamic(() => import("./NeomapLeaflet").then((m) => m.NeomapLeaflet), {
  ssr: false,
  loading: () => (
    <div className="home-map-loading" role="status" aria-busy="true">
      <div className="home-map-loading-bar" />
    </div>
  ),
});

export function HomeMap() {
  return (
    <div className="home-map-area">
      <NeomapLeaflet />
    </div>
  );
}
