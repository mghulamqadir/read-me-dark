import type { ChangeEvent, KeyboardEvent } from "react";
import { MAX_ZOOM, MIN_ZOOM, ZOOM_STEP } from "@/lib/reader";
import { ChevronLeft, ChevronRight, ExpandIcon, ShrinkIcon } from "./ReaderIcons";

type ReaderToolbarProps = {
  activePage: number;
  numPages: number;
  pageInput: string;
  zoom: number;
  isFullscreen: boolean;
  sidebarOpen: boolean;
  onPageInputChange: (value: string) => void;
  onPageInputFocus: () => void;
  onPageInputCommit: () => void;
  onNavigate: (page: number) => void;
  onZoom: (delta: number) => void;
  onResetZoom: () => void;
  onFitWidth: () => void;
  onToggleSidebar: () => void;
  onToggleFullscreen: () => void;
};

export function ReaderToolbar(props: ReaderToolbarProps) {
  const commitOnEnter = (event: KeyboardEvent<HTMLInputElement>) => { if (event.key === "Enter") event.currentTarget.blur(); };
  const updatePage = (event: ChangeEvent<HTMLInputElement>) => props.onPageInputChange(event.target.value);
  return <div className="reader-toolbar">
    <div className="page-controls">
      <button className="nav-btn" type="button" disabled={props.activePage <= 1} onClick={() => props.onNavigate(props.activePage - 1)} aria-label="Previous page" title="Previous page"><ChevronLeft /></button>
      <div className="page-input-wrap"><input className="page-input" type="number" min={1} max={props.numPages || 1} value={props.pageInput} onFocus={props.onPageInputFocus} onChange={updatePage} onBlur={props.onPageInputCommit} onKeyDown={commitOnEnter} aria-label="Current page" /><span className="page-sep">/</span><span className="page-total">{props.numPages || "..."}</span></div>
      <button className="nav-btn" type="button" disabled={!props.numPages || props.activePage >= props.numPages} onClick={() => props.onNavigate(props.activePage + 1)} aria-label="Next page" title="Next page"><ChevronRight /></button>
    </div>
    <div className="toolbar-actions"><button className="tool-btn sidebar-toggle" type="button" onClick={props.onToggleSidebar} aria-label={props.sidebarOpen ? "Hide sidebar" : "Show sidebar"} title={props.sidebarOpen ? "Hide sidebar" : "Show sidebar"}>☰</button><div className="zoom-controls"><button className="tool-btn" type="button" onClick={() => props.onZoom(-ZOOM_STEP)} disabled={props.zoom <= MIN_ZOOM} aria-label="Zoom out" title="Zoom out">-</button><button className="zoom-value" type="button" onClick={props.onResetZoom} title="Reset zoom">{Math.round(props.zoom * 100)}%</button><button className="tool-btn" type="button" onClick={() => props.onZoom(ZOOM_STEP)} disabled={props.zoom >= MAX_ZOOM} aria-label="Zoom in" title="Zoom in">+</button></div><button className="fit-width-btn" type="button" onClick={props.onFitWidth} title="Fit page width">Fit width</button><div className="toolbar-divider" /><button className="tool-btn" type="button" onClick={props.onToggleFullscreen} aria-label={props.isFullscreen ? "Exit fullscreen" : "Enter fullscreen"} title={props.isFullscreen ? "Exit fullscreen" : "Fullscreen"}>{props.isFullscreen ? <ShrinkIcon /> : <ExpandIcon />}</button></div>
  </div>;
}
