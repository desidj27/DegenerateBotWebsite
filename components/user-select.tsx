"use client";

import { useMemo, useState } from "react";
import { Check, ChevronsUpDown, User, X } from "lucide-react";

import {
  useUserDirectory,
  type UserOption,
} from "@/hooks/use-user-directory";
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

function UserOptionRow({ user }: { user: UserOption }) {
  return (
    <>
      {user.avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={user.avatarUrl}
          alt=""
          className="size-7 shrink-0 rounded-full ring-1 ring-border"
        />
      ) : (
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted">
          <User className="size-3.5 text-muted-foreground" />
        </span>
      )}
      <div className="min-w-0 flex-1 text-left">
        <p className="truncate font-medium">{user.displayName}</p>
        <p className="truncate text-xs text-muted-foreground">
          @{user.username}
        </p>
      </div>
    </>
  );
}

export function UserSelect({
  value,
  onChange,
  guildId,
  label = "User",
  placeholder = "Select a user…",
  className,
  users: usersProp,
  loading: loadingProp,
}: {
  value: string;
  onChange: (userId: string) => void;
  guildId?: string;
  label?: string;
  placeholder?: string;
  className?: string;
  users?: UserOption[];
  loading?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const directory = useUserDirectory(guildId);
  const users = usersProp ?? directory.users;
  const loading = loadingProp ?? directory.loading;

  const selected = useMemo(
    () => users.find((u) => u.id === value),
    [users, value],
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
              {selected.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={selected.avatarUrl}
                  alt=""
                  className="size-6 rounded-full"
                />
              ) : (
                <User className="size-4 shrink-0 opacity-60" />
              )}
              <span className="truncate">{selected.displayName}</span>
            </span>
          ) : value ? (
            <span className="truncate font-mono text-xs">{value}</span>
          ) : (
            <span className="text-muted-foreground">{placeholder}</span>
          )}
          <ChevronsUpDown className="ml-2 size-4 shrink-0 opacity-50" />
        </PopoverTrigger>
        <PopoverContent className="w-[var(--anchor-width)] min-w-[280px] p-0" align="start">
          <Command>
            <CommandInput placeholder="Search users…" />
            <CommandList>
              <CommandEmpty>
                {loading ? "Loading users…" : "No users found."}
              </CommandEmpty>
              <CommandGroup>
                <CommandItem
                  value="all-users"
                  onSelect={() => {
                    onChange("");
                    setOpen(false);
                  }}
                >
                  <span className="text-muted-foreground">All users</span>
                  {!value ? <Check className="ml-auto size-4" /> : null}
                </CommandItem>
                {users.map((user) => (
                  <CommandItem
                    key={user.id}
                    value={`${user.displayName} ${user.username} ${user.id}`}
                    onSelect={() => {
                      onChange(user.id);
                      setOpen(false);
                    }}
                  >
                    <UserOptionRow user={user} />
                    {value === user.id ? (
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
