"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
  Gamepad2,
  MessageSquare,
  Mic,
  RefreshCw,
} from "lucide-react";

import type { DateRange, TimePreset } from "@/lib/dates";
import {
  RankedLeaderGameAvatar,
  RankedLeaderUserAvatar,
  rankTopCardClassName,
} from "@/components/entity-display";
import { TimeRangeFilter } from "@/components/time-range-filter";
import { useDiscordResolve } from "@/hooks/use-discord-resolve";
import { useGameIcons } from "@/hooks/use-game-icons";
import { formatDuration, formatNumber, shortenId } from "@/lib/format";
import { sortByNumber, toggleSortOrder, type SortOrder } from "@/lib/sort";
import { SortIconButton } from "@/components/sort-icon-button";
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
import { Item, ItemGroup } from "@/components/ui/item";
import { Skeleton } from "@/components/ui/skeleton";
import {
  LEADERBOARD_COLUMN_CLASS,
  LEADERBOARD_LIST_CLASS,
  MAIN_PANEL_CARD_CLASS,
} from "@/lib/panel-layout";
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
    <div className={LEADERBOARD_COLUMN_CLASS}>
      <div className="flex items-center justify-between gap-2 pe-0.5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="size-8 rounded-md p-0">
            <Icon className="size-4" />
          </Badge>
          <h3 className="font-medium">{title}</h3>
        </div>
        <SortIconButton
          sortOrder={sortOrder}
          onClick={() => onSortOrderChange(toggleSortOrder(sortOrder))}
          label={title}
        />
      </div>

      <ItemGroup className={LEADERBOARD_LIST_CLASS}>
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Item key={i} variant="outline" className="items-center gap-3 py-3">
              <div className="relative shrink-0">
                <Skeleton className="size-11 rounded-full" />
                <Skeleton className="absolute -top-0.5 -left-0.5 size-5 rounded-full" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-10" />
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
                className={cn(
                  "flex-nowrap items-center gap-3 py-3",
                  rankTopCardClassName(rank),
                )}
              >
                <RankedLeaderUserAvatar
                  rank={rank}
                  userId={entry.user_id}
                  resolved={resolved}
                  loading={resolving}
                />
                <div
                  className="min-w-0 flex-1 basis-0 space-y-0.5"
                  title={
                    user
                      ? `${user.displayName} (@${user.username})`
                      : entry.user_id
                  }
                >
                  <p className="font-medium leading-snug break-words">
                    {user?.displayName ?? shortenId(entry.user_id, 10)}
                  </p>
                  <p className="text-sm text-muted-foreground break-all">
                    {user ? `@${user.username}` : "\u00a0"}
                  </p>
                </div>
                <span className="shrink-0 pe-1 text-sm font-semibold tabular-nums text-primary">
                  {formatValue(entry.total)}
                </span>
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
    <div className={LEADERBOARD_COLUMN_CLASS}>
      <div className="flex items-center justify-between gap-2 pe-0.5">
        <div className="flex items-center gap-2">
          <Badge variant="secondary" className="size-8 rounded-md p-0">
            <Gamepad2 className="size-4" />
          </Badge>
          <h3 className="font-medium">{title}</h3>
        </div>
        <SortIconButton
          sortOrder={sortOrder}
          onClick={() => onSortOrderChange(toggleSortOrder(sortOrder))}
          label={title}
        />
      </div>

      <ItemGroup className={LEADERBOARD_LIST_CLASS}>
        {loading &&
          Array.from({ length: PAGE_SIZE }).map((_, i) => (
            <Item key={i} variant="outline" className="items-center gap-3 py-3">
              <div className="relative shrink-0">
                <Skeleton className="size-11 rounded-full" />
                <Skeleton className="absolute -top-0.5 -left-0.5 size-5 rounded-full" />
              </div>
              <div className="flex flex-1 flex-col gap-1">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-20" />
              </div>
              <Skeleton className="h-4 w-10" />
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
                className={cn(
                  "flex-nowrap items-center gap-3 py-3",
                  rankTopCardClassName(rank),
                )}
              >
                <RankedLeaderGameAvatar
                  rank={rank}
                  name={entry.activity_name}
                  iconUrl={gameIcons[entry.activity_name]}
                />
                <div
                  className="min-w-0 flex-1 basis-0 space-y-0.5"
                  title={entry.activity_name}
                >
                  <p className="font-medium leading-snug break-words">
                    {entry.activity_name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.player_count}{" "}
                    {entry.player_count === 1 ? "player" : "players"}
                  </p>
                </div>
                <span className="shrink-0 pe-1 text-sm font-semibold tabular-nums text-primary">
                  {formatDuration(entry.total)}
                </span>
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

export function LeaderboardPanel({ className }: { className?: string }) {
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
    <Card className={cn(MAIN_PANEL_CARD_CLASS, className)}>
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

        <div className="grid gap-8 lg:grid-cols-3 lg:pe-1 [&>div]:min-w-0">
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
