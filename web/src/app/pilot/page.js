"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadAllRemediationSessionRecords } from "../lib/remediationSessionPersistence";
import { loadAllExamAttemptRecords } from "../lib/examAttemptPersistence";
import { resolveStudentEntryState, signOutStudent } from "../lib/backend/auth/browserAuth";
import { isServerPersistenceEnabled } from "../lib/backend/config";

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
          <div style={{ color: "var(--brand-teal-dark)", lineHeight: 1.6, maxWidth: 760, fontSize: 14 }}>{subtitle}</div>
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
      <div style={{ color: palette.body, lineHeight: 1.6, fontSize: 14 }}>{body}</div>
      {action ? <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>{action}</div> : null}
    </div>
  );
}

function TestCard({ label, statusLabel, onClick, theme, statusTone, description, meta, disabled = false }) {
  const tones = {
    not_started: {
      background: "#ffffff",
      border: "var(--frame-border)",
      badgeBg: "var(--surface-soft)",
      badgeText: "#546577",
    },
    in_progress: {
      background: "var(--surface-tint)",
      border: "var(--chrome-border)",
      badgeBg: "var(--brand-teal-soft)",
      badgeText: "var(--brand-teal-dark)",
    },
    completed: {
      background: "#f4fbf7",
      border: "#cfe7d8",
      badgeBg: "#dff3e6",
      badgeText: "#1d6a3e",
    },
  };

  const palette = tones[statusTone] || tones.not_started;

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        width: "100%",
        textAlign: "left",
        padding: "16px",
        borderRadius: "16px",
        border: `1px solid ${palette.border}`,
        background: palette.background,
        cursor: disabled ? "not-allowed" : "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: 124,
        opacity: disabled ? 0.62 : 1,
      }}
    >
      <div
        style={{
          alignSelf: "flex-start",
          padding: "6px 10px",
          borderRadius: "999px",
          background: palette.badgeBg,
          color: palette.badgeText,
          fontSize: 12,
          fontWeight: 700,
          letterSpacing: "0.02em",
          textTransform: "uppercase",
        }}
      >
        {statusLabel}
      </div>
      <div style={{ fontSize: 19, fontWeight: 800, color: "var(--heading)", lineHeight: 1.25 }}>{label}</div>
      <div style={{ color: "#66788a", lineHeight: 1.5, fontSize: 14 }}>{description}</div>
      {meta ? <div style={{ marginTop: "auto", fontSize: 12, fontWeight: 700, color: "#607282", letterSpacing: "0.02em", textTransform: "uppercase" }}>{meta}</div> : null}
    </button>
  );
}

function StatTile({ label, value }) {
  return (
    <div
      style={{
        border: "1px solid var(--chrome-border)",
        borderRadius: 12,
        background: "white",
        padding: "12px 14px",
        display: "grid",
        gap: 6,
      }}
    >
      <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--heading)", lineHeight: 1.2 }}>{value}</div>
    </div>
  );
}

function CollapsibleSection({ title, hint, openHint, closeHint, children, defaultOpen = false }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      open={defaultOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      style={{
        border: "1px solid var(--chrome-border)",
        borderRadius: 14,
        background: "white",
        overflow: "hidden",
      }}
    >
      <summary style={{ cursor: "pointer", listStyle: "none", padding: "14px 16px", background: "var(--surface-soft)" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>{title}</div>
            {openHint || closeHint ? (
              <div style={{ fontSize: 11, fontWeight: 700, color: "#607282", whiteSpace: "nowrap" }}>
                {isOpen ? closeHint || openHint : openHint}
              </div>
            ) : null}
          </div>
          {hint ? <div style={{ fontSize: 13, color: "var(--muted)" }}>{hint}</div> : null}
        </div>
      </summary>
      <div style={{ padding: 14 }}>{children}</div>
    </details>
  );
}

function PilotInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [lang, setLang] = useState("en");
  const storageMode = sp.get("storage") === "server" ? "server" : "local";
  const forceServer = storageMode === "server";
  const useServer = forceServer || isServerPersistenceEnabled();
  const serverUser = forceServer ? "dev-exam-server-user" : null;
  const [isNarrow, setIsNarrow] = useState(false);
  const [testStatus, setTestStatus] = useState({
    1: "not_started",
    2: "not_started",
    3: "not_started",
    4: "not_started",
  });
  const [examProgress, setExamProgress] = useState({
    completedCount: 0,
    averageScore: null,
    bestScore: null,
    remediationCount: 0,
    recentResults: [],
  });
  const [serverAttemptIndex, setServerAttemptIndex] = useState({});
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const state = await resolveStudentEntryState();
        if (cancelled) return;

        if (state.status === "signin") {
          router.replace("/signin");
          return;
        }

        if (state.status === "access") {
          router.replace(`/access?lang=${lang}`);
          return;
        }

        try {
          localStorage.setItem("cna_access_granted", "1");
          localStorage.setItem("cna_pilot_lang", lang);
        } catch {}
        setAuthReady(true);
      } catch {
        router.replace("/signin");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang, router]);

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

  const TEXT = useMemo(() => {
    const t = {
      en: {
        title: "CNA Exam Practice Tests",
        subtitle:
          "Choose one of the four full practice exams below. You can return to an unfinished test on the same device, review completed tests, and reset the full set after all four are done.",
        language: "Language",
        returnToStart: "Back to main menu",
        studyTitle: "Chapter Review",
        refreshTitle: "Refresh Your Knowledge",
        refreshText: "Use these quick review tools before testing to refresh core ideas and decision-making patterns.",
        studyText:
          "Before you begin, you can open a short study-chapters guide with the main ideas from each chapter.",
        studyHint:
          "These chapters are brief refreshers only. They are not a full chapter-by-chapter review.",
        studyButton: "Open Chapter Review",
        categoryTitle: "Decision Categories",
        categoryText:
          "Open a review page that explains the 9 decision categories used to measure how you think through CNA-style questions.",
        categoryHint:
          "This guide helps explain what each category means and why categories are used in analytics and remediation.",
        categoryButton: "Open Category Review",
        testsTitle: "Available Practice Exams",
        testsIntro:
          "Each card below opens one full 60-question practice exam. Unfinished tests can be resumed on this device, and completed tests reopen in review mode.",
        testMeta: "60 Questions",
        progressTitle: "Your Exam Progress",
        progressText: "Track how many exams you have completed, how you are scoring, and how often you have used remediation support.",
        progressHint: "Open completed exams, scores, and remediation totals",
        openHint: "Tap to open",
        completedExams: "Exams completed",
        averageScore: "Average score",
        bestScore: "Best score",
        remediationSessions: "Remediation sessions",
        recentResults: "Recent exam results",
        noRecentResults: "No completed exam results yet.",
        notAvailable: "Not yet",
        recentResultLine: (testId, score) => `Test ${testId} · ${score}%`,
        recentResultCompleted: (testId) => `Test ${testId} · Completed`,
        statusNotStarted: "Ready",
        statusInProgress: "In Progress",
        statusCompleted: "Completed",
        start: (n) => `Start Test ${n}`,
        resume: (n) => `Resume Test ${n}`,
        review: (n) => `Review Test ${n}`,
        descNotStarted: "Start a new full 60-question practice exam.",
        descInProgress: "Continue this saved test on this device.",
        descCompleted: "Open this completed test to review your results.",
        descLocked: "Finish the exam already in progress before starting another one.",
        resetTitle: "Refresh the Full Exam Set",
        resetAll: "Reset All Tests",
        resetHintLocked: "Reset becomes available only after all 4 tests are completed.",
        resetHintReady: "All 4 tests are completed. You can reset the full set to start over.",
        resetDetail: "Resetting clears the saved exam progress and results for Tests 1-4 on this device.",
        confirmReset: "Reset all tests? This clears saved progress for Tests 1-4 on this device.",
      },
      es: {
        title: "Examenes de Practica CNA",
        subtitle:
          "Elija uno de los cuatro examenes completos de practica. Puede volver a un examen sin terminar en este dispositivo, revisar examenes completados y reiniciar el conjunto cuando termine los cuatro.",
        returnToStart: "Volver al menu principal",
        studyTitle: "Repaso por capitulos",
        refreshTitle: "Refresque sus conocimientos",
        refreshText: "Use estas herramientas de repaso rapido antes del examen para refrescar las ideas principales y los patrones de toma de decisiones.",
        studyText:
          "Antes de comenzar, puede abrir una guia corta de capitulos de estudio con las ideas principales de cada capitulo.",
        studyHint:
          "Estos capitulos son recordatorios breves. No son una revision completa capitulo por capitulo.",
        studyButton: "Abrir repaso por capitulos",
        categoryTitle: "Categorias de decision",
        categoryText:
          "Abra una pagina de repaso que explica las 9 categorias de decision que se utilizan para evaluar como usted razona en preguntas similares a las del examen CNA.",
        categoryHint:
          "Esta guia le ayuda a entender que significa cada categoria y por que se utiliza en el analisis y la remediacion.",
        categoryButton: "Abrir repaso de categorias",
        testsTitle: "Examenes de practica disponibles",
        testsIntro:
          "Cada tarjeta de abajo abre un examen completo de practica de 60 preguntas. Los examenes sin terminar se pueden reanudar en este dispositivo, y los examenes completados se vuelven a abrir en modo de revision.",
        testMeta: "60 Preguntas",
        progressTitle: "Su progreso en examenes",
        progressText: "Siga cuantos examenes ha completado, como han sido sus puntajes y cuantas veces ha usado el apoyo de remediacion.",
        progressHint: "Abra examenes completados, puntajes y total de remediaciones",
        openHint: "Toque para abrir",
        completedExams: "Examenes completados",
        averageScore: "Puntaje promedio",
        bestScore: "Mejor puntaje",
        remediationSessions: "Sesiones de remediacion",
        recentResults: "Resultados recientes",
        noRecentResults: "Todavia no hay resultados de examenes completados.",
        notAvailable: "Aun no",
        recentResultLine: (testId, score) => `Examen ${testId} · ${score}%`,
        recentResultCompleted: (testId) => `Examen ${testId} · Completado`,
        statusNotStarted: "Listo",
        statusInProgress: "En curso",
        statusCompleted: "Completado",
        start: (n) => `Comenzar Examen ${n}`,
        resume: (n) => `Reanudar Examen ${n}`,
        review: (n) => `Revisar Examen ${n}`,
        descNotStarted: "Comience un nuevo examen completo de practica de 60 preguntas.",
        descInProgress: "Continue este examen guardado en este dispositivo.",
        descCompleted: "Abra este examen completado para revisar sus resultados.",
        descLocked: "Termine el examen que ya esta en curso antes de comenzar otro.",
        resetTitle: "Renovar el conjunto completo",
        resetAll: "Reiniciar todos",
        resetHintLocked: "El reinicio estara disponible solo despues de completar los 4 examenes.",
        resetHintReady: "Ya completo los 4 examenes. Puede reiniciar el conjunto completo para comenzar otra vez.",
        resetDetail: "Al reiniciar se borran el progreso y los resultados guardados de los Examenes 1-4 en este dispositivo.",
        confirmReset: "Reiniciar todos los examenes? Esto borra el progreso guardado de los Examenes 1-4 en este dispositivo.",
      },
      fr: {
        title: "Tests de Pratique de l'Examen CNA",
        subtitle:
          "Choisissez l'un des quatre examens blancs complets. Vous pouvez reprendre un test non termine sur cet appareil, revoir les tests termines et reinitialiser l'ensemble une fois les quatre termines.",
        returnToStart: "Retour au menu principal",
        studyTitle: "Revision des chapitres",
        refreshTitle: "Rafraichissez vos connaissances",
        refreshText: "Utilisez ces outils de revision rapide avant le test pour rafraichir les idees essentielles et les habitudes de raisonnement.",
        studyText:
          "Avant de commencer, vous pouvez ouvrir un court guide des chapitres d'etude avec les idees principales de chaque chapitre.",
        studyHint:
          "Ces chapitres sont de brefs rappels seulement. Ils ne remplacent pas une revision complete chapitre par chapitre.",
        studyButton: "Ouvrir la revision des chapitres",
        categoryTitle: "Categories de decision",
        categoryText:
          "Ouvrez une page de revision qui explique les 9 categories de decision utilisees pour evaluer votre raisonnement dans des questions semblables a celles de l'examen CNA.",
        categoryHint:
          "Ce guide vous aide a comprendre ce que signifie chaque categorie et pourquoi elle est utilisee dans l'analyse et la remediation.",
        categoryButton: "Ouvrir la revision des categories",
        testsTitle: "Examens de pratique disponibles",
        testsIntro:
          "Chaque carte ci-dessous ouvre un examen de pratique complet de 60 questions. Les tests non termines peuvent etre repris sur cet appareil, et les tests termines se rouvrent en mode revision.",
        testMeta: "60 Questions",
        progressTitle: "Votre progression aux examens",
        progressText: "Suivez le nombre d'examens termines, vos scores et la frequence d'utilisation du soutien de remediation.",
        progressHint: "Ouvrir les examens termines, les scores et le total des remediations",
        openHint: "Touchez pour ouvrir",
        completedExams: "Examens termines",
        averageScore: "Score moyen",
        bestScore: "Meilleur score",
        remediationSessions: "Sessions de remediation",
        recentResults: "Resultats recents",
        noRecentResults: "Aucun resultat d'examen termine pour le moment.",
        notAvailable: "Pas encore",
        recentResultLine: (testId, score) => `Test ${testId} · ${score}%`,
        recentResultCompleted: (testId) => `Test ${testId} · Termine`,
        statusNotStarted: "Pret",
        statusInProgress: "En cours",
        statusCompleted: "Termine",
        start: (n) => `Demarrer le Test ${n}`,
        resume: (n) => `Reprendre le Test ${n}`,
        review: (n) => `Revoir le Test ${n}`,
        descNotStarted: "Commencez un nouvel examen de pratique complet de 60 questions.",
        descInProgress: "Continuez ce test enregistre sur cet appareil.",
        descCompleted: "Ouvrez ce test termine pour revoir vos resultats.",
        descLocked: "Terminez le test deja en cours avant d'en commencer un autre.",
        resetTitle: "Renouveler l'ensemble complet",
        resetAll: "Reinitialiser tout",
        resetHintLocked: "La reinitialisation sera disponible seulement apres avoir termine les 4 tests.",
        resetHintReady: "Les 4 tests sont termines. Vous pouvez reinitialiser l'ensemble complet pour recommencer.",
        resetDetail: "La reinitialisation efface la progression et les resultats enregistres pour les Tests 1-4 sur cet appareil.",
        confirmReset: "Reinitialiser tous les tests ? Cela efface la progression enregistree des Tests 1-4 sur cet appareil.",
      },
      ht: {
        title: "Tes Pratik Egzamen CNA",
        subtitle:
          "Chwazi youn nan kat egzamen pratik konple yo. Ou ka retounen nan yon tes ou poko fini sou menm aparey la, revize tes ou fin fe yo, epi rafrechi tout ansanm apre ou fin fe kat la.",
        returnToStart: "Retounen nan meni prensipal la",
        studyTitle: "Revizyon chapit yo",
        refreshTitle: "Rafrechi konesans ou",
        refreshText: "Svi ak zouti revizyon rapid sa yo anvan tes la pou rafrechi ide prensipal yo ak fason pou pran bon desizyon.",
        studyText:
          "Anvan ou komanse, ou ka louvri yon gid kout sou chapit etid yo ak ide prensipal chak chapit.",
        studyHint:
          "Chapit sa yo se ti rapel kout selman. Yo pa yon revizyon konple chapit pa chapit.",
        studyButton: "Louvri revizyon chapit yo",
        categoryTitle: "Kategori desizyon",
        categoryText:
          "Louvri yon paj revizyon ki esplike 9 kategori desizyon yo itilize pou evalye fason ou reflechi sou kestyon ki sanble ak kestyon egzamen CNA a.",
        categoryHint:
          "Gid sa a ede ou konprann sa chak kategori vle di ak poukisa yo itilize li nan analiz ak remedyasyon.",
        categoryButton: "Louvri revizyon kategori yo",
        testsTitle: "Egzamen pratik ki disponib",
        testsIntro:
          "Chak kat ki anba a louvri yon egzamen pratik konple ak 60 kestyon. Ou ka reprann tes ou poko fini yo sou aparey sa a, epi tes ou deja fini yo ap relouvri nan mod revizyon.",
        testMeta: "60 Kesyon",
        progressTitle: "Pwogre egzamen ou",
        progressText: "Swiv konbyen egzamen ou fini, kijan nòt ou yo ap mache, ak konbyen fwa ou itilize sipò remedyasyon.",
        progressHint: "Louvri egzamen fini yo, nòt yo, ak total remedyasyon yo",
        openHint: "Peze pou louvri",
        completedExams: "Egzamen fini",
        averageScore: "Mwayen nòt",
        bestScore: "Pi bon nòt",
        remediationSessions: "Sesyon remedyasyon",
        recentResults: "Dènye rezilta egzamen yo",
        noRecentResults: "Poko gen rezilta pou egzamen ki fini yo.",
        notAvailable: "Poko",
        recentResultLine: (testId, score) => `Tes ${testId} · ${score}%`,
        recentResultCompleted: (testId) => `Tes ${testId} · Fini`,
        statusNotStarted: "Pare",
        statusInProgress: "An pwogre",
        statusCompleted: "Fini",
        start: (n) => `Komanse Tes ${n}`,
        resume: (n) => `Kontinye Tes ${n}`,
        review: (n) => `Revize Tes ${n}`,
        descNotStarted: "Komanse yon nouvo egzamen pratik konple ak 60 kestyon.",
        descInProgress: "Kontinye tes sa a ki te deja sove sou aparey sa a.",
        descCompleted: "Louvri tes sa a ou deja fini pou revize rezilta ou yo.",
        descLocked: "Fini egzamen ki deja an pwogre a anvan ou komanse yon lot.",
        resetTitle: "Rafrechi tout seri egzamen an",
        resetAll: "Reyinisyalize tout",
        resetHintLocked: "Reyinisyalizasyon ap disponib selman apre ou fin konplete 4 tes yo.",
        resetHintReady: "Ou fini 4 tes yo. Ou ka rafrechi tout seri a pou rekomanse.",
        resetDetail: "Lè ou reyinisyalize, sa efase pwogre ak rezilta ki te sove pou Tes 1-4 sou aparey sa a.",
        confirmReset: "Reyinisyalize tout tes yo? Sa ap efase pwogre ki te sove pou Tes 1-4 sou aparey sa a.",
      },
    };

    const selected = t[lang] || t.en;
    return {
      ...selected,
      openHint: isNarrow
        ? selected.openHint
        : lang === "es"
          ? "Haga clic para abrir"
          : lang === "fr"
            ? "Cliquez pour ouvrir"
            : lang === "ht"
              ? "Klike pou louvri"
              : "Click to open",
      closeHint: isNarrow
        ? lang === "es"
          ? "Toque para cerrar"
          : lang === "fr"
            ? "Touchez pour fermer"
            : lang === "ht"
              ? "Peze pou femen"
              : "Tap to close"
        : lang === "es"
          ? "Haga clic para cerrar"
          : lang === "fr"
            ? "Cliquez pour fermer"
            : lang === "ht"
              ? "Klike pou femen"
              : "Click to close",
    };
  }, [isNarrow, lang]);

  function makeStateKey(testId, langCode) {
    return `cna_exam_state::form_001::test_${testId}::${langCode}`;
  }

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
    const urlLang = sp.get("lang");
    if (urlLang === "en" || urlLang === "es" || urlLang === "fr" || urlLang === "ht") {
      try {
        localStorage.setItem("cna_pilot_lang", urlLang);
      } catch {}
      setLang(urlLang);
    } else {
      try {
        const savedLang = localStorage.getItem("cna_pilot_lang");
        if (savedLang === "en" || savedLang === "es" || savedLang === "fr" || savedLang === "ht") {
          setLang(savedLang);
        }
      } catch {}
    }
  }, [sp]);

  useEffect(() => {
    function syncProgress() {
      if (!authReady) return;
      refreshStatuses();
      refreshExamProgress();
    }

    function onVisible() {
      if (document.visibilityState === "visible") syncProgress();
    }

    if (authReady) {
      syncProgress();
    }
    window.addEventListener("focus", syncProgress);
    window.addEventListener("storage", syncProgress);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", syncProgress);
      window.removeEventListener("storage", syncProgress);
      document.removeEventListener("visibilitychange", onVisible);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [authReady, forceServer, lang, serverUser, useServer]);

  function refreshStatuses() {
    if (useServer) {
      void (async () => {
        try {
          const attempts = await loadAllExamAttemptRecords(lang, { forceServer: useServer, serverUser });
          const next = { 1: "not_started", 2: "not_started", 3: "not_started", 4: "not_started" };
          const nextIndex = {};

          attempts.forEach((attempt) => {
            const testId = Number(attempt?.test_id);
            if (!Number.isFinite(testId) || testId < 1 || testId > 4) return;
            if (!nextIndex[testId]) nextIndex[testId] = attempt;
          });

          [1, 2, 3, 4].forEach((n) => {
            const item = nextIndex[n];
            if (!item) {
              next[n] = "not_started";
              return;
            }
            next[n] = item.mode === "finished" || item.mode === "time_expired" || item.mode === "analytics" || item.mode === "rationales"
              ? "completed"
              : "in_progress";
          });

          setServerAttemptIndex(nextIndex);
          setTestStatus(next);
        } catch {
          setServerAttemptIndex({});
          setTestStatus({ 1: "not_started", 2: "not_started", 3: "not_started", 4: "not_started" });
        }
      })();
      return;
    }

    const next = { ...testStatus };
    try {
      for (let n = 1; n <= 4; n += 1) {
        const key = makeStateKey(
          n,
          (() => {
            try {
              const savedLang = localStorage.getItem("cna_pilot_lang");
              if (savedLang === "en" || savedLang === "es" || savedLang === "fr" || savedLang === "ht") {
                return savedLang;
              }
            } catch {}
            return "en";
          })()
        );

        const raw = localStorage.getItem(key);
        if (!raw) {
          next[n] = "not_started";
          continue;
        }

        let parsed = null;
        try {
          parsed = JSON.parse(raw);
        } catch {
          next[n] = "not_started";
          continue;
        }

        const mode = parsed?.mode;
        if (mode === "finished" || mode === "time_expired" || mode === "analytics" || mode === "rationales") {
          next[n] = "completed";
        } else {
          next[n] = "in_progress";
        }
      }
    } catch {}

    setTestStatus(next);
  }

  function refreshExamProgress() {
    void (async () => {
      if (useServer) {
        try {
          const attempts = await loadAllExamAttemptRecords(lang, { forceServer: useServer, serverUser });
          const latestByTest = {};
          attempts.forEach((attempt) => {
            const testId = Number(attempt?.test_id);
            if (!Number.isFinite(testId) || testId < 1 || testId > 4) return;
            if (!latestByTest[testId]) latestByTest[testId] = attempt;
          });

          const completed = Object.values(latestByTest).filter((attempt) =>
            attempt?.mode === "finished" || attempt?.mode === "time_expired" || attempt?.mode === "analytics" || attempt?.mode === "rationales"
          );

          const remediationSessions = (await loadAllRemediationSessionRecords(lang, { forceServer: useServer, serverUser })) || [];
          const completedRemediation = remediationSessions.filter((session) => session?.status === "completed");

          const scoredResults = completed
            .map((attempt) => Number(attempt.score))
            .filter((score) => Number.isFinite(score));

          setExamProgress({
            completedCount: completed.length,
            averageScore: scoredResults.length
              ? Math.round(scoredResults.reduce((sum, score) => sum + score, 0) / scoredResults.length)
              : null,
            bestScore: scoredResults.length ? Math.max(...scoredResults) : null,
            remediationCount: completedRemediation.length,
            recentResults: completed
              .map((attempt) => ({
                testId: Number(attempt.test_id),
                attemptId: attempt.attempt_id,
                score: Number.isFinite(attempt.score) ? attempt.score : null,
              }))
              .sort((a, b) => b.testId - a.testId),
          });
        } catch {
          setExamProgress({
            completedCount: 0,
            averageScore: null,
            bestScore: null,
            remediationCount: 0,
            recentResults: [],
          });
        }
        return;
      }

      try {
        const completed = [];
        const scoredResults = [];
        for (let n = 1; n <= 4; n += 1) {
          const key = makeStateKey(n, lang);
          const raw = localStorage.getItem(key);
          if (!raw) continue;
          const saved = JSON.parse(raw);
          if (
            !saved ||
            !saved.attempt_id ||
            (saved.mode !== "finished" &&
              saved.mode !== "time_expired" &&
              saved.mode !== "analytics" &&
              saved.mode !== "rationales")
          ) {
            continue;
          }

          const completedEntry = {
            testId: n,
            attemptId: saved.attempt_id,
            score: null,
          };
          completed.push(completedEntry);

          const payloadRaw = localStorage.getItem(`cna:results:${saved.attempt_id}`);
          if (!payloadRaw) continue;

          const payload = JSON.parse(payloadRaw);
          const accuracy = Number(payload?.analytics_meta?.overall_accuracy);
          if (!Number.isFinite(accuracy)) continue;

          const score = Math.round(accuracy * 100);
          completedEntry.score = score;
          scoredResults.push({ testId: n, attemptId: saved.attempt_id, score });
        }

      const remediationSessions = (await loadAllRemediationSessionRecords(lang, { forceServer: useServer, serverUser })) || [];
        const completedRemediation = remediationSessions.filter((session) => session?.status === "completed");
        const completedCount = completed.length;
        const averageScore = scoredResults.length ? Math.round(scoredResults.reduce((sum, row) => sum + row.score, 0) / scoredResults.length) : null;
        const bestScore = scoredResults.length ? Math.max(...scoredResults.map((row) => row.score)) : null;

        setExamProgress({
          completedCount,
          averageScore,
          bestScore,
          remediationCount: completedRemediation.length,
          recentResults: completed.sort((a, b) => b.testId - a.testId),
        });
      } catch {
        setExamProgress({
          completedCount: 0,
          averageScore: null,
          bestScore: null,
          remediationCount: 0,
          recentResults: [],
        });
      }
    })();
  }

  const allCompleted = useMemo(() => [1, 2, 3, 4].every((n) => testStatus[n] === "completed"), [testStatus]);
  const activeTestId = useMemo(
    () => [1, 2, 3, 4].find((n) => testStatus[n] === "in_progress") || null,
    [testStatus]
  );

  function startOrResume(testId) {
    if (useServer) {
      const attempt = serverAttemptIndex[testId] || null;
      const params = new URLSearchParams({ lang, test_id: String(testId) });
      if (forceServer) params.set("storage", "server");
      if (attempt?.attempt_id) params.set("attempt_id", attempt.attempt_id);
      router.push(`/exam?${params.toString()}`);
      return;
    }

    try {
      const key = makeStateKey(testId, lang);
      const raw = localStorage.getItem(key);
      if (raw) {
        const saved = JSON.parse(raw);
        if (
          saved &&
          (saved.mode === "finished" ||
            saved.mode === "time_expired" ||
            saved.mode === "analytics" ||
            saved.mode === "rationales")
        ) {
          localStorage.setItem(key, JSON.stringify({ ...saved, mode: "finished" }));
        }
      }
    } catch {}

    try {
      localStorage.setItem("cna_pilot_test_id", String(testId));
    } catch {}
    router.push(`/exam?lang=${lang}`);
  }

  async function handleSignOut() {
    try {
      await signOutStudent();
    } catch {}
    router.replace("/signin");
  }

  function resetAll() {
    if (!allCompleted) return;

    const ok = window.confirm(TEXT.confirmReset);
    if (!ok) return;

    if (forceServer) {
      void (async () => {
        try {
          await fetch("/api/backend/exam-attempts/dev-reset", { method: "GET", cache: "no-store" });
        } catch {}
        refreshStatuses();
        refreshExamProgress();
      })();
      return;
    }

    try {
      for (let n = 1; n <= 4; n += 1) {
        const key = makeStateKey(n, lang);
        localStorage.removeItem(key);
      }

      Object.keys(localStorage).forEach((key) => {
        if (key.startsWith("cna:results:")) localStorage.removeItem(key);
      });
    } catch {}

    refreshStatuses();
  }

  function getTestLabel(n) {
    const status = testStatus[n];
    if (status === "completed") return TEXT.review(n);
    if (status === "in_progress") return TEXT.resume(n);
    return TEXT.start(n);
  }

  function getStatusLabel(status) {
    if (status === "completed") return TEXT.statusCompleted;
    if (status === "in_progress") return TEXT.statusInProgress;
    return TEXT.statusNotStarted;
  }

  function getStatusDescription(status) {
    if (status === "completed") return TEXT.descCompleted;
    if (status === "in_progress") return TEXT.descInProgress;
    return TEXT.descNotStarted;
  }

  return (
    <Frame
      title={TEXT.title}
      subtitle={TEXT.subtitle}
      theme={theme}
      headerAction={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {(isNarrow
            ? [
                {
                  key: "signout",
                  onClick: handleSignOut,
                  label: lang === "es" ? "Cerrar sesion" : lang === "fr" ? "Deconnexion" : lang === "ht" ? "Dekonekte" : "Sign out",
                },
                {
                  key: "back",
                  onClick: () => router.push(`/start?lang=${lang}`),
                  label: TEXT.returnToStart,
                },
                {
                  key: "instructions",
                  onClick: () => router.push(`/instructions?lang=${lang}`),
                  label:
                    lang === "es"
                      ? "Instrucciones del examen"
                      : lang === "fr"
                        ? "Instructions de l'examen"
                        : lang === "ht"
                          ? "Enstriksyon egzamen"
                          : "Exam Instructions",
                },
              ]
            : [
                {
                  key: "instructions",
                  onClick: () => router.push(`/instructions?lang=${lang}`),
                  label:
                    lang === "es"
                      ? "Instrucciones del examen"
                      : lang === "fr"
                        ? "Instructions de l'examen"
                        : lang === "ht"
                          ? "Enstriksyon egzamen"
                          : "Exam Instructions",
                },
                {
                  key: "back",
                  onClick: () => router.push(`/start?lang=${lang}`),
                  label: TEXT.returnToStart,
                },
                {
                  key: "signout",
                  onClick: handleSignOut,
                  label: lang === "es" ? "Cerrar sesion" : lang === "fr" ? "Deconnexion" : lang === "ht" ? "Dekonekte" : "Sign out",
                },
              ]).map((item) => (
            <button
              key={item.key}
              onClick={item.onClick}
              style={{
                padding: "8px 11px",
                fontSize: "13px",
                borderRadius: "10px",
                border: `1px solid ${theme.chromeBorder}`,
                background: "white",
                color: theme.secondaryText,
                cursor: "pointer",
                fontWeight: 700,
                minWidth: "unset",
              }}
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      footer={
        <div />
      }
    >
      <div
        style={{
          display: "grid",
          gap: 14,
        }}
      >
        <SectionCard
          theme={theme}
          tone="accent"
          title={TEXT.testsTitle}
          body={TEXT.testsIntro}
        />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {[1, 2, 3, 4].map((n) => {
            const disabled = !!activeTestId && activeTestId !== n && testStatus[n] === "not_started";
            return (
              <TestCard
                key={n}
                label={getTestLabel(n)}
                statusLabel={getStatusLabel(testStatus[n])}
                description={disabled ? TEXT.descLocked : getStatusDescription(testStatus[n])}
                statusTone={testStatus[n]}
                meta={TEXT.testMeta}
                onClick={() => {
                  if (disabled) return;
                  startOrResume(n);
                }}
                theme={theme}
                disabled={disabled}
              />
            );
          })}
        </div>

        {isNarrow ? (
          <CollapsibleSection title={TEXT.progressTitle} hint={TEXT.progressHint} openHint={TEXT.openHint} closeHint={TEXT.closeHint}>
            <div style={{ display: "grid", gap: 12 }}>
              <div>{TEXT.progressText}</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr",
                  gap: 10,
                }}
              >
                <StatTile label={TEXT.completedExams} value={`${examProgress.completedCount}/4`} />
                <StatTile label={TEXT.averageScore} value={examProgress.averageScore === null ? TEXT.notAvailable : `${examProgress.averageScore}%`} />
                <StatTile label={TEXT.bestScore} value={examProgress.bestScore === null ? TEXT.notAvailable : `${examProgress.bestScore}%`} />
                <StatTile label={TEXT.remediationSessions} value={String(examProgress.remediationCount)} />
              </div>
              <details style={{ border: "1px solid var(--chrome-border)", borderRadius: 12, background: "white", padding: "12px 14px" }}>
                <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--heading)" }}>
                  {TEXT.recentResults}
                </summary>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {examProgress.recentResults.length ? (
                    examProgress.recentResults.map((item) => (
                      <div
                        key={`${item.testId}-${item.attemptId}`}
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
                          {item.score === null ? TEXT.recentResultCompleted(item.testId) : TEXT.recentResultLine(item.testId, item.score)}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#5c6d7d" }}>{TEXT.noRecentResults}</div>
                  )}
                </div>
              </details>
            </div>
          </CollapsibleSection>
        ) : (
          <SectionCard
            theme={theme}
            tone="muted"
            title={TEXT.progressTitle}
            body={
              <div style={{ display: "grid", gap: 12 }}>
                <div>{TEXT.progressText}</div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: "repeat(4, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  <StatTile label={TEXT.completedExams} value={`${examProgress.completedCount}/4`} />
                  <StatTile label={TEXT.averageScore} value={examProgress.averageScore === null ? TEXT.notAvailable : `${examProgress.averageScore}%`} />
                  <StatTile label={TEXT.bestScore} value={examProgress.bestScore === null ? TEXT.notAvailable : `${examProgress.bestScore}%`} />
                  <StatTile label={TEXT.remediationSessions} value={String(examProgress.remediationCount)} />
                </div>
                <details style={{ border: "1px solid var(--chrome-border)", borderRadius: 12, background: "white", padding: "12px 14px" }}>
                  <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--heading)" }}>
                    {TEXT.recentResults}
                  </summary>
                  <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                    {examProgress.recentResults.length ? (
                      examProgress.recentResults.map((item) => (
                        <div
                          key={`${item.testId}-${item.attemptId}`}
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
                            {item.score === null ? TEXT.recentResultCompleted(item.testId) : TEXT.recentResultLine(item.testId, item.score)}
                          </div>
                        </div>
                      ))
                    ) : (
                      <div style={{ color: "#5c6d7d" }}>{TEXT.noRecentResults}</div>
                    )}
                  </div>
                </details>
              </div>
            }
          />
        )}

        {isNarrow ? (
          <CollapsibleSection title={TEXT.refreshTitle} hint={TEXT.refreshText} openHint={TEXT.openHint} closeHint={TEXT.closeHint}>
            <div style={{ display: "grid", gap: 12 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "minmax(0, 1fr)",
                  gap: 12,
                }}
              >
                <div
                  style={{
                    border: "1px solid var(--chrome-border)",
                    borderRadius: 12,
                    background: "white",
                    padding: "14px",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>{TEXT.studyTitle}</div>
                  <div style={{ color: "#4d6174", lineHeight: 1.6 }}>{TEXT.studyText}</div>
                  <div style={{ fontSize: 13, color: "#607282" }}>{TEXT.studyHint}</div>
                  <div style={{ display: "flex", justifyContent: "stretch", marginTop: 4 }}>
                    <button
                      onClick={() => router.push(`/chapters?lang=${lang}&src=exam`)}
                      style={{
                        padding: "9px 12px",
                        fontSize: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${theme.buttonBorder}`,
                        background: theme.secondaryBg,
                        color: theme.secondaryText,
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {TEXT.studyButton}
                    </button>
                  </div>
                </div>
                <div
                  style={{
                    border: "1px solid var(--chrome-border)",
                    borderRadius: 12,
                    background: "white",
                    padding: "14px",
                    display: "grid",
                    gap: 8,
                  }}
                >
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>{TEXT.categoryTitle}</div>
                  <div style={{ color: "#4d6174", lineHeight: 1.6 }}>{TEXT.categoryText}</div>
                  <div style={{ fontSize: 13, color: "#607282" }}>{TEXT.categoryHint}</div>
                  <div style={{ display: "flex", justifyContent: "stretch", marginTop: 4 }}>
                    <button
                      onClick={() => router.push(`/categories?lang=${lang}&src=exam`)}
                      style={{
                        padding: "9px 12px",
                        fontSize: "14px",
                        borderRadius: "10px",
                        border: `1px solid ${theme.buttonBorder}`,
                        background: theme.secondaryBg,
                        color: theme.secondaryText,
                        cursor: "pointer",
                        width: "100%",
                      }}
                    >
                      {TEXT.categoryButton}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        ) : (
          <CollapsibleSection title={TEXT.refreshTitle} hint={TEXT.refreshText} openHint={TEXT.openHint} closeHint={TEXT.closeHint}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <div
                style={{
                  border: "1px solid var(--chrome-border)",
                  borderRadius: 12,
                  background: "white",
                  padding: "14px",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>{TEXT.studyTitle}</div>
                <div style={{ color: "#4d6174", lineHeight: 1.6 }}>{TEXT.studyText}</div>
                <div style={{ fontSize: 13, color: "#607282" }}>{TEXT.studyHint}</div>
                <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
                  <button
                    onClick={() => router.push(`/chapters?lang=${lang}&src=exam`)}
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
                    {TEXT.studyButton}
                  </button>
                </div>
              </div>
              <div
                style={{
                  border: "1px solid var(--chrome-border)",
                  borderRadius: 12,
                  background: "white",
                  padding: "14px",
                  display: "grid",
                  gap: 8,
                }}
              >
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>{TEXT.categoryTitle}</div>
                <div style={{ color: "#4d6174", lineHeight: 1.6 }}>{TEXT.categoryText}</div>
                <div style={{ fontSize: 13, color: "#607282" }}>{TEXT.categoryHint}</div>
                <div style={{ display: "flex", justifyContent: "flex-start", marginTop: 4 }}>
                  <button
                    onClick={() => router.push(`/categories?lang=${lang}&src=exam`)}
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
                    {TEXT.categoryButton}
                  </button>
                </div>
              </div>
            </div>
          </CollapsibleSection>
        )}

        <SectionCard
          theme={theme}
          tone="muted"
          title={TEXT.resetTitle}
          body={
            <div>
              <div>{allCompleted ? TEXT.resetHintReady : TEXT.resetHintLocked}</div>
              <div style={{ marginTop: 8, fontSize: 13 }}>
                {TEXT.resetDetail}
              </div>
            </div>
          }
          action={
            <button
              onClick={resetAll}
              disabled={!allCompleted}
              style={{
                padding: "10px 14px",
                fontSize: "14px",
                borderRadius: "10px",
                border: `1px solid ${theme.buttonBorder}`,
                background: allCompleted ? theme.primaryBg : "#eef2f6",
                color: allCompleted ? theme.primaryText : "#7b8794",
                cursor: allCompleted ? "pointer" : "not-allowed",
                fontWeight: 700,
              }}
            >
              {TEXT.resetAll}
            </button>
          }
        />
      </div>
    </Frame>
  );
}

export default function PilotPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <PilotInner />
    </Suspense>
  );
}
