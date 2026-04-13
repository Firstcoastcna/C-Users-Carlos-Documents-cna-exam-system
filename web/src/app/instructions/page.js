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
            justifyContent: "space-between",
            alignItems: "center",
            gap: 12,
          }}
        >
          <span>{title}</span>
          {headerAction ? <div>{headerAction}</div> : null}
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

function InstructionsInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    let granted = false;
    try {
      granted = localStorage.getItem("cna_access_granted") === "1";
      localStorage.setItem("cna_instructions_seen", "1");
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
      title={t("INSTRUCTIONS", "INSTRUCCIONES", "INSTRUCTIONS", "ENSTRIKSYON")}
      theme={theme}
      headerAction={
        <button
          style={{
            ...btnSecondary,
            width: "auto",
            minWidth: "130px",
            padding: "8px 12px",
            fontSize: "13px",
            opacity: 0.92,
            background: "white",
            color: "#536779",
            border: "1px solid #cfdde6",
          }}
          onClick={() => router.push(`/welcome?lang=${lang}`)}
        >
          {t("Back to welcome", "Volver a la bienvenida", "Retour a l'accueil", "Retounen nan byenvini")}
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
            style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px" }}
            onClick={() => router.push(`/exam-hub?lang=${lang}`)}
          >
            {t("Go to Exam Hub", "Ir al Centro de Examenes", "Aller au hub d'examen", "Ale nan Hub Egzamen an")}
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
          {t("How this works", "Como funciona", "Comment cela fonctionne", "Kijan sa mache")}
        </div>

        <ul style={{ lineHeight: "1.8", color: "#334e61", paddingLeft: "20px", fontSize: "14px" }}>
          <li>
            {t(
              "This is a timed 60-question exam. The timer continues until you finish or time expires.",
              "Este es un examen cronometrado de 60 preguntas. El tiempo continua hasta que termine o se agote.",
              "Ceci est un examen chronometre de 60 questions. Le temps continue jusqu'a la fin ou jusqu'a l'expiration.",
              "Sa a se yon egzamen 60 kestyon ak tan. Tan an kontinye jiskaske ou fini oswa tan an fini."
            )}
          </li>
          <li>
            {t(
              "Use Previous and Next to move between questions. Your selected answer is saved automatically.",
              "Use Anterior y Siguiente para moverse entre preguntas. Su respuesta seleccionada se guarda automaticamente.",
              "Utilisez Precedent et Suivant pour passer d'une question a l'autre. Votre reponse selectionnee est enregistree automatiquement.",
              "Sevi ak Previous ak Next pou deplase ant kestyon yo. Repons ou chwazi a sove otomatikman."
            )}
          </li>
          <li>
            {t(
              "Use Summary to see all questions, jump to any item, and filter by Answered / Unanswered / Marked.",
              "Use Resumen para ver todas las preguntas, saltar a cualquier item y filtrar por Respondidas / Sin responder / Marcadas.",
              "Utilisez Resume pour voir toutes les questions, aller a n'importe quel element et filtrer par Repondues / Sans reponse / Marquees.",
              "Sevi ak Summary pou we tout kestyon yo, ale sou nenpot kestyon, epi filtre pa Reponn / San repons / Make."
            )}
          </li>
          <li>
            {t(
              "Use Mark for Review to place a 🚩 on a question you want to revisit. Use Unmark Review to remove the flag.",
              "Use Marcar para revisar para colocar una 🚩 en una pregunta a la que quiera volver. Use Quitar marca para eliminarla.",
              "Utilisez Marquer a revoir pour placer un 🚩 sur une question que vous souhaitez revoir. Utilisez Retirer la marque pour l'enlever.",
              "Sevi ak Mark for Review pou mete yon 🚩 sou yon kestyon ou vle retounen sou li. Sevi ak Unmark Review pou retire mak la."
            )}
          </li>
          <li>
            {t(
              "Use Exit if you need to leave mid-exam. Your progress stays saved on this device, and you can resume later from the same question with the same timer.",
              "Use Salir si necesita salir a mitad del examen. Su progreso queda guardado en este dispositivo y puede reanudar despues desde la misma pregunta con el mismo tiempo.",
              "Utilisez Quitter si vous devez sortir en cours d'examen. Votre progression reste enregistree sur cet appareil et vous pourrez reprendre a la meme question avec le meme minuteur.",
              "Sevi ak Exit si ou bezwen soti nan mitan egzamen an. Pwogre ou rete sove sou aparey sa a epi ou ka reprann pita sou menm kestyon an ak menm tan an."
            )}
          </li>
          <li>
            {t(
              "Use End Test only when you are ready to submit. After you end the test, answers cannot be changed.",
              "Use Finalizar examen solo cuando este listo para enviar. Despues de finalizar, no se pueden cambiar las respuestas.",
              "Utilisez Terminer le test seulement lorsque vous etes pret a soumettre. Apres cela, les reponses ne peuvent plus etre modifiees.",
              "Sevi ak End Test selman le ou pare pou soumet. Apre ou fini tes la, ou pa ka chanje repons yo ankò."
            )}
          </li>
          <li>
            {t(
              "After finishing, or if time expires, you will see a Results Page followed by Analytics, Review Questions, and a Remediation Page for study guidance.",
              "Despues de finalizar, o si se agota el tiempo, vera una pagina de Resultados seguida de Analitica, Revisar preguntas y una pagina de Remediacion para guiar su estudio.",
              "Apres la fin, ou si le temps expire, vous verrez une page de Resultats suivie d'Analyse, Revoir les questions et une page de Remediation pour guider vos revisions.",
              "Apre ou fini, oswa si tan an fini, ou pral we yon paj Rezilta epi apre sa Analiz, Revize kestyon yo, ak yon paj Remedyasyon pou gide etid ou."
            )}
          </li>
        </ul>
        </div>
      </div>
    </Frame>
  );
}

export default function InstructionsPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <InstructionsInner />
    </Suspense>
  );
}
