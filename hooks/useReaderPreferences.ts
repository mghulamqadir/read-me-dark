"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { readPreferences, writePreferences } from "@/lib/reader";
import type { ReaderPreferences } from "@/types/reader";

export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(readPreferences);
  const latestPreferencesRef = useRef(preferences);
  useEffect(() => {
    latestPreferencesRef.current = preferences;
    const writeTimer = window.setTimeout(() => writePreferences(preferences), 300);
    return () => window.clearTimeout(writeTimer);
  }, [preferences]);

  useEffect(() => () => writePreferences(latestPreferencesRef.current), []);

  const updatePreferences = useCallback((update: Partial<ReaderPreferences>) => {
    setPreferences((current) => ({ ...current, ...update }));
  }, []);

  return { preferences, updatePreferences };
}
