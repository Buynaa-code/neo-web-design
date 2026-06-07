import { SavedScreen } from "@/components/SavedScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Хадгалсан — NEOMAP" };

export default function SavedPage() {
  return (
    <ProtectedRoute>
      <SavedScreen initialTab="listings" />
    </ProtectedRoute>
  );
}
