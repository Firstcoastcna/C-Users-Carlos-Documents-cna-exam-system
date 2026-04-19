"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  deleteOwnerSchoolAdmin,
  fetchOwnerOverview,
  updateOwnerSchoolAdmin,
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

export default function OwnerAdminsClient() {
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [overview, setOverview] = useState(null);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [openAdminId, setOpenAdminId] = useState("");
  const [busyAdminId, setBusyAdminId] = useState("");
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
      setError(nextError instanceof Error ? nextError.message : "Unable to load admins.");
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
  const schoolAdmins = useMemo(
    () =>
      (overview?.schoolAdmins ?? EMPTY_ITEMS)
        .slice()
        .sort((a, b) =>
          (a.user?.full_name || a.user?.email || "").localeCompare(b.user?.full_name || b.user?.email || "", undefined, {
            sensitivity: "base",
          })
        ),
    [overview]
  );
  const ownerRole = overview?.owner?.appUser?.account_role || "";

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={title}>Manage admins</div>
            <div style={subText}>
              Review current school admin assignments, move an admin to a different school, or remove admin access when needed.
            </div>
            <div style={statGrid}>
              <div style={statCard}>
                <div style={statLabel}>Admins</div>
                <div style={statValue}>{schoolAdmins.length}</div>
              </div>
              <div style={statCard}>
                <div style={statLabel}>Schools</div>
                <div style={statValue}>{new Set(schoolAdmins.map((item) => item.school_id)).size}</div>
              </div>
            </div>
          </div>
          <Link href="/owner" style={buttonSecondary}>
            Control Center
          </Link>
        </div>

        <div style={body}>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          {success ? <InlineMessage tone="success">{success}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading admins...</InlineMessage> : null}

          {ownerRole !== "owner" ? (
            <InlineMessage>
              School admins can view this lane, but only the owner can change admin assignments.
            </InlineMessage>
          ) : null}

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>School admin assignments</div>
            {schoolAdmins.length ? (
              <div style={listGrid}>
                {schoolAdmins.map((admin) => {
                  const isOpen = openAdminId === admin.id;
                  const currentForm = editForms[admin.id] || { schoolId: admin.school_id };
                  const canEdit = ownerRole === "owner";

                  return (
                    <details key={admin.id} style={listCard} open={isOpen}>
                      <summary
                        style={detailsSummary}
                        onClick={(e) => {
                          e.preventDefault();
                          setOpenAdminId((prev) => (prev === admin.id ? "" : admin.id));
                          setRemoveConfirmId("");
                          setEditForms((prev) => ({
                            ...prev,
                            [admin.id]: prev[admin.id] || { schoolId: admin.school_id },
                          }));
                        }}
                      >
                        <div style={summaryRow}>
                          <div style={{ display: "grid", gap: 2 }}>
                            <div style={{ fontWeight: 800, color: "var(--heading)" }}>
                              {admin.user?.full_name || admin.user?.email || "School admin"}
                            </div>
                            <div style={metaText}>{admin.school?.name || "School not found"}</div>
                          </div>
                          <OpenHint isOpen={isOpen} />
                        </div>
                      </summary>

                      <div style={detailsBody}>
                        <div style={metaText}>{admin.user?.email || "No email on record"}</div>
                        <div style={metaText}>
                          Current school: {admin.school?.name || "School not found"} | Added{" "}
                          {admin.created_at ? new Date(admin.created_at).toLocaleDateString() : "Unknown date"}
                        </div>

                        <div style={actionsRow}>
                          <Link
                            href={`/owner/schools?school_id=${encodeURIComponent(admin.school_id)}`}
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
                                  [admin.id]: !prev[admin.id],
                                }));
                                setRemoveConfirmId("");
                              }}
                            >
                              {showManageForms[admin.id] ? "Close admin management" : "Manage admin"}
                            </button>
                          ) : null}
                        </div>

                        {canEdit && showManageForms[admin.id] ? (
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
                            <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 14 }}>Admin management</div>

                            <label style={{ display: "grid", gap: 6 }}>
                              <span style={statLabel}>Move to school</span>
                              <select
                                style={input}
                                value={currentForm.schoolId || ""}
                                onChange={(e) =>
                                  setEditForms((prev) => ({
                                    ...prev,
                                    [admin.id]: {
                                      ...currentForm,
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
                                disabled={!currentForm.schoolId || currentForm.schoolId === admin.school_id || busyAdminId === admin.id}
                                onClick={async () => {
                                  try {
                                    setBusyAdminId(admin.id);
                                    setError("");
                                    setSuccess("");
                                    await updateOwnerSchoolAdmin({
                                      id: admin.id,
                                      userId: admin.user_id,
                                      schoolId: currentForm.schoolId,
                                    });
                                    setSuccess("School admin updated.");
                                    await loadOverview();
                                  } catch (nextError) {
                                    setError(nextError instanceof Error ? nextError.message : "Unable to update admin.");
                                  } finally {
                                    setBusyAdminId("");
                                  }
                                }}
                              >
                                Save school change
                              </button>

                              {removeConfirmId === admin.id ? (
                                <>
                                  <button
                                    style={buttonDanger}
                                    disabled={busyAdminId === admin.id}
                                    onClick={async () => {
                                      try {
                                        setBusyAdminId(admin.id);
                                        setError("");
                                        setSuccess("");
                                        await deleteOwnerSchoolAdmin(admin.id);
                                        setSuccess("Admin access removed.");
                                        setRemoveConfirmId("");
                                        setOpenAdminId("");
                                        await loadOverview();
                                      } catch (nextError) {
                                        setError(nextError instanceof Error ? nextError.message : "Unable to remove admin.");
                                      } finally {
                                        setBusyAdminId("");
                                      }
                                    }}
                                  >
                                    Confirm remove admin
                                  </button>
                                  <button
                                    style={buttonSecondary}
                                    onClick={() => setRemoveConfirmId("")}
                                  >
                                    Cancel
                                  </button>
                                </>
                              ) : (
                                <button
                                  style={buttonDangerOutline}
                                  disabled={busyAdminId === admin.id}
                                  onClick={() => setRemoveConfirmId(admin.id)}
                                >
                                  Remove admin access
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
              <div style={subText}>No school admins have been created yet.</div>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
