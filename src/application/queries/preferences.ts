"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  getPreferences,
  updatePreferences,
  type PreferenceInput,
} from "@/infrastructure/api/preferences";
import { queryKeys } from "@/infrastructure/query/keys";

export function usePreferences(enabled = true) {
  return useQuery({
    queryKey: queryKeys.preferences,
    queryFn: getPreferences,
    enabled,
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PreferenceInput) => updatePreferences(input),
    onSuccess: (data) => qc.setQueryData(queryKeys.preferences, data),
  });
}
