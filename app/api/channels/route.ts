import { NextRequest, NextResponse } from "next/server";

import { resolveDiscordEntities } from "@/lib/discord/client";
import { getDb } from "@/lib/mongodb";

const CHANNEL_COLLECTIONS = ["channel_daily", "voice_sessions"] as const;

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = request.nextUrl;
    const guildId = searchParams.get("guild_id")?.trim();
    const query = searchParams.get("q")?.trim().toLowerCase();

    const db = await getDb();
    const channelIds = new Set<string>();

    await Promise.all(
      CHANNEL_COLLECTIONS.map(async (name) => {
        const filter = guildId ? { guild_id: guildId } : {};
        const ids = await db.collection(name).distinct("channel_id", filter);
        for (const id of ids) {
          if (id) channelIds.add(String(id));
        }
      }),
    );

    const sortedIds = [...channelIds].sort();

    const { channels: resolved } = await resolveDiscordEntities({
      userIds: [],
      channelIds: sortedIds,
      guildIds: guildId ? [guildId] : [],
      guildId,
    });

    let channels = sortedIds.map((id) => {
      const profile = resolved[id];
      return {
        id,
        name: profile?.name ?? id,
        type: profile?.type,
        isVoice: profile?.type === 2 || profile?.type === 13,
      };
    });

    if (query) {
      channels = channels.filter(
        (c) =>
          c.name.toLowerCase().includes(query) || c.id.includes(query),
      );
    }

    channels.sort((a, b) => a.name.localeCompare(b.name));

    return NextResponse.json({ channels, total: channels.length });
  } catch (error) {
    console.error("GET /api/channels", error);
    return NextResponse.json(
      { error: "Failed to load channels" },
      { status: 500 },
    );
  }
}
