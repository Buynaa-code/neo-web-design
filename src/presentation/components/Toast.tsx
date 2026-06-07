"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useStore } from "@/infrastructure/store";

const TOAST_MS = 3000;

export function Toast() {
  const toasts = useStore((s) => s.toasts);
  const removeToast = useStore((s) => s.removeToast);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!toasts.length) return;
    const timers = toasts.map((t) =>
      setTimeout(() => removeToast(t.id), TOAST_MS)
    );
    return () => timers.forEach(clearTimeout);
  }, [toasts, removeToast]);

  if (!mounted) return null;

  return createPortal(
    <div className="toast-wrap" id="toast-wrap">
      {toasts.map((t) => (
        <div key={t.id} className={`toast toast-${t.tone ?? "info"}`}>
          {t.text}
        </div>
      ))}
    </div>,
    document.body
  );
}
