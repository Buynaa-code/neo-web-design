import { RentalMgmtScreen } from "@/components/RentalMgmtScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Менежмент — NEOMAP" };

export default function RentalMgmtPage() {
  return (
    <ProtectedRoute>
      <RentalMgmtScreen />
    </ProtectedRoute>
  );
}
