import type { DragEvent } from "react";
import type { ReaderProgress } from "@/types/reader";
import { BookIcon } from "./ReaderIcons";

type ReaderLandingProps = {
  dragging: boolean;
  error: string | null;
  recentDocuments: ReaderProgress[];
  onOpenFile: () => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export function ReaderLanding({ dragging, error, recentDocuments, onOpenFile, onDragEnter, onDragOver, onDragLeave, onDrop }: ReaderLandingProps) {
  return <section className="landing">
    <div className="landing-copy"><span className="eyebrow">READ ME DARK</span><h1>Read comfortably.<br />Day or night.</h1><p>Turn PDFs into a distraction-free reading experience designed for long reading sessions.</p></div>
    <div className={`dropzone${dragging ? " dragging" : ""}`} onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div className="drop-icon" aria-hidden="true"><BookIcon /></div><h2>Open a PDF</h2><p>Drag and drop a PDF, or choose one from your device.</p><button type="button" className="choose-btn" onClick={onOpenFile}>Upload PDF</button><small>PDF only · Your document stays in your browser</small>
    </div>
    {error && <p className="error-banner" role="alert">{error}</p>}
    {recentDocuments.length > 0 && <section className="recent-documents" aria-labelledby="recent-documents-title"><div className="recent-heading"><h2 id="recent-documents-title">Recent documents</h2><span>Select the same PDF to resume</span></div><div className="recent-list">{recentDocuments.map((document) => <button type="button" className="recent-item" key={document.id} onClick={onOpenFile}><strong>{document.name}</strong><span>Page {document.currentPage} of {document.totalPages}</span></button>)}</div></section>}
  </section>;
}
