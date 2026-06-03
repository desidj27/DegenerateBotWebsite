export function collectEntityIds(
  rows: Record<string, unknown>[],
  preferredGuildId?: string,
): {
  userIds: string[];
  channelIds: string[];
  guildIds: string[];
  guildId?: string;
  userGuilds: Record<string, string>;
} {
  const userIds = new Set<string>();
  const channelIds = new Set<string>();
  const guildIds = new Set<string>();
  const userGuilds: Record<string, string> = {};

  for (const row of rows) {
    if (row.user_id) {
      const uid = String(row.user_id);
      userIds.add(uid);
      if (row.guild_id) userGuilds[uid] = String(row.guild_id);
    }
    if (row.channel_id) channelIds.add(String(row.channel_id));
    if (row.guild_id) guildIds.add(String(row.guild_id));
  }

  const guildId =
    preferredGuildId?.trim() ||
    (rows.find((r) => r.guild_id)?.guild_id as string | undefined);

  return {
    userIds: [...userIds],
    channelIds: [...channelIds],
    guildIds: [...guildIds],
    guildId,
    userGuilds,
  };
}
