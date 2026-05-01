"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  assignOwnerStudentToClass,
  checkOwnerAccessCodeAvailability,
  createOwnerAccessCode,
  createOwnerClassGroup,
  createOwnerSchool,
  createOwnerUser,
  fetchOwnerOverview,
  removeOwnerClassEnrollment,
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

const teacherTitle = {
  fontSize: 23,
  fontWeight: 800,
  color: "var(--heading)",
  lineHeight: 1.2,
};

const teacherNameText = {
  color: "#5a6b78",
  fontSize: 18,
  lineHeight: 1.45,
  fontWeight: 700,
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

const teacherClassGrid = {
  display: "grid",
  gap: 12,
};

const teacherClassCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 16,
  padding: 14,
  background: "#fcfeff",
  display: "grid",
  gap: 10,
};

const teacherRosterCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  padding: 12,
  background: "white",
  display: "grid",
  gap: 8,
};

const teacherMetaText = {
  color: "#5a6b78",
  lineHeight: 1.5,
  fontSize: 13,
};

const teacherInlinePanel = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  padding: 12,
  background: "#f9fcfe",
  display: "grid",
  gap: 10,
};

const formGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
  gap: 12,
  alignItems: "start",
};

const tabsRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const tabButtonBase = {
  padding: "8px 12px",
  borderRadius: 999,
  fontSize: 13,
  fontWeight: 700,
  cursor: "pointer",
  border: "1px solid #cfdde6",
  background: "white",
  color: "#536779",
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

const buttonSecondaryActive = {
  ...buttonSecondary,
  border: "1px solid #d48c86",
  background: "#fff1f0",
  color: "#a22b25",
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

function formatDateTime(value) {
  if (!value) return "No time yet";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "No time yet";
  return date.toLocaleString([], {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
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
      {isNarrow ? (isOpen ? "Tap to close" : "Tap to open") : isOpen ? "Click to close" : "Click to open"}
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
  const [openTeacherClassPanels, setOpenTeacherClassPanels] = useState({});
  const [openTeacherLiveExamStudents, setOpenTeacherLiveExamStudents] = useState({});
  const [moveStudentForms, setMoveStudentForms] = useState({});
  const [confirmRemoveEnrollmentId, setConfirmRemoveEnrollmentId] = useState("");
  const [setupOpen, setSetupOpen] = useState(false);
  const [setupTab, setSetupTab] = useState("school");
  const [schoolForm, setSchoolForm] = useState({ name: "", slug: "" });
  const [classForm, setClassForm] = useState({
    schoolId: "",
    name: "",
    createCode: true,
    accessCode: "",
    maxRedemptions: "",
  });
  const [teacherCreateForm, setTeacherCreateForm] = useState({
    name: "",
    accessCode: "",
    maxRedemptions: "",
  });
  const [teacherCreateOpen, setTeacherCreateOpen] = useState(false);
  const [classCodeAvailability, setClassCodeAvailability] = useState({ status: "idle", message: "" });
  const [manualCodeAvailability, setManualCodeAvailability] = useState({ status: "idle", message: "" });
  const [teacherCodeAvailability, setTeacherCodeAvailability] = useState({ status: "idle", message: "" });
  const [codeForm, setCodeForm] = useState({
    code: "",
    codeType: "independent",
    schoolId: "",
    classGroupId: "",
    maxRedemptions: "",
  });
  const [userForm, setUserForm] = useState({
    fullName: "",
    email: "",
    role: "student",
    schoolId: "",
    classGroupId: "",
    assignToClass: false,
    accessCodeId: "",
  });

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchOwnerOverview();
      setOverview(payload);
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
  const schoolTeachers = overview?.schoolTeachers || [];
  const viewerRole = overview?.owner?.appUser?.account_role
    ? String(overview.owner.appUser.account_role).toLowerCase()
    : "";
  const roleReady = !loading && !!viewerRole;
  const isOwner = viewerRole === "owner";
  const isSchoolAdmin = viewerRole === "school_admin";
  const isTeacher = viewerRole === "teacher";
  const viewerName =
    overview?.owner?.appUser?.full_name ||
    overview?.owner?.email ||
    (isTeacher ? "Teacher" : isSchoolAdmin ? "School admin" : "Owner");
  const viewerSchoolName =
    schools.length === 1
      ? schools[0]?.name || "Your school"
      : schools.length > 1
        ? `${schools.length} schools`
        : "Your school";

  useEffect(() => {
    if (!roleReady || !isTeacher) return;
    if (typeof window === "undefined") return;

    const params = new URLSearchParams(window.location.search || "");
    const classGroupId = String(params.get("class_group_id") || "").trim();
    const openPanel = String(params.get("open") || "").trim();
    if (!classGroupId) return;

    setOpenTeacherClassPanels((prev) => ({
      ...prev,
      [classGroupId]: openPanel || "roster",
    }));

    const timer = window.setTimeout(() => {
      document.getElementById(`teacher-class-${classGroupId}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [roleReady, isTeacher]);
  const scopedSchoolId = schools.length === 1 ? String(schools[0]?.id || "") : "";
  const schoolAdminClassGroups = isSchoolAdmin
    ? classGroups.filter((item) => item.school_id === scopedSchoolId)
    : [];
  const activeCodes = accessCodes.filter((item) => item.status === "active").length;
  const independentAccessCodes = accessCodes.filter(
    (item) => item.status === "active" && item.code_type === "independent" && !item.class_group_id
  );
  const teacherClasses = classGroups;
  const summaryCounts = roleReady
    ? {
        schoolCount: overview?.summary?.schoolCount ?? 0,
        classCount: overview?.summary?.classCount ?? 0,
      }
    : null;

  useEffect(() => {
    if (!roleReady) return;
    if (!isOwner && setupTab === "school") {
      setSetupTab("class");
    }
  }, [isOwner, roleReady, setupTab]);

  useEffect(() => {
    const nextCode = String(classForm.accessCode || "").trim().toUpperCase();
    if (!classForm.createCode || !nextCode) {
      setClassCodeAvailability({ status: "idle", message: "" });
      return undefined;
    }

    let cancelled = false;
    setClassCodeAvailability({ status: "checking", message: "Checking code..." });
    const timer = window.setTimeout(async () => {
      try {
        const payload = await checkOwnerAccessCodeAvailability(nextCode);
        if (cancelled) return;
        setClassCodeAvailability(
          payload?.exists
            ? { status: "taken", message: "That code is already in use. Choose a different one." }
            : { status: "available", message: "Code available." }
        );
      } catch {
        if (cancelled) return;
        setClassCodeAvailability({ status: "idle", message: "" });
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [classForm.accessCode, classForm.createCode]);

  useEffect(() => {
    const nextCode = String(codeForm.code || "").trim().toUpperCase();
    if (!nextCode) {
      setManualCodeAvailability({ status: "idle", message: "" });
      return undefined;
    }

    let cancelled = false;
    setManualCodeAvailability({ status: "checking", message: "Checking code..." });
    const timer = window.setTimeout(async () => {
      try {
        const payload = await checkOwnerAccessCodeAvailability(nextCode);
        if (cancelled) return;
        setManualCodeAvailability(
          payload?.exists
            ? { status: "taken", message: "That code is already in use. Choose a different one." }
            : { status: "available", message: "Code available." }
        );
      } catch {
        if (cancelled) return;
        setManualCodeAvailability({ status: "idle", message: "" });
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [codeForm.code]);

  useEffect(() => {
    const nextCode = String(teacherCreateForm.accessCode || "").trim().toUpperCase();
    if (!nextCode) {
      setTeacherCodeAvailability({ status: "idle", message: "" });
      return undefined;
    }

    let cancelled = false;
    setTeacherCodeAvailability({ status: "checking", message: "Checking code..." });
    const timer = window.setTimeout(async () => {
      try {
        const payload = await checkOwnerAccessCodeAvailability(nextCode);
        if (cancelled) return;
        setTeacherCodeAvailability(
          payload?.exists
            ? { status: "taken", message: "That code is already in use. Choose a different one." }
            : { status: "available", message: "Code available." }
        );
      } catch {
        if (cancelled) return;
        setTeacherCodeAvailability({ status: "idle", message: "" });
      }
    }, 300);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [teacherCreateForm.accessCode]);

  async function runTeacherClassAction(action, okMessage) {
    setBusy(true);
    setError("");
    setSuccess("");
    try {
      await action();
      setSuccess(okMessage);
      await loadOverview();
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to complete this class action.");
    } finally {
      setBusy(false);
    }
  }

  function toggleTeacherClassPanel(classId, panel) {
    setOpenTeacherClassPanels((prev) => ({
      ...prev,
      [classId]: prev[classId] === panel ? "" : panel,
    }));
  }

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
              <div style={(isTeacher || isSchoolAdmin) && roleReady ? teacherTitle : title}>
                {(isTeacher || isSchoolAdmin) && roleReady ? `${viewerSchoolName} | Control Center` : "Control Center"}
              </div>
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
            {roleReady && (isTeacher || isSchoolAdmin) ? (
              <div style={{ display: "grid", gap: 2 }}>
                <div style={teacherNameText}>{viewerName}</div>
              </div>
            ) : null}
            <div style={subText}>
              {!roleReady
                ? "Loading your Control Center access..."
                : isTeacher
                ? "Open your assigned classes, class rosters, and student reports."
                : isSchoolAdmin
                ? "Use this home page to manage classes, staff, students, and codes for your school."
                : "Use this home page to move into the dedicated management pages for schools, students, and codes."}
            </div>
            <div style={summaryRow}>
              <div style={summaryGrid}>
                {roleReady && isTeacher ? (
                  <div style={summaryCard}>
                    <div style={summaryLabel}>Assigned classes</div>
                    <div style={summaryValue}>{summaryCounts?.classCount ?? 0}</div>
                  </div>
                ) : roleReady && isSchoolAdmin ? (
                  <>
                    <div style={summaryCard}>
                      <div style={summaryLabel}>Classes</div>
                      <div style={summaryValue}>{summaryCounts?.classCount ?? 0}</div>
                    </div>
                    <div style={summaryCard}>
                      <div style={summaryLabel}>Teachers</div>
                      <div style={summaryValue}>{schoolTeachers.length}</div>
                    </div>
                    <Link
                      href={`/owner/reports?scope=school&school_id=${encodeURIComponent(
                        scopedSchoolId
                      )}&school_name=${encodeURIComponent(viewerSchoolName)}&lang=en&from=owner`}
                      style={{
                        ...buttonSecondary,
                        borderColor: "var(--brand-red)",
                        color: "var(--brand-red)",
                        fontWeight: 800,
                        whiteSpace: "nowrap",
                      }}
                    >
                      School report
                    </Link>
                  </>
                ) : roleReady ? (
                  <>
                    <div style={{ ...summaryLabel, fontSize: 10, whiteSpace: "nowrap" }}>Quick Glance</div>
                    <div style={summaryCard}>
                      <div style={summaryLabel}>Schools</div>
                      <div style={summaryValue}>{summaryCounts?.schoolCount ?? 0}</div>
                    </div>
                    <div style={summaryCard}>
                      <div style={summaryLabel}>Classes</div>
                      <div style={summaryValue}>{summaryCounts?.classCount ?? 0}</div>
                    </div>
                  </>
                ) : null}
                {roleReady && !isTeacher && !isSchoolAdmin ? (
                  <>
                    <div style={summaryCard}>
                      <div style={summaryLabel}>Codes</div>
                      <div style={summaryValue}>{activeCodes}</div>
                    </div>
                    <div style={summaryCard}>
                      <div style={summaryLabel}>Uses</div>
                      <div style={summaryValue}>{redemptions.length}</div>
                    </div>
                  </>
                ) : null}
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

          {roleReady && !isTeacher ? (
            <div style={{ display: "grid", gap: 4 }}>
              <div style={sectionTitle}>Management lanes</div>
            </div>
          ) : null}

          {roleReady && !isTeacher ? (
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
                  <div style={subText}>
                    {isOwner
                      ? "Open this lane when you need to add a new school, class, or access code."
                      : "Open this lane when you need to add classes, access codes, students, or staff for your school."}
                  </div>
                </div>
                <OpenHint isOpen={setupOpen} />
              </div>
            </summary>

            <div style={setupBody}>
              <div style={tabsRow}>
                {[
                  ...(isOwner ? [["school", "School"]] : []),
                  ["class", "Class"],
                  ["code", "Access code"],
                  ["user", "User"],
                ].map(([key, label]) => {
                  const active = setupTab === key;
                  return (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setSetupTab(key)}
                      style={{
                        ...tabButtonBase,
                        background: active ? "var(--heading)" : "white",
                        color: active ? "white" : "#536779",
                        border: active ? "1px solid var(--heading)" : "1px solid #cfdde6",
                      }}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>

              <div style={formGrid}>
                {setupTab === "school" && isOwner ? (
                  <div style={sectionCard}>
                  <div style={sectionTitle}>Create school</div>
                  <LabeledField label="School name">
                    <input
                      style={input}
                      value={schoolForm.name}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="First Coast CNA"
                    />
                  </LabeledField>
                  <LabeledField label="School ID">
                    <input
                      style={input}
                      value={schoolForm.slug}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, slug: e.target.value }))}
                      placeholder="fccna-01"
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
                ) : null}

                {setupTab === "class" ? (
                  <div style={sectionCard}>
                  <div style={sectionTitle}>Create class</div>
                  <div style={subText}>
                    Create the actual teaching group here. Keep the class name fully descriptive, like &quot;May 2026 Day.&quot;
                  </div>
                  <LabeledField label="School">
                    {isSchoolAdmin ? (
                      <input style={{ ...input, background: "#f7fafc", color: "#445565" }} value={viewerSchoolName} readOnly />
                    ) : (
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
                    )}
                  </LabeledField>
                  <LabeledField label="Class name">
                    <input
                      style={input}
                      value={classForm.name}
                      onChange={(e) => setClassForm((prev) => ({ ...prev, name: e.target.value }))}
                      placeholder="Morning Class"
                    />
                  </LabeledField>
                  <label style={{ display: "flex", gap: 10, alignItems: "center", color: "#445565", fontSize: 14 }}>
                    <input
                      type="checkbox"
                      checked={classForm.createCode}
                      onChange={(e) =>
                        setClassForm((prev) => ({
                          ...prev,
                          createCode: e.target.checked,
                        }))
                      }
                    />
                    <span>Create the first access code for this class now</span>
                  </label>
                  {classForm.createCode ? (
                    <>
                      <LabeledField label="Access code">
                        <input
                          style={input}
                          value={classForm.accessCode}
                          onChange={(e) =>
                            setClassForm((prev) => ({ ...prev, accessCode: e.target.value.toUpperCase() }))
                          }
                          placeholder="SPRING-01"
                        />
                      </LabeledField>
                      {classCodeAvailability.message ? (
                        <HelperText>
                          <span style={{ color: classCodeAvailability.status === "taken" ? "var(--brand-red)" : classCodeAvailability.status === "available" ? "#1f6f3d" : "#6b7c89" }}>
                            {classCodeAvailability.message}
                          </span>
                        </HelperText>
                      ) : null}
                      <LabeledField label="Max redemptions">
                        <input
                          style={input}
                          type="number"
                          min="1"
                          value={classForm.maxRedemptions}
                          onChange={(e) =>
                            setClassForm((prev) => ({ ...prev, maxRedemptions: e.target.value }))
                          }
                          placeholder="Leave blank for unlimited"
                        />
                      </LabeledField>
                      <HelperText>
                        This creates the student code for this class right away, so you do not need to reselect the school and class again in the code tab.
                      </HelperText>
                    </>
                  ) : null}
                  <div style={actionsRow}>
                    <button
                      style={
                        busy || (classForm.createCode && ["checking", "taken"].includes(classCodeAvailability.status))
                          ? {
                              ...buttonPrimary,
                              opacity: 0.55,
                              cursor: "not-allowed",
                            }
                          : buttonPrimary
                      }
                      disabled={busy || (classForm.createCode && ["checking", "taken"].includes(classCodeAvailability.status))}
                      onClick={() =>
                        runAction(async () => {
                          const targetSchoolId = isSchoolAdmin ? scopedSchoolId : classForm.schoolId;
                          if (classForm.createCode && !classForm.accessCode.trim()) {
                            throw new Error("Enter an access code, or turn off code creation for now.");
                          }
                          if (classForm.createCode) {
                            const availability = await checkOwnerAccessCodeAvailability(classForm.accessCode);
                            if (availability?.exists) {
                              throw new Error("That code is already in use. Choose a different one.");
                            }
                          }

                          const classResult = await createOwnerClassGroup({
                            schoolId: targetSchoolId,
                            name: classForm.name,
                          });

                          if (classForm.createCode && classForm.accessCode) {
                            await createOwnerAccessCode({
                              code: classForm.accessCode,
                              codeType: "class",
                              schoolId: targetSchoolId,
                              classGroupId: classResult?.classGroup?.id,
                              maxRedemptions: classForm.maxRedemptions,
                            });
                          }

                          setClassForm({
                            schoolId: isSchoolAdmin ? scopedSchoolId : "",
                            name: "",
                            createCode: true,
                            accessCode: "",
                            maxRedemptions: "",
                          });
                        }, classForm.createCode && classForm.accessCode ? "Class and access code saved." : "Class saved.")
                      }
                    >
                      {classForm.createCode ? "Save class and code" : "Save class"}
                    </button>
                  </div>
                </div>
                ) : null}

                {setupTab === "code" ? (
                  <div style={sectionCard}>
                  <div style={sectionTitle}>Create access code</div>
                  {isSchoolAdmin ? (
                    <LabeledField label="School">
                      <input style={{ ...input, background: "#f7fafc", color: "#445565" }} value={viewerSchoolName} readOnly />
                    </LabeledField>
                  ) : null}
                  <LabeledField label="Type">
                    <select
                      style={input}
                      value={codeForm.codeType}
                      onChange={(e) =>
                        setCodeForm((prev) => ({
                          ...prev,
                          codeType: e.target.value,
                          schoolId:
                            e.target.value === "independent"
                              ? isSchoolAdmin
                                ? scopedSchoolId
                                : ""
                              : prev.schoolId,
                          classGroupId: e.target.value === "independent" ? "" : prev.classGroupId,
                        }))
                      }
                      disabled={false}
                    >
                      <option value="independent">Independent student</option>
                      <option value="class">Class code</option>
                    </select>
                  </LabeledField>
                  {codeForm.codeType === "class" ? (
                    <>
                      {!isSchoolAdmin ? (
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
                      ) : null}
                      <LabeledField label="Class">
                        <select
                          style={input}
                          value={codeForm.classGroupId}
                          disabled={!codeForm.schoolId}
                          onChange={(e) => setCodeForm((prev) => ({ ...prev, classGroupId: e.target.value }))}
                        >
                          <option value="">{codeForm.schoolId ? "Select class" : "Select school first"}</option>
                          {classGroups
                            .filter((item) => item.school_id === codeForm.schoolId)
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
                      placeholder={codeForm.codeType === "independent" ? "FCCNA-SOLO-001" : "SPRING-01"}
                    />
                  </LabeledField>
                  {manualCodeAvailability.message ? (
                    <HelperText>
                      <span style={{ color: manualCodeAvailability.status === "taken" ? "var(--brand-red)" : manualCodeAvailability.status === "available" ? "#1f6f3d" : "#6b7c89" }}>
                        {manualCodeAvailability.message}
                      </span>
                    </HelperText>
                  ) : null}
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
                    {isOwner
                      ? "Use class codes for cohorts and more controlled codes for independent buyers. All code management lives on the dedicated Codes page."
                      : "Use class codes for your school cohorts and independent codes for students who are not assigned to a class yet. All code management lives on the dedicated Codes page."}
                  </HelperText>
                  <div style={actionsRow}>
                    <button
                      style={
                        busy || ["checking", "taken"].includes(manualCodeAvailability.status)
                          ? {
                              ...buttonPrimary,
                              opacity: 0.55,
                              cursor: "not-allowed",
                            }
                          : buttonPrimary
                      }
                      disabled={busy || ["checking", "taken"].includes(manualCodeAvailability.status)}
                      onClick={() =>
                        runAction(async () => {
                          const nextCodeForm = isSchoolAdmin
                            ? {
                                ...codeForm,
                                schoolId: codeForm.codeType === "independent" ? scopedSchoolId : codeForm.schoolId,
                              }
                            : codeForm;
                          await createOwnerAccessCode(nextCodeForm);
                          setCodeForm({
                            code: "",
                            codeType: "independent",
                            schoolId: isSchoolAdmin ? scopedSchoolId : "",
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
                ) : null}

                {setupTab === "user" ? (
                  <div style={sectionCard}>
                  <div style={sectionTitle}>Create user</div>
                  <div style={subText}>
                    Create a real login through Supabase for a student, school admin, or teacher. Staff users will receive an invite email to set their password and use Admin Access.
                  </div>
                  <LabeledField label="Role">
                    <select
                      style={input}
                      value={userForm.role}
                      onChange={(e) =>
                        setUserForm((prev) => ({
                          ...prev,
                          role: e.target.value,
                          schoolId:
                            e.target.value === "school_admin" || e.target.value === "teacher"
                              ? isSchoolAdmin
                                ? scopedSchoolId
                                : ""
                              : prev.schoolId,
                          classGroupId: "",
                          assignToClass: e.target.value === "student" ? prev.assignToClass : false,
                          accessCodeId: e.target.value === "student" ? prev.accessCodeId : "",
                        }))
                      }
                    >
                      <option value="student">Student</option>
                      <option value="school_admin">School admin</option>
                      <option value="teacher">Teacher</option>
                    </select>
                  </LabeledField>
                  {userForm.role === "school_admin" || userForm.role === "teacher" ? (
                    isSchoolAdmin ? (
                      <LabeledField label="School">
                        <input style={{ ...input, background: "#f7fafc", color: "#445565" }} value={viewerSchoolName} readOnly />
                      </LabeledField>
                    ) : (
                    <LabeledField label="School">
                      <select
                        style={input}
                        value={userForm.schoolId}
                        onChange={(e) => setUserForm((prev) => ({ ...prev, schoolId: e.target.value }))}
                      >
                        <option value="">Select school</option>
                        {schools.map((school) => (
                          <option key={school.id} value={school.id}>
                            {school.name}
                          </option>
                        ))}
                      </select>
                    </LabeledField>
                    )
                  ) : null}
                  <LabeledField label="Full name">
                    <input
                      style={input}
                      value={userForm.fullName}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, fullName: e.target.value }))}
                      placeholder={
                        userForm.role === "school_admin"
                          ? "Admin Name"
                          : userForm.role === "teacher"
                            ? "Teacher Name"
                            : "Student Name"
                      }
                    />
                  </LabeledField>
                  <LabeledField label="Email">
                    <input
                      style={input}
                      type="email"
                      value={userForm.email}
                      onChange={(e) => setUserForm((prev) => ({ ...prev, email: e.target.value }))}
                      placeholder={
                        userForm.role === "school_admin"
                          ? "admin@example.com"
                          : userForm.role === "teacher"
                            ? "teacher@example.com"
                            : "student@example.com"
                      }
                    />
                  </LabeledField>
                  {userForm.role === "student" ? (
                    isSchoolAdmin ? (
                      <>
                        {userForm.assignToClass ? (
                          <LabeledField label="Class">
                            <select
                              style={input}
                              value={userForm.classGroupId}
                              onChange={(e) =>
                                setUserForm((prev) => ({
                                  ...prev,
                                  classGroupId: e.target.value,
                                  accessCodeId: "",
                                }))
                              }
                            >
                              <option value="">{schoolAdminClassGroups.length ? "Select class" : "Create a class first"}</option>
                              {schoolAdminClassGroups.map((item) => (
                                <option key={item.id} value={item.id}>
                                  {item.name}
                                </option>
                              ))}
                            </select>
                          </LabeledField>
                        ) : (
                          <>
                            <div style={subText}>
                              Independent students still need an access code on record. Pick the code you want assigned behind the scenes.
                            </div>
                            <LabeledField label="Independent access code">
                              <select
                                style={input}
                                value={userForm.accessCodeId}
                                onChange={(e) => setUserForm((prev) => ({ ...prev, accessCodeId: e.target.value }))}
                              >
                                <option value="">
                                  {independentAccessCodes.length ? "Select code" : "Create an independent code first"}
                                </option>
                                {independentAccessCodes.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.code}
                                    {item.max_redemptions != null ? ` (${item.redemption_count}/${item.max_redemptions})` : ""}
                                  </option>
                                ))}
                              </select>
                            </LabeledField>
                          </>
                        )}
                        <label style={{ display: "flex", gap: 10, alignItems: "center", color: "#445565", fontSize: 14 }}>
                          <input
                            type="checkbox"
                            checked={!userForm.assignToClass}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                assignToClass: !e.target.checked,
                                classGroupId: e.target.checked ? "" : prev.classGroupId,
                                accessCodeId: e.target.checked ? prev.accessCodeId : "",
                              }))
                            }
                          />
                          <span>Keep this student independent for now</span>
                        </label>
                      </>
                    ) : (
                      <>
                        <label style={{ display: "flex", gap: 10, alignItems: "center", color: "#445565", fontSize: 14 }}>
                          <input
                            type="checkbox"
                            checked={userForm.assignToClass}
                            onChange={(e) =>
                              setUserForm((prev) => ({
                                ...prev,
                                assignToClass: e.target.checked,
                                schoolId: e.target.checked ? prev.schoolId : "",
                                classGroupId: "",
                                accessCodeId: e.target.checked ? "" : prev.accessCodeId,
                              }))
                            }
                          />
                          <span>Assign this student to a school and class now</span>
                        </label>
                        {userForm.assignToClass ? (
                          <>
                            <div style={subText}>
                              Use this when the student already belongs to a specific class. Leave it off if the student should stay independent for now.
                            </div>
                            <LabeledField label="School">
                              <select
                                style={input}
                                value={userForm.schoolId}
                                onChange={(e) =>
                                  setUserForm((prev) => ({
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
                                value={userForm.classGroupId}
                                disabled={!userForm.schoolId}
                                onChange={(e) => setUserForm((prev) => ({ ...prev, classGroupId: e.target.value }))}
                              >
                                <option value="">{userForm.schoolId ? "Select class" : "Select school first"}</option>
                                {classGroups
                                  .filter((item) => item.school_id === userForm.schoolId)
                                  .map((item) => (
                                    <option key={item.id} value={item.id}>
                                      {item.name}
                                    </option>
                                  ))}
                              </select>
                            </LabeledField>
                          </>
                        ) : (
                          <>
                            <div style={subText}>
                              Independent students still need an access code on record. Pick the code you want assigned behind the scenes.
                            </div>
                            <LabeledField label="Independent access code">
                              <select
                                style={input}
                                value={userForm.accessCodeId}
                                onChange={(e) => setUserForm((prev) => ({ ...prev, accessCodeId: e.target.value }))}
                              >
                                <option value="">
                                  {independentAccessCodes.length ? "Select code" : "Create an independent code first"}
                                </option>
                                {independentAccessCodes.map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.code}
                                    {item.max_redemptions != null ? ` (${item.redemption_count}/${item.max_redemptions})` : ""}
                                  </option>
                                ))}
                              </select>
                            </LabeledField>
                          </>
                        )}
                      </>
                    )
                  ) : null}
                  <HelperText>
                    {userForm.role === "school_admin"
                      ? "This school admin will receive an email invite to finish setup, then can use Control Center Access."
                      : userForm.role === "teacher"
                        ? "This teacher will receive an email invite to finish setup, then can use Control Center Access for their assigned classes."
                        : "This student will receive an email invite to set a password and then sign in normally."}
                  </HelperText>
                  <div style={actionsRow}>
                    <button
                      style={buttonPrimary}
                      disabled={busy}
                      onClick={() =>
                        runAction(async () => {
                          const nextUserForm = isSchoolAdmin
                            ? {
                                ...userForm,
                                schoolId:
                                  userForm.role === "school_admin" || userForm.role === "teacher"
                                    ? scopedSchoolId
                                    : userForm.classGroupId
                                      ? scopedSchoolId
                                      : "",
                                assignToClass: userForm.role === "student" ? Boolean(userForm.classGroupId) : userForm.assignToClass,
                              }
                            : userForm;
                          await createOwnerUser(nextUserForm);
                          setUserForm({
                            fullName: "",
                            email: "",
                            role: "student",
                            schoolId: "",
                            classGroupId: "",
                            assignToClass: false,
                            accessCodeId: "",
                          });
                        }, "User created.")
                      }
                    >
                      Save user
                    </button>
                  </div>
                </div>
                ) : null}
              </div>
            </div>
          </details>
          ) : null}

          {!roleReady ? (
            <div style={navCard}>
              <div style={sectionTitle}>Loading your workspace</div>
              <div style={subText}>
                Bringing back your classes, roster actions, and reports.
              </div>
            </div>
          ) : isTeacher ? (
            <div style={teacherClassGrid}>
              <details style={teacherClassCard} open={teacherCreateOpen}>
                <summary
                  style={{ cursor: "pointer", listStyle: "none" }}
                  onClick={(e) => {
                    e.preventDefault();
                    setTeacherCreateOpen((prev) => !prev);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>Create a class</div>
                      <div style={subText}>
                        Create a new class inside your school and have it assigned to you automatically.
                      </div>
                    </div>
                    <OpenHint isOpen={teacherCreateOpen} />
                  </div>
                </summary>
                {teacherCreateOpen ? (
                  <div style={{ display: "grid", gap: 12 }}>
                    <LabeledField label="Class name">
                      <input
                        style={input}
                        value={teacherCreateForm.name}
                        onChange={(e) => setTeacherCreateForm((prev) => ({ ...prev, name: e.target.value }))}
                        placeholder="Morning Class"
                      />
                    </LabeledField>
                    <LabeledField label="Class code">
                      <input
                        style={input}
                        value={teacherCreateForm.accessCode}
                        onChange={(e) =>
                          setTeacherCreateForm((prev) => ({ ...prev, accessCode: e.target.value.toUpperCase() }))
                        }
                        placeholder="SPRING-01"
                      />
                    </LabeledField>
                    {teacherCodeAvailability.message ? (
                      <HelperText>
                        <span style={{ color: teacherCodeAvailability.status === "taken" ? "var(--brand-red)" : teacherCodeAvailability.status === "available" ? "#1f6f3d" : "#6b7c89" }}>
                          {teacherCodeAvailability.message}
                        </span>
                      </HelperText>
                    ) : null}
                    <LabeledField label="Max redemptions">
                      <input
                        style={input}
                        type="number"
                        min="1"
                        value={teacherCreateForm.maxRedemptions}
                        onChange={(e) =>
                          setTeacherCreateForm((prev) => ({ ...prev, maxRedemptions: e.target.value }))
                        }
                        placeholder="Leave blank for unlimited"
                      />
                    </LabeledField>
                    <HelperText>
                      This code will be tied only to the class you are creating.
                    </HelperText>
                    <div style={actionsRow}>
                      <button
                        style={
                          busy || ["checking", "taken"].includes(teacherCodeAvailability.status)
                            ? {
                                ...buttonPrimary,
                                opacity: 0.55,
                                cursor: "not-allowed",
                              }
                            : buttonPrimary
                        }
                        disabled={busy || ["checking", "taken"].includes(teacherCodeAvailability.status)}
                        onClick={() =>
                          runTeacherClassAction(async () => {
                            if (!scopedSchoolId) {
                              throw new Error("Your school could not be resolved yet.");
                            }
                            if (!teacherCreateForm.accessCode.trim()) {
                              throw new Error("Enter the class code for this new class.");
                            }
                            const availability = await checkOwnerAccessCodeAvailability(teacherCreateForm.accessCode);
                            if (availability?.exists) {
                              throw new Error("That code is already in use. Choose a different one.");
                            }

                            const classResult = await createOwnerClassGroup({
                              schoolId: scopedSchoolId,
                              name: teacherCreateForm.name,
                            });

                            await createOwnerAccessCode({
                              code: teacherCreateForm.accessCode,
                              codeType: "class",
                              schoolId: scopedSchoolId,
                              classGroupId: classResult?.classGroup?.id,
                              maxRedemptions: teacherCreateForm.maxRedemptions,
                            });

                            setTeacherCreateForm({
                              name: "",
                              accessCode: "",
                              maxRedemptions: "",
                            });
                            setTeacherCreateOpen(false);
                          }, "Class and code saved.")
                        }
                      >
                        Save class and code
                      </button>
                    </div>
                  </div>
                ) : null}
              </details>
              <div style={sectionTitle}>My classes</div>
              {teacherClasses.length ? (
                teacherClasses.map((item) => (
                  <div key={item.id} id={`teacher-class-${item.id}`} style={teacherClassCard}>
                    {(() => {
                      const liveExamRows = (item.roster || []).filter((row) => row.studentSummary?.liveExam);
                      const activePanel = openTeacherClassPanels[item.id] || "";
                      return (
                        <>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>{item.name}</div>
                      <div style={subText}>
                        {(item.roster || []).length} student{(item.roster || []).length === 1 ? "" : "s"} enrolled
                      </div>
                    </div>
                    <div style={actionsRow}>
                      <button
                        type="button"
                        style={activePanel === "roster" ? buttonSecondaryActive : buttonSecondary}
                        onClick={() => toggleTeacherClassPanel(item.id, "roster")}
                      >
                        {activePanel === "roster" ? "Close roster" : "Class roster"}
                      </button>
                      <button
                        type="button"
                        style={activePanel === "live" ? buttonSecondaryActive : buttonSecondary}
                        onClick={() => toggleTeacherClassPanel(item.id, "live")}
                      >
                        {activePanel === "live"
                          ? "Close live exams"
                          : `Live exams${liveExamRows.length ? ` (${liveExamRows.length})` : ""}`}
                      </button>
                      <Link
                        href={`/owner/reports?scope=class&class_group_id=${encodeURIComponent(
                          item.id
                        )}&school_id=${encodeURIComponent(item.school_id || "")}&class_name=${encodeURIComponent(
                          item.name || ""
                        )}&lang=en&from=owner-home&open=${encodeURIComponent(activePanel || "class")}`}
                        style={buttonSecondary}
                      >
                        Class report
                      </Link>
                    </div>
                    {activePanel === "live" ? (
                      <div style={teacherInlinePanel}>
                        {liveExamRows.length ? (
                          liveExamRows.map((row) => {
                            const liveExam = row.studentSummary?.liveExam;
                            const isLiveExamStudentOpen = openTeacherLiveExamStudents[item.id] === row.id;
                            return (
                              <div key={`live-${row.id}`} style={teacherRosterCard}>
                                <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                                  <div style={{ display: "grid", gap: 4 }}>
                                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                                      {row.user?.full_name || row.user?.email || row.user_id}
                                    </div>
                                    <div style={teacherMetaText}>
                                      {row.user?.email || "No email on file"} | Live exam in progress
                                    </div>
                                  </div>
                                  <button
                                    type="button"
                                    style={isLiveExamStudentOpen ? buttonSecondaryActive : buttonSecondary}
                                    onClick={() =>
                                      setOpenTeacherLiveExamStudents((prev) => ({
                                        ...prev,
                                        [item.id]: prev[item.id] === row.id ? "" : row.id,
                                      }))
                                    }
                                  >
                                    {isLiveExamStudentOpen ? "Close student" : "Open student"}
                                  </button>
                                </div>
                                {isLiveExamStudentOpen ? (
                                  <>
                                    <div style={teacherMetaText}>
                                      Current score: {Number.isFinite(liveExam?.currentScore) ? `${liveExam.currentScore}%` : "No score yet"} | Answered:{" "}
                                      {liveExam?.answeredCount ?? 0}/{liveExam?.questionCount ?? 0} | Started: {formatDateTime(liveExam?.startedAt)}
                                    </div>
                                    <div style={teacherMetaText}>
                                      Weakest category: {liveExam?.weakestCategory?.categoryId || "No clear category yet"} | Weakest chapter:{" "}
                                      {liveExam?.weakestChapter?.chapterId ? `Chapter ${liveExam.weakestChapter.chapterId}` : "No clear chapter yet"}
                                    </div>
                                    {(liveExam?.chapterBreakdown || []).length ? (
                                      <div
                                        style={{
                                          display: "grid",
                                          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
                                          gap: 8,
                                        }}
                                      >
                                        {liveExam.chapterBreakdown.map((chapter) => (
                                          <div
                                            key={`live-exam-chapter-${row.id}-${chapter.chapterId}`}
                                            style={{
                                              ...teacherRosterCard,
                                              padding: 10,
                                              gap: 4,
                                            }}
                                          >
                                            <div style={{ fontWeight: 800, color: "var(--heading)" }}>Chapter {chapter.chapterId}</div>
                                            <div style={teacherMetaText}>Score: {Number.isFinite(chapter.percent) ? `${chapter.percent}%` : "No data yet"}</div>
                                            <div style={teacherMetaText}>Answered: {chapter.answeredCount ?? 0}/{chapter.totalQuestions ?? 0}</div>
                                            <div style={teacherMetaText}>Correct: {chapter.correctCount ?? 0}</div>
                                          </div>
                                        ))}
                                      </div>
                                    ) : null}
                                  </>
                                ) : null}
                              </div>
                            );
                          })
                        ) : (
                          <div style={teacherMetaText}>No live exams in progress right now.</div>
                        )}
                      </div>
                    ) : null}
                    {activePanel === "roster" ? (
                      (item.roster || []).length ? (
                        <div style={{ display: "grid", gap: 8 }}>
                          {(item.roster || []).map((row) => {
                            const rankedCategories = Array.isArray(row.studentSummary?.latestExamAnalytics?.categoryPriority)
                              ? row.studentSummary.latestExamAnalytics.categoryPriority
                              : [];
                            const weakestCategory =
                              rankedCategories.find((entry) => entry?.is_high_risk && entry?.level !== "Strong") ||
                              rankedCategories.find((entry) => entry?.level === "Weak" || entry?.level === "Developing") ||
                              rankedCategories.find((entry) => entry?.level !== "Strong") ||
                              rankedCategories[0] ||
                              null;
                            const chapterGuidance = Array.isArray(row.studentSummary?.latestExamAnalytics?.chapterGuidance)
                              ? row.studentSummary.latestExamAnalytics.chapterGuidance
                              : [];
                            const topChapter = chapterGuidance[0] || null;
                            const overallStatus =
                              row.studentSummary?.latestExamAnalytics?.overallStatus || "No exam information yet";

                            return (
                              <div key={row.id} style={teacherRosterCard}>
                                <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                                  {row.user?.full_name || row.user?.email || row.user_id}
                                </div>
                                <div style={teacherMetaText}>
                                  {row.user?.email || "No email on file"} | {row.status || "active"}
                                </div>
                                <div style={teacherMetaText}>
                                  Status: {overallStatus} | Avg exam:{" "}
                                  {Number.isFinite(row.studentSummary?.exams?.averageScore)
                                    ? `${row.studentSummary.exams.averageScore}%`
                                    : "No data yet"}{" "}
                                  | Exams complete: {row.studentSummary?.exams?.completedAttempts ?? 0} | Exams live:{" "}
                                  {row.studentSummary?.liveExam ? 1 : 0} | Practice: {row.studentSummary?.practice?.totalSessions ?? 0} | Remediation:{" "}
                                  {row.studentSummary?.remediation?.totalSessions ?? 0}
                                </div>
                                <div style={teacherMetaText}>
                                  Weakest category: {weakestCategory?.category_id || "No clear category yet"} | Weakest chapter:{" "}
                                  {topChapter?.chapter_id ? `Chapter ${topChapter.chapter_id}` : "No clear chapter yet"}
                                </div>
                                <div style={actionsRow}>
                                  <Link
                                    href={`/owner/reports?scope=student&user_id=${encodeURIComponent(
                                      row.user_id
                                    )}&school_id=${encodeURIComponent(item.school_id || "")}&class_group_id=${encodeURIComponent(
                                      item.id
                                    )}&class_name=${encodeURIComponent(item.name || "")}&lang=en&from=owner-home&open=roster`}
                                    style={buttonSecondary}
                                  >
                                    Student report
                                  </Link>
                                  <button
                                    type="button"
                                    style={buttonSecondary}
                                    disabled={busy}
                                    onClick={() =>
                                      setMoveStudentForms((prev) => ({
                                        ...prev,
                                        [row.id]: {
                                          open: !prev[row.id]?.open,
                                          targetClassGroupId: "",
                                        },
                                      }))
                                    }
                                  >
                                    {moveStudentForms[row.id]?.open ? "Close move" : "Move class"}
                                  </button>
                                  <button
                                    type="button"
                                    style={{
                                      ...buttonSecondary,
                                      borderColor: confirmRemoveEnrollmentId === row.id ? "var(--brand-red)" : "#d48c86",
                                      background: confirmRemoveEnrollmentId === row.id ? "var(--brand-red)" : "#fff1f0",
                                      color: confirmRemoveEnrollmentId === row.id ? "white" : "#a22b25",
                                    }}
                                    disabled={busy}
                                    onClick={() => {
                                      if (confirmRemoveEnrollmentId === row.id) {
                                        void runTeacherClassAction(async () => {
                                          await removeOwnerClassEnrollment(row.id);
                                          setConfirmRemoveEnrollmentId("");
                                        }, "Student moved to independent access.");
                                        return;
                                      }
                                      setConfirmRemoveEnrollmentId(row.id);
                                    }}
                                  >
                                    {confirmRemoveEnrollmentId === row.id ? "Confirm remove" : "Remove from class"}
                                  </button>
                                  {confirmRemoveEnrollmentId === row.id ? (
                                    <button
                                      type="button"
                                      style={buttonSecondary}
                                      disabled={busy}
                                      onClick={() => setConfirmRemoveEnrollmentId("")}
                                    >
                                      Cancel
                                    </button>
                                  ) : null}
                                </div>
                                {moveStudentForms[row.id]?.open ? (
                                  <div style={teacherInlinePanel}>
                                    <div style={{ ...teacherMetaText, fontWeight: 700, color: "var(--heading)" }}>
                                      Move student to another one of your classes
                                    </div>
                                    <select
                                      style={input}
                                      value={moveStudentForms[row.id]?.targetClassGroupId || ""}
                                      onChange={(e) =>
                                        setMoveStudentForms((prev) => ({
                                          ...prev,
                                          [row.id]: {
                                            ...(prev[row.id] || {}),
                                            open: true,
                                            targetClassGroupId: e.target.value,
                                          },
                                        }))
                                      }
                                    >
                                      <option value="">Select class</option>
                                      {teacherClasses
                                        .filter((classItem) => classItem.id !== item.id)
                                        .map((classItem) => (
                                          <option key={classItem.id} value={classItem.id}>
                                            {classItem.name}
                                          </option>
                                        ))}
                                    </select>
                                    <div style={actionsRow}>
                                      <button
                                        type="button"
                                        style={buttonSecondary}
                                        disabled={!moveStudentForms[row.id]?.targetClassGroupId || busy}
                                        onClick={() =>
                                          void runTeacherClassAction(async () => {
                                            await assignOwnerStudentToClass({
                                              userId: row.user_id,
                                              classGroupId: moveStudentForms[row.id]?.targetClassGroupId,
                                            });
                                            setMoveStudentForms((prev) => ({
                                              ...prev,
                                              [row.id]: {
                                                open: false,
                                                targetClassGroupId: "",
                                              },
                                            }));
                                          }, "Student moved to the new class.")
                                        }
                                      >
                                        Save move
                                      </button>
                                      <button
                                        type="button"
                                        style={buttonSecondary}
                                        disabled={busy}
                                        onClick={() =>
                                          setMoveStudentForms((prev) => ({
                                            ...prev,
                                            [row.id]: {
                                              open: false,
                                              targetClassGroupId: "",
                                            },
                                          }))
                                        }
                                      >
                                        Cancel
                                      </button>
                                    </div>
                                  </div>
                                ) : null}
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={teacherMetaText}>No enrolled students yet.</div>
                      )
                    ) : null}
                        </>
                      );
                    })()}
                  </div>
                ))
              ) : (
                <div style={subText}>No classes are assigned to this teacher yet.</div>
              )}
            </div>
          ) : (
          <div style={navGrid}>
            <div style={navCard}>
              <div style={sectionTitle}>{isSchoolAdmin ? "Manage classes" : "Manage schools"}</div>
              <div style={subText}>
                {isSchoolAdmin
                  ? "Open all classes in your school, review rosters, manage teacher coverage, and launch reports."
                  : "Browse schools, open their classes, edit records, and launch class or student reports."}
              </div>
              <Link href="/owner/schools" style={buttonSecondary}>
                {isSchoolAdmin ? "Open classes" : "Open schools"}
              </Link>
            </div>

            {roleReady && (isOwner || isSchoolAdmin) ? (
              <div style={navCard}>
                <div style={sectionTitle}>Manage school staff</div>
                <div style={subText}>
                  Review school admin and teacher assignments, then adjust staff coverage inside your school when needed.
                </div>
                <Link href="/owner/admins" style={buttonSecondary}>
                  Open school staff
                </Link>
              </div>
            ) : null}

            {roleReady && !isTeacher ? (
            <div style={navCard}>
              <div style={sectionTitle}>Manage codes</div>
              <div style={subText}>
                See all independent and class-based codes in one place, then edit, deactivate, reactivate, or delete them safely.
              </div>
              <Link href="/owner/codes" style={buttonSecondary}>
                Open codes
              </Link>
            </div>
            ) : null}

            {roleReady && !isTeacher ? (
            <div style={navCard}>
              <div style={sectionTitle}>Independent students</div>
              <div style={subText}>
                Review independent student activity and open student reports.
              </div>
              <Link href="/owner/independent" style={buttonSecondary}>
                Open independent students
              </Link>
            </div>
            ) : null}

            {roleReady && isOwner ? (
            <div style={navCard}>
              <div style={sectionTitle}>User activity</div>
              <div style={subText}>
                See who is logging in, when they last connected, and how many times they have signed in so far.
              </div>
              <Link href="/owner/activity" style={buttonSecondary}>
                Open activity
              </Link>
            </div>
            ) : null}
          </div>
          )}
        </div>
      </div>
    </main>
  );
}
