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

function WelcomeInner() {
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
      title={t("WELCOME", "BIENVENIDO", "BIENVENUE", "BYENVENI")}
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
          onClick={() => {
            router.push("/?force_lang=1");
          }}
        >
          {t("Change Language", "Cambiar idioma", "Changer de langue", "Chanje lang")}
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
            onClick={() => {
              router.push(`/instructions?lang=${lang}`);
            }}
          >
            {t(
              "Exam Instructions",
              "Instrucciones del examen",
              "Instructions de l'examen",
              "Enstriksyon egzamen"
            )}
          </button>

          <button
            style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px" }}
            onClick={() => {
              router.push(`/pilot?lang=${lang}`);
            }}
          >
            {t(
              "Go to Exam Hub",
              "Ir al Centro de Examenes",
              "Aller au hub d'examen",
              "Ale nan Hub Egzamen an"
            )}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "740px", margin: "0 auto", paddingTop: "4px" }}>
        <div style={{ fontSize: "28px", fontWeight: 800, marginBottom: "12px", color: "var(--heading)", lineHeight: 1.2 }}>
          {t(
            "Welcome to Your CNA Exam Practice Platform",
            "Bienvenido a su plataforma de practica del examen CNA",
            "Bienvenue sur votre plateforme de pratique de l'examen CNA",
            "Byenveni sou platfom pratik egzamen CNA ou a"
          )}
        </div>

        <div style={{ color: "#456173", lineHeight: "1.7", marginBottom: "20px", fontSize: 16 }}>
          {t(
            "This platform is designed to help you prepare for the CNA exam by practicing in a format that feels close to the real testing experience.",
            "Esta plataforma esta disenada para ayudarle a prepararse para el examen CNA mediante practica en un formato parecido a la experiencia real del examen.",
            "Cette plateforme est concue pour vous aider a vous preparer a l'examen CNA en pratiquant dans un format proche de l'experience reelle du test.",
            "Platfom sa a fet pou ede w prepare pou egzamen CNA a le w pratike nan yon fom ki sanble ak eksperyans reyel egzamen an."
          )}
        </div>

        <div style={{ display: "grid", gap: "16px" }}>
          <Section
            theme={theme}
            title={t(
              "How the platform works",
              "Como funciona la plataforma",
              "Fonctionnement de la plateforme",
              "Kijan platfom nan mache"
            )}
          >
            <div>{t("You have access to 4 full practice exams.", "Tiene acceso a 4 examenes completos de practica.", "Vous avez acces a 4 examens blancs complets.", "Ou gen akses a 4 egzamen pratik konple.")}</div>
            <div>{t("Each exam includes 60 questions.", "Cada examen incluye 60 preguntas.", "Chaque examen comprend 60 questions.", "Chak egzamen gen 60 kestyon.")}</div>
            <div>{t("You have 90 minutes to complete each exam.", "Tiene 90 minutos para completar cada examen.", "Vous disposez de 90 minutes pour terminer chaque examen.", "Ou gen 90 minit pou fini chak egzamen.")}</div>
            <div>{t("After you complete all 4 exams, the exam set can be refreshed so you can practice again.", "Despues de completar los 4 examenes, el conjunto puede renovarse para que practique otra vez.", "Apres avoir termine les 4 examens, la serie peut etre renouvelee pour que vous puissiez pratiquer a nouveau.", "Apre ou fini 4 egzamen yo, seri egzamen an ka rafrechi pou ou ka pratike ankò.")}</div>
            <div>{t("Inside the Exam Hub, you can open both the Chapter Review and Category Review guides for quick study support before testing.", "Dentro del Centro de Examenes, puede abrir tanto la Revision de capitulos como la Revision de categorias para un apoyo rapido de estudio antes del examen.", "Dans le hub d'examen, vous pouvez ouvrir a la fois le guide de revision des chapitres et le guide de revision des categories pour un soutien rapide avant le test.", "Anndan Hub Egzamen an, ou ka louvri ni Revizyon Chapit yo ni Revizyon Kategori yo pou yon sip?? etid rapid anvan ou teste.")}</div>
            <div>{t("The chapter guide helps refresh the main ideas, while the category guide explains the 9 decision categories the platform uses to measure CNA logic, decision-making, and what to study next.", "La guia de capitulos ayuda a repasar las ideas principales, mientras que la guia de categorias explica las 9 categorias de decision que la plataforma utiliza para medir la logica CNA, la toma de decisiones y lo que debe estudiar despues.", "Le guide des chapitres aide a revoir les idees principales, tandis que le guide des categories explique les 9 categories de decision que la plateforme utilise pour mesurer la logique CNA, la prise de decision et ce qu'il faut etudier ensuite.", "Gid chapit la ede revize ide prensipal yo, pandan gid kategori a esplike 9 kategori desizyon platfom nan itilize pou mezire lojik CNA, fason ou pran desizyon, ak sa pou etidye apre.")}</div>
          </Section>

          <Section
            theme={theme}
            title={t(
              "After you finish an exam",
              "Despues de terminar un examen",
              "Apres avoir termine un examen",
              "Apre ou fini yon egzamen"
            )}
          >
            <div>{t("You will receive a results page with your score and a basic performance summary.", "Recibira una pagina de resultados con su puntuacion y un resumen basico de su rendimiento.", "Vous recevrez une page de resultats avec votre score et un resume general de votre performance.", "Ou pral resevwa yon paj rezilta ak not ou ansanm ak yon rezime debaz sou fason ou te fe a.")}</div>
            <div>{t("You will also see an analytics page that highlights your strengths, weak areas, and what to study next.", "Tambien vera una pagina de analitica que destaca sus fortalezas, areas debiles y que estudiar despues.", "Vous verrez egalement une page d'analyse qui met en avant vos points forts, vos points faibles et ce qu'il faut etudier ensuite.", "Ou pral we tou yon paj analiz ki montre fos ou, febles ou, ak sa pou etidye apre sa.")}</div>
            <div>{t("From there, you can choose to review the questions you missed and/or start a remediation session.", "Desde alli, puede revisar las preguntas que fallo y/o comenzar una sesion de remediacion.", "A partir de la, vous pouvez revoir les questions manquees et/ou commencer une session de remediation.", "Depi la, ou ka chwazi revize kestyon ou te rate yo epi/oswa komanse yon sesyon remedyasyon.")}</div>
          </Section>

          <Section
            theme={theme}
            title={t("Remediation", "Remediacion", "Remediation", "Remedyasyon")}
          >
            <div>{t("Remediation gives you a shorter set of targeted questions based on the areas where you need the most support.", "La remediacion le ofrece un conjunto mas corto de preguntas dirigidas segun las areas donde necesita mas apoyo.", "La remediation vous propose une serie plus courte de questions ciblees selon les domaines ou vous avez le plus besoin d'aide.", "Remedyasyon ba ou yon seri kestyon ki pi kout epi plis vize sou zòn kote ou bezwen plis sipò.")}</div>
            <div>{t("It is designed to help you strengthen weak areas and improve your decision-making before taking another full exam.", "Esta disenada para ayudarle a fortalecer las areas debiles y mejorar su toma de decisiones antes de presentar otro examen completo.", "Elle est concue pour vous aider a renforcer vos points faibles et a ameliorer votre prise de decision avant de refaire un examen complet.", "Li fet pou ede ou ranfose zòn ki fèb yo epi amelyore fason ou pran desizyon anvan ou fè yon lòt egzamen konplè.")}</div>
            <div>{t("Remediation is optional, but it is recommended when you want more focused practice.", "La remediacion es opcional, pero se recomienda cuando desea una practica mas enfocada.", "La remediation est facultative, mais elle est recommandee si vous souhaitez une pratique plus ciblee.", "Remedyasyon opsyonel, men li rekòmande lè ou bezwen yon pratik ki pi vize.")}</div>
          </Section>

          <Section
            theme={theme}
            title={t("To continue", "Para continuar", "Pour continuer", "Pou kontinye")}
          >
            <div>{t("Click Exam Instructions to review how to navigate your exam before you begin.", "Haga clic en Instrucciones del examen para revisar como navegar su examen antes de comenzar.", "Cliquez sur Instructions de l'examen pour voir comment naviguer dans votre examen avant de commencer.", "Klike sou Enstriksyon egzamen pou revize kijan pou navige egzamen an anvan ou kòmanse.")}</div>
            <div>{t("Click Go to Exam Hub to go directly to the available practice exams.", "Haga clic en Ir al Centro de Examenes para ir directamente a los examenes de practica disponibles.", "Cliquez sur Aller au hub d'examen pour acceder directement aux examens de pratique disponibles.", "Klike sou Ale nan Hub Egzamen an pou ale dirèkteman nan egzamen pratik ki disponib yo.")}</div>
          </Section>
        </div>
      </div>
    </Frame>
  );
}

export default function WelcomePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <WelcomeInner />
    </Suspense>
  );
}
