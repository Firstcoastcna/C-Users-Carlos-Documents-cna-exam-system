"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

function AccessInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";

  const [code, setCode] = useState("");
  const [err, setErr] = useState("");

  const theme = useMemo(
    () => ({
      frameBorder: "#9fb2c7",
      chromeBg: "#e9f0f7",
      chromeBorder: "#b7c6d6",
      primaryBg: "#2b6cb0",
      primaryText: "white",
      secondaryBg: "#f4f6f8",
      secondaryText: "#1a1a1a",
      buttonBorder: "#9aa8b5",
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

  function Frame({ title, children, footer }) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            height: "675px",
            border: `2px solid ${theme.frameBorder}`,
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "white",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>

          <div style={{ flex: 1, padding: "18px" }}>{children}</div>

          <div
            style={{
              borderTop: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
            }}
          >
            {footer}
          </div>
        </div>
      </div>
    );
  }

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
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button style={{ ...btnPrimary, width: "220px" }} onClick={submit}>
            {t("Continue", "Continuar", "Continuer", "Kontinye")}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "520px", margin: "0 auto", paddingTop: "40px" }}>
        <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}>
          {t("Enter your access code", "Ingrese su código de acceso", "Entrez votre code d’accès", "Antre kòd aksè ou")}
        </div>

        <div style={{ color: "#333", lineHeight: "1.6", marginBottom: "16px" }}>
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
            padding: "12px",
            borderRadius: "10px",
            border: `1px solid ${theme.buttonBorder}`,
            fontSize: "16px",
          }}
        />

        {err ? (
          <div style={{ marginTop: "10px", color: "#ce0707", fontSize: "14px" }}>
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
