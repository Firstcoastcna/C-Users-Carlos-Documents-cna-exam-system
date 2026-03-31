"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Frame({ title, children, footer, theme, headerAction }) {
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
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>{title}</span>
          {headerAction ? <div>{headerAction}</div> : null}
        </div>

        <div style={{ flex: 1, padding: "24px", overflowY: "auto", background: "white" }}>{children}</div>

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

function PathCard({ title, body, onClick, buttonLabel, theme }) {
  return (
    <div
      style={{
        padding: "20px",
        border: `1px solid ${theme.chromeBorder}`,
        borderRadius: "16px",
        background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
        boxShadow: "0 8px 20px rgba(31, 52, 74, 0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--heading)", lineHeight: 1.2 }}>{title}</div>
      <div style={{ color: "#456173", lineHeight: 1.7, fontSize: 14 }}>{body}</div>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onClick}
          style={{
            padding: "10px 14px",
            fontSize: "14px",
            borderRadius: "10px",
            border: `1px solid ${theme.primaryBg}`,
            background: theme.primaryBg,
            color: theme.primaryText,
            cursor: "pointer",
            fontWeight: 700,
            minWidth: 190,
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </div>
  );
}

function StartInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    let granted = false;
    try {
      granted = localStorage.getItem("cna_access_granted") === "1";
    } catch {}
    if (!granted) {
      router.replace(`/access?lang=${lang}`);
    }
  }, [router, lang]);

  useEffect(() => {
    function syncWidth() {
      if (typeof window === "undefined") return;
      setIsNarrow(window.innerWidth < 760);
    }

    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, []);

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

  const btnSecondary = {
    padding: "8px 11px",
    fontSize: "13px",
    fontWeight: 700,
    borderRadius: "10px",
    border: `1px solid ${theme.chromeBorder}`,
    background: "white",
    color: theme.secondaryText,
    cursor: "pointer",
  };

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  return (
    <Frame
      title={t("MAIN MENU", "MENU PRINCIPAL", "MENU PRINCIPAL", "MENI PRENSIPAL")}
      theme={theme}
      headerAction={
        <button style={btnSecondary} onClick={() => router.push("/?force_lang=1")}>
          {t("Change language", "Cambiar idioma", "Changer de langue", "Chanje lang")}
        </button>
      }
      footer={<div />}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto", paddingTop: "8px" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", color: "var(--heading)", lineHeight: 1.2 }}>
          {t(
            "Choose how you want to use the platform",
            "Elija como quiere usar la plataforma",
            "Choisissez comment vous souhaitez utiliser la plateforme",
            "Chwazi kijan ou vle itilize platfom nan"
          )}
        </div>

        <div style={{ color: "#456173", lineHeight: "1.7", marginBottom: "20px", fontSize: 14 }}>
          {t(
            "You can enter the guided Practice side to build understanding and confidence, or the Exam side to experience the full timed CNA test format.",
            "Puede entrar en la parte de Practica guiada para fortalecer la comprension y la confianza, o en la parte de Examen para vivir el formato completo y cronometrado del examen CNA.",
            "Vous pouvez entrer dans la partie Pratique guidee pour renforcer la comprehension et la confiance, ou dans la partie Examen pour vivre le format complet et chronometre du test CNA.",
            "Ou ka antre nan pati Pratik gide a pou bati konpreyansyon ak konfyans, oswa nan pati Egzamen an pou viv fom egzamen CNA a ak tout tan li."
          )}
        </div>

        <div
          style={{
            marginBottom: "20px",
            textAlign: "center",
            color: "#4f6171",
            fontSize: "13px",
            lineHeight: 1.6,
          }}
        >
          <span
            style={{
              display: "inline-block",
              padding: "9px 12px",
              borderRadius: "999px",
              background: "var(--surface-soft)",
              border: `1px solid ${theme.chromeBorder}`,
              fontWeight: 700,
              maxWidth: "100%",
            }}
          >
            {t(
              "Use the small button in the top-right corner if you need to go back or change your language.",
              "Use el boton pequeno en la esquina superior derecha si necesita volver atras o cambiar el idioma.",
              "Utilisez le petit bouton dans le coin superieur droit si vous devez revenir en arriere ou changer de langue.",
              "Svi ak ti bouton ki nan kwen anwo adwat la si ou bezwen tounen oswa chanje lang ou."
            )}
          </span>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
            gap: "16px",
          }}
        >
          <PathCard
            theme={theme}
            title={t("Practice", "Practica", "Pratique", "Pratik")}
            body={t(
              "Use guided practice to work by Chapter, by Category, or in Mixed Practice with shorter untimed sessions, immediate feedback, and explanations.",
              "Use la practica guiada para trabajar por Capitulo, por Categoria o en Practica Mixta con sesiones mas cortas, sin limite de tiempo, con retroalimentacion inmediata y explicaciones.",
              "Utilisez la pratique guidee pour travailler par Chapitre, par Categorie ou en Pratique Mixte avec des sessions plus courtes, sans limite de temps, avec retour immediat et explications.",
              "Svi ak pratik gide pou travay pa Chapit, pa Kategori, oswa nan Pratik Melanje ak sesyon ki pi kout, san limit tan, ak fidbak touswit ansanm ak eksplikasyon."
            )}
            buttonLabel={t("Go to Practice", "Ir a la Practica", "Aller a la pratique", "Ale nan Pratik")}
            onClick={() => router.push(`/practice-welcome?lang=${lang}`)}
          />

          <PathCard
            theme={theme}
            title={t("Exam", "Examen", "Examen", "Egzamen")}
            body={t(
              "Use the exam side for the full timed CNA exam experience, including results, analytics, review questions, and remediation after each completed exam.",
              "Use la parte de examen para vivir la experiencia completa y cronometrada del examen de CNA, con resultados, analisis, revision de preguntas y remediacion despues de completar cada examen.",
              "Utilisez la partie examen pour vivre l'experience complete et chronometree de l'examen CNA, avec resultats, analyse, revision des questions et remediation apres avoir termine chaque examen.",
              "Svi ak pati egzamen an pou viv eksperyans egzamen CNA a ak tout tan li, ansanm ak rezilta, analiz, revizyon kestyon, ak remedyasyon apre ou fin konplete chak egzamen."
            )}
            buttonLabel={t("Go to Exam", "Ir al Examen", "Aller a l'examen", "Ale nan Egzamen")}
            onClick={() => router.push(`/welcome?lang=${lang}`)}
          />
        </div>
      </div>
    </Frame>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <StartInner />
    </Suspense>
  );
}
