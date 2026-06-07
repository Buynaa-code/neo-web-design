import { ActivityScreen } from "@/components/ActivityScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Үзэлтүүд — NEOMAP" };

export default function ActivityPage() {
  return (
    <ProtectedRoute>
      <ActivityScreen />
    </ProtectedRoute>
  );
}
