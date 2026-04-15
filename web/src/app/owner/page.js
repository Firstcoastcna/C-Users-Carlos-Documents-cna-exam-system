"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  createOwnerAccessCode,
  createOwnerClassGroup,
  createOwnerSchool,
  fetchOwnerOverview,
  signOutStudent,
} from "../lib/backend/auth/browserAuth";

const shell = {
  maxWidth: 1120,
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
  alignItems: "flex-start",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
};

const headerActions = {
  display: "flex",
  alignItems: "flex-start",
  justifyContent: "flex-end",
  gap: 10,
  flexWrap: "wrap",
  marginLeft: "auto",
  alignSelf: "flex-start",
};

const title = {
  fontSize: 28,
  fontWeight: 800,
  color: "var(--heading)",
};

const body = {
  padding: 20,
  display: "grid",
  gap: 16,
};

const sectionTitle = {
  fontWeight: 800,
  color: "var(--heading)",
  fontSize: 18,
};

const subText = {
  color: "#5a6b78",
  lineHeight: 1.6,
  fontSize: 14,
};

const summaryGrid = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 6,
};

const summaryRow = {
  display: "flex",
  alignItems: "center",
  flexWrap: "wrap",
  gap: 8,
};

const summaryCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 10,
  padding: "4px 8px",
  background: "var(--surface-soft)",
  display: "inline-flex",
  alignItems: "baseline",
  gap: 6,
  whiteSpace: "nowrap",
};

const summaryLabel = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#607282",
};

const summaryValue = {
  fontSize: 13,
  fontWeight: 800,
  color: "var(--heading)",
  lineHeight: 1.1,
};

const navGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 12,
};

const navCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 16,
  padding: 14,
  background: "#fcfeff",
  display: "grid",
  gap: 10,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 12,
  alignItems: "start",
};

const sectionCard = {
  border: "1px solid var(--chrome-border)",
  borderRadius: 16,
  background: "white",
  padding: 14,
  display: "grid",
  gap: 12,
};

const setupShell = {
  border: "1px solid var(--chrome-border)",
  borderRadius: 16,
  background: "white",
  overflow: "hidden",
};

const quickGlanceShell = {
  display: "grid",
  gap: 6,
  minWidth: "min(100%, 220px)",
};

const setupSummary = {
  cursor: "pointer",
  listStyle: "none",
  padding: "14px 16px",
};

const setupBody = {
  padding: "0 16px 16px",
  display: "grid",
  gap: 14,
};

const input = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: 10,
  border: "1px solid var(--chrome-border)",
  fontSize: 14,
  background: "white",
};

const buttonPrimary = {
  padding: "10px 13px",
  borderRadius: 10,
  border: "1px solid var(--brand-red)",
  background: "var(--brand-red)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const buttonSecondary = {
  ...buttonPrimary,
  background: "white",
  color: "#536779",
  border: "1px solid #cfdde6",
  padding: "8px 11px",
  fontSize: 13,
  borderRadius: 9,
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
};

const actionsRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

function InlineMessage({ tone = "info", children }) {
  const styles =
    tone === "error"
      ? { background: "#fff0ef", border: "1px solid #f4c5c0", color: "#9b1c1c" }
      : tone === "success"
        ? { background: "#eefaf3", border: "1px solid #b9e3c8", color: "#1e6a3b" }
        : { background: "#fff8eb", border: "1px solid #f0d59b", color: "#755200" };

  return <div style={{ padding: "12px 14px", borderRadius: 12, ...styles }}>{children}</div>;
}

function LabeledField({ label, children }) {
  return (
    <label style={{ display: "grid", gap: 8 }}>
      <span style={summaryLabel}>{label}</span>
      {children}
    </label>
  );
}

function HelperText({ children }) {
  return <div style={{ color: "#6b7c89", fontSize: 13, lineHeight: 1.55 }}>{children}</div>;
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
    <span style={{ color: "#607282", fontSize: 12.5, fontWeight: 700, flexShrink: 0 }}>
      {isNarrow ? (isOpen ? "Tap here to close" : "Tap here to open") : isOpen ? "Click here to close" : "Click here to open"}
    </span>
  );
}

export default function OwnerPage() {
  const [isNarrow, setIsNarrow] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [overview, setOverview] = useState(null);
  const [setupOpen, setSetupOpen] = useState(false);
  const [schoolForm, setSchoolForm] = useState({ name: "", slug: "" });
  const [classForm, setClassForm] = useState({ schoolId: "", name: "" });
  const [codeForm, setCodeForm] = useState({
    code: "",
    codeType: "independent",
    schoolId: "",
    classGroupId: "",
    maxRedemptions: "",
  });

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchOwnerOverview();
      setOverview(payload);
      setClassForm((prev) => ({
        ...prev,
        schoolId: prev.schoolId || payload.schools?.[0]?.id || "",
      }));
      setCodeForm((prev) => ({
        ...prev,
        schoolId: prev.schoolId || payload.schools?.[0]?.id || "",
        classGroupId: prev.classGroupId || payload.classGroups?.[0]?.id || "",
      }));
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load control center.");
    } finally {
      setLoading(false);
    }
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

  useEffect(() => {
    void loadOverview();
  }, []);

  useEffect(() => {
    if (!loading) {
      setShowLoadingNotice(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowLoadingNotice(true), 350);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const schools = overview?.schools || [];
  const classGroups = overview?.classGroups || [];
  const accessCodes = overview?.accessCodes || [];
  const redemptions = overview?.redemptions || [];
  const activeCodes = accessCodes.filter((item) => item.status === "active").length;

  async function runAction(action, okMessage) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(okMessage);
      await loadOverview();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to complete this action.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div
            style={{
              display: "grid",
              gap: 8,
              flex: "1 1 420px",
              minWidth: 0,
            }}
          >
            <div
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 12,
                flexWrap: "nowrap",
              }}
            >
              <div style={title}>Control Center</div>
              {isNarrow ? (
                <button
                  style={buttonSecondary}
                  onClick={async () => {
                    try {
                      await signOutStudent();
                    } catch {}
                    window.location.href = "/signin";
                  }}
                >
                  Sign out
                </button>
              ) : null}
            </div>
            <div style={subText}>
              Use this home page to move into the dedicated management pages for schools, students, and codes.
            </div>
            <div style={summaryRow}>
              <div style={{ ...summaryLabel, fontSize: 10, whiteSpace: "nowrap" }}>Quick Glance</div>
              <div style={summaryGrid}>
                <div style={summaryCard}>
                  <div style={summaryLabel}>Schools</div>
                  <div style={summaryValue}>{overview?.summary?.schoolCount ?? 0}</div>
                </div>
                <div style={summaryCard}>
                  <div style={summaryLabel}>Classes</div>
                  <div style={summaryValue}>{overview?.summary?.classCount ?? 0}</div>
                </div>
                <div style={summaryCard}>
                  <div style={summaryLabel}>Codes</div>
                  <div style={summaryValue}>{activeCodes}</div>
                </div>
                <div style={summaryCard}>
                  <div style={summaryLabel}>Uses</div>
                  <div style={summaryValue}>{redemptions.length}</div>
                </div>
              </div>
            </div>
          </div>
          {!isNarrow ? (
            <div
              style={{
                ...headerActions,
                justifyContent: "flex-end",
              }}
            >
              <button
                style={buttonSecondary}
                onClick={async () => {
                  try {
                    await signOutStudent();
                  } catch {}
                  window.location.href = "/signin";
                }}
              >
                Sign out
              </button>
            </div>
          ) : null}
        </div>

        <div style={body}>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          {success ? <InlineMessage tone="success">{success}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading control center...</InlineMessage> : null}

          <div style={{ display: "grid", gap: 4 }}>
            <div style={sectionTitle}>Management lanes</div>
          </div>

          <details style={setupShell} open={setupOpen}>
            <summary
              style={setupSummary}
              onClick={(e) => {
                e.preventDefault();
                setSetupOpen((prev) => !prev);
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                <div style={{ display: "grid", gap: 4 }}>
                  <div style={sectionTitle}>Setup and creation</div>
                  <div style={subText}>Open this lane when you need to add a new school, class, or access code.</div>
                </div>
                <OpenHint isOpen={setupOpen} />
              </div>
            </summary>

            <div style={setupBody}>
              <div style={formGrid}>
                <div style={sectionCard}>
                  <div style={sectionTitle}>Create school</div>
                  <LabeledField label="School name">
                    <input
                      style={input}
                      value={schoolForm.name}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Gator CNA"
                    />
                  </LabeledField>
                  <LabeledField label="School ID">
                    <input
                      style={input}
                      value={schoolForm.slug}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="gatorcna"
                    />
                  </LabeledField>
                  <div style={actionsRow}>
                    <button
                      style={buttonPrimary}
                      disabled={busy}
                      onClick={() =>
                        runAction(async () => {
                          await createOwnerSchool(schoolForm);
                          setSchoolForm({ name: "", slug: "" });
                        }, "School saved.")
                      }
                    >
                      Save school
                    </button>
                  </div>
                </div>

                <div style={sectionCard}>
                  <div style={sectionTitle}>Create class</div>
                  <div style={subText}>
                    Create the actual teaching group here. Keep the class name fully descriptive, like &quot;May 2026 Day.&quot;
                  </div>
                  <LabeledField label="School">
                    <select
                      style={input}
                      value={classForm.schoolId}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, schoolId: e.target.value }))}
                    >
                      <option value="">Select school</option>
                      {schools.map((school) => (
                        <option key={school.id} value={school.id}>
                          {school.name}
                        </option>
                      ))}
                    </select>
                  </LabeledField>
                  <LabeledField label="Class name">
                    <input
                      style={input}
                      value={classForm.name}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="May 2026 Day"
                    />
                  </LabeledField>
                  <div style={actionsRow}>
                    <button
                      style={buttonPrimary}
                      disabled={busy}
                      onClick={() =>
                        runAction(async () => {
                          await createOwnerClassGroup(classForm);
                          setClassForm({ schoolId: schools[0]?.id || "", name: "" });
                        }, "Class saved.")
                      }
                    >
                      Save class
                    </button>
                  </div>
                </div>

                <div style={sectionCard}>
                  <div style={sectionTitle}>Create access code</div>
                  <LabeledField label="Type">
                    <select
                      style={input}
                      value={codeForm.codeType}
                      onChange={(e) =>
                        setCodeForm((prev) => ({
                          ...prev,
                          codeType: e.target.value,
                          schoolId: e.target.value === "independent" ? "" : prev.schoolId,
                          classGroupId: e.target.value === "independent" ? "" : prev.classGroupId,
                        }))
                      }
                    >
                      <option value="independent">Independent student</option>
                      <option value="class">Class code</option>
                    </select>
                  </LabeledField>
                  {codeForm.codeType === "class" ? (
                    <>
                      <LabeledField label="School">
                        <select
                          style={input}
                          value={codeForm.schoolId}
                          onChange={(e) =>
                            setCodeForm((prev) => ({
                              ...prev,
                              schoolId: e.target.value,
                              classGroupId: "",
                            }))
                          }
                        >
                          <option value="">Select school</option>
                          {schools.map((school) => (
                            <option key={school.id} value={school.id}>
                              {school.name}
                            </option>
                          ))}
                        </select>
                      </LabeledField>
                      <LabeledField label="Class">
                        <select
                          style={input}
                          value={codeForm.classGroupId}
                          onChange={(e) => setCodeForm((prev) => ({ ...prev, classGroupId: e.target.value }))}
                        >
                          <option value="">Select class</option>
                          {classGroups
                            .filter((item) => !codeForm.schoolId || item.school_id === codeForm.schoolId)
                            .map((item) => (
                              <option key={item.id} value={item.id}>
                                {item.name}
                              </option>
                            ))}
                        </select>
                      </LabeledField>
                    </>
                  ) : null}
                  <LabeledField label="Access code">
                    <input
                      style={input}
                      value={codeForm.code}
                      onChange={(e) => setCodeForm((prev) => ({ ...prev, code: e.target.value.toUpperCase() }))}
                      placeholder={codeForm.codeType === "independent" ? "FCCNA-SOLO-001" : "MAYDAY26"}
                    />
                  </LabeledField>
                  <LabeledField label="Max redemptions">
                    <input
                      style={input}
                      type="number"
                      min="1"
                      value={codeForm.maxRedemptions}
                      onChange={(e) => setCodeForm((prev) => ({ ...prev, maxRedemptions: e.target.value }))}
                      placeholder="Leave blank for unlimited"
                    />
                  </LabeledField>
                  <HelperText>
                    Use class codes for cohorts and more controlled codes for independent buyers. All code management lives on the dedicated Codes page.
                  </HelperText>
                  <div style={actionsRow}>
                    <button
                      style={buttonPrimary}
                      disabled={busy}
                      onClick={() =>
                        runAction(async () => {
                          await createOwnerAccessCode(codeForm);
                          setCodeForm({
                            code: "",
                            codeType: "independent",
                            schoolId: "",
                            classGroupId: "",
                            maxRedemptions: "",
                          });
                        }, "Access code saved.")
                      }
                    >
                      Save code
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </details>

          <div style={navGrid}>
            <div style={navCard}>
              <div style={sectionTitle}>Manage schools</div>
              <div style={subText}>
                Browse schools, open their classes, edit records, and launch class or student reports.
              </div>
              <Link href="/owner/schools" style={buttonSecondary}>
                Open schools
              </Link>
            </div>

            <div style={navCard}>
              <div style={sectionTitle}>Independent students</div>
              <div style={subText}>
                Review independent student activity and open student reports.
              </div>
              <Link href="/owner/independent" style={buttonSecondary}>
                Open independent students
              </Link>
            </div>

            <div style={navCard}>
              <div style={sectionTitle}>Manage codes</div>
              <div style={subText}>
                See all independent and class-based codes in one place, then edit, deactivate, reactivate, or delete them safely.
              </div>
              <Link href="/owner/codes" style={buttonSecondary}>
                Open codes
              </Link>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
