"use client";

import { useCallback, useEffect, useState } from "react";

export type UserOption = {
  id: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
};

const cache = new Map<string, { users: UserOption[]; fetchedAt: number }>();
const CACHE_MS = 5 * 60 * 1000;

function cacheKey(guildId?: string) {
  return guildId?.trim() || "__all__";
}

export function useUserDirectory(guildId?: string) {
  const [users, setUsers] = useState<UserOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    const key = cacheKey(guildId);
    const hit = cache.get(key);
    if (hit && Date.now() - hit.fetchedAt < CACHE_MS) {
      setUsers(hit.users);
      setLoading(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (guildId?.trim()) params.set("guild_id", guildId.trim());

      const res = await fetch(`/api/users?${params}`);
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Failed to load users");

      const list = json.users as UserOption[];
      cache.set(key, { users: list, fetchedAt: Date.now() });
      setUsers(list);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load users");
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, [guildId]);

  useEffect(() => {
    load();
  }, [load]);

  return { users, loading, error, refresh: load };
}
