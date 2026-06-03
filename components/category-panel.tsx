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
import { DataCell } from "@/components/entity-display";
import { TimeRangeFilter } from "@/components/time-range-filter";
import { useDiscordResolve } from "@/hooks/use-discord-resolve";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
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

export function CategoryPanel({
  collection,
  docCount,
}: {
  collection: CollectionKey;
  docCount?: number;
}) {
  const config = TRACKED_COLLECTIONS[collection];
  const hasTimeFilter = collectionSupportsTimeFilter(collection);
  const [preset, setPreset] = useState<TimePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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

  const showing = data?.items.length ?? 0;
  const total = data?.total ?? docCount ?? 0;

  const { resolved, loading: resolving } = useDiscordResolve(
    isByGame ? [] : (data?.items ?? []),
  );

  function columnLabel(col: string): string {
    if (col === "user_id") return "User";
    if (col === "channel_id") return "Channel";
    if (col === "activity_name") return "Game";
    if (col === "player_count") return "Players";
    if (col === "session_count") return "Sessions";
    if (col === "total_seconds") return "Play time";
    return col.replace(/_/g, " ");
  }

  return (
    <Card
      id={collection}
      className="scroll-mt-28 border-border/40 bg-card/30 shadow-lg shadow-black/20 backdrop-blur-md"
    >
      <CardHeader className="gap-4 border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="space-y-1">
            <CardTitle className="font-display text-lg font-semibold">
              {config.label}
            </CardTitle>
            <CardDescription>
              {config.description}
              {hasTimeFilter && (
                <span className="text-muted-foreground/80">
                  {" "}
                  · {range.label}
                </span>
              )}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="tabular-nums">
              {loading ? "…" : `${showing}${total > showing ? ` / ${total}` : ""}`}{" "}
              rows
            </Badge>
            <Button variant="ghost" size="icon-sm" onClick={load}>
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
          <Badge variant="secondary" className="w-fit rounded-full">
            All time · no date on this data
          </Badge>
        )}
      </CardHeader>

      <CardContent className="p-0">
        {error && (
          <p className="mx-4 mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <ScrollArea className="max-h-[min(480px,60vh)] w-full">
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                {columns.map((col) => (
                  <TableHead
                    key={col}
                    className="sticky top-0 z-10 bg-muted/80 text-xs font-semibold uppercase tracking-wide backdrop-blur-sm"
                  >
                    {columnLabel(col)}
                  </TableHead>
                ))}
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

              {!loading && data?.items.length === 0 && (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-20 text-center text-muted-foreground"
                  >
                    No records in this period
                  </TableCell>
                </TableRow>
              )}

              {!loading &&
                data?.items.map((row, index) => (
                  <TableRow key={`${row._id}-${index}`}>
                    {columns.map((col) => (
                      <TableCell
                        key={col}
                        className="max-w-[240px] py-2.5 align-middle"
                      >
                        <DataCell
                          column={col}
                          value={row[col]}
                          row={row}
                          resolved={resolved}
                          loading={resolving}
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
