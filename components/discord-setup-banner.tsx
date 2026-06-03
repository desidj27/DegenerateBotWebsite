"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

type EnvStatus = {
  configured: boolean;
  mongodb: boolean;
  discord: boolean;
  vercel: boolean;
  environment: string;
};

export function EnvSetupBanner() {
  const [status, setStatus] = useState<EnvStatus | null>(null);

  useEffect(() => {
    fetch("/api/discord/status")
      .then((r) => r.json())
      .then((j) => setStatus(j as EnvStatus))
      .catch(() =>
        setStatus({
          configured: false,
          mongodb: false,
          discord: false,
          vercel: false,
          environment: "unknown",
        }),
      );
  }, []);

  if (!status) return null;
  if (status.mongodb && status.discord) return null;

  const onVercel = status.vercel;

  return (
    <div className="mx-auto max-w-7xl px-4 md:px-8">
      <div className="flex gap-3 rounded-xl border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-100">
        <AlertCircle className="mt-0.5 size-4 shrink-0 text-amber-400" />
        <div className="space-y-2">
          <p className="font-medium">Missing environment variables</p>
          <ul className="list-inside list-disc space-y-1 text-amber-100/90">
            {!status.mongodb && (
              <li>
                <code className="rounded bg-black/30 px-1 font-mono text-xs">
                  MONGODB_URI
                </code>
                {", "}
                <code className="rounded bg-black/30 px-1 font-mono text-xs">
                  MONGODB_DB
                </code>
              </li>
            )}
            {!status.discord && (
              <li>
                <code className="rounded bg-black/30 px-1 font-mono text-xs">
                  DISCORD_BOT_TOKEN
                </code>{" "}
                (usernames, avatars, voice channel names)
              </li>
            )}
          </ul>
          <p className="text-amber-100/80">
            {onVercel ? (
              <>
                Set these in{" "}
                <strong>Vercel → your project → Settings → Environment Variables</strong>
                . Enable <strong>Production</strong> (and Preview if you use preview
                deploys). Then <strong>redeploy</strong> — new variables are not
                picked up until you redeploy.
              </>
            ) : (
              <>
                For local dev, add them to{" "}
                <code className="rounded bg-black/30 px-1 font-mono text-xs">
                  .env.local
                </code>{" "}
                and restart <code className="font-mono text-xs">npm run dev</code>.
                On Vercel, use Project Settings → Environment Variables instead.
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
