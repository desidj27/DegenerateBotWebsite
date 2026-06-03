export type ResolvedUser = {
  id: string;
  username: string;
  displayName: string;
  avatarUrl: string;
};

export type ResolvedChannel = {
  id: string;
  name: string;
  type?: number;
};

export type ResolvedGuild = {
  id: string;
  name: string;
  iconUrl: string | null;
};

export type ResolvePayload = {
  configured: boolean;
  users: Record<string, ResolvedUser>;
  channels: Record<string, ResolvedChannel>;
  guilds: Record<string, ResolvedGuild>;
};
