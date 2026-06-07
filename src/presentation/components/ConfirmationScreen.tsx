"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Check } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { getListing } from "@/infrastructure/data/listings";

export function ConfirmationScreen() {
  const router = useRouter();
  const listingId = useStore((s) => s.scheduleListingId ?? s.currentListingId);
  const date = useStore((s) => s.scheduleDate);
  const time = useStore((s) => s.scheduleTime);
  const listing = listingId ? getListing(listingId) : undefined;

  useEffect(() => {
    if (!listingId || !date || !time) router.replace("/");
  }, [listingId, date, time, router]);

  if (!listingId || !date || !time) return null;

  return (
    <div className="max-w-2xl mx-auto px-4 lg:px-6 py-12 text-center">
      <div
        className="w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-5"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
      >
        <Check className="w-10 h-10" />
      </div>
      <h1 className="text-3xl font-semibold mb-2">Үзэлт баталгаажлаа</h1>
      <p className="text-[var(--text-2)] mb-6">
        {listing?.khotkhon ?? "Зар"} · {date ?? ""} {time ?? ""}
      </p>
      <div className="flex justify-center gap-2">
        <Link href="/activity" className="btn btn-cta">
          Миний үзэлтүүд
        </Link>
        <Link href="/" className="btn btn-secondary">
          Эхлэл рүү
        </Link>
      </div>
    </div>
  );
}
