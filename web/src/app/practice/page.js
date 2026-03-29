"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Frame({ title, subtitle, children, footer, theme, headerAction }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px" }}>
      <div
        style={{
          border: `2px solid ${theme.frameBorder}`,
          borderRadius: "16px",
          overflow: "hidden",
          background: "white",
          boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
        }}
      >
        <div
          style={{
            padding: "18px 20px 16px",
            background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
            borderBottom: `1px solid ${theme.chromeBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "flex-start",
              flexWrap: "nowrap",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--heading)", marginBottom: 4 }}>
              {title}
            </div>
            {headerAction ? <div>{headerAction}</div> : null}
          </div>
          <div style={{ color: "var(--brand-teal-dark)", lineHeight: 1.6, maxWidth: 760 }}>{subtitle}</div>
        </div>

        <div style={{ padding: "20px" }}>{children}</div>

        <div
          style={{
            padding: "14px 20px",
            background: "var(--surface-soft)",
            borderTop: `1px solid ${theme.chromeBorder}`,
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, body, action, theme, tone = "default" }) {
  const tones = {
    default: {
      background: "#fbfdff",
      border: "var(--frame-border)",
      title: "var(--heading)",
      body: "#4d6174",
    },
    accent: {
      background: "var(--brand-teal-soft)",
      border: "var(--frame-border)",
      title: "var(--heading)",
      body: "#445f78",
    },
    muted: {
      background: "var(--surface-soft)",
      border: "var(--chrome-border)",
      title: "#314556",
      body: "#5c6d7d",
    },
  };

  const palette = tones[tone] || tones.default;

  return (
    <div
      style={{
        padding: "16px",
        border: `1px solid ${palette.border}`,
        borderRadius: "14px",
        background: palette.background,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 16, color: palette.title, marginBottom: 6 }}>{title}</div>
      <div style={{ color: palette.body, lineHeight: 1.6 }}>{body}</div>
      {action ? <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>{action}</div> : null}
    </div>
  );
}

function ModeCard({ label, description, active, onClick, theme }) {
  return (
    <button
      onClick={onClick}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "16px",
        borderRadius: "16px",
        border: active ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
        background: active ? "var(--surface-tint)" : "white",
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: 124,
        boxShadow: active ? "0 8px 18px rgba(37, 131, 166, 0.10)" : "none",
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 800, color: "var(--heading)", lineHeight: 1.25 }}>{label}</div>
      <div style={{ color: "#66788a", lineHeight: 1.5 }}>{description}</div>
    </button>
  );
}

function PracticeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const [isNarrow, setIsNarrow] = useState(false);
  const [mode, setMode] = useState("chapter");
  const [count, setCount] = useState(10);

  useEffect(() => {
    let granted = false;
    try {
      granted = localStorage.getItem("cna_access_granted") === "1";
    } catch {}
    if (!granted) {
      router.replace(`/access?lang=${lang}`);
      return;
    }
    try {
      localStorage.setItem("cna_pilot_lang", lang);
    } catch {}
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
      chromeBorder: "var(--chrome-border)",
      primaryBg: "var(--brand-teal)",
      primaryText: "#ffffff",
      secondaryBg: "var(--brand-teal-soft)",
      secondaryText: "var(--brand-teal-dark)",
      buttonBorder: "var(--button-border)",
    }),
    []
  );

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  const TEXT = {
    title: t("CNA Practice Hub", "Centro de Practica CNA", "Hub de pratique CNA", "Hub Pratik CNA"),
    subtitle: t(
      "Choose how you want to practice. Practice is untimed, uses shorter guided sessions, and is designed to build understanding and confidence.",
      "Elija como desea practicar. La practica no tiene limite de tiempo, utiliza sesiones guiadas mas cortas y esta disenada para fortalecer la comprension y la confianza.",
      "Choisissez la facon dont vous souhaitez pratiquer. La pratique n'est pas chronometree, utilise des sessions guidees plus courtes et vise a renforcer la comprehension et la confiance.",
      "Chwazi kijan ou vle pratike. Pratik la pa gen limit tan, li itilize sesyon gide ki pi kout, epi li fet pou bati konpreyansyon ak konfyans."
    ),
    backToWelcome: t("Back to Welcome", "Volver a la bienvenida", "Retour a l'accueil", "Retounen nan byenvini"),
    modesTitle: t("Choose a practice mode", "Elija un modo de practica", "Choisissez un mode de pratique", "Chwazi yon mòd pratik"),
    countTitle: t("Choose a session size", "Elija el tamano de la sesion", "Choisissez la taille de la session", "Chwazi kantite kestyon yo"),
    modeChapter: t("Practice by Chapter", "Practica por capitulo", "Pratique par chapitre", "Pratik pa Chapit"),
    modeCategory: t("Practice by Category", "Practica por categoria", "Pratique par categorie", "Pratik pa Kategori"),
    modeMixed: t("Mixed Practice", "Practica mixta", "Pratique mixte", "Pratik Melanje"),
    chapterDesc: t(
      "Focus on one chapter at a time for topic-based review.",
      "Concentrese en un capitulo a la vez para un repaso por tema.",
      "Concentrez-vous sur un seul chapitre a la fois pour une revision par theme.",
      "Konsantre sou yon chapit a la fwa pou yon revizyon pa sijè."
    ),
    categoryDesc: t(
      "Focus on one decision category at a time to strengthen CNA logic and judgment.",
      "Concentrese en una sola categoria de decision para fortalecer la logica y el juicio CNA.",
      "Concentrez-vous sur une seule categorie de decision afin de renforcer la logique et le jugement CNA.",
      "Konsantre sou yon sèl kategori desizyon pou ranfose lojik ak jijman CNA."
    ),
    mixedDesc: t(
      "Practice a broader mix of questions without full-exam pressure.",
      "Practique una mezcla mas amplia de preguntas sin la presion de un examen completo.",
      "Pratiquez un melange plus large de questions sans la pression d'un examen complet.",
      "Pratike yon melanj kestyon ki pi laj san presyon yon egzamen konple."
    ),
    studySupportTitle: t(
      "Study support",
      "Apoyo de estudio",
      "Soutien d'etude",
      "Sipò pou etid"
    ),
    chapterReviewTitle: t(
      "Chapter Study Support",
      "Apoyo de estudio por capitulos",
      "Soutien d'etude par chapitres",
      "Sipo etid pa chapit"
    ),
    chapterReviewText: t(
      "Open the chapter guide for a quick review of the main ideas before or between practice sessions.",
      "Abra la guia de capitulos para un repaso rapido de las ideas principales antes o entre sesiones de practica.",
      "Ouvrez le guide des chapitres pour une revision rapide des idees principales avant ou entre les sessions de pratique.",
      "Louvri gid chapit la pou yon revizyon rapid sou ide prensipal yo anvan oswa ant sesyon pratik yo."
    ),
    chapterReviewButton: t(
      "Open Chapter Study Support",
      "Abrir apoyo de estudio por capitulos",
      "Ouvrir le soutien d'etude par chapitres",
      "Louvri sipo etid pa chapit"
    ),
    categoryReviewTitle: t(
      "Category Study Support",
      "Apoyo de estudio por categorias",
      "Soutien d'etude par categories",
      "Sipo etid pa kategori"
    ),
    categoryReviewText: t(
      "Open the category guide to understand the 9 decision categories used to measure CNA logic and judgment.",
      "Abra la guia de categorias para comprender las 9 categorias de decision que se utilizan para evaluar la logica y el juicio CNA.",
      "Ouvrez le guide des categories pour comprendre les 9 categories de decision utilisees pour evaluer la logique et le jugement CNA.",
      "Louvri gid kategori a pou konprann 9 kategori desizyon yo itilize pou evalye lojik ak jijman CNA."
    ),
    categoryReviewButton: t(
      "Open Category Study Support",
      "Abrir apoyo de estudio por categorias",
      "Ouvrir le soutien d'etude par categories",
      "Louvri sipo etid pa kategori"
    ),
    nextStepTitle: t("Next step", "Proximo paso", "Prochaine etape", "Pwochen etap"),
    nextStepBody: t(
      "The guided practice player is the next build step. For now, this hub defines the learning paths and session structure the practice side will use.",
      "El lector de practica guiada sera el siguiente paso de desarrollo. Por ahora, este centro define las rutas de aprendizaje y la estructura de sesiones que usara la parte de practica.",
      "Le lecteur de pratique guidee sera la prochaine etape de developpement. Pour l'instant, ce hub definit les parcours d'apprentissage et la structure des sessions utilisees par la partie pratique.",
      "Jwè pratik gide a pral pwochen etap devlopman an. Pou kounye a, hub sa a defini chemen aprantisaj yo ak estrikti sesyon yo pati pratik la pral itilize."
    ),
    currentSelection: t("Current setup", "Configuracion actual", "Configuration actuelle", "Konfigirasyon aktyel"),
    selectionText: t(
      `Mode selected: ${mode}. Session size: ${count} questions.`,
      `Modo seleccionado: ${mode}. Tamano de la sesion: ${count} preguntas.`,
      `Mode choisi : ${mode}. Taille de la session : ${count} questions.`,
      `Mòd ou chwazi a: ${mode}. Kantite kestyon nan sesyon an: ${count}.`
    ),
  };

  const countOptions = [5, 10, 15];

  const selectedModeLabel =
    mode === "chapter" ? TEXT.modeChapter : mode === "category" ? TEXT.modeCategory : TEXT.modeMixed;

  const btnPrimary = {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: `1px solid ${theme.primaryBg}`,
    background: theme.primaryBg,
    color: theme.primaryText,
    cursor: "pointer",
    width: "100%",
  };

  const btnSecondary = {
    padding: "9px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: `1px solid ${theme.buttonBorder}`,
    background: theme.secondaryBg,
    color: theme.secondaryText,
    cursor: "pointer",
  };

  return (
    <Frame
      title={TEXT.title}
      subtitle={TEXT.subtitle}
      theme={theme}
      headerAction={
        <button
          onClick={() => router.push(`/practice-welcome?lang=${lang}`)}
          style={{
            padding: "9px 12px",
            fontSize: "14px",
            borderRadius: "10px",
            border: `1px solid ${theme.buttonBorder}`,
            background: theme.secondaryBg,
            color: theme.secondaryText,
            cursor: "pointer",
          }}
        >
          {TEXT.backToWelcome}
        </button>
      }
      footer={<div />}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <SectionCard
          theme={theme}
          tone="accent"
          title={TEXT.studySupportTitle}
          body={
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isNarrow ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <SectionCard
                theme={theme}
                tone="default"
                title={TEXT.chapterReviewTitle}
                body={TEXT.chapterReviewText}
                action={
                  <button
                    style={{ ...btnSecondary, width: isNarrow ? "100%" : "220px" }}
                    onClick={() => router.push(`/chapters?lang=${lang}&src=practice`)}
                  >
                    {TEXT.chapterReviewButton}
                  </button>
                }
              />
              <SectionCard
                theme={theme}
                tone="default"
                title={TEXT.categoryReviewTitle}
                body={TEXT.categoryReviewText}
                action={
                  <button
                    style={{ ...btnSecondary, width: isNarrow ? "100%" : "220px" }}
                    onClick={() => router.push(`/categories?lang=${lang}&src=practice`)}
                  >
                    {TEXT.categoryReviewButton}
                  </button>
                }
              />
            </div>
          }
        />

        <SectionCard theme={theme} tone="accent" title={TEXT.modesTitle} body={TEXT.subtitle} />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "minmax(0, 1fr)" : "repeat(3, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          <ModeCard
            label={TEXT.modeChapter}
            description={TEXT.chapterDesc}
            active={mode === "chapter"}
            onClick={() => setMode("chapter")}
            theme={theme}
          />
          <ModeCard
            label={TEXT.modeCategory}
            description={TEXT.categoryDesc}
            active={mode === "category"}
            onClick={() => setMode("category")}
            theme={theme}
          />
          <ModeCard
            label={TEXT.modeMixed}
            description={TEXT.mixedDesc}
            active={mode === "mixed"}
            onClick={() => setMode("mixed")}
            theme={theme}
          />
        </div>

        <SectionCard
          theme={theme}
          title={TEXT.countTitle}
          body={
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              {countOptions.map((n) => (
                <button
                  key={n}
                  onClick={() => setCount(n)}
                  style={{
                    ...btnSecondary,
                    minWidth: 78,
                    fontWeight: 700,
                    background: count === n ? "white" : theme.secondaryBg,
                    border: count === n ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                    boxShadow: count === n ? "0 6px 14px rgba(37, 131, 166, 0.10)" : "none",
                  }}
                >
                  {n}
                </button>
              ))}
            </div>
          }
        />

        <SectionCard
          theme={theme}
          tone="muted"
          title={TEXT.currentSelection}
          body={t(
            `Mode selected: ${selectedModeLabel}. Session size: ${count} questions.`,
            `Modo seleccionado: ${selectedModeLabel}. Tamano de la sesion: ${count} preguntas.`,
            `Mode choisi : ${selectedModeLabel}. Taille de la session : ${count} questions.`,
            `Mòd ou chwazi a: ${selectedModeLabel}. Kantite kestyon nan sesyon an: ${count}.`
          )}
        />

        <SectionCard theme={theme} title={TEXT.nextStepTitle} body={TEXT.nextStepBody} action={<button style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px", opacity: 0.7, cursor: "default" }}>{t("Practice Player Next", "Siguiente paso de practica", "Lecteur de pratique ensuite", "Pwochen etap pratik la")}</button>} />
      </div>
    </Frame>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <PracticeInner />
    </Suspense>
  );
}
