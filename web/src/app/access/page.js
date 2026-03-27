"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function Frame({ title, children, footer, theme }) {
  return (
    <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
      <div
        style={{
          minHeight: "675px",
          border: `2px solid ${theme.frameBorder}`,
          borderRadius: "16px",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          background: "white",
          boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
        }}
      >
        <div
          style={{
            borderBottom: `1px solid ${theme.chromeBorder}`,
            padding: "18px 20px",
            background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
            fontWeight: 800,
            textTransform: "uppercase",
            letterSpacing: "0.04em",
            color: "var(--heading)",
          }}
        >
          {title}
        </div>

        <div style={{ flex: 1, padding: "24px" }}>{children}</div>

        <div
          style={{
            borderTop: `1px solid ${theme.chromeBorder}`,
            padding: "16px 20px",
            background: "var(--surface-soft)",
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

function AccessInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";

  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  const theme = useMemo(
    () => ({
      frameBorder: "var(--frame-border)",
      chromeBg: "var(--chrome-bg)",
      chromeBorder: "var(--chrome-border)",
      primaryBg: "var(--brand-teal)",
      primaryText: "white",
      secondaryBg: "var(--brand-teal-soft)",
      secondaryText: "var(--brand-teal-dark)",
      buttonBorder: "var(--button-border)",
    }),
    []
  );

  const btnBase = {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: `1px solid ${theme.buttonBorder}`,
    cursor: "pointer",
  };

  const btnPrimary = {
    ...btnBase,
    background: theme.primaryBg,
    color: theme.primaryText,
    border: `1px solid ${theme.primaryBg}`,
    width: "100%",
  };

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  function submit() {
    setErr("");

    const MASTER_CODE = "FCCNA2026";

    const typed = code.trim().toUpperCase();
    if (typed !== MASTER_CODE) {
      setErr(
        t("Invalid access code.", "Código de acceso inválido.", "Code d’accès invalide.", "Kòd aksè a pa valab.")
      );
      return;
    }

    try {
      localStorage.setItem("cna_access_granted", "1");
    } catch {}

    router.push(`/welcome?lang=${lang}`);
  }

  return (
    <Frame
      title={t("ACCESS", "ACCESO", "ACCÈS", "AKSÈ")}
      theme={theme}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
          <button style={{ ...btnPrimary, width: "220px" }} onClick={submit}>
            {t("Continue", "Continuar", "Continuer", "Kontinye")}
          </button>
        </div>
      }
    >
      <div
        style={{
          maxWidth: "560px",
          margin: "0 auto",
          paddingTop: "24px",
          border: `1px solid ${theme.chromeBorder}`,
          borderRadius: "16px",
          background: "var(--surface-soft)",
          padding: "28px",
        }}
      >
        <div style={{ fontSize: "26px", fontWeight: 800, marginBottom: "10px", color: "var(--heading)" }}>
          {t("Enter your access code", "Ingrese su código de acceso", "Entrez votre code d’accès", "Antre kòd aksè ou")}
        </div>

        <div style={{ color: "#456173", lineHeight: "1.7", marginBottom: "18px" }}>
          {t(
            "You are entering a CNA exam practice platform. Enter your access code to continue.",
            "Está ingresando a una plataforma de práctica del examen CNA. Ingrese su código de acceso para continuar.",
            "Vous entrez sur une plateforme de pratique de l’examen CNA. Entrez votre code d’accès pour continuer.",
            "Ou pral antre nan yon platfòm pratik egzamen CNA. Antre kòd aksè ou pou kontinye."
          )}
        </div>

        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder={t("Access code", "Código de acceso", "Code d’accès", "Kòd aksè")}
          autoFocus
          style={{
            width: "100%",
            padding: "14px 15px",
            borderRadius: "12px",
            border: `1px solid ${theme.buttonBorder}`,
            fontSize: "16px",
            background: "white",
          }}
        />

        {err ? (
          <div style={{ marginTop: "12px", color: "var(--brand-red)", fontSize: "14px" }}>
            {err}
          </div>
        ) : null}
      </div>
    </Frame>
  );
}

export default function AccessPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <AccessInner />
    </Suspense>
  );
}
