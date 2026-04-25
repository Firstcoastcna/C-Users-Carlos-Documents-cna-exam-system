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

function ChaptersInner() {

  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const source = sp.get("src") || "exam";
  const [isNarrow, setIsNarrow] = useState(false);

  // Access gate + keep pilot language consistent (pilot-safe)
  useEffect(() => {
    let granted = false;
    try {
      granted = localStorage.getItem("cna_access_granted") === "1";
    } catch {}
    if (!granted) {
      router.replace(`/access?lang=${lang}`);
      return;
    }

    // Align pilot language (does not touch exam mechanics)
    if (lang === "en" || lang === "es" || lang === "fr" || lang === "ht") {
      try {
        localStorage.setItem("cna_app_lang", lang);
      } catch {}
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

  const btnUtility = {
    padding: "8px 11px",
    fontSize: "13px",
    fontWeight: 700,
    borderRadius: "10px",
    border: `1px solid ${theme.chromeBorder}`,
    background: "white",
    color: theme.secondaryText,
    cursor: "pointer",
  };

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  const hubRoute = source === "practice" ? `/practice?lang=${lang}` : `/exam-hub?lang=${lang}`;
  const hubLabel =
    source === "practice"
      ? t("Go to Practice Hub", "Ir al Centro de Practica", "Aller au hub de pratique", "Ale nan Hub Pratik la")
      : t("Go to Exam Hub", "Ir al Centro de Exámenes", "Aller au hub d’examen", "Ale nan Hub Egzamen an");
  const pageTitle =
    source === "practice"
      ? t("CHAPTER STUDY SUPPORT", "APOYO DE ESTUDIO POR CAPITULOS", "SOUTIEN D'ETUDE PAR CHAPITRES", "SIPO ETID PA CHAPIT")
      : t("CHAPTERS & STUDY GUIDANCE", "CAPÍTULOS Y GUÍA DE ESTUDIO", "CHAPITRES & GUIDE D’ÉTUDE", "CHAPIT & GID ETID");
  const introEyebrow =
    source === "practice"
      ? t("Study Support", "Apoyo de estudio", "Soutien d'etude", "Sipò pou etid")
      : t("Quick Review", "Repaso rapido", "Revision rapide", "Ti revizyon");
  const introTitle =
    source === "practice"
      ? t("Chapter Study Support", "Apoyo de estudio por capitulos", "Soutien d'etude par chapitres", "Sipo etid pa chapit")
      : t("Chapter review", "Revision de capitulos", "Revision des chapitres", "Revizyon chapit yo");
  const introBody =
    source === "practice"
      ? t(
          "Use these brief chapter summaries to strengthen the main ideas before or between practice sessions.",
          "Use estos resumenes breves de capitulos para reforzar las ideas principales antes o entre sesiones de practica.",
          "Utilisez ces resumes brefs des chapitres pour renforcer les idees principales avant ou entre les sessions de pratique.",
          "Sèvi ak rezime kout chapit sa yo pou ranfòse ide prensipal yo anvan oswa ant sesyon pratik yo."
        )
      : t(
          "This page is for quick review only. Use these brief chapter summaries to refresh the main ideas before testing.",
          "Esta pagina es solo para revision rapida. Use estos resumenes breves para repasar las ideas principales antes del examen.",
          "Cette page sert uniquement de revision rapide. Utilisez ces resumes brefs pour revoir les idees principales avant le test.",
          "Paj sa a se pou ti revizyon rapid selman. Svi ak rezime kout sa yo pou revize ide prensipal yo anvan ou teste."
        );
  const practiceCalloutTitle = t(
    "How to use this in practice",
    "Como usar esto en la practica",
    "Comment utiliser ceci pendant la pratique",
    "Kijan pou itilize sa pandan pratik la"
  );
  const practiceCalloutItems = [
    t(
      "Review the main ideas for the chapter you want to strengthen.",
      "Revise las ideas principales del capitulo que desea fortalecer.",
      "Revoyez les idees principales du chapitre que vous souhaitez renforcer.",
      "Revize ide prensipal chapit ou vle ranfose a."
    ),
    t(
      "Return to the Practice Hub and choose a chapter-based session.",
      "Regrese al Centro de Practica y elija una sesion por capitulo.",
      "Retournez au hub de pratique et choisissez une session par chapitre.",
      "Retounen nan Hub Pratik la epi chwazi yon sesyon pa chapit."
    ),
    t(
      "Use practice to apply the chapter concepts in questions similar to the CNA exam.",
      "Use la practica para aplicar los conceptos del capitulo en preguntas similares a las del examen CNA.",
      "Utilisez la pratique pour appliquer les notions du chapitre dans des questions semblables a celles de l'examen CNA.",
      "Sèvi ak pratik la pou aplike lide chapit yo nan kestyon ki sanble ak kestyon egzamen CNA a."
    ),
  ];

  const detailsStyle = {
    border: `1px solid ${theme.chromeBorder}`,
    borderRadius: "16px",
    padding: isNarrow ? "16px" : "18px",
    background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
    boxShadow: "0 8px 20px rgba(31, 52, 74, 0.04)",
  };

  const summaryStyle = {
    cursor: "pointer",
    fontWeight: 800,
    fontSize: isNarrow ? "15px" : "16px",
    outline: "none",
    color: "var(--heading)",
    lineHeight: 1.4,
  };

  const bodyText = {
    color: "#456173",
    lineHeight: 1.7,
    fontSize: 14,
  };

  const h3 = { marginTop: 14, marginBottom: 6, fontSize: 14, fontWeight: 800, color: "var(--heading)" };

  const ul = { marginTop: 6, marginBottom: 0, paddingLeft: 18, lineHeight: 1.7, color: "#334e61", fontSize: 14 };

  function handleToggle(ch, e) {
    // Only collapse others when this one is opening
    if (!e?.target?.open) return;

    try {
      document.querySelectorAll('details[data-ch]').forEach((d) => {
        if (d.getAttribute("data-ch") !== String(ch)) d.open = false;
      });
    } catch {}
  }

  // ----------------------------
  // CHAPTER CONTENT (ALL LANGS)
  // ----------------------------
  const CHAPTERS = {
    en: {
      1: {
        title: "Chapter 1 — Role, Rights, Communication, and Professionalism",
        intro:
          "Chapter 1 establishes the CNA’s professional role, scope of practice, resident rights, and the importance of respectful communication and reporting.",
        focusTitle: "What to focus on",
        focus: [
          "Scope of practice: what you can do vs. what must be reported.",
          "Therapeutic communication and respectful, non-judgmental language.",
          "Observe → report (immediately when needed) → document (facts only).",
          "Resident rights: dignity, privacy, confidentiality, right to refuse.",
          "Florida-specific: mandated reporting and professional boundaries.",
        ],
        ideasTitle: "Main ideas",
        ideas: [
          "You are the “eyes and ears” of the care team.",
          "Stay within scope; don’t diagnose or give medical advice.",
          "Follow chain of command and report concerns promptly.",
        ],
      },
      2: {
        title: "Chapter 2 — Promotion of Safety",
        intro:
          "Chapter 2 focuses on safety: fall prevention, hazard control, equipment use, infection prevention, and “safest first action” judgment.",
        focusTitle: "What to focus on",
        focus: [
          "Fall prevention and safe transfers/ambulation (gait belt use, stable positioning).",
          "Environmental hazards: fix what you can and protect the resident first.",
          "Equipment safety (wheelchair locks, bed height, faulty equipment awareness).",
          "Standard Precautions, hand hygiene timing, and PPE basics.",
          "Emergency priority: remove from danger / keep resident safe first.",
        ],
        ideasTitle: "Main ideas",
        ideas: [
          "Safety applies during all care activities.",
          "Stability before speed or routine.",
          "Resident safety comes before reporting/documentation.",
        ],
      },
      3: {
        title: "Chapter 3 — Promoting Function and Independence",
        intro:
          "Chapter 3 focuses on maintaining function: encourage independence without forcing, observe subtle changes, and report meaningful patterns.",
        focusTitle: "What to focus on",
        focus: [
          "Encourage residents to do what they can safely (assist only when needed).",
          "Watch subtle changes (pace, endurance, coordination, appetite, hydration, participation).",
          "Nutrition/hydration support and dehydration warning signs.",
          "Rest and pacing (don’t rush; adjust care when fatigue appears).",
          "Know when changes require reporting vs. routine documentation.",
        ],
        ideasTitle: "Main ideas",
        ideas: ["Promote function, not speed.", "Assist without taking over.", "Report significant or sudden changes."],
      },
      4: {
        title: "Chapter 4 — Basic Nursing Care, Comfort, Dignity, Infection Control",
        intro:
          "Chapter 4 is routine care done safely and respectfully: comfort cues, privacy, clean vs. contaminated tasks, and critical infection-control habits.",
        focusTitle: "What to focus on",
        focus: [
          "Hand hygiene: before/after care, even when gloves were used.",
          "Clean vs. contaminated tasks; glove use and avoiding cross-contamination.",
          "Nonverbal discomfort cues (tensing, shivering, pulling away) and adjusting care in real time.",
          "Privacy/dignity in intimate care (explain steps, cover resident, curtains/doors).",
          "Accurate basic measurements and recording objectively.",
        ],
        ideasTitle: "Main ideas",
        ideas: [
          "Basic care is observational care.",
          "Adjust care before escalating, when appropriate.",
          "Many exam questions test what NOT to do (rush, ignore cues, take over).",
        ],
      },
      5: {
        title: "Chapter 5 — Changes in Condition & Specialized Care",
        intro:
          "Chapter 5 trains you to recognize changes, respond supportively, and report promptly—especially when safety is at risk. Sudden changes are never “normal.”",
        focusTitle: "What to focus on",
        focus: [
          "Sudden vs. baseline changes (confusion, agitation, withdrawal, appetite, mobility, speech, mood).",
          "Observe → report (CNAs report; nurses assess and intervene).",
          "Dementia care basics: reassurance, orientation/redirection, do not argue or shame.",
          "Safety adjustments when residents decline physically or cognitively.",
          "Emergency signs that require immediate action/reporting (breathing difficulty, chest pain, stroke signs, choking/aspiration, seizures).",
          "End-of-life: comfort, dignity, calm presence.",
        ],
        ideasTitle: "Main ideas",
        ideas: [
          "CNAs are often the first to notice changes.",
          "Sudden changes are never normal—report promptly.",
          "Do not diagnose or treat; support and report.",
        ],
      },
    },

    es: {
      1: {
        title: "Capítulo 1 — Rol, Derechos, Comunicación y Profesionalismo",
        intro:
          "El Capítulo 1 establece el rol profesional del CNA, su alcance de práctica, los derechos del residente y la importancia de una comunicación respetuosa y del reporte adecuado.",
        focusTitle: "En qué enfocarse",
        focus: [
          "Alcance de práctica: qué puede hacer frente a lo que debe reportarse.",
          "Comunicación terapéutica y lenguaje respetuoso y sin juicios.",
          "Observar → reportar (de inmediato cuando sea necesario) → documentar (solo hechos).",
          "Derechos del residente: dignidad, privacidad, confidencialidad, derecho a rechazar.",
          "Específico de Florida: reporte obligatorio y límites profesionales.",
        ],
        ideasTitle: "Ideas principales",
        ideas: [
          "Usted es los “ojos y oídos” del equipo de atención.",
          "Manténgase dentro de su alcance; no diagnostique ni dé consejos médicos.",
          "Siga la cadena de mando y reporte las preocupaciones con prontitud.",
        ],
      },
      2: {
        title: "Capítulo 2 — Promoción de la Seguridad",
        intro:
          "El Capítulo 2 se centra en la seguridad: prevención de caídas, control de riesgos, uso de equipos, prevención de infecciones y el juicio de la “acción más segura primero”.",
        focusTitle: "En qué enfocarse",
        focus: [
          "Prevención de caídas y transferencias/deambulación seguras (uso del cinturón de marcha, posicionamiento estable).",
          "Peligros ambientales: corrija lo que pueda y proteja primero al residente.",
          "Seguridad del equipo (bloqueos de sillas de ruedas, altura de la cama, identificación de equipos defectuosos).",
          "Precauciones estándar, momento adecuado de la higiene de manos y conceptos básicos del EPP.",
          "Prioridad en emergencias: retirar del peligro / mantener seguro al residente primero.",
        ],
        ideasTitle: "Ideas principales",
        ideas: [
          "La seguridad se aplica durante todas las actividades de cuidado.",
          "La estabilidad es más importante que la rapidez o la rutina.",
          "La seguridad del residente es prioritaria antes de reportar o documentar.",
        ],
      },
      3: {
        title: "Capítulo 3 — Promoción de la Función y la Independencia",
        intro:
          "El Capítulo 3 se enfoca en mantener la función: fomentar la independencia sin forzar, observar cambios sutiles y reportar patrones significativos.",
        focusTitle: "En qué enfocarse",
        focus: [
          "Fomentar que los residentes hagan lo que puedan de forma segura (ayudar solo cuando sea necesario).",
          "Observar cambios sutiles (ritmo, resistencia, coordinación, apetito, hidratación, participación).",
          "Apoyo nutricional e hidratación y señales de advertencia de deshidratación.",
          "Descanso y ritmo (no apresurar; ajustar el cuidado cuando aparezca fatiga).",
          "Saber cuándo los cambios requieren reporte frente a documentación rutinaria.",
        ],
        ideasTitle: "Ideas principales",
        ideas: ["Promover la función, no la rapidez.", "Ayudar sin tomar el control.", "Reportar cambios significativos o repentinos."],
      },
      4: {
        title: "Capítulo 4 — Cuidado Básico de Enfermería, Confort, Dignidad y Control de Infecciones",
        intro:
          "El Capítulo 4 abarca el cuidado rutinario realizado de forma segura y respetuosa: señales de confort, privacidad, tareas limpias frente a contaminadas y hábitos críticos de control de infecciones.",
        focusTitle: "En qué enfocarse",
        focus: [
          "Higiene de manos: antes y después del cuidado, incluso cuando se usaron guantes.",
          "Tareas limpias vs. contaminadas; uso de guantes y prevención de la contaminación cruzada.",
          "Señales no verbales de incomodidad (tensión, escalofríos, apartarse) y ajuste del cuidado en tiempo real.",
          "Privacidad y dignidad en el cuidado íntimo (explicar los pasos, cubrir al residente, cortinas/puertas).",
          "Mediciones básicas precisas y registro objetivo.",
        ],
        ideasTitle: "Ideas principales",
        ideas: [
          "El cuidado básico es cuidado observacional.",
          "Ajustar el cuidado antes de escalar, cuando sea apropiado.",
          "Muchas preguntas del examen evalúan qué NO hacer (apresurar, ignorar señales, tomar el control).",
        ],
      },
      5: {
        title: "Capítulo 5 — Cambios en la Condición y Cuidado Especializado",
        intro:
          "El Capítulo 5 le entrena para reconocer cambios, responder con apoyo y reportar con prontitud—especialmente cuando la seguridad está en riesgo. Los cambios repentinos nunca son “normales”.",
        focusTitle: "En qué enfocarse",
        focus: [
          "Cambios repentinos vs. línea base (confusión, agitación, aislamiento, apetito, movilidad, habla, estado de ánimo).",
          "Observar → reportar (los CNA reportan; las enfermeras evalúan e intervienen).",
          "Conceptos básicos del cuidado de la demencia: tranquilizar, orientar/redirigir, no discutir ni avergonzar.",
          "Ajustes de seguridad cuando los residentes presentan deterioro físico o cognitivo.",
          "Signos de emergencia que requieren acción/reporte inmediato (dificultad respiratoria, dolor en el pecho, signos de derrame cerebral, atragantamiento/aspiración, convulsiones).",
          "Fin de la vida: confort, dignidad, presencia calmada.",
        ],
        ideasTitle: "Ideas principales",
        ideas: [
          "Los CNA suelen ser los primeros en notar cambios.",
          "Los cambios repentinos nunca son normales—repórtelos de inmediato.",
          "No diagnostique ni trate; brinde apoyo y reporte.",
        ],
      },
    },

    fr: {
      1: {
        title: "Chapitre 1 — Rôle, Droits, Communication et Professionnalisme",
        intro:
          "Le Chapitre 1 définit le rôle professionnel du CNA, son champ de pratique, les droits du résident et l’importance d’une communication respectueuse et d’un signalement approprié.",
        focusTitle: "Points clés à réviser",
        focus: [
          "Champ de pratique : ce que vous pouvez faire par rapport à ce qui doit être signalé.",
          "Communication thérapeutique et langage respectueux, sans jugement.",
          "Observer → signaler (immédiatement lorsque nécessaire) → documenter (faits uniquement).",
          "Droits du résident : dignité, intimité, confidentialité, droit de refuser.",
          "Spécifique à la Floride : signalement obligatoire et limites professionnelles.",
        ],
        ideasTitle: "Idées principales",
        ideas: [
          "Vous êtes les « yeux et les oreilles » de l’équipe de soins.",
          "Restez dans votre champ de pratique ; ne posez pas de diagnostic et ne donnez pas de conseils médicaux.",
          "Respectez la chaîne de commandement et signalez les préoccupations rapidement.",
        ],
      },
      2: {
        title: "Chapitre 2 — Promotion de la Sécurité",
        intro:
          "Le Chapitre 2 est axé sur la sécurité : prévention des chutes, contrôle des dangers, utilisation de l’équipement, prévention des infections et jugement de « l’action la plus sûre en premier ».",
        focusTitle: "Points clés à réviser",
        focus: [
          "Prévention des chutes et transferts/déplacements sécuritaires (utilisation de la ceinture de marche, positionnement stable).",
          "Dangers environnementaux : corriger ce qui est possible et protéger d’abord le résident.",
          "Sécurité de l’équipement (freins de fauteuil roulant, hauteur du lit, identification d’équipements défectueux).",
          "Précautions standard, moment approprié de l’hygiène des mains et bases des EPI.",
          "Priorité en situation d'urgence : retirer du danger / assurer la sécurité du résident en premier.",
        ],
        ideasTitle: "Idées principales",
        ideas: [
          "La sécurité s’applique à toutes les activités de soins.",
          "La stabilité est prioritaire par rapport à la rapidité ou à la routine.",
          "La sécurité du résident passe avant le signalement ou la documentation.",
        ],
      },
      3: {
        title: "Chapitre 3 — Promotion de la Fonction et de l’Indépendance",
        intro:
          "Le Chapitre 3 vise le maintien des capacités : encourager l’indépendance sans forcer, observer les changements subtils et signaler les tendances significatives.",
        focusTitle: "Points clés à réviser",
        focus: [
          "Encourager les résidents à faire ce qu’ils peuvent en toute sécurité (aider uniquement lorsque nécessaire).",
          "Observer les changements subtils (rythme, endurance, coordination, appétit, hydratation, participation).",
          "Soutien nutritionnel et hydratation, signes d’alerte de la déshydratation.",
          "Repos et rythme (ne pas précipiter ; ajuster les soins lorsque la fatigue apparaît).",
          "Savoir quand les changements nécessitent un signalement par rapport à une documentation de routine.",
        ],
        ideasTitle: "Idées principales",
        ideas: ["Favoriser la fonction, pas la rapidité.", "Aider sans prendre le contrôle.", "Signaler les changements significatifs ou soudains."],
      },
      4: {
        title: "Chapitre 4 — Soins Infirmiers de Base, Confort, Dignité et Contrôle des Infections",
        intro:
          "Le Chapitre 4 couvre les soins de routine effectués de manière sécuritaire et respectueuse : signaux de confort, intimité, tâches propres vs contaminées et habitudes essentielles de contrôle des infections.",
        focusTitle: "Points clés à réviser",
        focus: [
          "Hygiène des mains : avant et après les soins, même lorsque des gants ont été utilisés.",
          "Tâches propres vs contaminées ; utilisation des gants et prévention de la contamination croisée.",
          "Signaux non verbaux d’inconfort (raideur, frissons, retrait) et ajustement des soins en temps réel.",
          "Intimité et dignité lors des soins intimes (expliquer les étapes, couvrir le résident, rideaux/portes).",
          "Mesures de base précises et consignation objective.",
        ],
        ideasTitle: "Idées principales",
        ideas: [
          "Les soins de base sont des soins d’observation.",
          "Ajuster les soins avant d’escalader, lorsque cela est approprié.",
          "De nombreuses questions d’examen testent ce qu’il ne faut PAS faire (se précipiter, ignorer les signaux, prendre le contrôle).",
        ],
      },
      5: {
        title: "Chapitre 5 — Changements de l’État de Santé et Soins Spécialisés",
        intro:
          "Le Chapitre 5 vous forme à reconnaître les changements, à répondre de manière appropriée et à signaler rapidement — surtout lorsque la sécurité est en jeu. Les changements soudains ne sont jamais « normaux ».",
        focusTitle: "Points clés à réviser",
        focus: [
          "Changements soudains vs état de base (confusion, agitation, retrait, appétit, mobilité, parole, humeur).",
          "Observer → signaler (les CNA signalent ; les infirmiers évaluent et interviennent).",
          "Bases des soins en démence : rassurer, orienter/rediriger, ne pas argumenter ni culpabiliser.",
          "Ajustements de sécurité lorsque les résidents déclinent physiquement ou cognitivement.",
          "Signes d’urgence nécessitant une action/un signalement immédiat (difficulté respiratoire, douleur thoracique, signes d’AVC, étouffement/aspiration, convulsions).",
          "Fin de vie : confort, dignité, présence calme.",
        ],
        ideasTitle: "Idées principales",
        ideas: [
          "Les CNA sont souvent les premiers à remarquer des changements.",
          "Les changements soudains ne sont jamais normaux — signalez-les rapidement.",
          "Ne diagnostiquez pas et ne traitez pas ; soutenez et signalez.",
        ],
      },
    },

    ht: {
      1: {
        title: "Chapit 1 — Wòl, Dwa, Kominikasyon ak Pwofesyonalis",
        intro:
          "Chapit 1 etabli wòl pwofesyonèl CNA a, limit pratik li, dwa rezidan yo, ak enpòtans kominikasyon ki respekte moun ak rapò apwopriye.",
        focusTitle: "Sa pou konsantre sou",
        focus: [
          "Limit pratik: sa ou ka fè kont sa ou dwe rapòte.",
          "Kominikasyon terapetik ak langaj ki respekte moun, san jijman.",
          "Obsève → rapòte (imedyatman lè sa nesesè) → dokimante (fèt sèlman).",
          "Dwa rezidan yo: diyite, vi prive, konfidansyalite, dwa pou refize.",
          "Espesifik pou Florid: rapò obligatwa ak limit pwofesyonèl.",
        ],
        ideasTitle: "Ide prensipal",
        ideas: [
          "Ou se “je ak zòrèy” ekip swen an.",
          "Rete nan limit pratik ou; pa fè dyagnostik ni bay konsèy medikal.",
          "Swiv chèn kòmandman an epi rapòte enkyetid yo san pèdi tan.",
        ],
      },
      2: {
        title: "Chapit 2 — Pwomosyon Sekirite",
        intro:
          "Chapit 2 konsantre sou sekirite: prevansyon tonbe, kontwòl danje, itilizasyon ekipman, prevansyon enfeksyon, ak jijman “aksiyon ki pi an sekirite an premye”.",
        focusTitle: "Sa pou konsantre sou",
        focus: [
          "Prevansyon tonbe ak transfè/mach an sekirite (itilizasyon senti mache, pozisyon ki estab).",
          "Danje anviwònman: ranje sa ou kapab epi pwoteje rezidan an an premye.",
          "Sekirite ekipman (fren chèz woulant, wotè kabann, idantifye ekipman ki pa bon).",
          "Prekosyon estanda, bon moman pou ijyèn men, ak baz PPE.",
          "Priyorite ijans: retire nan danje / kenbe rezidan an an sekirite an premye.",
        ],
        ideasTitle: "Ide prensipal",
        ideas: [
          "Sekirite aplike nan tout aktivite swen.",
          "Estabilite pi enpòtan pase vitès oswa woutin.",
          "Sekirite rezidan an vini anvan rapò oswa dokimantasyon.",
        ],
      },
      3: {
        title: "Chapit 3 — Pwomosyon Fonksyon ak Endepandans",
        intro:
          "Chapit 3 konsantre sou kenbe fonksyon: ankouraje endepandans san fòse, obsève ti chanjman, epi rapòte modèl enpòtan.",
        focusTitle: "Sa pou konsantre sou",
        focus: [
          "Ankouraje rezidan yo fè sa yo kapab an sekirite (ede sèlman lè sa nesesè).",
          "Obsève ti chanjman (vitès, andirans, kowòdinasyon, apeti, idratasyon, patisipasyon).",
          "Sipò nitrisyon/idratasyon ak siy avètisman dezidratasyon.",
          "Repo ak ritm (pa prese; ajiste swen lè fatig parèt).",
          "Konnen ki lè chanjman yo mande rapò kont dokimantasyon woutin.",
        ],
        ideasTitle: "Ide prensipal",
        ideas: ["Ankouraje fonksyon, pa vitès.", "Ede san pran kontwòl.", "Rapòte chanjman enpòtan oswa sibit."],
      },
      4: {
        title: "Chapit 4 — Swen Enfimyè Debaz, Konfò, Diyite, Kontwòl Enfeksyon",
        intro:
          "Chapit 4 se swen woutin ki fèt an sekirite ak respè: siy konfò, vi prive, travay pwòp kont kontamine, ak abitid kle kontwòl enfeksyon.",
        focusTitle: "Sa pou konsantre sou",
        focus: [
          "Ijyèn men: anvan/apre swen, menm lè gan te itilize.",
          "Travay pwòp kont kontamine; itilizasyon gan ak evite kontaminasyon kwa.",
          "Siy nonvèbal malèz (tansyon, tranble, rale kò) ak ajisteman swen an tan reyèl.",
          "Vi prive/diyite nan swen entim (eksplike etap yo, kouvri rezidan an, rido/pòt).",
          "Mezi debaz ki egzat ak anrejistreman objektif.",
        ],
        ideasTitle: "Ide prensipal",
        ideas: [
          "Swen debaz se swen obsèvasyon.",
          "Ajiste swen an anvan eskalade, lè sa apwopriye.",
          "Anpil kesyon egzamen teste sa pou PA fè (prese, inyore siy, pran kontwòl).",
        ],
      },
      5: {
        title: "Chapit 5 — Chanjman nan Kondisyon & Swen Espesyalize",
        intro:
          "Chapit 5 anseye ou rekonèt chanjman, reponn ak sipò, epi rapòte rapidman — sitou lè sekirite an danje. Chanjman sibit pa janm “nòmal”.",
        focusTitle: "Sa pou konsantre sou",
        focus: [
          "Chanjman sibit kont liy baz (konfizyon, ajitasyon, retrè, apeti, mobilite, lapawòl, atitid).",
          "Obsève → rapòte (CNA rapòte; enfimyè evalye epi entèvni).",
          "Baz swen demans: rasire, oryante/rediije, pa diskite ni fè wont.",
          "Ajisteman sekirite lè rezidan yo ap dekline fizikman oswa mantalman.",
          "Siy ijans ki mande aksyon/rapò imedyat (difikilte pou respire, doulè pwatrin, siy konjesyon serebral, toufe/aspirasyon, kriz).",
          "Fen lavi: konfò, diyite, prezans kalm.",
        ],
        ideasTitle: "Ide prensipal",
        ideas: [
          "CNA yo souvan premye moun ki remake chanjman.",
          "Chanjman sibit pa janm nòmal — rapòte yo rapidman.",
          "Pa fè dyagnostik ni trete; sipòte epi rapòte.",
        ],
      },
    },
  };

  const EMPTY_CH = { title: "", intro: "", focusTitle: "", focus: [], ideasTitle: "", ideas: [] };

  function getChapter(n) {
    const table = CHAPTERS[lang] || CHAPTERS.en;
    return table?.[n] || CHAPTERS.en?.[n] || EMPTY_CH;
  }

  const chapterNums = [1, 2, 3, 4, 5];

  return (
    <Frame
      title={pageTitle}
      theme={theme}
      headerAction={
        <button style={btnUtility} onClick={() => router.push(hubRoute)}>
          {hubLabel}
        </button>
      }
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px", fontWeight: 700 }} onClick={() => router.push(hubRoute)}>
            {hubLabel}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: 760, margin: "0 auto" }}>
        <div
          style={{
            border: `1px solid ${theme.chromeBorder}`,
            borderRadius: "16px",
            background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
            padding: isNarrow ? "18px" : "22px",
            marginBottom: "16px",
            boxShadow: "0 8px 20px rgba(31, 52, 74, 0.04)",
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
            {introEyebrow}
          </div>

          <div style={{ fontSize: isNarrow ? 22 : 24, fontWeight: 900, marginBottom: 8, color: "var(--heading)", lineHeight: 1.2 }}>
            {introTitle}
          </div>

          <div style={bodyText}>
            {introBody}
          </div>
        </div>

        {source === "practice" ? (
          <div
            style={{
              border: `1px solid ${theme.chromeBorder}`,
              borderRadius: "16px",
              background: "var(--brand-teal-soft)",
              padding: isNarrow ? "18px" : "20px",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontWeight: 900, color: "var(--heading)", marginBottom: 8 }}>{practiceCalloutTitle}</div>
            <div style={{ ...bodyText, color: "#385164" }}>
              {practiceCalloutItems.map((item) => (
                <div key={item}>{`\u2022 ${item}`}</div>
              ))}
            </div>
          </div>
        ) : null}

        {chapterNums.map((n) => {
          const ch = getChapter(n);
          const isOpen = n === 1;
          return (
            <div key={n}>
              <details style={detailsStyle} data-ch={String(n)} open={isOpen} onToggle={(e) => handleToggle(n, e)}>
                <summary style={summaryStyle}>{ch.title}</summary>

                <div style={{ ...bodyText, marginTop: 10, color: "#333", lineHeight: 1.6 }}>{ch.intro}</div>

                <div style={h3}>{ch.focusTitle}</div>
                <ul style={ul}>
                  {(ch.focus || []).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>

                <div style={h3}>{ch.ideasTitle}</div>
                <ul style={ul}>
                  {(ch.ideas || []).map((x, i) => (
                    <li key={i}>{x}</li>
                  ))}
                </ul>
              </details>

              {n !== 5 && <div style={{ height: 10 }} />}
            </div>
          );
        })}
      </div>
    </Frame>
  );
}
export default function ChaptersPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <ChaptersInner />
    </Suspense>
  );
}

