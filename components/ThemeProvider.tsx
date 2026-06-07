"use client";

import { ThemeProvider as NextThemesProvider, useTheme } from "next-themes";
import { useEffect, type ReactNode } from "react";

function BodyThemeSync() {
  const { resolvedTheme } = useTheme();
  useEffect(() => {
    if (typeof document === "undefined") return;
    const t = resolvedTheme === "dark" ? "dark" : "light";
    document.body.dataset.theme = t;
  }, [resolvedTheme]);
  return null;
}

export function ThemeProvider({ children }: { children: ReactNode }) {
  return (
    <NextThemesProvider
      attribute="class"
      defaultTheme="light"
      enableSystem={false}
      storageKey="neomap-theme"
      disableTransitionOnChange
    >
      <BodyThemeSync />
      {children}
    </NextThemesProvider>
  );
}
