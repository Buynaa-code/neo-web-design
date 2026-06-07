export interface RmTenant {
  id: number;
  name: string;
  listingId: number;
  since: string;
  monthly: number;
  paidUntil: string;
  status: "good" | "pending" | "late";
  phone: string;
}

export interface RmContract {
  id: number;
  listingId: number;
  tenant: string;
  from: string;
  to: string;
  monthly: number;
  deposit: number;
  status: "active" | "expiring";
}

export interface RmIncomeMonth {
  month: string;
  amount: number;
}

export const RM_TENANTS: RmTenant[] = [
  {
    id: 1,
    name: "Бат-Эрдэнэ Б.",
    listingId: 1,
    since: "2025-09-01",
    monthly: 1_800_000,
    paidUntil: "2026-06-01",
    status: "good",
    phone: "+976 9911 8800",
  },
  {
    id: 2,
    name: "Сараа Д.",
    listingId: 2,
    since: "2025-11-15",
    monthly: 1_450_000,
    paidUntil: "2026-05-15",
    status: "pending",
    phone: "+976 9911 8801",
  },
  {
    id: 3,
    name: "Тэмүүлэн О.",
    listingId: 5,
    since: "2026-02-01",
    monthly: 1_100_000,
    paidUntil: "2026-05-01",
    status: "late",
    phone: "+976 9911 8802",
  },
];

export const RM_CONTRACTS: RmContract[] = [
  {
    id: 1,
    listingId: 1,
    tenant: "Бат-Эрдэнэ Б.",
    from: "2025-09-01",
    to: "2026-09-01",
    monthly: 1_800_000,
    deposit: 3_600_000,
    status: "active",
  },
  {
    id: 2,
    listingId: 2,
    tenant: "Сараа Д.",
    from: "2025-11-15",
    to: "2026-11-15",
    monthly: 1_450_000,
    deposit: 2_900_000,
    status: "active",
  },
  {
    id: 3,
    listingId: 5,
    tenant: "Тэмүүлэн О.",
    from: "2026-02-01",
    to: "2026-08-01",
    monthly: 1_100_000,
    deposit: 2_200_000,
    status: "expiring",
  },
];

export const RM_INCOME_MONTHS: RmIncomeMonth[] = [
  { month: "12-р сар", amount: 4_350_000 },
  { month: "1-р сар", amount: 4_350_000 },
  { month: "2-р сар", amount: 5_450_000 },
  { month: "3-р сар", amount: 5_450_000 },
  { month: "4-р сар", amount: 6_800_000 },
  { month: "5-р сар", amount: 7_650_000 },
];
