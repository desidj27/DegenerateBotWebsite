import { cacheGet, cacheSet } from "@/lib/discord/cache";
import { isDiscordConfigured } from "@/lib/discord/client";
import { getDiscordBotToken } from "@/lib/env";

const APPS_CACHE_KEY = "detectable-apps-list-v2";
const INDEX_CACHE_KEY = "detectable-apps-index-v2";
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

/** Known activity names → site domain for favicon fallback */
const BRAND_DOMAINS: Record<string, string> = {
  spotify: "spotify.com",
  modrinth: "modrinth.com",
  "valorant tracker app": "tracker.gg",
  "visual studio code": "code.visualstudio.com",
  medal: "medal.tv",
  "league of legends": "leagueoflegends.com",
  "escape from tarkov": "escapefromtarkov.com",
  "path of exile 2": "pathofexile.com",
  roblox: "roblox.com",
  valorant: "playvalorant.com",
  overwatch: "playoverwatch.com",
  fortnite: "fortnite.com",
  minecraft: "minecraft.net",
  "counter-strike 2": "counter-strike.net",
  "counter-strike": "counter-strike.net",
  steam: "steampowered.com",
  twitch: "twitch.tv",
  youtube: "youtube.com",
  netflix: "netflix.com",
  chrome: "google.com",
  firefox: "mozilla.org",
  discord: "discord.com",
  slack: "slack.com",
  obs: "obsproject.com",
};

function normalizeKey(name: string): string {
  return name
    .toLowerCase()
    .replace(/[™®©]/g, "")
    .replace(/[^a-z0-9]+/g, " ")
    .trim();
}

export function applicationIconUrl(
  applicationId: string,
  iconHash: string,
): string {
  return `https://cdn.discordapp.com/app-icons/${applicationId}/${iconHash}.png?size=64`;
}

function brandLogoUrl(domain: string): string {
  return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(domain)}&sz=128`;
}

function resolveBrandFallback(activityName: string): string | null {
  const key = normalizeKey(activityName);
  if (!key) return null;

  const domain = BRAND_DOMAINS[key];
  if (domain) return brandLogoUrl(domain);

  // Partial match: "foo bar baz" contains known key "foo bar"
  let best: { domain: string; len: number } | null = null;
  for (const [known, knownDomain] of Object.entries(BRAND_DOMAINS)) {
    if (key.includes(known) || known.includes(key)) {
      if (!best || known.length > best.len) {
        best = { domain: knownDomain, len: known.length };
      }
    }
  }
  if (best) return brandLogoUrl(best.domain);

  return null;
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

async function getDetectableApps(): Promise<DetectableApp[]> {
  const cached = cacheGet<DetectableApp[]>(APPS_CACHE_KEY);
  if (cached) return cached;

  const apps = await fetchDetectableApps();
  cacheSet(APPS_CACHE_KEY, apps, INDEX_TTL_MS);
  return apps;
}

function buildIndex(apps: DetectableApp[]): Map<string, AppIconEntry> {
  const index = new Map<string, AppIconEntry>();

  for (const app of apps) {
    if (!app.icon_hash) continue;

    const entry: AppIconEntry = {
      applicationId: app.id,
      iconHash: app.icon_hash,
    };

    const keys = new Set<string>([
      normalizeActivityName(app.name),
      normalizeKey(app.name),
    ]);

    for (const alias of app.aliases ?? []) {
      keys.add(normalizeActivityName(alias));
      keys.add(normalizeKey(alias));
    }

    for (const key of keys) {
      if (key && !index.has(key)) index.set(key, entry);
    }
  }

  return index;
}

function normalizeActivityName(name: string): string {
  return name.trim().toLowerCase();
}

function findFuzzyDetectableMatch(
  activityName: string,
  apps: DetectableApp[],
): AppIconEntry | null {
  const target = normalizeKey(activityName);
  if (!target || target.length < 2) return null;

  let best: { entry: AppIconEntry; score: number } | null = null;

  for (const app of apps) {
    if (!app.icon_hash) continue;

    const entry: AppIconEntry = {
      applicationId: app.id,
      iconHash: app.icon_hash,
    };

    const candidates = [app.name, ...(app.aliases ?? [])];
    for (const candidate of candidates) {
      const key = normalizeKey(candidate);
      if (!key) continue;

      if (key === target) return entry;

      const contains =
        key.includes(target) || target.includes(key);
      if (!contains) continue;

      const score =
        Math.min(key.length, target.length) /
        Math.max(key.length, target.length);
      if (score < 0.55) continue;

      if (!best || score > best.score) {
        best = { entry, score };
      }
    }
  }

  return best?.entry ?? null;
}

async function getDetectableIndex(): Promise<Map<string, AppIconEntry>> {
  const cached = cacheGet<Map<string, AppIconEntry>>(INDEX_CACHE_KEY);
  if (cached) return cached;

  const apps = await getDetectableApps();
  const index = buildIndex(apps);
  cacheSet(INDEX_CACHE_KEY, index, INDEX_TTL_MS);
  return index;
}

export async function resolveActivityIcons(
  activityNames: string[],
): Promise<Record<string, string | null>> {
  const unique = [...new Set(activityNames.map((n) => n.trim()).filter(Boolean))];
  const result: Record<string, string | null> = {};

  if (unique.length === 0) return result;

  const apps = isDiscordConfigured() ? await getDetectableApps() : [];
  const index = apps.length > 0 ? await getDetectableIndex() : new Map();

  for (const name of unique) {
    const keys = [normalizeActivityName(name), normalizeKey(name)];

    let icon: string | null = null;

    for (const key of keys) {
      const entry = index.get(key);
      if (entry) {
        icon = applicationIconUrl(entry.applicationId, entry.iconHash);
        break;
      }
    }

    if (!icon && apps.length > 0) {
      const fuzzy = findFuzzyDetectableMatch(name, apps);
      if (fuzzy) icon = applicationIconUrl(fuzzy.applicationId, fuzzy.iconHash);
    }

    if (!icon) {
      icon = resolveBrandFallback(name);
    }

    result[name] = icon;
  }

  return result;
}
