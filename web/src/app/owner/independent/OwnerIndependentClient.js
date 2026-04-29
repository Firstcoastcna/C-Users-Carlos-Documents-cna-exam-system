"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { assignOwnerStudentToClass, fetchOwnerOverview, updateOwnerUserRole } from "../../lib/backend/auth/browserAuth";

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

const input = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: 10,
  border: "1px solid var(--chrome-border)",
  fontSize: 14,
  background: "white",
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
    <span style={hintText}>
      {isNarrow ? (isOpen ? "Tap here to close" : "Tap here to open") : isOpen ? "Click here to close" : "Click here to open"}
    </span>
  );
}

export default function OwnerIndependentClient() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [busyUserId, setBusyUserId] = useState("");
  const [overview, setOverview] = useState(null);
  const [openStudentId, setOpenStudentId] = useState("");
  const [showAssignForms, setShowAssignForms] = useState({});
  const [assignForms, setAssignForms] = useState({});
  const [showRoleForms, setShowRoleForms] = useState({});
  const [roleForms, setRoleForms] = useState({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");
      setSuccess("");
      try {
        const payload = await fetchOwnerOverview();
        if (!cancelled) {
          setOverview(payload);
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError instanceof Error ? nextError.message : "Unable to load independent students.");
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
  }, []);

  useEffect(() => {
    if (!loading) {
      setShowLoadingNotice(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowLoadingNotice(true), 350);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const accessCodes = overview?.accessCodes ?? EMPTY_ITEMS;
  const redemptions = overview?.redemptions ?? EMPTY_ITEMS;
  const schools = overview?.schools ?? EMPTY_ITEMS;
  const classGroups = overview?.classGroups ?? EMPTY_ITEMS;
  const accessGrantedStudents = overview?.accessGrantedStudents ?? EMPTY_ITEMS;
  const viewerRole = overview?.owner?.appUser?.account_role
    ? String(overview.owner.appUser.account_role).toLowerCase()
    : "";
  const isSchoolAdmin = viewerRole === "school_admin";
  const scopedSchoolName = schools[0]?.name || "School";
  const accessCodesById = useMemo(
    () => Object.fromEntries(accessCodes.map((item) => [item.id, item])),
    [accessCodes]
  );

  const independentRedemptions = useMemo(
    () =>
      redemptions.filter((row) => {
        const code = accessCodesById[row.access_code_id];
        return code && !code.class_group_id;
      }),
    [redemptions, accessCodesById]
  );

  const enrolledUserIds = useMemo(
    () =>
      new Set(
        classGroups.flatMap((group) =>
          (group.roster || [])
            .filter((row) => (row.status || "active") === "active")
            .map((row) => row.user_id)
            .filter(Boolean)
        )
      ),
    [classGroups]
  );

  const currentIndependentRedemptions = useMemo(
    () => independentRedemptions.filter((row) => !enrolledUserIds.has(row.user_id)),
    [independentRedemptions, enrolledUserIds]
  );

  const independentStudents = useMemo(() => {
    const byUser = {};

    currentIndependentRedemptions.forEach((row) => {
      if (!byUser[row.user_id]) {
        byUser[row.user_id] = {
          userId: row.user_id,
          name: row.user?.full_name || row.user?.email || row.user_id,
          email: row.user?.email || "",
          firstRedeemedAt: row.redeemed_at || row.created_at,
          latestRedeemedAt: row.redeemed_at || row.created_at,
          redemptionCount: 0,
          codes: new Set(),
        };
      }

      const item = byUser[row.user_id];
      item.redemptionCount += 1;
      item.codes.add(accessCodesById[row.access_code_id]?.code || row.access_code_id);

      const nextDate = new Date(row.redeemed_at || row.created_at).getTime();
      if (nextDate > new Date(item.latestRedeemedAt).getTime()) {
        item.latestRedeemedAt = row.redeemed_at || row.created_at;
      }
      if (nextDate < new Date(item.firstRedeemedAt).getTime()) {
        item.firstRedeemedAt = row.redeemed_at || row.created_at;
      }
    });

    accessGrantedStudents.forEach((student) => {
      if (!student?.id || enrolledUserIds.has(student.id)) {
        return;
      }

      if (!byUser[student.id]) {
        byUser[student.id] = {
          userId: student.id,
          name: student.full_name || student.email || student.id,
          email: student.email || "",
          firstRedeemedAt: student.access_granted_at || null,
          latestRedeemedAt: student.access_granted_at || null,
          redemptionCount: 0,
          codes: new Set(),
        };
      }
    });

    return Object.values(byUser)
      .map((item) => ({
        ...item,
        codes: Array.from(item.codes),
      }))
      .sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: "base" }));
  }, [currentIndependentRedemptions, accessCodesById, accessGrantedStudents, enrolledUserIds]);

  const activeIndependentCodes = accessCodes.filter((item) => !item.class_group_id && item.status === "active").length;

  useEffect(() => {
    const studentId = searchParams.get("student_id");
    if (!studentId) {
      return;
    }

    setOpenStudentId(studentId);

    const timer = window.setTimeout(() => {
      document.getElementById(`owner-student-${studentId}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [searchParams, independentStudents.length]);

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={isSchoolAdmin ? scopedTitle : title}>
              {isSchoolAdmin ? `${scopedSchoolName} | Independent Students` : "Independent Students"}
            </div>
            <div style={subText}>
              Review independent student activity and open student reports.
            </div>
            <div style={statGrid}>
              <div style={statCard}>
                <div style={statLabel}>Students</div>
                <div style={statValue}>{independentStudents.length}</div>
              </div>
              <div style={statCard}>
                <div style={statLabel}>Codes</div>
                <div style={statValue}>{activeIndependentCodes}</div>
              </div>
              <div style={statCard}>
                <div style={statLabel}>Uses</div>
                <div style={statValue}>{currentIndependentRedemptions.length}</div>
              </div>
            </div>
          </div>
          <Link href="/owner" style={buttonSecondary}>
            Control Center
          </Link>
        </div>

        <div style={body}>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          {success ? <InlineMessage>{success}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading independent students...</InlineMessage> : null}

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>Student activity</div>
            {independentStudents.length ? (
              <div style={listGrid}>
                {independentStudents.map((student) => (
                  <details
                    key={student.userId}
                    id={`owner-student-${student.userId}`}
                    style={listCard}
                    open={openStudentId === student.userId}
                  >
                    <summary
                      style={detailsSummary}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenStudentId((prev) => (prev === student.userId ? "" : student.userId));
                      }}
                    >
                      <div style={summaryRow}>
                        <div style={{ fontWeight: 800, color: "var(--heading)" }}>{student.name}</div>
                        <OpenHint isOpen={openStudentId === student.userId} />
                      </div>
                    </summary>
                    <div style={detailsBody}>
                      <div style={metaText}>
                        {student.email ? `${student.email} | ` : ""}
                        First access:{" "}
                        {student.firstRedeemedAt ? new Date(student.firstRedeemedAt).toLocaleString() : "No access date on record"}
                      </div>
                      <div style={metaText}>
                        Latest access:{" "}
                        {student.latestRedeemedAt ? new Date(student.latestRedeemedAt).toLocaleString() : "No access date on record"} |{" "}
                        {student.redemptionCount} redemption{student.redemptionCount === 1 ? "" : "s"}
                      </div>
                      <div style={metaText}>
                        Codes used: {student.codes.length ? student.codes.join(", ") : "No independent code on record"}
                      </div>
                      <div style={actionsRow}>
                        <Link
                          href={`/owner/reports?scope=student&user_id=${encodeURIComponent(
                            student.userId
                          )}&student_id=${encodeURIComponent(student.userId)}&lang=en&from=independent`}
                          style={buttonPrimary}
                        >
                          View student report
                        </Link>
                        <button
                          style={buttonSecondary}
                          onClick={() =>
                            setShowAssignForms((prev) => ({
                              ...prev,
                              [student.userId]: !prev[student.userId],
                            }))
                          }
                        >
                          {showAssignForms[student.userId] ? "Close class assignment" : "Assign to class"}
                        </button>
                        <button
                          style={buttonSecondary}
                          onClick={() =>
                            setShowRoleForms((prev) => ({
                              ...prev,
                              [student.userId]: !prev[student.userId],
                            }))
                          }
                        >
                          {showRoleForms[student.userId] ? "Close role change" : "Change role"}
                        </button>
                      </div>
                      {showAssignForms[student.userId] ? (
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
                          <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 14 }}>Assign to class</div>
                          <div style={metaText}>
                            Use this if an independent student later needs to be connected to a school class.
                          </div>
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={statLabel}>School</span>
                            <select
                              style={input}
                              value={assignForms[student.userId]?.schoolId || ""}
                              onChange={(e) =>
                                setAssignForms((prev) => ({
                                  ...prev,
                                  [student.userId]: {
                                    schoolId: e.target.value,
                                    classGroupId: "",
                                  },
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
                          </label>
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={statLabel}>Class</span>
                            <select
                              style={input}
                              disabled={!assignForms[student.userId]?.schoolId}
                              value={assignForms[student.userId]?.classGroupId || ""}
                              onChange={(e) =>
                                setAssignForms((prev) => ({
                                  ...prev,
                                  [student.userId]: {
                                    ...(prev[student.userId] || {}),
                                    classGroupId: e.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">
                                {assignForms[student.userId]?.schoolId ? "Select class" : "Select school first"}
                              </option>
                              {classGroups
                                .filter((item) => item.school_id === assignForms[student.userId]?.schoolId)
                                .map((item) => (
                                  <option key={item.id} value={item.id}>
                                    {item.name}
                                  </option>
                                ))}
                            </select>
                          </label>
                          <div style={actionsRow}>
                            <button
                              style={buttonSecondary}
                              disabled={!assignForms[student.userId]?.classGroupId || busyUserId === student.userId}
                              onClick={async () => {
                                try {
                                  setBusyUserId(student.userId);
                                  setError("");
                                  setSuccess("");
                                  await assignOwnerStudentToClass({
                                    userId: student.userId,
                                    classGroupId: assignForms[student.userId]?.classGroupId,
                                  });
                                  setSuccess("Student assigned to class.");
                                  setAssignForms((prev) => ({
                                    ...prev,
                                    [student.userId]: { schoolId: "", classGroupId: "" },
                                  }));
                                  setShowAssignForms((prev) => ({
                                    ...prev,
                                    [student.userId]: false,
                                  }));
                                  await (async () => {
                                    setLoading(true);
                                    const payload = await fetchOwnerOverview();
                                    setOverview(payload);
                                    setLoading(false);
                                  })();
                                } catch (nextError) {
                                  setError(nextError instanceof Error ? nextError.message : "Unable to assign student.");
                                } finally {
                                  setBusyUserId("");
                                }
                              }}
                            >
                              Assign to class
                            </button>
                          </div>
                        </div>
                      ) : null}
                      {showRoleForms[student.userId] ? (
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
                          <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 14 }}>Change role</div>
                          <div style={metaText}>
                            Use this for rare cases where an existing student login needs to become a teacher or school admin instead.
                          </div>
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={statLabel}>Role</span>
                            <select
                              style={input}
                              value={roleForms[student.userId]?.targetRole || ""}
                              onChange={(e) =>
                                setRoleForms((prev) => ({
                                  ...prev,
                                  [student.userId]: {
                                    schoolId: "",
                                    targetRole: e.target.value,
                                  },
                                }))
                              }
                            >
                              <option value="">Select role</option>
                              <option value="teacher">Teacher</option>
                              <option value="school_admin">School admin</option>
                            </select>
                          </label>
                          <label style={{ display: "grid", gap: 6 }}>
                            <span style={statLabel}>School</span>
                            <select
                              style={input}
                              value={roleForms[student.userId]?.schoolId || ""}
                              onChange={(e) =>
                                setRoleForms((prev) => ({
                                  ...prev,
                                  [student.userId]: {
                                    ...(prev[student.userId] || {}),
                                    schoolId: e.target.value,
                                  },
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
                          </label>
                          <div style={actionsRow}>
                            <button
                              style={buttonSecondary}
                              disabled={
                                !roleForms[student.userId]?.targetRole ||
                                !roleForms[student.userId]?.schoolId ||
                                busyUserId === student.userId
                              }
                              onClick={async () => {
                                try {
                                  setBusyUserId(student.userId);
                                  setError("");
                                  setSuccess("");
                                  await updateOwnerUserRole({
                                    userId: student.userId,
                                    targetRole: roleForms[student.userId]?.targetRole,
                                    schoolId: roleForms[student.userId]?.schoolId,
                                  });
                                  setSuccess("User role updated.");
                                  setRoleForms((prev) => ({
                                    ...prev,
                                    [student.userId]: { targetRole: "", schoolId: "" },
                                  }));
                                  setShowRoleForms((prev) => ({
                                    ...prev,
                                    [student.userId]: false,
                                  }));
                                  await (async () => {
                                    setLoading(true);
                                    const payload = await fetchOwnerOverview();
                                    setOverview(payload);
                                    setLoading(false);
                                  })();
                                } catch (nextError) {
                                  setError(nextError instanceof Error ? nextError.message : "Unable to update role.");
                                } finally {
                                  setBusyUserId("");
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
                ))}
              </div>
            ) : (
              <div style={subText}>No independent student activity yet.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
