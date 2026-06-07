import { ScheduleScreen } from "@/components/ScheduleScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Үзэлт товлох — NEOMAP" };

export default function SchedulePage() {
  return (
    <ProtectedRoute>
      <ScheduleScreen />
    </ProtectedRoute>
  );
}
