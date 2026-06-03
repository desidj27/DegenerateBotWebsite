import { NextRequest, NextResponse } from "next/server";

import { dayFilterQuery, resolveDateRange, type TimePreset } from "@/lib/dates";
import { getDb } from "@/lib/mongodb";

const PRESETS = new Set<TimePreset>([
  "today",
  "7d",
  "30d",
  "90d",
  "all",
  "custom",
]);

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const presetParam = (searchParams.get("preset") ?? "7d") as TimePreset;
    const preset = PRESETS.has(presetParam) ? presetParam : "7d";
    const range = resolveDateRange(
      preset,
      searchParams.get("from") ?? undefined,
      searchParams.get("to") ?? undefined,
    );

    const guildId = searchParams.get("guild_id")?.trim();
    const limit = Math.min(
      100,
      Math.max(5, Number(searchParams.get("limit") ?? "25") || 25),
    );

    const match: Record<string, unknown> = {
      ...dayFilterQuery(range),
    };
    if (guildId) match.guild_id = guildId;

    const db = await getDb();
    const col = db.collection("user_daily");

    const [messageLeaders, voiceLeaders] = await Promise.all([
      col
        .aggregate<{ user_id: string; total: number }>([
          { $match: match },
          {
            $group: {
              _id: "$user_id",
              total: { $sum: "$messages" },
            },
          },
          { $match: { total: { $gt: 0 } } },
          { $sort: { total: -1 } },
          { $limit: limit },
          { $project: { _id: 0, user_id: "$_id", total: 1 } },
        ])
        .toArray(),
      col
        .aggregate<{ user_id: string; total: number }>([
          { $match: match },
          {
            $group: {
              _id: "$user_id",
              total: { $sum: "$voice_seconds" },
            },
          },
          { $match: { total: { $gt: 0 } } },
          { $sort: { total: -1 } },
          { $limit: limit },
          { $project: { _id: 0, user_id: "$_id", total: 1 } },
        ])
        .toArray(),
    ]);

    return NextResponse.json({
      range,
      guild_id: guildId ?? null,
      limit,
      messages: messageLeaders,
      voice: voiceLeaders,
    });
  } catch (error) {
    console.error("GET /api/leaderboard", error);
    return NextResponse.json(
      { error: "Failed to load leaderboard" },
      { status: 500 },
    );
  }
}
