"use client";

import { useCallback, useMemo, useRef } from "react";

type Grant = () => void;

export type PageRenderGate = {
  request: (key: string, grant: Grant) => void;
  complete: (key: string) => void;
  release: (key: string) => void;
  reset: () => void;
};

export function usePageRenderGate(maxConcurrentRenders: number): PageRenderGate {
  const active = useRef(new Set<string>());
  const queued = useRef(new Map<string, Grant>());

  const grantNext = useCallback(() => {
    while (active.current.size < maxConcurrentRenders) {
      const next = queued.current.entries().next();
      if (next.done) return;
      const [key, grant] = next.value;
      queued.current.delete(key);
      active.current.add(key);
      grant();
    }
  }, [maxConcurrentRenders]);

  const request = useCallback((key: string, grant: Grant) => {
    if (active.current.has(key)) return;
    if (active.current.size < maxConcurrentRenders) {
      active.current.add(key);
      grant();
      return;
    }
    queued.current.set(key, grant);
  }, [maxConcurrentRenders]);

  const complete = useCallback((key: string) => {
    if (active.current.delete(key)) grantNext();
  }, [grantNext]);

  const release = useCallback((key: string) => {
    const wasActive = active.current.delete(key);
    queued.current.delete(key);
    if (wasActive) grantNext();
  }, [grantNext]);

  const reset = useCallback(() => {
    active.current.clear();
    queued.current.clear();
  }, []);

  return useMemo(() => ({ request, complete, release, reset }), [request, complete, release, reset]);
}
