"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  ArrowDownWideNarrow,
  ArrowUpWideNarrow,
  RefreshCw,
} from "lucide-react";

import {
  type CollectionKey,
  getDisplayColumns,
  TRACKED_COLLECTIONS,
} from "@/lib/collections";
import { resolveDateRange, type TimePreset } from "@/lib/dates";
import { collectionSupportsTimeFilter } from "@/lib/time-filter";
import {
  sortOrderLabel,
  sortRowsByColumn,
  toggleSortOrder,
  type SortOrder,
} from "@/lib/sort";
import { DataCell } from "@/components/entity-display";
import { TimeRangeFilter } from "@/components/time-range-filter";
import { useDiscordResolve } from "@/hooks/use-discord-resolve";
import { useGameIcons } from "@/hooks/use-game-icons";
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
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type DataResponse = {
  total: number;
  items: Record<string, unknown>[];
};

const USER_DAILY_SORT_COLUMNS = ["messages", "voice_seconds"] as const;
type UserDailySortColumn = (typeof USER_DAILY_SORT_COLUMNS)[number];

function isUserDailySortColumn(col: string): col is UserDailySortColumn {
  return USER_DAILY_SORT_COLUMNS.includes(col as UserDailySortColumn);
}

const LABEL_COLUMNS = new Set(["user_id", "channel_id", "activity_name"]);

function isLabelColumn(col: string): boolean {
  return LABEL_COLUMNS.has(col);
}

function SortableTableHead({
  label,
  sortOrder,
  onToggle,
}: {
  label: string;
  sortOrder: SortOrder;
  onToggle: () => void;
}) {
  return (
    <TableHead>
      <div className="flex items-center justify-end gap-2">
        <span>{label}</span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-7 gap-1.5 text-xs"
          onClick={onToggle}
        >
          {sortOrder === "desc" ? (
            <ArrowDownWideNarrow className="size-3.5" />
          ) : (
            <ArrowUpWideNarrow className="size-3.5" />
          )}
          {sortOrderLabel(sortOrder)}
        </Button>
      </div>
    </TableHead>
  );
}

export function CategoryPanel({
  collection,
  docCount,
}: {
  collection: CollectionKey;
  docCount?: number;
}) {
  const config = TRACKED_COLLECTIONS[collection];
  const hasTimeFilter = collectionSupportsTimeFilter(collection);
  const isUserDaily = collection === "user_daily";
  const [preset, setPreset] = useState<TimePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [messagesSort, setMessagesSort] = useState<SortOrder>("desc");
  const [voiceSort, setVoiceSort] = useState<SortOrder>("desc");
  const [activeSortColumn, setActiveSortColumn] =
    useState<UserDailySortColumn>("messages");

  const range = useMemo(
    () => resolveDateRange(preset, customFrom, customTo),
    [preset, customFrom, customTo],
  );

  const isByGame = Boolean(config.groupByGame);

  const columns = useMemo(
    () => getDisplayColumns(collection),
    [collection],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        collection,
        limit: "all",
        page: "1",
        preset: hasTimeFilter ? preset : "all",
      });
      if (hasTimeFilter && preset === "custom") {
        if (customFrom.trim()) params.set("from", customFrom.trim());
        if (customTo.trim()) params.set("to", customTo.trim());
      }

      const res = await fetch(`/api/data?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load");
      setData({ total: json.total, items: json.items });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [collection, customFrom, customTo, hasTimeFilter, preset]);

  useEffect(() => {
    load();
  }, [load]);

  const sortedItems = useMemo(() => {
    const items = data?.items ?? [];
    if (!isUserDaily) return items;
    const order =
      activeSortColumn === "messages" ? messagesSort : voiceSort;
    return sortRowsByColumn(items, activeSortColumn, order);
  }, [activeSortColumn, data?.items, isUserDaily, messagesSort, voiceSort]);

  const showing = sortedItems.length;
  const total = data?.total ?? docCount ?? 0;

  const { resolved, loading: resolving } = useDiscordResolve(
    isByGame ? [] : sortedItems,
  );

  const activityNames = useMemo(
    () =>
      isByGame
        ? [
            ...new Set(
              sortedItems
                .map((row) => String(row.activity_name ?? ""))
                .filter(Boolean),
            ),
          ]
        : [],
    [isByGame, sortedItems],
  );

  const { icons: gameIcons } = useGameIcons(activityNames);

  function columnLabel(col: string): string {
    if (col === "user_id") return "User";
    if (col === "channel_id") return "Channel";
    if (col === "activity_name") return "Game";
    if (col === "player_count") return "Players";
    if (col === "session_count") return "Sessions";
    if (col === "total_seconds") return "Play time";
    if (col === "messages") return "Messages";
    if (col === "voice_seconds") return "Voice time";
    return col.replace(/_/g, " ");
  }

  function toggleColumnSort(col: UserDailySortColumn) {
    if (col === "messages") {
      setMessagesSort(toggleSortOrder(messagesSort));
    } else {
      setVoiceSort(toggleSortOrder(voiceSort));
    }
    setActiveSortColumn(col);
  }

  return (
    <Card id={collection} className="scroll-mt-32">
      <CardHeader className="gap-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle>{config.label}</CardTitle>
            <CardDescription>
              {config.description}
              {hasTimeFilter && ` · ${range.label}`}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="tabular-nums">
              {loading ? "…" : `${showing}${total > showing ? ` / ${total}` : ""}`}{" "}
              rows
            </Badge>
            <Button variant="outline" size="icon-sm" onClick={load}>
              <RefreshCw
                className={cn("size-4", loading && "animate-spin")}
              />
            </Button>
          </div>
        </div>

        {hasTimeFilter ? (
          <TimeRangeFilter
            preset={preset}
            onPresetChange={setPreset}
            customFrom={customFrom}
            customTo={customTo}
            onCustomFromChange={setCustomFrom}
            onCustomToChange={setCustomTo}
            compact
          />
        ) : (
          <Badge variant="secondary">All time</Badge>
        )}
      </CardHeader>

      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <ScrollArea className="h-[min(480px,60vh)] w-full rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) =>
                  isUserDaily && isUserDailySortColumn(col) ? (
                    <SortableTableHead
                      key={col}
                      label={columnLabel(col)}
                      sortOrder={
                        col === "messages" ? messagesSort : voiceSort
                      }
                      onToggle={() => toggleColumnSort(col)}
                    />
                  ) : (
                    <TableHead
                      key={col}
                      className={isLabelColumn(col) ? "text-left" : "text-right"}
                    >
                      {columnLabel(col)}
                    </TableHead>
                  ),
                )}
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading &&
                Array.from({ length: 4 }).map((_, i) => (
                  <TableRow key={i}>
                    {columns.map((col) => (
                      <TableCell key={col}>
                        <Skeleton className="h-4 w-full min-w-12" />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}

              {!loading && sortedItems.length === 0 && (
                <TableRow>
                  <TableCell colSpan={columns.length}>
                    <Empty className="border-0 py-8">
                      <EmptyHeader>
                        <EmptyTitle>No records in this period</EmptyTitle>
                        <EmptyDescription>
                          Try a different time range.
                        </EmptyDescription>
                      </EmptyHeader>
                    </Empty>
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                sortedItems.map((row, index) => (
                  <TableRow key={`${row._id}-${index}`}>
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        className={cn(
                          "align-middle",
                          isLabelColumn(col)
                            ? "max-w-[280px] py-3 text-left"
                            : "max-w-[240px] text-right tabular-nums",
                        )}
                      >
                        <DataCell
                          column={col}
                          value={row[col]}
                          row={row}
                          resolved={resolved}
                          loading={resolving}
                          gameIcons={isByGame ? gameIcons : undefined}
                        />
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>
    </Card>
  );
}
