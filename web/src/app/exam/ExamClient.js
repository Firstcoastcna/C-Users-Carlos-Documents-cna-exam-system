"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { scoreExam } from "../lib/scoring";
import { finalizeAttemptAnalytics } from "../lib/finalizeAttemptAnalytics";


export default function ExamClient({ form, bankById, lang }) {
  const router = useRouter();
  
function generateAttemptId() {
    return `att_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  }

const CHAPTER_NAMES = {
  1: "Role of the Nursing Assistant",
  2: "Promotion of Safety",
  3: "Promotion of Function and Health of Residents",
  4: "Basic Care Provided by the Nursing Assistant",
  5: "Providing Specialized Care for Residents with Changes in Health",
};

const UI_TEXT = {
  en: {
    resultsPage: "RESULTS PAGE",
    analytics: "ANALYTICS",
    readiness: "Readiness",
    readinessAssessment: "Readiness Assessment",
    categoryDiagnosis: "Category Diagnosis",
    whatToStudyNext: "What to Study Next",
    backToResults: "Back to Results",
    reviewQuestions: "Review Questions",
    exitToHome: "Exit to Home",
    resultsOnly: "Results",
    scoreLine: (percent, didPass) => `Score: ${percent}% – ${didPass ? "Pass" : "Fail"}`,
    onceEnded: "Once the exam is ended, answers cannot be changed.",
    analyticsIntro:
      "This section analyzes your exam performance to help guide your next study steps. It does not affect your exam score or result.",
    categoryExplainer:
      "Categories reflect decision patterns, not isolated mistakes. A single question can influence more than one category. Use this to understand how you approached decisions—not just what you missed.",
    chapterExplainer:
  "Each question below represents a key idea the exam is testing. These questions help you understand what the exam is asking, why it matters for resident safety, and which chapters you should review. Start with the Primary chapters, then reinforce with the Secondary ones.",
    colStrengths: "Strengths",
    colWeaknesses: "Weaknesses",
    colHighRisk: "High Risk",
    noneStrengths: "No strengths identified yet.",
    noneWeaknesses: "No weaknesses identified.",
    noneHighRisk: "No high-risk categories flagged.",
    total: "Total",
    correct: "Correct",
    incorrect: "Incorrect",
    unanswered: "Unanswered",
    scoreByChapter: "Score by Chapter",
    scoreByChapterHint: "(Correct Answers / Total Questions)",
    examPerformanceInsights: "Exam Performance Insights",
    statusOnTrack: "On Track",
    statusBorderline: "Borderline",
    statusHighRisk: "High Risk",
    readinessNarrative: {
    onTrack: "Your performance is trending in the right direction. Keep practicing to reinforce consistency across topics.",
    borderline: "You are close, but a few weak areas are holding you back. Focus your study on the categories and chapters below.",
    highRisk: "Your results show several high-risk gaps. Use the guidance below to study the most important areas first.",
    },
confirmExitTitle: "Confirm Exit",
confirmExitLead: "You have requested to exit this test.",
confirmExitQuestion: "Are you sure you want to exit?",
confirmExitExplanation:
  "Selecting YES will exit your test. Selecting NO will allow you to continue with your test.",

confirmEndTitle: "Confirm End of Test",
confirmEndLead: "You have requested to end and score this test.",
confirmEndQuestion: "Are you sure you want to end the test?",
confirmEndExplanation:
  "Selecting YES will end your test. Selecting NO will allow you to continue with your test.",

timeExpiredTitle: "Time Expired",
timeExpiredHeadline: "Time ran out.",
timeExpiredExplanation:
  "Your test has come to an end. To see your results, click the button below.",
  },

  es: {
    resultsPage: "RESULTADOS",
    analytics: "ANÁLISIS",
    readiness: "Preparación",
    readinessAssessment: "Evaluación de preparación",
    categoryDiagnosis: "Diagnóstico por categoría",
    whatToStudyNext: "Qué estudiar después",
    backToResults: "Volver a resultados",
    reviewQuestions: "Revisar preguntas",
    exitToHome: "Salir al inicio",
    resultsOnly: "Resultados",
    scoreLine: (percent, didPass) => `Puntaje: ${percent}% – ${didPass ? "Aprobado" : "No aprobado"}`,
    onceEnded: "Una vez finalizado el examen, las respuestas no se pueden cambiar.",
    analyticsIntro:
      "Esta sección analiza tu desempeño para guiar tus próximos pasos de estudio. No afecta tu puntaje ni tu resultado.",
    categoryExplainer:
      "Las categorías reflejan patrones de decisión, no errores aislados. Una sola pregunta puede influir en más de una categoría. Úsalo para entender cómo tomaste decisiones, no solo qué fallaste.",
    chapterExplainer:
  "Cada pregunta que ves abajo representa una idea clave que el examen evalúa. Estas preguntas te ayudan a entender qué está poniendo a prueba el examen, por qué es importante para la seguridad del residente y qué capítulos debes repasar. Comienza con los capítulos Primarios y luego refuerza con los Secundarios.",
    colStrengths: "Fortalezas",
    colWeaknesses: "Debilidades",
    colHighRisk: "Alto riesgo",
    noneStrengths: "Aún no se identifican fortalezas.",
    noneWeaknesses: "No se identifican debilidades.",
    noneHighRisk: "No hay categorías de alto riesgo.",
    total: "Total",
    correct: "Correctas",
    incorrect: "Incorrectas",
    unanswered: "Sin responder",
    scoreByChapter: "Puntaje por capítulo",
    scoreByChapterHint: "(Respuestas correctas / Total de preguntas)",
    examPerformanceInsights: "Conclusiones del rendimiento",
    statusOnTrack: "En buen camino",
    statusBorderline: "Al límite",
    statusHighRisk: "Alto riesgo",
    readinessNarrative: {
    onTrack: "Tu desempeño va en la dirección correcta. Sigue practicando para reforzar la consistencia en los temas.",
    borderline: "Estás cerca, pero algunas áreas débiles te están frenando. Enfócate en las categorías y capítulos de abajo.",
    highRisk: "Tus resultados muestran varias brechas de alto riesgo. Usa la guía de abajo para estudiar primero lo más importante.",
    },
confirmExitTitle: "Confirmar salir del examen",
confirmExitLead: "Has solicitado salir de este examen.",
confirmExitQuestion: "¿Estás seguro de que deseas salir?",
confirmExitExplanation:
  "Seleccionar SÍ saldrá del examen. Seleccionar NO te permitirá continuar.",

confirmEndTitle: "Confirmar fin del examen",
confirmEndLead: "Has solicitado finalizar y calificar este examen.",
confirmEndQuestion: "¿Estás seguro de que deseas finalizar el examen?",
confirmEndExplanation:
  "Seleccionar SÍ finalizará el examen. Seleccionar NO te permitirá continuar.",

timeExpiredTitle: "Tiempo agotado",
timeExpiredHeadline: "Se acabó el tiempo.",
timeExpiredExplanation:
  "Tu examen ha finalizado. Para ver tus resultados, haz clic en el botón de abajo.",
  },

  fr: {
    resultsPage: "RÉSULTATS",
    analytics: "ANALYSE",
    readiness: "Préparation",
    readinessAssessment: "Évaluation de préparation",
    categoryDiagnosis: "Diagnostic par catégorie",
    whatToStudyNext: "Quoi étudier ensuite",
    backToResults: "Retour aux résultats",
    reviewQuestions: "Revoir les questions",
    exitToHome: "Quitter vers l’accueil",
    resultsOnly: "Résultats",
    scoreLine: (percent, didPass) => `Score : ${percent}% – ${didPass ? "Réussi" : "Échoué"}`,
    onceEnded: "Une fois l’examen terminé, les réponses ne peuvent plus être modifiées.",
    analyticsIntro:
      "Cette section analyse vos résultats pour guider vos prochaines étapes d’étude. Elle n’affecte pas votre score ni votre résultat.",
    categoryExplainer:
      "Les catégories reflètent des schémas de décision, pas des erreurs isolées. Une seule question peut influencer plusieurs catégories. Utilisez ceci pour comprendre comment vous avez décidé, pas seulement ce que vous avez manqué.",
    chapterExplainer:
  "Chaque question ci-dessous représente une idée clé évaluée par l’examen. Ces questions vous aident à comprendre ce que l’examen cherche à mesurer, pourquoi c’est important pour la sécurité du résident et quels chapitres vous devez réviser. Commencez par les chapitres Principaux, puis renforcez avec les Secondaires.",
    colStrengths: "Forces",
    colWeaknesses: "Faiblesses",
    colHighRisk: "Risque élevé",
    noneStrengths: "Aucune force identifiée pour l’instant.",
    noneWeaknesses: "Aucune faiblesse identifiée.",
    noneHighRisk: "Aucune catégorie à risque élevé.",
    total: "Total",
    correct: "Correct",
    incorrect: "Incorrect",
    unanswered: "Sans réponse",
    scoreByChapter: "Score par chapitre",
    scoreByChapterHint: "(Réponses correctes / Total des questions)",
    examPerformanceInsights: "Aperçu de vos performances",
    statusOnTrack: "Sur la bonne voie",
    statusBorderline: "Limite",
    statusHighRisk: "Risque élevé",
    readinessNarrative: {
    onTrack: "Vos performances vont dans la bonne direction. Continuez à pratiquer pour renforcer la régularité sur les thèmes.",
    borderline: "Vous êtes proche, mais quelques faiblesses vous freinent. Concentrez votre étude sur les catégories et chapitres ci-dessous.",
    highRisk: "Vos résultats montrent plusieurs lacunes à risque élevé. Utilisez la guidance ci-dessous pour étudier d’abord l’essentiel.",
  },
  confirmExitTitle: "Confirmer la sortie",
confirmExitLead: "Vous avez demandé à quitter cet examen.",
confirmExitQuestion: "Êtes-vous sûr de vouloir quitter l’examen ?",
confirmExitExplanation:
  "Sélectionner OUI quittera l’examen. Sélectionner NON vous permettra de continuer.",

confirmEndTitle: "Confirmer la fin de l’examen",
confirmEndLead: "Vous avez demandé de terminer et de noter cet examen.",
confirmEndQuestion: "Êtes-vous sûr de vouloir terminer l’examen ?",
confirmEndExplanation:
  "Sélectionner OUI mettra fin à l’examen. Sélectionner NON vous permettra de continuer.",

timeExpiredTitle: "Temps écoulé",
timeExpiredHeadline: "Le temps est écoulé.",
timeExpiredExplanation:
  "Votre examen est terminé. Pour voir vos résultats, cliquez sur le bouton ci-dessous.",
  },

  ht: {
    resultsPage: "REZILTA",
    analytics: "ANALIZ",
    readiness: "Preparasyon",
    readinessAssessment: "Evalyasyon preparasyon",
    categoryDiagnosis: "Dyagnostik pa kategori",
    whatToStudyNext: "Sa pou etidye apre",
    backToResults: "Tounen nan rezilta yo",
    reviewQuestions: "Revize kesyon yo",
    exitToHome: "Soti pou ale lakay",
    resultsOnly: "Rezilta",
    scoreLine: (percent, didPass) => `Nòt: ${percent}% – ${didPass ? "Pase" : "Pa pase"}`,
    onceEnded: "Lè egzamen an fini, ou pa ka chanje repons yo ankò.",
    analyticsIntro:
      "Seksiyon sa a analize pèfòmans ou pou gide pwochen etap etid ou. Li pa chanje nòt oswa rezilta ou.",
    categoryExplainer:
      "Kategori yo montre fason ou pran desizyon, pa sèlman yon sèl erè. Yon kesyon ka afekte plis pase yon kategori. Sèvi avè l pou konprann kijan ou te pran desizyon yo, pa sèlman sa ou rate.",
    chapterExplainer:
  "Chak kesyon ki anba a reprezante yon ide enpòtan egzamen an ap evalye. Kesyon sa yo ede w konprann sa egzamen an ap teste, poukisa sa enpòtan pou sekirite rezidan an, epi ki chapit ou dwe revize. Kòmanse ak chapit Prensipal yo, epi kontinye ak chapit Segondè yo.",
    colStrengths: "Fòs",
    colWeaknesses: "Feblès",
    colHighRisk: "Gwo risk",
    noneStrengths: "Poko gen fòs ki idantifye.",
    noneWeaknesses: "Pa gen feblès ki idantifye.",
    noneHighRisk: "Pa gen kategori gwo risk.",
    total: "Total",
    correct: "Kòrèk",
    incorrect: "Enkòrèk",
    unanswered: "San repons",
    scoreByChapter: "Nòt pa chapit",
    scoreByChapterHint: "(Repons kòrèk / Total kesyon)",
    examPerformanceInsights: "Rezime sou pèfòmans egzamen an",
    statusOnTrack: "Sou bon chimen",
    statusBorderline: "Sou limit",
    statusHighRisk: "Gwo risk",
    readinessNarrative: {
    onTrack: "Pèfòmans ou ap amelyore nan bon sans lan. Kontinye pratike pou ranfòse regilarite atravè sijè yo.",
    borderline: "Ou pre, men kèk feblès ap kenbe w dèyè. Konsantre sou kategori ak chapit ki anba yo.",
    highRisk: "Rezilta ou yo montre plizyè gwo mank ki gen gwo risk. Sèvi ak gid ki anba a pou etidye sa ki pi enpòtan an an premye.",
  },
confirmExitTitle: "Konfime sòti",
confirmExitLead: "Ou mande pou sòti nan egzamen sa a.",
confirmExitQuestion: "Èske ou sèten ou vle sòti?",
confirmExitExplanation:
  "Chwazi WI ap fè ou sòti nan egzamen an. Chwazi NON ap pèmèt ou kontinye.",

confirmEndTitle: "Konfime fen egzamen an",
confirmEndLead: "Ou mande pou fini epi nòt egzamen sa a.",
confirmEndQuestion: "Èske ou sèten ou vle fini egzamen an?",
confirmEndExplanation:
  "Chwazi WI ap fini egzamen an. Chwazi NON ap pèmèt ou kontinye.",

timeExpiredTitle: "Tan fini",
timeExpiredHeadline: "Tan an fini.",
timeExpiredExplanation:
  "Egzamen ou fini. Pou wè rezilta yo, klike sou bouton ki anba a.",

  },
};

// safe fallback
const T = UI_TEXT[lang] || UI_TEXT.en;


// ----------------------------
  // Random selection helpers (NEW)
  // ----------------------------
  function shuffleArray(arr) {
    const a = [...arr];
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i];
      a[i] = a[j];
      a[j] = tmp;
    }
    return a;
  }

  // Picks N questions per chapter from the pool of form.question_ids,
  // using bankById[qid].chapter_tag (number).
  function pickQuestionsPerChapter({ perChapter, chapterTags }) {
    const pool = Object.keys(bankById);

    const byChapter = {};
    chapterTags.forEach((ch) => {
      byChapter[ch] = [];
    });

    // Group pool by chapter_tag
    pool.forEach((qid) => {
      const q = bankById[qid];
      if (!q) return;
      const ch = q.chapter_tag;
      if (byChapter[ch]) byChapter[ch].push(qid);
    });
   
    console.log("UNSEEN PER CHAPTER:", {
  1: byChapter[1].length,
  2: byChapter[2].length,
  3: byChapter[3].length,
  4: byChapter[4].length,
  5: byChapter[5].length,
});

    // For each chapter: shuffle and take perChapter
    let picked = [];
chapterTags.forEach((ch) => {
  const shuffled = shuffleArray(byChapter[ch]);
  picked.push(...shuffled.slice(0, perChapter));
});

// If we came up short (chapter ran low), fill from any remaining unseen
const targetTotal = perChapter * chapterTags.length; // 10
if (picked.length < targetTotal) {
  const pickedSet = new Set(picked);
  const remaining = shuffleArray(pool.filter((qid) => !pickedSet.has(qid)));
  const need = targetTotal - picked.length;
  picked = picked.concat(remaining.slice(0, need));
}

    // Final shuffle across chapters so they’re mixed
    return shuffleArray(picked);
  }

const [testId, setTestId] = useState(() => {
  try {
    const raw = localStorage.getItem("cna_pilot_test_id");
    const n = Number(raw);
    if (Number.isFinite(n) && n >= 1 && n <= 6) return n;
  } catch {}
  return 1;
});


  // ----------------------------
  // LocalStorage persistence
  // ----------------------------
  const STORAGE_KEY = useMemo(() => {
    return `cna_exam_state::${form.exam_form_id}::test_${testId}::${lang}`;
  }, [form.exam_form_id, testId, lang]);

  function safeReadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function safeWriteState(next) {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

function pauseAndPersist() {
  try {
    // Don't pause once exam is already over
    if (mode === "finished" || mode === "time_expired" || mode === "rationales" || mode === "analytics") return;

    // If timer isn't initialized yet, do nothing
    if (!endAtMs || typeof endAtMs !== "number") return;

    const now = Date.now();
    const sec = Math.max(0, Math.ceil((endAtMs - now) / 1000));

    safeWriteState({
      attempt_id: attemptId,
      exam_form_id: form.exam_form_id,
      question_ids: deliveredQuestionIds,
      lang,
      index,
      answersByQid,
      reviewByQid,
      mode,
      summaryPage,
      summaryFilter,
      pausedRemainingSec: sec,
      endAtMs, // keep for now; resume will override using pausedRemainingSec
    });
  } catch {}
}

  // ----------------------------
  // State
  // ----------------------------
  const [attemptId, setAttemptId] = useState(null);
  const [index, setIndex] = useState(0);
  const [deliveredQuestionIds, setDeliveredQuestionIds] = useState([]);
  const [answersByQid, setAnswersByQid] = useState({});
  const [reviewByQid, setReviewByQid] = useState({});
  const [resultsPayload, setResultsPayload] = useState(null);
  const [analyticsUnavailable, setAnalyticsUnavailable] = useState(false);
  

  const total = deliveredQuestionIds.length;

  // "exam" | "review" | "confirm_end" | "confirm_exit" | "time_expired" | "finished" | "rationales"
  const [mode, setMode] = useState("exam");
  const [rationaleChapter, setRationaleChapter] = useState(1);

  const [exitReturnMode, setExitReturnMode] = useState("exam");

  // SUMMARY paging + filter (locked by you)
  const PAGE_SIZE = 5;
  const TOTAL_PAGES = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const [summaryPage, setSummaryPage] = useState(1);
  const [summaryFilter, setSummaryFilter] = useState("all"); // all | answered | unanswered | marked

  // TIMER: 90-minute countdown (Prometric style)
  // For testing, temporarily set START_SEC = 30
  const START_SEC = 60*90; // 5400

  const [endAtMs, setEndAtMs] = useState(null);
  const [remainingSec, setRemainingSec] = useState(START_SEC);

  // ----------------------------
  // Theme / buttons
  // ----------------------------
  const theme = {
    frameBorder: "#9fb2c7",
    chromeBg: "#e9f0f7",
    chromeBorder: "#b7c6d6",
    primaryBg: "#2b6cb0",
    primaryText: "white",
    secondaryBg: "#f4f6f8",
    secondaryText: "#1a1a1a",
    buttonBorder: "#9aa8b5",
    link: "#1f6fb2",
  };

  const btnBase = {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: `1px solid ${theme.buttonBorder}`,
    cursor: "pointer",
  };

  const btnSecondary = {
    ...btnBase,
    background: theme.secondaryBg,
    color: theme.secondaryText,
  };

  const btnPrimary = {
    ...btnBase,
    background: theme.primaryBg,
    color: theme.primaryText,
    border: `1px solid ${theme.primaryBg}`,
  };

  const btnExit = {
    ...btnSecondary,
    padding: "6px 10px",
    fontSize: "12px",
    opacity: 0.85,
  };

  function formatRemaining(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return `${mm}:${ss}`;
  }

  // ----------------------------
  // Load saved state on first mount
  // ----------------------------
  useEffect(() => {
  const saved = safeReadState();
  const now = Date.now();

  // 🔒 LANGUAGE MISMATCH → HARD RESET EXAM STATE
  if (
    saved &&
    saved.exam_form_id === form.exam_form_id &&
    Array.isArray(saved.question_ids) &&
    saved.lang &&
    saved.lang !== lang
  ) {
    setIndex(0);
    setAnswersByQid({});
    setReviewByQid({});
    setSummaryPage(1);
    setSummaryFilter("all");
    setMode("exam");

    const computedEndAt = now + START_SEC * 1000;
    setEndAtMs(computedEndAt);
    setRemainingSec(START_SEC);
    return;
  }

  // 🔹 NORMAL RESTORE (same language)
 if (saved && saved.exam_form_id === form.exam_form_id && Array.isArray(saved.question_ids)) {
  if (saved.attempt_id) setAttemptId(saved.attempt_id);

  setDeliveredQuestionIds(saved.question_ids);

    if (typeof saved.index === "number") setIndex(saved.index);
    if (saved.answersByQid && typeof saved.answersByQid === "object")
      setAnswersByQid(saved.answersByQid);
    if (saved.reviewByQid && typeof saved.reviewByQid === "object")
      setReviewByQid(saved.reviewByQid);

    if (typeof saved.mode === "string") {
      setMode(saved.mode === "confirm_exit" ? "exam" : saved.mode);
    }

    if (typeof saved.summaryPage === "number") setSummaryPage(saved.summaryPage);
    if (typeof saved.summaryFilter === "string") setSummaryFilter(saved.summaryFilter);

  // ✅ PAUSE-FRIENDLY RESUME:
// If we saved a pausedRemainingSec snapshot, rebuild endAtMs from "now".
if (typeof saved.pausedRemainingSec === "number") {
  const sec = Math.max(0, Math.floor(saved.pausedRemainingSec));
  const computedEndAt = now + sec * 1000;

  setEndAtMs(computedEndAt);
  setRemainingSec(sec);

  // Clear the paused snapshot so it doesn't keep re-applying every time
  safeWriteState({ ...saved, pausedRemainingSec: undefined, endAtMs: computedEndAt });
} else if (typeof saved.endAtMs === "number") {
  setEndAtMs(saved.endAtMs);
  const sec = Math.max(0, Math.ceil((saved.endAtMs - now) / 1000));
  setRemainingSec(sec);

  if (sec === 0 && saved.mode !== "finished") {
    setMode("time_expired");
  }
} else {
  const computedEndAt = now + START_SEC * 1000;
  setEndAtMs(computedEndAt);
  setRemainingSec(START_SEC);
}

  } else {
  const newAttemptId = generateAttemptId();
  setAttemptId(newAttemptId);

  const picked = pickQuestionsPerChapter({
    perChapter: 12,
    chapterTags: [1, 2, 3, 4, 5],
  });
  setDeliveredQuestionIds(picked);

  const computedEndAt = now + START_SEC * 1000;
  setEndAtMs(computedEndAt);
  setRemainingSec(START_SEC);
}
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [STORAGE_KEY, form.exam_form_id, lang]);

  // ----------------------------
  // Tick countdown (based on endAtMs)
  // ----------------------------
  useEffect(() => {
    if (!endAtMs) return;
    if (mode === "finished" || mode === "time_expired" || mode === "rationales" ||
  mode === "analytics") return;

    const id = setInterval(() => {
      const now = Date.now();
      const sec = Math.max(0, Math.ceil((endAtMs - now) / 1000));
      setRemainingSec(sec);
    }, 1000);

    return () => clearInterval(id);
  }, [endAtMs, mode]);

  // Auto-switch to time_expired when time hits 0
// Allow finished + time_expired + rationales to stay where they are.
useEffect(() => {
  if (
    remainingSec === 0 &&
    mode !== "finished" &&
    mode !== "time_expired" &&
    mode !== "rationales" &&
    mode !== "analytics"
  ) {
    setMode("time_expired");
  }
}, [remainingSec, mode]);

  // ----------------------------
  // Persist state whenever it changes
  // ----------------------------
  useEffect(() => {
  if (!endAtMs) return;

  safeWriteState({
    attempt_id: attemptId,
    exam_form_id: form.exam_form_id,
    question_ids: deliveredQuestionIds,
    lang,

    index,
    answersByQid,
    reviewByQid,
    mode,

    summaryPage,
    summaryFilter,

    pausedRemainingSec: undefined,
    endAtMs,
  });
}, [
  endAtMs,
  attemptId,
  form.exam_form_id,
  deliveredQuestionIds,
  lang,
  index,
  answersByQid,
  reviewByQid,
  mode,
  summaryPage,
  summaryFilter,
]);

// ----------------------------
// Pause timer when leaving /exam (close tab, refresh, route change)
// ----------------------------
useEffect(() => {
  const onPageHide = () => pauseAndPersist();
  window.addEventListener("pagehide", onPageHide);

  return () => {
    window.removeEventListener("pagehide", onPageHide);
    pauseAndPersist(); // also runs on unmount / route change
  };
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [endAtMs, mode, index, answersByQid, reviewByQid, summaryPage, summaryFilter]);

// ----------------------------
// Pause timer immediately when confirm_exit opens (Back button intercept)
// ----------------------------
useEffect(() => {
  if (mode === "confirm_exit") {
    pauseAndPersist();
  }
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [mode]);



  // --------------------------------
  // Rationales Review Button Control 
  //----------------------------------

useEffect(() => {
  if (mode !== "rationales") return;

  // Count missed per chapter (missed = unanswered OR incorrect)
  const missedCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  deliveredQuestionIds.forEach((qid) => {
    const q = bankById[qid];
    if (!q) return;

    const ch = Number(q.chapter_tag);
    if (!missedCounts[ch]) return;

    const userAns = answersByQid[qid];
    const missed = !userAns || userAns !== q.correct_answer;
    if (missed) missedCounts[ch] += 1;
  });

  const firstWithMissed = [1, 2, 3, 4, 5].find((ch) => missedCounts[ch] > 0);

  // If current chapter has no missed questions, jump to the first chapter that does
  if (firstWithMissed && missedCounts[Number(rationaleChapter)] === 0) {
    setRationaleChapter(firstWithMissed);
  }
}, [mode, deliveredQuestionIds, bankById, answersByQid, rationaleChapter]);

// ----------------------------
// Results: load persisted analytics payload (read-only)
// ----------------------------
useEffect(() => {
  if (!attemptId) return;

  // Only try to load when user is on Results/Time Expired/Analytics screens.
  if (mode !== "finished" && mode !== "time_expired" && mode !== "analytics") return;

  let cancelled = false;

  function tryLoadOnce() {
    try {
      const raw = localStorage.getItem(`cna:results:${attemptId}`);
      if (!raw) return false;

      const parsed = JSON.parse(raw);
      if (!cancelled) setResultsPayload(parsed);
      return true;
    } catch {
      return false;
    }
  }

  // Try immediately first
  if (tryLoadOnce()) return;

  // Then retry briefly (covers the "write happens a moment after finished" case)
  const id = setInterval(() => {
    const ok = tryLoadOnce();
    if (ok) clearInterval(id);
  }, 200);

  // Stop after 2 seconds to avoid any runaway polling
  const stopId = setTimeout(() => clearInterval(id), 2000);

  return () => {
    cancelled = true;
    clearInterval(id);
    clearTimeout(stopId);
  };
}, [attemptId, mode]);

// ----------------------------
// Analytics: compute + write-once (post-exam only)
// ----------------------------
useEffect(() => {
  if (!attemptId) return;
  if (mode !== "finished" && mode !== "time_expired") return;

    const endStatus = mode === "finished" ? "submitted" : "time_expired";

  const res = finalizeAttemptAnalytics({
    attemptId,
    endStatus,
    deliveredQuestionIds,
    answersByQid,
    bankById,
  });

  if (!res.ok) {
    console.error("Analytics finalize failed:", res);
  }

}, [
  attemptId,
  mode,
  deliveredQuestionIds,
  answersByQid,
  bankById,
]);

  // ----------------------------
  // Browser close/refresh warning
  // ----------------------------
  useEffect(() => {
  if (mode === "finished" || mode === "time_expired") return;

  function onPopState() {
    // Trigger the SAME confirm exit behavior as the Exit button
    setExitReturnMode(mode);
    setMode("confirm_exit");

    // Push state back so user stays on /exam
    window.history.pushState(null, "", window.location.href);
  }

  // Push initial state so Back can be intercepted
  window.history.pushState(null, "", window.location.href);

  window.addEventListener("popstate", onPopState);
  return () => window.removeEventListener("popstate", onPopState);
}, [mode]);

  // ----------------------------
  // Helpers
  // ----------------------------
  function getDisplayBlocks(q) {
    const blocks = [];

    if (lang === "en") blocks.push({ label: "EN", v: q.variants.en });
    if (lang === "es") blocks.push({ label: "ES", v: q.variants.es });
    if (lang === "fr") {
      blocks.push({ label: "EN", v: q.variants.en });
      blocks.push({ label: "FR", v: q.variants.fr });
    }
    if (lang === "ht") {
      blocks.push({ label: "EN", v: q.variants.en });
      blocks.push({ label: "HT", v: q.variants.ht });
    }

    return blocks;
  }

  function getSummaryTextForLang(q) {
    if (lang === "en") return [{ label: "EN", text: q.variants.en.question_text }];
    if (lang === "es") return [{ label: "ES", text: q.variants.es.question_text }];
    if (lang === "fr") {
      return [
        { label: "EN", text: q.variants.en.question_text },
        { label: "FR", text: q.variants.fr.question_text },
      ];
    }
    if (lang === "ht") {
      return [
        { label: "EN", text: q.variants.en.question_text },
        { label: "HT", text: q.variants.ht.question_text },
      ];
    }
    return [{ label: "EN", text: q.variants.en.question_text }];
  }

  function getUiLines(key) {
    // Prometric-style UI language display
    // EN -> English only
    // ES -> Spanish only
    // FR -> English + French
    // HT -> English + Haitian Creole
    if (lang === "fr") {
      return [
        { label: "EN", text: UI_TEXT.en[key] },
        { label: "FR", text: UI_TEXT.fr[key] },
      ];
    }
    if (lang === "ht") {
      return [
        { label: "EN", text: UI_TEXT.en[key] },
        { label: "HT", text: UI_TEXT.ht[key] },
      ];
    }
    if (lang === "es") {
      return [{ label: "ES", text: UI_TEXT.es[key] }];
    }
    return [{ label: "EN", text: UI_TEXT.en[key] }];
  }


  function openExitConfirm(fromMode) {
    setExitReturnMode(fromMode);
    setMode("confirm_exit");
  }

  // ----------------------------
  // FINISHED (SCORING + PERCENT) — Prometric-like framing
  // ----------------------------
  if (mode === "finished") {

    const formForScoring = { ...form, question_ids: deliveredQuestionIds };
const result = scoreExam({ form: formForScoring, bankById, answersByQid });
    const percent = result.total === 0 ? 0 : Math.round((result.correct / result.total) * 100);

const PASS_THRESHOLD = 80;
const didPass = percent >= PASS_THRESHOLD;

const CHAPTER_NAMES_BY_LANG = {
  en: {
    1: "Role of the Nursing Assistant",
    2: "Promotion of Safety",
    3: "Promotion of Function and Health of Residents",
    4: "Basic Care Provided by the Nursing Assistant",
    5: "Providing Specialized Care for Residents with Changes in Health",
  },
  es: {
    1: "Rol del asistente de enfermería",
    2: "Promoción de la seguridad",
    3: "Promoción de la función y la salud de los residentes",
    4: "Cuidado básico proporcionado por el asistente de enfermería",
    5: "Atención especializada para residentes con cambios en la salud",
  },
  fr: {
    1: "Rôle de l’aide-soignant(e)",
    2: "Promotion de la sécurité",
    3: "Promotion de la fonction et de la santé des résidents",
    4: "Soins de base fournis par l’aide-soignant(e)",
    5: "Soins spécialisés pour les résidents ayant des changements de santé",
  },
  ht: {
    1: "Wòl asistan enfimyè a",
    2: "Pwomosyon sekirite",
    3: "Pwomosyon fonksyon ak sante rezidan yo",
    4: "Swen debaz asistan enfimyè a bay",
    5: "Swen espesyalize pou rezidan ki gen chanjman nan sante",
  },
};

// Use single-language chapter names for Results/Analytics
const CHAPTER_NAMES = (CHAPTER_NAMES_BY_LANG[lang] || CHAPTER_NAMES_BY_LANG.en);


const chapterStats = {
  1: { correct: 0, total: 0 },
  2: { correct: 0, total: 0 },
  3: { correct: 0, total: 0 },
  4: { correct: 0, total: 0 },
  5: { correct: 0, total: 0 },
};

deliveredQuestionIds.forEach((qid) => {
  const q = bankById[qid];
  if (!q) return;

  const ch = Number(q.chapter_tag);
  if (!chapterStats[ch]) return;

  chapterStats[ch].total += 1;

  const userAns = answersByQid[qid];
  if (userAns && userAns === q.correct_answer) {
    chapterStats[ch].correct += 1;
  }
});

    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            height: "675px",
            border: `2px solid ${theme.frameBorder}`,
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "white",
            marginTop: "20px",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
              fontWeight: "bold",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span>{T.resultsPage}</span>
                      </div>

          <div
  style={{
    flex: 1,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "18px",
    textAlign: "center",
    overflowY: "auto",
  }}
>
            <div style={{ maxWidth: "720px", width: "100%" }}>
              <div
  style={{
    fontSize: "30px",
    fontWeight: "bold",
    marginBottom: "12px",
    color: didPass ? "green" : "red",
  }}
>
  {T.scoreLine(percent, didPass)}

  {resultsPayload?.overall_status && (
  <div
    style={{
      fontSize: "16px",
      color: "#333",
      marginBottom: "16px",
    }}
  >
    {T.readinessAssessment}:{" "}
    <span style={{ fontWeight: "600", color: "#222" }}>
      {resultsPayload.overall_status === "On Track"
  ? T.statusOnTrack
  : resultsPayload.overall_status === "High Risk"
  ? T.statusHighRisk
  : T.statusBorderline}
    </span>
  </div>
)}

</div>

              <div
                style={{
                  maxWidth: "640px",
                  margin: "0 auto",
                  border: "1px solid #d4dee8",
                  borderRadius: "12px",
                  background: "#fbfdff",
                  padding: "14px",
                  textAlign: "left",
                }}
              >
                <div style={{ fontSize: "14px", lineHeight: "1.9" }}>
                  <div><strong>{T.total}:</strong> {result.total}</div>
                  <div><strong>{T.correct}:</strong> {result.correct}</div>
                  <div><strong>{T.incorrect}:</strong> {result.incorrect}</div>
                  <div><strong>{T.unanswered}:</strong> {result.unanswered}</div>
                </div>

                <div style={{ marginTop: "14px" }}>
  <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
    {T.scoreByChapter}
  </div>

  <div style={{ fontSize: "12px", color: "#555", marginBottom: "10px" }}>
    {T.scoreByChapterHint}
  </div>

  {[1, 2, 3, 4, 5].map((ch) => (
    <div key={ch} style={{ fontSize: "16px", marginBottom: "6px" }}>
      {CHAPTER_NAMES[ch]}:{" "}
      <strong>
        {chapterStats[ch].correct} / {chapterStats[ch].total}
      </strong>
    </div>
  ))}
</div>

</div>
         </div>
          </div>

          <div
  style={{
    display: "flex",
    justifyContent: "flex-end",
    gap: "10px",
    borderTop: `1px solid ${theme.chromeBorder}`,
    padding: "12px 14px",
    background: theme.chromeBg,
  }}
>
  <button
    onClick={() => {
  setRationaleChapter(1);
  setMode("rationales");
}}
    style={{ ...btnPrimary, minWidth: "180px" }}
  >
    {T.reviewQuestions}
  </button>

<button
  onClick={() => {
    const key = attemptId ? `cna:results:${attemptId}` : null;
    const hasPayload = !!(key && localStorage.getItem(key));

    if (!hasPayload) {
      setAnalyticsUnavailable(true);
      return;
    }

    setAnalyticsUnavailable(false);
    setMode("analytics");
  }}
  style={{
    ...btnSecondary,
    minWidth: "160px",
    color: "red",
    border: "1px solid red",
    fontWeight: "bold",
  }}
>
  {T.analytics}
</button>


  <button
    onClick={() => {
  router.push("/pilot");
}}

    style={{ ...btnSecondary, minWidth: "160px" }}
  >
    {T.exitToHome}
  </button>
</div>
        </div>
      </div>
    );
  }

  // ----------------------------
  // TIME EXPIRED (NO TIMER)
  // ----------------------------
  if (mode === "time_expired") {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
            {getUiLines("timeExpiredTitle").map((l) => l.text).join(" / ")}
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: "720px" }}>
              <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "12px" }}>
                {getUiLines("timeExpiredHeadline").map((l) => (
  <div key={l.label}>{l.text}</div>
))}
              </div>

              <div style={{ marginBottom: "18px" }}>
                {getUiLines("timeExpiredExplanation").map((l) => (
  <div key={l.label}>{l.text}</div>
))}
              </div>

              <button onClick={() => setMode("finished")} style={{ ...btnPrimary, minWidth: "220px" }}>
                {T.resultsOnly}
              </button>
            </div>
          </div>

          <div
            style={{
              borderTop: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
            }}
          />
        </div>
      </div>
    );
  }

// ----------------------------
// RATIONALES 
// ----------------------------

if (mode === "rationales") {

  // Count missed per chapter (missed = unanswered OR incorrect)
  const missedCounts = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  deliveredQuestionIds.forEach((qid) => {
    const q = bankById[qid];
    if (!q) return;

    const ch = Number(q.chapter_tag);
    if (missedCounts[ch] === undefined) return;

    const userAns = answersByQid[qid];
    const missed = !userAns || userAns !== q.correct_answer;
    if (missed) missedCounts[ch] += 1;
  });

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          height: "675px",
          border: `2px solid ${theme.frameBorder}`,
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "white",
          marginTop: "20px",
        }}
      >
        <div
          style={{
            borderBottom: `1px solid ${theme.chromeBorder}`,
            padding: "12px 14px",
            background: theme.chromeBg,
            fontWeight: "bold",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span style={{ lineHeight: "1.15" }}>
  {(() => {
    const ch = Number(rationaleChapter);

    const chapterNamesByLang = {
      en: {
        1: "Role of the Nursing Assistant",
        2: "Promotion of Safety",
        3: "Promotion of Function and Health of Residents",
        4: "Basic Care Provided by the Nursing Assistant",
        5: "Providing Specialized Care for Residents with Changes in Health",
      },
      es: {
        1: "Rol del asistente de enfermería",
        2: "Promoción de la seguridad",
        3: "Promoción de la función y la salud de los residentes",
        4: "Cuidado básico proporcionado por el asistente de enfermería",
        5: "Atención especializada para residentes con cambios en la salud",
      },
      fr: {
        1: "Rôle de l’aide-soignant(e)",
        2: "Promotion de la sécurité",
        3: "Promotion de la fonction et de la santé des résidents",
        4: "Soins de base fournis par l’aide-soignant(e)",
        5: "Soins spécialisés pour les résidents ayant des changements de santé",
      },
      ht: {
        1: "Wòl asistan enfimyè a",
        2: "Pwomosyon sekirite",
        3: "Pwomosyon fonksyon ak sante rezidan yo",
        4: "Swen debaz asistan enfimyè a bay",
        5: "Swen espesyalize pou rezidan ki gen chanjman nan sante",
      },
    };

    const breakdownLabelByLang = {
      en: "QUESTION BREAKDOWN",
      es: "DESGLOSE DE PREGUNTAS",
      fr: "DÉTAIL DES QUESTIONS",
      ht: "DETAY KESYON YO",
    };

    const EN = chapterNamesByLang.en?.[ch] || `Chapter ${ch}`;
    const ES = chapterNamesByLang.es?.[ch] || `Capítulo ${ch}`;
    const FR = chapterNamesByLang.fr?.[ch] || `Chapitre ${ch}`;
    const HT = chapterNamesByLang.ht?.[ch] || `Chapit ${ch}`;

    const breakdown = breakdownLabelByLang[lang] || breakdownLabelByLang.en;

    // Display rule (no labels):
    // en -> EN
    // es -> ES
    // fr -> EN + FR
    // ht -> EN + HT
    const lines =
      lang === "fr" ? [EN, FR] :
      lang === "ht" ? [EN, HT] :
      lang === "es" ? [ES] :
      [EN];

   return (
  <div style={{ lineHeight: "1.3" }}>
    <div style={{ textTransform: "uppercase", fontWeight: "700" }}>
      {lines.join(" / ")}
    </div>
    <div style={{ marginTop: "4px" }}>
      {breakdown}
    </div>
  </div>
);


  })()}
</span>


        </div>

        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
  {(() => {
    const missedQids = deliveredQuestionIds.filter((qid) => {
  const q = bankById[qid];
  if (!q) return false;

  const ch = Number(q.chapter_tag);
  if (ch !== Number(rationaleChapter)) return false;

  const userAns = answersByQid[qid];
  if (!userAns) return true; // unanswered
  return userAns !== q.correct_answer; // incorrect
});

    if (missedQids.length === 0) {
      return <div style={{ fontSize: "14px", color: "#333" }}>No missed questions.</div>;
    }

    return missedQids.map((qid) => {
      const q = bankById[qid];
      if (!q) return null;

      const num = deliveredQuestionIds.indexOf(qid) + 1;
      const userAns = answersByQid[qid] || "";
      const correct = q.correct_answer || "";

      const blocks = getDisplayBlocks(q); // respects en/es/fr/ht rules
      const rationaleBlocks = [];
if (lang === "en") rationaleBlocks.push({ label: "EN", r: q.variants?.en?.rationale });
if (lang === "es") rationaleBlocks.push({ label: "ES", r: q.variants?.es?.rationale });
if (lang === "fr") {
  rationaleBlocks.push({ label: "EN", r: q.variants?.en?.rationale });
  rationaleBlocks.push({ label: "FR", r: q.variants?.fr?.rationale });
}
if (lang === "ht") {
  rationaleBlocks.push({ label: "EN", r: q.variants?.en?.rationale });
  rationaleBlocks.push({ label: "HT", r: q.variants?.ht?.rationale });
}

      return (
        <div
          key={qid}
          style={{
            border: "1px solid #d4dee8",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "12px",
            background: "#fbfdff",
          }}
        >
          <div style={{ fontWeight: "bold", marginBottom: "8px" }}>
            Question {num}
          </div>

          <div style={{ marginBottom: "10px" }}>
            <div style={{ fontSize: "13px", marginBottom: "4px" }}>
              <strong>Your Answer:</strong> {userAns ? userAns : "Unanswered"}
            </div>
            <div style={{ fontSize: "13px" }}>
              <strong>Correct Answer:</strong> {correct}
            </div>
          </div>

          {blocks.map((b) => (
            <div key={b.label} style={{ marginBottom: "12px" }}>
              <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "4px" }}>{b.label}</div>
              <div style={{ fontSize: "14px", lineHeight: "1.4", marginBottom: "8px" }}>
                {b.v.question_text}
              </div>

              <div style={{ fontSize: "13px", lineHeight: "1.6" }}>
                {Object.entries(b.v.options).map(([key, text]) => (
                  <div key={key}>
                    <strong>{key}:</strong> {text}
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div style={{ borderTop: "1px solid #e2ebf4", paddingTop: "10px" }}>
  {rationaleBlocks.length === 0 ? (
    <div style={{ fontSize: "14px", color: "#333" }}>
      Rationale not available.
    </div>
  ) : (
    rationaleBlocks.map((rb) => (
      <div key={rb.label} style={{ marginBottom: "12px" }}>
        <div style={{ fontWeight: "bold", fontSize: "15px",marginBottom: "6px" }}>
          {rb.label} — Rationale
        </div>
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#222" }}>
          {rb.r?.why_correct || "Rationale not available."}
        </div>

        <div style={{ marginTop: "10px" }}>
          <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "6px" }}>
            {rb.label} — Prometric Signal
          </div>
          <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#222" }}>
            {rb.r?.prometric_signal || "Prometric Signal not available."}
          </div>
        </div>
      </div>
    ))
  )}
</div>
</div>
      );
    });
  })()}
</div>


        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            borderTop: `1px solid ${theme.chromeBorder}`,
            padding: "12px 14px",
            background: theme.chromeBg,
          }}
        >
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
  {[1, 2, 3, 4, 5].map((ch) => {
  const isActive = ch === rationaleChapter;
  const count = missedCounts[ch] || 0;
  const isEnabled = count > 0;

{analyticsUnavailable && (
  <div style={{ marginRight: "auto", color: "#b00020", fontSize: "13px" }}>
    {T.analyticsUnavailable || "Analytics unavailable for this attempt."}
  </div>
)}
  
  return (
    <button
      key={ch}
      onClick={() => {
        if (isEnabled) setRationaleChapter(ch);
      }}
      disabled={!isEnabled}
      style={{
        ...btnSecondary,
        minWidth: "100px",
        padding: "8px 10px",
        border: isActive ? "2px solid #2b6cb0" : btnSecondary.border,
        background: isActive ? "#e7f1ff" : btnSecondary.background,
        fontWeight: isActive ? "bold" : "normal",
        opacity: isEnabled ? 1 : 0.35,
        cursor: isEnabled ? "pointer" : "not-allowed",
      }}
    >
      Ch {ch} ({count})
    </button>
  );
})}
</div>
          <button onClick={() => setMode("finished")} style={{ ...btnSecondary, minWidth: "180px" }}>
            {T.backToResults}
          </button>
        </div>
      </div>
    </div>
  );
}

// ----------------------------
// ANALYTICS (READ-ONLY)
// ----------------------------
if (mode === "analytics") {
let resultsPayload = null;

  if (attemptId) {
    try {
      const raw = localStorage.getItem(`cna:results:${attemptId}`);
      if (raw) resultsPayload = JSON.parse(raw);
    } catch {
      resultsPayload = null;
    }
  }
  const ANALYTICS_TEXT = {
    en: { chapter: "Chapter", review: "Review", primary: "Primary", secondary: "Secondary" },
    es: { chapter: "Capítulo", review: "Repasar", primary: "Primario", secondary: "Secundario" },
    fr: { chapter: "Chapitre", review: "Réviser", primary: "Principal", secondary: "Secondaire" },
    ht: { chapter: "Chapit", review: "Revize", primary: "Prensipal", secondary: "Segondè" },
  };

  const A = ANALYTICS_TEXT[lang] || ANALYTICS_TEXT.en;

    const CHAPTER_NAMES_BY_LANG = {
    en: {
      1: "Role of the Nursing Assistant",
      2: "Promotion of Safety",
      3: "Promotion of Function and Health of Residents",
      4: "Basic Care Provided by the Nursing Assistant",
      5: "Providing Specialized Care for Residents with Changes in Health",
    },
    es: {
      1: "Rol del asistente de enfermería",
      2: "Promoción de la seguridad",
      3: "Promoción de la función y la salud de los residentes",
      4: "Cuidado básico proporcionado por el asistente de enfermería",
      5: "Atención especializada para residentes con cambios en la salud",
    },
    fr: {
      1: "Rôle de l’aide-soignant(e)",
      2: "Promotion de la sécurité",
      3: "Promotion de la fonction et de la santé des résidents",
      4: "Soins de base fournis par l’aide-soignant(e)",
      5: "Soins spécialisés pour les résidents ayant des changements de santé",
    },
    ht: {
      1: "Wòl asistan enfimyè a",
      2: "Pwomosyon sekirite",
      3: "Pwomosyon fonksyon ak sante rezidan yo",
      4: "Swen debaz asistan enfimyè a bay",
      5: "Swen espesyalize pou rezidan ki gen chanjman nan sante",
    },
  };

  const CHN = CHAPTER_NAMES_BY_LANG[lang] || CHAPTER_NAMES_BY_LANG.en;

  const LENS_BY_LANG = {
    en: {
      "Is this within my role, or do I observe and report?":
        "Is this within my role, or do I observe and report?",
      "What is different from this resident’s baseline?":
        "What is different from this resident’s baseline?",
      "What should I notice to prevent harm right now?":
        "What should I notice to prevent harm right now?",
      "Is the physical space safe and supportive?":
        "Is the physical space safe and supportive?",
      "What prevents contamination or spread of germs?":
        "What prevents contamination or spread of germs?",
      "Am I supporting comfort, dignity, and independence?":
        "Am I supporting comfort, dignity, and independence?",
      "Is the resident being moved safely and correctly?":
        "Is the resident being moved safely and correctly?",
      "How should I respond verbally and emotionally?":
        "How should I respond verbally and emotionally?",
      "Am I preserving choice, privacy, and respect?":
        "Am I preserving choice, privacy, and respect?",
    },
    es: {
      "Is this within my role, or do I observe and report?":
        "¿Esto está dentro de mi rol, o debo observar y reportar?",
      "What is different from this resident’s baseline?":
        "¿Qué es diferente del estado habitual de este residente?",
      "What should I notice to prevent harm right now?":
        "¿Qué debo notar para prevenir daño ahora mismo?",
      "Is the physical space safe and supportive?":
        "¿El entorno físico es seguro y favorable?",
      "What prevents contamination or spread of germs?":
        "¿Qué previene la contaminación o la propagación de gérmenes?",
      "Am I supporting comfort, dignity, and independence?":
        "¿Estoy apoyando la comodidad, la dignidad y la independencia?",
      "Is the resident being moved safely and correctly?":
        "¿Se está moviendo al residente de forma segura y correcta?",
      "How should I respond verbally and emotionally?":
        "¿Cómo debo responder verbal y emocionalmente?",
      "Am I preserving choice, privacy, and respect?":
        "¿Estoy preservando la elección, la privacidad y el respeto?",
    },
    fr: {
      "Is this within my role, or do I observe and report?":
        "Est-ce dans mon rôle, ou dois-je observer et signaler ?",
      "What is different from this resident’s baseline?":
        "Qu’est-ce qui est différent par rapport à l’état habituel de ce résident ?",
      "What should I notice to prevent harm right now?":
        "Que dois-je remarquer pour prévenir un danger immédiatement ?",
      "Is the physical space safe and supportive?":
        "L’environnement physique est-il sûr et adapté ?",
      "What prevents contamination or spread of germs?":
        "Qu’est-ce qui empêche la contamination ou la propagation des germes ?",
      "Am I supporting comfort, dignity, and independence?":
        "Est-ce que je soutiens le confort, la dignité et l’autonomie ?",
      "Is the resident being moved safely and correctly?":
        "Le résident est-il déplacé de façon sûre et correcte ?",
      "How should I respond verbally and emotionally?":
        "Comment dois-je répondre verbalement et émotionnellement ?",
      "Am I preserving choice, privacy, and respect?":
        "Est-ce que je préserve le choix, la confidentialité et le respect ?",
    },
    ht: {
      "Is this within my role, or do I observe and report?":
        "Èske sa nan wòl mwen, oswa èske mwen dwe obsève epi rapòte?",
      "What is different from this resident’s baseline?":
        "Kisa ki diferan ak nòmal rezidan sa a?",
      "What should I notice to prevent harm right now?":
        "Kisa mwen dwe remake pou anpeche danje kounye a?",
      "Is the physical space safe and supportive?":
        "Èske anviwònman an an sekirite epi li soutni rezidan an?",
      "What prevents contamination or spread of germs?":
        "Kisa ki anpeche kontaminasyon oswa pwopagasyon mikwòb?",
      "Am I supporting comfort, dignity, and independence?":
        "Èske mwen sipòte konfò, diyite, ak endepandans?",
      "Is the resident being moved safely and correctly?":
        "Èske y ap deplase rezidan an an sekirite epi kòrèkteman?",
      "How should I respond verbally and emotionally?":
        "Kijan mwen dwe reponn ak pawòl ak emosyon?",
      "Am I preserving choice, privacy, and respect?":
        "Èske mwen prezève chwa, vi prive, ak respè?",
    },
  };

  const LENS = LENS_BY_LANG[lang] || LENS_BY_LANG.en;


  function localizeGuidanceLine(guidance_text, chapter_id, priority) {
    // guidance_text shape: "Review Chapter X (primary) — <lens>"
    const parts = String(guidance_text || "").split("—");
    const lens = parts.length > 1 ? parts.slice(1).join("—").trim() : String(guidance_text || "").trim();

  const lensLocalized = LENS[lens] || lens;

    const p = String(priority || "").toLowerCase();
    const pLabel = p === "primary" ? A.primary : p === "secondary" ? A.secondary : priority || "";

    const pri = pLabel ? ` (${pLabel})` : "";
    return `${A.review} ${A.chapter} ${chapter_id}${pri} — ${lensLocalized}`;

  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          height: "675px",
          border: `2px solid ${theme.frameBorder}`,
          borderRadius: "12px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "white",
          marginTop: "20px",
        }}
      >
        {/* Header */}
        <div
          style={{
            borderBottom: `1px solid ${theme.chromeBorder}`,
            padding: "12px 14px",
            background: theme.chromeBg,
            fontWeight: "bold",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{T.analytics}</span>
        </div>

        {/* Body */}
        <div
          style={{
            flex: 1,
            padding: "18px",
            overflowY: "auto",
          }}
        >
          <div style={{ maxWidth: "700px", margin: "0 auto" }}>
            <div style={{ fontSize: "20px", fontWeight: "600", marginBottom: "10px" }}>
              {T.examPerformanceInsights}
            </div>

            <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.6" }}>
              {T.analyticsIntro}
            </div>

{resultsPayload?.overall_status && (
  <div
    style={{
      marginTop: "14px",
      padding: "12px",
      border: "1px solid #d4dee8",
      borderRadius: "12px",
      background: "#fbfdff",
    }}
  >
    <div style={{ fontSize: "16px", fontWeight: "700", color: "#555", marginBottom: "6px" }}>
  {T.readiness}
</div>

    {(() => {
  const statusLabel =
    resultsPayload.overall_status === "On Track"
      ? T.statusOnTrack
      : resultsPayload.overall_status === "High Risk"
      ? T.statusHighRisk
      : T.statusBorderline;

  const statusNarrative =
    resultsPayload.overall_status === "On Track"
      ? T.readinessNarrative.onTrack
      : resultsPayload.overall_status === "High Risk"
      ? T.readinessNarrative.highRisk
      : T.readinessNarrative.borderline;

  return (
    <>
      <div
        style={{
          fontSize: "18px",
          fontWeight: "700",
          marginBottom: "8px",
          color:
            resultsPayload.overall_status === "On Track"
              ? "green"
              : resultsPayload.overall_status === "High Risk"
              ? "red"
              : "#111",
        }}
      >
        {statusLabel}
      </div>

      <div style={{ fontSize: "14px", color: "#333", lineHeight: "1.6" }}>
        {statusNarrative}
      </div>
    </>
  );
})()}
  </div>
)}

{Array.isArray(resultsPayload?.category_diagnosis) &&
  resultsPayload.category_diagnosis.length > 0 && (
    <div
      style={{
        marginTop: "14px",
        padding: "12px",
        border: "1px solid #d4dee8",
        borderRadius: "12px",
        background: "#fbfdff",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: "700", color: "#555", marginBottom: "8px" }}>
  {T.categoryDiagnosis}
</div>
      <div style={{ fontSize: "12px", color: "#555", lineHeight: "1.5", marginBottom: "10px" }}>
  {T.categoryExplainer}

</div>

      {(() => {
  const all = resultsPayload.category_diagnosis || [];
  const strengths = all.filter((c) => c.label === "Strength");
  const weaknesses = all.filter((c) => c.label === "Weakness");
  const highRisk = all.filter(
  (c) => c.label === "High Risk" || c.label === "High-Risk Flag"
);


  const colBox = {
    flex: 1,
    border: "1px solid #e2ebf4",
    borderRadius: "10px",
    padding: "10px",
    background: "white",
    minHeight: "140px",
  };

  const colTitle = (text, extra = {}) => (
    <div style={{ fontSize: "13px", fontWeight: "700", marginBottom: "8px", ...extra }}>
      {text}
    </div>
  );

const CATEGORY_NAMES_BY_LANG = {
  es: {
    "Scope of Practice & Reporting": "Alcance de la práctica y qué reportar",
    "Change in Condition": "Cambio en la condición",
    "Observation & Safety": "Observación y seguridad",
    "Environment & Safety": "Entorno y seguridad",
    "Infection Control": "Control de infecciones",
    "Personal Care & Comfort": "Cuidado personal y comodidad",
    "Mobility & Positioning": "Movilidad y posicionamiento",
    "Communication & Emotional Support": "Comunicación y apoyo emocional",
    "Dignity & Resident Rights": "Dignidad y derechos del residente",
  },

  fr: {
    "Scope of Practice & Reporting": "Champ de pratique et signalement",
    "Change in Condition": "Changement d’état",
    "Observation & Safety": "Observation et sécurité",
    "Environment & Safety": "Environnement et sécurité",
    "Infection Control": "Contrôle des infections",
    "Personal Care & Comfort": "Soins personnels et confort",
    "Mobility & Positioning": "Mobilité et positionnement",
    "Communication & Emotional Support": "Communication et soutien émotionnel",
    "Dignity & Resident Rights": "Dignité et droits du résident",
  },

  ht: {
    "Scope of Practice & Reporting": "Wòl mwen ak sa pou rapòte",
    "Change in Condition": "Chanjman nan kondisyon",
    "Observation & Safety": "Obsèvasyon ak sekirite",
    "Environment & Safety": "Anviwònman ak sekirite",
    "Infection Control": "Kontwòl enfeksyon",
    "Personal Care & Comfort": "Swen pèsonèl ak konfò",
    "Mobility & Positioning": "Mobilite ak pozisyonman",
    "Communication & Emotional Support": "Kominikasyon ak sipò emosyonèl",
    "Dignity & Resident Rights": "Diyite ak dwa rezidan an",
  },
};

const CATN = CATEGORY_NAMES_BY_LANG[lang] || null;

  const renderList = (items, emptyText) => {
    if (!items.length) {
      return <div style={{ fontSize: "12px", color: "#666" }}>{emptyText}</div>;
    }
    return items.map((c) => (
      <div key={c.category_id} style={{ fontSize: "13px", marginBottom: "6px" }}>
        {(CATN && CATN[c.category_id]) ? CATN[c.category_id] : c.category_id}
      </div>
    ));
  };

  return (
    <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
      <div style={colBox}>
        {colTitle(T.colStrengths)}
        {renderList(strengths, T.noneStrengths)}
      </div>

      <div style={colBox}>
        {colTitle(T.colWeaknesses)}
        {renderList(weaknesses, T.noneWeaknesses)}
      </div>

      <div style={colBox}>
        {colTitle(T.colHighRisk, { color: "red" })}
        {renderList(highRisk, T.noneHighRisk)}
      </div>
    </div>
  );
})()}

    </div>
  )}
{Array.isArray(resultsPayload?.chapter_guidance) &&
  resultsPayload.chapter_guidance.length > 0 && (
    <div
      style={{
        marginTop: "16px",
        padding: "14px",
        border: "1px solid #d4dee8",
        borderRadius: "12px",
        background: "#fbfdff",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: "700", color: "#555", marginBottom: "8px" }}>
  {T.whatToStudyNext}
</div>
<div style={{ fontSize: "12px", color: "#555", lineHeight: "1.5", marginBottom: "10px" }}>
  {T.chapterExplainer}
</div>

            <div style={{ fontSize: "14px", color: "#222", lineHeight: "1.6" }}>
        {(() => {
          // Group by lens (the part after "—"), preserve order of first appearance
          const order = [];
          const groups = {};

          (resultsPayload.chapter_guidance || []).forEach((g) => {
            const parts = String(g.guidance_text || "").split("—");
            const lensRaw =
              parts.length > 1 ? parts.slice(1).join("—").trim() : String(g.guidance_text || "").trim();

            const lensTitle = (LENS[lensRaw] || lensRaw).trim();
            if (!groups[lensTitle]) {
              groups[lensTitle] = { primary: [], secondary: [] };
              order.push(lensTitle);
            }

            const p = String(g.priority || "").toLowerCase();
            const bucket = p === "primary" ? "primary" : "secondary";

            // Avoid duplicates per bucket
            if (!groups[lensTitle][bucket].some((x) => x.chapter_id === g.chapter_id)) {
              groups[lensTitle][bucket].push({ chapter_id: g.chapter_id });
            }
          });

          const line = (label, items) => {
            if (!items.length) return null;
            return (
              <div style={{ marginTop: "2px" }}>
                <div style={{ fontWeight: "700", color: "#555", marginBottom: "2px" }}>{label}</div>
                {items.map((it) => (
                  <div key={`${label}-${it.chapter_id}`} style={{ color: "#333", marginBottom: "2px" }}>
                    {A.chapter} {it.chapter_id}
                    {CHN?.[it.chapter_id] ? ` — ${CHN[it.chapter_id]}` : ""}
                  </div>
                ))}
              </div>
            );
          };

          return order.map((lensTitle) => (
            <div
              key={lensTitle}
              style={{
                border: "1px solid #e2ebf4",
                borderRadius: "10px",
                padding: "12px",
                background: "white",
                marginBottom: "12px",
              }}
            >
              <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "2px" }}>
                {lensTitle}
              </div>

              {line(A.primary, groups[lensTitle].primary)}
              {line(A.secondary, groups[lensTitle].secondary)}
            </div>
          ));
        })()}
      </div>

    </div>
  )}


          </div>
        </div>

        {/* Footer */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "10px",
            borderTop: `1px solid ${theme.chromeBorder}`,
            padding: "12px 14px",
            background: theme.chromeBg,
          }}
        >
          <button
            onClick={() => setMode("finished")}
            style={{ ...btnSecondary, minWidth: "180px" }}
          >
            {T.backToResults}
          </button>
        </div>
      </div>
    </div>
  );
}

  // ----------------------------
  // CONFIRM EXIT
  // ----------------------------
  if (mode === "confirm_exit") {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontWeight: "bold",
            }}
          >
            <span>
              {getUiLines("confirmExitTitle")
                .map((l) => `${l.text}`)
                .join("  |  ")}
            </span>
            <span style={{ fontWeight: "bold" }}>⏱ {formatRemaining(remainingSec)}</span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: "720px" }}>
              <div style={{ marginBottom: "18px" }}>
                {getUiLines("confirmExitLead").map((l) => (
  <div key={l.label}>{l.text}</div>
))}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ fontSize: "20px", lineHeight: "1" }}>⚠️</div>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
                  {getUiLines("confirmExitQuestion").map((l) => (
  <div key={l.label}>{l.text}</div>
))}
                </div>
              </div>

              <div style={{ lineHeight: "1.5" }}>
                {getUiLines("confirmExitExplanation").map((l) => (
  <div key={l.label}>{l.text}</div>
))}
              </div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              borderTop: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
            }}
          >
            <button onClick={() => setMode(exitReturnMode)} style={{ ...btnSecondary, flex: 1 }}>
              No
            </button>

            <button
              onClick={() => {
                router.push("/pilot");
              }}
              style={{ ...btnPrimary, flex: 1 }}
            >
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  }


  // ----------------------------
  // CONFIRM END OF TEST
  // ----------------------------
  if (mode === "confirm_end") {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
              fontWeight: "bold",
            }}
          >
            <span>{getUiLines("confirmEndTitle").map((l) => l.text).join(" / ")}</span>
            <span style={{ fontWeight: "bold" }}>⏱ {formatRemaining(remainingSec)}</span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "18px",
              textAlign: "center",
            }}
          >
            <div style={{ maxWidth: "720px" }}>
              <div style={{ marginBottom: "18px" }}>
  {getUiLines("confirmEndLead").map((l) => (
    <div key={l.label}>{l.text}</div>
  ))}
</div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  gap: "10px",
                  marginBottom: "14px",
                }}
              >
                <div style={{ fontSize: "20px", lineHeight: "1" }}>⚠️</div>
                <div style={{ fontSize: "20px", fontWeight: "bold" }}>
  {getUiLines("confirmEndQuestion").map((l) => (
    <div key={l.label}>{l.text}</div>
  ))}
</div>
              </div>

<div style={{ marginBottom: "10px", fontSize: "16px", color: "#ce0707" }}>
  {T.onceEnded}
</div>

              <div style={{ lineHeight: "1.5" }}>
  {getUiLines("confirmEndExplanation").map((l) => (
    <div key={l.label}>{l.text}</div>
  ))}
</div>
            </div>
          </div>

          <div
            style={{
              display: "flex",
              gap: "10px",
              borderTop: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
            }}
          >
            <button onClick={() => setMode("review")} style={{ ...btnSecondary, flex: 1 }}>
              No
            </button>

            <button onClick={() => setMode("finished")} style={{ ...btnPrimary, flex: 1 }}>
              Yes
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------
  // SUMMARY
  // ----------------------------
  if (mode === "review") {
  // 1) GLOBAL filter (across the entire exam)
  const filteredQuestionIds = deliveredQuestionIds.filter((qid) => {
    const answered = answersByQid[qid] !== undefined;
    const marked = reviewByQid[qid] === true;

    if (summaryFilter === "answered") return answered;
    if (summaryFilter === "unanswered") return !answered;
    if (summaryFilter === "marked") return marked;
    return true; // "all"
  });

  // 2) Pagination happens AFTER filtering
  const start = (summaryPage - 1) * PAGE_SIZE;
  const end = start + PAGE_SIZE;
  const pageQids = filteredQuestionIds.slice(start, end);

  const totalFilteredPages = Math.max(1, Math.ceil(filteredQuestionIds.length / PAGE_SIZE));

    const compactBtn = (label, value, extraStyle = {}) => {
      const isActive = summaryFilter === value;
      return (
        <button
          onClick={() => {
  setSummaryFilter(value);
  setSummaryPage(1);
}}
          style={{
            ...btnSecondary,
            width: "100%",
            textAlign: "left",
            padding: "7px 9px",
            fontSize: "13px",
            borderRadius: "9px",
            border: isActive ? "2px solid #2b6cb0" : `1px solid ${theme.buttonBorder}`,
            background: isActive ? "#e7f1ff" : theme.secondaryBg,
            ...extraStyle,
          }}
        >
          {label}
        </button>
      );
    };

    const canPrev = summaryPage > 1;
    const canNext = summaryPage < totalFilteredPages;

    return (
      <div style={{ maxWidth: "900px", margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "6px",
          }}
        >
          <h1 style={{ margin: 0, fontSize: "20px", fontWeight: "600" }}>Summary</h1>
          <div style={{ fontWeight: "bold" }}>⏱ {formatRemaining(remainingSec)}</div>
        </div>

        <div style={{ marginBottom: "8px", color: "#333", fontSize: "13px" }}>
          Page {summaryPage} of {totalFilteredPages}
        </div>

        <div style={{ display: "flex", gap: "12px", alignItems: "stretch" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                flex: 1,
                border: "1px solid #d4dee8",
                borderRadius: "10px",
                padding: "10px",
                background: "#fbfdff",
              }}
            >
              {pageQids.length === 0 ? (
  <div style={{ color: "#555", fontSize: "13px" }}>
    No questions match this filter on this page.
  </div>
) : (
  pageQids.map((qid, idxOnFiltered) => {
                  const absoluteIndex = deliveredQuestionIds.indexOf(qid);
  const number = absoluteIndex + 1;

                  const answered = answersByQid[qid] !== undefined;
                  const flagged = reviewByQid[qid] === true;

                  const q = bankById[qid];
                  const lines = getSummaryTextForLang(q);

                  return (
                    <div
                      key={qid}
                      style={{
                        padding: "8px 6px",
                        borderBottom:
                          idxOnFiltered === pageQids.length - 1
                            ? "none"
                            : "1px solid #e2ebf4",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          gap: "8px",
                          alignItems: "baseline",
                          fontSize: "13px",
                        }}
                      >
                        <span
                          style={{
                            textDecoration: "underline",
                            cursor: "pointer",
                            color: theme.link,
                            fontWeight: "bold",
                          }}
                          onClick={() => {
                            setIndex(absoluteIndex);
                            setMode("exam");
                          }}
                        >
                          Question {number}
                        </span>

                        <span style={{ color: answered ? "#1a1a1a" : "#555" }}>
                          — {answered ? "Answered" : "Not Answered"}
                        </span>

                        {flagged ? (
                          <span style={{ color: "red", fontWeight: "bold" }}>— MARKED</span>
                        ) : null}
                      </div>

                      <div style={{ marginTop: "4px", fontSize: "12px", color: "#333" }}>
                        {lines.map((l) => (
                          <div key={l.label} style={{ marginBottom: "2px" }}>
                            <strong>{l.label}:</strong> {l.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button onClick={() => setMode("exam")} style={{ ...btnSecondary, flex: 1 }}>
                Back to Exam
              </button>

              <button onClick={() => setMode("confirm_end")} style={{ ...btnPrimary, flex: 1 }}>
                End Exam
              </button>

              <button onClick={() => openExitConfirm("review")} style={{ ...btnExit, minWidth: "90px" }}>
                Exit
              </button>
            </div>
          </div>

          <div style={{ width: "190px", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {compactBtn("All", "all")}
              {compactBtn("Answered", "answered")}
              {compactBtn("Not Answered", "unanswered")}
              {compactBtn("🚩 Mark for Review", "marked", { color: "red", fontWeight: "bold" })}
            </div>

            <div style={{ flex: 1 }} />

            <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
              <button
                onClick={() => {
                  if (canPrev) setSummaryPage(summaryPage - 1);
                }}
                style={{ ...btnSecondary, width: "100%", opacity: canPrev ? 1 : 0.5 }}
                disabled={!canPrev}
              >
                ◀ Prev Page
              </button>

              <button style={{ ...btnSecondary, width: "100%" }} disabled>
                Page {summaryPage} / {totalFilteredPages}
              </button>

              <button
                onClick={() => {
                  if (canNext) setSummaryPage(summaryPage + 1);
                }}
                style={{ ...btnSecondary, width: "100%", opacity: canNext ? 1 : 0.5 }}
                disabled={!canNext}
              >
                Next Page ▶
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // ----------------------------
  // EXAM MODE
  // ----------------------------
  if (!deliveredQuestionIds || deliveredQuestionIds.length === 0) {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      Loading exam…
    </div>
  );
}

  const qid = deliveredQuestionIds[index];
  const q = bankById[qid];
  const blocks = getDisplayBlocks(q);
  const selected = answersByQid[qid] || "";
  const isMarked = reviewByQid[qid] === true;
  const isLast = index === total - 1;

  function selectAnswer(letter) {
    setAnswersByQid((prev) => ({
      ...prev,
      [qid]: letter,
    }));
  }

  function toggleReview() {
    setReviewByQid((prev) => ({
      ...prev,
      [qid]: !prev[qid],
    }));
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
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
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: `1px solid ${theme.chromeBorder}`,
            padding: "12px 14px",
            background: theme.chromeBg,
          }}
        >
          <strong style={{ fontSize: "18px" }}>
            Question {index + 1} of {total}
          <span style={{ fontSize: "12px", fontWeight: "normal", marginLeft: "10px", color: "#555" }}>
    ({qid})
  </span>
          </strong>

          <div style={{ display: "flex", alignItems: "center", gap: "18px" }}>
 
            <label
              style={{
                cursor: "pointer",
                fontWeight: isMarked ? "bold" : "normal",
                color: isMarked ? "red" : "inherit",
              }}
            >
              <input
                type="checkbox"
                checked={isMarked}
                onChange={toggleReview}
                style={{ marginRight: "6px" }}
              />
              {isMarked ? "🚩 Marked for Review" : "Mark for Review"}
            </label>

            <span style={{ fontWeight: "bold" }}>⏱ {formatRemaining(remainingSec)}</span>
          </div>
        </div>

        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
          {blocks.map((b, i) => {
            const isInteractive = i === 0;
            const groupName = `${qid}-${b.label}`;

            return (
              <div key={b.label} style={{ marginBottom: "18px" }}>
                <div style={{ fontWeight: "bold", marginBottom: "4px" }}>
                  {b.label}
                </div>

                <div
                  style={{
                    fontSize: "18px",
                    fontWeight: "500",
                    lineHeight: "1.4",
                    marginBottom: "15px",
                  }}
                >
                  {b.v.question_text}
                </div>

                {Object.entries(b.v.options).map(([key, text]) => {
                  const isSelected = selected === key;

                  return (
                    <label
                      key={key}
                      style={{
                        display: "block",
                        padding: "10px",
                        marginBottom: "6px",
                        fontSize: "16px",
                        border: "1px solid #c6d3e0",
                        borderRadius: "10px",
                        cursor: isInteractive ? "pointer" : "default",
                        background: isSelected ? "#e7f1ff" : "white",
                      }}
                    >
                      <input
                        type="radio"
                        name={groupName}
                        value={key}
                        checked={isSelected}
                        onChange={() => {
                          if (isInteractive) selectAnswer(key);
                        }}
                        style={{ marginRight: "10px" }}
                      />
                      <strong>{key}:</strong> {text}
                    </label>
                  );
                })}
              </div>
            );
          })}
        </div>

        <div
          style={{
            display: "flex",
            gap: "10px",
            borderTop: `1px solid ${theme.chromeBorder}`,
            padding: "12px 14px",
            background: theme.chromeBg,
          }}
        >
          <button
            onClick={() => index > 0 && setIndex(index - 1)}
            disabled={index === 0}
            style={{ ...btnSecondary, flex: 1, opacity: index === 0 ? 0.5 : 1 }}
          >
            Previous
          </button>

          <button onClick={() => setMode("review")} style={{ ...btnSecondary, flex: 1 }}>
            Summary
          </button>

          {isLast ? (
            <button onClick={() => setMode("review")} style={{ ...btnPrimary, flex: 1 }}>
              End Test
            </button>
          ) : (
            <button onClick={() => setIndex(index + 1)} style={{ ...btnPrimary, flex: 1 }}>
              Next
            </button>
          )}

          <button onClick={() => openExitConfirm("exam")} style={{ ...btnExit, minWidth: "90px" }}>
            Exit
          </button>
        </div>
      </div>
    </div>
  );
}
