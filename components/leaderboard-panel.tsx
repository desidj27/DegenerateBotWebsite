"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  ChevronLeft,
  ChevronRight,
  Crown,
  Gamepad2,
  MessageSquare,
  Mic,
  RefreshCw,
} from "lucide-react";

import type { DateRange, TimePreset } from "@/lib/dates";
import {
  GameIcon,
  LeaderboardUserDisplay,
} from "@/components/entity-display";
import { TimeRangeFilter } from "@/components/time-range-filter";
import { useDiscordResolve } from "@/hooks/use-discord-resolve";
import { useGameIcons } from "@/hooks/use-game-icons";
import { formatDuration, formatNumber, shortenId } from "@/lib/format";
import {
  sortByNumber,
  sortOrderLabel,
  toggleSortOrder,
  type SortOrder,
} from "@/lib/sort";
import type { ResolvePayload } from "@/lib/discord/types";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";
import {
  Item,
  ItemActions,
  ItemContent,
  ItemDescription,
  ItemGroup,
  ItemMedia,
  ItemTitle,
} from "@/components/ui/item";
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

const RANK_CROWN_STYLES = [
  "border-amber-500/50 bg-amber-500/20 text-amber-300 [&>svg]:text-amber-300",
  "border-zinc-400/50 bg-zinc-400/20 text-zinc-200 [&>svg]:text-zinc-200",
  "border-orange-600/50 bg-orange-700/25 text-orange-200 [&>svg]:text-orange-300",
] as const;

function RankBadge({ rank }: { rank: number }) {
  const display = rank + 1;
  if (rank < 3) {
    return (
      <Badge
        variant="outline"
        className={cn(
          "size-7 rounded-full border p-0 [&>svg]:size-3.5",
          RANK_CROWN_STYLES[rank],
        )}
      >
        <Crown />
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="size-7 rounded-full p-0 tabular-nums">
      {display}
    </Badge>
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
    <div className="flex items-center justify-between gap-2 pt-2">
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

function ListEmpty({ message }: { message: string }) {
  return (
    <Empty className="min-h-32 border border-dashed">
      <EmptyHeader>
        <EmptyTitle>{message}</EmptyTitle>
        <EmptyDescription>Try a different time range.</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function UserLeaderList({
  title,
  icon: Icon,
  entries,
  page,
  onPageChange,
  sortOrder,
  onSortOrderChange,
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
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  formatValue: (n: number) => string;
  loading: boolean;
  resolved: ResolvePayload;
  resolving: boolean;
}) {
  const sorted = useMemo(
    () => sortByNumber(entries, (e) => e.total, sortOrder),
    [entries, sortOrder],
  );
  const pages = totalPages(sorted.length);
  const visible = paginate(sorted, page);

  return (
    <div className="flex min-h-[420px] flex-col gap-3 pe-1 sm:pe-2">
      <div className="flex items-center justify-between gap-2 pe-0.5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="size-8 rounded-md p-0">
            <Icon className="size-4" />
          </Badge>
          <h3 className="font-medium">{title}</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => onSortOrderChange(toggleSortOrder(sortOrder))}
        >
          {sortOrder === "desc" ? (
            <ArrowDownWideNarrow className="size-3.5" />
          ) : (
            <ArrowUpWideNarrow className="size-3.5" />
          )}
          {sortOrderLabel(sortOrder)}
        </Button>
      </div>

      <ItemGroup className="min-h-[360px] flex-1 gap-2">
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Item key={i} variant="outline" className="h-[4.75rem]">
              <Skeleton className="size-7 rounded-full" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </Item>
          ))}

        {!loading && sorted.length === 0 && (
          <ListEmpty message="No activity in this period" />
        )}

        {!loading &&
          visible.map((entry, index) => {
            const rank = page * PAGE_SIZE + index;
            const user = resolved.users[entry.user_id];
            return (
              <Item
                key={entry.user_id}
                variant="outline"
                className="min-h-[4.75rem] items-center py-3"
              >
                <ItemMedia variant="icon" className="self-center">
                  <RankBadge rank={rank} />
                </ItemMedia>
                <ItemMedia variant="image" className="self-center">
                  <LeaderboardUserDisplay
                    userId={entry.user_id}
                    resolved={resolved}
                    loading={resolving}
                  />
                </ItemMedia>
                <ItemContent className="min-w-0 justify-center">
                  <ItemTitle className="line-clamp-none w-full">
                    {user?.displayName ?? shortenId(entry.user_id, 10)}
                  </ItemTitle>
                  <ItemDescription>
                    {user ? `@${user.username}` : "\u00a0"}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="shrink-0 pe-1">
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {formatValue(entry.total)}
                  </span>
                </ItemActions>
              </Item>
            );
          })}
      </ItemGroup>

      {!loading && (
        <ColumnPagination
          page={page}
          totalPages={pages}
          totalItems={sorted.length}
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
  sortOrder,
  onSortOrderChange,
  loading,
  gameIcons,
}: {
  title: string;
  entries: GameLeaderEntry[];
  page: number;
  onPageChange: (page: number) => void;
  sortOrder: SortOrder;
  onSortOrderChange: (order: SortOrder) => void;
  loading: boolean;
  gameIcons: Record<string, string | null>;
}) {
  const sorted = useMemo(
    () => sortByNumber(entries, (e) => e.total, sortOrder),
    [entries, sortOrder],
  );
  const pages = totalPages(sorted.length);
  const visible = paginate(sorted, page);

  return (
    <div className="flex min-h-[420px] flex-col gap-3 pe-1 sm:pe-2">
      <div className="flex items-center justify-between gap-2 pe-0.5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="size-8 rounded-md p-0">
            <Gamepad2 className="size-4" />
          </Badge>
          <h3 className="font-medium">{title}</h3>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={() => onSortOrderChange(toggleSortOrder(sortOrder))}
        >
          {sortOrder === "desc" ? (
            <ArrowDownWideNarrow className="size-3.5" />
          ) : (
            <ArrowUpWideNarrow className="size-3.5" />
          )}
          {sortOrderLabel(sortOrder)}
        </Button>
      </div>

      <ItemGroup className="min-h-[360px] flex-1 gap-2">
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Item key={i} variant="outline" className="h-[4.75rem]">
              <Skeleton className="size-7 rounded-md" />
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-9 w-full max-w-xs rounded-lg" />
                <Skeleton className="h-4 w-20" />
              </div>
              <Skeleton className="h-4 w-16" />
            </Item>
          ))}

        {!loading && sorted.length === 0 && (
          <ListEmpty message="No game activity yet" />
        )}

        {!loading &&
          visible.map((entry, index) => {
            const rank = page * PAGE_SIZE + index;
            return (
              <Item
                key={entry.activity_name}
                variant="outline"
                className="min-h-[4.75rem] items-center py-3"
              >
                <ItemMedia variant="icon" className="self-center">
                  <RankBadge rank={rank} />
                </ItemMedia>
                <ItemMedia variant="icon" className="self-center">
                  <GameIcon
                    name={entry.activity_name}
                    iconUrl={gameIcons[entry.activity_name]}
                  />
                </ItemMedia>
                <ItemContent className="min-w-0 justify-center">
                  <ItemTitle className="line-clamp-none w-full">
                    {entry.activity_name}
                  </ItemTitle>
                  <ItemDescription>
                    {entry.player_count}{" "}
                    {entry.player_count === 1 ? "player" : "players"}
                  </ItemDescription>
                </ItemContent>
                <ItemActions className="shrink-0 pe-1">
                  <span className="text-sm font-semibold tabular-nums text-primary">
                    {formatDuration(entry.total)}
                  </span>
                </ItemActions>
              </Item>
            );
          })}
      </ItemGroup>

      {!loading && (
        <ColumnPagination
          page={page}
          totalPages={pages}
          totalItems={sorted.length}
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
  const [messagesSort, setMessagesSort] = useState<SortOrder>("desc");
  const [voiceSort, setVoiceSort] = useState<SortOrder>("desc");
  const [gamesSort, setGamesSort] = useState<SortOrder>("desc");

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

  const gameNames = useMemo(
    () => data?.games.map((g) => g.activity_name) ?? [],
    [data?.games],
  );
  const { icons: gameIcons } = useGameIcons(gameNames);

  return (
    <Card>
      <CardHeader className="gap-4">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <CardTitle>Rankings</CardTitle>
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

      <CardContent className="space-y-6">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid gap-8 lg:grid-cols-3 lg:pe-1">
          <UserLeaderList
            title="Messages"
            icon={MessageSquare}
            entries={data?.messages ?? []}
            page={messagesPage}
            onPageChange={setMessagesPage}
            sortOrder={messagesSort}
            onSortOrderChange={(order) => {
              setMessagesSort(order);
              setMessagesPage(0);
            }}
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
            sortOrder={voiceSort}
            onSortOrderChange={(order) => {
              setVoiceSort(order);
              setVoicePage(0);
            }}
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
            sortOrder={gamesSort}
            onSortOrderChange={(order) => {
              setGamesSort(order);
              setGamesPage(0);
            }}
            loading={loading}
            gameIcons={gameIcons}
          />
        </div>
      </CardContent>
    </Card>
  );
}
