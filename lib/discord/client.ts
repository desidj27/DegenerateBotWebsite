import { cacheGet, cacheSet } from "@/lib/discord/cache";
import type {
  ResolvedChannel,
  ResolvedGuild,
  ResolvedUser,
} from "@/lib/discord/types";
import { getDiscordBotToken } from "@/lib/env";

const API = "https://discord.com/api/v10";

type DiscordUser = {
  id: string;
  username: string;
  global_name: string | null;
  avatar: string | null;
};

type DiscordMember = {
  nick: string | null;
  user: DiscordUser;
};

type DiscordChannel = {
  id: string;
  name: string;
  type: number;
};

type DiscordGuild = {
  id: string;
  name: string;
  icon: string | null;
};

function botToken(): string | undefined {
  return getDiscordBotToken();
}

export function isDiscordConfigured(): boolean {
  return Boolean(botToken());
}

export function userAvatarUrl(userId: string, avatar: string | null): string {
  if (avatar) {
    return `https://cdn.discordapp.com/avatars/${userId}/${avatar}.png?size=64`;
  }
  const index =
    Number(userId.replace(/\D/g, "").slice(-2) || "0") % 6;
  return `https://cdn.discordapp.com/embed/avatars/${index}.png`;
}

function guildIconUrl(guildId: string, icon: string | null): string | null {
  if (!icon) return null;
  const ext = icon.startsWith("a_") ? "gif" : "png";
  return `https://cdn.discordapp.com/icons/${guildId}/${icon}.${ext}?size=64`;
}

function toResolvedUser(
  user: DiscordUser,
  nick?: string | null,
): ResolvedUser {
  const username = user.global_name ?? user.username;
  return {
    id: user.id,
    username: user.username,
    displayName: nick?.trim() || username,
    avatarUrl: userAvatarUrl(user.id, user.avatar),
  };
}

async function discordFetch<T>(path: string): Promise<T | null> {
  const token = botToken();
  if (!token) return null;

  const res = await fetch(`${API}${path}`, {
    headers: { Authorization: `Bot ${token}` },
  });

  if (res.status === 404) return null;
  if (res.status === 429) {
    const retry = res.headers.get("retry-after");
    await new Promise((r) => setTimeout(r, (Number(retry) || 1) * 1000));
    return discordFetch<T>(path);
  }
  if (!res.ok) return null;

  return res.json() as Promise<T>;
}

async function resolveUser(
  userId: string,
  guildId?: string,
): Promise<ResolvedUser | null> {
  const memberKey = guildId ? `member:${guildId}:${userId}` : null;
  if (memberKey) {
    const cached = cacheGet<ResolvedUser>(memberKey);
    if (cached) return cached;
  }

  const userKey = `user:${userId}`;
  const cachedUser = cacheGet<ResolvedUser>(userKey);
  if (cachedUser && !guildId) return cachedUser;

  if (guildId) {
    const member = await discordFetch<DiscordMember>(
      `/guilds/${guildId}/members/${userId}`,
    );
    if (member?.user) {
      const resolved = toResolvedUser(member.user, member.nick);
      cacheSet(memberKey!, resolved);
      cacheSet(userKey, toResolvedUser(member.user));
      return resolved;
    }
  }

  if (cachedUser) return cachedUser;

  const user = await discordFetch<DiscordUser>(`/users/${userId}`);
  if (!user) return null;

  const resolved = toResolvedUser(user);
  cacheSet(userKey, resolved);
  return resolved;
}

async function resolveChannel(
  channelId: string,
): Promise<ResolvedChannel | null> {
  const key = `channel:${channelId}`;
  const cached = cacheGet<ResolvedChannel>(key);
  if (cached) return cached;

  const channel = await discordFetch<DiscordChannel>(`/channels/${channelId}`);
  if (!channel) return null;

  const resolved: ResolvedChannel = {
    id: channel.id,
    name: channel.name,
    type: channel.type,
  };
  cacheSet(key, resolved);
  return resolved;
}

async function resolveGuild(guildId: string): Promise<ResolvedGuild | null> {
  const key = `guild:${guildId}`;
  const cached = cacheGet<ResolvedGuild>(key);
  if (cached) return cached;

  const guild = await discordFetch<DiscordGuild>(`/guilds/${guildId}`);
  if (!guild) return null;

  const resolved: ResolvedGuild = {
    id: guild.id,
    name: guild.name,
    iconUrl: guildIconUrl(guild.id, guild.icon),
  };
  cacheSet(key, resolved);
  return resolved;
}

async function mapPool<T, R>(
  items: T[],
  concurrency: number,
  fn: (item: T) => Promise<R | null>,
): Promise<R[]> {
  const results: R[] = [];
  let index = 0;

  async function worker() {
    while (index < items.length) {
      const i = index++;
      const result = await fn(items[i]);
      if (result) results.push(result);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, items.length) }, worker),
  );
  return results;
}

export async function resolveDiscordEntities(input: {
  userIds: string[];
  channelIds: string[];
  guildIds: string[];
  guildId?: string;
  userGuilds?: Record<string, string>;
}): Promise<{
  users: Record<string, ResolvedUser>;
  channels: Record<string, ResolvedChannel>;
  guilds: Record<string, ResolvedGuild>;
}> {
  const users: Record<string, ResolvedUser> = {};
  const channels: Record<string, ResolvedChannel> = {};
  const guilds: Record<string, ResolvedGuild> = {};

  if (!isDiscordConfigured()) {
    return { users, channels, guilds };
  }

  const defaultGuild = input.guildId?.trim();
  const uniqueUsers = [...new Set(input.userIds.filter(Boolean))];
  const uniqueChannels = [...new Set(input.channelIds.filter(Boolean))];
  const uniqueGuilds = [
    ...new Set([
      ...input.guildIds.filter(Boolean),
      ...(defaultGuild ? [defaultGuild] : []),
    ]),
  ];

  const userGuilds = input.userGuilds ?? {};

  const [resolvedUsers, resolvedChannels, resolvedGuilds] = await Promise.all([
    mapPool(uniqueUsers, 8, (id) =>
      resolveUser(id, userGuilds[id] ?? defaultGuild),
    ),
    mapPool(uniqueChannels, 8, (id) => resolveChannel(id)),
    mapPool(uniqueGuilds, 4, (id) => resolveGuild(id)),
  ]);

  for (const u of resolvedUsers) users[u.id] = u;
  for (const c of resolvedChannels) channels[c.id] = c;
  for (const g of resolvedGuilds) guilds[g.id] = g;

  return { users, channels, guilds };
}
