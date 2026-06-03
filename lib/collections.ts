export type CollectionKey =
  | "user_daily"
  | "channel_daily"
  | "activity_totals"
  | "activity_sessions"
  | "voice_sessions"
  | "member_joins"
  | "economy_balances"
  | "boost_events";

export type TimeField = "day" | "started_at_ms" | "joined_at_ms" | "boosted_at_ms";

export type CollectionConfig = {
  label: string;
  description: string;
  fields: readonly string[];
  filters: readonly string[];
  timeField?: TimeField;
  defaultSort: Record<string, 1 | -1>;
  groupByGame?: boolean;
  gameTableColumns?: readonly string[];
};

export const TRACKED_COLLECTIONS: Record<CollectionKey, CollectionConfig> = {
  user_daily: {
    label: "User Daily",
    description: "Per-user messages and voice time",
    fields: ["day", "guild_id", "user_id", "messages", "voice_seconds"],
    filters: ["day", "guild_id", "user_id"],
    timeField: "day",
    defaultSort: { day: -1, user_id: 1 },
  },
  channel_daily: {
    label: "Channel Daily",
    description: "Per-channel messages and voice time",
    fields: ["day", "guild_id", "channel_id", "messages", "voice_seconds"],
    filters: ["day", "guild_id", "channel_id"],
    timeField: "day",
    defaultSort: { day: -1, channel_id: 1 },
  },
  activity_totals: {
    label: "Games Played",
    description: "Play time and players per game or app",
    fields: ["guild_id", "user_id", "activity_name", "total_seconds"],
    filters: ["activity_name"],
    groupByGame: true,
    gameTableColumns: [
      "activity_name",
      "total_seconds",
      "player_count",
      "session_count",
    ],
    defaultSort: { total_seconds: -1 },
  },
  activity_sessions: {
    label: "Game Sessions",
    description: "How often each game was played in this period",
    fields: ["guild_id", "user_id", "activity_name", "started_at_ms"],
    filters: ["activity_name"],
    timeField: "started_at_ms",
    groupByGame: true,
    gameTableColumns: [
      "activity_name",
      "session_count",
      "player_count",
    ],
    defaultSort: { started_at_ms: -1 },
  },
  voice_sessions: {
    label: "Voice Sessions",
    description: "Active voice channel sessions",
    fields: ["guild_id", "user_id", "channel_id", "started_at_ms"],
    filters: ["guild_id", "user_id", "channel_id"],
    timeField: "started_at_ms",
    defaultSort: { started_at_ms: -1 },
  },
  member_joins: {
    label: "Member Joins",
    description: "Member join events",
    fields: ["guild_id", "user_id", "joined_at_ms"],
    filters: ["guild_id", "user_id"],
    timeField: "joined_at_ms",
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
    timeField: "boosted_at_ms",
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
    title: "Games & voice",
    keys: ["activity_totals", "voice_sessions"],
  },
  {
    title: "Other events",
    keys: ["member_joins", "economy_balances", "boost_events"],
  },
];

/** Columns hidden from tables (still used for filters and API). */
export const HIDDEN_TABLE_COLUMNS = new Set([
  "_id",
  "day",
  "guild_id",
]);

export function getDisplayColumns(
  collection: CollectionKey,
): string[] {
  const config = TRACKED_COLLECTIONS[collection];
  if (config.groupByGame && config.gameTableColumns) {
    return [...config.gameTableColumns];
  }
  return config.fields.filter((field) => !HIDDEN_TABLE_COLUMNS.has(field));
}

export const FILTER_LABELS: Record<string, string> = {
  day: "Day",
  guild_id: "Guild ID",
  user_id: "User",
  channel_id: "Channel",
  activity_name: "Game",
  player_count: "Players",
  session_count: "Sessions",
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
