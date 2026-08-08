"use client";

import { Document, pdfjs } from "react-pdf";
import type { VirtualItem } from "@tanstack/react-virtual";
import type { PDFDocumentProxy } from "pdfjs-dist";
import type { PageRenderGate } from "@/hooks/usePageRenderGate";
import { VirtualPdfPage } from "./VirtualPdfPage";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";

pdfjs.GlobalWorkerOptions.workerSrc = new URL("pdfjs-dist/build/pdf.worker.min.mjs", import.meta.url).toString();

type PdfViewportProps = {
  file: File;
  numPages: number;
  pageWidth: number;
  sessionId: number;
  estimatedPageHeight: number;
  totalSize: number;
  virtualItems: VirtualItem[];
  pageColors: { background: string; foreground: string } | undefined;
  highlightQuery: string;
  gate: PageRenderGate;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  measureElement: (element: HTMLDivElement | null) => void;
  onLoadSuccess: (pdf: PDFDocumentProxy) => void;
  onLoadError: (message: string) => void;
  error: string | null;
};

export function PdfViewport({ file, numPages, pageWidth, sessionId, estimatedPageHeight, totalSize, virtualItems, pageColors, highlightQuery, gate, scrollRef, measureElement, onLoadSuccess, onLoadError, error }: PdfViewportProps) {
  return <div className="pdf-scroll" ref={scrollRef}>
    <Document key={sessionId} file={file} onLoadSuccess={onLoadSuccess} onLoadError={(reason) => onLoadError(reason.message || "That PDF appears to be invalid or corrupted.")} loading={<div className="doc-loading"><div className="spinner" /><span>Opening your book...</span></div>} error={<div className="doc-loading error">Could not render this PDF.</div>}>
      {numPages > 0 && <div className="pdf-book-container" style={{ position: "relative", height: `${totalSize}px`, width: `${pageWidth}px` }}>
        {virtualItems.map((item) => <div key={item.key} style={{ position: "absolute", top: 0, left: 0, width: "100%", transform: `translateY(${item.start}px)` }}><VirtualPdfPage pageNumber={item.index + 1} sessionId={sessionId} pageWidth={pageWidth} estimatedHeight={estimatedPageHeight} pageColors={pageColors} highlightQuery={highlightQuery} gate={gate} measureRef={measureElement} /></div>)}
      </div>}
    </Document>
    {error && <p className="error-banner">{error}</p>}
  </div>;
}
