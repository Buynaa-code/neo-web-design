import {
  appointmentEnvelopeSchema,
  appointmentListSchema,
  type Appointment,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

export interface AppointmentInput {
  listing_id: number;
  date: string;
  time: string;
  note?: string | null;
}

export interface AppointmentUpdate {
  date?: string;
  time?: string;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
  note?: string | null;
  outcome?: string | null;
}

/** GET /appointments — property-viewing bookings. */
export async function listAppointments(status?: string): Promise<Appointment[]> {
  return appointmentListSchema.parse(
    await apiFetch("/appointments", { query: { status } })
  ).data;
}

/** POST /appointments */
export async function createAppointment(input: AppointmentInput): Promise<Appointment> {
  return appointmentEnvelopeSchema.parse(
    await apiFetch("/appointments", { method: "POST", body: input })
  ).data;
}

/** PATCH /appointments/{id} */
export async function updateAppointment(
  id: number,
  input: AppointmentUpdate
): Promise<Appointment> {
  return appointmentEnvelopeSchema.parse(
    await apiFetch(`/appointments/${id}`, { method: "PATCH", body: input })
  ).data;
}

/** DELETE /appointments/{id} — cancel a booking. */
export async function deleteAppointment(id: number): Promise<void> {
  await apiFetch(`/appointments/${id}`, { method: "DELETE" });
}
