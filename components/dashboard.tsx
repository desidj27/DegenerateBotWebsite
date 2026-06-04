"use client";

import { useCallback, useEffect, useState, type ReactNode } from "react";
import {
  BarChart3,
  Coins,
  Gamepad2,
  Hash,
  Mic,
  Sparkles,
  Trophy,
  UserPlus,
  Users,
  type LucideIcon,
} from "lucide-react";

import {
  COLLECTION_KEYS,
  DATA_TAB_COLLECTIONS,
  type CollectionKey,
  type DataTabCollectionKey,
  TRACKED_COLLECTIONS,
} from "@/lib/collections";
import { CategoryPanel } from "@/components/category-panel";
import { EnvSetupBanner } from "@/components/discord-setup-banner";
import { LeaderboardPanel } from "@/components/leaderboard-panel";
import { DASHBOARD_CONTENT_CLASS } from "@/lib/panel-layout";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";

type CollectionMeta = {
  key: CollectionKey;
  count: number;
};

const COLLECTION_TAB_ICONS: Record<DataTabCollectionKey, LucideIcon> = {
  user_daily: Users,
  channel_daily: Hash,
  activity_totals: Gamepad2,
  voice_sessions: Mic,
  member_joins: UserPlus,
  economy_balances: Coins,
  boost_events: Sparkles,
};

export const DASHBOARD_TABS = [
  {
    id: "leaderboard",
    label: "Leaderboards",
    icon: Trophy,
  },
  ...DATA_TAB_COLLECTIONS.map((key) => ({
    id: key,
    label: TRACKED_COLLECTIONS[key].label,
    icon: COLLECTION_TAB_ICONS[key],
  })),
] as const;

export type DashboardTabId = (typeof DASHBOARD_TABS)[number]["id"];

const DEFAULT_TAB: DashboardTabId = DASHBOARD_TABS[0].id;

function isDataCollectionTab(tab: DashboardTabId): tab is DataTabCollectionKey {
  return tab !== "leaderboard";
}

function LeaderboardTabContent() {
  return <LeaderboardPanel />;
}

function renderActiveTab(
  tab: DashboardTabId,
  meta: CollectionMeta[],
): ReactNode {
  if (tab === "leaderboard") {
    return <LeaderboardTabContent />;
  }
  if (isDataCollectionTab(tab)) {
    return (
      <CategoryPanel
        collection={tab}
        docCount={meta.find((m) => m.key === tab)?.count}
      />
    );
  }
  return null;
}

export function Dashboard() {
  const [meta, setMeta] = useState<CollectionMeta[]>([]);
  const [activeTab, setActiveTab] = useState<DashboardTabId>(DEFAULT_TAB);

  const loadMeta = useCallback(async () => {
    try {
      const res = await fetch("/api/collections");
      if (!res.ok) return;
      const json = await res.json();
      setMeta(
        json.collections.map((c: { key: CollectionKey; count: number }) => ({
          key: c.key,
          count: c.count,
        })),
      );
    } catch {
      setMeta(COLLECTION_KEYS.map((key) => ({ key, count: 0 })));
    }
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const totalDocs = meta.reduce((sum, m) => sum + m.count, 0);

  return (
    <div className="min-h-screen bg-background">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as DashboardTabId)}
      >
        <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
          <div className={cn(DASHBOARD_CONTENT_CLASS, "flex flex-col gap-4 py-6")}>
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="space-y-1">
                <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
                  DegenerateBot
                </p>
                <h1 className="text-3xl font-semibold tracking-tight md:text-4xl">
                  Activity Tracker
                </h1>
                <p className="text-sm text-muted-foreground">
                  Messages, voice, and presence.
                </p>
              </div>
              <Badge variant="secondary" className="gap-1.5 tabular-nums">
                <BarChart3 className="size-3.5" />
                {totalDocs.toLocaleString()} records
              </Badge>
            </div>

            <TabsList className="h-auto max-w-full flex-wrap">
              {DASHBOARD_TABS.map(({ id, label, icon: Icon }) => (
                <TabsTrigger key={id} value={id} className="gap-1.5">
                  <Icon className="size-3.5" />
                  {label}
                </TabsTrigger>
              ))}
            </TabsList>
          </div>
        </header>

        <div className="py-4">
          <EnvSetupBanner />
        </div>

        <main className={cn(DASHBOARD_CONTENT_CLASS, "pb-12")}>
          {renderActiveTab(activeTab, meta)}
        </main>
      </Tabs>

      <footer className="border-t py-6">
        <p className="text-center text-xs text-muted-foreground">
          DegenerateBot · MongoDB
        </p>
      </footer>
    </div>
  );
}
