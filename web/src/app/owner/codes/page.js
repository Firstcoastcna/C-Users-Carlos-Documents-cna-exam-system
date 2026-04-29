"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  createOwnerAccessCode,
  deleteOwnerAccessCode,
  fetchOwnerOverview,
  updateOwnerAccessCodeStatus,
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
  padding: "10px 13px",
  borderRadius: 10,
  border: "1px solid var(--brand-red)",
  background: "var(--brand-red)",
  color: "white",
  cursor: "pointer",
  fontWeight: 700,
};

const filterRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const filterButton = (active) => ({
  ...buttonSecondary,
  border: active ? "1px solid #88a5ba" : buttonSecondary.border,
  background: active ? "#eef5f9" : "white",
  color: active ? "#355267" : buttonSecondary.color,
});

const input = {
  width: "100%",
  padding: "10px 11px",
  borderRadius: 10,
  border: "1px solid var(--chrome-border)",
  fontSize: 14,
  background: "white",
};

const editCard = {
  border: "1px solid var(--chrome-border)",
  borderRadius: 16,
  background: "white",
  padding: 14,
  display: "grid",
  gap: 12,
};

const rowList = {
  display: "grid",
  gap: 10,
};

const rowCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  background: "#fcfeff",
  overflow: "hidden",
};

const rowTop = {
  display: "grid",
  gridTemplateColumns: "minmax(120px, 1fr) auto auto",
  gap: 12,
  alignItems: "center",
};

const codeText = {
  fontWeight: 800,
  color: "var(--heading)",
  fontSize: 15,
  lineHeight: 1.2,
};

const metaText = {
  color: "#5a6b78",
  fontSize: 12.5,
  lineHeight: 1.45,
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

const actionsRow = {
  display: "flex",
  gap: 6,
  flexWrap: "wrap",
};

const labelStyle = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#607282",
};

const detailsBody = {
  padding: "0 12px 12px",
  display: "grid",
  gap: 9,
};

const detailsSummary = {
  cursor: "pointer",
  listStyle: "none",
  padding: 12,
};

const hintText = {
  color: "#607282",
  fontSize: 12.5,
  fontWeight: 700,
  justifySelf: "end",
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

export default function OwnerCodesPage() {
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [overview, setOverview] = useState(null);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [openCodeId, setOpenCodeId] = useState("");
  const [codeForm, setCodeForm] = useState({
    id: "",
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
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : "Unable to load codes.");
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
  const viewerRole = overview?.owner?.appUser?.account_role
    ? String(overview.owner.appUser.account_role).toLowerCase()
    : "";
  const roleReady = !loading && !!viewerRole;
  const isSchoolAdmin = viewerRole === "school_admin";
  const scopedSchoolName =
    schools.length === 1
      ? schools[0]?.name || "Your school"
      : schools.length > 1
        ? `${schools.length} schools`
        : "Your school";
  const schoolById = useMemo(() => Object.fromEntries(schools.map((item) => [item.id, item])), [schools]);
  const classById = useMemo(() => Object.fromEntries(classGroups.map((item) => [item.id, item])), [classGroups]);

  useEffect(() => {
    if (typeof window === "undefined" || !accessCodes.length) {
      return undefined;
    }

    const params = new URLSearchParams(window.location.search);
    const requestedType = params.get("type");
    const requestedCodeId = params.get("code_id");
    const requestedClassGroupId = params.get("class_group_id");

    if (requestedType === "class" || requestedType === "independent" || requestedType === "all") {
      setTypeFilter(requestedType);
    }

    const matchedCodeId =
      requestedCodeId ||
      (requestedClassGroupId ? accessCodes.find((item) => item.class_group_id === requestedClassGroupId)?.id || "" : "");

    if (!matchedCodeId) {
      return undefined;
    }

    setOpenCodeId(matchedCodeId);

    const timer = window.setTimeout(() => {
      document.getElementById(`owner-code-${matchedCodeId}`)?.scrollIntoView({ block: "start", behavior: "smooth" });
    }, 50);

    return () => window.clearTimeout(timer);
  }, [accessCodes]);

  const filteredCodes = useMemo(
    () =>
      accessCodes.filter((item) => {
        const matchesType =
          typeFilter === "all"
            ? true
            : typeFilter === "independent"
              ? !item.class_group_id
              : !!item.class_group_id;
        const matchesStatus = statusFilter === "all" ? true : item.status === statusFilter;
        return matchesType && matchesStatus;
      })
        .slice()
        .sort((a, b) => String(a.code || "").localeCompare(String(b.code || ""), undefined, { sensitivity: "base" })),
    [accessCodes, statusFilter, typeFilter]
  );

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

  function resetCodeForm() {
    setCodeForm({
      id: "",
      code: "",
      codeType: "independent",
      schoolId: "",
      classGroupId: "",
      maxRedemptions: "",
    });
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={isSchoolAdmin ? scopedTitle : title}>
              {!roleReady ? "Loading your workspace..." : isSchoolAdmin ? `${scopedSchoolName} | Manage Codes` : "Manage Codes"}
            </div>
            <div style={subText}>
              {!roleReady
                ? "Loading your code access..."
                : isSchoolAdmin
                ? "This lane is code-centered. Use it to review, edit, deactivate, reactivate, or safely delete your school's class and independent codes."
                : "This lane is code-centered. Use it to review all codes together, then edit, deactivate, reactivate, or safely delete them."}
            </div>
          </div>
          <Link href="/owner" style={buttonSecondary}>
            Control Center
          </Link>
        </div>

        <div style={body}>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          {success ? <InlineMessage tone="success">{success}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading codes...</InlineMessage> : null}

          {codeForm.id ? (
            <div style={editCard}>
              <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>Edit code</div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: 12 }}>
                <LabeledField label="Type">
                  <select
                    style={input}
                    value={codeForm.codeType}
                    onChange={(e) =>
                      setCodeForm((prev) => ({
                        ...prev,
                        codeType: e.target.value,
                        schoolId: e.target.value === "independent" ? prev.schoolId : prev.schoolId,
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
              </div>

              <div style={actionsRow}>
                <button
                  style={buttonPrimary}
                  disabled={busy}
                  onClick={() =>
                    runAction(async () => {
                      await createOwnerAccessCode(codeForm);
                      resetCodeForm();
                    }, "Access code updated.")
                  }
                >
                  Update code
                </button>
                <button style={buttonSecondary} disabled={busy} onClick={resetCodeForm}>
                  Cancel
                </button>
              </div>
            </div>
          ) : null}

          <div style={filterRow}>
            <button style={filterButton(typeFilter === "all")} onClick={() => setTypeFilter("all")}>
              All codes
            </button>
            <button style={filterButton(typeFilter === "class")} onClick={() => setTypeFilter("class")}>
              Class codes
            </button>
            <button style={filterButton(typeFilter === "independent")} onClick={() => setTypeFilter("independent")}>
              Independent codes
            </button>
            <button style={filterButton(statusFilter === "all")} onClick={() => setStatusFilter("all")}>
              All statuses
            </button>
            <button style={filterButton(statusFilter === "active")} onClick={() => setStatusFilter("active")}>
              Active
            </button>
            <button style={filterButton(statusFilter === "inactive")} onClick={() => setStatusFilter("inactive")}>
              Inactive
            </button>
          </div>

          <div style={rowList}>
            {filteredCodes.length ? (
              filteredCodes.map((item) => {
                const school = schoolById[item.school_id];
                const classGroup = classById[item.class_group_id];
                const lane = item.class_group_id ? "Class code" : "Independent";
                const scopeText = item.class_group_id
                  ? `${school?.name || "Unknown school"} | ${classGroup?.name || "Unknown class"}`
                  : "Direct buyer access";
                const isOpen = openCodeId === item.id;

                return (
                  <details key={item.id} id={`owner-code-${item.id}`} style={rowCard} open={isOpen}>
                    <summary
                      style={detailsSummary}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenCodeId((prev) => (prev === item.id ? "" : item.id));
                      }}
                    >
                      <div style={rowTop}>
                        <div style={codeText}>{item.code}</div>
                        <div>
                          <span style={chip}>{item.status}</span>
                        </div>
                        <OpenHint isOpen={isOpen} />
                      </div>
                    </summary>
                    <div style={detailsBody}>
                      <div style={metaText}>
                        {lane} | {scopeText}
                        <br />
                        {item.max_redemptions != null ? `Limit ${item.max_redemptions}` : "Unlimited"} |{" "}
                        {item.redemption_count} redemptions
                        {item.latest_redeemer
                          ? ` | Latest: ${item.latest_redeemer.full_name || item.latest_redeemer.email || item.latest_redeemer.id}`
                          : ""}
                      </div>
                      <div style={actionsRow}>
                        <button
                          style={buttonSecondary}
                          disabled={busy}
                          onClick={() =>
                            setCodeForm({
                              id: item.id,
                              code: item.code || "",
                              codeType: item.class_group_id ? "class" : "independent",
                              schoolId: item.school_id || "",
                              classGroupId: item.class_group_id || "",
                              maxRedemptions: item.max_redemptions == null ? "" : String(item.max_redemptions),
                            })
                          }
                        >
                          Edit
                        </button>
                        <button
                          style={buttonSecondary}
                          disabled={busy}
                          onClick={() =>
                            runAction(async () => {
                              await updateOwnerAccessCodeStatus(
                                item.id,
                                item.status === "active" ? "inactive" : "active"
                              );
                            }, item.status === "active" ? "Access code deactivated." : "Access code reactivated.")
                          }
                        >
                          {item.status === "active" ? "Deactivate" : "Reactivate"}
                        </button>
                        {item.class_group_id ? (
                          <Link
                            href={`/owner/schools?school_id=${encodeURIComponent(
                              item.school_id || ""
                            )}&class_group_id=${encodeURIComponent(item.class_group_id)}`}
                            style={buttonSecondary}
                          >
                            View class
                          </Link>
                        ) : (
                          <Link href="/owner/independent" style={buttonSecondary}>
                            View students
                          </Link>
                        )}
                        <button
                          style={buttonSecondary}
                          disabled={busy}
                          onClick={() =>
                            runAction(async () => {
                              await deleteOwnerAccessCode(item.id);
                            }, "Access code deleted.")
                          }
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  </details>
                );
              })
            ) : (
              <InlineMessage>No codes match the current filters.</InlineMessage>
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
