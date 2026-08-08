import { formatFileSize } from "@/lib/reader";
import { FileIcon } from "./ReaderIcons";

export function ReaderSidebar({ file, numPages }: { file: File; numPages: number }) {
  return <aside className="sidebar">
    <div className="file-card"><div className="file-icon"><FileIcon /></div><div className="file-info"><strong title={file.name}>{file.name}</strong><span>{formatFileSize(file.size)} · {numPages || "..."} pages</span></div></div>
    <div className="sidebar-section"><span className="sidebar-label">Controls</span><div className="shortcut-list"><div className="shortcut-row"><kbd>Scroll</kbd><span>Continuous reading</span></div><div className="shortcut-row"><kbd>Ctrl + Scroll</kbd><span>Zoom in / out</span></div><div className="shortcut-row"><kbd>Left / Right</kbd><span>Jump page</span></div><div className="shortcut-row"><kbd>Ctrl + 0</kbd><span>Reset zoom</span></div></div></div>
  </aside>;
}
