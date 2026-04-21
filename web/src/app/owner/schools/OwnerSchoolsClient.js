"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  assignOwnerStudentToClass,
  assignOwnerTeacherToClass,
  clearOwnerClassEnrollments,
  createOwnerClassGroup,
  createOwnerSchool,
  deleteOwnerTeacherAssignment,
  deleteOwnerClassGroup,
  deleteOwnerSchool,
  fetchOwnerOverview,
  removeOwnerClassEnrollment,
} from "../../lib/backend/auth/browserAuth";

const EMPTY_ITEMS = [];

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
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
  flexWrap: "wrap",
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

const subText = {
  color: "#5a6b78",
  lineHeight: 1.6,
  fontSize: 14,
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
  justifyContent: "center",
};

const buttonTiny = {
  ...buttonSecondary,
  padding: "6px 9px",
  fontSize: 12,
  borderRadius: 8,
};

const buttonTinyWarning = {
  ...buttonTiny,
  border: "1px solid #d48c86",
  color: "#a22b25",
  background: "#fff1f0",
};

const buttonTinyDanger = {
  ...buttonTiny,
  border: "1px solid var(--brand-red)",
  color: "white",
  background: "var(--brand-red)",
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

const listCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  padding: 10,
  display: "grid",
  gap: 8,
  background: "#fcfeff",
};

const actionsRow = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const listMeta = {
  color: "#5a6b78",
  lineHeight: 1.45,
  fontSize: 12.5,
  margin: 0,
};

const chip = {
  padding: "5px 9px",
  borderRadius: 999,
  background: "#f3f8fb",
  border: "1px solid #d6e1e8",
  fontSize: 12,
  fontWeight: 700,
  color: "#486173",
};

const input = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: 10,
  border: "1px solid var(--chrome-border)",
  fontSize: 14,
  background: "white",
};

const editGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))",
  gap: 12,
  alignItems: "start",
};

const editCard = {
  border: "1px solid var(--chrome-border)",
  borderRadius: 16,
  background: "white",
  padding: 14,
  display: "grid",
  gap: 12,
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#607282",
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
      <span style={labelStyle}>{label}</span>
      {children}
    </label>
  );
}

function HelperText({ children }) {
  return <div style={{ color: "#6b7c89", fontSize: 13, lineHeight: 1.55 }}>{children}</div>;
}

function HintText({ isOpen }) {
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

export default function OwnerSchoolsClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [classMessage, setClassMessage] = useState("");
  const [classMessageTone, setClassMessageTone] = useState("info");
  const [overview, setOverview] = useState(null);
  const [schoolForm, setSchoolForm] = useState({ id: "", name: "", slug: "" });
  const [classForm, setClassForm] = useState({ id: "", schoolId: "", name: "" });
  const [confirmClearClassId, setConfirmClearClassId] = useState("");
  const [openSchoolId, setOpenSchoolId] = useState("");
  const [openClassPanels, setOpenClassPanels] = useState({});
  const [openRosterPanels, setOpenRosterPanels] = useState({});
  const [openCodePanels, setOpenCodePanels] = useState({});
  const [openTeacherPanels, setOpenTeacherPanels] = useState({});
  const [openRedemptionPanels, setOpenRedemptionPanels] = useState({});
  const [confirmRemoveEnrollmentId, setConfirmRemoveEnrollmentId] = useState("");
  const [moveStudentForms, setMoveStudentForms] = useState({});
  const [teacherForms, setTeacherForms] = useState({});
  const [classTeacherForms, setClassTeacherForms] = useState({});

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchOwnerOverview();
      setOverview(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load schools.");
    } finally {
      setLoading(false);
    }
  }

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

  const schools = overview?.schools ?? EMPTY_ITEMS;
  const classGroups = overview?.classGroups ?? EMPTY_ITEMS;
  const accessCodes = overview?.accessCodes ?? EMPTY_ITEMS;
  const redemptions = overview?.redemptions ?? EMPTY_ITEMS;
  const schoolAdmins = overview?.schoolAdmins ?? EMPTY_ITEMS;
  const schoolTeachers = overview?.schoolTeachers ?? EMPTY_ITEMS;
  const teacherClassAssignments = overview?.teacherClassAssignments ?? EMPTY_ITEMS;

  const classGroupsBySchool = useMemo(
    () =>
      classGroups.reduce((acc, item) => {
        if (!acc[item.school_id]) acc[item.school_id] = [];
        acc[item.school_id].push(item);
        return acc;
      }, {}),
    [classGroups]
  );

  const accessCodesByClassId = useMemo(
    () =>
      accessCodes.reduce((acc, item) => {
        if (!item.class_group_id) return acc;
        if (!acc[item.class_group_id]) acc[item.class_group_id] = [];
        acc[item.class_group_id].push(item);
        return acc;
      }, {}),
    [accessCodes]
  );

  const redemptionsByCodeId = useMemo(
    () =>
      redemptions.reduce((acc, row) => {
        if (!acc[row.access_code_id]) acc[row.access_code_id] = [];
        acc[row.access_code_id].push(row);
        return acc;
      }, {}),
    [redemptions]
  );

  const schoolAdminsBySchool = useMemo(
    () =>
      schoolAdmins.reduce((acc, item) => {
        if (!acc[item.school_id]) acc[item.school_id] = [];
        acc[item.school_id].push(item);
        return acc;
      }, {}),
    [schoolAdmins]
  );

  const schoolTeachersBySchool = useMemo(
    () =>
      schoolTeachers.reduce((acc, item) => {
        if (!acc[item.school_id]) acc[item.school_id] = [];
        acc[item.school_id].push(item);
        return acc;
      }, {}),
    [schoolTeachers]
  );

  const teacherAssignmentsByUserId = useMemo(
    () =>
      teacherClassAssignments.reduce((acc, item) => {
        if (!acc[item.user_id]) acc[item.user_id] = [];
        acc[item.user_id].push(item);
        return acc;
      }, {}),
    [teacherClassAssignments]
  );

  const teacherAssignmentsByClassId = useMemo(
    () =>
      teacherClassAssignments.reduce((acc, item) => {
        if (!acc[item.class_group_id]) acc[item.class_group_id] = [];
        acc[item.class_group_id].push(item);
        return acc;
      }, {}),
    [teacherClassAssignments]
  );

  useEffect(() => {
    const schoolId = searchParams.get("school_id");
    const classId = searchParams.get("class_group_id");
    const openPanel = searchParams.get("open");
    if (!schoolId && !classId) {
      return;
    }

    if (schoolId) {
      setOpenSchoolId(schoolId);
    }

    if (classId) {
      const matchedClass = classGroups.find((item) => item.id === classId);
      if (matchedClass?.school_id) {
        setOpenSchoolId(matchedClass.school_id);
      }
      setOpenClassPanels((prev) => ({ ...prev, [classId]: true }));
      if (openPanel === "roster") {
        setOpenRosterPanels((prev) => ({ ...prev, [classId]: true }));
      }
    }

    const targetId = classId ? `owner-class-${classId}` : schoolId ? `owner-school-${schoolId}` : "";
    if (!targetId) {
      return;
    }

    const timer = window.setTimeout(() => {
      document.getElementById(targetId)?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [searchParams, classGroups]);

  function resetSchoolForm() {
    setSchoolForm({ id: "", name: "", slug: "" });
  }

  function resetClassForm() {
    setClassForm({ id: "", schoolId: "", name: "" });
    setConfirmClearClassId("");
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

  async function runClassAction(action, okMessage) {
    setBusy(true);
    setClassMessage("");
    try {
      await action();
      setClassMessageTone("success");
      setClassMessage(okMessage);
      await loadOverview();
    } catch (nextError) {
      setClassMessageTone("error");
      setClassMessage(nextError instanceof Error ? nextError.message : "Unable to complete this class action.");
    } finally {
      setBusy(false);
    }
  }

  function toggleSchoolPanel(schoolId) {
    const nextOpen = openSchoolId !== schoolId;
    setOpenSchoolId(nextOpen ? schoolId : "");

    if (!nextOpen) {
      const classIds = (classGroupsBySchool[schoolId] || []).map((item) => item.id);
      setOpenClassPanels((prev) => {
        const next = { ...prev };
        classIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setOpenRosterPanels((prev) => {
        const next = { ...prev };
        classIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setOpenCodePanels((prev) => {
        const next = { ...prev };
        classIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setOpenTeacherPanels((prev) => ({ ...prev, [schoolId]: false }));
      setConfirmRemoveEnrollmentId("");
      setOpenRedemptionPanels((prev) => {
        const next = { ...prev };
        classIds.forEach((id) => {
          (accessCodesByClassId[id] || []).forEach((code) => {
            next[code.id] = false;
          });
        });
        return next;
      });
    } else {
      const otherSchoolIds = schools.map((item) => item.id).filter((id) => id !== schoolId);
      const otherClassIds = otherSchoolIds.flatMap((id) => (classGroupsBySchool[id] || []).map((item) => item.id));

      setOpenClassPanels((prev) => {
        const next = { ...prev };
        otherClassIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setOpenRosterPanels((prev) => {
        const next = { ...prev };
        otherClassIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setOpenCodePanels((prev) => {
        const next = { ...prev };
        otherClassIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setOpenTeacherPanels((prev) => {
        const next = { ...prev };
        otherSchoolIds.forEach((id) => {
          next[id] = false;
        });
        return next;
      });
      setConfirmRemoveEnrollmentId("");
      setOpenRedemptionPanels((prev) => {
        const next = { ...prev };
        otherClassIds.forEach((id) => {
          (accessCodesByClassId[id] || []).forEach((code) => {
            next[code.id] = false;
          });
        });
        return next;
      });
    }
  }

  function toggleClassPanel(classId) {
    setOpenClassPanels((prev) => ({ ...prev, [classId]: !prev[classId] }));
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={title}>Manage Schools</div>
            <div style={subText}>
              This lane is school-centered: open a school, then drill into its classes, codes, and reports.
            </div>
          </div>
          <Link href="/owner" style={buttonSecondary}>
            Control Center
          </Link>
        </div>

        <div style={body}>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          {success ? <InlineMessage tone="success">{success}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading schools...</InlineMessage> : null}

          {(schoolForm.id || classForm.id) && !loading ? (
            <div style={editGrid}>
              {schoolForm.id ? (
                <div style={editCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>Edit school</div>
                  <LabeledField label="School name">
                    <input
                      style={input}
                      value={schoolForm.name}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, name: e.target.value }))}
                    />
                  </LabeledField>
                  <LabeledField label="School ID">
                    <input
                      style={input}
                      value={schoolForm.slug}
                      onChange={(e) => setSchoolForm((prev) => ({ ...prev, slug: e.target.value }))}
                    />
                  </LabeledField>
                  <div style={actionsRow}>
                    <button
                      style={buttonPrimary}
                      disabled={busy}
                      onClick={() =>
                        runAction(async () => {
                          await createOwnerSchool(schoolForm);
                          resetSchoolForm();
                        }, "School updated.")
                      }
                    >
                      Update school
                    </button>
                    <button style={buttonSecondary} disabled={busy} onClick={resetSchoolForm}>
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {classForm.id ? (
                <div style={editCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>Edit class</div>
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
                    />
                  </LabeledField>
                  <HelperText>Use the full class name students and staff recognize.</HelperText>
                  <div
                    style={{
                      borderTop: "1px solid var(--chrome-border)",
                      paddingTop: 12,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 15 }}>Assigned teacher</div>
                    <div style={listMeta}>
                      {(teacherAssignmentsByClassId[classForm.id] || []).length
                        ? (teacherAssignmentsByClassId[classForm.id] || [])
                            .map((item) => item.user?.full_name || item.user?.email || item.user_id)
                            .join(", ")
                        : "No teacher assigned yet"}
                    </div>
                    {(teacherAssignmentsByClassId[classForm.id] || []).length ? (
                      <div style={actionsRow}>
                        {(teacherAssignmentsByClassId[classForm.id] || []).map((assignment) => (
                          <button
                            key={assignment.id}
                            style={buttonTinyWarning}
                            disabled={busy}
                            onClick={() =>
                              runAction(async () => {
                                await deleteOwnerTeacherAssignment(assignment.id);
                              }, "Teacher removed from class.")
                            }
                          >
                            Remove {assignment.user?.full_name || assignment.user?.email || "teacher"}
                          </button>
                        ))}
                      </div>
                    ) : null}
                    <LabeledField label="Assign or change teacher">
                      <select
                        style={input}
                        value={classTeacherForms[classForm.id]?.teacherId || ""}
                        onChange={(e) =>
                          setClassTeacherForms((prev) => ({
                            ...prev,
                            [classForm.id]: {
                              teacherId: e.target.value,
                            },
                          }))
                        }
                      >
                        <option value="">Select teacher</option>
                        {(schoolTeachersBySchool[classForm.schoolId] || []).map((teacher) => (
                          <option key={teacher.user_id} value={teacher.user_id}>
                            {teacher.user?.full_name || teacher.user?.email || teacher.user_id}
                          </option>
                        ))}
                      </select>
                    </LabeledField>
                    <div style={actionsRow}>
                      <button
                        style={buttonSecondary}
                        disabled={!classTeacherForms[classForm.id]?.teacherId || busy}
                        onClick={() =>
                          runAction(async () => {
                            await assignOwnerTeacherToClass({
                              teacherId: classTeacherForms[classForm.id]?.teacherId,
                              classGroupId: classForm.id,
                            });
                            setClassTeacherForms((prev) => ({
                              ...prev,
                              [classForm.id]: { teacherId: "" },
                            }));
                          }, "Teacher assigned to class.")
                        }
                      >
                        Save teacher assignment
                      </button>
                    </div>
                  </div>
                  <div style={actionsRow}>
                    <button
                      style={buttonPrimary}
                      disabled={busy}
                      onClick={() =>
                        runAction(async () => {
                          await createOwnerClassGroup(classForm);
                          resetClassForm();
                        }, "Class updated.")
                      }
                    >
                      Update class
                    </button>
                    <button style={buttonSecondary} disabled={busy} onClick={resetClassForm}>
                      Cancel
                    </button>
                  </div>
                  <div
                    style={{
                      borderTop: "1px solid var(--chrome-border)",
                      paddingTop: 12,
                      display: "grid",
                      gap: 10,
                    }}
                  >
                    <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 15 }}>Class management</div>
                    <HelperText>
                      Use these actions when you need to empty the roster or remove the class after it is no longer in use.
                    </HelperText>
                    {confirmClearClassId === classForm.id ? (
                      <InlineMessage tone="error">
                        <strong>Warning:</strong> `Clear enrollments` removes every student from this class at once. This is a serious bulk action, and putting those students back in the right place later may be difficult and time-consuming.
                      </InlineMessage>
                    ) : null}
                    <div style={actionsRow}>
                      <button
                        style={buttonSecondary}
                        disabled={busy}
                        onClick={() => {
                          if (confirmClearClassId === classForm.id) {
                            void runClassAction(async () => {
                              await clearOwnerClassEnrollments(classForm.id);
                              setConfirmClearClassId("");
                            }, "Class enrollments cleared.");
                            return;
                          }

                          setConfirmClearClassId(classForm.id);
                        }}
                      >
                        {confirmClearClassId === classForm.id ? "Confirm clear enrollments" : "Clear enrollments"}
                      </button>
                      {confirmClearClassId === classForm.id ? (
                        <button
                          style={buttonSecondary}
                          disabled={busy}
                          onClick={() => setConfirmClearClassId("")}
                        >
                          Cancel
                        </button>
                      ) : null}
                      <button
                        style={buttonSecondary}
                        disabled={busy}
                        onClick={() =>
                          runClassAction(async () => {
                            await deleteOwnerClassGroup(classForm.id);
                            resetClassForm();
                          }, "Class deleted.")
                        }
                      >
                        Delete class
                      </button>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}

          {classMessage ? <InlineMessage tone={classMessageTone}>{classMessage}</InlineMessage> : null}

          <div style={{ display: "grid", gap: 14 }}>
            {schools.length ? (
              schools.map((school) => (
                <details
                  key={school.id}
                  id={`owner-school-${school.id}`}
                  style={listCard}
                  open={openSchoolId === school.id}
                >
                  <summary
                    style={{ cursor: "pointer", listStyle: "none" }}
                    onClick={(e) => {
                      e.preventDefault();
                      toggleSchoolPanel(school.id);
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start" }}>
                      <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 17 }}>{school.name}</div>
                      <HintText isOpen={openSchoolId === school.id} />
                    </div>
                  </summary>

                  <div style={{ display: "grid", gap: 10 }}>
                    <div style={listMeta}>School ID: {school.slug || "Not set"}</div>
                    <div style={listMeta}>
                      School admin:{" "}
                      {(schoolAdminsBySchool[school.id] || []).length
                        ? (schoolAdminsBySchool[school.id] || [])
                            .map((item) => item.user?.full_name || item.user?.email || item.user_id)
                            .join(", ")
                        : "No school admin assigned"}
                    </div>
                    <div style={listMeta}>Teachers: {(schoolTeachersBySchool[school.id] || []).length}</div>
                    <div style={listMeta}>
                      {(classGroupsBySchool[school.id] || []).length} class
                      {(classGroupsBySchool[school.id] || []).length === 1 ? "" : "es"}
                    </div>
                    <div style={actionsRow}>
                      <Link
                        href={`/owner/reports?scope=school&school_id=${encodeURIComponent(
                          school.id
                        )}&school_name=${encodeURIComponent(school.name || "")}&lang=en&from=schools`}
                        style={buttonSecondary}
                      >
                        School report
                      </Link>
                      <button
                        style={buttonSecondary}
                        onClick={() =>
                          setOpenTeacherPanels((prev) => ({
                            ...prev,
                            [school.id]: !prev[school.id],
                          }))
                        }
                      >
                        {openTeacherPanels[school.id] ? "Close teachers" : "Teachers"}
                      </button>
                      <button
                        style={buttonSecondary}
                        disabled={busy}
                        onClick={() =>
                          setSchoolForm({
                            id: school.id,
                            name: school.name || "",
                            slug: school.slug || "",
                          })
                        }
                      >
                        Edit school
                      </button>
                      <button
                        style={buttonSecondary}
                        disabled={busy}
                        onClick={() =>
                          runAction(async () => {
                            await deleteOwnerSchool(school.id);
                          }, "School deleted.")
                        }
                      >
                        Delete school
                      </button>
                    </div>

                    {openTeacherPanels[school.id] ? (
                      (schoolTeachersBySchool[school.id] || []).length ? (
                        <div style={{ display: "grid", gap: 8 }}>
                          {(schoolTeachersBySchool[school.id] || []).map((teacher) => {
                            const assignments = teacherAssignmentsByUserId[teacher.user_id] || [];
                            const currentForm = teacherForms[teacher.user_id] || { classGroupId: "" };

                            return (
                              <div key={teacher.id} style={{ ...listCard, background: "white" }}>
                                <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                                  {teacher.user?.full_name || teacher.user?.email || teacher.user_id}
                                </div>
                                <div style={listMeta}>{teacher.user?.email || "No email on record"}</div>
                                <div style={listMeta}>
                                  Assigned classes:{" "}
                                  {assignments.length
                                    ? assignments.map((item) => item.classGroup?.name || item.class_group_id).join(", ")
                                    : "No classes assigned yet"}
                                </div>
                                {assignments.length ? (
                                  <div style={actionsRow}>
                                    {assignments.map((assignment) => (
                                      <button
                                        key={assignment.id}
                                        style={buttonTinyWarning}
                                        disabled={busy}
                                        onClick={() =>
                                          runAction(async () => {
                                            await deleteOwnerTeacherAssignment(assignment.id);
                                          }, "Teacher class assignment removed.")
                                        }
                                      >
                                        Remove {assignment.classGroup?.name || "class"}
                                      </button>
                                    ))}
                                  </div>
                                ) : null}
                                <div style={{ ...editCard, padding: 12 }}>
                                  <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 14 }}>Assign class</div>
                                  <LabeledField label="Class">
                                    <select
                                      style={input}
                                      value={currentForm.classGroupId || ""}
                                      onChange={(e) =>
                                        setTeacherForms((prev) => ({
                                          ...prev,
                                          [teacher.user_id]: {
                                            classGroupId: e.target.value,
                                          },
                                        }))
                                      }
                                    >
                                      <option value="">Select class</option>
                                      {(classGroupsBySchool[school.id] || []).map((item) => (
                                        <option key={item.id} value={item.id}>
                                          {item.name}
                                        </option>
                                      ))}
                                    </select>
                                  </LabeledField>
                                  <div style={actionsRow}>
                                    <button
                                      style={buttonSecondary}
                                      disabled={!currentForm.classGroupId || busy}
                                      onClick={() =>
                                        runAction(async () => {
                                          await assignOwnerTeacherToClass({
                                            teacherId: teacher.user_id,
                                            classGroupId: currentForm.classGroupId,
                                          });
                                          setTeacherForms((prev) => ({
                                            ...prev,
                                            [teacher.user_id]: { classGroupId: "" },
                                          }));
                                        }, "Teacher assigned to class.")
                                      }
                                    >
                                      Assign class
                                    </button>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      ) : (
                        <div style={listMeta}>No teachers yet for this school.</div>
                      )
                    ) : null}

                    {(classGroupsBySchool[school.id] || []).length ? (
                      (classGroupsBySchool[school.id] || []).map((item) => (
                        <details
                          key={item.id}
                          id={`owner-class-${item.id}`}
                          style={{ ...listCard, background: "white" }}
                          open={!!openClassPanels[item.id]}
                        >
                          <summary
                            style={{ cursor: "pointer", listStyle: "none" }}
                            onClick={(e) => {
                              e.preventDefault();
                              toggleClassPanel(item.id);
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                              <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 15 }}>{item.name}</div>
                              <HintText isOpen={!!openClassPanels[item.id]} />
                            </div>
                          </summary>

                          <div style={{ display: "grid", gap: 10 }}>
                            <div style={listMeta}>
                              Enrollments: {item.enrollment_count ?? 0}
                              {item.roster?.length
                                ? ` | ${item.roster
                                    .slice(0, 3)
                                    .map((row) => row.user?.full_name || row.user?.email || row.user_id)
                                    .join(", ")}${item.roster.length > 3 ? "..." : ""}`
                                : " | No enrolled students"}
                            </div>
                            <div style={listMeta}>
                              Teacher:{" "}
                              {(teacherAssignmentsByClassId[item.id] || []).length
                                ? (teacherAssignmentsByClassId[item.id] || [])
                                    .map((assignment) => assignment.user?.full_name || assignment.user?.email || assignment.user_id)
                                    .join(", ")
                                : "No teacher assigned yet"}
                            </div>

                            <div style={actionsRow}>
                              <button
                                style={buttonSecondary}
                                onClick={() =>
                                  setOpenRosterPanels((prev) => ({
                                    ...prev,
                                    [item.id]: !prev[item.id],
                                  }))
                                }
                              >
                                {openRosterPanels[item.id] ? "Close class roster" : "Class roster"}
                              </button>
                              <Link
                                href={`/owner/reports?scope=class&class_group_id=${encodeURIComponent(
                                  item.id
                                )}&school_id=${encodeURIComponent(school.id)}&class_name=${encodeURIComponent(
                                  item.name || ""
                                )}&lang=en&from=schools`}
                                style={buttonSecondary}
                              >
                                Class report
                              </Link>
                              <button
                                style={buttonSecondary}
                                onClick={() =>
                                  setOpenCodePanels((prev) => ({
                                    ...prev,
                                    [item.id]: !prev[item.id],
                                  }))
                                }
                              >
                                {openCodePanels[item.id] ? "Close access code" : "Access code"}
                              </button>
                              <button
                                style={buttonSecondary}
                                disabled={busy}
                                onClick={() =>
                                  setClassForm({
                                    id: item.id,
                                    schoolId: item.school_id || "",
                                    name: item.name || "",
                                  })
                                }
                              >
                                Edit class
                              </button>
                            </div>

                            {openRosterPanels[item.id] ? (
                              item.roster?.length ? (
                                <div style={{ display: "grid", gap: 8 }}>
                                  {item.roster.map((row) => {
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
                                      row.studentSummary?.latestExamAnalytics?.overallStatus || "No exam signal yet";

                                    return (
                                      <div key={row.id} style={{ ...listCard, background: "#f9fcfe" }}>
                                        <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                                          {row.user?.full_name || row.user?.email || row.user_id}
                                        </div>
                                        <div style={listMeta}>
                                          {row.user?.email || "No email on file"} | {row.status || "active"}
                                        </div>
                                        <div style={listMeta}>
                                          Status: {overallStatus} | Avg exam:{" "}
                                          {Number.isFinite(row.studentSummary?.exams?.averageScore)
                                            ? `${row.studentSummary.exams.averageScore}%`
                                            : "No data yet"}{" "}
                                          | Practice: {row.studentSummary?.practice?.totalSessions ?? 0} | Remediation:{" "}
                                          {row.studentSummary?.remediation?.totalSessions ?? 0}
                                        </div>
                                        <div style={listMeta}>
                                          Weakest category: {weakestCategory?.category_id || "No clear category yet"} | Weakest chapter:{" "}
                                          {topChapter?.chapter_id ? `Chapter ${topChapter.chapter_id}` : "No clear chapter yet"}
                                        </div>
                                        <div style={actionsRow}>
                                          <Link
                                            href={`/owner/reports?scope=student&user_id=${encodeURIComponent(
                                              row.user_id
                                            )}&school_id=${encodeURIComponent(school.id)}&class_group_id=${encodeURIComponent(
                                              item.id
                                            )}&class_name=${encodeURIComponent(
                                              item.name || ""
                                            )}&lang=en&from=schools-roster`}
                                            style={buttonTiny}
                                          >
                                            View student report
                                          </Link>
                                          <button
                                            style={buttonTiny}
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
                                            style={confirmRemoveEnrollmentId === row.id ? buttonTinyDanger : buttonTinyWarning}
                                            disabled={busy}
                                            onClick={() => {
                                              if (confirmRemoveEnrollmentId === row.id) {
                                                void runClassAction(async () => {
                                                  await removeOwnerClassEnrollment(row.id);
                                                  setConfirmRemoveEnrollmentId("");
                                                }, "Student removed from class.");
                                                return;
                                              }

                                              setConfirmRemoveEnrollmentId(row.id);
                                            }}
                                          >
                                            {confirmRemoveEnrollmentId === row.id ? "Confirm remove" : "Remove from class"}
                                          </button>
                                          {confirmRemoveEnrollmentId === row.id ? (
                                            <button
                                              style={buttonTiny}
                                              disabled={busy}
                                              onClick={() => setConfirmRemoveEnrollmentId("")}
                                            >
                                              Cancel
                                            </button>
                                          ) : null}
                                        </div>
                                        {moveStudentForms[row.id]?.open ? (
                                          <div
                                            style={{
                                              border: "1px solid #d6e1e8",
                                              borderRadius: 12,
                                              background: "white",
                                              padding: 10,
                                              display: "grid",
                                              gap: 8,
                                            }}
                                          >
                                            <div style={{ ...listMeta, fontWeight: 700, color: "var(--heading)" }}>
                                              Move student to another class in this school
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
                                              {(classGroupsBySchool[school.id] || [])
                                                .filter((classItem) => classItem.id !== item.id)
                                                .map((classItem) => (
                                                  <option key={classItem.id} value={classItem.id}>
                                                    {classItem.name}
                                                  </option>
                                                ))}
                                            </select>
                                            <div style={actionsRow}>
                                              <button
                                                style={buttonTiny}
                                                disabled={!moveStudentForms[row.id]?.targetClassGroupId || busy}
                                                onClick={() =>
                                                  runClassAction(async () => {
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
                                                style={buttonTiny}
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
                                <div style={listMeta}>No enrolled students.</div>
                              )
                            ) : null}

                            {openCodePanels[item.id] ? (
                              (accessCodesByClassId[item.id] || []).length ? (
                                <div style={{ display: "grid", gap: 8 }}>
                                  {(accessCodesByClassId[item.id] || []).map((code) => {
                                    const codeTarget = `/owner/codes?type=class&code_id=${encodeURIComponent(code.id)}`;
                                    const codeRedemptions = redemptionsByCodeId[code.id] || [];

                                    return (
                                      <div key={code.id} style={{ ...listCard, background: "#f9fcfe" }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                                          <div style={{ fontWeight: 800, color: "var(--heading)" }}>{code.code}</div>
                                          <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
                                            <span style={chip}>{code.status}</span>
                                            <span style={chip}>
                                              {code.redemption_count} redemption{code.redemption_count === 1 ? "" : "s"}
                                            </span>
                                          </div>
                                        </div>
                                        <div style={listMeta}>
                                          {code.max_redemptions != null ? `Limit ${code.max_redemptions}` : "Unlimited redemptions"}
                                        </div>
                                        <div style={actionsRow}>
                                          <button
                                            style={buttonSecondary}
                                            onClick={() =>
                                              setOpenRedemptionPanels((prev) => ({
                                                ...prev,
                                                [code.id]: !prev[code.id],
                                              }))
                                            }
                                          >
                                            {openRedemptionPanels[code.id] ? "Close redemptions" : "Recent redemptions"}
                                          </button>
                                          <Link href={codeTarget} style={buttonSecondary}>
                                            Manage code
                                          </Link>
                                        </div>
                                        {openRedemptionPanels[code.id] ? (
                                          codeRedemptions.length ? (
                                            <div style={{ display: "grid", gap: 6 }}>
                                              {codeRedemptions.slice(0, 6).map((row) => (
                                                <div key={row.id} style={listMeta}>
                                                  {row.user?.full_name || row.user?.email || row.user_id} |{" "}
                                                  {new Date(row.redeemed_at || row.created_at).toLocaleString()}
                                                </div>
                                              ))}
                                            </div>
                                          ) : (
                                            <div style={listMeta}>No redemptions yet.</div>
                                          )
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div style={listMeta}>No access code has been created for this class yet.</div>
                              )
                            ) : null}
                          </div>
                        </details>
                      ))
                    ) : (
                      <div style={subText}>No classes yet for this school.</div>
                    )}
                  </div>
                </details>
              ))
            ) : (
              <div style={subText}>No schools yet.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
