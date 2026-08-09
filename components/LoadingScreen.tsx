"use client";

import styles from "./LoadingScreen.module.css";

export type LoadingScreenTheme = "dark" | "soft-dark" | "midnight" | "oled" | "sepia" | "light";

type LoadingScreenProps = {
  visible: boolean;
  theme?: LoadingScreenTheme;
};

export function LoadingScreen({ visible, theme = "midnight" }: LoadingScreenProps) {
  return (
    <div
      className={styles.loader}
      data-visible={visible}
      data-theme={theme}
      aria-hidden={!visible}
      aria-live="polite"
      role="status"
    >
      <span className={styles.srOnly}>Loading Read Me Dark</span>
      <video
        className={styles.video}
        aria-hidden="true"
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
      >
        <source src="/loaders/read-me-dark-rmd-loader.mp4" type="video/mp4" />
      </video>
    </div>
  );
}

export default LoadingScreen;
