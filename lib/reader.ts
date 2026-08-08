import type { ReaderPreferences, ReaderProgress, ReaderTheme } from "@/types/reader";

export const PREFERENCES_KEY = "read-me-dark-preferences";
export const PROGRESS_KEY = "read-me-dark-progress";
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;
export const PAGE_GAP = 24;
export const OVERSCAN = 2;
export const MAX_CONCURRENT_RENDERS = 3;

export const themes: { value: ReaderTheme; label: string; icon: string }[] = [
  { value: "midnight", label: "Midnight", icon: "moon" },
  { value: "oled", label: "OLED Black", icon: "circle" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "sepia", label: "Sepia", icon: "sepia" },
  { value: "soft-dark", label: "Soft Dark", icon: "cloud" },
];

export const defaultPreferences: ReaderPreferences = {
  theme: "midnight",
  fontFamily: "inter",
  fontSize: "comfortable",
  lineHeight: "comfortable",
  letterSpacing: "normal",
  zoom: 1,
  sidebarOpen: true,
};

export function clamp(value: number, minimum: number, maximum: number) {
  return Math.min(Math.max(value, minimum), maximum);
}

export function formatFileSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  const kilobytes = bytes / 1024;
  return kilobytes < 1024
    ? `${kilobytes.toFixed(1)} KB`
    : `${(kilobytes / 1024).toFixed(1)} MB`;
}

export function getPageColors(theme: ReaderTheme) {
  if (theme === "midnight" || theme === "oled" || theme === "soft-dark") return { background: "#0e1010", foreground: "#dde3e0" };
  if (theme === "sepia") return { background: "#f8f0dc", foreground: "#493d2b" };
  return undefined;
}

export function documentFallbackId(file: File) {
  return `${file.name}:${file.size}:${file.lastModified}`;
}

export function readPreferences(): ReaderPreferences {
  if (typeof window === "undefined") return defaultPreferences;
  try {
    const stored = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) ?? "null");
    return { ...defaultPreferences, ...(stored ?? {}) };
  } catch {
    return defaultPreferences;
  }
}

export function writePreferences(preferences: ReaderPreferences) {
  window.localStorage.setItem(PREFERENCES_KEY, JSON.stringify(preferences));
}

export function readProgress(): ReaderProgress[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) ?? "[]");
    return Array.isArray(stored) ? stored.filter(isReaderProgress) : [];
  } catch {
    return [];
  }
}

export function writeProgress(progress: ReaderProgress) {
  const next = [progress, ...readProgress().filter((entry) => entry.id !== progress.id)].slice(0, 8);
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(next));
}

function isReaderProgress(value: unknown): value is ReaderProgress {
  return Boolean(value && typeof value === "object" && "id" in value && "name" in value && "currentPage" in value && "totalPages" in value);
}
