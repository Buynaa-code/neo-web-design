"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  Building2,
  CalendarCheck,
  Heart,
  Home,
  KeyRound,
  LayoutDashboard,
  MapPin,
  Moon,
  Newspaper,
  Plus,
  Search,
  Sparkles,
  Sun,
  User,
} from "lucide-react";
import { useEffect, useState } from "react";
import { useStore } from "@/infrastructure/store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Нүүр", icon: Home, match: ["/"] },
  { href: "/results?mode=sale", label: "Худалдах", icon: Building2, match: ["/results"], setMode: "sale" as const, mode: "sale" },
  { href: "/results?mode=rent", label: "Түрээслүүлэх", icon: KeyRound, match: ["/results"], setMode: "rent" as const, mode: "rent" },
  { href: "/results?cat=project", label: "Төслүүд", icon: LayoutDashboard, match: ["/results"], cat: "project" },
  { href: "/news", label: "Мэдээ", icon: Newspaper, match: ["/news"], optional: true },
  { href: "/rental-mgmt", label: "Менежмент", icon: LayoutDashboard, match: ["/rental-mgmt"], optional: true },
];

const SECONDARY_ITEMS: { href: string; label: string; icon: typeof Newspaper }[] = [];

export function Header() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const setMode = useStore((s) => s.setMode);
  const openPlacePicker = useStore((s) => s.openPlacePicker);
  const currentUser = useStore((s) => s.currentUser);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const userInterestsList = useStore((s) => s.userInterestsList);

  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  const isActive = (item: (typeof NAV_ITEMS)[number]) => {
    if (!item.match.some((p) => pathname === p)) return false;
    if (pathname !== "/results") return true;
    if ("mode" in item && item.mode) return searchParams.get("mode") === item.mode;
    if ("cat" in item && item.cat) return searchParams.get("cat") === item.cat;
    return false;
  };

  return (
    <header id="topbar" className="header-sticky">
      <div className="header-inner max-w-7xl mx-auto px-4 lg:px-8">
        <Link href="/" className="header-logo-link" aria-label="NEOMAP нүүр хуудас">
          <Image
            src="/images/logo/horizontal-light.png"
            alt="NEOMAP"
            width={120}
            height={40}
            priority
            className="neo-logo neo-logo-light shrink-0"
          />
          <Image
            src="/images/logo/horizontal-dark.png"
            alt="NEOMAP"
            width={120}
            height={40}
            className="neo-logo neo-logo-dark shrink-0"
          />
        </Link>

        <nav className="header-primary-nav hidden md:flex" aria-label="Үндсэн цэс">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const active = mounted && isActive(item);
            return (
              <button
                key={item.label}
                type="button"
                onClick={() => {
                  if (item.setMode) setMode(item.setMode);
                  router.push(item.href);
                }}
                className={cn(
                  "bm-nav",
                  item.optional && "header-nav-optional",
                  active && "active"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="header-nav-icon" />
                {item.label}
              </button>
            );
          })}
        </nav>

        <div className="bm-nav-secondary hidden 2xl:flex">
          <button
            type="button"
            onClick={() =>
              openPlacePicker({ kind: "home", label: "Гэр" })
            }
            className="bm-nav-sec"
            title="Гэр / Ажил / Сургууль / Цэцэрлэгийн байршил нэмэх"
          >
            <MapPin className="w-3.5 h-3.5" />
            Байршил нэмэх
          </button>
          {SECONDARY_ITEMS.map(({ href, label, icon: Icon }) => (
            <Link key={href} href={href} className="bm-nav-sec">
              <Icon className="w-3.5 h-3.5" />
              {label}
            </Link>
          ))}
          <Link
            href="/list-property"
            className={cn("bm-nav-sec cta", mounted && pathname === "/list-property" && "active")}
            aria-current={mounted && pathname === "/list-property" ? "page" : undefined}
          >
            <Plus className="w-3.5 h-3.5" />
            Зар оруулах
          </Link>
          <Link
            href="/interests"
            className={cn("bm-nav-sec taste", mounted && pathname === "/interests" && "active")}
            title="Миний хүсэлд тохирсон зар"
            aria-current={mounted && pathname === "/interests" ? "page" : undefined}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Миний хүсэл
            {mounted && userInterestsList.length > 0 && (
              <span className="taste-badge new">!</span>
            )}
          </Link>
        </div>

        <div className="header-utility">
          <button
            id="theme-toggle"
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Light / Dark mode"
            aria-label="Theme"
            className="header-icon-btn"
          >
            {mounted && theme === "dark" ? (
              <Sun className="w-4 h-4" />
            ) : (
              <Moon className="w-4 h-4" />
            )}
          </button>

          <button
            type="button"
            onClick={() => openPlacePicker({ kind: "home", label: "Гэр" })}
            className="header-icon-btn hidden md:inline-flex 2xl:hidden"
            aria-label="Байршил нэмэх"
          >
            <MapPin className="w-4 h-4" />
          </button>

          <Link
            href="/list-property"
            className={cn(
              "header-icon-btn header-quick-cta 2xl:hidden",
              mounted && pathname === "/list-property" && "active"
            )}
            title="Зар оруулах"
            aria-label="Зар оруулах"
            aria-current={mounted && pathname === "/list-property" ? "page" : undefined}
          >
            <Plus className="w-4 h-4" />
          </Link>

          <Link
            href="/interests"
            className={cn(
              "header-icon-btn hidden md:inline-flex 2xl:hidden",
              mounted && pathname === "/interests" && "active"
            )}
            title="Миний хүсэл"
            aria-label="Миний хүсэл"
            aria-current={mounted && pathname === "/interests" ? "page" : undefined}
          >
            <Sparkles className="w-4 h-4" />
          </Link>

          <Link
            href="/saved"
            className={cn(
              "header-saved-link hidden md:inline-flex",
              mounted && pathname === "/saved" && "active"
            )}
            aria-current={mounted && pathname === "/saved" ? "page" : undefined}
          >
            <Heart className="w-4 h-4" />
            <span className="hidden 2xl:inline">Хадгалагдсан</span>
          </Link>

          <HeaderAuthSlot isLoggedIn={mounted && isLoggedIn} userName={currentUser?.name} />
        </div>
      </div>
    </header>
  );
}

function HeaderAuthSlot({
  isLoggedIn,
  userName,
}: {
  isLoggedIn: boolean;
  userName?: string;
}) {
  if (!isLoggedIn) {
    return (
      <Link
        href="/auth"
        className="header-auth-link"
      >
        <User className="w-4 h-4" />
        <span>Нэвтрэх</span>
      </Link>
    );
  }
  return (
    <Link
      href="/profile"
      className="header-profile-link"
    >
      <User className="w-4 h-4" />
      <span className="hidden md:inline">{userName ?? "Профайл"}</span>
    </Link>
  );
}

export function BottomTab() {
  const pathname = usePathname();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const items = [
    { href: "/", label: "Хайх", icon: Search },
    { href: "/interests", label: "Хүсэл", icon: Sparkles },
    { href: "/saved", label: "Хадгалсан", icon: Heart },
    { href: "/activity", label: "Үзэлт", icon: CalendarCheck },
    { href: "/alerts", label: "Мэдэгдэл", icon: Bell },
    { href: "/profile", label: "Профайл", icon: User },
  ];
  return (
    <nav className="bottom-tab" id="bottom-tab">
      {items.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className={cn(mounted && pathname === href && "active")}
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
