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

  useEffect(() => {
    const syncFullscreenState = () => setIsFullscreen(Boolean(document.fullscreenElement));
    document.addEventListener("fullscreenchange", syncFullscreenState);
    return () => document.removeEventListener("fullscreenchange", syncFullscreenState);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key.toLowerCase() === "f" && reader.file && !(event.target instanceof HTMLInputElement)) {
        event.preventDefault();
        toggleFullscreen();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [reader.file, toggleFullscreen]);

  return <main className="reader-app" data-theme={reader.preferences.theme} data-font={reader.preferences.fontFamily} data-font-size={reader.preferences.fontSize} data-line-height={reader.preferences.lineHeight} data-letter-spacing={reader.preferences.letterSpacing}>
    <ReaderHeader hasFile={Boolean(reader.file)} theme={reader.preferences.theme} onThemeChange={(theme) => reader.updatePreferences({ theme })} onOpenFile={openFilePicker} />
    <input ref={fileInputRef} type="file" accept="application/pdf,.pdf" onChange={onFileChange} className="sr-only" />
    {!reader.file ? <ReaderLanding dragging={dragging} error={reader.error} recentDocuments={reader.recentDocuments} onOpenFile={openFilePicker} onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop} /> : <section className={`reader-layout${isFullscreen ? " fullscreen" : ""}${reader.preferences.sidebarOpen ? " sidebar-open" : " sidebar-closed"}`} ref={readerRef}>
      {reader.preferences.sidebarOpen && <ReaderSidebar file={reader.file} numPages={reader.numPages} preferences={reader.preferences} onPreferencesChange={reader.updatePreferences} />}
      <div className="viewer-column">
        <ReaderToolbar activePage={reader.activePage} numPages={reader.numPages} pageInput={reader.pageInput} zoom={reader.zoom} isFullscreen={isFullscreen} sidebarOpen={reader.preferences.sidebarOpen} onPageInputChange={reader.setPageInput} onPageInputFocus={() => reader.setInputFocused(true)} onPageInputCommit={reader.commitPageInput} onNavigate={reader.scrollToPage} onZoom={reader.changeZoom} onResetZoom={reader.resetZoom} onFitWidth={reader.fitWidth} onToggleSidebar={() => reader.updatePreferences({ sidebarOpen: !reader.preferences.sidebarOpen })} onToggleFullscreen={toggleFullscreen} />
        <PdfViewport file={reader.file} sessionId={reader.sessionId} numPages={reader.numPages} pageWidth={reader.pageWidth} estimatedPageHeight={reader.estimatedPageHeight} totalSize={reader.totalSize} virtualItems={reader.virtualItems} pageColors={reader.pageColors} gate={reader.gate} scrollRef={reader.scrollRef} measureElement={reader.measureElement} onLoadSuccess={reader.onDocumentLoadSuccess} onLoadError={reader.onDocumentLoadError} error={reader.error} />
        <footer className="reader-footer"><span>Continuous Scroll · Ctrl + Scroll to zoom · ← → to jump</span></footer>
      </div>
    </section>}
  </main>;
}
