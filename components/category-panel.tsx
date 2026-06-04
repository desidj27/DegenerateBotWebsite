"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { RefreshCw } from "lucide-react";

import {
  type CollectionKey,
  getDisplayColumns,
  TRACKED_COLLECTIONS,
} from "@/lib/collections";
import { resolveDateRange, type TimePreset } from "@/lib/dates";
import { collectionSupportsTimeFilter } from "@/lib/time-filter";
import {
  sortRowsByColumn,
  toggleSortOrder,
  type SortOrder,
} from "@/lib/sort";
import { DataCell } from "@/components/entity-display";
import { SortIconButton } from "@/components/sort-icon-button";
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
import {
  MAIN_PANEL_CARD_CLASS,
  PANEL_BODY_HEIGHT_CLASS,
} from "@/lib/panel-layout";
import { cn } from "@/lib/utils";

type DataResponse = {
  total: number;
  items: Record<string, unknown>[];
};

const CLIENT_SORT_COLUMNS: Partial<Record<CollectionKey, readonly string[]>> = {
  user_daily: ["messages", "voice_seconds"],
  channel_daily: ["messages", "voice_seconds"],
  activity_totals: ["total_seconds", "player_count", "session_count"],
};

function clientSortColumns(collection: CollectionKey): readonly string[] {
  return CLIENT_SORT_COLUMNS[collection] ?? [];
}

function isClientSortColumn(collection: CollectionKey, col: string): boolean {
  return clientSortColumns(collection).includes(col);
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
      <div className="flex items-center justify-end gap-1">
        <span>{label}</span>
        <SortIconButton
          sortOrder={sortOrder}
          onClick={onToggle}
          label={label}
        />
      </div>
    </TableHead>
  );
}

export function CategoryPanel({
  collection,
  docCount,
  className,
}: {
  collection: CollectionKey;
  docCount?: number;
  className?: string;
}) {
  const config = TRACKED_COLLECTIONS[collection];
  const hasTimeFilter = collectionSupportsTimeFilter(collection);
  const sortableColumns = clientSortColumns(collection);
  const canClientSort = sortableColumns.length > 0;
  const [preset, setPreset] = useState<TimePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sortOrders, setSortOrders] = useState<Record<string, SortOrder>>({});
  const [activeSortColumn, setActiveSortColumn] = useState(
    () => sortableColumns[0] ?? "messages",
  );

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
    if (!canClientSort) return items;
    const order = sortOrders[activeSortColumn] ?? "desc";
    return sortRowsByColumn(items, activeSortColumn, order);
  }, [activeSortColumn, canClientSort, data?.items, sortOrders]);

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

  function getSortOrder(col: string): SortOrder {
    return sortOrders[col] ?? "desc";
  }

  function toggleColumnSort(col: string) {
    setSortOrders((prev) => ({
      ...prev,
      [col]: toggleSortOrder(prev[col] ?? "desc"),
    }));
    setActiveSortColumn(col);
  }

  return (
    <Card
      id={collection}
      className={cn(MAIN_PANEL_CARD_CLASS, "scroll-mt-32", className)}
    >
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

        <ScrollArea
          className={cn(PANEL_BODY_HEIGHT_CLASS, "w-full rounded-lg border")}
        >
          <Table>
            <TableHeader>
              <TableRow>
                {columns.map((col) =>
                  canClientSort && isClientSortColumn(collection, col) ? (
                    <SortableTableHead
                      key={col}
                      label={columnLabel(col)}
                      sortOrder={getSortOrder(col)}
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
                            ? "max-w-none py-3 text-left"
                            : "text-right tabular-nums",
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
