"use client";

import { useCallback, useMemo, useRef, useState } from "react";

export type PageRenderGate = ReturnType<typeof usePageRenderGate>["api"];

export function usePageRenderGate(maxConcurrentRenders: number) {
  const activePages = useRef(new Set<number>());
  const completedPages = useRef(new Set<number>());
  const [version, bumpVersion] = useState(0);

  const acquire = useCallback((page: number) => {
    if (completedPages.current.has(page) || activePages.current.has(page)) return true;
    if (activePages.current.size >= maxConcurrentRenders) return false;

    activePages.current.add(page);
    return true;
  }, [maxConcurrentRenders]);

  const onComplete = useCallback((page: number) => {
    const changed = activePages.current.delete(page) || !completedPages.current.has(page);
    completedPages.current.add(page);
    if (changed) bumpVersion((current) => current + 1);
  }, []);

  const onError = useCallback((page: number) => {
    if (activePages.current.delete(page)) bumpVersion((current) => current + 1);
  }, []);

  const release = useCallback((page: number) => {
    const changed = activePages.current.delete(page) || completedPages.current.delete(page);
    if (changed) bumpVersion((current) => current + 1);
  }, []);

  const reset = useCallback(() => {
    activePages.current.clear();
    completedPages.current.clear();
    bumpVersion((current) => current + 1);
  }, []);

  const api = useMemo(() => ({ acquire, onComplete, onError, release, reset }), [acquire, onComplete, onError, release, reset]);

  return { api, version };
}
