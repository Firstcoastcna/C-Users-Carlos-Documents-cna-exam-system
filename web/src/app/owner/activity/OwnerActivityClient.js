"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { fetchOwnerActivity, signOutStudent } from "../../lib/backend/auth/browserAuth";

const shell = {
  maxWidth: 1180,
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
  justifyContent: "space-between",
  gap: 12,
  alignItems: "center",
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

const statGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))",
  gap: 10,
};

const statCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  padding: 14,
  background: "#fbfdff",
  display: "grid",
  gap: 6,
};

const statLabel = {
  color: "#607282",
  fontSize: 12,
  fontWeight: 700,
  textTransform: "uppercase",
  letterSpacing: 0.3,
};

const statValue = {
  fontSize: 24,
  fontWeight: 800,
  color: "var(--heading)",
};

const filterRow = {
  display: "flex",
  gap: 8,
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

const sectionCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 16,
  background: "#fcfdff",
  overflow: "hidden",
};

const sectionHeaderButton = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "16px 18px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  textAlign: "left",
};

const sectionBody = {
  padding: "0 18px 18px",
  display: "grid",
  gap: 16,
};

const summaryGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
  gap: 10,
};

const miniStat = {
  border: "1px solid #d9e4eb",
  borderRadius: 12,
  background: "white",
  padding: "10px 12px",
  display: "grid",
  gap: 4,
};

const miniStatLabel = {
  fontSize: 11,
  color: "#6d7f8e",
  textTransform: "uppercase",
  letterSpacing: 0.3,
  fontWeight: 700,
};

const miniStatValue = {
  fontSize: 18,
  fontWeight: 800,
  color: "var(--heading)",
};

const subSection = {
  display: "grid",
  gap: 10,
};

const subSectionTitle = {
  fontSize: 13,
  fontWeight: 800,
  color: "#476175",
  textTransform: "uppercase",
  letterSpacing: 0.4,
};

const rosterGrid = {
  display: "grid",
  gap: 10,
};

const userCard = {
  border: "1px solid #dde7ee",
  borderRadius: 14,
  background: "white",
  padding: 14,
  display: "grid",
  gap: 10,
};

const userHeader = {
  display: "flex",
  justifyContent: "space-between",
  gap: 10,
  alignItems: "flex-start",
  flexWrap: "wrap",
};

const userName = {
  fontWeight: 800,
  color: "var(--heading)",
};

const chipRow = {
  display: "flex",
  gap: 8,
  flexWrap: "wrap",
};

const detailGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))",
  gap: 8,
};

const detailTile = {
  border: "1px solid #e4edf3",
  borderRadius: 12,
  padding: "9px 10px",
  background: "#f9fbfd",
  display: "grid",
  gap: 3,
};

const detailLabel = {
  fontSize: 11,
  color: "#6a7c8b",
  textTransform: "uppercase",
  letterSpacing: 0.25,
  fontWeight: 700,
};

const detailValue = {
  fontSize: 13,
  color: "#274457",
  fontWeight: 700,
};

const classCard = {
  border: "1px solid #d8e3ea",
  borderRadius: 14,
  background: "white",
  overflow: "hidden",
};

const classButton = {
  width: "100%",
  border: "none",
  background: "transparent",
  padding: "14px 16px",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 10,
  cursor: "pointer",
  textAlign: "left",
};

const classBody = {
  padding: "0 16px 16px",
  display: "grid",
  gap: 14,
};

const badge = (tone = "neutral") => ({
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  padding: "4px 8px",
  borderRadius: 999,
  fontSize: 12,
  fontWeight: 700,
  background:
    tone === "active"
      ? "#eef8f1"
      : tone === "cold"
        ? "#fff8f8"
        : tone === "staff"
          ? "#eef5f9"
          : tone === "owner"
            ? "#fff4e8"
            : "#f4f7fa",
  color:
    tone === "active"
      ? "#1f6f3d"
      : tone === "cold"
        ? "var(--brand-red)"
        : tone === "owner"
          ? "#9a4c07"
          : "#38556a",
  border:
    tone === "active"
      ? "1px solid #bddfc6"
      : tone === "cold"
        ? "1px solid #efc2c2"
        : tone === "owner"
          ? "1px solid #f1cd9d"
          : "1px solid #d6e1e8",
});

function formatDateTime(value) {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "Never";
  return date.toLocaleString([], {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function formatRole(role) {
  const normalized = String(role || "student").trim().toLowerCase();
  if (normalized === "school_admin") return "School Admin";
  if (normalized === "teacher") return "Teacher";
  if (normalized === "owner") return "Owner";
  return "Student";
}

function roleTone(role) {
  const normalized = String(role || "").toLowerCase();
  if (normalized === "owner") return "owner";
  if (normalized === "school_admin" || normalized === "teacher") return "staff";
  return "neutral";
}

function flattenUsers(payload) {
  const allUsers = [];

  (Array.isArray(payload?.owners) ? payload.owners : []).forEach((user) => {
    allUsers.push({ ...user, schoolNames: ["Platform-wide"] });
  });

  (Array.isArray(payload?.schools) ? payload.schools : []).forEach((school) => {
    const schoolName = school?.name || "School";
    (Array.isArray(school?.admins) ? school.admins : []).forEach((user) => {
      allUsers.push({ ...user, schoolNames: [schoolName] });
    });
    (Array.isArray(school?.unassignedTeachers) ? school.unassignedTeachers : []).forEach((user) => {
      allUsers.push({ ...user, schoolNames: [schoolName] });
    });
    (Array.isArray(school?.independentStudents) ? school.independentStudents : []).forEach((user) => {
      allUsers.push({ ...user, schoolNames: [schoolName] });
    });
    (Array.isArray(school?.classes) ? school.classes : []).forEach((classNode) => {
      (Array.isArray(classNode?.teachers) ? classNode.teachers : []).forEach((user) => {
        allUsers.push({ ...user, schoolNames: [schoolName] });
      });
      (Array.isArray(classNode?.students) ? classNode.students : []).forEach((user) => {
        allUsers.push({ ...user, schoolNames: [schoolName] });
      });
    });
  });

  (Array.isArray(payload?.platformIndependentStudents) ? payload.platformIndependentStudents : []).forEach((user) => {
    allUsers.push({ ...user, schoolNames: ["Platform-wide"] });
  });

  const unique = new Map();
  allUsers.forEach((user) => {
    if (!user?.id) return;
    const existing = unique.get(user.id);
    if (!existing) {
      unique.set(user.id, {
        ...user,
        schoolNames: Array.from(new Set(Array.isArray(user.schoolNames) ? user.schoolNames : [])).sort(),
      });
      return;
    }
    unique.set(user.id, {
      ...existing,
      schoolNames: Array.from(
        new Set([...(Array.isArray(existing.schoolNames) ? existing.schoolNames : []), ...(Array.isArray(user.schoolNames) ? user.schoolNames : [])])
      ).sort(),
    });
  });

  return Array.from(unique.values());
}

function buildIndependentSchoolSummary(schools = []) {
  return (Array.isArray(schools) ? schools : [])
    .map((school) => ({
      id: school?.id,
      name: school?.name || "School",
      students: Array.isArray(school?.independentStudents) ? school.independentStudents : [],
    }))
    .filter((school) => school.students.length > 0);
}

function matchesUser(user, normalizedQuery, roleFilter) {
  const role = String(user?.account_role || "").toLowerCase();
  if (roleFilter !== "all" && role !== roleFilter) return false;
  if (!normalizedQuery) return true;
  const haystack = [
    user?.full_name,
    user?.email,
    user?.last_entry_label,
    ...(Array.isArray(user?.schoolNames) ? user.schoolNames : []),
  ]
    .filter(Boolean)
    .join(" ")
    .toLowerCase();
  return haystack.includes(normalizedQuery);
}

function filterUsers(users, normalizedQuery, roleFilter, schoolName) {
  return (Array.isArray(users) ? users : []).filter((user) => {
    const scopedUser = { ...user, schoolNames: schoolName ? [schoolName] : user.schoolNames };
    const normalizedRole = String(scopedUser?.account_role || "").toLowerCase();

    if (roleFilter === "schools") {
      if (!["school_admin", "teacher", "student"].includes(normalizedRole)) return false;
      return matchesUser(scopedUser, normalizedQuery, "all");
    }

    if (roleFilter === "independent") {
      if (normalizedRole !== "student") return false;
      return matchesUser(scopedUser, normalizedQuery, "all");
    }

    return matchesUser(scopedUser, normalizedQuery, roleFilter);
  });
}

function UserActivityCard({ user, schoolName = null }) {
  const connectionCount = Number(user?.sign_in_count || 0);
  const roleLabel = formatRole(user?.account_role);
  return (
    <div style={userCard}>
      <div style={userHeader}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={userName}>{user?.full_name || "Unnamed user"}</div>
          <div style={subText}>{user?.email || "No email"}</div>
        </div>
        <div style={chipRow}>
          <span style={badge(roleTone(user?.account_role))}>{roleLabel}</span>
          <span style={badge(connectionCount > 0 ? "active" : "cold")}>
            {connectionCount} {connectionCount === 1 ? "connection" : "connections"}
          </span>
        </div>
      </div>
      <div style={detailGrid}>
        <div style={detailTile}>
          <div style={detailLabel}>Scope</div>
          <div style={detailValue}>{roleLabel === "Owner" ? "Platform-wide" : schoolName || "Platform-wide"}</div>
        </div>
        <div style={detailTile}>
          <div style={detailLabel}>First connection</div>
          <div style={detailValue}>{formatDateTime(user?.first_sign_in_at)}</div>
        </div>
        <div style={detailTile}>
          <div style={detailLabel}>Last connection</div>
          <div style={detailValue}>{formatDateTime(user?.last_sign_in_at)}</div>
        </div>
        <div style={detailTile}>
          <div style={detailLabel}>Last lane</div>
          <div style={detailValue}>{user?.last_entry_label || "—"}</div>
        </div>
      </div>
    </div>
  );
}

export default function OwnerActivityClient() {
  const [activity, setActivity] = useState({ owners: [], schools: [], platformIndependentStudents: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [openSchools, setOpenSchools] = useState({});
  const [openClasses, setOpenClasses] = useState({});
  const [independentOpen, setIndependentOpen] = useState(false);
  const [ownersOpen, setOwnersOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchOwnerActivity();
        if (!cancelled) {
          setActivity({
            owners: Array.isArray(payload?.owners) ? payload.owners : [],
            schools: Array.isArray(payload?.schools) ? payload.schools : [],
            platformIndependentStudents: Array.isArray(payload?.platformIndependentStudents)
              ? payload.platformIndependentStudents
              : [],
          });
        }
      } catch (nextError) {
        if (!cancelled) {
          setError(nextError?.message || "Unable to load owner activity.");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const flatUsers = useMemo(() => flattenUsers(activity), [activity]);

  const summary = useMemo(() => {
    const connected = flatUsers.filter((user) => Number(user?.sign_in_count || 0) > 0).length;
    const neverConnected = flatUsers.length - connected;
    const recent = flatUsers.filter((user) => {
      if (!user?.last_seen_at) return false;
      const last = new Date(user.last_seen_at).getTime();
      const daysAgo = Date.now() - last;
      return Number.isFinite(last) && daysAgo <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    const schoolIndependent = (Array.isArray(activity?.schools) ? activity.schools : []).reduce(
      (sum, school) => sum + (Array.isArray(school?.independentStudents) ? school.independentStudents.length : 0),
      0
    );
    const platformIndependent = Array.isArray(activity?.platformIndependentStudents)
      ? activity.platformIndependentStudents.length
      : 0;
    return { total: flatUsers.length, connected, neverConnected, recent, independent: schoolIndependent + platformIndependent };
  }, [activity, flatUsers]);

  const normalizedQuery = String(query || "").trim().toLowerCase();

  const filteredActivity = useMemo(() => {
    const owners = filterUsers(activity.owners, normalizedQuery, roleFilter, "Platform-wide");
    const schools = (Array.isArray(activity?.schools) ? activity.schools : [])
      .map((school) => {
        const schoolName = school?.name || "School";
        const admins = filterUsers(school?.admins, normalizedQuery, roleFilter, schoolName);
        const unassignedTeachers = filterUsers(school?.unassignedTeachers, normalizedQuery, roleFilter, schoolName);
        const independentStudents = filterUsers(school?.independentStudents, normalizedQuery, roleFilter, schoolName);
        const classes = (Array.isArray(school?.classes) ? school.classes : [])
          .map((classNode) => {
            const teachers = filterUsers(classNode?.teachers, normalizedQuery, roleFilter, schoolName);
            const students = filterUsers(classNode?.students, normalizedQuery, roleFilter, schoolName);
            return { ...classNode, teachers, students };
          })
          .filter((classNode) => {
            if (!normalizedQuery && roleFilter === "all") return true;
            return classNode.teachers.length > 0 || classNode.students.length > 0;
          });

        return {
          ...school,
          admins,
          unassignedTeachers,
          independentStudents,
          classes,
        };
      })
      .filter((school) => {
        if (!normalizedQuery && roleFilter === "all") return true;
        return (
          school.admins.length > 0 ||
          school.unassignedTeachers.length > 0 ||
          school.independentStudents.length > 0 ||
          school.classes.length > 0 ||
          String(school?.name || "").toLowerCase().includes(normalizedQuery)
        );
      });

    const platformIndependentStudents = filterUsers(
      activity.platformIndependentStudents,
      normalizedQuery,
      roleFilter,
      "Platform-wide"
    );

    return { owners, schools, platformIndependentStudents };
  }, [activity, normalizedQuery, roleFilter]);

  const hasAnyResults = useMemo(() => {
    return (
      filteredActivity.owners.length > 0 ||
      filteredActivity.platformIndependentStudents.length > 0 ||
      filteredActivity.schools.length > 0
    );
  }, [filteredActivity]);

  const independentSchoolSummary = useMemo(
    () => buildIndependentSchoolSummary(filteredActivity.schools),
    [filteredActivity.schools]
  );

  function toggleSchool(schoolId) {
    setOpenSchools((current) => ({ ...current, [schoolId]: !current[schoolId] }));
  }

  function toggleClass(classId) {
    setOpenClasses((current) => ({ ...current, [classId]: !current[classId] }));
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={title}>Owner Activity</div>
            <div style={subText}>
              Track who is connecting to the platform, when they last came in, and how often they have used it so far.
            </div>
          </div>
          <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
            <Link href="/owner" style={buttonSecondary}>
              Control Center
            </Link>
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
        </div>

        <div style={body}>
          <div style={statGrid}>
            <div style={statCard}>
              <div style={statLabel}>Tracked users</div>
              <div style={statValue}>{summary.total}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Connected at least once</div>
              <div style={statValue}>{summary.connected}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>No connections yet</div>
              <div style={statValue}>{summary.neverConnected}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Connected in last 7 days</div>
              <div style={statValue}>{summary.recent}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Independent students</div>
              <div style={statValue}>{summary.independent}</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <input
              style={input}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search by name, email, school, or lane"
            />
            <div style={filterRow}>
              {[
                ["all", "All roles"],
                ["schools", "Schools"],
                ["independent", "Independent students"],
              ].map(([value, label]) => {
                const active = roleFilter === value;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRoleFilter(value)}
                    style={{
                      ...buttonSecondary,
                      border: active ? "1px solid #88a5ba" : buttonSecondary.border,
                      background: active ? "#eef5f9" : "white",
                      color: active ? "#355267" : buttonSecondary.color,
                    }}
                  >
                    {label}
                  </button>
                );
              })}
            </div>
          </div>

          {error ? <div style={{ ...subText, color: "var(--brand-red)", fontWeight: 700 }}>{error}</div> : null}
          {loading ? <div style={subText}>Loading owner activity...</div> : null}

          {!loading ? (
            <>
              {roleFilter !== "schools" && roleFilter !== "independent" && filteredActivity.owners.length ? (
                <div style={sectionCard}>
                  <button type="button" style={sectionHeaderButton} onClick={() => setOwnersOpen((current) => !current)}>
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--heading)" }}>Platform-wide owners</div>
                      <div style={subText}>These accounts stay outside school scope and can see the full platform.</div>
                    </div>
                    <div style={{ ...badge("owner"), whiteSpace: "nowrap" }}>{ownersOpen ? "Click to close" : "Click to open"}</div>
                  </button>

                  {ownersOpen ? (
                    <div style={sectionBody}>
                      <div style={rosterGrid}>
                        {filteredActivity.owners.map((user) => (
                          <UserActivityCard key={user.id} user={user} schoolName="Platform-wide" />
                        ))}
                      </div>
                    </div>
                  ) : null}
                </div>
              ) : null}

              {roleFilter !== "schools" ? (
                <div style={sectionCard}>
                  <button
                    type="button"
                    style={sectionHeaderButton}
                    onClick={() => setIndependentOpen((current) => !current)}
                  >
                    <div style={{ display: "grid", gap: 4 }}>
                      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--heading)" }}>Independent student tracker</div>
                      <div style={subText}>
                        Use this to spot students who are active in the platform but not sitting inside a class roster right now.
                      </div>
                    </div>
                    <div style={{ ...badge("staff"), whiteSpace: "nowrap" }}>
                      {independentOpen ? "Click to close" : "Click to open"}
                    </div>
                  </button>

                  {independentOpen ? (
                    <div style={sectionBody}>
                      {independentSchoolSummary.length ? (
                        <div style={subSection}>
                          <div style={subSectionTitle}>By school</div>
                          <div style={{ display: "grid", gap: 10 }}>
                            {independentSchoolSummary.map((school) => (
                              <div key={school.id} style={sectionCard}>
                                <div style={{ ...sectionBody, paddingTop: 14 }}>
                                  <div style={userHeader}>
                                    <div style={{ display: "grid", gap: 4 }}>
                                      <div style={{ fontWeight: 800, color: "var(--heading)" }}>{school.name}</div>
                                      <div style={subText}>
                                        {school.students.length} independent {school.students.length === 1 ? "student" : "students"}
                                      </div>
                                    </div>
                                    <span style={badge("staff")}>{school.students.length}</span>
                                  </div>
                                  <div style={rosterGrid}>
                                    {school.students.map((user) => (
                                      <UserActivityCard key={user.id} user={user} schoolName={school.name} />
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {filteredActivity.platformIndependentStudents.length ? (
                        <div style={subSection}>
                          <div style={subSectionTitle}>Platform-wide</div>
                          <div style={rosterGrid}>
                            {filteredActivity.platformIndependentStudents.map((user) => (
                              <UserActivityCard key={user.id} user={user} schoolName="Platform-wide" />
                            ))}
                          </div>
                        </div>
                      ) : null}

                      {!independentSchoolSummary.length && !filteredActivity.platformIndependentStudents.length ? (
                        <div style={subText}>No independent students are being tracked yet.</div>
                      ) : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {roleFilter !== "independent"
                ? filteredActivity.schools.map((school) => {
                    const schoolOpen = !!openSchools[school.id];
                    const teacherCount =
                      (Array.isArray(school?.unassignedTeachers) ? school.unassignedTeachers.length : 0) +
                      (Array.isArray(school?.classes) ? school.classes.reduce((sum, classNode) => sum + classNode.teachers.length, 0) : 0);
                    const classStudentCount = Array.isArray(school?.classes)
                      ? school.classes.reduce((sum, classNode) => sum + classNode.students.length, 0)
                      : 0;
                    const independentCount = Array.isArray(school?.independentStudents) ? school.independentStudents.length : 0;

                    return (
                      <div key={school.id} style={sectionCard}>
                        <button type="button" style={sectionHeaderButton} onClick={() => toggleSchool(school.id)}>
                          <div style={{ display: "grid", gap: 4 }}>
                            <div style={{ fontSize: 22, fontWeight: 800, color: "var(--heading)" }}>{school.name}</div>
                            <div style={subText}>Open this school to review admins, classes, teachers, and students.</div>
                          </div>
                          <div style={{ ...badge("staff"), whiteSpace: "nowrap" }}>{schoolOpen ? "Click to close" : "Click to open"}</div>
                        </button>

                        {schoolOpen ? (
                          <div style={sectionBody}>
                            <div style={summaryGrid}>
                              <div style={miniStat}>
                                <div style={miniStatLabel}>Admins</div>
                                <div style={miniStatValue}>{school.admins.length}</div>
                              </div>
                              <div style={miniStat}>
                                <div style={miniStatLabel}>Teachers</div>
                                <div style={miniStatValue}>{teacherCount}</div>
                              </div>
                              <div style={miniStat}>
                                <div style={miniStatLabel}>Class students</div>
                                <div style={miniStatValue}>{classStudentCount}</div>
                              </div>
                              <div style={miniStat}>
                                <div style={miniStatLabel}>Independent students</div>
                                <div style={miniStatValue}>{independentCount}</div>
                              </div>
                            </div>

                            {school.admins.length ? (
                              <div style={subSection}>
                                <div style={subSectionTitle}>School admins</div>
                                <div style={rosterGrid}>
                                  {school.admins.map((user) => (
                                    <UserActivityCard key={user.id} user={user} schoolName={school.name} />
                                  ))}
                                </div>
                              </div>
                            ) : null}

                            {school.classes.length ? (
                              <div style={subSection}>
                                <div style={subSectionTitle}>Classes</div>
                                <div style={{ display: "grid", gap: 10 }}>
                                  {school.classes.map((classNode) => {
                                    const classOpen = !!openClasses[classNode.id];
                                    return (
                                      <div key={classNode.id} style={classCard}>
                                        <button type="button" style={classButton} onClick={() => toggleClass(classNode.id)}>
                                          <div style={{ display: "grid", gap: 4 }}>
                                            <div style={{ fontWeight: 800, color: "var(--heading)" }}>{classNode.name}</div>
                                            <div style={subText}>
                                              Teachers: {classNode.teachers.length} | Students: {classNode.students.length}
                                            </div>
                                          </div>
                                          <div style={{ ...badge("staff"), whiteSpace: "nowrap" }}>
                                            {classOpen ? "Click to close" : "Click to open"}
                                          </div>
                                        </button>

                                        {classOpen ? (
                                          <div style={classBody}>
                                            <div style={subSection}>
                                              <div style={subSectionTitle}>Teachers</div>
                                              {classNode.teachers.length ? (
                                                <div style={rosterGrid}>
                                                  {classNode.teachers.map((user) => (
                                                    <UserActivityCard key={user.id} user={user} schoolName={school.name} />
                                                  ))}
                                                </div>
                                              ) : (
                                                <div style={subText}>No teachers assigned to this class yet.</div>
                                              )}
                                            </div>

                                            <div style={subSection}>
                                              <div style={subSectionTitle}>Students</div>
                                              {classNode.students.length ? (
                                                <div style={rosterGrid}>
                                                  {classNode.students.map((user) => (
                                                    <UserActivityCard key={user.id} user={user} schoolName={school.name} />
                                                  ))}
                                                </div>
                                              ) : (
                                                <div style={subText}>No enrolled students in this class right now.</div>
                                              )}
                                            </div>
                                          </div>
                                        ) : null}
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : null}
                          </div>
                        ) : null}
                      </div>
                    );
                  })
                : null}

              {!hasAnyResults ? (
                <div style={sectionCard}>
                  <div style={{ ...sectionBody, paddingTop: 18 }}>
                    <div style={subText}>No matching activity yet.</div>
                  </div>
                </div>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
