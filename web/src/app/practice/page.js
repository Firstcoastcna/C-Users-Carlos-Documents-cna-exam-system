"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadAllPracticeSessions, loadPracticeSession } from "../lib/practiceSessionStorage";

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
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Change in Condition");
  const [activeSession, setActiveSession] = useState(null);
  const [practiceHistory, setPracticeHistory] = useState([]);

  function refreshActiveSession() {
    try {
      const all = loadAllPracticeSessions();
      queueMicrotask(() => {
        setPracticeHistory([...all].sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0)));
      });
      const latestOverall =
        [...all].sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0))[0] || null;
      queueMicrotask(() => {
        if (latestOverall?.status !== "active" || !latestOverall?.session_id) {
          setActiveSession(null);
          return;
        }
        const full = loadPracticeSession(latestOverall.session_id);
        setActiveSession(full || latestOverall);
      });
    } catch {
      queueMicrotask(() => {
        setActiveSession(null);
        setPracticeHistory([]);
      });
    }
  }

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

  useEffect(() => {
    function syncActive() {
      refreshActiveSession();
    }

    function onVisible() {
      if (document.visibilityState === "visible") refreshActiveSession();
    }

    refreshActiveSession();
    window.addEventListener("focus", syncActive);
    window.addEventListener("storage", syncActive);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", syncActive);
      window.removeEventListener("storage", syncActive);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [lang]);

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

  function categoryLabel(cat) {
    return {
      en: {
        "Change in Condition": "Change in Condition",
        "Communication & Emotional Support": "Communication & Emotional Support",
        "Dignity & Resident Rights": "Dignity & Resident Rights",
        "Environment & Safety": "Environment & Safety",
        "Infection Control": "Infection Control",
        "Mobility & Positioning": "Mobility & Positioning",
        "Observation & Safety": "Observation & Safety",
        "Personal Care & Comfort": "Personal Care & Comfort",
        "Scope of Practice & Reporting": "Scope of Practice & Reporting",
      },
      es: {
        "Change in Condition": "Cambio en la condicion",
        "Communication & Emotional Support": "Comunicacion y apoyo emocional",
        "Dignity & Resident Rights": "Dignidad y derechos del residente",
        "Environment & Safety": "Entorno y seguridad",
        "Infection Control": "Control de infecciones",
        "Mobility & Positioning": "Movilidad y posicionamiento",
        "Observation & Safety": "Observacion y seguridad",
        "Personal Care & Comfort": "Cuidado personal y confort",
        "Scope of Practice & Reporting": "Alcance de practica y reporte",
      },
      fr: {
        "Change in Condition": "Changement de l'etat",
        "Communication & Emotional Support": "Communication et soutien emotionnel",
        "Dignity & Resident Rights": "Dignite et droits du resident",
        "Environment & Safety": "Environnement et securite",
        "Infection Control": "Controle des infections",
        "Mobility & Positioning": "Mobilite et positionnement",
        "Observation & Safety": "Observation et securite",
        "Personal Care & Comfort": "Soins personnels et confort",
        "Scope of Practice & Reporting": "Champ de pratique et signalement",
      },
      ht: {
        "Change in Condition": "Chanjman nan kondisyon",
        "Communication & Emotional Support": "Kominikasyon ak sipor emosyonel",
        "Dignity & Resident Rights": "Diyite ak dwa rezidan an",
        "Environment & Safety": "Anviwonman ak sekirite",
        "Infection Control": "Kontwol enfeksyon",
        "Mobility & Positioning": "Mobilite ak pozisyonman",
        "Observation & Safety": "Obsevasyon ak sekirite",
        "Personal Care & Comfort": "Swen pesonel ak konfo",
        "Scope of Practice & Reporting": "Limit pratik ak rapo",
      },
    }[lang]?.[cat] || cat;
  }

  function chapterLabel(chapter) {
    return t(
      `Chapter ${chapter}`,
      `Capitulo ${chapter}`,
      `Chapitre ${chapter}`,
      `Chapit ${chapter}`
    );
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
    chapterTitle: t("Choose one chapter", "Elija un capitulo", "Choisissez un chapitre", "Chwazi yon chapit"),
    categoryTitle: t("Choose one category", "Elija una categoria", "Choisissez une categorie", "Chwazi yon kategori"),
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
    resumeTitle: t("Resume current practice", "Reanudar practica actual", "Reprendre la pratique en cours", "Kontinye pratik aktyel la"),
    resumeBody: t(
      "Pick up where you left off in your last guided practice session.",
      "Retome donde dejo su ultima sesion de practica guiada.",
      "Reprenez la ou vous avez laisse votre derniere session de pratique guidee.",
      "Kontinye dènye sesyon pratik gide ou a kote ou te rete a."
    ),
    resumeProgress: t("Progress", "Progreso", "Progression", "Pwogre"),
    resumeButton: t("Continue Practice", "Continuar practica", "Continuer la pratique", "Kontinye Pratik"),
    progressTitle: t("Practice Progress", "Progreso de practica", "Progression de pratique", "Pwogre Pratik"),
    progressBody: t(
      "Track how much guided practice you have completed on this device.",
      "Vea cuanto trabajo de practica guiada ha completado en este dispositivo.",
      "Suivez la quantite de pratique guidee que vous avez terminee sur cet appareil.",
      "Swiv konbyen pratik gide ou fin konplete sou aparey sa a."
    ),
    progressSessions: t("Sessions completed", "Sesiones completadas", "Sessions terminees", "Sesyon fini"),
    progressQuestions: t("Questions practiced", "Preguntas practicadas", "Questions pratiquees", "Kesyon pratike"),
    progressScore: t("Overall practice score", "Puntuacion general de practica", "Score global de pratique", "Not jeneral pratik"),
    recentSessions: t("Recent practice", "Practica reciente", "Pratique recente", "Pratik resan"),
    noCompletedPractice: t(
      "Completed practice sessions will appear here once you finish them.",
      "Las sesiones de practica completadas apareceran aqui cuando las termine.",
      "Les sessions de pratique terminees apparaitront ici une fois achevees.",
      "Sesyon pratik ou fini yo ap paret isit la le ou fin konplete yo."
    ),
    currentSelection: t("Current setup", "Configuracion actual", "Configuration actuelle", "Konfigirasyon aktyel"),
    startPractice: t("Start Practice", "Comenzar practica", "Commencer la pratique", "Kòmanse pratik"),
  };

  const countOptions = [5, 10, 15];
  const chapterOptions = [1, 2, 3, 4, 5];
  const categoryOptions = [
    "Change in Condition",
    "Communication & Emotional Support",
    "Dignity & Resident Rights",
    "Environment & Safety",
    "Infection Control",
    "Mobility & Positioning",
    "Observation & Safety",
    "Personal Care & Comfort",
    "Scope of Practice & Reporting",
  ];

  const selectedModeLabel =
    mode === "chapter" ? TEXT.modeChapter : mode === "category" ? TEXT.modeCategory : TEXT.modeMixed;
  const selectedTargetLabel =
    mode === "chapter"
      ? chapterLabel(selectedChapter)
      : mode === "category"
        ? categoryLabel(selectedCategory)
        : null;

  const activeSessionTargetLabel =
    activeSession?.mode === "chapter"
      ? chapterLabel(activeSession.selectedChapter)
      : activeSession?.mode === "category"
        ? categoryLabel(activeSession.selectedCategory)
        : TEXT.modeMixed;

  const activeSessionModeLabel =
    activeSession?.mode === "chapter"
      ? TEXT.modeChapter
      : activeSession?.mode === "category"
        ? TEXT.modeCategory
        : TEXT.modeMixed;

  const activeAnsweredCount = Object.values(activeSession?.answers || {}).filter((entry) => entry?.submitted).length;
  const activeQuestionCount = Number(activeSession?.questionIds?.length || 0);

  const activeSessionSummary =
    activeSession?.mode === "mixed"
      ? t(
          `${activeQuestionCount} questions · Mixed Practice`,
          `${activeQuestionCount} preguntas · Practica mixta`,
          `${activeQuestionCount} questions · Pratique mixte`,
          `${activeQuestionCount} kestyon · Pratik melanje`
        )
      : `${activeQuestionCount} ${t("questions", "preguntas", "questions", "kesyon")} · ${activeSessionModeLabel} · ${activeSessionTargetLabel}`;

  function sessionTargetLabel(sessionLike) {
    if (sessionLike?.mode === "chapter") return chapterLabel(sessionLike.selectedChapter);
    if (sessionLike?.mode === "category") return categoryLabel(sessionLike.selectedCategory);
    return TEXT.modeMixed;
  }

  function sessionModeLabel(sessionLike) {
    if (sessionLike?.mode === "chapter") return TEXT.modeChapter;
    if (sessionLike?.mode === "category") return TEXT.modeCategory;
    return TEXT.modeMixed;
  }

  const completedSessions = practiceHistory.filter((item) => item?.status === "completed");
  const totalCompletedSessions = completedSessions.length;
  const totalPracticedQuestions = completedSessions.reduce((sum, item) => sum + Number(item?.submitted_total || item?.questionIds?.length || 0), 0);
  const totalCorrectQuestions = completedSessions.reduce((sum, item) => sum + Number(item?.submitted_correct || 0), 0);
  const recentCompletedSessions = completedSessions.slice(0, 4);

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

  function startPractice() {
    const base = `/practice-session?lang=${lang}&mode=${encodeURIComponent(mode)}&count=${encodeURIComponent(count)}`;
    if (mode === "chapter") {
      router.push(`${base}&chapter=${encodeURIComponent(selectedChapter)}`);
      return;
    }
    if (mode === "category") {
      router.push(`${base}&category=${encodeURIComponent(selectedCategory)}`);
      return;
    }
    router.push(base);
  }

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

        <SectionCard
          theme={theme}
          tone="default"
          title={TEXT.progressTitle}
          body={
            <div style={{ display: "grid", gap: 14 }}>
              <div>{TEXT.progressBody}</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 12, background: "var(--surface-soft)", padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.progressSessions}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--heading)" }}>{totalCompletedSessions}</div>
                </div>
                <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 12, background: "var(--surface-soft)", padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.progressQuestions}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--heading)" }}>{totalPracticedQuestions}</div>
                </div>
                <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 12, background: "var(--surface-soft)", padding: 14 }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.progressScore}</div>
                  <div style={{ fontSize: 24, fontWeight: 800, color: "var(--heading)" }}>{totalCorrectQuestions} / {totalPracticedQuestions}</div>
                </div>
              </div>
              <div style={{ display: "grid", gap: 8 }}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>{TEXT.recentSessions}</div>
                {recentCompletedSessions.length ? (
                  recentCompletedSessions.map((item) => (
                    <div
                      key={item.session_id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        gap: 12,
                        flexWrap: "wrap",
                        padding: "12px 14px",
                        border: "1px solid var(--chrome-border)",
                        borderRadius: 12,
                        background: "white",
                      }}
                    >
                      <div style={{ color: "var(--heading)", fontWeight: 700 }}>
                        {sessionModeLabel(item)} · {sessionTargetLabel(item)}
                      </div>
                      <div style={{ color: "#5c6d7d" }}>
                        {Number(item?.submitted_total || item?.questionIds?.length || 0)} {t("questions", "preguntas", "questions", "kesyon")} · {Number(item?.submitted_correct || 0)} / {Number(item?.submitted_total || item?.questionIds?.length || 0)} {t("correct", "correctas", "correctes", "korek")}
                      </div>
                    </div>
                  ))
                ) : (
                  <div style={{ color: "#5c6d7d" }}>{TEXT.noCompletedPractice}</div>
                )}
              </div>
            </div>
          }
        />

        <SectionCard theme={theme} tone="accent" title={TEXT.modesTitle} body={TEXT.subtitle} />

        {activeSession ? (
          <SectionCard
            theme={theme}
            tone="muted"
            title={TEXT.resumeTitle}
            body={
              <div style={{ display: "grid", gap: 6 }}>
                <div>{TEXT.resumeBody}</div>
                <div style={{ fontWeight: 700, color: "var(--heading)" }}>
                  {activeSessionSummary}
                </div>
                <div style={{ color: "#5c6d7d", fontSize: 14 }}>
                  {TEXT.resumeProgress}: {activeAnsweredCount} {t("of", "de", "sur", "sou")} {activeQuestionCount} {t("questions completed", "preguntas completadas", "questions completees", "kesyon fini")}
                </div>
              </div>
            }
            action={
              <button
                style={{ ...btnSecondary, width: isNarrow ? "100%" : "220px" }}
                onClick={() => router.push(`/practice-session?lang=${lang}&session_id=${activeSession.session_id}`)}
              >
                {TEXT.resumeButton}
              </button>
            }
          />
        ) : null}

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

        {mode === "chapter" ? (
          <SectionCard
            theme={theme}
            title={TEXT.chapterTitle}
            body={
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {chapterOptions.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedChapter(n)}
                    style={{
                      ...btnSecondary,
                      minWidth: 110,
                      fontWeight: 700,
                      background: selectedChapter === n ? "white" : theme.secondaryBg,
                      border: selectedChapter === n ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                    }}
                  >
                    {t(`Chapter ${n}`, `Capitulo ${n}`, `Chapitre ${n}`, `Chapit ${n}`)}
                  </button>
                ))}
              </div>
            }
          />
        ) : null}

        {mode === "category" ? (
          <SectionCard
            theme={theme}
            title={TEXT.categoryTitle}
            body={
              <div style={{ display: "grid", gap: 10 }}>
                {categoryOptions.map((cat) => (
                  <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    style={{
                      ...btnSecondary,
                      width: "100%",
                      textAlign: "left",
                      fontWeight: 700,
                      background: selectedCategory === cat ? "white" : theme.secondaryBg,
                      border: selectedCategory === cat ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                    }}
                  >
                    {categoryLabel(cat)}
                  </button>
                ))}
              </div>
            }
          />
        ) : null}

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
            `Mode selected: ${selectedModeLabel}${selectedTargetLabel ? `. Focus: ${selectedTargetLabel}` : ""}. Session size: ${count} questions.`,
            `Modo seleccionado: ${selectedModeLabel}${selectedTargetLabel ? `. Enfoque: ${selectedTargetLabel}` : ""}. Tamano de la sesion: ${count} preguntas.`,
            `Mode choisi : ${selectedModeLabel}${selectedTargetLabel ? `. Cible : ${selectedTargetLabel}` : ""}. Taille de la session : ${count} questions.`,
            `Mòd ou chwazi a: ${selectedModeLabel}${selectedTargetLabel ? `. Fokis: ${selectedTargetLabel}` : ""}. Kantite kestyon nan sesyon an: ${count}.`
          )}
        />

        <SectionCard
          theme={theme}
          title={TEXT.startPractice}
          body={t(
            "Start an untimed guided session with immediate feedback and optional explanations after each answer.",
            "Comience una sesion guiada sin limite de tiempo, con retroalimentacion inmediata y explicaciones opcionales despues de cada respuesta.",
            "Commencez une session guidee sans limite de temps, avec un retour immediat et des explications facultatives apres chaque reponse.",
            "Kòmanse yon sesyon gide san limit tan, ak fidbak touswit ansanm ak eksplikasyon opsyonel apre chak repons."
          )}
          action={<button style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px" }} onClick={startPractice}>{TEXT.startPractice}</button>}
        />
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



