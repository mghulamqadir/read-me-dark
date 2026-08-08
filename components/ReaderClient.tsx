"use client";

import dynamic from "next/dynamic";

const PdfReader = dynamic(() => import("@/components/PdfReader"), {
  ssr: false,
  loading: () => <main className="reader-app"><section className="landing"><div className="doc-loading"><div className="spinner" /><span>Loading Read Me Dark...</span></div></section></main>,
});

export default function ReaderClient() {
  return <PdfReader />;
}
