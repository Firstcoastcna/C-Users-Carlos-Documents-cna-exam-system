"use client";

import { useEffect } from "react";
import { getStudentSessionSnapshot, redirectRecoveryFlowIfPresent, redirectToSignIn } from "./browserAuth";

export function useProtectedPlatformPage() {
  useEffect(() => {
    let cancelled = false;

    if (redirectRecoveryFlowIfPresent()) {
      return;
    }

    async function verifySession() {
      if (redirectRecoveryFlowIfPresent()) return;
      const session = await getStudentSessionSnapshot().catch(() => null);
      if (!session?.access_token && !cancelled) {
        redirectToSignIn();
      }
    }

    function handlePageShow() {
      void verifySession();
    }

    function handleVisibilityChange() {
      if (document.visibilityState === "visible") {
        void verifySession();
      }
    }

    void verifySession();
    window.addEventListener("pageshow", handlePageShow);
    document.addEventListener("visibilitychange", handleVisibilityChange);

    return () => {
      cancelled = true;
      window.removeEventListener("pageshow", handlePageShow);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);
}
