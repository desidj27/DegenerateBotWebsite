"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Calendar,
  Crown,
  MessageSquare,
  Mic,
  RefreshCw,
  Trophy,
} from "lucide-react";

import type { DateRange, TimePreset } from "@/lib/dates";
import { UserDisplay } from "@/components/entity-display";
import { useDiscordResolve } from "@/hooks/use-discord-resolve";
import { formatDuration, formatNumber } from "@/lib/format";
import type { ResolvePayload } from "@/lib/discord/types";
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
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

type LeaderEntry = { user_id: string; total: number };

type LeaderboardResponse = {
  range: DateRange;
  guild_id: string | null;
  limit: number;
  messages: LeaderEntry[];
  voice: LeaderEntry[];
};

const PRESETS: { value: TimePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

const RANK_STYLES = [
  "bg-amber-500/20 text-amber-300 ring-amber-500/40",
  "bg-zinc-400/20 text-zinc-200 ring-zinc-400/30",
  "bg-orange-700/25 text-orange-200 ring-orange-600/40",
];

function LeaderList({
  title,
  icon: Icon,
  entries,
  formatValue,
  loading,
  resolved,
  resolving,
}: {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  entries: LeaderEntry[];
  formatValue: (n: number) => string;
  loading: boolean;
  resolved: ResolvePayload;
  resolving: boolean;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <div className="flex size-8 items-center justify-center rounded-lg bg-primary/15 text-primary">
          <Icon className="size-4" />
        </div>
        <h3 className="font-medium">{title}</h3>
      </div>
      <ul className="space-y-2">
        {loading &&
          Array.from({ length: 5 }).map((_, i) => (
            <li
              key={i}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/20 px-3 py-2.5"
            >
              <Skeleton className="size-7 rounded-full" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-16" />
            </li>
          ))}
        {!loading && entries.length === 0 && (
          <li className="rounded-xl border border-dashed border-border/60 px-4 py-8 text-center text-sm text-muted-foreground">
            No activity in this period
          </li>
        )}
        {!loading &&
          entries.map((entry, index) => (
            <li
              key={entry.user_id}
              className="flex items-center gap-3 rounded-xl border border-border/50 bg-muted/15 px-3 py-2.5 transition-colors hover:bg-muted/30"
            >
              <span
                className={cn(
                  "flex size-7 shrink-0 items-center justify-center rounded-full text-xs font-bold ring-1",
                  index < 3
                    ? RANK_STYLES[index]
                    : "bg-muted text-muted-foreground ring-border",
                )}
              >
                {index < 3 ? (
                  <Crown className="size-3.5" />
                ) : (
                  index + 1
                )}
              </span>
              <div className="min-w-0 flex-1">
                <UserDisplay
                  userId={entry.user_id}
                  resolved={resolved}
                  loading={resolving}
                  compact
                />
              </div>
              <span className="shrink-0 text-sm font-semibold tabular-nums text-violet-300">
                {formatValue(entry.total)}
              </span>
            </li>
          ))}
      </ul>
    </div>
  );
}

export function LeaderboardPanel() {
  const [preset, setPreset] = useState<TimePreset>("7d");
  const [customFrom, setCustomFrom] = useState("");
  const [customTo, setCustomTo] = useState("");
  const [guildId, setGuildId] = useState("");
  const [appliedGuildId, setAppliedGuildId] = useState("");
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        preset,
        limit: "25",
      });
      if (appliedGuildId.trim()) {
        params.set("guild_id", appliedGuildId.trim());
      }
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
  }, [appliedGuildId, customFrom, customTo, preset]);

  useEffect(() => {
    load();
  }, [load]);

  const leaderRows = [
    ...(data?.messages ?? []),
    ...(data?.voice ?? []),
  ].map((e) => ({
    user_id: e.user_id,
    ...(appliedGuildId.trim()
      ? { guild_id: appliedGuildId.trim() }
      : data?.guild_id
        ? { guild_id: data.guild_id }
        : {}),
  }));

  const { resolved, loading: resolving } = useDiscordResolve(
    leaderRows,
    appliedGuildId.trim() || data?.guild_id || undefined,
  );

  return (
    <Card className="overflow-hidden border-violet-500/20 bg-card/40 shadow-xl shadow-violet-950/20 backdrop-blur-md">
      <CardHeader className="border-b border-border/50 bg-gradient-to-r from-violet-600/10 via-transparent to-fuchsia-600/10 pb-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="size-5 text-amber-400" />
              <CardTitle className="text-xl">Leaderboards</CardTitle>
            </div>
            <CardDescription>
              Top members by messages and voice time
              {data?.range.label ? ` · ${data.range.label}` : ""}
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={load} disabled={loading}>
            <RefreshCw className={cn("size-4", loading && "animate-spin")} />
            Refresh
          </Button>
        </div>

        <div className="flex flex-col gap-4 pt-2">
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((p) => (
              <Button
                key={p.value}
                size="sm"
                variant={preset === p.value ? "default" : "outline"}
                className={cn(
                  preset === p.value &&
                    "bg-violet-600 hover:bg-violet-600/90 text-white",
                )}
                onClick={() => setPreset(p.value)}
              >
                {p.label}
              </Button>
            ))}
          </div>

          {preset === "custom" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">From</Label>
                <Input
                  type="date"
                  value={customFrom}
                  onChange={(e) => setCustomFrom(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">To</Label>
                <Input
                  type="date"
                  value={customTo}
                  onChange={(e) => setCustomTo(e.target.value)}
                />
              </div>
            </div>
          )}

          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <div className="flex-1 space-y-1.5">
              <Label className="text-xs text-muted-foreground">
                Server ID (optional — improves nicknames)
              </Label>
              <Input
                placeholder="Discord server ID"
                value={guildId}
                onChange={(e) => setGuildId(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") setAppliedGuildId(guildId);
                }}
              />
            </div>
            <Button
              onClick={() => setAppliedGuildId(guildId)}
              className="bg-violet-600 hover:bg-violet-600/90"
            >
              <Calendar className="size-4" />
              Apply
            </Button>
          </div>
        </div>
      </CardHeader>

      <CardContent className="pt-6">
        {error && (
          <p className="mb-4 rounded-lg border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {error}
          </p>
        )}

        <div className="mb-4 flex flex-wrap gap-2">
          <Badge variant="secondary" className="gap-1">
            <MessageSquare className="size-3" />
            {data?.messages.length ?? 0} ranked
          </Badge>
          <Badge variant="secondary" className="gap-1">
            <Mic className="size-3" />
            {data?.voice.length ?? 0} ranked
          </Badge>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <LeaderList
            title="Messages"
            icon={MessageSquare}
            entries={data?.messages ?? []}
            formatValue={formatNumber}
            loading={loading}
            resolved={resolved}
            resolving={resolving}
          />
          <LeaderList
            title="Voice time"
            icon={Mic}
            entries={data?.voice ?? []}
            formatValue={formatDuration}
            loading={loading}
            resolved={resolved}
            resolving={resolving}
          />
        </div>
      </CardContent>
    </Card>
  );
}
