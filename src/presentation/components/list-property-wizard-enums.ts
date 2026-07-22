/**
 * Wizard label -> API enum-key mapping. Pulled out of `list-property-wizard.tsx`
 * (a "use client" component, not importable from a plain node/vitest test) so
 * the mapping logic — the thing that actually breaks when the backend renames
 * an enum key — can be unit-tested directly.
 */

export type EnumOptions = Record<string, unknown>;

/**
 * Reverse-looks-up an API enum *key* from a (possibly Mongolian) label, using
 * the live form-options `enumOptions[field]` map (shaped `{ key: label }`).
 * Falls back to the raw value if no exact label match is found (so already-key
 * values pass straight through). Returns undefined for empty input.
 */
export function resolveEnumKey(
  field: string,
  label: string | undefined,
  enumOptions: EnumOptions | undefined
): string | undefined {
  const value = (label ?? "").trim();
  if (!value) return undefined;
  const map = enumOptions?.[field];
  if (map && typeof map === "object") {
    const entries = Object.entries(map as Record<string, unknown>);
    // If the value is already a valid key, keep it.
    if (entries.some(([key]) => key === value)) return value;
    const hit = entries.find(([, lbl]) => String(lbl) === value);
    if (hit) return hit[0];
    // Live enum options loaded but this label matches none of them — sending
    // the raw Mongolian label as the enum value always 422s ("selected X is
    // invalid"). Better to omit the field than submit garbage.
    return undefined;
  }
  return value;
}

/** Wizard-label → API-key maps for the enum selects (labels come from the UI). */
export const USAGE_KEY: Record<string, string> = {
  "Цоо шинэ, ашиглаж байгаагүй": "brand_new_unused",
  "Ашиглагдаж байсан": "used",
};
export const INTERIOR_KEY: Record<string, string> = {
  "Сүүлийн 1 жилийн хугацаанд засал хийсэн": "renovated_within_1_year",
  "1-3 жилийн өмнө засал хийсэн": "renovated_1_to_3_years",
  "3-с дээш жилийн өмнө засал хийсэн / Анхны заслаараа байгаа": "old_or_original_finish",
  "Засваргүй, Гэрээлэгч өөрөө засал хийнэ": "unfinished_buyer_finishes",
  "Бусад: Дотор засвар хийгдэж байгаа, хийгдэнэ": "other",
};
export const CERT_KEY: Record<string, string> = {
  "Бэлэн гэрчилгээтэй": "certificate_ready",
  "Дуусаагүй барилгын гэрчилгээтэй": "unfinished_building_certificate",
  "Гэрчилгээгүй - Гэрчилгээ гарахад бэлэн": "certificate_pending_ready",
  // Live server key is `under_construction_contract` — the static
  // `under_construction` value 422'd ("selected certificate status is
  // invalid") because it doesn't exist in the backend enum anymore.
  "Гэрчилгээгүй - Баригдаж байгаа, захиалгын гэрээтэй": "under_construction_contract",
  "Бусад": "other",
};
export const CURRENT_KEY: Record<string, string> = {
  "Түрээсийн эсхүл хөлслүүлэх гэрээтэй байгаа": "has_lease_contract",
  "Амьдарч, ашиглаж байгаа": "occupied_or_in_use",
  "Сул, чөлөөтэй байгаа": "vacant",
  "Бусад": "other",
};
// Note: the backend's `collateral_status` enum has no "other" value (unlike
// certificate_status/interior_condition/current_availability_status, which
// all do) — "Бусад" is intentionally left unmapped below so mapEnum omits
// the field rather than sending an invalid value; the free-text note still
// goes out via `collateral_description`.
export const COLLATERAL_KEY: Record<string, string> = {
  "Ямар нэг барьцаанд байхгүй": "no_collateral",
  "Банк, ББСБ, санхүүгийн байгууллагын зээлийн барьцаанд байгаа": "financial_institution_collateral",
  "Гуравдагч этгээдийн барьцаанд байгаа": "third_party_collateral",
};
export const RELATION_KEY: Record<string, string> = {
  "Өмчлөгч": "owner",
  "Эрх эзэмшигч": "right_holder",
  "Гэрээний эрх эзэмшигч": "contract_right_holder",
  "Өмчлөгч, эрх эзэмшигч хуулийн этгээдийн ажилтан": "employee_of_owner_entity",
  "Хууль ёсны итгэмжлэгдсэн төлөөлөгч": "legal_representative",
};
export const RENT_FREQ_KEY: Record<string, string> = {
  "1 сар тутам": "monthly",
  "2 сар тутам": "bimonthly",
  "3 сар тутам": "quarterly",
  "4 сар тутам": "four_monthly",
  "6 сар тутам": "semiannual",
  "12 сар тутам": "annual",
};

/**
 * Resolves a wizard label to an API enum key: prefers the static label→key map,
 * then the live enumOptions reverse-lookup, then the raw value.
 */
export function mapEnum(
  field: string,
  label: string | undefined,
  staticMap: Record<string, string>,
  enumOptions: EnumOptions | undefined
): string | undefined {
  const value = (label ?? "").trim();
  if (!value) return undefined;
  return staticMap[value] ?? resolveEnumKey(field, value, enumOptions);
}
