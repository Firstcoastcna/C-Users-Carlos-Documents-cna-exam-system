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

const tableWrap = {
  overflowX: "auto",
  border: "1px solid #d6e1e8",
  borderRadius: 14,
};

const table = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: 900,
};

const th = {
  textAlign: "left",
  padding: "12px 14px",
  fontSize: 12,
  textTransform: "uppercase",
  letterSpacing: 0.3,
  color: "#607282",
  background: "#f8fbfd",
  borderBottom: "1px solid #d6e1e8",
};

const td = {
  padding: "12px 14px",
  borderBottom: "1px solid #e7eef3",
  verticalAlign: "top",
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
    tone === "active" ? "#eef8f1" : tone === "cold" ? "#fff8f8" : tone === "staff" ? "#eef5f9" : "#f4f7fa",
  color: tone === "active" ? "#1f6f3d" : tone === "cold" ? "var(--brand-red)" : "#38556a",
  border: tone === "active" ? "1px solid #bddfc6" : tone === "cold" ? "1px solid #efc2c2" : "1px solid #d6e1e8",
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

export default function OwnerActivityClient() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError("");
        const payload = await fetchOwnerActivity();
        if (!cancelled) {
          setItems(Array.isArray(payload?.items) ? payload.items : []);
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

  const filteredItems = useMemo(() => {
    const normalizedQuery = String(query || "").trim().toLowerCase();
    return items.filter((item) => {
      const matchesRole = roleFilter === "all" || String(item?.account_role || "").toLowerCase() === roleFilter;
      if (!matchesRole) return false;
      if (!normalizedQuery) return true;
      const haystack = [
        item?.full_name,
        item?.email,
        item?.last_entry_label,
        ...(Array.isArray(item?.schoolNames) ? item.schoolNames : []),
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();
      return haystack.includes(normalizedQuery);
    });
  }, [items, query, roleFilter]);

  const summary = useMemo(() => {
    const connected = items.filter((item) => Number(item?.sign_in_count || 0) > 0).length;
    const neverConnected = items.length - connected;
    const recent = items.filter((item) => {
      if (!item?.last_sign_in_at) return false;
      const last = new Date(item.last_sign_in_at).getTime();
      const daysAgo = Date.now() - last;
      return Number.isFinite(last) && daysAgo <= 7 * 24 * 60 * 60 * 1000;
    }).length;
    return { total: items.length, connected, neverConnected, recent };
  }, [items]);

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 6 }}>
            <div style={title}>Owner Activity</div>
            <div style={subText}>
              Track who is signing in, when they last connected, and how often they have used the platform so far.
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
              <div style={statLabel}>No sign-ins yet</div>
              <div style={statValue}>{summary.neverConnected}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Seen in last 7 days</div>
              <div style={statValue}>{summary.recent}</div>
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
                ["student", "Students"],
                ["teacher", "Teachers"],
                ["school_admin", "School admins"],
                ["owner", "Owners"],
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
            <div style={tableWrap}>
              <table style={table}>
                <thead>
                  <tr>
                    <th style={th}>User</th>
                    <th style={th}>Role</th>
                    <th style={th}>School</th>
                    <th style={th}>Connections</th>
                    <th style={th}>First sign-in</th>
                    <th style={th}>Last sign-in</th>
                    <th style={th}>Last lane</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredItems.length ? (
                    filteredItems.map((item) => {
                      const connectionCount = Number(item?.sign_in_count || 0);
                      const role = formatRole(item?.account_role);
                      const schools =
                        role === "Owner"
                          ? "Platform-wide"
                          : Array.isArray(item?.schoolNames) && item.schoolNames.length
                            ? item.schoolNames.join(", ")
                            : "—";
                      return (
                        <tr key={item.id}>
                          <td style={td}>
                            <div style={{ fontWeight: 800, color: "var(--heading)" }}>{item.full_name || "Unnamed user"}</div>
                            <div style={subText}>{item.email || "No email"}</div>
                          </td>
                          <td style={td}>
                            <span style={badge(role === "Student" ? "neutral" : "staff")}>{role}</span>
                          </td>
                          <td style={td}>{schools}</td>
                          <td style={td}>
                            <span style={badge(connectionCount > 0 ? "active" : "cold")}>{connectionCount}</span>
                          </td>
                          <td style={td}>{formatDateTime(item.first_sign_in_at)}</td>
                          <td style={td}>{formatDateTime(item.last_sign_in_at)}</td>
                          <td style={td}>{item.last_entry_label || "—"}</td>
                        </tr>
                      );
                    })
                  ) : (
                    <tr>
                      <td style={td} colSpan={7}>
                        <div style={subText}>No matching activity yet.</div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
