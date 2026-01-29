"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";

import { useRouter, useSearchParams } from "next/navigation";

function PilotInner() {

  const router = useRouter();
  const sp = useSearchParams();


  // Read language chosen on Home (/)
  const [lang, setLang] = useState("en");

  // Track status for 6 tests
  // status: "not_started" | "in_progress" | "completed"
  const [testStatus, setTestStatus] = useState({
    1: "not_started",
    2: "not_started",
    3: "not_started",
    4: "not_started",
    5: "not_started",
    6: "not_started",
  });

  const TEXT = useMemo(() => {
    const t = {
      en: {
        title: "CNA Exam Pilot",
        subtitle:
          "Choose a test below. Each test is a full 60-question practice exam. You can resume an in-progress test on the same device.",
        language: "Language",
        changeLanguage: "Change language",
        start: (n) => `Start Test ${n}`,
        resume: (n) => `Resume Test ${n}`,
        completed: (n) => `Test ${n} Completed`,
        resetAll: "Reset All Tests",
        resetHintLocked: "Reset becomes available only after all 6 tests are completed.",
        resetHintReady: "All 6 tests are completed. You can reset to allow new attempts.",
        confirmReset: "Reset all tests? This clears saved progress for Tests 1–6 on this device.",
      },
      es: {
        title: "Piloto del Examen CNA",
        subtitle:
          "Elige un examen abajo. Cada examen tiene 60 preguntas. Puedes reanudar un examen en curso en el mismo dispositivo.",
        language: "Idioma",
        changeLanguage: "Cambiar idioma",
        start: (n) => `Comenzar Examen ${n}`,
        resume: (n) => `Reanudar Examen ${n}`,
        completed: (n) => `Examen ${n} Completado`,
        resetAll: "Reiniciar Todos",
        resetHintLocked: "El reinicio se activa solo cuando completes los 6 exámenes.",
        resetHintReady: "Completaste los 6 exámenes. Puedes reiniciar para intentar de nuevo.",
        confirmReset:
          "¿Reiniciar todos los exámenes? Esto borra el progreso guardado de los Exámenes 1–6 en este dispositivo.",
      },
      fr: {
        title: "Pilote de l’Examen CNA",
        subtitle:
          "Choisissez un test ci-dessous. Chaque test comporte 60 questions. Vous pouvez reprendre un test en cours sur le même appareil.",
        language: "Langue",
        changeLanguage: "Changer de langue",
        start: (n) => `Démarrer le Test ${n}`,
        resume: (n) => `Reprendre le Test ${n}`,
        completed: (n) => `Test ${n} Terminé`,
        resetAll: "Réinitialiser Tout",
        resetHintLocked: "La réinitialisation est disponible uniquement après avoir terminé les 6 tests.",
        resetHintReady: "Les 6 tests sont terminés. Vous pouvez réinitialiser pour recommencer.",
        confirmReset:
          "Réinitialiser tous les tests ? Cela efface la progression enregistrée des Tests 1 à 6 sur cet appareil.",
      },
      ht: {
        title: "Pilòt Egzamen CNA",
        subtitle:
          "Chwazi yon tès anba a. Chak tès gen 60 kestyon. Ou ka rekòmanse yon tès ki sou wout sou menm aparèy la.",
        language: "Lang",
        changeLanguage: "Chanje lang",
        start: (n) => `Kòmanse Tès ${n}`,
        resume: (n) => `Kontinye Tès ${n}`,
        completed: (n) => `Tès ${n} Fini`,
        resetAll: "Reyinisyalize Tout",
        resetHintLocked: "Reyinisyalizasyon ap disponib sèlman lè 6 tès yo fini.",
        resetHintReady: "Ou fini 6 tès yo. Ou ka reyinisyalize pou fè yo ankò.",
        confirmReset:
          "Reyinisyalize tout tès yo? Sa ap efase pwogrè Tès 1–6 sou aparèy sa a.",
      },
    };

    return t[lang] || t.en;
  }, [lang]);

  // Helper: derive per-test storage key (matches your ExamClient STORAGE_KEY)
  function makeStateKey(testId, langCode) {
    return `cna_exam_state::form_001::test_${testId}::${langCode}`;
  }

  /// Determine statuses by inspecting localStorage
useEffect(() => {
  // If lang is provided in the URL, treat it as the active pilot language
  const urlLang = sp.get("lang");
  if (urlLang === "en" || urlLang === "es" || urlLang === "fr" || urlLang === "ht") {
    try {
      localStorage.setItem("cna_pilot_lang", urlLang);
    } catch {}
    setLang(urlLang);
  } else {
    // Otherwise fall back to saved pilot lang
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
      for (let n = 1; n <= 6; n++) {
        const key = makeStateKey(n, (() => {
          try {
            const savedLang = localStorage.getItem("cna_pilot_lang");
            if (savedLang === "en" || savedLang === "es" || savedLang === "fr" || savedLang === "ht") return savedLang;
          } catch {}
          return "en";
        })());

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
        if (mode === "finished" || mode === "time_expired") {
          next[n] = "completed";
        } else {
          next[n] = "in_progress";
        }
      }
    } catch {
      // If anything goes wrong, leave as-is
    }
    setTestStatus(next);
  }

  const allCompleted = useMemo(() => {
    return [1, 2, 3, 4, 5, 6].every((n) => testStatus[n] === "completed");
  }, [testStatus]);

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
      const langCode = lang;

      for (let n = 1; n <= 6; n++) {
        // Clear exam state for that test+lang
        const key = makeStateKey(n, langCode);
        localStorage.removeItem(key);

        // Also clear analytics payload if present:
        // We don't know attempt_id here, so we clear all cna:results:* keys (pilot-only safe).
        // If you want to be extra strict later, we can track attempt_id per test.
      }

      // Remove ALL stored analytics results on this device (pilot reset)
      Object.keys(localStorage).forEach((k) => {
        if (k.startsWith("cna:results:")) localStorage.removeItem(k);
      });
    } catch {}

    // Refresh
    refreshStatuses();
  }

  // Simple styles (match your current look)
  const container = { maxWidth: 900, margin: "0 auto", padding: 20 };
  const btn = {
    padding: "14px",
    fontSize: "16px",
    borderRadius: "10px",
    border: "1px solid #9aa8b5",
    background: "#f4f6f8",
    cursor: "pointer",
  };

  const btnDisabled = {
    ...btn,
    opacity: 0.45,
    cursor: "not-allowed",
  };

  return (
    <div style={container}>
      <h1 style={{ fontSize: 28, marginBottom: 8 }}>{TEXT.title}</h1>

      <div style={{ color: "#444", marginBottom: 14 }}>
        <strong>{TEXT.language}:</strong>{" "}
        {lang === "es" ? "Español" : lang === "fr" ? "Français" : lang === "ht" ? "Kreyòl Ayisyen" : "English"}
        <span style={{ marginLeft: 12 }}>
          <button
            onClick={() => router.push("/?force_lang=1")}
            style={{
              padding: "6px 10px",
              fontSize: "13px",
              borderRadius: "10px",
              border: "1px solid #9aa8b5",
              background: "#f4f6f8",
              cursor: "pointer",
            }}
          >
            {lang === "es"
  ? "Volver al inicio"
  : lang === "fr"
  ? "Retour au début"
  : lang === "ht"
  ? "Retounen nan kòmansman"
  : "Return to Start"}

          </button>
        </span>
      </div>

      <p style={{ color: "#444", lineHeight: 1.6, marginBottom: 18 }}>{TEXT.subtitle}</p>

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
        {[1, 2, 3, 4, 5, 6].map((n) => {
          const status = testStatus[n];

          if (status === "completed") {
            return (
              <button key={n} disabled style={btnDisabled} title="Completed">
                {TEXT.completed(n)}
              </button>
            );
          }

          const label = status === "in_progress" ? TEXT.resume(n) : TEXT.start(n);

          return (
            <button key={n} onClick={() => startOrResume(n)} style={btn}>
              {label}
            </button>
          );
        })}
      </div>

      <div style={{ marginTop: 18, paddingTop: 14, borderTop: "1px solid #e2ebf4" }}>
        <button
          onClick={resetAll}
          disabled={!allCompleted}
          style={{
            padding: "12px 14px",
            fontSize: "14px",
            borderRadius: "10px",
            border: "1px solid #9aa8b5",
            background: allCompleted ? "#2b6cb0" : "#f4f6f8",
            color: allCompleted ? "white" : "#666",
            cursor: allCompleted ? "pointer" : "not-allowed",
            fontWeight: 700,
          }}
        >
          {TEXT.resetAll}
        </button>

        <div style={{ marginTop: 10, fontSize: 12, color: "#555" }}>
          {allCompleted ? TEXT.resetHintReady : TEXT.resetHintLocked}
        </div>
      </div>
    </div>
  );
}
export default function PilotPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <PilotInner />
    </Suspense>
  );
}
