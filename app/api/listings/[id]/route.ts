import { NextResponse } from "next/server";
import { getListing as findListing } from "@/infrastructure/data/listings";

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> }
) {
  const { id } = await context.params;
  const numericId = Number(id);
  if (!Number.isFinite(numericId)) {
    return NextResponse.json({ error: "invalid_id" }, { status: 400 });
  }

  const listing = findListing(numericId);
  if (!listing) {
    return NextResponse.json({ error: "not_found" }, { status: 404 });
  }
  return NextResponse.json(listing);
}
