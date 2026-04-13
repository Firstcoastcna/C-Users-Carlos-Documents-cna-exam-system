"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchClassOverviewReport,
  fetchStudentOverviewReport,
  resolveStudentEntryState,
} from "../lib/backend/auth/browserAuth";

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
  fontSize: 24,
  fontWeight: 800,
  color: "var(--heading)",
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

const btnPrimary = {
  padding: "10px 14px",
  borderRadius: 10,
  border: "none",
  background: "var(--brand-red)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSecondary = {
  padding: "9px 12px",
  borderRadius: 10,
  border: "1px solid var(--chrome-border)",
  background: "white",
  color: "var(--brand-teal-dark)",
  fontWeight: 700,
  cursor: "pointer",
};

const sectionCard = {
  border: "1px solid var(--chrome-border)",
  borderRadius: 14,
  background: "var(--surface-soft)",
  padding: 16,
  display: "grid",
  gap: 12,
};

const statGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
  gap: 12,
};

const statCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 12,
  background: "white",
  padding: 12,
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
  fontSize: 22,
  fontWeight: 800,
  color: "var(--heading)",
};

const chipWrap = {
  display: "flex",
  flexWrap: "wrap",
  gap: 8,
};

const chip = {
  padding: "6px 10px",
  borderRadius: 999,
  background: "white",
  border: "1px solid #d6e1e8",
  color: "#365063",
  fontSize: 13,
  fontWeight: 600,
};

function renderCountChips(map) {
  const entries = Object.entries(map || {});
  if (!entries.length) return <div style={{ color: "#607282" }}>No data yet.</div>;

  return (
    <div style={chipWrap}>
      {entries.map(([key, value]) => (
        <div key={key} style={chip}>
          {key}: {value}
        </div>
      ))}
    </div>
  );
}

function StudentSummary({ report }) {
  const summary = report?.summary;
  if (!summary) return null;

  return (
    <div style={sectionCard}>
      <div style={{ fontWeight: 800, color: "var(--heading)" }}>My report summary</div>
      <div style={statGrid}>
        <div style={statCard}>
          <div style={statLabel}>Average exam score</div>
          <div style={statValue}>{summary.exams?.averageScore ?? "—"}{summary.exams?.averageScore != null ? "%" : ""}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Best exam score</div>
          <div style={statValue}>{summary.exams?.bestScore ?? "—"}{summary.exams?.bestScore != null ? "%" : ""}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Completed exams</div>
          <div style={statValue}>{summary.exams?.completedAttempts ?? 0}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Remediation sessions</div>
          <div style={statValue}>{summary.remediation?.totalSessions ?? 0}</div>
        </div>
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Strongest categories</div>
        {summary.learningSignals?.strongestCategories?.length ? (
          <div style={chipWrap}>
            {summary.learningSignals.strongestCategories.map((item) => (
              <div key={item} style={chip}>{item}</div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#607282" }}>No clear strengths yet.</div>
        )}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Needs the most work</div>
        {summary.learningSignals?.categoriesNeedingWork?.length ? (
          <div style={chipWrap}>
            {summary.learningSignals.categoriesNeedingWork.map((item) => (
              <div key={`${item.category}-${item.level}`} style={chip}>
                {item.category} ({item.level})
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#607282" }}>No weak categories identified yet.</div>
        )}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Practice focus</div>
        {renderCountChips(summary.practiceFocus?.categoryCounts)}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Question exposure</div>
        <div style={{ color: "var(--heading)", fontWeight: 800, fontSize: 20 }}>
          {summary.questionHistory?.totalExposureRows ?? 0} questions delivered
        </div>
        <div style={{ marginTop: 8 }}>{renderCountChips(summary.questionHistory?.bySourceType)}</div>
      </div>
    </div>
  );
}

function ClassSummary({ report }) {
  const aggregate = report?.summary?.aggregate;
  const students = report?.summary?.students || [];
  if (!aggregate) return null;

  return (
    <div style={sectionCard}>
      <div style={{ fontWeight: 800, color: "var(--heading)" }}>Class overview</div>
      <div style={statGrid}>
        <div style={statCard}>
          <div style={statLabel}>Students</div>
          <div style={statValue}>{aggregate.totalStudents ?? 0}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Active students</div>
          <div style={statValue}>{aggregate.activeStudents ?? 0}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Class average</div>
          <div style={statValue}>{aggregate.classAverageScore ?? "—"}{aggregate.classAverageScore != null ? "%" : ""}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Exam attempts</div>
          <div style={statValue}>{aggregate.totalExamAttempts ?? 0}</div>
        </div>
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Common weak categories</div>
        {renderCountChips(aggregate.categoryWeaknessCounts)}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>High-risk categories</div>
        {renderCountChips(aggregate.highRiskCategoryCounts)}
      </div>

      <div style={{ display: "grid", gap: 8 }}>
        <div style={statLabel}>Roster snapshot</div>
        {students.length ? students.map((student) => (
          <div key={student.user?.id || student.user?.email} style={{ ...statCard, gap: 4 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>
              {student.user?.full_name || student.user?.email || student.user?.id}
            </div>
            <div style={{ color: "#607282", fontSize: 14 }}>
              Avg exam: {student.exams?.averageScore ?? "—"}{student.exams?.averageScore != null ? "%" : ""} | Practice: {student.practice?.totalSessions ?? 0} | Remediation: {student.remediation?.totalSessions ?? 0}
            </div>
          </div>
        )) : <div style={{ color: "#607282" }}>No students yet.</div>}
      </div>
    </div>
  );
}

export default function ReportsPage() {
  const router = useRouter();
  const [lang, setLang] = useState("en");
  const [reportLang, setReportLang] = useState("en");
  const [studentReport, setStudentReport] = useState(null);
  const [classReport, setClassReport] = useState(null);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

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
        }
      } catch {
        // fall through
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    try {
      const saved = localStorage.getItem("cna_pilot_lang");
      if (saved === "en" || saved === "es" || saved === "fr" || saved === "ht") {
        setLang(saved);
        setReportLang(saved);
      }
    } catch {}
  }, []);

  async function runAction(action) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to load report.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <span>Reports</span>
          <button style={btnSecondary} onClick={() => router.push(`/start?lang=${lang}`)}>
            Back to Main Menu
          </button>
        </div>
        <div style={body}>
          <div style={{ color: "#4a6272", lineHeight: 1.6 }}>
            Load your student summary or a class overview report. Reports are always tied to the
            signed-in account.
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", alignItems: "center" }}>
            <button
              style={btnPrimary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  const nextReport = await fetchStudentOverviewReport(reportLang);
                  setStudentReport(nextReport);
                  setMessage("Loaded your student report.");
                })
              }
            >
              Load My Report
            </button>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  const nextReport = await fetchClassOverviewReport(reportLang);
                  setClassReport(nextReport);
                  setMessage("Loaded class report.");
                })
              }
            >
              Load Class Report
            </button>
            <select
              value={reportLang}
              onChange={(e) => setReportLang(e.target.value)}
              style={{ padding: "10px 12px", borderRadius: 10, border: "1px solid var(--chrome-border)", minWidth: 140 }}
            >
              <option value="en">English</option>
              <option value="es">Spanish</option>
              <option value="fr">French</option>
              <option value="ht">Creole</option>
            </select>
          </div>

          {message ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "#fff8eb",
                border: "1px solid #f0d59b",
                color: "#755200",
              }}
            >
              {message}
            </div>
          ) : null}

          <StudentSummary report={studentReport} />
          <ClassSummary report={classReport} />
        </div>
      </div>
    </main>
  );
}
