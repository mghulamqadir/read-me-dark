import type { DragEvent } from "react";
import { BookIcon } from "./ReaderIcons";

type ReaderLandingProps = {
  dragging: boolean;
  error: string | null;
  onOpenFile: () => void;
  onDragEnter: (event: DragEvent<HTMLDivElement>) => void;
  onDragOver: (event: DragEvent<HTMLDivElement>) => void;
  onDragLeave: () => void;
  onDrop: (event: DragEvent<HTMLDivElement>) => void;
};

export function ReaderLanding({ dragging, error, onOpenFile, onDragEnter, onDragOver, onDragLeave, onDrop }: ReaderLandingProps) {
  return <section className="landing">
    <div className="landing-glow" aria-hidden="true" />
    <div className="landing-copy"><span className="eyebrow">READ COMFORTABLY</span><h1>Your PDF.<br />Your comfort.</h1><p>Open any PDF locally - zero uploads, zero tracking.<br />Seamless continuous book reading in luxury themes.</p></div>
    <div className={`dropzone${dragging ? " dragging" : ""}`} onDragEnter={onDragEnter} onDragOver={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
      <div className="drop-icon" aria-hidden="true"><BookIcon /></div><h2>Drop your PDF here</h2><p>All processing happens locally in your browser</p><button type="button" className="choose-btn" onClick={onOpenFile}>Choose PDF</button><small>or drag and drop</small>
    </div>
    {error && <p className="error-banner">{error}</p>}
    <div className="feature-row"><div><strong>1000+</strong><span>Pages, virtualized</span></div><div><strong>100%</strong><span>Continuous scroll</span></div><div><strong>Ctrl + Scroll</strong><span>Pinch zoom</span></div></div>
  </section>;
}
