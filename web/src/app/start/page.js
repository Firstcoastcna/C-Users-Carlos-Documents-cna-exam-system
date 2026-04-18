"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchUserPreferences,
  fetchStudentProfile,
  redirectToSignIn,
  signOutStudent,
  updateStudentProfile,
  updateUserPreferences,
} from "../lib/backend/auth/browserAuth";
import { useDisableBrowserNavigation } from "../lib/backend/auth/useDisableBrowserNavigation";
import { useProtectedPlatformPage } from "../lib/backend/auth/useProtectedPlatformPage";

function Frame({ title, children, footer, theme, headerAction, headerSize }) {
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
            fontSize: headerSize || "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: "12px",
          }}
        >
          <span>{title}</span>
          {headerAction ? <div>{headerAction}</div> : null}
        </div>

        <div style={{ flex: 1, padding: "24px", overflowY: "auto", background: "white" }}>{children}</div>

        <div
          style={{
            borderTop: `1px solid ${theme.chromeBorder}`,
            padding: "16px 20px",
            background: "var(--surface-soft)",
            minHeight: 64,
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

function PathCard({ title, body, onClick, buttonLabel, theme, extraContent = null }) {
  return (
    <div
      style={{
        padding: "20px",
        border: `1px solid ${theme.chromeBorder}`,
        borderRadius: "16px",
        background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
        boxShadow: "0 8px 20px rgba(31, 52, 74, 0.04)",
        display: "flex",
        flexDirection: "column",
        gap: "12px",
      }}
    >
      <div style={{ fontSize: 22, fontWeight: 800, color: "var(--heading)", lineHeight: 1.2 }}>{title}</div>
      <div style={{ color: "#456173", lineHeight: 1.7, fontSize: 14 }}>{body}</div>
      <div style={{ marginTop: "auto", display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={onClick}
          style={{
            padding: "10px 14px",
            fontSize: "14px",
            borderRadius: "10px",
            border: `1px solid ${theme.primaryBg}`,
            background: theme.primaryBg,
            color: theme.primaryText,
            cursor: "pointer",
            fontWeight: 700,
            minWidth: 190,
          }}
        >
          {buttonLabel}
        </button>
      </div>
      {extraContent ? <div>{extraContent}</div> : null}
    </div>
  );
}

function StartInner() {
  const router = useRouter();
  useProtectedPlatformPage();
  useDisableBrowserNavigation();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const [isNarrow, setIsNarrow] = useState(false);
  const getSkipWelcomeKey = (side, langCode) => `cna_skip_${side}_welcome::${langCode || "en"}`;
  const [skipPracticeWelcome, setSkipPracticeWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const initialLang = new URLSearchParams(window.location.search).get("lang") || "en";
      return localStorage.getItem(getSkipWelcomeKey("practice", initialLang)) === "1";
    } catch {
      return false;
    }
  });
  const [skipExamWelcome, setSkipExamWelcome] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      const initialLang = new URLSearchParams(window.location.search).get("lang") || "en";
      return localStorage.getItem(getSkipWelcomeKey("exam", initialLang)) === "1";
    } catch {
      return false;
    }
  });
  const [needsName, setNeedsName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");
  const [nameMessage, setNameMessage] = useState("");

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      let granted = false;
      try {
        granted = localStorage.getItem("cna_access_granted") === "1";
      } catch {}

      if (!granted) {
        try {
          const payload = await fetchUserPreferences();
          granted = !!payload?.preferences?.accessGranted;
          if (granted) {
            try {
              localStorage.setItem("cna_access_granted", "1");
            } catch {}
          }
        } catch {
          // Signed-out users continue through local mode.
        }
      }

      if (!granted && !cancelled) {
        router.replace(`/access?lang=${lang}`);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [router, lang]);

  useEffect(() => {
    function syncWidth() {
      if (typeof window === "undefined") return;
      setIsNarrow(window.innerWidth < 760);
    }

    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, []);

  useEffect(() => {
    const id = window.setTimeout(() => {
      try {
        setSkipPracticeWelcome(localStorage.getItem(getSkipWelcomeKey("practice", lang)) === "1");
        setSkipExamWelcome(localStorage.getItem(getSkipWelcomeKey("exam", lang)) === "1");
      } catch {
        setSkipPracticeWelcome(false);
        setSkipExamWelcome(false);
      }
    }, 0);

    return () => window.clearTimeout(id);
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const payload = await fetchUserPreferences();
        const prefs = payload?.preferences;
        if (!prefs || cancelled) return;

        setSkipPracticeWelcome(!!prefs.skipPracticeWelcome);
        setSkipExamWelcome(!!prefs.skipExamWelcome);

        try {
          localStorage.setItem(getSkipWelcomeKey("practice", lang), prefs.skipPracticeWelcome ? "1" : "0");
          localStorage.setItem(getSkipWelcomeKey("exam", lang), prefs.skipExamWelcome ? "1" : "0");
        } catch {}
      } catch {
        // Local fallback stays in place when no auth session exists.
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const payload = await fetchStudentProfile();
        const fullName = payload?.appUser?.full_name || "";
        if (cancelled) return;
        setNeedsName(!fullName);
        setNameDraft(fullName || "");
      } catch {
        if (!cancelled) {
          setNeedsName(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
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

  const btnSecondary = {
    padding: "8px 11px",
    fontSize: "13px",
    fontWeight: 700,
    borderRadius: "10px",
    border: `1px solid ${theme.chromeBorder}`,
    background: "white",
    color: theme.secondaryText,
    cursor: "pointer",
  };
  const btnSignOut = {
    ...btnSecondary,
    background: "#ffe8e6",
    border: "1px solid #f3b2ad",
    color: "#9c1c1c",
  };

  async function handleSignOut() {
    try {
      await signOutStudent();
    } catch {}
    redirectToSignIn();
  }

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  const headerButtons = [
    {
      key: "sign-out",
      label: t("Sign out", "Cerrar sesion", "Deconnexion", "Dekonekte"),
      onClick: () => void handleSignOut(),
      isSignOut: true,
    },
    {
      key: "orientation",
      label: t("Back to orientation", "Volver a la orientacion", "Retour a l'orientation", "Retounen nan oryantasyon an"),
      onClick: () => router.push(`/foundation?lang=${lang}`),
    },
  ];

  return (
    <Frame
      title={t("MAIN MENU", "MENU PRINCIPAL", "MENU PRINCIPAL", "MENI PRENSIPAL")}
      theme={theme}
      headerSize={isNarrow ? "20px" : "16px"}
      headerAction={
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {headerButtons.map((button) => (
            <button key={button.key} style={button.isSignOut ? btnSignOut : btnSecondary} onClick={button.onClick}>
              {button.label}
            </button>
          ))}
        </div>
      }
      footer={<div />}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto", paddingTop: "8px" }}>
        {needsName ? (
          <div
            style={{
              border: `1px solid ${theme.chromeBorder}`,
              borderRadius: "14px",
              padding: "16px",
              background: "linear-gradient(180deg, #ffffff 0%, #fff1ef 100%)",
              marginBottom: "16px",
              display: "grid",
              gap: "10px",
            }}
          >
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>
              {t("Add your name", "Agregue su nombre", "Ajoutez votre nom", "Ajoute non ou")}
            </div>
            <div style={{ color: "#5a6773", fontSize: 14, lineHeight: 1.6 }}>
              {t(
                "This helps instructors and support identify your account.",
                "Esto ayuda a identificar su cuenta.",
                "Cela aide a identifier votre compte.",
                "Sa ede idantifye kont ou."
              )}
            </div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
              <input
                value={nameDraft}
                onChange={(e) => setNameDraft(e.target.value)}
                placeholder={t("Full name", "Nombre completo", "Nom complet", "Non konple")}
                style={{
                  flex: "1 1 240px",
                  padding: "10px 12px",
                  borderRadius: "10px",
                  border: `1px solid ${theme.chromeBorder}`,
                  fontSize: 14,
                }}
              />
              <button
                style={{ ...btnSecondary, minWidth: 140 }}
                onClick={async () => {
                  setNameMessage("");
                  if (!nameDraft.trim()) {
                    setNameMessage(t("Please enter your full name.", "Ingrese su nombre completo.", "Veuillez saisir votre nom complet.", "Tanpri antre non konple ou."));
                    return;
                  }
                  try {
                    await updateStudentProfile({ fullName: nameDraft.trim() });
                    setNeedsName(false);
                  } catch {
                    setNameMessage(t("Unable to save name.", "No se pudo guardar el nombre.", "Impossible d'enregistrer le nom.", "Pa kapab sove non an."));
                  }
                }}
              >
                {t("Save name", "Guardar nombre", "Enregistrer le nom", "Sove non")}
              </button>
            </div>
            {nameMessage ? <div style={{ color: "var(--brand-red)", fontSize: 13 }}>{nameMessage}</div> : null}
          </div>
        ) : null}
        <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", color: "var(--heading)", lineHeight: 1.2 }}>
          {t(
            "Choose how you want to use the platform",
            "Elija como quiere usar la plataforma",
            "Choisissez comment vous souhaitez utiliser la plateforme",
            "Chwazi kijan ou vle itilize platfom nan"
          )}
        </div>

        <div style={{ color: "#456173", lineHeight: "1.7", marginBottom: "20px", fontSize: 14 }}>
          {t(
            "You can enter the guided Practice side to build understanding and confidence, or the Exam side to experience the full timed CNA test format.",
            "Puede entrar en la parte de Practica guiada para fortalecer la comprension y la confianza, o en la parte de Examen para vivir el formato completo y cronometrado del examen CNA.",
            "Vous pouvez entrer dans la partie Pratique guidee pour renforcer la comprehension et la confiance, ou dans la partie Examen pour vivre le format complet et chronometre du test CNA.",
            "Ou ka antre nan pati Pratik gide a pou bati konpreyansyon ak konfyans, oswa nan pati Egzamen an pou viv fom egzamen CNA a ak tout tan li."
          )}
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
            gap: "16px",
          }}
        >
          <PathCard
            theme={theme}
            title={t("Practice", "Practica", "Pratique", "Pratik")}
            body={t(
              "Use guided practice to work by Chapter, by Category, or in Mixed Practice with shorter untimed sessions, immediate feedback, and explanations.",
              "Use la practica guiada para trabajar por Capitulo, por Categoria o en Practica Mixta con sesiones mas cortas, sin limite de tiempo, con retroalimentacion inmediata y explicaciones.",
              "Utilisez la pratique guidee pour travailler par Chapitre, par Categorie ou en Pratique Mixte avec des sessions plus courtes, sans limite de temps, avec retour immediat et explications.",
              "Svi ak pratik gide pou travay pa Chapit, pa Kategori, oswa nan Pratik Melanje ak sesyon ki pi kout, san limit tan, ak fidbak touswit ansanm ak eksplikasyon."
            )}
            buttonLabel={t("Go to Practice", "Ir a la Practica", "Aller a la pratique", "Ale nan Pratik")}
            onClick={() => router.push(`${skipPracticeWelcome ? "/practice" : "/practice-welcome"}?lang=${lang}`)}
            extraContent={
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#5c6d7d",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={skipPracticeWelcome}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setSkipPracticeWelcome(next);
                    try {
                      localStorage.setItem(getSkipWelcomeKey("practice", lang), next ? "1" : "0");
                    } catch {}
                    void updateUserPreferences({
                      preferredLanguage: lang,
                      skipPracticeWelcome: next,
                    }).catch(() => {});
                  }}
                />
                <span>
                  {t(
                    "Skip welcome page",
                    "Omitir pagina de bienvenida",
                    "Ignorer la page de bienvenue",
                    "Sote paj byenvini an"
                  )}
                </span>
              </label>
            }
          />

          <PathCard
            theme={theme}
            title={t("Exam", "Examen", "Examen", "Egzamen")}
            body={t(
              "Use the exam side for the full timed CNA exam experience, including results, analytics, review questions, and remediation after each completed exam.",
              "Use la parte de examen para vivir la experiencia completa y cronometrada del examen de CNA, con resultados, analisis, revision de preguntas y remediacion despues de completar cada examen.",
              "Utilisez la partie examen pour vivre l'experience complete et chronometree de l'examen CNA, avec resultats, analyse, revision des questions et remediation apres avoir termine chaque examen.",
              "Svi ak pati egzamen an pou viv eksperyans egzamen CNA a ak tout tan li, ansanm ak rezilta, analiz, revizyon kestyon, ak remedyasyon apre ou fin konplete chak egzamen."
            )}
            buttonLabel={t("Go to Exam", "Ir al Examen", "Aller a l'examen", "Ale nan Egzamen")}
            onClick={() => router.push(`${skipExamWelcome ? "/exam-hub" : "/welcome"}?lang=${lang}`)}
            extraContent={
              <label
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "8px",
                  color: "#5c6d7d",
                  fontSize: "14px",
                  lineHeight: 1.5,
                  cursor: "pointer",
                }}
              >
                <input
                  type="checkbox"
                  checked={skipExamWelcome}
                  onChange={(e) => {
                    const next = e.target.checked;
                    setSkipExamWelcome(next);
                    try {
                      localStorage.setItem(getSkipWelcomeKey("exam", lang), next ? "1" : "0");
                    } catch {}
                    void updateUserPreferences({
                      preferredLanguage: lang,
                      skipExamWelcome: next,
                    }).catch(() => {});
                  }}
                />
                <span>
                  {t(
                    "Skip welcome page",
                    "Omitir pagina de bienvenida",
                    "Ignorer la page de bienvenue",
                    "Sote paj byenvini an"
                  )}
                </span>
              </label>
            }
          />
        </div>
        <div
          style={{
            border: `1px solid ${theme.chromeBorder}`,
            borderRadius: "14px",
            background: "linear-gradient(180deg, #ffffff 0%, #f3fbfd 100%)",
            padding: "14px 16px",
            display: "flex",
            alignItems: isNarrow ? "stretch" : "center",
            justifyContent: "space-between",
            gap: 12,
            flexWrap: "wrap",
            marginTop: 16,
          }}
        >
          <div style={{ flex: "1 1 300px", display: "grid", gap: 6 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>
              {t("Category Definitions", "Definiciones de categorias", "Definitions des categories", "Definisyon kategori yo")}
            </div>
            <div style={{ color: "#456173", lineHeight: 1.6, fontSize: 14 }}>
              {t(
                "Review the 9 decision categories the platform uses and how they connect to analytics and remediation.",
                "Revise las 9 categorias de decision que usa la plataforma y como se conectan con analitica y remediacion.",
                "Revoyez les 9 categories de decision utilisees par la plateforme et leur lien avec l'analyse et la remediation.",
                "Revize 9 kategori desizyon platfom nan itilize yo ak kijan yo konekte ak analiz ak remedyasyon."
              )}
            </div>
          </div>
          <button
            onClick={() => router.push(`/category-foundation?lang=${lang}`)}
            style={{
              ...btnSecondary,
              width: isNarrow ? "100%" : "220px",
              background: "white",
              border: "2px solid #7aa6c5",
            }}
          >
            {t("Open Category Guide", "Abrir guia de categorias", "Ouvrir le guide des categories", "Louvri gid kategori yo")}
          </button>
        </div>

      </div>
    </Frame>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <StartInner />
    </Suspense>
  );
}
