import { resolve } from "node:path";
import { defineConfig } from "vitest/config";

const src = (p: string) => resolve(__dirname, "src", p);

export default defineConfig({
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
        process.env.NEXT_PUBLIC_API_URL ?? "http://core.neomap.mn/api",
    },
  },
});
