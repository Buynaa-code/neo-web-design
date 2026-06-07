import { z } from "zod";
import { listingModeSchema } from "@/domain/schemas/listing";

export const listingDraftListingSchema = z.object({
  id: z.number().int().positive(),
  mode: listingModeSchema,
  title: z.string().min(1),
  propertyType: z.string(),
  subtype: z.string(),
  district: z.string(),
  khoroo: z.string(),
  addressLine: z.string(),
  area: z.number().nonnegative(),
  rooms: z.number().int().nonnegative(),
  bedrooms: z.number().int().nonnegative(),
  bathrooms: z.number().int().nonnegative(),
  floor: z.string(),
  price: z.number().nonnegative(),
  unitPrice: z.number().nonnegative(),
  features: z.array(z.string()),
  lat: z.number(),
  lng: z.number(),
  coverSeed: z.string(),
});

export const listingDraftSubmissionSchema = z.object({
  id: z.number().int().positive(),
  createdAt: z.string(),
  listing: listingDraftListingSchema,
  detail: z.unknown(),
});

export type ListingDraftSubmission = z.infer<typeof listingDraftSubmissionSchema>;
