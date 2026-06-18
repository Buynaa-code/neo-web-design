"use client";

import Link from "next/link";
import {
  Briefcase,
  Car,
  Footprints,
  GraduationCap,
  Home as HomeIcon,
  Info,
  MapPin,
  Pencil,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore, type MyPlace } from "@/infrastructure/store";
import { fmtKm, fmtMinutes, listingToPlace } from "@/application/travel";
import type { Listing } from "@/domain/types";

const KIND_META: Record<MyPlace["kind"], { icon: LucideIcon; tone: string; soft: string }> = {
  home: { icon: HomeIcon, tone: "#0F766E", soft: "rgba(15,118,110,.12)" },
  work: { icon: Briefcase, tone: "#1D4ED8", soft: "rgba(29,78,216,.12)" },
  school: { icon: GraduationCap, tone: "#7E22CE", soft: "rgba(126,34,206,.12)" },
  daycare: { icon: MapPin, tone: "#DB2777", soft: "rgba(219,39,119,.12)" },
  other: { icon: MapPin, tone: "#C9A227", soft: "rgba(201,162,39,.12)" },
};

export function TravelTimes({ listing }: { listing: Listing }) {
  const myPlaces = useStore((s) => s.myPlaces);
  const openPlacePicker = useStore((s) => s.openPlacePicker);

  if (myPlaces.length === 0) {
    return (
      <div className="travel-empty card p-5">
        <div className="flex items-start gap-3">
          <div
            className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
            style={{
              background: "linear-gradient(135deg, var(--primary), var(--gold-brand))",
              color: "#fff",
            }}
          >
            <MapPin className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <div className="text-sm font-semibold mb-1">
              Хүрэх хугацааг хараарай
            </div>
            <p className="text-xs leading-5" style={{ color: "var(--text-3)" }}>
              Гэр, ажил, хүүхдийн сургуулиа хадгалаад энэхүү зар хүртэл явган болон машинаар хэдэн минут явахыг харна уу.
            </p>
            <button
              type="button"
              onClick={() => openPlacePicker({ kind: "home", label: "Гэр" })}
              className="btn btn-cta !text-xs !py-2 mt-3"
            >
              <Plus className="w-3.5 h-3.5" /> Байршил нэмэх
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="travel-times-grid">
      {myPlaces.map((p) => {
        const meta = KIND_META[p.kind] ?? KIND_META.other;
        const { car, walk } = listingToPlace(listing, p);
        const faster: "car" | "walk" = walk.minutes <= car.minutes ? "walk" : "car";
        return (
          <div key={p.id} className="travel-card">
            <div className="travel-card-head">
              <div
                className="travel-card-icon"
                style={{ background: meta.soft, color: meta.tone }}
              >
                <meta.icon className="w-4 h-4" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="travel-card-name">{p.label}</div>
                <div className="travel-distance">
                  <MapPin className="w-3 h-3" aria-hidden />
                  <span className="num">{fmtKm(car.km)}</span>
                  <span className="travel-distance-sep">·</span>
                  <span>зайтай</span>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  useStore.getState().openPlacePicker({
                    editId: p.id,
                    kind: p.kind,
                    label: p.label,
                  })
                }
                className="travel-edit-btn"
                aria-label={`${p.label} байршлыг засах`}
                title="Засах"
              >
                <Pencil className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="travel-modes">
              <div
                className={`travel-mode${faster === "car" ? " is-faster" : ""}`}
              >
                <div className="travel-mode-label">
                  <Car className="w-3.5 h-3.5" aria-hidden />
                  <span>Машинаар</span>
                </div>
                <div className="travel-mode-value num">
                  {fmtMinutes(car.minutes)}
                </div>
              </div>
              <div
                className={`travel-mode${faster === "walk" ? " is-faster" : ""}`}
              >
                <div className="travel-mode-label">
                  <Footprints className="w-3.5 h-3.5" aria-hidden />
                  <span>Явганаар</span>
                </div>
                <div className="travel-mode-value num">
                  {fmtMinutes(walk.minutes)}
                </div>
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => openPlacePicker({ kind: "home", label: "Гэр" })}
        className="travel-add"
        aria-label="Шинэ байршил нэмэх"
      >
        <span className="travel-add-plus">
          <Plus className="w-4 h-4" />
        </span>
        <span className="text-xs font-semibold">Шинэ байршил нэмэх</span>
        <span className="text-[10.5px]" style={{ color: "var(--text-3)" }}>
          Гэр · Ажил · Сургууль
        </span>
      </button>
      <div className="travel-footnote col-span-full">
        <Info className="w-3 h-3 shrink-0" aria-hidden />
        <span>
          Шууд зайн тооцоолол — траффик нөхцөл оруулаагүй.{" "}
          <Link href="/profile" className="travel-footnote-link">
            Миний байршлууд
          </Link>
        </span>
      </div>
    </div>
  );
}
