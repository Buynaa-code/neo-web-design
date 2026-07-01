import type { Customer } from "@/domain/schemas/api";
import type { User } from "@/infrastructure/store";

/** Two-letter avatar initials from a display name. */
export function initialsOf(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[1][0]).toUpperCase();
}

/** Map the API `Customer` onto the store's `User` shape. */
export function customerToUser(c: Customer): User {
  return {
    id: c.id,
    name: c.name,
    email: c.email,
    phone: c.phone ?? "",
    initials: initialsOf(c.name),
  };
}
