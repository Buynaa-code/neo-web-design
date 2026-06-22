"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  createRentalContract,
  createRentalTenant,
  deleteRentalTenant,
  getRentalIncome,
  listRentalContracts,
  listRentalTenants,
  updateRentalContract,
  updateRentalTenant,
  type ContractInput,
  type TenantInput,
} from "@/infrastructure/api/rental";
import { queryKeys } from "@/infrastructure/query/keys";

export function useRentalTenants() {
  return useQuery({ queryKey: queryKeys.rentalTenants, queryFn: listRentalTenants });
}

export function useRentalContracts() {
  return useQuery({ queryKey: queryKeys.rentalContracts, queryFn: listRentalContracts });
}

export function useRentalIncome(year?: number) {
  return useQuery({
    queryKey: queryKeys.rentalIncome(year),
    queryFn: () => getRentalIncome(year),
  });
}

export function useRentalMutations() {
  const qc = useQueryClient();
  const invalidate = () => qc.invalidateQueries({ queryKey: ["rental"] });

  const createTenant = useMutation({
    mutationFn: (input: TenantInput) => createRentalTenant(input),
    onSuccess: invalidate,
  });
  const updateTenant = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<TenantInput> }) =>
      updateRentalTenant(id, input),
    onSuccess: invalidate,
  });
  const removeTenant = useMutation({
    mutationFn: (id: number) => deleteRentalTenant(id),
    onSuccess: invalidate,
  });
  const createContract = useMutation({
    mutationFn: (input: ContractInput) => createRentalContract(input),
    onSuccess: invalidate,
  });
  const updateContract = useMutation({
    mutationFn: ({ id, input }: { id: number; input: Partial<Omit<ContractInput, "tenant_id">> }) =>
      updateRentalContract(id, input),
    onSuccess: invalidate,
  });

  return { createTenant, updateTenant, removeTenant, createContract, updateContract };
}
