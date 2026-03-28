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

function TestCard({ label, statusLabel, onClick, theme, statusTone, description }) {
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
      style={{
        width: "100%",
        textAlign: "left",
        padding: "16px",
        borderRadius: "16px",
        border: `1px solid ${palette.border}`,
        background: palette.background,
        cursor: "pointer",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
        minHeight: 124,
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
      <div style={{ color: "#66788a", lineHeight: 1.5 }}>{description}</div>
    </button>
  );
}

function PilotInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const [lang, setLang] = useState("en");
  const [isNarrow, setIsNarrow] = useState(false);
  const [testStatus, setTestStatus] = useState({
    1: "not_started",
    2: "not_started",
    3: "not_started",
    4: "not_started",
  });

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
        returnToStart: "Back to Welcome",
        studyTitle: "Quick Study Refresher",
        studyText:
          "Before you begin, you can open a short study-chapters guide with the main ideas from each chapter.",
        studyHint:
          "These chapters are brief refreshers only. They are not a full chapter-by-chapter review.",
        studyButton: "Open Study Chapters",
        testsTitle: "Available Practice Exams",
        testsIntro:
          "Each card below opens one full 60-question practice exam. Unfinished tests can be resumed on this device, and completed tests reopen in review mode.",
        statusNotStarted: "Ready",
        statusInProgress: "In Progress",
        statusCompleted: "Completed",
        start: (n) => `Start Test ${n}`,
        resume: (n) => `Resume Test ${n}`,
        review: (n) => `Review Test ${n}`,
        descNotStarted: "Start a new full 60-question practice exam.",
        descInProgress: "Continue this saved test on this device.",
        descCompleted: "Open this completed test to review your results.",
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
        returnToStart: "Volver a la bienvenida",
        studyTitle: "Repaso rapido de estudio",
        studyText:
          "Antes de comenzar, puede abrir una guia corta de capitulos de estudio con las ideas principales de cada capitulo.",
        studyHint:
          "Estos capitulos son recordatorios breves. No son una revision completa capitulo por capitulo.",
        studyButton: "Abrir capitulos de estudio",
        testsTitle: "Examenes de practica disponibles",
        testsIntro:
          "Cada tarjeta de abajo abre un examen completo de practica de 60 preguntas. Los examenes sin terminar se pueden reanudar en este dispositivo, y los examenes completados se vuelven a abrir en modo de revision.",
        statusNotStarted: "Listo",
        statusInProgress: "En curso",
        statusCompleted: "Completado",
        start: (n) => `Comenzar Examen ${n}`,
        resume: (n) => `Reanudar Examen ${n}`,
        review: (n) => `Revisar Examen ${n}`,
        descNotStarted: "Comience un nuevo examen completo de practica de 60 preguntas.",
        descInProgress: "Continue este examen guardado en este dispositivo.",
        descCompleted: "Abra este examen completado para revisar sus resultados.",
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
        returnToStart: "Retour a l'accueil",
        studyTitle: "Rappel d'etude rapide",
        studyText:
          "Avant de commencer, vous pouvez ouvrir un court guide des chapitres d'etude avec les idees principales de chaque chapitre.",
        studyHint:
          "Ces chapitres sont de brefs rappels seulement. Ils ne remplacent pas une revision complete chapitre par chapitre.",
        studyButton: "Ouvrir les chapitres d'etude",
        testsTitle: "Examens de pratique disponibles",
        testsIntro:
          "Chaque carte ci-dessous ouvre un examen de pratique complet de 60 questions. Les tests non termines peuvent etre repris sur cet appareil, et les tests termines se rouvrent en mode revision.",
        statusNotStarted: "Pret",
        statusInProgress: "En cours",
        statusCompleted: "Termine",
        start: (n) => `Demarrer le Test ${n}`,
        resume: (n) => `Reprendre le Test ${n}`,
        review: (n) => `Revoir le Test ${n}`,
        descNotStarted: "Commencez un nouvel examen de pratique complet de 60 questions.",
        descInProgress: "Continuez ce test enregistre sur cet appareil.",
        descCompleted: "Ouvrez ce test termine pour revoir vos resultats.",
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
        returnToStart: "Retounen nan byenvini",
        studyTitle: "Ti revizyon etid rapid",
        studyText:
          "Anvan ou komanse, ou ka louvri yon gid kout sou chapit etid yo ak ide prensipal chak chapit.",
        studyHint:
          "Chapit sa yo se ti rapel kout selman. Yo pa yon revizyon konple chapit pa chapit.",
        studyButton: "Louvri chapit etid yo",
        testsTitle: "Egzamen pratik ki disponib",
        testsIntro:
          "Chak kat ki anba a louvri yon egzamen pratik konple ak 60 kestyon. Ou ka reprann tes ou poko fini yo sou aparey sa a, epi tes ou deja fini yo ap relouvri nan mod revizyon.",
        statusNotStarted: "Pare",
        statusInProgress: "An pwogre",
        statusCompleted: "Fini",
        start: (n) => `Komanse Tes ${n}`,
        resume: (n) => `Kontinye Tes ${n}`,
        review: (n) => `Revize Tes ${n}`,
        descNotStarted: "Komanse yon nouvo egzamen pratik konple ak 60 kestyon.",
        descInProgress: "Kontinye tes sa a ki te deja sove sou aparey sa a.",
        descCompleted: "Louvri tes sa a ou deja fini pou revize rezilta ou yo.",
        resetTitle: "Rafrechi tout seri egzamen an",
        resetAll: "Reyinisyalize tout",
        resetHintLocked: "Reyinisyalizasyon ap disponib selman apre ou fin konplete 4 tes yo.",
        resetHintReady: "Ou fini 4 tes yo. Ou ka rafrechi tout seri a pou rekomanse.",
        resetDetail: "Lè ou reyinisyalize, sa efase pwogre ak rezilta ki te sove pou Tes 1-4 sou aparey sa a.",
        confirmReset: "Reyinisyalize tout tes yo? Sa ap efase pwogre ki te sove pou Tes 1-4 sou aparey sa a.",
      },
    };

    return t[lang] || t.en;
  }, [lang]);

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

    refreshStatuses();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sp]);

  function refreshStatuses() {
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

  const allCompleted = useMemo(() => [1, 2, 3, 4].every((n) => testStatus[n] === "completed"), [testStatus]);

  function startOrResume(testId) {
    try {
      localStorage.setItem("cna_pilot_test_id", String(testId));
    } catch {}
    router.push(`/exam?lang=${lang}`);
  }

  function resetAll() {
    if (!allCompleted) return;

    const ok = window.confirm(TEXT.confirmReset);
    if (!ok) return;

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
        <button
          onClick={() => router.push(`/welcome?lang=${lang}`)}
          style={{
            padding: "9px 12px",
            fontSize: "14px",
            borderRadius: "10px",
            border: `1px solid ${theme.buttonBorder}`,
            background: theme.secondaryBg,
            color: theme.secondaryText,
            cursor: "pointer",
            minWidth: "unset",
          }}
        >
          {TEXT.returnToStart}
        </button>
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
        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow
              ? "minmax(0, 1fr)"
              : "minmax(0, 1.25fr) minmax(320px, 0.9fr)",
            gap: 14,
          }}
        >
          <SectionCard
            theme={theme}
            tone="accent"
            title={TEXT.testsTitle}
            body={TEXT.testsIntro}
          />

          <SectionCard
            theme={theme}
            title={TEXT.studyTitle}
            body={
              <>
                <div>{TEXT.studyText}</div>
                <div style={{ marginTop: 8, fontSize: 13 }}>{TEXT.studyHint}</div>
              </>
            }
            action={
              <button
                onClick={() => router.push(`/chapters?lang=${lang}`)}
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
            }
          />
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow
              ? "minmax(0, 1fr)"
              : "repeat(auto-fit, minmax(220px, 1fr))",
            gap: 12,
          }}
        >
          {[1, 2, 3, 4].map((n) => (
            <TestCard
              key={n}
              label={getTestLabel(n)}
              statusLabel={getStatusLabel(testStatus[n])}
              description={getStatusDescription(testStatus[n])}
              statusTone={testStatus[n]}
              onClick={() => startOrResume(n)}
              theme={theme}
            />
          ))}
        </div>

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
