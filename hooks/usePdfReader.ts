"use client";

import { useVirtualizer } from "@tanstack/react-virtual";
import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { clamp, documentFallbackId, getPageColors, MAX_CONCURRENT_RENDERS, MAX_ZOOM, MIN_ZOOM, OVERSCAN, PAGE_GAP, ZOOM_STEP } from "@/lib/reader";
import { usePageRenderGate } from "./usePageRenderGate";
import { useReaderPreferences } from "./useReaderPreferences";
import { useReadingProgress } from "./useReadingProgress";

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
  const [aspectRatio, setAspectRatio] = useState(1.414);
  const [error, setError] = useState<string | null>(null);
  const [viewerWidth, setViewerWidth] = useState(900);
  const [sessionId, setSessionId] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const gate = usePageRenderGate(MAX_CONCURRENT_RENDERS);
  const pageColors = useMemo(() => getPageColors(preferences.theme), [preferences.theme]);
  const pageWidth = Math.round(viewerWidth * zoom);
  const estimatedPageHeight = Math.round(pageWidth * aspectRatio);
  const virtualizer = useVirtualizer({ count: numPages, getScrollElement: () => scrollRef.current, estimateSize: () => estimatedPageHeight + PAGE_GAP, overscan: OVERSCAN, useFlushSync: false, measureElement: (element) => element.getBoundingClientRect().height + PAGE_GAP });

  useEffect(() => { virtualizer.measure(); }, [aspectRatio, pageWidth, virtualizer]);
  useEffect(() => { updatePreferences({ zoom }); }, [updatePreferences, zoom]);
  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;
    const observer = new ResizeObserver(([entry]) => setViewerWidth(Math.min(Math.max(320, entry.contentRect.width - 64), 1080)));
    observer.observe(element);
    return () => observer.disconnect();
  }, [file]);

  const persistProgress = useCallback((page = activePage) => {
    if (!file || !documentId || !numPages) return;
    saveProgress({ id: documentId, name: file.name, size: file.size, lastModified: file.lastModified, currentPage: page, totalPages: numPages, zoom, lastOpenedAt: Date.now() });
  }, [activePage, documentId, file, numPages, saveProgress, zoom]);

  useEffect(() => {
    if (!file || !documentId || !numPages) return;
    const timer = window.setTimeout(() => persistProgress(), 500);
    return () => window.clearTimeout(timer);
  }, [activePage, documentId, file, numPages, persistProgress, zoom]);

  const loadFile = useCallback((nextFile: File | undefined) => {
    if (!nextFile || nextFile.size === 0) { setError("Please select a non-empty PDF file."); return; }
    if (nextFile.type !== "application/pdf" && !nextFile.name.toLowerCase().endsWith(".pdf")) { setError("Please select a PDF file."); return; }
    gate.reset();
    setError(null); setFile(nextFile); setDocumentId(null); setNumPages(0); setActivePage(1); setPageInput("1"); setZoom(preferences.zoom); setAspectRatio(1.414); setSessionId((current) => current + 1);
  }, [gate, preferences.zoom]);

  const clearFileAfterError = useCallback((message: string) => {
    gate.reset(); setFile(null); setDocumentId(null); setNumPages(0); setError(message); setSessionId((current) => current + 1);
  }, [gate]);

  const onDocumentLoadSuccess = useCallback(async (pdf: PDFDocumentProxy) => {
    const identity = pdf.fingerprints?.[0] || (file ? documentFallbackId(file) : "unknown");
    const previous = recentDocuments.find((entry) => entry.id === identity);
    const restoredPage = previous ? clamp(previous.currentPage, 1, pdf.numPages) : 1;
    setDocumentId(identity); setNumPages(pdf.numPages); setActivePage(restoredPage); setPageInput(String(restoredPage));
    if (previous) setZoom(clamp(previous.zoom, MIN_ZOOM, MAX_ZOOM));
    try { const firstPage = await pdf.getPage(1); const viewport = firstPage.getViewport({ scale: 1 }); setAspectRatio(viewport.height / viewport.width); } catch { /* Use the default document ratio. */ }
    window.requestAnimationFrame(() => virtualizer.scrollToIndex(restoredPage - 1, { align: "start" }));
  }, [file, recentDocuments, virtualizer]);

  const scrollToPage = useCallback((target: number) => { const page = clamp(target, 1, numPages || 1); setActivePage(page); setPageInput(String(page)); virtualizer.scrollToIndex(page - 1, { align: "start", behavior: "smooth" }); }, [numPages, virtualizer]);
  const changeZoom = useCallback((delta: number) => setZoom((current) => clamp(Number((current + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM)), []);
  const resetZoom = useCallback(() => setZoom(1), []);
  const fitWidth = useCallback(() => setZoom(1), []);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element || !numPages) return;
    let frame = 0;
    const onScroll = () => { if (frame) return; frame = requestAnimationFrame(() => { frame = 0; const items = virtualizer.getVirtualItems(); if (!items.length) return; const current = items.find((item) => item.start + item.size > element.scrollTop + 4) ?? items[0]; setActivePage(current.index + 1); if (!inputFocused) setPageInput(String(current.index + 1)); }); };
    element.addEventListener("scroll", onScroll, { passive: true });
    return () => { element.removeEventListener("scroll", onScroll); if (frame) cancelAnimationFrame(frame); };
  }, [inputFocused, numPages, virtualizer]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => { if (!file) return; const target = event.target as HTMLElement | null; if (target?.matches("input, textarea, select, button")) return; if (event.key === "ArrowLeft" || event.key === "PageUp") { event.preventDefault(); scrollToPage(activePage - 1); } if (event.key === "ArrowRight" || event.key === "PageDown") { event.preventDefault(); scrollToPage(activePage + 1); } if (event.key === "+") { event.preventDefault(); changeZoom(ZOOM_STEP); } if (event.key === "-") { event.preventDefault(); changeZoom(-ZOOM_STEP); } if (event.key === "0") { event.preventDefault(); resetZoom(); } };
    window.addEventListener("keydown", onKeyDown); return () => window.removeEventListener("keydown", onKeyDown);
  }, [activePage, changeZoom, file, resetZoom, scrollToPage]);

  useEffect(() => { const element = scrollRef.current; if (!element || !file) return; const onWheel = (event: WheelEvent) => { if (event.ctrlKey || event.metaKey) { event.preventDefault(); changeZoom(event.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP); } }; element.addEventListener("wheel", onWheel, { passive: false }); return () => element.removeEventListener("wheel", onWheel); }, [changeZoom, file]);

  const commitPageInput = useCallback(() => { const page = Number.parseInt(pageInput, 10); if (Number.isNaN(page)) setPageInput(String(activePage)); else scrollToPage(page); setInputFocused(false); }, [activePage, pageInput, scrollToPage]);

  return { file, sessionId, numPages, activePage, pageInput, zoom, preferences, error, pageColors, pageWidth, estimatedPageHeight, scrollRef, gate, virtualItems: virtualizer.getVirtualItems(), totalSize: virtualizer.getTotalSize(), measureElement: virtualizer.measureElement, recentDocuments, loadFile, onDocumentLoadSuccess, onDocumentLoadError: clearFileAfterError, scrollToPage, changeZoom, resetZoom, fitWidth, updatePreferences, setPageInput, setInputFocused, commitPageInput };
}
