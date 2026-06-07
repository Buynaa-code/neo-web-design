"use client";

import { useStore } from "@/infrastructure/store";
import { cn } from "@/lib/utils";

export function ModeToggle({ className }: { className?: string }) {
  const mode = useStore((s) => s.mode);
  const setMode = useStore((s) => s.setMode);

  return (
    <div className={cn("bk-mode-pill", className)} role="tablist" aria-label="Зорилго">
      <button
        type="button"
        role="tab"
        aria-selected={mode === "sale"}
        className={cn(mode === "sale" && "active")}
        onClick={() => setMode("sale")}
      >
        Худалдаалах
      </button>
      <button
        type="button"
        role="tab"
        aria-selected={mode === "rent"}
        className={cn(mode === "rent" && "active")}
        onClick={() => setMode("rent")}
      >
        Түрээслүүлэх
      </button>
    </div>
  );
}
