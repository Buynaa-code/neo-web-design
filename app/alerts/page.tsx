import { SavedScreen } from "@/components/SavedScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Мэдэгдэл — NEOMAP" };

export default function AlertsPage() {
  return (
    <ProtectedRoute>
      <SavedScreen initialTab="searches" />
    </ProtectedRoute>
  );
}
