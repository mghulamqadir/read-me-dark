"use client";

import type { ChangeEvent, DragEvent } from "react";
import { useCallback, useEffect, useRef, useState } from "react";
import { PdfViewport } from "@/components/reader/PdfViewport";
import { ReaderHeader } from "@/components/reader/ReaderHeader";
import { ReaderLanding } from "@/components/reader/ReaderLanding";
import { ReaderSidebar } from "@/components/reader/ReaderSidebar";
import { ReaderToolbar } from "@/components/reader/ReaderToolbar";
import { usePdfReader } from "@/hooks/usePdfReader";

export default function PdfReader() {
  const reader = usePdfReader();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const readerRef = useRef<HTMLElement>(null);
  const [dragging, setDragging] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  const openFilePicker = useCallback(() => fileInputRef.current?.click(), []);
  const onFileChange = useCallback((event: ChangeEvent<HTMLInputElement>) => {
    reader.loadFile(event.target.files?.[0]);
    event.target.value = "";
  }, [reader]);
  const onDragEnter = useCallback((event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(true); }, []);
  const onDragOver = useCallback((event: DragEvent<HTMLDivElement>) => event.preventDefault(), []);
  const onDragLeave = useCallback(() => setDragging(false), []);
  const onDrop = useCallback((event: DragEvent<HTMLDivElement>) => { event.preventDefault(); setDragging(false); reader.loadFile(event.dataTransfer.files?.[0]); }, [reader]);
  const toggleFullscreen = useCallback(() => {
    const element = readerRef.current;
    if (!element) return;
    if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
    else element.requestFullscreen().catch(() => {});
  }, []);

  const focusSearch = useCallback(() => {
    if (!reader.preferences.sidebarOpen) {
      reader.updatePreferences({ sidebarOpen: true });
    }
    window.requestAnimationFrame(() => {
      searchInputRef.current?.focus();
      searchInputRef.current?.select();
    });
  }, [reader]);

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "f" && !event.ctrlKey && !event.metaKey && !event.altKey && reader.file && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reader.file, toggleFullscreen]);

  useEffect(() => {
    if (reader.file) {
      const cleanTitle = reader.file.name.replace(/\.pdf$/i, "");
      document.title = `${cleanTitle} — Read Me Dark`;
      const urlSlug = encodeURIComponent(cleanTitle.replace(/\s+/g, "-"));
      const newUrl = `${window.location.pathname}?book=${urlSlug}`;
      window.history.replaceState({ ...window.history.state, book: cleanTitle }, "", newUrl);
    } else {
      document.title = "Read Me Dark — Dark Mode PDF Reader";
      if (window.location.search.includes("book=")) {
        window.history.replaceState({ ...window.history.state }, "", window.location.pathname);
      }
    }
  }, [reader.file]);

  return <main className="reader-app" data-theme={reader.preferences.theme} data-font={reader.preferences.fontFamily} data-font-size={reader.preferences.fontSize} data-line-height={reader.preferences.lineHeight} data-letter-spacing={reader.preferences.letterSpacing}>
    <ReaderHeader hasFile={Boolean(reader.file)} fileName={reader.file?.name} theme={reader.preferences.theme} onThemeChange={(theme) => reader.updatePreferences({ theme })} onOpenFile={openFilePicker} onGoHome={reader.closeFile} />
    <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={onFileChange} className="sr-only" />
    {!reader.file ? <ReaderLanding dragging={dragging} error={reader.error} recentDocuments={reader.recentDocuments} onOpenFile={openFilePicker} onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} /> : <section className={`reader-layout${isFullscreen ? " fullscreen" : ""}${reader.preferences.sidebarOpen ? " sidebar-open" : " sidebar-closed"}`} ref={readerRef}>
      {reader.preferences.sidebarOpen && <ReaderSidebar file={reader.file} numPages={reader.numPages} currentPage={reader.activePage} progressPercent={reader.progressPercent} marker={reader.marker} searchQuery={reader.search.query} searchResults={reader.search.results} searchCurrentIndex={reader.search.currentIndex} searchCurrentPage={reader.search.results[reader.search.currentIndex]?.page ?? null} searchIsRunning={reader.search.isSearching} searchScannedPages={reader.search.scannedPages} searchTotalPages={reader.search.totalPages} searchError={reader.search.error} onSearch={reader.search.runSearch} onNextSearchResult={reader.search.nextResult} onPreviousSearchResult={reader.search.previousResult} onSelectSearchResultIndex={reader.search.selectResultIndex} onClearSearch={reader.search.clearSearch} onNavigate={reader.scrollToPage} onJumpToMarker={reader.jumpToMarker} onClearMarker={reader.clearMarker} searchInputRef={searchInputRef} />}
      <div className="viewer-column">
        <ReaderToolbar preferences={reader.preferences} zoom={reader.zoom} markerActive={reader.markerIsActive} hasMarker={Boolean(reader.marker)} isFullscreen={isFullscreen} searchQuery={reader.search.query} searchResults={reader.search.results} searchResultCount={reader.search.results.length} searchCurrentIndex={reader.search.currentIndex} searchCurrentPage={reader.search.results[reader.search.currentIndex]?.page ?? null} searchIsRunning={reader.search.isSearching} searchScannedPages={reader.search.scannedPages} searchTotalPages={reader.search.totalPages} searchError={reader.search.error} onPreferencesChange={reader.updatePreferences} onZoom={reader.changeZoom} onZoomChange={reader.setZoomLevel} onResetZoom={reader.resetZoom} onFitWidth={reader.fitWidth} onActualSize={reader.useActualSize} onToggleSidebar={() => reader.updatePreferences({ sidebarOpen: !reader.preferences.sidebarOpen })} onToggleMarker={reader.toggleMarker} onToggleFullscreen={toggleFullscreen} onSearch={reader.search.runSearch} onNextSearchResult={reader.search.nextResult} onPreviousSearchResult={reader.search.previousResult} onSelectSearchResultIndex={reader.search.selectResultIndex} onClearSearch={reader.search.clearSearch} onFocusSearch={focusSearch} />
        <PdfViewport file={reader.file} sessionId={reader.sessionId} theme={reader.preferences.theme} numPages={reader.numPages} pageWidth={reader.pageWidth} estimatedPageHeight={reader.estimatedPageHeight} totalSize={reader.totalSize} virtualItems={reader.virtualItems} pageColors={reader.pageColors} highlightQuery={reader.search.query} gate={reader.gate} scrollRef={reader.scrollRef} measureElement={reader.measureElement} onLoadSuccess={reader.onDocumentLoadSuccess} onLoadError={reader.onDocumentLoadError} error={reader.error} />
        <footer className="reader-footer"><span>Continuous Scroll · Ctrl + Scroll to zoom · ← → to jump</span></footer>
      </div>
    </section>}
  </main>;
}
