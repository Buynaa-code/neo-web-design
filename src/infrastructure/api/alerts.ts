import { alertListSchema, type Alert } from "@/domain/schemas/api";
import { apiFetch } from "./http";

/** GET /alerts — new-match notifications generated from saved searches. */
export async function listAlerts(unread?: boolean): Promise<Alert[]> {
  // Only send the flag when filtering to unread; `unread=false` would be
  // serialized as the truthy string "false" and wrongly filter server-side.
  return alertListSchema.parse(
    await apiFetch("/alerts", { query: { unread: unread ? 1 : undefined } })
  ).data;
}

/** PATCH /alerts/{id}/read — mark a single alert read. */
export async function markAlertRead(id: number): Promise<void> {
  await apiFetch(`/alerts/${id}/read`, { method: "PATCH" });
}

/** POST /alerts/read-all — mark every alert read. */
export async function markAllAlertsRead(): Promise<void> {
  await apiFetch("/alerts/read-all", { method: "POST" });
}
