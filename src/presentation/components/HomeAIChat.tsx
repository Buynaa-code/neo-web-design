"use client";

import { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronUp,
  GraduationCap,
  Landmark,
  MessageSquare,
  Send,
  Sparkles,
  TrendingUp,
  Users,
  X,
  type LucideIcon,
} from "lucide-react";
import { AI_ASSISTANT_QUESTIONS } from "@/infrastructure/data/constants";
import { AI_EXAMPLES, parseAIQuery, extractedToChips } from "@/application/ai-search";
import { filteredListings } from "@/application/filters";
import { useStore } from "@/infrastructure/store";

const ICONS: Record<string, LucideIcon> = {
  "graduation-cap": GraduationCap,
  landmark: Landmark,
  "trending-up": TrendingUp,
  users: Users,
};

function botReply(userText: string, count: number): string {
  const ex = parseAIQuery(userText);
  const chips = extractedToChips(ex);
  if (chips.length === 1 && chips[0].label === "Чөлөөт хайлт") {
    return "Юу хайхыг тодорхойлбол би тохирох зар санал болгоод өгье. Жишээ: 'Хан-Уулд 3 өрөө, 450 саяс доош'.";
  }
  const parts: string[] = [];
  if (ex.district) parts.push(`${ex.district} дүүрэг`);
  if (ex.rooms) parts.push(`${ex.rooms} өрөө`);
  if (ex.maxPrice) {
    parts.push(
      ex.maxPrice >= 1_000_000_000
        ? `≤ ${(ex.maxPrice / 1_000_000_000).toFixed(2)} тэрбум`
        : `≤ ${(ex.maxPrice / 1_000_000).toFixed(0)} сая`
    );
  }
  const summary = parts.length ? parts.join(", ") : "таны нөхцөлд тохирох";
  if (count === 0) {
    return `${summary}-д тохирох зар олдсонгүй. Шүүлтүүрээ багасгаж эсвэл өөр асуулт оруулна уу.`;
  }
  return `${summary}-д ${count} зар оллоо. Жагсаалт зүүн талд шинэчлэгдлээ.`;
}

export function HomeAIChat() {
  const messages = useStore((s) => s.homeAIChat);
  const collapsed = useStore((s) => s.homeAIChatCollapsed);
  const setCollapsed = useStore((s) => s.setHomeAIChatCollapsed);
  const pushChat = useStore((s) => s.pushAIChat);
  const clearChat = useStore((s) => s.clearAIChat);
  const setAiQuery = useStore((s) => s.setAiQuery);
  const [value, setValue] = useState("");
  const [mounted, setMounted] = useState(false);
  const bodyRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (bodyRef.current) {
      bodyRef.current.scrollTop = bodyRef.current.scrollHeight;
    }
  }, [messages.length]);

  const send = (text: string) => {
    const q = text.trim();
    if (!q) return;
    pushChat({ role: "user", text: q });
    setValue("");

    const ex = parseAIQuery(q);
    const store = useStore.getState();
    if (ex.mode) store.setMode(ex.mode);
    store.setFilterDistrict(ex.district);
    store.setFilterRooms(ex.rooms ? [ex.rooms] : null);
    store.setLifestyle(ex.lifestyle);
    if (ex.maxPrice != null) store.setPriceRange(null, ex.maxPrice);
    setAiQuery(q, extractedToChips(ex).map((c) => `${c.icon}|${c.label}`));

    setTimeout(() => {
      const s = useStore.getState();
      const count = filteredListings({
        mode: s.mode,
        filterPropertyKind: s.filterPropertyKind,
        filterDistrict: s.filterDistrict,
        filterRooms: s.filterRooms,
        filterBusStop: null,
        filterLifestyle: s.filterLifestyle,
        filterVerified: s.filterVerified,
        filterIpoteh: s.filterIpoteh,
        filterNewProject: s.filterNewProject,
        filterSchool: s.filterSchool,
        filterIncome: s.filterIncome,
        filterPriceMin: s.filterPriceMin,
        filterPriceMax: s.filterPriceMax,
        filterPpmMin: s.filterPpmMin,
        filterPpmMax: s.filterPpmMax,
        filterAreaMin: s.filterAreaMin,
        filterAreaMax: s.filterAreaMax,
        drawnPolygon: s.drawnPolygon,
        sortBy: s.sortBy,
      }).length;
      pushChat({
        role: "bot",
        text: botReply(q, count),
        suggestions: AI_EXAMPLES.slice(0, 3).map((e) => e.text),
      });
    }, 200);
  };

  if (!mounted) return null;

  return (
    <div className={`home-ai-chat${collapsed ? " collapsed" : ""}`} aria-label="AI туслах">
      <button
        type="button"
        onClick={() => setCollapsed(!collapsed)}
        className="home-ai-chat-head"
      >
        <span className="home-ai-chat-icon">
          <Sparkles className="w-4 h-4" />
        </span>
        <span className="flex-1 text-left">
          <strong>AI туслах</strong>
          {messages.length > 0 && (
            <span className="text-[10px] text-[var(--text-3)] ml-2">
              {messages.length} мессеж
            </span>
          )}
        </span>
        {collapsed ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
      </button>

      {!collapsed && (
        <>
          <div className="home-ai-chat-body" ref={bodyRef}>
            {messages.length === 0 ? (
              <div className="home-ai-chat-welcome">
                <MessageSquare className="w-5 h-5" style={{ color: "var(--gold-brand)" }} />
                <div>
                  <div className="text-sm font-semibold mb-1">
                    Сайн байна уу!
                  </div>
                  <div className="text-xs" style={{ color: "var(--text-3)" }}>
                    Тохирох зар хайхад тань туслахад бэлэн. Жишээ асуулт сонгох эсвэл өөрийн хайлтыг бичнэ үү.
                  </div>
                </div>
              </div>
            ) : (
              messages.map((m, i) => (
                <div
                  key={i}
                  className={`home-ai-chat-msg ${m.role === "user" ? "user" : "bot"}`}
                >
                  {m.role === "bot" && (
                    <span className="home-ai-chat-msg-avatar">
                      <Sparkles className="w-3 h-3" />
                    </span>
                  )}
                  <div className="home-ai-chat-msg-bubble">
                    <div className="text-sm leading-relaxed">{m.text}</div>
                    {m.suggestions && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {m.suggestions.map((s) => (
                          <button
                            key={s}
                            type="button"
                            onClick={() => send(s)}
                            className="home-ai-chat-sugg"
                          >
                            {s}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}

            {messages.length === 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {AI_ASSISTANT_QUESTIONS.map((q) => {
                  const Icon = ICONS[q.icon] ?? Sparkles;
                  return (
                    <button
                      key={q.text}
                      type="button"
                      onClick={() => send(q.text)}
                      className="home-ai-chat-sugg with-icon"
                    >
                      <Icon className="w-3 h-3" />
                      {q.text}
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              send(value);
            }}
            className="home-ai-chat-input-wrap"
          >
            <input
              type="text"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="Юу хайх вэ?"
              className="home-ai-chat-input"
            />
            {messages.length > 0 && (
              <button
                type="button"
                onClick={clearChat}
                className="home-ai-chat-clear"
                aria-label="Цэвэрлэх"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
            <button
              type="submit"
              className="home-ai-chat-send"
              aria-label="Илгээх"
              disabled={!value.trim()}
            >
              <Send className="w-3.5 h-3.5" />
            </button>
          </form>
        </>
      )}
    </div>
  );
}
