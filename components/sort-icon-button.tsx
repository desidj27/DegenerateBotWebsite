"use client";

import { ArrowDownWideNarrow, ArrowUpWideNarrow } from "lucide-react";

import type { SortOrder } from "@/lib/sort";
import { Button } from "@/components/ui/button";

export function SortIconButton({
  sortOrder,
  onClick,
  label = "Sort",
}: {
  sortOrder: SortOrder;
  onClick: () => void;
  label?: string;
}) {
  const hint = sortOrder === "desc" ? "Highest first" : "Lowest first";

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-sm"
      className="size-7 shrink-0 text-muted-foreground hover:bg-transparent hover:text-foreground"
      onClick={onClick}
      aria-label={`${label}: ${hint}`}
      title={hint}
    >
      {sortOrder === "desc" ? (
        <ArrowDownWideNarrow className="size-4" />
      ) : (
        <ArrowUpWideNarrow className="size-4" />
      )}
    </Button>
  );
}
