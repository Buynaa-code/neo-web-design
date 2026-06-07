"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useRouter } from "next/navigation";
import {
  Banknote,
  BellPlus,
  Building2,
  CalendarCheck,
  Heart,
  Home as HomeIcon,
  List,
  MapPin,
  type LucideIcon,
  Bell,
  Sparkles,
  User,
} from "lucide-react";
import { useStore } from "@/lib/store";
import { LISTINGS } from "@/data/listings";
import { listingPriceShort } from "@/data/formatters";
import { DISTRICTS } from "@/data/constants";
import type { ListingMode } from "@/lib/types";

type Item =
  | { type: "screen"; key: string; label: string; icon: LucideIcon; href: string }
  | { type: "action"; key: string; label: string; icon: LucideIcon; run: () => void }
  | { type: "listing"; key: number; label: string; sub: string; icon: LucideIcon; href: string }
  | { type: "district"; key: string; label: string; icon: LucideIcon; districtName: string };

interface Group {
  title: string;
  items: Item[];
}

export function CmdPalette() {
  const router = useRouter();
  const setMode = useStore((s) => s.setMode);
  const setFilterDistrict = useStore((s) => s.setFilterDistrict);
  const pushToast = useStore((s) => s.pushToast);

  const [open, setOpen] = useState(false);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState(0);
  const [mounted, setMounted] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setOpen(true);
      } else if (e.key === "Escape") {
        setOpen(false);
      }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      setQ("");
      setSelected(0);
      document.body.style.overflow = "hidden";
      setTimeout(() => inputRef.current?.focus(), 30);
    } else {
      document.body.style.overflow = "";
    }
  }, [open]);

  const groups = useMemo<Group[]>(() => {
    const ql = q.toLowerCase().trim();
    const screens: Item[] = ([
      { key: "home", label: "Эхлэл", icon: HomeIcon, href: "/" },
      { key: "results", label: "Хайлтын үр дүн", icon: List, href: "/results" },
      { key: "activity", label: "Үзэлтүүд", icon: CalendarCheck, href: "/activity" },
      { key: "saved", label: "Хадгалсан зарууд", icon: Heart, href: "/saved" },
      { key: "interests", label: "Миний хүсэл", icon: Sparkles, href: "/interests" },
      { key: "alerts", label: "Мэдэгдэл, хадгалсан хайлт", icon: Bell, href: "/alerts" },
      { key: "profile", label: "Профайл", icon: User, href: "/profile" },
    ] as { key: string; label: string; icon: LucideIcon; href: string }[])
      .filter((s) => !ql || s.label.toLowerCase().includes(ql))
      .map<Item>((s) => ({ type: "screen", ...s }));

    const actions: Item[] = [
      {
        key: "mode-rent",
        label: "Түрээслэх горим руу шилжих",
        icon: HomeIcon,
        run: () => {
          setMode("rent" satisfies ListingMode);
          router.push("/results");
          pushToast("Горим: Түрээс", "info");
        },
      },
      {
        key: "mode-sale",
        label: "Худалдан авах горим руу шилжих",
        icon: Banknote,
        run: () => {
          setMode("sale" satisfies ListingMode);
          router.push("/results");
          pushToast("Горим: Худалдах", "info");
        },
      },
      {
        key: "new-search",
        label: "Шинэ хайлт хадгалах",
        icon: BellPlus,
        run: () => pushToast("Шинэ хайлт хадгалах удахгүй", "info"),
      },
    ]
      .filter((a) => !ql || a.label.toLowerCase().includes(ql))
      .map<Item>((a) => ({ type: "action", ...a }));

    const listings: Item[] = LISTINGS.filter(
      (l) => !ql || l.khotkhon.toLowerCase().includes(ql) || l.district.toLowerCase().includes(ql)
    )
      .slice(0, 6)
      .map<Item>((l) => ({
        type: "listing",
        key: l.id,
        label: `${l.khotkhon} · ${l.rooms}ө ${l.area}м²`,
        sub: `${l.district}, ${l.khoroo}-р хороо · ${listingPriceShort(l)}`,
        icon: Building2,
        href: `/property/${l.id}`,
      }));

    const districts: Item[] = ql
      ? DISTRICTS.filter((d) => d.toLowerCase().includes(ql)).map<Item>((d) => ({
          type: "district",
          key: d,
          label: `${d} дүүрэг`,
          icon: MapPin,
          districtName: d,
        }))
      : [];

    const out: Group[] = [];
    if (screens.length) out.push({ title: "Скрин", items: screens });
    if (actions.length) out.push({ title: "Үйлдэл", items: actions });
    if (listings.length) out.push({ title: "Зарууд", items: listings });
    if (districts.length) out.push({ title: "Дүүрэг", items: districts });
    return out;
  }, [q, pushToast, router, setMode]);

  const flat = useMemo(() => groups.flatMap((g) => g.items), [groups]);

  const run = (it: Item) => {
    setOpen(false);
    if (it.type === "screen") router.push(it.href);
    else if (it.type === "action") it.run();
    else if (it.type === "listing") router.push(it.href);
    else if (it.type === "district") {
      setFilterDistrict(it.districtName);
      router.push("/results");
    }
  };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelected((s) => Math.min(flat.length - 1, s + 1));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelected((s) => Math.max(0, s - 1));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (flat[selected]) run(flat[selected]);
    }
  };

  if (!mounted || !open) return null;

  let idx = -1;
  return createPortal(
    <div
      className="cmd-backdrop open"
      onClick={(e) => {
        if (e.target === e.currentTarget) setOpen(false);
      }}
    >
      <div className="cmd">
        <div className="cmd-input-wrap">
          <input
            ref={inputRef}
            id="cmd-input"
            className="cmd-input"
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setSelected(0);
            }}
            onKeyDown={onKey}
            placeholder="Скрин, үйлдэл, зар хайх... (⌘K)"
          />
          <span className="cmd-kbd">ESC</span>
        </div>
        <div className="cmd-list" id="cmd-list">
          {flat.length === 0 ? (
            <div className="text-center text-sm text-[var(--text-3)] py-8">
              Үр дүн олдсонгүй
            </div>
          ) : (
            groups.map((g) => (
              <div key={g.title}>
                <div className="cmd-group-title">{g.title}</div>
                {g.items.map((it) => {
                  idx++;
                  const i = idx;
                  const isSelected = i === selected;
                  const Icon = it.icon;
                  return (
                    <div
                      key={`${it.type}-${it.key}`}
                      className={`cmd-item${isSelected ? " selected" : ""}`}
                      onClick={() => run(it)}
                      onMouseEnter={() => setSelected(i)}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <div className="flex-1 min-w-0">
                        <div className="truncate">{it.label}</div>
                        {"sub" in it && it.sub && (
                          <div className="text-xs text-[var(--text-3)] truncate">{it.sub}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            ))
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}
