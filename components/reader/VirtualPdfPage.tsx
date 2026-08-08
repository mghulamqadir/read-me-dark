"use client";

import { memo, useEffect } from "react";
import { Page } from "react-pdf";
import type { PageRenderGate } from "@/hooks/usePageRenderGate";

type VirtualPdfPageProps = {
  pageNumber: number;
  pageWidth: number;
  estimatedHeight: number;
  pageColors: { background: string; foreground: string } | undefined;
  gate: PageRenderGate;
  renderVersion: number;
  measureRef: (element: HTMLDivElement | null) => void;
};

export const VirtualPdfPage = memo(function VirtualPdfPage({ pageNumber, pageWidth, estimatedHeight, pageColors, gate, renderVersion, measureRef }: VirtualPdfPageProps) {
  const canRender = gate.acquire(pageNumber);
  useEffect(() => () => gate.release(pageNumber), [pageNumber, gate]);

  return <div data-page={pageNumber} data-index={pageNumber - 1} data-render-version={renderVersion} ref={measureRef} className="pdf-page-shell" style={{ width: `${pageWidth}px` }}>
    {canRender ? <Page pageNumber={pageNumber} width={pageWidth} pageColors={pageColors} renderTextLayer renderAnnotationLayer onRenderSuccess={() => gate.onComplete(pageNumber)} onRenderError={() => gate.onError(pageNumber)} loading={<div className="page-placeholder" style={{ height: `${estimatedHeight}px` }}><div className="spinner" /></div>} /> : <div className="page-placeholder" style={{ height: `${estimatedHeight}px` }}><span>Page {pageNumber}</span></div>}
  </div>;
});
