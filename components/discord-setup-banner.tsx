"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

export function DiscordSetupBanner() {
  const [configured, setConfigured] = useState<boolean | null>(null);

  useEffect(() => {
    fetch("/api/discord/status")
      .then((r) => r.json())
      .then((j) => setConfigured(Boolean(j.configured)))
      .catch(() => setConfigured(false));
  }, []);

  if (configured !== false) return null;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <p>
          Add{" "}
          <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">
            DISCORD_BOT_TOKEN
          </code>{" "}
          to <code className="rounded bg-black/30 px-1.5 py-0.5 font-mono text-xs">.env.local</code>{" "}
          (your DegenerateBot token) to show usernames, avatars, and voice
          channel names. Restart the dev server after saving.
        </p>
      </div>
    </div>
  );
}
