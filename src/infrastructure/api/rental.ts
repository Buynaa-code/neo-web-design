import {
  rentalContractEnvelopeSchema,
  rentalContractListSchema,
  rentalIncomeEnvelopeSchema,
  rentalTenantEnvelopeSchema,
  rentalTenantListSchema,
  type RentalContract,
  type RentalTenant,
} from "@/domain/schemas/api";
import { apiFetch } from "./http";

/* --- Tenants --- */
export interface TenantInput {
  name: string;
  listing_id?: number | null;
  phone?: string | null;
  lease_start?: string | null;
  lease_end?: string | null;
  rent_amount?: number | null;
  status?: "active" | "pending" | "ended";
}

export async function listRentalTenants(): Promise<RentalTenant[]> {
  return rentalTenantListSchema.parse(await apiFetch("/rental/tenants")).data;
}

export async function createRentalTenant(input: TenantInput): Promise<RentalTenant> {
  return rentalTenantEnvelopeSchema.parse(
    await apiFetch("/rental/tenants", { method: "POST", body: input })
  ).data;
}

export async function updateRentalTenant(
  id: number,
  input: Partial<TenantInput>
): Promise<RentalTenant> {
  return rentalTenantEnvelopeSchema.parse(
    await apiFetch(`/rental/tenants/${id}`, { method: "PUT", body: input })
  ).data;
}

export async function deleteRentalTenant(id: number): Promise<void> {
  await apiFetch(`/rental/tenants/${id}`, { method: "DELETE" });
}

/* --- Contracts --- */
export interface ContractInput {
  tenant_id: number;
  listing_id?: number | null;
  start?: string | null;
  end?: string | null;
  amount?: number | null;
  status?: "draft" | "active" | "ended";
}

export async function listRentalContracts(): Promise<RentalContract[]> {
  return rentalContractListSchema.parse(await apiFetch("/rental/contracts")).data;
}

export async function createRentalContract(input: ContractInput): Promise<RentalContract> {
  return rentalContractEnvelopeSchema.parse(
    await apiFetch("/rental/contracts", { method: "POST", body: input })
  ).data;
}

export async function updateRentalContract(
  id: number,
  input: Partial<Omit<ContractInput, "tenant_id">>
): Promise<RentalContract> {
  return rentalContractEnvelopeSchema.parse(
    await apiFetch(`/rental/contracts/${id}`, { method: "PUT", body: input })
  ).data;
}

/* --- Income --- */
/** GET /rental/income — aggregate income, optionally for one year. */
export async function getRentalIncome(year?: number): Promise<unknown> {
  return rentalIncomeEnvelopeSchema.parse(
    await apiFetch("/rental/income", { query: { year } })
  ).data;
}
