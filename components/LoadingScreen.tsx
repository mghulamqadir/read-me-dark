"use client";

import { useEffect, useRef } from "react";
import styles from "./LoadingScreen.module.css";

export type LoadingScreenTheme = "dark" | "soft-dark" | "midnight" | "oled" | "sepia" | "light";

type LoadingScreenProps = {
  visible: boolean;
  theme?: LoadingScreenTheme;
};

export function LoadingScreen({ visible, theme = "midnight" }: LoadingScreenProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => {
      if (!videoRef.current) return;
      if (mq.matches) videoRef.current.pause();
      else if (visible) videoRef.current.play().catch(() => { });
    };
    apply();
    mq.addEventListener("change", apply);
    return () => mq.removeEventListener("change", apply);
  }, [visible]);

  return (
    <div
      className={styles.loader}
      data-visible={visible}
      data-theme={theme}
      aria-hidden={!visible}
      role="status"
    >
      <span className={styles.srOnly}>Loading Read Me Dark</span>
      <video
        ref={videoRef}
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
