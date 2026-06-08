"use client";

import { type ReactNode, Suspense, useEffect, useMemo, useRef } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Lock } from "lucide-react";
import { useStore } from "@/infrastructure/store";
import { useStoreHydrated } from "@/infrastructure/useStoreHydrated";

function LockedFallback() {
  return (
    <div className="mx-auto flex min-h-[52vh] max-w-md items-center justify-center px-4">
      <div className="card flex w-full items-center gap-3 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[var(--primary-soft)] text-[var(--primary)]">
          <Lock className="h-5 w-5" />
        </div>
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">Нэвтрэх шаардлагатай</div>
          <div className="mt-1 text-xs text-[var(--text-3)]">Таны эрхийг шалгаж байна.</div>
        </div>
      </div>
    </div>
  );
}

function ProtectedRouteInner({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();
  const isLoggedIn = useStore((s) => s.isLoggedIn);
  const pushToast = useStore((s) => s.pushToast);
  const hydrated = useStoreHydrated();
  const redirectedRef = useRef(false);

  const nextUrl = useMemo(() => {
    const query = searchParams.toString();
    return `${pathname}${query ? `?${query}` : ""}`;
  }, [pathname, searchParams]);

  useEffect(() => {
    if (!hydrated || isLoggedIn || redirectedRef.current) return;
    redirectedRef.current = true;
    pushToast("Үргэлжлүүлэхийн тулд нэвтэрнэ үү", "info");
    router.replace(`/auth?next=${encodeURIComponent(nextUrl)}`);
  }, [hydrated, isLoggedIn, nextUrl, pushToast, router]);

  if (!hydrated || !isLoggedIn) {
    return <LockedFallback />;
  }

  return <>{children}</>;
}

export function ProtectedRoute({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LockedFallback />}>
      <ProtectedRouteInner>{children}</ProtectedRouteInner>
    </Suspense>
  );
}
