import { NextRequest, NextResponse } from "next/server";

import {
  buildMongoFilter,
  COLLECTION_KEYS,
  isCollectionKey,
  TRACKED_COLLECTIONS,
} from "@/lib/collections";
import { getDb } from "@/lib/mongodb";
import { serializeDocument } from "@/lib/serialize";

const MAX_LIMIT = 2000;
const DEFAULT_LIMIT = 2000;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const collectionParam = searchParams.get("collection") ?? "user_daily";

    if (!isCollectionKey(collectionParam)) {
      return NextResponse.json(
        { error: "Invalid collection", allowed: COLLECTION_KEYS },
        { status: 400 },
      );
    }

    const page = Math.max(1, Number(searchParams.get("page") ?? "1") || 1);
    const limitParam = searchParams.get("limit");
    const limit =
      limitParam === "all"
        ? MAX_LIMIT
        : Math.min(
            MAX_LIMIT,
            Math.max(
              1,
              Number(limitParam ?? String(DEFAULT_LIMIT)) || DEFAULT_LIMIT,
            ),
          );
    const skip = (page - 1) * limit;

    const filterParams: Record<string, string | undefined> = {};
    for (const key of TRACKED_COLLECTIONS[collectionParam].filters) {
      filterParams[key] = searchParams.get(key) ?? undefined;
    }

    const filter = buildMongoFilter(collectionParam, filterParams);
    const db = await getDb();
    const col = db.collection(collectionParam);
    const sort = TRACKED_COLLECTIONS[collectionParam].defaultSort;

    const [total, docs] = await Promise.all([
      col.countDocuments(filter),
      col
        .find(filter)
        .sort(sort)
        .skip(skip)
        .limit(limit)
        .toArray(),
    ]);

    return NextResponse.json({
      collection: collectionParam,
      filter,
      page,
      limit,
      total,
      totalPages: Math.max(1, Math.ceil(total / limit)),
      items: docs.map((doc) =>
        serializeDocument(doc as Record<string, unknown>),
      ),
    });
  } catch (error) {
    console.error("GET /api/data", error);
    return NextResponse.json(
      { error: "Failed to load tracked data" },
      { status: 500 },
    );
  }
}
