import type { ReaderTheme } from "@/types/reader";

export const THEME_KEY = "nightreader-theme";
export const MIN_ZOOM = 0.5;
export const MAX_ZOOM = 3;
export const ZOOM_STEP = 0.1;
export const PAGE_GAP = 24;
export const OVERSCAN = 2;
export const MAX_CONCURRENT_RENDERS = 3;

export const themes: { value: ReaderTheme; label: string; icon: string }[] = [
  { value: "dark", label: "Dark", icon: "moon" },
  { value: "light", label: "Light", icon: "sun" },
  { value: "sepia", label: "Sepia", icon: "sepia" },
];

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
  if (theme === "dark") return { background: "#0e1010", foreground: "#dde3e0" };
  if (theme === "sepia") return { background: "#f8f0dc", foreground: "#493d2b" };
  return undefined;
}
