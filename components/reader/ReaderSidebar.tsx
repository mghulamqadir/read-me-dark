"use client";

import { type FormEvent, useEffect, useState } from "react";
import type { PdfSearchResult } from "@/hooks/usePdfSearch";
import { formatFileSize } from "@/lib/reader";
import type { ReaderMarker } from "@/types/reader";
import { FileIcon, SearchIcon } from "./ReaderIcons";

type ReaderSidebarProps = {
  file: File;
  numPages: number;
  currentPage: number;
  progressPercent: number;
  marker: ReaderMarker | null;
  searchQuery: string;
  searchResults: PdfSearchResult[];
  searchCurrentIndex: number;
  searchCurrentPage: number | null;
  searchIsRunning: boolean;
  searchScannedPages: number;
  searchTotalPages: number;
  searchError: string | null;
  onSearch: (query: string) => void | Promise<void>;
  onNextSearchResult: () => void;
  onPreviousSearchResult: () => void;
  onSelectSearchResultIndex: (index: number) => void;
  onClearSearch: () => void;
  onNavigate: (page: number) => void;
  onJumpToMarker: () => void;
  onClearMarker: () => void;
  searchInputRef?: React.RefObject<HTMLInputElement | null>;
};

export function ReaderSidebar({
  file,
  numPages,
  currentPage,
  progressPercent,
  marker,
  searchQuery,
  searchResults,
  searchCurrentIndex,
  searchCurrentPage,
  searchIsRunning,
  searchScannedPages,
  searchTotalPages,
  searchError,
  onSearch,
  onNextSearchResult,
  onPreviousSearchResult,
  onSelectSearchResultIndex,
  onClearSearch,
  onNavigate,
  onJumpToMarker,
  onClearMarker,
  searchInputRef,
}: ReaderSidebarProps) {
  const [searchInput, setSearchInput] = useState(searchQuery);

  useEffect(() => {
    setSearchInput(searchQuery);
  }, [searchQuery]);

  const submitPage = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const value = new FormData(event.currentTarget).get("page");
    onNavigate(Number(value));
  };

  const handleSearchSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const cleanInput = searchInput.trim();
    if (!cleanInput) return;

    if (searchQuery && cleanInput.toLowerCase() === searchQuery.toLowerCase() && searchResults.length > 0) {
      onNextSearchResult();
    } else {
      void onSearch(cleanInput);
    }
  };

  const handleSearchKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") {
      event.preventDefault();
      const cleanInput = searchInput.trim();
      if (!cleanInput) return;

      if (searchQuery && cleanInput.toLowerCase() === searchQuery.toLowerCase() && searchResults.length > 0) {
        if (event.shiftKey) {
          onPreviousSearchResult();
        } else {
          onNextSearchResult();
        }
      } else {
        void onSearch(cleanInput);
      }
    }
  };

  const searchStatus = searchIsRunning
    ? `Scanning ${searchScannedPages} of ${searchTotalPages} pages...`
    : searchError
      ? searchError
      : searchQuery
        ? searchResults.length
          ? `Found ${searchResults.length} match${searchResults.length === 1 ? "" : "es"} (${searchCurrentIndex + 1}/${searchResults.length})`
          : "No matching text found"
        : "";

  return (
    <aside className="sidebar">
      <div className="file-card">
        <div className="file-icon">
          <FileIcon />
        </div>
        <div className="file-info">
          <strong title={file.name}>{file.name}</strong>
          <span>{formatFileSize(file.size)} · {numPages || "..."} pages</span>
        </div>
      </div>

      <section className="sidebar-section sidebar-search" aria-labelledby="sidebar-search-title">
        <span className="sidebar-label" id="sidebar-search-title">Search document</span>
        <form className="sidebar-search-form" onSubmit={handleSearchSubmit}>
          <div className="sidebar-search-input-wrap">
            <SearchIcon />
            <input
              ref={searchInputRef}
              id="sidebar-search-input"
              type="search"
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              onKeyDown={handleSearchKeyDown}
              placeholder="Find in document..."
              autoComplete="off"
            />
          </div>
          <div className="sidebar-search-buttons">
            <button type="submit" className="sidebar-search-btn primary" disabled={!searchInput.trim() || searchIsRunning}>
              Find
            </button>
            <button
              type="button"
              className="sidebar-search-btn"
              onClick={() => {
                setSearchInput("");
                onClearSearch();
              }}
              disabled={!searchQuery && !searchInput}
            >
              Clear
            </button>
          </div>
        </form>

        {searchStatus && (
          <div className="sidebar-search-meta">
            <span className={`sidebar-search-status${searchError ? " error" : ""}`}>{searchStatus}</span>
            {searchResults.length > 0 && (
              <div className="sidebar-search-nav">
                <button type="button" onClick={onPreviousSearchResult} disabled={searchIsRunning} title="Previous result" aria-label="Previous search result">‹</button>
                <button type="button" onClick={onNextSearchResult} disabled={searchIsRunning} title="Next result" aria-label="Next search result">›</button>
              </div>
            )}
          </div>
        )}

        {searchResults.length > 0 && (
          <div className="sidebar-search-results">
            {searchResults.map((result, idx) => (
              <button
                key={`${result.page}-${idx}`}
                type="button"
                className={`sidebar-search-item${idx === searchCurrentIndex ? " active" : ""}`}
                onClick={() => onSelectSearchResultIndex(idx)}
              >
                <div className="sidebar-search-item-header">
                  <span className="sidebar-search-item-page">Page {result.page}</span>
                  {idx === searchCurrentIndex && <span className="sidebar-search-active-badge">Active</span>}
                </div>
                <p className="sidebar-search-item-snippet">{result.snippet}</p>
              </button>
            ))}
          </div>
        )}
      </section>

      <section className="sidebar-section reading-position" aria-labelledby="reading-position-title">
        <span className="sidebar-label" id="reading-position-title">Reading position</span>
        <div className="reading-summary">
          <strong>Page {currentPage} of {numPages || "..."}</strong>
          <span>{Math.round(progressPercent)}% complete</span>
        </div>
        <div className="reading-progress" role="progressbar" aria-label="Reading progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(progressPercent)}>
          <span style={{ width: `${progressPercent}%` }} />
        </div>
        <form className="page-jump" onSubmit={submitPage}>
          <label htmlFor="sidebar-page-input">Go to page</label>
          <input key={currentPage} id="sidebar-page-input" name="page" type="number" min={1} max={numPages || 1} defaultValue={currentPage} />
          <button type="submit">Go</button>
        </form>
      </section>

      <section className="sidebar-section marker-section" aria-labelledby="marker-title">
        <span className="sidebar-label" id="marker-title">Saved marker</span>
        {marker ? (
          <>
            <div className="marker-summary">
              <strong>Page {marker.page}</strong>
              <span>Saved locally</span>
            </div>
            <div className="marker-actions">
              <button type="button" onClick={onJumpToMarker}>Jump to marker</button>
              <button type="button" className="danger-text" onClick={onClearMarker}>Clear</button>
            </div>
          </>
        ) : (
          <p className="sidebar-empty">Use the bookmark button to save one place in this PDF.</p>
        )}
      </section>

      <div className="sidebar-section shortcut-section">
        <span className="sidebar-label">Shortcuts</span>
        <div className="shortcut-list">
          <div className="shortcut-row"><kbd>Scroll</kbd><span>Continuous reading</span></div>
          <div className="shortcut-row"><kbd>+ / -</kbd><span>Zoom</span></div>
          <div className="shortcut-row"><kbd>Left / Right</kbd><span>Previous / next page</span></div>
          <div className="shortcut-row"><kbd>0</kbd><span>Reset zoom</span></div>
        </div>
      </div>
    </aside>
  );
}

