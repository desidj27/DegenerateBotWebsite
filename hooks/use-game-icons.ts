"use client";

import { useEffect, useMemo, useState } from "react";

export function useGameIcons(activityNames: string[]) {
  const [icons, setIcons] = useState<Record<string, string | null>>({});
  const [loading, setLoading] = useState(false);

  const namesKey = useMemo(
    () => JSON.stringify([...new Set(activityNames.filter(Boolean))].sort()),
    [activityNames],
  );

  useEffect(() => {
    const names = JSON.parse(namesKey) as string[];

    if (names.length === 0) {
      setIcons({});
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetch("/api/games/icons", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ activityNames: names }),
    })
      .then((res) => res.json())
      .then((json: { icons?: Record<string, string | null> }) => {
        if (!cancelled) setIcons(json.icons ?? {});
      })
      .catch(() => {
        if (!cancelled) setIcons({});
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [namesKey]);

  return { icons, loading };
}
