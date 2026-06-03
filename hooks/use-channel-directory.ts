"use client";

import { useCallback, useEffect, useState } from "react";

export type ChannelOption = {
  id: string;
  name: string;
  type?: number;
  isVoice: boolean;
};

const cache = new Map<string, { channels: ChannelOption[]; fetchedAt: number }>();
const CACHE_MS = 5 * 60 * 1000;

function cacheKey(guildId?: string) {
  return guildId?.trim() || "__all__";
}

export function useChannelDirectory(guildId?: string) {
  const [channels, setChannels] = useState<ChannelOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const key = cacheKey(guildId);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.fetchedAt < CACHE_MS) {
      setChannels(hit.channels);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (guildId?.trim()) params.set("guild_id", guildId.trim());

      const res = await fetch(`/api/channels?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load channels");

      const list = json.channels as ChannelOption[];
      cache.set(key, { channels: list, fetchedAt: Date.now() });
      setChannels(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load channels");
      setChannels([]);
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    load();
  }, [load]);

  return { channels, loading, error, refresh: load };
}
