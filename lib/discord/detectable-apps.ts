import { cacheGet, cacheSet } from "@/lib/discord/cache";
import { isDiscordConfigured } from "@/lib/discord/client";
import { getDiscordBotToken } from "@/lib/env";

const INDEX_CACHE_KEY = "detectable-apps-index";
const INDEX_TTL_MS = 24 * 60 * 60 * 1000;

type DetectableApp = {
  id: string;
  name: string;
  icon_hash?: string;
  aliases?: string[];
};

type AppIconEntry = {
  applicationId: string;
  iconHash: string;
};

function normalizeActivityName(name: string): string {
  return name.trim().toLowerCase();
}

export function applicationIconUrl(
  applicationId: string,
  iconHash: string,
): string {
  return `https://cdn.discordapp.com/app-icons/${applicationId}/${iconHash}.png?size=64`;
}

async function fetchDetectableApps(): Promise<DetectableApp[]> {
  const token = getDiscordBotToken();
  if (!token) return [];

  const res = await fetch("https://discord.com/api/v10/applications/detectable", {
    headers: { Authorization: `Bot ${token}` },
  });

  if (!res.ok) return [];
  const data = (await res.json()) as DetectableApp[];
  return Array.isArray(data) ? data : [];
}

async function getDetectableIndex(): Promise<Map<string, AppIconEntry>> {
  const cached = cacheGet<Map<string, AppIconEntry>>(INDEX_CACHE_KEY);
  if (cached) return cached;

  const apps = await fetchDetectableApps();
  const index = new Map<string, AppIconEntry>();

  for (const app of apps) {
    if (!app.icon_hash) continue;

    const entry: AppIconEntry = {
      applicationId: app.id,
      iconHash: app.icon_hash,
    };

    index.set(normalizeActivityName(app.name), entry);

    for (const alias of app.aliases ?? []) {
      const key = normalizeActivityName(alias);
      if (!index.has(key)) index.set(key, entry);
    }
  }

  cacheSet(INDEX_CACHE_KEY, index, INDEX_TTL_MS);
  return index;
}

export async function resolveActivityIcons(
  activityNames: string[],
): Promise<Record<string, string | null>> {
  const unique = [...new Set(activityNames.map((n) => n.trim()).filter(Boolean))];
  const result: Record<string, string | null> = {};

  if (unique.length === 0 || !isDiscordConfigured()) {
    for (const name of unique) result[name] = null;
    return result;
  }

  const index = await getDetectableIndex();

  for (const name of unique) {
    const entry = index.get(normalizeActivityName(name));
    result[name] =
      entry != null
        ? applicationIconUrl(entry.applicationId, entry.iconHash)
        : null;
  }

  return result;
}
