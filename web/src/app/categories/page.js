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

function CategoriesInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const source = sp.get("src") || "exam";
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    let granted = false;
    try {
      granted = localStorage.getItem("cna_access_granted") === "1";
    } catch {}
    if (!granted) {
      router.replace(`/access?lang=${lang}`);
      return;
    }

    if (lang === "en" || lang === "es" || lang === "fr" || lang === "ht") {
      try {
        localStorage.setItem("cna_pilot_lang", lang);
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

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  const hubRoute = source === "practice" ? `/practice?lang=${lang}` : `/pilot?lang=${lang}`;
  const hubLabel =
    source === "practice"
      ? t("Go to Practice Hub", "Ir al Centro de Practica", "Aller au hub de pratique", "Ale nan Hub Pratik la")
      : t("Go to Exam Hub", "Ir al Centro de Examenes", "Aller au hub d'examen", "Ale nan Hub Egzamen an");
  const pageTitle =
    source === "practice"
      ? t("CATEGORY STUDY SUPPORT", "APOYO DE ESTUDIO POR CATEGORIAS", "SOUTIEN D'ETUDE PAR CATEGORIES", "SIPO ETID PA KATEGORI")
      : t("CATEGORY REVIEW", "REVISION DE CATEGORIAS", "REVISION DES CATEGORIES", "REVIZYON KATEGORI YO");
  const introEyebrow =
    source === "practice"
      ? t("Study Support", "Apoyo de estudio", "Soutien d'etude", "Sipò pou etid")
      : t("Study Guide", "Guia de estudio", "Guide d'etude", "Gid etid");
  const introTitle =
    source === "practice"
      ? t("Category Study Support", "Apoyo de estudio por categorias", "Soutien d'etude par categories", "Sipo etid pa kategori")
      : t(
          "Understanding the 9 question categories",
          "Comprender las 9 categorias de decision",
          "Comprendre les 9 categories de decision",
          "Konprann 9 kategori desizyon yo"
        );
  const introBody =
    source === "practice"
      ? t(
          "Use this guide to strengthen the logic behind CNA questions and build more confidence in how you make decisions during practice.",
          "Use esta guia para fortalecer la logica detras de las preguntas del examen CNA y ganar mas confianza en su manera de tomar decisiones durante la practica.",
          "Utilisez ce guide pour renforcer la logique derriere les questions de l'examen CNA et prendre davantage confiance dans votre facon de raisonner pendant la pratique.",
          "Sèvi ak gid sa a pou ranfòse lojik ki dèyè kestyon egzamen CNA yo epi bati plis konfyans nan fason ou pran desizyon pandan pratik la."
        )
      : t(
          "These categories explain the kind of thinking each question is testing. They help you move beyond memorizing answers and understand why one choice is safer, stronger, or more appropriate than another.",
          "Estas categorias explican el tipo de razonamiento que evalua cada pregunta. Le ayudan a ir mas alla de memorizar respuestas y a comprender por que una opcion es mas segura, mas solida o mas apropiada que otra.",
          "Ces categories expliquent le type de raisonnement que chaque question evalue. Elles vous aident a aller au-dela de la memorisation des reponses et a comprendre pourquoi un choix est plus sur, plus solide ou plus approprie qu'un autre.",
          "Kategori sa yo esplike ki kalite refleksyon chak kestyon ap teste. Yo ede ou ale pi lwen pase memorize repons yo epi konprann poukisa yon chwa pi an sekirite, pi solid, oswa pi bon pase yon lot."
        );
  const practiceCalloutTitle = t(
    "How to use this in practice",
    "Como usar esto en la practica",
    "Comment utiliser ceci pendant la pratique",
    "Kijan pou itilize sa pandan pratik la"
  );
  const practiceCalloutItems = [
    t(
      "Review the category you want to strengthen before starting a focused session.",
      "Revise la categoria que desea fortalecer antes de comenzar una sesion enfocada.",
      "Revoyez la categorie que vous souhaitez renforcer avant de commencer une session ciblee.",
      "Revize kategori ou vle ranfose a anvan ou komanse yon sesyon konsantre."
    ),
    t(
      "Return to the Practice Hub and choose category-based practice.",
      "Regrese al Centro de Practica y elija practica por categoria.",
      "Retournez au hub de pratique et choisissez une pratique par categorie.",
      "Retounen nan Hub Pratik la epi chwazi pratik pa kategori."
    ),
    t(
      "Use your practice answers to improve CNA logic, judgment, and safer decision-making.",
      "Use sus respuestas de practica para mejorar la logica CNA, el juicio y una toma de decisiones mas segura.",
      "Utilisez vos reponses de pratique pour ameliorer la logique CNA, le jugement et une prise de decision plus sure.",
      "Sèvi ak repons pratik ou yo pou amelyore lojik CNA, jijman, ak fason pou pran desizyon ki pi an sekirite."
    ),
  ];

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

  const subhead = {
    marginTop: 14,
    marginBottom: 6,
    fontSize: 14,
    fontWeight: 800,
    color: "var(--heading)",
  };

  const bodyText = {
    color: "#385164",
    lineHeight: 1.7,
  };

  const ul = {
    marginTop: 6,
    marginBottom: 0,
    paddingLeft: 18,
    lineHeight: 1.7,
    color: "#334e61",
  };

  function handleToggle(categoryId, e) {
    if (!e?.target?.open) return;
    try {
      document.querySelectorAll('details[data-category]').forEach((d) => {
        if (d.getAttribute("data-category") !== String(categoryId)) d.open = false;
      });
    } catch {}
  }


const categories = [
  {
    id: 1,
    title: t("Change in Condition", "Cambio en la condicion", "Changement de l'etat", "Chanjman nan kondisyon"),
    description: t(
      "This category measures whether you notice when something about the resident is new, different, worse, or concerning.",
      "Esta categoria evalua si usted reconoce cuando algo en el residente es nuevo, distinto, peor o preocupante.",
      "Cette categorie evalue si vous remarquez qu'un element chez le resident est nouveau, different, plus grave ou inquietant.",
        "Kategori sa a mezire si ou remake le yon bagay sou rezidan an nouvo, diferan, vin pi mal, oswa ta dwe fe ou poze kestyon."
    ),
    ask: t(
      "Is this a change that should not be ignored?",
      "Es un cambio que no debe ignorarse?",
      "Est-ce un changement qu'il ne faut pas ignorer ?",
      "Eske se yon chanjman ou pa dwe inyore?"
    ),
    why: t(
      "Many CNA questions begin with a subtle clue. This category trains you to recognize when the resident is no longer at baseline.",
      "Muchas preguntas del examen CNA empiezan con una pista sutil. Esta categoria le ayuda a reconocer cuando el residente ya no esta en su estado habitual.",
      "De nombreuses questions de l'examen CNA commencent par un indice discret. Cette categorie vous aide a reconnaitre quand le resident n'est plus dans son etat habituel.",
        "Anpil kestyon egzamen CNA konmanse ak yon ti siy ki pa two kle. Kategori sa a ede ou rekonet le rezidan an pa nan eta abityel li anko."
    ),
  },
  {
    id: 2,
    title: t("Scope of Practice & Reporting", "Alcance de practica y reporte", "Champ de pratique et signalement", "Limit pratik ak rapo"),
    description: t(
      "This category measures whether you know what a nurse aide should do and what should be reported to the nurse.",
      "Esta categoria evalua si usted sabe lo que un auxiliar de enfermeria puede hacer y lo que debe reportar a la enfermera.",
      "Cette categorie evalue si vous savez ce qu'un aide-soignant peut faire et ce qui doit etre signale a l'infirmiere.",
      "Kategori sa a mezire si ou konnen sa yon CNA ka fe ak sa li dwe rapote bay enfimye a."
    ),
    ask: t(
      "Should I do this, or should I report it?",
        "Debo hacerlo yo mismo o debo reportarlo?",
      "Dois-je le faire moi-meme ou dois-je le signaler ?",
      "Eske se mwen ki dwe fe sa, oswa mwen dwe rapote li?"
    ),
    why: t(
      "It helps you stay within the nurse aide role and choose safe answers instead of acting outside your scope.",
      "Le ayuda a mantenerse dentro del rol del CNA y a escoger respuestas seguras en lugar de actuar fuera de sus funciones.",
      "Elle vous aide a rester dans le role de l'aide-soignant et a choisir des reponses sures au lieu d'agir en dehors de votre champ de pratique.",
      "Li ede ou rete nan wol CNA a epi chwazi repons ki an sekirite olye ou aji andeyo limit travay ou."
    ),
  },
  {
    id: 3,
    title: t("Communication & Emotional Support", "Comunicacion y apoyo emocional", "Communication et soutien emotionnel", "Kominikasyon ak sipor emosyonel"),
    description: t(
      "This category measures how you speak to residents and how you respond in a calm, respectful, and supportive way.",
      "Esta categoria evalua como habla con los residentes y como responde de una manera calmada, respetuosa y de apoyo.",
      "Cette categorie evalue la facon dont vous parlez aux residents et dont vous repondez avec calme, respect et soutien.",
      "Kategori sa a mezire fason ou pale ak rezidan yo ak fason ou reponn ak kalm, respe, ak sipor."
    ),
    ask: t(
      "Which answer shows patience, respect, and support?",
      "Que respuesta demuestra paciencia, respeto y apoyo?",
      "Quelle reponse montre de la patience, du respect et du soutien ?",
      "Ki repons ki montre pasyans, respe, ak sipor?"
    ),
    why: t(
      "Strong CNA answers are not only correct. They are also respectful, calming, and resident-centered.",
      "Una buena respuesta de CNA no solo es correcta. Tambien debe ser respetuosa, tranquilizadora y centrada en el residente.",
      "Une bonne reponse de CNA n'est pas seulement correcte. Elle doit aussi etre respectueuse, rassurante et centree sur le resident.",
      "Yon bon repons CNA pa selman korek. Li dwe respekte rezidan an, kalme li, epi santre sou bezwen li."
    ),
  },
  {
    id: 4,
    title: t("Observation & Safety", "Observacion y seguridad", "Observation et securite", "Obsevasyon ak sekirite"),
    description: t(
      "This category measures whether you notice warning signs, risks, or safety concerns before something gets worse.",
      "Esta categoria evalua si usted detecta senales de alerta, riesgos o problemas de seguridad antes de que la situacion empeore.",
      "Cette categorie evalue si vous remarquez des signes d'alerte, des risques ou des problemes de securite avant qu'une situation n'empire.",
      "Kategori sa a mezire si ou remake siy avetisman, risk, oswa pwoblem sekirite anvan sitiyasyon an vin pi mal."
    ),
    ask: t(
      "What problem or danger do I need to notice first?",
      "Que problema o peligro debo notar primero?",
      "Quel probleme ou danger dois-je remarquer en premier ?",
      "Ki pwoblem oswa danje mwen dwe remake an premye?"
    ),
    why: t(
      "These questions test your ability to recognize risk early and protect the resident before harm increases.",
      "Estas preguntas miden su capacidad para reconocer el riesgo a tiempo y proteger al residente antes de que el dano aumente.",
      "Ces questions evaluent votre capacite a reconnaitre le risque tot et a proteger le resident avant que le danger ne s'aggrave.",
        "Kestyon sa yo teste kapasite ou pou rekonet risk bone epi pwoteje rezidan an anvan danje a ogmante."
    ),
  },
  {
    id: 5,
    title: t("Personal Care & Comfort", "Cuidado personal y comodidad", "Soins personnels et confort", "Swen pesonel ak konfo"),
    description: t(
      "This category measures daily care that helps the resident stay clean, comfortable, and properly cared for.",
      "Esta categoria evalua el cuidado diario que ayuda al residente a mantenerse limpio, comodo y bien atendido.",
      "Cette categorie evalue les soins quotidiens qui aident le resident a rester propre, confortable et bien pris en charge.",
      "Kategori sa a mezire swen chak jou ki ede rezidan an rete pwop, alez, epi byen pran swen."
    ),
    ask: t(
      "Which answer best supports comfort and proper care?",
      "Que respuesta favorece mejor la comodidad y el cuidado adecuado?",
        "Quelle reponse favorise le mieux le confort et des soins appropries ?",
      "Ki repons ki pi byen soutni konfo ak bon swen?"
    ),
    why: t(
      "It focuses on the quality of routine care, not just finishing the task quickly.",
      "Se enfoca en la calidad del cuidado rutinario, no solo en terminar la tarea rapidamente.",
      "Elle met l'accent sur la qualite des soins de routine, et pas seulement sur le fait de terminer la tache rapidement.",
      "Li konsantre sou kalite swen woutin yo, pa selman sou fini travay la vit."
    ),
  },
  {
    id: 6,
    title: t("Mobility & Positioning", "Movilidad y posicionamiento", "Mobilite et positionnement", "Mobilite ak pozisyonman"),
    description: t(
      "This category measures safe movement, transfers, walking, and body positioning.",
      "Esta categoria evalua el movimiento seguro, los traslados, la marcha y el posicionamiento del cuerpo.",
      "Cette categorie evalue les deplacements securitaires, les transferts, la marche et le positionnement du corps.",
      "Kategori sa a mezire mouvman an sekirite, transfere, mache, ak bon pozisyonman ko a."
    ),
    ask: t(
      "What keeps the resident safest during movement?",
      "Que mantiene al residente mas seguro durante el movimiento?",
      "Qu'est-ce qui assure le plus de securite au resident pendant le deplacement ?",
      "Kisa ki kenbe rezidan an pi an sekirite pandan mouvman an?"
    ),
    why: t(
      "It helps you think about balance, support, body mechanics, and positioning before you move the resident.",
      "Le ayuda a pensar en el equilibrio, el apoyo, la mecanica corporal y el posicionamiento antes de mover al residente.",
      "Elle vous aide a penser a l'equilibre, au soutien, a la mecanique du corps et au positionnement avant de deplacer le resident.",
      "Li ede ou reflechi sou ekilib, sipor, mekanik ko, ak pozisyonman anvan ou deplase rezidan an."
    ),
  },
  {
    id: 7,
    title: t("Environment & Safety", "Entorno y seguridad", "Environnement et securite", "Anviwonman ak sekirite"),
    description: t(
      "This category measures whether the room and surroundings are safe for the resident.",
      "Esta categoria evalua si la habitacion y el entorno son seguros para el residente.",
      "Cette categorie evalue si la chambre et l'environnement sont securitaires pour le resident.",
      "Kategori sa a mezire si chanm nan ak tout sa ki antoure li an sekirite pou rezidan an."
    ),
    ask: t(
      "Is there a hazard in the environment?",
      "Hay algun peligro en el entorno?",
      "Y a-t-il un danger dans l'environnement ?",
      "Eske gen yon danje nan anviwonman an?"
    ),
    why: t(
      "Some risks come from the space itself. This category helps you scan the environment, not only the resident.",
      "Algunos riesgos vienen del entorno mismo. Esta categoria le ayuda a observar el espacio, no solo al residente.",
      "Certains risques viennent de l'espace lui-meme. Cette categorie vous aide a observer l'environnement, pas seulement le resident.",
      "Gen risk ki soti nan espas la menm. Kategori sa a ede ou gade anviwonman an, pa selman rezidan an."
    ),
  },
  {
    id: 8,
    title: t("Dignity & Resident Rights", "Dignidad y derechos del residente", "Dignite et droits du resident", "Diyite ak dwa rezidan an"),
    description: t(
      "This category measures privacy, choice, respect, and the resident's right to be treated with dignity.",
      "Esta categoria evalua la privacidad, la capacidad de elegir, el respeto y el derecho del residente a ser tratado con dignidad.",
      "Cette categorie evalue la vie privee, le choix, le respect et le droit du resident d'etre traite avec dignite.",
      "Kategori sa a mezire vi prive, chwa, respe, ak dwa rezidan an pou yo trete li ak diyite."
    ),
    ask: t(
      "Does this answer protect the resident's rights and dignity?",
      "Esta respuesta protege los derechos y la dignidad del residente?",
      "Cette reponse protege-t-elle les droits et la dignite du resident ?",
      "Eske repons sa a pwoteje dwa ak diyite rezidan an?"
    ),
    why: t(
      "It reminds you that safe care also includes privacy, choice, autonomy, and respectful treatment.",
      "Le recuerda que una atencion segura tambien incluye privacidad, capacidad de elegir, autonomia y un trato respetuoso.",
      "Elle vous rappelle que des soins securitaires incluent aussi la vie privee, le choix, l'autonomie et un traitement respectueux.",
      "Li raple ou ke swen ki an sekirite gen ladan l tou vi prive, chwa, otonomi, ak tretman ak respe."
    ),
  },
  {
    id: 9,
    title: t("Infection Control", "Control de infecciones", "Controle des infections", "Kontwol enfeksyon"),
    description: t(
      "This category measures how to prevent the spread of germs and keep care clean and safe.",
      "Esta categoria evalua como prevenir la propagacion de germenes y mantener el cuidado limpio y seguro.",
      "Cette categorie evalue comment prevenir la propagation des germes et garder les soins propres et securitaires.",
      "Kategori sa a mezire kijan pou anpeche mikwob gaye epi kenbe swen an pwop ak an sekirite."
    ),
    ask: t(
      "What action helps prevent contamination?",
      "Que accion ayuda a prevenir la contaminacion?",
      "Quelle action aide a prevenir la contamination ?",
      "Ki aksyon ki ede anpeche kontaminasyon?"
    ),
    why: t(
      "These questions test whether you can protect both the resident and yourself from avoidable spread.",
      "Estas preguntas evaluan si puede proteger tanto al residente como a usted mismo de una propagacion que puede evitarse.",
      "Ces questions evaluent si vous pouvez proteger a la fois le resident et vous-meme contre une propagation evitable.",
      "Kestyon sa yo teste si ou ka pwoteje ni rezidan an ni tet ou kont pwopagasyon enfeksyon ki ka evite."
    ),
  },
];

  return (
    <Frame
      title={pageTitle}
      theme={theme}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            style={{ ...btnPrimary, width: isNarrow ? "100%" : "220px", fontWeight: 700 }}
            onClick={() => router.push(hubRoute)}
          >
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

          <div
            style={{
              fontSize: isNarrow ? 22 : 24,
              fontWeight: 900,
              marginBottom: 8,
              color: "var(--heading)",
              lineHeight: 1.2,
            }}
          >
            {introTitle}
          </div>

          <div style={{ ...bodyText, marginBottom: 12 }}>
            {introBody}
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
              <div style={{ color: "#385164", lineHeight: 1.7 }}>
                {practiceCalloutItems.map((item) => (
                  <div key={item}>{`\u2022 ${item}`}</div>
                ))}
              </div>
            </div>
          ) : null}

          <div style={subhead}>{t("Why they matter", "Por que importan", "Pourquoi elles sont importantes", "Poukisa yo enpotan")}</div>
          <ul style={ul}>
            <li>{t("They help you notice important clues.", "Le ayudan a notar pistas importantes.", "Elles vous aident a remarquer des indices importants.", "Yo ede ou remake siy enpotan yo.")}</li>
            <li>{t("They help you use safe logic.", "Le ayudan a usar una logica segura.", "Elles vous aident a utiliser une logique sure.", "Yo ede ou itilize yon lojik ki an sekirite.")}</li>
            <li>{t("They help you stay within the nurse aide role.", "Le ayudan a mantenerse dentro del rol del auxiliar.", "Elles vous aident a rester dans le role de l'aide-soignant.", "Yo ede ou rete nan wol CNA a.")}</li>
            <li>{t("They help you choose answers with more confidence.", "Le ayudan a elegir respuestas con mas confianza.", "Elles vous aident a choisir des reponses avec plus d'assurance.", "Yo ede ou chwazi repons yo ak plis konfyans.")}</li>
          </ul>

          <div style={subhead}>{t("How to use them", "Como usarlas", "Comment les utiliser", "Kijan pou itilize yo")}</div>
          <ul style={ul}>
            <li>{t("Look for the main clue in the question.", "Busque la pista principal en la pregunta.", "Cherchez l'indice principal dans la question.", "Chache siy prensipal la nan kestyon an.")}</li>
            <li>{t("Decide which category best fits the problem.", "Decida que categoria se ajusta mejor al problema.", "Decidez quelle categorie correspond le mieux au probleme.", "Deside ki kategori ki pi byen mache ak pwoblem nan.")}</li>
            <li>{t("Think about the safest next step.", "Piense en el siguiente paso mas seguro.", "Pensez a l'etape suivante la plus sure.", "Reflechi sou pwochen etap ki pi an sekirite a.")}</li>
            <li>{t("Ask whether you should do it, report it, or watch closely.", "Preguntese si debe hacerlo, reportarlo o vigilarlo de cerca.", "Demandez-vous si vous devez le faire, le signaler ou l'observer de pres.", "Mande tet ou si ou dwe fe li, rapote li, oswa siveye li byen pre.")}</li>
            <li>{t("Choose the answer that best protects the resident.", "Elija la respuesta que mejor protege al residente.", "Choisissez la reponse qui protege le mieux le resident.", "Chwazi repons ki pi byen pwoteje rezidan an.")}</li>
          </ul>

          <div style={{ ...bodyText, marginTop: 14 }}>
            {t(
              "Chapters help you know where to review. Categories help you understand what kind of thinking needs more practice.",
              "Los capitulos le ayudan a saber que parte debe repasar. Las categorias le ayudan a entender que tipo de razonamiento necesita mas practica.",
              "Les chapitres vous aident a savoir quoi revoir. Les categories vous aident a comprendre quel type de raisonnement a besoin de plus de pratique.",
              "Chapit yo ede ou konnen ki sa pou revize. Kategori yo ede ou konprann ki kalite refleksyon ki bezwen plis pratik."
            )}
          </div>
        </div>

        {categories.map((category, index) => (
          <div key={category.id}>
            <details
              style={detailsStyle}
              data-category={String(category.id)}
              open={index === 0}
              onToggle={(e) => handleToggle(category.id, e)}
            >
              <summary style={summaryStyle}>{`${category.id}. ${category.title}`}</summary>

              <div style={{ ...bodyText, marginTop: 10 }}>{category.description}</div>

              <div style={subhead}>{t("Ask yourself", "Preguntese", "Posez-vous la question", "Mande tet ou")}</div>
              <div style={bodyText}>{category.ask}</div>

              <div style={subhead}>{t("Why this category helps", "Por que esta categoria ayuda", "Pourquoi cette categorie aide", "Poukisa kategori sa a ede")}</div>
              <div style={bodyText}>{category.why}</div>
            </details>

            {index !== categories.length - 1 && <div style={{ height: 10 }} />}
          </div>
        ))}
      </div>
    </Frame>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <CategoriesInner />
    </Suspense>
  );
}
