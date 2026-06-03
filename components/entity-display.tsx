"use client";

import { Hash, Mic, User } from "lucide-react";

import type { ResolvePayload } from "@/lib/discord/types";
import { formatCell, shortenId } from "@/lib/format";
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

  if (loading && !channel) {
    return <Skeleton className="h-4 w-28" />;
  }

  if (!channel) {
    return (
      <span
        className="inline-flex items-center gap-1.5 font-mono text-xs text-muted-foreground"
        title={channelId}
      >
        <Mic className="size-3.5" />
        {shortenId(channelId, 10)}
      </span>
    );
  }

  return (
    <span
      className="inline-flex items-center gap-1.5 text-sm"
      title={channelId}
    >
      <Mic className="size-3.5 shrink-0 text-violet-400" />
      <span className="truncate font-medium">{channel.name}</span>
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

  if (column === "user_id" && value) {
    const guildId = row.guild_id ? String(row.guild_id) : undefined;
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
