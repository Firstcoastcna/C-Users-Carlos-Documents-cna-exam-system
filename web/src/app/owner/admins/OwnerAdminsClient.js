"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deleteOwnerSchoolAdmin,
  fetchOwnerOverview,
  updateOwnerUserRole,
} from "../../lib/backend/auth/browserAuth";

const EMPTY_ITEMS = [];

const shell = {
  maxWidth: 1080,
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

const scopedTitle = {
  fontSize: 23,
  fontWeight: 800,
  color: "var(--heading)",
  lineHeight: 1.2,
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

const buttonPrimary = {
  ...buttonSecondary,
  background: "#fff1f0",
  border: "1px solid #d48c86",
  color: "#a22b25",
};

const buttonDangerOutline = {
  ...buttonSecondary,
  border: "1px solid #d48c86",
  color: "#a22b25",
  background: "#fff8f7",
};

const buttonDanger = {
  ...buttonSecondary,
  border: "1px solid var(--brand-red)",
  background: "var(--brand-red)",
  color: "white",
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
  background: "var(--surface-soft)",
  padding: "4px 8px",
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
  lineHeight: 1.1,
};

const listGrid = {
  display: "grid",
  gap: 10,
};

const listCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  background: "#fcfeff",
  overflow: "hidden",
};

const detailsSummary = {
  cursor: "pointer",
  listStyle: "none",
  padding: 12,
};

const detailsBody = {
  padding: "0 12px 12px",
  display: "grid",
  gap: 8,
};

const summaryRow = {
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  gap: 12,
};

const hintText = {
  color: "#607282",
  fontSize: 12.5,
  fontWeight: 700,
  flexShrink: 0,
};

const metaText = {
  color: "#5a6b78",
  fontSize: 12.5,
  lineHeight: 1.45,
};

const actionsRow = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const input = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: 10,
  border: "1px solid var(--chrome-border)",
  fontSize: 14,
  background: "white",
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
    <span style={hintText}>
      {isNarrow ? (isOpen ? "Tap here to close" : "Tap here to open") : isOpen ? "Click here to close" : "Click here to open"}
    </span>
  );
}

function toUiRole(staffRole) {
  const normalized = String(staffRole || "").toLowerCase();
  if (normalized === "admin" || normalized === "unassigned_admin") return "school_admin";
  return "teacher";
}

function toRoleLabel(uiRole) {
  if (uiRole === "school_admin") return "School admin";
  if (uiRole === "teacher") return "Teacher";
  return "Student";
}

export default function OwnerAdminsClient() {
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openSection, setOpenSection] = useState("assigned");
  const [openStaffId, setOpenStaffId] = useState("");
  const [busyStaffId, setBusyStaffId] = useState("");
  const [showManageForms, setShowManageForms] = useState({});
  const [editForms, setEditForms] = useState({});
  const [removeConfirmId, setRemoveConfirmId] = useState("");

  async function loadOverview() {
    setLoading(true);
    setError("");
    try {
      const payload = await fetchOwnerOverview();
      setOverview(payload);
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load staff assignments.");
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
  const schoolAdmins = overview?.schoolAdmins ?? EMPTY_ITEMS;
  const schoolTeachers = overview?.schoolTeachers ?? EMPTY_ITEMS;
  const unassignedStaff = overview?.unassignedStaff ?? EMPTY_ITEMS;
  const viewerRole = overview?.owner?.appUser?.account_role
    ? String(overview.owner.appUser.account_role).toLowerCase()
    : "";
  const isSchoolAdmin = viewerRole === "school_admin";
  const scopedSchoolName =
    schools.length === 1
      ? schools[0]?.name || "Your school"
      : schools.length > 1
        ? `${schools.length} schools`
        : "Your school";
  const staffAssignments = useMemo(
    () =>
      [...schoolAdmins, ...schoolTeachers]
        .slice()
        .sort((a, b) =>
          (a.user?.full_name || a.user?.email || "").localeCompare(b.user?.full_name || b.user?.email || "", undefined, {
            sensitivity: "base",
          })
        ),
    [schoolAdmins, schoolTeachers]
  );
  const unassignedStaffAssignments = useMemo(
    () =>
      [...unassignedStaff]
        .slice()
        .sort((a, b) =>
          (a.user?.full_name || a.user?.email || "").localeCompare(b.user?.full_name || b.user?.email || "", undefined, {
            sensitivity: "base",
          })
        ),
    [unassignedStaff]
  );
  const ownerRole = overview?.owner?.appUser?.account_role || "";

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={isSchoolAdmin ? scopedTitle : title}>
              {isSchoolAdmin ? `${scopedSchoolName} | Manage School Staff` : "Manage School Staff"}
            </div>
            <div style={subText}>
              {isSchoolAdmin
                ? "Review teacher and school-admin assignments for your school, then adjust roles when needed."
                : "Review teacher and school-admin assignments, move staff between schools, or reassign an existing user into a different role when needed."}
            </div>
            {isSchoolAdmin ? (
              <div style={statGrid}>
                <div style={statCard}>
                  <div style={statLabel}>Admins</div>
                  <div style={statValue}>{schoolAdmins.length}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Teachers</div>
                  <div style={statValue}>{schoolTeachers.length}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Unassigned</div>
                  <div style={statValue}>{unassignedStaffAssignments.length}</div>
                </div>
              </div>
            ) : (
              <div style={statGrid}>
                <div style={statCard}>
                  <div style={statLabel}>Staff</div>
                  <div style={statValue}>{staffAssignments.length}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Admins</div>
                  <div style={statValue}>{schoolAdmins.length}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Teachers</div>
                  <div style={statValue}>{schoolTeachers.length}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Unassigned</div>
                  <div style={statValue}>{unassignedStaffAssignments.length}</div>
                </div>
                <div style={statCard}>
                  <div style={statLabel}>Schools</div>
                  <div style={statValue}>{new Set(staffAssignments.map((item) => item.school_id)).size}</div>
                </div>
              </div>
            )}
          </div>
          <Link href="/owner" style={buttonSecondary}>
            Control Center
          </Link>
        </div>

        <div style={body}>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          {success ? <InlineMessage tone="success">{success}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading staff assignments...</InlineMessage> : null}

          <div style={{ display: "grid", gap: 10 }}>
            <details style={listCard} open={openSection === "assigned"}>
              <summary
                style={detailsSummary}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenSection((prev) => (prev === "assigned" ? "" : "assigned"));
                }}
              >
                <div style={summaryRow}>
                  <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>School staff assignments</div>
                  <OpenHint isOpen={openSection === "assigned"} />
                </div>
              </summary>
              <div style={detailsBody}>
            {staffAssignments.length ? (
              <div style={listGrid}>
                {staffAssignments.map((staff) => {
                  const isOpen = openStaffId === staff.id;
                  const currentForm = editForms[staff.id] || {
                    schoolId: staff.school_id,
                    targetRole: toUiRole(staff.role),
                  };
                  const canEdit = ownerRole === "owner" || isSchoolAdmin;
                  const currentRole = toUiRole(staff.role);

                  return (
                    <details key={staff.id} style={listCard} open={isOpen}>
                      <summary
                        style={detailsSummary}
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenStaffId((prev) => (prev === staff.id ? "" : staff.id));
                          setRemoveConfirmId("");
                          setEditForms((prev) => ({
                            ...prev,
                            [staff.id]:
                              prev[staff.id] || {
                                schoolId: staff.school_id,
                                targetRole: currentRole,
                              },
                          }));
                        }}
                      >
                        <div style={summaryRow}>
                          <div style={{ display: "grid", gap: 2 }}>
                            <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                              {staff.user?.full_name || staff.user?.email || "Staff user"}
                            </div>
                            <div style={metaText}>
                              {toRoleLabel(currentRole)} | {staff.school?.name || "School not found"}
                            </div>
                          </div>
                          <OpenHint isOpen={isOpen} />
                        </div>
                      </summary>

                      <div style={detailsBody}>
                        <div style={metaText}>{staff.user?.email || "No email on record"}</div>
                        <div style={metaText}>
                          Current role: {toRoleLabel(currentRole)} | Current school: {staff.school?.name || "School not found"} | Added{" "}
                          {staff.created_at ? new Date(staff.created_at).toLocaleDateString() : "Unknown date"}
                        </div>

                        <div style={actionsRow}>
                          <Link
                            href={`/owner/schools?school_id=${encodeURIComponent(staff.school_id)}`}
                            style={buttonSecondary}
                          >
                            Open school
                          </Link>
                          {canEdit ? (
                            <button
                              style={buttonPrimary}
                              onClick={() => {
                                setShowManageForms((prev) => ({
                                  ...prev,
                                  [staff.id]: !prev[staff.id],
                                }));
                                setRemoveConfirmId("");
                              }}
                            >
                              {showManageForms[staff.id] ? "Close role management" : "Manage role"}
                            </button>
                          ) : null}
                        </div>

                        {canEdit && showManageForms[staff.id] ? (
                          <div
                            style={{
                              border: "1px solid var(--chrome-border)",
                              borderRadius: 12,
                              background: "white",
                              padding: 12,
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 14 }}>Role management</div>
                            <div style={metaText}>
                              Use this for rare cases where an existing login needs to become a student, teacher, or school admin without creating a second account.
                            </div>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={statLabel}>Role</span>
                              <select
                                style={input}
                                value={currentForm.targetRole || ""}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [staff.id]: {
                                      ...currentForm,
                                      targetRole: e.target.value,
                                      schoolId: e.target.value === "student" ? "" : currentForm.schoolId || staff.school_id,
                                    },
                                  }))
                                }
                              >
                                <option value="school_admin">School admin</option>
                                <option value="teacher">Teacher</option>
                                <option value="student">Student</option>
                              </select>
                            </label>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={statLabel}>School</span>
                              {isSchoolAdmin && currentForm.targetRole !== "student" ? (
                                <input style={{ ...input, background: "#f7fafc", color: "#445565" }} value={staff.school?.name || scopedSchoolName} readOnly />
                              ) : (
                                <select
                                  style={input}
                                  value={currentForm.schoolId || ""}
                                  disabled={currentForm.targetRole === "student"}
                                  onChange={(e) =>
                                    setEditForms((prev) => ({
                                      ...prev,
                                      [staff.id]: {
                                        ...currentForm,
                                        schoolId: e.target.value,
                                      },
                                    }))
                                  }
                                >
                                  <option value="">{currentForm.targetRole === "student" ? "Not needed for student" : "Select school"}</option>
                                  {schools.map((school) => (
                                    <option key={school.id} value={school.id}>
                                      {school.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </label>

                            <div style={actionsRow}>
                              <button
                                style={buttonSecondary}
                                disabled={
                                  busyStaffId === staff.id ||
                                  !currentForm.targetRole ||
                                  ((currentForm.targetRole === "teacher" || currentForm.targetRole === "school_admin") &&
                                    !currentForm.schoolId) ||
                                  (currentForm.targetRole === currentRole &&
                                    (currentForm.targetRole === "student" || currentForm.schoolId === staff.school_id))
                                }
                                onClick={async () => {
                                  try {
                                    setBusyStaffId(staff.id);
                                    setError("");
                                    setSuccess("");
                                    await updateOwnerUserRole({
                                      userId: staff.user_id,
                                      targetRole: currentForm.targetRole,
                                      schoolId: currentForm.targetRole === "student" ? "" : currentForm.schoolId,
                                    });
                                    setSuccess("User role updated.");
                                    setShowManageForms((prev) => ({
                                      ...prev,
                                      [staff.id]: false,
                                    }));
                                    setOpenStaffId("");
                                    await loadOverview();
                                  } catch (nextError) {
                                    setError(nextError instanceof Error ? nextError.message : "Unable to update role.");
                                  } finally {
                                    setBusyStaffId("");
                                  }
                                }}
                              >
                                Save role change
                              </button>

                              {removeConfirmId === staff.id ? (
                                <>
                                  <button
                                    style={buttonDanger}
                                    disabled={busyStaffId === staff.id}
                                    onClick={async () => {
                                      try {
                                        setBusyStaffId(staff.id);
                                        setError("");
                                        setSuccess("");
                                        await deleteOwnerSchoolAdmin(staff.id);
                                        setSuccess("School staff assignment removed.");
                                        setRemoveConfirmId("");
                                        setOpenStaffId("");
                                        await loadOverview();
                                      } catch (nextError) {
                                        setError(nextError instanceof Error ? nextError.message : "Unable to remove assignment.");
                                      } finally {
                                        setBusyStaffId("");
                                      }
                                    }}
                                  >
                                    Confirm remove assignment
                                  </button>
                                  <button style={buttonSecondary} onClick={() => setRemoveConfirmId("")}>
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  style={buttonDangerOutline}
                                  disabled={busyStaffId === staff.id}
                                  onClick={() => setRemoveConfirmId(staff.id)}
                                >
                                  Remove school assignment
                                </button>
                              )}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <div style={subText}>No school staff have been created yet.</div>
            )}
              </div>
            </details>

            <details style={listCard} open={openSection === "unassigned"}>
              <summary
                style={detailsSummary}
                onClick={(e) => {
                  e.preventDefault();
                  setOpenSection((prev) => (prev === "unassigned" ? "" : "unassigned"));
                }}
              >
                <div style={summaryRow}>
                  <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>Unassigned staff</div>
                  <OpenHint isOpen={openSection === "unassigned"} />
                </div>
              </summary>
              <div style={detailsBody}>
            {unassignedStaffAssignments.length ? (
              <div style={listGrid}>
                {unassignedStaffAssignments.map((staff) => {
                  const isOpen = openStaffId === staff.id;
                  const currentForm = editForms[staff.id] || {
                    schoolId: staff.school_id,
                    targetRole: toUiRole(staff.role),
                  };
                  const canEdit = ownerRole === "owner" || isSchoolAdmin;
                  const currentRole = toUiRole(staff.role);

                  return (
                    <details key={staff.id} style={listCard} open={isOpen}>
                      <summary
                        style={detailsSummary}
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenStaffId((prev) => (prev === staff.id ? "" : staff.id));
                          setRemoveConfirmId("");
                          setEditForms((prev) => ({
                            ...prev,
                            [staff.id]:
                              prev[staff.id] || {
                                schoolId: staff.school_id,
                                targetRole: currentRole,
                              },
                          }));
                        }}
                      >
                        <div style={summaryRow}>
                          <div style={{ display: "grid", gap: 2 }}>
                            <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                              {staff.user?.full_name || staff.user?.email || "Staff user"}
                            </div>
                            <div style={metaText}>
                              {toRoleLabel(currentRole)} (unassigned) | {staff.school?.name || "School not found"}
                            </div>
                          </div>
                          <OpenHint isOpen={isOpen} />
                        </div>
                      </summary>

                      <div style={detailsBody}>
                        <div style={metaText}>{staff.user?.email || "No email on record"}</div>
                        <div style={metaText}>
                          Last school: {staff.school?.name || "School not found"} | Unassigned{" "}
                          {staff.updated_at ? new Date(staff.updated_at).toLocaleDateString() : "Unknown date"}
                        </div>

                        <div style={actionsRow}>
                          <Link
                            href={`/owner/schools?school_id=${encodeURIComponent(staff.school_id)}`}
                            style={buttonSecondary}
                          >
                            Open school
                          </Link>
                          {canEdit ? (
                            <button
                              style={buttonPrimary}
                              onClick={() => {
                                setShowManageForms((prev) => ({
                                  ...prev,
                                  [staff.id]: !prev[staff.id],
                                }));
                                setRemoveConfirmId("");
                              }}
                            >
                              {showManageForms[staff.id] ? "Close role management" : "Manage role"}
                            </button>
                          ) : null}
                        </div>

                        {canEdit && showManageForms[staff.id] ? (
                          <div
                            style={{
                              border: "1px solid var(--chrome-border)",
                              borderRadius: 12,
                              background: "white",
                              padding: 12,
                              display: "grid",
                              gap: 8,
                            }}
                          >
                            <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 14 }}>Role management</div>
                            <div style={metaText}>
                              Reassign this unassigned staff member back into a school role, or convert the account into a student if needed.
                            </div>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={statLabel}>Role</span>
                              <select
                                style={input}
                                value={currentForm.targetRole || ""}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [staff.id]: {
                                      ...currentForm,
                                      targetRole: e.target.value,
                                      schoolId: e.target.value === "student" ? "" : currentForm.schoolId || staff.school_id,
                                    },
                                  }))
                                }
                              >
                                <option value="school_admin">School admin</option>
                                <option value="teacher">Teacher</option>
                                <option value="student">Student</option>
                              </select>
                            </label>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={statLabel}>School</span>
                              {isSchoolAdmin && currentForm.targetRole !== "student" ? (
                                <input style={{ ...input, background: "#f7fafc", color: "#445565" }} value={staff.school?.name || scopedSchoolName} readOnly />
                              ) : (
                                <select
                                  style={input}
                                  value={currentForm.schoolId || ""}
                                  disabled={currentForm.targetRole === "student"}
                                  onChange={(e) =>
                                    setEditForms((prev) => ({
                                      ...prev,
                                      [staff.id]: {
                                        ...currentForm,
                                        schoolId: e.target.value,
                                      },
                                    }))
                                  }
                                >
                                  <option value="">{currentForm.targetRole === "student" ? "Not needed for student" : "Select school"}</option>
                                  {schools.map((school) => (
                                    <option key={school.id} value={school.id}>
                                      {school.name}
                                    </option>
                                  ))}
                                </select>
                              )}
                            </label>

                            <div style={actionsRow}>
                              <button
                                style={buttonSecondary}
                                disabled={
                                  busyStaffId === staff.id ||
                                  !currentForm.targetRole ||
                                  ((currentForm.targetRole === "teacher" || currentForm.targetRole === "school_admin") &&
                                    !currentForm.schoolId)
                                }
                                onClick={async () => {
                                  try {
                                    setBusyStaffId(staff.id);
                                    setError("");
                                    setSuccess("");
                                    await updateOwnerUserRole({
                                      userId: staff.user_id,
                                      targetRole: currentForm.targetRole,
                                      schoolId: currentForm.targetRole === "student" ? "" : currentForm.schoolId,
                                    });
                                    setSuccess("User role updated.");
                                    setShowManageForms((prev) => ({
                                      ...prev,
                                      [staff.id]: false,
                                    }));
                                    setOpenStaffId("");
                                    await loadOverview();
                                  } catch (nextError) {
                                    setError(nextError instanceof Error ? nextError.message : "Unable to update role.");
                                  } finally {
                                    setBusyStaffId("");
                                  }
                                }}
                              >
                                Save role change
                              </button>
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </details>
                  );
                })}
              </div>
            ) : (
              <div style={subText}>No unassigned staff right now.</div>
            )}
              </div>
            </details>
          </div>
        </div>
      </div>
    </main>
  );
}
