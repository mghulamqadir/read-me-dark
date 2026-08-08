"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp, getPageColors, MAX_CONCURRENT_RENDERS, MAX_ZOOM, MIN_ZOOM, OVERSCAN, PAGE_GAP, THEME_KEY, ZOOM_STEP } from "@/lib/reader";
import type { ReaderTheme } from "@/types/reader";
import { usePageRenderGate } from "./usePageRenderGate";

export function usePdfReader() {
  const [file, setFile] = useState<File | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [inputFocused, setInputFocused] = useState(false);
  const [zoom, setZoom] = useState(1);
  const [aspectRatio, setAspectRatio] = useState(1.414);
  const [theme, setTheme] = useState<ReaderTheme>(() => {
    if (typeof window === "undefined") return "dark";
    const saved = window.localStorage.getItem(THEME_KEY) as ReaderTheme | null;
    return saved && ["light", "dark", "sepia"].includes(saved) ? saved : "dark";
  });
  const [error, setError] = useState<string | null>(null);
  const [viewerWidth, setViewerWidth] = useState(900);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { api: gate, version: renderVersion } = usePageRenderGate(MAX_CONCURRENT_RENDERS);
  const pageColors = useMemo(() => getPageColors(theme), [theme]);
  const pageWidth = Math.round(viewerWidth * zoom);
  const estimatedPageHeight = Math.round(pageWidth * aspectRatio);
  const virtualizer = useVirtualizer({ count: numPages, getScrollElement: () => scrollRef.current, estimateSize: () => estimatedPageHeight + PAGE_GAP, overscan: OVERSCAN, useFlushSync: false, measureElement: (element) => element.getBoundingClientRect().height + PAGE_GAP });

  useEffect(() => { virtualizer.measure(); }, [pageWidth, aspectRatio]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { window.localStorage.setItem(THEME_KEY, theme); }, [theme]);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewerWidth(Math.min(Math.max(320, entry.contentRect.width - 64), 1080)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [file]);

  const loadFile = useCallback((nextFile: File | undefined) => {
    if (!nextFile) return;
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) { setError("Please choose a PDF file."); return; }
    gate.reset(); setError(null); setFile(nextFile); setNumPages(0); setActivePage(1); setPageInput("1"); setZoom(1); setAspectRatio(1.414);
  }, [gate]);

  const onDocumentLoadSuccess = useCallback(async (pdf: PDFDocumentProxy) => {
    setNumPages(pdf.numPages); setActivePage(1); setPageInput("1"); setError(null);
    try { const page = await pdf.getPage(1); const viewport = page.getViewport({ scale: 1 }); setAspectRatio(viewport.height / viewport.width); } catch { /* Keep the default ratio. */ }
  }, []);

  const scrollToPage = useCallback((target: number) => { const page = clamp(target, 1, numPages || 1); setActivePage(page); setPageInput(String(page)); virtualizer.scrollToIndex(page - 1, { align: "start", behavior: "smooth" }); }, [numPages, virtualizer]);
  const changeZoom = useCallback((delta: number) => setZoom((current) => clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM)), []);
  const resetZoom = useCallback(() => setZoom(1), []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !numPages) return;
    let frame = 0;
    const onScroll = () => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; const items = virtualizer.getVirtualItems(); if (!items.length) return; const current = items.find((item) => item.start + item.size > element.scrollTop + 4) ?? items[0]; setActivePage(current.index + 1); if (!inputFocused) setPageInput(String(current.index + 1)); }); };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => { element.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [inputFocused, numPages, virtualizer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (!file) return; const target = event.target as HTMLElement | null; if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return; const modifier = event.ctrlKey || event.metaKey; if (event.key === "ArrowLeft") { event.preventDefault(); scrollToPage(activePage - 1); } if (event.key === "ArrowRight") { event.preventDefault(); scrollToPage(activePage + 1); } if (modifier && event.key === "+") { event.preventDefault(); changeZoom(ZOOM_STEP); } if (modifier && event.key === "-") { event.preventDefault(); changeZoom(-ZOOM_STEP); } if (modifier && event.key === "0") { event.preventDefault(); resetZoom(); } };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePage, changeZoom, file, resetZoom, scrollToPage]);

  useEffect(() => { const element = scrollRef.current; if (!element || !file) return; const onWheel = (event: WheelEvent) => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); changeZoom(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP); } }; element.addEventListener("wheel", onWheel, { passive: false }); return () => element.removeEventListener("wheel", onWheel); }, [changeZoom, file]);

  const commitPageInput = useCallback(() => { const page = Number.parseInt(pageInput, 10); if (Number.isNaN(page)) setPageInput(String(activePage)); else scrollToPage(page); setInputFocused(false); }, [activePage, pageInput, scrollToPage]);

  return { file, numPages, activePage, pageInput, zoom, theme, error, pageColors, pageWidth, estimatedPageHeight, scrollRef, gate, renderVersion, virtualItems: virtualizer.getVirtualItems(), totalSize: virtualizer.getTotalSize(), measureElement: virtualizer.measureElement, loadFile, onDocumentLoadSuccess, onDocumentLoadError: setError, scrollToPage, changeZoom, resetZoom, setTheme, setPageInput, setInputFocused, commitPageInput };
}
