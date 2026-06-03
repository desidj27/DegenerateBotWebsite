/** Server-only env helpers (works with Vercel Environment Variables and .env.local). */

export function getMongoUri(): string | undefined {
  return process.env.MONGODB_URI?.trim();
}

export function getMongoDbName(): string {
  return process.env.MONGODB_DB?.trim() || "degeneratebot";
}

export function getDiscordBotToken(): string | undefined {
  return (
    process.env.DISCORD_BOT_TOKEN?.trim() ||
    process.env.DISCORD_TOKEN?.trim()
  );
}

export function getEnvStatus() {
  return {
    mongodb: Boolean(getMongoUri()),
    discord: Boolean(getDiscordBotToken()),
    nodeEnv: process.env.NODE_ENV ?? "development",
    vercel: Boolean(process.env.VERCEL),
  };
}
