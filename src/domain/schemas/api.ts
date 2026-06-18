import { z } from "zod";

/**
 * Zod schemas that mirror the RiskSolution / Neomap OpenAPI document
 * (docs/document-2.json). These describe the *wire* shapes returned by
 * http://core.neomap.mn/api and are used both for runtime response
 * validation and by the live smoke tests as a contract check.
 *
 * Keep these in sync with the OpenAPI `components.schemas`. The UI-facing
 * `Listing` type lives in `domain/schemas/listing.ts`; the adapter in
 * `infrastructure/api/listings.ts` maps `ListingResource` -> `Listing`.
 */

const nullableString = z.string().nullable();
const nullableInt = z.number().int().nullable();
const nullableNumber = z.number().nullable();

/* -------------------------------------------------------------------------- */
/* Address                                                                    */
/* -------------------------------------------------------------------------- */

export const addressOptionSchema = z.object({
  // The OpenAPI doc types `id` as string, but the live server returns an
  // integer. Accept both and let callers coerce.
  id: z.union([z.string(), z.number()]),
  code: nullableString,
  name_mn: nullableString,
  name_en: nullableString,
});
export type AddressOption = z.infer<typeof addressOptionSchema>;

export const addressOptionListSchema = z.object({
  data: z.array(addressOptionSchema),
});

/* -------------------------------------------------------------------------- */
/* Customer / Auth                                                            */
/* -------------------------------------------------------------------------- */

export const customerSchema = z.object({
  id: z.number().int(),
  name: z.string(),
  email: z.string(),
  phone: nullableString,
  emailVerified: z.boolean(),
  // Null for users who have not verified their email yet (doc says string).
  emailVerifiedAt: nullableString,
  createdAt: z.string(),
});
export type Customer = z.infer<typeof customerSchema>;

export const authTokenResponseSchema = z.object({
  customer: customerSchema,
  token: z.string(),
  tokenType: z.literal("Bearer"),
});
export type AuthTokenResponse = z.infer<typeof authTokenResponseSchema>;

export const customerEnvelopeSchema = z.object({ data: customerSchema });

/* -------------------------------------------------------------------------- */
/* Pagination (Laravel paginator)                                             */
/* -------------------------------------------------------------------------- */

export const paginatorLinksSchema = z.object({
  first: nullableString,
  last: nullableString,
  prev: nullableString,
  next: nullableString,
});

export const paginatorMetaSchema = z.object({
  current_page: z.number().int(),
  from: nullableInt,
  last_page: z.number().int(),
  links: z.array(
    z.object({
      url: nullableString,
      label: z.string(),
      active: z.boolean(),
    })
  ),
  path: nullableString,
  per_page: z.number().int(),
  to: nullableInt,
  total: z.number().int(),
});
export type PaginatorMeta = z.infer<typeof paginatorMetaSchema>;

/** Wraps any item schema into the standard `{ data, links, meta }` envelope. */
export function paginatedSchema<T extends z.ZodTypeAny>(item: T) {
  return z.object({
    data: z.array(item),
    links: paginatorLinksSchema,
    meta: paginatorMetaSchema,
  });
}

/* -------------------------------------------------------------------------- */
/* ListingResource (rich wire shape)                                          */
/* -------------------------------------------------------------------------- */

const agentSchema = z
  .object({
    id: z.number().int(),
    name: z.string(),
    initials: nullableString,
    agency: nullableString,
    verified: z.boolean(),
    phone: nullableString,
    activity: nullableString,
    listings: z.number().int(),
    rating: nullableNumber,
    reviewCount: z.number().int(),
  })
  .nullable();

const addressMasterIdsSchema = z.object({
  countryId: nullableInt,
  cityId: nullableInt,
  districtId: nullableInt,
  khorooId: nullableInt,
  zipcodeId: nullableInt,
  streetId: nullableInt,
  complexId: nullableInt,
  buildingBlockId: nullableInt,
});

const salePricingSchema = z.object({
  totalPrice: nullableInt,
  unitPriceM2: nullableNumber,
  vatIncluded: z.boolean().nullable(),
  providesVatEbarimt: z.boolean().nullable(),
  salePaymentTerms: z.array(z.unknown()).nullable(),
  barterAllowed: z.boolean().nullable(),
  paymentSchedule: z.array(z.unknown()),
});

const rentPricingSchema = z.object({
  monthlyTotalPrice: nullableInt,
  monthlyUnitPriceM2: nullableNumber,
  vatIncluded: z.boolean().nullable(),
  providesVatEbarimt: z.boolean().nullable(),
  rentPaymentFrequency: nullableString,
  rentDiscountPercent: nullableNumber,
  rentPaymentAmount: nullableInt,
  rentTotalAmount: nullableInt,
  rentDepositAmount: nullableInt,
});

/**
 * Mirrors `ListingResource` from the OpenAPI doc. It is intentionally lenient
 * (`.passthrough()` and loose array items) because the backend evolves and we
 * only strictly depend on the subset the UI consumes via the adapter.
 */
export const listingResourceSchema = z
  .object({
    id: z.number().int(),
    userId: nullableInt,
    customerId: nullableInt,
    mode: z.string(),
    transactionType: z.string(),
    property_type: nullableString,
    propertyCategory: nullableString,
    real_state_type: nullableString,
    subtype: nullableString,
    propertySubtype: nullableString,
    customSubtypeText: nullableString,
    landAreaM2: nullableNumber,
    landPurpose: nullableString,
    suitableUseTags: z.array(z.unknown()),
    industrialDescription: nullableString,
    addressSource: nullableString,
    addressSnapshot: z.array(z.unknown()),
    addressMasterIds: addressMasterIdsSchema,
    district: nullableString,
    khoroo: nullableString,
    khotkhon: nullableString,
    zipcode: nullableString,
    streetNumber: nullableString,
    complexName: nullableString,
    buildingBlockNumber: nullableString,
    buildingBlockName: nullableString,
    addressDescription: nullableString,
    googleMapLink: nullableString,
    floor: nullableString,
    rooms: nullableInt,
    area: z.number(),
    year: nullableInt,
    price: z.number().int(),
    deposit: nullableInt,
    salePricing: salePricingSchema.optional(),
    rentPricing: rentPricingSchema.optional(),
    status: z.string(),
    listedDays: z.number().int(),
    viewCount: z.number().int(),
    viewingCount: z.number().int(),
    features: z.array(z.unknown()),
    agentId: nullableInt,
    agent: agentSchema,
    lat: nullableNumber,
    lng: nullableNumber,
    desc: nullableString,
    // Live server returns a grouped object ({ cover, plan, other, ... }); the
    // doc described an array. Accept either shape.
    photos: z
      .union([z.array(z.unknown()), z.record(z.string(), z.unknown())])
      .nullable(),
    photoSeeds: z.array(z.unknown()),
    priceHistory: z.array(z.unknown()),
    isUserListing: z.boolean(),
    createdAt: z.string(),
    updatedAt: z.string(),
  })
  .passthrough();
export type ListingResource = z.infer<typeof listingResourceSchema>;

export const listingEnvelopeSchema = z.object({ data: listingResourceSchema });
export const listingPaginatedSchema = paginatedSchema(listingResourceSchema);

/* -------------------------------------------------------------------------- */
/* Metadata endpoints                                                         */
/* -------------------------------------------------------------------------- */

export const propertyCategoriesSchema = z.object({
  transactions: z.record(z.string(), z.string()),
  categories: z.record(z.string(), z.record(z.string(), z.unknown())),
  landPurposes: z.record(z.string(), z.string()),
  suitableUseTags: z.array(z.string()),
  listingFlow: z.record(z.string(), z.unknown()),
});
export type PropertyCategories = z.infer<typeof propertyCategoriesSchema>;

export const formOptionsSchema = z.object({
  classification: propertyCategoriesSchema,
  steps: z.array(z.record(z.string(), z.unknown())),
  // Doc types this as string, but the server returns a nested enum map.
  enumOptions: z.record(z.string(), z.unknown()),
  amenityGroups: z.record(z.string(), z.record(z.string(), z.unknown())),
  includedItemGroups: z.record(z.string(), z.record(z.string(), z.unknown())),
});
export type FormOptions = z.infer<typeof formOptionsSchema>;

export const listingFlowMetadataSchema = z.object({
  steps: z.array(z.record(z.string(), z.unknown())),
  enum_options: z.record(z.string(), z.unknown()),
  amenity_groups: z.record(z.string(), z.record(z.string(), z.unknown())),
  included_item_groups: z.record(z.string(), z.record(z.string(), z.unknown())),
});
export type ListingFlowMetadata = z.infer<typeof listingFlowMetadataSchema>;

/* -------------------------------------------------------------------------- */
/* Auth request bodies                                                        */
/* -------------------------------------------------------------------------- */

export const loginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(1),
});
export type LoginRequest = z.infer<typeof loginRequestSchema>;

export const registerRequestSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  phone: z.string().optional(),
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
});
export type RegisterRequest = z.infer<typeof registerRequestSchema>;

export const updateProfileRequestSchema = z.object({
  name: z.string().min(1).optional(),
  email: z.string().email().optional(),
  phone: z.string().nullable().optional(),
});
export type UpdateProfileRequest = z.infer<typeof updateProfileRequestSchema>;

export const updatePasswordRequestSchema = z.object({
  current_password: z.string().min(1),
  password: z.string().min(8),
  password_confirmation: z.string().min(8),
});
export type UpdatePasswordRequest = z.infer<typeof updatePasswordRequestSchema>;
