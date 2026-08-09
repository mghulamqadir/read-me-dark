"use client";

import dynamic from "next/dynamic";
import { LoadingScreen } from "@/components/LoadingScreen";

const PdfReader = dynamic(() => import("@/components/PdfReader"), {
  ssr: false,
  loading: () => <main className="reader-app" data-theme="midnight"><LoadingScreen visible theme="midnight" /></main>,
});

export default function ReaderClient() {
  return <PdfReader />;
}
