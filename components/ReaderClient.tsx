"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/LoadingScreen";
import type { LoadingScreenTheme } from "@/components/LoadingScreen";
import { PREFERENCES_KEY, defaultPreferences } from "@/lib/reader";

function getSavedTheme(): LoadingScreenTheme {
  if (typeof window === "undefined") return defaultPreferences.theme;
  try {
    const stored = JSON.parse(window.localStorage.getItem(PREFERENCES_KEY) ?? "null");
    return (stored?.theme as LoadingScreenTheme) ?? defaultPreferences.theme;
  } catch {
    return defaultPreferences.theme;
  }
}

const savedTheme = getSavedTheme();

const PdfReader = dynamic(() => import("@/components/PdfReader"), {
  ssr: false,
  loading: () => (
    <main className="reader-app" data-theme={savedTheme}>
      <LoadingScreen visible theme={savedTheme} />
    </main>
  ),
});

export default function ReaderClient() {
  return <PdfReader />;
}
