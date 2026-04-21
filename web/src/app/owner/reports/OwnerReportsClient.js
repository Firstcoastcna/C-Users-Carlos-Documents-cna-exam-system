"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  fetchOwnerClassOverviewReport,
  fetchOwnerSchoolOverviewReport,
  fetchOwnerStudentOverviewReport,
} from "../../lib/backend/auth/browserAuth";

const shell = {
  maxWidth: 980,
  margin: "24px auto",
  padding: 20,
  display: "grid",
  gap: 18,
};

const card = {
  border: "2px solid var(--frame-border)",
  borderRadius: 18,
  background: "white",
  boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
  overflow: "hidden",
};

const header = {
  padding: "18px 20px",
  borderBottom: "1px solid var(--chrome-border)",
  background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const body = {
  padding: 20,
  display: "grid",
  gap: 16,
};

const analysisGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  alignItems: "start",
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

const statGrid = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
};

const statCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 10,
  padding: "4px 8px",
  background: "var(--surface-soft)",
  display: "inline-flex",
  alignItems: "baseline",
  gap: 6,
  whiteSpace: "nowrap",
};

const statLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#607282",
};

const statValue = {
  fontSize: 13,
  fontWeight: 800,
  color: "var(--heading)",
};

const listCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  padding: 14,
  background: "#fcfeff",
  display: "grid",
  gap: 6,
};

const detailsSummary = {
  cursor: "pointer",
  listStyle: "none",
};

const buttonSecondary = {
  padding: "8px 11px",
  borderRadius: 9,
  border: "1px solid #cfdde6",
  background: "white",
  color: "#536779",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
};

function InlineMessage({ tone = "info", children }) {
  const styles =
    tone === "error"
      ? { background: "#fff0ef", border: "1px solid #f4c5c0", color: "#9b1c1c" }
      : { background: "#fff8eb", border: "1px solid #f0d59b", color: "#755200" };

  return <div style={{ padding: "12px 14px", borderRadius: 12, ...styles }}>{children}</div>;
}

function OpenHint({ isOpen }) {
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

  return (
    <span style={{ color: "#607282", fontSize: 11.5, fontWeight: 700 }}>
      {isNarrow ? (isOpen ? "Tap here to close" : "Tap here to open") : isOpen ? "Click here to close" : "Click here to open"}
    </span>
  );
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value}%` : "No data yet";
}

function formatDateTime(value) {
  if (!value) return "No date yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No date yet";
  return date.toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatCategoryLabel(value) {
  const map = {
    "Change in Condition": "Change in Condition",
    "Scope of Practice & Reporting": "Scope of Practice & Reporting",
    "Communication & Emotional Support": "Communication & Emotional Support",
    "Observation & Safety": "Observation & Safety",
    "Personal Care & Comfort": "Personal Care & Comfort",
    "Mobility & Positioning": "Mobility & Positioning",
    "Environment & Safety": "Environment & Safety",
    "Dignity & Resident Rights": "Dignity & Resident Rights",
    "Infection Control": "Infection Control",
  };
  return map[value] || value || "No data yet";
}

function getScoreTone(score) {
  if (!Number.isFinite(score)) {
    return { color: "#607282", bg: "#eef3f6", border: "#d6e1e8" };
  }
  if (score >= 80) {
    return { color: "#1f6f3d", bg: "#eef8f1", border: "#bddfc6" };
  }
  if (score >= 70) {
    return { color: "#7a5a00", bg: "#f8f3df", border: "#eadba6" };
  }
  return { color: "var(--brand-red)", bg: "#fff0f0", border: "#efc2c2" };
}

function rankCounts(mapLike, limit = 3) {
  return Object.entries(mapLike || {})
    .sort((a, b) => Number(b[1] || 0) - Number(a[1] || 0))
    .slice(0, limit);
}

function deriveClassStatus(summary) {
  const counts = summary?.overallStatusCounts || {};
  const onTrack = Number(counts["On Track"] || 0);
  const borderline = Number(counts["Borderline"] || 0);
  const highRisk = Number(counts["High Risk"] || 0);

  if (highRisk > 0) {
    return highRisk >= Math.max(1, onTrack) ? "Intervention Needed" : "Mixed";
  }
  if (borderline > 0) {
    return "Mixed";
  }
  if (onTrack > 0) {
    return "Stable";
  }
  return "Early signals only";
}

function buildClassNextActions(summary, students) {
  const actions = [];
  const topWeakCategories = rankCounts(summary?.categoryWeaknessCounts, 2);
  const topWeakChapters = rankCounts(summary?.chapterPriorityCounts, 2);
  const atRiskStudents = buildInterventionStudents(students);

  if (topWeakCategories[0]) {
    actions.push(`Reinforce ${topWeakCategories[0][0]} with the whole class first.`);
  }
  if (topWeakChapters[0]) {
    actions.push(`Review ${topWeakChapters[0][0]} before the next full exam.`);
  }
  if (atRiskStudents.length) {
    actions.push(`Check in with ${atRiskStudents.length} student${atRiskStudents.length === 1 ? "" : "s"} who are borderline or high risk.`);
  }

  if (!actions.length) {
    actions.push("Keep building activity so the class report can surface clearer trends.");
  }

  return actions.slice(0, 4);
}

function buildClassStrengths(summary) {
  const strongestCategories = Object.entries(summary?.categoryWeaknessCounts || {})
    .filter(([, value]) => Number(value || 0) === 0)
    .slice(0, 2)
    .map(([key]) => key);

  const topStatus = rankCounts(summary?.overallStatusCounts, 1)[0] || null;
  const strongestChapter = rankCounts(summary?.chapterPriorityCounts, 1).reverse()[0] || null;

  return {
    strongestCategories,
    dominantStatus: topStatus ? `${topStatus[0]} (${topStatus[1]})` : null,
    strongestChapter: strongestChapter ? strongestChapter[0] : null,
  };
}

function buildInterventionStudents(students) {
  function pickWeakestCategory(student) {
    const ranked = Array.isArray(student?.latestExamAnalytics?.categoryPriority)
      ? student.latestExamAnalytics.categoryPriority
      : [];

    return (
      ranked.find((item) => item?.is_high_risk && item?.level !== "Strong") ||
      ranked.find((item) => item?.level === "Weak" || item?.level === "Developing") ||
      ranked.find((item) => item?.level !== "Strong") ||
      ranked[0] ||
      null
    );
  }

  function pickWeakestChapter(student) {
    const chapters = Array.isArray(student?.latestExamAnalytics?.chapterGuidance)
      ? student.latestExamAnalytics.chapterGuidance
      : [];

    return chapters[0] || null;
  }

  function deriveInterventionSignal(student) {
    const completedAttempts = Number(student?.exams?.completedAttempts || 0);
    const averageScore = Number(student?.exams?.averageScore);
    const latestStatus = student?.latestExamAnalytics?.overallStatus || "";

    if (completedAttempts <= 0) {
      return null;
    }

    if (Number.isFinite(averageScore) && averageScore < 70) {
      return {
        priority: "high",
        label: "High Risk",
        reason:
          completedAttempts > 1
            ? `Average exam score is ${averageScore}%, which is still in the high-risk range across multiple exams.`
            : `The current exam signal is very low at ${averageScore}%, and this student needs a close follow-up.`,
      };
    }

    if (
      latestStatus === "High Risk" &&
      (!Number.isFinite(averageScore) || averageScore < 80 || completedAttempts === 1)
    ) {
      return {
        priority: "high",
        label: "High Risk",
        reason:
          completedAttempts === 1
            ? "Only one scored exam is on record, and it is currently showing a high-risk signal."
            : `The latest exam is high risk and the average score is only ${averageScore}%.`,
      };
    }

    if (Number.isFinite(averageScore) && averageScore >= 70 && averageScore < 80) {
      return {
        priority: "moderate",
        label: "Borderline",
        reason: `Average exam score is ${averageScore}%, which still needs support before it feels stable.`,
      };
    }

    if (latestStatus === "Borderline" && (!Number.isFinite(averageScore) || averageScore < 85)) {
      return {
        priority: "moderate",
        label: "Borderline",
        reason:
          completedAttempts === 1
            ? "The first scored exam is already showing a borderline signal."
            : "The latest exam is still borderline, so this student is worth watching even if the overall trend is mixed.",
      };
    }

    return null;
  }

  return (students || [])
    .map((student) => {
      const status = student?.latestExamAnalytics?.overallStatus || "No current signal";
      const weakestCategory = pickWeakestCategory(student);
      const weakestChapter = pickWeakestChapter(student);
      const signal = deriveInterventionSignal(student);

      return {
        id: student?.user?.id || student?.user?.email || "",
        name: student?.user?.full_name || student?.user?.email || student?.user?.id,
        status: signal?.label || status,
        averageScore: student?.exams?.averageScore,
        completedAttempts: student?.exams?.completedAttempts ?? 0,
        weakestCategory: weakestCategory?.category_id || null,
        weakestChapter: weakestChapter?.chapter_id ? `Chapter ${weakestChapter.chapter_id}` : null,
        priority: signal?.priority || null,
        reason: signal?.reason || "",
      };
    })
    .filter((student) => student.priority === "high" || student.priority === "moderate")
    .sort((a, b) => {
      const priorityA = a.priority === "high" ? 0 : 1;
      const priorityB = b.priority === "high" ? 0 : 1;
      if (priorityA !== priorityB) return priorityA - priorityB;
      const scoreA = Number.isFinite(a.averageScore) ? a.averageScore : -1;
      const scoreB = Number.isFinite(b.averageScore) ? b.averageScore : -1;
      return scoreA - scoreB;
    })
    .slice(0, 6);
}

function buildWeaknessMap(summary) {
  const categoryCounts = summary?.categoryWeaknessCounts || {};
  const highRiskCounts = summary?.highRiskCategoryCounts || {};
  const chapterCounts = summary?.chapterPriorityCounts || {};

  const categoryNames = Array.from(
    new Set([...Object.keys(categoryCounts), ...Object.keys(highRiskCounts)])
  ).sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }));

  const chapterNames = Object.keys(chapterCounts).sort((a, b) =>
    a.localeCompare(b, undefined, { sensitivity: "base" })
  );

  return {
    categories: categoryNames.map((name) => ({
      name,
      weakCount: Number(categoryCounts[name] || 0),
      highRiskCount: Number(highRiskCounts[name] || 0),
    })),
    chapters: chapterNames.map((name) => ({
      name,
      weakCount: Number(chapterCounts[name] || 0),
    })),
  };
}

function buildStudentStrengths(summary) {
  const strongestCategories = summary?.learningSignals?.strongestCategories || [];
  const bestScore = summary?.exams?.bestScore;
  const completedPractice = summary?.practice?.completedSessions ?? 0;
  const completedRemediation = summary?.remediation?.completedSessions ?? 0;

  return {
    strongestCategories,
    bestScore,
    completedPractice,
    completedRemediation,
  };
}

function buildStudentWeaknesses(summary) {
  const categoriesNeedingWork = summary?.learningSignals?.categoriesNeedingWork || [];
  const highRiskCategories = summary?.learningSignals?.highRiskCategories || [];
  const chapterPriorities = summary?.learningSignals?.chapterPriorities || [];

  return {
    categoriesNeedingWork,
    highRiskCategories,
    chapterPriorities,
  };
}

function buildStudentNextActions(summary) {
  const actions = [];
  const overallStatus = summary?.learningSignals?.overallStatus || "";
  const topWeak = summary?.learningSignals?.categoriesNeedingWork?.[0] || null;
  const topHighRisk = summary?.learningSignals?.highRiskCategories?.[0] || null;
  const topChapter = summary?.learningSignals?.chapterPriorities?.[0] || null;

  if (topHighRisk?.category) {
    actions.push(`Start with ${topHighRisk.category}. It is showing the clearest high-risk signal right now.`);
  } else if (topWeak?.category) {
    actions.push(`Review ${topWeak.category} first before moving on to stronger areas.`);
  }

  if (topChapter?.chapterId) {
    actions.push(`Give extra attention to Chapter ${topChapter.chapterId}. It is the clearest chapter-level priority.`);
  }

  if (overallStatus === "High Risk") {
    actions.push("Stay with shorter practice and remediation cycles until readiness becomes more stable.");
  } else if (overallStatus === "Borderline") {
    actions.push("Keep building consistency with another full exam after focused review.");
  } else if (overallStatus === "On Track") {
    actions.push("Keep momentum with full exams and targeted review only where weak signals still appear.");
  }

  if (!actions.length) {
    actions.push("Build more activity through practice, exams, or remediation so the report can surface clearer next steps.");
  }

  return actions.slice(0, 4);
}

function buildStudentProgress(summary) {
  const examAverage = summary?.exams?.averageScore;
  const bestScore = summary?.exams?.bestScore;
  const completedAttempts = summary?.exams?.completedAttempts ?? 0;
  const totalPractice = summary?.practice?.totalSessions ?? 0;
  const totalRemediation = summary?.remediation?.totalSessions ?? 0;
  const totalExposure = summary?.questionHistory?.totalExposureRows ?? 0;

  return {
    examAverage,
    bestScore,
    completedAttempts,
    totalPractice,
    totalRemediation,
    totalExposure,
  };
}

function deriveSchoolStatus(summary) {
  const counts = summary?.overallStatusCounts || {};
  const onTrack = Number(counts["On Track"] || 0);
  const borderline = Number(counts["Borderline"] || 0);
  const highRisk = Number(counts["High Risk"] || 0);

  if (highRisk > 0) {
    return highRisk >= Math.max(1, onTrack) ? "Intervention Needed" : "Mixed";
  }
  if (borderline > 0) {
    return "Mixed";
  }
  if (onTrack > 0) {
    return "Stable";
  }
  return "Early signals only";
}

function buildSchoolNextActions(summary, classes) {
  const actions = [];
  const topWeakCategories = rankCounts(summary?.categoryWeaknessCounts, 2);
  const topWeakChapters = rankCounts(summary?.chapterPriorityCounts, 2);
  const supportClasses = (classes || [])
    .filter((item) => {
      const counts = item?.aggregate?.overallStatusCounts || {};
      return Number(counts["High Risk"] || 0) > 0 || Number(counts["Borderline"] || 0) > 0;
    })
    .slice(0, 2);

  if (topWeakCategories[0]) {
    actions.push(`Coordinate support around ${topWeakCategories[0][0]} across the school first.`);
  }
  if (topWeakChapters[0]) {
    actions.push(`Review ${topWeakChapters[0][0]} as the clearest school-wide chapter priority.`);
  }
  if (supportClasses.length) {
    actions.push(`Check in with ${supportClasses.map((item) => item.name).join(" and ")} first. These classes are showing the strongest support signal.`);
  }

  if (!actions.length) {
    actions.push("Keep building school activity so the report can surface clearer cross-class patterns.");
  }

  return actions.slice(0, 4);
}

function buildSchoolStrengths(summary, classes) {
  const strongestCategories = Object.entries(summary?.categoryWeaknessCounts || {})
    .filter(([, value]) => Number(value || 0) === 0)
    .slice(0, 3)
    .map(([key]) => key);

  const topReadiness = rankCounts(summary?.overallStatusCounts, 1)[0] || null;
  const strongestClasses = (classes || [])
    .filter((item) => Number.isFinite(item?.aggregate?.classAverageScore))
    .sort((a, b) => Number(b.aggregate?.classAverageScore || 0) - Number(a.aggregate?.classAverageScore || 0))
    .slice(0, 2)
    .map((item) => item.name);

  return {
    strongestCategories,
    topReadiness: topReadiness ? `${topReadiness[0]} (${topReadiness[1]})` : null,
    strongestClasses,
  };
}

export default function OwnerReportsClient() {
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope") || "class";
  const schoolId = searchParams.get("school_id") || "";
  const schoolName = searchParams.get("school_name") || "";
  const classGroupId = searchParams.get("class_group_id") || "";
  const userId = searchParams.get("user_id") || "";
  const lang = searchParams.get("lang") || "en";
  const from = searchParams.get("from") || "";
  const studentId = searchParams.get("student_id") || "";
  const className = searchParams.get("class_name") || "";
  const hasTarget = scope === "student" ? !!userId : scope === "school" ? !!schoolId : !!classGroupId;
  const schoolBackQuery = new URLSearchParams(
    Object.fromEntries(
      [
        ["school_id", schoolId],
        ["class_group_id", classGroupId],
        ["class_name", className],
        ["open", from === "schools-roster" ? "roster" : ""],
      ].filter(([, value]) => value)
    )
  ).toString();
  const backHref =
    from === "independent"
      ? `/owner/independent${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ""}`
      : from === "class-report"
        ? `/owner/reports?scope=class&class_group_id=${encodeURIComponent(
            classGroupId
          )}&school_id=${encodeURIComponent(schoolId)}&class_name=${encodeURIComponent(
            className
          )}&lang=${encodeURIComponent(lang)}&from=schools`
      : from === "schools"
        ? `/owner/schools${schoolBackQuery ? `?${schoolBackQuery}` : ""}`
        : from === "schools-roster"
          ? `/owner/schools${schoolBackQuery ? `?${schoolBackQuery}` : ""}`
        : "/owner";
  const backLabel =
    from === "independent"
      ? "Back"
      : from === "schools"
        ? "Back"
        : from === "schools-roster"
          ? "Back"
          : from === "class-report"
            ? "Back"
        : "Return";

  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [strengthsOpen, setStrengthsOpen] = useState(false);
  const [studentActivityOpen, setStudentActivityOpen] = useState(false);
  const [schoolClassesOpen, setSchoolClassesOpen] = useState(false);
  const [interventionOpenById, setInterventionOpenById] = useState({});
  const [isNarrow, setIsNarrow] = useState(false);
  const [studentReportView, setStudentReportView] = useState("exam");
  const [selectedExamAttemptId, setSelectedExamAttemptId] = useState(null);

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
    if (!hasTarget) {
      setLoading(false);
      setError("");
      setReport(null);
      return undefined;
    }

    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");
      try {
        const payload =
          scope === "student"
            ? await fetchOwnerStudentOverviewReport(userId, lang)
            : scope === "school"
              ? await fetchOwnerSchoolOverviewReport(schoolId, lang)
              : await fetchOwnerClassOverviewReport(classGroupId, lang);

        if (!cancelled) {
          setReport(payload);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load report.");
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
  }, [scope, schoolId, classGroupId, hasTarget, userId, lang]);

  useEffect(() => {
    if (!loading) {
      setShowLoadingNotice(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowLoadingNotice(true), 350);
    return () => window.clearTimeout(timer);
  }, [loading]);

  useEffect(() => {
    const history = Array.isArray(report?.summary?.examHistory) ? report.summary.examHistory : [];
    setSelectedExamAttemptId(history[0]?.attemptId || null);
  }, [report]);

  const classSummary = report?.summary?.aggregate || null;
  const students = report?.summary?.students || [];
  const schoolSummary = report?.summary?.aggregate || null;
  const schoolClasses = report?.summary?.classes || [];
  const studentSummary = report?.summary || null;
  const studentName =
    report?.user?.appUser?.full_name || report?.user?.appUser?.email || report?.user?.id || "";
  const classStatus = deriveClassStatus(classSummary);
  const topWeakCategories = rankCounts(classSummary?.categoryWeaknessCounts, 3);
  const topHighRiskCategories = rankCounts(classSummary?.highRiskCategoryCounts, 3);
  const topWeakChapters = rankCounts(classSummary?.chapterPriorityCounts, 2);
  const classStrengths = buildClassStrengths(classSummary);
  const interventionStudents = buildInterventionStudents(students);
  const weaknessMap = buildWeaknessMap(classSummary);
  const nextActions = buildClassNextActions(classSummary, students);
  const schoolStatus = deriveSchoolStatus(schoolSummary);
  const schoolNextActions = buildSchoolNextActions(schoolSummary, schoolClasses);
  const schoolStrengths = buildSchoolStrengths(schoolSummary, schoolClasses);
  const schoolWeakCategories = rankCounts(schoolSummary?.categoryWeaknessCounts, 3);
  const schoolHighRiskCategories = rankCounts(schoolSummary?.highRiskCategoryCounts, 3);
  const schoolWeakChapters = rankCounts(schoolSummary?.chapterPriorityCounts, 3);
  const supportClasses = schoolClasses
    .map((item) => {
      const counts = item?.aggregate?.overallStatusCounts || {};
      return {
        ...item,
        highRiskCount: Number(counts["High Risk"] || 0),
        borderlineCount: Number(counts["Borderline"] || 0),
      };
    })
    .sort((a, b) => {
      const riskA = a.highRiskCount + a.borderlineCount;
      const riskB = b.highRiskCount + b.borderlineCount;
      if (riskB !== riskA) return riskB - riskA;
      return (a.name || "").localeCompare(b.name || "", undefined, { sensitivity: "base" });
    });
  const reportTitle =
    !hasTarget ? "Reports" : scope === "student" ? "Student Report" : scope === "school" ? "School Report" : "Class Report";
  const reportSubject = !hasTarget ? "" : scope === "student" ? studentName : scope === "school" ? schoolName : className;
  const studentStrengths = buildStudentStrengths(studentSummary);
  const studentWeaknesses = buildStudentWeaknesses(studentSummary);
  const studentNextActions = buildStudentNextActions(studentSummary);
  const studentProgress = buildStudentProgress(studentSummary);
  const studentPracticeDiagnostics = studentSummary?.practiceDiagnostics || {};
  const studentChapterPractice = studentPracticeDiagnostics.chapter || {};
  const studentCategoryPractice = studentPracticeDiagnostics.category || {};
  const studentPracticeModeCounts = studentSummary?.practiceFocus?.modeCounts || {};
  const studentHasCompletedExam = Number(studentSummary?.exams?.completedAttempts || 0) > 0;
  const studentExamQuestionsSeen = Number(studentSummary?.questionHistory?.bySourceType?.exam || 0);
  const studentPracticeQuestionsSeen = Number(studentSummary?.questionHistory?.bySourceType?.practice || 0);
  const studentExamHistory = Array.isArray(studentSummary?.examHistory) ? studentSummary.examHistory : [];
  const studentLatestExamResults = studentSummary?.latestExamResults || null;
  const selectedExamResults =
    studentExamHistory.find((attempt) => String(attempt?.attemptId) === String(selectedExamAttemptId)) ||
    studentLatestExamResults ||
    null;
  const studentPracticeChapterEntries = Array.isArray(studentChapterPractice?.entries) ? studentChapterPractice.entries : [];
  const studentPracticeCategoryEntries = Array.isArray(studentCategoryPractice?.entries) ? studentCategoryPractice.entries : [];
  const studentStrongestPracticeChapter = studentChapterPractice?.strongest || null;
  const studentStrongestPracticeCategory =
    Number.isFinite(Number(studentCategoryPractice?.strongest?.percent)) && Number(studentCategoryPractice.strongest.percent) >= 80
      ? studentCategoryPractice.strongest
      : null;
  const studentPracticeNextSteps = [];

  if (Number(studentPracticeModeCounts?.chapter || 0) > 0) {
    if (studentChapterPractice?.weakest?.label != null) {
      studentPracticeNextSteps.push(
        `Keep working chapter practice around Chapter ${studentChapterPractice.weakest.label} until results become more consistent.`
      );
    } else {
      studentPracticeNextSteps.push("Keep using chapter practice so this report can build a clearer chapter signal.");
    }
  }
  if (Number(studentPracticeModeCounts?.category || 0) > 0) {
    if (studentCategoryPractice?.weakest?.label) {
      studentPracticeNextSteps.push(`Use category practice to reinforce ${studentCategoryPractice.weakest.label} before moving on.`);
    } else {
      studentPracticeNextSteps.push("Keep using category practice so this report can show a clearer category pattern.");
    }
  }
  if (Number(studentPracticeModeCounts?.mixed || 0) > 0 && !Number(studentPracticeModeCounts?.chapter || 0) && !Number(studentPracticeModeCounts?.category || 0)) {
    studentPracticeNextSteps.push(
      "Mixed practice is helping with exposure. Add one chapter or category session next so the report can give more targeted guidance."
    );
  }
  if (!studentPracticeNextSteps.length) {
    studentPracticeNextSteps.push("Start with chapter or category practice so the report can show clearer strengths and review areas.");
  }

  const studentExamCategorySections = [
    {
      key: "strong",
      title: "Strong",
      tone: { border: "#bddfc6", bg: "#f7fff9", title: "#1f6f3d" },
      items: studentStrengths.strongestCategories,
      empty: "No clear strength yet",
    },
    {
      key: "watch",
      title: "Watch",
      tone: { border: "#eadba6", bg: "#fffdf5", title: "#7a5a00" },
      items: studentWeaknesses.categoriesNeedingWork.map((item) => `${item.category}${item.level ? ` (${item.level})` : ""}`),
      empty: "Nothing repeating yet",
    },
    {
      key: "risk",
      title: "High Risk",
      tone: { border: "#efc2c2", bg: "#fff8f8", title: "var(--brand-red)" },
      items: studentWeaknesses.highRiskCategories.map((item) => `${item.category}${item.level ? ` (${item.level})` : ""}`),
      empty: "No high-risk signal now",
    },
  ];

  const studentPracticeChapterSections = [
    {
      key: "strong",
      title: "Strong",
      tone: { border: "#bddfc6", bg: "#f7fff9", title: "#1f6f3d" },
      items: studentPracticeChapterEntries
        .filter((item) => Number(item?.percent) >= 80)
        .map((item) => `Chapter ${item.label} (${item.percent}%)`),
      empty: "Not enough strong chapter information yet",
    },
    {
      key: "watch",
      title: "Watch",
      tone: { border: "#eadba6", bg: "#fffdf5", title: "#7a5a00" },
      items: studentPracticeChapterEntries
        .filter((item) => Number(item?.percent) >= 60 && Number(item?.percent) < 80)
        .map((item) => `Chapter ${item.label} (${item.percent}%)`),
      empty: "Not enough chapter information yet",
    },
    {
      key: "risk",
      title: "High Risk",
      tone: { border: "#efc2c2", bg: "#fff8f8", title: "var(--brand-red)" },
      items: studentPracticeChapterEntries
        .filter((item) => Number(item?.percent) < 60)
        .map((item) => `Chapter ${item.label} (${item.percent}%)`),
      empty: "Not enough high-risk chapter information yet",
    },
  ];

  const studentPracticeCategorySections = [
    {
      key: "strong",
      title: "Strong",
      tone: { border: "#bddfc6", bg: "#f7fff9", title: "#1f6f3d" },
      items: studentPracticeCategoryEntries
        .filter((item) => Number(item?.percent) >= 80)
        .map((item) => `${item.label} (${item.percent}%)`),
      empty: "Not enough strong category information yet",
    },
    {
      key: "watch",
      title: "Watch",
      tone: { border: "#eadba6", bg: "#fffdf5", title: "#7a5a00" },
      items: studentPracticeCategoryEntries
        .filter((item) => Number(item?.percent) >= 60 && Number(item?.percent) < 80)
        .map((item) => `${item.label} (${item.percent}%)`),
      empty: "Not enough category information yet",
    },
    {
      key: "risk",
      title: "High Risk",
      tone: { border: "#efc2c2", bg: "#fff8f8", title: "var(--brand-red)" },
      items: studentPracticeCategoryEntries
        .filter((item) => Number(item?.percent) < 60)
        .map((item) => `${item.label} (${item.percent}%)`),
      empty: "Not enough high-risk category information yet",
    },
  ];

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={title}>{reportTitle}</div>
            {reportSubject ? <div style={subjectTitle}>{reportSubject}</div> : null}
            <div style={subText}>
              {!hasTarget
                ? "Choose a school, class, or student from the management lanes first, then open the matching report from there."
                : scope === "student"
                  ? "See current readiness, strengths, weak areas, and what to do next."
                  : scope === "school"
                    ? "See school readiness, classes needing support, and shared cross-class patterns."
                    : "See class readiness, student support needs, and shared performance patterns."}
            </div>
          </div>
          <Link href={backHref} style={buttonSecondary}>
            {backLabel}
          </Link>
        </div>

        <div style={body}>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading report...</InlineMessage> : null}

          {!loading && !error && !hasTarget ? (
            <div style={listCard}>
              <div style={{ fontWeight: 800, color: "var(--heading)" }}>How to open a report</div>
              <div style={subText}>From `Manage Schools`, open a class and choose `View class report`.</div>
              <div style={subText}>From `Manage Schools` or `Independent Students`, choose `View student report` for the person you want to review.</div>
            </div>
          ) : null}

          {!loading && !error && hasTarget && scope === "class" && classSummary ? (
            <>
              <div style={listCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Status summary</div>
                <div style={subText}>
                  {classStatus} | {classSummary.activeStudents ?? 0} of {classSummary.totalStudents ?? 0} students are showing recent activity.
                </div>
                <div style={subText}>
                  Class average: {formatPercent(classSummary.classAverageScore)} | Full exam attempts: {classSummary.totalExamAttempts ?? 0} | Practice sessions:{" "}
                  {classSummary.totalPracticeSessions ?? 0}
                </div>
              </div>
              <div style={analysisGrid}>
                <div style={listCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Priority weaknesses</div>
                  <div style={subText}>
                    Top weak categories:{" "}
                    {topWeakCategories.length
                      ? topWeakCategories.map(([key, value]) => `${key} (${value})`).join(" | ")
                      : "No consistent weak categories yet"}
                  </div>
                  <div style={subText}>
                    High-risk categories:{" "}
                    {topHighRiskCategories.length
                      ? topHighRiskCategories.map(([key, value]) => `${key} (${value})`).join(" | ")
                      : "No current high-risk concentration"}
                  </div>
                  <div style={subText}>
                    Priority chapters:{" "}
                    {topWeakChapters.length
                      ? topWeakChapters.map(([key, value]) => `${key} (${value})`).join(" | ")
                      : "No chapter priority yet"}
                  </div>
                </div>

                <div style={listCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Student intervention list</div>
                  <div style={subText}>Use this to see who needs help now and what issue is most visible for each student.</div>
                  {interventionStudents.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {interventionStudents.map((student) => (
                        <details
                          key={student.id}
                          style={{ ...listCard, background: "white", padding: 7 }}
                          open={Boolean(interventionOpenById[student.id])}
                        >
                          <summary
                            style={{ cursor: "pointer", listStyle: "none" }}
                            onClick={(e) => {
                              e.preventDefault();
                              setInterventionOpenById((prev) => ({
                                ...prev,
                                [student.id]: !prev[student.id],
                              }));
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                              <div style={{ fontWeight: 800, color: "var(--heading)" }}>{student.name}</div>
                              <OpenHint isOpen={Boolean(interventionOpenById[student.id])} />
                            </div>
                            <div style={{ ...subText, marginTop: 4, marginBottom: 0 }}>{student.status}</div>
                          </summary>
                          <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                            <div style={subText}>
                              Avg exam: {formatPercent(student.averageScore)} | Weakest category:{" "}
                              {student.weakestCategory || "No clear category yet"}
                            </div>
                            <div style={subText}>
                              Completed exams: {student.completedAttempts ?? 0} | Weakest chapter: {student.weakestChapter || "No clear chapter yet"}
                            </div>
                            <div style={subText}>{student.reason}</div>
                            <div>
                              <Link
                                href={`/owner/reports?scope=student&user_id=${encodeURIComponent(
                                  student.id
                                )}&lang=${encodeURIComponent(lang)}&from=${encodeURIComponent(
                                  "class-report"
                                )}&school_id=${encodeURIComponent(schoolId)}&class_group_id=${encodeURIComponent(
                                  classGroupId
                                )}&class_name=${encodeURIComponent(className)}`}
                                style={buttonSecondary}
                              >
                                View student report
                              </Link>
                            </div>
                          </div>
                        </details>
                      ))}
                    </div>
                  ) : (
                    <div style={subText}>No students are currently flagged as borderline or high risk.</div>
                  )}
                </div>

              </div>

              <div style={analysisGrid}>
                <div style={listCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Performance breakdown</div>
                  <div style={subText}>
                    Exams: {classSummary.totalExamAttempts ?? 0} | Practice sessions: {classSummary.totalPracticeSessions ?? 0} | Remediation sessions:{" "}
                    {classSummary.totalRemediationSessions ?? 0}
                  </div>
                  <div style={subText}>
                    Readiness mix: {Object.entries(classSummary.overallStatusCounts || {})
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" | ") || "No readiness mix yet"}
                  </div>
                </div>

                <div style={listCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Progress over time</div>
                  <div style={subText}>
                    Trend detail is still light in the current payload, so this first version is showing whether class activity is building enough to support stronger readiness signals.
                  </div>
                  <div style={subText}>
                    Active students: {classSummary.activeStudents ?? 0} | Recent full exam attempts: {classSummary.totalExamAttempts ?? 0} | Practice volume:{" "}
                    {classSummary.totalPracticeSessions ?? 0}
                  </div>
                  <div style={subText}>
                    Remediation volume: {classSummary.totalRemediationSessions ?? 0} | Readiness mix:{" "}
                    {Object.entries(classSummary.overallStatusCounts || {})
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" | ") || "No readiness mix yet"}
                  </div>
                </div>
              </div>

              <details style={listCard} open={strengthsOpen}>
                <summary
                  style={detailsSummary}
                  onClick={(e) => {
                    e.preventDefault();
                    setStrengthsOpen((prev) => !prev);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Class strengths</div>
                    <OpenHint isOpen={strengthsOpen} />
                  </div>
                  <div style={subText}>Open to see what this class is doing well so the report stays balanced.</div>
                </summary>
                <div style={{ display: "grid", gap: 6, marginTop: 10 }}>
                  <div style={subText}>
                    Strongest categories:{" "}
                    {classStrengths.strongestCategories.length
                      ? classStrengths.strongestCategories.join(" | ")
                      : "We need more class data before naming a strong category."}
                  </div>
                  <div style={subText}>
                    Dominant readiness status: {classStrengths.dominantStatus || "No clear readiness pattern yet"}
                  </div>
                  <div style={subText}>
                    Strongest chapter signal: {classStrengths.strongestChapter || "Not clear yet"}
                  </div>
                </div>
              </details>

              <div style={listCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Class weakness map</div>
                <div style={subText}>
                  This first pass surfaces where weakness is concentrating across the class. Later this can become a fuller visual heatmap.
                </div>
                <div style={{ display: "grid", gap: 10 }}>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--heading)", fontSize: 13 }}>Categories</div>
                    <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                      {weaknessMap.categories.length ? (
                        weaknessMap.categories.map((item) => (
                          <div key={item.name} style={subText}>
                            {item.name}: weak {item.weakCount}
                            {item.highRiskCount ? ` | high risk ${item.highRiskCount}` : ""}
                          </div>
                        ))
                      ) : (
                        <div style={subText}>No repeated class-wide category weakness yet.</div>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, color: "var(--heading)", fontSize: 13 }}>Chapters</div>
                    <div style={{ display: "grid", gap: 6, marginTop: 6 }}>
                      {weaknessMap.chapters.length ? (
                        weaknessMap.chapters.map((item) => (
                          <div key={item.name} style={subText}>
                            {item.name}: flagged {item.weakCount}
                          </div>
                        ))
                      ) : (
                        <div style={subText}>No repeated chapter priority yet.</div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div style={listCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Next action</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {nextActions.map((item) => (
                    <div key={item} className="owner-report-next-action" style={subText}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {!loading && !error && hasTarget && scope === "school" && schoolSummary ? (
            <>
              <div style={listCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Status summary</div>
                <div style={subText}>
                  {schoolStatus} | {schoolSummary.activeClasses ?? 0} of {schoolSummary.totalClasses ?? 0} classes are showing recent activity.
                </div>
                <div style={subText}>
                  School average: {formatPercent(schoolSummary.schoolAverageScore)} | Students: {schoolSummary.activeStudents ?? 0} of{" "}
                  {schoolSummary.totalStudents ?? 0} active | Full exam attempts: {schoolSummary.totalExamAttempts ?? 0}
                </div>
                <div style={subText}>
                  Practice sessions: {schoolSummary.totalPracticeSessions ?? 0} | Remediation sessions:{" "}
                  {schoolSummary.totalRemediationSessions ?? 0}
                </div>
              </div>

              <div style={analysisGrid}>
                <div style={listCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Classes needing support</div>
                  <div style={subText}>
                    Use this to see where attention is likely needed first across the school.
                  </div>
                  {supportClasses.length ? (
                    <div style={{ display: "grid", gap: 10 }}>
                      {supportClasses.slice(0, 5).map((item) => (
                        <div key={item.id} style={{ ...listCard, background: "white", padding: 12 }}>
                          <div style={{ fontWeight: 800, color: "var(--heading)" }}>{item.name}</div>
                          <div style={subText}>
                            Students: {item.aggregate?.totalStudents ?? 0} | Active: {item.aggregate?.activeStudents ?? 0} | Class average:{" "}
                            {formatPercent(item.aggregate?.classAverageScore)}
                          </div>
                          <div style={subText}>
                            High risk: {item.highRiskCount} | Borderline: {item.borderlineCount}
                          </div>
                          <div>
                            <Link
                              href={`/owner/reports?scope=class&class_group_id=${encodeURIComponent(
                                item.id
                              )}&school_id=${encodeURIComponent(schoolId)}&school_name=${encodeURIComponent(
                                schoolName
                              )}&class_name=${encodeURIComponent(item.name || "")}&lang=${encodeURIComponent(
                                lang
                              )}&from=schools`}
                              style={buttonSecondary}
                            >
                              Class report
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div style={subText}>No classes are currently showing stronger support signals.</div>
                  )}
                </div>

                <div style={listCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Priority weaknesses</div>
                  <div style={subText}>
                    Top weak categories:{" "}
                    {schoolWeakCategories.length
                      ? schoolWeakCategories.map(([key, value]) => `${key} (${value})`).join(" | ")
                      : "No repeated weak categories yet"}
                  </div>
                  <div style={subText}>
                    High-risk categories:{" "}
                    {schoolHighRiskCategories.length
                      ? schoolHighRiskCategories.map(([key, value]) => `${key} (${value})`).join(" | ")
                      : "No current high-risk concentration"}
                  </div>
                  <div style={subText}>
                    Priority chapters:{" "}
                    {schoolWeakChapters.length
                      ? schoolWeakChapters.map(([key, value]) => `${key} (${value})`).join(" | ")
                      : "No clear chapter priority yet"}
                  </div>
                </div>
              </div>

              <div style={analysisGrid}>
                <div style={listCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Performance breakdown</div>
                  <div style={subText}>
                    Classes: {schoolSummary.totalClasses ?? 0} | Students: {schoolSummary.totalStudents ?? 0}
                  </div>
                  <div style={subText}>
                    Readiness mix: {Object.entries(schoolSummary.overallStatusCounts || {})
                      .map(([key, value]) => `${key}: ${value}`)
                      .join(" | ") || "No readiness mix yet"}
                  </div>
                  <div style={subText}>
                    Practice: {schoolSummary.totalPracticeSessions ?? 0} | Remediation: {schoolSummary.totalRemediationSessions ?? 0}
                  </div>
                </div>

                <div style={listCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Progress over time</div>
                  <div style={subText}>
                    This first pass is reading whether school activity is broad enough to support stronger cross-class signals.
                  </div>
                  <div style={subText}>
                    Active classes: {schoolSummary.activeClasses ?? 0} | Active students: {schoolSummary.activeStudents ?? 0}
                  </div>
                  <div style={subText}>
                    Full exam attempts: {schoolSummary.totalExamAttempts ?? 0} | School average: {formatPercent(schoolSummary.schoolAverageScore)}
                  </div>
                </div>
              </div>

              <div style={listCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Strengths</div>
                <div style={subText}>
                  Strongest categories:{" "}
                  {schoolStrengths.strongestCategories.length
                    ? schoolStrengths.strongestCategories.join(" | ")
                    : "We need more school-wide data before naming clear strong categories."}
                </div>
                <div style={subText}>
                  Dominant readiness pattern: {schoolStrengths.topReadiness || "No clear readiness pattern yet"}
                </div>
                <div style={subText}>
                  Strongest classes:{" "}
                  {schoolStrengths.strongestClasses.length
                    ? schoolStrengths.strongestClasses.join(" | ")
                    : "No clear leading class yet"}
                </div>
              </div>

              <details style={listCard} open={schoolClassesOpen}>
                <summary
                  style={detailsSummary}
                  onClick={(e) => {
                    e.preventDefault();
                    setSchoolClassesOpen((prev) => !prev);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Class list</div>
                    <OpenHint isOpen={schoolClassesOpen} />
                  </div>
                  <div style={subText}>Open to review every class in this school and jump into class reports.</div>
                </summary>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {schoolClasses.map((item) => (
                    <div key={item.id} style={{ ...listCard, background: "white", padding: 12 }}>
                      <div style={{ fontWeight: 800, color: "var(--heading)" }}>{item.name}</div>
                      <div style={subText}>
                        Students: {item.aggregate?.totalStudents ?? 0} | Active: {item.aggregate?.activeStudents ?? 0} | Average:{" "}
                        {formatPercent(item.aggregate?.classAverageScore)}
                      </div>
                      <div style={subText}>
                        Exams: {item.aggregate?.totalExamAttempts ?? 0} | Practice: {item.aggregate?.totalPracticeSessions ?? 0} |
                        {" "}Remediation: {item.aggregate?.totalRemediationSessions ?? 0}
                      </div>
                      <div>
                        <Link
                          href={`/owner/reports?scope=class&class_group_id=${encodeURIComponent(
                            item.id
                          )}&school_id=${encodeURIComponent(schoolId)}&school_name=${encodeURIComponent(
                            schoolName
                          )}&class_name=${encodeURIComponent(item.name || "")}&lang=${encodeURIComponent(
                            lang
                          )}&from=schools`}
                          style={buttonSecondary}
                        >
                          Class report
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

              <div style={listCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Next action</div>
                <div style={{ display: "grid", gap: 6 }}>
                  {schoolNextActions.map((item) => (
                    <div key={item} style={subText}>
                      {item}
                    </div>
                  ))}
                </div>
              </div>
            </>
          ) : null}

          {!loading && !error && hasTarget && scope === "student" && studentSummary ? (
            <>
              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button
                  type="button"
                  style={{
                    ...buttonSecondary,
                    borderColor: studentReportView === "practice" ? "var(--brand-red)" : "#cfdde6",
                    background: studentReportView === "practice" ? "var(--brand-red-soft)" : "white",
                    color: studentReportView === "practice" ? "var(--brand-red)" : "#536779",
                  }}
                  onClick={() => setStudentReportView("practice")}
                >
                  Practice Progress
                </button>
                <button
                  type="button"
                  style={{
                    ...buttonSecondary,
                    borderColor: studentReportView === "exam" ? "var(--brand-red)" : "#cfdde6",
                    background: studentReportView === "exam" ? "var(--brand-red-soft)" : "white",
                    color: studentReportView === "exam" ? "var(--brand-red)" : "#536779",
                  }}
                  onClick={() => setStudentReportView("exam")}
                >
                  Exam Readiness
                </button>
              </div>

              {studentReportView === "practice" ? (
                <>
                  <div style={{ ...listCard, borderColor: "#d7e4ec", background: "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)" }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Practice progress</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: "#38556a" }}>
                      {studentSummary.practice?.completedSessions > 0 ? "Building steadily" : "Just getting started"}
                    </div>
                    <div style={subText}>
                      Completed practice: {studentSummary.practice?.completedSessions ?? 0} | All practice sessions:{" "}
                      {studentSummary.practice?.totalSessions ?? 0} | Questions seen: {studentPracticeQuestionsSeen}
                    </div>
                  </div>

                  <div style={analysisGrid}>
                    <div style={{ ...listCard, borderColor: "#bddfc6", background: "linear-gradient(180deg, #f7fff9 0%, #eef8f1 100%)" }}>
                      <div style={{ fontWeight: 800, color: "#476252" }}>Chapter work</div>
                      <div style={subText}>
                        Best current chapter:{" "}
                        {studentStrongestPracticeChapter?.label != null
                          ? `Chapter ${studentStrongestPracticeChapter.label}`
                          : studentChapterPractice?.entries?.length
                            ? "Not enough chapter information yet"
                            : "Not enough chapter information yet"}
                      </div>
                      <div style={subText}>
                        Chapter to review:{" "}
                        {studentChapterPractice?.weakest?.label != null ? `Chapter ${studentChapterPractice.weakest.label}` : "Not enough chapter information yet"}
                      </div>
                    </div>

                    <div style={{ ...listCard, borderColor: "#eadba6", background: "linear-gradient(180deg, #fffdf5 0%, #f8f3df 100%)" }}>
                      <div style={{ fontWeight: 800, color: "#6f6340" }}>Category work</div>
                      <div style={subText}>
                        Best current category:{" "}
                        {studentStrongestPracticeCategory?.label != null
                          ? studentStrongestPracticeCategory.label
                          : studentCategoryPractice?.entries?.length
                            ? "Not enough category information yet"
                            : "Not enough category information yet"}
                      </div>
                      <div style={subText}>
                        Category to review: {studentCategoryPractice?.weakest?.label || "Not enough category information yet"}
                      </div>
                    </div>
                  </div>

                  <div style={listCard}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>What to do next in practice</div>
                    <div style={{ display: "grid", gap: 6 }}>
                      {studentPracticeNextSteps.map((item) => (
                        <div key={item} style={subText}>
                          {item}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={listCard}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Practice chapter picture</div>
                    <div style={subText}>This view only reflects chapters practiced in chapter mode so far.</div>
                    <div style={analysisGrid}>
                      {studentPracticeChapterSections.map((section) => (
                        <div
                          key={`owner-practice-chapter-${section.key}`}
                          style={{ ...listCard, background: section.tone.bg, borderColor: section.tone.border, padding: 12 }}
                        >
                          <div style={{ fontWeight: 800, color: section.tone.title }}>{section.title}</div>
                          <div style={subText}>{section.items.length ? section.items.join(" | ") : section.empty}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={listCard}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Practice category picture</div>
                    <div style={subText}>This view only reflects categories practiced in category mode so far.</div>
                    <div style={analysisGrid}>
                      {studentPracticeCategorySections.map((section) => (
                        <div
                          key={`owner-practice-category-${section.key}`}
                          style={{ ...listCard, background: section.tone.bg, borderColor: section.tone.border, padding: 12 }}
                        >
                          <div style={{ fontWeight: 800, color: section.tone.title }}>{section.title}</div>
                          <div style={subText}>{section.items.length ? section.items.join(" | ") : section.empty}</div>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div
                    style={{
                      ...listCard,
                      borderColor: studentHasCompletedExam ? "#efc2c2" : "#d7e4ec",
                      background: studentHasCompletedExam
                        ? "linear-gradient(180deg, #fff8f8 0%, #fff0f0 100%)"
                        : "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)",
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>My readiness</div>
                    <div style={{ fontSize: 26, fontWeight: 800, color: studentHasCompletedExam ? "var(--brand-red)" : "#38556a" }}>
                      {studentHasCompletedExam ? studentSummary.learningSignals?.overallStatus || "No current signal" : "No exam signal yet"}
                    </div>
                    <div style={subText}>
                      Average exam: {formatPercent(studentSummary.exams?.averageScore)} | Completed exams:{" "}
                      {studentSummary.exams?.completedAttempts ?? 0} | Exam questions seen: {studentExamQuestionsSeen}
                    </div>
                    {!studentHasCompletedExam ? (
                      <div style={subText}>Exam readiness will become more detailed after the first completed exam.</div>
                    ) : null}
                  </div>

                  {studentHasCompletedExam ? (
                    <>
                      <div style={analysisGrid}>
                        <div style={{ ...listCard, borderColor: "#bddfc6", background: "linear-gradient(180deg, #f7fff9 0%, #eef8f1 100%)" }}>
                          <div style={{ fontWeight: 800, color: "#476252" }}>Strongest area</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#1f6f3d" }}>
                            {studentStrengths.strongestCategories[0] || "Still forming"}
                          </div>
                          <div style={subText}>Best exam: {formatPercent(studentStrengths.bestScore)}</div>
                        </div>

                        <div style={{ ...listCard, borderColor: "#efc2c2", background: "linear-gradient(180deg, #fff8f8 0%, #fff0f0 100%)" }}>
                          <div style={{ fontWeight: 800, color: "#6f4747" }}>Needs work now</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--brand-red)" }}>
                            {studentWeaknesses.highRiskCategories[0]?.category ||
                              studentWeaknesses.categoriesNeedingWork[0]?.category ||
                              "No clear weak area yet"}
                          </div>
                          <div style={subText}>
                            Priority chapter:{" "}
                            {studentWeaknesses.chapterPriorities[0]?.chapterId
                              ? `Chapter ${studentWeaknesses.chapterPriorities[0].chapterId}`
                              : "No data yet"}
                          </div>
                        </div>
                      </div>

                      <div style={listCard}>
                        <div style={{ fontWeight: 800, color: "var(--heading)" }}>What to do next</div>
                        <div style={{ display: "grid", gap: 6 }}>
                          {studentNextActions.slice(0, 3).map((item) => (
                            <div key={item} style={subText}>
                              {item}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div style={listCard}>
                        <div style={{ fontWeight: 800, color: "var(--heading)" }}>Your category picture</div>
                        <div style={subText}>This gives a fast read of what looks strong, what to watch, and what feels urgent.</div>
                        <div style={analysisGrid}>
                          {studentExamCategorySections.map((section) => (
                            <div
                              key={`owner-exam-${section.key}`}
                              style={{ ...listCard, background: section.tone.bg, borderColor: section.tone.border, padding: 12 }}
                            >
                              <div style={{ fontWeight: 800, color: section.tone.title }}>{section.title}</div>
                              <div style={subText}>{section.items.length ? section.items.join(" | ") : section.empty}</div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {selectedExamResults ? (
                        <div style={listCard}>
                          <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                            {studentExamHistory.length > 1 ? "Selected exam results" : "Latest exam results"}
                          </div>
                          {studentExamHistory.length > 1 ? (
                            <div style={{ display: "grid", gap: 8 }}>
                              <div style={subText}>Open any completed exam to swap the results panel below.</div>
                              <div
                                style={{
                                  display: "grid",
                                  gridTemplateColumns: isNarrow ? "1fr" : "repeat(auto-fit, minmax(180px, 1fr))",
                                  gap: 8,
                                }}
                              >
                                {studentExamHistory.map((attempt, index) => {
                                  const isSelected = String(attempt?.attemptId) === String(selectedExamResults?.attemptId);
                                  const scoreTone = getScoreTone(Number(attempt?.score));
                                  return (
                                    <button
                                      key={`owner-exam-history-${attempt?.attemptId || index}`}
                                      type="button"
                                      onClick={() => setSelectedExamAttemptId(attempt?.attemptId || null)}
                                      style={{
                                        textAlign: "left",
                                        borderRadius: 12,
                                        border: isSelected ? "1px solid #7aa7c7" : "1px solid #d6e1e8",
                                        background: isSelected ? "#eef6fb" : "white",
                                        padding: "10px 12px",
                                        cursor: "pointer",
                                        display: "grid",
                                        gap: 4,
                                      }}
                                    >
                                      <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 13 }}>
                                        {`Exam • ${formatDateTime(attempt?.completedAt)}`}
                                      </div>
                                      <div style={subText}>
                                        Score:{" "}
                                        <span
                                          style={{
                                            color: scoreTone.color,
                                            fontWeight: 800,
                                          }}
                                        >
                                          {formatPercent(attempt?.score)}
                                        </span>
                                      </div>
                                    </button>
                                  );
                                })}
                              </div>
                            </div>
                          ) : null}
                          <div style={subText}>
                            Completed: {formatDateTime(selectedExamResults.completedAt)} | Score:{" "}
                            <span
                              style={{
                                color: getScoreTone(Number(selectedExamResults.score)).color,
                                fontWeight: 800,
                              }}
                            >
                              {formatPercent(selectedExamResults.score)}
                            </span>
                            {" | "}Questions: {selectedExamResults.questionCount ?? 0}
                          </div>
                          <div style={subText}>
                            <span style={{ fontWeight: 800, color: "var(--heading)" }}>Weakest category:</span>{" "}
                            {selectedExamResults.weakestCategory?.category
                              ? formatCategoryLabel(selectedExamResults.weakestCategory.category)
                              : "No saved category information for this exam yet"}
                          </div>
                          <div style={subText}>
                            <span style={{ fontWeight: 800, color: "var(--heading)" }}>Weakest chapter:</span>{" "}
                            {selectedExamResults.weakestChapter?.chapterId
                              ? `Chapter ${selectedExamResults.weakestChapter.chapterId} (${selectedExamResults.weakestChapter.missedCount}/${selectedExamResults.weakestChapter.totalQuestions} missed)`
                              : "No chapter information yet"}
                          </div>
                          <div
                            style={{
                              display: "grid",
                              gridTemplateColumns: isNarrow ? "1fr" : "repeat(auto-fit, minmax(150px, 1fr))",
                              gap: 10,
                              marginTop: 4,
                            }}
                          >
                            {(selectedExamResults.chapterBreakdown || []).map((chapter) => (
                              <div
                                key={`owner-latest-exam-chapter-${chapter.chapterId}`}
                                style={{
                                  ...listCard,
                                  padding: 12,
                                  background:
                                    Number(chapter?.percent) < 60
                                      ? "#fff8f8"
                                      : Number(chapter?.percent) < 80
                                        ? "#fffdf5"
                                        : "#f7fff9",
                                  borderColor:
                                    Number(chapter?.percent) < 60
                                      ? "#efc2c2"
                                      : Number(chapter?.percent) < 80
                                        ? "#eadba6"
                                        : "#bddfc6",
                                }}
                              >
                                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Chapter {chapter.chapterId}</div>
                                <div style={subText}>Correct: {chapter.correctCount}/{chapter.totalQuestions}</div>
                                <div style={subText}>Missed: {chapter.missedCount}</div>
                                <div style={subText}>Score: {formatPercent(chapter.percent)}</div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}
                    </>
                  ) : (
                    <>
                      <div style={analysisGrid}>
                        <div style={{ ...listCard, borderColor: "#d7e4ec", background: "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)" }}>
                          <div style={{ fontWeight: 800, color: "#607282" }}>Strongest area</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#38556a" }}>No exam strength yet</div>
                          <div style={subText}>Complete one full exam to begin building this part of the report.</div>
                        </div>

                        <div style={{ ...listCard, borderColor: "#d7e4ec", background: "linear-gradient(180deg, #fbfdff 0%, #f3f8fb 100%)" }}>
                          <div style={{ fontWeight: 800, color: "#607282" }}>Needs work now</div>
                          <div style={{ fontSize: 20, fontWeight: 800, color: "#38556a" }}>No exam weak area yet</div>
                          <div style={subText}>Exam weak areas will appear after the first completed exam.</div>
                        </div>
                      </div>

                      <div style={listCard}>
                        <div style={{ fontWeight: 800, color: "var(--heading)" }}>What to do next</div>
                        <div style={subText}>Take the first full exam when ready so this section can show true readiness guidance.</div>
                      </div>

                      <div style={listCard}>
                        <div style={{ fontWeight: 800, color: "var(--heading)" }}>Your category picture</div>
                        <div style={subText}>The exam category picture will appear after the first completed exam.</div>
                        <div style={analysisGrid}>
                          {studentExamCategorySections.map((section) => (
                            <div
                              key={`owner-empty-exam-${section.key}`}
                              style={{ ...listCard, background: section.tone.bg, borderColor: section.tone.border, padding: 12 }}
                            >
                              <div style={{ fontWeight: 800, color: section.tone.title }}>{section.title}</div>
                              <div style={subText}>{section.empty}</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </>
                  )}
                </>
              )}

              <details style={listCard} open={studentActivityOpen}>
                <summary
                  style={detailsSummary}
                  onClick={(e) => {
                    e.preventDefault();
                    setStudentActivityOpen((prev) => !prev);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Activity details</div>
                    <OpenHint isOpen={studentActivityOpen} />
                  </div>
                  <div style={subText}>
                    Open to see question exposure, practice focus, remediation focus, and the mode mix behind this report.
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
                  <div style={{ ...listCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Exam activity</div>
                    <div style={subText}>
                      Total attempts: {studentSummary.exams?.totalAttempts ?? 0} | Completed:{" "}
                      {studentSummary.exams?.completedAttempts ?? 0}
                    </div>
                    <div style={subText}>
                      Average score: {formatPercent(studentSummary.exams?.averageScore)} | Best score:{" "}
                      {formatPercent(studentSummary.exams?.bestScore)}
                    </div>
                    <div style={subText}>
                      Current readiness signal: {studentSummary.learningSignals?.overallStatus || "No current signal"}
                    </div>
                  </div>

                  <div style={{ ...listCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Question exposure</div>
                    <div style={subText}>Total delivered: {studentSummary.questionHistory?.totalExposureRows ?? 0}</div>
                    <div style={subText}>
                      Unique questions seen: {studentSummary.questionHistory?.uniqueQuestionCount ?? 0}
                    </div>
                    <div style={subText}>
                      By mode:{" "}
                      {Object.entries(studentSummary.questionHistory?.bySourceType || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No data yet"}
                    </div>
                  </div>

                  <div style={{ ...listCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Practice focus</div>
                    <div style={subText}>
                      Chapters:{" "}
                      {Object.entries(studentSummary.practiceFocus?.chapterCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No chapter focus yet"}
                    </div>
                    <div style={subText}>
                      Categories:{" "}
                      {Object.entries(studentSummary.practiceFocus?.categoryCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No category focus yet"}
                    </div>
                    <div style={subText}>
                      Mixed practice: {studentSummary.practiceFocus?.modeCounts?.mixed ?? 0}
                    </div>
                  </div>

                  <div style={{ ...listCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Remediation focus</div>
                    <div style={subText}>
                      Categories:{" "}
                      {Object.entries(studentSummary.remediationFocus?.categoryCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No remediation focus yet"}
                    </div>
                    <div style={subText}>
                      Outcomes:{" "}
                      {Object.entries(studentSummary.remediationFocus?.outcomeCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No remediation outcomes yet"}
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
