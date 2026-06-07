"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import {
  Bell,
  Building2,
  CalendarCheck,
  CalendarPlus,
  CheckCircle,
  GitCompare,
  Heart,
  Home as HomeIcon,
  LayoutDashboard,
  List,
  LogIn,
  Megaphone,
  Newspaper,
  Settings2,
  Sparkles,
  User,
  X,
  type LucideIcon,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { useTheme } from "next-themes";

interface DemoScreen {
  href: string;
  label: string;
  icon: LucideIcon;
}

const DEMO_SCREENS: DemoScreen[] = [
  { href: "/", label: "Эхлэл", icon: HomeIcon },
  { href: "/results", label: "Хайлтын үр дүн", icon: List },
  { href: "/property/1", label: "Зарын дэлгэрэнгүй", icon: Building2 },
  { href: "/schedule", label: "Үзэлт товлох", icon: CalendarPlus },
  { href: "/confirmation", label: "Баталгаажуулалт", icon: CheckCircle },
  { href: "/activity", label: "Үзэлтүүд", icon: CalendarCheck },
  { href: "/saved", label: "Хадгалсан", icon: Heart },
  { href: "/alerts", label: "Мэдэгдэл", icon: Bell },
  { href: "/auth", label: "Нэвтрэх", icon: LogIn },
  { href: "/profile", label: "Профайл", icon: User },
  { href: "/news", label: "Мэдээ", icon: Newspaper },
  { href: "/rental-mgmt", label: "Менежмент", icon: LayoutDashboard },
  { href: "/list-property", label: "Зар оруулах", icon: Megaphone },
  { href: "/interests", label: "Миний хүсэл", icon: Sparkles },
  { href: "/compare", label: "Харьцуулах", icon: GitCompare },
];

const ACCENTS: Record<string, { name: string; light: string; dark: string }> = {
  navy: { name: "Brand Navy", light: "#123C69", dark: "#0B1F33" },
  gold: { name: "Brand Gold", light: "#C9A227", dark: "#8A6A00" },
  goldDark: { name: "Premium Gold", light: "#D6A84F", dark: "#B8862F" },
  champagne: { name: "Champagne", light: "#E0C68C", dark: "#C9AB6A" },
  bronze: { name: "Bronze", light: "#A8854B", dark: "#8A6D3D" },
};

export function DevTools() {
  const [open, setOpen] = useState<"pill" | "tweaks" | null>(null);
  const [mounted, setMounted] = useState(false);
  const [accent, setAccent] = useState<string>(() => {
    if (typeof window === "undefined") return "navy";
    return localStorage.getItem("neomap.accent") ?? "navy";
  });
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const pushToast = useStore((s) => s.pushToast);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!mounted) return;
    const meta = ACCENTS[accent];
    if (!meta) return;
    const root = document.documentElement.style;
    const isDark = theme === "dark";
    const defaultAccent = isDark ? "goldDark" : "navy";
    if (accent === defaultAccent) {
      root.removeProperty("--primary");
      root.removeProperty("--primary-dark");
    } else {
      root.setProperty("--primary", meta.light);
      root.setProperty("--primary-dark", meta.dark);
    }
    localStorage.setItem("neomap.accent", accent);
  }, [accent, mounted, theme]);

  if (!mounted) return null;

  const isActive = (href: string) =>
    href === "/" ? pathname === "/" : pathname.startsWith(href.split("?")[0]);

  return (
    <>
      <div className="dev-pill" role="navigation" aria-label="Demo navigation">
        {DEMO_SCREENS.map((s) => (
          <button
            key={s.href}
            type="button"
            onClick={() => router.push(s.href)}
            className={`dev-pill-btn${isActive(s.href) ? " active" : ""}`}
            title={s.label}
          >
            <s.icon className="w-4 h-4" />
            <span className="dev-pill-tip">{s.label}</span>
          </button>
        ))}
        <button
          type="button"
          onClick={() => setOpen(open === "tweaks" ? null : "tweaks")}
          className={`dev-pill-btn${open === "tweaks" ? " active" : ""}`}
          title="Tweaks"
        >
          <Settings2 className="w-4 h-4" />
          <span className="dev-pill-tip">Tweaks</span>
        </button>
      </div>

      {open === "tweaks" && (
        <div className="tweaks-panel-react" role="dialog" aria-label="Tweaks">
          <div className="tweaks-head">
            <div>
              <div style={{ fontWeight: 600, fontSize: 14 }}>Tweaks</div>
              <div
                style={{ fontSize: 11, color: "var(--text-3)", marginTop: 2 }}
              >
                Reshape the feel
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(null)}
              className="tweak-close"
              aria-label="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="tweaks-body">
            <div className="tweak-section">
              <div className="tweak-label">Visual mode</div>
              <div className="tweak-radio">
                {(["light", "dark"] as const).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setTheme(t)}
                    className={theme === t ? "active" : undefined}
                  >
                    {t === "light" ? "Light" : "Dark"}
                  </button>
                ))}
              </div>
            </div>

            <div className="tweak-section">
              <div className="tweak-label">Accent</div>
              <div className="tweak-swatches">
                {Object.entries(ACCENTS).map(([key, meta]) => (
                  <button
                    key={key}
                    type="button"
                    onClick={() => setAccent(key)}
                    className={`tweak-swatch${accent === key ? " active" : ""}`}
                    title={meta.name}
                    style={{ background: meta.light }}
                    aria-label={meta.name}
                  />
                ))}
              </div>
            </div>

            <div className="tweak-section">
              <div className="tweak-label">Үйлдлүүд</div>
              <div className="flex flex-col gap-2">
                <button
                  type="button"
                  className="btn btn-secondary !text-xs !py-2"
                  onClick={() => {
                    const root = document.documentElement.style;
                    root.removeProperty("--primary");
                    root.removeProperty("--primary-dark");
                    setAccent(theme === "dark" ? "goldDark" : "navy");
                    pushToast("Анхдагч accent-руу буцаалаа", "info");
                  }}
                >
                  Анхдагч accent
                </button>
                <button
                  type="button"
                  className="btn btn-secondary !text-xs !py-2"
                  onClick={() => {
                    localStorage.clear();
                    pushToast("Local storage цэвэрлэв (refresh хийнэ үү)", "success");
                  }}
                >
                  Local storage цэвэрлэх
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
