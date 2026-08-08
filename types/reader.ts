export type ReaderTheme = "midnight" | "oled" | "sepia" | "soft-dark" | "light";

export type ReaderTypography = {
  fontFamily: "inter" | "system" | "serif";
  fontSize: "compact" | "comfortable" | "large";
  lineHeight: "compact" | "comfortable" | "relaxed";
  letterSpacing: "normal" | "wide";
};

export type ReaderPreferences = ReaderTypography & {
  theme: ReaderTheme;
  zoom: number;
  sidebarOpen: boolean;
};

export type ReaderProgress = {
  id: string;
  name: string;
  size: number;
  lastModified: number;
  currentPage: number;
  totalPages: number;
  zoom: number;
  lastOpenedAt: number;
};
