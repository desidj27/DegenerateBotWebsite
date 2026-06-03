"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Crown,
  Gamepad2,
  MessageSquare,
  Mic,
  RefreshCw,
  Trophy,
} from "lucide-react";

import type { DateRange, TimePreset } from "@/lib/dates";
import {
  GameDisplay,
  LeaderboardUserDisplay,
} from "@/components/entity-display";
import { TimeRangeFilter } from "@/components/time-range-filter";
import { useDiscordResolve } from "@/hooks/use-discord-resolve";
import { formatDuration, formatNumber } from "@/lib/format";
import type { ResolvePayload } from "@/lib/discord/types";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type UserLeaderEntry = { user_id: string; total: number };

type GameLeaderEntry = {
  activity_name: string;
  total: number;
  player_count: number;
};

type LeaderboardResponse = {
  range: DateRange;
  guild_id: string | null;
  limit: number;
  messages: UserLeaderEntry[];
  voice: UserLeaderEntry[];
  games: GameLeaderEntry[];
};

const PAGE_SIZE = 10;

const LEADER_ITEM_CLASS =
  "flex h-[4.75rem] items-center gap-3 rounded-xl border border-border/50 bg-muted/15 px-3";

const LEADER_ITEM_BODY_CLASS =
  "flex min-h-0 min-w-0 flex-1 flex-col justify-center gap-1";

const LEADER_ITEM_META_CLASS =
  "h-4 truncate text-xs leading-4 text-muted-foreground";

const RANK_STYLES = [
  "bg-amber-500/20 text-amber-300 ring-amber-500/40",
  "bg-zinc-400/20 text-zinc-200 ring-zinc-400/30",
  "bg-orange-700/25 text-orange-200 ring-orange-600/40",
];

function RankBadge({ rank }: { rank: number }) {
  const display = rank + 1;
  return (
    <span
      className={cn(
        "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1",
        rank < 3
          ? RANK_STYLES[rank]
          : "bg-muted text-muted-foreground ring-border",
      )}
    >
      {rank < 3 ? <Crown className="size-3.5" /> : display}
    </span>
  );
}

function ColumnPagination({
  page,
  totalPages,
  totalItems,
  onPageChange,
}: {
  page: number;
  totalPages: number;
  totalItems: number;
  onPageChange: (page: number) => void;
}) {
  if (totalItems === 0) return null;

  return (
    <div className="flex items-center justify-between gap-2 border-t border-border/40 pt-2">
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={page <= 0}
        onClick={() => onPageChange(page - 1)}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>
      <span className="text-center text-xs text-muted-foreground tabular-nums">
        {page + 1} / {totalPages}
        <span className="hidden sm:inline"> · {totalItems} total</span>
      </span>
      <Button
        type="button"
        variant="outline"
        size="icon-sm"
        disabled={page >= totalPages - 1}
        onClick={() => onPageChange(page + 1)}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </div>
  );
}

function paginate<T>(items: T[], page: number): T[] {
  const start = page * PAGE_SIZE;
  return items.slice(start, start + PAGE_SIZE);
}

function totalPages(count: number): number {
  return Math.max(1, Math.ceil(count / PAGE_SIZE));
}

function UserLeaderList({
  title,
  icon: Icon,
  entries,
  page,
  onPageChange,
  formatValue,
  loading,
  resolved,
  resolving,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  entries: UserLeaderEntry[];
  page: number;
  onPageChange: (page: number) => void;
  formatValue: (n: number) => string;
  loading: boolean;
  resolved: ResolvePayload;
  resolving: boolean;
}) {
  const pages = totalPages(entries.length);
  const visible = paginate(entries, page);

  return (
    <div className="flex min-h-[420px] flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-4" />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <ul className="min-h-[360px] flex-1 space-y-2">
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <li
              key={i}
              className={cn(LEADER_ITEM_CLASS, "bg-muted/20")}
            >
              <Skeleton className="size-7 rounded-full" />
              <div className={LEADER_ITEM_BODY_CLASS}>
                <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        {!loading && entries.length === 0 && (
          <li className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No activity in this period
          </li>
        )}
        {!loading &&
          visible.map((entry, index) => {
            const rank = page * PAGE_SIZE + index;
            const user = resolved.users[entry.user_id];
            return (
            <li key={entry.user_id} className={LEADER_ITEM_CLASS}>
              <RankBadge rank={rank} />
              <div className={LEADER_ITEM_BODY_CLASS}>
                <LeaderboardUserDisplay
                  userId={entry.user_id}
                  resolved={resolved}
                  loading={resolving}
                />
                <p className={LEADER_ITEM_META_CLASS}>
                  {user ? `@${user.username}` : "\u00a0"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                {formatValue(entry.total)}
              </span>
            </li>
            );
          })}
      </ul>
      {!loading && (
        <ColumnPagination
          page={page}
          totalPages={pages}
          totalItems={entries.length}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

function GameLeaderList({
  title,
  entries,
  page,
  onPageChange,
  loading,
}: {
  title: string;
  entries: GameLeaderEntry[];
  page: number;
  onPageChange: (page: number) => void;
  loading: boolean;
}) {
  const pages = totalPages(entries.length);
  const visible = paginate(entries, page);

  return (
    <div className="flex min-h-[420px] flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500/15 text-emerald-400">
          <Gamepad2 className="size-4" />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <ul className="min-h-[360px] flex-1 space-y-2">
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <li
              key={i}
              className={cn(LEADER_ITEM_CLASS, "bg-muted/20")}
            >
              <Skeleton className="size-7 rounded-md" />
              <div className={LEADER_ITEM_BODY_CLASS}>
                <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        {!loading && entries.length === 0 && (
          <li className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No game activity yet
          </li>
        )}
        {!loading &&
          visible.map((entry, index) => {
            const rank = page * PAGE_SIZE + index;
            return (
            <li key={entry.activity_name} className={LEADER_ITEM_CLASS}>
              <RankBadge rank={rank} />
              <div className={LEADER_ITEM_BODY_CLASS}>
                <GameDisplay name={entry.activity_name} />
                <p className={LEADER_ITEM_META_CLASS}>
                  {entry.player_count}{" "}
                  {entry.player_count === 1 ? "player" : "players"}
                </p>
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-primary">
                {formatDuration(entry.total)}
              </span>
            </li>
            );
          })}
      </ul>
      {!loading && (
        <ColumnPagination
          page={page}
          totalPages={pages}
          totalItems={entries.length}
          onPageChange={onPageChange}
        />
      )}
    </div>
  );
}

export function LeaderboardPanel() {
  const [preset, setPreset] = useState<TimePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messagesPage, setMessagesPage] = useState(0);
  const [voicePage, setVoicePage] = useState(0);
  const [gamesPage, setGamesPage] = useState(0);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    setMessagesPage(0);
    setVoicePage(0);
    setGamesPage(0);
    try {
      const params = new URLSearchParams({
        preset,
        limit: "100",
      });
      if (preset === "custom") {
        if (customFrom.trim()) params.set("from", customFrom.trim());
        if (customTo.trim()) params.set("to", customTo.trim());
      }

      const res = await fetch(`/api/leaderboard?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load leaderboard");
      setData(json as LeaderboardResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [customFrom, customTo, preset]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!data) return;
    setMessagesPage((p) =>
      Math.min(p, Math.max(0, totalPages(data.messages.length) - 1)),
    );
    setVoicePage((p) =>
      Math.min(p, Math.max(0, totalPages(data.voice.length) - 1)),
    );
    setGamesPage((p) =>
      Math.min(p, Math.max(0, totalPages(data.games.length) - 1)),
    );
  }, [data]);

  const leaderRows = [
    ...(data?.messages ?? []),
    ...(data?.voice ?? []),
  ].map((e) => ({ user_id: e.user_id }));

  const { resolved, loading: resolving } = useDiscordResolve(leaderRows);

  return (
    <Card className="overflow-hidden border-border/40 bg-card/35 shadow-xl shadow-black/25 backdrop-blur-md">
      <CardHeader className="border-b border-border/40 bg-gradient-to-br from-primary/10 via-transparent to-transparent pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-400" />
              <CardTitle className="font-display text-xl font-semibold">
                Rankings
              </CardTitle>
            </div>
            <CardDescription>
              Members for messages & voice · games ranked by play time
              {data?.range.label ? ` · ${data.range.label}` : ""}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <TimeRangeFilter
          preset={preset}
          onPresetChange={(next) => {
            setPreset(next);
            setMessagesPage(0);
            setVoicePage(0);
            setGamesPage(0);
          }}
          customFrom={customFrom}
          customTo={customTo}
          onCustomFromChange={setCustomFrom}
          onCustomToChange={setCustomTo}
        />
      </CardHeader>

      <CardContent className="pt-6">
        {error && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="grid gap-8 lg:grid-cols-3">
          <UserLeaderList
            title="Messages"
            icon={MessageSquare}
            entries={data?.messages ?? []}
            page={messagesPage}
            onPageChange={setMessagesPage}
            formatValue={formatNumber}
            loading={loading}
            resolved={resolved}
            resolving={resolving}
          />
          <UserLeaderList
            title="Voice time"
            icon={Mic}
            entries={data?.voice ?? []}
            page={voicePage}
            onPageChange={setVoicePage}
            formatValue={formatDuration}
            loading={loading}
            resolved={resolved}
            resolving={resolving}
          />
          <GameLeaderList
            title="Games"
            entries={data?.games ?? []}
            page={gamesPage}
            onPageChange={setGamesPage}
            loading={loading}
          />
        </div>
      </CardContent>
    </Card>
  );
}
