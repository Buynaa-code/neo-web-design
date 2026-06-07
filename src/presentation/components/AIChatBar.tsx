"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { GraduationCap, Landmark, Sparkles, TrendingUp, Users, type LucideIcon } from "lucide-react";
import { AI_ASSISTANT_QUESTIONS } from "@/infrastructure/data/constants";
import { useStore } from "@/infrastructure/store";

const ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  landmark: Landmark,
  "trending-up": TrendingUp,
  users: Users,
};

export function AIChatBar() {
  const router = useRouter();
  const [value, setValue] = useState("");
  const setAiQuery = useStore((s) => s.setAiQuery);

  const submit = (text: string) => {
    const q = text.trim();
    if (!q) return;
    setAiQuery(q, null);
    router.push("/results");
  };

  return (
    <div className="ai-chat-bar">
      <div className="ai-chat-input-wrap">
        <Sparkles className="w-4 h-4 ai-chat-icon" aria-hidden="true" />
        <input
          type="text"
          className="ai-chat-input"
          placeholder="Жишээ нь: Хан-Уулд 3 өрөө, ипотектэй, 500 сая хүртэл"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") submit(value);
          }}
        />
        <button
          type="button"
          className="ai-chat-go"
          onClick={() => submit(value)}
        >
          Хайх
        </button>
      </div>
      <div className="ai-chat-suggestions">
        {AI_ASSISTANT_QUESTIONS.map((q) => {
          const Icon = ICONS[q.icon] ?? Sparkles;
          return (
            <button
              key={q.text}
              type="button"
              className="ai-chat-chip"
              onClick={() => submit(q.text)}
            >
              <Icon className="w-3.5 h-3.5" />
              {q.text}
            </button>
          );
        })}
      </div>
    </div>
  );
}
