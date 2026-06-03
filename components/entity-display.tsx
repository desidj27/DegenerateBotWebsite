"use client";

import { Gamepad2, Hash, Mic, User } from "lucide-react";

import type { ResolvePayload } from "@/lib/discord/types";
import { formatCell, formatNumber, shortenId } from "@/lib/format";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

export function UserDisplay({
  userId,
  resolved,
  loading,
  compact = false,
}: {
  userId: string;
  resolved: ResolvePayload;
  loading?: boolean;
  compact?: boolean;
}) {
  const user = resolved.users[userId];

  if (loading && !user) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="size-8 shrink-0 rounded-full" />
        {!compact && <Skeleton className="h-4 w-24" />}
      </div>
    );
  }

  if (!user) {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
        title={userId}
      >
        <User className="size-3.5 shrink-0" />
        {shortenId(userId, 10)}
      </span>
    );
  }

  return (
    <div
      className={cn("flex items-center gap-2 min-w-0", compact && "gap-1.5")}
      title={`${user.displayName} (${userId})`}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={user.avatarUrl}
        alt=""
        className={cn(
          "shrink-0 rounded-full bg-muted ring-1 ring-border",
          compact ? "size-7" : "size-8",
        )}
      />
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-medium text-foreground",
            compact ? "text-xs" : "text-sm",
          )}
        >
          {user.displayName}
        </p>
        {!compact && user.username !== user.displayName && (
          <p className="truncate text-xs text-muted-foreground">
            @{user.username}
          </p>
        )}
      </div>
    </div>
  );
}

export function ChannelDisplay({
  channelId,
  resolved,
  loading,
}: {
  channelId: string;
  resolved: ResolvePayload;
  loading?: boolean;
}) {
  const channel = resolved.channels[channelId];
  const isVoice = channel?.type === 2 || channel?.type === 13;

  if (loading && !channel) {
    return <Skeleton className="h-8 w-36 rounded-lg" />;
  }

  if (!channel) {
    return (
      <span
        className="inline-flex items-center gap-1.5 rounded-lg bg-muted/40 px-2 py-1 font-mono text-xs text-muted-foreground"
        title={channelId}
      >
        <Mic className="size-3.5" />
        {shortenId(channelId, 10)}
      </span>
    );
  }

  const Icon = isVoice ? Mic : Hash;

  return (
    <span
      className="inline-flex max-w-full items-center gap-2 rounded-lg border border-border/50 bg-muted/25 px-2.5 py-1.5"
      title={channelId}
    >
      <span
        className={cn(
          "flex size-6 shrink-0 items-center justify-center rounded-md",
          isVoice ? "bg-sky-500/15 text-sky-400" : "bg-muted text-muted-foreground",
        )}
      >
        <Icon className="size-3.5" />
      </span>
      <span className="min-w-0 truncate text-sm font-medium">
        {!isVoice && !channel.name.startsWith("#") ? "#" : ""}
        {channel.name}
      </span>
    </span>
  );
}

export function GuildDisplay({
  guildId,
  resolved,
  loading,
}: {
  guildId: string;
  resolved: ResolvePayload;
  loading?: boolean;
}) {
  const guild = resolved.guilds[guildId];

  if (loading && !guild) {
    return (
      <div className="flex items-center gap-2">
        <Skeleton className="size-6 rounded-md" />
        <Skeleton className="h-4 w-20" />
      </div>
    );
  }

  if (!guild) {
    return (
      <span className="font-mono text-xs text-muted-foreground" title={guildId}>
        {shortenId(guildId, 10)}
      </span>
    );
  }

  return (
    <span className="inline-flex items-center gap-2 min-w-0" title={guildId}>
      {guild.iconUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={guild.iconUrl}
          alt=""
          className="size-6 shrink-0 rounded-md ring-1 ring-border"
        />
      ) : (
        <Hash className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate text-sm font-medium">{guild.name}</span>
    </span>
  );
}

const LEADER_PILL_CLASS =
  "inline-flex max-w-full items-center gap-2 rounded-lg border border-border/50 bg-muted/25 px-2.5 py-1.5";

export function LeaderboardUserDisplay({
  userId,
  resolved,
  loading,
}: {
  userId: string;
  resolved: ResolvePayload;
  loading?: boolean;
}) {
  const user = resolved.users[userId];

  if (loading && !user) {
    return <Skeleton className={cn(LEADER_PILL_CLASS, "h-[2.25rem] w-full max-w-xs")} />;
  }

  if (!user) {
    return (
      <span className={LEADER_PILL_CLASS} title={userId}>
        <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-muted text-muted-foreground">
          <User className="size-3.5" />
        </span>
        <span className="truncate font-mono text-sm font-medium">
          {shortenId(userId, 10)}
        </span>
      </span>
    );
  }

  return (
    <span className={LEADER_PILL_CLASS} title={`${user.displayName} (${userId})`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={user.avatarUrl}
        alt=""
        className="size-6 shrink-0 rounded-md bg-muted object-cover ring-1 ring-border"
      />
      <span className="truncate text-sm font-medium">{user.displayName}</span>
    </span>
  );
}

export function GameDisplay({ name }: { name: string }) {
  return (
    <span className={LEADER_PILL_CLASS}>
      <span className="flex size-6 shrink-0 items-center justify-center rounded-md bg-emerald-500/15 text-emerald-400">
        <Gamepad2 className="size-3.5" />
      </span>
      <span className="truncate text-sm font-medium">{name}</span>
    </span>
  );
}

export function DataCell({
  column,
  value,
  row,
  resolved,
  loading,
}: {
  column: string;
  value: unknown;
  row: Record<string, unknown>;
  resolved: ResolvePayload;
  loading?: boolean;
}) {
  if (column === "_id") {
    return (
      <span className="font-mono text-[10px] text-muted-foreground">
        {shortenId(String(value ?? ""), 6)}
      </span>
    );
  }

  if (column === "activity_name" && value) {
    return <GameDisplay name={String(value)} />;
  }

  if (column === "player_count" || column === "session_count") {
    const n = Number(value ?? 0);
    return (
      <span className="tabular-nums text-sm">
        {n > 0 ? formatNumber(n) : "—"}
      </span>
    );
  }

  if (column === "user_id" && value) {
    return (
      <UserDisplay
        userId={String(value)}
        resolved={resolved}
        loading={loading}
      />
    );
  }

  if (column === "channel_id" && value) {
    return (
      <ChannelDisplay
        channelId={String(value)}
        resolved={resolved}
        loading={loading}
      />
    );
  }

  if (column === "guild_id" && value) {
    return (
      <GuildDisplay
        guildId={String(value)}
        resolved={resolved}
        loading={loading}
      />
    );
  }

  return (
    <span className="truncate">{formatCell(column, value)}</span>
  );
}
