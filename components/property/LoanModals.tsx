"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Award, Info, Send } from "lucide-react";
import { BANKS, getBank } from "@/data/banks";
import { mortgageMonthly } from "@/data/formatters";
import { useStore } from "@/lib/store";
import type { Listing } from "@/lib/types";

interface CompareRow {
  bankId: string;
  name: string;
  short: string;
  color: string;
  rate: number;
  dp: number;
  yr: number;
  monthly: number;
  total: number;
}

export function LoanCompareModal({ listing }: { listing: Listing }) {
  const closeModal = useStore((s) => s.closeModal);
  const setLoanBank = useStore((s) => s.setLoanBank);
  const downPct = useStore((s) => s.loanDownPct);
  const years = useStore((s) => s.loanYears);

  const rows: CompareRow[] = BANKS.map((b) => {
    const dp = Math.max(b.minDownPct, downPct);
    const yr = Math.min(b.maxYears, years);
    const m = mortgageMonthly(listing.price, dp, yr, b.rate);
    return {
      bankId: b.id,
      name: b.name,
      short: b.short,
      color: b.color,
      rate: b.rate,
      dp,
      yr,
      monthly: m,
      total: m * yr * 12,
    };
  }).sort((a, b) => a.monthly - b.monthly);
  const best = rows[0];

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <h3 className="font-semibold text-lg">Банкуудын харьцуулалт</h3>
        <p className="text-xs text-[var(--text-3)] mt-0.5">
          {listing.khotkhon} · {listing.price.toLocaleString("en-US")}₮ · {downPct}% урьдчилгаа
        </p>
      </div>
      <div className="p-5 max-h-[70vh] overflow-y-auto">
        {best && (
          <div
            className="card p-3 mb-4 flex items-start gap-3"
            style={{ borderColor: "var(--gold-brand)", background: "var(--gold-soft)" }}
          >
            <Award className="w-5 h-5 mt-0.5" style={{ color: "var(--gold-brand)" }} />
            <div>
              <div className="text-sm font-semibold">Хамгийн хямд: {best.name}</div>
              <div className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
                Сарын {best.monthly.toLocaleString("en-US")}₮ · {best.rate}% жилийн хүү
              </div>
            </div>
          </div>
        )}

        <div className="space-y-2">
          {rows.map((r, i) => (
            <div
              key={r.bankId}
              className="card p-3 flex items-center gap-3"
              style={i === 0 ? { borderColor: "var(--gold-brand)" } : undefined}
            >
              <div
                className="w-10 h-10 rounded-lg shrink-0 flex items-center justify-center text-xs font-bold text-white"
                style={{ background: r.color }}
              >
                {r.short.slice(0, 2)}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold truncate">{r.name}</div>
                <div
                  className="text-[11px] flex gap-2 mt-0.5"
                  style={{ color: "var(--text-3)" }}
                >
                  <span>{r.rate}% хүү</span>·<span>{r.yr} жил</span>·<span>{r.dp}% уп</span>
                </div>
              </div>
              <div className="text-right">
                <div className="num text-sm font-semibold">
                  {r.monthly.toLocaleString("en-US")}₮
                </div>
                <div className="text-[10px]" style={{ color: "var(--text-3)" }}>
                  сар бүр
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setLoanBank(r.bankId);
                  closeModal();
                }}
                className="btn btn-secondary !text-xs !py-1.5"
              >
                Сонгох
              </button>
            </div>
          ))}
        </div>
      </div>
      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Хаах
        </button>
      </div>
    </div>
  );
}

export function LoanApplyModal({
  listing,
  bankId,
}: {
  listing: Listing;
  bankId: string;
}) {
  const router = useRouter();
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const bank = getBank(bankId);
  const [lastName, setLastName] = useState("");
  const [firstName, setFirstName] = useState("");
  const [phone, setPhone] = useState("+976 9911 5544");
  const [income, setIncome] = useState("");

  const submit = () => {
    if (!firstName.trim()) {
      pushToast("Нэрээ оруулна уу", "danger");
      return;
    }
    closeModal();
    pushToast(`${bank.short} банк руу хүсэлт явууллаа`, "success");
    router.push("/activity");
  };

  return (
    <div className="-m-6">
      <div className="p-5" style={{ borderBottom: "1px solid var(--border)" }}>
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-lg flex items-center justify-center text-xs font-bold text-white"
            style={{ background: bank.color }}
          >
            {bank.short.slice(0, 2)}
          </div>
          <div>
            <h3 className="font-semibold text-lg">{bank.name}</h3>
            <p className="text-xs text-[var(--text-3)]">
              Ипотекийн зээлийн урьдчилсан хүсэлт
            </p>
          </div>
        </div>
      </div>
      <div className="p-5 space-y-3">
        <div
          className="card p-3"
          style={{ background: "var(--surface-2)", borderColor: "var(--border)" }}
        >
          <div className="text-xs mb-1" style={{ color: "var(--text-3)" }}>
            Сонгосон зар
          </div>
          <div className="text-sm font-semibold">
            {listing.khotkhon} · {listing.rooms}ө {listing.area}м²
          </div>
          <div className="text-xs mt-0.5" style={{ color: "var(--text-2)" }}>
            {listing.price.toLocaleString("en-US")}₮ · {listing.district}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <label className="block">
            <div className="text-xs" style={{ color: "var(--text-3)" }}>
              Овог
            </div>
            <input
              className="input"
              placeholder="Бат"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
            />
          </label>
          <label className="block">
            <div className="text-xs" style={{ color: "var(--text-3)" }}>
              Нэр
            </div>
            <input
              className="input"
              placeholder="Болд"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
            />
          </label>
        </div>
        <label className="block">
          <div className="text-xs" style={{ color: "var(--text-3)" }}>
            Утас
          </div>
          <input
            className="input"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </label>
        <label className="block">
          <div className="text-xs" style={{ color: "var(--text-3)" }}>
            Сарын орлого
          </div>
          <input
            className="input num"
            inputMode="numeric"
            placeholder="3,500,000"
            value={income}
            onChange={(e) => setIncome(e.target.value.replace(/[^\d,]/g, ""))}
          />
        </label>
        <div
          className="text-[11px] flex items-start gap-2"
          style={{ color: "var(--text-3)" }}
        >
          <Info className="w-3.5 h-3.5 mt-0.5 shrink-0" />
          Хүсэлтийг банкны зээлийн менежертэй дамжуулна. 24 цагт хариу авна.
        </div>
      </div>
      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Цуцлах
        </button>
        <button type="button" onClick={submit} className="btn btn-cta">
          <Send className="w-4 h-4" /> Илгээх
        </button>
      </div>
    </div>
  );
}
