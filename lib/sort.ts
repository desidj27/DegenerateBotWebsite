export type SortOrder = "desc" | "asc";

export function toggleSortOrder(order: SortOrder): SortOrder {
  return order === "desc" ? "asc" : "desc";
}

export function sortOrderLabel(order: SortOrder): string {
  return order === "desc" ? "Most" : "Least";
}

export function sortByNumber<T>(
  items: T[],
  getValue: (item: T) => number,
  order: SortOrder,
): T[] {
  return [...items].sort((a, b) => {
    const diff = getValue(b) - getValue(a);
    return order === "desc" ? diff : -diff;
  });
}

export function sortRowsByColumn(
  rows: Record<string, unknown>[],
  column: string,
  order: SortOrder,
): Record<string, unknown>[] {
  return [...rows].sort((a, b) => {
    const aVal = Number(a[column] ?? 0);
    const bVal = Number(b[column] ?? 0);
    const diff = bVal - aVal;
    return order === "desc" ? diff : -diff;
  });
}
