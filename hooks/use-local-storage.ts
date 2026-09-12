"use client";

import * as React from "react";

export function useLocalStorage<T>(key: string, initialValue: T) {
  const [value, setValue] = React.useState<T>(initialValue);
  const [hydrated, setHydrated] = React.useState(false);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem(key);
      if (stored !== null) {
        setValue(JSON.parse(stored) as T);
      }
    } catch {
      // Ignore malformed values and fall back to the initial value.
    }
    setHydrated(true);
  }, [key]);

  React.useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem(key, JSON.stringify(value));
    } catch {
      // Ignore storage failures (private mode, quota, etc.).
    }
  }, [key, value, hydrated]);

  return [value, setValue, hydrated] as const;
}
