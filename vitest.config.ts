import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const src = (p: string) => resolve(__dirname, "src", p);

export default defineConfig({
  // tsconfig.json sets `jsx: "preserve"` (Next's SWC does the actual JSX
  // transform at build time); outside Next, Vite's esbuild transform reads
  // that same tsconfig setting and — finding "preserve" — skips transforming
  // JSX entirely, which fails to parse. Force the transform here so plain
  // "use client" .tsx files can be imported directly in tests.
  oxc: { jsx: { runtime: "automatic" } },
  resolve: {
    alias: {
      "@/domain": src("domain"),
      "@/application": src("application"),
      "@/infrastructure": src("infrastructure"),
      "@/presentation": src("presentation"),
      "@/components": src("presentation/components"),
      "@/lib": src("presentation/lib"),
      "@/data": src("infrastructure/data"),
      "@": resolve(__dirname),
    },
  },
  test: {
    environment: "node",
    include: ["tests/**/*.test.ts"],
    // Live smoke tests hit the real backend; give them headroom and don't
    // bail the whole suite if the network is flaky.
    testTimeout: 20_000,
    env: {
      NEXT_PUBLIC_API_URL:
        process.env.NEXT_PUBLIC_API_URL ?? "https://core.neomap.mn/api",
      NEXT_PUBLIC_NEODATA_API_URL:
        process.env.NEXT_PUBLIC_NEODATA_API_URL ?? "https://data.neomap.mn/api",
    },
  },
});
