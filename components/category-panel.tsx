"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { Filter, RefreshCw } from "lucide-react";

import {
  FILTER_LABELS,
  type CollectionKey,
  TRACKED_COLLECTIONS,
} from "@/lib/collections";
import { DataCell } from "@/components/entity-display";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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

function emptyFilters(collection: CollectionKey): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const key of TRACKED_COLLECTIONS[collection].filters) {
    filters[key] = "";
  }
  return filters;
}

export function CategoryPanel({
  collection,
  docCount,
}: {
  collection: CollectionKey;
  docCount?: number;
}) {
  const config = TRACKED_COLLECTIONS[collection];
  const [draftFilters, setDraftFilters] = useState(emptyFilters(collection));
  const [appliedFilters, setAppliedFilters] = useState(emptyFilters(collection));
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const columns = useMemo(
    () => ["_id", ...config.fields],
    [config.fields],
  );

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        collection,
        limit: "all",
        page: "1",
      });
      for (const [key, value] of Object.entries(appliedFilters)) {
        if (value.trim()) params.set(key, value.trim());
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
  }, [appliedFilters, collection]);

  useEffect(() => {
    load();
  }, [load]);

  function applyFilters() {
    setAppliedFilters({ ...draftFilters });
  }

  function clearFilters() {
    const empty = emptyFilters(collection);
    setDraftFilters(empty);
    setAppliedFilters(empty);
  }

  const showing = data?.items.length ?? 0;
  const total = data?.total ?? docCount ?? 0;

  const preferredGuildId = appliedFilters.guild_id?.trim() || undefined;
  const { resolved, loading: resolving } = useDiscordResolve(
    data?.items ?? [],
    preferredGuildId,
  );

  function columnLabel(col: string): string {
    if (col === "user_id") return "User";
    if (col === "channel_id") return "Voice channel";
    if (col === "guild_id") return "Server";
    if (col === "_id") return "ID";
    return col.replace(/_/g, " ");
  }

  return (
    <Card
      id={collection}
      className="scroll-mt-24 border-border/60 bg-card/50 backdrop-blur-sm"
    >
      <CardHeader className="gap-4 border-b border-border/40 pb-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle className="text-lg">{config.label}</CardTitle>
            <CardDescription>{config.description}</CardDescription>
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

        {config.filters.length > 0 && (
          <div className="flex flex-col gap-3">
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {config.filters.map((key) => (
                <div key={key} className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {FILTER_LABELS[key] ?? key}
                  </Label>
                  <Input
                    className="h-8 bg-background/60"
                    placeholder={FILTER_LABELS[key] ?? key}
                    value={draftFilters[key] ?? ""}
                    onChange={(e) =>
                      setDraftFilters((prev) => ({
                        ...prev,
                        [key]: e.target.value,
                      }))
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyFilters();
                    }}
                  />
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="secondary"
                onClick={applyFilters}
                className="gap-1.5"
              >
                <Filter className="size-3.5" />
                Apply filters
              </Button>
              <Button size="sm" variant="ghost" onClick={clearFilters}>
                Clear
              </Button>
            </div>
          </div>
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
                    No matching records
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
