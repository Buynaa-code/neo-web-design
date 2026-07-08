"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ArrowLeft, GitCompare, Sparkles, Trash2, X } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { getListing, photoUrl, LISTINGS } from "@/infrastructure/data/listings";
import { fmtCompact, listingPriceShort } from "@/infrastructure/data/formatters";
import { getAgent } from "@/infrastructure/data/agents";
import type { Listing } from "@/domain/types";

const MAX_COMPARE = 4;

type Row = {
  label: string;
  render: (l: Listing) => React.ReactNode;
};

const ROWS: Row[] = [
  { label: "Үнэ", render: (l) => <span className="num font-bold">{listingPriceShort(l)}</span> },
  { label: "Дүүрэг", render: (l) => l.district },
  { label: "Хороо", render: (l) => `${l.khoroo}-р хороо` },
  { label: "Хотхон", render: (l) => l.khotkhon },
  { label: "Өрөө", render: (l) => `${l.rooms}` },
  { label: "Талбай", render: (l) => `${l.area} м²` },
  { label: "Давхар", render: (l) => l.floor },
  { label: "Ашиглалт", render: (l) => `${l.year} он` },
  {
    label: "М²-ийн үнэ",
    render: (l) =>
      l.mode === "sale"
        ? fmtCompact(Math.round(l.price / l.area))
        : "—",
  },
  { label: "Үзсэн", render: (l) => <span className="num">{l.viewCount} хүн</span> },
  { label: "Бэлэн орох", render: (l) => check(l, "Бэлэн орох") },
  { label: "Зээлээр", render: (l) => check(l, "Зээлээр") },
  { label: "Гараж", render: (l) => check(l, "Гараж") },
  { label: "Тавилгатай", render: (l) => check(l, "Тавилгатай") },
  {
    label: "Агент",
    render: (l) => {
      const ag = getAgent(l.agentId);
      const name = ag?.name ?? "—";
      return name.split(" ").pop();
    },
  },
];

function check(l: Listing, key: string): React.ReactNode {
  const hit = (l.features || []).some((f) => f.includes(key));
  return hit ? (
    <span style={{ color: "var(--success)" }}>✓</span>
  ) : (
    <span style={{ color: "var(--text-3)" }}>—</span>
  );
}

export function CompareScreen() {
  const router = useRouter();
  const compareIds = useStore((s) => s.compareIds);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const clearCompare = useStore((s) => s.clearCompare);
  const pushToast = useStore((s) => s.pushToast);
  const listingsVersion = useStore((s) => s.listingsVersion);

  const items = useMemo(
    () => compareIds.map((id) => getListing(id)).filter(Boolean) as Listing[],
    [compareIds, listingsVersion]
  );

  if (items.length === 0) {
    return (
      <div className="max-w-3xl mx-auto px-4 lg:px-6 py-16 text-center">
        <div
          className="inline-flex w-16 h-16 rounded-2xl items-center justify-center mb-4"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        >
          <GitCompare className="w-8 h-8" />
        </div>
        <h1 className="text-2xl font-semibold mb-2">Зар харьцуулах</h1>
        <p className="text-[var(--text-3)] mb-6 max-w-md mx-auto">
          Үл хөдлөхийн жагсаалт болон дэлгэрэнгүй хуудаснаас &quot;Харьцуулахад нэмэх&quot;
          товчоор 2–{MAX_COMPARE} зар нэмж энэ хуудсанд хажуу хажуугаар нь үзээрэй.
        </p>
        <Link href="/results" className="btn btn-cta">
          <Sparkles className="w-4 h-4" /> Зар хайх
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <div className="flex items-center justify-between gap-4 mb-5 flex-wrap">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => router.back()}
            className="btn btn-ghost !text-sm !py-2"
          >
            <ArrowLeft className="w-4 h-4" /> Буцах
          </button>
          <div>
            <h1 className="text-2xl font-semibold">Зар харьцуулах</h1>
            <p className="text-sm text-[var(--text-3)]">
              {items.length} зар хажуу хажуугаар
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => {
            clearCompare();
            pushToast("Харьцуулах жагсаалт цэвэрлэгдлээ", "info");
          }}
          className="btn btn-secondary !text-sm !py-2"
          style={{ color: "var(--danger)" }}
        >
          <Trash2 className="w-4 h-4" /> Бүгдийг арилгах
        </button>
      </div>

      <div className="overflow-x-auto">
        <div
          className="grid"
          style={{
            gridTemplateColumns: `200px repeat(${items.length}, minmax(220px, 1fr))`,
            minWidth: 220 + items.length * 240,
          }}
        >
          <div />
          {items.map((l) => (
            <div
              key={l.id}
              className="p-3"
              style={{ borderBottom: "1px solid var(--border)" }}
            >
              <div className="relative aspect-[4/3] rounded-lg overflow-hidden mb-2 bg-muted">
                {photoUrl(l, 0) ? (
                  <Image
                    src={photoUrl(l, 0)!}
                    alt={l.khotkhon}
                    fill
                    sizes="240px"
                    className="object-cover"
                  />
                ) : null}
                <button
                  type="button"
                  onClick={() => toggleCompare(l.id)}
                  className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center"
                  style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}
                  aria-label="Жагсаалтаас хасах"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <Link
                href={`/property/${l.id}`}
                className="font-semibold text-sm truncate block hover:underline"
              >
                {l.khotkhon}
              </Link>
              <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                {l.district}
              </div>
            </div>
          ))}

          {ROWS.map((row, i) => {
            const stripe = i % 2 === 1;
            const cellStyle: React.CSSProperties = {
              background: stripe ? "var(--surface-2)" : "transparent",
              borderBottom: "1px solid var(--border)",
            };
            return (
              <div key={row.label} className="contents">
                <div
                  className="px-4 py-3 text-xs font-medium"
                  style={{ ...cellStyle, color: "var(--text-2)" }}
                >
                  {row.label}
                </div>
                {items.map((l) => (
                  <div key={l.id} className="px-4 py-3 text-sm" style={cellStyle}>
                    {row.render(l)}
                  </div>
                ))}
              </div>
            );
          })}
        </div>
      </div>

      {items.length < MAX_COMPARE && (
        <div className="mt-5 text-center">
          <p className="text-sm text-[var(--text-3)] mb-2">
            Бусад зараас энэхүү жагсаалтад нэмж болно ({items.length}/{MAX_COMPARE})
          </p>
          <Link href="/results" className="btn btn-secondary !text-sm">
            <Sparkles className="w-4 h-4" /> Илүү олон зар нэмэх
          </Link>
        </div>
      )}
    </div>
  );
}

// Re-export sample helper so other code can reference if needed
export { LISTINGS };
