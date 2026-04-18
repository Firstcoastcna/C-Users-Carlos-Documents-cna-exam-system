"use client";

import { useEffect } from "react";

export function useDisableBrowserNavigation() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const lockedUrl = `${window.location.pathname}${window.location.search}${window.location.hash}`;
    const startSentinel = { cnaNavLocked: "start", url: lockedUrl };
    const endSentinel = { cnaNavLocked: "end", url: lockedUrl };

    window.history.replaceState(startSentinel, "", lockedUrl);
    window.history.pushState(endSentinel, "", lockedUrl);

    function handlePopState(event) {
      if (event.state?.cnaNavLocked === "start") {
        window.history.go(1);
        return;
      }

      window.history.replaceState(startSentinel, "", lockedUrl);
      window.history.pushState(endSentinel, "", lockedUrl);
    }

    window.addEventListener("popstate", handlePopState);
    return () => window.removeEventListener("popstate", handlePopState);
  }, []);
}
