import { Suspense } from "react";
import type { Metadata } from "next";
import { ResultsScreen } from "@/components/results/ResultsScreen";

export const metadata: Metadata = {
  title: "Үр дүн — NEOMAP",
  description: "Хайлтын үр дүн, газрын зураг, шүүлтүүртэй",
};

export default function ResultsPage() {
  return (
    <Suspense fallback={<div className="p-8">Уншиж байна...</div>}>
      <ResultsScreen />
    </Suspense>
  );
}
