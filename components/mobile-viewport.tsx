"use client";
import { useEffect } from "react";
/** Some Android in-app browsers expose a 980px desktop layout on a phone.
 * Normalize that layout without disabling the user's pinch zoom. */
export function MobileViewport() {
  useEffect(() => {
    const root = document.documentElement;
    const update = () => {
      const deviceWidth = window.screen.width;
      const layoutWidth = root.clientWidth;
      const compact = navigator.maxTouchPoints > 0 && deviceWidth > 0 && deviceWidth <= 600;
      root.classList.toggle("rb-phone", compact);
      const scale = compact && layoutWidth > 700 ? layoutWidth / deviceWidth : 1;
      root.style.setProperty("--rb-display-scale", String(scale));
    };
    update();
    window.addEventListener("resize", update);
    window.addEventListener("orientationchange", update);
    return () => {
      window.removeEventListener("resize", update);
      window.removeEventListener("orientationchange", update);
      root.classList.remove("rb-phone");
      root.style.removeProperty("--rb-display-scale");
    };
  }, []);
  return null;
}
