"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createAppointment,
  deleteAppointment,
  listAppointments,
  updateAppointment,
  type AppointmentInput,
  type AppointmentUpdate,
} from "@/infrastructure/api/appointments";
import { queryKeys } from "@/infrastructure/query/keys";

export function useAppointments(status?: string) {
  return useQuery({
    queryKey: queryKeys.appointments(status),
    queryFn: () => listAppointments(status),
  });
}

export function useAppointmentMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["appointments"] });

  const create = useMutation({
    mutationFn: (input: AppointmentInput) => createAppointment(input),
    onSuccess: invalidate,
  });
  const update = useMutation({
    mutationFn: ({ id, input }: { id: number; input: AppointmentUpdate }) =>
      updateAppointment(id, input),
    onSuccess: invalidate,
  });
  const remove = useMutation({
    mutationFn: (id: number) => deleteAppointment(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
