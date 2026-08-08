export type ReaderTheme = "midnight" | "oled" | "sepia" | "soft-dark" | "light";
export type ReaderLayoutMode = "fit-width" | "actual-size";

export type ReaderPosition = {
  page: number;
  offsetRatio: number;
};

export type ReaderMarker = ReaderPosition & {
  createdAt: number;
};

export type ReaderTypography = {
  fontFamily: "inter" | "system" | "serif";
  fontSize: "compact" | "comfortable" | "large";
  lineHeight: "compact" | "comfortable" | "relaxed";
  letterSpacing: "normal" | "wide";
};

export type ReaderPreferences = ReaderTypography & {
  theme: ReaderTheme;
  zoom: number;
  layoutMode: ReaderLayoutMode;
  sidebarOpen: boolean;
};

export type ReaderProgress = {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  currentPage: number;
  totalPages: number;
  scrollPosition: ReaderPosition;
  progressPercent: number;
  marker: ReaderMarker | null;
  zoom: number;
  theme: ReaderTheme;
  fontSize: ReaderTypography["fontSize"];
  lastOpenedAt: number;
};
