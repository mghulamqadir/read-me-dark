import type { FormEvent } from "react";
import { formatFileSize } from "@/lib/reader";
import type { ReaderMarker } from "@/types/reader";
import { FileIcon } from "./ReaderIcons";

type ReaderSidebarProps = {
  file: File;
  numPages: number;
  currentPage: number;
  progressPercent: number;
  marker: ReaderMarker | null;
  onNavigate: (page: number) => void;
  onJumpToMarker: () => void;
  onClearMarker: () => void;
};

export function ReaderSidebar({ file, numPages, currentPage, progressPercent, marker, onNavigate, onJumpToMarker, onClearMarker }: ReaderSidebarProps) {
  const submitPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("page");
    onNavigate(Number(value));
  };

  return <aside className="sidebar">
    <div className="file-card"><div className="file-icon"><FileIcon /></div><div className="file-info"><strong title={file.name}>{file.name}</strong><span>{formatFileSize(file.size)} · {numPages || "..."} pages</span></div></div>
    <section className="sidebar-section reading-position" aria-labelledby="reading-position-title"><span className="sidebar-label" id="reading-position-title">Reading position</span><div className="reading-summary"><strong>Page {currentPage} of {numPages || "..."}</strong><span>{Math.round(progressPercent)}% complete</span></div><div className="reading-progress" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}><span style={{ width: `${progressPercent}%` }} /></div><form className="page-jump" onSubmit={submitPage}><label htmlFor="sidebar-page-input">Go to page</label><input key={currentPage} id="sidebar-page-input" name="page" type="number" min={1} max={numPages || 1} defaultValue={currentPage} /><button type="submit">Go</button></form></section>
    <section className="sidebar-section marker-section" aria-labelledby="marker-title"><span className="sidebar-label" id="marker-title">Saved marker</span>{marker ? <><div className="marker-summary"><strong>Page {marker.page}</strong><span>Saved locally</span></div><div className="marker-actions"><button type="button" onClick={onJumpToMarker}>Jump to marker</button><button type="button" className="danger-text" onClick={onClearMarker}>Clear</button></div></> : <p className="sidebar-empty">Use the bookmark button to save one place in this PDF.</p>}</section>
    <div className="sidebar-section shortcut-section"><span className="sidebar-label">Shortcuts</span><div className="shortcut-list"><div className="shortcut-row"><kbd>Scroll</kbd><span>Continuous reading</span></div><div className="shortcut-row"><kbd>+ / -</kbd><span>Zoom</span></div><div className="shortcut-row"><kbd>Left / Right</kbd><span>Previous / next page</span></div><div className="shortcut-row"><kbd>0</kbd><span>Reset zoom</span></div></div></div>
  </aside>;
}
