const TTL_MS = 60 * 60 * 1000;

type Entry = { value: unknown; expires: number };

const store = new Map<string, Entry>();

export function cacheGet<T>(key: string): T | undefined {
  const entry = store.get(key);
  if (!entry || entry.expires < Date.now()) {
    store.delete(key);
    return undefined;
  }
  return entry.value as T;
}

export function cacheSet(key: string, value: unknown, ttlMs = TTL_MS): void {
  store.set(key, { value, expires: Date.now() + ttlMs });
}
