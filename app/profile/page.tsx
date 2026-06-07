import { ProfileScreen } from "@/components/ProfileScreen";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata = { title: "Профайл — NEOMAP" };

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <ProfileScreen />
    </ProtectedRoute>
  );
}
