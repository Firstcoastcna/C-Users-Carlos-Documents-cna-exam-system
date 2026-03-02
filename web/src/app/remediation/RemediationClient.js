"use client";

import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";

import {
  loadRemediationSession,
  saveRemediationSession,
  loadAllRemediationSessions,
} from "../lib/remediationSessionStorage";

import { buildRemediationSession } from "../lib/remediationSessionBuilder";

import {
  applyRemediationAnswerAndPersist,
  finalizeRemediationSessionCompletion,
  markRemediationSessionExited,
} from "../lib/remediationOutcomes";


export default function RemediationClient({ bankById }) {

  const router = useRouter();
  const searchParams = useSearchParams();

const sessionId = searchParams.get("session_id");
const attemptIdParam = searchParams.get("attemptId");
const urlLang = searchParams.get("lang");
const reviewParam = searchParams.get("review"); // "1" means view-only
const qaParam = searchParams.get("qa"); // "1" enables QA debug overlay

const [lang, setLang] = useState("en");
useEffect(() => {
  if (urlLang) setLang(urlLang);
}, [urlLang]);

const [reviewMode, setReviewMode] = useState(reviewParam === "1");
useEffect(() => {
  setReviewMode(reviewParam === "1");
}, [reviewParam]);

const [qaMode, setQaMode] = useState(qaParam === "1");
useEffect(() => {
  setQaMode(qaParam === "1");
}, [qaParam]);


const [resultsPayload, setResultsPayload] = useState(null);

useEffect(() => {
  if (!attemptIdParam) return;

  try {
    const raw = localStorage.getItem(`cna:results:${attemptIdParam}`);
    if (!raw) {
      setResultsPayload(null);
      return;
    }
    setResultsPayload(JSON.parse(raw));
  } catch (e) {
    console.log("TEMP DEBUG — failed to load results payload", e);
    setResultsPayload(null);
  }
}, [attemptIdParam]);

const [loopState, setLoopState] = useState({
  selectedCats: [],
  catSetKey: "",
  activeSession: null,
  lastCompleted: null,
  completedSorted: [],
  completedCount: 0,
  lastOutcome: "",
});

useEffect(() => {
  if (!resultsPayload?.attempt_id) return;

  // Canon selection priority:
  // High-Risk categories first, then Weak, then Developing (only if no high-risk priority exists)
  const ranked = Array.isArray(resultsPayload?.category_priority)
    ? resultsPayload.category_priority
    : [];

  const highRiskPriority = ranked.filter(
    (c) => c.is_high_risk && c.level !== "Strong"
  );
  const weakPriority = ranked.filter(
    (c) => !c.is_high_risk && c.level === "Weak"
  );
  const developingPriority = ranked.filter(
    (c) => !c.is_high_risk && c.level === "Developing"
  );

  const selectedCats = (
    highRiskPriority.length > 0
      ? highRiskPriority
      : [...weakPriority, ...developingPriority]
  )
    .slice(0, 2)
    .map((c) => c.category_id);

  const catSetKey = (selectedCats || []).slice().sort().join("|");
  const all = loadAllRemediationSessions() || [];

  const sameLoop = all.filter((s) => {
    if (!s) return false;
    if (s.results_attempt_id !== resultsPayload.attempt_id) return false;
    const k = (s.selectedCategories || []).slice().sort().join("|");
    return k === catSetKey;
  });

  const completedSorted = sameLoop
    .filter((s) => s.status === "completed")
    .slice()
    .sort((a, b) => {
      const at = Number(a.completed_at || a.completion_ts || a.created_at || 0);
      const bt = Number(b.completed_at || b.completion_ts || b.created_at || 0);
      return at - bt;
    });

  const completedCount = completedSorted.length;
  const lastCompleted = completedCount > 0 ? completedSorted[completedCount - 1] : null;
  const lastOutcome = lastCompleted ? (lastCompleted.microOutcome || "") : "";

  // “active session” = anything in this loop not completed
  // (we want Continue to resume it)
  const active = sameLoop.find((s) => s.status !== "completed") || null;

  setLoopState({
    selectedCats,
    catSetKey,
    activeSession: active,
    lastCompleted,
    completedSorted,
    completedCount,
    lastOutcome,
  });
}, [resultsPayload]);


  const [session, setSession] = useState(null);
    const [error, setError] = useState(null);

const [view, setView] = useState(sessionId ? "session" : "intro"); // "intro" | "session" | "confirm_exit" | "complete"

useEffect(() => {
  if (view !== "complete") return;
  if (!session || !session.session_id) return;

  // Only finalize once
  if (session.status === "completed") return;

  try {
    finalizeRemediationSessionCompletion({
      session_id: session.session_id,
      results_attempt_id: session.results_attempt_id,
      selectedCategories: session.selectedCategories,
    });

    // Refresh local state from storage (so session.status/microOutcome/etc are reflected)
    const fresh = loadRemediationSession(session.session_id);
    if (fresh) setSession(fresh);
  } catch (e) {
    console.log("TEMP DEBUG — finalize completion failed", e);
  }
}, [view, session]);


const UI_TEXT = {
  en: {
    introTitle: "Remediation Session",
introBody: (cats) =>
  `This practice set is based on your last exam. It focuses on: ${cats}. The goal is to strengthen the decisions you miss most so your next score improves.`,
introStart: "Start",
    remediationTitle: "Remediation",
    loading: "Loading…",
    missingSessionId: "Missing session_id.",
    sessionNotFound: "Remediation session not found.",
    btnBackToResults: "Back to results",
    btnBackToOverview: "Back to start",
    endTitle: "End remediation?",
    endBody: (n) =>
      `You still have ${n} unanswered question${n === 1 ? "" : "s"}. You can continue now, or end anyway.`,
    btnContinue: "Continue",
    btnEndAnyway: "End anyway",
    btnBack: "Back",
    btnNext: "Next",
    btnEnd: "End Remediation",
    btnExit: "Exit",
    selectedLabel: "Selected:",
    introTotal: "Questions in this set:",
introQuestionsFrom: "from",
fbCorrect: "✅ Correct",
fbIncorrect: (correct) => `❌ Incorrect — correct answer is ${correct}`,
fbShowWhy: "Show explanation",
fbWhyCorrect: "Why this is correct",
fbPrometricSignal: "Prometric signal",
completeTitle: "Remediation complete",
completeBodyTop:
  "You completed this practice set. Remediation is meant to strengthen the decision patterns that lowered your last exam score.",
completeStrengthsLabel: "You strengthened",
completeNeedsLabel: "Keep practicing",
completeIfAllStrength:
  "Nice work. If you feel confident, return to mixed practice or take another full exam when ready.",
completeIfNeedsWork:
  "Do another short remediation set to reinforce the areas above before returning to full exam practice.",
btnAnotherSet: "Do another set",
btnBackToResultsDone: "Back to results",
btnFinish: "Finish",
completeNavOverview:
  "Back to start lets you review this remediation set and your focus areas.",
completeNavResults:
  "Back to results returns you to your exam results, where you can start a new remediation set if needed.",
categoryReviewLabel: "Focus category:",
loopSummaryLabel: "Progress:",
loopSummary: (done, max, outcome) =>
  `${done} / ${max}${outcome ? ` • Last outcome: ${outcome}` : ""}`,
attemptsLine: (n, max, outcome) => `Completed attempts: ${n} / ${max}${outcome ? ` • Last outcome: ${outcome}` : ""}`,
btnReviewLast: "Review last attempt",
btnContinueRemediation: "Continue remediation",
btnStartNewAttempt: "Start new attempt",
outcomeResolved: "Resolved",
outcomeImproving: "Improving",
outcomeStabilizing: "Needs reinforcement",

  },
  es: {
    introTitle: "Sesión de remediación",
introBody: (cats) =>
  `Este set de práctica se basa en tu último examen. Se enfoca en: ${cats}. El objetivo es fortalecer las decisiones que más fallas para mejorar tu próximo puntaje.`,
introStart: "Comenzar",
    remediationTitle: "Remediación",
    loading: "Cargando…",
    missingSessionId: "Falta session_id.",
    sessionNotFound: "No se encontró la sesión de remediación.",
    btnBackToResults: "Volver a resultados",
    btnBackToOverview: "Volver al inicio",
    endTitle: "¿Terminar la remediación?",
    endBody: (n) =>
      `Aún tienes ${n} pregunta${n === 1 ? "" : "s"} sin responder. Puedes continuar ahora o terminar de todos modos.`,
    btnContinue: "Continuar",
    btnEndAnyway: "Terminar de todos modos",
    btnBack: "Atrás",
    btnNext: "Siguiente",
    btnEnd: "Terminar remediación",
    btnExit: "Salir",
    selectedLabel: "Seleccionado:",
    introTotal: "Preguntas en este set:",
introQuestionsFrom: "de",
fbCorrect: "✅ Correcto",
fbIncorrect: (correct) => `❌ Incorrecto — la respuesta correcta es ${correct}`,
fbShowWhy: "Ver explicación",
fbWhyCorrect: "Por qué es correcto",
fbPrometricSignal: "Señal de Prometric",
completeTitle: "Remediación completada",
completeBodyTop:
  "Completaste este set de práctica. La remediación ayuda a fortalecer los patrones de decisión que bajaron tu puntaje en el último examen.",
completeStrengthsLabel: "Mejoraste en",
completeNeedsLabel: "Sigue practicando",
completeIfAllStrength:
  "¡Buen trabajo! Si te sientes seguro, vuelve a práctica mixta o toma otro examen completo cuando estés listo.",
completeIfNeedsWork:
  "Haz otro set corto de remediación para reforzar las áreas anteriores antes de volver al modo examen.",
btnAnotherSet: "Hacer otro set",
btnBackToResultsDone: "Volver a resultados",
btnFinish: "Finalizar",
completeNavOverview:
  "Volver al inicio te permite revisar este set de remediación y las áreas trabajadas.",
completeNavResults:
  "Volver a resultados te lleva a los resultados del examen, donde puedes iniciar un nuevo set de remediación si lo necesitas.",
categoryReviewLabel: "Categoría de enfoque:",
loopSummaryLabel: "Progreso:",
loopSummary: (done, max, outcome) =>
  `${done} / ${max}${outcome ? ` • Último resultado: ${outcome}` : ""}`,
attemptsLine: (n, max, outcome) => `Intentos completados: ${n} / ${max}${outcome ? ` • Último resultado: ${outcome}` : ""}`,
btnReviewLast: "Revisar último intento",
btnContinueRemediation: "Continuar remediación",
btnStartNewAttempt: "Iniciar nuevo intento",
outcomeResolved: "Resuelto",
outcomeImproving: "Mejorando",
outcomeStabilizing: "Necesita refuerzo",

  },
  fr: {
    introTitle: "Session de remédiation",
introBody: (cats) =>
  `Cette série de pratique est basée sur votre dernier examen. Elle se concentre sur : ${cats}. L’objectif est de renforcer les décisions que vous manquez le plus afin d’améliorer votre prochain score.`,
introStart: "Commencer",
    remediationTitle: "Remédiation",
    loading: "Chargement…",
    missingSessionId: "session_id manquant.",
    sessionNotFound: "Session de remédiation introuvable.",
    btnBackToResults: "Retour aux résultats",
    btnBackToOverview: "Retour au début",
    endTitle: "Terminer la remédiation ?",
    endBody: (n) =>
      `Il vous reste ${n} question${n === 1 ? "" : "s"} sans réponse. Vous pouvez continuer maintenant ou terminer quand même.`,
    btnContinue: "Continuer",
    btnEndAnyway: "Terminer quand même",
    btnBack: "Retour",
    btnNext: "Suivant",
    btnEnd: "Terminer la remédiation",
    btnExit: "Quitter",
    selectedLabel: "Sélectionné :",
    introTotal: "Questions dans ce set :",
introQuestionsFrom: "de",
fbCorrect: "✅ Correct",
fbIncorrect: (correct) => `❌ Incorrect — la bonne réponse est ${correct}`,
fbShowWhy: "Voir l’explication",
fbWhyCorrect: "Pourquoi c’est correct",
fbPrometricSignal: "Signal Prometric",
completeTitle: "Remédiation terminée",
completeBodyTop:
  "Vous avez terminé cette série de pratique. La remédiation sert à renforcer les schémas de décision qui ont fait baisser votre score au dernier examen.",
completeStrengthsLabel: "Vous avez renforcé",
completeNeedsLabel: "À travailler",
completeIfAllStrength:
  "Beau travail. Si vous vous sentez prêt(e), revenez à une pratique mixte ou faites un nouvel examen complet.",
completeIfNeedsWork:
  "Faites une autre courte série de remédiation pour renforcer les points ci-dessus avant de revenir au mode examen.",
btnAnotherSet: "Faire une autre série",
btnBackToResultsDone: "Retour aux résultats",
btnFinish: "Terminer",
completeNavOverview:
  "Retour au début vous permet de revoir cette série de remédiation et les domaines travaillés.",
completeNavResults:
  "Retour aux résultats vous ramène aux résultats de l’examen, où vous pouvez démarrer une nouvelle série de remédiation si nécessaire.",
categoryReviewLabel: "Catégorie ciblée:",
attemptsLine: (n, max, outcome) => `Tentatives terminées : ${n} / ${max}${outcome ? ` • Dernier résultat : ${outcome}` : ""}`,
btnReviewLast: "Revoir la dernière tentative",
btnContinueRemediation: "Continuer la remédiation",
btnStartNewAttempt: "Démarrer une nouvelle tentative",
outcomeResolved: "Résolu",
outcomeImproving: "En amélioration",
outcomeStabilizing: "Besoin de renforcement",

  },
  ht: {
    introTitle: "Sesyon Remedyasyon",
introBody: (cats) =>
  `Set kestyon pratik sa a baze sou dènye egzamen ou. Li konsantre sou: ${cats}. Objektif la se ranfòse desizyon ou rate plis yo pou pwochen nòt ou ka monte.`,
introStart: "Kòmanse",
    remediationTitle: "Remedyasyon",
    loading: "Ap chaje…",
    missingSessionId: "session_id pa la.",
    sessionNotFound: "Nou pa jwenn sesyon remedyasyon an.",
    btnBackToResults: "Tounen nan rezilta yo",
    btnBackToOverview: "Retounen nan kòmansman",
    endTitle: "Fèmen remedyasyon an?",
    endBody: (n) =>
      `Ou toujou gen ${n} kestyon${n === 1 ? "" : " yo"} ou poko reponn. Ou ka kontinye kounye a, oswa fèmen li kanmenm.`,
    btnContinue: "Kontinye",
    btnEndAnyway: "Fèmen kanmenm",
    btnBack: "Retounen",
    btnNext: "Pwochen",
    btnEnd: "Fèmen Remedyasyon",
    btnExit: "Sòti",
    selectedLabel: "Ou chwazi:",
    introTotal: "Kantite kestyon nan set la:",
introQuestionsFrom: "soti nan",
fbCorrect: "✅ Kòrèk",
fbIncorrect: (correct) => `❌ Pa kòrèk — bon repons lan se ${correct}`,
fbShowWhy: "Gade eksplikasyon",
fbWhyCorrect: "Poukisa sa kòrèk",
fbPrometricSignal: "Siyal Prometric",
completeTitle: "Remedyasyon an fini",
completeBodyTop:
  "Ou fini set pratik sa a. Remedyasyon la ede ranfòse fason ou pran desizyon ki te fè nòt dènye egzamen an desann.",
completeStrengthsLabel: "Ou ranfòse",
completeNeedsLabel: "Kontinye pratike",
completeIfAllStrength:
  "Bèl travay. Si ou santi ou pare, retounen nan pratik melanje oswa fè yon lòt egzamen konplè.",
completeIfNeedsWork:
  "Fè yon lòt ti set remedyasyon pou ranfòse sa ki anlè yo anvan ou retounen nan mòd egzamen.",
btnAnotherSet: "Fè yon lòt set",
btnBackToResultsDone: "Tounen nan rezilta yo",
btnFinish: "Fini",
completeNavOverview:
  "Retounen nan kòmansman an pèmèt ou revize set remedyasyon sa a ak zòn ou te travay yo.",
completeNavResults:
  "Tounen nan rezilta yo mennen ou tounen nan rezilta egzamen an, kote ou ka kòmanse yon nouvo set remedyasyon si sa nesesè.",
categoryReviewLabel: "Kategori pou konsantre:",
attemptsLine: (n, max, outcome) => `Tantativ fini: ${n} / ${max}${outcome ? ` • Dènye rezilta: ${outcome}` : ""}`,
btnReviewLast: "Revize dènye tantativ la",
btnContinueRemediation: "Kontinye remedyasyon",
btnStartNewAttempt: "Kòmanse yon nouvo tantativ",
outcomeResolved: "Rezoud",
outcomeImproving: "Ap amelyore",
outcomeStabilizing: "Bezwen ranfòsman",

  },
};

const CATEGORY_LABELS_BY_LANG = {
  en: {
    "Scope of Practice & Reporting": "Scope of Practice & Reporting",
    "Change in Condition": "Change in Condition",
    "Observation & Safety": "Observation & Safety",
    "Environment & Safety": "Environment & Safety",
    "Infection Control": "Infection Control",
    "Personal Care & Comfort": "Personal Care & Comfort",
    "Mobility & Positioning": "Mobility & Positioning",
    "Communication & Emotional Support": "Communication & Emotional Support",
    "Dignity & Resident Rights": "Dignity & Resident Rights",
  },
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

function catLabel(catId) {
  const map = CATEGORY_LABELS_BY_LANG[lang] || CATEGORY_LABELS_BY_LANG.en;
  return map[catId] || catId;
}

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

function chapterName(ch) {
  const map = CHAPTER_NAMES_BY_LANG[lang] || CHAPTER_NAMES_BY_LANG.en;
  return map[ch] || `Chapter ${ch}`;
}

function getDisplayBlocks(q) {
  const blocks = [];

  if (!q || !q.variants) return blocks;

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

  // Safe fallback
  if (blocks.length === 0) blocks.push({ label: "EN", v: q.variants.en });

  return blocks;
}

const T = UI_TEXT[lang] || UI_TEXT.en;
function outcomeLabel(outcome) {
  if (outcome === "Resolved") return T.outcomeResolved;
  if (outcome === "Improving") return T.outcomeImproving;
  if (outcome === "Stabilizing") return T.outcomeStabilizing;
  return outcome || "";
}

// ----------------------------
// Theme / buttons (match ExamClient)
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


  // Load language preference (reuse same storage key pattern you likely use elsewhere)
  useEffect(() => {
    try {
      const stored = localStorage.getItem("cna:lang");
      if (stored) setLang(stored);
    } catch {}
  }, []);

  
  // Load remediation session
  useEffect(() => {
  if (!sessionId) return;

  const s = loadRemediationSession(sessionId);
  if (!s) {
    setError("Remediation session not found.");
    return;
  }

  setSession(s);
  setView("session"); // IMPORTANT: never show the “second intro page”
}, [sessionId]);


  const questionId = useMemo(() => {
    if (!session || !Array.isArray(session.questionIds)) return null;
    return session.questionIds[session.currentIndex] || null;
  }, [session]);

  const q = useMemo(() => {
  if (!session || !questionId) return null;
  return session.questionsById?.[questionId] || null;
}, [session, questionId]);

const isBilingualSupport = lang === "fr" || lang === "ht";

  const variantEn = useMemo(() => {
  if (!q) return null;
  return (q.variants && q.variants.en) || null;
}, [q]);

const variantSupport = useMemo(() => {
  if (!q) return null;
  if (!isBilingualSupport) return null;
  return (q.variants && q.variants[lang]) || null;
}, [q, lang, isBilingualSupport]);

const variantPrimary = useMemo(() => {
  if (!q) return null;

  // FR/HT: keep English as the clickable primary (support is shown underneath)
  if (isBilingualSupport) return (q.variants && q.variants.en) || null;

  // EN/ES: use the active language if present, else fallback to EN
  return (q.variants && q.variants[lang]) || (q.variants && q.variants.en) || null;
}, [q, lang, isBilingualSupport]);


    function persistSessionPatch(patch) {
    const next = { ...session, ...patch };
    setSession(next);

    // Review mode is view-only: do not persist changes (including currentIndex).
    if (reviewMode) return;

    saveRemediationSession(next);
  }


  function handleSelect(answerId) {
  if (!sessionId || !questionId) return;
  if (reviewMode) return; // view-only

  try {
    const updated = applyRemediationAnswerAndPersist({
      session_id: sessionId,
      questionId,
      selectedAnswerId: answerId,
      bankById: session.questionsById,
      mode: "submit",
    });

    setSession(updated);
  } catch (e) {
    setError(String(e?.message || e));
  }
}



  function goPrev() {
    if (!session) return;
    const nextIndex = Math.max(0, (session.currentIndex || 0) - 1);
    persistSessionPatch({ currentIndex: nextIndex });
  }

  function goNext() {
    if (!session) return;
    const max = (session.questionIds || []).length - 1;
    const nextIndex = Math.min(max, (session.currentIndex || 0) + 1);
    persistSessionPatch({ currentIndex: nextIndex });
  }

function goToHub() {
  setError(null);
  setReviewMode(false);
  setView("intro");

  // IMPORTANT: clear session_id and review from the URL,
  // otherwise "Continue remediation" can push the same URL and do nothing.
  if (resultsPayload?.attempt_id) {
    router.replace(
      `/remediation?attemptId=${encodeURIComponent(resultsPayload.attempt_id)}&lang=${lang}`
    );
  } else if (attemptIdParam) {
    router.replace(`/remediation?attemptId=${encodeURIComponent(attemptIdParam)}&lang=${lang}`);
  } else {
    router.replace(`/remediation?lang=${lang}`);
  }
}

function goBackToResults() {
  router.push(`/exam?lang=${lang}`);
}

  function exitRemediation() {
    router.push(`/exam?lang=${lang}`);
  }

function countUnanswered(s) {
  const ids = s?.questionIds || [];
  const answers = s?.answers || {};
  let n = 0;

  ids.forEach((qid) => {
    const a = answers[qid];
    if (!a || !a.submitted) n += 1;
  });

  return n;
}


function computeMicroOutcome(s) {
  const ids = s?.questionIds || [];
  const answers = s?.answers || {};
  let total = 0;
  let correct = 0;

  ids.forEach((qid) => {
    const a = answers[qid];
    if (a && a.submitted) {
      total += 1;
      if (a.is_correct === true) correct += 1;
    }
  });

  if (total === 0) return "Stabilizing"; // defensive default

  const acc = correct / total; // internal only, never shown

  if (acc >= 0.8) return "Resolved";
  if (acc >= 0.7) return "Improving";
  return "Stabilizing";
}

function computeRemediationLoopState({
  allSessions,
  currentSession,
}) {
  const attemptId = currentSession?.results_attempt_id || null;

  const cats = Array.isArray(currentSession?.selectedCategories)
    ? currentSession.selectedCategories
    : [];

  const catSetKey = cats.slice().sort().join("|");

  // Only COMPLETED sessions count as attempts. Exclude the current session_id (we’ll add +1 for it on the Complete page).
  const completedBefore = (allSessions || []).filter((s) => {
    if (!s) return false;
    if (s.status !== "completed") return false;
    if (s.results_attempt_id !== attemptId) return false;

    const k = (s.selectedCategories || []).slice().sort().join("|");
    if (k !== catSetKey) return false;

    if (s.session_id === currentSession.session_id) return false;
    return true;
  });

  const attemptsBefore = completedBefore.length;
  const attemptNumber = attemptsBefore + 1; // current completion attempt index

  const microOutcome =
    currentSession?.microOutcome || computeMicroOutcome(currentSession);

  const mustContinue = microOutcome === "Stabilizing" && attemptNumber < 3;
  const reachedMax = microOutcome === "Stabilizing" && attemptNumber >= 3;

  return {
    attemptId,
    catSetKey,
    attemptsBefore,
    attemptNumber,
    microOutcome,
    mustContinue,
    reachedMax,
  };
}

function QaOverlay({ data }) {
  if (!data?.enabled) return null;

  return (
    <div
      style={{
        marginTop: 12,
        border: "1px dashed #d97706",
        background: "#fff7ed",
        borderRadius: 10,
        padding: 10,
        fontSize: 12,
        lineHeight: "1.6",
        color: "#7c2d12",
      }}
    >
      <div style={{ fontWeight: 700, marginBottom: 4 }}>QA Overlay (dev-only)</div>
      <div><strong>Attempt:</strong> {data.attemptId || "—"}</div>
      <div><strong>Selected categories:</strong> {(data.selectedCats || []).join(" | ") || "—"}</div>
      <div><strong>Last outcome:</strong> {data.lastOutcome || "—"}</div>
      <div><strong>Completed attempts in set:</strong> {data.completedCount ?? 0}</div>
      <div><strong>Forced loop active:</strong> {data.isForcedLoop ? "true" : "false"}</div>
      <div><strong>Active session id:</strong> {data.activeSessionId || "—"}</div>
    </div>
  );
}

function requestExitToResults() {
  if (!session) return;

  // Exiting a session should NOT finalize it.
  // Always ask for confirmation, then return to Remediation Home if they confirm.
  setView("confirm_exit");
}



function exitToResultsAnyway() {
  try {
    if (session?.session_id) {
      markRemediationSessionExited({ session_id: session.session_id });
    }
  } catch {}

  // Go back to hub AND clear session_id from URL
  goToHub();
}




  if (error) {
  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>{T.remediationTitle}</div>
      <div style={{ marginBottom: 12, color: "crimson" }}>{error}</div>

      <button
        onClick={() => {
          // Clear error and return to Remediation Home
          setError(null);
          setReviewMode(false);
          setView("intro");
        }}
        style={btnSecondary}
      >
        {T.btnBack}
      </button>
    </div>
  );
}


  // Remediation Home (hub). This should render whenever view === "intro"
// even if session_id exists, so "Exit → confirm → End anyway" returns here.
if (view === "intro") {

  // If attemptIdParam is missing too, we truly can't attach to an exam attempt.
  if (!attemptIdParam) {
    return (
      <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
        <div style={{ fontWeight: "bold", marginBottom: 10 }}>{T.remediationTitle}</div>
        <div style={{ color: "crimson" }}>
          Missing attemptId. Return to results and open remediation again.
        </div>
        <button onClick={() => router.push(`/exam?lang=${lang}`)} style={{ ...btnSecondary, marginTop: 12 }}>
          {T.btnBackToResults}
        </button>
      </div>
    );
  }

  const isForcedLoop =
    loopState.lastOutcome === "Stabilizing" &&
    (loopState.completedCount || 0) > 0 &&
    (loopState.completedCount || 0) < 3;

  const qaOverlayData = {
    enabled: qaMode,
    attemptId: attemptIdParam,
    selectedCats: loopState.selectedCats,
    lastOutcome: loopState.lastOutcome,
    completedCount: loopState.completedCount,
    isForcedLoop,
    activeSessionId: loopState.activeSession?.session_id || null,
  };

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>{T.remediationTitle}</div>

      <div
        style={{
          border: "1px solid #d4dee8",
          borderRadius: 12,
          padding: 14,
          background: "#fbfdff",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>{T.introTitle}</div>

        <div style={{ fontSize: 14, color: "#333", lineHeight: "1.6" }}>
          <div style={{ marginBottom: 6 }}>
            {T.introBody((loopState.selectedCats || []).map(catLabel).join(" + ") || "—")}
          </div>

          <div style={{ marginTop: 10, fontSize: 13, color: "#333" }}>
  {T.attemptsLine(
    loopState.completedCount || 0,
    3,
    outcomeLabel(loopState.lastOutcome)
  )}
</div>

{isForcedLoop && (
  <div style={{ marginTop: 6, fontSize: 13, color: "#b42318" }}>
    Complete another remediation session before returning to exam results.
  </div>
)}
	        </div>

        <QaOverlay data={qaOverlayData} />

        <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
  <button
    onClick={() => {
      if (isForcedLoop) return;
      router.push(`/exam?lang=${lang}`);
    }}
    style={{ ...btnSecondary, opacity: isForcedLoop ? 0.55 : 1, cursor: isForcedLoop ? "not-allowed" : "pointer" }}
    disabled={isForcedLoop}
    title={isForcedLoop ? "Complete another remediation session before returning to results." : undefined}
  >
    {T.btnBackToResults}
  </button>

  {/* Review LAST completed attempt only */}
  {loopState.lastCompleted?.session_id && (
    <button
      onClick={() => {
        router.push(
          `/remediation?attemptId=${encodeURIComponent(attemptIdParam)}&session_id=${loopState.lastCompleted.session_id}&lang=${lang}&review=1`
        );
      }}
      style={btnSecondary}
    >
      {T.btnReviewLast}
    </button>
  )}

  <button
    onClick={() => {
      // Continue if an active session exists
      if (loopState.activeSession?.session_id) {
  const targetId = loopState.activeSession.session_id;

  // If we already have that session loaded, just switch views.
  if (sessionId && targetId === sessionId) {
    setReviewMode(false);
    setView("session");
    return;
  }

  router.push(
    `/remediation?attemptId=${encodeURIComponent(attemptIdParam)}&session_id=${targetId}&lang=${lang}`
  );
  return;
}


      // Otherwise: start a NEW attempt right here (create a new session now)
try {
  if (!resultsPayload?.attempt_id) {
    setError("Missing attemptId. Return to results and open remediation again.");
    return;
  }

  const questionBankSnapshot = Object.values(bankById || {});
  if (!questionBankSnapshot.length) {
    setError("Question bank is missing. Refresh and try again.");
    return;
  }

    // Completed sessions only count as attempts.
  // For question variety, we also avoid repeats across DIFFERENT exam attempts
  // for the same category set (global exposure).
  const allSessions = loadAllRemediationSessions() || [];

  const catSetKey = (loopState.selectedCats || []).slice().sort().join("|");

  const globalSameCatSetCompleted = (allSessions || []).filter((s) => {
    if (!s) return false;
    if (s.status !== "completed") return false;

    const k = (s.selectedCategories || []).slice().sort().join("|");
    return k === catSetKey;
  });

  const attemptScopedSeen = (loopState.completedSorted || []).flatMap((s) => s.questionIds || []);
  const globalSeen = globalSameCatSetCompleted.flatMap((s) => s.questionIds || []);

  const mergedSeen = Array.from(new Set([...(attemptScopedSeen || []), ...(globalSeen || [])]));

  const priorRemediationState = {
    seenQuestionIds: mergedSeen,
    rotationOffset: (loopState.completedSorted || []).length + globalSameCatSetCompleted.length,
  };


  const sessionNew = buildRemediationSession({
    mode: "targeted",
    resultsPayload,
    questionBankSnapshot,
    priorRemediationState,
  });

  saveRemediationSession(sessionNew);

  // Start immediately (no second home page)
  setReviewMode(false);
  setSession(sessionNew);
  setView("session");

  // Keep URL in sync for refresh
  router.replace(
    `/remediation?attemptId=${encodeURIComponent(resultsPayload.attempt_id)}&session_id=${sessionNew.session_id}&lang=${lang}`
  );
} catch (e) {
  setError(String(e?.message || e));
}

    }}
    style={{ ...btnPrimary, flexGrow: 1, minWidth: 220 }}
  >
    {loopState.activeSession?.session_id ? T.btnContinueRemediation : T.btnStartNewAttempt}
  </button>
</div>

      </div>
    </div>
  );
}


  // Loading / guardrails (prevent infinite "Loading…")
if (!session) {
  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>{T.remediationTitle}</div>
      <div>{T.loading}</div>
    </div>
  );
}

if (!questionId) {
  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>{T.remediationTitle}</div>
      <div style={{ marginBottom: 12, color: "crimson" }}>
        Missing question pointer for this session.
      </div>
      <button onClick={() => setView("intro")} style={btnSecondary}>
        {T.btnBackToOverview}
      </button>
      <button onClick={() => router.push(`/exam?lang=${lang}`)} style={{ ...btnSecondary, marginLeft: 10 }}>
        {T.btnBackToResults}
      </button>
    </div>
  );
}

if (!q) {
  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>{T.remediationTitle}</div>
      <div style={{ marginBottom: 12, color: "crimson" }}>
        Missing question data for this session.
      </div>
      <button onClick={() => setView("intro")} style={btnSecondary}>
        {T.btnBackToOverview}
      </button>
      <button onClick={() => router.push(`/exam?lang=${lang}`)} style={{ ...btnSecondary, marginLeft: 10 }}>
        {T.btnBackToResults}
      </button>
    </div>
  );
}

if (!variantEn) {
  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>{T.remediationTitle}</div>
      <div style={{ marginBottom: 12, color: "crimson" }}>
        Missing English variant for this question.
      </div>
      <button onClick={() => setView("intro")} style={btnSecondary}>
        {T.btnBackToOverview}
      </button>
      <button
        onClick={() => router.push(`/exam?lang=${lang}`)}
        style={{ ...btnSecondary, marginLeft: 10 }}
      >
        {T.btnBackToResults}
      </button>
    </div>
  );
}


if (view === "confirm_exit" && session) {
  const unanswered = countUnanswered(session);

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>
        {T.remediationTitle}
      </div>

      <div
        style={{
          border: "1px solid #d4dee8",
          borderRadius: 12,
          padding: 14,
          background: "#fbfdff",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>
          {T.endTitle}
        </div>

        <div style={{ fontSize: 14, color: "#333", lineHeight: "1.6" }}>
            
          {T.endBody(unanswered)}
        </div>

        <div
          style={{
            display: "flex",
            gap: 10,
            marginTop: 14,
            flexWrap: "wrap",
          }}
        >
          <button onClick={() => setView("session")} style={btnPrimary}>
  {T.btnContinue}
</button>


<button onClick={exitToResultsAnyway} style={{ ...btnSecondary, marginLeft: "auto" }}>
  {T.btnEndAnyway}
</button>


        </div>
      </div>
    </div>
  );
}

if (view === "complete" && session) {
  const cats = session.selectedCategories || [];

  const strengthened = [];
  const keepPracticing = [];

  cats.forEach((cat) => {
    const qids = (session.questionIds || []).filter((qid) => {
      const qq = session.questionsById?.[qid];
      return qq && qq.category_tag === cat;
    });

    const answers = qids.map((qid) => session.answers?.[qid]).filter(Boolean);

    const anyIncorrect = answers.some((a) => a.is_correct === false);
    const allCorrect = answers.length > 0 && answers.every((a) => a.is_correct === true);

    if (allCorrect) strengthened.push(catLabel(cat));
    else if (anyIncorrect) keepPracticing.push(catLabel(cat));
  });

  const allStrength = keepPracticing.length === 0;

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ fontWeight: "bold", marginBottom: 10 }}>{T.remediationTitle}</div>

      <div
        style={{
          border: "1px solid #d4dee8",
          borderRadius: 12,
          padding: 14,
          background: "#fbfdff",
        }}
      >
        <div style={{ fontWeight: "bold", marginBottom: 8 }}>{T.completeTitle}</div>

        <div style={{ fontSize: 14, color: "#333", lineHeight: "1.6" }}>
            
          <div style={{ marginBottom: 10 }}>{T.completeBodyTop}</div>

          {strengthened.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>{T.completeStrengthsLabel}</div>
              <div>{strengthened.join(" • ")}</div>
            </div>
          )}

          {keepPracticing.length > 0 && (
            <div style={{ marginBottom: 8 }}>
              <div style={{ fontWeight: "bold", marginBottom: 4 }}>{T.completeNeedsLabel}</div>
              <div>{keepPracticing.join(" • ")}</div>
            </div>
          )}

          <div style={{ marginTop: 10 }}>
            {allStrength ? T.completeIfAllStrength : T.completeIfNeedsWork}
          </div>
        </div>

<div style={{ marginTop: 12, fontSize: 13, color: "#555", lineHeight: "1.5" }}>
    <div style={{ height: 18 }} />
</div>
  {/* (Removed: button navigation explainer bubble — only one button remains) */}


                {(() => {
          const all = loadAllRemediationSessions() || [];

          const loop = computeRemediationLoopState({
            allSessions: all,
            currentSession: session,
          });

          const COPY = {
            en: {
              resolved: "Outcome: Resolved. You can return to results and continue with mixed practice.",
              improving: "Outcome: Improving. Another remediation session is recommended (not required).",
              stabilizingReq:
                "Outcome: Needs reinforcement. Another remediation session is required before returning to results.",
              stabilizingMax:
                "Outcome: Needs reinforcement. You have reached the maximum of 3 remediation attempts for this category set. Stop forced remediation and switch to broader practice.",
              attemptLine: (n) => `Remediation attempt ${n} of 3 for this category set.`,
            },
            es: {
              resolved:
                "Resultado: Resuelto. Puedes volver a resultados y continuar con práctica mixta.",
              improving:
                "Resultado: Mejorando. Se recomienda otra sesión de remediación (no es obligatoria).",
              stabilizingReq:
                "Resultado: Necesita refuerzo. Se requiere otra sesión de remediación antes de volver a resultados.",
              stabilizingMax:
                "Resultado: Necesita refuerzo. Llegaste al máximo de 3 intentos de remediación para este set de categorías. Detén la remediación obligatoria y pasa a práctica más amplia.",
              attemptLine: (n) => `Intento de remediación ${n} de 3 para este set de categorías.`,
            },
            fr: {
              resolved:
                "Résultat : Résolu. Vous pouvez revenir aux résultats et continuer en pratique mixte.",
              improving:
                "Résultat : En amélioration. Une autre session est recommandée (non obligatoire).",
              stabilizingReq:
                "Résultat : Nécessite un renforcement. Une autre session de remédiation est requise avant de revenir aux résultats.",
              stabilizingMax:
                "Résultat : Nécessite un renforcement. Vous avez atteint le maximum de 3 tentatives pour ce groupe de catégories. Arrêtez la remédiation forcée et passez à une pratique plus large.",
              attemptLine: (n) => `Tentative de remédiation ${n} sur 3 pour ce groupe de catégories.`,
            },
            ht: {
              resolved:
                "Rezilta: Rezoud. Ou ka retounen nan rezilta yo epi kontinye ak pratik melanje.",
              improving:
                "Rezilta: Ap amelyore. Yon lòt sesyon remedyasyon rekòmande (li pa obligatwa).",
              stabilizingReq:
                "Rezilta: Bezwen ranfòsman. Yon lòt sesyon remedyasyon obligatwa anvan ou retounen nan rezilta yo.",
              stabilizingMax:
                "Rezilta: Bezwen ranfòsman. Ou rive nan limit 3 tantativ pou menm kategori yo. Sispann remedyasyon obligatwa epi pase nan pratik pi laj.",
              attemptLine: (n) => `Tantativ remedyasyon ${n} sou 3 pou menm kategori yo.`,
            },
          };

          const C = COPY[lang] || COPY.en;

          let msg = C.improving;
          if (loop.microOutcome === "Resolved") msg = C.resolved;
          if (loop.microOutcome === "Stabilizing" && loop.mustContinue) msg = C.stabilizingReq;
          if (loop.microOutcome === "Stabilizing" && loop.reachedMax) msg = C.stabilizingMax;

          return (
            <>
              <div
                style={{
                  marginTop: 14,
                  padding: "12px 14px",
                  borderRadius: 12,
                  border: "1px solid #d6e0ec",
                  background: "#f4f7fb",
                  fontSize: 13,
                  color: "#333",
                  lineHeight: "1.6",
                }}
              >
                <div style={{ fontWeight: "bold", marginBottom: 6 }}>
                  {C.attemptLine(loop.attemptNumber)}
                </div>
                <div>{msg}</div>
              </div>

             <div style={{ display: "flex", gap: 10, marginTop: 14, flexWrap: "wrap" }}>
  <div style={{ display: "flex", gap: "12px", marginLeft: "auto" }}>
    <button onClick={goToHub} style={btnPrimary}>
      {T.btnBackToOverview}
    </button>
  </div>
</div>

            </>
          );
        })()}


      </div>
    </div>
  );
}

  const saved = session.answers && session.answers[questionId];
  const selected = saved ? saved.selected_answer_id : null;
  const submitted = !!saved?.submitted;
  const isLast = session.currentIndex >= (session.questionIds || []).length - 1;
  

const rationaleEn = q?.variants?.en?.rationale || null;

// FR/HT: keep English as primary + show support underneath
const rationaleSupport = isBilingualSupport ? (q?.variants?.[lang]?.rationale || null) : null;

// EN/ES: use the active language as primary (fallback to EN)
const rationalePrimary = isBilingualSupport
  ? rationaleEn
  : (q?.variants?.[lang]?.rationale || rationaleEn || null);

const whyPrimary = rationalePrimary?.why_correct || null;
const sigPrimary = rationalePrimary?.prometric_signal || null;

const whySupport = rationaleSupport?.why_correct || null;
const sigSupport = rationaleSupport?.prometric_signal || null;


  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 12, marginBottom: 10 }}>
  <div style={{ fontWeight: "bold" }}>{T.remediationTitle}</div>

  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
    <div style={{ fontSize: 12, color: "#555" }}>
      {session.currentIndex + 1} / {(session.questionIds || []).length}
    </div>

    <button onClick={requestExitToResults} style={btnExit}>
  {T.btnExit}
</button>

  </div>
</div>


      <div style={{ border: "1px solid #d4dee8", borderRadius: 12, padding: 14, background: "#fbfdff" }}>
        <div style={{ fontSize: 14, color: "red", marginBottom: 8 }}>
  <span style={{ marginRight: 6 }}>{T.categoryReviewLabel}</span>
  <strong>{catLabel(q.category_tag)}</strong>
</div>


       <div style={{ marginBottom: 10 }}>
  {getDisplayBlocks(q).map((b) => (
    <div key={b.label} style={{ fontWeight: "bold", marginTop: b.label === "EN" ? 0 : 6 }}>
      {b.v?.question_text}
    </div>
  ))}
</div>



        <div style={{ marginTop: 10 }}>
  {Object.entries((variantPrimary?.options || variantEn.options)).map(([key, textPrimary]) => {
  const isSelected = selected === key;

  const textSupport =
    variantSupport?.options && variantSupport.options[key]
      ? variantSupport.options[key]
      : null;

  return (
    <div
      key={key}
      style={{
        padding: "10px",
        marginBottom: "6px",
        fontSize: "16px",
        border: "1px solid #c6d3e0",
        borderRadius: "10px",
        background: isSelected ? "#e7f1ff" : "white",
      }}
    >
      <label style={{ display: "block", cursor: submitted ? "default" : "pointer" }}>
        <input
          type="radio"
          name={`rem-${session.session_id}`}
          value={key}
          checked={isSelected}
          onChange={() => handleSelect(key)}
          style={{ marginRight: "10px" }}
          disabled={submitted || reviewMode}

        />
        <strong style={{ marginRight: "8px" }}>{key}.</strong>
        {textPrimary}
      </label>

      {isBilingualSupport && textSupport && (
        <div
          style={{
            marginTop: 6,
            paddingLeft: 28,
            fontSize: "16px",
            color: "#333",
            opacity: 0.92,
            userSelect: "none",
          }}
        >
          {textSupport}
        </div>
      )}
    </div>
  );
})}

</div>

{submitted && selected && saved && (
  <div
    style={{
      marginTop: 12,
      padding: "10px 12px",
      borderRadius: 10,
      border: "1px solid #d4dee8",
      background: "#fbfdff",
      textAlign: "left",
    }}
  >
    <div style={{ fontWeight: "bold", fontSize: 16, marginBottom: 6 }}>
      {saved.is_correct ? T.fbCorrect : T.fbIncorrect(q.correct_answer)}
    </div>

   {(whyPrimary || sigPrimary || whySupport || sigSupport) && (

  <details>
    <summary style={{ cursor: "pointer", fontSize: 15 }}>{T.fbShowWhy}</summary>

    {(whyPrimary || whySupport) && (

      <div style={{ marginTop: 8, fontSize: 13, color: "#333", lineHeight: "1.6" }}>
        <div style={{ fontWeight: "bold", marginBottom: 4 }}>{T.fbWhyCorrect}</div>

        {/* Primary explanation (EN/ES uses active language; FR/HT uses EN) */}
{whyPrimary && <div>{whyPrimary}</div>}

{/* Support language under it for FR/HT */}
{isBilingualSupport && whySupport && whySupport !== whyPrimary && (
  <div style={{ marginTop: 6, opacity: 0.92 }}>{whySupport}</div>
)}

      </div>
    )}

    {(sigPrimary || sigSupport) && (
      <div style={{ marginTop: 10, fontSize: 13, color: "#333", lineHeight: "1.6" }}>
        <div style={{ fontWeight: "bold", marginBottom: 4 }}>{T.fbPrometricSignal}</div>

        {/* Primary signal (EN/ES uses active language; FR/HT uses EN) */}
        {sigPrimary && <div>{sigPrimary}</div>}

        {/* Support language under it for FR/HT */}
        {isBilingualSupport && sigSupport && sigSupport !== sigPrimary && (
          <div style={{ marginTop: 6, opacity: 0.92 }}>{sigSupport}</div>
        )}
      </div>
    )}
  </details>
)}

  </div>
)}
      </div>

      <div
  style={{
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
    marginTop: 14,
    flexWrap: "wrap",
  }}
>

        {session.currentIndex > 0 ? (
  <button onClick={goPrev} style={btnSecondary}>
    {T.btnBack}
  </button>
) : (
  <div />   // keeps spacing consistent
)}


{!isLast ? (
  <button
    onClick={goNext}
    disabled={session.currentIndex >= (session.questionIds || []).length - 1}
    style={btnPrimary}
  >
    {T.btnNext}
  </button>
) : (
  <button
  onClick={() => setView("complete")}
  disabled={countUnanswered(session) > 0}
  style={btnPrimary}
>
  {T.btnFinish}
</button>

)}

      </div>
    </div>
  );
}
