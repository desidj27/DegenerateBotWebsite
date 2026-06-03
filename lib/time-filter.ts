import type { CollectionKey } from "@/lib/collections";
import { TRACKED_COLLECTIONS } from "@/lib/collections";
import { dayFilterQuery, type DateRange } from "@/lib/dates";

function dayToStartMs(day: string): number {
  return new Date(`${day}T00:00:00.000Z`).getTime();
}

function dayToEndMs(day: string): number {
  return new Date(`${day}T23:59:59.999Z`).getTime();
}

export function buildTimeRangeFilter(
  collection: CollectionKey,
  range: DateRange,
): Record<string, unknown> {
  const timeField = TRACKED_COLLECTIONS[collection].timeField;
  if (!timeField) return {};
  if (!range.from && !range.to) return {};

  if (timeField === "day") {
    return dayFilterQuery(range);
  }

  const filter: Record<string, unknown> = {};
  if (range.from && range.to) {
    filter[timeField] = {
      $gte: dayToStartMs(range.from),
      $lte: dayToEndMs(range.to),
    };
  } else if (range.from) {
    filter[timeField] = { $gte: dayToStartMs(range.from) };
  } else if (range.to) {
    filter[timeField] = { $lte: dayToEndMs(range.to) };
  }

  return filter;
}

export function collectionSupportsTimeFilter(collection: CollectionKey): boolean {
  const config = TRACKED_COLLECTIONS[collection];
  return Boolean(config.timeField || config.groupByGame);
}
