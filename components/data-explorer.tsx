"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, RefreshCw, Search } from "lucide-react";

import {
  COLLECTION_KEYS,
  type CollectionKey,
  TRACKED_COLLECTIONS,
} from "@/lib/collections";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type CollectionMeta = {
  key: CollectionKey;
  label: string;
  description: string;
  count: number;
};

type DataResponse = {
  collection: CollectionKey;
  filter: Record<string, unknown>;
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  items: Record<string, unknown>[];
};

const FILTER_LABELS: Record<string, string> = {
  day: "Day (YYYY-MM-DD)",
  guild_id: "Guild ID",
  user_id: "User ID",
  channel_id: "Channel ID",
  activity_name: "Activity name",
};

function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number" && key.endsWith("_ms")) {
    return new Date(value).toLocaleString();
  }
  if (
    typeof value === "number" &&
    (key.endsWith("_seconds") || key === "balance")
  ) {
    if (key === "balance") return value.toLocaleString();
    return formatDuration(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

function emptyFilters(collection: CollectionKey): Record<string, string> {
  const filters: Record<string, string> = {};
  for (const key of TRACKED_COLLECTIONS[collection].filters) {
    filters[key] = "";
  }
  return filters;
}

export function DataExplorer() {
  const [collection, setCollection] = useState<CollectionKey>("user_daily");
  const [draftFilters, setDraftFilters] = useState(emptyFilters("user_daily"));
  const [appliedFilters, setAppliedFilters] = useState(
    emptyFilters("user_daily"),
  );
  const [page, setPage] = useState(1);
  const [meta, setMeta] = useState<CollectionMeta[]>([]);
  const [data, setData] = useState<DataResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [metaLoading, setMetaLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const activeConfig = TRACKED_COLLECTIONS[collection];
  const columns = useMemo(
    () => ["_id", ...activeConfig.fields],
    [activeConfig.fields],
  );

  const loadMeta = useCallback(async () => {
    setMetaLoading(true);
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) throw new Error("Could not load collections");
      const json = (await res.json()) as { collections: CollectionMeta[] };
      setMeta(json.collections);
    } catch {
      setMeta(
        COLLECTION_KEYS.map((key) => ({
          key,
          label: TRACKED_COLLECTIONS[key].label,
          description: TRACKED_COLLECTIONS[key].description,
          count: 0,
        })),
      );
    } finally {
      setMetaLoading(false);
    }
  }, []);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        collection,
        page: String(page),
        limit: "25",
      });
      for (const [key, value] of Object.entries(appliedFilters)) {
        if (value.trim()) params.set(key, value.trim());
      }

      const res = await fetch(`/api/data?${params.toString()}`);
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error ?? "Failed to load data");
      }
      setData(json as DataResponse);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load data");
      setData(null);
    } finally {
      setLoading(false);
    }
  }, [appliedFilters, collection, page]);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  function onCollectionChange(next: CollectionKey) {
    setCollection(next);
    const filters = emptyFilters(next);
    setDraftFilters(filters);
    setAppliedFilters(filters);
    setPage(1);
  }

  function applyFilters() {
    setAppliedFilters({ ...draftFilters });
    setPage(1);
  }

  function clearFilters() {
    const filters = emptyFilters(collection);
    setDraftFilters(filters);
    setAppliedFilters(filters);
    setPage(1);
  }

  const selectedMeta = meta.find((m) => m.key === collection);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 p-6 md:p-10">
      <header className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">
            DegenerateBot Tracker
          </h1>
          <Badge variant="secondary">MongoDB</Badge>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Browse and filter all tracked Discord stats stored in your database.
        </p>
      </header>

      <Card>
        <CardHeader className="gap-4 border-b pb-4">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div className="space-y-1">
              <CardTitle>Data explorer</CardTitle>
              <CardDescription>
                {selectedMeta?.description ?? activeConfig.description}
              </CardDescription>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {metaLoading ? (
                <Skeleton className="h-5 w-24" />
              ) : (
                <Badge variant="outline">
                  {selectedMeta?.count ?? 0} documents
                </Badge>
              )}
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  loadMeta();
                  loadData();
                }}
              >
                <RefreshCw className="size-4" />
                Refresh
              </Button>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label>Collection</Label>
              <Select
                value={collection}
                onValueChange={(value) =>
                  onCollectionChange(value as CollectionKey)
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {COLLECTION_KEYS.map((key) => {
                    const item = meta.find((m) => m.key === key);
                    return (
                      <SelectItem key={key} value={key}>
                        {TRACKED_COLLECTIONS[key].label}
                        {item ? ` (${item.count})` : ""}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {activeConfig.filters.map((key) => (
              <div key={key} className="space-y-2">
                <Label htmlFor={`filter-${key}`}>
                  {FILTER_LABELS[key] ?? key}
                </Label>
                <Input
                  id={`filter-${key}`}
                  placeholder={`Filter by ${FILTER_LABELS[key] ?? key}`}
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

          <div className="flex flex-wrap gap-2">
            <Button onClick={applyFilters}>
              <Search className="size-4" />
              Apply filters
            </Button>
            <Button variant="outline" onClick={clearFilters}>
              Clear
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-4">
          {error && (
            <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
              {error}
            </p>
          )}

          <div className="overflow-x-auto rounded-lg border">
            <Table>
              <TableHeader>
                <TableRow>
                  {columns.map((col) => (
                    <TableHead key={col} className="whitespace-nowrap">
                      {col}
                    </TableHead>
                  ))}
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading &&
                  Array.from({ length: 5 }).map((_, i) => (
                    <TableRow key={`sk-${i}`}>
                      {columns.map((col) => (
                        <TableCell key={col}>
                          <Skeleton className="h-4 w-full min-w-16" />
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}

                {!loading && data?.items.length === 0 && (
                  <TableRow>
                    <TableCell
                      colSpan={columns.length}
                      className="h-24 text-center text-muted-foreground"
                    >
                      No records match your filters.
                    </TableCell>
                  </TableRow>
                )}

                {!loading &&
                  data?.items.map((row, index) => (
                    <TableRow key={`${row._id}-${index}`}>
                      {columns.map((col) => (
                        <TableCell
                          key={col}
                          className="max-w-xs truncate font-mono text-xs sm:max-w-md sm:text-sm"
                          title={formatCell(col, row[col])}
                        >
                          {formatCell(col, row[col])}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          </div>

          <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-muted-foreground">
              {data
                ? `Page ${data.page} of ${data.totalPages} · ${data.total} total`
                : " "}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={loading || page <= 1}
                onClick={() => setPage((p) => Math.max(1, p - 1))}
              >
                <ChevronLeft className="size-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={
                  loading || !data || page >= data.totalPages || data.total === 0
                }
                onClick={() => setPage((p) => p + 1)}
              >
                Next
                <ChevronRight className="size-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
