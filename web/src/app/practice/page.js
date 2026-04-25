"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { loadAllPracticeSessionRecords, loadPracticeSessionRecord, savePracticeSessionRecord } from "../lib/practiceSessionPersistence";
import { redirectToSignIn, resolveStudentEntryState, signOutStudent } from "../lib/backend/auth/browserAuth";
import { useDisableBrowserNavigation } from "../lib/backend/auth/useDisableBrowserNavigation";
import { useProtectedPlatformPage } from "../lib/backend/auth/useProtectedPlatformPage";

function Frame({ title, subtitle, children, footer, theme, headerAction }) {
  return (
    <div style={{ maxWidth: 900, margin: "0 auto", padding: "18px" }}>
      <div
        style={{
          border: `2px solid ${theme.frameBorder}`,
          borderRadius: "16px",
          overflow: "hidden",
          background: "white",
          boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
        }}
      >
        <div
          style={{
            padding: "18px 20px 16px",
            background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
            borderBottom: `1px solid ${theme.chromeBorder}`,
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              gap: 10,
              alignItems: "flex-start",
              flexWrap: "nowrap",
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, color: "var(--heading)", marginBottom: 4 }}>
              {title}
            </div>
            {headerAction ? <div>{headerAction}</div> : null}
          </div>
          <div style={{ color: "var(--brand-teal-dark)", lineHeight: 1.6, maxWidth: 760, fontSize: 14 }}>{subtitle}</div>
        </div>

        <div style={{ padding: "20px" }}>{children}</div>

        <div
          style={{
            padding: "14px 20px",
            background: "var(--surface-soft)",
            borderTop: `1px solid ${theme.chromeBorder}`,
          }}
        >
          {footer}
        </div>
      </div>
    </div>
  );
}

function SectionCard({ title, body, action, theme, tone = "default", inlineAction = false, alignAction = "end", stretchAction = false }) {
  const tones = {
    default: {
      background: "#fbfdff",
      border: "var(--frame-border)",
      title: "var(--heading)",
      body: "#4d6174",
    },
    accent: {
      background: "var(--brand-teal-soft)",
      border: "var(--frame-border)",
      title: "var(--heading)",
      body: "#445f78",
    },
    muted: {
      background: "var(--surface-soft)",
      border: "var(--chrome-border)",
      title: "#314556",
      body: "#5c6d7d",
    },
  };

  const palette = tones[tone] || tones.default;

  return (
    <div
      style={{
        padding: "16px",
        border: `1px solid ${palette.border}`,
        borderRadius: "14px",
        background: palette.background,
      }}
    >
      <div style={{ fontWeight: 800, fontSize: 16, color: palette.title, marginBottom: 6 }}>{title}</div>
      {inlineAction && action ? (
        <div
          style={{
            display: "flex",
            gap: 12,
            alignItems: "flex-start",
            flexWrap: "wrap",
          }}
        >
          <div style={{ color: palette.body, lineHeight: 1.6, fontSize: 14, flex: "1 1 320px" }}>{body}</div>
          <div
            style={{
              display: "flex",
              justifyContent: alignAction === "start" ? "flex-start" : "flex-end",
              marginTop: alignAction === "start" ? 0 : -6,
              width: stretchAction ? "100%" : "auto",
            }}
          >
            {action}
          </div>
        </div>
      ) : (
        <>
          <div style={{ color: palette.body, lineHeight: 1.6, fontSize: 14 }}>{body}</div>
          {action ? <div style={{ marginTop: 10, display: "flex", justifyContent: "flex-end" }}>{action}</div> : null}
        </>
      )}
    </div>
  );
}

function CollapsibleSection({ title, hint, openHint, closeHint, defaultOpen = false, children }) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <details
      open={defaultOpen}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      style={{ border: "1px solid var(--chrome-border)", borderRadius: 14, background: "white", overflow: "hidden" }}
    >
      <summary style={{ cursor: "pointer", listStyle: "none", padding: "14px 16px", background: "var(--surface-soft)" }}>
        <div style={{ display: "grid", gap: 4 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
            <div style={{ fontWeight: 800, color: "var(--heading)" }}>{title}</div>
            <div style={{ fontSize: 11, fontWeight: 700, color: "#607282", whiteSpace: "nowrap" }}>
              {isOpen ? closeHint || openHint : openHint}
            </div>
          </div>
          {hint ? <div style={{ fontSize: 13, color: "var(--muted)" }}>{hint}</div> : null}
        </div>
      </summary>
      <div style={{ padding: 14 }}>{children}</div>
    </details>
  );
}

function PracticeInner() {
  const router = useRouter();
  useProtectedPlatformPage();
  useDisableBrowserNavigation();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const storageMode = sp.get("storage") === "server" ? "server" : "local";
  const forceServer = storageMode === "server";
  const serverUser = forceServer ? "dev-practice-server-user" : null;
  const [isNarrow, setIsNarrow] = useState(false);
  const [mode, setMode] = useState("chapter");
  const [count, setCount] = useState(5);
  const [selectedChapter, setSelectedChapter] = useState(1);
  const [selectedCategory, setSelectedCategory] = useState("Change in Condition");
  const [activeSession, setActiveSession] = useState(null);
  const [practiceHistory, setPracticeHistory] = useState([]);
  const [authReady, setAuthReady] = useState(false);

  async function refreshActiveSession() {
    try {
      let filtered = await loadAllPracticeSessionRecords(lang, { forceServer, serverUser });
      let ordered = [...filtered].sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
      const activeSessions = ordered.filter((session) => session?.status === "active");

      if (activeSessions.length > 1) {
        const staleActiveSessions = activeSessions.slice(1);
        await Promise.all(
          staleActiveSessions.map((session) =>
            savePracticeSessionRecord(
              {
                ...session,
                status: "exited",
                exited_at: Date.now(),
              },
              { forceServer, serverUser }
            )
          )
        );
        filtered = await loadAllPracticeSessionRecords(lang, { forceServer, serverUser });
        ordered = [...filtered].sort((a, b) => Number(b.created_at || 0) - Number(a.created_at || 0));
      }

      queueMicrotask(() => {
        setPracticeHistory(ordered);
      });
      const latestActive = ordered.find((session) => session?.status === "active") || null;
      const full =
        latestActive?.session_id
          ? await loadPracticeSessionRecord(latestActive.session_id, { forceServer, serverUser })
          : null;
      queueMicrotask(() => {
        if (!latestActive?.session_id) {
          setActiveSession(null);
          return;
        }
        if (full?.lang && full.lang !== lang) {
          setActiveSession(null);
          return;
        }
        setActiveSession(full || latestActive);
      });
    } catch {
      queueMicrotask(() => {
        setActiveSession(null);
        setPracticeHistory([]);
      });
    }
  }

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const state = await resolveStudentEntryState();
        if (cancelled) return;

        if (state.status === "signin") {
          router.replace("/signin");
          return;
        }

        if (state.status === "access") {
          router.replace(`/access?lang=${lang}`);
          return;
        }

        try {
          localStorage.setItem("cna_access_granted", "1");
          localStorage.setItem("cna_app_lang", lang);
        } catch {}
        setAuthReady(true);
      } catch {
        router.replace("/signin");
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
    function syncActive() {
      if (!authReady) return;
      void refreshActiveSession();
    }

    function onVisible() {
      if (document.visibilityState === "visible" && authReady) void refreshActiveSession();
    }

    if (authReady) {
      void refreshActiveSession();
    }
    window.addEventListener("focus", syncActive);
    window.addEventListener("storage", syncActive);
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      window.removeEventListener("focus", syncActive);
      window.removeEventListener("storage", syncActive);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [authReady, lang]);

  const theme = useMemo(
    () => ({
      frameBorder: "var(--frame-border)",
      chromeBorder: "var(--chrome-border)",
      primaryBg: "var(--brand-teal)",
      primaryText: "#ffffff",
      secondaryBg: "var(--brand-teal-soft)",
      secondaryText: "var(--brand-teal-dark)",
      buttonBorder: "var(--button-border)",
    }),
    []
  );
  const btnGhost = {
    padding: "8px 12px",
    fontSize: "13px",
    borderRadius: "10px",
    border: `1px solid ${theme.buttonBorder}`,
    background: "white",
    color: theme.secondaryText,
    cursor: "pointer",
    fontWeight: 700,
  };

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  async function handleSignOut() {
    try {
      await signOutStudent();
    } catch {}
    redirectToSignIn();
  }

  function categoryLabel(cat) {
    return {
      en: {
        "Change in Condition": "Change in Condition",
        "Communication & Emotional Support": "Communication & Emotional Support",
        "Dignity & Resident Rights": "Dignity & Resident Rights",
        "Environment & Safety": "Environment & Safety",
        "Infection Control": "Infection Control",
        "Mobility & Positioning": "Mobility & Positioning",
        "Observation & Safety": "Observation & Safety",
        "Personal Care & Comfort": "Personal Care & Comfort",
        "Scope of Practice & Reporting": "Scope of Practice & Reporting",
      },
      es: {
        "Change in Condition": "Cambio en la condicion",
        "Communication & Emotional Support": "Comunicacion y apoyo emocional",
        "Dignity & Resident Rights": "Dignidad y derechos del residente",
        "Environment & Safety": "Entorno y seguridad",
        "Infection Control": "Control de infecciones",
        "Mobility & Positioning": "Movilidad y posicionamiento",
        "Observation & Safety": "Observacion y seguridad",
        "Personal Care & Comfort": "Cuidado personal y confort",
        "Scope of Practice & Reporting": "Alcance de practica y reporte",
      },
      fr: {
        "Change in Condition": "Changement de l'etat",
        "Communication & Emotional Support": "Communication et soutien emotionnel",
        "Dignity & Resident Rights": "Dignite et droits du resident",
        "Environment & Safety": "Environnement et securite",
        "Infection Control": "Controle des infections",
        "Mobility & Positioning": "Mobilite et positionnement",
        "Observation & Safety": "Observation et securite",
        "Personal Care & Comfort": "Soins personnels et confort",
        "Scope of Practice & Reporting": "Champ de pratique et signalement",
      },
      ht: {
        "Change in Condition": "Chanjman nan kondisyon",
        "Communication & Emotional Support": "Kominikasyon ak sipor emosyonel",
        "Dignity & Resident Rights": "Diyite ak dwa rezidan an",
        "Environment & Safety": "Anviwonman ak sekirite",
        "Infection Control": "Kontwol enfeksyon",
        "Mobility & Positioning": "Mobilite ak pozisyonman",
        "Observation & Safety": "Obsevasyon ak sekirite",
        "Personal Care & Comfort": "Swen pesonel ak konfo",
        "Scope of Practice & Reporting": "Limit pratik ak rapo",
      },
    }[lang]?.[cat] || cat;
  }

  function categoryNumber(cat) {
    return categoryOptions.indexOf(cat) + 1;
  }

  function categoryButtonLabel(cat) {
    const number = categoryNumber(cat);
    return t(
      `Category ${number}`,
      `Categoria ${number}`,
      `Categorie ${number}`,
      `Kategori ${number}`
    );
  }

  function chapterLabel(chapter) {
    return t(
      `Chapter ${chapter}`,
      `Capitulo ${chapter}`,
      `Chapitre ${chapter}`,
      `Chapit ${chapter}`
    );
  }

  function chapterLongLabel(chapter) {
    return {
      en: {
        1: "Chapter 1 - Role, Rights, Communication, and Professionalism",
        2: "Chapter 2 - Promotion of Safety",
        3: "Chapter 3 - Function and Independence",
        4: "Chapter 4 - Basic Care, Comfort, Dignity, and Infection Control",
        5: "Chapter 5 - Changes in Condition and Specialized Care",
      },
      es: {
        1: "Capitulo 1 - Rol, derechos, comunicacion y profesionalismo",
        2: "Capitulo 2 - Promocion de la seguridad",
        3: "Capitulo 3 - Funcion e independencia",
        4: "Capitulo 4 - Cuidado basico, confort, dignidad y control de infecciones",
        5: "Capitulo 5 - Cambios en la condicion y cuidado especializado",
      },
      fr: {
        1: "Chapitre 1 - Role, droits, communication et professionnalisme",
        2: "Chapitre 2 - Promotion de la securite",
        3: "Chapitre 3 - Fonction et independance",
        4: "Chapitre 4 - Soins de base, confort, dignite et controle des infections",
        5: "Chapitre 5 - Changements de l'etat et soins specialises",
      },
      ht: {
        1: "Chapit 1 - Wol, dwa, kominikasyon ak pwofesyonalis",
        2: "Chapit 2 - Pwomosyon sekirite",
        3: "Chapit 3 - Fonksyon ak endepandans",
        4: "Chapit 4 - Swen debaz, konfo, diyite ak kontwol enfeksyon",
        5: "Chapit 5 - Chanjman nan kondisyon ak swen espesyalize",
      },
    }[lang]?.[chapter] || chapterLabel(chapter);
  }

  function categorySupportLabel(cat) {
    return {
      en: {
        "Change in Condition": "Notice when something is new, worse, or concerning.",
        "Communication & Emotional Support": "Choose calm, respectful, and supportive communication.",
        "Dignity & Resident Rights": "Protect privacy, choice, dignity, and resident rights.",
        "Environment & Safety": "Watch for hazards in the room and surroundings.",
        "Infection Control": "Prevent contamination and reduce the spread of germs.",
        "Mobility & Positioning": "Keep the resident safe during movement, transfer, and positioning.",
        "Observation & Safety": "Recognize risks and warning signs before harm increases.",
        "Personal Care & Comfort": "Support comfort and proper daily care.",
        "Scope of Practice & Reporting": "Know what to do, what not to do, and what to report.",
      },
      es: {
        "Change in Condition": "Detecte cuando algo es nuevo, peor o preocupante.",
        "Communication & Emotional Support": "Elija una comunicacion calmada, respetuosa y de apoyo.",
        "Dignity & Resident Rights": "Proteja la privacidad, la eleccion, la dignidad y los derechos del residente.",
        "Environment & Safety": "Observe peligros en la habitacion y en el entorno.",
        "Infection Control": "Prevenga la contaminacion y reduzca la propagacion de germenes.",
        "Mobility & Positioning": "Mantenga al residente seguro durante el movimiento, el traslado y el posicionamiento.",
        "Observation & Safety": "Reconozca riesgos y senales de alerta antes de que aumente el dano.",
        "Personal Care & Comfort": "Apoye la comodidad y el cuidado diario adecuado.",
        "Scope of Practice & Reporting": "Sepa que hacer, que no hacer y que debe reportar.",
      },
      fr: {
        "Change in Condition": "Reperez quand quelque chose est nouveau, plus grave ou inquietant.",
        "Communication & Emotional Support": "Choisissez une communication calme, respectueuse et rassurante.",
        "Dignity & Resident Rights": "Protegez la vie privee, le choix, la dignite et les droits du resident.",
        "Environment & Safety": "Reperez les dangers dans la chambre et l'environnement.",
        "Infection Control": "Prevenez la contamination et reduisez la propagation des germes.",
        "Mobility & Positioning": "Gardez le resident en securite pendant le deplacement, le transfert et le positionnement.",
        "Observation & Safety": "Reconnaissez les risques et les signes d'alerte avant que la situation ne s'aggrave.",
        "Personal Care & Comfort": "Soutenez le confort et les soins quotidiens appropries.",
        "Scope of Practice & Reporting": "Sachez quoi faire, quoi ne pas faire et ce qui doit etre signale.",
      },
      ht: {
        "Change in Condition": "Remake le yon bagay vin nouvo, pi mal, oswa bay enkyetid.",
        "Communication & Emotional Support": "Chwazi yon kominikasyon kalm, respekte, ak soutni.",
        "Dignity & Resident Rights": "Pwoteje vi prive, chwa, diyite, ak dwa rezidan an.",
        "Environment & Safety": "Veye danje ki nan chanm nan ak nan anviwonman an.",
        "Infection Control": "Anpeche kontaminasyon epi diminye pwopagasyon mikwob yo.",
        "Mobility & Positioning": "Kenbe rezidan an an sekirite pandan mouvman, transfere, ak pozisyonman.",
        "Observation & Safety": "Rekonet risk ak siy avetisman anvan sitiyasyon an vin pi mal.",
        "Personal Care & Comfort": "Soutni konfo ak bon swen chak jou.",
        "Scope of Practice & Reporting": "Konnen sa pou fe, sa pou pa fe, ak sa pou rapote.",
      },
    }[lang]?.[cat] || "";
  }

  const TEXT = {
    title: t("CNA Practice Hub", "Centro de Practica CNA", "Hub de pratique CNA", "Hub Pratik CNA"),
    subtitle: t(
      "Choose how you want to practice below: by chapter, by category, or mixed practice. Sessions are untimed, range from 5 to 15 questions, and focus on building understanding and confidence.",
      "Elija como quiere practicar abajo: por capitulo, por categoria o practica mixta. Las sesiones no tienen limite de tiempo, van de 5 a 15 preguntas y se enfocan en desarrollar comprension y confianza.",
      "Choisissez comment vous voulez pratiquer ci-dessous : par chapitre, par categorie ou pratique mixte. Les sessions ne sont pas chronometrees, vont de 5 a 15 questions et visent a developper la comprehension et la confiance.",
      "Chwazi kijan ou vle pratike anba a: pa chapit, pa kategori, oswa pratik melanje. Sesyon yo pa gen limit tan, yo genyen 5 a 15 kestyon, epi yo konsantre sou bati konpreyansyon ak konfyans."
    ),
    practiceInstructionsTitle: t(
      "Practice Instructions",
      "Instrucciones de la practica",
      "Instructions de pratique",
      "Enstriksyon pou pratik"
    ),
    practiceInstructionsBody: t(
      "Before you start, you can review the practice instructions to understand how feedback works and how to use chapter, category, and mixed practice.",
      "Antes de comenzar, puede revisar las instrucciones de practica para entender como funciona la retroalimentacion y como usar practica por capitulo, categoria y mixta.",
      "Avant de commencer, vous pouvez consulter les instructions de pratique pour comprendre le retour et comment utiliser les pratiques par chapitre, categorie et mixte.",
      "Anvan ou komanse, ou ka li enstriksyon pratik yo pou konprann kijan fidbak mache ak kijan pou itilize pratik pa chapit, kategori, ak melanje."
    ),
    openHint: isNarrow
      ? t("Tap to open", "Toque para abrir", "Touchez pour ouvrir", "Peze pou louvri")
      : t("Click to open", "Haga clic para abrir", "Cliquez pour ouvrir", "Klike pou louvri"),
    closeHint: isNarrow
      ? t("Tap to close", "Toque para cerrar", "Touchez pour fermer", "Peze pou femen")
      : t("Click to close", "Haga clic para cerrar", "Cliquez pour fermer", "Klike pou femen"),
    backToWelcome: t("Back to main menu", "Volver al menu principal", "Retour au menu principal", "Retounen nan meni prensipal la"),
    modesTitle: t("Choose a practice mode", "Elija un modo de practica", "Choisissez un mode de pratique", "Chwazi yon mÃƒÂ²d pratik"),
    chapterTitle: t("Choose one chapter", "Elija un capitulo", "Choisissez un chapitre", "Chwazi yon chapit"),
    categoryTitle: t("Choose one category", "Elija una categoria", "Choisissez une categorie", "Chwazi yon kategori"),
    categoryGroup1: t(
      "Notice and Understand",
      "Observar y comprender",
      "Observer et comprendre",
      "ObsÃƒÂ¨ve epi konprann"
    ),
    categoryGroup2: t(
      "Protect and Support",
      "Proteger y apoyar",
      "Proteger et soutenir",
      "Pwoteje epi soutni"
    ),
    categoryGroup3: t(
      "Respect, Move, and Report",
      "Respetar, movilizar y reportar",
      "Respecter, mobiliser et signaler",
      "Respekte, deplase, epi rapÃƒÂ²te"
    ),
    countTitle: t("Choose a session size", "Elija el tamano de la sesion", "Choisissez la taille de la session", "Chwazi kantite kestyon yo"),
    countHelp: t(
      "This is the number of questions in each practice session.",
      "Esta es la cantidad de preguntas en cada sesion de practica.",
      "Il s'agit du nombre de questions dans chaque session de pratique.",
      "Sa se kantite kestyon ki nan chak sesyon pratik."
    ),
    modeChapter: t("Practice by Chapter", "Practica por capitulo", "Pratique par chapitre", "Pratik pa Chapit"),
    modeCategory: t("Practice by Category", "Practica por categoria", "Pratique par categorie", "Pratik pa Kategori"),
    modeMixed: t("Mixed Practice", "Practica mixta", "Pratique mixte", "Pratik Melanje"),
    chapterDesc: t(
      "Focus on one chapter at a time for topic-based review.",
      "Concentrese en un capitulo a la vez para un repaso por tema.",
      "Concentrez-vous sur un seul chapitre a la fois pour une revision par theme.",
      "Konsantre sou yon chapit a la fwa pou yon revizyon pa sijÃƒÂ¨."
    ),
    categoryDesc: t(
      "Use this to practice what kind of decision a CNA should make before acting, such as noticing changes, preventing harm, or knowing when to report.",
      "Use esta opcion para practicar que tipo de decision debe tomar un CNA antes de actuar, como notar cambios, prevenir danos o saber cuando reportar.",
      "Utilisez cette option pour pratiquer le type de decision qu'un CNA doit prendre avant d'agir, par exemple remarquer les changements, prevenir les risques ou savoir quand signaler.",
      "Svi ak opsyon sa a pou pratike ki kalite desizyon yon CNA dwe pran anvan li aji, tankou remake chanjman, anpeche danje, oswa konnen kile pou rapote."
    ),
    mixedDesc: t(
      "Practice a broader mix of questions from different chapters and categories without full-exam pressure.",
      "Practique una mezcla mas amplia de preguntas de diferentes capitulos y categorias sin la presion de un examen completo.",
      "Pratiquez un melange plus large de questions provenant de differents chapitres et categories, sans la pression d'un examen complet.",
      "Pratike yon melanj kestyon ki soti nan diferan chapit ak kategori, san presyon yon egzamen konple."
    ),
    studySupportTitle: t(
      "Chapter and Category Study Guides",
      "Guias de estudio por capitulos y categorias",
      "Guides d'etude par chapitres et categories",
      "Gid etid pou chapit ak kategori"
    ),
    studySupportHint: t(
      "Open chapter and category review tools",
      "Abra las herramientas de repaso por capitulos y categorias",
      "Ouvrez les outils de revision par chapitres et categories",
      "Louvri zouti revizyon pou chapit ak kategori"
    ),
    chapterReviewTitle: t(
      "Chapter Study Support",
      "Apoyo de estudio por capitulos",
      "Soutien d'etude par chapitres",
      "Sipo etid pa chapit"
    ),
    chapterReviewText: t(
      "Open the chapter guide for a quick review of the main ideas before or between practice sessions.",
      "Abra la guia de capitulos para un repaso rapido de las ideas principales antes o entre sesiones de practica.",
      "Ouvrez le guide des chapitres pour une revision rapide des idees principales avant ou entre les sessions de pratique.",
      "Louvri gid chapit la pou yon revizyon rapid sou ide prensipal yo anvan oswa ant sesyon pratik yo."
    ),
    chapterReviewButton: t(
      "Open Chapter Study Support",
      "Abrir apoyo de estudio por capitulos",
      "Ouvrir le soutien d'etude par chapitres",
      "Louvri sipo etid pa chapit"
    ),
    categoryReviewTitle: t(
      "Category Study Support",
      "Apoyo de estudio por categorias",
      "Soutien d'etude par categories",
      "Sipo etid pa kategori"
    ),
    categoryReviewText: t(
      "Open the category guide to understand the 9 decision categories used to measure CNA logic and judgment.",
      "Abra la guia de categorias para comprender las 9 categorias de decision que se utilizan para evaluar la logica y el juicio CNA.",
      "Ouvrez le guide des categories pour comprendre les 9 categories de decision utilisees pour evaluer la logique et le jugement CNA.",
      "Louvri gid kategori a pou konprann 9 kategori desizyon yo itilize pou evalye lojik ak jijman CNA."
    ),
    categoryReviewButton: t(
      "Open Category Study Support",
      "Abrir apoyo de estudio por categorias",
      "Ouvrir le soutien d'etude par categories",
      "Louvri sipo etid pa kategori"
    ),
    resumeTitle: t("Resume current practice", "Reanudar practica actual", "Reprendre la pratique en cours", "Kontinye pratik aktyel la"),
    resumeBody: t(
      "Pick up where you left off in your last guided practice session.",
      "Retome donde dejo su ultima sesion de practica guiada.",
      "Reprenez la ou vous avez laisse votre derniere session de pratique guidee.",
      "Kontinye dÃƒÂ¨nye sesyon pratik gide ou a kote ou te rete a."
    ),
    resumeProgress: t("Progress", "Progreso", "Progression", "Pwogre"),
    resumeButton: t("Continue Practice", "Continuar practica", "Continuer la pratique", "Kontinye Pratik"),
    progressTitle: t("Your Practice Progress", "El progreso de su practica", "Votre progression de pratique", "Pwogre pratik ou"),
    progressHint: t(
      "View completed sessions and recent scores",
      "Vea las sesiones completadas y los puntajes recientes",
      "Voir les sessions terminees et les scores recents",
      "WÃ¨ sesyon ou fini yo ak nÃ²t resan yo"
    ),
    progressBody: t(
      "Track how much guided practice you have completed on this device.",
      "Vea cuanto trabajo de practica guiada ha completado en este dispositivo.",
      "Suivez la quantite de pratique guidee que vous avez terminee sur cet appareil.",
      "Swiv konbyen pratik gide ou fin konplete sou aparey sa a."
    ),
    progressSessions: t("Sessions completed", "Sesiones completadas", "Sessions terminees", "Sesyon fini"),
    progressQuestions: t("Questions practiced", "Preguntas practicadas", "Questions pratiquees", "Kesyon pratike"),
    progressScore: t("Overall practice score", "Puntuacion general de practica", "Score global de pratique", "Not jeneral pratik"),
    recentSessions: t("Recent practice", "Practica reciente", "Pratique recente", "Pratik resan"),
    noCompletedPractice: t(
      "Completed practice sessions will appear here once you finish them.",
      "Las sesiones de practica completadas apareceran aqui cuando las termine.",
      "Les sessions de pratique terminees apparaitront ici une fois achevees.",
      "Sesyon pratik ou fini yo ap paret isit la le ou fin konplete yo."
    ),
    currentSelection: t("Current setup", "Configuracion actual", "Configuration actuelle", "Konfigirasyon aktyel"),
    currentMode: t("Mode", "Modo", "Mode", "Mod"),
    currentFocus: t("Focus", "Enfoque", "Cible", "Fokis"),
    currentSessionSize: t("Session size", "Tamano de la sesion", "Taille de la session", "Gwose sesyon an"),
    startPractice: t("Start Practice", "Comenzar practica", "Commencer la pratique", "KÃƒÂ²manse pratik"),
  };

  const countOptions = [5, 10, 15];
  const chapterOptions = [1, 2, 3, 4, 5];
  const categoryOptions = [
    "Change in Condition",
    "Scope of Practice & Reporting",
    "Communication & Emotional Support",
    "Observation & Safety",
    "Personal Care & Comfort",
    "Mobility & Positioning",
    "Environment & Safety",
    "Dignity & Resident Rights",
    "Infection Control",
  ];

  const categoryGroups = [
    {
      id: "care-judgment",
      title: TEXT.categoryGroup1,
      body: t(
        "These categories help you notice clues, understand what is changing, and recognize what the resident may need.",
        "Estas categorias le ayudan a notar pistas, entender que esta cambiando y reconocer lo que el residente puede necesitar.",
        "Ces categories vous aident a remarquer les indices, a comprendre ce qui change et a reconnaitre ce dont le resident peut avoir besoin.",
        "Kategori sa yo ede ou remake siy yo, konprann sa k ap chanje, epi rekonet sa rezidan an ka bezwen."
      ),
      items: [
        "Change in Condition",
        "Observation & Safety",
        "Communication & Emotional Support",
      ],
    },
    {
      id: "safety-prevention",
      title: TEXT.categoryGroup2,
      body: t(
        "These categories focus on preventing harm, keeping care safe, and supporting the resident through good everyday care.",
        "Estas categorias se enfocan en prevenir danos, mantener el cuidado seguro y apoyar al residente mediante un buen cuidado diario.",
        "Ces categories mettent l'accent sur la prevention des risques, la securite des soins et le soutien du resident dans les soins quotidiens.",
        "Kategori sa yo konsantre sou prevni danje, kenbe swen an an sekirite, epi soutni rezidan an atravÃƒÂ¨ bon swen chak jou."
      ),
      items: [
        "Environment & Safety",
        "Infection Control",
        "Personal Care & Comfort",
      ],
    },
    {
      id: "comfort-reporting",
      title: TEXT.categoryGroup3,
      body: t(
        "These categories focus on resident rights, safe movement, and knowing when your role is to report rather than act alone.",
        "Estas categorias se enfocan en los derechos del residente, el movimiento seguro y saber cuando su funcion es reportar en lugar de actuar por su cuenta.",
        "Ces categories portent sur les droits du resident, les deplacements securitaires et le fait de savoir quand votre role est de signaler plutot que d'agir seul.",
        "Kategori sa yo konsantre sou dwa rezidan an, mouvman ki an sekirite, ak konnen ki le wol ou se rapote olye ou aji poukont ou."
      ),
      items: [
        "Dignity & Resident Rights",
        "Mobility & Positioning",
        "Scope of Practice & Reporting",
      ],
    },
  ];

  const selectedModeLabel =
    mode === "chapter" ? TEXT.modeChapter : mode === "category" ? TEXT.modeCategory : TEXT.modeMixed;
  const selectedTargetLabel =
    mode === "chapter"
      ? chapterLabel(selectedChapter)
      : mode === "category"
        ? selectedCategory
          ? categoryLabel(selectedCategory)
          : null
        : null;

  const activeSessionTargetLabel =
    activeSession?.mode === "chapter"
      ? chapterLabel(activeSession.selectedChapter)
      : activeSession?.mode === "category"
        ? categoryLabel(activeSession.selectedCategory)
        : TEXT.modeMixed;

  const activeSessionModeLabel =
    activeSession?.mode === "chapter"
      ? TEXT.modeChapter
      : activeSession?.mode === "category"
        ? TEXT.modeCategory
        : TEXT.modeMixed;

  const activeAnsweredCount = Object.values(activeSession?.answers || {}).filter((entry) => entry?.submitted).length;
  const activeQuestionCount = Number(activeSession?.questionIds?.length || 0);

  const activeSessionSummary =
    activeSession?.mode === "mixed"
      ? t(
          `${activeQuestionCount} questions - Mixed Practice`,
          `${activeQuestionCount} preguntas - Practica mixta`,
          `${activeQuestionCount} questions - Pratique mixte`,
          `${activeQuestionCount} kestyon - Pratik melanje`
        )
      : `${activeQuestionCount} ${t("questions", "preguntas", "questions", "kesyon")} - ${activeSessionModeLabel} - ${activeSessionTargetLabel}`;

  function sessionTargetLabel(sessionLike) {
    if (sessionLike?.mode === "chapter") return chapterLabel(sessionLike.selectedChapter);
    if (sessionLike?.mode === "category") return categoryLabel(sessionLike.selectedCategory);
    return TEXT.modeMixed;
  }

  function sessionModeLabel(sessionLike) {
    if (sessionLike?.mode === "chapter") return TEXT.modeChapter;
    if (sessionLike?.mode === "category") return TEXT.modeCategory;
    return TEXT.modeMixed;
  }

  const completedSessions = practiceHistory.filter((item) => item?.status === "completed");
  const totalCompletedSessions = completedSessions.length;
  const totalPracticedQuestions = completedSessions.reduce((sum, item) => sum + Number(item?.submitted_total || item?.questionIds?.length || 0), 0);
  const totalCorrectQuestions = completedSessions.reduce((sum, item) => sum + Number(item?.submitted_correct || 0), 0);
  const recentCompletedSessions = completedSessions.slice(0, 4);

  const btnPrimary = {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: `1px solid ${theme.primaryBg}`,
    background: theme.primaryBg,
    color: theme.primaryText,
    cursor: "pointer",
    width: "100%",
  };

  const btnSecondary = {
    padding: "9px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: `1px solid ${theme.buttonBorder}`,
    background: theme.secondaryBg,
    color: theme.secondaryText,
    cursor: "pointer",
  };
  const btnSignOut = {
    padding: "8px 11px",
    fontSize: "13px",
    borderRadius: "10px",
    border: "1px solid #f3b2ad",
    background: "#ffe8e6",
    color: "#9c1c1c",
    cursor: "pointer",
    fontWeight: 700,
  };

  function startPractice() {
    const base = `/practice-session?lang=${lang}&mode=${encodeURIComponent(mode)}&count=${encodeURIComponent(count)}${forceServer ? "&storage=server" : ""}`;
    if (mode === "chapter") {
      router.push(`${base}&chapter=${encodeURIComponent(selectedChapter)}`);
      return;
    }
    if (mode === "category") {
      if (!selectedCategory) return;
      router.push(`${base}&category=${encodeURIComponent(selectedCategory)}`);
      return;
    }
    router.push(base);
  }

  return (
    <Frame
      title={TEXT.title}
      subtitle={TEXT.subtitle}
      theme={theme}
      headerAction={
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {(isNarrow
            ? [
                {
                  key: "sign-out",
                  onClick: () => void handleSignOut(),
                  label:
                    lang === "es"
                      ? "Cerrar sesion"
                      : lang === "fr"
                        ? "Deconnexion"
                        : lang === "ht"
                          ? "Dekonekte"
                          : "Sign out",
                  isSignOut: true,
                },
                {
                  key: "back",
                  onClick: () => router.push(`/start?lang=${lang}`),
                  label: TEXT.backToWelcome,
                },
              ]
            : [
                {
                  key: "sign-out",
                  onClick: () => void handleSignOut(),
                  label:
                    lang === "es"
                      ? "Cerrar sesion"
                      : lang === "fr"
                        ? "Deconnexion"
                        : lang === "ht"
                          ? "Dekonekte"
                          : "Sign out",
                  isSignOut: true,
                },
                {
                  key: "back",
                  onClick: () => router.push(`/start?lang=${lang}`),
                  label: TEXT.backToWelcome,
                },
              ]).map((item) => (
            <button
              key={item.key}
              onClick={item.onClick}
              style={
                item.isSignOut
                  ? btnSignOut
                  : {
                      padding: "8px 11px",
                      fontSize: "13px",
                      borderRadius: "10px",
                      border: `1px solid ${theme.chromeBorder}`,
                      background: "white",
                      color: theme.secondaryText,
                      cursor: "pointer",
                      fontWeight: 700,
                    }
              }
            >
              {item.label}
            </button>
          ))}
        </div>
      }
      footer={<div />}
    >
      <div style={{ display: "grid", gap: 14 }}>
        <SectionCard
          theme={theme}
          tone="accent"
          title={TEXT.practiceInstructionsTitle}
          body={TEXT.practiceInstructionsBody}
          action={
            <button style={btnGhost} onClick={() => router.push(`/practice-instructions?lang=${lang}`)}>
              {TEXT.practiceInstructionsTitle}
            </button>
          }
          inlineAction
          alignAction="end"
          stretchAction={isNarrow}
        />
        <CollapsibleSection key={`study-${isNarrow ? "narrow" : "wide"}`} title={TEXT.studySupportTitle} hint={TEXT.studySupportHint} openHint={TEXT.openHint} closeHint={TEXT.closeHint}>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isNarrow ? "minmax(0, 1fr)" : "repeat(2, minmax(0, 1fr))",
                gap: 12,
              }}
            >
              <SectionCard
                theme={theme}
                tone="default"
                title={TEXT.chapterReviewTitle}
                body={TEXT.chapterReviewText}
                action={
                  <button
                    style={{ ...btnSecondary, width: isNarrow ? "100%" : "220px" }}
                    onClick={() => router.push(`/chapters?lang=${lang}&src=practice`)}
                  >
                    {TEXT.chapterReviewButton}
                  </button>
                }
              />
              <SectionCard
                theme={theme}
                tone="default"
                title={TEXT.categoryReviewTitle}
                body={TEXT.categoryReviewText}
                action={
                  <button
                    style={{ ...btnSecondary, width: isNarrow ? "100%" : "220px" }}
                    onClick={() => router.push(`/categories?lang=${lang}&src=practice`)}
                  >
                    {TEXT.categoryReviewButton}
                  </button>
                }
              />
            </div>
        </CollapsibleSection>

        <CollapsibleSection key={`progress-${isNarrow ? "narrow" : "wide"}`} title={TEXT.progressTitle} hint={TEXT.progressHint} openHint={TEXT.openHint} closeHint={TEXT.closeHint} defaultOpen={!isNarrow}>
          <div style={{ display: "grid", gap: 14 }}>
            <div>{TEXT.progressBody}</div>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 12, background: "var(--surface-soft)", padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.progressSessions}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--heading)" }}>{totalCompletedSessions}</div>
              </div>
              <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 12, background: "var(--surface-soft)", padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.progressQuestions}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--heading)" }}>{totalPracticedQuestions}</div>
              </div>
              <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 12, background: "var(--surface-soft)", padding: 14 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.progressScore}</div>
                <div style={{ fontSize: 24, fontWeight: 800, color: "var(--heading)" }}>{totalCorrectQuestions} / {totalPracticedQuestions}</div>
              </div>
            </div>
            <div style={{ display: "grid", gap: 8 }}>
              <details>
                <summary style={{ cursor: "pointer", fontWeight: 800, color: "var(--heading)" }}>
                  {TEXT.recentSessions}
                </summary>
                <div style={{ display: "grid", gap: 8, marginTop: 10 }}>
                  {recentCompletedSessions.length ? (
                    recentCompletedSessions.map((item) => (
                      <div
                        key={item.session_id}
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          gap: 12,
                          flexWrap: "wrap",
                          padding: "12px 14px",
                          border: "1px solid var(--chrome-border)",
                          borderRadius: 12,
                          background: "white",
                        }}
                      >
                        <div style={{ color: "var(--heading)", fontWeight: 700 }}>
                          {sessionModeLabel(item)} - {sessionTargetLabel(item)}
                        </div>
                        <div style={{ color: "#5c6d7d" }}>
                          {Number(item?.submitted_total || item?.questionIds?.length || 0)} {t("questions", "preguntas", "questions", "kesyon")} - {Number(item?.submitted_correct || 0)} / {Number(item?.submitted_total || item?.questionIds?.length || 0)} {t("correct", "correctas", "correctes", "korek")}
                        </div>
                      </div>
                    ))
                  ) : (
                    <div style={{ color: "#5c6d7d" }}>{TEXT.noCompletedPractice}</div>
                  )}
                </div>
              </details>
            </div>
          </div>
        </CollapsibleSection>

        {activeSession ? (
          <SectionCard
            theme={theme}
            tone="muted"
            title={TEXT.resumeTitle}
            body={
              <div style={{ display: "grid", gap: 6 }}>
                <div>{TEXT.resumeBody}</div>
                <div style={{ fontWeight: 700, color: "var(--heading)" }}>
                  {activeSessionSummary}
                </div>
                <div style={{ color: "#5c6d7d", fontSize: 14 }}>
                  {TEXT.resumeProgress}: {activeAnsweredCount} {t("of", "de", "sur", "sou")} {activeQuestionCount} {t("questions completed", "preguntas completadas", "questions completees", "kesyon fini")}
                </div>
              </div>
            }
            action={
              <button
                style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px" }}
                onClick={() => router.push(`/practice-session?lang=${lang}&session_id=${activeSession.session_id}${forceServer ? "&storage=server" : ""}`)}
              >
                {TEXT.resumeButton}
              </button>
            }
          />
        ) : null}

        <SectionCard
          theme={theme}
          tone="accent"
          title={TEXT.modesTitle}
          body={
            <div style={{ display: "grid", gap: 12 }}>
              <div style={{ color: "#4d6174", lineHeight: 1.7 }}>{TEXT.subtitle}</div>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <button
                  onClick={() => setMode("chapter")}
                  style={{
                    ...btnSecondary,
                    minWidth: 0,
                    width: "100%",
                    padding: isNarrow ? "11px 8px" : "12px 10px",
                    fontWeight: 800,
                    fontSize: isNarrow ? 13 : 14,
                    background: mode === "chapter" ? "white" : theme.secondaryBg,
                    border: mode === "chapter" ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                    boxShadow: mode === "chapter" ? "0 8px 18px rgba(37, 131, 166, 0.12)" : "none",
                  }}
                >
                  {TEXT.modeChapter}
                </button>
                <button
                  onClick={() => setMode("category")}
                  style={{
                    ...btnSecondary,
                    minWidth: 0,
                    width: "100%",
                    padding: isNarrow ? "11px 8px" : "12px 10px",
                    fontWeight: 800,
                    fontSize: isNarrow ? 13 : 14,
                    background: mode === "category" ? "white" : theme.secondaryBg,
                    border: mode === "category" ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                    boxShadow: mode === "category" ? "0 8px 18px rgba(37, 131, 166, 0.12)" : "none",
                  }}
                >
                  {TEXT.modeCategory}
                </button>
                <button
                  onClick={() => setMode("mixed")}
                  style={{
                    ...btnSecondary,
                    minWidth: 0,
                    width: "100%",
                    padding: isNarrow ? "11px 8px" : "12px 10px",
                    fontWeight: 800,
                    fontSize: isNarrow ? 13 : 14,
                    background: mode === "mixed" ? "white" : theme.secondaryBg,
                    border: mode === "mixed" ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                    boxShadow: mode === "mixed" ? "0 8px 18px rgba(37, 131, 166, 0.12)" : "none",
                  }}
                >
                  {TEXT.modeMixed}
                </button>
              </div>

              <div
                style={{
                  border: "1px solid var(--chrome-border)",
                  borderRadius: 16,
                  background: "linear-gradient(180deg, #ffffff 0%, #f4fbfd 100%)",
                  padding: isNarrow ? "14px 14px" : "16px 16px",
                  display: "grid",
                  gap: 8,
                  boxShadow: "0 10px 24px rgba(16, 24, 40, 0.05)",
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)" }}>
                  {TEXT.currentMode}
                </div>
                <div style={{ fontWeight: 800, color: "var(--heading)", fontSize: isNarrow ? 18 : 19, lineHeight: 1.35 }}>
                  {selectedModeLabel}
                </div>
                <div style={{ color: "#4d6174", lineHeight: 1.65 }}>
                  {mode === "chapter" ? TEXT.chapterDesc : mode === "category" ? TEXT.categoryDesc : TEXT.mixedDesc}
                </div>
              </div>
            </div>
          }
        />

        {mode === "chapter" ? (
          <SectionCard
            theme={theme}
            title={TEXT.chapterTitle}
            body={
              <div style={{ display: "grid", gap: 10 }}>
                <div style={{ display: "flex", gap: isNarrow ? 8 : 10, flexWrap: "wrap" }}>
                  {chapterOptions.map((n) => (
                    <button
                      key={n}
                      onClick={() => setSelectedChapter(n)}
                      style={{
                        ...btnSecondary,
                        minWidth: isNarrow ? 96 : 110,
                        padding: isNarrow ? "8px 10px" : btnSecondary.padding,
                        fontWeight: 700,
                        background: selectedChapter === n ? "white" : theme.secondaryBg,
                        border: selectedChapter === n ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                      }}
                    >
                      {t(`Chapter ${n}`, `Capitulo ${n}`, `Chapitre ${n}`, `Chapit ${n}`)}
                    </button>
                  ))}
                </div>
                <div
                  style={{
                    border: "1px solid var(--chrome-border)",
                    borderRadius: 12,
                    background: "var(--surface-soft)",
                    padding: "12px 14px",
                    color: "var(--heading)",
                    fontWeight: 700,
                    lineHeight: 1.5,
                  }}
                >
                  {chapterLongLabel(selectedChapter)}
                </div>
              </div>
            }
          />
        ) : null}

        {mode === "category" ? (
          <SectionCard
            theme={theme}
            title={TEXT.categoryTitle}
            body={
              <div style={{ display: "grid", gap: 10 }}>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isNarrow ? "repeat(3, minmax(0, 1fr))" : "repeat(5, minmax(0, 1fr))",
                    gap: isNarrow ? 8 : 10,
                  }}
                >
                  {categoryOptions.map((cat) => {
                    const isSelected = selectedCategory === cat;
                    const categorySummary = (
                      <div
                        style={{
                          border: "2px solid var(--brand-teal)",
                          borderRadius: 12,
                          background: "white",
                          padding: "12px 14px",
                          color: "#4d6174",
                          lineHeight: 1.6,
                          fontWeight: 700,
                          marginTop: 8,
                          boxShadow: "0 8px 18px rgba(37, 131, 166, 0.10)",
                        }}
                      >
                        <div style={{ color: "var(--heading)", fontWeight: 800, marginBottom: 6 }}>
                          {`${categoryButtonLabel(cat)} - ${categoryLabel(cat)}`}
                        </div>
                        {categorySupportLabel(cat)}
                      </div>
                    );
                    return (
                      <div key={cat}>
                        <button
                          onClick={() => setSelectedCategory(cat)}
                          style={{
                            ...btnSecondary,
                          width: "100%",
                          minWidth: 0,
                          padding: isNarrow ? "8px 10px" : btnSecondary.padding,
                          textAlign: "left",
                          fontWeight: 700,
                          background: isSelected ? "white" : theme.secondaryBg,
                            border: isSelected ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                            boxShadow: isSelected ? "0 8px 18px rgba(37, 131, 166, 0.10)" : "none",
                          }}
                        >
                          {categoryButtonLabel(cat)}
                        </button>
                      </div>
                    );
                  })}
                  {isNarrow && selectedCategory ? (
                    <div style={{ gridColumn: "1 / -1" }}>
                      <div
                        style={{
                          border: "2px solid var(--brand-teal)",
                          borderRadius: 12,
                          background: "white",
                          padding: "12px 14px",
                          color: "#4d6174",
                          lineHeight: 1.6,
                          fontWeight: 700,
                          marginTop: 2,
                          boxShadow: "0 8px 18px rgba(37, 131, 166, 0.10)",
                        }}
                      >
                        <div style={{ color: "var(--heading)", fontWeight: 800, marginBottom: 6 }}>
                          {`${categoryButtonLabel(selectedCategory)} - ${categoryLabel(selectedCategory)}`}
                        </div>
                        {categorySupportLabel(selectedCategory)}
                      </div>
                    </div>
                  ) : null}
                </div>

                {!isNarrow && selectedCategory ? (
                  <div
                    style={{
                      border: "2px solid var(--brand-teal)",
                      borderRadius: 12,
                      background: "white",
                      padding: "12px 14px",
                      color: "#4d6174",
                      lineHeight: 1.6,
                      fontWeight: 700,
                      marginTop: 2,
                      marginBottom: isNarrow ? 6 : 2,
                      boxShadow: "0 8px 18px rgba(37, 131, 166, 0.10)",
                    }}
                  >
                    <div style={{ color: "var(--heading)", fontWeight: 800, marginBottom: 6 }}>
                      {`${categoryButtonLabel(selectedCategory)} - ${categoryLabel(selectedCategory)}`}
                    </div>
                    {categorySupportLabel(selectedCategory)}
                  </div>
                ) : null}
              </div>
            }
          />
        ) : null}

        <SectionCard
          theme={theme}
          title={TEXT.countTitle}
          body={
            <div style={{ display: "grid", gap: 10 }}>
              <div style={{ color: "#5c6d7d", lineHeight: 1.6 }}>{TEXT.countHelp}</div>
              <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
                {countOptions.map((n) => (
                  <button
                    key={n}
                    onClick={() => setCount(n)}
                    style={{
                      ...btnSecondary,
                      minWidth: 78,
                      fontWeight: 700,
                      background: count === n ? "white" : theme.secondaryBg,
                      border: count === n ? "2px solid var(--brand-teal)" : `1px solid ${theme.buttonBorder}`,
                      boxShadow: count === n ? "0 6px 14px rgba(37, 131, 166, 0.10)" : "none",
                    }}
                  >
                    {n}
                  </button>
                ))}
              </div>
            </div>
          }
        />

        <SectionCard
          theme={theme}
          tone="accent"
          title={TEXT.currentSelection}
          body={
            <div style={{ display: "grid", gap: 10 }}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
                  gap: 10,
                }}
              >
                <div style={{ border: "1px solid var(--frame-border)", borderRadius: 12, background: "white", padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.currentMode}</div>
                  <div style={{ fontWeight: 800, color: "var(--heading)", lineHeight: 1.4 }}>{selectedModeLabel}</div>
                </div>
                <div style={{ border: "1px solid var(--frame-border)", borderRadius: 12, background: "white", padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.currentFocus}</div>
                  <div style={{ fontWeight: 800, color: "var(--heading)", lineHeight: 1.4 }}>{selectedTargetLabel || TEXT.modeMixed}</div>
                </div>
                <div style={{ border: "1px solid var(--frame-border)", borderRadius: 12, background: "white", padding: "12px 14px" }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: "var(--muted)", marginBottom: 6 }}>{TEXT.currentSessionSize}</div>
                  <div style={{ fontWeight: 800, color: "var(--heading)", lineHeight: 1.4 }}>
                    {count} {t("questions", "preguntas", "questions", "kesyon")}
                  </div>
                </div>
              </div>
              <div style={{ color: "#4d6174", lineHeight: 1.7 }}>
                {t(
                  "Start an untimed guided session with immediate feedback and optional explanations after each answer.",
                  "Comience una sesion guiada sin limite de tiempo, con retroalimentacion inmediata y explicaciones opcionales despues de cada respuesta.",
                  "Commencez une session guidee sans limite de temps, avec un retour immediat et des explications facultatives apres chaque reponse.",
                  "KÃƒÂ²manse yon sesyon gide san limit tan, ak fidbak touswit ansanm ak eksplikasyon opsyonel apre chak repons."
                )}
              </div>
            </div>
          }
          action={
            <div style={{ width: isNarrow ? "100%" : "220px" }}>
              <button
                style={{
                  ...btnPrimary,
                  width: "100%",
                  opacity: mode === "category" && !selectedCategory ? 0.6 : activeSession ? 0.55 : 1,
                  cursor:
                    mode === "category" && !selectedCategory
                      ? "not-allowed"
                      : activeSession
                        ? "not-allowed"
                        : "pointer",
                }}
                onClick={startPractice}
                disabled={mode === "category" && !selectedCategory || !!activeSession}
              >
                {TEXT.startPractice}
              </button>
              {activeSession ? (
                <div style={{ marginTop: 8, fontSize: 13, lineHeight: 1.55, color: "#6c5b00" }}>
                  {t(
                    "Finish or resume your current practice session before starting a new one.",
                    "Termine o reanude su sesion de practica actual antes de comenzar una nueva.",
                    "Terminez ou reprenez votre session de pratique en cours avant d'en commencer une nouvelle.",
                    "Fini oswa reprann sesyon pratik aktyel ou a anvan ou komanse yon lot."
                  )}
                </div>
              ) : null}
            </div>
          }
        />
      </div>
    </Frame>
  );
}

export default function PracticePage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <PracticeInner />
    </Suspense>
  );
}



