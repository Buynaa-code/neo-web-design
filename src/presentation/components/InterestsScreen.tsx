"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  BadgeCheck,
  Bath,
  BedDouble,
  Bell as BellIcon,
  Briefcase,
  Building2,
  Check,
  Compass,
  Construction,
  Crown,
  DoorOpen,
  Factory,
  FileCheck,
  FileClock,
  Flame,
  GraduationCap,
  Hammer,
  Heart,
  History,
  Info,
  KeyRound,
  Leaf,
  ListTree,
  Mail,
  Map as MapIcon,
  Home as HomeIcon,
  MapPin,
  MessageSquare,
  Mountain,
  Package,
  Paintbrush,
  PawPrint,
  Pencil,
  PhoneCall,
  Plus,
  RotateCcw,
  School,
  SearchX,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sofa,
  Sparkle,
  Sparkles,
  SquareDashed,
  SquareParking,
  Target,
  Tent,
  TentTree,
  Trash2,
  Trees,
  TrendingUp,
  Users,
  VolumeX,
  X,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore, type InterestsProfile } from "@/infrastructure/store";
import {
  INTEREST_LIFESTYLES,
  INTEREST_CONDITIONS,
  INTEREST_MUST_HAVES,
  INTEREST_NOTIF_CHANNELS,
  INTEREST_PURPOSES,
  INTEREST_VIBES,
} from "@/infrastructure/data/interests";
import { inferInterestsFromBehavior, matchedListings, type MatchReason } from "@/application/interests";
import { fmtCompact } from "@/infrastructure/data/formatters";
import { DISTRICTS } from "@/infrastructure/data/constants";
import type { Listing, ListingMode } from "@/domain/types";
import { cn } from "@/lib/utils";

const ICONS: Record<string, LucideIcon> = {
  "arrow-up": ArrowUp,
  "badge-check": BadgeCheck,
  "building-2": Building2,
  "door-open": DoorOpen,
  "file-check": FileCheck,
  "file-clock": FileClock,
  "graduation-cap": GraduationCap,
  "list-tree": ListTree,
  "message-square": MessageSquare,
  "paintbrush": Paintbrush,
  "paw-print": PawPrint,
  "phone-call": PhoneCall,
  "shield-check": ShieldCheck,
  "shopping-bag": ShoppingBag,
  "square-dashed": SquareDashed,
  "square-parking": SquareParking,
  "tent-tree": TentTree,
  "trending-up": TrendingUp,
  "volume-x": VolumeX,
  briefcase: Briefcase,
  compass: Compass,
  construction: Construction,
  factory: Factory,
  hammer: Hammer,
  history: History,
  home: HomeIcon,
  leaf: Leaf,
  mail: Mail,
  map: MapIcon,
  mountain: Mountain,
  package: Package,
  school: School,
  smartphone: Smartphone,
  sofa: Sofa,
  sparkle: Sparkle,
  sparkles: Sparkles,
  target: Target,
  tent: Tent,
  trees: Trees,
  users: Users,
};

function MetaIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name] ?? Sparkles;
  return <Icon className={className ?? "w-4 h-4"} />;
}

export function InterestsScreen() {
  const interests = useStore((s) => s.userInterests);
  const userInterestsList = useStore((s) => s.userInterestsList);
  const activeInterestsId = useStore((s) => s.activeInterestsId);
  const setActiveInterestsId = useStore((s) => s.setActiveInterestsId);
  const removeInterestProfile = useStore((s) => s.removeInterestProfile);
  const upsertInterestProfile = useStore((s) => s.upsertInterestProfile);
  const savedListingIds = useStore((s) => s.savedListingIds);
  const searchMode = useStore((s) => s.mode);
  const dismissedIds = useStore((s) => s.interestsDismissedIds);
  const dismiss = useStore((s) => s.dismissInterestListing);
  const clearDismissed = useStore((s) => s.clearDismissedInterests);
  const userTier = useStore((s) => s.userTier);
  const setUserTier = useStore((s) => s.setUserTier);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const isSaved = useStore((s) => s.isSaved);
  const toggleSaved = useStore((s) => s.toggleSavedListing);

  const isPro = userTier === "pro";
  const canAdd = isPro || userInterestsList.length < 1;

  const results = useMemo(
    () => matchedListings(interests, dismissedIds, 40),
    [interests, dismissedIds]
  );

  const startWizard = (mode: "create" | "edit") => {
    const initial =
      mode === "edit"
        ? interests ?? null
        : inferInterestsFromBehavior(savedListingIds, searchMode);
    openModal(
      <InterestsWizard
        mode={mode}
        initial={initial}
        onSave={(profile) => {
          upsertInterestProfile(profile);
          pushToast("Бэлэн! Танд тохирох зарууд олдлоо", "success");
          closeModal();
        }}
      />,
      "lg"
    );
  };

  const showUpgradeModal = () => {
    openModal(
      <ProUpgradeModal
        onUpgrade={(plan) => {
          setUserTier("pro", plan);
          closeModal();
          pushToast(`Pro эрх идэвхжлээ (${plan === "yearly" ? "Жил тутам" : "Сар бүр"})`, "success");
          window.setTimeout(() => startWizard("create"), 80);
        }}
      />,
      "lg"
    );
  };

  if (!interests) {
    return (
      <section className="max-w-3xl mx-auto px-4 lg:px-8 py-16 text-center">
        <div
          className="inline-flex w-20 h-20 rounded-3xl items-center justify-center mb-5"
          style={{
            background: "linear-gradient(135deg, var(--primary), var(--gold-brand))",
          }}
        >
          <Sparkles className="w-10 h-10 text-white" />
        </div>
        <h2 className="text-2xl font-bold mb-2 text-[var(--text)]">
          Хүслээ тохируулж эхэл
        </h2>
        <p className="text-[var(--text-2)] max-w-md mx-auto mb-6">
          60 секундийн дотор танд тохирох зарууд олдоно. Бид танай хариултаас суралцаж дараагийн саналаа сайжруулна.
        </p>
        <button type="button" onClick={() => startWizard("create")} className="btn btn-primary">
          <Sparkles className="w-4 h-4" /> Эхлэх
        </button>
      </section>
    );
  }

  const lifestyleMeta = INTEREST_LIFESTYLES.find((x) => x.key === interests.lifestyle);
  const vibeMeta = INTEREST_VIBES.find((x) => x.key === interests.vibe);

  return (
    <section className="max-w-7xl mx-auto px-4 lg:px-8 py-8">
      {userInterestsList.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap mb-3">
          {userInterestsList.map((p) => {
            const active = p.id === activeInterestsId;
            return (
              <div
                key={p.id}
                className="inline-flex items-stretch rounded-lg overflow-hidden"
                style={{
                  border: `1.5px solid ${active ? "var(--gold-brand)" : "var(--border)"}`,
                  background: active ? "rgba(201,162,39,.1)" : "var(--surface)",
                }}
              >
                <button
                  type="button"
                  onClick={() => setActiveInterestsId(p.id)}
                  className="px-3 py-2 text-[13px] inline-flex items-center gap-1.5"
                  style={{
                    fontWeight: active ? 700 : 600,
                    color: "var(--text)",
                  }}
                >
                  {active && <Check className="w-3.5 h-3.5 text-[var(--gold-brand)]" />}
                  {p.name || "Хүсэл"}
                </button>
                {userInterestsList.length > 1 && (
                  <button
                    type="button"
                    onClick={() => removeInterestProfile(p.id)}
                    className="px-2.5 py-2"
                    style={{
                      color: "var(--text-3)",
                      borderLeft: "1px solid var(--border)",
                    }}
                    aria-label="Устгах"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            );
          })}
          <button
            type="button"
            onClick={() => (canAdd ? startWizard("create") : showUpgradeModal())}
            className="px-3.5 py-2 rounded-lg inline-flex items-center gap-1.5 text-[13px]"
            style={{
              border: `1.5px dashed ${canAdd ? "var(--border-strong)" : "var(--border)"}`,
              background: "transparent",
              color: canAdd ? "var(--text-2)" : "var(--text-3)",
              fontWeight: 600,
            }}
          >
            {canAdd ? <Plus className="w-3.5 h-3.5" /> : <Crown className="w-3.5 h-3.5" />}
            {canAdd ? "Шинэ хүсэл" : "Pro эрхээр илүү нэмэх"}
          </button>
          {!isPro ? (
            <button
              type="button"
              onClick={showUpgradeModal}
              className="ml-auto inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11.5px] font-semibold"
              style={{
                color: "var(--gold-brand)",
                background: "rgba(201,162,39,.08)",
                border: "1px solid rgba(201,162,39,.25)",
              }}
            >
              <Crown className="w-3 h-3" />
              Pro болох
            </button>
          ) : (
            <span className="ml-auto inline-flex items-center gap-1 text-[11.5px] text-[var(--gold-brand)]">
              <Crown className="w-3 h-3" />
              Pro эрх · {userInterestsList.length} профайл
            </span>
          )}
        </div>
      )}

      <div
        className="card p-5 flex items-start gap-4 flex-wrap"
        style={{ background: "linear-gradient(135deg, var(--surface) 0%, var(--surface-2) 100%)" }}
      >
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--gold-brand))",
              color: "#fff",
            }}
          >
            <Sparkles className="w-5 h-5" />
          </div>
          <div className="min-w-0">
            <div className="eyebrow mb-1">Миний хүсэл</div>
            <h1 className="text-xl font-semibold mb-2">
              {results.length} зар танд тохирно
            </h1>
            <div className="flex items-center gap-2 flex-wrap text-xs">
              {lifestyleMeta && <Tag>{lifestyleMeta.label}</Tag>}
              <Tag
                icon={interests.mode === "rent" ? <KeyRound className="w-3 h-3" /> : <HomeIcon className="w-3 h-3" />}
              >
                {interests.mode === "rent" ? "Түрээс" : "Худалдах"}
              </Tag>
              {interests.bedrooms.length > 0 && (
                <Tag icon={<BedDouble className="w-3 h-3" />}>
                  {[...interests.bedrooms]
                    .sort((a, b) => a - b)
                    .map((n) => `${n}${n === 4 ? "+" : ""}`)
                    .join("/")}{" "}
                  унтл.
                </Tag>
              )}
              {interests.bathroomsMin > 0 && (
                <Tag icon={<Bath className="w-3 h-3" />}>{interests.bathroomsMin}+ нойл</Tag>
              )}
              {interests.office && <Tag icon={<Briefcase className="w-3 h-3" />}>Ажлын өрөө</Tag>}
              {interests.districts.slice(0, 3).map((d) => (
                <Tag key={d} icon={<MapPin className="w-3 h-3" />}>
                  {d}
                </Tag>
              ))}
              {vibeMeta && <Tag>{vibeMeta.label}</Tag>}
            </div>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => startWizard("edit")}
            className="btn btn-secondary !text-xs !py-2"
          >
            <Pencil className="w-3.5 h-3.5" /> Шинэчлэх
          </button>
          {interests && (
            <button
              type="button"
              onClick={() => {
                if (confirm("Энэ хүслийг устгах уу?")) {
                  removeInterestProfile(interests.id);
                  pushToast("Хүсэл устгагдлаа", "info");
                }
              }}
              className="btn btn-ghost !text-xs !py-2"
              style={{ color: "var(--text-3)" }}
              aria-label="Reset"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      {results.length === 0 ? (
        <div
          className="text-center py-20 mt-5"
          style={{
            background: "var(--surface)",
            borderRadius: 14,
            border: "1px solid var(--border)",
          }}
        >
          <SearchX className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-3)" }} />
          <h3 className="text-base font-semibold text-[var(--text)] mb-1.5">
            Тохирох зар олдсонгүй
          </h3>
          <p className="text-sm text-[var(--text-2)] mb-4">
            Хүслээ өөрчилж үзнэ үү — өргөн хайхад илүү олон зар олдоно.
          </p>
          <button type="button" onClick={() => startWizard("edit")} className="btn btn-primary">
            Шинэчлэх
          </button>
        </div>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-5">
            {results.slice(0, 18).map(({ listing, score, reasons }) => (
              <MatchCard
                key={listing.id}
                listing={listing}
                score={score}
                reasons={reasons}
                isSaved={isSaved(listing.id)}
                onToggleSave={() => toggleSaved(listing.id)}
                onDismiss={() => dismiss(listing.id)}
              />
            ))}
          </div>
          {dismissedIds.length > 0 && (
            <div className="text-center mt-6">
              <button
                type="button"
                onClick={clearDismissed}
                className="btn btn-ghost !text-xs"
                style={{ color: "var(--text-3)" }}
              >
                <RotateCcw className="w-3.5 h-3.5" />
                Алгассан {dismissedIds.length} зарыг буцаах
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}

function Tag({ icon, children }: { icon?: React.ReactNode; children: React.ReactNode }) {
  return (
    <span
      className="inline-flex items-center gap-1 px-2 py-1 rounded-md text-[11px]"
      style={{ background: "var(--surface-2)", color: "var(--text-2)" }}
    >
      {icon}
      {children}
    </span>
  );
}

function MatchCard({
  listing,
  score,
  reasons,
  isSaved,
  onToggleSave,
  onDismiss,
}: {
  listing: Listing;
  score: number;
  reasons: MatchReason[];
  isSaved: boolean;
  onToggleSave: () => void;
  onDismiss: () => void;
}) {
  const router = useRouter();
  const tier: "high" | "mid" | "low" = score >= 85 ? "high" : score >= 65 ? "mid" : "low";
  const priceStr =
    listing.mode === "rent" ? `${fmtCompact(listing.price)}/сар` : fmtCompact(listing.price);

  return (
    <article className="card overflow-hidden flex flex-col">
      <button
        type="button"
        onClick={() => router.push(`/property/${listing.id}`)}
        className="relative aspect-[4/3] cursor-pointer"
        style={{
          background: `linear-gradient(135deg, hsl(${(listing.id * 37) % 360}, 30%, 35%), hsl(${(listing.id * 71) % 360}, 25%, 22%))`,
        }}
        aria-label={listing.khotkhon}
      >
        <span
          className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold"
          style={{
            background: tier === "high" ? "var(--gold-brand)" : tier === "mid" ? "var(--primary)" : "var(--surface-2)",
            color: tier === "low" ? "var(--text)" : "#fff",
          }}
        >
          <Sparkles className="w-3 h-3" />
          {score}%
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onDismiss();
          }}
          className="absolute top-3 right-3 w-7 h-7 rounded-full flex items-center justify-center"
          style={{ background: "rgba(0,0,0,.5)", color: "#fff" }}
          aria-label="Алгасах"
        >
          <X className="w-3.5 h-3.5" />
        </button>
        {listing.status === "hot" && (
          <span className="pill pill-hot absolute bottom-3 left-3">
            <Flame className="w-3 h-3" /> HOT
          </span>
        )}
        {listing.status === "new" && (
          <span className="pill pill-new absolute bottom-3 left-3">
            <Sparkle className="w-3 h-3" /> Шинэ
          </span>
        )}
      </button>
      <div className="p-4 flex-1 flex flex-col">
        <div className="flex items-center justify-between gap-2 mb-1">
          <div className="font-bold text-[15.5px]" style={{ color: "var(--text)" }}>
            {priceStr}
          </div>
          <button
            type="button"
            onClick={onToggleSave}
            className={cn("heart-btn", isSaved && "saved")}
            aria-label="Хадгалах"
          >
            <Heart className="w-4 h-4" />
          </button>
        </div>
        <div className="text-[13px] font-semibold text-[var(--text)] mb-0.5">
          {listing.khotkhon}
        </div>
        <div className="text-xs text-[var(--text-3)] mb-2">
          {listing.district} · {listing.rooms} өрөө · {listing.area}м²
        </div>
        {reasons.length > 0 && (
          <div className="flex flex-wrap gap-1 mt-auto">
            {reasons.slice(0, 3).map((r, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px]"
                style={{
                  background: r.kind === "soft" ? "var(--surface-2)" : "var(--primary-soft)",
                  color: r.kind === "soft" ? "var(--text-3)" : "var(--primary)",
                }}
              >
                {r.text}
              </span>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

/* -------- Wizard -------- */

const STEPS = [
  { key: 1, label: "Та өөрийгөө хэн гэж бодож вэ?" },
  { key: 2, label: "Ямар үл хөдлөх хайж байна?" },
  { key: 3, label: "Танай төсөв хэр вэ?" },
  { key: 4, label: "Хэдэн өрөөтэй байр хайж байна?" },
  { key: 5, label: "Аль дүүрэг танд илүү таалагдах вэ?", skippable: true },
  { key: 6, label: "Танд юу чухал вэ?", skippable: true },
  { key: 7, label: "Ямар төлөвт байгаа хөрөнгө хайж байна?", skippable: true },
  { key: 8, label: "Ямар орчинд амьдрах дуртай?" },
  { key: 9, label: "Танд хэрхэн мэдэгдэх вэ?" },
] as const;

type BudgetPreset = {
  label: string;
  min: number | null;
  max: number | null;
  any?: boolean;
};

const SALE_BUDGET_PRESETS: BudgetPreset[] = [
  { label: "Хамаагүй / Бүх үнэ", min: null, max: null, any: true },
  { label: "< 200сая", min: null, max: 200_000_000 },
  { label: "200-400сая", min: 200_000_000, max: 400_000_000 },
  { label: "400-600сая", min: 400_000_000, max: 600_000_000 },
  { label: "600сая-1тэрбум", min: 600_000_000, max: 1_000_000_000 },
  { label: "1тэрбум+", min: 1_000_000_000, max: null },
];

const RENT_BUDGET_PRESETS: BudgetPreset[] = [
  { label: "Хамаагүй / Бүх үнэ", min: null, max: null, any: true },
  { label: "< 1сая", min: null, max: 1_000_000 },
  { label: "1-2сая", min: 1_000_000, max: 2_000_000 },
  { label: "2-3сая", min: 2_000_000, max: 3_000_000 },
  { label: "3-5сая", min: 3_000_000, max: 5_000_000 },
  { label: "5сая+", min: 5_000_000, max: null },
];

const CONDITION_GROUPS = [
  { key: "usage", label: "Ашиглалт", icon: "badge-check" },
  { key: "cert", label: "Гэрчилгээ", icon: "file-check" },
  { key: "history", label: "Түүх", icon: "history" },
  { key: "legal", label: "Хууль зүйн төлөв", icon: "shield-check" },
  { key: "occupy", label: "Эзлэгдсэн эсэх", icon: "door-open" },
  { key: "reno", label: "Засал", icon: "paintbrush" },
] as const;

const PRO_PLANS = [
  {
    key: "monthly",
    label: "Сар бүр",
    price: 19_900,
    unit: "/сар",
    sub: "Хэдийд ч цуцалж болно",
  },
  {
    key: "yearly",
    label: "Жил тутам",
    price: 199_000,
    unit: "/жил",
    sub: "2 сар үнэгүй (16,583₮/сар)",
    savings: "17% хямд",
  },
] as const;

type InterestsWizardInitial = Partial<InterestsProfile> | null;

function InterestsWizard({
  mode,
  initial,
  onSave,
}: {
  mode: "create" | "edit";
  initial: InterestsWizardInitial;
  onSave: (profile: InterestsProfile) => void;
}) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const [step, setStep] = useState(1);

  const baseLifestyle = INTEREST_LIFESTYLES[0];
  const [name, setName] = useState(initial?.name ?? "Миний хүсэл");
  const [lifestyle, setLifestyle] = useState(initial?.lifestyle ?? baseLifestyle.key);
  const [purpose, setPurpose] = useState(initial?.purpose ?? "any");
  const [subTypes, setSubTypes] = useState<string[]>(initial?.subTypes ?? []);
  const [listingMode, setListingMode] = useState<ListingMode>(initial?.mode ?? "sale");
  const [budgetMin, setBudgetMin] = useState<number | null>(initial?.budgetMin ?? null);
  const [budgetMax, setBudgetMax] = useState<number | null>(initial?.budgetMax ?? null);
  const [budgetAny, setBudgetAny] = useState<boolean>(initial?.budgetAny ?? false);
  const [bedrooms, setBedrooms] = useState<number[]>(initial?.bedrooms ?? baseLifestyle.presetBedrooms);
  const [bathroomsMin, setBathroomsMin] = useState<number>(
    initial?.bathroomsMin ?? baseLifestyle.presetBathroomsMin
  );
  const [office, setOffice] = useState<boolean>(initial?.office ?? baseLifestyle.presetOffice);
  const [districts, setDistricts] = useState<string[]>(initial?.districts ?? []);
  const [mustHaves, setMustHaves] = useState<string[]>(
    initial?.mustHaves ?? baseLifestyle.presetMustHaves
  );
  const [conditions, setConditions] = useState<string[]>(initial?.conditions ?? []);
  const [vibe, setVibe] = useState<string | undefined>(initial?.vibe);
  const [notifChannels, setNotifChannels] = useState<string[]>(
    initial?.notifChannels?.length ? initial.notifChannels : ["app"]
  );

  const selectedPurpose = INTEREST_PURPOSES.find((p) => p.key === purpose);
  const budgetPresets = listingMode === "rent" ? RENT_BUDGET_PRESETS : SALE_BUDGET_PRESETS;
  const currentStep = STEPS[step - 1];
  const isSkippable = "skippable" in currentStep && !!currentStep.skippable;
  const progress = Math.round(((step - 1) / STEPS.length) * 100);

  const setLifestylePreset = (key: string) => {
    setLifestyle(key);
    const preset = INTEREST_LIFESTYLES.find((x) => x.key === key);
    if (!preset) return;
    if (!initial || bedrooms.length === 0) {
      setBedrooms(preset.presetBedrooms);
      setBathroomsMin(preset.presetBathroomsMin);
      setOffice(preset.presetOffice);
      setMustHaves(preset.presetMustHaves);
    }
  };

  const toggle = <T,>(set: React.Dispatch<React.SetStateAction<T[]>>, value: T) =>
    set((prev) => (prev.includes(value) ? prev.filter((v) => v !== value) : [...prev, value]));

  const toggleDistrict = (district: string) => {
    setDistricts((prev) => {
      if (prev.includes(district)) return prev.filter((d) => d !== district);
      if (prev.length >= 3) {
        pushToast("Хамгийн ихдээ 3 дүүрэг сонгоно", "info");
        return prev;
      }
      return [...prev, district];
    });
  };

  const selectBudget = (preset: BudgetPreset) => {
    setBudgetAny(!!preset.any);
    setBudgetMin(preset.min);
    setBudgetMax(preset.max);
  };

  const parseBudget = (value: string) => {
    const next = value.replace(/[^\d]/g, "");
    return next ? Number(next) : null;
  };

  const setManualMin = (value: string) => {
    setBudgetAny(false);
    setBudgetMin(parseBudget(value));
  };

  const setManualMax = (value: string) => {
    setBudgetAny(false);
    setBudgetMax(parseBudget(value));
  };

  const canNext = (() => {
    if (step === 1) return !!lifestyle;
    if (step === 2) return !!purpose;
    if (step === 3) return budgetAny || budgetMin != null || (budgetMax != null && budgetMax > 0);
    if (step === 4) return bedrooms.length > 0 || bathroomsMin === 0;
    if (step === 8) return !!vibe;
    if (step === 9) return notifChannels.length > 0;
    return true;
  })();

  const next = (skip = false) => {
    if (!skip && !canNext) return;
    if (step < STEPS.length) setStep((s) => s + 1);
    else save();
  };

  const save = () => {
    const id = initial?.id ?? Date.now();
    const profile: InterestsProfile = {
      id,
      name: name.trim() || "Миний хүсэл",
      lifestyle,
      purpose,
      subTypes,
      mode: listingMode,
      budgetMin: budgetAny ? null : budgetMin,
      budgetMax: budgetAny ? null : budgetMax,
      budgetAny,
      bedrooms,
      bathroomsMin,
      office,
      districts,
      mustHaves,
      conditions,
      vibe,
      notifChannels,
      updatedAt: Date.now(),
    };
    onSave(profile);
  };

  return (
    <div className="-m-6">
      <div
        className="p-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h3 className="font-semibold text-lg">
            {mode === "edit" ? "Хүсэл засах" : "Хүслээ тохируулах"}
          </h3>
          <p className="text-xs text-[var(--text-3)]">
            Алхам {step}/{STEPS.length} · {STEPS[step - 1].label}
          </p>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px] text-[var(--text-3)]">
          <Sparkles className="w-3.5 h-3.5 text-[var(--gold-brand)]" />
          Миний хүсэл
        </div>
      </div>
      <div className="h-1 bg-[var(--surface-2)]">
        <div
          className="h-full transition-all"
          style={{
            width: `${progress}%`,
            background: "linear-gradient(90deg, var(--primary), var(--gold-brand))",
          }}
        />
      </div>

      <div className="p-5 max-h-[60vh] overflow-y-auto">
        {step === 1 && (
          <>
            <p className="text-sm text-[var(--text-2)] mb-4">
              Танд хамгийн илүү тохирох сонголтыг олгохын тулд.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mb-4">
              {INTEREST_LIFESTYLES.map((ls) => (
                <button
                  key={ls.key}
                  type="button"
                  onClick={() => setLifestylePreset(ls.key)}
                  className={cn(
                    "p-4 text-left transition rounded-xl border",
                    lifestyle === ls.key && "ring-2"
                  )}
                  style={
                    lifestyle === ls.key
                      ? {
                          borderColor: "var(--gold-brand)",
                          background: "rgba(201,162,39,.06)",
                          boxShadow: "0 0 0 2px rgba(201,162,39,.12)",
                        }
                      : {
                          borderColor: "var(--border)",
                          background: "var(--surface)",
                        }
                  }
                >
                  <span
                    className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-lg"
                    style={{
                      background: lifestyle === ls.key ? "var(--gold-brand)" : "var(--surface-2)",
                      color: lifestyle === ls.key ? "#07111F" : "var(--text-2)",
                    }}
                  >
                    <MetaIcon name={ls.icon} className="w-5 h-5" />
                  </span>
                  <div className="font-semibold text-sm">{ls.label}</div>
                  <div className="text-xs text-[var(--text-3)] mt-1">{ls.sub}</div>
                </button>
              ))}
            </div>
            <label className="block">
              <div className="text-xs font-semibold text-[var(--text-2)] mb-1">
                Профайлын нэр
              </div>
              <input
                className="input"
                placeholder="Жишээ: Эхний орон сууц"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </label>
          </>
        )}

        {step === 2 && (
          <>
            <p className="text-sm text-[var(--text-2)] mb-4">
              Хайж буй үл хөдлөхийн зориулалтыг сонгоно уу. “Хамаагүй” гэвэл бүгдийг харна.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {INTEREST_PURPOSES.map((p) => {
                const active = purpose === p.key;
                return (
                  <button
                    key={p.key}
                    type="button"
                    onClick={() => {
                      setPurpose(p.key);
                      setSubTypes([]);
                    }}
                    className="rounded-xl border p-3 text-left flex items-center gap-3 transition"
                    style={{
                      borderColor: active ? "var(--gold-brand)" : "var(--border)",
                      background: active ? "rgba(201,162,39,.08)" : "var(--surface)",
                    }}
                  >
                    <span
                      className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
                      style={{
                        background: active ? "var(--gold-brand)" : "var(--surface-2)",
                        color: active ? "#07111F" : "var(--text-2)",
                      }}
                    >
                      <MetaIcon name={p.icon} className="w-4 h-4" />
                    </span>
                    <span className="min-w-0">
                      <span className="block text-[13px] font-bold text-[var(--text)]">
                        {p.label}
                      </span>
                      <span className="block text-[11px] text-[var(--text-3)] mt-0.5">
                        {p.hint}
                      </span>
                    </span>
                  </button>
                );
              })}
            </div>
            {selectedPurpose && selectedPurpose.subTypes.length > 0 && (
              <div className="mt-4 pt-4 border-t border-dashed border-[var(--border)]">
                <div className="mb-2 flex items-center gap-2 text-sm font-semibold">
                  <ListTree className="w-4 h-4 text-[var(--gold-brand)]" />
                  Дэд төрөл
                  <span className="ml-auto text-[11px] font-normal text-[var(--text-3)]">
                    Олныг сонгож болно
                  </span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {selectedPurpose.subTypes.map((sub) => {
                    const active = subTypes.includes(sub.key);
                    return (
                      <button
                        key={sub.key}
                        type="button"
                        onClick={() => toggle(setSubTypes, sub.key)}
                        className={cn("src-chip", active && "selected")}
                      >
                        {active && <Check className="mr-1 inline h-3 w-3" />}
                        {sub.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {step === 3 && (
          <>
            <div className="flex gap-2 mb-4">
              <button
                type="button"
                onClick={() => {
                  setListingMode("sale");
                  setBudgetAny(false);
                  setBudgetMin(null);
                  setBudgetMax(null);
                }}
                className={cn("btn", listingMode === "sale" ? "btn-primary" : "btn-secondary")}
              >
                <HomeIcon className="w-4 h-4" /> Худалдах
              </button>
              <button
                type="button"
                onClick={() => {
                  setListingMode("rent");
                  setBudgetAny(false);
                  setBudgetMin(null);
                  setBudgetMax(null);
                }}
                className={cn("btn", listingMode === "rent" ? "btn-primary" : "btn-secondary")}
              >
                <KeyRound className="w-4 h-4" /> Түрээслэх
              </button>
            </div>

            <p className="text-sm text-[var(--text-2)] mb-3">
              Танд тохирох үнийн хязгаарыг сонгоно уу.
            </p>
            <div className="grid grid-cols-1 gap-2 mb-4">
              {budgetPresets.map((preset) => {
                const active = preset.any
                  ? budgetAny
                  : !budgetAny && budgetMin === preset.min && budgetMax === preset.max;
                return (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => selectBudget(preset)}
                    className="rounded-xl border px-4 py-3 text-left flex items-center gap-3 transition"
                    style={{
                      borderColor: active ? "var(--gold-brand)" : "var(--border)",
                      background: active ? "rgba(201,162,39,.06)" : "var(--surface)",
                    }}
                  >
                    <span
                      className="inline-flex h-6 w-6 items-center justify-center rounded-full border-2"
                      style={{
                        borderColor: active ? "var(--gold-brand)" : "var(--border-strong)",
                        background: active ? "var(--gold-brand)" : "transparent",
                      }}
                    >
                      {active && <Check className="h-3 w-3 text-[#07111F]" />}
                    </span>
                    <span className="text-sm font-semibold text-[var(--text)]">
                      {preset.label}
                      {listingMode === "sale" && !preset.any ? " ₮" : ""}
                    </span>
                  </button>
                );
              })}
            </div>

            <div className="grid grid-cols-2 gap-2">
              <input
                className="input"
                placeholder="Хамгийн бага"
                inputMode="numeric"
                value={budgetMin == null ? "" : String(budgetMin)}
                onChange={(e) => setManualMin(e.target.value)}
              />
              <input
                className="input"
                placeholder="Хамгийн их"
                inputMode="numeric"
                value={budgetMax == null ? "" : String(budgetMax)}
                onChange={(e) => setManualMax(e.target.value)}
              />
            </div>
            {(budgetMin != null || budgetMax != null) && (
              <div className="mt-2 text-xs text-[var(--text-3)]">
                {budgetMin != null ? fmtCompact(budgetMin) : "Доод хязгааргүй"} -{" "}
                {budgetMax != null ? fmtCompact(budgetMax) : "Дээд хязгааргүй"}
              </div>
            )}
          </>
        )}

        {step === 4 && (
          <>
            <div className="text-xs font-semibold text-[var(--text-2)] mb-2">Унтлагын өрөө</div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
              {[
                { n: 1, sub: "2 өрөө" },
                { n: 2, sub: "3 өрөө" },
                { n: 3, sub: "4 өрөө" },
                { n: 4, sub: "5+ өрөө" },
              ].map(({ n, sub }) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => toggle(setBedrooms, n)}
                  className={cn("src-chip py-3", bedrooms.includes(n) && "selected")}
                >
                  <span className="block font-semibold">
                    {n}
                    {n === 4 ? "+" : ""} унтл.
                  </span>
                  <span className="block text-[11px] opacity-70">{sub}</span>
                </button>
              ))}
            </div>

            <div className="text-xs font-semibold text-[var(--text-2)] mb-2">
              Нойлын тоо (хамгийн бага)
            </div>
            <div className="grid grid-cols-4 gap-2 mb-5">
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setBathroomsMin(n)}
                  className={cn("src-chip py-2.5", bathroomsMin === n && "selected")}
                >
                  {n === 0 ? "Хамаагүй" : `${n}+`}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <input
              type="checkbox"
                checked={office}
                onChange={(e) => setOffice(e.target.checked)}
                className="accent-[var(--primary)] w-4 h-4"
              />
              <span className="text-sm">Ажлын өрөө заавал</span>
            </label>
          </>
        )}

        {step === 5 && (
          <>
            <div className="text-xs font-semibold text-[var(--text-2)] mb-2">
              Аль дүүрэгт сонирхож байна вэ?
            </div>
            <p className="text-xs text-[var(--text-3)] mb-3">Хамгийн ихдээ 3 дүүрэг сонгоно.</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {DISTRICTS.map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDistrict(d)}
                  className={cn("src-chip py-2.5", districts.includes(d) && "selected")}
                >
                  {d}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 6 && (
          <>
            <div className="text-xs font-semibold text-[var(--text-2)] mb-2">
              Танд юу чухал вэ?
            </div>
            <div className="flex flex-wrap gap-2">
              {INTEREST_MUST_HAVES.map((m) => (
                <button
                  key={m.key}
                  type="button"
                  onClick={() => toggle(setMustHaves, m.key)}
                  className={cn("src-chip inline-flex items-center gap-1.5", mustHaves.includes(m.key) && "selected")}
                >
                  <MetaIcon name={m.icon} className="w-3.5 h-3.5" />
                  {m.label}
                </button>
              ))}
            </div>
          </>
        )}

        {step === 7 && (
          <>
            <p className="text-sm text-[var(--text-2)] mb-4">
              Та ямар төлөвт байгаа хөрөнгийг хүсэж байна вэ? Олныг сонгож болно.
            </p>
            {CONDITION_GROUPS.map((group) => {
              const items = INTEREST_CONDITIONS.filter((c) => c.groupKey === group.key);
              if (!items.length) return null;
              return (
                <div key={group.key} className="mb-4">
                  <div className="mb-2 flex items-center gap-2 text-[11.5px] font-bold uppercase tracking-wide text-[var(--text-2)]">
                    <MetaIcon name={group.icon} className="h-3.5 w-3.5 text-[var(--gold-brand)]" />
                    {group.label}
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {items.map((condition) => (
                      <button
                        key={condition.key}
                        type="button"
                        onClick={() => toggle(setConditions, condition.key)}
                        className={cn(
                          "src-chip inline-flex items-center gap-1.5",
                          conditions.includes(condition.key) && "selected"
                        )}
                      >
                        <MetaIcon name={condition.icon} className="w-3.5 h-3.5" />
                        {condition.label}
                      </button>
                    ))}
                  </div>
                </div>
              );
            })}
          </>
        )}

        {step === 8 && (
          <>
            <p className="text-sm text-[var(--text-2)] mb-4">
              Танд хамгийн дотно мэдрэгдэх орчныг сонгоно.
            </p>
            <div className="grid grid-cols-1 gap-2.5">
              {INTEREST_VIBES.map((opt) => {
                const active = vibe === opt.key;
                return (
                  <button
                    key={opt.key}
                    type="button"
                    onClick={() => setVibe(opt.key)}
                    className="rounded-xl border p-4 text-left flex items-center gap-3 transition"
                    style={{
                      borderColor: active ? "var(--gold-brand)" : "var(--border)",
                      background: active ? "rgba(201,162,39,.06)" : "var(--surface)",
                    }}
                  >
                    <span
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: active ? "var(--gold-brand)" : "var(--surface-2)",
                        color: active ? "#07111F" : "var(--text-2)",
                      }}
                    >
                      <MetaIcon name={opt.icon} className="w-5 h-5" />
                    </span>
                    <span>
                      <span className="block text-sm font-bold text-[var(--text)]">{opt.label}</span>
                      <span className="block text-xs text-[var(--text-3)] mt-0.5">{opt.sub}</span>
                    </span>
                  </button>
                );
              })}
            </div>
          </>
        )}

        {step === 9 && (
          <>
            <p className="text-sm text-[var(--text-2)] mb-4">
              Шинэ тохирох зар орох тутамд хэрхэн мэдэгдэх вэ? Олныг сонгож болно.
            </p>
            <div className="grid grid-cols-1 gap-2">
              {INTEREST_NOTIF_CHANNELS.map((channel) => {
                const active = notifChannels.includes(channel.key);
                return (
                  <button
                    key={channel.key}
                    type="button"
                    onClick={() => toggle<string>(setNotifChannels, channel.key)}
                    className="rounded-xl border p-4 text-left flex items-center gap-3 transition"
                    style={{
                      borderColor: active ? "var(--gold-brand)" : "var(--border)",
                      background: active ? "rgba(201,162,39,.06)" : "var(--surface)",
                    }}
                  >
                    <span
                      className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl"
                      style={{
                        background: active ? "var(--gold-brand)" : "var(--surface-2)",
                        color: active ? "#07111F" : "var(--text-2)",
                      }}
                    >
                      <MetaIcon name={channel.icon} className="w-5 h-5" />
                    </span>
                    <span className="flex-1">
                      <span className="block text-sm font-bold text-[var(--text)]">{channel.label}</span>
                      <span className="block text-xs text-[var(--text-3)] mt-0.5">{channel.sub}</span>
                    </span>
                    <span
                      className="inline-flex h-5 w-5 items-center justify-center rounded-md border"
                      style={{
                        borderColor: active ? "var(--gold-brand)" : "var(--border-strong)",
                        background: active ? "var(--gold-brand)" : "transparent",
                      }}
                    >
                      {active && <Check className="h-3 w-3 text-[#07111F]" />}
                    </span>
                  </button>
                );
              })}
            </div>
            <div
              className="mt-4 flex gap-2 rounded-xl p-3 text-xs leading-relaxed"
              style={{
                background: "var(--gold-soft)",
                border: "1px solid rgba(201,162,39,.25)",
                color: "var(--text-2)",
              }}
            >
              <Info className="mt-0.5 h-4 w-4 shrink-0 text-[var(--gold-brand)]" />
              SMS болон дуудлагын суваг нь Pro эрхээр идэвхждэг. Basic үед app болон и-мэйл мэдэгдэл ажиллана.
            </div>
          </>
        )}
      </div>

      <div
        className="p-4 flex gap-2 justify-between"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        {step > 1 ? (
          <button type="button" onClick={() => setStep(step - 1)} className="btn btn-ghost">
            <ArrowLeft className="w-4 h-4" />
            Буцах
          </button>
        ) : (
          <button type="button" onClick={closeModal} className="btn btn-ghost">
            Болих
          </button>
        )}
        <div className="flex gap-2">
          {isSkippable && (
            <button type="button" onClick={() => next(true)} className="btn btn-ghost">
              Алгасах
            </button>
          )}
          {step < STEPS.length ? (
            <button
              type="button"
              onClick={() => next()}
              disabled={!canNext}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Үргэлжлүүлэх
              <ArrowRight className="w-4 h-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={() => next()}
              disabled={!canNext}
              className="btn btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Check className="w-4 h-4" /> Дуусгах
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

function ProUpgradeModal({
  onUpgrade,
}: {
  onUpgrade: (plan: "monthly" | "yearly") => void;
}) {
  const [selected, setSelected] = useState<"monthly" | "yearly">("yearly");
  const plan = PRO_PLANS.find((p) => p.key === selected) ?? PRO_PLANS[0];

  return (
    <div className="-m-6">
      <div
        className="relative px-7 pb-5 pt-7 text-center"
        style={{
          background: "linear-gradient(135deg, rgba(201,162,39,.12), rgba(14,93,111,.08))",
          borderBottom: "1px solid var(--border)",
        }}
      >
        <span
          className="mb-3 inline-flex h-14 w-14 items-center justify-center rounded-2xl"
          style={{
            background: "linear-gradient(135deg, var(--gold-brand), var(--primary))",
            color: "#fff",
            boxShadow: "0 8px 24px rgba(201,162,39,.25)",
          }}
        >
          <Crown className="h-7 w-7" />
        </span>
        <h2 className="text-xl font-extrabold text-[var(--text)]">Pro эрх рүү шилжих</h2>
        <p className="mx-auto mt-1 max-w-sm text-sm text-[var(--text-2)]">
          Хязгааргүй хүсэл хадгалаад өөр өөр зорилгод тохирсон зөвлөмж аваарай.
        </p>
      </div>

      <div className="px-6 py-5">
        <div className="grid gap-2 mb-5">
          {[
            { icon: Sparkles, title: "Хязгааргүй хүсэл", sub: "Гэр бүл, хөрөнгө оруулалт, түрээслэгчид тус тусдаа." },
            { icon: Target, title: "Илүү нарийн тааруулга", sub: "Хүсэл бүр өөрийн дүүрэг, төсөв, шаардлагатай." },
            { icon: BellIcon, title: "Тусгай мэдэгдэл", sub: "Хүсэл тус бүрт шинэ зар орох тутамд push." },
          ].map(({ icon: Icon, title, sub }) => (
            <div
              key={title}
              className="flex gap-3 rounded-xl p-3"
              style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
            >
              <span className="inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[rgba(201,162,39,.15)] text-[var(--gold-brand)]">
                <Icon className="h-4 w-4" />
              </span>
              <span>
                <span className="block text-sm font-bold text-[var(--text)]">{title}</span>
                <span className="block text-xs text-[var(--text-3)] mt-0.5">{sub}</span>
              </span>
            </div>
          ))}
        </div>

        <div className="mb-2 text-[11px] font-bold uppercase tracking-widest text-[var(--text-3)]">
          Багц сонгох
        </div>
        <div className="grid grid-cols-2 gap-3">
          {PRO_PLANS.map((p) => {
            const active = selected === p.key;
            return (
              <button
                key={p.key}
                type="button"
                onClick={() => setSelected(p.key)}
                className="relative rounded-xl border p-4 text-left"
                style={{
                  borderColor: active ? "var(--gold-brand)" : "var(--border)",
                  background: active ? "rgba(201,162,39,.08)" : "var(--surface)",
                }}
              >
                {"savings" in p && p.savings && (
                  <span className="absolute -top-2 right-3 rounded-full bg-[var(--gold-brand)] px-2 py-0.5 text-[10px] font-extrabold text-[#07111F]">
                    {p.savings}
                  </span>
                )}
                <span className="mb-2 flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                  <span
                    className="inline-flex h-5 w-5 items-center justify-center rounded-full border-2"
                    style={{
                      borderColor: active ? "var(--gold-brand)" : "var(--border-strong)",
                      background: active ? "var(--gold-brand)" : "transparent",
                    }}
                  >
                    {active && <Check className="h-3 w-3 text-[#07111F]" />}
                  </span>
                  {p.label}
                </span>
                <span className="num block text-lg font-extrabold text-[var(--text)]">
                  {p.price.toLocaleString("mn-MN")}₮
                  <span className="text-xs font-semibold text-[var(--text-3)]">{p.unit}</span>
                </span>
                <span className="mt-1 block text-[11px] text-[var(--text-3)]">{p.sub}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div
        className="flex items-center gap-3 px-6 py-4"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <p className="flex-1 text-[11px] leading-relaxed text-[var(--text-3)]">
          Pro эрх {plan.label.toLowerCase()} {plan.price.toLocaleString("mn-MN")}₮.
          Хэдийд ч цуцалж болно.
        </p>
        <button type="button" onClick={() => onUpgrade(selected)} className="btn btn-primary">
          <Crown className="w-4 h-4" />
          Pro болох
        </button>
      </div>
    </div>
  );
}
