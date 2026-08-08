import type { ReaderTheme } from "@/types/reader";
import { themes } from "@/lib/reader";

type ReaderHeaderProps = {
  hasFile: boolean;
  theme: ReaderTheme;
  onThemeChange: (theme: ReaderTheme) => void;
  onOpenFile: () => void;
};

const themeIcons = { midnight: "☾", oled: "●", light: "☀", sepia: "◐", "soft-dark": "◒" };

export function ReaderHeader({ hasFile, theme, onThemeChange, onOpenFile }: ReaderHeaderProps) {
  return (
    <header className="topbar">
      <div className="brand"><div className="brand-mark" aria-hidden="true"><span>RMD</span></div><div className="brand-text"><strong>Read Me Dark</strong><span>PDF Reader</span></div></div>
      <div className="theme-switcher" role="group" aria-label="Reader theme">
        {themes.map((item) => <button key={item.value} className={theme === item.value ? "active" : ""} onClick={() => onThemeChange(item.value)} type="button" aria-pressed={theme === item.value} title={item.label}><span aria-hidden="true">{themeIcons[item.value]}</span><span className="theme-label">{item.label}</span></button>)}
      </div>
      <div className="topbar-right"><button className="upload-btn" type="button" onClick={onOpenFile}>{hasFile ? "Open another PDF" : "Open PDF"}</button></div>
    </header>
  );
}
