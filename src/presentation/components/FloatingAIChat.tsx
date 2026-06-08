"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, Send, X } from "lucide-react";
import { AI_ASSISTANT_QUESTIONS } from "@/infrastructure/data/constants";
import { useStore } from "@/infrastructure/store";

export function FloatingAIChat() {
  const router = useRouter();
  const setAiQuery = useStore((s) => s.setAiQuery);
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setAiQuery(q, null);
    setValue("");
    setOpen(false);
    router.push("/results");
  };

  return (
    <>
      {open && (
        <div className="floating-ai-panel" role="dialog" aria-label="AI туслах">
          <div className="floating-ai-head">
            <div className="floating-ai-head-title">
              <Sparkles className="w-4 h-4" />
              <span>AI туслах</span>
            </div>
            <button
              type="button"
              className="floating-ai-close"
              onClick={() => setOpen(false)}
              aria-label="Хаах"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="floating-ai-body">
            <p className="floating-ai-welcome">
              Юу хайж байгаагаа бичээрэй — байршил, өрөөний тоо, төсөв.
            </p>
            <div className="floating-ai-suggestions">
              {AI_ASSISTANT_QUESTIONS.map((q) => (
                <button
                  key={q.text}
                  type="button"
                  className="floating-ai-chip"
                  onClick={() => submit(q.text)}
                >
                  {q.text}
                </button>
              ))}
            </div>
          </div>

          <div className="floating-ai-input-wrap">
            <input
              ref={inputRef}
              type="text"
              className="floating-ai-input"
              placeholder="Жишээ: Хан-Уулд 3 өрөө, 500 сая хүртэл"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit(value);
              }}
            />
            <button
              type="button"
              className="floating-ai-send"
              onClick={() => submit(value)}
              disabled={!value.trim()}
              aria-label="Илгээх"
            >
              <Send className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <button
        type="button"
        className={`floating-ai-fab${open ? " open" : ""}`}
        onClick={() => setOpen((v) => !v)}
        aria-label={open ? "AI туслахыг хаах" : "AI туслахыг нээх"}
        aria-expanded={open}
      >
        {open ? <X className="w-5 h-5" /> : <Sparkles className="w-5 h-5" />}
      </button>
    </>
  );
}
