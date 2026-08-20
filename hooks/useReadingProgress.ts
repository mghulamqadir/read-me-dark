"use client";

import { useCallback, useEffect, useState } from "react";
import { readProgress, writeProgress } from "@/lib/reader";
import type { ReaderProgress } from "@/types/reader";

export function useReadingProgress() {
  const [recentDocuments, setRecentDocuments] = useState<ReaderProgress[]>(readProgress);

  const saveProgress = useCallback((progress: ReaderProgress) => {
    const next = writeProgress(progress);
    setRecentDocuments(next);
  }, []);

  useEffect(() => {
    const refresh = () => setRecentDocuments(readProgress());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return { recentDocuments, saveProgress };
}
