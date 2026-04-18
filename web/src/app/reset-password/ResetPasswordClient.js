"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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

export default function ResetPasswordClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [busy, setBusy] = useState(false);
  const [flowType, setFlowType] = useState("recovery");
  const nextPath = searchParams.get("next") || "/signin";

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
      const normalizedType = String(type || "").trim().toLowerCase();
      const isPasswordSetupFlow = normalizedType === "recovery" || normalizedType === "invite";

      if (!access_token || !refresh_token || !isPasswordSetupFlow) {
        setMessage("Open the reset link from your email to continue.");
        setReady(true);
        return;
      }

      try {
        await supabase.auth.setSession({ access_token, refresh_token });
        if (!cancelled) {
          setFlowType(normalizedType || "recovery");
          setReady(true);
        }
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
            {flowType === "invite"
              ? "Create a password to finish setting up your account."
              : "Choose a new password for your account."}
          </div>

          <div style={{ display: "grid", gap: 12 }}>
            <input
              style={inputStyle}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              type="password"
              placeholder="New password"
            />
            <input
              style={inputStyle}
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              type="password"
              placeholder="Confirm password"
            />
          </div>

          {message ? (
            <div style={{ padding: "12px 14px", borderRadius: 12, background: "#fff8eb", border: "1px solid #f0d59b", color: "#755200" }}>
              {message}
            </div>
          ) : null}

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button
              style={{ ...btnPrimary, opacity: !ready || !canSubmit || busy ? 0.7 : 1 }}
              disabled={!ready || !canSubmit || busy}
              onClick={async () => {
                setBusy(true);
                setMessage("");
                try {
                  const supabase = getSupabaseBrowserClient();
                  if (!supabase) throw new Error("Password reset is not configured.");
                  const { error } = await supabase.auth.updateUser({ password });
                  if (error) throw error;
                  setMessage("Password updated. Redirecting...");
                  setTimeout(() => router.replace(nextPath), 700);
                } catch (error) {
                  setMessage(error instanceof Error ? error.message : "Unable to reset password.");
                } finally {
                  setBusy(false);
                }
              }}
            >
              {busy ? "Saving..." : "Save new password"}
            </button>
          </div>
        </div>
      </div>
    </main>
  );
}
