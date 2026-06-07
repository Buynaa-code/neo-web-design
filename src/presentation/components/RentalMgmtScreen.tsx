"use client";

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
  MoreHorizontal,
  Pencil,
  Plus,
  Receipt,
  UserPlus,
  Users,
  Wrench,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { LISTINGS, getListing, photoUrl } from "@/infrastructure/data/listings";
import { listingPriceShort, fmtCompact } from "@/infrastructure/data/formatters";
import {
  RM_CONTRACTS,
  RM_INCOME_MONTHS,
  RM_TENANTS,
  type RmTenant,
} from "@/infrastructure/data/rental-mgmt";
import { cn } from "@/lib/utils";

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
        <StatCard icon={HomeIcon} label="Идэвхтэй зар" value="3" sub="Сүүлийн 30 хоног" tone="primary" />
        <StatCard icon={Users} label="Түрээслэгч" value="3" sub="Гэрээтэй" tone="success" />
        <StatCard icon={Banknote} label="Энэ сарын орлого" value="7.65сая ₮" sub="+12.5%" tone="gold" />
        <StatCard icon={AlertCircle} label="Анхаарах" value="2" sub="Хугацаа дуусаж байна" tone="warning" />
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
            {RM_TENANTS.map((t) => {
              const l = getListing(t.listingId);
              if (!l) return null;
              const col =
                t.status === "good" ? "success" : t.status === "pending" ? "warning" : "danger";
              const label =
                t.status === "good"
                  ? "Төлсөн"
                  : t.status === "pending"
                    ? "Хүлээгдэж буй"
                    : "Хугацаа хэтэрсэн";
              return (
                <div key={t.id} className="flex items-start gap-2 text-sm">
                  <span
                    className="w-2 h-2 rounded-full mt-1.5 shrink-0"
                    style={{ background: `var(--${col})` }}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-xs">{l.khotkhon}</div>
                    <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                      {label} · {t.paidUntil}
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
  const my = LISTINGS.filter((l) => l.mode === "rent").slice(0, 5);
  return (
    <div className="grid lg:grid-cols-3 gap-4">
      {my.map((l) => {
        const tenant = RM_TENANTS.find((t) => t.listingId === l.id);
        return (
          <div key={l.id} className="card overflow-hidden">
            <div
              className="aspect-[16/10] bg-cover bg-center"
              style={{ backgroundImage: `url('${photoUrl(l, 0, "600/400")}')` }}
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
  return (
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
          {RM_TENANTS.map((t) => {
            const l = getListing(t.listingId);
            if (!l) return null;
            const col: "success" | "warning" | "danger" =
              t.status === "good" ? "success" : t.status === "pending" ? "warning" : "danger";
            const label =
              t.status === "good"
                ? "Идэвхтэй"
                : t.status === "pending"
                  ? "Төлбөр хүлээж буй"
                  : "Хугацаа хэтэрсэн";
            return <TenantRow key={t.id} t={t} listingName={l.khotkhon} col={col} label={label} />;
          })}
        </tbody>
      </table>
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
  t: RmTenant;
  listingName: string;
  col: "success" | "warning" | "danger";
  label: string;
}) {
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
      <td className="p-3 text-xs">{t.since}</td>
      <td className="p-3 text-right num text-xs font-semibold">
        {t.monthly.toLocaleString("en-US")}₮
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
        <button type="button" className="btn btn-ghost !text-xs !py-1.5" aria-label="More">
          <MoreHorizontal className="w-3.5 h-3.5" />
        </button>
      </td>
    </tr>
  );
}

function Contracts() {
  return (
    <div className="space-y-3">
      {RM_CONTRACTS.map((c) => {
        const l = getListing(c.listingId);
        if (!l) return null;
        const expiring = c.status === "expiring";
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
                {l.khotkhon} — {c.tenant}
              </div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-3)" }}>
                {c.from} → {c.to} · Депозит {fmtCompact(c.deposit)}
              </div>
              <div className="flex items-center gap-2 mt-1.5">
                <span className={cn("pill", expiring ? "pill-hot" : "pill-new")}>
                  {expiring ? "Хугацаа дуусахад ойртсон" : "Идэвхтэй"}
                </span>
                <span className="num text-[11px]" style={{ color: "var(--text-2)" }}>
                  {c.monthly.toLocaleString("en-US")}₮/сар
                </span>
              </div>
            </div>
            <div className="flex gap-1.5">
              <button type="button" className="btn btn-secondary !text-xs !py-2">
                <Download className="w-3.5 h-3.5" /> PDF
              </button>
              <button type="button" className="btn btn-ghost !text-xs !py-2" aria-label="Edit">
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
      >
        <Plus className="w-4 h-4" /> Шинэ гэрээ үүсгэх
      </button>
    </div>
  );
}

function Income() {
  const max = Math.max(...RM_INCOME_MONTHS.map((m) => m.amount));
  const total = RM_INCOME_MONTHS.reduce((s, m) => s + m.amount, 0);
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
          {RM_INCOME_MONTHS.map((m) => {
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
          {RM_TENANTS.map((t) => {
            const l = getListing(t.listingId);
            if (!l) return null;
            const col =
              t.status === "good" ? "success" : t.status === "pending" ? "warning" : "danger";
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
                    {l.khotkhon} — {t.name}
                  </div>
                  <div className="text-[11px]" style={{ color: "var(--text-3)" }}>
                    {t.paidUntil} хүртэл
                  </div>
                </div>
                <div className="num text-sm font-semibold">
                  {t.monthly.toLocaleString("en-US")}₮
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </>
  );
}
