"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import {
  fetchUserPreferences,
  getStudentSessionSnapshot,
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
  fontSize: 26,
  fontWeight: 800,
  color: "var(--heading)",
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
  if (!prefs.preferredLanguage) return "/";
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
  const [busy, setBusy] = useState(false);

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
    try {
      await action();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to continue.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>Student Sign In</div>
        <div style={body}>
          <div style={{ color: "#4a6272", lineHeight: 1.6 }}>
            Sign in to continue into the CNA study platform. Once your account is active, your
            language, progress, and reports can follow you across devices.
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              style={inputStyle}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              placeholder="Full name (required for new accounts)"
            />
            <input
              style={inputStyle}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email"
              autoComplete="email"
            />
            <input
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
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
              style={btnSecondary}
              disabled={busy}
              onClick={() =>
                runAction(async () => {
                  if (!fullName.trim()) {
                    setMessage("Please enter your full name to create a new account.");
                    return;
                  }
                  const data = await signUpStudent({ email, password, fullName });

                  if (data?.session?.access_token) {
                    await syncStudentProfile();
                    const target = await resolveLandingRoute();
                    router.push(target);
                    return;
                  }

                  setMessage(
                    "Account created. If email confirmation is required, confirm your email first and then sign in."
                  );
                })
              }
            >
              Create Account
            </button>
          </div>

          {message ? (
            <div
              style={{
                padding: "12px 14px",
                borderRadius: 12,
                background: "#fff8eb",
                border: "1px solid #f0d59b",
                color: "#755200",
              }}
            >
              {message}
            </div>
          ) : null}
        </div>
      </div>
    </main>
  );
}
