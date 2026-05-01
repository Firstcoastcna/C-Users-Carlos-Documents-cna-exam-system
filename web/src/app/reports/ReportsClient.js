"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchStudentOverviewReport,
  resolveStudentEntryState,
} from "../lib/backend/auth/browserAuth";
import { useDisableBrowserNavigation } from "../lib/backend/auth/useDisableBrowserNavigation";
import { useProtectedPlatformPage } from "../lib/backend/auth/useProtectedPlatformPage";

const shell = {
  maxWidth: 920,
  margin: "24px auto",
  padding: 20,
};

const card = {
  border: "2px solid var(--frame-border)",
  borderRadius: 16,
  overflow: "hidden",
  background: "white",
  boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
};

const header = {
  padding: "18px 20px",
  borderBottom: "1px solid var(--chrome-border)",
  background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const body = {
  padding: 20,
  display: "grid",
  gap: 16,
};

const title = {
  fontSize: 28,
  fontWeight: 800,
  color: "var(--heading)",
};

const subjectTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#4f6272",
  lineHeight: 1.3,
};

const subText = {
  color: "#5a6b78",
  lineHeight: 1.6,
  fontSize: 14,
};

const btnSecondary = {
  padding: "8px 11px",
  borderRadius: 9,
  border: "1px solid #cfdde6",
  background: "white",
  color: "#536779",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const viewToggleWrap = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const sectionCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  background: "#fcfeff",
  padding: 14,
  display: "grid",
  gap: 8,
};

const analysisGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  alignItems: "start",
};

const detailsSummary = {
  cursor: "pointer",
  listStyle: "none",
};

const compactCard = {
  borderRadius: 14,
  padding: 14,
  display: "grid",
  gap: 8,
  border: "1px solid #d6e1e8",
  background: "white",
};

const CATEGORY_TO_CHAPTERS = {
  "Scope of Practice & Reporting": {
    primary: [1],
    secondary: [4, 5],
  },
  "Change in Condition": {
    primary: [4],
    secondary: [3, 5],
  },
  "Observation & Safety": {
    primary: [4],
    secondary: [3, 2],
  },
  "Environment & Safety": {
    primary: [2],
    secondary: [3],
  },
  "Infection Control": {
    primary: [2],
    secondary: [3, 4],
  },
  "Personal Care & Comfort": {
    primary: [3],
    secondary: [4],
  },
  "Mobility & Positioning": {
    primary: [3],
    secondary: [4],
  },
  "Communication & Emotional Support": {
    primary: [5],
    secondary: [1, 3],
  },
  "Dignity & Resident Rights": {
    primary: [1],
    secondary: [3, 5],
  },
};

const metricValue = {
  fontSize: 26,
  fontWeight: 800,
  color: "var(--heading)",
  lineHeight: 1.1,
};

const metricLabel = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#607282",
};

const rowLabel = {
  fontSize: 12,
  fontWeight: 800,
  letterSpacing: "0.04em",
  textTransform: "uppercase",
  color: "#607282",
};

const bulletList = {
  margin: 0,
  paddingLeft: 18,
  color: "#425564",
  fontSize: 14,
  lineHeight: 1.55,
};

function InlineMessage({ tone = "info", children }) {
  const styles =
    tone === "error"
      ? { background: "#fff0ef", border: "1px solid #f4c5c0", color: "#9b1c1c" }
      : { background: "#fff8eb", border: "1px solid #f0d59b", color: "#755200" };

  return <div style={{ padding: "12px 14px", borderRadius: 12, ...styles }}>{children}</div>;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value}%` : null;
}

function buildStudentStrengths(summary) {
  return {
    strongestCategories: summary?.learningSignals?.strongestCategories || [],
    bestScore: summary?.exams?.bestScore,
    completedPractice: summary?.practice?.completedSessions ?? 0,
    completedRemediation: summary?.remediation?.completedSessions ?? 0,
  };
}

function buildStudentWeaknesses(summary) {
  return {
    categoriesNeedingWork: summary?.learningSignals?.categoriesNeedingWork || [],
    highRiskCategories: summary?.learningSignals?.highRiskCategories || [],
    chapterPriorities: summary?.learningSignals?.chapterPriorities || [],
  };
}

function buildStudentNextActions(summary) {
  const actions = [];
  const overallStatus = summary?.learningSignals?.overallStatus || "";
  const examRecommendation = summary?.learningSignals?.examRecommendation || null;

  if (examRecommendation?.category) {
    actions.push({
      kind: "categoryRecommendation",
      value: examRecommendation.category,
      urgency: examRecommendation.urgency || "watch",
      level: examRecommendation.categoryLevel || null,
    });
  }

  if (examRecommendation?.recommendedChapterId) {
    actions.push({
      kind: "chapterRecommendation",
      value: examRecommendation.recommendedChapterId,
      urgency: examRecommendation.urgency || "watch",
      category: examRecommendation.category || null,
      relation: examRecommendation.chapterRelation || "primary",
    });
  }

  if (overallStatus === "High Risk") {
    actions.push({ kind: "status", value: "highRisk" });
  } else if (overallStatus === "Borderline") {
    actions.push({ kind: "status", value: "borderline" });
  } else if (overallStatus === "On Track") {
    actions.push({ kind: "status", value: "onTrack" });
  }

  if (!actions.length) {
    actions.push({ kind: "buildActivity" });
  }

  return actions.slice(0, 4);
}

function buildStudentProgress(summary) {
  return {
    examAverage: summary?.exams?.averageScore,
    bestScore: summary?.exams?.bestScore,
    worstScore: summary?.exams?.worstScore,
    completedAttempts: summary?.exams?.completedAttempts ?? 0,
    totalPractice: summary?.practice?.totalSessions ?? 0,
    totalRemediation: summary?.remediation?.totalSessions ?? 0,
    totalExposure: summary?.questionHistory?.totalExposureRows ?? 0,
  };
}

function getStatusTone(status) {
  if (status === "On Track") {
    return {
      border: "#bddfc6",
      bg: "linear-gradient(180deg, #f7fff9 0%, #eef8f1 100%)",
      accent: "#1f6f3d",
      muted: "#476252",
    };
  }
  if (status === "High Risk") {
    return {
      border: "#efc2c2",
      bg: "linear-gradient(180deg, #fff8f8 0%, #fff0f0 100%)",
      accent: "var(--brand-red)",
      muted: "#6f4747",
    };
  }
  return {
    border: "#eadba6",
    bg: "linear-gradient(180deg, #fffdf5 0%, #f8f3df 100%)",
    accent: "#7a5a00",
    muted: "#6f6340",
  };
}

function getScoreTone(score) {
  if (!Number.isFinite(Number(score))) {
    return {
      border: "#d7e4ec",
      bg: "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)",
      accent: "#38556a",
      muted: "#607282",
    };
  }
  if (Number(score) >= 80) {
    return {
      border: "#bddfc6",
      bg: "linear-gradient(180deg, #f7fff9 0%, #eef8f1 100%)",
      accent: "#1f6f3d",
      muted: "#476252",
    };
  }
  if (Number(score) < 70) {
    return {
      border: "#efc2c2",
      bg: "linear-gradient(180deg, #fff8f8 0%, #fff0f0 100%)",
      accent: "var(--brand-red)",
      muted: "#6f4747",
    };
  }
  return {
    border: "#eadba6",
    bg: "linear-gradient(180deg, #fffdf5 0%, #f8f3df 100%)",
    accent: "#7a5a00",
    muted: "#6f6340",
  };
}

function getBandTone(percent) {
  if (Number(percent) < 60) {
    return { bg: "#fff8f8", border: "#efc2c2" };
  }
  if (Number(percent) < 80) {
    return { bg: "#fffdf5", border: "#eadba6" };
  }
  return { bg: "#f7fff9", border: "#bddfc6" };
}

function getCategoryBandTone(percent) {
  if (Number(percent) < 70) {
    return { bg: "#fff8f8", border: "#efc2c2" };
  }
  if (Number(percent) < 80) {
    return { bg: "#fffdf5", border: "#eadba6" };
  }
  return { bg: "#f7fff9", border: "#bddfc6" };
}

function OpenHint({ isOpen, lang }) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    function syncWidth() {
      if (typeof window === "undefined") return;
      setIsNarrow(window.innerWidth < 760);
    }
    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, []);

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  return (
    <span style={{ color: "#607282", fontSize: 12.5, fontWeight: 700 }}>
      {isNarrow
        ? isOpen
          ? t("Tap here to close", "Toque aqui para cerrar", "Touchez ici pour fermer", "Peze la a pou femen")
          : t("Tap here to open", "Toque aqui para abrir", "Touchez ici pour ouvrir", "Peze la a pou louvri")
        : isOpen
          ? t("Click here to close", "Haga clic aqui para cerrar", "Cliquez ici pour fermer", "Klike la a pou femen")
          : t("Click here to open", "Haga clic aqui para abrir", "Cliquez ici pour ouvrir", "Klike la a pou louvri")}
    </span>
  );
}

export default function ReportsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useProtectedPlatformPage();
  useDisableBrowserNavigation();

  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);
  const [activeView, setActiveView] = useState("exam");

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  function noDataLabel() {
    return t("No data yet", "Sin datos todavia", "Pas encore de donnees", "Poko gen done");
  }

  function formatStatusLabel(value) {
    if (value === "On Track") return t("On Track", "En buen camino", "En bonne voie", "Sou bon chimen");
    if (value === "Borderline") return t("Borderline", "Al limite", "Limite", "Sou limit la");
    if (value === "High Risk") return t("High Risk", "Alto riesgo", "Haut risque", "Gwo risk");
    return value || t("No current information", "Sin informacion actual", "Aucune information actuelle", "Pa gen enfomasyon aktyel");
  }

  function formatDateTime(value) {
    if (!value) return noDataLabel();
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return noDataLabel();
    return date.toLocaleString(lang === "fr" ? "fr-FR" : lang === "es" ? "es-ES" : "en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
    });
  }

  function formatSourceTypeLabel(value) {
    if (value === "exam") return t("Exam", "Examen", "Examen", "Egzamen");
    if (value === "practice") return t("Practice", "Practica", "Pratique", "Pratik");
    if (value === "remediation") return t("Remediation", "Remediacion", "Remediation", "Remedyasyon");
    return value;
  }

  function formatCategoryLabel(value) {
    const map = {
      "Change in Condition": t("Change in Condition", "Cambio en la condicion", "Changement d'etat", "Chanjman nan kondisyon"),
      "Scope of Practice & Reporting": t("Scope of Practice & Reporting", "Alcance de la practica y reporte", "Champ de pratique et signalement", "Wol mwen ak sa pou rapote"),
      "Communication & Emotional Support": t("Communication & Emotional Support", "Comunicacion y apoyo emocional", "Communication et soutien emotionnel", "Kominikasyon ak sipo emosyonel"),
      "Observation & Safety": t("Observation & Safety", "Observacion y seguridad", "Observation et securite", "Obsevasyon ak sekirite"),
      "Personal Care & Comfort": t("Personal Care & Comfort", "Cuidado personal y comodidad", "Soins personnels et confort", "Swen pesonel ak konfo"),
      "Mobility & Positioning": t("Mobility & Positioning", "Movilidad y posicionamiento", "Mobilite et positionnement", "Mobilite ak pozisyonman"),
      "Environment & Safety": t("Environment & Safety", "Entorno y seguridad", "Environnement et securite", "Anviwonman ak sekirite"),
      "Dignity & Resident Rights": t("Dignity & Resident Rights", "Dignidad y derechos del residente", "Dignite et droits du resident", "Diyite ak dwa rezidan an"),
      "Infection Control": t("Infection Control", "Control de infecciones", "Controle des infections", "Kontwol enfeksyon"),
    };
    return map[value] || value;
  }

  function renderNextAction(item) {
    if (item.kind === "categoryRecommendation" && item.urgency === "urgent") {
      return t(
        `Start with ${formatCategoryLabel(item.value)} now. It is the clearest high-priority review area right now.`,
        `Empiece ahora con ${formatCategoryLabel(item.value)}. Es el area de repaso de mayor prioridad en este momento.`,
        `Commencez maintenant par ${formatCategoryLabel(item.value)}. C'est le domaine de revision prioritaire le plus clair pour le moment.`,
        `Komanse ak ${formatCategoryLabel(item.value)} kounye a. Se zòn revizyon ki gen plis priyorite kounye a.`
      );
    }
    if (item.kind === "categoryRecommendation" && item.urgency === "firm") {
      return t(
        `Focus next on ${formatCategoryLabel(item.value)} before moving on to stronger areas.`,
        `Enfoquese despues en ${formatCategoryLabel(item.value)} antes de pasar a areas mas fuertes.`,
        `Concentrez-vous ensuite sur ${formatCategoryLabel(item.value)} avant de passer aux domaines plus forts.`,
        `Konsantre apre sa sou ${formatCategoryLabel(item.value)} anvan ou pase nan zòn ki pi fò yo.`
      );
    }
    if (item.kind === "categoryRecommendation") {
      return t(
        `Keep an eye on ${formatCategoryLabel(item.value)} as you continue building consistency.`,
        `Mantenga bajo observacion ${formatCategoryLabel(item.value)} mientras sigue construyendo consistencia.`,
        `Gardez un oeil sur ${formatCategoryLabel(item.value)} pendant que vous continuez a gagner en regularite.`,
        `Kenbe je sou ${formatCategoryLabel(item.value)} pandan w ap kontinye bati plis regilarite.`
      );
    }
    if (item.kind === "chapterRecommendation" && item.relation === "primary" && item.urgency === "urgent") {
      return t(
        `Review Chapter ${item.value} first to strengthen ${formatCategoryLabel(item.category)}.`,
        `Revise primero el Capitulo ${item.value} para fortalecer ${formatCategoryLabel(item.category)}.`,
        `Revoyez d'abord le Chapitre ${item.value} pour renforcer ${formatCategoryLabel(item.category)}.`,
        `Revize Chapit ${item.value} an premye pou ranfòse ${formatCategoryLabel(item.category)}.`
      );
    }
    if (item.kind === "chapterRecommendation" && item.relation === "primary" && item.urgency === "firm") {
      return t(
        `Review Chapter ${item.value} next to strengthen ${formatCategoryLabel(item.category)}.`,
        `Revise despues el Capitulo ${item.value} para fortalecer ${formatCategoryLabel(item.category)}.`,
        `Revoyez ensuite le Chapitre ${item.value} pour renforcer ${formatCategoryLabel(item.category)}.`,
        `Revize Chapit ${item.value} apre sa pou ranfòse ${formatCategoryLabel(item.category)}.`
      );
    }
    if (item.kind === "chapterRecommendation" && item.relation === "primary") {
      return t(
        `Use Chapter ${item.value} to keep strengthening ${formatCategoryLabel(item.category)}.`,
        `Use el Capitulo ${item.value} para seguir fortaleciendo ${formatCategoryLabel(item.category)}.`,
        `Utilisez le Chapitre ${item.value} pour continuer a renforcer ${formatCategoryLabel(item.category)}.`,
        `Sèvi ak Chapit ${item.value} pou kontinye ranfòse ${formatCategoryLabel(item.category)}.`
      );
    }
    if (item.kind === "chapterRecommendation") {
      return t(
        `If you want extra support, also look at Chapter ${item.value}.`,
        `Si desea apoyo extra, mire tambien el Capitulo ${item.value}.`,
        `Si vous voulez un soutien supplementaire, regardez aussi le Chapitre ${item.value}.`,
        `Si ou vle plis sipò, gade Chapit ${item.value} tou.`
      );
    }
    if (item.kind === "status" && item.value === "highRisk") {
      return t(
        "Stay with shorter practice and remediation cycles until readiness becomes more stable.",
        "Mantengase con ciclos mas cortos de practica y remediacion hasta que su preparacion sea mas estable.",
        "Restez sur des cycles plus courts de pratique et de remediation jusqu'a ce que votre niveau soit plus stable.",
        "Kenbe sesyon pratik ak remedyasyon yo pi kout jiskaske preparasyon an vin pi estab."
      );
    }
    if (item.kind === "status" && item.value === "borderline") {
      return t(
        "Keep building consistency with another full exam after focused review.",
        "Siga construyendo consistencia con otro examen completo despues de una revision enfocada.",
        "Continuez a construire votre constance avec un autre examen complet apres une revision ciblee.",
        "Kontinye bati plis regilarite ak yon lot egzamen konple apre yon revizyon ki byen vize."
      );
    }
    if (item.kind === "status" && item.value === "onTrack") {
      return t(
        "Keep momentum with full exams and targeted review only where weak areas still appear.",
        "Mantenga el impulso con examenes completos y revision dirigida solo donde todavia aparezcan areas debiles.",
        "Gardez votre elan avec des examens complets et une revision ciblee seulement la ou des zones faibles apparaissent encore.",
        "Kenbe bon ritm nan ak egzamen konple ak revizyon vize selman kote zon feb yo toujou paret."
      );
    }
    return t(
      "Build more activity through practice, exams, or remediation so the report can surface clearer next steps.",
      "Genere mas actividad con practica, examenes o remediacion para que el reporte pueda mostrar pasos siguientes mas claros.",
      "Ajoutez plus d'activite par la pratique, les examens ou la remediation afin que le rapport puisse montrer des etapes suivantes plus claires.",
      "Fe plis aktivite ak pratik, egzamen, oswa remedyasyon pou rapo a ka montre pwochen etap ki pi kle."
    );
  }

  const loadErrorMessage = t(
    "Unable to load your report.",
    "No se pudo cargar su reporte.",
    "Impossible de charger votre rapport.",
    "Nou pa t kapab chaje rapo ou a."
  );

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
          router.replace("/access");
          return;
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const urlLang = searchParams.get("lang");
    if (urlLang === "en" || urlLang === "es" || urlLang === "fr" || urlLang === "ht") {
      setLang(urlLang);
      return;
    }

    try {
      const saved = localStorage.getItem("cna_app_lang") || localStorage.getItem("cna_pilot_lang");
      if (saved === "en" || saved === "es" || saved === "fr" || saved === "ht") {
        setLang(saved);
      }
    } catch {}
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setMessage("");
      try {
        const nextReport = await fetchStudentOverviewReport(lang);
        if (!cancelled) {
          setReport(nextReport);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : loadErrorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang, loadErrorMessage]);

  useEffect(() => {
    if (!loading) {
      setShowLoadingNotice(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowLoadingNotice(true), 350);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const summary = report?.summary || null;
  const studentName =
    report?.user?.appUser?.full_name ||
    report?.user?.appUser?.email ||
    t("My Progress", "Mi progreso", "Mon progres", "Pwogre mwen");
  const strengths = buildStudentStrengths(summary);
  const weaknesses = buildStudentWeaknesses(summary);
  const nextActions = buildStudentNextActions(summary);
  const progress = buildStudentProgress(summary);
  const examHistory = Array.isArray(summary?.examHistory) ? summary.examHistory : [];
  const latestExamResults = summary?.latestExamResults || null;
  const examQuestionsSeen = Number(summary?.questionHistory?.bySourceType?.exam || 0);
  const practiceQuestionsSeen = Number(summary?.questionHistory?.bySourceType?.practice || 0);
  const practiceUniqueQuestionsSeen = Number(summary?.questionHistory?.uniqueBySourceType?.practice || 0);
  const examExposureCount = Number(summary?.questionHistory?.bySourceType?.exam || 0);
  const examUniqueQuestionsSeen = Number(summary?.questionHistory?.uniqueBySourceType?.exam || 0);
  const practiceExposureCount = Number(summary?.questionHistory?.bySourceType?.practice || 0);
  const practiceDiagnostics = summary?.practiceDiagnostics || {};
  const chapterPractice = practiceDiagnostics.chapter || {};
  const categoryPractice = practiceDiagnostics.category || {};
  const formatPracticePercentLabel = (value) =>
    Number.isFinite(Number(value)) ? `${Math.round(Number(value))}%` : noDataLabel();
  const strongestPracticeChapter = chapterPractice?.strongest || null;
  const strongestPracticeCategory =
    Number.isFinite(Number(categoryPractice?.strongest?.percent)) && Number(categoryPractice.strongest.percent) >= 80
      ? categoryPractice.strongest
      : null;
  const overallStatus = summary?.learningSignals?.overallStatus || null;
  const statusTone = getStatusTone(overallStatus);
  const hasCompletedExam = Number(summary?.exams?.completedAttempts || 0) > 0;
  const examStatusTone = hasCompletedExam
    ? statusTone
    : {
        border: "#d7e4ec",
        bg: "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)",
        accent: "#38556a",
        muted: "#607282",
      };
  const topStrength = strengths.strongestCategories[0] || null;
  const topHighRisk = weaknesses.highRiskCategories[0] || null;
  const examRecommendation = summary?.learningSignals?.examRecommendation || null;
  const topWeakCategory = examRecommendation?.category || weaknesses.categoriesNeedingWork[0]?.category || topHighRisk?.category || null;
  const topWeakEntry =
    weaknesses.highRiskCategories.find((item) => item.category === topWeakCategory) ||
    weaknesses.categoriesNeedingWork.find((item) => item.category === topWeakCategory) ||
    null;
  const topWeakChapter = weaknesses.chapterPriorities[0]?.chapterId || null;
  const topWeakMapping = topWeakCategory ? CATEGORY_TO_CHAPTERS[topWeakCategory] || null : null;
  const topWeakMainChapter = examRecommendation?.recommendedChapterId || topWeakMapping?.primary?.[0] || topWeakChapter || null;
  const topWeakSupportChapters =
    Array.isArray(examRecommendation?.supportChapterIds) && examRecommendation.supportChapterIds.length
      ? examRecommendation.supportChapterIds
      : Array.isArray(topWeakMapping?.secondary)
        ? topWeakMapping.secondary.slice(0, 2)
        : [];
  const topStrengthCategory = topStrength?.category || null;
  const topStrengthMapping = topStrengthCategory ? CATEGORY_TO_CHAPTERS[topStrengthCategory] || null : null;
  const topStrengthMainChapter = topStrengthMapping?.primary?.[0] || null;
  const topStrengthSupportChapters = Array.isArray(topStrengthMapping?.secondary) ? topStrengthMapping.secondary.slice(0, 2) : [];
  const strongestChapter = [...(weaknesses.chapterPriorities || [])]
    .reverse()
    .find((item) => Number.isFinite(item?.chapterId))?.chapterId || null;
  const latestExamBestChapter =
    [...(latestExamResults?.chapterBreakdown || [])].sort((a, b) => {
      if ((b?.percent || 0) !== (a?.percent || 0)) return (b?.percent || 0) - (a?.percent || 0);
      return (b?.correctCount || 0) - (a?.correctCount || 0);
    })[0] || null;
  const latestExamWorstChapter = latestExamResults?.weakestChapter || null;
  const latestExamScoreTone = getScoreTone(latestExamResults?.score);
  const isPracticeLed = summary?.learningSignals?.source === "practice";
  const needsWorkTone =
    examRecommendation?.urgency === "urgent"
      ? {
          borderColor: "#efc2c2",
          background: "linear-gradient(180deg, #fff8f8 0%, #fff0f0 100%)",
          label: "#6f4747",
          accent: "var(--brand-red)",
          sub: "#6f4747",
        }
      : {
          borderColor: "#eadba6",
          background: "linear-gradient(180deg, #fffdf5 0%, #f8f3df 100%)",
          label: "#6f6340",
          accent: "#7a5a00",
          sub: "#6f6340",
        };
  const categorySnapshotSections = [
    {
      key: "strong",
      title: t("Strong", "Fuerte", "Fort", "Fo"),
      tone: { border: "#bddfc6", bg: "#f7fff9", title: "#1f6f3d" },
      items: strengths.strongestCategories.map((item) => `${formatCategoryLabel(item.category)} (${formatPracticePercentLabel(item.percent)})`),
      empty: t("No clear strength yet", "Aun no hay fortaleza clara", "Pas encore de force claire", "Poko gen fos kle"),
    },
    {
      key: "watch",
      title: t("Watch", "Observe", "A surveiller", "Siveye"),
      tone: { border: "#eadba6", bg: "#fffdf5", title: "#7a5a00" },
      items: weaknesses.categoriesNeedingWork.map((item) => `${formatCategoryLabel(item.category)} (${formatPracticePercentLabel(item.percent)})${item.level ? ` | ${item.level}` : ""}`),
      empty: t("Nothing repeating yet", "Nada repetido aun", "Rien de repete pour l'instant", "Pa gen anyen ki repete poko"),
    },
    {
      key: "risk",
      title: t("High Risk", "Alto riesgo", "Haut risque", "Gwo risk"),
      tone: { border: "#efc2c2", bg: "#fff8f8", title: "var(--brand-red)" },
      items: weaknesses.highRiskCategories.map((item) => `${formatCategoryLabel(item.category)} (${formatPracticePercentLabel(item.percent)})${item.level ? ` | ${item.level}` : ""}`),
      empty: t("No high-risk information now", "Sin informacion de alto riesgo ahora", "Pas d'information a haut risque pour le moment", "Pa gen enfomasyon gwo risk kounye a"),
    },
  ];
  const practiceCategoryEntries = Array.isArray(categoryPractice?.entries) ? categoryPractice.entries : [];
  const practiceChapterEntries = Array.isArray(chapterPractice?.entries) ? chapterPractice.entries : [];
  const practiceChapterSnapshotSections = [
    {
      key: "strong",
      title: t("Strong", "Fuerte", "Fort", "Fo"),
      tone: { border: "#bddfc6", bg: "#f7fff9", title: "#1f6f3d" },
      items: practiceChapterEntries
        .filter((item) => Number(item?.percent) >= 80)
        .map((item) => `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${item.label} (${formatPracticePercentLabel(item.percent)})`),
      empty: t(
        "Not enough strong chapter information yet",
        "Aun no hay suficiente informacion fuerte por capitulo",
        "Pas encore assez d'information forte par chapitre",
        "Poko gen ase enfomasyon chapit ki fo"
      ),
    },
    {
      key: "watch",
      title: t("Watch", "Observe", "A surveiller", "Siveye"),
      tone: { border: "#eadba6", bg: "#fffdf5", title: "#7a5a00" },
      items: practiceChapterEntries
        .filter((item) => Number(item?.percent) >= 60 && Number(item?.percent) < 80)
        .map((item) => `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${item.label} (${formatPracticePercentLabel(item.percent)})`),
      empty: practiceChapterEntries.length
        ? t(
            "No chapters to watch right now",
            "No hay capitulos para observar en este momento",
            "Aucun chapitre a surveiller pour le moment",
            "Pa gen chapit pou siveye kounye a"
          )
        : t(
            "Not enough chapter information to watch yet",
            "Aun no hay suficiente informacion por capitulo para observar",
            "Pas encore assez d'information de chapitre a surveiller",
            "Poko gen ase enfomasyon chapit pou siveye"
          ),
    },
    {
      key: "risk",
      title: t("High Risk", "Alto riesgo", "Haut risque", "Gwo risk"),
      tone: { border: "#efc2c2", bg: "#fff8f8", title: "var(--brand-red)" },
      items: practiceChapterEntries
        .filter((item) => Number(item?.percent) < 60)
        .map((item) => `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${item.label} (${formatPracticePercentLabel(item.percent)})`),
      empty: practiceChapterEntries.length
        ? t(
            "No high-risk chapters right now",
            "No hay capitulos de alto riesgo en este momento",
            "Aucun chapitre a haut risque pour le moment",
            "Pa gen chapit gwo risk kounye a"
          )
        : t(
            "Not enough high-risk chapter information yet",
            "Aun no hay suficiente informacion de alto riesgo por capitulo",
            "Pas encore assez d'information de chapitre a haut risque",
            "Poko gen ase enfomasyon chapit gwo risk"
          ),
    },
  ];
  const practiceCategorySnapshotSections = [
    {
      key: "strong",
      title: t("Strong", "Fuerte", "Fort", "Fo"),
      tone: { border: "#bddfc6", bg: "#f7fff9", title: "#1f6f3d" },
      items: practiceCategoryEntries
        .filter((item) => Number(item?.percent) >= 80)
        .map((item) => `${formatCategoryLabel(item.label)} (${formatPracticePercentLabel(item.percent)})`),
      empty: t(
        "Not enough strong category information yet",
        "Aun no hay suficiente informacion fuerte por categoria",
        "Pas encore assez d'information forte par categorie",
        "Poko gen ase enfomasyon kategori ki fo"
      ),
    },
    {
      key: "watch",
      title: t("Watch", "Observe", "A surveiller", "Siveye"),
      tone: { border: "#eadba6", bg: "#fffdf5", title: "#7a5a00" },
      items: practiceCategoryEntries
        .filter((item) => Number(item?.percent) >= 60 && Number(item?.percent) < 80)
        .map((item) => `${formatCategoryLabel(item.label)} (${formatPracticePercentLabel(item.percent)})`),
      empty: practiceCategoryEntries.length
        ? t(
            "No categories to watch right now",
            "No hay categorias para observar en este momento",
            "Aucune categorie a surveiller pour le moment",
            "Pa gen kategori pou siveye kounye a"
          )
        : t(
            "Not enough category information to watch yet",
            "Aun no hay suficiente informacion por categoria para observar",
            "Pas encore assez d'information de categorie a surveiller",
            "Poko gen ase enfomasyon kategori pou siveye"
          ),
    },
    {
      key: "risk",
      title: t("High Risk", "Alto riesgo", "Haut risque", "Gwo risk"),
      tone: { border: "#efc2c2", bg: "#fff8f8", title: "var(--brand-red)" },
      items: practiceCategoryEntries
        .filter((item) => Number(item?.percent) < 60)
        .map((item) => `${formatCategoryLabel(item.label)} (${formatPracticePercentLabel(item.percent)})`),
      empty: practiceCategoryEntries.length
        ? t(
            "No high-risk categories right now",
            "No hay categorias de alto riesgo en este momento",
            "Aucune categorie a haut risque pour le moment",
            "Pa gen kategori gwo risk kounye a"
          )
        : t(
            "Not enough high-risk category information yet",
            "Aun no hay suficiente informacion de alto riesgo por categoria",
            "Pas encore assez d'information de categorie a haut risque",
            "Poko gen ase enfomasyon kategori gwo risk"
          ),
    },
  ];

  const practiceModeCounts = summary?.practiceFocus?.modeCounts || {};
  const hasChapterPracticeSignals = Boolean(chapterPractice?.strongest || chapterPractice?.weakest);
  const hasCategoryPracticeSignals = Boolean(categoryPractice?.strongest || categoryPractice?.weakest);
  const mixedPracticeCount = Number(practiceModeCounts?.mixed || 0);
  const chapterPracticeCount = Number(practiceModeCounts?.chapter || 0);
  const categoryPracticeCount = Number(practiceModeCounts?.category || 0);
  const hasEstablishedChapterPracticeHistory = chapterPracticeCount > 5;
  const hasEstablishedCategoryPracticeHistory = categoryPracticeCount > 5;
  const practiceNextSteps = [];

  if (chapterPracticeCount > 0) {
    if (chapterPractice?.weakest?.label != null) {
      practiceNextSteps.push(
        t(
          `Keep working chapter practice around Chapter ${chapterPractice.weakest.label} until your results become more consistent.`,
          `Siga trabajando la practica por capitulo alrededor del Capitulo ${chapterPractice.weakest.label} hasta que sus resultados sean mas consistentes.`,
          `Continuez la pratique par chapitre autour du Chapitre ${chapterPractice.weakest.label} jusqu'a ce que vos resultats deviennent plus reguliers.`,
          `Kontinye travay pratik pa chapit sou Chapit ${chapterPractice.weakest.label} jiskaske rezilta ou vin pi regilye.`
        )
      );
    } else {
      practiceNextSteps.push(
        t(
          "Keep using chapter practice so your report can build clearer chapter information.",
          "Siga usando la practica por capitulo para que su reporte construya informacion por capitulo mas clara.",
          "Continuez la pratique par chapitre pour que votre rapport construise des informations de chapitre plus claires.",
          "Kontinye itilize pratik pa chapit pou rapo ou bati enfomasyon chapit ki pi kle."
        )
      );
    }
  }

  if (categoryPracticeCount > 0) {
    if (categoryPractice?.weakest?.label) {
      practiceNextSteps.push(
        t(
          `Use category practice to reinforce ${formatCategoryLabel(categoryPractice.weakest.label)} before moving on.`,
          `Use la practica por categoria para reforzar ${formatCategoryLabel(categoryPractice.weakest.label)} antes de seguir adelante.`,
          `Utilisez la pratique par categorie pour renforcer ${formatCategoryLabel(categoryPractice.weakest.label)} avant de continuer.`,
          `Sèvi ak pratik pa kategori pou ranfòse ${formatCategoryLabel(categoryPractice.weakest.label)} anvan ou kontinye.`
        )
      );
    } else {
      practiceNextSteps.push(
        t(
          "Keep using category practice so your report can show a clearer category pattern.",
          "Siga usando la practica por categoria para que su reporte muestre un patron por categoria mas claro.",
          "Continuez la pratique par categorie pour que votre rapport montre un schema par categorie plus clair.",
          "Kontinye itilize pratik pa kategori pou rapo ou montre yon modèl kategori ki pi klè."
        )
      );
    }
  }

  if (mixedPracticeCount > 0 && chapterPracticeCount === 0 && categoryPracticeCount === 0) {
    practiceNextSteps.push(
      t(
        "Mixed practice is helping you see many questions. Add one chapter or category session next so your report can give more targeted guidance.",
        "La practica mixta le ayuda a ver muchas preguntas. Agregue una sesion por capitulo o categoria para que su reporte pueda darle una guia mas dirigida.",
        "La pratique mixte vous aide a voir de nombreuses questions. Ajoutez ensuite une session par chapitre ou par categorie pour obtenir des conseils plus cibles.",
        "Pratik melanje ede ou wè anpil kestyon. Ajoute yon sesyon pa chapit oswa pa kategori apre sa pou rapo a ka ba ou konsèy pi vize."
      )
    );
  }

  if (!practiceNextSteps.length) {
    practiceNextSteps.push(
      t(
        "Start with chapter or category practice so your report can show clearer strengths and review areas.",
        "Empiece con practica por capitulo o categoria para que su reporte pueda mostrar fortalezas y areas de repaso mas claras.",
        "Commencez par une pratique par chapitre ou par categorie pour que votre rapport puisse montrer des forces et des points a revoir plus clairs.",
        "Kòmanse ak pratik pa chapit oswa pa kategori pou rapo ou ka montre fòs ak zòn pou revize ki pi klè."
      )
    );
  }

  const noChapterReviewText = hasEstablishedChapterPracticeHistory
    ? t(
        "No chapter needs review right now",
        "Ningun capitulo necesita repaso en este momento",
        "Aucun chapitre n'a besoin d'etre revu pour le moment",
        "Pa gen chapit ki bezwen revizyon kounye a"
      )
    : t(
        "Not enough chapter information yet",
        "Aun no hay suficiente informacion por capitulo",
        "Pas encore assez d'information par chapitre",
        "Poko gen ase enfomasyon pa chapit"
      );
  const noCategoryReviewText = hasEstablishedCategoryPracticeHistory
    ? t(
        "No category needs review right now",
        "Ninguna categoria necesita repaso en este momento",
        "Aucune categorie n'a besoin d'etre revue pour le moment",
        "Pa gen kategori ki bezwen revizyon kounye a"
      )
    : t(
        "Not enough category information yet",
        "Aun no hay suficiente informacion por categoria",
        "Pas encore assez d'information par categorie",
        "Poko gen ase enfomasyon pa kategori"
      );

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4, flex: "1 1 560px", minWidth: 0 }}>
            <div style={title}>{t("My Progress", "Mi progreso", "Mon progres", "Pwogre mwen")}</div>
            <div style={subjectTitle}>{studentName}</div>
            <div style={subText}>
              {t(
                "See your current readiness, strengths, weak areas, and what to do next.",
                "Vea su preparacion actual, fortalezas, areas debiles y que hacer despues.",
                "Voyez votre niveau actuel, vos forces, vos points faibles et la prochaine etape.",
                "Gade nivo preparasyon ou, fos ou, febles ou, ak sa pou fe apre."
              )}
            </div>
            <div style={{ ...subText, fontSize: 12.5 }}>
              {t(
                "Color guide: Exam chapters use 80-100% strong, 60-79% borderline, below 60% high risk. Categories use 80-100% strong, 70-79% developing, below 70% weak.",
                "Guia de color: Los capitulos del examen usan 80-100% fuerte, 60-79% al limite, menos de 60% alto riesgo. Las categorias usan 80-100% fuerte, 70-79% en desarrollo, menos de 70% debil.",
                "Guide des couleurs: Les chapitres d'examen utilisent 80-100 % fort, 60-79 % limite, moins de 60 % haut risque. Les categories utilisent 80-100 % fort, 70-79 % en developpement, moins de 70 % faible.",
                "Gid koulè: Chapit egzamen yo sèvi ak 80-100% fò, 60-79% sou limit, anba 60% gwo risk. Kategori yo sèvi ak 80-100% fò, 70-79% an devlopman, anba 70% fèb."
              )}
            </div>
          </div>
          <button
            style={{ ...btnSecondary, marginLeft: "auto", alignSelf: "flex-start", flexShrink: 0 }}
            onClick={() => router.push(`/start?lang=${lang}`)}
          >
            {t("Back to Main Menu", "Volver al menu principal", "Retour au menu principal", "Retounen nan meni prensipal la")}
          </button>
        </div>

        <div style={body}>
          {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
          {showLoadingNotice ? (
            <InlineMessage>
              {t("Loading your report...", "Cargando su reporte...", "Chargement de votre rapport...", "Ap chaje rapo ou a...")}
            </InlineMessage>
          ) : null}

          {!loading && summary ? (
            <div style={viewToggleWrap}>
              <button
                style={{
                  ...btnSecondary,
                  borderColor: activeView === "practice" ? "var(--brand-red)" : "#cfdde6",
                  background: activeView === "practice" ? "var(--brand-red-soft)" : "white",
                  color: activeView === "practice" ? "var(--brand-red)" : "#536779",
                }}
                onClick={() => setActiveView("practice")}
              >
                {t("Practice Progress", "Progreso de practica", "Progression en pratique", "Pwogrè pratik")}
              </button>
              <button
                style={{
                  ...btnSecondary,
                  borderColor: activeView === "exam" ? "var(--brand-red)" : "#cfdde6",
                  background: activeView === "exam" ? "var(--brand-red-soft)" : "white",
                  color: activeView === "exam" ? "var(--brand-red)" : "#536779",
                }}
                onClick={() => setActiveView("exam")}
              >
                {t("Exam Readiness", "Preparacion para examen", "Preparation a l'examen", "Preparasyon pou egzamen")}
              </button>
            </div>
          ) : null}

          {!loading && summary ? (
            <>
              {activeView === "practice" ? (
                <>
                  <div
                    style={{
                      ...sectionCard,
                      borderColor: "#d7e4ec",
                      background: "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)",
                      gap: 12,
                    }}
                  >
                    <div style={{ ...rowLabel, color: "#607282" }}>
                      {t("Practice progress", "Progreso de practica", "Progression en pratique", "Pwogrè pratik")}
                    </div>
                    <div style={{ fontSize: isNarrow ? 28 : 32, fontWeight: 800, color: "#38556a" }}>
                      {summary.practice?.completedSessions > 0
                        ? t("Building steadily", "Avanzando de forma constante", "En progression constante", "Pwogrè ap fèt piti piti")
                        : t("Just getting started", "Apenas empezando", "Tout commence", "Ou fèk kòmanse")}
                    </div>
                    <div style={{ ...subText, color: "#607282" }}>
                      {t("Completed practice", "Practica completada", "Pratique terminee", "Pratik fini")}: {summary.practice?.completedSessions ?? 0}
                      {" | "}
                      {t("All practice sessions", "Todas las sesiones de practica", "Toutes les sessions de pratique", "Tout sesyon pratik yo")}: {summary.practice?.totalSessions ?? 0}
                      {" | "}
                      {t("Practice questions seen", "Preguntas de practica vistas", "Questions de pratique vues", "K kestyon pratik ou wè")}: {practiceQuestionsSeen}
                    </div>
                  </div>

                  <div style={analysisGrid}>
                    <div
                      style={{
                        ...compactCard,
                        borderColor: "#bddfc6",
                        background: "linear-gradient(180deg, #f7fff9 0%, #eef8f1 100%)",
                      }}
                    >
                      <div style={{ ...rowLabel, color: "#476252" }}>
                        {t("Chapter work", "Trabajo por capitulo", "Travail par chapitre", "Travay pa chapit")}
                      </div>
                      <div style={{ ...subText, color: "#476252" }}>
                        {t("Best current chapter", "Mejor capitulo actual", "Meilleur chapitre actuel", "Pi bon chapit pou kounye a")}:{" "}
                        {strongestPracticeChapter?.label != null
                          ? `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${strongestPracticeChapter.label}`
                          : chapterPractice?.entries?.length
                            ? t(
                                "No clear strong chapter yet",
                                "Aun no hay un capitulo fuerte claro",
                                "Pas encore de chapitre fort clair",
                                "Poko gen chapit fò ki klè"
                              )
                            : t("Not enough chapter information yet", "Aun no hay suficiente informacion por capitulo", "Pas encore assez d'information par chapitre", "Poko gen ase enfomasyon pa chapit")}
                      </div>
                      <div style={{ ...subText, color: "#476252" }}>
                        {t("Chapter to review", "Capitulo para repasar", "Chapitre a revoir", "Chapit pou revize")}:{" "}
                        {chapterPractice?.weakest?.label != null
                          ? `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${chapterPractice.weakest.label}`
                          : noChapterReviewText}
                      </div>
                    </div>

                    <div
                      style={{
                        ...compactCard,
                        borderColor: topHighRisk ? "#efc2c2" : "#eadba6",
                        background: topHighRisk
                          ? "linear-gradient(180deg, #fff8f8 0%, #fff0f0 100%)"
                          : "linear-gradient(180deg, #fffdf5 0%, #f8f3df 100%)",
                      }}
                    >
                      <div style={{ ...rowLabel, color: topHighRisk ? "#6f4747" : "#6f6340" }}>
                        {t("Category work", "Trabajo por categoria", "Travail par categorie", "Travay pa kategori")}
                      </div>
                      <div style={{ ...subText, color: topHighRisk ? "#6f4747" : "#6f6340" }}>
                        {t("Best current category", "Mejor categoria actual", "Meilleure categorie actuelle", "Pi bon kategori pou kounye a")}:{" "}
                        {strongestPracticeCategory?.label != null
                          ? formatCategoryLabel(strongestPracticeCategory.label)
                          : categoryPractice?.entries?.length
                            ? t(
                                "No clear strong category yet",
                                "Aun no hay una categoria fuerte clara",
                                "Pas encore de categorie forte claire",
                                "Poko gen kategori fò ki klè"
                              )
                            : t("Not enough category information yet", "Aun no hay suficiente informacion por categoria", "Pas encore assez d'information par categorie", "Poko gen ase enfomasyon pa kategori")}
                      </div>
                      <div style={{ ...subText, color: topHighRisk ? "#6f4747" : "#6f6340" }}>
                        {t("Category to review", "Categoria para repasar", "Categorie a revoir", "Kategori pou revize")}:{" "}
                        {categoryPractice?.weakest?.label != null
                          ? formatCategoryLabel(categoryPractice.weakest.label)
                          : noCategoryReviewText}
                      </div>
                    </div>
                  </div>

                  <div style={compactCard}>
                    <div style={{ ...metricLabel, color: "#607282" }}>
                      {t("What to do next in practice", "Que hacer ahora en practica", "Que faire maintenant en pratique", "Sa pou fè kounye a nan pratik")}
                    </div>
                    <ul style={bulletList}>
                      {practiceNextSteps.map((item, index) => (
                        <li key={`student-practice-next-${index}`}>{item}</li>
                      ))}
                    </ul>
                  </div>

                  <div style={sectionCard}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                      {t("Practice chapter picture", "Panorama de practica por capitulos", "Panorama de pratique par chapitres", "Foto pratik pa chapit")}
                    </div>
                    <div style={subText}>
                      {t(
                        "This view only reflects chapters you practiced in chapter mode so far.",
                        "Esta vista solo refleja los capitulos que ha practicado en modo capitulo hasta ahora.",
                        "Cette vue ne reflète que les chapitres que vous avez pratiques en mode chapitre jusqu'ici.",
                        "View sa a montre sèlman chapit ou te pratike nan mòd chapit jiska kounye a."
                      )}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
                        gap: 10,
                      }}
                    >
                      {practiceChapterSnapshotSections.map((section) => (
                        <div
                          key={`practice-chapter-${section.key}`}
                          style={{
                            ...compactCard,
                            borderColor: section.tone.border,
                            background: section.tone.bg,
                            padding: 12,
                          }}
                        >
                          <div style={{ ...rowLabel, color: section.tone.title }}>{section.title}</div>
                          {section.items.length ? (
                            <ul style={bulletList}>
                              {section.items.slice(0, 4).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <div style={subText}>{section.empty}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={sectionCard}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                      {t("Practice category picture", "Panorama de practica por categorias", "Panorama de pratique par categories", "Foto pratik pa kategori")}
                    </div>
                    <div style={subText}>
                      {t(
                        "This view only reflects categories you practiced in category mode so far.",
                        "Esta vista solo refleja las categorias que ha practicado en modo categoria hasta ahora.",
                        "Cette vue ne reflète que les categories que vous avez pratiquees en mode categorie jusqu'ici.",
                        "View sa a montre sèlman kategori ou te pratike nan mòd kategori jiska kounye a."
                      )}
                    </div>
                    <div
                      style={{
                        display: "grid",
                        gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
                        gap: 10,
                      }}
                    >
                      {practiceCategorySnapshotSections.map((section) => (
                        <div
                          key={`practice-${section.key}`}
                          style={{
                            ...compactCard,
                            borderColor: section.tone.border,
                            background: section.tone.bg,
                            padding: 12,
                          }}
                        >
                          <div style={{ ...rowLabel, color: section.tone.title }}>{section.title}</div>
                          {section.items.length ? (
                            <ul style={bulletList}>
                              {section.items.slice(0, 4).map((item) => (
                                <li key={item}>{item}</li>
                              ))}
                            </ul>
                          ) : (
                            <div style={subText}>{section.empty}</div>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : null}

              {activeView === "exam" ? (
                <>
              <div
                style={{
                  ...sectionCard,
                  borderColor: examStatusTone.border,
                  background: examStatusTone.bg,
                  gap: 12,
                }}
              >
                <div style={{ ...rowLabel, color: examStatusTone.muted }}>
                  {t("My readiness", "Mi preparacion", "Mon niveau", "Preparasyon mwen")}
                </div>
                <div style={{ fontSize: isNarrow ? 28 : 32, fontWeight: 800, color: examStatusTone.accent }}>
                  {hasCompletedExam
                    ? formatStatusLabel(overallStatus)
                    : t("No exam information yet", "Aun no hay informacion de examen", "Pas encore d'information d'examen", "Poko gen enfomasyon egzamen")}
                </div>
                <div style={{ ...subText, color: examStatusTone.muted }}>
                  {t("Average exam", "Promedio de examen", "Moyenne d'examen", "Mwayen egzamen")}:{" "}
                  {formatPercent(summary.exams?.averageScore) || noDataLabel()}
                  {" | "}
                  {t("Completed exams", "Examenes completados", "Examens termines", "Egzamen fini")}: {summary.exams?.completedAttempts ?? 0}
                  {" | "}
                  {t("Exam questions seen", "Preguntas de examen vistas", "Questions d'examen vues", "K kestyon egzamen ou wè")}: {examQuestionsSeen}
                </div>
                {!hasCompletedExam ? (
                  <div style={{ ...subText, color: examStatusTone.muted }}>
                    {t(
                      "Exam readiness will become more detailed after your first completed exam.",
                      "La preparacion para examen sera mas detallada despues de su primer examen completado.",
                      "La preparation a l'examen deviendra plus detaillee apres votre premier examen termine.",
                      "Preparasyon pou egzamen ap vin pi detaye apre premye egzamen ou fini."
                    )}
                  </div>
                ) : null}
              </div>

              {hasCompletedExam ? (
              <>
              <div style={sectionCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                  {t("Snapshot from your latest exam", "Resumen de su examen mas reciente", "Resume de votre dernier examen", "Rezime dènye egzamen ou")}
                </div>
                <div style={subText}>
                  {t(
                    "This section is based on your latest completed exam.",
                    "Esta seccion se basa en su examen completado mas reciente.",
                    "Cette section est basee sur votre dernier examen termine.",
                    "Seksyon sa a baze sou dènye egzamen ou fini."
                  )}
                </div>
                <div style={analysisGrid}>
                  <div
                    style={{
                      ...compactCard,
                      borderColor: latestExamScoreTone.border,
                      background: latestExamScoreTone.bg,
                    }}
                  >
                    <div style={{ ...rowLabel, color: latestExamScoreTone.muted }}>
                      {t("Latest exam score", "Puntaje del examen mas reciente", "Score du dernier examen", "Nòt dènye egzamen")}
                    </div>
                    <div style={{ ...metricValue, color: latestExamScoreTone.accent, fontSize: 20 }}>
                      {formatPercent(latestExamResults?.score) || noDataLabel()}
                    </div>
                  </div>

                  <div
                    style={{
                      ...compactCard,
                      borderColor: "#bddfc6",
                      background: "linear-gradient(180deg, #f7fff9 0%, #eef8f1 100%)",
                    }}
                  >
                    <div style={{ ...rowLabel, color: "#476252" }}>
                      {t("Best chapter", "Mejor capitulo", "Meilleur chapitre", "Pi bon chapit")}
                    </div>
                    <div style={{ ...metricValue, color: "#1f6f3d", fontSize: 20 }}>
                      {latestExamBestChapter?.chapterId
                        ? `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${latestExamBestChapter.chapterId}${latestExamBestChapter?.percent != null ? ` - ${formatPercent(latestExamBestChapter.percent)}` : ""}`
                        : noDataLabel()}
                    </div>
                    <div style={{ ...subText, color: "#476252" }} />
                  </div>

                  <div
                    style={{
                      ...compactCard,
                      borderColor: "#eadba6",
                      background: "linear-gradient(180deg, #fffdf5 0%, #f8f3df 100%)",
                    }}
                  >
                    <div style={{ ...rowLabel, color: "#6f6340" }}>
                      {t("Worst chapter", "Capitulo mas debil", "Chapitre le plus faible", "Chapit ki pi fèb")}
                    </div>
                    <div style={{ ...metricValue, color: "#7a5a00", fontSize: 20 }}>
                      {latestExamWorstChapter?.chapterId
                        ? `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${latestExamWorstChapter.chapterId}${latestExamWorstChapter?.percent != null ? ` - ${formatPercent(latestExamWorstChapter.percent)}` : ""}`
                        : noDataLabel()}
                    </div>
                    <div style={{ ...subText, color: "#6f6340" }} />
                  </div>
                </div>

                <div style={analysisGrid}>
                  <div
                    style={{
                      ...compactCard,
                      borderColor: "#bddfc6",
                      background: "linear-gradient(180deg, #f7fff9 0%, #eef8f1 100%)",
                    }}
                  >
                    <div style={{ ...rowLabel, color: "#476252" }}>
                      {t("Strongest area", "Area mas fuerte", "Zone la plus forte", "Zon ki pi fo")}
                    </div>
                    <div style={{ ...metricValue, color: "#1f6f3d", fontSize: 20 }}>
                      {topStrengthCategory
                        ? `${formatCategoryLabel(topStrengthCategory)}${topStrength?.percent != null ? ` - ${formatPracticePercentLabel(topStrength.percent)}` : ""}`
                        : t("Still forming", "Aun formandose", "Encore en formation", "Li poko byen klè")}
                    </div>
                    <div style={{ ...subText, color: "#476252" }}>
                      {topStrength?.level
                        ? `${topStrength.level} | `
                        : ""}
                      {t("Main chapter", "Capitulo principal", "Chapitre principal", "Chapit prensipal")}:{" "}
                      {topStrengthMainChapter
                        ? `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${topStrengthMainChapter}`
                        : noDataLabel()}
                      {topStrengthSupportChapters.length
                        ? ` | ${t("Support chapters", "Capitulos de apoyo", "Chapitres de soutien", "Chapit sipò")}: ${topStrengthSupportChapters
                            .map((chapterId) => `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${chapterId}`)
                            .join(", ")}`
                        : ""}
                    </div>
                  </div>

                  <div
                    style={{
                      ...compactCard,
                      borderColor: needsWorkTone.borderColor,
                      background: needsWorkTone.background,
                    }}
                  >
                    <div style={{ ...rowLabel, color: needsWorkTone.label }}>
                      {t("Needs work now", "Necesita trabajo ahora", "A travailler maintenant", "Sa bezwen travay kounye a")}
                    </div>
                    <div style={{ ...metricValue, color: needsWorkTone.accent, fontSize: 20 }}>
                      {topWeakCategory
                        ? `${formatCategoryLabel(topWeakCategory)}${topWeakEntry?.percent != null ? ` - ${formatPracticePercentLabel(topWeakEntry.percent)}` : ""}`
                        : t("No clear weak area yet", "Aun no hay area debil clara", "Pas encore de faiblesse claire", "Poko gen febles ki byen klè")}
                    </div>
                    <div style={{ ...subText, color: needsWorkTone.sub }}>
                      {topWeakEntry?.level
                        ? `${topWeakEntry.level} | `
                        : ""}
                      {t("Study chapter", "Capitulo de estudio", "Chapitre a etudier", "Chapit pou etidye")}:{" "}
                      {topWeakMainChapter ? `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${topWeakMainChapter}` : noDataLabel()}
                      {topWeakSupportChapters.length
                        ? ` | ${t("Support chapters", "Capitulos de apoyo", "Chapitres de soutien", "Chapit sipò")}: ${topWeakSupportChapters
                            .map((chapterId) => `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${chapterId}`)
                            .join(", ")}`
                        : ""}
                    </div>
                  </div>
                </div>

                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                    {t("Your category picture", "Tu panorama por categorias", "Votre panorama par categories", "Foto kategori ou yo")}
                  </div>
                  <div style={subText}>
                    {t(
                      "This gives you a fast read of what looks strong, what to watch, and what feels urgent.",
                      "Esto le da una lectura rapida de lo que se ve fuerte, lo que hay que vigilar y lo que se siente urgente.",
                      "Cela donne une lecture rapide de ce qui semble fort, de ce qu'il faut surveiller et de ce qui parait urgent.",
                      "Sa ba ou yon lekti rapid sou sa ki fò, sa pou siveye, ak sa ki pi ijan."
                    )}
                  </div>
                  <div
                    style={{
                      display: "grid",
                      gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
                      gap: 10,
                    }}
                  >
                    {categorySnapshotSections.map((section) => (
                      <div
                        key={section.key}
                        style={{
                          ...compactCard,
                          borderColor: section.tone.border,
                          background: section.tone.bg,
                          padding: 12,
                        }}
                      >
                        <div style={{ ...rowLabel, color: section.tone.title }}>{section.title}</div>
                        {section.items.length ? (
                          <ul style={bulletList}>
                            {section.items.slice(0, 4).map((item) => (
                              <li key={item}>{item}</li>
                            ))}
                          </ul>
                        ) : (
                          <div style={subText}>{section.empty}</div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>

                <div
                  style={{
                    ...compactCard,
                    borderColor: statusTone.border,
                    background: statusTone.bg,
                  }}
                >
                  <div style={{ ...metricLabel, color: statusTone.muted }}>
                    {t("What to do next", "Que hacer ahora", "Que faire maintenant", "Sa pou fè kounye a")}
                  </div>
                  <ul style={bulletList}>
                    {nextActions.slice(0, 3).map((item, index) => (
                      <li key={`student-next-${item.kind}-${item.value || index}`}>{renderNextAction(item)}</li>
                    ))}
                  </ul>
                </div>
              </div>

              <div style={sectionCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                  {t("Progress over time", "Progreso en el tiempo", "Progression dans le temps", "Pwogresyon sou tan")}
                </div>
                <div style={subText}>
                  {t(
                    "Use this section to track your completed exam scores and the areas that keep repeating.",
                    "Use esta seccion para seguir sus puntajes de examenes completados y las areas que siguen repitiendose.",
                    "Utilisez cette section pour suivre vos scores d'examens termines et les domaines qui se repetent.",
                    "Sèvi ak seksyon sa a pou swiv nòt egzamen ou fini yo ak zòn ki kontinye repete."
                  )}
                </div>
                <div style={{ ...compactCard, padding: 12 }}>
                  <div style={subText}>
                    {t("Completed exams", "Examenes completados", "Examens termines", "Egzamen fini")}: {progress.completedAttempts}
                    {" | "}
                    {t("Average exam", "Promedio de examen", "Moyenne d'examen", "Mwayen egzamen")}: {formatPercent(progress.examAverage) || noDataLabel()}
                    {" | "}
                    {t("Best", "Mejor", "Meilleur", "Pi bon")}: {formatPercent(progress.bestScore) || noDataLabel()}
                    {" | "}
                    {t("Worst", "Mas bajo", "Le plus bas", "Pi ba")}: {formatPercent(progress.worstScore) || noDataLabel()}
                  </div>
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  {examHistory.length ? (
                    examHistory.map((attempt, index) => (
                      <details
                        key={`student-history-${attempt?.attemptId || index}`}
                        style={{ ...compactCard, padding: 12 }}
                        open={index === 0}
                      >
                        <summary style={detailsSummary}>
                          <div style={{ display: "grid", gap: 6 }}>
                            <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                              {t("Exam", "Examen", "Examen", "Egzamen")} {progress.completedAttempts - index}
                            </div>
                            <div style={subText}>
                              {t("Completed", "Completado", "Termine", "Fini")}: {formatDateTime(attempt?.completedAt)}
                              {" | "}
                              {t("Score", "Puntaje", "Score", "Not")}: {formatPercent(attempt?.score) || noDataLabel()}
                            </div>
                            <div style={subText}>
                              {t("Weakest category", "Categoria mas debil", "Categorie la plus faible", "Kategori ki pi fèb")}:{" "}
                              {attempt?.weakestCategory?.category ? formatCategoryLabel(attempt.weakestCategory.category) : noDataLabel()}
                            </div>
                            <div style={subText}>
                              {t("Weakest chapter", "Capitulo mas debil", "Chapitre le plus faible", "Chapit ki pi fèb")}:{" "}
                              {attempt?.weakestChapter?.chapterId
                                ? `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${attempt.weakestChapter.chapterId}`
                                : noDataLabel()}
                            </div>
                          </div>
                        </summary>

                        <div style={{ display: "grid", gap: 12, marginTop: 12 }}>
                          {(attempt?.chapterBreakdown || []).length ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                                {t("Chapter breakdown", "Desglose por capitulo", "Detail par chapitre", "Dekonpozisyon pa chapit")}
                              </div>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: isNarrow ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))",
                                  gap: 10,
                                }}
                              >
                                {(attempt?.chapterBreakdown || []).map((chapter) => {
                                  const tone = getBandTone(chapter?.percent);
                                  return (
                                    <div
                                      key={`student-history-chapter-${attempt?.attemptId || index}-${chapter.chapterId}`}
                                      style={{
                                        ...compactCard,
                                        padding: 10,
                                        gap: 4,
                                        background: tone.bg,
                                        borderColor: tone.border,
                                      }}
                                    >
                                      <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                                        {t("Chapter", "Capitulo", "Chapitre", "Chapit")} {chapter.chapterId}
                                      </div>
                                      <div style={{ ...subText, lineHeight: 1.45 }}>
                                        {t("Correct", "Correctas", "Bonnes", "Bon")}: {chapter.correctCount}/{chapter.totalQuestions}
                                      </div>
                                      <div style={{ ...subText, lineHeight: 1.45 }}>
                                        {t("Missed", "Falladas", "Manquees", "Rate")}: {chapter.missedCount}
                                      </div>
                                      <div style={{ ...subText, lineHeight: 1.45 }}>
                                        {t("Score", "Puntaje", "Score", "Not")}: {formatPercent(chapter.percent) || noDataLabel()}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}

                          {(attempt?.categoryBreakdown || []).length ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                                {t("Category breakdown", "Desglose por categoria", "Detail par categorie", "Dekonpozisyon pa kategori")}
                              </div>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: isNarrow ? "1fr" : "repeat(auto-fit, minmax(190px, 1fr))",
                                  gap: 10,
                                }}
                              >
                                {(attempt?.categoryBreakdown || []).map((category) => {
                                  const tone = getCategoryBandTone(category?.percent);
                                  return (
                                    <div
                                      key={`student-history-category-${attempt?.attemptId || index}-${category.category}`}
                                      style={{
                                        ...compactCard,
                                        padding: 10,
                                        gap: 4,
                                        background: tone.bg,
                                        borderColor: tone.border,
                                      }}
                                    >
                                      <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                                        {formatCategoryLabel(category.category)}
                                      </div>
                                      <div style={{ ...subText, lineHeight: 1.45 }}>
                                        {t("Correct", "Correctas", "Bonnes", "Bon")}: {category.correctCount}/{category.totalQuestions}
                                      </div>
                                      <div style={{ ...subText, lineHeight: 1.45 }}>
                                        {t("Missed", "Falladas", "Manquees", "Rate")}: {category.missedCount}
                                      </div>
                                      <div style={{ ...subText, lineHeight: 1.45 }}>
                                        {t("Score", "Puntaje", "Score", "Not")}: {formatPercent(category.percent) || noDataLabel()}
                                      </div>
                                    </div>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                        </div>
                      </details>
                    ))
                  ) : (
                    <div style={subText}>{noDataLabel()}</div>
                  )}
                </div>
              </div>
              </>
              ) : (
              <>
              <div style={analysisGrid}>
                <div
                  style={{
                    ...compactCard,
                    borderColor: "#d7e4ec",
                    background: "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)",
                  }}
                >
                  <div style={{ ...rowLabel, color: "#607282" }}>
                    {t("Strongest area", "Area mas fuerte", "Zone la plus forte", "Zon ki pi fo")}
                  </div>
                  <div style={{ ...metricValue, color: "#38556a", fontSize: 20 }}>
                    {t("No exam strength yet", "Aun no hay fortaleza de examen", "Pas encore de force d'examen", "Poko gen fos egzamen")}
                  </div>
                  <div style={{ ...subText, color: "#607282" }}>
                    {t(
                      "Complete one full exam to begin building this part of your report.",
                      "Complete un examen completo para empezar a construir esta parte de su reporte.",
                      "Completez un examen complet pour commencer a construire cette partie de votre rapport.",
                      "Fini yon egzamen konple pou kòmanse bati pati sa a nan rapo ou."
                    )}
                  </div>
                </div>

                <div
                  style={{
                    ...compactCard,
                    borderColor: "#d7e4ec",
                    background: "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)",
                  }}
                >
                  <div style={{ ...rowLabel, color: "#607282" }}>
                    {t("Needs work now", "Necesita trabajo ahora", "A travailler maintenant", "Sa bezwen travay kounye a")}
                  </div>
                  <div style={{ ...metricValue, color: "#38556a", fontSize: 20 }}>
                    {t("No exam weak area yet", "Aun no hay area debil de examen", "Pas encore de faiblesse d'examen", "Poko gen febles egzamen")}
                  </div>
                  <div style={{ ...subText, color: "#607282" }}>
                    {t(
                      "Exam weak areas will appear after your first completed exam.",
                      "Las areas debiles del examen apareceran despues de su primer examen completado.",
                      "Les faiblesses de l'examen apparaitront apres votre premier examen termine.",
                      "Zon feb egzamen yo ap parèt apre premye egzamen ou fini."
                    )}
                  </div>
                </div>
              </div>

              <div
                style={{
                  ...compactCard,
                  borderColor: examStatusTone.border,
                  background: examStatusTone.bg,
                }}
              >
                <div style={{ ...metricLabel, color: examStatusTone.muted }}>
                  {t("What to do next", "Que hacer ahora", "Que faire maintenant", "Sa pou fè kounye a")}
                </div>
                <ul style={bulletList}>
                  <li>
                    {t(
                      "Take your first full exam when you feel ready so this section can show true readiness guidance.",
                      "Tome su primer examen completo cuando se sienta listo para que esta seccion pueda mostrar una guia real de preparacion.",
                      "Passez votre premier examen complet quand vous vous sentez pret afin que cette section puisse montrer de vrais conseils de preparation.",
                      "Fè premye egzamen konplè ou lè ou santi ou pare pou seksyon sa a ka montre vrè konsèy preparasyon."
                    )}
                  </li>
                </ul>
              </div>

              <div style={sectionCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                  {t("Your category picture", "Tu panorama por categorias", "Votre panorama par categories", "Foto kategori ou yo")}
                </div>
                <div style={subText}>
                  {t(
                    "Your exam category picture will appear after your first completed exam.",
                    "Su panorama por categorias del examen aparecera despues de su primer examen completado.",
                    "Votre panorama par categories d'examen apparaitra apres votre premier examen termine.",
                    "Foto kategori egzamen ou yo ap parèt apre premye egzamen ou fini."
                  )}
                </div>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
                    gap: 10,
                  }}
                >
                  {categorySnapshotSections.map((section) => (
                    <div
                      key={`empty-${section.key}`}
                      style={{
                        ...compactCard,
                        borderColor: section.tone.border,
                        background: section.tone.bg,
                        padding: 12,
                      }}
                    >
                      <div style={{ ...rowLabel, color: section.tone.title }}>{section.title}</div>
                      <div style={subText}>{section.empty}</div>
                    </div>
                  ))}
                </div>
              </div>
              </>
              )}
                </>
              ) : null}

              <details style={sectionCard} open={activityOpen}>
                <summary
                  style={detailsSummary}
                  onClick={(e) => {
                    e.preventDefault();
                    setActivityOpen((prev) => !prev);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Activity details", "Detalles de actividad", "Details d'activite", "Detay aktivite")}</div>
                    <OpenHint isOpen={activityOpen} lang={lang} />
                  </div>
                  <div style={subText}>
                    {t(
                      "Open for the deeper numbers behind this report.",
                      "Abra para ver los numeros mas detallados detras de este reporte.",
                      "Ouvrez pour voir les chiffres plus detailles derriere ce rapport.",
                      "Louvri pou wè chif ki pi detaye dèyè rapo sa a."
                    )}
                  </div>
                </summary>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Exam activity", "Actividad de examen", "Activite d'examen", "Aktivite egzamen")}</div>
                    <div style={subText}>
                      {t("Total attempts", "Intentos totales", "Tentatives totales", "Total tantativ")}: {summary.exams?.totalAttempts ?? 0}
                      {" | "}
                      {t("Completed", "Completados", "Termines", "Fini")}: {summary.exams?.completedAttempts ?? 0}
                    </div>
                    <div style={subText}>
                      {t("Average score", "Puntaje promedio", "Score moyen", "Not mwayen")}: {formatPercent(summary.exams?.averageScore) || noDataLabel()}
                      {" | "}
                      {t("Best score", "Mejor puntaje", "Meilleur score", "Pi bon not")}: {formatPercent(summary.exams?.bestScore) || noDataLabel()}
                      {" | "}
                      {t("Worst score", "Puntaje mas bajo", "Score le plus bas", "Pi move not")}: {formatPercent(summary.exams?.worstScore) || noDataLabel()}
                    </div>
                    <div style={subText}>
                      {t("Current readiness", "Preparacion actual", "Preparation actuelle", "Preparasyon aktyel")}: {formatStatusLabel(summary.learningSignals?.overallStatus)}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Question exposure", "Exposicion a preguntas", "Exposition aux questions", "Ekspozisyon kestyon yo")}</div>
                    <div style={subText}>
                      {t("Total delivered", "Total mostradas", "Total affiche", "Total kestyon yo te montre")}:{" "}
                      {activeView === "practice" ? practiceExposureCount : examExposureCount}
                    </div>
                    <div style={subText}>
                      {t("Unique questions seen", "Preguntas unicas vistas", "Questions uniques vues", "K kestyon diferan ou te we")}:{" "}
                      {activeView === "practice" ? practiceUniqueQuestionsSeen : examUniqueQuestionsSeen}
                    </div>
                    <div style={subText}>
                      {activeView === "practice"
                        ? `${t("Practice only", "Solo practica", "Pratique seulement", "Pratik selman")}: ${practiceQuestionsSeen}`
                        : `${t("Exam only", "Solo examen", "Examen seulement", "Egzamen selman")}: ${examExposureCount}`}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Practice focus", "Enfoque de practica", "Axe de pratique", "Konsantrasyon pratik")}</div>
                    <div style={subText}>
                      {t("Chapters", "Capitulos", "Chapitres", "Chapit")}:{" "}
                      {Object.entries(summary.practiceFocus?.chapterCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || t("No chapter focus yet", "Todavia no hay enfoque por capitulo", "Pas encore d'axe par chapitre", "Poko gen konsantrasyon pa chapit")}
                    </div>
                    <div style={subText}>
                      {t("Categories", "Categorias", "Categories", "Kategori")}:{" "}
                      {Object.entries(summary.practiceFocus?.categoryCounts || {})
                        .map(([key, value]) => `${formatCategoryLabel(key)}: ${value}`)
                        .join(" | ") || t("No category focus yet", "Todavia no hay enfoque por categoria", "Pas encore d'axe par categorie", "Poko gen konsantrasyon pa kategori")}
                    </div>
                    <div style={subText}>
                      {t("Mixed practice", "Practica mixta", "Pratique mixte", "Pratik melanje")}:{" "}
                      {summary.practiceFocus?.modeCounts?.mixed ?? 0}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Remediation focus", "Enfoque de remediacion", "Axe de remediation", "Konsantrasyon remedyasyon")}</div>
                    <div style={subText}>
                      {t("Categories", "Categorias", "Categories", "Kategori")}:{" "}
                      {Object.entries(summary.remediationFocus?.categoryCounts || {})
                        .map(([key, value]) => `${formatCategoryLabel(key)}: ${value}`)
                        .join(" | ") || t("No remediation focus yet", "Todavia no hay enfoque de remediacion", "Pas encore d'axe de remediation", "Poko gen konsantrasyon remedyasyon")}
                    </div>
                    <div style={subText}>
                      {t("Outcomes", "Resultados", "Resultats", "Rezilta yo")}:{" "}
                      {Object.entries(summary.remediationFocus?.outcomeCounts || {})
                        .map(([key, value]) => `${value}: ${formatStatusLabel(key)}`)
                        .join(" | ") || t("No remediation outcomes yet", "Todavia no hay resultados de remediacion", "Pas encore de resultats de remediation", "Poko gen rezilta remedyasyon")}
                    </div>
                  </div>
                </div>
              </details>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}

