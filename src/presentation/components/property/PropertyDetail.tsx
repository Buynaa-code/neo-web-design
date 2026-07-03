"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, type CSSProperties, type ReactNode } from "react";
import {
  ArrowRight,
  ArrowUpDown,
  BadgeCheck,
  Banknote,
  BarChart3,
  BedDouble,
  Building2,
  Bus,
  Calendar,
  Car,
  Check,
  ChevronLeft,
  ChevronRight,
  Dumbbell,
  ExternalLink,
  GraduationCap,
  Handshake,
  Heart,
  ListPlus,
  Image as ImageIcon,
  MapPin,
  MessageCircle,
  Phone,
  PlayCircle,
  Ruler,
  Send,
  Share2,
  Shield,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Sun,
  Trees,
  type LucideIcon,
} from "lucide-react";

import { BANKS, getBank } from "@/infrastructure/data/banks";
import { BUS_STOPS } from "@/infrastructure/data/bus-stops";
import { getAgent, FALLBACK_AGENT } from "@/infrastructure/data/agents";
import { getListing, LISTINGS, photoUrl } from "@/infrastructure/data/listings";
import {
  fmtCompact,
  fmtListingArea,
  fmtPpm,
  listingHeating,
  listingOrientation,
  listingPrice,
  mortgageMonthly,
} from "@/infrastructure/data/formatters";
import {
  checkedItems,
  getListingDetail,
  PROPERTY_TYPE_LABELS,
  type DetailRoom,
  type ListingDetail,
} from "@/infrastructure/data/listing-detail";
import { ResultsMap } from "@/components/results/ResultsMap";
import { AddToListModal } from "@/components/results/SavedListModals";
import { openLightbox } from "@/components/property/Lightbox";
import { LoanApplyModal, LoanCompareModal } from "@/components/property/LoanModals";
import {
  AgentMessageModal,
  CallAgentModal,
  ReviewsModal,
} from "@/components/property/AgentModals";
import { PriceHistory } from "@/components/property/PriceHistory";
import { TravelTimes } from "@/components/property/TravelTimes";
import { hasIpoteh, isListingVerified } from "@/application/filters";
import { useRecordView } from "@/application/queries/activity";
import { useToggleFavorite } from "@/application/queries/saved";
import { getToken } from "@/infrastructure/api/token";
import { useStore } from "@/infrastructure/store";
import { cn, geoDistance } from "@/lib/utils";
import type { Listing } from "@/domain/types";

type KeyItem = {
  label: string;
  value: ReactNode;
  icon: LucideIcon;
};

const POIS = [
  { kind: "Сургууль", name: "British School of Ulaanbaatar", dist: "1.1 км (3 мин)", icon: GraduationCap },
  { kind: "Худалдаа", name: "Хүннү Молл", dist: "2.5 км (6 мин)", icon: ShoppingBag },
  { kind: "Эмнэлэг", name: "Интермед эмнэлэг", dist: "2.3 км (6 мин)", icon: Shield },
  { kind: "Тээвэр", name: "Зайсангийн эцэс автобусны буудал", dist: "500 м (7 мин явган)", icon: Bus },
  { kind: "Ногоон бүс", name: "Зайсангийн цэцэрлэгт хүрээлэн", dist: "1.0 км (3 мин)", icon: Trees },
];

function firstText(...values: Array<string | number | null | undefined>): string {
  for (const value of values) {
    if (value !== null && value !== undefined && String(value).trim()) return String(value);
  }
  return "";
}

function typeLabel(detail: ListingDetail): string {
  return PROPERTY_TYPE_LABELS[detail.type.primary] ?? detail.type.primary ?? "Орон сууц";
}

function goalLabel(mode: Listing["mode"]): string {
  return mode === "rent" ? "Түрээслэх" : "Худалдах";
}

function floorText(detail: ListingDetail, listing: Listing): string {
  const floor = firstText(detail.address.floor);
  const total = detail.specs.totalFloors ? String(detail.specs.totalFloors) : "";
  if (floor && total) return `${floor} / ${total}`;
  return firstText(listing.floor, floor);
}

function windowText(detail: ListingDetail, listing: Listing): string {
  const counts = detail.specs.windowCounts ?? {};
  const total = Number(counts.total) || 0;
  const directions = Object.entries(counts)
    .filter(([key, value]) => key !== "total" && Number(value) > 0)
    .map(([key, value]) => `${key} ${value}`);
  if (total && directions.length) return directions.join(" · ");
  return listingOrientation(listing);
}

function roadText(detail: ListingDetail): string {
  const road = detail.infra.road;
  const parts = [];
  if (road.asphaltPct > 0) parts.push(`Асфальт ${road.asphaltPct}%`);
  if (road.dirtKm > 0) parts.push(`Шороон ${road.dirtKm} км`);
  return parts.join(" · ") || "Мэдээлэл оруулаагүй";
}

function buildFeatureCards(listing: Listing, detail: ListingDetail) {
  const raw = [
    ...listing.features,
    ...checkedItems(detail.community.amenities),
    ...checkedItems(detail.community.security),
    ...checkedItems(detail.included.furniture),
    ...checkedItems(detail.included.equipment),
  ];
  const unique = [...new Set(raw.filter(Boolean))].slice(0, 8);
  const iconFor = (label: string): LucideIcon => {
    if (/харуул|cctv|домофон|нэвтрэлт|хаалттай/i.test(label)) return ShieldCheck;
    if (/зогсоол|гараж|ev/i.test(label)) return Car;
    if (/фитнес|gym|саун|спа|бассейн/i.test(label)) return Dumbbell;
    if (/лифт|access|налуу/i.test(label)) return ArrowUpDown;
    if (/ногоон|алхалт|террас|талбай/i.test(label)) return Trees;
    return Sparkles;
  };
  return (unique.length ? unique : ["Тодорхой мэдээлэлтэй зар"]).map((label) => ({
    label,
    icon: iconFor(label),
  }));
}

function sortedNearbyStops(listing: Listing) {
  return BUS_STOPS.map((stop) => ({
    stop,
    km: geoDistance({ lat: listing.lat, lng: listing.lng }, { lat: stop.lat, lng: stop.lng }) * 32,
  }))
    .sort((a, b) => a.km - b.km)
    .slice(0, 5);
}

function travelText(km: number): string {
  const walk = Math.max(1, Math.round((km / 4.6) * 60));
  const drive = Math.max(1, Math.round((km / 22) * 60));
  const distance = km < 1 ? `${Math.round(km * 1000)} м` : `${km.toFixed(1)} км`;
  return `${distance} · явган ${walk} мин · машин ${drive} мин`;
}

export function PropertyDetail({ listing }: { listing: Listing }) {
  const router = useRouter();
  const detail = getListingDetail(listing);
  const agent = getAgent(listing.agentId) ?? FALLBACK_AGENT;
  const verified = isListingVerified(listing);
  const isSaved = useStore((s) => s.savedListingIds.includes(listing.id));
  const toggleSaved = useStore((s) => s.toggleSavedListing);
  const compareIds = useStore((s) => s.compareIds);
  const toggleCompare = useStore((s) => s.toggleCompare);
  const setMode = useStore((s) => s.setMode);
  const setCurrentListingId = useStore((s) => s.setCurrentListingId);
  const setScheduleListingId = useStore((s) => s.setScheduleListingId);
  const markViewed = useStore((s) => s.markViewed);
  const openModal = useStore((s) => s.openModal);
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const loanBankId = useStore((s) => s.loanBankId);
  const loanDownPct = useStore((s) => s.loanDownPct);
  const loanYears = useStore((s) => s.loanYears);
  const setLoanBank = useStore((s) => s.setLoanBank);
  const setLoanDownPct = useStore((s) => s.setLoanDownPct);
  const setLoanYears = useStore((s) => s.setLoanYears);

  const recordView = useRecordView();
  const toggleFavorite = useToggleFavorite();

  useEffect(() => {
    setCurrentListingId(listing.id);
    markViewed(listing.id);
    // Persist the view to the backend when signed in (fire-and-forget; a 401
    // for anonymous visitors is expected and harmless).
    if (getToken()) recordView.mutate(listing.id);
    // recordView is stable across renders; intentionally excluded from deps.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [listing.id, markViewed, setCurrentListingId]);

  // Local store drives the optimistic UI; mirror the change to the backend.
  const handleToggleSaved = () => {
    toggleSaved(listing.id);
    if (getToken()) toggleFavorite.mutate({ listingId: listing.id, favorited: isSaved });
  };

  if (!detail) {
    return (
      <div className="max-w-7xl mx-auto px-4 lg:px-8 py-10">
        <div className="card p-8">Зарын дэлгэрэнгүй мэдээлэл олдсонгүй.</div>
      </div>
    );
  }

  const activeTypeLabel = typeLabel(detail);
  const propFloor = floorText(detail, listing);
  const propArea = detail.specs.areaCert || listing.area;
  const propProject = firstText(detail.address.project, listing.khotkhon);
  const propDistrict = firstText(detail.address.district, listing.district);
  const propKhoroo = firstText(detail.address.khoroo, listing.khoroo);
  const propYear = firstText(detail.state.commissionYear, detail.state.commissionDue, listing.year);
  const titleTypeLine =
    listing.rooms && !["Газар", "Авто дулаан зогсоол"].includes(activeTypeLabel)
      ? `${listing.rooms} өрөө ${activeTypeLabel}`
      : activeTypeLabel;
  const features = buildFeatureCards(listing, detail);
  const rooms = detail.specs.rooms.filter((room) => room.checked).slice(0, 8);
  const reasons = [
    `${propDistrict} дүүргийн байршил`,
    `${fmtListingArea(propArea)} талбай`,
    detail.infra.heating.primary && `${detail.infra.heating.primary} дулаан`,
    checkedItems(detail.community.security)[0],
    checkedItems(detail.community.amenities)[0],
  ].filter(Boolean).slice(0, 4);
  const propId = `RG-${String(listing.id).padStart(4, "0")}-${listing.photos * 7 + 13}`;
  const currentIndex = LISTINGS.findIndex((item) => item.id === listing.id);
  const prev = LISTINGS[(currentIndex - 1 + LISTINGS.length) % LISTINGS.length];
  const next = LISTINGS[(currentIndex + 1) % LISTINGS.length];
  const bank = getBank(loanBankId);
  const downPct = Math.max(bank.minDownPct, loanDownPct);
  const years = Math.min(bank.maxYears, loanYears);
  const down = Math.round((listing.price * downPct) / 100);
  const loan = listing.price - down;
  const monthly = mortgageMonthly(listing.price, downPct, years, bank.rate);
  const totalPaid = monthly * years * 12;
  const totalInterest = totalPaid - loan;
  const compareActive = compareIds.includes(listing.id);

  const openCallModal = () => openModal(<CallAgentModal agent={agent} />, "sm");
  const openWhatsApp = () =>
    openModal(<AgentMessageModal agent={agent} listing={listing} />, "md");
  const openReviews = () => openModal(<ReviewsModal agent={agent} />, "md");

  const openScheduleModal = () => {
    setScheduleListingId(listing.id);
    router.push("/schedule");
  };

  const share = async () => {
    const url = window.location.href;
    try {
      await navigator.clipboard.writeText(url);
      pushToast("Зарын холбоос хуулагдлаа", "success");
    } catch {
      pushToast(url, "info");
    }
  };

  return (
    <div className="property-detail-page max-w-7xl mx-auto px-4 lg:px-8 py-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-4">
        <div className="bm-breadcrumb">
          <Link href="/">Нүүр</Link>
          <ChevronRight className="sep size-3.5" />
          <button
            type="button"
            onClick={() => {
              setMode(listing.mode);
              router.push(`/results?mode=${listing.mode}`);
            }}
          >
            {goalLabel(listing.mode)}
          </button>
          <ChevronRight className="sep size-3.5" />
          <button type="button" onClick={() => router.push(`/results?mode=${listing.mode}`)}>
            {activeTypeLabel}
          </button>
          <ChevronRight className="sep size-3.5" />
          <button
            type="button"
            onClick={() => {
              setMode(listing.mode);
              router.push(`/results?mode=${listing.mode}`);
            }}
          >
            {propDistrict} дүүрэг
          </button>
          <ChevronRight className="sep size-3.5" />
          <span className="text-[color:var(--text)]">{propProject}</span>
        </div>
        <div className="flex items-center gap-3 text-sm">
          <Link href={`/property/${prev.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[color:var(--text-2)] hover:bg-[color:var(--surface-2)]">
            <ChevronLeft className="size-4" />
            Буцах
          </Link>
          <Link href={`/property/${next.id}`} className="inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[color:var(--text-2)] hover:bg-[color:var(--surface-2)]">
            Дараагийн зар
            <ChevronRight className="size-4" />
          </Link>
        </div>
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-[1.35fr_1fr]">
        <div className="bm-gallery">
          <button
            type="button"
            onClick={() => openLightbox(listing.id, 0)}
            className="bm-gallery-hero cursor-zoom-in"
            style={{ backgroundImage: `url('${photoUrl(listing, 0, "900/680")}')` }}
            aria-label="Зургийг томруулж харах"
          >
            {verified ? (
              <span className="bm-verified">
                <BadgeCheck className="size-3" />
                Verified
              </span>
            ) : null}
            <div className="bm-gallery-overlay-tag">
              <ImageIcon className="size-3.5" />
              {listing.photos} зураг
            </div>
          </button>
          <div className="bm-gallery-side">
            <button
              type="button"
              onClick={() => openLightbox(listing.id, 1)}
              className="bm-gallery-thumb cursor-zoom-in"
              style={{ backgroundImage: `url('${photoUrl(listing, 1, "300/200")}')` }}
              aria-label="Видеог нээх"
            >
              <div className="absolute inset-0 grid place-items-center bg-black/30 text-white">
                <PlayCircle className="size-9" />
              </div>
            </button>
            {[2, 3, 4].map((index) => (
              <button
                key={index}
                type="button"
                onClick={() => openLightbox(listing.id, index)}
                className="bm-gallery-thumb cursor-zoom-in"
                style={{ backgroundImage: `url('${photoUrl(listing, index, "300/200")}')` }}
                aria-label={`${index + 1}-р зураг`}
              />
            ))}
          </div>
        </div>

        <section>
          <div className="mb-2 flex items-start justify-between gap-3">
            <h1 className="bm-prop-title">
              {propProject} -<br />
              {titleTypeLine}
            </h1>
            {verified ? (
              <span className="bm-verified bm-verified-inline shrink-0">
                <BadgeCheck className="size-3" />
                Verified
              </span>
            ) : null}
          </div>
          <div className="bm-prop-loc">
            <MapPin className="size-4 text-[color:var(--gold-brand)]" />
            {propDistrict} дүүрэг, {propKhoroo}-р хороо, {propProject}
            {detail.address.googleMapLink ? (
              <a href={detail.address.googleMapLink} target="_blank" rel="noreferrer" aria-label="Google Map нээх">
                <ExternalLink className="size-3.5" />
              </a>
            ) : null}
          </div>

          <div className="mb-5 mt-6">
            <div className="bm-prop-price-big num">{listingPrice(listing)}</div>
            <div className="bm-prop-ppm-big num">{fmtPpm(listing)}</div>
          </div>

          <div className="mb-5 grid grid-cols-3 gap-2.5">
            <Spec value={fmtListingArea(propArea)} label="Нийт талбай" />
            <Spec value={`${listing.rooms} өрөө`} label="Өрөөний тоо" />
            <Spec value={propFloor} label="Байрлал" />
            <Spec value={`${propYear}`} label="Ашиглалтад орсон" />
            <Spec value={windowText(detail, listing)} label="Цонхны харьц" />
            <Spec value={detail.infra.heating.primary || listingHeating(listing)} label="Дулаан хангамж" />
          </div>

          <div className="mb-4 flex flex-wrap gap-2.5">
            <button type="button" className="bm-btn-gold flex-1 justify-center" onClick={openCallModal}>
              <Phone className="size-4" />
              Холбоо барих
            </button>
            <button type="button" className="bm-btn-navy justify-center" onClick={openScheduleModal}>
              <Calendar className="size-4" />
              Үзлэг товлох
            </button>
            <button
              type="button"
              className={cn("bm-btn-outline justify-center", isSaved && "!border-[color:var(--gold-brand)] !text-[color:var(--gold-brand)]")}
              onClick={() => {
                handleToggleSaved();
                pushToast(isSaved ? "Хадгалснаас хаслаа" : "Хадгалсан жагсаалтад нэмэгдлээ", "success");
              }}
            >
              <Heart className="size-4" fill={isSaved ? "currentColor" : "none"} />
              Хадгалах
            </button>
            <button
              type="button"
              className="bm-btn-outline justify-center"
              onClick={() => openModal(<AddToListModal listingId={listing.id} />, "sm")}
            >
              <ListPlus className="size-4" />
              Жагсаалтад нэмэх
            </button>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-[color:var(--text-3)]">
            <span>
              Зарын дугаар: <span className="num text-[color:var(--text-2)]">{propId}</span>
            </span>
            <span>
              Нийтэлсэн: <span className="num text-[color:var(--text-2)]">{listing.listedDays} хоногийн өмнө</span>
            </span>
            <button type="button" className="flex items-center gap-1 hover:text-[color:var(--gold-brand)]" onClick={share}>
              <Share2 className="size-3.5" />
              Хуваалцах
            </button>
          </div>
        </section>
      </div>

      <div className="bm-ai-reason mb-7">
        <div className="flex items-start gap-4">
          <div className="bm-ai-reason-icon">
            <Sparkles className="size-5" />
          </div>
          <div>
            <div className="mb-1.5 text-sm font-semibold text-[color:var(--gold-brand)]">
              AI хайлтаас танд тохирох шалтгаан
            </div>
            <p className="text-sm leading-6 text-[color:var(--text-2)]">
              Энэхүү {activeTypeLabel} нь {propDistrict} дүүрэгт байрлах {fmtListingArea(propArea)} талбайтай зар.
              Зорилго, байршил, үзүүлэлт, дэд бүтэц, төлбөрийн нөхцөл нь зар оруулах хэсгийн дататай холбогдож харагдаж байна.
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              {reasons.map((reason) => (
                <span key={reason} className="bm-ai-reason-chip">
                  <Check className="size-3" />
                  {reason}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-7">
          <div className="grid gap-5 md:grid-cols-2">
            <section>
              <h2 className="mb-3 text-base font-semibold">Түлхүүр мэдээлэл</h2>
              <div className="bm-keytbl">
                {buildKeyItems(listing, detail, activeTypeLabel, propProject, propDistrict, propKhoroo, propFloor, propYear).map((item) => (
                  <KeyRow key={item.label} item={item} />
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-3 text-base font-semibold">Давхарын зураглал</h2>
              <div className="bm-floorplan">
                <div className="bm-floorplan-img">
                  <svg viewBox="0 0 200 150" fill="none" stroke="#0A1F44" strokeWidth="2" aria-hidden="true">
                    <rect x="10" y="10" width="180" height="130" />
                    <line x1="80" y1="10" x2="80" y2="80" />
                    <line x1="80" y1="80" x2="190" y2="80" />
                    <line x1="130" y1="80" x2="130" y2="140" />
                    <line x1="80" y1="120" x2="130" y2="120" />
                    <rect x="20" y="20" width="50" height="50" strokeWidth="1" />
                    <text x="30" y="48" fontSize="6" fill="#0A1F44" stroke="none">Зочны</text>
                    <text x="100" y="48" fontSize="6" fill="#0A1F44" stroke="none">Гал тогоо</text>
                    <text x="140" y="100" fontSize="6" fill="#0A1F44" stroke="none">Унтл-1</text>
                    <text x="90" y="100" fontSize="6" fill="#0A1F44" stroke="none">Унтл-2</text>
                    <text x="40" y="100" fontSize="6" fill="#0A1F44" stroke="none">Угаалга</text>
                  </svg>
                </div>
                <button type="button" className="bm-btn-outline w-full justify-center !py-2 !text-xs">
                  <ImageIcon className="size-3.5" />
                  Томоор харах
                </button>
              </div>
            </section>
          </div>

          <section>
            <h2 className="mb-4 text-base font-semibold">Онцлог & давуу талууд</h2>
            <div className="card grid grid-cols-2 gap-x-5 gap-y-2 p-5 md:grid-cols-4">
              {features.map(({ label, icon: Icon }) => (
                <div key={label} className="bm-feat-item">
                  <Icon className="size-5" />
                  <div className="text-[color:var(--text)]">{label}</div>
                </div>
              ))}
            </div>
          </section>

          {listing.priceHistory && listing.priceHistory.length >= 2 && (
            <section>
              <h2 className="mb-3 text-base font-semibold">Үнийн чиг хандлага</h2>
              <PriceHistory listing={listing} />
            </section>
          )}

          <section>
            <div className="mb-3 flex items-baseline justify-between gap-3">
              <h2 className="text-base font-semibold">Хүрэх хугацаа</h2>
              <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                Миний байршлаас → энэ зар хүртэл
              </span>
            </div>
            <TravelTimes listing={listing} />
          </section>

          {rooms.length ? (
            <section>
              <h2 className="mb-3 text-base font-semibold">Өрөөний дэлгэрэнгүй</h2>
              <div className="property-room-grid">
                {rooms.map((room) => (
                  <RoomCard key={`${room.floor}-${room.name}-${room.no}`} room={room} />
                ))}
              </div>
            </section>
          ) : null}

          <section>
            <h2 className="mb-3 text-base font-semibold">Байршил</h2>
            <div className="grid gap-4 md:grid-cols-[1fr_1.2fr]">
              <div className="property-map-shell card overflow-hidden">
                <ResultsMap listings={[listing]} />
              </div>
              <div className="card p-5">
                <div className="mb-3 text-sm font-semibold">
                  {propDistrict} дүүрэг, {propKhoroo}-р хороо,<br />
                  {propProject}
                </div>
                <ul className="space-y-2 text-sm text-[color:var(--text-2)]">
                  {sortedNearbyStops(listing).map(({ stop, km }) => (
                    <li key={stop.id} className="flex items-center gap-2">
                      <span className="size-1.5 rounded-full bg-[color:var(--gold-brand)]" />
                      {stop.name} (буудал) - <span className="num">{travelText(km)}</span>
                    </li>
                  ))}
                </ul>
                <button type="button" className="bm-btn-outline mt-4 w-full justify-center !py-2 !text-xs">
                  Газрын зураг дээр харах
                  <ArrowRight className="size-3.5" />
                </button>
              </div>
            </div>
          </section>

          <section>
            <h2 className="mb-3 text-base font-semibold">Ойролцоох сургууль, үйлчилгээ, тээвэр</h2>
            <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
              {POIS.map(({ kind, name, dist, icon: Icon }) => (
                <div key={name} className="bm-poi">
                  <div className="bm-poi-icon">
                    <Icon className="size-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="bm-poi-kind">{kind}</div>
                    <div className="bm-poi-name truncate">{name}</div>
                    <div className="bm-poi-dist">{dist}</div>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <aside className="space-y-4">
          <section className="bm-agent">
            <div className="mb-3 text-xs font-semibold text-[color:var(--text-3)]">Зарын эзэн / Зуучлагч</div>
            <div className="mb-4 flex items-center gap-3">
              <div className="bm-agent-avatar">{agent.initials}</div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-1 text-sm font-semibold">
                  {agent.name}
                  {agent.verified ? <BadgeCheck className="size-4 text-[color:var(--gold-brand)]" /> : null}
                </div>
                <div className="text-xs text-[color:var(--text-3)]">{agent.agency}</div>
                <div className="mt-1 flex items-center gap-2">
                  {agent.verified ? (
                    <span className="flex items-center gap-1 text-[10px] text-[color:var(--success)]">
                      <BadgeCheck className="size-3" />
                      Verified
                    </span>
                  ) : null}
                  <span className="text-[10px] text-[color:var(--gold-brand)]">NEOMAP Partner</span>
                </div>
              </div>
            </div>
            <button
              type="button"
              onClick={openReviews}
              className="mb-4 flex items-center gap-2 text-sm hover:underline cursor-pointer"
            >
              <span className="text-[color:var(--gold-brand)]">★★★★★</span>
              <span className="font-semibold">{agent.rating.toFixed(1)}</span>
              <span className="text-xs text-[color:var(--text-3)]">({agent.reviewCount} үнэлгээ)</span>
            </button>
            <div className="mb-4 grid grid-cols-2 gap-3 border-t border-[color:var(--border)] pt-4 text-center">
              <div>
                <div className="text-xs text-[color:var(--text-3)]">Нийт зар</div>
                <div className="num text-base font-bold">{agent.listings}</div>
              </div>
              <div>
                <div className="text-xs text-[color:var(--text-3)]">Амжилттай борлуулалт</div>
                <div className="num text-base font-bold">96%</div>
              </div>
            </div>
            <div className="space-y-2">
              <button type="button" className="bm-btn-gold w-full justify-center" onClick={openCallModal}>
                <Phone className="size-4" />
                Холбоо барих
              </button>
              <button type="button" className="bm-btn-navy w-full justify-center" onClick={openWhatsApp}>
                <MessageCircle className="size-4" />
                WhatsApp чат
              </button>
            </div>
          </section>

          <section className="bm-side-block flex items-start gap-3 border-[rgba(201,163,95,.3)]">
            <ShieldCheck className="mt-0.5 size-5 shrink-0 text-[color:var(--gold-brand)]" />
            <p className="text-xs leading-5 text-[color:var(--text-2)]">
              Энэхүү зар нь NEOMAP-аар баталгаажсан. Баримт бичиг болон мэдээлэл бодитой.
            </p>
          </section>

          <section className="bm-side-block">
            <div className="mb-3 flex items-start justify-between">
              <div>
                <div className="text-sm font-semibold">{listing.mode === "sale" ? "Зээлийн тооцоолуур" : "Түрээсийн нөхцөл"}</div>
                <div className="text-[11px] text-[color:var(--text-3)]">Банк/санхүүгийн байгууллагатай хамтарсан</div>
              </div>
              <span className="pill pill-gold">
                <Handshake className="size-3" />
                Партнёр
              </span>
            </div>

            {listing.mode === "sale" ? (
              <MortgageCalculator
                listing={listing}
                bankId={bank.id}
                downPct={downPct}
                years={years}
                down={down}
                loan={loan}
                monthly={monthly}
                totalPaid={totalPaid}
                totalInterest={totalInterest}
                onBank={setLoanBank}
                onDown={setLoanDownPct}
                onYears={setLoanYears}
              />
            ) : (
              <RentTerms listing={listing} detail={detail} />
            )}
          </section>

          <section className="bm-side-block">
            <div className="bm-side-title">
              <span>Харьцуулах ({compareIds.length}/4)</span>
              <BarChart3 className="size-4 text-[color:var(--gold-brand)]" />
            </div>
            <p className="mb-3 text-xs leading-5 text-[color:var(--text-3)]">
              Сонгосон заруудыг үнэ, талбай, байршил, дэд бүтцээр харьцуулна.
            </p>
            <div className="flex flex-col gap-2">
              <button
                type="button"
                className={cn("bm-btn-outline w-full justify-center !py-2 !text-xs", compareActive && "!border-[color:var(--gold-brand)] !text-[color:var(--gold-brand)]")}
                onClick={() => {
                  toggleCompare(listing.id);
                  pushToast(compareActive ? "Харьцуулалтаас хаслаа" : "Харьцуулах жагсаалтад нэмлээ", "success");
                }}
              >
                <Sparkles className="size-3.5" />
                {compareActive ? "Харьцуулалтаас хасах" : "Харьцуулахад нэмэх"}
              </button>
              {compareIds.length >= 2 && (
                <Link
                  href="/compare"
                  className="bm-btn-gold w-full justify-center !py-2 !text-xs"
                >
                  <BarChart3 className="size-3.5" />
                  Одоо {compareIds.length} зар харьцуулах →
                </Link>
              )}
            </div>
          </section>
        </aside>
      </div>
    </div>
  );
}

function Spec({ value, label }: { value: ReactNode; label: string }) {
  return (
    <div className="bm-prop-spec">
      <div className="bm-prop-spec-val num">{value}</div>
      <div className="bm-prop-spec-lbl">{label}</div>
    </div>
  );
}

function buildKeyItems(
  listing: Listing,
  detail: ListingDetail,
  activeTypeLabel: string,
  propProject: string,
  propDistrict: string,
  propKhoroo: string,
  propFloor: string,
  propYear: string
): KeyItem[] {
  const parking =
    checkedItems(detail.community.amenities).find((item) => /зогсоол|гараж/i.test(item)) ??
    (detail.specs.areaGarage ? `Зогсоолын талбай ${fmtListingArea(detail.specs.areaGarage)}` : "Мэдээлэл оруулаагүй");
  return [
    { label: "Байршил", value: `${propDistrict} дүүрэг, ${propKhoroo}-р хороо, ${propProject}`, icon: MapPin },
    { label: "Хотхон", value: propProject, icon: Building2 },
    { label: "Барилгын төрөл", value: [activeTypeLabel, detail.type.subtype].filter(Boolean).join(" · "), icon: Building2 },
    { label: "Нийт талбай", value: fmtListingArea(detail.specs.areaCert || listing.area), icon: Ruler },
    { label: "Өрөөний тоо", value: `${listing.rooms} өрөө (${detail.specs.bedrooms} унтлагын өрөө)`, icon: BedDouble },
    { label: "Давхар / Нийт", value: propFloor, icon: ArrowUpDown },
    { label: "Ашиглалтад орсон", value: `${propYear}`, icon: Calendar },
    { label: "Зогсоол", value: parking, icon: Car },
    { label: "Цонхны харьц", value: windowText(detail, listing), icon: Sun },
    { label: "Засвар", value: detail.state.interior || detail.state.current || "Мэдээлэл оруулаагүй", icon: Sparkles },
    { label: "Зам", value: roadText(detail), icon: Car },
  ];
}

function KeyRow({ item }: { item: KeyItem }) {
  const Icon = item.icon;
  return (
    <div className="bm-keytbl-row">
      <div className="bm-keytbl-row-k">
        <Icon className="size-3.5 text-[color:var(--gold-brand)]" />
        {item.label}
      </div>
      <div className="bm-keytbl-row-v">{item.value}</div>
    </div>
  );
}

function RoomCard({ room }: { room: DetailRoom }) {
  return (
    <article className="property-room-card">
      <div className="flex items-center justify-between gap-3">
        <div>
          <div className="text-sm font-semibold">{room.note || room.name}</div>
          <div className="mt-0.5 text-xs text-[color:var(--text-3)]">
            {room.floor} давхар · {room.name}
          </div>
        </div>
        <div className="num text-sm font-bold text-[color:var(--gold-brand)]">{fmtListingArea(room.area)}</div>
      </div>
      {room.windows.length ? (
        <div className="mt-3 flex flex-wrap gap-1.5">
          {room.windows.map((window) => (
            <span key={window} className="property-room-chip">{window}</span>
          ))}
        </div>
      ) : null}
    </article>
  );
}

function MortgageCalculator({
  listing,
  bankId,
  downPct,
  years,
  down,
  loan,
  monthly,
  totalPaid,
  totalInterest,
  onBank,
  onDown,
  onYears,
}: {
  listing: Listing;
  bankId: string;
  downPct: number;
  years: number;
  down: number;
  loan: number;
  monthly: number;
  totalPaid: number;
  totalInterest: number;
  onBank: (id: string) => void;
  onDown: (pct: number) => void;
  onYears: (years: number) => void;
}) {
  const bank = getBank(bankId);
  return (
    <>
      <div className="mb-3 flex flex-wrap gap-1 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-1">
        {BANKS.map((item) => {
          const selected = item.id === bank.id;
          return (
            <button
              key={item.id}
              type="button"
              className="rounded-md px-2.5 py-1.5 text-[11px] font-medium transition"
              style={selected ? { background: item.color, color: "#fff" } : { color: "var(--text-2)" }}
              onClick={() => onBank(item.id)}
            >
              {item.short}
            </button>
          );
        })}
      </div>

      <div className="mb-3 flex items-start gap-2 rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] p-3" style={{ borderLeftColor: bank.color, borderLeftWidth: 3 }}>
        <div className="flex size-9 shrink-0 items-center justify-center rounded-lg text-xs font-bold text-white" style={{ background: bank.color }}>
          {bank.short.slice(0, 2)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-xs font-semibold">{bank.name}</div>
          <div className="mt-0.5 text-[11px] text-[color:var(--text-3)]">{bank.tag}</div>
          <div className="mt-1 flex flex-wrap gap-1">
            <span className="num rounded bg-[color:var(--gold-soft)] px-1.5 py-0.5 text-[10px] text-[color:var(--gold-brand)]">{bank.rate}% жилийн</span>
            <span className="num rounded bg-[color:var(--surface)] px-1.5 py-0.5 text-[10px] text-[color:var(--text-2)]">{bank.maxYears} жил хүртэл</span>
          </div>
        </div>
      </div>

      <RangeRow
        label="Урьдчилгаа"
        value={`${downPct}% · ${fmtCompact(down)}`}
        min={bank.minDownPct}
        max={60}
        step={5}
        current={downPct}
        onChange={onDown}
        hint={`Доод хязгаар: ${bank.minDownPct}% (${bank.short})`}
      />
      <RangeRow
        label="Хугацаа"
        value={`${years} жил`}
        min={5}
        max={bank.maxYears}
        step={1}
        current={years}
        onChange={onYears}
      />

      <MortgageRow label="Орон сууцны үнэ" value={`${listing.price.toLocaleString("en-US")} ₮`} />
      <MortgageRow label={`Зээлийн дүн (${100 - downPct}%)`} value={`${loan.toLocaleString("en-US")} ₮`} />
      <MortgageRow label="Жилийн хүү" value={`${bank.rate}%`} style={{ color: bank.color }} />
      <MortgageRow label="Нийт төлөх" value={`${totalPaid.toLocaleString("en-US")} ₮`} />
      <MortgageRow label="Нийт хүү" value={`${totalInterest.toLocaleString("en-US")} ₮`} style={{ color: "var(--warning)" }} />

      <div className="bm-mortgage-monthly">
        <span className="k">Сарын төлбөр</span>
        <span className="v num">{monthly.toLocaleString("en-US")} ₮</span>
      </div>
      <p className="mt-3 text-[11px] leading-5 text-[color:var(--text-3)]">
        Тооцоолол нь урьдчилсан, банкны эцсийн зөвшөөрөл/нөхцөлөөс хамаарч өөрчлөгдөнө.
      </p>
      <MortgageActions listing={listing} bankId={bankId} />
    </>
  );
}

function MortgageActions({ listing, bankId }: { listing: Listing; bankId: string }) {
  const openModal = useStore((s) => s.openModal);
  return (
    <div className="mt-3 grid grid-cols-2 gap-2">
      <button
        type="button"
        onClick={() => openModal(<LoanCompareModal listing={listing} />, "lg")}
        className="bm-btn-outline justify-center !py-2 !text-xs"
      >
        <BarChart3 className="size-3.5" />
        Банк харьцуул
      </button>
      <button
        type="button"
        onClick={() =>
          openModal(<LoanApplyModal listing={listing} bankId={bankId} />, "md")
        }
        className="bm-btn-gold justify-center !py-2 !text-xs"
      >
        <Send className="size-3.5" />
        Хүсэлт явуул
      </button>
    </div>
  );
}

function RangeRow({
  label,
  value,
  min,
  max,
  step,
  current,
  hint,
  onChange,
}: {
  label: string;
  value: string;
  min: number;
  max: number;
  step: number;
  current: number;
  hint?: string;
  onChange: (value: number) => void;
}) {
  return (
    <div className="mb-3">
      <div className="mb-1 flex items-center justify-between">
        <span className="text-[11px] text-[color:var(--text-3)]">{label}</span>
        <span className="num text-xs font-semibold">{value}</span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        step={step}
        value={current}
        onChange={(event) => onChange(Number(event.target.value))}
        className="w-full accent-[var(--gold-brand)]"
      />
      {hint ? <div className="mt-0.5 text-[10px] text-[color:var(--text-3)]">{hint}</div> : null}
    </div>
  );
}

function MortgageRow({
  label,
  value,
  style,
}: {
  label: string;
  value: string;
  style?: CSSProperties;
}) {
  return (
    <div className="bm-mortgage-row">
      <span className="k">{label}</span>
      <span className="v num" style={style}>{value}</span>
    </div>
  );
}

function RentTerms({ listing, detail }: { listing: Listing; detail: ListingDetail }) {
  const schedules = detail.payment.rentSchedule?.slice(0, 3) ?? [];
  return (
    <div>
      <MortgageRow label="Сарын түрээс" value={listingPrice(listing)} />
      <MortgageRow label="Барьцаа" value={fmtCompact(detail.payment.rentDeposit ?? listing.price)} />
      <MortgageRow label="Доод хугацаа" value={`${detail.pricing.rentMinMonths ?? 12} сар`} />
      <div className="bm-mortgage-monthly">
        <span className="k">Эхний төлөлт</span>
        <span className="v num">{fmtCompact((detail.payment.rentDeposit ?? listing.price) + listing.price)}</span>
      </div>
      {schedules.length ? (
        <div className="mt-3 space-y-2">
          {schedules.map((schedule) => (
            <div key={schedule.months} className="rounded-lg border border-[color:var(--border)] bg-[color:var(--surface-2)] px-3 py-2 text-xs">
              <div className="flex justify-between gap-3">
                <span>{schedule.months} сар</span>
                <span className="num font-semibold">{schedule.total.toLocaleString("en-US")} ₮</span>
              </div>
            </div>
          ))}
        </div>
      ) : null}
      <button type="button" className="bm-btn-gold mt-3 w-full justify-center !py-2 !text-xs">
        <Banknote className="size-3.5" />
        Түрээсийн хүсэлт явуулах
      </button>
    </div>
  );
}
