"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  fetchUserPreferences,
  getStudentSessionSnapshot,
  requestPasswordReset,
  signInStudent,
  signUpStudent,
  syncStudentProfile,
} from "../lib/backend/auth/browserAuth";

const shell = {
  maxWidth: 760,
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
  fontSize: 22,
  fontWeight: 800,
  color: "var(--heading)",
  display: "flex",
  alignItems: "center",
  gap: 12,
};

const body = {
  padding: 20,
  display: "grid",
  gap: 16,
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
};

async function resolveLandingRoute() {
  const prefsPayload = await fetchUserPreferences().catch(() => null);
  const prefs = prefsPayload?.preferences || null;
  if (!prefs?.accessGranted) return "/access";
  if (!prefs.preferredLanguage) return "/?force_lang=1";
  if (!prefs.hasSeenFoundation) return `/foundation?lang=${prefs.preferredLanguage}`;
  if (!prefs.hasSeenCategoryIntro) return `/category-foundation?lang=${prefs.preferredLanguage}`;
  return `/start?lang=${prefs.preferredLanguage}`;
}

export default function SignInPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("info");
  const [signUpSuccess, setSignUpSuccess] = useState(false);
  const [cooldownSec, setCooldownSec] = useState(0);
  const [busy, setBusy] = useState(false);
  const messageTheme = {
    error: {
      bg: "#ffe2e0",
      border: "#f07b74",
      text: "#8a1111",
      accent: "#c72222",
      title: "Action needed",
    },
    success: {
      bg: "#e2f6ea",
      border: "#74c89b",
      text: "#135b3f",
      accent: "#1f7a4f",
      title: "Success",
    },
    info: {
      bg: "#e9f2fb",
      border: "#9cc4e4",
      text: "#244b67",
      accent: "#2f6c9c",
      title: "Heads up",
    },
  };

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const session = await getStudentSessionSnapshot().catch(() => null);
        if (!session?.access_token || cancelled) return;

        await syncStudentProfile().catch(() => null);
        const target = await resolveLandingRoute();
        if (!cancelled) {
          router.replace(target);
        }
      } catch {
        // Stay on sign-in page if the session check fails.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  async function runAction(action) {
    setBusy(true);
    setMessage("");
    setMessageType("info");
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
      setMessageType("error");
    } finally {
      setBusy(false);
    }
  }

  useEffect(() => {
    if (!cooldownSec) return;
    const id = window.setInterval(() => {
      setCooldownSec((value) => (value > 0 ? value - 1 : 0));
    }, 1000);
    return () => window.clearInterval(id);
  }, [cooldownSec]);

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 20, fontWeight: 800 }}>First Coast CNA Exam Prep Platform</div>
            <div style={{ fontSize: 18, fontWeight: 800, color: "#3f5564", marginTop: 2 }}>
              Student Sign In
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
            <div style={{ fontSize: 18, fontWeight: 600, color: "var(--heading)" }}>
              Welcome to our CNA exam prep platform.
            </div>
            <div style={{ marginTop: 8, fontWeight: 800, color: "var(--brand-red)" }}>
              New here? Use Create Account to get started.
            </div>
            <div style={{ marginTop: 8 }}>
              Sign in to keep your study progress in one place. Your language, practice, exam
              results, and reports will follow you across devices.
            </div>
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              style={inputStyle}
              value={fullName}
              onChange={(e) => {
                setFullName(e.target.value);
                if (message) setMessage("");
              }}
              placeholder="Full name (required for new accounts)"
            />
            <input
              style={inputStyle}
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (message) setMessage("");
              }}
              placeholder="Email"
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
            <button
              style={btnPrimary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  await signInStudent({ email, password });
                  await syncStudentProfile();
                  const target = await resolveLandingRoute();
                  router.push(target);
                })
              }
            >
              Sign In
            </button>

            <button
              style={{ ...btnSecondary, border: "2px solid var(--brand-red)", color: "var(--brand-red)" }}
              disabled={busy || signUpSuccess || cooldownSec > 0}
              onClick={() =>
                runAction(async () => {
                  if (!fullName.trim()) {
                    setMessage("Please enter your full name to create a new account.");
                    setMessageType("error");
                    return;
                  }
                  const data = await signUpStudent({ email, password, fullName });

                  if (data?.session?.access_token) {
                    await syncStudentProfile();
                    const target = await resolveLandingRoute();
                    router.push(target);
                    return;
                  }

                  setSignUpSuccess(true);
                  setCooldownSec(60);
                  setMessage(
                    "Account created. Check your email to confirm, then return here to sign in. If you don't see the email, check Spam or Promotions."
                  );
                  setMessageType("success");
                })
              }
            >
              {signUpSuccess ? "Check your email" : "Create Account"}
            </button>
          </div>

          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: 10,
              flexWrap: "wrap",
            }}
          >
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
              onClick={() =>
                runAction(async () => {
                  if (!email.trim()) {
                    setMessage("Enter your email first so we can send the reset link.");
                    setMessageType("error");
                    return;
                  }
                  await requestPasswordReset(email.trim());
                  setMessage("Reset link sent. Check your email to continue.");
                  setMessageType("success");
                })
              }
            >
              Forgot password?
            </button>
            <Link
              href="/owner-access"
              style={{
                color: "#6a7f90",
                fontWeight: 700,
                textDecoration: "none",
                fontSize: 13,
              }}
            >
              Admin Access
            </Link>
          </div>

          {message ? (() => {
            const theme = messageTheme[messageType] || messageTheme.info;
            return (
              <div
                style={{
                  padding: "12px 14px",
                  borderRadius: 12,
                  background: theme.bg,
                  border: `2px solid ${theme.border}`,
                  color: theme.text,
                  fontWeight: 600,
                  boxShadow: "0 10px 18px rgba(20, 35, 52, 0.08)",
                  borderLeft: `6px solid ${theme.accent}`,
                }}
              >
                <div style={{ fontWeight: 800, textTransform: "uppercase", letterSpacing: "0.06em", fontSize: 12 }}>
                  {theme.title}
                </div>
                <div style={{ marginTop: 6 }}>{message}</div>
              </div>
            );
          })() : null}

          {signUpSuccess ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "#f3fbfd",
                border: "1px solid #cfe3ee",
                color: "#33566d",
              }}
            >
              You can close this tab after confirming. The link will bring you back to this sign-in page.
              {cooldownSec > 0 ? ` You can try again in ${cooldownSec}s.` : ""}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
