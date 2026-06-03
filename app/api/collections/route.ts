import { NextResponse } from "next/server";

import { COLLECTION_KEYS, TRACKED_COLLECTIONS } from "@/lib/collections";
import { getDb } from "@/lib/mongodb";

export async function GET() {
  try {
    const db = await getDb();

    const counts = await Promise.all(
      COLLECTION_KEYS.map(async (key) => ({
        key,
        label: TRACKED_COLLECTIONS[key].label,
        description: TRACKED_COLLECTIONS[key].description,
        count: await db.collection(key).countDocuments(),
      })),
    );

    return NextResponse.json({ collections: counts });
  } catch (error) {
    console.error("GET /api/collections", error);
    return NextResponse.json(
      { error: "Failed to load collection metadata" },
      { status: 500 },
    );
  }
}
