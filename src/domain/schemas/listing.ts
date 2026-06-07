import { z } from "zod";

export const listingModeSchema = z.enum(["sale", "rent"]);

export const listingStatusSchema = z.enum([
  "new",
  "active",
  "hot",
  "drop",
  "reserved",
  "sold",
]);

export const listingPropertyKindSchema = z.enum(["apartment", "house", "other"]);

export const pricePointSchema = z.object({
  d: z.string(),
  p: z.number().nonnegative(),
});

export const listingSchema = z.object({
  id: z.number().int().positive(),
  mode: listingModeSchema,
  district: z.string().min(1),
  khoroo: z.string(),
  khotkhon: z.string(),
  rooms: z.number().int().nonnegative(),
  area: z.number().positive(),
  floor: z.string(),
  year: z.number().int(),
  price: z.number().nonnegative(),
  photos: z.number().int().nonnegative(),
  status: listingStatusSchema,
  listedDays: z.number().int().nonnegative(),
  viewCount: z.number().int().nonnegative(),
  viewingCount: z.number().int().nonnegative(),
  features: z.array(z.string()),
  agentId: z.number().int().positive(),
  lat: z.number(),
  lng: z.number(),
  desc: z.string().optional(),
  priceHistory: z.array(pricePointSchema).optional(),
  photoSeeds: z.array(z.union([z.string(), z.number()])).optional(),
  propertyKind: listingPropertyKindSchema.optional(),
});

export const listingCreateInputSchema = listingSchema.omit({
  id: true,
  listedDays: true,
  viewCount: true,
  viewingCount: true,
  status: true,
  photos: true,
}).extend({
  status: listingStatusSchema.default("new"),
});

export type Listing = z.infer<typeof listingSchema>;
export type ListingCreateInput = z.infer<typeof listingCreateInputSchema>;
