import type { CollectionKey } from "@/lib/collections";
import type { DateRange } from "@/lib/dates";
import { buildTimeRangeFilter } from "@/lib/time-filter";
import type { Db } from "mongodb";

export type GameActivityRow = {
  activity_name: string;
  total_seconds: number;
  player_count: number;
  session_count: number;
};

export function isGameGroupedCollection(collection: CollectionKey): boolean {
  return collection === "activity_totals" || collection === "activity_sessions";
}

function sessionTimeFilter(range: DateRange): Record<string, unknown> {
  return buildTimeRangeFilter("activity_sessions", range);
}

export async function fetchGameActivityLeaderboard(
  db: Db,
  options: { guildId?: string; limit: number },
): Promise<GameActivityRow[]> {
  const match: Record<string, unknown> = {};
  if (options.guildId) match.guild_id = options.guildId;

  const rows = await db
    .collection("activity_totals")
    .aggregate<{
      activity_name: string;
      total_seconds: number;
      player_count: number;
    }>([
      { $match: match },
      {
        $group: {
          _id: "$activity_name",
          total_seconds: { $sum: "$total_seconds" },
          players: { $addToSet: "$user_id" },
        },
      },
      { $match: { total_seconds: { $gt: 0 } } },
      { $sort: { total_seconds: -1 } },
      { $limit: options.limit },
      {
        $project: {
          _id: 0,
          activity_name: "$_id",
          total_seconds: 1,
          player_count: { $size: "$players" },
        },
      },
    ])
    .toArray();

  return rows.map((row) => ({
    ...row,
    session_count: 0,
  }));
}

export async function fetchGameActivityTable(
  db: Db,
  collection: "activity_totals" | "activity_sessions",
  options: {
    range: DateRange;
    guildId?: string;
    activityName?: string;
    limit: number;
  },
): Promise<{ total: number; items: GameActivityRow[] }> {
  const baseMatch: Record<string, unknown> = {};
  if (options.guildId) baseMatch.guild_id = options.guildId;
  if (options.activityName) {
    baseMatch.activity_name = {
      $regex: options.activityName,
      $options: "i",
    };
  }

  if (collection === "activity_totals") {
    const hasRange = Boolean(options.range.from || options.range.to);

    if (!hasRange) {
      const pipeline = [
        { $match: baseMatch },
        {
          $group: {
            _id: "$activity_name",
            total_seconds: { $sum: "$total_seconds" },
            players: { $addToSet: "$user_id" },
          },
        },
        { $match: { total_seconds: { $gt: 0 } } },
        { $sort: { total_seconds: -1 as const } },
        { $limit: options.limit },
      ];

      const [items, countResult] = await Promise.all([
        db
          .collection("activity_totals")
          .aggregate<{
            activity_name: string;
            total_seconds: number;
            player_count: number;
          }>([
            ...pipeline,
            {
              $project: {
                _id: 0,
                activity_name: "$_id",
                total_seconds: 1,
                player_count: { $size: "$players" },
              },
            },
          ])
          .toArray(),
        db
          .collection("activity_totals")
          .aggregate<{ count: number }>([
            { $match: baseMatch },
            { $group: { _id: "$activity_name" } },
            { $count: "count" },
          ])
          .toArray(),
      ]);

      return {
        total: countResult[0]?.count ?? items.length,
        items: items.map((row) => ({ ...row, session_count: 0 })),
      };
    }

    const sessionMatch = {
      ...baseMatch,
      ...sessionTimeFilter(options.range),
    };

    const [items, countResult] = await Promise.all([
      db
        .collection("activity_sessions")
        .aggregate<{
          activity_name: string;
          total_seconds: number;
          player_count: number;
          session_count: number;
        }>([
          { $match: sessionMatch },
          {
            $group: {
              _id: "$activity_name",
              session_count: { $sum: 1 },
              players: { $addToSet: "$user_id" },
            },
          },
          { $match: { session_count: { $gt: 0 } } },
          { $sort: { session_count: -1 as const } },
          { $limit: options.limit },
          {
            $project: {
              _id: 0,
              activity_name: "$_id",
              session_count: 1,
              player_count: { $size: "$players" },
              total_seconds: { $literal: 0 },
            },
          },
        ])
        .toArray(),
      db
        .collection("activity_sessions")
        .aggregate<{ count: number }>([
          { $match: sessionMatch },
          { $group: { _id: "$activity_name" } },
          { $count: "count" },
        ])
        .toArray(),
    ]);

    const gameNames = items.map((i) => i.activity_name);
    if (gameNames.length === 0) {
      return { total: 0, items: [] };
    }

    const totals = await db
      .collection("activity_totals")
      .aggregate<{ activity_name: string; total_seconds: number }>([
        {
          $match: {
            ...baseMatch,
            activity_name: { $in: gameNames },
          },
        },
        {
          $group: {
            _id: "$activity_name",
            total_seconds: { $sum: "$total_seconds" },
          },
        },
        {
          $project: {
            _id: 0,
            activity_name: "$_id",
            total_seconds: 1,
          },
        },
      ])
      .toArray();

    const secondsByGame = new Map(
      totals.map((t) => [t.activity_name, t.total_seconds]),
    );

    return {
      total: countResult[0]?.count ?? items.length,
      items: items.map((row) => ({
        ...row,
        total_seconds: secondsByGame.get(row.activity_name) ?? 0,
      })),
    };
  }

  const sessionMatch = {
    ...baseMatch,
    ...sessionTimeFilter(options.range),
  };

  const pipeline = [
    { $match: sessionMatch },
    {
      $group: {
        _id: "$activity_name",
        session_count: { $sum: 1 },
        players: { $addToSet: "$user_id" },
        last_seen: { $max: "$started_at_ms" },
      },
    },
    { $match: { session_count: { $gt: 0 } } },
    { $sort: { session_count: -1 as const } },
    { $limit: options.limit },
  ];

  const [items, countResult] = await Promise.all([
    db
      .collection("activity_sessions")
      .aggregate<{
        activity_name: string;
        session_count: number;
        player_count: number;
        last_seen: number;
      }>([
        ...pipeline,
        {
          $project: {
            _id: 0,
            activity_name: "$_id",
            session_count: 1,
            player_count: { $size: "$players" },
            last_seen: 1,
          },
        },
      ])
      .toArray(),
    db
      .collection("activity_sessions")
      .aggregate<{ count: number }>([
        { $match: sessionMatch },
        { $group: { _id: "$activity_name" } },
        { $count: "count" },
      ])
      .toArray(),
  ]);

  return {
    total: countResult[0]?.count ?? items.length,
    items: items.map((row) => ({
      activity_name: row.activity_name,
      total_seconds: 0,
      player_count: row.player_count,
      session_count: row.session_count,
    })),
  };
}
