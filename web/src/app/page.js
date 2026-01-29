"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

export default function HomePage() {
  const router = useRouter();
  const forceLang = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("force_lang") === "1";


  // UI state
  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);

  // Resume detection
  const [resumeInfo, setResumeInfo] = useState(null);

  // Styling aligned with your current look
  const theme = useMemo(
    () => ({
      frameBorder: "#9fb2c7",
      chromeBg: "#e9f0f7",
      chromeBorder: "#b7c6d6",
      primaryBg: "#2b6cb0",
      primaryText: "white",
      secondaryBg: "#f4f6f8",
      secondaryText: "#1a1a1a",
      buttonBorder: "#9aa8b5",
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
            height: "675px",
            border: `2px solid ${theme.frameBorder}`,
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "white",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>

          <div style={{ flex: 1, padding: "18px" }}>{children}</div>

          <div
            style={{
              borderTop: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
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
        footer={<div style={{ fontSize: "12px", color: "#555" }}>Loading…</div>}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%" }}>
          Loading…
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
      title="FIRST COAST CNA"
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end" }}>
          <button
            style={{ ...btnPrimary, width: "220px" }}
            onClick={() => {
  try {
    localStorage.setItem("cna_pilot_lang", lang);
  } catch {}

  let granted = false;
  try {
    granted = localStorage.getItem("cna_access_granted") === "1";
  } catch {}

  router.push(granted ? `/welcome?lang=${lang}` : `/access?lang=${lang}`);
}}


          >
            {lang === "es"
  ? "Entrar a la plataforma"
  : lang === "fr"
  ? "Entrer sur la plateforme"
  : lang === "ht"
  ? "Antre nan platfòm nan"
  : "Enter Platform"}

          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
  <div style={{ maxWidth: "420px", marginTop: "10px" }}>
    <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "8px" }}>
      {lang === "es"
        ? "Seleccione su idioma"
        : lang === "fr"
        ? "Choisissez votre langue"
        : lang === "ht"
        ? "Chwazi lang ou"
        : "Select your language"}
    </div>

    <div style={{ fontSize: "14px", color: "#444", lineHeight: "1.6", marginBottom: "12px" }}>
      {lang === "es"
        ? "Elija el idioma para continuar."
        : lang === "fr"
        ? "Choisissez la langue pour continuer."
        : lang === "ht"
        ? "Chwazi lang lan pou kontinye."
        : "Choose the language to continue."}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
  <button
    style={{
      ...btnSecondary,
      padding: "16px",
      fontSize: "18px",
      fontWeight: 600,
      borderRadius: "14px",
    }}
    onClick={() => setLang("en")}
  >
    English
  </button>

  <button
    style={{
      ...btnSecondary,
      padding: "16px",
      fontSize: "18px",
      fontWeight: 600,
      borderRadius: "14px",
    }}
    onClick={() => setLang("es")}
  >
    Español
  </button>

  <button
    style={{
      ...btnSecondary,
      padding: "16px",
      fontSize: "18px",
      fontWeight: 600,
      borderRadius: "14px",
    }}
    onClick={() => setLang("fr")}
  >
    Français
  </button>

  <button
    style={{
      ...btnSecondary,
      padding: "16px",
      fontSize: "18px",
      fontWeight: 600,
      borderRadius: "14px",
    }}
    onClick={() => setLang("ht")}
  >
    Kreyòl Ayisyen
  </button>
</div>



    <div style={{ fontSize: "14px", color: "#ce0707", marginTop: "10px" }}>
      {lang === "es"
        ? "El idioma no se puede cambiar después de ingresar a la plataforma."
        : lang === "fr"
        ? "La langue ne peut pas être modifiée après l’entrée sur la plateforme."
        : lang === "ht"
        ? "Ou pa ka chanje lang lan apre ou antre nan platfòm nan."
        : "Language cannot be changed after you enter the platform."}
    </div>
  </div>

  <div style={{ marginTop: "22px" }}>
    <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "10px" }}>
      {lang === "es"
        ? "Plataforma de práctica del examen CNA"
        : lang === "fr"
        ? "Plateforme de pratique de l’examen CNA"
        : lang === "ht"
        ? "Platfòm pratik egzamen CNA"
        : "CNA Exam Practice Platform"}
    </div>

    <div style={{ lineHeight: "1.6", color: "#333", marginBottom: "10px" }}>
      {lang === "es"
        ? "Esta plataforma le permite practicar exámenes tipo CNA en un entorno de prueba realista."
        : lang === "fr"
        ? "Cette plateforme vous permet de vous entraîner avec des examens de type CNA dans un environnement réaliste."
        : lang === "ht"
        ? "Platfòm sa a pèmèt ou pratike egzamen CNA nan yon anviwònman ki sanble ak tès reyèl."
        : "This platform allows you to practice taking CNA-style exams in a realistic testing environment."}
    </div>
  </div>
</div>
        </Frame>
  );
}
