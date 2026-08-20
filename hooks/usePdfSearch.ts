"use client";

import type { PDFDocumentProxy } from "pdfjs-dist";
import { useCallback, useEffect, useRef, useState } from "react";

export type PdfSearchResult = {
  page: number;
  snippet: string;
  matchIndex: number;
  offsetRatio: number;
};

export function usePdfSearch(pdf: PDFDocumentProxy | null, sessionId: number) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<PdfSearchResult[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isSearching, setIsSearching] = useState(false);
  const [scannedPages, setScannedPages] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const textCache = useRef(new Map<number, string>());
  const resultsRef = useRef<PdfSearchResult[]>([]);
  const currentIndexRef = useRef(-1);
  const searchToken = useRef(0);

  useEffect(() => {
    searchToken.current += 1;
    textCache.current.clear();
  }, [sessionId]);

  const runSearch = useCallback(async (rawQuery: string) => {
    const nextQuery = rawQuery.trim();
    const token = ++searchToken.current;
    setQuery(nextQuery); setResults([]); setCurrentIndex(-1); setScannedPages(0); setError(null);
    resultsRef.current = []; currentIndexRef.current = -1;
    if (!pdf || !nextQuery) { setIsSearching(false); return null; }

    setIsSearching(true);
    const normalizedQuery = nextQuery.toLocaleLowerCase();
    const matches: PdfSearchResult[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= pdf.numPages; pageNumber += 1) {
        if (searchToken.current !== token) return null;
        let pageText = textCache.current.get(pageNumber);
        if (pageText === undefined) {
          const page = await pdf.getPage(pageNumber);
          const content = await page.getTextContent();
          pageText = content.items.map((item) => "str" in item ? item.str : "").join(" ").replace(/\s+/g, " ").trim();
          textCache.current.set(pageNumber, pageText);
        }

        const normalizedPageText = pageText.toLocaleLowerCase();
        let searchStart = 0;
        let matchIndex = normalizedPageText.indexOf(normalizedQuery, searchStart);
        while (matchIndex >= 0) {
          const start = Math.max(0, matchIndex - 42);
          const end = Math.min(pageText.length, matchIndex + nextQuery.length + 58);
          const offsetRatio = Math.max(0, Math.min(1, matchIndex / Math.max(1, pageText.length)));
          matches.push({
            page: pageNumber,
            snippet: `${start > 0 ? "..." : ""}${pageText.slice(start, end)}${end < pageText.length ? "..." : ""}`,
            matchIndex,
            offsetRatio,
          });
          searchStart = matchIndex + normalizedQuery.length;
          matchIndex = normalizedPageText.indexOf(normalizedQuery, searchStart);
        }

        if (pageNumber % 8 === 0 || pageNumber === pdf.numPages) {
          setScannedPages(pageNumber);
          await new Promise<void>((resolve) => window.requestAnimationFrame(() => resolve()));
        }
      }

      if (searchToken.current !== token) return null;
      resultsRef.current = matches;
      currentIndexRef.current = matches.length ? 0 : -1;
      setResults(matches); setCurrentIndex(matches.length ? 0 : -1); setIsSearching(false);
      return matches[0] ?? null;
    } catch {
      if (searchToken.current === token) { setIsSearching(false); setError("Could not search this PDF."); }
      return null;
    }
  }, [pdf]);

  const selectResult = useCallback((direction: 1 | -1) => {
    const matches = resultsRef.current;
    if (!matches.length) return null;
    const nextIndex = (currentIndexRef.current + direction + matches.length) % matches.length;
    currentIndexRef.current = nextIndex;
    setCurrentIndex(nextIndex);
    return matches[nextIndex];
  }, []);

  const selectResultIndex = useCallback((index: number) => {
    const matches = resultsRef.current;
    if (!matches.length || index < 0 || index >= matches.length) return null;
    currentIndexRef.current = index;
    setCurrentIndex(index);
    return matches[index];
  }, []);

  const clearSearch = useCallback(() => {
    searchToken.current += 1;
    setQuery(""); setResults([]); setCurrentIndex(-1); setIsSearching(false); setScannedPages(0); setError(null);
    resultsRef.current = []; currentIndexRef.current = -1;
  }, []);

  const nextResult = useCallback(() => selectResult(1), [selectResult]);
  const previousResult = useCallback(() => selectResult(-1), [selectResult]);

  return { query, results, currentIndex, isSearching, scannedPages, totalPages: pdf?.numPages ?? 0, error, runSearch, nextResult, previousResult, selectResultIndex, clearSearch };
}

