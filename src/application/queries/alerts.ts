"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { listAlerts, markAlertRead, markAllAlertsRead } from "@/infrastructure/api/alerts";
import { queryKeys } from "@/infrastructure/query/keys";

export function useAlerts(unread?: boolean) {
  return useQuery({
    queryKey: queryKeys.alerts(unread),
    queryFn: () => listAlerts(unread),
  });
}

export function useAlertMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["alerts"] });

  const markRead = useMutation({
    mutationFn: (id: number) => markAlertRead(id),
    onSuccess: invalidate,
  });
  const markAllRead = useMutation({
    mutationFn: () => markAllAlertsRead(),
    onSuccess: invalidate,
  });

  return { markRead, markAllRead };
}
