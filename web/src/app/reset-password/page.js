"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { getSupabaseBrowserClient } from "../lib/backend/supabase/browserClient";

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
  fontSize: 24,
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

function getHashParams() {
  if (typeof window === "undefined") return {};
  const hash = window.location.hash || "";
  const params = new URLSearchParams(hash.startsWith("#") ? hash.slice(1) : hash);
  return Object.fromEntries(params.entries());
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      const supabase = getSupabaseBrowserClient();
      if (!supabase) {
        setMessage("Password reset is not configured.");
        setReady(true);
        return;
      }

      const { access_token, refresh_token, type } = getHashParams();
      if (!access_token || !refresh_token || type !== "recovery") {
        setMessage("Open the reset link from your email to continue.");
        setReady(true);
        return;
      }

      try {
        await supabase.auth.setSession({ access_token, refresh_token });
        if (!cancelled) setReady(true);
      } catch {
        if (!cancelled) {
          setMessage("Reset link is invalid or expired.");
          setReady(true);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const canSubmit = useMemo(() => password && confirm && password === confirm, [password, confirm]);

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>Reset Password</div>
        <div style={body}>
          <div style={{ color: "#4a6272", lineHeight: 1.6 }}>
            Choose a new password for your account.
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="New password"
              type="password"
              autoComplete="new-password"
              disabled={!ready}
            />
            <input
              style={inputStyle}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              placeholder="Confirm new password"
              type="password"
              autoComplete="new-password"
              disabled={!ready}
            />
          </div>

          <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
            <button
              style={btnPrimary}
              disabled={!ready || !canSubmit || busy}
              onClick={() => {
                setMessage("");
                if (!canSubmit) {
                  setMessage("Passwords must match.");
                  return;
                }
                setBusy(true);
                const supabase = getSupabaseBrowserClient();
                if (!supabase) {
                  setMessage("Password reset is not configured.");
                  setBusy(false);
                  return;
                }
                supabase.auth
                  .updateUser({ password })
                  .then(({ error }) => {
                    if (error) {
                      setMessage(error.message || "Unable to reset password.");
                      return;
                    }
                    setMessage("Password updated. You can now sign in.");
                    router.replace("/signin");
                  })
                  .catch(() => {
                    setMessage("Unable to reset password.");
                  })
                  .finally(() => setBusy(false));
              }}
            >
              Update Password
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
