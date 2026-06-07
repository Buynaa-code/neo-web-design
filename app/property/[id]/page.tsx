import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { getListing, LISTINGS } from "@/data/listings";
import { PropertyDetail } from "@/components/property/PropertyDetail";

type PropertyPageProps = {
  params: Promise<{ id: string }>;
};

export function generateStaticParams() {
  return LISTINGS.map((listing) => ({ id: String(listing.id) }));
}

export async function generateMetadata({ params }: PropertyPageProps): Promise<Metadata> {
  const { id } = await params;
  const listing = getListing(Number(id));
  if (!listing) {
    return {
      title: "Зар олдсонгүй — NEOMAP",
    };
  }

  return {
    title: `${listing.khotkhon} — NEOMAP`,
    description:
      listing.desc ??
      `${listing.district} дүүрэг, ${listing.rooms} өрөө, ${listing.area}м² үл хөдлөх хөрөнгө.`,
  };
}

export default async function PropertyPage({ params }: PropertyPageProps) {
  const { id } = await params;
  const listing = getListing(Number(id));
  if (!listing) notFound();
  return <PropertyDetail listing={listing} />;
}
