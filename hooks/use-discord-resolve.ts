"use client";

import { useEffect, useMemo, useState } from "react";

import { collectEntityIds } from "@/lib/discord/collect-ids";
import type { ResolvePayload } from "@/lib/discord/types";

const EMPTY: ResolvePayload = {
  configured: false,
  users: {},
  channels: {},
  guilds: {},
};

export function useDiscordResolve(
  rows: Record<string, unknown>[],
  preferredGuildId?: string,
) {
  const [resolved, setResolved] = useState<ResolvePayload>(EMPTY);
  const [loading, setLoading] = useState(false);

  const idsKey = useMemo(() => {
    const collected = collectEntityIds(rows, preferredGuildId);
    return JSON.stringify({
      guildId: collected.guildId,
      userIds: collected.userIds.sort(),
      channelIds: collected.channelIds.sort(),
      guildIds: collected.guildIds.sort(),
      userGuilds: collected.userGuilds,
    });
  }, [rows, preferredGuildId]);

  useEffect(() => {
    const { userIds, channelIds, guildIds, guildId, userGuilds } = JSON.parse(
      idsKey,
    ) as {
      userIds: string[];
      channelIds: string[];
      guildIds: string[];
      guildId?: string;
      userGuilds: Record<string, string>;
    };

    if (userIds.length === 0 && channelIds.length === 0 && guildIds.length === 0) {
      setResolved(EMPTY);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/resolve", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userIds,
        channelIds,
        guildIds,
        guildId,
        userGuilds,
      }),
    })
      .then((res) => res.json())
      .then((json: ResolvePayload) => {
        if (!cancelled) setResolved(json);
      })
      .catch(() => {
        if (!cancelled) setResolved(EMPTY);
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [idsKey]);

  return { resolved, loading };
}
