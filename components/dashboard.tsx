"use client";

import { useCallback, useEffect, useState } from "react";
import { BarChart3, Database, Hash, Radio, Trophy } from "lucide-react";

import {
  COLLECTION_GROUPS,
  COLLECTION_KEYS,
  type CollectionKey,
} from "@/lib/collections";
import { CategoryPanel } from "@/components/category-panel";
import { EnvSetupBanner } from "@/components/discord-setup-banner";
import { LeaderboardPanel } from "@/components/leaderboard-panel";
import {
  SectionHeading,
  SiteBackground,
} from "@/components/site-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CollectionMeta = {
  key: CollectionKey;
  count: number;
};

const NAV = [
  { id: "leaderboard", label: "Leaderboards", icon: Trophy },
  { id: "data", label: "Data", icon: Database },
] as const;

export function Dashboard() {
  const [meta, setMeta] = useState<CollectionMeta[]>([]);
  const [activeSection, setActiveSection] = useState<string>("leaderboard");
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
    <div className="relative min-h-screen">
      <SiteBackground />

      <header className="sticky top-0 z-50 border-b border-border/40 bg-background/75 backdrop-blur-2xl">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-4 py-5 md:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-1">
              <p className="font-mono text-[10px] font-medium uppercase tracking-[0.25em] text-primary">
                DegenerateBot
              </p>
              <h1 className="font-display text-3xl font-bold tracking-tight md:text-4xl">
                Activity Tracker
              </h1>
              <p className="max-w-md text-sm text-muted-foreground">
                Messages, voice, and presence — with real names from Discord.
              </p>
            </div>
            <Badge
              variant="secondary"
              className="h-8 gap-1.5 rounded-full px-3 tabular-nums"
            >
              <BarChart3 className="size-3.5 text-primary" />
              {totalDocs.toLocaleString()} records
            </Badge>
          </div>

          <nav className="flex gap-1 overflow-x-auto pb-0.5">
            {NAV.map(({ id, label, icon: Icon }) => (
              <Button
                key={id}
                size="sm"
                variant={activeSection === id ? "default" : "ghost"}
                className={cn(
                  "shrink-0 gap-1.5 rounded-full",
                  activeSection === id &&
                    "bg-primary text-primary-foreground shadow-md shadow-primary/25",
                )}
                onClick={() => scrollTo(id)}
              >
                <Icon className="size-3.5" />
                {label}
              </Button>
            ))}
          </nav>
        </div>
      </header>

      <EnvSetupBanner />

      <main className="mx-auto max-w-6xl space-y-16 px-4 py-10 md:px-8 md:py-14">
        <section id="leaderboard" className="scroll-mt-36 space-y-6">
          <SectionHeading
            eyebrow="Rankings"
            title="Leaderboards"
            description="Messages and voice by member · games ranked by play time."
            icon={Trophy}
          />
          <LeaderboardPanel />
        </section>

        <section id="data" className="scroll-mt-36 space-y-10">
          <SectionHeading
            eyebrow="Raw data"
            title="All categories"
            description="Users and channels show Discord names when your bot token is configured."
            icon={Radio}
          />

          {COLLECTION_GROUPS.map((group) => (
            <div key={group.title} className="space-y-5">
              <div className="flex items-center gap-2">
                <Hash className="size-4 text-primary/70" />
                <h3 className="font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">
                  {group.title}
                </h3>
              </div>
              <div className="space-y-5">
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
        </section>
      </main>

      <footer className="border-t border-border/30 py-8 text-center">
        <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
          DegenerateBot · MongoDB
        </p>
      </footer>
    </div>
  );
}
