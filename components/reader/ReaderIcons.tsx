import type { ReactNode } from "react";

type IconProps = { size?: number };

function Icon({ children, size = 16 }: IconProps & { children: ReactNode }) {
  return <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">{children}</svg>;
}

export function ChevronLeft() { return <Icon size={14}><polyline points="15 18 9 12 15 6" /></Icon>; }
export function ChevronRight() { return <Icon size={14}><polyline points="9 18 15 12 9 6" /></Icon>; }
export function FileIcon() { return <Icon size={18}><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" /><polyline points="14 2 14 8 20 8" /></Icon>; }
export function BookIcon() { return <Icon size={30}><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z" /><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /></Icon>; }
export function ExpandIcon() { return <Icon size={15}><polyline points="15 3 21 3 21 9" /><polyline points="9 21 3 21 3 15" /><line x1="21" y1="3" x2="14" y2="10" /><line x1="3" y1="21" x2="10" y2="14" /></Icon>; }
export function ShrinkIcon() { return <Icon size={15}><polyline points="4 14 10 14 10 20" /><polyline points="20 10 14 10 14 4" /><line x1="14" y1="10" x2="21" y2="3" /><line x1="3" y1="21" x2="10" y2="14" /></Icon>; }
export function SearchIcon() { return <Icon size={15}><circle cx="11" cy="11" r="7" /><line x1="20" y1="20" x2="16.2" y2="16.2" /></Icon>; }
export function BookmarkIcon({ filled = false }: { filled?: boolean }) { return <svg width="15" height="15" viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 3h12v18l-6-4-6 4z" /></svg>; }
export function DownloadIcon() { return <Icon size={15}><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" /><polyline points="7 10 12 15 17 10" /><line x1="12" y1="15" x2="12" y2="3" /></Icon>; }
export function SpinnerIcon() { return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" className="spin-icon"><path d="M21 12a9 9 0 1 1-6.219-8.56" /></svg>; }
