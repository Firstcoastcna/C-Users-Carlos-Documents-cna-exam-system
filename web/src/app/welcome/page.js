"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function WelcomePage() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";

  // If someone lands here without access, bounce to /access (pilot-safe)
  useEffect(() => {
    let granted = false;
    try {
      granted = localStorage.getItem("cna_access_granted") === "1";
    } catch {}
    if (!granted) {
      router.replace(`/access?lang=${lang}`);
    }
  }, [router, lang]);

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

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

// Controls what the footer Continue does
const [showOnContinue, setShowOnContinue] = useState(true);

// Load current preference into the checkbox
useEffect(() => {
  try {
    const v = localStorage.getItem("cna_show_instructions_next_time");
    setShowOnContinue(v !== "0");
  } catch {}
}, []);

  // Optional: reset instructions preference from this screen (simple link-like button)
  function setShowInstructionsNextTime(value) {
    try {
      localStorage.setItem("cna_show_instructions_next_time", value ? "1" : "0");
    } catch {}
  }

  // Default for first-time users: show instructions next time = 1
  useEffect(() => {
    try {
      const v = localStorage.getItem("cna_show_instructions_next_time");
      if (v === null) localStorage.setItem("cna_show_instructions_next_time", "1");
    } catch {}
  }, []);

  return (
    <Frame
      title={t("WELCOME", "BIENVENIDO", "BIENVENUE", "BYENVENI")}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          
          <button
            style={{ ...btnPrimary, width: "220px" }}
            onClick={() => {
              let show = true;
              try {
                show = localStorage.getItem("cna_show_instructions_next_time") !== "0";
              } catch {}

              router.push(show ? `/instructions?lang=${lang}` : `/pilot?lang=${lang}`);
            }}
          >
            {t("Continue", "Continuar", "Continuer", "Kontinye")}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "720px", margin: "0 auto", paddingTop: "30px" }}>
        <div style={{ fontSize: "22px", fontWeight: "bold", marginBottom: "10px" }}>
          {t(
  "Welcome to your CNA Exam Practice Platform",
  "Bienvenido a su plataforma de práctica del examen CNA",
  "Bienvenue sur votre plateforme de pratique de l’examen CNA",
  "Byenveni sou platfòm pratik egzamen CNA ou a"
)}
        </div>

        <div style={{ color: "#333", lineHeight: "1.6", marginBottom: "16px" }}>
          {t(
  "This platform is designed to help you practice taking CNA exams in a format similar to the real test.",
  "Esta plataforma está diseñada para ayudarle a practicar exámenes CNA en un formato similar al examen real.",
  "Cette plateforme est conçue pour vous aider à vous entraîner aux examens CNA dans un format similaire au test réel.",
  "Platfòm sa a fèt pou ede w pratike egzamen CNA nan yon fòma ki sanble ak tès reyèl la."
)}

        </div>

        <div style={{ marginTop: "10px", padding: "12px", border: `1px solid ${theme.chromeBorder}`, borderRadius: "10px", background: "#fafcff" }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
            {t("Preferences", "Preferencias", "Préférences", "Preferans")}

          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
  <input
    type="checkbox"
    checked={!showOnContinue}
    onChange={(e) => {
  const skip = e.target.checked; // checked = skip instructions
  setShowOnContinue(!skip);
  try {
    localStorage.setItem(
      "cna_show_instructions_next_time",
      skip ? "0" : "1"
    );
  } catch {}
}}

  />
  <span style={{ color: "#333" }}>
    {t(
  "Skip instructions and go directly to the Pilot Hub",
  "Omitir las instrucciones e ir directamente al Piloto",
  "Ignorer les instructions et aller directement au hub pilote",
  "Sote enstriksyon yo epi ale dirèkteman nan Pilot la"
)}

  </span>
</label>


          <div style={{ marginTop: "10px", fontSize: "12px", color: "#666" }}>
  {t(
  "By default, instructions are shown. Check this box if you want to skip them.",
  "Por defecto, se muestran las instrucciones. Marque esta casilla para omitirlas.",
  "Par défaut, les instructions sont affichées. Cochez cette case pour les ignorer.",
  "Pa default, enstriksyon yo parèt. Tcheke bwat sa a pou sote yo."
)}

</div>

        </div>
      </div>
    </Frame>
  );
}
