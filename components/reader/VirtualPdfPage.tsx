"use client";

import { memo, useCallback, useEffect, useState } from "react";
import { Page } from "react-pdf";
import type { PageRenderGate } from "@/hooks/usePageRenderGate";

type VirtualPdfPageProps = {
  pageNumber: number;
  sessionId: number;
  pageWidth: number;
  estimatedHeight: number;
  pageColors: { background: string; foreground: string } | undefined;
  highlightQuery: string;
  gate: PageRenderGate;
  measureRef: (element: HTMLDivElement | null) => void;
};

function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[character] ?? character);
}

export const VirtualPdfPage = memo(function VirtualPdfPage({ pageNumber, sessionId, pageWidth, estimatedHeight, pageColors, highlightQuery, gate, measureRef }: VirtualPdfPageProps) {
  const [canRender, setCanRender] = useState(false);
  const renderKey = `${sessionId}:${pageNumber}`;

  useEffect(() => {
    setCanRender(false);
    gate.request(renderKey, () => setCanRender(true));
    return () => gate.release(renderKey);
  }, [gate, renderKey]);

  const renderHighlightedText = useCallback(({ str }: { str: string }) => {
    const query = highlightQuery.trim();
    if (!query) return escapeHtml(str);
    const normalizedText = str.toLocaleLowerCase();
    const normalizedQuery = query.toLocaleLowerCase();
    let cursor = 0;
    let matchIndex = normalizedText.indexOf(normalizedQuery);
    let output = "";

    while (matchIndex >= 0) {
      output += escapeHtml(str.slice(cursor, matchIndex));
      output += `<mark class="pdf-search-highlight">${escapeHtml(str.slice(matchIndex, matchIndex + query.length))}</mark>`;
      cursor = matchIndex + query.length;
      matchIndex = normalizedText.indexOf(normalizedQuery, cursor);
    }

    return output + escapeHtml(str.slice(cursor));
  }, [highlightQuery]);

  return <div data-page={pageNumber} data-index={pageNumber - 1} ref={measureRef} className="pdf-page-shell" style={{ width: `${pageWidth}px` }}>
    {canRender ? <Page pageNumber={pageNumber} width={pageWidth} pageColors={pageColors} customTextRenderer={highlightQuery ? renderHighlightedText : undefined} renderTextLayer renderAnnotationLayer onRenderSuccess={() => gate.complete(renderKey)} onRenderError={() => gate.complete(renderKey)} loading={<div className="page-placeholder" style={{ height: `${estimatedHeight}px` }}><div className="spinner" /></div>} /> : <div className="page-placeholder" style={{ height: `${estimatedHeight}px` }}><span>Page {pageNumber}</span></div>}
  </div>;
});
