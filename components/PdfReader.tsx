// Component/PdfReader.tsx
"use client";

import {
  ChangeEvent,
  DragEvent,
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { Document, Page, pdfjs } from "react-pdf";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { ReaderTheme } from "@/types/reader";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
  "pdfjs-dist/build/pdf.worker.min.mjs",
  import.meta.url
).toString();

/* ── Constants ───────────────────────────────────────────── */
const THEME_KEY = "nightreader-theme";
const MIN_ZOOM = 0.5;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

const themes: { value: ReaderTheme; label: string; icon: string }[] = [
  { value: "dark", label: "Dark", icon: "☾" },
  { value: "light", label: "Light", icon: "☀" },
  { value: "sepia", label: "Sepia", icon: "◐" },
];

/* ── Helpers ─────────────────────────────────────────────── */
function clamp(v: number, lo: number, hi: number) {
  return Math.min(Math.max(v, lo), hi);
}

function fmtSize(b: number) {
  if (b < 1024) return `${b} B`;
  const kb = b / 1024;
  return kb < 1024 ? `${kb.toFixed(1)} KB` : `${(kb / 1024).toFixed(1)} MB`;
}

/* ── SVG Icons ───────────────────────────────────────────── */
const icons = {
  chevronL: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  ),
  chevronR: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <polyline points="9 18 15 12 9 6" />
    </svg>
  ),
  file: (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <polyline points="14 2 14 8 20 8" />
    </svg>
  ),
  book: (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" />
      <path d="M22 3h-6a4 4 0 0 1 3-3h7z" />
    </svg>
  ),
  expand: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 3 21 3 21 9" />
      <polyline points="9 21 3 21 3 15" />
      <line x1="21" y1="3" x2="14" y2="10" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
  shrink: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="4 14 10 14 10 20" />
      <polyline points="20 10 14 10 14 4" />
      <line x1="14" y1="10" x2="21" y2="3" />
      <line x1="3" y1="21" x2="10" y2="14" />
    </svg>
  ),
};

/* ── Individual Page Item Wrapper Component for Virtualization & Intersection Tracking ── */
function BookPage({
  pageNumber,
  pageWidth,
  pageColors,
  theme,
  isRendered,
  setPageRef,
}: {
  pageNumber: number;
  pageWidth: number;
  pageColors: { background: string; foreground: string } | undefined;
  theme: ReaderTheme;
  isRendered: boolean;
  setPageRef: (el: HTMLDivElement | null) => void;
}) {
  const estimatedHeight = Math.round(pageWidth * 1.414);

  return (
    <div
      id={`page-${pageNumber}`}
      data-page={pageNumber}
      ref={setPageRef}
      className={`pdf-page-shell theme-${theme}`}
      style={{ minHeight: isRendered ? undefined : `${estimatedHeight}px`, width: `${pageWidth}px` }}
    >
      {isRendered ? (
        <Page
          pageNumber={pageNumber}
          width={pageWidth}
          pageColors={pageColors}
          renderTextLayer
          renderAnnotationLayer
          loading={
            <div className="page-placeholder" style={{ height: `${estimatedHeight}px` }}>
              <div className="spinner" />
            </div>
          }
        />
      ) : (
        <div className="page-placeholder" style={{ height: `${estimatedHeight}px` }}>
          <span>Page {pageNumber}</span>
        </div>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════
   Main PdfReader Component
   ═══════════════════════════════════════════════════════════ */
export default function PdfReader() {
  /* ── State ───────────────────────────────────────────────── */
  const [file, setFile]                 = useState<File | null>(null);
  const [numPages, setNumPages]         = useState(0);
  const [activePage, setActivePage]     = useState(1);
  const [zoom, setZoom]                 = useState(1);
  const [isFullscreen, setIsFullscreen]   = useState(false);
  const [renderedRange, setRenderedRange] = useState<[number, number]>([1, 5]);
  const [theme, setTheme]               = useState<ReaderTheme>(() => {
    if (typeof window === "undefined") return "dark";
    const s = window.localStorage.getItem(THEME_KEY) as ReaderTheme | null;
    return s && ["light", "dark", "sepia"].includes(s) ? s : "dark";
  });
  const [dragging, setDragging]         = useState(false);
  const [error, setError]               = useState<string | null>(null);
  const [viewerWidth, setViewerWidth]   = useState(900);

  /* ── Refs ────────────────────────────────────────────────── */
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef    = useRef<HTMLDivElement>(null);
  const readerRef    = useRef<HTMLElement>(null);
  const pageRefs     = useRef<Map<number, HTMLDivElement>>(new Map());

  /* ── Derived ─────────────────────────────────────────────── */
  const pageColors = useMemo(() => {
    if (theme === "dark")  return { background: "#0e1010", foreground: "#dde3e0" };
    if (theme === "sepia") return { background: "#f8f0dc", foreground: "#493d2b" };
    return undefined;
  }, [theme]);

  const pageWidth = Math.round(viewerWidth * zoom);

  /* ── Persist theme ───────────────────────────────────────── */
  useEffect(() => {
    window.localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  /* ── Responsive width calculation ───────────────────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => {
      setViewerWidth(Math.min(Math.max(320, e.contentRect.width - 64), 1080));
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [file]);

  /* ── Fullscreen ──────────────────────────────────────────── */
  const toggleFullscreen = useCallback(() => {
    const el = readerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) {
      el.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  }, []);

  useEffect(() => {
    function onFsChange() {
      setIsFullscreen(!!document.fullscreenElement);
    }
    document.addEventListener("fullscreenchange", onFsChange);
    return () => document.removeEventListener("fullscreenchange", onFsChange);
  }, []);

  /* ── File loading ────────────────────────────────────────── */
  const loadFile = useCallback((f: File | undefined) => {
    if (!f) return;
    if (f.type !== "application/pdf" && !f.name.toLowerCase().endsWith(".pdf")) {
      setError("Please choose a PDF file.");
      return;
    }
    setError(null);
    setFile(f);
    setNumPages(0);
    setActivePage(1);
    setRenderedRange([1, 5]);
    setZoom(1);
  }, []);

  function onFileChange(e: ChangeEvent<HTMLInputElement>) {
    loadFile(e.target.files?.[0]);
    e.target.value = "";
  }

  function onDrop(e: DragEvent<HTMLDivElement>) {
    e.preventDefault();
    setDragging(false);
    loadFile(e.dataTransfer.files?.[0]);
  }

  function onDocumentLoadSuccess(pdf: PDFDocumentProxy) {
    setNumPages(pdf.numPages);
    setActivePage(1);
    setRenderedRange([1, Math.min(5, pdf.numPages)]);
    setError(null);
  }

  /* ── Page Jump / Scroll to Page ─────────────────────────── */
  const scrollToPage = useCallback((targetPage: number) => {
    const clamped = clamp(targetPage, 1, numPages || 1);
    setActivePage(clamped);

    // Expand render range so target page renders immediately
    setRenderedRange(([start, end]) => [
      Math.min(start, Math.max(1, clamped - 3)),
      Math.max(end, Math.min(numPages, clamped + 3)),
    ]);

    requestAnimationFrame(() => {
      const targetEl = pageRefs.current.get(clamped);
      if (targetEl && scrollRef.current) {
        targetEl.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    });
  }, [numPages]);

  const changeZoom = useCallback((delta: number) => {
    setZoom(cur => clamp(Number((cur + delta).toFixed(2)), MIN_ZOOM, MAX_ZOOM));
  }, []);

  /* ── IntersectionObserver: Track Visible Pages & Render Window ── */
  useEffect(() => {
    if (!numPages || !scrollRef.current) return;

    const visibleMap = new Map<number, number>(); // pageNum -> intersectionRatio

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const pageAttr = entry.target.getAttribute("data-page");
          if (!pageAttr) return;
          const p = parseInt(pageAttr, 10);
          if (entry.isIntersecting) {
            visibleMap.set(p, entry.intersectionRatio);
          } else {
            visibleMap.delete(p);
          }
        });

        if (visibleMap.size > 0) {
          // Find page with maximum intersection ratio or closest to top
          let maxPage = activePage;
          let maxRatio = -1;
          const visiblePagesList: number[] = [];

          visibleMap.forEach((ratio, page) => {
            visiblePagesList.push(page);
            if (ratio > maxRatio) {
              maxRatio = ratio;
              maxPage = page;
            }
          });

          setActivePage(maxPage);

          const minVis = Math.min(...visiblePagesList);
          const maxVis = Math.max(...visiblePagesList);

          // Buffer rendered range: 3 pages above and 3 pages below viewport
          const bufferStart = Math.max(1, minVis - 3);
          const bufferEnd   = Math.min(numPages, maxVis + 3);

          setRenderedRange([bufferStart, bufferEnd]);
        }
      },
      {
        root: scrollRef.current,
        rootMargin: "200px 0px 200px 0px",
        threshold: [0, 0.2, 0.5, 0.8, 1.0],
      }
    );

    pageRefs.current.forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [numPages]);

  /* ── Keyboard shortcuts ──────────────────────────────────── */
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!file) return;
      const ctrl = e.ctrlKey || e.metaKey;
      if (e.key === "ArrowLeft")  scrollToPage(activePage - 1);
      if (e.key === "ArrowRight") scrollToPage(activePage + 1);
      if (ctrl && e.key === "+") { e.preventDefault(); changeZoom(ZOOM_STEP); }
      if (ctrl && e.key === "-") { e.preventDefault(); changeZoom(-ZOOM_STEP); }
      if (ctrl && e.key === "0") { e.preventDefault(); setZoom(1); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [file, activePage, scrollToPage, changeZoom]);

  /* ── Wheel: Ctrl + Scroll / Touchpad Pinch → Zoom ────────── */
  useEffect(() => {
    const el = scrollRef.current;
    if (!el || !file) return;

    function onWheel(e: WheelEvent) {
      if (e.ctrlKey || e.metaKey) {
        e.preventDefault();
        changeZoom(e.deltaY > 0 ? -ZOOM_STEP : ZOOM_STEP);
      }
    }

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [file, changeZoom]);

  /* ═══════════════════════════════════════════════════════════
     Render
     ═══════════════════════════════════════════════════════════ */
  return (
    <main className="reader-app" data-theme={theme}>
      {/* ── Top bar ──────────────────────────────────────── */}
      <header className="topbar">
        <div className="brand">
          <div className="brand-mark"><span>N</span></div>
          <div className="brand-text">
            <strong>NightReader</strong>
            <span>PDF Reader</span>
          </div>
        </div>

        <div className="theme-switcher" role="group" aria-label="Reader theme">
          {themes.map(t => (
            <button
              key={t.value}
              className={theme === t.value ? "active" : ""}
              onClick={() => setTheme(t.value)}
              type="button"
              aria-pressed={theme === t.value}
              title={t.label}
            >
              <span aria-hidden="true">{t.icon}</span>
              <span className="theme-label">{t.label}</span>
            </button>
          ))}
        </div>

        <div className="topbar-right">
          <button
            className="upload-btn"
            type="button"
            onClick={() => fileInputRef.current?.click()}
          >
            {file ? "Open another PDF" : "Open PDF"}
          </button>
        </div>
      </header>

      <input
        ref={fileInputRef}
        type="file"
        accept="application/pdf,.pdf"
        onChange={onFileChange}
        className="sr-only"
      />

      {/* ── Landing (no file loaded) ─────────────────────── */}
      {!file ? (
        <section className="landing">
          <div className="landing-glow" aria-hidden="true" />

          <div className="landing-copy">
            <span className="eyebrow">READ COMFORTABLY</span>
            <h1>Your PDF.<br />Your comfort.</h1>
            <p>
              Open any PDF locally — zero uploads, zero tracking.<br />
              Seamless continuous book reading in luxury themes.
            </p>
          </div>

          <div
            className={`dropzone${dragging ? " dragging" : ""}`}
            onDragEnter={e => { e.preventDefault(); setDragging(true); }}
            onDragOver={e => e.preventDefault()}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
          >
            <div className="drop-icon" aria-hidden="true">{icons.book}</div>
            <h2>Drop your PDF here</h2>
            <p>All processing happens locally in your browser</p>
            <button
              type="button"
              className="choose-btn"
              onClick={() => fileInputRef.current?.click()}
            >
              Choose PDF
            </button>
            <small>or drag and drop</small>
          </div>

          {error && <p className="error-banner">{error}</p>}

          <div className="feature-row">
            <div><strong>3</strong><span>Reader themes</span></div>
            <div><strong>100%</strong><span>Continuous scroll</span></div>
            <div><strong>Ctrl + Scroll</strong><span>Pinch zoom</span></div>
          </div>
        </section>
      ) : (
        /* ── Reader (file loaded) ────────────────────────── */
        <section
          className={`reader-layout${isFullscreen ? " fullscreen" : ""}`}
          ref={readerRef}
        >
          {/* Sidebar */}
          <aside className="sidebar">
            <div className="file-card">
              <div className="file-icon">{icons.file}</div>
              <div className="file-info">
                <strong title={file.name}>{file.name}</strong>
                <span>{fmtSize(file.size)} · {numPages || "…"} pages</span>
              </div>
            </div>

            <div className="sidebar-section">
              <span className="sidebar-label">Controls</span>
              <div className="shortcut-list">
                <div className="shortcut-row"><kbd>Scroll</kbd><span>Continuous reading</span></div>
                <div className="shortcut-row"><kbd>Ctrl + Scroll</kbd><span>Zoom in / out</span></div>
                <div className="shortcut-row"><kbd>← →</kbd><span>Jump page</span></div>
                <div className="shortcut-row"><kbd>Ctrl + 0</kbd><span>Reset zoom</span></div>
              </div>
            </div>
          </aside>

          {/* Viewer column */}
          <div className="viewer-column">
            {/* Toolbar */}
            <div className="reader-toolbar">
              <div className="page-controls">
                <button
                  className="nav-btn"
                  type="button"
                  disabled={activePage <= 1}
                  onClick={() => scrollToPage(activePage - 1)}
                  aria-label="Previous page"
                >
                  {icons.chevronL}
                </button>

                <div className="page-input-wrap">
                  <input
                    className="page-input"
                    type="number"
                    min={1}
                    max={numPages || 1}
                    value={activePage}
                    onChange={e => {
                      const v = parseInt(e.target.value, 10);
                      if (!isNaN(v)) scrollToPage(v);
                    }}
                    aria-label="Current page"
                  />
                  <span className="page-sep">/</span>
                  <span className="page-total">{numPages || "…"}</span>
                </div>

                <button
                  className="nav-btn"
                  type="button"
                  disabled={!numPages || activePage >= numPages}
                  onClick={() => scrollToPage(activePage + 1)}
                  aria-label="Next page"
                >
                  {icons.chevronR}
                </button>
              </div>

              <div className="toolbar-actions">
                <div className="zoom-controls">
                  <button
                    className="tool-btn"
                    type="button"
                    onClick={() => changeZoom(-ZOOM_STEP)}
                    disabled={zoom <= MIN_ZOOM}
                    aria-label="Zoom out"
                  >
                    −
                  </button>
                  <button
                    className="zoom-value"
                    type="button"
                    onClick={() => setZoom(1)}
                    title="Reset zoom"
                  >
                    {Math.round(zoom * 100)}%
                  </button>
                  <button
                    className="tool-btn"
                    type="button"
                    onClick={() => changeZoom(ZOOM_STEP)}
                    disabled={zoom >= MAX_ZOOM}
                    aria-label="Zoom in"
                  >
                    +
                  </button>
                </div>

                <div className="toolbar-divider" />

                <button
                  className="tool-btn"
                  type="button"
                  onClick={toggleFullscreen}
                  aria-label={isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
                  title={isFullscreen ? "Exit fullscreen" : "Fullscreen"}
                >
                  {isFullscreen ? icons.shrink : icons.expand}
                </button>
              </div>
            </div>

            {/* Continuous Vertical Scroll PDF Container */}
            <div className="pdf-scroll" ref={scrollRef}>
              <Document
                file={file}
                onLoadSuccess={onDocumentLoadSuccess}
                onLoadError={r => setError(r.message || "Could not open this PDF.")}
                loading={
                  <div className="doc-loading">
                    <div className="spinner" />
                    <span>Opening your book…</span>
                  </div>
                }
                error={<div className="doc-loading error">Could not render this PDF.</div>}
              >
                <div className="pdf-book-container">
                  {Array.from({ length: numPages }, (_, index) => {
                    const pageNum = index + 1;
                    const isRendered = pageNum >= renderedRange[0] && pageNum <= renderedRange[1];

                    return (
                      <BookPage
                        key={pageNum}
                        pageNumber={pageNum}
                        pageWidth={pageWidth}
                        pageColors={pageColors}
                        theme={theme}
                        isRendered={isRendered}
                        setPageRef={(el) => {
                          if (el) pageRefs.current.set(pageNum, el);
                          else pageRefs.current.delete(pageNum);
                        }}
                      />
                    );
                  })}
                </div>
              </Document>
              {error && <p className="error-banner">{error}</p>}
            </div>

            <footer className="reader-footer">
              <span>Continuous Scroll · Ctrl + Scroll to zoom · ← → to jump</span>
            </footer>
          </div>
        </section>
      )}
    </main>
  );
}
