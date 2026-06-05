"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTheme } from "next-themes";
import {
  Bell,
  CalendarCheck,
  Heart,
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
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Нүүр", match: ["/"] },
  { href: "/results?mode=sale", label: "Худалдах", match: ["/results"], setMode: "sale" as const },
  { href: "/results?mode=rent", label: "Түрээслүүлэх", match: ["/results"], setMode: "rent" as const },
  { href: "/results?cat=project", label: "Төслүүд", match: ["/results"] },
];

const SECONDARY_ITEMS = [
  { href: "/news", label: "Мэдээ", icon: Newspaper },
  { href: "/rental-mgmt", label: "Менежмент", icon: LayoutDashboard },
];

export function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const setMode = useStore((s) => s.setMode);
  const openPlacePicker = useStore((s) => s.openPlacePicker);
  const currentUser = useStore((s) => s.currentUser);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const userInterestsList = useStore((s) => s.userInterestsList);

  const [mounted, setMounted] = useState(false);
  const { theme, setTheme } = useTheme();
  useEffect(() => setMounted(true), []);

  const isActive = (paths: string[]) => paths.some((p) => pathname === p);

  return (
    <header id="topbar" className="header-sticky">
      <div className="max-w-7xl mx-auto px-4 lg:px-8 h-16 lg:h-[72px] flex items-center gap-6">
        <Link href="/" className="flex items-center">
          <Image
            src="/images/logo/horizontal-light.png"
            alt="NEOMAP"
            width={120}
            height={40}
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

        <nav className="hidden lg:flex items-center gap-1 ml-auto text-[14px]">
          {NAV_ITEMS.map((item) => (
            <button
              key={item.label}
              type="button"
              onClick={() => {
                if (item.setMode) setMode(item.setMode);
                router.push(item.href);
              }}
              className={cn("bm-nav", isActive(item.match) && "active")}
            >
              {item.label}
            </button>
          ))}
        </nav>

        <div className="bm-nav-secondary !hidden 2xl:!flex">
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
          <Link href="/list-property" className="bm-nav-sec cta">
            <Plus className="w-3.5 h-3.5" />
            Зар оруулах
          </Link>
          <Link href="/interests" className="bm-nav-sec taste" title="Миний хүсэлд тохирсон зар">
            <Sparkles className="w-3.5 h-3.5" />
            Миний хүсэл
            {userInterestsList.length > 0 && (
              <span className="taste-badge new">!</span>
            )}
          </Link>
        </div>

        <div className="flex items-center gap-2 ml-auto lg:ml-0">
          <button
            id="theme-toggle"
            type="button"
            onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            title="Light / Dark mode"
            aria-label="Theme"
            className="inline-flex items-center justify-center w-9 h-9 rounded-lg transition"
            style={{ color: "var(--text-2)", border: "1px solid var(--border)" }}
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
            className="hidden md:inline-flex 2xl:hidden items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition"
            style={{ color: "var(--text-2)" }}
          >
            <MapPin className="w-4 h-4" />
          </button>

          <Link
            href="/saved"
            className={cn(
              "hidden md:inline-flex items-center gap-1.5 text-sm font-medium px-3 py-2 rounded-lg transition",
              pathname === "/saved" && "text-(--primary)"
            )}
            style={{ color: "var(--text-2)" }}
          >
            <Heart className="w-4 h-4" />
            <span className="hidden 2xl:inline">Хадгалагдсан</span>
          </Link>

          <HeaderAuthSlot isLoggedIn={isLoggedIn} userName={currentUser?.name} />
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
        className="inline-flex items-center gap-1.5 text-sm font-semibold px-3 py-2 rounded-lg transition"
        style={{ background: "var(--primary)", color: "#fff" }}
      >
        <User className="w-4 h-4" />
        <span>Нэвтрэх</span>
      </Link>
    );
  }
  return (
    <Link
      href="/profile"
      className="inline-flex items-center gap-2 text-sm font-semibold px-3 py-2 rounded-lg transition"
      style={{ color: "var(--text)", border: "1px solid var(--border)" }}
    >
      <User className="w-4 h-4" />
      <span className="hidden md:inline">{userName ?? "Профайл"}</span>
    </Link>
  );
}

export function BottomTab() {
  const pathname = usePathname();
  const items = [
    { href: "/", label: "Хайх", icon: Search },
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
          className={cn(pathname === href && "active")}
        >
          <Icon className="w-5 h-5" />
          <span>{label}</span>
        </Link>
      ))}
    </nav>
  );
}
