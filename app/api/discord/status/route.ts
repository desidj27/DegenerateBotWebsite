import { NextResponse } from "next/server";

import { isDiscordConfigured } from "@/lib/discord/client";
import { getEnvStatus } from "@/lib/env";

export async function GET() {
  const status = getEnvStatus();
  return NextResponse.json({
    configured: status.discord,
    mongodb: status.mongodb,
    discord: status.discord,
    vercel: status.vercel,
    environment: status.nodeEnv,
  });
}
