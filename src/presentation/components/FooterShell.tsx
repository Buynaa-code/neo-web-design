"use client";

import { usePathname } from "next/navigation";
import { Footer } from "./Footer";

const HIDE_ON = new Set<string>(["/"]);

export function FooterShell() {
  const pathname = usePathname();
  if (HIDE_ON.has(pathname)) return null;
  return <Footer />;
}
