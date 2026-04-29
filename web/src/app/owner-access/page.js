"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchSchoolContext,
  getStudentSessionSnapshot,
  redirectRecoveryFlowIfPresent,
  requestPasswordReset,
  signOutStudent,
  signInStudent,
  syncStudentProfile,
} from "../lib/backend/auth/browserAuth";

const OWNER_EMAILS = [
  "carlos@firstcoasttrainingcenter.com",
  "cchaveztafur@gmail.com",
];

const shell = {
  maxWidth: 640,
  margin: "24px auto",
  padding: 20,
};

const card = {
  border: "2px solid var(--frame-border)",
  borderRadius: 16,
  overflow: "hidden",
  background: "white",
  boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
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
  fontSize: 24,
  fontWeight: 800,
  color: "var(--heading)",
};

const subText = {
  color: "#5a6b78",
  lineHeight: 1.6,
  fontSize: 14,
};

const inputStyle = {
  width: "100%",
  padding: "12px 14px",
  borderRadius: 10,
  border: "1px solid var(--chrome-border)",
  fontSize: 15,
  background: "white",
};

const btnPrimary = {
  padding: "12px 16px",
  borderRadius: 10,
  border: "none",
  background: "var(--brand-red)",
  color: "white",
  fontWeight: 700,
  cursor: "pointer",
};

const btnSecondary = {
  ...btnPrimary,
  background: "white",
  color: "#536779",
  border: "1px solid #cfdde6",
  textDecoration: "none",
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
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

function isAllowedOwnerEmail(email) {
  return OWNER_EMAILS.includes(String(email || "").trim().toLowerCase());
}

function hasSchoolAdminAccess(payload) {
  const staff = payload?.context?.staff;
  return Array.isArray(staff) && staff.some((row) => String(row?.role || "").toLowerCase() === "admin");
}

function hasTeacherAccess(payload) {
  const staff = payload?.context?.staff;
  return Array.isArray(staff) && staff.some((row) => String(row?.role || "").toLowerCase() === "teacher");
}

export default function OwnerAccessPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    if (redirectRecoveryFlowIfPresent()) {
      return;
    }

    void (async () => {
      try {
        if (redirectRecoveryFlowIfPresent()) return;
        const session = await getStudentSessionSnapshot().catch(() => null);
        if (!session?.user?.email || cancelled) return;

        if (isAllowedOwnerEmail(session.user.email)) {
          await syncStudentProfile().catch(() => null);
          if (!cancelled) {
            router.replace("/owner");
          }
          return;
        }

        const schoolContext = await fetchSchoolContext().catch(() => null);
        if (!cancelled && (hasSchoolAdminAccess(schoolContext) || hasTeacherAccess(schoolContext))) {
          router.replace("/owner");
        }
      } catch {
        // Stay on the admin access page if session lookup fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function handleSignIn() {
    setBusy(true);
    setMessage("");
    setMessageType("info");

    try {
      await signInStudent({ email, password });
      await syncStudentProfile().catch(() => null);

      if (!isAllowedOwnerEmail(email)) {
        const schoolContext = await fetchSchoolContext().catch(() => null);
        if (hasSchoolAdminAccess(schoolContext) || hasTeacherAccess(schoolContext)) {
          router.push("/owner");
          return;
        }

        setMessage("This account can sign in, but it is not authorized for the Control Center.");
        setMessageType("error");
        return;
      }

      router.push("/owner");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800, color: "var(--heading)" }}>
              First Coast CNA Exam Prep Platform
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#3f5564", marginTop: 2 }}>
              Control Center Access
            </div>
          </div>
          <img
            src="/FCCNA%20Logo%20n%20name.png"
            alt="First Coast CNA"
            style={{ height: "clamp(52px, 5vw, 72px)", width: "auto", display: "block" }}
          />
        </div>

        <div style={body}>
          <div style={{ color: "#4a6272", lineHeight: 1.6 }}>
            Use your owner, school admin, or teacher email and password to enter the Control Center.
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              style={inputStyle}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (message) setMessage("");
              }}
              placeholder="Control Center email"
              autoComplete="email"
            />
            <input
              style={inputStyle}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (message) setMessage("");
              }}
              placeholder="Password"
              type="password"
              autoComplete="current-password"
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button style={btnPrimary} disabled={busy} onClick={() => void handleSignIn()}>
              Open Control Center
            </button>
            <button
              type="button"
              style={btnSecondary}
              disabled={busy}
              onClick={async () => {
                try {
                  await signOutStudent();
                } catch {}
                router.replace("/signin");
              }}
            >
              Back
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
            <button
              style={{
                border: "none",
                background: "transparent",
                color: "var(--brand-teal-dark)",
                fontWeight: 700,
                cursor: "pointer",
                padding: 0,
              }}
              disabled={busy}
              onClick={async () => {
                setMessage("");
                setMessageType("info");

                if (!email.trim()) {
                  setMessage("Enter your Control Center email first so we can send the reset link.");
                  setMessageType("error");
                  return;
                }

                try {
                  await requestPasswordReset(email.trim(), "/reset-password?next=/owner-access");
                  setMessage("Reset link sent. Check your email to continue.");
                  setMessageType("success");
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Unable to send reset link.");
                  setMessageType("error");
                }
              }}
            >
              Forgot password?
            </button>
          </div>

          {message ? <InlineMessage tone={messageType}>{message}</InlineMessage> : null}
        </div>
      </div>
    </main>
  );
}
