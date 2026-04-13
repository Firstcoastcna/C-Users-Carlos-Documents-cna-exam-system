"use client";

import { useEffect, useState } from "react";
import {
  bootstrapDemoClassData,
  bootstrapSchoolContext,
  fetchClassOverviewReport,
  fetchSchoolContext,
  fetchStudentOverviewReport,
  getStudentSessionSnapshot,
  signInStudent,
  signOutStudent,
  signUpStudent,
  syncStudentProfile,
} from "../lib/backend/auth/browserAuth";

const shell = {
  maxWidth: 760,
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
  fontSize: 26,
  fontWeight: 800,
  color: "var(--heading)",
};

const body = {
  padding: 20,
  display: "grid",
  gap: 16,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--chrome-border)",
  fontSize: 15,
  background: "white",
};

const btnPrimary = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "var(--brand-red)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSecondary = {
  ...btnPrimary,
  background: "white",
  color: "#536779",
  border: "1px solid #cfdde6",
};

const preStyle = {
  margin: 0,
  padding: 14,
  borderRadius: 12,
  background: "var(--surface-soft)",
  border: "1px solid var(--chrome-border)",
  fontSize: 13,
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
};

const sectionCard = {
  border: "1px solid var(--chrome-border)",
  borderRadius: 14,
  background: "var(--surface-soft)",
  padding: 16,
  display: "grid",
  gap: 12,
};

const subSection = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  background: "white",
  padding: 14,
  display: "grid",
  gap: 10,
};

const infoBubble = {
  border: "1px solid #d6e1e8",
  borderRadius: 12,
  background: "#f7fafc",
  padding: 12,
  display: "grid",
  gap: 8,
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
  fontSize: 24,
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

function toPrettyJson(value) {
  try {
    return JSON.stringify(value, null, 2);
  } catch {
    return String(value);
  }
}

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

function StudentReportSummary({ report }) {
  const summary = report?.summary;
  if (!summary) return null;

  return (
    <div style={sectionCard}>
      <div style={{ fontWeight: 800, color: "var(--heading)" }}>Readable student summary</div>
      <div style={statGrid}>
        <div style={statCard}>
          <div style={statLabel}>Average score</div>
          <div style={statValue}>{summary.exams?.averageScore ?? "—"}{summary.exams?.averageScore != null ? "%" : ""}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Best score</div>
          <div style={statValue}>{summary.exams?.bestScore ?? "—"}{summary.exams?.bestScore != null ? "%" : ""}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Practice sessions</div>
          <div style={statValue}>{summary.practice?.totalSessions ?? 0}</div>
        </div>
        <div style={statCard}>
          <div style={statLabel}>Remediation sessions</div>
          <div style={statValue}>{summary.remediation?.totalSessions ?? 0}</div>
        </div>
      </div>
      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Question exposure by mode</div>
        {renderCountChips(summary.questionHistory?.bySourceType)}
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
        <div style={{ ...statLabel, marginBottom: 8 }}>High-risk categories</div>
        {summary.learningSignals?.highRiskCategories?.length ? (
          <div style={chipWrap}>
            {summary.learningSignals.highRiskCategories.map((item) => (
              <div key={`${item.category}-${item.level}`} style={chip}>
                {item.category} ({item.level})
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#607282" }}>No high-risk flags right now.</div>
        )}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Chapter priorities</div>
        {summary.learningSignals?.chapterPriorities?.length ? (
          <div style={chipWrap}>
            {summary.learningSignals.chapterPriorities.map((item) => (
              <div key={`${item.chapterId}-${item.priority}`} style={chip}>
                Chapter {item.chapterId} ({item.priority})
              </div>
            ))}
          </div>
        ) : (
          <div style={{ color: "#607282" }}>No chapter priorities yet.</div>
        )}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Most practiced chapters</div>
        {renderCountChips(summary.practiceFocus?.chapterCounts)}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Most practiced categories</div>
        {renderCountChips(summary.practiceFocus?.categoryCounts)}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Remediation focus categories</div>
        {renderCountChips(summary.remediationFocus?.categoryCounts)}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Remediation outcomes</div>
        {renderCountChips(summary.remediationFocus?.outcomeCounts)}
      </div>
    </div>
  );
}

function StudentReportSummaryV2({ report }) {
  const summary = report?.summary;
  if (!summary) return null;

  return (
    <div style={sectionCard}>
      <div style={{ fontWeight: 800, color: "var(--heading)" }}>Readable student summary</div>

      <div style={subSection}>
        <div style={{ fontWeight: 800, color: "var(--heading)" }}>Exam and remediation results</div>
        <div style={{ color: "#607282", lineHeight: 1.5 }}>
          These are performance signals from completed exams and the remediation that followed them.
        </div>
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
          <div style={{ ...statLabel, marginBottom: 8 }}>High-risk categories</div>
          {summary.learningSignals?.highRiskCategories?.length ? (
            <div style={chipWrap}>
              {summary.learningSignals.highRiskCategories.map((item) => (
                <div key={`${item.category}-${item.level}`} style={chip}>
                  {item.category} ({item.level})
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#607282" }}>No high-risk flags right now.</div>
          )}
        </div>

        <div>
          <div style={{ ...statLabel, marginBottom: 8 }}>Chapter priorities</div>
          {summary.learningSignals?.chapterPriorities?.length ? (
            <div style={chipWrap}>
              {summary.learningSignals.chapterPriorities.map((item) => (
                <div key={`${item.chapterId}-${item.priority}`} style={chip}>
                  Chapter {item.chapterId} ({item.priority})
                </div>
              ))}
            </div>
          ) : (
            <div style={{ color: "#607282" }}>No chapter priorities yet.</div>
          )}
        </div>

        <div>
          <div style={{ ...statLabel, marginBottom: 8 }}>Remediation focus categories</div>
          {renderCountChips(summary.remediationFocus?.categoryCounts)}
        </div>

        <div>
          <div style={{ ...statLabel, marginBottom: 8 }}>Remediation outcomes</div>
          {renderCountChips(summary.remediationFocus?.outcomeCounts)}
        </div>
      </div>

      <div style={subSection}>
        <div style={{ fontWeight: 800, color: "var(--heading)" }}>Practice by chapter and category</div>
        <div style={{ color: "#607282", lineHeight: 1.5 }}>
          This is study activity. It shows where time has been spent in practice, not final exam performance.
        </div>
        <div style={statGrid}>
          <div style={statCard}>
            <div style={statLabel}>Practice sessions</div>
            <div style={statValue}>{summary.practice?.totalSessions ?? 0}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Completed practice</div>
            <div style={statValue}>{summary.practice?.completedSessions ?? 0}</div>
          </div>
          <div style={statCard}>
            <div style={statLabel}>Active practice</div>
            <div style={statValue}>{summary.practice?.activeSessions ?? 0}</div>
          </div>
        </div>

        <div>
          <div style={{ ...statLabel, marginBottom: 8 }}>Most practiced chapters</div>
          {renderCountChips(summary.practiceFocus?.chapterCounts)}
        </div>

        <div>
          <div style={{ ...statLabel, marginBottom: 8 }}>Most practiced categories</div>
          {renderCountChips(summary.practiceFocus?.categoryCounts)}
        </div>

        <div style={infoBubble}>
          <div style={{ ...statLabel, marginBottom: 8 }}>Overall question exposure</div>
          <div style={{ color: "var(--heading)", fontWeight: 800, fontSize: 20 }}>
            {summary.questionHistory?.totalExposureRows ?? 0} questions delivered
          </div>
          <div style={{ ...statLabel, marginBottom: 8 }}>By mode breakdown</div>
          {renderCountChips(summary.questionHistory?.bySourceType)}
        </div>
      </div>
    </div>
  );
}

function ClassReportSummary({ report }) {
  const aggregate = report?.summary?.aggregate;
  const students = report?.summary?.students || [];
  if (!aggregate) return null;

  return (
    <div style={sectionCard}>
      <div style={{ fontWeight: 800, color: "var(--heading)" }}>Readable class summary</div>
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
        <div style={{ ...statLabel, marginBottom: 8 }}>Overall status counts</div>
        {renderCountChips(aggregate.overallStatusCounts)}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Common weak categories</div>
        {renderCountChips(aggregate.categoryWeaknessCounts)}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>High-risk categories</div>
        {renderCountChips(aggregate.highRiskCategoryCounts)}
      </div>

      <div>
        <div style={{ ...statLabel, marginBottom: 8 }}>Chapter priorities</div>
        {renderCountChips(aggregate.chapterPriorityCounts)}
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

export default function AuthTestPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [session, setSession] = useState(null);
  const [profile, setProfile] = useState(null);
  const [reportLang, setReportLang] = useState("en");
  const [report, setReport] = useState(null);
  const [schoolBootstrap, setSchoolBootstrap] = useState(null);
  const [schoolContext, setSchoolContext] = useState(null);
  const [classReport, setClassReport] = useState(null);
  const [demoClassData, setDemoClassData] = useState(null);
  const [showRawData, setShowRawData] = useState(false);
  const [busy, setBusy] = useState(false);

  async function refreshSession() {
    const nextSession = await getStudentSessionSnapshot();
    setSession(nextSession);
    return nextSession;
  }

  async function refreshProfile() {
    const synced = await syncStudentProfile();
    setProfile(synced);
    return synced;
  }

  useEffect(() => {
    void (async () => {
      try {
        await refreshSession();
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "Unable to load auth session.");
      }
    })();
  }, []);

  async function runAction(action) {
    setBusy(true);
    setMessage("");
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unknown auth error.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>Auth Test Lane</div>
        <div style={body}>
          <div style={{ color: "#4a6272", lineHeight: 1.6 }}>
            This page is only for our backend migration work. It lets us create a real student login,
            verify the Supabase session in the browser, and sync that student into our `app_users` table.
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              style={inputStyle}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name"
            />
            <input
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
            <input
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              style={btnPrimary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  await signUpStudent({ email, password, fullName });
                  await refreshSession();
                  setMessage("Sign-up request completed. If Supabase requires email confirmation, sign in after confirming.");
                })
              }
            >
              Sign Up
            </button>
            <button
              style={btnPrimary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  await signInStudent({ email, password });
                  await refreshSession();
                  setMessage("Signed in successfully.");
                })
              }
            >
              Sign In
            </button>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  await refreshSession();
                  const synced = await refreshProfile();
                  setMessage(`Student profile synced as ${synced.appUser.email}.`);
                })
              }
            >
              Sync Profile
            </button>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  const nextReport = await fetchStudentOverviewReport(reportLang);
                  setReport(nextReport);
                  setMessage(`Loaded student overview report for ${reportLang.toUpperCase()}.`);
                })
              }
            >
              Load Report
            </button>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  const payload = await bootstrapSchoolContext();
                  setSchoolBootstrap(payload);
                  setMessage("Bootstrapped school and class context for the signed-in student.");
                })
              }
            >
              Bootstrap School
            </button>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  const payload = await bootstrapDemoClassData();
                  setDemoClassData(payload);
                  setMessage("Seeded demo classmates and sample class activity.");
                })
              }
            >
              Seed Demo Class
            </button>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  const payload = await fetchSchoolContext();
                  setSchoolContext(payload);
                  setMessage("Loaded school/class context for the signed-in student.");
                })
              }
            >
              Load School Context
            </button>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  const payload = await fetchClassOverviewReport(reportLang);
                  setClassReport(payload);
                  setMessage(`Loaded class overview report for ${reportLang.toUpperCase()}.`);
                })
              }
            >
              Load Class Report
            </button>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  await signOutStudent();
                  setSession(null);
                  setProfile(null);
                  setMessage("Signed out.");
                })
              }
            >
              Sign Out
            </button>
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

          <div style={{ display: "flex", justifyContent: "flex-end" }}>
            <button
              style={btnSecondary}
              disabled={busy}
              onClick={() => setShowRawData((value) => !value)}
            >
              {showRawData ? "Hide Raw JSON" : "Show Raw JSON"}
            </button>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>Browser session</div>
            {showRawData ? <pre style={preStyle}>{toPrettyJson(session)}</pre> : null}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>Synced app user</div>
            {showRawData ? <pre style={preStyle}>{toPrettyJson(profile)}</pre> : null}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ fontWeight: 800, color: "var(--heading)" }}>Student overview report</div>
              <select value={reportLang} onChange={(e) => setReportLang(e.target.value)} style={{ ...inputStyle, width: 140, padding: "10px 12px" }}>
                <option value="en">English</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="ht">Creole</option>
              </select>
            </div>
            <StudentReportSummaryV2 report={report} />
            {showRawData ? <pre style={preStyle}>{toPrettyJson(report)}</pre> : null}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>School/class bootstrap</div>
            {showRawData ? <pre style={preStyle}>{toPrettyJson(schoolBootstrap)}</pre> : null}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>School/class context</div>
            {showRawData ? <pre style={preStyle}>{toPrettyJson(schoolContext)}</pre> : null}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>Demo class seed</div>
            {showRawData ? <pre style={preStyle}>{toPrettyJson(demoClassData)}</pre> : null}
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>Class overview report</div>
            <ClassReportSummary report={classReport} />
            {showRawData ? <pre style={preStyle}>{toPrettyJson(classReport)}</pre> : null}
          </div>
        </div>
      </div>
    </main>
  );
}
