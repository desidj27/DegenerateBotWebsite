export type TimePreset = "today" | "7d" | "30d" | "90d" | "all" | "custom";

export type DateRange = {
  from: string | null;
  to: string | null;
  preset: TimePreset;
  label: string;
};

function formatDay(date: Date): string {
  return date.toISOString().slice(0, 10);
}

function addDays(date: Date, days: number): Date {
  const next = new Date(date);
  next.setUTCDate(next.getUTCDate() + days);
  return next;
}

export function resolveDateRange(
  preset: TimePreset,
  customFrom?: string,
  customTo?: string,
): DateRange {
  const today = new Date();
  const to = formatDay(today);

  if (preset === "custom") {
    const from = customFrom?.trim() || null;
    const toDay = customTo?.trim() || null;
    return {
      from,
      to: toDay,
      preset,
      label:
        from && toDay
          ? `${from} → ${toDay}`
          : from
            ? `From ${from}`
            : toDay
              ? `Until ${toDay}`
              : "Custom range",
    };
  }

  if (preset === "all") {
    return { from: null, to: null, preset, label: "All time" };
  }

  if (preset === "today") {
    return { from: to, to, preset, label: "Today" };
  }

  const days =
    preset === "7d" ? 7 : preset === "30d" ? 30 : preset === "90d" ? 90 : 7;
  const from = formatDay(addDays(today, -(days - 1)));

  const labels: Record<Exclude<TimePreset, "custom" | "all">, string> = {
    today: "Today",
    "7d": "Last 7 days",
    "30d": "Last 30 days",
    "90d": "Last 90 days",
  };

  return {
    from,
    to,
    preset,
    label: labels[preset as keyof typeof labels] ?? `Last ${days} days`,
  };
}

export function dayFilterQuery(
  range: DateRange,
): Record<string, string> | Record<string, { $gte?: string; $lte?: string }> {
  if (!range.from && !range.to) return {};

  if (range.from && range.to) {
    return { day: { $gte: range.from, $lte: range.to } };
  }
  if (range.from) return { day: { $gte: range.from } };
  if (range.to) return { day: { $lte: range.to } };
  return {};
}
