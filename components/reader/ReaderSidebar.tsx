import { formatFileSize } from "@/lib/reader";
import type { ReaderPreferences } from "@/types/reader";
import { FileIcon } from "./ReaderIcons";

type ReaderSidebarProps = {
  file: File;
  numPages: number;
  preferences: ReaderPreferences;
  onPreferencesChange: (update: Partial<ReaderPreferences>) => void;
};

export function ReaderSidebar({ file, numPages, preferences, onPreferencesChange }: ReaderSidebarProps) {
  return <aside className="sidebar">
    <div className="file-card"><div className="file-icon"><FileIcon /></div><div className="file-info"><strong title={file.name}>{file.name}</strong><span>{formatFileSize(file.size)} · {numPages || "..."} pages</span></div></div>
    <div className="sidebar-section"><span className="sidebar-label">Reader UI</span><label className="setting-row">Font<select value={preferences.fontFamily} onChange={(event) => onPreferencesChange({ fontFamily: event.target.value as ReaderPreferences["fontFamily"] })}><option value="inter">Inter</option><option value="system">System</option><option value="serif">Serif</option></select></label><label className="setting-row">Size<select value={preferences.fontSize} onChange={(event) => onPreferencesChange({ fontSize: event.target.value as ReaderPreferences["fontSize"] })}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="large">Large</option></select></label><label className="setting-row">Line height<select value={preferences.lineHeight} onChange={(event) => onPreferencesChange({ lineHeight: event.target.value as ReaderPreferences["lineHeight"] })}><option value="compact">Compact</option><option value="comfortable">Comfortable</option><option value="relaxed">Relaxed</option></select></label><label className="setting-row">Spacing<select value={preferences.letterSpacing} onChange={(event) => onPreferencesChange({ letterSpacing: event.target.value as ReaderPreferences["letterSpacing"] })}><option value="normal">Normal</option><option value="wide">Wide</option></select></label></div>
    <div className="sidebar-section shortcut-section"><span className="sidebar-label">Shortcuts</span><div className="shortcut-list"><div className="shortcut-row"><kbd>Scroll</kbd><span>Continuous reading</span></div><div className="shortcut-row"><kbd>+ / -</kbd><span>Zoom</span></div><div className="shortcut-row"><kbd>Left / Right</kbd><span>Jump page</span></div><div className="shortcut-row"><kbd>0</kbd><span>Reset zoom</span></div></div></div>
  </aside>;
}
