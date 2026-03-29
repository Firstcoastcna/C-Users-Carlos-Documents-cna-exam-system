"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

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

function Section({ title, children, theme }) {
  return (
    <div
      style={{
        padding: "18px",
        border: `1px solid ${theme.chromeBorder}`,
        borderRadius: "14px",
        background: "var(--surface-soft)",
      }}
    >
      <div style={{ fontWeight: 800, marginBottom: "10px", color: "var(--heading)", fontSize: 16 }}>{title}</div>
      <div style={{ color: "#334e61", lineHeight: "1.75" }}>{children}</div>
    </div>
  );
}

function PracticeWelcomeInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    let granted = false;
    try {
      granted = localStorage.getItem("cna_access_granted") === "1";
    } catch {}
    if (!granted) {
      router.replace(`/access?lang=${lang}`);
    }
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

  const btnSecondary = {
    ...btnBase,
    background: theme.secondaryBg,
    color: theme.secondaryText,
    width: "100%",
  };

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  return (
    <Frame
      title={t("PRACTICE WELCOME", "BIENVENIDO A PRACTICA", "BIENVENUE EN PRATIQUE", "BYENVENI NAN PRATIK")}
      theme={theme}
      headerAction={
        <button
          style={{
            ...btnSecondary,
            width: "auto",
            background: "white",
            border: `1px solid ${theme.chromeBorder}`,
            padding: "8px 11px",
            fontSize: "13px",
            fontWeight: 700,
          }}
          onClick={() => router.push(`/start?lang=${lang}`)}
        >
          {t("Back to Options", "Volver a las opciones", "Retour aux options", "Retounen nan opsyon yo")}
        </button>
      }
      footer={
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: "12px",
            flexWrap: "wrap",
            flexDirection: isNarrow ? "column" : "row",
            alignItems: isNarrow ? "stretch" : "center",
          }}
        >
          <button
            style={{ ...btnSecondary, width: isNarrow ? "100%" : "220px" }}
            onClick={() => router.push(`/practice-instructions?lang=${lang}`)}
          >
            {t(
              "Practice Instructions",
              "Instrucciones de practica",
              "Instructions de pratique",
              "Enstriksyon pou pratik"
            )}
          </button>

          <button
            style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px" }}
            onClick={() => router.push(`/practice?lang=${lang}`)}
          >
            {t("Go to Practice Hub", "Ir al Centro de Practica", "Aller au hub de pratique", "Ale nan Hub Pratik la")}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "740px", margin: "0 auto", paddingTop: "4px" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", color: "var(--heading)", lineHeight: 1.2 }}>
          {t(
            "Welcome to Your CNA Practice Platform",
            "Bienvenido a su plataforma de practica CNA",
            "Bienvenue sur votre plateforme de pratique CNA",
            "Byenveni sou platfom pratik CNA ou a"
          )}
        </div>

        <div style={{ color: "#456173", lineHeight: "1.7", marginBottom: "20px", fontSize: 16 }}>
          {t(
            "The Practice side is designed to help you build understanding, confidence, and decision-making without the pressure of a full timed exam.",
            "La parte de Practica esta disenada para ayudarle a desarrollar comprension, confianza y toma de decisiones sin la presion de un examen completo con tiempo.",
            "La partie Pratique est concue pour vous aider a developper la comprehension, la confiance et la prise de decision sans la pression d'un examen complet chronometre.",
            "Pati Pratik la fet pou ede ou devlope konpreyansyon, konfyans, ak fason ou pran desizyon san presyon yon egzamen konple ak tan."
          )}
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          <Section
            theme={theme}
            title={t("How practice works", "Como funciona la practica", "Comment fonctionne la pratique", "Kijan pratik la mache")}
          >
            <div>{t("Practice is untimed and uses shorter guided sessions.", "La practica no tiene limite de tiempo y utiliza sesiones guiadas mas cortas.", "La pratique n'est pas chronometree et utilise des sessions guidees plus courtes.", "Pratik la pa gen limit tan epi li itilize sesyon gide ki pi kout.")}</div>
            <div>{t("You can practice by Chapter, by Category, or in Mixed Practice.", "Puede practicar por capitulo, por categoria o en Practica mixta.", "Vous pouvez pratiquer par chapitre, par categorie ou en pratique mixte.", "Ou ka pratike pa Chapit, pa Kategori, oswa nan Pratik Melanje.")}</div>
            <div>{t("Practice by Chapter helps reinforce topics. Practice by Category helps strengthen CNA logic and decision-making.", "La practica por capitulo ayuda a reforzar temas. La practica por categoria ayuda a fortalecer la logica y la toma de decisiones CNA.", "La pratique par chapitre aide a renforcer les sujets. La pratique par categorie aide a renforcer la logique et la prise de decision CNA.", "Pratik pa Chapit ede ranfose sijè yo. Pratik pa Kategori ede ranfose lojik ak fason CNA pran desizyon.")}</div>
            <div>{t("Mixed Practice gives you a broader review without full-exam pressure.", "La Practica mixta le ofrece un repaso mas amplio sin la presion de un examen completo.", "La pratique mixte vous offre une revision plus large sans la pression d'un examen complet.", "Pratik Melanje ba ou yon revizyon ki pi laj san presyon yon egzamen konple.")}</div>
          </Section>

          <Section
            theme={theme}
            title={t("Review tools", "Herramientas de repaso", "Outils de revision", "Zouti revizyon")}
          >
            <div>{t("You can open the Chapter Review guide for a quick refresh of the main ideas.", "Puede abrir la guia de Revision de capitulos para repasar rapidamente las ideas principales.", "Vous pouvez ouvrir le guide de revision des chapitres pour revoir rapidement les idees principales.", "Ou ka louvri gid Revizyon Chapit la pou revize ide prensipal yo rapidman.")}</div>
            <div>{t("You can also open the Category Review guide to understand the 9 decision categories used throughout the platform.", "Tambien puede abrir la guia de Revision de categorias para comprender las 9 categorias de decision que se usan en toda la plataforma.", "Vous pouvez aussi ouvrir le guide de revision des categories pour comprendre les 9 categories de decision utilisees dans toute la plateforme.", "Ou ka louvri tou gid Revizyon Kategori a pou konprann 9 kategori desizyon yo itilize nan tout platfom nan.")}</div>
          </Section>

          <Section
            theme={theme}
            title={t("During practice", "Durante la practica", "Pendant la pratique", "Pandan pratik la")}
          >
            <div>{t("After each answer, you will see whether you were correct or incorrect.", "Despues de cada respuesta, vera si fue correcta o incorrecta.", "Apres chaque reponse, vous verrez si elle est correcte ou incorrecte.", "Apre chak repons, ou pral we si li te korek oswa pa korek.")}</div>
            <div>{t("You can open the explanation if you want more detail before moving on.", "Puede abrir la explicacion si desea mas detalle antes de continuar.", "Vous pouvez ouvrir l'explication si vous souhaitez plus de details avant de continuer.", "Ou ka louvri eksplikasyon an si ou vle plis detay anvan ou kontinye.")}</div>
            <div>{t("At the end of a session, you will receive a simple summary and can choose to practice again.", "Al final de una sesion, recibira un resumen sencillo y podra elegir practicar otra vez.", "A la fin d'une session, vous recevrez un resume simple et pourrez choisir de recommencer.", "Nan fen yon sesyon, ou pral resevwa yon rezime senp epi ou ka chwazi pratike ankò.")}</div>
          </Section>
        </div>
      </div>
    </Frame>
  );
}

export default function PracticeWelcomePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <PracticeWelcomeInner />
    </Suspense>
  );
}
