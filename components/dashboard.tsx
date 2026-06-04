"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Database, Trophy } from "lucide-react";

import {
  COLLECTION_GROUPS,
  COLLECTION_KEYS,
  type CollectionKey,
} from "@/lib/collections";
import { CategoryPanel } from "@/components/category-panel";
import { EnvSetupBanner } from "@/components/discord-setup-banner";
import { LeaderboardPanel } from "@/components/leaderboard-panel";
import {
  SectionBlock,
  SectionDivider,
  SectionHeading,
} from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";

type CollectionMeta = {
  key: CollectionKey;
  count: number;
};

export function Dashboard() {
  const [meta, setMeta] = useState<CollectionMeta[]>([]);
  const [activeSection, setActiveSection] = useState("leaderboard");

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

  function scrollTo(id: string) {
    setActiveSection(id);
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-6 md:px-8">
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

          <Tabs value={activeSection} onValueChange={scrollTo}>
            <TabsList>
              <TabsTrigger value="leaderboard" className="gap-1.5">
                <Trophy className="size-3.5" />
                Leaderboards
              </TabsTrigger>
              <TabsTrigger value="data" className="gap-1.5">
                <Database className="size-3.5" />
                Data
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="py-4">
        <EnvSetupBanner />
      </div>

      <main className="mx-auto max-w-6xl space-y-12 px-4 pb-12 md:px-8">
        <SectionBlock id="leaderboard" className="scroll-mt-32 space-y-6">
          <SectionHeading
            title="Leaderboards"
            description="Messages and voice by member · games ranked by play time."
          />
          <LeaderboardPanel />
        </SectionBlock>

        <SectionDivider />

        <SectionBlock id="data" className="scroll-mt-32 space-y-8">
          <SectionHeading
            title="All categories"
            description="Browse tracked stats by collection."
          />

          {COLLECTION_GROUPS.map((group, index) => (
            <div key={group.title} className="space-y-4">
              {index > 0 && <Separator />}
              <h3 className="text-sm font-medium text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-4">
                {group.keys.map((key) => (
                  <CategoryPanel
                    key={key}
                    collection={key}
                    docCount={meta.find((m) => m.key === key)?.count}
                  />
                ))}
              </div>
            </div>
          ))}
        </SectionBlock>
      </main>

      <footer className="border-t py-6">
        <p className="text-center text-xs text-muted-foreground">
          DegenerateBot · MongoDB
        </p>
      </footer>
    </div>
  );
}
