import { Suspense } from "react";
import { AuthScreen } from "@/components/AuthScreen";

export const metadata = { title: "Нэвтрэх — NEOMAP" };

export default function AuthPage() {
  return (
    <Suspense fallback={<div className="p-8">Уншиж байна...</div>}>
      <AuthScreen />
    </Suspense>
  );
}
