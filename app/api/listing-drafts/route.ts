import { NextResponse } from "next/server";
import {
  listingDraftSubmissionSchema,
  type ListingDraftSubmission,
} from "@/domain/schemas/listing-draft";

const drafts: ListingDraftSubmission[] = [];

export async function GET() {
  return NextResponse.json({ items: drafts, total: drafts.length });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = listingDraftSubmissionSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  drafts.unshift(parsed.data);
  return NextResponse.json(parsed.data, { status: 201 });
}
