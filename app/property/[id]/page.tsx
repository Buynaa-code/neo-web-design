import type { Metadata } from "next";
import { notFound } from "next/navigation";

import type { Listing } from "@/domain/types";
import { getListing as getMockListing, photoUrl } from "@/infrastructure/data/listings";
import { getListing as getRealListing, toListing } from "@/infrastructure/api/listings";
import { fmtFullPrice } from "@/infrastructure/data/formatters";
import { PropertyDetail } from "@/components/property/PropertyDetail";
import { JsonLd } from "@/components/JsonLd";

const BASE_URL = "https://hdlh.vercel.app";

// Listing data is dynamic (real API); render on demand rather than prebuild.
export const dynamic = "force-dynamic";

type PropertyPageProps = {
  params: Promise<{ id: string }>;
};

/**
 * Resolves a listing server-side: tries the real API first, falling back to
 * the seed dataset if the API is unavailable or the id is unknown there.
 */
async function resolveListing(id: number): Promise<Listing | undefined> {
  if (!Number.isFinite(id)) return undefined;
  try {
    return toListing(await getRealListing(id));
  } catch {
    return getMockListing(id);
  }
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = await resolveListing(Number(id));
  if (!listing) {
    return { title: "Зар олдсонгүй — NEOMAP" };
  }

  const title = `${listing.khotkhon}, ${listing.district} — ${listing.rooms} өрөө ${listing.area}м² | NEOMAP`;
  const description =
    listing.desc ??
    `${listing.district} дүүрэг, ${listing.khotkhon}. ${listing.rooms} өрөө, ${listing.area}м², ${fmtFullPrice(listing.price, listing.mode)}.`;
  const image = photoUrl(listing, 0);
  const canonical = `/property/${listing.id}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      url: `${BASE_URL}${canonical}`,
      title,
      description,
      images: image
        ? [{ url: image, width: 1200, height: 630, alt: `${listing.khotkhon}, ${listing.district}` }]
        : [],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: image ? [image] : [],
    },
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const listing = await resolveListing(Number(id));
  if (!listing) notFound();

  // schema.org RealEstateListing — lets Google surface price, location, size as rich results.
  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "RealEstateListing",
    name: `${listing.khotkhon}, ${listing.district}`,
    description: listing.desc ?? `${listing.rooms} өрөө, ${listing.area}м²`,
    url: `${BASE_URL}/property/${listing.id}`,
    ...(photoUrl(listing, 0) ? { image: [photoUrl(listing, 0)] } : {}),
    datePosted: listing.priceHistory?.[listing.priceHistory.length - 1]?.d,
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "MNT",
      availability: "https://schema.org/InStock",
      businessFunction:
        listing.mode === "rent"
          ? "https://schema.org/LeaseOut"
          : "https://schema.org/Sell",
    },
    about: {
      "@type": "Apartment",
      numberOfRoomsTotal: listing.rooms,
      floorSize: { "@type": "QuantitativeValue", value: listing.area, unitCode: "MTK" },
      yearBuilt: listing.year,
      address: {
        "@type": "PostalAddress",
        addressLocality: listing.district,
        addressRegion: "Улаанбаатар",
        addressCountry: "MN",
      },
    },
  };

  return (
    <>
      <JsonLd data={jsonLd} />
      <PropertyDetail listing={listing} />
    </>
  );
}
