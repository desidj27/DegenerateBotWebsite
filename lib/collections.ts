export type CollectionKey =
  | "user_daily"
  | "channel_daily"
  | "activity_totals"
  | "activity_sessions"
  | "voice_sessions"
  | "member_joins"
  | "economy_balances"
  | "boost_events";

export type CollectionConfig = {
  label: string;
  description: string;
  fields: readonly string[];
  filters: readonly string[];
  defaultSort: Record<string, 1 | -1>;
};

export const TRACKED_COLLECTIONS: Record<CollectionKey, CollectionConfig> = {
  user_daily: {
    label: "User Daily",
    description: "Per-user messages and voice time by day",
    fields: ["day", "guild_id", "user_id", "messages", "voice_seconds"],
    filters: ["day", "guild_id", "user_id"],
    defaultSort: { day: -1, user_id: 1 },
  },
  channel_daily: {
    label: "Channel Daily",
    description: "Per-channel messages and voice time by day",
    fields: ["day", "guild_id", "channel_id", "messages", "voice_seconds"],
    filters: ["day", "guild_id", "channel_id"],
    defaultSort: { day: -1, channel_id: 1 },
  },
  activity_totals: {
    label: "Activity Totals",
    description: "Cumulative seconds per rich presence activity",
    fields: ["guild_id", "user_id", "activity_name", "total_seconds"],
    filters: ["guild_id", "user_id", "activity_name"],
    defaultSort: { total_seconds: -1 },
  },
  activity_sessions: {
    label: "Activity Sessions",
    description: "Active rich presence sessions",
    fields: ["guild_id", "user_id", "activity_name", "started_at_ms"],
    filters: ["guild_id", "user_id", "activity_name"],
    defaultSort: { started_at_ms: -1 },
  },
  voice_sessions: {
    label: "Voice Sessions",
    description: "Active voice channel sessions",
    fields: ["guild_id", "user_id", "channel_id", "started_at_ms"],
    filters: ["guild_id", "user_id", "channel_id"],
    defaultSort: { started_at_ms: -1 },
  },
  member_joins: {
    label: "Member Joins",
    description: "Member join events",
    fields: ["guild_id", "user_id", "joined_at_ms"],
    filters: ["guild_id", "user_id"],
    defaultSort: { joined_at_ms: -1 },
  },
  economy_balances: {
    label: "Economy Balances",
    description: "User economy balances",
    fields: ["guild_id", "user_id", "balance"],
    filters: ["guild_id", "user_id"],
    defaultSort: { balance: -1 },
  },
  boost_events: {
    label: "Boost Events",
    description: "Server boost events",
    fields: ["guild_id", "user_id", "boosted_at_ms"],
    filters: ["guild_id", "user_id"],
    defaultSort: { boosted_at_ms: -1 },
  },
};

export const COLLECTION_KEYS = Object.keys(
  TRACKED_COLLECTIONS,
) as CollectionKey[];

export const COLLECTION_GROUPS: {
  title: string;
  keys: CollectionKey[];
}[] = [
  {
    title: "Daily stats",
    keys: ["user_daily", "channel_daily"],
  },
  {
    title: "Sessions",
    keys: ["activity_sessions", "voice_sessions"],
  },
  {
    title: "Totals & events",
    keys: ["activity_totals", "member_joins", "economy_balances", "boost_events"],
  },
];

export const FILTER_LABELS: Record<string, string> = {
  day: "Day",
  guild_id: "Guild ID",
  user_id: "User",
  channel_id: "Channel ID",
  activity_name: "Activity",
};

export function isCollectionKey(value: string): value is CollectionKey {
  return value in TRACKED_COLLECTIONS;
}

export function buildMongoFilter(
  collection: CollectionKey,
  params: Record<string, string | undefined>,
): Record<string, unknown> {
  const { filters } = TRACKED_COLLECTIONS[collection];
  const filter: Record<string, unknown> = {};

  for (const key of filters) {
    const raw = params[key]?.trim();
    if (!raw) continue;

    if (key === "activity_name") {
      filter[key] = { $regex: raw, $options: "i" };
    } else {
      filter[key] = raw;
    }
  }

  return filter;
}
