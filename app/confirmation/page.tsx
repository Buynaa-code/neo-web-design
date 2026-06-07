import { ConfirmationScreen } from "@/components/ConfirmationScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Баталгаажуулалт — NEOMAP" };

export default function ConfirmationPage() {
  return (
    <ProtectedRoute>
      <ConfirmationScreen />
    </ProtectedRoute>
  );
}
