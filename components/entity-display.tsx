"use client";

import { useState } from "react";
import { Gamepad2, Hash, Mic, User } from "lucide-react";

import type { ResolvePayload } from "@/lib/discord/types";
import { formatCell, formatNumber, shortenId } from "@/lib/format";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
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
        <Skeleton className={cn("rounded-full", compact ? "size-7" : "size-8")} />
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
      className={cn(
        "flex min-w-0 items-center gap-2 py-0.5",
        compact && "gap-1.5",
      )}
      title={`${user.displayName} (${userId})`}
    >
      <Avatar size={compact ? "sm" : "default"} className="shrink-0">
        <AvatarImage src={user.avatarUrl} alt={user.displayName} />
        <AvatarFallback>{user.displayName.slice(0, 1)}</AvatarFallback>
      </Avatar>
      <div className="min-w-0">
        <p
          className={cn(
            "truncate font-medium",
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
      <Badge variant="outline" title={channelId}>
        <Mic className="size-3.5" />
        {shortenId(channelId, 10)}
      </Badge>
    );
  }

  const Icon = isVoice ? Mic : Hash;

  return (
    <Badge variant="outline" className="max-w-full" title={channelId}>
      <Icon className="size-3.5 shrink-0" />
      <span className="truncate">
        {!isVoice && !channel.name.startsWith("#") ? "#" : ""}
        {channel.name}
      </span>
    </Badge>
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
    <span className="inline-flex min-w-0 items-center gap-2" title={guildId}>
      {guild.iconUrl ? (
        <Avatar size="sm" className="rounded-md">
          <AvatarImage src={guild.iconUrl} alt={guild.name} />
          <AvatarFallback>{guild.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
      ) : (
        <Hash className="size-4 shrink-0 text-muted-foreground" />
      )}
      <span className="truncate text-sm font-medium">{guild.name}</span>
    </span>
  );
}

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
    return <Skeleton className="size-8 shrink-0 rounded-full" />;
  }

  if (!user) {
    return (
      <Avatar size="sm" title={userId}>
        <AvatarFallback>
          <User className="size-3.5" />
        </AvatarFallback>
      </Avatar>
    );
  }

  return (
    <Avatar size="sm" className="shrink-0" title={userId}>
      <AvatarImage src={user.avatarUrl} alt={user.displayName} />
      <AvatarFallback>{user.displayName.slice(0, 1)}</AvatarFallback>
    </Avatar>
  );
}

export function GameIcon({
  name,
  iconUrl,
}: {
  name: string;
  iconUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(iconUrl) && !failed;

  return (
    <Avatar size="sm" className="shrink-0 rounded-md" title={name}>
      {showImage ? (
        <AvatarImage
          src={iconUrl!}
          alt={name}
          onError={() => setFailed(true)}
        />
      ) : null}
      <AvatarFallback className="rounded-md">
        <Gamepad2 className="size-3.5" />
      </AvatarFallback>
    </Avatar>
  );
}

export function GameDisplay({
  name,
  iconUrl,
}: {
  name: string;
  iconUrl?: string | null;
}) {
  return (
    <div
      className="flex min-w-0 max-w-full items-center gap-2 py-0.5"
      title={name}
    >
      <GameIcon name={name} iconUrl={iconUrl} />
      <span className="truncate text-sm font-medium">{name}</span>
    </div>
  );
}

export function DataCell({
  column,
  value,
  row,
  resolved,
  loading,
  gameIcons,
}: {
  column: string;
  value: unknown;
  row: Record<string, unknown>;
  resolved: ResolvePayload;
  loading?: boolean;
  gameIcons?: Record<string, string | null>;
}) {
  if (column === "_id") {
    return (
      <span className="font-mono text-[10px] text-muted-foreground">
        {shortenId(String(value ?? ""), 6)}
      </span>
    );
  }

  if (column === "activity_name" && value) {
    const activityName = String(value);
    return (
      <GameDisplay
        name={activityName}
        iconUrl={gameIcons?.[activityName] ?? undefined}
      />
    );
  }

  if (column === "player_count" || column === "session_count") {
    const n = Number(value ?? 0);
    return (
      <span className="text-sm tabular-nums">
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
