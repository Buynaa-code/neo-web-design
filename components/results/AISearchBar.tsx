"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Bed,
  Briefcase,
  Calendar,
  GraduationCap,
  Home as HomeIcon,
  Key,
  Landmark,
  MapPin,
  PawPrint,
  Search,
  Sofa,
  Sparkles,
  Tag,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AI_EXAMPLES, extractedToChips, parseAIQuery } from "@/lib/ai-search";
import { useStore } from "@/lib/store";

const ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  home: HomeIcon,
  briefcase: Briefcase,
  users: Users,
  "trending-up": TrendingUp,
  landmark: Landmark,
  "map-pin": MapPin,
  bed: Bed,
  tag: Tag,
  calendar: Calendar,
  "paw-print": PawPrint,
  sofa: Sofa,
  sparkles: Sparkles,
  key: Key,
};

export function AISearchBar() {
  const router = useRouter();
  const aiQuery = useStore((s) => s.aiQuery);
  const aiExtracted = useStore((s) => s.aiExtracted);
  const setAiQuery = useStore((s) => s.setAiQuery);
  const pushToast = useStore((s) => s.pushToast);
  const [value, setValue] = useState(aiQuery);

  const run = (text: string) => {
    const q = text.trim();
    if (!q) {
      pushToast("Юу хайх вэ?", "info");
      return;
    }
    const ex = parseAIQuery(q);
    const store = useStore.getState();
    if (ex.mode) store.setMode(ex.mode);
    store.setFilterDistrict(ex.district);
    store.setFilterRooms(ex.rooms ? [ex.rooms] : null);
    store.setLifestyle(ex.lifestyle);
    if (ex.maxPrice != null) store.setPriceRange(null, ex.maxPrice);
    if (ex.lifestyle.includes("school-near") !== store.filterSchool) store.toggleSchool();
    if (ex.lifestyle.includes("mortgage") !== store.filterIpoteh) store.toggleIpoteh();
    const wantNewProj = !!ex.minYear && ex.minYear >= 2020;
    if (wantNewProj !== store.filterNewProject) store.toggleNewProject();

    const chipLabels = extractedToChips(ex).map((c) => `${c.icon}|${c.label}`);
    setAiQuery(q, chipLabels);
    pushToast("AI хайлт ажиллаж байна...", "info");
    router.push("/results");
  };

  const clear = () => {
    setValue("");
    setAiQuery("", null);
    useStore.getState().clearAllFilters();
  };

  const chips = aiExtracted
    ? aiExtracted.map((s) => {
        const [icon, ...rest] = s.split("|");
        return { icon, label: rest.join("|") };
      })
    : [];

  return (
    <section className="bm-hero pb-3 pt-1">
      <div className="bm-search-mega">
        <Sparkles className="w-5 h-5 bm-search-icon" />
        <input
          type="text"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              run(value);
            }
          }}
          placeholder="Жишээ нь: Хан-Уулд 3 өрөө, 450 саяс доош, сургууль ойр"
        />
        {(value || aiQuery) && (
          <button
            type="button"
            onClick={clear}
            className="text-[var(--text-3)] hover:text-[var(--text)] px-3"
            aria-label="Цэвэрлэх"
          >
            <X className="w-4 h-4" />
          </button>
        )}
        <button
          type="button"
          className="bm-search-mega-btn"
          onClick={() => run(value)}
          aria-label="Хайх"
        >
          <Search className="w-5 h-5" />
        </button>
      </div>

      {aiQuery && chips.length > 0 && (
        <div
          className="mt-3 p-3 rounded-xl flex items-start gap-3"
          style={{ background: "var(--surface)", border: "1px solid var(--primary)" }}
        >
          <div
            className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
            style={{ background: "var(--primary)", color: "#0A0C0E" }}
          >
            <Sparkles className="w-4 h-4" />
          </div>
          <div className="min-w-0 flex-1">
            <div
              className="text-[11px] font-medium uppercase mb-1.5 tracking-wider"
              style={{ color: "var(--primary)" }}
            >
              AI таны хайлтаас дараахыг ойлгов
            </div>
            <div className="flex items-center gap-1.5 flex-wrap">
              {chips.map((c, i) => {
                const Icon = ICONS[c.icon] ?? Sparkles;
                return (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1.5 text-[11px] font-medium px-2.5 py-1 rounded-full"
                    style={{
                      background: "var(--primary-soft)",
                      color: "var(--primary)",
                      border: "1px solid var(--primary)",
                    }}
                  >
                    <Icon className="w-3 h-3" />
                    {c.label}
                  </span>
                );
              })}
            </div>
          </div>
          <button
            type="button"
            onClick={clear}
            className="text-[var(--text-3)] hover:text-[var(--text)] shrink-0"
            aria-label="Цэвэрлэх"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {!aiQuery && (
        <div className="mt-3 flex items-start gap-2 flex-wrap">
          <span
            className="text-[11px] font-medium uppercase pt-1.5 inline-flex items-center gap-1"
            style={{ color: "var(--text-3)", letterSpacing: ".12em" }}
          >
            <Sparkles className="w-3 h-3" style={{ color: "var(--gold-brand)" }} />
            Жишээ AI хайлт
          </span>
          {AI_EXAMPLES.slice(0, 4).map((ex) => {
            const Icon = ICONS[ex.icon] ?? Sparkles;
            return (
              <button
                key={ex.text}
                type="button"
                onClick={() => {
                  setValue(ex.text);
                  run(ex.text);
                }}
                className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition"
                style={{
                  background: "var(--surface)",
                  border: "1px solid var(--border)",
                  color: "var(--text-2)",
                }}
              >
                <Icon className="w-3 h-3" />
                {ex.text}
              </button>
            );
          })}
        </div>
      )}
    </section>
  );
}
