"use client";

import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";

import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";

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
    <div className="mx-auto max-w-6xl px-4 md:px-8">
      <Alert variant="destructive" className="border-amber-500/40 bg-amber-500/10 text-amber-50">
        <AlertCircle />
        <AlertTitle>Missing environment variables</AlertTitle>
        <AlertDescription>
          <ul className="mt-2 list-inside list-disc space-y-1">
            {!status.mongodb && (
              <li>
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  MONGODB_URI
                </code>
                {", "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  MONGODB_DB
                </code>
              </li>
            )}
            {!status.discord && (
              <li>
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  DISCORD_BOT_TOKEN
                </code>{" "}
                (usernames, avatars, channel names)
              </li>
            )}
          </ul>
          <p className="mt-3">
            {onVercel ? (
              <>
                Set these in Vercel → Settings → Environment Variables, then
                redeploy.
              </>
            ) : (
              <>
                Add them to{" "}
                <code className="rounded bg-muted px-1 font-mono text-xs">
                  .env.local
                </code>{" "}
                and restart the dev server.
              </>
            )}
          </p>
        </AlertDescription>
      </Alert>
    </div>
  );
}
