"use client";

import { memo, useEffect, useState } from "react";
import { Page } from "react-pdf";
import type { PageRenderGate } from "@/hooks/usePageRenderGate";

type VirtualPdfPageProps = {
  pageNumber: number;
  sessionId: number;
  pageWidth: number;
  estimatedHeight: number;
  pageColors: { background: string; foreground: string } | undefined;
  gate: PageRenderGate;
  measureRef: (element: HTMLDivElement | null) => void;
};

export const VirtualPdfPage = memo(function VirtualPdfPage({ pageNumber, sessionId, pageWidth, estimatedHeight, pageColors, gate, measureRef }: VirtualPdfPageProps) {
  const [canRender, setCanRender] = useState(false);
  const renderKey = `${sessionId}:${pageNumber}`;

  useEffect(() => {
    setCanRender(false);
    gate.request(renderKey, () => setCanRender(true));
    return () => gate.release(renderKey);
  }, [gate, renderKey]);

  return <div data-page={pageNumber} data-index={pageNumber - 1} ref={measureRef} className="pdf-page-shell" style={{ width: `${pageWidth}px` }}>
    {canRender ? <Page pageNumber={pageNumber} width={pageWidth} pageColors={pageColors} renderTextLayer renderAnnotationLayer onRenderSuccess={() => gate.complete(renderKey)} onRenderError={() => gate.complete(renderKey)} loading={<div className="page-placeholder" style={{ height: `${estimatedHeight}px` }}><div className="spinner" /></div>} /> : <div className="page-placeholder" style={{ height: `${estimatedHeight}px` }}><span>Page {pageNumber}</span></div>}
  </div>;
});
