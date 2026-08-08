"use client";

import { useCallback, useEffect, useState } from "react";
import { readProgress, writeProgress } from "@/lib/reader";
import type { ReaderProgress } from "@/types/reader";

export function useReadingProgress() {
  const [recentDocuments, setRecentDocuments] = useState<ReaderProgress[]>(readProgress);

  const saveProgress = useCallback((progress: ReaderProgress) => {
    writeProgress(progress);
    setRecentDocuments(readProgress());
  }, []);

  useEffect(() => {
    const refresh = () => setRecentDocuments(readProgress());
    window.addEventListener("storage", refresh);
    return () => window.removeEventListener("storage", refresh);
  }, []);

  return { recentDocuments, saveProgress };
}
