"use client";

import { useState } from "react";
import { Crown, Gamepad2, Hash, Mic, User } from "lucide-react";

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
            "break-words font-medium",
            compact ? "text-xs" : "text-sm",
          )}
          title={user.displayName}
        >
          {user.displayName}
        </p>
        {!compact && (
          <p
            className="break-all text-xs text-muted-foreground"
            title={`@${user.username}`}
          >
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

const RANK_CROWN_STYLES = [
  "border-amber-500/60 bg-amber-950/90 text-amber-300 [&>svg]:text-amber-300",
  "border-zinc-400/60 bg-zinc-900/90 text-zinc-200 [&>svg]:text-zinc-200",
  "border-orange-600/60 bg-orange-950/90 text-orange-200 [&>svg]:text-orange-300",
] as const;

/** Lighter tints of crown colors for leaderboard row cards (ranks 1–3). */
const RANK_TOP_CARD_STYLES = [
  "border-amber-500/25 bg-amber-500/8",
  "border-zinc-400/22 bg-zinc-400/7",
  "border-orange-600/25 bg-orange-500/8",
] as const;

export function rankTopCardClassName(rank: number): string | undefined {
  if (rank >= 3) return undefined;
  return RANK_TOP_CARD_STYLES[rank];
}

export function RankedAvatarBadge({ rank }: { rank: number }) {
  const display = rank + 1;
  if (rank < 3) {
    return (
      <span
        className={cn(
          "absolute -top-0.5 -left-0.5 z-10 flex size-5 items-center justify-center rounded-full border ring-1 ring-background",
          RANK_CROWN_STYLES[rank],
        )}
      >
        <Crown className="size-2.5" />
      </span>
    );
  }
  return (
    <span className="absolute -top-0.5 -left-0.5 z-10 flex size-5 items-center justify-center rounded-full border border-border bg-muted text-[9px] font-bold tabular-nums ring-1 ring-background">
      {display}
    </span>
  );
}

export function RankedLeaderUserAvatar({
  rank,
  userId,
  resolved,
  loading,
}: {
  rank: number;
  userId: string;
  resolved: ResolvePayload;
  loading?: boolean;
}) {
  const user = resolved.users[userId];

  if (loading && !user) {
    return (
      <div className="relative shrink-0">
        <Skeleton className="size-11 rounded-full" />
        <Skeleton className="absolute -top-0.5 -left-0.5 size-5 rounded-full" />
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <Avatar size="lg" className="size-11" title={userId}>
        {user ? (
          <>
            <AvatarImage src={user.avatarUrl} alt={user.displayName} />
            <AvatarFallback>{user.displayName.slice(0, 1)}</AvatarFallback>
          </>
        ) : (
          <AvatarFallback>
            <User className="size-4" />
          </AvatarFallback>
        )}
      </Avatar>
      <RankedAvatarBadge rank={rank} />
    </div>
  );
}

export function RankedLeaderGameAvatar({
  rank,
  name,
  iconUrl,
}: {
  rank: number;
  name: string;
  iconUrl?: string | null;
}) {
  const [failed, setFailed] = useState(false);
  const showImage = Boolean(iconUrl) && !failed;

  return (
    <div className="relative shrink-0">
      <Avatar size="lg" className="size-11" title={name}>
        {showImage ? (
          <AvatarImage
            src={iconUrl!}
            alt={name}
            onError={() => setFailed(true)}
          />
        ) : null}
        <AvatarFallback>
          <Gamepad2 className="size-4" />
        </AvatarFallback>
      </Avatar>
      <RankedAvatarBadge rank={rank} />
    </div>
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
