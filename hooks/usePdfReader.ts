"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp, documentFallbackId, getPageColors, MAX_CONCURRENT_RENDERS, MAX_ZOOM, MIN_ZOOM, OVERSCAN, PAGE_GAP, ZOOM_STEP } from "@/lib/reader";
import type { ReaderMarker, ReaderPosition, ReaderProgress } from "@/types/reader";
import { usePageRenderGate } from "./usePageRenderGate";
import { useReaderPreferences } from "./useReaderPreferences";
import { useReadingProgress } from "./useReadingProgress";

const ACTUAL_PAGE_WIDTH = 816;

export function usePdfReader() {
  const { preferences, updatePreferences } = useReaderPreferences();
  const { recentDocuments, saveProgress } = useReadingProgress();
  const [file, setFile] = useState<File | null>(null);
  const [documentId, setDocumentId] = useState<string | null>(null);
  const [numPages, setNumPages] = useState(0);
  const [activePage, setActivePage] = useState(1);
  const [pageInput, setPageInput] = useState("1");
  const [inputFocused, setInputFocused] = useState(false);
  const [zoom, setZoom] = useState(preferences.zoom);
  const [marker, setMarker] = useState<ReaderMarker | null>(null);
  const [aspectRatio, setAspectRatio] = useState(1.414);
  const [error, setError] = useState<string | null>(null);
  const [viewerWidth, setViewerWidth] = useState(900);
  const [sessionId, setSessionId] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const positionRef = useRef<ReaderPosition>({ page: 1, offsetRatio: 0 });
  const saveTimerRef = useRef<number | null>(null);
  const horizontalAnchorRef = useRef<number | null>(null);
  const gate = usePageRenderGate(MAX_CONCURRENT_RENDERS);
  const pageColors = useMemo(() => getPageColors(preferences.theme), [preferences.theme]);
  const actualSizeBaseWidth = viewerWidth <= 640 ? viewerWidth : ACTUAL_PAGE_WIDTH;
  const pageWidth = preferences.layoutMode === "fit-width" ? viewerWidth : Math.round(actualSizeBaseWidth * zoom);
  const estimatedPageHeight = Math.round(pageWidth * aspectRatio);
  const progressPercent = numPages ? clamp((activePage / numPages) * 100, 0, 100) : 0;
  const markerIsActive = Boolean(marker && marker.page === activePage);
  const virtualizer = useVirtualizer({ count: numPages, getScrollElement: () => scrollRef.current, estimateSize: () => estimatedPageHeight + PAGE_GAP, overscan: OVERSCAN, useFlushSync: false, measureElement: (element) => element.getBoundingClientRect().height + PAGE_GAP });

  useEffect(() => { virtualizer.measure(); }, [aspectRatio, pageWidth, virtualizer]);
  useEffect(() => {
    const anchor = horizontalAnchorRef.current;
    if (anchor === null) return;
    window.requestAnimationFrame(() => {
      const element = scrollRef.current;
      if (element) element.scrollLeft = Math.max(0, anchor * element.scrollWidth - element.clientWidth / 2);
      horizontalAnchorRef.current = null;
    });
  }, [pageWidth]);
  useEffect(() => { updatePreferences({ zoom }); }, [updatePreferences, zoom]);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewerWidth(Math.min(Math.max(1, Math.floor(entry.contentRect.width)), 1080)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [file]);

  const buildProgress = useCallback((): ReaderProgress | null => {
    if (!file || !documentId || !numPages) return null;
    const position = positionRef.current;
    return { id: documentId, name: file.name, size: file.size, lastModified: file.lastModified, currentPage: position.page, totalPages: numPages, scrollPosition: position, progressPercent: clamp((position.page / numPages) * 100, 0, 100), marker, zoom, theme: preferences.theme, fontSize: preferences.fontSize, lastOpenedAt: Date.now() };
  }, [documentId, file, marker, numPages, preferences.fontSize, preferences.theme, zoom]);

  const flushProgress = useCallback(() => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = null;
    const progress = buildProgress();
    if (progress) saveProgress(progress);
  }, [buildProgress, saveProgress]);

  const scheduleProgressSave = useCallback(() => {
    if (saveTimerRef.current !== null) window.clearTimeout(saveTimerRef.current);
    saveTimerRef.current = window.setTimeout(flushProgress, 500);
  }, [flushProgress]);

  useEffect(() => {
    const onVisibilityChange = () => { if (document.visibilityState === "hidden") flushProgress(); };
    document.addEventListener("visibilitychange", onVisibilityChange);
    return () => document.removeEventListener("visibilitychange", onVisibilityChange);
  }, [flushProgress]);

  useEffect(() => () => flushProgress(), [flushProgress]);
  useEffect(() => { scheduleProgressSave(); }, [marker, preferences.fontSize, preferences.theme, scheduleProgressSave, zoom]);

  const loadFile = useCallback((nextFile: File | undefined) => {
    if (!nextFile || nextFile.size === 0) { setError("Please select a non-empty PDF file."); return; }
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) { setError("Please select a PDF file."); return; }
    flushProgress(); gate.reset(); positionRef.current = { page: 1, offsetRatio: 0 };
    setError(null); setFile(nextFile); setDocumentId(null); setNumPages(0); setActivePage(1); setPageInput("1"); setMarker(null); setZoom(preferences.zoom); setAspectRatio(1.414); setSessionId((current) => current + 1);
  }, [flushProgress, gate, preferences.zoom]);

  const clearFileAfterError = useCallback((message: string) => {
    gate.reset(); setFile(null); setDocumentId(null); setNumPages(0); setMarker(null); setError(message); setSessionId((current) => current + 1);
  }, [gate]);

  const jumpToPosition = useCallback((position: ReaderPosition, behavior: ScrollBehavior = "auto") => {
    const page = clamp(position.page, 1, numPages || position.page || 1);
    const offsetRatio = clamp(position.offsetRatio, 0, 1);
    setActivePage(page); setPageInput(String(page)); positionRef.current = { page, offsetRatio };
    virtualizer.scrollToIndex(page - 1, { align: "start", behavior });
    window.requestAnimationFrame(() => window.requestAnimationFrame(() => {
      const item = virtualizer.getVirtualItems().find((virtualItem) => virtualItem.index === page - 1);
      if (item && scrollRef.current) scrollRef.current.scrollTop = item.start + Math.max(0, item.size - PAGE_GAP) * offsetRatio;
    }));
  }, [numPages, virtualizer]);

  const onDocumentLoadSuccess = useCallback(async (pdf: PDFDocumentProxy) => {
    const identity = pdf.fingerprints?.[0] || (file ? documentFallbackId(file) : "unknown");
    const previous = recentDocuments.find((entry) => entry.id === identity);
    const restoredPosition = previous?.scrollPosition ?? { page: previous?.currentPage ?? 1, offsetRatio: 0 };
    setDocumentId(identity); setNumPages(pdf.numPages); setMarker(previous?.marker ?? null);
    if (previous) { setZoom(clamp(previous.zoom, MIN_ZOOM, MAX_ZOOM)); updatePreferences({ theme: previous.theme, fontSize: previous.fontSize, zoom: previous.zoom, layoutMode: "actual-size" }); }
    try { const firstPage = await pdf.getPage(1); const viewport = firstPage.getViewport({ scale: 1 }); setAspectRatio(viewport.height / viewport.width); } catch { /* Use the default document ratio. */ }
    window.requestAnimationFrame(() => jumpToPosition({ page: clamp(restoredPosition.page, 1, pdf.numPages), offsetRatio: restoredPosition.offsetRatio }));
  }, [file, jumpToPosition, recentDocuments, updatePreferences]);

  const scrollToPage = useCallback((target: number) => jumpToPosition({ page: target, offsetRatio: 0 }, "smooth"), [jumpToPosition]);
  const captureHorizontalAnchor = useCallback(() => {
    const element = scrollRef.current;
    if (element) horizontalAnchorRef.current = (element.scrollLeft + element.clientWidth / 2) / Math.max(1, element.scrollWidth);
  }, []);
  const changeZoom = useCallback((delta: number) => { captureHorizontalAnchor(); updatePreferences({ layoutMode: "actual-size" }); setZoom((current) => clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM)); }, [captureHorizontalAnchor, updatePreferences]);
  const setZoomLevel = useCallback((value: number) => { captureHorizontalAnchor(); updatePreferences({ layoutMode: "actual-size" }); setZoom(clamp(value, MIN_ZOOM, MAX_ZOOM)); }, [captureHorizontalAnchor, updatePreferences]);
  const resetZoom = useCallback(() => { captureHorizontalAnchor(); updatePreferences({ layoutMode: "actual-size" }); setZoom(1); }, [captureHorizontalAnchor, updatePreferences]);
  const fitWidth = useCallback(() => { updatePreferences({ layoutMode: "fit-width" }); setZoom(1); }, [updatePreferences]);
  const useActualSize = useCallback(() => updatePreferences({ layoutMode: "actual-size" }), [updatePreferences]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !numPages) return;
    let frame = 0;
    const onScroll = () => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; const items = virtualizer.getVirtualItems(); if (!items.length) return; const current = items.find((item) => item.start + item.size > element.scrollTop + 4) ?? items[0]; const page = current.index + 1; const offsetRatio = clamp((element.scrollTop - current.start) / Math.max(1, current.size - PAGE_GAP), 0, 1); positionRef.current = { page, offsetRatio }; setActivePage(page); if (!inputFocused) setPageInput(String(page)); scheduleProgressSave(); }); };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => { element.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [inputFocused, numPages, scheduleProgressSave, virtualizer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (!file) return; const target = event.target as HTMLElement | null; if (target?.matches("input, textarea, select, button")) return; if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); scrollToPage(activePage - 1); } if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); scrollToPage(activePage + 1); } if (event.key === "+") { event.preventDefault(); changeZoom(ZOOM_STEP); } if (event.key === "-") { event.preventDefault(); changeZoom(-ZOOM_STEP); } if (event.key === "0") { event.preventDefault(); resetZoom(); } };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePage, changeZoom, file, resetZoom, scrollToPage]);

  useEffect(() => { const element = scrollRef.current; if (!element || !file) return; const onWheel = (event: WheelEvent) => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); changeZoom(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP); } }; element.addEventListener("wheel", onWheel, { passive: false }); return () => element.removeEventListener("wheel", onWheel); }, [changeZoom, file]);

  const commitPageInput = useCallback(() => { const page = Number.parseInt(pageInput, 10); if (Number.isNaN(page)) setPageInput(String(activePage)); else scrollToPage(page); setInputFocused(false); }, [activePage, pageInput, scrollToPage]);
  const toggleMarker = useCallback(() => { const position = positionRef.current; setMarker((current) => current?.page === position.page ? null : { ...position, createdAt: Date.now() }); }, []);
  const jumpToMarker = useCallback(() => { if (marker) jumpToPosition(marker, "smooth"); }, [jumpToPosition, marker]);
  const clearMarker = useCallback(() => setMarker(null), []);

  return { file, sessionId, numPages, activePage, pageInput, zoom, preferences, error, pageColors, pageWidth, estimatedPageHeight, progressPercent, marker, markerIsActive, scrollRef, gate, virtualItems: virtualizer.getVirtualItems(), totalSize: virtualizer.getTotalSize(), measureElement: virtualizer.measureElement, recentDocuments, loadFile, onDocumentLoadSuccess, onDocumentLoadError: clearFileAfterError, scrollToPage, changeZoom, setZoomLevel, resetZoom, fitWidth, useActualSize, toggleMarker, jumpToMarker, clearMarker, updatePreferences, setPageInput, setInputFocused, commitPageInput };
}
