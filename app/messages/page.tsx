import { MessagesScreen } from "@/components/MessagesScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Зурвас — NEOMAP" };

export default function MessagesPage() {
  return (
    <ProtectedRoute>
      <MessagesScreen />
    </ProtectedRoute>
  );
}
