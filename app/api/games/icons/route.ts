import { NextRequest, NextResponse } from "next/server";

import { resolveActivityIcons } from "@/lib/discord/detectable-apps";
import { isDiscordConfigured } from "@/lib/discord/client";

export async function POST(request: NextRequest) {
  try {
    const body = (await request.json()) as { activityNames?: string[] };
    const activityNames = body.activityNames ?? [];

    const icons = await resolveActivityIcons(activityNames);

    return NextResponse.json({
      configured: isDiscordConfigured(),
      icons,
    });
  } catch (error) {
    console.error("POST /api/games/icons", error);
    return NextResponse.json(
      { error: "Failed to resolve game icons" },
      { status: 500 },
    );
  }
}
