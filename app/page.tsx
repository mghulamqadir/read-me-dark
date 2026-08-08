// page.tsx
"use client";

import dynamic from "next/dynamic";

const PdfReader = dynamic(() => import("@/components/PdfReader"), {
  ssr: false,
  loading: () => <main className="app-shell"><div className="empty-state"><p>Loading reader…</p></div></main>,
});

export default function Home() {
  return <PdfReader />;
}
