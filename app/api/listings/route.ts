import { NextResponse } from "next/server";
import { LISTINGS } from "@/infrastructure/data/listings";
import {
  listingCreateInputSchema,
  listingSchema,
  type Listing,
} from "@/domain/schemas/listing";

const store: Listing[] = [...LISTINGS];

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode");
  const district = searchParams.get("district");
  const roomsParam = searchParams.get("rooms");
  const priceMin = searchParams.get("priceMin");
  const priceMax = searchParams.get("priceMax");
  const page = Math.max(1, Number(searchParams.get("page") ?? 1));
  const pageSize = Math.min(
    100,
    Math.max(1, Number(searchParams.get("pageSize") ?? 20))
  );

  let items = store;
  if (mode === "sale" || mode === "rent") items = items.filter((l) => l.mode === mode);
  if (district) items = items.filter((l) => l.district === district);
  if (roomsParam) {
    const rooms = roomsParam.split(",").map(Number).filter(Number.isFinite);
    if (rooms.length) items = items.filter((l) => rooms.includes(l.rooms));
  }
  if (priceMin) items = items.filter((l) => l.price >= Number(priceMin));
  if (priceMax) items = items.filter((l) => l.price <= Number(priceMax));

  const total = items.length;
  const start = (page - 1) * pageSize;
  const paged = items.slice(start, start + pageSize);

  return NextResponse.json({ items: paged, total, page, pageSize });
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "invalid_json" }, { status: 400 });
  }

  const parsed = listingCreateInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "validation_failed", issues: parsed.error.issues },
      { status: 422 }
    );
  }

  const nextId = store.reduce((max, l) => Math.max(max, l.id), 0) + 1;
  const created = listingSchema.parse({
    ...parsed.data,
    id: nextId,
    photos: parsed.data.photoSeeds?.length ?? 0,
    listedDays: 0,
    viewCount: 0,
    viewingCount: 0,
  });

  store.unshift(created);
  return NextResponse.json(created, { status: 201 });
}
