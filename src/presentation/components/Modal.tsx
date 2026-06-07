"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useStore } from "@/infrastructure/store";

export function Modal() {
  const modal = useStore((s) => s.modal);
  const closeModal = useStore((s) => s.closeModal);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!modal) return;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") closeModal();
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = "";
      document.removeEventListener("keydown", onKey);
    };
  }, [modal, closeModal]);

  if (!mounted || !modal) return null;

  return createPortal(
    <div
      className="modal-backdrop active"
      id="modal-backdrop"
      onClick={(e) => {
        if (e.target === e.currentTarget) closeModal();
      }}
    >
      <div className="modal" id="modal-shell" data-size={modal.size ?? "md"}>
        <button
          type="button"
          className="modal-close"
          aria-label="Хаах"
          onClick={closeModal}
        >
          <X className="w-4 h-4" />
        </button>
        {modal.content}
      </div>
    </div>,
    document.body
  );
}
