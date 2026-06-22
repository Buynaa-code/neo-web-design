"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  Bell,
  Heart,
  ListPlus,
  Mail,
  MessageSquare,
  MoreVertical,
  Pencil,
  Plus,
  SettingsIcon,
  Smartphone,
  Trash2,
} from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { photoUrl } from "@/infrastructure/data/listings";
import { listingPriceShort } from "@/infrastructure/data/formatters";
import { cn } from "@/lib/utils";
import type { Listing, ListingMode, SavedSearch } from "@/domain/types";
import type { SavedSearch as ApiSavedSearch, SavedList } from "@/domain/schemas/api";
import {
  useFavorites,
  useToggleFavorite,
  useSavedSearches,
  useSavedLists,
} from "@/application/queries/saved";
import {
  DeleteSearchConfirm,
  EditSearchModal,
  SaveSearchModal,
} from "@/components/results/SavedSearchModals";
import {
  CreateListModal,
  DeleteListConfirm,
  EditListModal,
  iconForKey,
} from "@/components/results/SavedListModals";

/**
 * Maps the backend `SavedSearch` wire shape onto the UI domain `SavedSearch`
 * type that the existing row markup + edit modal expect. Fields the API does
 * not carry (districts/rooms/priceRange) are derived from the free-form
 * `filters` object with sensible fallbacks.
 */
function toUiSavedSearch(s: ApiSavedSearch): SavedSearch {
  const f = (s.filters ?? {}) as Record<string, unknown>;

  const asStringArray = (v: unknown): string[] => {
    if (Array.isArray(v)) return v.map((x) => String(x));
    if (typeof v === "string" && v.trim()) return [v];
    return [];
  };
  const asNumberArray = (v: unknown): number[] => {
    if (Array.isArray(v)) return v.map((x) => Number(x)).filter((n) => Number.isFinite(n));
    if (typeof v === "number") return [v];
    return [];
  };
  const asNumber = (v: unknown, fallback: number): number => {
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
  };

  const mode: ListingMode = s.mode === "sale" ? "sale" : "rent";
  const freq = s.alertFreq;
  const alertFreq: SavedSearch["alertFreq"] =
    freq === "instant" || freq === "daily" || freq === "weekly" ? freq : "daily";

  return {
    id: s.id,
    mode,
    name: s.name,
    districts: asStringArray(f.districts ?? f.district),
    rooms: asNumberArray(f.rooms ?? f.room),
    priceRange: [
      asNumber(f.priceMin ?? f.price_min, 0),
      asNumber(f.priceMax ?? f.price_max, 0),
    ],
    newMatches: s.newMatches ?? 0,
    alertFreq,
    sms: Boolean(s.channels?.sms),
    email: Boolean(s.channels?.email),
    push: Boolean(s.channels?.push),
    lastAlert: s.lastAlertAt ?? "Шинэ зар алга",
  };
}

type SavedTab = "listings" | "searches" | "lists";

export function SavedScreen({ initialTab }: { initialTab?: "listings" | "searches" }) {
  const storeTab = useStore((s) => s.savedTab);
  const setSavedTab = useStore((s) => s.setSavedTab);
  const pushToast = useStore((s) => s.pushToast);
  const openModal = useStore((s) => s.openModal);

  // The Zustand store only models the two original tabs. The new "lists" tab is
  // tracked locally and falls back to the store value for the shared tabs.
  const [localTab, setLocalTab] = useState<SavedTab | null>(null);
  const tab: SavedTab = localTab ?? storeTab;
  const selectTab = (t: SavedTab) => {
    setLocalTab(t);
    if (t === "listings" || t === "searches") setSavedTab(t);
  };

  const { data: favData, isLoading: favLoading } = useFavorites();
  const toggleFavorite = useToggleFavorite();
  const { data: searchData, isLoading: searchLoading } = useSavedSearches();
  const { data: listsData, isLoading: listsLoading } = useSavedLists();

  useEffect(() => {
    if (initialTab && initialTab !== storeTab) setSavedTab(initialTab);
  }, [initialTab, storeTab, setSavedTab]);

  const list: Listing[] = useMemo(() => favData?.listings ?? [], [favData]);
  const savedSearches: SavedSearch[] = useMemo(
    () => (searchData ?? []).map(toUiSavedSearch),
    [searchData]
  );
  const savedLists: SavedList[] = useMemo(() => listsData ?? [], [listsData]);

  const toggleSaved = (listingId: number) =>
    toggleFavorite.mutate({ listingId, favorited: true });

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-semibold mb-2">Хадгалсан</h1>

      <div
        className="flex items-center gap-1 mb-5 p-1 rounded-lg w-fit"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        <TabButton
          active={tab === "listings"}
          onClick={() => selectTab("listings")}
          icon={<Heart className="w-3.5 h-3.5" />}
          count={list.length}
        >
          Хадгалсан зарууд
        </TabButton>
        <TabButton
          active={tab === "searches"}
          onClick={() => selectTab("searches")}
          icon={<Bell className="w-3.5 h-3.5" />}
          count={savedSearches.length}
        >
          Хадгалсан хайлт
        </TabButton>
        <TabButton
          active={tab === "lists"}
          onClick={() => selectTab("lists")}
          icon={<ListPlus className="w-3.5 h-3.5" />}
          count={savedLists.length}
        >
          Жагсаалтууд
        </TabButton>
      </div>

      {tab === "listings" ? (
        <>
          <p className="text-sm text-[var(--text-3)] mb-4">
            {list.length} хадгалсан зар · Үнэ/төлөв өөрчлөгдөхөд мэдэгдэл авах боломжтой
          </p>
          {favLoading ? (
            <div className="card p-10 text-center text-sm text-[var(--text-3)]">
              Ачааллаж байна…
            </div>
          ) : list.length === 0 ? (
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
      ) : tab === "searches" ? (
        <>
          <p className="text-sm text-[var(--text-3)] mb-4">
            {savedSearches.length} хадгалсан хайлт · Шинэ зар орох тутамд мэдэгдэл авна
          </p>
          <div className="space-y-2">
            {searchLoading && savedSearches.length === 0 && (
              <div className="card p-10 text-center text-sm text-[var(--text-3)]">
                Ачааллаж байна…
              </div>
            )}
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
      ) : (
        <>
          <div className="flex items-center justify-between gap-3 mb-4">
            <p className="text-sm text-[var(--text-3)]">
              {savedLists.length} жагсаалт · Зараа сэдвээр нь цуглуулна
            </p>
            <button
              type="button"
              onClick={() => openModal(<CreateListModal />, "sm")}
              className="btn btn-primary !text-xs !py-2"
            >
              <Plus className="w-4 h-4" /> Шинэ жагсаалт
            </button>
          </div>
          {listsLoading && savedLists.length === 0 ? (
            <div className="card p-10 text-center text-sm text-[var(--text-3)]">
              Ачааллаж байна…
            </div>
          ) : savedLists.length === 0 ? (
            <div className="card p-10 text-center text-sm text-[var(--text-3)]">
              Одоогоор жагсаалт алга. «Шинэ жагсаалт» дарж эхний цуглуулгаа үүсгээрэй.
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {savedLists.map((sl) => (
                <SavedListCard
                  key={sl.id}
                  sl={sl}
                  onEdit={() => openModal(<EditListModal list={sl} />, "sm")}
                  onDelete={() =>
                    openModal(<DeleteListConfirm id={sl.id} name={sl.name} />, "sm")
                  }
                />
              ))}
            </div>
          )}
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

function SavedListCard({
  sl,
  onEdit,
  onDelete,
}: {
  sl: SavedList;
  onEdit: () => void;
  onDelete: () => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const Icon = iconForKey(sl.icon);
  return (
    <div className="card p-4 flex items-center gap-3 relative">
      <div
        className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0"
        style={{ background: "var(--surface-2)", color: "var(--gold-brand)" }}
      >
        <Icon className="w-5 h-5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="font-semibold text-sm truncate">{sl.name}</div>
        <div className="text-xs text-[var(--text-3)] mt-0.5">{sl.listingsCount} зар</div>
      </div>
      <div className="shrink-0">
        <button
          type="button"
          onClick={() => setMenuOpen((v) => !v)}
          className="btn btn-ghost !text-xs !py-2"
          aria-label="Цэс"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
        {menuOpen && (
          <>
            <button
              type="button"
              aria-hidden
              tabIndex={-1}
              className="fixed inset-0 z-10 cursor-default"
              onClick={() => setMenuOpen(false)}
            />
            <div
              className="absolute right-2 top-12 z-20 w-36 rounded-lg overflow-hidden card p-0"
              style={{ boxShadow: "var(--shadow-md)" }}
            >
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onEdit();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--surface-2)]"
              >
                <Pencil className="w-3.5 h-3.5" /> Засах
              </button>
              <button
                type="button"
                onClick={() => {
                  setMenuOpen(false);
                  onDelete();
                }}
                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-left hover:bg-[var(--surface-2)]"
                style={{ color: "var(--danger)" }}
              >
                <Trash2 className="w-3.5 h-3.5" /> Устгах
              </button>
            </div>
          </>
        )}
      </div>
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
