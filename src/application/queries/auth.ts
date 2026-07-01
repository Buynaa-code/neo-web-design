"use client";

import { useEffect } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  fetchCurrentUser,
  login,
  logout,
  logoutAll,
  register,
  updatePassword,
  updateProfile,
} from "@/infrastructure/api/auth";
import { getToken, onUnauthorized } from "@/infrastructure/api/token";
import { queryKeys } from "@/infrastructure/query/keys";
import { useStore } from "@/infrastructure/store";
import { customerToUser } from "@/infrastructure/customer-user";
import type {
  LoginRequest,
  RegisterRequest,
  UpdatePasswordRequest,
  UpdateProfileRequest,
} from "@/domain/schemas/api";

/**
 * Current authenticated customer. Only fetched when a token exists, so logged
 * out visitors never trigger a 401. Also wires the global "unauthorized"
 * signal (fired by the HTTP layer on a 401) to clear cached auth state.
 */
export function useCurrentUser() {
  const qc = useQueryClient();

  useEffect(() => {
    return onUnauthorized(() => {
      qc.setQueryData(queryKeys.currentUser, null);
      qc.invalidateQueries({ queryKey: ["my-listings"] });
    });
  }, [qc]);

  return useQuery({
    queryKey: queryKeys.currentUser,
    queryFn: fetchCurrentUser,
    enabled: typeof window !== "undefined" && !!getToken(),
    staleTime: 1000 * 60 * 5,
  });
}

export function useLogin() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: LoginRequest) => login(input),
    onSuccess: (res) => qc.setQueryData(queryKeys.currentUser, res.customer),
  });
}

export function useRegister() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: RegisterRequest) => register(input),
    onSuccess: (res) => qc.setQueryData(queryKeys.currentUser, res.customer),
  });
}

export function useUpdateProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: UpdateProfileRequest) => updateProfile(input),
    onSuccess: (customer) => {
      qc.setQueryData(queryKeys.currentUser, customer);
      // Header/ProfileScreen read the name/phone from the zustand store — keep
      // it in sync so an updated profile shows immediately, not after a reload.
      useStore.getState().signIn(customerToUser(customer));
    },
  });
}

export function useUpdatePassword() {
  return useMutation({
    mutationFn: (input: UpdatePasswordRequest) => updatePassword(input),
  });
}

export function useLogout() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (all?: boolean) => (all ? logoutAll() : logout()),
    onSuccess: () => {
      // Wipe the whole cache so the next user on this device never sees the
      // previous account's favorites / conversations / appointments / etc.
      qc.clear();
    },
  });
}
