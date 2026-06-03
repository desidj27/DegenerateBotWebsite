import { NextRequest, NextResponse } from "next/server";

import { resolveDiscordEntities, isDiscordConfigured } from "@/lib/discord/client";
import type { ResolvePayload } from "@/lib/discord/types";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as {
      userIds?: string[];
      channelIds?: string[];
      guildIds?: string[];
      guildId?: string;
      userGuilds?: Record<string, string>;
    };

    const configured = isDiscordConfigured();
    const { users, channels, guilds } = await resolveDiscordEntities({
      userIds: body.userIds ?? [],
      channelIds: body.channelIds ?? [],
      guildIds: body.guildIds ?? [],
      guildId: body.guildId,
      userGuilds: body.userGuilds,
    });

    const payload: ResolvePayload = {
      configured,
      users,
      channels,
      guilds,
    };

    return NextResponse.json(payload);
  } catch (error) {
    console.error("POST /api/resolve", error);
    return NextResponse.json(
      { error: "Failed to resolve Discord entities" },
      { status: 500 },
    );
  }
}
