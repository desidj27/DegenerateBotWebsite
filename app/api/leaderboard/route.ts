import { NextRequest, NextResponse } from "next/server";

import { fetchGameActivityLeaderboard } from "@/lib/activity-by-game";
import { dayFilterQuery, resolveDateRange, type TimePreset } from "@/lib/dates";
import { getDb } from "@/lib/mongodb";
import { toClientMongoError } from "@/lib/mongo-errors";

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

    const [messageLeaders, voiceLeaders, games] = await Promise.all([
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
      fetchGameActivityLeaderboard(db, { guildId, limit }),
    ]);

    const gameLeaders = games.map((row) => ({
      activity_name: row.activity_name,
      total: row.total_seconds,
      player_count: row.player_count,
    }));

    return NextResponse.json({
      range,
      guild_id: guildId ?? null,
      limit,
      messages: messageLeaders,
      voice: voiceLeaders,
      games: gameLeaders,
    });
  } catch (error) {
    console.error("GET /api/leaderboard", error);
    return NextResponse.json(
      { error: toClientMongoError(error) },
      { status: 500 },
    );
  }
}
