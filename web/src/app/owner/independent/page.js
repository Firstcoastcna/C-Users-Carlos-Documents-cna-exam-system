"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { fetchOwnerOverview } from "../../lib/backend/auth/browserAuth";

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

const statGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
  gap: 10,
};

const statCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  background: "var(--surface-soft)",
  padding: "10px 12px",
  display: "grid",
  gap: 4,
};

const statLabel = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: "0.05em",
  textTransform: "uppercase",
  color: "#607282",
};

const statValue = {
  fontSize: 22,
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

export default function OwnerIndependentPage() {
  const searchParams = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [error, setError] = useState("");
  const [overview, setOverview] = useState(null);
  const [openStudents, setOpenStudents] = useState({});

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setError("");
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

  const independentStudents = useMemo(() => {
    const byUser = {};

    independentRedemptions.forEach((row) => {
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

    return Object.values(byUser)
      .map((item) => ({
        ...item,
        codes: Array.from(item.codes),
      }))
      .sort((a, b) => new Date(b.latestRedeemedAt).getTime() - new Date(a.latestRedeemedAt).getTime());
  }, [independentRedemptions, accessCodesById]);

  const activeIndependentCodes = accessCodes.filter((item) => !item.class_group_id && item.status === "active").length;

  useEffect(() => {
    const studentId = searchParams.get("student_id");
    if (!studentId) {
      return;
    }

    setOpenStudents((prev) => ({ ...prev, [studentId]: true }));

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
            <div style={title}>Independent Students</div>
            <div style={subText}>
              Review independent student activity and open student reports.
            </div>
          </div>
          <Link href="/owner" style={buttonSecondary}>
            Control Center
          </Link>
        </div>

        <div style={body}>
          {error ? <InlineMessage tone="error">{error}</InlineMessage> : null}
          {showLoadingNotice ? <InlineMessage>Loading independent students...</InlineMessage> : null}

          <div style={statGrid}>
            <div style={statCard}>
              <div style={statLabel}>Independent students</div>
              <div style={statValue}>{independentStudents.length}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Active codes</div>
              <div style={statValue}>{activeIndependentCodes}</div>
            </div>
            <div style={statCard}>
              <div style={statLabel}>Redemptions</div>
              <div style={statValue}>{independentRedemptions.length}</div>
            </div>
          </div>

          <div style={{ display: "grid", gap: 10 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: 18 }}>Student activity</div>
            {independentStudents.length ? (
              <div style={listGrid}>
                {independentStudents.map((student) => (
                  <details
                    key={student.userId}
                    id={`owner-student-${student.userId}`}
                    style={listCard}
                    open={!!openStudents[student.userId]}
                  >
                    <summary
                      style={detailsSummary}
                      onClick={(e) => {
                        e.preventDefault();
                        setOpenStudents((prev) => ({ ...prev, [student.userId]: !prev[student.userId] }));
                      }}
                    >
                      <div style={summaryRow}>
                        <div style={{ fontWeight: 800, color: "var(--heading)" }}>{student.name}</div>
                        <OpenHint isOpen={!!openStudents[student.userId]} />
                      </div>
                    </summary>
                    <div style={detailsBody}>
                      <div style={metaText}>
                        {student.email ? `${student.email} | ` : ""}
                        First access: {new Date(student.firstRedeemedAt).toLocaleString()}
                      </div>
                      <div style={metaText}>
                        Latest access: {new Date(student.latestRedeemedAt).toLocaleString()} | {student.redemptionCount} redemption
                        {student.redemptionCount === 1 ? "" : "s"}
                      </div>
                      <div style={metaText}>Codes used: {student.codes.join(", ")}</div>
                      <div style={actionsRow}>
                        <Link
                          href={`/owner/reports?scope=student&user_id=${encodeURIComponent(
                            student.userId
                          )}&student_id=${encodeURIComponent(student.userId)}&lang=en&from=independent`}
                          style={buttonSecondary}
                        >
                          View student report
                        </Link>
                      </div>
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
