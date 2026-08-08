"use client";

import { useCallback, useEffect, useState } from "react";
import { readPreferences, writePreferences } from "@/lib/reader";
import type { ReaderPreferences } from "@/types/reader";

export function useReaderPreferences() {
  const [preferences, setPreferences] = useState<ReaderPreferences>(readPreferences);

  useEffect(() => { writePreferences(preferences); }, [preferences]);

  const updatePreferences = useCallback((update: Partial<ReaderPreferences>) => {
    setPreferences((current) => ({ ...current, ...update }));
  }, []);

  return { preferences, updatePreferences };
}
