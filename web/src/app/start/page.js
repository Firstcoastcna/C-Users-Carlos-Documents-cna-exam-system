"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchUserPreferences,
  signOutStudent,
  updateUserPreferences,
} from "../lib/backend/auth/browserAuth";

function Frame({ title, children, footer, theme, headerAction }) {
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

  async function handleSignOut() {
    try {
      await signOutStudent();
    } catch {}
    router.replace("/signin");
  }

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  const headerButtons = isNarrow
    ? [
        {
          key: "sign-out",
          label: t("Sign out", "Cerrar sesion", "Deconnexion", "Dekonekte"),
          onClick: () => void handleSignOut(),
        },
        {
          key: "change-language",
          label: t("Change language", "Cambiar idioma", "Changer de langue", "Chanje lang"),
          onClick: () => router.push("/?force_lang=1"),
        },
        {
          key: "categories",
          label: t(
            "Understanding Categories",
            "Entender las categorias",
            "Comprendre les categories",
            "Konprann kategori yo"
          ),
          onClick: () => router.push(`/category-foundation?lang=${lang}`),
        },
      ]
    : [
        {
          key: "sign-out",
          label: t("Sign out", "Cerrar sesion", "Deconnexion", "Dekonekte"),
          onClick: () => void handleSignOut(),
        },
        {
          key: "categories",
          label: t(
            "Understanding Categories",
            "Entender las categorias",
            "Comprendre les categories",
            "Konprann kategori yo"
          ),
          onClick: () => router.push(`/category-foundation?lang=${lang}`),
        },
        {
          key: "change-language",
          label: t("Change language", "Cambiar idioma", "Changer de langue", "Chanje lang"),
          onClick: () => router.push("/?force_lang=1"),
        },
      ];

  return (
    <Frame
      title={t("MAIN MENU", "MENU PRINCIPAL", "MENU PRINCIPAL", "MENI PRENSIPAL")}
      theme={theme}
      headerAction={
        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {headerButtons.map((button) => (
            <button key={button.key} style={btnSecondary} onClick={button.onClick}>
              {button.label}
            </button>
          ))}
        </div>
      }
      footer={<div />}
    >
      <div style={{ maxWidth: "760px", margin: "0 auto", paddingTop: "8px" }}>
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
            onClick={() => router.push(`${skipExamWelcome ? "/pilot" : "/welcome"}?lang=${lang}`)}
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
