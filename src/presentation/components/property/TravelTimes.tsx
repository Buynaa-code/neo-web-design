"use client";

import Link from "next/link";
import {
  Briefcase,
  Car,
  Footprints,
  GraduationCap,
  Home as HomeIcon,
  MapPin,
  Plus,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useStore, type MyPlace } from "@/infrastructure/store";
import { fmtKm, fmtMinutes, listingToPlace } from "@/application/travel";
import type { Listing } from "@/domain/types";

const KIND_META: Record<MyPlace["kind"], { icon: LucideIcon; tone: string }> = {
  home: { icon: HomeIcon, tone: "#0F766E" },
  work: { icon: Briefcase, tone: "#1D4ED8" },
  school: { icon: GraduationCap, tone: "#7E22CE" },
  daycare: { icon: MapPin, tone: "#DB2777" },
  other: { icon: MapPin, tone: "#C9A227" },
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
        return (
          <div key={p.id} className="travel-card">
            <div className="travel-card-head">
              <div
                className="travel-card-icon"
                style={{ background: meta.tone, color: "#fff" }}
              >
                <meta.icon className="w-3.5 h-3.5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{p.label}</div>
                <div className="text-[11px] num" style={{ color: "var(--text-3)" }}>
                  {fmtKm(car.km)}
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
                className="text-[10px]"
                style={{ color: "var(--text-3)" }}
              >
                засах
              </button>
            </div>
            <div className="travel-modes">
              <div className="travel-mode">
                <Car className="w-3.5 h-3.5" style={{ color: "var(--text-2)" }} />
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  Машин
                </span>
                <span className="num text-sm font-semibold ml-auto">
                  {fmtMinutes(car.minutes)}
                </span>
              </div>
              <div className="travel-mode">
                <Footprints
                  className="w-3.5 h-3.5"
                  style={{ color: "var(--text-2)" }}
                />
                <span className="text-[11px]" style={{ color: "var(--text-3)" }}>
                  Явган
                </span>
                <span className="num text-sm font-semibold ml-auto">
                  {fmtMinutes(walk.minutes)}
                </span>
              </div>
            </div>
          </div>
        );
      })}
      <button
        type="button"
        onClick={() => openPlacePicker({ kind: "home", label: "Гэр" })}
        className="travel-add"
      >
        <Plus className="w-4 h-4" />
        <span className="text-xs font-medium">Шинэ байршил</span>
      </button>
      <div
        className="col-span-full text-[10px] mt-1 inline-flex items-center gap-1"
        style={{ color: "var(--text-3)" }}
      >
        <Link href="/profile" style={{ color: "var(--primary)", textDecoration: "underline" }}>
          Байршил удирдах
        </Link>{" "}
        · Тооцоо нь зар & байршлын хооронд шууд зайнаас (траффик нөхцөл орогноогүй).
      </div>
    </div>
  );
}
