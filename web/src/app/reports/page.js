"use client";

import { useEffect, useMemo, useState } from "react";
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

function InlineMessage({ tone = "info", children }) {
  const styles =
    tone === "error"
      ? { background: "#fff0ef", border: "1px solid #f4c5c0", color: "#9b1c1c" }
      : { background: "#fff8eb", border: "1px solid #f0d59b", color: "#755200" };

  return <div style={{ padding: "12px 14px", borderRadius: 12, ...styles }}>{children}</div>;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value}%` : "No data yet";
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
    <span style={{ color: "#607282", fontSize: 12.5, fontWeight: 700 }}>
      {isNarrow ? (isOpen ? "Tap here to close" : "Tap here to open") : isOpen ? "Click here to close" : "Click here to open"}
    </span>
  );
}

export default function ReportsPage() {
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
      } catch {
        // Let the report fetch surface the problem if needed.
      }
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
      const saved = localStorage.getItem("cna_pilot_lang");
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
          setMessage(error instanceof Error ? error.message : "Unable to load your report.");
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
  }, [lang]);

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
    report?.user?.appUser?.full_name || report?.user?.appUser?.email || "My Progress";
  const strengths = buildStudentStrengths(summary);
  const weaknesses = buildStudentWeaknesses(summary);
  const nextActions = buildStudentNextActions(summary);
  const progress = buildStudentProgress(summary);

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={title}>My Progress</div>
            <div style={subjectTitle}>{studentName}</div>
            <div style={subText}>
              See your current readiness, strengths, weak areas, and what to do next.
            </div>
          </div>
          <button style={btnSecondary} onClick={() => router.push(`/start?lang=${lang}`)}>
            Back to Main Menu
          </button>
        </div>

        <div style={body}>
          {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading your report...</InlineMessage> : null}

          {!loading && summary ? (
            <>
              <div style={sectionCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Status summary</div>
                <div style={subText}>
                  {summary.learningSignals?.overallStatus || "No current signal"} | Completed full exams:{" "}
                  {summary.exams?.completedAttempts ?? 0} | Practice sessions: {summary.practice?.totalSessions ?? 0}
                </div>
                <div style={subText}>
                  Average exam score: {formatPercent(summary.exams?.averageScore)} | Best exam score:{" "}
                  {formatPercent(summary.exams?.bestScore)} | Remediation sessions: {summary.remediation?.totalSessions ?? 0}
                </div>
              </div>

              <div style={analysisGrid}>
                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Strengths</div>
                  <div style={subText}>
                    Strongest categories:{" "}
                    {strengths.strongestCategories.length ? strengths.strongestCategories.join(" | ") : "No clear strengths yet"}
                  </div>
                  <div style={subText}>Best full exam score: {formatPercent(strengths.bestScore)}</div>
                  <div style={subText}>
                    Completed practice: {strengths.completedPractice} | Completed remediation: {strengths.completedRemediation}
                  </div>
                </div>

                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Priority weak areas</div>
                  <div style={subText}>
                    Categories needing work:{" "}
                    {weaknesses.categoriesNeedingWork.length
                      ? weaknesses.categoriesNeedingWork.map((item) => `${item.category} (${item.level})`).join(" | ")
                      : "No repeated weak category yet"}
                  </div>
                  <div style={subText}>
                    High-risk categories:{" "}
                    {weaknesses.highRiskCategories.length
                      ? weaknesses.highRiskCategories.map((item) => `${item.category} (${item.level})`).join(" | ")
                      : "No current high-risk category signal"}
                  </div>
                  <div style={subText}>
                    Priority chapters:{" "}
                    {weaknesses.chapterPriorities.length
                      ? weaknesses.chapterPriorities.map((item) => `Chapter ${item.chapterId} (${item.priority})`).join(" | ")
                      : "No clear chapter priority yet"}
                  </div>
                </div>
              </div>

              <div style={analysisGrid}>
                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Progress over time</div>
                  <div style={subText}>
                    Average exam score: {formatPercent(progress.examAverage)} | Best score: {formatPercent(progress.bestScore)}
                  </div>
                  <div style={subText}>
                    Completed full exams: {progress.completedAttempts} | Practice sessions: {progress.totalPractice}
                  </div>
                  <div style={subText}>
                    Remediation sessions: {progress.totalRemediation} | Total delivered questions: {progress.totalExposure}
                  </div>
                </div>

                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>Next action</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {nextActions.map((item) => (
                      <div key={item} style={subText}>
                        {item}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <details style={sectionCard} open={activityOpen}>
                <summary
                  style={detailsSummary}
                  onClick={(e) => {
                    e.preventDefault();
                    setActivityOpen((prev) => !prev);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Activity details</div>
                    <OpenHint isOpen={activityOpen} />
                  </div>
                  <div style={subText}>
                    Open to see exam activity, question exposure, practice focus, and remediation focus behind this report.
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
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Exam activity</div>
                    <div style={subText}>
                      Total attempts: {summary.exams?.totalAttempts ?? 0} | Completed: {summary.exams?.completedAttempts ?? 0}
                    </div>
                    <div style={subText}>
                      Average score: {formatPercent(summary.exams?.averageScore)} | Best score: {formatPercent(summary.exams?.bestScore)}
                    </div>
                    <div style={subText}>
                      Current readiness signal: {summary.learningSignals?.overallStatus || "No current signal"}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Question exposure</div>
                    <div style={subText}>Total delivered: {summary.questionHistory?.totalExposureRows ?? 0}</div>
                    <div style={subText}>Unique questions seen: {summary.questionHistory?.uniqueQuestionCount ?? 0}</div>
                    <div style={subText}>
                      By mode:{" "}
                      {Object.entries(summary.questionHistory?.bySourceType || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No data yet"}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Practice focus</div>
                    <div style={subText}>
                      Chapters:{" "}
                      {Object.entries(summary.practiceFocus?.chapterCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No chapter focus yet"}
                    </div>
                    <div style={subText}>
                      Categories:{" "}
                      {Object.entries(summary.practiceFocus?.categoryCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No category focus yet"}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Remediation focus</div>
                    <div style={subText}>
                      Categories:{" "}
                      {Object.entries(summary.remediationFocus?.categoryCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || "No remediation focus yet"}
                    </div>
                    <div style={subText}>
                      Outcomes:{" "}
                      {Object.entries(summary.remediationFocus?.outcomeCounts || {})
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
