"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { scoreExam } from "../lib/scoring";
import { finalizeAttemptAnalytics } from "../lib/finalizeAttemptAnalytics";
import { assembleExamQuestionIds } from "../lib/examAssembly";
import {
  collectOtherExamQuestionIds,
  loadExamQuestionHistory,
  recordExamQuestionUsage,
} from "../lib/examQuestionHistory";
import {
  loadAllExamAttemptRecords,
  loadExamAttemptRecord,
  saveExamAttemptRecord,
} from "../lib/examAttemptPersistence";
import { isServerPersistenceEnabled } from "../lib/backend/config";

export default function ExamClient({ form, bankById, lang }) {
  const router = useRouter();
  const sp = useSearchParams();
  const [isNarrow, setIsNarrow] = useState(false);
  const storageMode = sp.get("storage") === "server" ? "server" : "local";
  const forceServer = storageMode === "server";
  const useServer = forceServer || isServerPersistenceEnabled();
  const serverUser = forceServer ? "dev-exam-server-user" : null;
  const queryAttemptId = sp.get("attempt_id");
  const queryTestId = Number(sp.get("test_id") || 0) || null;
  const bootAttemptedRef = useRef(false);

  function buildQuestionUsageCountsFromAttempts(attempts) {
    const counts = {};
    (attempts || []).forEach((attempt) => {
      const ids = Array.isArray(attempt?.question_ids) ? attempt.question_ids : [];
      ids.forEach((qid) => {
        if (!qid) return;
        counts[qid] = (counts[qid] || 0) + 1;
      });
    });
    return counts;
  }

  function collectOtherExamQuestionIdsFromAttempts(attempts, currentTestId) {
    const ids = new Set();
    (attempts || []).forEach((attempt) => {
      if (Number(attempt?.test_id) === Number(currentTestId)) return;
      const questionIds = Array.isArray(attempt?.question_ids) ? attempt.question_ids : [];
      questionIds.forEach((qid) => {
        if (qid) ids.add(qid);
      });
    });
    return Array.from(ids);
  }
  
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
    reviewResults: "Review Your Results",
    readiness: "Readiness",
    readinessAssessment: "Readiness Assessment",
    categoryDiagnosis: "Category Diagnosis",
    whatToStudyNext: "What to Study Next",
    backToResults: "Back to Results",
    backToAnalytics: "Back to Analytics",
    reviewQuestions: "Review Questions",
    startRemediation: "Start Remediation",
    exitToHome: "Exit to Exam Hub",
    resultsOnly: "Results",
    no: "No",
    yes: "Yes",
    summary: "Summary",
    previous: "Previous",
    next: "Next",
    endTest: "End Test",
    exit: "Exit",
    backToExam: "Back to Exam",
    all: "All",
    question: "Question",
    of: "of",
    answered: "Answered",
    notAnswered: "Not Answered",
    markForReview: "Mark for Review",
    markedForReview: "Marked for Review",
    prevPage: "Prev Page",
    nextPage: "Next Page",
    page: "Page",
    scoreLine: (percent, didPass) => `Score: ${percent}% – ${didPass ? "Pass" : "Fail"}`,
    nextStepTitle: "Next step",
nextStepOnTrack: "You’re on track. Review missed questions, or start a short remediation set to reinforce weak spots.",
nextStepBorderline: "You’re close. Start Remediation for targeted practice in the areas most likely to raise your score.",
nextStepHighRisk: "Focus on safety-critical areas first. Start Remediation to practice high-risk decisions, then review missed questions.",
    onceEnded: "Once the exam is ended, answers cannot be changed.",
    analyticsIntro:
      "This section analyzes your exam performance to help guide your next study steps. It does not affect your exam score or result.",
    categoryExplainer:
  "What these categories mean: Categories represent the types of decisions the exam is testing (for example: safety judgment, recognizing changes, or knowing when to report). They reflect decision patterns, not isolated mistakes. A single question can influence more than one category. Use this to understand how you approached decisions—not just what you missed.",
    chapterExplainer:
  "How to read this section: Chapter recommendations are based on category patterns (how the exam decisions were missed), not just the number of wrong answers in a chapter. A chapter may be recommended even if you missed fewer questions there, if it best teaches the decision rule you need next. Start with Primary chapters, then reinforce with Secondary chapters.",
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
  "Selecting YES will exit your test. You can resume it at any time on this device. Selecting NO will allow you to continue with your test.",

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
    reviewResults: "Revisar tus resultados",
    readiness: "Preparación",
    readinessAssessment: "Evaluación de preparación",
    categoryDiagnosis: "Diagnóstico por categoría",
    whatToStudyNext: "Qué estudiar después",
    backToResults: "Volver a resultados",
    backToAnalytics: "Volver a análisis",
    reviewQuestions: "Revisar preguntas",
    startRemediation: "Iniciar remediación",
    exitToHome: "Salir al Centro de Examenes",
    resultsOnly: "Resultados",
    no: "No",
    yes: "Si­",
    summary: "Resumen",
    previous: "Anterior",
    next: "Siguiente",
    endTest: "Terminar examen",
    exit: "Salir",
    backToExam: "Volver al examen",
    all: "Todas",
    question: "Pregunta",
    of: "de",
    answered: "Respondidas",
    notAnswered: "Sin responder",
    markForReview: "Marcar para revisar",
    markedForReview: "Marcada para revisar",
    prevPage: "Pagina anterior",
    nextPage: "Pagina siguiente",
    page: "Pagina",
    scoreLine: (percent, didPass) => `Puntaje: ${percent}% – ${didPass ? "Aprobado" : "No aprobado"}`,
    nextStepTitle: "Siguiente paso",
nextStepOnTrack: "Vas por buen camino. Revisa las preguntas falladas o inicia una remediación corta para reforzar puntos débiles.",
nextStepBorderline: "Estás muy cerca. Inicia Remediación para practicar de forma dirigida las áreas que más subirán tu puntaje.",
nextStepHighRisk: "Enfócate primero en áreas críticas de seguridad. Inicia Remediación para practicar decisiones de alto riesgo y luego revisa las preguntas falladas.",
    onceEnded: "Una vez finalizado el examen, las respuestas no se pueden cambiar.",
    analyticsIntro:
      "Esta sección analiza tu desempeño para guiar tus próximos pasos de estudio. No afecta tu puntaje ni tu resultado.",
    categoryExplainer:
  "Qué significan estas categorías: Las categorías representan los tipos de decisiones que el examen evalúa (por ejemplo: seguridad, reconocer cambios o saber cuándo reportar). Reflejan patrones de decisión, no errores aislados. Una sola pregunta puede influir en más de una categoría. Use esto para entender cómo tomó decisiones, no solo qué preguntas falló.",
    chapterExplainer:
  "Cómo leer esta sección: Las recomendaciones de capítulos se basan en patrones por categoría (cómo se tomaron las decisiones en el examen), no solo en la cantidad de respuestas incorrectas por capítulo. Un capítulo puede recomendarse aunque haya fallado pocas preguntas en él, si es el mejor lugar para aprender la regla de decisión que necesita reforzar. Comience con los capítulos Primarios y luego refuerce con los Secundarios.",
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
  "Seleccionar SI saldra del examen. Podras reanudarlo en cualquier momento en este dispositivo. Seleccionar NO te permitira continuar con el examen.",

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
    reviewResults: "Revoir vos résultats",
    readiness: "Préparation",
    readinessAssessment: "Évaluation de préparation",
    categoryDiagnosis: "Diagnostic par catégorie",
    whatToStudyNext: "Quoi étudier ensuite",
    backToResults: "Retour aux résultats",
    backToAnalytics: "Retour à l’analyse",
    reviewQuestions: "Revoir les questions",
    startRemediation: "Commencer la remédiation",
    exitToHome: "Quitter vers le hub d'examen",
    resultsOnly: "Résultats",
    no: "Non",
    yes: "Oui",
    summary: "Résumé",
    previous: "Précédent",
    next: "Suivant",
    endTest: "Terminer le test",
    exit: "Quitter",
    backToExam: "Retour à l’examen",
    all: "Toutes",
    question: "Question",
    of: "sur",
    answered: "Répondues",
    notAnswered: "Sans réponse",
    markForReview: "Marquer pour révision",
    markedForReview: "Marquée pour révision",
    prevPage: "Page précédente",
    nextPage: "Page suivante",
    page: "Page",
    scoreLine: (percent, didPass) => `Score : ${percent}% – ${didPass ? "Réussi" : "Échoué"}`,
    nextStepTitle: "Prochaine étape",
nextStepOnTrack: "Vous êtes sur la bonne voie. Revoyez les questions manquées ou commencez une courte remédiation pour renforcer vos points faibles.",
nextStepBorderline: "Vous êtes proche. Commencez la remédiation pour une pratique ciblée des domaines qui amélioreront le plus votre score.",
nextStepHighRisk: "Concentrez-vous d’abord sur les domaines critiques pour la sécurité. Commencez la remédiation pour pratiquer les décisions à haut risque, puis revoyez les questions manquées.",
    onceEnded: "Une fois l’examen terminé, les réponses ne peuvent plus être modifiées.",
    analyticsIntro:
      "Cette section analyse vos résultats pour guider vos prochaines étapes d’étude. Elle n’affecte pas votre score ni votre résultat.",
    categoryExplainer:
  "Ce que signifient ces catégories : Les catégories représentent les types de décisions évaluées par l’examen (par exemple : sécurité, reconnaissance des changements ou savoir quand signaler). Elles reflètent des schémas de décision, et non des erreurs isolées. Une seule question peut influencer plusieurs catégories. Utilisez cette section pour comprendre comment vous avez pris vos décisions, pas seulement ce que vous avez manqué.",
    chapterExplainer:
  "Comment lire cette section : Les recommandations de chapitres sont basées sur des schémas par catégorie (la manière dont les décisions ont été prises), et non uniquement sur le nombre de réponses incorrectes dans un chapitre. Un chapitre peut être recommandé même si peu de questions y ont été manquées, s’il enseigne le mieux la règle de décision à renforcer. Commencez par les chapitres Principaux, puis consolidez avec les Secondaires.",
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
  "Selectionner OUI quittera lexamen. Vous pourrez le reprendre a tout moment sur cet appareil. Selectionner NON vous permettra de continuer lexamen.",

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
    reviewResults: "Revize rezilta ou yo",
    readiness: "Preparasyon",
    readinessAssessment: "Evalyasyon preparasyon",
    categoryDiagnosis: "Dyagnostik pa kategori",
    whatToStudyNext: "Sa pou etidye apre",
    backToResults: "Tounen nan rezilta yo",
    backToAnalytics: "Tounen nan analiz la",
    reviewQuestions: "Revize kesyon yo",
    startRemediation: "Kòmanse remedyasyon",
    exitToHome: "Soti pou ale nan Hub Egzamen an",
    resultsOnly: "Rezilta",
    no: "Non",
    yes: "Wi",
    summary: "Rezime",
    previous: "Anvan",
    next: "Pwochen",
    endTest: "Fini tès la",
    exit: "Soti",
    backToExam: "Tounen nan egzamen an",
    all: "Tout",
    question: "Kesyon",
    of: "sou",
    answered: "Reponn",
    notAnswered: "San repons",
    markForReview: "Make pou revize",
    markedForReview: "Make pou revize",
    prevPage: "Paj anvan",
    nextPage: "Paj apre",
    page: "Paj",
    scoreLine: (percent, didPass) => `Nòt: ${percent}% – ${didPass ? "Pase" : "Pa pase"}`,
    nextStepTitle: "Pwochen etap",
nextStepOnTrack: "Ou sou bon wout la. Revize kestyon ou rate yo, oswa kòmanse yon ti remedyasyon pou ranfòse pwen fèb yo.",
nextStepBorderline: "Ou prèt pou w pase. Kòmanse Remedyasyon pou pratike zòn ki pi ka ogmante nòt ou.",
nextStepHighRisk: "Fòk ou konsantre sou zòn sekirite ki pi enpòtan yo anvan. Kòmanse Remedyasyon pou pratike desizyon ki gen gwo risk, epi apre sa revize kestyon ou rate yo.",
    onceEnded: "Lè egzamen an fini, ou pa ka chanje repons yo ankò.",
    analyticsIntro:
      "Seksiyon sa a analize pèfòmans ou pou gide pwochen etap etid ou. Li pa chanje nòt oswa rezilta ou.",
    categoryExplainer:
  "Sa kategori sa yo vle di: Kategori yo montre kalite desizyon egzamen an ap teste (pa egzanp: sekirite, rekonèt chanjman, oswa konnen kilè pou rapòte). Yo montre modèl nan fason ou pran desizyon, pa erè izole sèlman. Yon sèl kesyon ka gen enpak sou plis pase yon kategori. Sèvi ak sa pou konprann kijan ou te pran desizyon yo, pa sèlman ki kesyon ou rate.",
    chapterExplainer:
  "Kijan pou li seksyon sa a: Rekòmandasyon chapit yo baze sou modèl kategori (fason desizyon yo te pran), pa sèlman sou kantite repons ki te mal nan yon chapit. Yon chapit ka rekòmande menm si ou rate kèk kesyon ladan li, si se pi bon kote pou aprann règ desizyon ou bezwen ranfòse. Kòmanse ak chapit Prensipal yo, epi kontinye ak chapit Segondè yo.",
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
  "Chwazi WI ap fe ou soti nan egzamen an. Ou ka reprann li nenpot ki le sou aparey sa a. Chwazi NON ap pemet ou kontinye egzamen an.",

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
  if (Number.isFinite(queryTestId) && queryTestId >= 1 && queryTestId <= 4) return queryTestId;
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

  const hubUrl = useMemo(
    () => `/pilot?lang=${lang}${useServer ? "&storage=server" : ""}`,
    [lang, useServer]
  );

  function safeReadState() {
    if (useServer) return null;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      return JSON.parse(raw);
    } catch {
      return null;
    }
  }

  function safeWriteState(next) {
    if (useServer) {
      void saveExamAttemptRecord(
        {
          ...next,
          test_id: testId,
          lang,
          score: computeCurrentPercent(),
          resultsPayload,
        },
        { forceServer: useServer, serverUser }
      );
      return;
    }
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    } catch {
      // ignore
    }
  }

  function computeCurrentPercent() {
    if (!deliveredQuestionIds.length) return null;
    const formForScoring = { ...form, question_ids: deliveredQuestionIds };
    const result = scoreExam({ form: formForScoring, bankById, answersByQid });
    if (!result?.total) return null;
    return Math.round((result.correct / result.total) * 100);
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
  const [openRationaleQid, setOpenRationaleQid] = useState(null);

  // TIMER: 90-minute countdown (Prometric style)
  // For testing, temporarily set START_SEC = 30
  const START_SEC = 60*90; // 5400

  const [endAtMs, setEndAtMs] = useState(null);
  const [remainingSec, setRemainingSec] = useState(START_SEC);

  // ----------------------------
  // Theme / buttons
  // ----------------------------
  const theme = {
    frameBorder: "var(--frame-border)",
    chromeBg: "var(--chrome-bg)",
    chromeBorder: "var(--chrome-border)",
    primaryBg: "var(--brand-teal)",
    primaryText: "white",
    secondaryBg: "var(--brand-teal-soft)",
    secondaryText: "var(--brand-teal-dark)",
    buttonBorder: "var(--button-border)",
    link: "var(--brand-teal-dark)",
  };

  const btnBase = {
    padding: "11px 14px",
    fontSize: "14px",
    borderRadius: "12px",
    border: `1px solid ${theme.buttonBorder}`,
    cursor: "pointer",
    fontWeight: 600,
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

  const shellFrame = {
    border: `2px solid ${theme.frameBorder}`,
    borderRadius: "16px",
    display: "flex",
    flexDirection: "column",
    overflow: "hidden",
    background: "white",
    boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
  };

  const shellHeader = {
    borderBottom: `1px solid ${theme.chromeBorder}`,
    padding: "18px 20px",
    background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
    color: "var(--heading)",
  };

  const shellFooter = {
    borderTop: `1px solid ${theme.chromeBorder}`,
    padding: "16px 20px",
    background: "var(--surface-soft)",
  };

  const softPanel = {
    border: "1px solid var(--chrome-border)",
    borderRadius: "14px",
    background: "var(--surface-soft)",
  };

  const actionButtonStyle = isNarrow
    ? { width: "100%", flex: "1 1 100%" }
    : { minWidth: "180px", flex: "1 1 220px" };

  function formatRemaining(sec) {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    const mm = String(m).padStart(2, "0");
    const ss = String(s).padStart(2, "0");
    return `${mm}:${ss}`;
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

  // ----------------------------
  // Load saved state on first mount
  // ----------------------------
  useEffect(() => {
  if (bootAttemptedRef.current) return;
  bootAttemptedRef.current = true;

  if (useServer) {
    void (async () => {
      const now = Date.now();

      if (queryAttemptId) {
        const saved = await loadExamAttemptRecord(queryAttemptId, { forceServer: useServer, serverUser });
        if (!saved) {
          router.replace(hubUrl);
          return;
        }

        if (saved.attempt_id) setAttemptId(saved.attempt_id);
        if (Number(saved.test_id)) setTestId(Number(saved.test_id));
        setDeliveredQuestionIds(saved.question_ids || []);
        if (typeof saved.index === "number") setIndex(saved.index);
        if (saved.answersByQid && typeof saved.answersByQid === "object") setAnswersByQid(saved.answersByQid);
        if (saved.reviewByQid && typeof saved.reviewByQid === "object") setReviewByQid(saved.reviewByQid);
        if (saved.resultsPayload) setResultsPayload(saved.resultsPayload);
        if (typeof saved.mode === "string") setMode(saved.mode === "confirm_exit" ? "exam" : saved.mode);
        if (typeof saved.summaryPage === "number") setSummaryPage(saved.summaryPage);
        if (typeof saved.summaryFilter === "string") setSummaryFilter(saved.summaryFilter);

        if (typeof saved.pausedRemainingSec === "number") {
          const sec = Math.max(0, Math.floor(saved.pausedRemainingSec));
          const computedEndAt = now + sec * 1000;
          setEndAtMs(computedEndAt);
          setRemainingSec(sec);
        } else if (typeof saved.endAtMs === "number") {
          setEndAtMs(saved.endAtMs);
          const sec = Math.max(0, Math.ceil((saved.endAtMs - now) / 1000));
          setRemainingSec(sec);
          if (
            sec === 0 &&
            saved.mode !== "finished" &&
            saved.mode !== "time_expired" &&
            saved.mode !== "rationales" &&
            saved.mode !== "analytics"
          ) {
            setMode("time_expired");
          }
        } else {
          const computedEndAt = now + START_SEC * 1000;
          setEndAtMs(computedEndAt);
          setRemainingSec(START_SEC);
        }
        return;
      }

      const newAttemptId = generateAttemptId();
      setAttemptId(newAttemptId);

      const questionBankSnapshot = Object.values(bankById);
      const priorAttempts = await loadAllExamAttemptRecords(lang, { forceServer: useServer, serverUser });
      const questionUsageCounts = buildQuestionUsageCountsFromAttempts(priorAttempts);
      const otherExamQuestionIds = collectOtherExamQuestionIdsFromAttempts(
        priorAttempts,
        queryTestId || testId
      );

      let picked = null;
      try {
        picked = assembleExamQuestionIds({
          questionBankSnapshot,
          excludedQuestionIds: Array.from(new Set([...otherExamQuestionIds, ...Object.keys(questionUsageCounts)])),
          questionUsageCounts,
        });
      } catch {
        picked = assembleExamQuestionIds({
          questionBankSnapshot,
          excludedQuestionIds: otherExamQuestionIds,
          questionUsageCounts,
          });
      }

      setDeliveredQuestionIds(picked);

      const computedEndAt = now + START_SEC * 1000;
      setEndAtMs(computedEndAt);
      setRemainingSec(START_SEC);

      const params = new URLSearchParams({
        lang,
        test_id: String(queryTestId || testId),
        attempt_id: newAttemptId,
      });
      if (useServer) params.set("storage", "server");
      router.replace(`/exam?${params.toString()}`);
    })();
    return;
  }

  const saved = safeReadState();
  const now = Date.now();

  // LANGUAGE MISMATCH: hard reset exam state
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

  // NORMAL RESTORE (same language)
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

  // PAUSE-FRIENDLY RESUME:
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

  if (
    sec === 0 &&
    saved.mode !== "finished" &&
    saved.mode !== "time_expired" &&
    saved.mode !== "rationales" &&
    saved.mode !== "analytics"
  ) {
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

  const questionBankSnapshot = Object.values(bankById);
  const questionUsageCounts = loadExamQuestionHistory(form.exam_form_id);
  const otherExamQuestionIds = collectOtherExamQuestionIds({
    formId: form.exam_form_id,
    currentTestId: testId,
    lang,
    maxTests: 4,
  });

  let picked = null;
  try {
    picked = assembleExamQuestionIds({
      questionBankSnapshot,
      excludedQuestionIds: Array.from(
        new Set([...otherExamQuestionIds, ...Object.keys(questionUsageCounts)])
      ),
      questionUsageCounts,
    });
  } catch {
    picked = assembleExamQuestionIds({
      questionBankSnapshot,
      excludedQuestionIds: otherExamQuestionIds,
      questionUsageCounts,
    });
  }

  recordExamQuestionUsage(form.exam_form_id, picked);
  setDeliveredQuestionIds(picked);

  const computedEndAt = now + START_SEC * 1000;
  setEndAtMs(computedEndAt);
  setRemainingSec(START_SEC);
}
  // eslint-disable-next-line react-hooks/exhaustive-deps
}, [STORAGE_KEY, bankById, form.exam_form_id, hubUrl, lang, queryAttemptId, queryTestId, router, serverUser, testId, useServer]);

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
  resultsPayload,
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

  if (useServer) {
    if (resultsPayload) return;

    let cancelled = false;
    void (async () => {
      const saved = await loadExamAttemptRecord(attemptId, { forceServer: useServer, serverUser });
      if (!cancelled && saved?.resultsPayload) {
        setResultsPayload(saved.resultsPayload);
      }
    })();

    return () => {
      cancelled = true;
    };
  }

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
}, [attemptId, mode, resultsPayload, serverUser, useServer]);

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
  } else if (res.resultsPayload) {
    setResultsPayload(res.resultsPayload);
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

  function renderUiLines(lines, options = {}) {
    const {
      tone = "body",
      centered = false,
      compact = false,
    } = options;

    const toneStyles =
      tone === "headline"
        ? {
            textColor: "var(--heading)",
            fontSize: isNarrow ? "18px" : "20px",
            fontWeight: 800,
          }
        : tone === "warning"
        ? {
            textColor: "var(--brand-red)",
            fontSize: isNarrow ? "14px" : "15px",
            fontWeight: 700,
          }
        : {
            textColor: "#445a6c",
            fontSize: isNarrow ? "14px" : "15px",
            fontWeight: 500,
          };

    const showLabels = lang === "fr" || lang === "ht";

    return (
      <div
        style={{
          display: "grid",
          gap: compact ? "8px" : "10px",
          justifyItems: centered ? "center" : "stretch",
        }}
      >
        {lines.map((l) => (
          <div
            key={`${l.label}-${l.text}`}
            style={{
              display: "flex",
              alignItems: "flex-start",
              justifyContent: centered ? "center" : "flex-start",
              gap: showLabels ? "10px" : "0px",
              textAlign: centered ? "center" : "left",
            }}
          >
            {showLabels && l.label ? (
              <span
                style={{
                  minWidth: "34px",
                  padding: "3px 8px",
                  borderRadius: "999px",
                  border: "1px solid var(--chrome-border)",
                  background: "white",
                  color: "var(--brand-teal-dark)",
                  fontSize: "11px",
                  fontWeight: 800,
                  letterSpacing: "0.04em",
                  lineHeight: 1.2,
                }}
              >
                {l.label}
              </span>
            ) : null}
            <span
              style={{
                color: toneStyles.textColor,
                fontSize: toneStyles.fontSize,
                fontWeight: toneStyles.fontWeight,
                lineHeight: 1.55,
                maxWidth: "640px",
              }}
            >
              {l.text}
            </span>
          </div>
        ))}
      </div>
    );
  }

  function splitIntoTwoSentenceLines(text) {
    const parts = String(text).split(". ");
    if (parts.length <= 2) return [text];
    const first = `${parts.slice(0, -1).join(". ")}.`;
    const last = parts[parts.length - 1];
    return [first, last];
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
            ...shellFrame,
            minHeight: "675px",
            marginTop: "20px",
          }}
        >
          <div
          style={{
              ...shellHeader,
              fontWeight: "bold",
              textTransform: "uppercase",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span>{T.resultsPage}</span>
            <button
              onClick={() => {
                router.push(hubUrl);
              }}
              style={{
                ...btnSecondary,
                minWidth: "130px",
                padding: "8px 12px",
                fontSize: "13px",
                opacity: 0.92,
                background: "white",
                color: "#536779",
                border: "1px solid #cfdde6",
              }}
            >
              {T.exitToHome}
            </button>
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
            <div style={{ maxWidth: "720px", width: "100%" }}>
              <div
  style={{
    maxWidth: "640px",
    margin: "0 auto 16px",
    ...softPanel,
    padding: isNarrow ? "16px" : "20px",
    textAlign: "center",
    background: didPass
      ? "linear-gradient(180deg, #f5fff7 0%, #e8f7ee 100%)"
      : "linear-gradient(180deg, #fff8f8 0%, #fff0f0 100%)",
    border: didPass ? "1px solid #b8ddc1" : "1px solid #f0caca",
  }}
>
  <div
    style={{
      fontSize: "12px",
      fontWeight: 700,
      letterSpacing: "0.08em",
      textTransform: "uppercase",
      color: didPass ? "#2f6b43" : "#9f3131",
      marginBottom: "8px",
    }}
  >
    {T.resultsOnly}
  </div>
  <div
    style={{
      fontSize: isNarrow ? "28px" : "32px",
      fontWeight: "bold",
      marginBottom: "8px",
      color: didPass ? "#1f6f3d" : "var(--brand-red)",
    }}
  >
    {T.scoreLine(percent, didPass)}
  </div>

  {resultsPayload?.overall_status && (
    <div
      style={{
        fontSize: "15px",
        color: "#334455",
        marginBottom: "12px",
        lineHeight: 1.6,
      }}
    >
      {T.readinessAssessment}:{" "}
      <span style={{ fontWeight: "700", color: "#22313d" }}>
        {resultsPayload.overall_status === "On Track"
          ? T.statusOnTrack
          : resultsPayload.overall_status === "High Risk"
            ? T.statusHighRisk
            : T.statusBorderline}
      </span>
    </div>
  )}

  <div style={{ fontSize: "14px", color: "#4d6174", lineHeight: 1.65 }}>
    {T.analyticsExplain}
  </div>
</div>

{resultsPayload?.overall_status && (
  <div
    style={{
      margin: "0 auto 14px",
      maxWidth: "640px",
      ...softPanel,
      padding: "12px 14px",
      textAlign: "left",
      background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
    }}
  >
    <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "6px", color: "var(--heading)" }}>
      {T.nextStepTitle}
    </div>

    <div style={{ fontSize: "14px", lineHeight: "1.65", color: "#334455" }}>
      {resultsPayload.overall_status === "On Track"
        ? T.nextStepOnTrack
        : resultsPayload.overall_status === "High Risk"
          ? T.nextStepHighRisk
          : T.nextStepBorderline}
    </div>
  </div>
)}

              <div
                style={{
                  maxWidth: "640px",
                  margin: "0 auto",
                  ...softPanel,
                  padding: "14px",
                  textAlign: "left",
                }}
              >
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isNarrow ? "1fr 1fr" : "repeat(4, minmax(0, 1fr))",
                    gap: 10,
                    marginBottom: "14px",
                  }}
                >
                  {[
                    [T.total, result.total],
                    [T.correct, result.correct],
                    [T.incorrect, result.incorrect],
                    [T.unanswered, result.unanswered],
                  ].map(([label, value]) => (
                    <div
                      key={label}
                      style={{
                        border: "1px solid var(--chrome-border)",
                        borderRadius: 12,
                        background: "white",
                        padding: "12px 12px",
                      }}
                    >
                      <div style={{ fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>
                        {label}
                      </div>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--heading)" }}>{value}</div>
                    </div>
                  ))}
                </div>

                <div style={{ marginTop: "14px" }}>
  <div style={{ fontWeight: "bold", marginBottom: "6px", color: "var(--heading)" }}>
    {T.scoreByChapter}
  </div>

  <div style={{ fontSize: "12px", color: "#555", marginBottom: "10px" }}>
    {T.scoreByChapterHint}
  </div>

  {[1, 2, 3, 4, 5].map((ch) => (
    <div
      key={ch}
      style={{
        fontSize: "15px",
        marginBottom: "8px",
        padding: "10px 12px",
        border: "1px solid var(--chrome-border)",
        borderRadius: 12,
        background: "white",
        display: "flex",
        justifyContent: "space-between",
        gap: 12,
        alignItems: isNarrow ? "flex-start" : "center",
        flexWrap: "nowrap",
      }}
    >
      <span style={{ color: "#334455", flex: 1, minWidth: 0, lineHeight: 1.45 }}>
        {CHAPTER_NAMES[ch]}
      </span>
      <strong style={{ color: "var(--heading)", flexShrink: 0, whiteSpace: "nowrap" }}>
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
    flexWrap: "wrap",
    ...shellFooter,
  }}
>
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
  style={{ ...btnPrimary, ...actionButtonStyle }}
>
  {T.reviewResults || T.analytics}
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
            ...shellFrame,
            minHeight: "675px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              ...shellHeader,
            }}
          >
            <span style={{ fontWeight: 800, fontSize: isNarrow ? "17px" : "18px" }}>
              {T.timeExpiredTitle}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isNarrow ? "18px" : "22px",
            }}
          >
            <div
              style={{
                ...softPanel,
                width: "100%",
                maxWidth: "720px",
                padding: isNarrow ? "18px" : "22px",
                background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
              }}
            >
              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <div style={{ fontSize: isNarrow ? "22px" : "24px", lineHeight: "1" }}>⚠️</div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                {renderUiLines(getUiLines("timeExpiredHeadline"), {
                  tone: "headline",
                  centered: true,
                  compact: true,
                })}
              </div>

              <div style={{ marginBottom: "16px" }}>
                {renderUiLines(getUiLines("timeExpiredExplanation"), {
                  centered: true,
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              ...shellFooter,
              display: "flex",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setMode("finished")}
              style={{ ...btnPrimary, ...(isNarrow ? { width: "100%" } : { minWidth: "220px" }) }}
            >
              {T.resultsOnly}
            </button>
          </div>
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
  const REVIEW_TEXT = {
    en: {
      noMissedQuestions: "No missed questions.",
      question: "Question",
      yourAnswer: "Your Answer",
      unanswered: "Unanswered",
      correctAnswer: "Correct Answer",
      openHint: isNarrow ? "Tap to open" : "Click to open",
      closeHint: isNarrow ? "Tap to close" : "Click to close",
    },
    es: {
      noMissedQuestions: "No hay preguntas falladas.",
      question: "Pregunta",
      yourAnswer: "Tu respuesta",
      unanswered: "Sin responder",
      correctAnswer: "Respuesta correcta",
      openHint: isNarrow ? "Toque para abrir" : "Haga clic para abrir",
      closeHint: isNarrow ? "Toque para cerrar" : "Haga clic para cerrar",
    },
    fr: {
      noMissedQuestions: "Aucune question manquée.",
      question: "Question",
      yourAnswer: "Votre réponse",
      unanswered: "Sans réponse",
      correctAnswer: "Bonne réponse",
      openHint: isNarrow ? "Touchez pour ouvrir" : "Cliquez pour ouvrir",
      closeHint: isNarrow ? "Touchez pour fermer" : "Cliquez pour fermer",
    },
    ht: {
      noMissedQuestions: "Pa gen kestyon ou rate.",
      question: "Kesyon",
      yourAnswer: "Repons ou",
      unanswered: "San repons",
      correctAnswer: "Bon repons",
      openHint: isNarrow ? "Peze pou louvri" : "Klike pou louvri",
      closeHint: isNarrow ? "Peze pou femen" : "Klike pou femen",
    },
  };

  const REVIEW_SECTION_LABELS = {
    EN: { rationale: "Rationale", signal: "Prometric Signal", unavailable: "Rationale not available.", signalUnavailable: "Prometric Signal not available." },
    ES: { rationale: "Justificación", signal: "Señal de Prometric", unavailable: "Justificación no disponible.", signalUnavailable: "Señal de Prometric no disponible." },
    FR: { rationale: "Justification", signal: "Signal Prometric", unavailable: "Justification non disponible.", signalUnavailable: "Signal Prometric non disponible." },
    HT: { rationale: "Eksplikasyon", signal: "Siyal Prometric", unavailable: "Eksplikasyon pa disponib.", signalUnavailable: "Siyal Prometric pa disponib." },
  };

  const RT = REVIEW_TEXT[lang] || REVIEW_TEXT.en;

  deliveredQuestionIds.forEach((qid) => {
    const q = bankById[qid];
    if (!q) return;

    const ch = Number(q.chapter_tag);
    if (missedCounts[ch] === undefined) return;

    const userAns = answersByQid[qid];
    const missed = !userAns || userAns !== q.correct_answer;
    if (missed) missedCounts[ch] += 1;
  });

  const availableReviewChapters = [1, 2, 3, 4, 5].filter((ch) => (missedCounts[ch] || 0) > 0);
  const activeRationaleChapter = availableReviewChapters.includes(Number(rationaleChapter))
    ? Number(rationaleChapter)
    : (availableReviewChapters[0] || 1);

  function handleRationaleToggle(qid, e) {
    const isOpen = !!e?.target?.open;
    setOpenRationaleQid(isOpen ? qid : null);
    if (!isOpen) return;
    try {
      document.querySelectorAll('details[data-rationale]').forEach((d) => {
        if (d.getAttribute("data-rationale") !== String(qid)) d.open = false;
      });
    } catch {}
  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          ...shellFrame,
          marginTop: "20px",
        }}
      >
        <div
          style={{
            ...shellHeader,
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
          <button
            onClick={() => setMode("analytics")}
            style={{
              ...btnSecondary,
              minWidth: "130px",
              padding: "8px 12px",
              fontSize: "13px",
              opacity: 0.92,
              background: "white",
              color: "#536779",
              border: "1px solid #cfdde6",
            }}
          >
            {T.backToAnalytics}
          </button>

        </div>

        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
  {(() => {
    const missedQids = deliveredQuestionIds.filter((qid) => {
  const q = bankById[qid];
  if (!q) return false;

  const ch = Number(q.chapter_tag);
  if (ch !== activeRationaleChapter) return false;

  const userAns = answersByQid[qid];
  if (!userAns) return true; // unanswered
  return userAns !== q.correct_answer; // incorrect
});

    if (missedQids.length === 0) {
      return <div style={{ fontSize: "14px", color: "#333" }}>{RT.noMissedQuestions}</div>;
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

      const isOpen = openRationaleQid === qid;

      return (
        <details
          key={qid}
          data-rationale={String(qid)}
          style={{
            border: "1px solid #d4dee8",
            borderRadius: "10px",
            padding: "12px",
            marginBottom: "12px",
            background: "#fbfdff",
          }}
          onToggle={(e) => handleRationaleToggle(qid, e)}
        >
          <summary
            style={{
              cursor: "pointer",
              listStyle: "none",
              outline: "none",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "flex-start",
                gap: "8px",
                marginBottom: "6px",
              }}
            >
              <div style={{ fontWeight: "bold", color: "var(--heading)" }}>
                {RT.question} {num}
              </div>
              <div style={{ color: "#607282", fontSize: "12px", fontWeight: 700, whiteSpace: "nowrap" }}>
                {isOpen ? RT.closeHint : RT.openHint}
              </div>
            </div>
            <div style={{ display: "grid", gap: "4px", color: "#516677", fontSize: "13px", lineHeight: "1.5" }}>
              <div>
                <strong>{RT.yourAnswer}:</strong> {userAns ? userAns : RT.unanswered}
              </div>
              <div>
                <strong>{RT.correctAnswer}:</strong> {correct}
              </div>
            </div>
          </summary>

          <div style={{ marginTop: "12px", paddingTop: "10px", borderTop: "1px solid #e2ebf4" }}>

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
      {REVIEW_SECTION_LABELS[lang === "es" ? "ES" : lang === "fr" ? "FR" : lang === "ht" ? "HT" : "EN"].unavailable}
    </div>
  ) : (
    rationaleBlocks.map((rb) => {
      const sectionLabels = REVIEW_SECTION_LABELS[rb.label] || REVIEW_SECTION_LABELS.EN;
      return (
      <div key={rb.label} style={{ marginBottom: "12px" }}>
        <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "6px" }}>
          {rb.label} - {sectionLabels.rationale}
        </div>
        <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#222" }}>
          {rb.r?.why_correct || sectionLabels.unavailable}
        </div>

        <div style={{ marginTop: "10px" }}>
          <div style={{ fontWeight: "bold", fontSize: "15px", marginBottom: "6px" }}>
            {rb.label} - {sectionLabels.signal}
          </div>
          <div style={{ fontSize: "13px", lineHeight: "1.6", color: "#222" }}>
            {rb.r?.prometric_signal || sectionLabels.signalUnavailable}
          </div>
        </div>
      </div>
    );
    })
  )}
</div>
</div>
        </details>
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
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center" }}>
  {availableReviewChapters.map((ch) => {
  const isActive = ch === activeRationaleChapter;
  const count = missedCounts[ch] || 0;
  const isEnabled = count > 0;

{analyticsUnavailable && (
  <div style={{ marginRight: "auto", color: "red", fontSize: "13px" }}>
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
        border: isEnabled
          ? isActive
            ? "2px solid var(--brand-red)"
            : "1px solid rgba(204, 0, 0, 0.35)"
          : "1px solid #d7e2e8",
        background: isEnabled
          ? isActive
            ? "var(--brand-red-soft)"
            : "white"
          : "#f5f8fa",
        color: isEnabled ? (isActive ? "var(--brand-red)" : "#8c3a3a") : "#8a98a5",
        fontWeight: isActive ? "bold" : 600,
        cursor: isEnabled ? "pointer" : "not-allowed",
      }}
    >
      Ch {ch} ({count})
    </button>
  );
})}
</div>
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

  const CATEGORY_NAMES_BY_LANG = {
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

  const CATEGORY_GUIDE = {
    "Scope of Practice & Reporting": { primary: [1], secondary: [4, 5], lens: "Is this within my role, or do I observe and report?" },
    "Change in Condition": { primary: [4], secondary: [3, 5], lens: "What is different from this resident’s baseline?" },
    "Observation & Safety": { primary: [4], secondary: [3, 2], lens: "What should I notice right now to prevent harm?" },
    "Environment & Safety": { primary: [2], secondary: [3], lens: "Is the physical environment safe and compliant?" },
    "Infection Control": { primary: [2], secondary: [3, 4], lens: "What prevents contamination or spread?" },
    "Personal Care & Comfort": { primary: [3], secondary: [4], lens: "Am I supporting comfort and independence?" },
    "Mobility & Positioning": { primary: [3], secondary: [4], lens: "Is movement safe and biomechanically correct?" },
    "Communication & Emotional Support": { primary: [5], secondary: [1, 3], lens: "How should I respond verbally and emotionally?" },
    "Dignity & Resident Rights": { primary: [1], secondary: [3, 5], lens: "Am I preserving autonomy and respect?" },
  };

  const CATN = CATEGORY_NAMES_BY_LANG[lang] || CATEGORY_NAMES_BY_LANG.en;

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

  const LENS_CANONICAL_BY_VARIANT = Object.values(LENS_BY_LANG).reduce((acc, lensMap) => {
    Object.entries(lensMap).forEach(([canonical, localized]) => {
      acc[String(canonical || "").trim()] = canonical;
      acc[String(localized || "").trim()] = canonical;
    });
    return acc;
  }, {});

  function localizeLensTitle(rawLens) {
    const normalized = String(rawLens || "").trim();
    const canonical = LENS_CANONICAL_BY_VARIANT[normalized] || normalized;
    if (LENS[canonical]) return LENS[canonical].trim();

    const lower = normalized.toLowerCase();
    const inferredCanonical =
      lower.includes("within my role") || lower.includes("observe and report") || lower.includes("rol") || lower.includes("rap") ? "Is this within my role, or do I observe and report?" :
      lower.includes("baseline") || lower.includes("habituel") || lower.includes("condici") || lower.includes("kondisyon") ? "What is different from this resident?s baseline?" :
      ((lower.includes("prevent harm") || lower.includes("prevenir da") || lower.includes("pr?venir un danger") || lower.includes("anpeche danje")) && !lower.includes("environment") && !lower.includes("entorno") && !lower.includes("environnement") && !lower.includes("anviw")) ? "What should I notice to prevent harm right now?" :
      lower.includes("physical environment") || lower.includes("physical space") || lower.includes("entorno f") || lower.includes("environnement physique") || lower.includes("anviw") ? "Is the physical space safe and supportive?" :
      lower.includes("contamination") || lower.includes("spread") || lower.includes("germ") || lower.includes("infecci") || lower.includes("mikw") ? "What prevents contamination or spread of germs?" :
      lower.includes("comfort") || lower.includes("independence") || lower.includes("comodidad") || lower.includes("confort") || lower.includes("konf") ? "Am I supporting comfort, dignity, and independence?" :
      lower.includes("moved safely") || lower.includes("movement") || lower.includes("moviendo") || lower.includes("d?plac") || lower.includes("deplase") || lower.includes("biome") ? "Is the resident being moved safely and correctly?" :
      lower.includes("verbally") || lower.includes("emotion") || lower.includes("emoc") || lower.includes("?motion") || lower.includes("emosyon") ? "How should I respond verbally and emotionally?" :
      lower.includes("privacy") || lower.includes("respect") || lower.includes("autonomy") || lower.includes("privacidad") || lower.includes("confidentialit") || lower.includes("resp") ? "Am I preserving choice, privacy, and respect?" :
      canonical;

    return (LENS[inferredCanonical] || inferredCanonical).trim();
  }


  function extractGuidanceLens(guidanceText) {
    const text = String(guidanceText || "").trim();
    if (!text) return "";

    const splitters = ["???", "?", " - "];
    for (const splitter of splitters) {
      const parts = text.split(splitter);
      if (parts.length > 1) return parts.slice(1).join(splitter).trim();
    }
    return text;
  }


  function localizeGuidanceLine(guidance_text, chapter_id, priority) {
    const lensLocalized = localizeLensTitle(extractGuidanceLens(guidance_text));

    const p = String(priority || "").toLowerCase();
    const pLabel = p === "primary" ? A.primary : p === "secondary" ? A.secondary : priority || "";

    const pri = pLabel ? ` (${pLabel})` : "";
    return `${A.review} ${A.chapter} ${chapter_id}${pri} — ${lensLocalized}`;

  }

  return (
    <div style={{ maxWidth: "900px", margin: "0 auto" }}>
      <div
        style={{
          ...shellFrame,
          marginTop: "20px",
        }}
      >
        {/* Header */}
        <div
          style={{
            ...shellHeader,
            fontWeight: "bold",
            textTransform: "uppercase",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span>{T.analytics}</span>
          <button
            onClick={() => {
              router.push(hubUrl);
            }}
            style={{
              ...btnSecondary,
              minWidth: "130px",
              padding: "8px 12px",
              fontSize: "13px",
              opacity: 0.92,
              background: "white",
              color: "#536779",
              border: "1px solid #cfdde6",
            }}
          >
            {T.exitToHome}
          </button>
        </div>

        {/* Body */}
        <div
          style={{
            padding: "18px",
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
      border:
        resultsPayload.overall_status === "On Track"
          ? "1px solid #b8ddc1"
          : resultsPayload.overall_status === "High Risk"
            ? "1px solid #efc2c2"
            : "1px solid #e8d7a6",
      borderRadius: "12px",
      background:
        resultsPayload.overall_status === "On Track"
          ? "linear-gradient(180deg, #f5fff7 0%, #edf8f1 100%)"
          : resultsPayload.overall_status === "High Risk"
            ? "linear-gradient(180deg, #fff8f8 0%, #fff0f0 100%)"
            : "linear-gradient(180deg, #fffdf5 0%, #f8f3df 100%)",
    }}
  >
    <div style={{ fontSize: "16px", fontWeight: "700", color: "#455867", marginBottom: "6px" }}>
  {T.readiness}
</div>

    {(() => {
  const analyticsScoreResult = scoreExam({
    form: { ...form, question_ids: deliveredQuestionIds },
    bankById,
    answersByQid,
  });
  const analyticsPercent =
    analyticsScoreResult.total === 0
      ? 0
      : Math.round((analyticsScoreResult.correct / analyticsScoreResult.total) * 100);
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
              ? "#1f6f3d"
              : resultsPayload.overall_status === "High Risk"
                ? "var(--brand-red)"
                : "#7a5a00",
        }}
      >
        {statusLabel}
      </div>

      <div
        style={{
          fontSize: "14px",
          fontWeight: "700",
          marginBottom: "8px",
          color:
            resultsPayload.overall_status === "On Track"
              ? "#1f6f3d"
              : resultsPayload.overall_status === "High Risk"
                ? "var(--brand-red)"
                : "#7a5a00",
        }}
      >
        {T.scoreLine(analyticsPercent, analyticsPercent >= 80)}
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
        background: "linear-gradient(180deg, #f8fcff 0%, #f1f7fb 100%)",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: "700", color: "#455867", marginBottom: "8px" }}>
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
    border: "1px solid #dbe7ef",
    borderRadius: "10px",
    padding: "10px",
    background: "#ffffff",
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
      <div style={{ ...colBox, background: "#f5fff7", border: "1px solid #d8eadf" }}>
        {colTitle(T.colStrengths, { color: "#2f6b43" })}
        {renderList(strengths, T.noneStrengths)}
      </div>

      <div style={{ ...colBox, background: "#fffdf7", border: "1px solid #eadfbf" }}>
        {colTitle(T.colWeaknesses, { color: "#7a5a00" })}
        {renderList(weaknesses, T.noneWeaknesses)}
      </div>

      <div style={{ ...colBox, background: "#fff8f8", border: "1px solid #efcfcf" }}>
        {colTitle(T.colHighRisk, { color: "var(--brand-red)" })}
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
        background: "linear-gradient(180deg, #f8fcff 0%, #f1f7fb 100%)",
      }}
    >
      <div style={{ fontSize: "16px", fontWeight: "700", color: "#455867", marginBottom: "8px" }}>
  {T.whatToStudyNext}
</div>
<div style={{ fontSize: "12px", color: "#555", lineHeight: "1.5", marginBottom: "10px" }}>
  {T.chapterExplainer}
</div>

            <div style={{ fontSize: "14px", color: "#222", lineHeight: "1.6" }}>
        {(() => {
          const topCategories = Array.isArray(resultsPayload?.category_priority)
            ? resultsPayload.category_priority.slice(0, 2)
            : [];

          const line = (label, items) => {
            if (!items.length) return null;
            return (
              <div style={{ marginTop: "2px" }}>
                <div style={{ fontWeight: "700", color: "#555", marginBottom: "2px" }}>{label}</div>
                {items.map((it) => (
                  <div key={`${label}-${it.chapter_id}`} style={{ color: "#333", marginBottom: "2px" }}>
                    {A.chapter} {it.chapter_id}
                    {CHN?.[it.chapter_id] ? ` - ${CHN[it.chapter_id]}` : ""}
                  </div>
                ))}
              </div>
            );
          };

          if (topCategories.length > 0) {
            return topCategories.map((category) => {
              const guide = CATEGORY_GUIDE[category.category_id];
              if (!guide) return null;

              return (
                <div
                  key={category.category_id}
                  style={{
                    border: "1px solid #d8e4ec",
                    borderRadius: "10px",
                    padding: "12px",
                    background: "linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)",
                    marginBottom: "12px",
                  }}
                >
                  <div style={{ fontSize: "15px", fontWeight: "700", marginBottom: "2px" }}>
                    {CATN?.[category.category_id] || category.category_id}
                  </div>
                  <div style={{ color: "#516677", marginBottom: "6px" }}>
                    {localizeLensTitle(guide.lens)}
                  </div>

                  {line(A.primary, guide.primary.map((chapter_id) => ({ chapter_id })))}
                  {line(A.secondary, guide.secondary.map((chapter_id) => ({ chapter_id })))}
                </div>
              );
            });
          }

          // Fallback for older payloads
          const order = [];
          const groups = {};

          (resultsPayload.chapter_guidance || []).forEach((g) => {
            const lensTitle = localizeLensTitle(extractGuidanceLens(g.guidance_text));
            if (!groups[lensTitle]) {
              groups[lensTitle] = { primary: [], secondary: [] };
              order.push(lensTitle);
            }

            const p = String(g.priority || "").toLowerCase();
            const bucket = p === "primary" ? "primary" : "secondary";

            if (!groups[lensTitle][bucket].some((x) => x.chapter_id === g.chapter_id)) {
              groups[lensTitle][bucket].push({ chapter_id: g.chapter_id });
            }
          });

          return order.map((lensTitle) => (
            <div
              key={lensTitle}
              style={{
                border: "1px solid #d8e4ec",
                borderRadius: "10px",
                padding: "12px",
                background: "linear-gradient(180deg, #ffffff 0%, #f8fbfd 100%)",
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

          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: "10px",
              flexWrap: "wrap",
              flexDirection: isNarrow ? "column" : "row",
              alignItems: isNarrow ? "stretch" : "center",
              marginTop: "18px",
            }}
          >
            <button
              onClick={() => {
                setMode("finished");
              }}
              style={{ ...btnSecondary, minWidth: "180px", width: isNarrow ? "100%" : "auto" }}
            >
              {T.backToResults}
            </button>

            <button
              onClick={() => {
                setRationaleChapter(1);
                setMode("rationales");
              }}
              style={{ ...btnSecondary, minWidth: "180px", width: isNarrow ? "100%" : "auto" }}
            >
              {T.reviewQuestions}
            </button>

            <button
              onClick={() => {
                if (!attemptId) {
                  alert("Remediation is unavailable because the attempt id was not found.");
                  return;
                }

                if (!resultsPayload) {
                  alert("Remediation is unavailable because the results payload was not found.");
                  return;
                }

                router.push(`/remediation?attemptId=${encodeURIComponent(attemptId)}&lang=${lang}${useServer ? "&storage=server" : ""}`);
              }}
              style={{ ...btnPrimary, minWidth: "180px", width: isNarrow ? "100%" : "auto" }}
            >
              {T.startRemediation}
            </button>

          </div>

          </div>
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
            ...shellFrame,
            minHeight: "675px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              ...shellHeader,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: isNarrow ? "17px" : "18px" }}>
              {T.confirmExitTitle}
            </span>
            <span
              style={{
                fontWeight: 800,
                color: "var(--brand-red)",
                border: "1px solid rgba(204, 0, 0, 0.35)",
                background: "white",
                borderRadius: "999px",
                padding: isNarrow ? "7px 10px" : "8px 12px",
                fontSize: isNarrow ? "13px" : "14px",
              }}
            >
              ⏱ {formatRemaining(remainingSec)}
            </span>
          </div>

          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: isNarrow ? "18px" : "22px",
            }}
          >
            <div
              style={{
                ...softPanel,
                width: "100%",
                maxWidth: "720px",
                padding: isNarrow ? "18px" : "22px",
                background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
              }}
            >
              <div style={{ marginBottom: "18px" }}>
                {renderUiLines(getUiLines("confirmExitLead"), {
                  centered: true,
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <div style={{ fontSize: isNarrow ? "22px" : "24px", lineHeight: "1" }}>⚠️</div>
              </div>

              <div style={{ marginBottom: "16px" }}>
                {renderUiLines(getUiLines("confirmExitQuestion"), {
                  tone: "headline",
                  centered: true,
                  compact: true,
                })}
              </div>

              <div>
                {renderUiLines(
                  getUiLines("confirmExitExplanation").flatMap((l) =>
                    splitIntoTwoSentenceLines(l.text).map((text, index) => ({
                      label: index === 0 ? l.label : "",
                      text,
                    }))
                  ),
                  {
                    centered: true,
                  }
                )}
              </div>
            </div>
          </div>

          <div
            style={{
              ...shellFooter,
              display: "flex",
              gap: "10px",
              flexWrap: isNarrow ? "wrap" : "nowrap",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setMode(exitReturnMode)}
              style={{ ...btnSecondary, ...(isNarrow ? { width: "100%" } : { minWidth: "180px" }) }}
            >
              {T.no}
            </button>

            <button
              onClick={() => {
                router.push(hubUrl);
              }}
              style={{ ...btnPrimary, ...(isNarrow ? { width: "100%" } : { minWidth: "220px" }) }}
            >
              {T.yes}
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
            ...shellFrame,
            minHeight: "675px",
            display: "flex",
            flexDirection: "column",
          }}
        >
          <div
            style={{
              ...shellHeader,
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "12px",
            }}
          >
            <span style={{ fontWeight: 800, fontSize: isNarrow ? "17px" : "18px" }}>
              {T.confirmEndTitle}
            </span>
            <span
              style={{
                fontWeight: 800,
                color: "var(--brand-red)",
                border: "1px solid rgba(204, 0, 0, 0.35)",
                background: "white",
                borderRadius: "999px",
                padding: isNarrow ? "7px 10px" : "8px 12px",
                fontSize: isNarrow ? "13px" : "14px",
              }}
            >
              ⏱ {formatRemaining(remainingSec)}
            </span>
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
                {renderUiLines(getUiLines("confirmEndLead"), {
                  centered: true,
                })}
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "center",
                  marginBottom: "14px",
                }}
              >
                <div style={{ fontSize: isNarrow ? "22px" : "24px", lineHeight: "1" }}>⚠️</div>
              </div>

              <div style={{ marginBottom: "14px" }}>
                {renderUiLines(getUiLines("confirmEndQuestion"), {
                  tone: "headline",
                  centered: true,
                  compact: true,
                })}
              </div>

              <div style={{ marginBottom: "14px" }}>
                {renderUiLines(
                  [{ label: getUiLines("confirmEndQuestion")[0]?.label || "EN", text: T.onceEnded }],
                  {
                    tone: "warning",
                    centered: true,
                    compact: true,
                  }
                )}
              </div>

              <div>
                {renderUiLines(getUiLines("confirmEndExplanation"), {
                  centered: true,
                })}
              </div>
            </div>
          </div>

          <div
            style={{
              ...shellFooter,
              display: "flex",
              gap: "10px",
              flexWrap: isNarrow ? "wrap" : "nowrap",
              justifyContent: "flex-end",
            }}
          >
            <button
              onClick={() => setMode("review")}
              style={{ ...btnSecondary, ...(isNarrow ? { width: "100%" } : { minWidth: "180px" }) }}
            >
              {T.no}
            </button>

            <button
              onClick={() => setMode("finished")}
              style={{ ...btnPrimary, ...(isNarrow ? { width: "100%" } : { minWidth: "220px" }) }}
            >
              {T.yes}
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
            border: isActive ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
            background: isActive ? "var(--surface-tint)" : theme.secondaryBg,
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
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
            marginBottom: "10px",
            padding: "16px 18px",
            border: `1px solid ${theme.chromeBorder}`,
            borderRadius: "14px",
            background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
            flexWrap: isNarrow ? "wrap" : "nowrap",
          }}
        >
          <div>
            <h1 style={{ margin: 0, fontSize: isNarrow ? "20px" : "22px", fontWeight: "800", color: "var(--heading)" }}>{T.summary}</h1>
          </div>
          <div
            style={{
              fontWeight: 800,
              color: "var(--brand-red)",
              border: "1px solid var(--brand-red)",
              background: "white",
              borderRadius: "999px",
              padding: isNarrow ? "7px 11px" : "8px 12px",
              display: "inline-flex",
              alignItems: "center",
              whiteSpace: "nowrap",
              fontSize: isNarrow ? "13px" : "14px",
            }}
          >
            ⏱ {formatRemaining(remainingSec)}
          </div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "stretch" }}>
          <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
            <div
              style={{
                flex: 1,
                border: "1px solid #d4dee8",
                borderRadius: "12px",
                padding: "12px",
                background: "#fbfdff",
              }}
            >
              {pageQids.length === 0 ? (
  <div style={{ color: "#5c6d7d", fontSize: "14px", padding: "4px 2px" }}>
    No questions match this filter.
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
                        padding: "14px 16px",
                        border: "1px solid #dde8f0",
                        borderRadius: "12px",
                        background: "white",
                        marginBottom: idxOnFiltered === pageQids.length - 1 ? 0 : "10px",
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "flex-start",
                          gap: "10px",
                          flexWrap: isNarrow ? "wrap" : "nowrap",
                          fontSize: "13px",
                        }}
                      >
                        <button
                          style={{
                            cursor: "pointer",
                            color: "var(--brand-teal-dark)",
                            fontWeight: 800,
                            fontSize: "16px",
                            border: "none",
                            background: "transparent",
                            padding: 0,
                            margin: 0,
                            textAlign: "left",
                          }}
                          onClick={() => {
                            setIndex(absoluteIndex);
                            setMode("exam");
                          }}
                        >
                          {T.question} {number}
                        </button>

                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <span
                            style={{
                              padding: "4px 10px",
                              borderRadius: "999px",
                              fontSize: "12px",
                              fontWeight: 700,
                              background: answered ? "var(--surface-tint)" : "var(--surface-soft)",
                              color: answered ? "var(--brand-teal-dark)" : "#5c6d7d",
                              border: `1px solid ${answered ? "var(--frame-border)" : "var(--chrome-border)"}`,
                            }}
                          >
                            {answered ? T.answered : T.notAnswered}
                          </span>

                          {flagged ? (
                            <span
                              style={{
                                padding: "4px 10px",
                                borderRadius: "999px",
                                fontSize: "12px",
                                fontWeight: 700,
                                background: "var(--brand-red-soft)",
                                color: "var(--brand-red)",
                                border: "1px solid var(--brand-red)",
                              }}
                            >
                              🚩 {T.markedForReview}
                            </span>
                          ) : null}
                        </div>
                      </div>

                      <div style={{ marginTop: "10px", fontSize: "13px", color: "#33495b", display: "grid", gap: "4px" }}>
                        {lines.map((l) => (
                          <div key={l.label}>
                            <strong style={{ color: "#607282" }}>{l.label}:</strong> {l.text}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            {isNarrow ? (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  marginTop: "12px",
                }}
              >
                <button
                  style={{
                    ...btnSecondary,
                    width: "100%",
                    background: "white",
                    color: "var(--brand-red)",
                    border: "1px solid #e4b7b7",
                  }}
                  disabled
                >
                  {T.page} {summaryPage} {T.of} {totalFilteredPages}
                </button>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                  <button
                    onClick={() => {
                      if (canPrev) setSummaryPage(summaryPage - 1);
                    }}
                    style={{
                      ...btnSecondary,
                      width: "100%",
                      opacity: canPrev ? 1 : 0.5,
                      background: "white",
                      color: "var(--brand-red)",
                      border: "1px solid #e4b7b7",
                    }}
                    disabled={!canPrev}
                  >
                    {`◀ ${T.prevPage}`}
                  </button>

                  <button
                    onClick={() => {
                      if (canNext) setSummaryPage(summaryPage + 1);
                    }}
                    style={{
                      ...btnSecondary,
                      width: "100%",
                      opacity: canNext ? 1 : 0.5,
                      background: "white",
                      color: "var(--brand-red)",
                      border: "1px solid #e4b7b7",
                    }}
                    disabled={!canNext}
                  >
                    {`${T.nextPage} ▶`}
                  </button>
                </div>
              </div>
            ) : null}

            <div style={{ display: "flex", gap: "10px", marginTop: "12px", flexWrap: isNarrow ? "wrap" : "nowrap" }}>
              <button onClick={() => setMode("exam")} style={{ ...btnSecondary, ...(isNarrow ? { width: "100%" } : { flex: 1 }) }}>
                {T.backToExam}
              </button>

              <button onClick={() => setMode("confirm_end")} style={{ ...btnPrimary, ...(isNarrow ? { width: "100%" } : { flex: 1 }) }}>
                {T.endTest}
              </button>

              <button onClick={() => openExitConfirm("review")} style={{ ...btnExit, ...(isNarrow ? { width: "100%" } : { minWidth: "110px" }) }}>
                {T.exit}
              </button>
            </div>
          </div>

          <div style={{ width: "100%", display: "flex", flexDirection: "column", order: -1 }}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isNarrow ? "repeat(2, minmax(0, 1fr))" : "repeat(4, minmax(0, 1fr))",
                gap: "8px",
                padding: "10px",
                border: "1px solid #d4dee8",
                borderRadius: "12px",
                background: "#fbfdff",
              }}
            >
              {compactBtn(T.all, "all")}
              {compactBtn(T.answered, "answered")}
              {compactBtn(T.notAnswered, "unanswered")}
              {compactBtn(`🚩 ${T.markedForReview}`, "marked", { color: "var(--brand-red)", fontWeight: "bold" })}
            </div>

            <div
              style={{
                display: isNarrow ? "none" : "flex",
                justifyContent: "space-between",
                alignItems: "center",
                gap: "8px",
                marginTop: "10px",
                flexWrap: isNarrow ? "wrap" : "nowrap",
              }}
            >
              <button
                onClick={() => {
                  if (canPrev) setSummaryPage(summaryPage - 1);
                }}
                style={{
                  ...btnSecondary,
                  width: isNarrow ? "100%" : "auto",
                  opacity: canPrev ? 1 : 0.5,
                  background: "white",
                  color: "var(--brand-red)",
                  border: "1px solid #e4b7b7",
                }}
                disabled={!canPrev}
              >
                {`◀ ${T.prevPage}`}
              </button>

              <button
                style={{
                  ...btnSecondary,
                  width: isNarrow ? "100%" : "auto",
                  background: "white",
                  color: "var(--brand-red)",
                  border: "1px solid #e4b7b7",
                }}
                disabled
              >
                {T.page} {summaryPage} {T.of} {totalFilteredPages}
              </button>

              <button
                onClick={() => {
                  if (canNext) setSummaryPage(summaryPage + 1);
                }}
                style={{
                  ...btnSecondary,
                  width: isNarrow ? "100%" : "auto",
                  opacity: canNext ? 1 : 0.5,
                  background: "white",
                  color: "var(--brand-red)",
                  border: "1px solid #e4b7b7",
                }}
                disabled={!canNext}
              >
                {`${T.nextPage} ▶`}
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
          ...shellFrame,
        }}
      >
        <div
          style={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-start",
            gap: "12px",
            flexWrap: isNarrow ? "wrap" : "nowrap",
            ...shellHeader,
          }}
        >
          <div style={{ minWidth: 0 }}>
            <div
              style={{
                fontSize: isNarrow ? "20px" : "22px",
                fontWeight: 800,
                color: "var(--heading)",
                lineHeight: 1.2,
              }}
            >
              {T.question} {index + 1} {T.of} {total}
            </div>
            <div style={{ fontSize: "12px", color: "#607282", marginTop: "4px" }}>
              ID: {qid}
            </div>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: isNarrow ? "stretch" : "center",
              justifyContent: "flex-end",
              gap: "10px",
              flexWrap: "wrap",
              marginLeft: "auto",
            }}
          >
            <label
              style={{
                cursor: "pointer",
                fontWeight: 600,
                color: isMarked ? "var(--brand-red)" : "var(--brand-teal-dark)",
                border: `1px solid ${isMarked ? "var(--brand-red)" : "var(--button-border)"}`,
                background: isMarked ? "var(--brand-red-soft)" : "white",
                borderRadius: "999px",
                padding: isNarrow ? "6px 10px" : "8px 12px",
                display: "inline-flex",
                alignItems: "center",
                gap: "8px",
                minHeight: isNarrow ? "32px" : "38px",
                fontSize: isNarrow ? "12px" : "14px",
              }}
            >
              <input
                type="checkbox"
                checked={isMarked}
                onChange={toggleReview}
                style={{ margin: 0 }}
              />
              <span>{isMarked ? `🚩 ${T.markedForReview}` : T.markForReview}</span>
            </label>

            <div
              style={{
                fontWeight: 800,
                color: "var(--brand-red)",
                border: "1px solid var(--brand-red)",
                background: "white",
                borderRadius: "999px",
                padding: isNarrow ? "7px 11px" : "8px 12px",
                minHeight: isNarrow ? "34px" : "38px",
                display: "inline-flex",
                alignItems: "center",
                whiteSpace: "nowrap",
                fontSize: isNarrow ? "13px" : "14px",
              }}
            >
              ⏱ {formatRemaining(remainingSec)}
            </div>
          </div>
        </div>

        <div style={{ padding: "16px", overflowY: "auto", flex: 1 }}>
          {blocks.map((b, i) => {
            const isInteractive = i === 0;
            const groupName = `${qid}-${b.label}`;

            return (
              <div key={b.label} style={{ marginBottom: "18px" }}>
                <div
                  style={{
                    fontSize: isNarrow ? "16px" : "18px",
                    fontWeight: "500",
                    lineHeight: isNarrow ? "1.38" : "1.4",
                    marginBottom: isNarrow ? "12px" : "15px",
                  }}
                >
                  <span
                    style={{
                      display: "inline-block",
                      fontSize: isNarrow ? "12px" : "13px",
                      fontWeight: 800,
                      letterSpacing: "0.04em",
                      color: "#607282",
                      marginRight: "8px",
                    }}
                  >
                    {b.label}
                  </span>
                  {b.v.question_text}
                </div>

                {Object.entries(b.v.options).map(([key, text]) => {
                  const isSelected = selected === key;

                  return (
                    <label
                      key={key}
                      style={{
                        display: "block",
                        padding: isNarrow ? "9px" : "10px",
                        marginBottom: "6px",
                        fontSize: isNarrow ? "15px" : "16px",
                        border: "1px solid var(--chrome-border)",
                        borderRadius: "12px",
                        cursor: isInteractive ? "pointer" : "default",
                        background: isSelected ? "var(--surface-tint)" : "white",
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
            display: "grid",
            gap: "10px",
            ...shellFooter,
          }}
        >
          {isNarrow ? (
            <>
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "10px" }}>
                <button
                  onClick={() => index > 0 && setIndex(index - 1)}
                  disabled={index === 0}
                  style={{ ...btnSecondary, width: "100%", opacity: index === 0 ? 0.5 : 1 }}
                >
                  {T.previous}
                </button>

                <button
                  onClick={() => setMode("review")}
                  style={{ ...btnSecondary, width: "100%", padding: "8px 10px", fontSize: "13px", opacity: 0.92 }}
                >
                  {T.summary}
                </button>
              </div>

              {isLast ? (
                <button onClick={() => setMode("review")} style={{ ...btnPrimary, width: "100%" }}>
                  {T.endTest}
                </button>
              ) : (
                <button onClick={() => setIndex(index + 1)} style={{ ...btnPrimary, width: "100%" }}>
                  {T.next}
                </button>
              )}

              <div style={{ display: "flex", justifyContent: "flex-end" }}>
                <button onClick={() => openExitConfirm("exam")} style={{ ...btnExit, minWidth: "90px" }}>
                  {T.exit}
                </button>
              </div>
            </>
          ) : (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={() => index > 0 && setIndex(index - 1)}
                disabled={index === 0}
                style={{ ...btnSecondary, flex: 1.15, opacity: index === 0 ? 0.5 : 1 }}
              >
                {T.previous}
              </button>

              <button
                onClick={() => setMode("review")}
                style={{ ...btnSecondary, flex: 0.78, padding: "8px 10px", fontSize: "13px", opacity: 0.92 }}
              >
                {T.summary}
              </button>

              {isLast ? (
                <button onClick={() => setMode("review")} style={{ ...btnPrimary, flex: 1.15 }}>
                  {T.endTest}
                </button>
              ) : (
                <button onClick={() => setIndex(index + 1)} style={{ ...btnPrimary, flex: 1.15 }}>
                  {T.next}
                </button>
              )}

              <button onClick={() => openExitConfirm("exam")} style={{ ...btnExit, minWidth: "90px" }}>
                {T.exit}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
