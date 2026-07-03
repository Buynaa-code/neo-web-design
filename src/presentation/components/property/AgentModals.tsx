"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  BadgeCheck,
  Copy,
  Info,
  MessageSquare,
  Phone,
  Send,
  Sparkles,
  Star,
} from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { listingPriceShort } from "@/infrastructure/data/formatters";
import { photoUrl } from "@/infrastructure/data/listings";
import { useConversationMutations } from "@/application/queries/activity";
import { getToken } from "@/infrastructure/api/token";
import { ApiError } from "@/infrastructure/api/http";
import type { Agent, Listing } from "@/domain/types";

const REVIEW_BUCKET: { score: number; text: string; author: string; date: string }[] = [
  {
    score: 5,
    text: "Маш мэргэжлийн агент. Шуурхай, найдвартай хариу өгсөн. Зөв байр санал болгосон.",
    author: "Б. Энхтуяа",
    date: "2026-04",
  },
  {
    score: 5,
    text: "Бүх документ амжилттай боловсруулж, гэрээ хийх процесс хурдан.",
    author: "А. Бат-Эрдэнэ",
    date: "2026-03",
  },
  {
    score: 4,
    text: "Цаг нь маш сайн, ойлгомжтой тайлбарлав. Эцсийн дүндээ ондон зар санал болгосон.",
    author: "Г. Сараа",
    date: "2026-02",
  },
  {
    score: 5,
    text: "Анх удаа орон сууц авч байгаа надад их тусалсан. Чин сэтгэлээсээ ажилладаг.",
    author: "Д. Бошго",
    date: "2026-01",
  },
];

export function CallAgentModal({ agent }: { agent: Agent }) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);

  const copyPhone = async () => {
    try {
      await navigator.clipboard.writeText(agent.phone);
      pushToast("Дугаар хуулагдлаа", "success");
    } catch {
      pushToast(agent.phone, "info");
    }
  };

  return (
    <div className="-m-6">
      <div className="p-6 text-center">
        <div
          className="w-16 h-16 rounded-full text-white text-xl font-semibold flex items-center justify-center mx-auto mb-3"
          style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
        >
          {agent.initials}
        </div>
        <h3 className="font-semibold text-lg mb-1">{agent.name}</h3>
        <p className="text-sm text-[var(--text-2)] mb-1">{agent.agency}</p>
        {agent.verified && (
          <span className="pill pill-verified mt-2 inline-flex">
            <BadgeCheck className="w-3 h-3" /> Баталгаажсан агент
          </span>
        )}
        <div className="num text-2xl my-5" style={{ color: "var(--text)" }}>
          {agent.phone}
        </div>
        <div className="text-[11px] text-[var(--text-3)] mb-2 inline-flex items-center gap-1">
          <span
            className="w-1.5 h-1.5 rounded-full inline-block"
            style={{ background: "var(--success)" }}
          />
          {agent.activity}
        </div>
      </div>
      <div
        className="p-4 flex gap-2"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={copyPhone} className="btn btn-secondary flex-1">
          <Copy className="w-4 h-4" /> Хуулах
        </button>
        <button
          type="button"
          className="btn btn-cta flex-1"
          onClick={() => {
            const tel = `tel:${agent.phone.replace(/[^0-9+]/g, "")}`;
            const isMobile =
              typeof window !== "undefined" &&
              /Mobi|Android|iPhone|iPad/i.test(window.navigator.userAgent);
            if (isMobile) {
              window.location.href = tel;
            } else {
              copyPhone();
            }
            closeModal();
          }}
        >
          <Phone className="w-4 h-4" /> Залгах
        </button>
      </div>
    </div>
  );
}

export function AgentMessageModal({
  agent,
  listing,
}: {
  agent: Agent;
  listing?: Listing;
}) {
  const router = useRouter();
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const aiQuery = useStore((s) => s.aiQuery);

  const greeting = `Сайн байна уу${
    listing ? `, ${listing.khotkhon}-ийн зарын талаар` : ""
  } нэмэлт зургийг үзэх боломжтой юу?`;
  const aiBody = aiQuery
    ? `Сайн байна уу. Би дараах нөхцлүүдээр хайж байгаа: "${aiQuery}". ${
        listing ? `${listing.khotkhon}-ийн зар тохирч байх шиг байна. Үзэлт товлох боломжтой юу?` : "Тохирох зар санал болгоход баярлалаа."
      }`
    : greeting;

  const [body, setBody] = useState(aiBody);
  const hasLead = !!aiQuery;
  const { start } = useConversationMutations();

  const send = async () => {
    if (!body.trim()) {
      pushToast("Мессеж бичнэ үү", "danger");
      return;
    }
    if (!getToken()) {
      pushToast("Мессеж илгээхийн тулд нэвтэрнэ үү", "danger");
      closeModal();
      router.push("/auth?next=%2Fmessages");
      return;
    }
    try {
      const conversation = await start.mutateAsync({
        agent_id: agent.id,
        listing_id: listing?.id ?? null,
        body: body.trim(),
      });
      closeModal();
      pushToast(
        hasLead ? "Lead summary-тай мессеж илгээгдлээ" : "Мессеж илгээгдлээ",
        "success"
      );
      router.push(`/messages?c=${conversation.id}`);
    } catch (err) {
      pushToast(
        err instanceof ApiError
          ? Object.values(err.validationErrors ?? {})[0]?.[0] ?? err.message
          : "Мессеж илгээхэд алдаа гарлаа",
        "danger"
      );
    }
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full text-white text-xs font-semibold flex items-center justify-center"
            style={{ background: "linear-gradient(135deg, var(--primary), var(--primary-dark))" }}
          >
            {agent.initials}
          </div>
          <div>
            <div className="font-semibold text-sm">{agent.name}</div>
            <div className="text-xs text-[var(--text-3)]">{agent.activity}</div>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        {listing && (
          <div className="card p-3 flex items-center gap-3" style={{ background: "var(--surface-2)" }}>
            <div
              className="w-12 h-12 rounded-lg bg-cover bg-center shrink-0"
              style={{ backgroundImage: `url('${photoUrl(listing, 0, "200/200")}')` }}
            />
            <div className="flex-1 min-w-0">
              <div className="font-medium text-sm truncate">
                {listing.khotkhon} · {listing.rooms}ө {listing.area}м²
              </div>
              <div className="text-xs text-[var(--text-2)]">
                {listingPriceShort(listing)}
              </div>
            </div>
          </div>
        )}
        <label className="block">
          <div className="text-xs font-medium text-[var(--text-2)] mb-1.5">Мессеж</div>
          <textarea
            className="input"
            rows={hasLead ? 7 : 4}
            placeholder="Сайн байна уу, энэ зарын талаар асуумаар байна..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
          />
        </label>
        {hasLead && (
          <div
            className="flex items-start gap-2 p-3 rounded-lg text-[11px]"
            style={{
              background: "var(--primary-soft)",
              color: "var(--primary)",
              border: "1px solid var(--primary)",
            }}
          >
            <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0" />
            <div>
              <strong>AI lead summary</strong> автоматаар оруулсан — таны хайлтын нөхцлүүд агентад хүрнэ.
            </div>
          </div>
        )}
        <div className="flex items-center gap-2 mt-1 text-[11px] text-[var(--text-3)]">
          <Info className="w-3 h-3" /> Хариу дунджаар 12 мин дотор
        </div>
      </div>
      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary" disabled={start.isPending}>
          Цуцлах
        </button>
        <button type="button" onClick={send} className="btn btn-primary" disabled={start.isPending}>
          <Send className="w-4 h-4" /> {start.isPending ? "Илгээж байна…" : "Илгээх"}
        </button>
      </div>
    </div>
  );
}

export function ReviewsModal({ agent }: { agent: Agent }) {
  const closeModal = useStore((s) => s.closeModal);
  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Үнэлгээ</h3>
        <p className="text-xs text-[var(--text-3)] mt-0.5">
          {agent.name} — {agent.rating.toFixed(1)} ⭐ ({agent.reviewCount} үнэлгээ)
        </p>
      </div>
      <div className="p-5 max-h-[65vh] overflow-y-auto space-y-3">
        <div className="card p-4" style={{ background: "var(--surface-2)" }}>
          <div className="flex items-center gap-3">
            <div className="text-3xl font-bold num">{agent.rating.toFixed(1)}</div>
            <div>
              <div className="flex" style={{ color: "var(--gold-brand)" }}>
                {"★★★★★".split("").map((_, i) => (
                  <Star
                    key={i}
                    className="w-4 h-4"
                    fill={i < Math.round(agent.rating) ? "currentColor" : "none"}
                  />
                ))}
              </div>
              <div className="text-xs text-[var(--text-3)] mt-0.5">
                {agent.reviewCount} харилцагчийн санал
              </div>
            </div>
          </div>
        </div>
        {REVIEW_BUCKET.map((r, i) => (
          <div key={i} className="card p-4">
            <div className="flex items-center justify-between mb-1">
              <div className="font-medium text-sm">{r.author}</div>
              <div className="text-xs text-[var(--text-3)]">{r.date}</div>
            </div>
            <div className="flex mb-2" style={{ color: "var(--gold-brand)" }}>
              {Array.from({ length: 5 }).map((_, k) => (
                <Star
                  key={k}
                  className="w-3.5 h-3.5"
                  fill={k < r.score ? "currentColor" : "none"}
                />
              ))}
            </div>
            <p className="text-sm" style={{ color: "var(--text-2)" }}>
              {r.text}
            </p>
          </div>
        ))}
      </div>
      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Хаах
        </button>
        <button type="button" className="btn btn-primary" onClick={closeModal}>
          <MessageSquare className="w-4 h-4" /> Үнэлгээ үлдээх
        </button>
      </div>
    </div>
  );
}
