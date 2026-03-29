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

        <div style={{ flex: 1, padding: "24px", overflowY: "auto" }}>{children}</div>

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

function PracticeInstructionsInner() {
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
      title={t("PRACTICE INSTRUCTIONS", "INSTRUCCIONES DE PRACTICA", "INSTRUCTIONS DE PRATIQUE", "ENSTRIKSYON POU PRATIK")}
      theme={theme}
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
            onClick={() => router.push(`/practice-welcome?lang=${lang}`)}
          >
            {t("Back to Welcome", "Volver a la bienvenida", "Retour a l'accueil", "Retounen nan byenvini")}
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
      <div style={{ maxWidth: "740px", margin: "0 auto" }}>
        <div
          style={{
            padding: "18px 20px",
            border: `1px solid ${theme.chromeBorder}`,
            borderRadius: "14px",
            background: "var(--surface-soft)",
          }}
        >
          <div style={{ fontSize: "26px", fontWeight: 800, marginBottom: "10px", color: "var(--heading)" }}>
            {t("How practice works", "Como funciona la practica", "Comment fonctionne la pratique", "Kijan pratik la mache")}
          </div>

          <ul style={{ lineHeight: "1.8", color: "#334e61", paddingLeft: "20px" }}>
            <li>
              {t(
                "Practice is an untimed guided-learning mode designed to build understanding and confidence.",
                "La practica es un modo de aprendizaje guiado sin limite de tiempo, disenado para fortalecer la comprension y la confianza.",
                "La pratique est un mode d'apprentissage guide sans limite de temps, concu pour renforcer la comprehension et la confiance.",
                "Pratik se yon mòd aprantisaj gide san limit tan, ki fet pou bati konpreyansyon ak konfyans."
              )}
            </li>
            <li>
              {t(
                "You can choose Practice by Chapter, Practice by Category, or Mixed Practice.",
                "Puede elegir Practica por capitulo, Practica por categoria o Practica mixta.",
                "Vous pouvez choisir la pratique par chapitre, la pratique par categorie ou la pratique mixte.",
                "Ou ka chwazi Pratik pa Chapit, Pratik pa Kategori, oswa Pratik Melanje."
              )}
            </li>
            <li>
              {t(
                "Chapter and Category practice let you choose one focus area at a time. Mixed Practice gives you a broader review.",
                "La practica por capitulo y por categoria le permite elegir un solo enfoque a la vez. La practica mixta ofrece un repaso mas amplio.",
                "La pratique par chapitre et par categorie vous permet de choisir un seul domaine a la fois. La pratique mixte offre une revision plus large.",
                "Pratik pa Chapit ak pa Kategori pèmèt ou chwazi yon sèl zòn pou konsantre sou li a la fwa. Pratik Melanje ba ou yon revizyon ki pi laj."
              )}
            </li>
            <li>
              {t(
                "You can choose 5, 10, or 15 questions for a session.",
                "Puede elegir 5, 10 o 15 preguntas para una sesion.",
                "Vous pouvez choisir 5, 10 ou 15 questions pour une session.",
                "Ou ka chwazi 5, 10, oswa 15 kestyon pou yon sesyon."
              )}
            </li>
            <li>
              {t(
                "After each answer, you will see whether you were correct or incorrect.",
                "Despues de cada respuesta, vera si fue correcta o incorrecta.",
                "Apres chaque reponse, vous verrez si elle est correcte ou incorrecte.",
                "Apre chak repons, ou ap wè si li te korek oswa pa korek."
              )}
            </li>
            <li>
              {t(
                "You can open the explanation if you want more detail before moving to the next question.",
                "Puede abrir la explicacion si desea mas detalle antes de pasar a la siguiente pregunta.",
                "Vous pouvez ouvrir l'explication si vous souhaitez plus de details avant de passer a la question suivante.",
                "Ou ka louvri eksplikasyon an si ou vle plis detay anvan ou ale sou kestyon ki vin apre a."
              )}
            </li>
            <li>
              {t(
                "At the end, you will receive a simple practice summary and can choose to practice again or return to the platform.",
                "Al final, recibira un resumen sencillo de practica y podra elegir entre volver a practicar o regresar a la plataforma.",
                "A la fin, vous recevrez un resume simple de pratique et pourrez choisir de recommencer ou de revenir a la plateforme.",
                "Nan fen an, ou pral resevwa yon rezime senp sou pratik la epi ou ka chwazi pratike ankò oswa retounen sou platfòm nan."
              )}
            </li>
          </ul>
        </div>
      </div>
    </Frame>
  );
}

export default function PracticeInstructionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <PracticeInstructionsInner />
    </Suspense>
  );
}
