"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useStore, type User } from "@/infrastructure/store";
import { useStoreHydrated } from "@/infrastructure/useStoreHydrated";
import { useLogin, useRegister } from "@/application/queries/auth";
import { ApiError } from "@/infrastructure/api/http";
import type { Customer } from "@/domain/schemas/api";

function safeNextPath(next: string | null, defaultPath = "/profile") {
  if (!next || !next.startsWith("/") || next.startsWith("//") || next.startsWith("/auth")) {
    return defaultPath;
  }
  return next;
}

function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

function customerToUser(c: Customer): User {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    initials: initialsOf(c.name),
  };
}

/** Pulls a human-readable message out of an ApiError (validation or generic). */
function errorMessage(err: unknown): string {
  if (err instanceof ApiError) {
    const fields = err.validationErrors;
    if (fields) {
      const first = Object.values(fields)[0];
      if (first?.[0]) return first[0];
    }
    if (err.status === 401) return "Имэйл эсвэл нууц үг буруу байна.";
    if (err.body && typeof err.body === "object" && "message" in err.body) {
      return String((err.body as { message: unknown }).message);
    }
  }
  return "Алдаа гарлаа. Дахин оролдоно уу.";
}

type Mode = "login" | "register";

export function AuthScreen() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const signIn = useStore((s) => s.signIn);
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const pushToast = useStore((s) => s.pushToast);
  const hydrated = useStoreHydrated();

  const login = useLogin();
  const register = useRegister();

  const nextPath = useMemo(
    () => safeNextPath(searchParams.get("next")),
    [searchParams]
  );

  const [mode, setMode] = useState<Mode>("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirm, setPasswordConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (hydrated && isLoggedIn) router.replace(nextPath);
  }, [hydrated, isLoggedIn, nextPath, router]);

  const pending = login.isPending || register.isPending;

  const submit = async () => {
    setError(null);
    try {
      if (mode === "register") {
        if (password !== passwordConfirm) {
          setError("Нууц үг таарахгүй байна.");
          return;
        }
        const res = await register.mutateAsync({
          name,
          email,
          phone: phone || undefined,
          password,
          password_confirmation: passwordConfirm,
        });
        signIn(customerToUser(res.customer));
        pushToast(`Тавтай морил, ${res.customer.name}`, "success");
      } else {
        const res = await login.mutateAsync({ email, password });
        signIn(customerToUser(res.customer));
        pushToast(`Тавтай морил, ${res.customer.name}`, "success");
      }
      router.replace(nextPath);
    } catch (err) {
      setError(errorMessage(err));
    }
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
      <h1 className="text-2xl font-semibold mb-1 text-center">
        {mode === "login" ? "Нэвтрэх" : "Бүртгүүлэх"}
      </h1>
      <p className="text-sm text-[var(--text-3)] mb-6 text-center">
        Имэйл хаягаараа
      </p>
      <div className="card p-6">
        {mode === "register" && (
          <>
            <label className="text-xs font-medium text-[var(--text-2)] mb-1.5 block">
              Нэр
            </label>
            <input
              className="input mb-3"
              placeholder="Таны нэр"
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                setError(null);
              }}
              autoComplete="name"
            />
          </>
        )}

        <label className="text-xs font-medium text-[var(--text-2)] mb-1.5 block">
          Имэйл
        </label>
        <input
          className="input mb-3"
          type="email"
          placeholder="name@example.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setError(null);
          }}
          autoComplete="email"
        />

        {mode === "register" && (
          <>
            <label className="text-xs font-medium text-[var(--text-2)] mb-1.5 block">
              Утас (заавал биш)
            </label>
            <input
              className="input mb-3"
              placeholder="+976 9911 5544"
              value={phone}
              onChange={(e) => {
                setPhone(e.target.value);
                setError(null);
              }}
              inputMode="tel"
              autoComplete="tel"
            />
          </>
        )}

        <label className="text-xs font-medium text-[var(--text-2)] mb-1.5 block">
          Нууц үг
        </label>
        <input
          className="input mb-3"
          type="password"
          placeholder="••••••••"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setError(null);
          }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && mode === "login") submit();
          }}
          autoComplete={mode === "login" ? "current-password" : "new-password"}
        />

        {mode === "register" && (
          <>
            <label className="text-xs font-medium text-[var(--text-2)] mb-1.5 block">
              Нууц үг давтах
            </label>
            <input
              className="input mb-3"
              type="password"
              placeholder="••••••••"
              value={passwordConfirm}
              onChange={(e) => {
                setPasswordConfirm(e.target.value);
                setError(null);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter") submit();
              }}
              autoComplete="new-password"
            />
          </>
        )}

        <div className="text-xs text-[var(--danger,#9B2C2C)] mb-3 min-h-[16px]">
          {error}
        </div>

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="btn btn-cta w-full disabled:opacity-60"
        >
          {pending
            ? "Уншиж байна…"
            : mode === "login"
              ? "Нэвтрэх"
              : "Бүртгүүлэх"}
        </button>

        <button
          type="button"
          onClick={() => {
            setMode(mode === "login" ? "register" : "login");
            setError(null);
          }}
          className="text-xs font-medium hover:underline mt-4 block mx-auto"
          style={{ color: "var(--primary)" }}
        >
          {mode === "login"
            ? "Шинэ хэрэглэгч үү? Бүртгүүлэх"
            : "Бүртгэлтэй юу? Нэвтрэх"}
        </button>
      </div>
    </div>
  );
}
