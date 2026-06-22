"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Send } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import {
  useConversations,
  useMessages,
  useConversationMutations,
} from "@/application/queries/activity";
import type { Conversation, Message } from "@/domain/schemas/api";

/* -------------------------------------------------------------------------- */
/* Helpers                                                                    */
/* -------------------------------------------------------------------------- */

/** Initials fallback when the agent record lacks them. */
function initialsOf(c: Conversation): string {
  const fromAgent = c.agent?.initials?.trim();
  if (fromAgent) return fromAgent;
  const name = c.agent?.name?.trim();
  if (name) {
    return name
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join("")
      .toUpperCase();
  }
  return "?";
}

function agentNameOf(c: Conversation): string {
  return c.agent?.name?.trim() || "Агент";
}

/** Short, friendly time label for a thread/message timestamp. */
function timeLabel(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  const now = new Date();
  const sameDay =
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate();
  if (sameDay) {
    return d.toLocaleTimeString("mn-MN", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("mn-MN", { month: "short", day: "numeric" });
}

/* -------------------------------------------------------------------------- */
/* Conversation list                                                          */
/* -------------------------------------------------------------------------- */

function ConversationCard({
  c,
  active,
  onSelect,
}: {
  c: Conversation;
  active: boolean;
  onSelect: (id: number) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onSelect(c.id)}
      className={`card p-4 w-full text-left flex items-center gap-3 transition-colors ${
        active ? "ring-1 ring-[var(--gold-brand)]" : ""
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] grid place-items-center font-semibold text-sm shrink-0">
        {initialsOf(c)}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <div className="font-semibold text-sm truncate flex-1">
            {agentNameOf(c)}
          </div>
          <div className="text-xs text-[var(--text-3)] shrink-0">
            {timeLabel(c.lastMessageAt)}
          </div>
        </div>
        <div className="flex items-center gap-2 mt-0.5">
          <div className="text-xs text-[var(--text-3)] truncate flex-1">
            {c.lastMessage || "Зурвас алга"}
          </div>
          {c.unreadCount > 0 ? (
            <span className="shrink-0 min-w-5 h-5 px-1.5 rounded-full bg-[var(--gold-brand)] text-black text-xs font-semibold grid place-items-center">
              {c.unreadCount}
            </span>
          ) : null}
        </div>
      </div>
    </button>
  );
}

function ConversationList({
  conversations,
  isLoading,
  selectedId,
  onSelect,
}: {
  conversations: Conversation[];
  isLoading: boolean;
  selectedId: number | null;
  onSelect: (id: number) => void;
}) {
  if (isLoading) {
    return (
      <div className="card p-6 text-sm text-[var(--text-3)] text-center">
        Ачааллаж байна…
      </div>
    );
  }
  if (conversations.length === 0) {
    return (
      <div className="card p-6 text-sm text-[var(--text-3)] text-center">
        Зурвас алга
      </div>
    );
  }
  return (
    <div className="space-y-2">
      {conversations.map((c) => (
        <ConversationCard
          key={c.id}
          c={c}
          active={c.id === selectedId}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Message thread                                                             */
/* -------------------------------------------------------------------------- */

function MessageBubble({ m }: { m: Message }) {
  const mine = m.sender === "customer";
  return (
    <div className={`flex ${mine ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[78%] rounded-2xl px-3.5 py-2 text-sm whitespace-pre-wrap break-words ${
          mine
            ? "bg-[var(--gold-brand)] text-black rounded-br-sm"
            : "bg-[var(--surface-2)] text-[var(--text-1)] rounded-bl-sm"
        }`}
      >
        <div>{m.body}</div>
        <div
          className={`text-[10px] mt-1 ${
            mine ? "text-black/60" : "text-[var(--text-3)]"
          }`}
        >
          {timeLabel(m.createdAt)}
        </div>
      </div>
    </div>
  );
}

function MessageThread({
  conversation,
  onBack,
}: {
  conversation: Conversation;
  onBack: () => void;
}) {
  const { data, isLoading } = useMessages(conversation.id);
  const { send } = useConversationMutations();
  const pushToast = useStore((s) => s.pushToast);
  const [body, setBody] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);

  const messages = data ?? [];

  // Keep the thread scrolled to the latest message.
  useEffect(() => {
    const el = scrollRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages.length, conversation.id]);

  const handleSend = () => {
    const text = body.trim();
    if (!text || send.isPending) return;
    send.mutate(
      { conversationId: conversation.id, body: text },
      {
        onError: () => pushToast("Зурвас илгээж чадсангүй", "danger"),
      }
    );
    setBody("");
  };

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 pb-3 border-b border-[var(--border)]">
        <button
          type="button"
          onClick={onBack}
          className="md:hidden grid place-items-center w-9 h-9 rounded-full hover:bg-[var(--surface-2)]"
          aria-label="Буцах"
        >
          <ArrowLeft size={18} />
        </button>
        <div className="w-10 h-10 rounded-full bg-[var(--surface-2)] grid place-items-center font-semibold text-sm shrink-0">
          {initialsOf(conversation)}
        </div>
        <div className="min-w-0">
          <div className="font-semibold text-sm truncate">
            {agentNameOf(conversation)}
          </div>
          {conversation.agent?.agency ? (
            <div className="text-xs text-[var(--text-3)] truncate">
              {conversation.agent.agency}
            </div>
          ) : null}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 min-h-0 overflow-y-auto py-4 space-y-2">
        {isLoading ? (
          <div className="text-sm text-[var(--text-3)] text-center py-6">
            Ачааллаж байна…
          </div>
        ) : messages.length === 0 ? (
          <div className="text-sm text-[var(--text-3)] text-center py-6">
            Зурвас алга. Эхний зурвасаа бичнэ үү.
          </div>
        ) : (
          messages.map((m) => <MessageBubble key={m.id} m={m} />)
        )}
      </div>

      {/* Composer */}
      <div className="pt-3 border-t border-[var(--border)] flex items-center gap-2">
        <input
          className="input flex-1"
          placeholder="Зурвас бичих…"
          value={body}
          onChange={(e) => setBody(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSend();
            }
          }}
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!body.trim() || send.isPending}
          className="btn btn-primary !px-4 disabled:opacity-50"
          aria-label="Илгээх"
        >
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/* Screen                                                                     */
/* -------------------------------------------------------------------------- */

export function MessagesScreen() {
  const { data, isLoading } = useConversations();
  const { markRead } = useConversationMutations();
  const [selectedId, setSelectedId] = useState<number | null>(null);

  const conversations = useMemo(() => data ?? [], [data]);

  const selected = useMemo(
    () => conversations.find((c) => c.id === selectedId) ?? null,
    [conversations, selectedId]
  );

  const handleSelect = (id: number) => {
    setSelectedId(id);
    const conv = conversations.find((c) => c.id === id);
    if (conv && conv.unreadCount > 0) markRead.mutate(id);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 lg:px-6 py-6">
      <h1 className="text-2xl font-semibold mb-1">Зурвас</h1>
      <p className="text-sm text-[var(--text-3)] mb-5">
        Агентуудтай харилцсан яриа
      </p>

      <div className="md:grid md:grid-cols-[minmax(0,20rem)_1fr] md:gap-4 md:h-[70vh]">
        {/* Left: list */}
        <div
          className={`md:overflow-y-auto md:pr-1 ${
            selected ? "hidden md:block" : "block"
          }`}
        >
          <ConversationList
            conversations={conversations}
            isLoading={isLoading}
            selectedId={selectedId}
            onSelect={handleSelect}
          />
        </div>

        {/* Right: thread */}
        <div
          className={`card p-4 h-[70vh] md:h-full ${
            selected ? "flex" : "hidden md:flex"
          } flex-col min-h-0`}
        >
          {selected ? (
            <MessageThread
              key={selected.id}
              conversation={selected}
              onBack={() => setSelectedId(null)}
            />
          ) : (
            <div className="flex-1 grid place-items-center text-sm text-[var(--text-3)]">
              Яриа сонгоно уу
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
