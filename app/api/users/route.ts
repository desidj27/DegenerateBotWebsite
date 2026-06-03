import { NextRequest, NextResponse } from "next/server";

import { resolveDiscordEntities } from "@/lib/discord/client";
import { getDb } from "@/lib/mongodb";

const USER_COLLECTIONS = [
  "user_daily",
  "channel_daily",
  "activity_sessions",
  "voice_sessions",
  "activity_totals",
  "member_joins",
  "economy_balances",
  "boost_events",
] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const guildId = searchParams.get("guild_id")?.trim();
    const query = searchParams.get("q")?.trim().toLowerCase();

    const db = await getDb();
    const userGuilds: Record<string, string> = {};
    const userIds = new Set<string>();

    await Promise.all(
      USER_COLLECTIONS.map(async (name) => {
        const filter = guildId ? { guild_id: guildId } : {};
        const ids = await db.collection(name).distinct("user_id", filter);
        for (const id of ids) {
          if (!id) continue;
          const uid = String(id);
          userIds.add(uid);
          if (guildId) userGuilds[uid] = guildId;
        }
      }),
    );

    const sortedIds = [...userIds].sort();

    const { users: resolved } = await resolveDiscordEntities({
      userIds: sortedIds,
      channelIds: [],
      guildIds: guildId ? [guildId] : [],
      guildId,
      userGuilds,
    });

    let users = sortedIds.map((id) => {
      const profile = resolved[id];
      return {
        id,
        displayName: profile?.displayName ?? id,
        username: profile?.username ?? id,
        avatarUrl: profile?.avatarUrl ?? null,
      };
    });

    if (query) {
      users = users.filter(
        (u) =>
          u.displayName.toLowerCase().includes(query) ||
          u.username.toLowerCase().includes(query) ||
          u.id.includes(query),
      );
    }

    return NextResponse.json({ users, total: users.length });
  } catch (error) {
    console.error("GET /api/users", error);
    return NextResponse.json(
      { error: "Failed to load users" },
      { status: 500 },
    );
  }
}
