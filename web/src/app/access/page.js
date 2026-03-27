"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
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
        t(
          "Invalid access code.",
          "Codigo de acceso invalido.",
          "Code dacces invalide.",
          "Kod akse a pa valab."
        )
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
      title={t("ACCESS", "ACCESO", "ACCES", "AKSE")}
      theme={theme}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
          <button style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px", fontWeight: 700 }} onClick={submit}>
            {t("Continue", "Continuar", "Continuer", "Kontinye")}
          </button>
        </div>
      }
    >
      <div
        style={{
          maxWidth: "620px",
          margin: "0 auto",
          paddingTop: isNarrow ? "8px" : "18px",
        }}
      >
        <div
          style={{
            border: `1px solid ${theme.chromeBorder}`,
            borderRadius: "18px",
            background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
            boxShadow: "0 10px 24px rgba(31, 52, 74, 0.05)",
            padding: isNarrow ? "22px 18px" : "28px",
          }}
        >
          <div
            style={{
              fontSize: "12px",
              fontWeight: 800,
              letterSpacing: "0.08em",
              textTransform: "uppercase",
              color: "var(--brand-teal-dark)",
              marginBottom: "8px",
            }}
          >
            {t("Secure Entry", "Entrada segura", "Entree securisee", "Antre sekirize")}
          </div>

          <div
            style={{
              fontSize: isNarrow ? "24px" : "28px",
              fontWeight: 800,
              marginBottom: "10px",
              color: "var(--heading)",
              lineHeight: 1.2,
            }}
          >
            {t("Enter your access code", "Ingrese su codigo de acceso", "Entrez votre code dacces", "Antre kod akse ou")}
          </div>

          <div style={{ color: "#456173", lineHeight: "1.75", marginBottom: "18px", fontSize: "15px" }}>
            {t(
              "Use your access code to enter the CNA exam practice platform and continue to the guided onboarding steps.",
              "Use su codigo de acceso para entrar a la plataforma de practica del examen CNA y continuar con los pasos guiados.",
              "Utilisez votre code dacces pour entrer sur la plateforme de pratique de lexamen CNA et continuer vers les etapes guidees.",
              "Svi ak kod akse ou pou antre sou platfom pratik egzamen CNA a epi kontinye nan etap gid yo."
            )}
          </div>

          <div
            style={{
              border: `1px solid ${theme.chromeBorder}`,
              borderRadius: "14px",
              background: "white",
              padding: isNarrow ? "16px" : "18px",
            }}
          >
            <div style={{ fontSize: "13px", fontWeight: 700, color: "var(--heading)", marginBottom: "8px" }}>
              {t("Access code", "Codigo de acceso", "Code dacces", "Kod akse")}
            </div>

            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder={t("Enter code", "Ingrese el codigo", "Entrez le code", "Antre kod la")}
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

            <div style={{ marginTop: "10px", fontSize: "13px", color: "#607487", lineHeight: "1.6" }}>
              {t(
                "Access is required before entering the exam platform.",
                "Se requiere acceso antes de entrar en la plataforma del examen.",
                "Un acces est requis avant dentrer sur la plateforme dexamen.",
                "Ou bezwen akse anvan ou antre sou platfom egzamen an."
              )}
            </div>

            {err ? (
              <div style={{ marginTop: "12px", color: "var(--brand-red)", fontSize: "14px", fontWeight: 600 }}>
                {err}
              </div>
            ) : null}
          </div>
        </div>
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
