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

function InfoCard({ title, body, theme, tone = "default" }) {
  const palette =
    tone === "accent"
      ? {
          background: "linear-gradient(180deg, #ffffff 0%, #f3fbfd 100%)",
          border: theme.frameBorder,
        }
      : {
          background: "white",
          border: theme.chromeBorder,
        };

  return (
    <div
      style={{
        border: `1px solid ${palette.border}`,
        borderRadius: "16px",
        background: palette.background,
        padding: "18px",
        display: "grid",
        gap: 8,
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--heading)", lineHeight: 1.2 }}>{title}</div>
      <div style={{ color: "#456173", lineHeight: 1.7, fontSize: 14 }}>{body}</div>
    </div>
  );
}

function FoundationInner() {
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
      buttonBorder: "var(--button-border)",
    }),
    []
  );

  const btnPrimary = {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: `1px solid ${theme.primaryBg}`,
    background: theme.primaryBg,
    color: theme.primaryText,
    cursor: "pointer",
    width: isNarrow ? "100%" : "220px",
    fontWeight: 700,
  };

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  return (
    <Frame
      title={t(
        "CHAPTERS AND CATEGORIES",
        "CAPITULOS Y CATEGORIAS",
        "CHAPITRES ET CATEGORIES",
        "CHAPIT AK KATEGORI"
      )}
      theme={theme}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
          <button style={btnPrimary} onClick={() => router.push(`/start?lang=${lang}`)}>
            {t("Continue to Main Menu", "Continuar al menu principal", "Continuer vers le menu principal", "Kontinye nan meni prensipal la")}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "760px", margin: "0 auto" }}>
        <div
          style={{
            border: `1px solid ${theme.chromeBorder}`,
            borderRadius: "18px",
            background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
            boxShadow: "0 10px 24px rgba(31, 52, 74, 0.05)",
            padding: isNarrow ? "22px 18px" : "28px",
            marginBottom: 18,
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
            {t("Quick Orientation", "Orientacion rapida", "Orientation rapide", "Oryantasyon rapid")}
          </div>

          <div
            style={{
              fontSize: isNarrow ? 24 : 28,
              fontWeight: 800,
              marginBottom: 10,
              color: "var(--heading)",
              lineHeight: 1.2,
            }}
          >
            {t(
              "This platform helps you study in two ways",
              "Esta plataforma le ayuda a estudiar de dos maneras",
              "Cette plateforme vous aide a etudier de deux facons",
              "Platfom sa a ede ou etidye nan de fason"
            )}
          </div>

          <div style={{ color: "#456173", lineHeight: "1.75", marginBottom: "14px", fontSize: 14 }}>
            {t(
              "You will see questions organized by chapters and by categories. Both are useful, but they do different jobs.",
              "Verá preguntas organizadas por capitulos y por categorias. Ambos son utiles, pero cumplen funciones diferentes.",
              "Vous verrez des questions organisees par chapitres et par categories. Les deux sont utiles, mais n'ont pas le meme role.",
              "Ou pral we kestyon yo òganize pa chapit ak pa kategori. Toude itil, men yo pa fè menm travay la."
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
            gap: 16,
            marginBottom: 18,
          }}
        >
          <InfoCard
            theme={theme}
            tone="accent"
            title={t("Chapters", "Capitulos", "Chapitres", "Chapit")}
            body={t(
              "Chapters are the familiar study topics. They help you review the official CNA content areas, like safety, resident care, function, and changes in condition. Use chapters when you want to study by topic or review your notes and book.",
              "Los capitulos son los temas de estudio familiares. Le ayudan a revisar las areas oficiales de contenido CNA, como seguridad, cuidado del residente, funcion y cambios en la condicion. Use capitulos cuando quiera estudiar por tema o repasar sus apuntes y libro.",
              "Les chapitres sont les themes d'etude familiers. Ils vous aident a revoir les domaines officiels du contenu CNA, comme la securite, les soins au resident, la fonction et les changements d'etat. Utilisez les chapitres lorsque vous voulez etudier par sujet ou revoir vos notes et votre livre.",
              "Chapit yo se sijè etid ou deja konnen. Yo ede ou revize kontni ofisyel CNA yo, tankou sekirite, swen rezidan an, fonksyon, ak chanjman nan kondisyon. Sèvi ak chapit yo lè ou vle etidye pa sijè oswa revize nòt ak liv ou."
            )}
          />

          <InfoCard
            theme={theme}
            tone="accent"
            title={t("Categories", "Categorias", "Categories", "Kategori")}
            body={t(
              "Categories are a platform study tool. They group questions by the kind of CNA decision the question is testing, not by textbook topic. Use categories when you want to understand why a question is being asked and what kind of judgment the safest answer requires.",
              "Las categorias son una herramienta de estudio de la plataforma. Agrupan las preguntas por el tipo de decision de CNA que la pregunta esta evaluando, no por tema del libro. Use categorias cuando quiera entender por que se hace una pregunta y que tipo de juicio requiere la respuesta mas segura.",
              "Les categories sont un outil d'etude de la plateforme. Elles regroupent les questions selon le type de decision CNA que la question evalue, et non selon le sujet du manuel. Utilisez les categories lorsque vous voulez comprendre pourquoi une question est posee et quel type de jugement exige la reponse la plus sure.",
              "Kategori yo se yon zouti etid nan platfom nan. Yo gwoupe kestyon yo selon kalite desizyon CNA kestyon an ap teste, pa selon sijè liv la. Sèvi ak kategori yo lè ou vle konprann poukisa kestyon an poze ak ki kalite jijman repons ki pi an sekirite a mande."
            )}
          />
        </div>

        <InfoCard
          theme={theme}
          title={t("Simple comparison", "Comparacion simple", "Comparaison simple", "Konparezon senp")}
          body={t(
            "Chapter practice asks: What topic am I studying? Category practice asks: What kind of CNA decision is this question testing? The strongest study process is to use both: review by chapter, then strengthen decision-making by category.",
            "La practica por capitulo pregunta: ¿Que tema estoy estudiando? La practica por categoria pregunta: ¿Que tipo de decision de CNA esta evaluando esta pregunta? El proceso de estudio mas fuerte es usar ambos: revisar por capitulo y luego fortalecer la toma de decisiones por categoria.",
            "La pratique par chapitre demande : Quel sujet suis-je en train d'etudier ? La pratique par categorie demande : Quel type de decision CNA cette question evalue-t-elle ? Le processus d'etude le plus solide consiste a utiliser les deux : revoir par chapitre, puis renforcer la prise de decision par categorie.",
            "Pratik pa chapit mande: Ki sijè mwen ap etidye? Pratik pa kategori mande: Ki kalite desizyon CNA kestyon sa a ap teste? Pi bon fason pou etidye se sèvi ak toude: revize pa chapit, epi ranfòse fason ou pran desizyon pa kategori."
          )}
        />
      </div>
    </Frame>
  );
}

export default function FoundationPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <FoundationInner />
    </Suspense>
  );
}
