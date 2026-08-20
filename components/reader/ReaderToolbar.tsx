"use client";

import { useEffect, useRef, useState } from "react";
import type { PdfSearchResult } from "@/hooks/usePdfSearch";
import { MAX_ZOOM, MIN_ZOOM, themes, ZOOM_STEP } from "@/lib/reader";
import type { ReaderLayoutMode, ReaderPreferences, ReaderTheme } from "@/types/reader";
import { BookmarkIcon, DownloadIcon, ExpandIcon, SearchIcon, ShrinkIcon, SpinnerIcon } from "./ReaderIcons";

type ToolbarMenu = "typography" | "theme" | "width" | "search" | "zoom" | null;

type ReaderToolbarProps = {
  preferences: ReaderPreferences;
  zoom: number;
  markerActive: boolean;
  hasMarker: boolean;
  isFullscreen: boolean;
  searchQuery: string;
  searchResults: PdfSearchResult[];
  searchResultCount: number;
  searchCurrentIndex: number;
  searchCurrentPage: number | null;
  searchIsRunning: boolean;
  searchScannedPages: number;
  searchTotalPages: number;
  searchError: string | null;
  onPreferencesChange: (update: Partial<ReaderPreferences>) => void;
  onZoom: (delta: number) => void;
  onZoomChange: (zoom: number) => void;
  onResetZoom: () => void;
  onFitWidth: () => void;
  onActualSize: () => void;
  onToggleSidebar: () => void;
  onToggleMarker: () => void;
  onToggleFullscreen: () => void;
  onSearch: (query: string) => void | Promise<void>;
  onNextSearchResult: () => void;
  onPreviousSearchResult: () => void;
  onSelectSearchResultIndex: (index: number) => void;
  onClearSearch: () => void;
  onFocusSearch: () => void;
  onDownload: () => void;
  downloadProgress: { page: number; total: number } | null;
};


export function ReaderToolbar(props: ReaderToolbarProps) {
  const [openMenu, setOpenMenu] = useState<ToolbarMenu>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);
  const typographyTriggerRef = useRef<HTMLButtonElement>(null);
  const themeTriggerRef = useRef<HTMLButtonElement>(null);
  const widthTriggerRef = useRef<HTMLButtonElement>(null);
  const zoomTriggerRef = useRef<HTMLButtonElement>(null);

  const closeMenu = () => {
    const menu = openMenu;
    setOpenMenu(null);
    if (menu) {
      window.requestAnimationFrame(() => {
        if (menu === "typography") typographyTriggerRef.current?.focus();
        if (menu === "theme") themeTriggerRef.current?.focus();
        if (menu === "width") widthTriggerRef.current?.focus();
        if (menu === "zoom") zoomTriggerRef.current?.focus();
      });
    }
  };

  useEffect(() => {
    if (!openMenu) return;
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); closeMenu(); } };
    const onPointerDown = (event: PointerEvent) => { if (!toolbarRef.current?.contains(event.target as Node)) setOpenMenu(null); };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("pointerdown", onPointerDown);
    return () => { document.removeEventListener("keydown", onKeyDown); document.removeEventListener("pointerdown", onPointerDown); };
  }, [openMenu]); // eslint-disable-line react-hooks/exhaustive-deps

  const { onFocusSearch } = props;
  useEffect(() => {
    const onFindShortcut = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "f") {
        event.preventDefault();
        onFocusSearch();
      }
    };
    window.addEventListener("keydown", onFindShortcut);
    return () => window.removeEventListener("keydown", onFindShortcut);
  }, [onFocusSearch]);

  const toggleMenu = (menu: Exclude<ToolbarMenu, null>) => {
    setOpenMenu((current) => current === menu ? null : menu);
  };
  const setLayout = (mode: ReaderLayoutMode) => { if (mode === "fit-width") props.onFitWidth(); else props.onActualSize(); closeMenu(); };
  const setTheme = (theme: ReaderTheme) => props.onPreferencesChange({ theme });

  return <div className="reader-toolbar compact-toolbar" role="toolbar" aria-label="Reader tools" ref={toolbarRef}>
    <div className="compact-tools">
      <button className="tool-btn sidebar-toggle" type="button" onClick={props.onToggleSidebar} aria-label={props.preferences.sidebarOpen ? "Hide sidebar" : "Show sidebar"} title={props.preferences.sidebarOpen ? "Hide sidebar" : "Show sidebar"}>☰</button>
      <div className="toolbar-divider" />
      <div className="toolbar-menu-wrap">
        <button ref={typographyTriggerRef} className={`toolbar-text-btn${openMenu === "typography" ? " active" : ""}`} type="button" onClick={() => toggleMenu("typography")} aria-expanded={openMenu === "typography"} aria-haspopup="dialog" title="Typography">Aa</button>
        {openMenu === "typography" && <div className="toolbar-popover typography-popover" role="dialog" aria-label="Typography settings"><label>Font<select value={props.preferences.fontFamily} onChange={(event) => props.onPreferencesChange({ fontFamily: event.target.value as ReaderPreferences["fontFamily"] })}><option value="inter">Inter</option><option value="system">System</option><option value="serif">Serif</option></select></label><label>Size<select value={props.preferences.fontSize} onChange={(event) => props.onPreferencesChange({ fontSize: event.target.value as ReaderPreferences["fontSize"] })}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label><label>Line height<select value={props.preferences.lineHeight} onChange={(event) => props.onPreferencesChange({ lineHeight: event.target.value as ReaderPreferences["lineHeight"] })}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="relaxed">Relaxed</option></select></label><label>Spacing<select value={props.preferences.letterSpacing} onChange={(event) => props.onPreferencesChange({ letterSpacing: event.target.value as ReaderPreferences["letterSpacing"] })}><option value="normal">Normal</option><option value="wide">Wide</option></select></label></div>}
      </div>
      <div className="toolbar-menu-wrap">
        <button ref={themeTriggerRef} className={`toolbar-text-btn${openMenu === "theme" ? " active" : ""}`} type="button" onClick={() => toggleMenu("theme")} aria-expanded={openMenu === "theme"} aria-haspopup="menu" title="Theme">Theme</button>
        {openMenu === "theme" && <div className="toolbar-popover theme-popover" role="menu">{themes.map((theme) => <button type="button" role="menuitemradio" aria-checked={props.preferences.theme === theme.value} className={props.preferences.theme === theme.value ? "selected" : ""} key={theme.value} onClick={() => setTheme(theme.value)}><span className={`theme-swatch theme-${theme.value}`} />{theme.label}</button>)}</div>}
      </div>
      <div className="toolbar-menu-wrap">
        <button ref={widthTriggerRef} className={`toolbar-text-btn${openMenu === "width" ? " active" : ""}`} type="button" onClick={() => toggleMenu("width")} aria-expanded={openMenu === "width"} aria-haspopup="menu" title="Page width">Width</button>
        {openMenu === "width" && <div className="toolbar-popover width-popover" role="menu"><button type="button" role="menuitemradio" aria-checked={props.preferences.layoutMode === "fit-width"} onClick={() => setLayout("fit-width")}>Fit width</button><button type="button" role="menuitemradio" aria-checked={props.preferences.layoutMode === "actual-size"} onClick={() => setLayout("actual-size")}>Actual size</button></div>}
      </div>
      <button className={`tool-btn${props.searchQuery ? " active" : ""}`} type="button" onClick={props.onFocusSearch} aria-label="Search document in sidebar" title="Search document in sidebar"><SearchIcon /></button>
      <div className="toolbar-menu-wrap">
        <button ref={zoomTriggerRef} className={`toolbar-text-btn${openMenu === "zoom" ? " active" : ""}`} type="button" onClick={() => toggleMenu("zoom")} aria-expanded={openMenu === "zoom"} aria-haspopup="dialog" title="Zoom controls">Zoom</button>
        {openMenu === "zoom" && <div className="toolbar-popover zoom-popover" role="dialog" aria-label="Zoom controls"><button type="button" onClick={() => props.onZoom(-ZOOM_STEP)} disabled={props.zoom <= MIN_ZOOM} aria-label="Zoom out">−</button><input type="range" min={MIN_ZOOM} max={MAX_ZOOM} step={ZOOM_STEP} value={props.zoom} onChange={(event) => props.onZoomChange(Number(event.target.value))} aria-label="Zoom level" /><button type="button" onClick={() => props.onZoom(ZOOM_STEP)} disabled={props.zoom >= MAX_ZOOM} aria-label="Zoom in">+</button><button type="button" className="zoom-reset" onClick={props.onResetZoom}>Reset</button></div>}
      </div>
      <button className={`tool-btn bookmark-btn${props.markerActive ? " active" : ""}`} type="button" onClick={props.onToggleMarker} aria-label={props.markerActive ? "Remove marker from this page" : props.hasMarker ? "Replace saved marker with this page" : "Save this page as marker"} aria-pressed={props.markerActive} title={props.markerActive ? "Remove marker" : "Save marker"}><BookmarkIcon filled={props.markerActive} /></button>
      <button
        className={`tool-btn${props.isFullscreen ? " active" : ""}`}
        type="button"
        onClick={props.onToggleFullscreen}
        aria-label={props.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"}
        title={props.isFullscreen ? "Exit fullscreen (F)" : "Enter fullscreen (F)"}
      >
        {props.isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}
      </button>
      <div className="toolbar-divider" />
      <button
        id="download-pdf-btn"
        className={`tool-btn download-btn${props.downloadProgress ? " downloading" : ""}`}
        type="button"
        onClick={props.onDownload}
        disabled={!!props.downloadProgress}
        aria-label={props.downloadProgress
          ? `Generating PDF… ${props.downloadProgress.page} of ${props.downloadProgress.total} pages`
          : "Download PDF in current theme"}
        title={props.downloadProgress
          ? `Processing page ${props.downloadProgress.page} of ${props.downloadProgress.total}…`
          : "Download themed PDF"}
      >
        {props.downloadProgress ? (() => {
          const pct = props.downloadProgress.total > 0
            ? Math.round((props.downloadProgress.page / props.downloadProgress.total) * 100)
            : 0;
          return <>
            <SpinnerIcon />
            <span className="download-btn-label">{pct}%</span>
            <span
              className="download-progress-bar"
              style={{ "--pct": `${pct}%` } as React.CSSProperties}
              aria-hidden="true"
            />
          </>;
        })() : (
          <><DownloadIcon /><span className="download-btn-label">Download</span></>
        )}
      </button>
      <button className="zoom-percent" type="button" onClick={props.onResetZoom} title="Reset zoom to 100%">{Math.round(props.zoom * 100)}%</button>
    </div>
  </div>;
}

