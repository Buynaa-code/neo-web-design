"use client";

import { useRouter } from "next/navigation";
import {
  BedDouble,
  Briefcase,
  Building2,
  Factory,
  Home,
  KeyRound,
  Map,
  ShoppingBag,
  type LucideIcon,
} from "lucide-react";
import { PROPERTY_TYPES } from "@/data/constants";
import { useStore } from "@/lib/store";

const ICONS: Record<string, LucideIcon> = {
  "building-2": Building2,
  home: Home,
  "key-round": KeyRound,
  "bed-double": BedDouble,
  map: Map,
  briefcase: Briefcase,
  "shopping-bag": ShoppingBag,
  factory: Factory,
};

export function PropertyTypeCards() {
  const router = useRouter();
  const setMode = useStore((s) => s.setMode);
  const pushToast = useStore((s) => s.pushToast);

  return (
    <div className="prop-type-grid">
      {PROPERTY_TYPES.map((t) => {
        const Icon = ICONS[t.icon] ?? Building2;
        return (
          <button
            key={t.key}
            type="button"
            className="prop-type-card"
            onClick={() => {
              setMode(t.mode);
              pushToast(
                `${t.label} — ${t.count.toLocaleString("en-US")} зар`,
                "info"
              );
              router.push("/results");
            }}
          >
            <span className="prop-type-icon">
              <Icon className="w-5 h-5" />
            </span>
            <span className="prop-type-label">{t.label}</span>
            <span className="prop-type-hint">{t.hint}</span>
            <span className="prop-type-count">
              {t.count.toLocaleString("en-US")}
            </span>
          </button>
        );
      })}
    </div>
  );
}
