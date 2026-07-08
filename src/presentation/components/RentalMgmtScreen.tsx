"use client";

import { useState } from "react";
import type { ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  AlertTriangle,
  Banknote,
  BarChart3,
  Building2,
  Download,
  Eye,
  FileText,
  Home as HomeIcon,
  LayoutDashboard,
  MessageSquare,
  Pencil,
  Plus,
  Receipt,
  Trash2,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { LISTINGS, getListing, photoUrl } from "@/infrastructure/data/listings";
import { listingPriceShort } from "@/infrastructure/data/formatters";
import { RM_INCOME_MONTHS } from "@/infrastructure/data/rental-mgmt";
import {
  useRentalContracts,
  useRentalIncome,
  useRentalMutations,
  useRentalTenants,
} from "@/application/queries/rental";
import type {
  ContractInput,
  TenantInput,
} from "@/infrastructure/api/rental";
import type {
  RentalContract,
  RentalTenant,
} from "@/domain/schemas/api";
import { ApiError } from "@/infrastructure/api/http";
import { cn } from "@/lib/utils";

/** Compact MNT amount, e.g. 7650000 → "7.65сая ₮", 0 → "0₮". */
function formatTugrikShort(amount: number): string {
  if (!amount) return "0₮";
  if (amount >= 1_000_000) {
    const m = amount / 1_000_000;
    return `${m.toFixed(2).replace(/\.?0+$/, "")}сая ₮`;
  }
  return `${amount.toLocaleString("en-US")}₮`;
}

/** First server-side validation message, if the error is an ApiError. */
function firstApiError(err: unknown, fallback: string): string {
  if (err instanceof ApiError) {
    const first = Object.values(err.validationErrors ?? {})[0]?.[0];
    return first ?? err.message ?? fallback;
  }
  return err instanceof Error ? err.message : fallback;
}

type TenantTone = "success" | "warning" | "danger";

/** Map free-form API tenant status onto the existing UI tone + label. */
function tenantTone(status: string): TenantTone {
  const s = status.toLowerCase();
  if (s === "active" || s === "good" || s === "paid") return "success";
  if (s === "pending") return "warning";
  return "danger";
}
function tenantLabel(status: string): string {
  switch (tenantTone(status)) {
    case "success":
      return "Идэвхтэй";
    case "warning":
      return "Төлбөр хүлээж буй";
    default:
      return "Хугацаа хэтэрсэн";
  }
}
function tenantPayLabel(status: string): string {
  switch (tenantTone(status)) {
    case "success":
      return "Төлсөн";
    case "warning":
      return "Хүлээгдэж буй";
    default:
      return "Хугацаа хэтэрсэн";
  }
}
const fmtMnt = (n: number | null | undefined) =>
  (n ?? 0).toLocaleString("en-US") + "₮";
const fmtDate = (d: string | null | undefined) => d ?? "—";

/**
 * Coerce the free-form income aggregate into the chart's
 * { month, amount }[] shape; fall back to the seed if unusable.
 */
function toIncomeMonths(
  raw: unknown
): { month: string; amount: number }[] {
  const out: { month: string; amount: number }[] = [];
  const push = (month: unknown, amount: unknown) => {
    const a =
      typeof amount === "number"
        ? amount
        : typeof amount === "string"
          ? Number(amount)
          : NaN;
    if (Number.isFinite(a)) out.push({ month: String(month), amount: a });
  };
  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (item && typeof item === "object") {
        const o = item as Record<string, unknown>;
        push(o.month ?? o.label ?? o.name, o.amount ?? o.total ?? o.value);
      }
    }
  } else if (raw && typeof raw === "object") {
    for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
      push(k, typeof v === "object" && v ? (v as Record<string, unknown>).amount ?? (v as Record<string, unknown>).total : v);
    }
  }
  return out.length ? out : RM_INCOME_MONTHS;
}

type Tab = "overview" | "properties" | "tenants" | "contracts" | "income";

const TABS: { key: Tab; label: string; icon: LucideIcon }[] = [
  { key: "overview", label: "Тойм", icon: LayoutDashboard },
  { key: "properties", label: "Зарууд", icon: Building2 },
  { key: "tenants", label: "Түрээслэгчид", icon: Users },
  { key: "contracts", label: "Гэрээ", icon: FileText },
  { key: "income", label: "Орлого", icon: Banknote },
];

export function RentalMgmtScreen() {
  const router = useRouter();
  const tab = useStore((s) => s.rentalMgmtTab);
  // Subscribe so child tabs re-render (re-running LISTINGS/getListing) when real data arrives.
  useStore((s) => s.listingsVersion);
  const setRentalTab = (k: Tab) => useStore.setState({ rentalMgmtTab: k });

  return (
    <div className="max-w-6xl mx-auto px-4 lg:px-6 py-6">
      <div className="flex items-start justify-between mb-5 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-semibold mb-1">Түрээсийн менежмент</h1>
          <p className="text-sm text-[var(--text-3)]">
            Та түрээслүүлж буй үл хөдлөх хөрөнгөө нэг дороос удирдана
          </p>
        </div>
        <button
          type="button"
          onClick={() => router.push("/list-property")}
          className="btn btn-cta"
        >
          <Plus className="w-4 h-4" /> Шинэ зар
        </button>
      </div>

      <div
        className="flex items-center gap-1 mb-5 p-1 rounded-lg overflow-x-auto w-fit"
        style={{ background: "var(--surface-2)", border: "1px solid var(--border)" }}
      >
        {TABS.map((t) => (
          <button
            key={t.key}
            type="button"
            onClick={() => setRentalTab(t.key)}
            className={cn(
              "px-3 py-2 rounded-md text-sm font-medium transition whitespace-nowrap"
            )}
            style={
              tab === t.key
                ? {
                    background: "var(--surface)",
                    color: "var(--text)",
                    boxShadow: "var(--shadow-sm)",
                  }
                : { color: "var(--text-2)" }
            }
          >
            <span className="inline-flex items-center gap-1">
              <t.icon className="w-3.5 h-3.5" />
              {t.label}
            </span>
          </button>
        ))}
      </div>

      {tab === "overview" && <Overview onTab={setRentalTab} />}
      {tab === "properties" && <Properties />}
      {tab === "tenants" && <Tenants />}
      {tab === "contracts" && <Contracts />}
      {tab === "income" && <Income />}
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  tone,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  sub: string;
  tone: "primary" | "success" | "warning" | "gold";
}) {
  const toneVar =
    tone === "success"
      ? "var(--success)"
      : tone === "warning"
        ? "var(--warning)"
        : tone === "gold"
          ? "var(--gold)"
          : "var(--text-3)";
  return (
    <div className="card p-4">
      <div className="flex items-center justify-between mb-2">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center"
          style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
        >
          <Icon className="w-4 h-4" />
        </div>
      </div>
      <div className="num text-2xl font-semibold">{value}</div>
      <div className="text-xs text-[var(--text-3)] mt-0.5">{label}</div>
      <div className="text-[11px] mt-1" style={{ color: toneVar }}>
        {sub}
      </div>
    </div>
  );
}

function Overview({ onTab }: { onTab: (t: Tab) => void }) {
  const pushToast = useStore((s) => s.pushToast);
  const { data: tenants = [] } = useRentalTenants();
  const { data: contracts = [] } = useRentalContracts();

  // Real KPIs derived from the live tenant/contract data.
  const activeTenants = tenants.filter((t) => t.status === "active");
  const rentedListings = new Set(
    tenants.map((t) => t.listingId).filter((id): id is number => id != null)
  ).size;
  const monthlyIncome = activeTenants.reduce((sum, t) => sum + (t.rentAmount ?? 0), 0);
  const attention =
    tenants.filter((t) => t.status === "pending").length +
    contracts.filter((c) => c.status === "draft").length;

  const events: { icon: LucideIcon; t: string; sub: string; d: string; col: string }[] = [
    { icon: Banknote, t: "Бат-Эрдэнэ — 5-р сарын түрээс төлсөн", sub: "+1,800,000₮", d: "өнөөдөр", col: "success" },
    { icon: UserPlus, t: "Сараа — гэрээ шинэчиллээ", sub: "12 сар", d: "өчигдөр", col: "primary" },
    { icon: AlertTriangle, t: "Тэмүүлэн — төлбөр хугацаа хэтэрлээ", sub: "-1,100,000₮", d: "3 хоног", col: "danger" },
    { icon: Eye, t: "Encanto 12/16 — 24 шинэ үзэлт", sub: "+24", d: "7 хоног", col: "text-2" },
  ];
  const quick: { icon: LucideIcon; label: string; tab?: Tab }[] = [
    { icon: FileText, label: "Гэрээ үүсгэх", tab: "contracts" },
    { icon: Receipt, label: "Тооцоо/нэхэмжлэх", tab: "income" },
    { icon: Wrench, label: "Засвар үйлчилгээ" },
    { icon: MessageSquare, label: "Түрээслэгчтэй холбоо", tab: "tenants" },
  ];

  return (
    <>
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        <StatCard icon={HomeIcon} label="Түрээслэгдсэн зар" value={String(rentedListings)} sub="Түрээслэгчтэй" tone="primary" />
        <StatCard icon={Users} label="Түрээслэгч" value={String(tenants.length)} sub={`${activeTenants.length} идэвхтэй`} tone="success" />
        <StatCard icon={Banknote} label="Сарын орлого" value={formatTugrikShort(monthlyIncome)} sub={`${activeTenants.length} идэвхтэй гэрээ`} tone="gold" />
        <StatCard icon={AlertCircle} label="Анхаарах" value={String(attention)} sub="Хүлээгдэж буй / ноорог" tone="warning" />
      </div>

      <div className="grid lg:grid-cols-3 gap-4">
        <div className="card p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <div className="font-semibold">Сүүлийн үйл явдал</div>
            <button
              type="button"
              onClick={() => onTab("income")}
              className="text-xs"
              style={{ color: "var(--gold-brand)" }}
            >
              Орлогын дэлгэрэнгүй
            </button>
          </div>
          <div className="space-y-3">
            {events.map((e, i) => {
              const col =
                e.col === "text-2"
                  ? "var(--text-2)"
                  : `var(--${e.col})`;
              return (
                <div key={i} className="flex items-center gap-3">
                  <div
                    className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                    style={{ background: "var(--surface-2)", color: col }}
                  >
                    <e.icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{e.t}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {e.d}
                    </div>
                  </div>
                  <div
                    className="num text-sm font-semibold whitespace-nowrap"
                    style={{ color: col }}
                  >
                    {e.sub}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5">
          <div className="font-semibold mb-3">Төлбөрийн төлөв</div>
          <div className="space-y-3">
            {tenants.length === 0 && (
              <div className="text-xs" style={{ color: "var(--text-3)" }}>
                Түрээслэгч алга
              </div>
            )}
            {tenants.map((t) => {
              const l = t.listingId != null ? getListing(t.listingId) : undefined;
              const col = tenantTone(t.status);
              const label = tenantPayLabel(t.status);
              return (
                <div key={t.id} className="flex items-start gap-2 text-sm">
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: `var(--${col})` }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-xs">{l?.khotkhon ?? t.name}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {label} · {fmtDate(t.leaseEnd)}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="card p-5 lg:col-span-3">
          <div className="font-semibold mb-3">Хурдан үйлдэл</div>
          <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-2">
            {quick.map((q) => (
              <button
                key={q.label}
                type="button"
                onClick={() => (q.tab ? onTab(q.tab) : pushToast("Удахгүй", "info"))}
                className="card p-3 text-left flex items-center gap-2 hover:border-[var(--gold-brand)]"
              >
                <q.icon className="w-4 h-4" style={{ color: "var(--gold-brand)" }} />
                <span className="text-sm">{q.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>
    </>
  );
}

function Properties() {
  const { data: tenants = [] } = useRentalTenants();
  const my = LISTINGS.filter((l) => l.mode === "rent").slice(0, 5);
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {my.map((l) => {
        const tenant = tenants.find((t) => t.listingId === l.id);
        return (
          <div key={l.id} className="card overflow-hidden">
            <div
              className={cn("aspect-[16/10] bg-cover bg-center", !photoUrl(l, 0) && "bg-muted")}
              style={photoUrl(l, 0) ? { backgroundImage: `url('${photoUrl(l, 0)}')` } : undefined}
            />
            <div className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <div className="font-semibold text-sm">{l.khotkhon}</div>
                  <div className="text-xs text-[var(--text-3)]">
                    {l.district} · {l.rooms}ө {l.area}м²
                  </div>
                </div>
                <span className={cn("pill", tenant ? "pill-new" : "pill-gold")}>
                  {tenant ? "Түрээслэгчтэй" : "Сул"}
                </span>
              </div>
              <div
                className="num text-sm font-semibold mb-2"
                style={{ color: "var(--gold-brand)" }}
              >
                {listingPriceShort(l)}
              </div>
              {tenant && (
                <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  Түрээслэгч: {tenant.name}
                </div>
              )}
              <div className="flex gap-1.5 mt-3">
                <Link
                  href={`/property/${l.id}`}
                  className="btn btn-secondary !text-xs !py-1.5 flex-1"
                >
                  Зар харах
                </Link>
                <button type="button" className="btn btn-ghost !text-xs !py-1.5" aria-label="Засах">
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button type="button" className="btn btn-ghost !text-xs !py-1.5" aria-label="Stats">
                  <BarChart3 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function Tenants() {
  const { data: tenants = [], isLoading } = useRentalTenants();
  const openModal = useStore((s) => s.openModal);
  return (
    <div className="space-y-3">
      <div className="flex justify-end">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => openModal(<TenantFormModal />, "md")}
        >
          <UserPlus className="w-4 h-4" /> Түрээслэгч нэмэх
        </button>
      </div>
      <div className="card overflow-hidden">
      <table className="w-full text-sm">
        <thead style={{ background: "var(--surface-2)" }}>
          <tr>
            <Th>Түрээслэгч</Th>
            <Th>Объект</Th>
            <Th>Эхэлсэн</Th>
            <Th align="right">Сарын түрээс</Th>
            <Th>Төлөв</Th>
            <th className="p-3" />
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => {
            const l = t.listingId != null ? getListing(t.listingId) : undefined;
            const col = tenantTone(t.status);
            const label = tenantLabel(t.status);
            return (
              <TenantRow
                key={t.id}
                t={t}
                listingName={l?.khotkhon ?? "—"}
                col={col}
                label={label}
              />
            );
          })}
          {!isLoading && tenants.length === 0 && (
            <tr style={{ borderTop: "1px solid var(--border)" }}>
              <td className="p-4 text-xs" style={{ color: "var(--text-3)" }} colSpan={6}>
                Түрээслэгч алга
              </td>
            </tr>
          )}
        </tbody>
      </table>
      </div>
    </div>
  );
}

function Th({ children, align = "left" }: { children: React.ReactNode; align?: "left" | "right" }) {
  return (
    <th
      className={cn("p-3 text-xs font-semibold", align === "right" ? "text-right" : "text-left")}
      style={{ color: "var(--text-3)" }}
    >
      {children}
    </th>
  );
}

function TenantRow({
  t,
  listingName,
  col,
  label,
}: {
  t: RentalTenant;
  listingName: string;
  col: TenantTone;
  label: string;
}) {
  const openModal = useStore((s) => s.openModal);
  return (
    <tr style={{ borderTop: "1px solid var(--border)" }}>
      <td className="p-3">
        <div className="flex items-center gap-2">
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold text-white"
            style={{ background: "linear-gradient(135deg, var(--navy), var(--navy-deep))" }}
          >
            {t.name.slice(0, 1)}
          </div>
          <div>
            <div className="font-medium text-xs">{t.name}</div>
            <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
              {t.phone}
            </div>
          </div>
        </div>
      </td>
      <td className="p-3 text-xs">{listingName}</td>
      <td className="p-3 text-xs">{fmtDate(t.leaseStart)}</td>
      <td className="p-3 text-right num text-xs font-semibold">
        {fmtMnt(t.rentAmount)}
      </td>
      <td className="p-3">
        <span
          className="pill"
          style={{ background: `color-mix(in srgb, var(--${col}) 18%, transparent)`, color: `var(--${col})` }}
        >
          {label}
        </span>
      </td>
      <td className="p-3 text-right">
        <div className="flex gap-1 justify-end">
          <button
            type="button"
            className="btn btn-ghost !text-xs !py-1.5"
            aria-label="Засах"
            onClick={() => openModal(<TenantFormModal tenant={t} />, "md")}
          >
            <Pencil className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="btn btn-ghost !text-xs !py-1.5"
            aria-label="Устгах"
            onClick={() => openModal(<DeleteTenantConfirm tenant={t} />, "md")}
          >
            <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--danger)" }} />
          </button>
        </div>
      </td>
    </tr>
  );
}

function Contracts() {
  const { data: contracts = [] } = useRentalContracts();
  const { data: tenants = [] } = useRentalTenants();
  const openModal = useStore((s) => s.openModal);
  const tenantName = (id: number) =>
    tenants.find((t) => t.id === id)?.name ?? `#${id}`;
  return (
    <div className="space-y-3">
      {contracts.map((c: RentalContract) => {
        const l = c.listingId != null ? getListing(c.listingId) : undefined;
        const expiring = c.status.toLowerCase() !== "active";
        return (
          <div
            key={c.id}
            className="card p-4 flex items-center gap-4"
            style={expiring ? { borderColor: "var(--warning)" } : undefined}
          >
            <div
              className="w-12 h-12 rounded-lg flex items-center justify-center shrink-0"
              style={{ background: "var(--primary-soft)", color: "var(--primary)" }}
            >
              <FileText className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="font-semibold text-sm">
                {(l?.khotkhon ?? "—")} — {tenantName(c.tenantId)}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {fmtDate(c.start)} → {fmtDate(c.end)}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn("pill", expiring ? "pill-hot" : "pill-new")}>
                  {expiring ? "Хугацаа дуусахад ойртсон" : "Идэвхтэй"}
                </span>
                <span className="num text-[11px]" style={{ color: "var(--text-2)" }}>
                  {fmtMnt(c.amount)}/сар
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button type="button" className="btn btn-secondary !text-xs !py-2">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button
                type="button"
                className="btn btn-ghost !text-xs !py-2"
                aria-label="Edit"
                onClick={() => openModal(<ContractFormModal contract={c} />, "md")}
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        className="card p-4 w-full flex items-center justify-center gap-2 text-sm hover:border-[var(--gold-brand)]"
        style={{ borderStyle: "dashed" }}
        onClick={() => openModal(<ContractFormModal />, "md")}
      >
        <Plus className="w-4 h-4" /> Шинэ гэрээ үүсгэх
      </button>
    </div>
  );
}

/* ---------------------------------------------------------------- *
 * Form modals (tenant + contract create/edit)                      *
 * ---------------------------------------------------------------- */

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">{label}</div>
      {children}
    </label>
  );
}

function ListingSelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const rentListings = LISTINGS.filter((l) => l.mode === "rent");
  return (
    <select className="input" value={value} onChange={(e) => onChange(e.target.value)}>
      <option value="">— Сонгох —</option>
      {rentListings.map((l) => (
        <option key={l.id} value={l.id}>
          {l.khotkhon} · {l.district}
        </option>
      ))}
    </select>
  );
}

const toIso = (v: string): string | null => (v.trim() ? v : null);
const toInt = (v: string): number | null => {
  const n = parseInt(v.replace(/[^\d-]/g, ""), 10);
  return Number.isFinite(n) ? n : null;
};

function TenantFormModal({ tenant }: { tenant?: RentalTenant }) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const { createTenant, updateTenant } = useRentalMutations();
  const editing = tenant != null;

  const [name, setName] = useState(tenant?.name ?? "");
  const [phone, setPhone] = useState(tenant?.phone ?? "");
  const [listingId, setListingId] = useState(
    tenant?.listingId != null ? String(tenant.listingId) : ""
  );
  const [leaseStart, setLeaseStart] = useState(tenant?.leaseStart ?? "");
  const [leaseEnd, setLeaseEnd] = useState(tenant?.leaseEnd ?? "");
  const [rent, setRent] = useState(
    tenant?.rentAmount != null ? String(tenant.rentAmount) : ""
  );
  const [status, setStatus] = useState<TenantInput["status"]>(
    (["active", "pending", "ended"].includes(tenant?.status ?? "")
      ? tenant!.status
      : "active") as TenantInput["status"]
  );

  const saving = createTenant.isPending || updateTenant.isPending;

  const save = async () => {
    if (!name.trim()) {
      pushToast("Нэр оруулна уу", "danger");
      return;
    }
    const input: TenantInput = {
      name: name.trim(),
      listing_id: listingId ? toInt(listingId) : null,
      phone: toIso(phone),
      lease_start: toIso(leaseStart),
      lease_end: toIso(leaseEnd),
      rent_amount: rent.trim() ? toInt(rent) : null,
      status,
    };
    try {
      if (editing) {
        await updateTenant.mutateAsync({ id: tenant.id, input });
        pushToast("Түрээслэгч шинэчлэгдлээ", "success");
      } else {
        await createTenant.mutateAsync(input);
        pushToast("Түрээслэгч нэмэгдлээ", "success");
      }
      closeModal();
    } catch (err) {
      pushToast(firstApiError(err, "Хадгалахад алдаа гарлаа"), "danger");
    }
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">
          {editing ? "Түрээслэгч засах" : "Түрээслэгч нэмэх"}
        </h3>
      </div>
      <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
        <Field label="Нэр">
          <input
            className="input"
            placeholder="Бат-Эрдэнэ"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
        </Field>
        <Field label="Утас">
          <input
            className="input"
            placeholder="99112233"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </Field>
        <Field label="Объект">
          <ListingSelect value={listingId} onChange={setListingId} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Гэрээ эхэлсэн">
            <input
              type="date"
              className="input"
              value={leaseStart}
              onChange={(e) => setLeaseStart(e.target.value)}
            />
          </Field>
          <Field label="Гэрээ дуусах">
            <input
              type="date"
              className="input"
              value={leaseEnd}
              onChange={(e) => setLeaseEnd(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Сарын түрээс (₮)">
          <input
            type="number"
            className="input num"
            placeholder="1800000"
            value={rent}
            onChange={(e) => setRent(e.target.value)}
          />
        </Field>
        <Field label="Төлөв">
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as TenantInput["status"])}
          >
            <option value="active">Идэвхтэй</option>
            <option value="pending">Төлбөр хүлээж буй</option>
            <option value="ended">Дууссан</option>
          </select>
        </Field>
      </div>
      <div
        className="p-5 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
          Болих
        </button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
    </div>
  );
}

function DeleteTenantConfirm({ tenant }: { tenant: RentalTenant }) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const { removeTenant } = useRentalMutations();
  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Түрээслэгч устгах уу?</h3>
      </div>
      <div className="p-5 text-sm text-[var(--text-2)]">
        {tenant.name}-г устгасны дараа сэргээх боломжгүй.
      </div>
      <div
        className="p-5 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={removeTenant.isPending}>
          Болих
        </button>
        <button
          type="button"
          className="btn"
          style={{ background: "var(--danger)", color: "#fff" }}
          disabled={removeTenant.isPending}
          onClick={async () => {
            try {
              await removeTenant.mutateAsync(tenant.id);
              pushToast("Түрээслэгч устгагдлаа", "danger");
              closeModal();
            } catch (err) {
              pushToast(firstApiError(err, "Устгахад алдаа гарлаа"), "danger");
            }
          }}
        >
          {removeTenant.isPending ? "Устгаж байна…" : "Устгах"}
        </button>
      </div>
    </div>
  );
}

function ContractFormModal({ contract }: { contract?: RentalContract }) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const { createContract, updateContract } = useRentalMutations();
  const { data: tenants = [] } = useRentalTenants();
  const editing = contract != null;

  const [tenantId, setTenantId] = useState(
    contract?.tenantId != null ? String(contract.tenantId) : ""
  );
  const [listingId, setListingId] = useState(
    contract?.listingId != null ? String(contract.listingId) : ""
  );
  const [start, setStart] = useState(contract?.start ?? "");
  const [end, setEnd] = useState(contract?.end ?? "");
  const [amount, setAmount] = useState(
    contract?.amount != null ? String(contract.amount) : ""
  );
  const [status, setStatus] = useState<ContractInput["status"]>(
    (["draft", "active", "ended"].includes(contract?.status ?? "")
      ? contract!.status
      : "active") as ContractInput["status"]
  );

  const saving = createContract.isPending || updateContract.isPending;

  const save = async () => {
    const common = {
      listing_id: listingId ? toInt(listingId) : null,
      start: toIso(start),
      end: toIso(end),
      amount: amount.trim() ? toInt(amount) : null,
      status,
    };
    try {
      if (editing) {
        await updateContract.mutateAsync({ id: contract.id, input: common });
        pushToast("Гэрээ шинэчлэгдлээ", "success");
      } else {
        const tid = toInt(tenantId);
        if (tid == null) {
          pushToast("Түрээслэгч сонгоно уу", "danger");
          return;
        }
        await createContract.mutateAsync({ tenant_id: tid, ...common });
        pushToast("Гэрээ үүслээ", "success");
      }
      closeModal();
    } catch (err) {
      pushToast(firstApiError(err, "Хадгалахад алдаа гарлаа"), "danger");
    }
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">
          {editing ? "Гэрээ засах" : "Гэрээ үүсгэх"}
        </h3>
      </div>
      <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
        <Field label="Түрээслэгч">
          <select
            className="input"
            value={tenantId}
            disabled={editing}
            onChange={(e) => setTenantId(e.target.value)}
          >
            <option value="">— Сонгох —</option>
            {tenants.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name}
              </option>
            ))}
          </select>
        </Field>
        <Field label="Объект">
          <ListingSelect value={listingId} onChange={setListingId} />
        </Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="Эхлэх">
            <input
              type="date"
              className="input"
              value={start}
              onChange={(e) => setStart(e.target.value)}
            />
          </Field>
          <Field label="Дуусах">
            <input
              type="date"
              className="input"
              value={end}
              onChange={(e) => setEnd(e.target.value)}
            />
          </Field>
        </div>
        <Field label="Дүн (₮/сар)">
          <input
            type="number"
            className="input num"
            placeholder="1800000"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </Field>
        <Field label="Төлөв">
          <select
            className="input"
            value={status}
            onChange={(e) => setStatus(e.target.value as ContractInput["status"])}
          >
            <option value="draft">Ноорог</option>
            <option value="active">Идэвхтэй</option>
            <option value="ended">Дууссан</option>
          </select>
        </Field>
      </div>
      <div
        className="p-5 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)" }}
      >
        <button type="button" className="btn btn-secondary" onClick={closeModal} disabled={saving}>
          Болих
        </button>
        <button type="button" className="btn btn-primary" onClick={save} disabled={saving}>
          {saving ? "Хадгалж байна…" : "Хадгалах"}
        </button>
      </div>
    </div>
  );
}

function Income() {
  const { data: incomeRaw } = useRentalIncome();
  const { data: tenants = [] } = useRentalTenants();
  const months = toIncomeMonths(incomeRaw);
  const max = Math.max(1, ...months.map((m) => m.amount));
  const total = months.reduce((s, m) => s + m.amount, 0);
  return (
    <>
      <div className="card p-5 mb-4">
        <div className="flex items-end justify-between mb-4">
          <div>
            <div className="text-xs" style={{ color: "var(--text-3)" }}>
              Сүүлийн 6 сарын нийт орлого
            </div>
            <div className="num text-3xl font-semibold mt-1">
              {total.toLocaleString("en-US")}₮
            </div>
          </div>
          <div className="text-right">
            <div className="text-xs" style={{ color: "var(--text-3)" }}>
              Энэ сар
            </div>
            <div className="num text-lg font-semibold" style={{ color: "var(--success)" }}>
              +12.5%
            </div>
          </div>
        </div>
        <div className="flex items-end gap-2 h-32">
          {months.map((m) => {
            const h = (m.amount / max) * 100;
            return (
              <div key={m.month} className="flex-1 flex flex-col items-center gap-1.5">
                <div className="num text-[10px]" style={{ color: "var(--text-3)" }}>
                  {(m.amount / 1_000_000).toFixed(1)}M
                </div>
                <div
                  className="w-full rounded-t"
                  style={{
                    height: `${h}%`,
                    background:
                      "linear-gradient(180deg, var(--gold-brand), var(--primary-dark))",
                  }}
                />
                <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
                  {m.month}
                </div>
              </div>
            );
          })}
        </div>
      </div>
      <div className="card p-5">
        <div className="font-semibold mb-3">Сүүлийн төлбөрүүд</div>
        <div className="space-y-2">
          {tenants.length === 0 && (
            <div className="text-xs" style={{ color: "var(--text-3)" }}>
              Төлбөр алга
            </div>
          )}
          {tenants.map((t) => {
            const l = t.listingId != null ? getListing(t.listingId) : undefined;
            const col = tenantTone(t.status);
            return (
              <div
                key={t.id}
                className="flex items-center gap-3 p-2 rounded-lg hover:bg-[var(--surface-2)]"
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
                  style={{
                    background: `color-mix(in srgb, var(--${col}) 16%, transparent)`,
                    color: `var(--${col})`,
                  }}
                >
                  <Receipt className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium truncate">
                    {(l?.khotkhon ?? "—")} — {t.name}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {fmtDate(t.leaseEnd)} хүртэл
                  </div>
                </div>
                <div className="num text-sm font-semibold">
                  {fmtMnt(t.rentAmount)}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
