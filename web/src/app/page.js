"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const forceLang = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("force_lang") === "1";


  // UI state
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);
  const [isNarrow, setIsNarrow] = useState(false);

  // Resume detection
  const [resumeInfo, setResumeInfo] = useState(null);

  useEffect(() => {
    function handleResize() {
      setIsNarrow(window.innerWidth <= 700);
    }

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Styling aligned with your current look
  const theme = useMemo(
    () => ({
      frameBorder: "var(--frame-border)",
      chromeBg: "var(--chrome-bg)",
      chromeBorder: "var(--chrome-border)",
      primaryBg: "var(--brand-teal)",
      primaryText: "white",
      secondaryBg: "var(--brand-teal-soft)",
      secondaryText: "var(--brand-teal-dark)",
      buttonBorder: "var(--button-border)",
    }),
    []
  );

  const btnBase = {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: `1px solid ${theme.buttonBorder}`,
    cursor: "pointer",
  };

  const btnPrimary = {
    ...btnBase,
    background: theme.primaryBg,
    color: theme.primaryText,
    border: `1px solid ${theme.primaryBg}`,
    width: "100%",
  };

  const btnSecondary = {
    ...btnBase,
    background: theme.secondaryBg,
    color: theme.secondaryText,
    width: "100%",
  };

  function langButtonStyle(code) {
    const active = lang === code;
    return {
      ...btnSecondary,
      padding: isNarrow ? "14px" : "16px",
      fontSize: isNarrow ? "16px" : "18px",
      fontWeight: 700,
      borderRadius: "14px",
      background: active ? "white" : theme.secondaryBg,
      color: active ? "var(--brand-teal-dark)" : theme.secondaryText,
      border: active ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
      boxShadow: active ? "0 8px 18px rgba(37, 131, 166, 0.10)" : "none",
      transform: active ? "translateY(-1px)" : "none",
    };
  }

  // Detect any saved in-progress exam state (any lang)
  useEffect(() => {
    try {
      const keys = Object.keys(localStorage);
      const candidates = [];

      for (const k of keys) {
        if (!k.startsWith("cna_exam_state::")) continue;

        const raw = localStorage.getItem(k);
        if (!raw) continue;

        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          continue;
        }

        if (!parsed || typeof parsed !== "object") continue;

        // We only consider in-progress exams
        const mode = parsed.mode;
        if (mode === "finished" || mode === "time_expired") continue;

        const savedLang = parsed.lang;
        if (!savedLang) continue;

        const pausedRemainingSec =
  typeof parsed.pausedRemainingSec === "number" ? parsed.pausedRemainingSec : null;

const endAtMs = typeof parsed.endAtMs === "number" ? parsed.endAtMs : null;
const remainingMs = endAtMs ? endAtMs - Date.now() : null;

// If pausedRemainingSec exists, it is resumable even if endAtMs is in the past
if (pausedRemainingSec === null) {
  if (remainingMs !== null && remainingMs <= 0) continue;
}


        candidates.push({
          key: k,
          lang: savedLang,
          exam_form_id: parsed.exam_form_id || "",
          endAtMs: endAtMs || 0,
        });
      }

      // Pick the most recently updated / latest endAtMs (good enough for now)
      candidates.sort((a, b) => (b.endAtMs || 0) - (a.endAtMs || 0));

      if (candidates.length > 0) {
        setResumeInfo(candidates[0]);
      } else {
        setResumeInfo(null);
      }
    } catch {
      setResumeInfo(null);
    } finally {
      setLoading(false);
    }
  }, []);

  function langLabel(l) {
    if (l === "en") return "English";
    if (l === "es") return "Spanish";
    if (l === "fr") return "English + French";
    if (l === "ht") return "English + Haitian Creole";
    return l;
  }

  // Layout shell (Prometric-like frame)
  function Frame({ title, children, footer }) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            minHeight: "675px",
            border: `2px solid ${theme.frameBorder}`,
            borderRadius: "16px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "white",
            boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${theme.chromeBorder}`,
              padding: "18px 20px",
              background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
              fontWeight: 800,
              textTransform: "uppercase",
              letterSpacing: "0.04em",
              color: "var(--heading)",
              fontSize: "20px",
            }}
          >
            {title}
          </div>

          <div style={{ flex: 1, padding: isNarrow ? "18px" : "24px" }}>{children}</div>

          <div
            style={{
              borderTop: `1px solid ${theme.chromeBorder}`,
              padding: "16px 20px",
              background: "var(--surface-soft)",
            }}
          >
            {footer}
          </div>
        </div>
      </div>
    );
  }

  // Loading state (prevents hydration weirdness)
  if (loading) {
    return (
      <Frame
        title="WELCOME"
        footer={<div style={{ fontSize: "12px", color: "#555" }}>LoadingÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦</div>}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          LoadingÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¾Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€šÃ‚Â¦ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬ÃƒÂ¢Ã¢â‚¬Å¾Ã‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã‚Â¦ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã¢â‚¬Â ÃƒÂ¢Ã¢â€šÂ¬Ã¢â€žÂ¢ÃƒÆ’Ã†â€™Ãƒâ€šÃ‚Â¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡Ãƒâ€šÃ‚Â¬ÃƒÆ’Ã¢â‚¬Â¦Ãƒâ€šÃ‚Â¡ÃƒÆ’Ã†â€™Ãƒâ€ Ã¢â‚¬â„¢ÃƒÆ’Ã‚Â¢ÃƒÂ¢Ã¢â‚¬Å¡Ã‚Â¬Ãƒâ€¦Ã‚Â¡ÃƒÆ’Ã†â€™ÃƒÂ¢Ã¢â€šÂ¬Ã…Â¡ÃƒÆ’Ã¢â‚¬Å¡Ãƒâ€šÃ‚Â¦
        </div>
      </Frame>
    );
  }

  // ============================
  // RESUME PAGE (NO LANGUAGE)
  // ============================
  if (resumeInfo && !forceLang) {
    return (
      <Frame
        title="RESUME EXAM"
        footer={
          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              style={{ ...btnPrimary, width: "220px" }}
              onClick={() => router.push(`/pilot?lang=${resumeInfo.lang}`)}

            >
              Resume Exam
            </button>
          </div>
        }
      >
        <div
          style={{
            maxWidth: "720px",
            margin: "0 auto",
            textAlign: "center",
            paddingTop: "60px",
          }}
        >
          <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>
            You have an exam in progress.
          </div>

          <div style={{ marginBottom: "10px", color: "#333", lineHeight: "1.6" }}>
            Your progress has been saved. Click <strong>Resume Exam</strong> to continue where you left off.
          </div>

          <div style={{ fontSize: "13px", color: "#555", marginTop: "18px" }}>
            <strong>Language:</strong> {langLabel(resumeInfo.lang)}
          </div>
        </div>
      </Frame>
    );
  }

  // ============================
  // WELCOME PAGE (LANGUAGE PICK)
  // ============================
  return (
    <Frame
      title={
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
          <img
            src={encodeURI("/FCCNA Logo n name.png")}
            alt="First Coast CNA"
            style={{
              width: isNarrow ? "220px" : "240px",
              height: "auto",
              display: "block",
            }}
          />
        </div>
      }
      footer={
        <div style={{ display: "flex", justifyContent: isNarrow ? "stretch" : "flex-end" }}>
          <button
            style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px", fontWeight: 700 }}
            onClick={() => {
  try {
    localStorage.setItem("cna_pilot_lang", lang);
  } catch {}

  let granted = false;
  try {
    granted = localStorage.getItem("cna_access_granted") === "1";
  } catch {}

  router.push(granted ? `/foundation?lang=${lang}` : `/access?lang=${lang}`);
}}


          >
            {lang === "es"
  ? "Comenzar"
  : lang === "fr"
  ? "Commencer"
  : lang === "ht"
  ? "Komanse"
  : "Get Started"}

          </button>
        </div>
      }
    >
      <div
        style={{
          maxWidth: "760px",
          margin: "0 auto",
          display: "grid",
          gap: "20px",
          gridTemplateColumns: isNarrow ? "1fr" : "minmax(0, 1.05fr) minmax(280px, 0.95fr)",
          alignItems: "start",
        }}
      >
  <div
    style={{
      marginTop: "10px",
      border: `1px solid ${theme.chromeBorder}`,
      borderRadius: "18px",
      background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
      padding: isNarrow ? "18px" : "22px",
      boxShadow: "0 10px 24px rgba(31, 52, 74, 0.05)",
    }}
  >
    <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand-teal-dark)", marginBottom: "8px" }}>
      Exam Access
    </div>

    <div style={{ fontSize: isNarrow ? "24px" : "28px", fontWeight: 800, marginBottom: "8px", color: "var(--heading)" }}>
      {lang === "es"
        ? "Seleccione su idioma"
        : lang === "fr"
        ? "Choisissez votre langue"
        : lang === "ht"
        ? "Chwazi lang ou"
        : "Select your language"}
    </div>

    <div style={{ fontSize: "14px", color: "#456173", lineHeight: "1.7", marginBottom: "16px", maxWidth: "520px" }}>
      {lang === "es"
        ? "Elija el idioma para continuar."
        : lang === "fr"
        ? "Choisissez la langue pour continuer."
        : lang === "ht"
        ? "Chwazi lang lan pou kontinye."
        : "Choose the language to continue."}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
  <button
    style={langButtonStyle("en")}
    onClick={() => setLang("en")}
  >
    English
  </button>

  <button
    style={langButtonStyle("es")}
    onClick={() => setLang("es")}
  >
    {"Espa\u00f1ol"}
  </button>

  <button
    style={langButtonStyle("fr")}
    onClick={() => setLang("fr")}
  >
    {"Fran\u00e7ais"}
  </button>

  <button
    style={langButtonStyle("ht")}
    onClick={() => setLang("ht")}
  >
    {"Krey\u00f2l Ayisyen"}
  </button>
</div>

    <div
      style={{
        marginTop: "14px",
        display: "inline-flex",
        alignItems: "center",
        gap: "8px",
        padding: "8px 10px",
        borderRadius: "999px",
        background: "white",
        border: `1px solid ${theme.chromeBorder}`,
        color: "#4b5f71",
        fontSize: "13px",
        fontWeight: 600,
      }}
    >
      <span style={{ color: "var(--brand-teal-dark)" }}>
        {lang === "es"
          ? "Idioma seleccionado:"
          : lang === "fr"
          ? "Langue choisie :"
          : lang === "ht"
          ? "Lang ou chwazi a:"
          : "Selected language:"}
      </span>
      <span>{langLabel(lang)}</span>
    </div>


    <div style={{ fontSize: "14px", color: "var(--brand-red)", marginTop: "12px" }}>
      {lang === "es"
        ? "El idioma no se puede cambiar despu\u00e9s de ingresar a la plataforma."
        : lang === "fr"
        ? "La langue ne peut pas \u00eatre modifi\u00e9e apr\u00e8s l\u2019entr\u00e9e sur la plateforme."
        : lang === "ht"
        ? "Ou pa ka chanje lang lan apre ou antre nan platf\u00f2m nan."
        : "Language cannot be changed after you enter the platform."}
    </div>

  </div>

  <div
    style={{
      border: `1px solid ${theme.chromeBorder}`,
      borderRadius: "18px",
      background: "white",
      padding: isNarrow ? "18px" : "22px",
      boxShadow: "0 10px 24px rgba(31, 52, 74, 0.05)",
    }}
  >
    <div style={{ fontSize: "12px", fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand-red)", marginBottom: "8px" }}>
      Platform
    </div>

    <div style={{ fontSize: isNarrow ? "23px" : "26px", fontWeight: 800, marginBottom: "10px", color: "var(--heading)" }}>
      {lang === "es"
        ? "Plataforma de pr\u00e1ctica del examen CNA"
        : lang === "fr"
        ? "Plateforme de pratique de l\u2019examen CNA"
        : lang === "ht"
        ? "Platf\u00f2m pratik egzamen CNA"
        : "CNA Exam Practice Platform"}
    </div>

    <div style={{ display: "grid", gap: "10px", lineHeight: "1.7", color: "#4c6172", fontSize: "14px", maxWidth: "680px", marginBottom: "14px" }}>
      <div>
        {lang === "es"
          ? "Esta plataforma le ayuda a prepararse para el examen CNA mediante practica guiada y simulaciones completas y realistas de examen."
          : lang === "fr"
          ? "Cette plateforme vous aide a vous preparer a l'examen CNA grace a une pratique guidee et a des simulations completes et realistes d'examen."
          : lang === "ht"
          ? "Platf\u00f2m sa a ede ou prepare pou egzamen CNA a grasa pratik gide ak simulasyon egzamen konpl\u00e8 ki sanble ak t\u00e8s rey\u00e8l."
          : "This platform helps you prepare for the CNA exam through guided practice and realistic full exam simulations."}
      </div>
      <div>
        {lang === "es"
          ? "La practica esta diseniada para fortalecer areas debiles, aumentar la confianza y mejorar la toma de decisiones antes de su proximo examen completo."
          : lang === "fr"
          ? "La pratique est concue pour renforcer les points faibles, developper la confiance et ameliorer la prise de decision avant votre prochain examen complet."
          : lang === "ht"
          ? "Pratik la f\u00e8t pou ranf\u00f2se z\u00f2n ki pi f\u00e8b yo, ogmante konfyans, epi amelyore fason ou pran desizyon anvan pwochen egzamen konpl\u00e8 ou."
          : "Practice is designed to strengthen weak areas, build confidence, and improve decision-making before your next full exam."}
      </div>
      <div>
        {lang === "es"
          ? "Cada examen le ofrece un puntaje y comentarios sobre su rendimiento."
          : lang === "fr"
          ? "Chaque examen vous donne un score et un retour sur vos performances."
          : lang === "ht"
          ? "Chak egzamen ba ou yon n\u00f2t ak fidbak sou fason ou te f\u00e8 a."
          : "Each exam gives you a score and performance feedback."}
      </div>
      <div>
        {lang === "es"
          ? "Despues de cada examen, recibira resultados, analisis y remediacion opcional para guiar sus proximos pasos."
          : lang === "fr"
          ? "Apres chaque examen, vous recevrez des resultats, une analyse et une remediation facultative pour guider la suite."
          : lang === "ht"
          ? "Apre chak egzamen, w ap resevwa rezilta, analiz, ak remedyasyon opsyon\u00e8l pou gide pwochen etap ou yo."
          : "After each exam, you receive results, analytics, and optional remediation to guide your next steps."}
      </div>
    </div>

  </div>
</div>
        </Frame>
  );
}
