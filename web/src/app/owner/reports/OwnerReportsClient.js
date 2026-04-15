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

const title = {
  fontSize: 28,
  fontWeight: 800,
  color: "var(--heading)",
};

const subText = {
  color: "#5a6b78",
  lineHeight: 1.6,
  fontSize: 14,
};

const statGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))",
  gap: 12,
};

const statCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  padding: 14,
  background: "var(--surface-soft)",
  display: "grid",
  gap: 6,
};

const statLabel = {
  fontSize: 12,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#607282",
};

const statValue = {
  fontSize: 28,
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

const buttonSecondary = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "1px solid #cfdde6",
  background: "white",
  color: "#536779",
  cursor: "pointer",
  fontWeight: 700,
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

export default function OwnerReportsClient() {
  const searchParams = useSearchParams();
  const scope = searchParams.get("scope") || "class";
  const classGroupId = searchParams.get("class_group_id") || "";
  const userId = searchParams.get("user_id") || "";
  const lang = searchParams.get("lang") || "en";
  const hasTarget = scope === "student" ? !!userId : !!classGroupId;

  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [error, setError] = useState("");
  const [report, setReport] = useState(null);

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

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={title}>{hasTarget ? (scope === "student" ? "Student Report" : "Class Report") : "Reports"}</div>
            <div style={subText}>
              {!hasTarget
                ? "Choose a school, class, or student from the management lanes first, then open the matching report from there."
                : scope === "student"
                  ? "Owner view of one student across exams, practice, remediation, and question exposure."
                  : "Owner view of one class, including roster activity and shared performance signals."}
            </div>
          </div>
          <Link href="/owner" style={buttonSecondary}>
            Control Center
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
              <div style={statGrid}>
                <div style={statCard}>
                  <div style={statLabel}>Students</div>
                  <div style={statValue}>{classSummary.totalStudents ?? 0}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Active students</div>
                  <div style={statValue}>{classSummary.activeStudents ?? 0}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Class average</div>
                  <div style={statValue}>
                    {classSummary.classAverageScore ?? "-"}
                    {classSummary.classAverageScore != null ? "%" : ""}
                  </div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Exam attempts</div>
                  <div style={statValue}>{classSummary.totalExamAttempts ?? 0}</div>
                </div>
              </div>

              <div style={{ display: "grid", gap: 12 }}>
                {students.map((student) => (
                  <div key={student.user?.id || student.user?.email} style={listCard}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                      {student.user?.full_name || student.user?.email || student.user?.id}
                    </div>
                    <div style={subText}>
                      Avg exam: {student.exams?.averageScore ?? "-"}
                      {student.exams?.averageScore != null ? "%" : ""} | Practice: {student.practice?.totalSessions ?? 0} | Remediation: {student.remediation?.totalSessions ?? 0}
                    </div>
                    <div>
                      <Link
                        href={`/owner/reports?scope=student&user_id=${encodeURIComponent(student.user?.id || "")}&lang=${encodeURIComponent(lang)}`}
                        style={buttonSecondary}
                      >
                        View student report
                      </Link>
                    </div>
                  </div>
                ))}
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