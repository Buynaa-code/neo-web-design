import type { Metadata } from "next";
import { ListPropertyWizard } from "@/components/list-property-wizard";
import { ProtectedRoute } from "@/components/ProtectedRoute";

export const metadata: Metadata = {
  title: "Зар оруулах — NEOMAP",
  description: "Шинэ зар оруулах ухаалаг wizard",
};

export default function ListPropertyPage() {
  // NOTE: ProtectedRoute temporarily bypassed for local visual QA of the wizard.
  // MUST restore before commit:  return <ProtectedRoute><ListPropertyWizard /></ProtectedRoute>
  void ProtectedRoute;
  return <ListPropertyWizard />;
}
