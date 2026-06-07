"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Heart,
  Mail,
  MessageSquare,
  Pencil,
  Plus,
  SettingsIcon,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { LISTINGS, photoUrl } from "@/data/listings";
import { listingPriceShort } from "@/data/formatters";
import { cn } from "@/lib/utils";
import type { Listing, SavedSearch } from "@/lib/types";
import {
  DeleteSearchConfirm,
  EditSearchModal,
  SaveSearchModal,
} from "@/components/results/SavedSearchModals";

export function SavedScreen({ initialTab }: { initialTab?: "listings" | "searches" }) {
  const tab = useStore((s) => s.savedTab);
  const setSavedTab = useStore((s) => s.setSavedTab);
  const savedIds = useStore((s) => s.savedListingIds);
  const savedSearches = useStore((s) => s.savedSearches);
  const toggleSaved = useStore((s) => s.toggleSavedListing);
  const pushToast = useStore((s) => s.pushToast);
  const openModal = useStore((s) => s.openModal);

  useEffect(() => {
    if (initialTab && initialTab !== tab) setSavedTab(initialTab);
  }, [initialTab, tab, setSavedTab]);

  const list = LISTINGS.filter((l) => savedIds.includes(l.id));

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-semibold mb-2">Хадгалсан</h1>

      <div
        className="flex items-center gap-1 mb-5 p-1 rounded-lg w-fit"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <TabButton
          active={tab === "listings"}
          onClick={() => setSavedTab("listings")}
          icon={<Heart className="w-3.5 h-3.5" />}
          count={list.length}
        >
          Хадгалсан зарууд
        </TabButton>
        <TabButton
          active={tab === "searches"}
          onClick={() => setSavedTab("searches")}
          icon={<Bell className="w-3.5 h-3.5" />}
          count={savedSearches.length}
        >
          Хадгалсан хайлт
        </TabButton>
      </div>

      {tab === "listings" ? (
        <>
          <p className="text-sm text-[var(--text-3)] mb-4">
            {list.length} хадгалсан зар · Үнэ/төлөв өөрчлөгдөхөд мэдэгдэл авах боломжтой
          </p>
          {list.length === 0 ? (
            <div className="card p-10 text-center text-sm text-[var(--text-3)]">
              Одоогоор хадгалсан зар алга.{" "}
              <Link href="/results" className="text-[var(--primary)] font-medium">
                Хайлт үргэлжлүүлэх
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {list.map((l) => (
                <SavedListingCard key={l.id} l={l} onUnsave={() => toggleSaved(l.id)} />
              ))}
            </div>
          )}
        </>
      ) : (
        <>
          <p className="text-sm text-[var(--text-3)] mb-4">
            {savedSearches.length} хадгалсан хайлт · Шинэ зар орох тутамд мэдэгдэл авна
          </p>
          <div className="space-y-2">
            {savedSearches.map((s) => (
              <SavedSearchRow
                key={s.id}
                s={s}
                onEdit={() => openModal(<EditSearchModal search={s} />, "md")}
                onDelete={() => openModal(<DeleteSearchConfirm id={s.id} />, "sm")}
                onNotify={() => pushToast("Notification тохиргоо удахгүй", "info")}
              />
            ))}
            <button
              type="button"
              onClick={() => openModal(<SaveSearchModal />, "md")}
              className="card p-4 w-full flex items-center justify-center gap-2 text-sm hover:border-[var(--gold-brand)]"
              style={{ borderStyle: "dashed" }}
            >
              <Plus className="w-4 h-4" /> Шинэ хайлт хадгалах
            </button>
          </div>
        </>
      )}
    </div>
  );
}

function TabButton({
  active,
  onClick,
  children,
  icon,
  count,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
  icon: React.ReactNode;
  count: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "px-4 py-2 rounded-md text-sm font-medium transition",
        active ? "shadow-sm" : ""
      )}
      style={{
        background: active ? "var(--surface)" : "transparent",
        color: active ? "var(--text)" : "var(--text-2)",
        boxShadow: active ? "var(--shadow-sm)" : "none",
      }}
    >
      <span className="inline-flex items-center gap-1">{icon}{children}</span>
      <span className="num text-[11px] ml-1 text-[var(--text-3)]">{count}</span>
    </button>
  );
}

function SavedListingCard({ l, onUnsave }: { l: Listing; onUnsave: () => void }) {
  return (
    <div className="card overflow-hidden">
      <Link
        href={`/property/${l.id}`}
        className="block relative aspect-[16/10] cursor-pointer"
      >
        <Image
          src={photoUrl(l, 0, "600/400")}
          alt={l.khotkhon}
          fill
          sizes="(max-width:1024px) 50vw, 33vw"
          className="object-cover"
        />
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            onUnsave();
          }}
          className="heart-btn saved absolute top-2.5 left-2.5"
          aria-label="Unsave"
        >
          <Heart className="w-3.5 h-3.5" />
        </button>
      </Link>
      <Link href={`/property/${l.id}`} className="block p-3">
        <div className="font-semibold text-sm truncate">{l.khotkhon}</div>
        <div className="text-xs text-[var(--text-3)] mt-0.5">
          {l.district} · {l.rooms}ө · {l.area}м²
        </div>
        <div
          className="num text-sm font-semibold mt-2"
          style={{ color: "var(--gold-brand)" }}
        >
          {listingPriceShort(l)}
        </div>
      </Link>
    </div>
  );
}

function SavedSearchRow({
  s,
  onEdit,
  onDelete,
  onNotify,
}: {
  s: SavedSearch;
  onEdit: () => void;
  onDelete: () => void;
  onNotify: () => void;
}) {
  return (
    <div className="card p-4 flex items-center gap-3">
      <div
        className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
      >
        <Bell className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm">{s.name}</div>
        <div className="text-xs text-[var(--text-3)] mt-0.5">
          {s.districts.join(", ")} · {s.rooms.join("-")} өрөө ·{" "}
          {s.mode === "rent" ? "Түрээс" : "Худалдах"}
        </div>
        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
          {s.sms && (
            <span className="pill pill-info">
              <MessageSquare className="w-3 h-3" /> SMS
            </span>
          )}
          {s.email && (
            <span className="pill pill-info">
              <Mail className="w-3 h-3" /> E-mail
            </span>
          )}
          {s.push && (
            <span className="pill pill-info">
              <Smartphone className="w-3 h-3" /> App
            </span>
          )}
          <span className="pill pill-gold">
            {s.alertFreq === "instant"
              ? "Тэр даруй"
              : s.alertFreq === "daily"
                ? "Өдөрт"
                : "7 хоног"}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        {s.newMatches > 0 && <span className="pill pill-new">{s.newMatches} шинэ</span>}
        <button
          type="button"
          onClick={onNotify}
          className="btn btn-secondary !text-xs !py-2"
          aria-label="Settings"
        >
          <SettingsIcon className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onEdit}
          className="btn btn-ghost !text-xs !py-2"
          aria-label="Edit"
        >
          <Pencil className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="btn btn-ghost !text-xs !py-2"
          style={{ color: "var(--danger)" }}
          aria-label="Delete"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
