"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  fetchOwnerClassOverviewReport,
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
    <span style={{ color: "#607282", fontSize: 12.5, fontWeight: 700 }}>
      {isNarrow ? (isOpen ? "Tap here to close" : "Tap here to open") : isOpen ? "Click here to close" : "Click here to open"}
    </span>
  );
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value}%` : "No data yet";
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
  const atRiskStudents = (students || []).filter((student) => {
    const status = student?.latestExamAnalytics?.overallStatus || "";
    return status === "High Risk" || status === "Borderline";
  });

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
  return (students || [])
    .map((student) => {
      const status = student?.latestExamAnalytics?.overallStatus || "No current signal";
      const weakestCategory = student?.latestExamAnalytics?.categoryPriority?.find(
        (item) => item?.level === "Weak" || item?.level === "Developing"
      );
      const weakestChapter = student?.latestExamAnalytics?.chapterGuidance?.[0];

      return {
        id: student?.user?.id || student?.user?.email || "",
        name: student?.user?.full_name || student?.user?.email || student?.user?.id,
        status,
        averageScore: student?.exams?.averageScore,
        weakestCategory: weakestCategory?.category_id || null,
        weakestChapter: weakestChapter?.chapter_id ? `Chapter ${weakestChapter.chapter_id}` : null,
      };
    })
    .filter((student) => student.status === "High Risk" || student.status === "Borderline")
    .sort((a, b) => {
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

export default function OwnerReportsClient() {
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope") || "class";
  const classGroupId = searchParams.get("class_group_id") || "";
  const userId = searchParams.get("user_id") || "";
  const lang = searchParams.get("lang") || "en";
  const from = searchParams.get("from") || "";
  const schoolId = searchParams.get("school_id") || "";
  const studentId = searchParams.get("student_id") || "";
  const className = searchParams.get("class_name") || "";
  const hasTarget = scope === "student" ? !!userId : !!classGroupId;
  const schoolBackQuery = new URLSearchParams(
    Object.fromEntries(
      [
        ["school_id", schoolId],
        ["class_group_id", classGroupId],
        ["class_name", className],
      ].filter(([, value]) => value)
    )
  ).toString();
  const backHref =
    from === "independent"
      ? `/owner/independent${studentId ? `?student_id=${encodeURIComponent(studentId)}` : ""}`
      : from === "schools"
        ? `/owner/schools${schoolBackQuery ? `?${schoolBackQuery}` : ""}`
        : "/owner";
  const backLabel =
    from === "independent"
      ? "Back"
      : from === "schools"
        ? "Back"
        : "Return";

  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);
  const [strengthsOpen, setStrengthsOpen] = useState(false);
  const [rosterOpen, setRosterOpen] = useState(false);

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
  }, [scope, classGroupId, hasTarget, userId, lang]);

  useEffect(() => {
    if (!loading) {
      setShowLoadingNotice(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowLoadingNotice(true), 350);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const classSummary = report?.summary?.aggregate || null;
  const students = report?.summary?.students || [];
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
  const topRosterStudents = students.map((student) => {
    const weakestCategory = student?.latestExamAnalytics?.categoryPriority?.find(
      (item) => item?.level === "Weak" || item?.level === "Developing"
    );
    const topChapter = student?.latestExamAnalytics?.chapterGuidance?.[0];

    return {
      ...student,
      weakestCategory: weakestCategory?.category_id || null,
      weakestChapter: topChapter?.chapter_id ? `Chapter ${topChapter.chapter_id}` : null,
      latestStatus: student?.latestExamAnalytics?.overallStatus || "No current signal",
    };
  });
  const nextActions = buildClassNextActions(classSummary, students);
  const reportTitle = !hasTarget ? "Reports" : scope === "student" ? "Student Report" : "Class Report";
  const reportSubject = !hasTarget ? "" : scope === "student" ? studentName : className;

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
                        <div key={student.id} style={{ ...listCard, background: "white", padding: 12 }}>
                          <div style={{ fontWeight: 800, color: "var(--heading)" }}>{student.name}</div>
                          <div style={subText}>
                            Status: {student.status} | Avg exam: {formatPercent(student.averageScore)} | Weakest category:{" "}
                            {student.weakestCategory || "No clear category yet"}
                          </div>
                          <div style={subText}>Weakest chapter: {student.weakestChapter || "No clear chapter yet"}</div>
                          <div>
                            <Link
                              href={`/owner/reports?scope=student&user_id=${encodeURIComponent(
                                student.id
                              )}&lang=${encodeURIComponent(lang)}&from=${encodeURIComponent(
                                from || "schools"
                              )}&school_id=${encodeURIComponent(schoolId)}&class_group_id=${encodeURIComponent(
                                classGroupId
                              )}&class_name=${encodeURIComponent(className)}`}
                              style={buttonSecondary}
                            >
                              View student report
                            </Link>
                          </div>
                        </div>
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

              <details style={listCard} open={rosterOpen}>
                <summary
                  style={detailsSummary}
                  onClick={(e) => {
                    e.preventDefault();
                    setRosterOpen((prev) => !prev);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>Class roster</div>
                    <OpenHint isOpen={rosterOpen} />
                  </div>
                  <div style={subText}>Open to review the full class list and move into individual student reports when needed.</div>
                </summary>
                <div style={{ display: "grid", gap: 10, marginTop: 10 }}>
                  {topRosterStudents.map((student) => (
                    <div key={student.user?.id || student.user?.email} style={{ ...listCard, background: "white", padding: 12 }}>
                      <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                        {student.user?.full_name || student.user?.email || student.user?.id}
                      </div>
                      <div style={subText}>
                        Status: {student.latestStatus} | Avg exam: {formatPercent(student.exams?.averageScore)} | Practice:{" "}
                        {student.practice?.totalSessions ?? 0} | Remediation: {student.remediation?.totalSessions ?? 0}
                      </div>
                      <div style={subText}>
                        Weakest category: {student.weakestCategory || "No clear category yet"} | Weakest chapter:{" "}
                        {student.weakestChapter || "No clear chapter yet"}
                      </div>
                      <div>
                        <Link
                          href={`/owner/reports?scope=student&user_id=${encodeURIComponent(
                            student.user?.id || ""
                          )}&lang=${encodeURIComponent(lang)}&from=${encodeURIComponent(
                            from || "schools"
                          )}&school_id=${encodeURIComponent(schoolId)}&class_group_id=${encodeURIComponent(
                            classGroupId
                          )}&class_name=${encodeURIComponent(className)}`}
                          style={buttonSecondary}
                        >
                          View student report
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </details>

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

          {!loading && !error && hasTarget && scope === "student" && studentSummary ? (
            <>
              <div style={statGrid}>
                <div style={statCard}>
                  <div style={statLabel}>Average exam score</div>
                  <div style={statValue}>
                    {studentSummary.exams?.averageScore ?? "-"}
                    {studentSummary.exams?.averageScore != null ? "%" : ""}
                  </div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Best exam score</div>
                  <div style={statValue}>
                    {studentSummary.exams?.bestScore ?? "-"}
                    {studentSummary.exams?.bestScore != null ? "%" : ""}
                  </div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Practice sessions</div>
                  <div style={statValue}>{studentSummary.practice?.totalSessions ?? 0}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Remediation sessions</div>
                  <div style={statValue}>{studentSummary.remediation?.totalSessions ?? 0}</div>
                </div>
              </div>

              <div style={listCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Learning signals</div>
                <div style={subText}>
                  Overall status: {studentSummary.learningSignals?.overallStatus || "No data yet"}
                </div>
                <div style={subText}>
                  Strongest: {(studentSummary.learningSignals?.strongestCategories || []).join(", ") || "No data yet"}
                </div>
                <div style={subText}>
                  Needs work: {(studentSummary.learningSignals?.categoriesNeedingWork || [])
                    .map((item) => item.category)
                    .join(", ") || "No data yet"}
                </div>
              </div>

              <div style={listCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>Question exposure</div>
                <div style={subText}>
                  Total delivered: {studentSummary.questionHistory?.totalExposureRows ?? 0}
                </div>
                <div style={subText}>
                  By mode: {Object.entries(studentSummary.questionHistory?.bySourceType || {})
                    .map(([key, value]) => `${key}: ${value}`)
                    .join(" | ") || "No data yet"}
                </div>
              </div>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
