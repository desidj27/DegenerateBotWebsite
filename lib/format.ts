export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatNumber(value: number): string {
  return value.toLocaleString();
}

export function formatCell(key: string, value: unknown): string {
  if (value === null || value === undefined) return "—";
  if (typeof value === "number" && key.endsWith("_ms")) {
    return new Date(value).toLocaleString();
  }
  if (
    typeof value === "number" &&
    (key.endsWith("_seconds") || key === "total_seconds")
  ) {
    return formatDuration(value);
  }
  if (typeof value === "number" && key === "balance") {
    return formatNumber(value);
  }
  if (typeof value === "number" && key === "messages") {
    return formatNumber(value);
  }
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
}

export function shortenId(id: string, visible = 8): string {
  if (id.length <= visible + 3) return id;
  return `${id.slice(0, visible)}…`;
}
