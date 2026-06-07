"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore } from "@/infrastructure/store";
import { useStoreHydrated } from "@/infrastructure/useStoreHydrated";

function normalizePhone(raw: string): { ok: boolean; normalized?: string; error?: string } {
  if (!raw.trim()) return { ok: false, error: "Утасны дугаараа оруулна уу" };
  const digits = raw.replace(/[^\d]/g, "");
  const okMN = /^976\d{8}$/.test(digits) || /^\d{8}$/.test(digits);
  if (!okMN) return { ok: false, error: "Зөв формат: +976 XXXX XXXX эсвэл 8 оронтой дугаар" };
  return { ok: true, normalized: digits.startsWith("976") ? "+" + digits : "+976" + digits };
}

function safeNextPath(next: string | null, defaultPath = "/profile") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/auth")) {
    return defaultPath;
  }
  return next;
}

function OtpModal({ phone, onVerified }: { phone: string; onVerified: () => void }) {
  const closeModal = useStore((s) => s.closeModal);
  const pushToast = useStore((s) => s.pushToast);
  const [otp, setOtp] = useState<string[]>(["", "", "", "", "", ""]);
  const [otpError, setOtpError] = useState<string | null>(null);
  const [resendLeft, setResendLeft] = useState(30);
  const inputsRef = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    inputsRef.current[0]?.focus();
    const id = setInterval(() => {
      setResendLeft((v) => (v <= 1 ? 0 : v - 1));
    }, 1000);
    return () => clearInterval(id);
  }, []);

  const verify = () => {
    const code = otp.join("");
    if (code.length !== 6 || /\D/.test(code)) {
      setOtpError("6 оронтой кодоо бүрэн оруулна уу");
      return;
    }
    setOtpError(null);
    onVerified();
    closeModal();
  };

  const onOtpChange = (i: number, value: string) => {
    const digits = value.replace(/[^\d]/g, "");
    setOtpError(null);
    if (!digits) {
      setOtp((prev) => {
        const next = prev.slice();
        next[i] = "";
        return next;
      });
      return;
    }
    setOtp((prev) => {
      const next = prev.slice();
      for (let k = 0; k < digits.length && i + k < 6; k++) {
        next[i + k] = digits[k];
      }
      return next;
    });
    const lastFilled = Math.min(i + digits.length - 1, 5);
    const nextFocus = Math.min(lastFilled + 1, 5);
    inputsRef.current[nextFocus]?.focus();
  };

  const onOtpPaste = (i: number, e: React.ClipboardEvent<HTMLInputElement>) => {
    const text = e.clipboardData.getData("text");
    if (!/\d/.test(text)) return;
    e.preventDefault();
    onOtpChange(i, text);
  };

  const onOtpKey = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otp[i] && i > 0) {
      inputsRef.current[i - 1]?.focus();
      setOtp((prev) => {
        const n = prev.slice();
        n[i - 1] = "";
        return n;
      });
    } else if (e.key === "Enter") {
      verify();
    }
  };

  return (
    <div className="-m-6">
      <div
        className="p-5 flex items-center justify-between"
        style={{ borderBottom: "1px solid var(--border)" }}
      >
        <div>
          <h3 className="font-semibold text-lg">SMS код оруулах</h3>
          <p className="text-xs text-[var(--text-3)] mt-0.5">
            {phone} руу 6 оронтой код илгээсэн
          </p>
        </div>
      </div>
      <div className="p-5">
        <div className="flex justify-between gap-2 mb-2">
          {otp.map((v, i) => (
            <input
              key={i}
              ref={(el) => {
                inputsRef.current[i] = el;
              }}
              className="otp-box"
              inputMode="numeric"
              maxLength={6}
              value={v}
              onChange={(e) => onOtpChange(i, e.target.value)}
              onKeyDown={(e) => onOtpKey(i, e)}
              onPaste={(e) => onOtpPaste(i, e)}
            />
          ))}
        </div>
        <div className="text-xs text-[var(--danger,#9B2C2C)] mb-2 min-h-[16px]">
          {otpError}
        </div>
        <button
          type="button"
          onClick={() => {
            if (resendLeft === 0) {
              pushToast("Шинэ код илгээлээ", "info");
              setResendLeft(30);
            }
          }}
          disabled={resendLeft > 0}
          className="text-xs font-medium hover:underline disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ color: "var(--primary)" }}
        >
          {resendLeft > 0 ? `Дахин илгээх (${resendLeft}с)` : "Дахин илгээх"}
        </button>
      </div>
      <div
        className="p-4 flex gap-2 justify-end"
        style={{ borderTop: "1px solid var(--border)", background: "var(--surface-2)" }}
      >
        <button type="button" onClick={closeModal} className="btn btn-secondary">
          Буцах
        </button>
        <button type="button" onClick={verify} className="btn btn-primary">
          Баталгаажуулах
        </button>
      </div>
    </div>
  );
}

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const phoneDraft = useStore((s) => s.authPhoneDraft);
  const setAuthPhoneDraft = useStore((s) => s.setAuthPhoneDraft);
  const signIn = useStore((s) => s.signIn);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const pushToast = useStore((s) => s.pushToast);
  const openModal = useStore((s) => s.openModal);
  const hydrated = useStoreHydrated();

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  const [phone, setPhone] = useState(phoneDraft || "");
  const [phoneError, setPhoneError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && isLoggedIn) router.replace(nextPath);
  }, [hydrated, isLoggedIn, nextPath, router]);

  const requestOtp = () => {
    const r = normalizePhone(phone);
    if (!r.ok) {
      setPhoneError(r.error ?? "Алдаатай дугаар");
      return;
    }
    setPhoneError(null);
    const normalized = r.normalized!;
    setAuthPhoneDraft(normalized);
    openModal(
      <OtpModal
        phone={normalized}
        onVerified={() => {
          signIn({ name: "Энхтуяа", phone: normalized, initials: "ЭТ" });
          pushToast("Тавтай морил, Энхтуяа", "success");
        }}
      />
    );
  };

  if (!hydrated || isLoggedIn) {
    return (
      <div className="max-w-md mx-auto px-4 py-12">
        <div className="card p-6 text-center text-sm text-[var(--text-3)]">
          Уншиж байна…
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto px-4 py-12">
      <h1 className="text-2xl font-semibold mb-1 text-center">Нэвтрэх</h1>
      <p className="text-sm text-[var(--text-3)] mb-6 text-center">Утасны дугаараараа</p>
      <div className="card p-6">
        <label className="text-xs font-medium text-[var(--text-2)] mb-1.5 block">
          Утасны дугаар
        </label>
        <input
          id="auth-phone-input"
          className="input mb-1"
          placeholder="+976 9911 5544"
          value={phone}
          onChange={(e) => {
            setPhone(e.target.value);
            setAuthPhoneDraft(e.target.value);
            setPhoneError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter") requestOtp();
          }}
          inputMode="tel"
        />
        <div className="text-xs text-[var(--danger,#9B2C2C)] mb-3 min-h-[16px]">
          {phoneError}
        </div>
        <button type="button" onClick={requestOtp} className="btn btn-cta w-full">
          SMS код илгээх
        </button>
        <p className="text-[11px] text-[var(--text-3)] mt-3 text-center">
          Жишээ: +976 9911 5544
        </p>
      </div>
    </div>
  );
}
