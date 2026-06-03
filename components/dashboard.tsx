"use client";

import { useCallback, useEffect, useState } from "react";
import {
  BarChart3,
  Database,
  Layers,
  Sparkles,
  Trophy,
} from "lucide-react";

import {
  COLLECTION_GROUPS,
  COLLECTION_KEYS,
  type CollectionKey,
  TRACKED_COLLECTIONS,
} from "@/lib/collections";
import { CategoryPanel } from "@/components/category-panel";
import { EnvSetupBanner } from "@/components/discord-setup-banner";
import { LeaderboardPanel } from "@/components/leaderboard-panel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type CollectionMeta = {
  key: CollectionKey;
  count: number;
};

const NAV = [
  { id: "leaderboard", label: "Leaderboards", icon: Trophy },
  { id: "data", label: "All data", icon: Database },
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
      <div
        className="pointer-events-none fixed inset-0 -z-10 bg-[#0a0a0f]"
        aria-hidden
      >
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_50%_at_50%_-20%,rgba(124,58,237,0.35),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_100%_50%,rgba(217,70,239,0.12),transparent)]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_50%_30%_at_0%_80%,rgba(59,130,246,0.1),transparent)]" />
        <div
          className="absolute inset-0 opacity-[0.03]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,.08) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.08) 1px, transparent 1px)",
            backgroundSize: "48px 48px",
          }}
        />
      </div>

      <header className="sticky top-0 z-50 border-b border-white/5 bg-background/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 md:px-8">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 shadow-lg shadow-violet-600/30">
              <Sparkles className="size-4 text-white" />
            </div>
            <div>
              <h1 className="text-base font-semibold leading-tight tracking-tight">
                DegenerateBot
              </h1>
              <p className="text-xs text-muted-foreground">Activity dashboard</p>
            </div>
          </div>
          <div className="hidden items-center gap-2 sm:flex">
            <Badge variant="secondary" className="gap-1 tabular-nums">
              <BarChart3 className="size-3" />
              {totalDocs} records
            </Badge>
          </div>
        </div>
        <nav className="mx-auto flex max-w-7xl gap-1 overflow-x-auto px-4 pb-2 md:px-8">
          {NAV.map(({ id, label, icon: Icon }) => (
            <Button
              key={id}
              size="sm"
              variant={activeSection === id ? "default" : "ghost"}
              className={cn(
                "shrink-0 gap-1.5",
                activeSection === id &&
                  "bg-violet-600 hover:bg-violet-600/90 text-white",
              )}
              onClick={() => scrollTo(id)}
            >
              <Icon className="size-3.5" />
              {label}
            </Button>
          ))}
          <span className="mx-1 w-px shrink-0 self-center bg-border" />
          {COLLECTION_KEYS.map((key) => (
            <Button
              key={key}
              size="sm"
              variant="ghost"
              className="shrink-0 text-xs text-muted-foreground hover:text-foreground"
              onClick={() => scrollTo(key)}
            >
              {TRACKED_COLLECTIONS[key].label}
            </Button>
          ))}
        </nav>
      </header>

      <EnvSetupBanner />

      <main className="mx-auto max-w-7xl space-y-10 px-4 py-8 md:px-8 md:py-12">
        <section id="leaderboard" className="scroll-mt-28 space-y-4">
          <div className="flex items-center gap-2">
            <Trophy className="size-5 text-amber-400" />
            <h2 className="text-lg font-semibold">Leaderboards</h2>
          </div>
          <LeaderboardPanel />
        </section>

        <section id="data" className="scroll-mt-28 space-y-8">
          <div className="flex items-center gap-2">
            <Layers className="size-5 text-violet-400" />
            <h2 className="text-lg font-semibold">Tracked data</h2>
            <p className="text-sm text-muted-foreground">
              — filter and browse every category
            </p>
          </div>

          {COLLECTION_GROUPS.map((group) => (
            <div key={group.title} className="space-y-4">
              <h3 className="text-sm font-medium uppercase tracking-wider text-muted-foreground">
                {group.title}
              </h3>
              <div className="space-y-6">
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

      <footer className="border-t border-white/5 py-6 text-center text-xs text-muted-foreground">
        DegenerateBot tracker · data from MongoDB
      </footer>
    </div>
  );
}
