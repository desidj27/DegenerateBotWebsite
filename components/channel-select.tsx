"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, Hash, Mic, X } from "lucide-react";

import {
  useChannelDirectory,
  type ChannelOption,
} from "@/hooks/use-channel-directory";
import { Button } from "@/components/ui/button";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

function ChannelIcon({ channel }: { channel: ChannelOption }) {
  if (channel.isVoice) {
    return <Mic className="size-3.5 shrink-0 text-sky-400" />;
  }
  return <Hash className="size-3.5 shrink-0 text-muted-foreground" />;
}

function ChannelOptionRow({ channel }: { channel: ChannelOption }) {
  return (
    <>
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted/80">
        <ChannelIcon channel={channel} />
      </span>
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium">{channel.name}</p>
        <p className="truncate text-xs text-muted-foreground">
          {channel.isVoice ? "Voice" : "Channel"}
        </p>
      </div>
    </>
  );
}

export function ChannelSelect({
  value,
  onChange,
  guildId,
  label = "Channel",
  placeholder = "Select a channel…",
  className,
  channels: channelsProp,
  loading: loadingProp,
}: {
  value: string;
  onChange: (channelId: string) => void;
  guildId?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  channels?: ChannelOption[];
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const directory = useChannelDirectory(guildId);
  const channels = channelsProp ?? directory.channels;
  const loading = loadingProp ?? directory.loading;

  const selected = useMemo(
    () => channels.find((c) => c.id === value),
    [channels, value],
  );

  return (
    <div className={cn("space-y-1.5", className)}>
      <Label className="text-xs text-muted-foreground">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          render={
            <Button
              variant="outline"
              role="combobox"
              aria-expanded={open}
              className="h-9 w-full justify-between bg-background/60 font-normal"
            />
          }
        >
          {loading && !selected ? (
            <Skeleton className="h-4 w-32" />
          ) : selected ? (
            <span className="flex min-w-0 flex-1 items-center gap-2">
              <ChannelIcon channel={selected} />
              <span className="truncate">{selected.name}</span>
            </span>
          ) : value ? (
            <span className="truncate font-mono text-xs">{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent
          className="w-[var(--anchor-width)] min-w-[280px] p-0"
          align="start"
        >
          <Command>
            <CommandInput placeholder="Search channels…" />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading channels…" : "No channels found."}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all-channels"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">All channels</span>
                  {!value ? <Check className="ml-auto size-4" /> : null}
                </CommandItem>
                {channels.map((channel) => (
                  <CommandItem
                    key={channel.id}
                    value={`${channel.name} ${channel.id}`}
                    onSelect={() => {
                      onChange(channel.id);
                      setOpen(false);
                    }}
                  >
                    <ChannelOptionRow channel={channel} />
                    {value === channel.id ? (
                      <Check className="ml-auto size-4 shrink-0" />
                    ) : null}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
      {value && (
        <Button
          type="button"
          variant="ghost"
          size="xs"
          className="h-6 gap-1 px-2 text-xs text-muted-foreground"
          onClick={() => onChange("")}
        >
          <X className="size-3" />
          Clear selection
        </Button>
      )}
    </div>
  );
}
