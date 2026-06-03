"use client";

import type { TimePreset } from "@/lib/dates";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export const TIME_PRESETS: { value: TimePreset; label: string }[] = [
  { value: "today", label: "Today" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "all", label: "All time" },
  { value: "custom", label: "Custom" },
];

export function TimeRangeFilter({
  preset,
  onPresetChange,
  customFrom,
  customTo,
  onCustomFromChange,
  onCustomToChange,
  compact = false,
}: {
  preset: TimePreset;
  onPresetChange: (preset: TimePreset) => void;
  customFrom: string;
  customTo: string;
  onCustomFromChange: (value: string) => void;
  onCustomToChange: (value: string) => void;
  compact?: boolean;
}) {
  return (
    <div className={cn("flex flex-col gap-3", compact && "gap-2")}>
      <div className="flex flex-wrap gap-2">
        {TIME_PRESETS.map((p) => (
          <Button
            key={p.value}
            type="button"
            size="sm"
            variant={preset === p.value ? "default" : "outline"}
            className={cn(
              "rounded-full",
              preset === p.value &&
                "bg-primary text-primary-foreground shadow-md shadow-primary/20",
            )}
            onClick={() => onPresetChange(p.value)}
          >
            {p.label}
          </Button>
        ))}
      </div>

      {preset === "custom" && (
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">From</Label>
            <Input
              type="date"
              className="h-8 bg-background/50"
              value={customFrom}
              onChange={(e) => onCustomFromChange(e.target.value)}
            />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs text-muted-foreground">To</Label>
            <Input
              type="date"
              className="h-8 bg-background/50"
              value={customTo}
              onChange={(e) => onCustomToChange(e.target.value)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
