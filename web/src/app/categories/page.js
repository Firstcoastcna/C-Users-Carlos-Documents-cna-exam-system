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

function CategoriesInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const source = sp.get("src") || "exam";
  const [isNarrow, setIsNarrow] = useState(false);
  const [openCategoryId, setOpenCategoryId] = useState(null);

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
          "Use this guide to understand the 9 question categories used in this platform. They do not replace the chapters. They help you recognize what kind of CNA decision the question is testing and why one answer is safer or stronger than another.",
          "Use esta guia para entender las 9 categorias de preguntas que se usan en esta plataforma. No reemplazan los capitulos. Le ayudan a reconocer que tipo de decision de CNA esta evaluando la pregunta y por que una respuesta es mas segura o mas solida que otra.",
          "Utilisez ce guide pour comprendre les 9 categories de questions utilisees dans cette plateforme. Elles ne remplacent pas les chapitres. Elles vous aident a reconnaitre quel type de decision CNA la question evalue et pourquoi une reponse est plus sure ou plus solide qu'une autre.",
          "Sèvi ak gid sa a pou konprann 9 kategori kestyon yo itilize nan platfom sa a. Yo pa ranplase chapit yo. Yo ede ou rekonet ki kalite desizyon CNA kestyon an ap teste epi poukisa yon repons pi an sekirite oswa pi solid pase yon lot."
        )
      : t(
          "These 9 categories are a platform study tool. They explain the kind of thinking each question is testing and help you move beyond memorizing answers so you can understand why one choice is safer, stronger, or more appropriate than another.",
          "Estas 9 categorias son una herramienta de estudio de la plataforma. Explican el tipo de razonamiento que evalua cada pregunta y le ayudan a ir mas alla de memorizar respuestas para comprender por que una opcion es mas segura, mas solida o mas adecuada que otra.",
          "Ces 9 categories sont un outil d'etude de la plateforme. Elles expliquent le type de raisonnement que chaque question evalue et vous aident a aller au-dela de la memorisation des reponses pour comprendre pourquoi un choix est plus sur, plus solide ou plus adapte qu'un autre.",
          "9 kategori sa yo se yon zouti etid nan platfom nan. Yo esplike ki kalite refleksyon chak kestyon ap teste epi yo ede ou ale pi lwen pase memorize repons yo pou konprann poukisa yon chwa pi an sekirite, pi solid, oswa pi bon pase yon lot."
        );
  const practiceCalloutTitle = t(
    "How to use this in practice",
    "Como usar esto en la practica",
    "Comment utiliser cela pendant la pratique",
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
      "Use sus respuestas de practica para mejorar la logica CNA, el juicio y la toma de decisiones seguras.",
      "Utilisez vos reponses de pratique pour ameliorer la logique CNA, le jugement et la prise de decision sure.",
      "Sèvi ak repons pratik ou yo pou amelyore lojik CNA, jijman, ak fason pou pran desizyon ki pi an sekirite."
    ),
  ];

  const frameworkTitle = t(
    "A simpler way to use the 9 categories",
    "Una manera mas sencilla de usar las 9 categorias",
    "Une facon plus simple d'utiliser les 9 categories",
    "Yon fason ki pi senp pou itilize 9 kategori yo"
  );

  const frameworkBody =
    source === "practice"
      ? t(
          "During practice, these categories can help you see what kind of CNA decision you are practicing. Instead of thinking only by chapter, you can also think about the type of clue, problem, or safest next step the question is asking you to recognize.",
          "Durante la practica, estas categorias pueden ayudarle a ver que tipo de decision de CNA esta practicando. En lugar de pensar solo por capitulo, tambien puede pensar en el tipo de pista, problema o siguiente paso mas seguro que la pregunta le pide reconocer.",
          "Pendant la pratique, ces categories peuvent vous aider a voir quel type de decision CNA vous etes en train de pratiquer. Au lieu de penser seulement par chapitre, vous pouvez aussi penser au type d'indice, de probleme ou d'etape suivante la plus sure que la question vous demande de reconnaitre.",
          "Pandan pratik, kategori sa yo ka ede ou we ki kalite desizyon CNA ou ap pratike. Olye ou panse selman pa chapit, ou ka panse tou ak kalite siy, pwoblem, oswa pwochen etap ki pi an sekirite kestyon an mande ou rekonet."
        )
      : t(
          "The 9 categories can also be understood as 3 larger thinking groups. This makes it easier to see what kind of logic the platform is measuring when you review missed questions, analytics, and remediation.",
          "Las 9 categorias tambien pueden entenderse como 3 grupos mas amplios de razonamiento. Esto facilita ver que tipo de logica esta evaluando la plataforma cuando usted revisa preguntas falladas, analisis y remediacion.",
          "Les 9 categories peuvent aussi etre comprises comme 3 grands groupes de raisonnement. Cela facilite la lecture du type de logique que la plateforme evalue quand vous revoyez les questions manquees, l'analyse et la remediacion.",
          "9 kategori yo ka konprann tou tankou 3 pi gwo gwoup refleksyon. Sa rann li pi fasil pou we ki kalite lojik platfom nan ap mezire le ou ap revize kestyon ou rate yo, analiz, ak remedyasyon."
        );

  const frameworkGroups = [
    {
      id: "notice-understand",
      title: t("Notice and Understand", "Observar y comprender", "Observer et comprendre", "Obsève epi konprann"),
      body: t(
        "These categories help you notice clues, understand what is changing, and recognize what the resident may need.",
        "Estas categorias le ayudan a notar pistas, entender que esta cambiando y reconocer lo que el residente puede necesitar.",
        "Ces categories vous aident a remarquer les indices, a comprendre ce qui change et a reconnaitre ce dont le resident peut avoir besoin.",
        "Kategori sa yo ede ou remake siy yo, konprann sa k ap chanje, epi rekonet sa rezidan an ka bezwen."
      ),
      items: [1, 4, 3],
    },
    {
      id: "protect-support",
      title: t("Protect and Support", "Proteger y apoyar", "Proteger et soutenir", "Pwoteje epi soutni"),
      body: t(
        "These categories focus on preventing harm, keeping care safe, and supporting the resident through good everyday care.",
        "Estas categorias se enfocan en prevenir danos, mantener el cuidado seguro y apoyar al residente mediante un buen cuidado diario.",
        "Ces categories mettent l'accent sur la prevention des risques, la securite des soins et le soutien du resident dans les soins quotidiens.",
        "Kategori sa yo konsantre sou prevni danje, kenbe swen an an sekirite, epi soutni rezidan an atravè bon swen chak jou."
      ),
      items: [7, 9, 5],
    },
    {
      id: "respect-move-report",
      title: t("Respect, Move, and Report", "Respetar, movilizar y reportar", "Respecter, mobiliser et signaler", "Respekte, deplase, epi rapòte"),
      body: t(
        "These categories focus on resident rights, safe movement, and knowing when your role is to report rather than act alone.",
        "Estas categorias se enfocan en los derechos del residente, el movimiento seguro y saber cuando su funcion es reportar en lugar de actuar por su cuenta.",
        "Ces categories portent sur les droits du resident, les deplacements securitaires et le fait de savoir quand votre role est de signaler plutot que d'agir seul.",
        "Kategori sa yo konsantre sou dwa rezidan an, mouvman ki an sekirite, ak konnen ki le wòl ou se rapòte olye ou aji poukont ou."
      ),
      items: [8, 6, 2],
    },
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

  const detailsStyle = {
    border: `2px solid ${theme.primaryBg}`,
    borderRadius: "16px",
    padding: isNarrow ? "16px" : "18px",
    background: "white",
    boxShadow: "0 10px 24px rgba(31, 52, 74, 0.08)",
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
    fontSize: 14,
  };

  const ul = {
    marginTop: 6,
    marginBottom: 0,
    paddingLeft: 18,
    lineHeight: 1.7,
    color: "#334e61",
    fontSize: 14,
  };

  const helperDetailsStyle = {
    border: `1px solid ${theme.chromeBorder}`,
    borderRadius: "14px",
    background: "white",
    padding: isNarrow ? "14px 16px" : "16px 18px",
    marginTop: 14,
  };

  const helperSummaryStyle = {
    cursor: "pointer",
    fontWeight: 800,
    fontSize: 14,
    color: "var(--heading)",
    outline: "none",
  };

  function handleToggle(categoryId, e) {
    const isOpen = !!e?.target?.open;
    setOpenCategoryId(isOpen ? categoryId : null);
    if (!isOpen) return;
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
      "This category tests whether you notice when something about the resident is new, different from baseline, worse, or concerning. It includes physical, cognitive, emotional, and functional changes.",
      "Esta categoria evalua si usted reconoce cuando algo en el residente es nuevo, diferente de su estado habitual, peor o preocupante. Incluye cambios fisicos, cognitivos, emocionales y funcionales.",
      "Cette categorie evalue si vous remarquez qu'un element chez le resident est nouveau, different de son etat habituel, plus grave ou inquietant. Elle comprend les changements physiques, cognitifs, emotionnels et fonctionnels.",
      "Kategori sa a mezire si ou remake le yon bagay sou rezidan an nouvo, diferan ak eta abityel li, vin pi mal, oswa ta dwe bay kestyon. Li gen ladan l chanjman fizik, mantal, emosyonel, ak fonksyonel."
    ),
    ask: t(
      "Is this a change that should not be ignored?",
      "Es un cambio que no debe ignorarse?",
      "Est-ce un changement qu'il ne faut pas ignorer ?",
      "Eske se yon chanjman ou pa dwe inyore?"
    ),
    why: t(
      "Many CNA questions begin with a subtle clue. This category trains you to recognize new, worsening, or unusual signs early without diagnosing the problem yourself.",
      "Muchas preguntas del examen CNA empiezan con una pista sutil. Esta categoria le ayuda a reconocer senales nuevas, que empeoran o inusuales sin intentar diagnosticar el problema usted mismo.",
      "De nombreuses questions de l'examen CNA commencent par un indice discret. Cette categorie vous aide a reconnaitre les signes nouveaux, qui s'aggravent ou inhabituels sans essayer de poser vous-meme un diagnostic.",
      "Anpil kestyon egzamen CNA konmanse ak yon ti siy ki pa two kle. Kategori sa a ede ou rekonet siy nouvo, siy ki vin pi mal, oswa siy ki pa abityel san ou pa eseye bay yon dyagnostik ou menm."
    ),
  },
  {
    id: 2,
    title: t("Scope of Practice & Reporting", "Alcance de practica y reporte", "Champ de pratique et signalement", "Limit pratik ak rapo"),
    description: t(
      "This category tests whether you know what is within the CNA role, what is outside that role, and who must be informed.",
      "Esta categoria evalua si usted sabe que esta dentro del rol del CNA, que esta fuera de ese rol y a quien debe informarse.",
      "Cette categorie evalue si vous savez ce qui est dans le role du CNA, ce qui est en dehors de ce role et qui doit etre informe.",
      "Kategori sa a mezire si ou konnen sa ki nan wol CNA a, sa ki pa nan wol la, ak kiyès ki dwe resevwa rapo a."
    ),
    ask: t(
      "Should I do this, or should I report it?",
        "Debo hacerlo yo mismo o debo reportarlo?",
      "Dois-je le faire moi-meme ou dois-je le signaler ?",
      "Eske se mwen ki dwe fe sa, oswa mwen dwe rapote li?"
    ),
    why: t(
      "It helps you separate observe from assess, report from intervene, and CNA duties from nurse or provider responsibilities.",
      "Le ayuda a diferenciar observar de evaluar, reportar de intervenir y las tareas del CNA de las responsabilidades de la enfermera o del proveedor.",
      "Elle vous aide a distinguer observer et evaluer, signaler et intervenir, ainsi que les taches du CNA et les responsabilites de l'infirmiere ou du professionnel de sante.",
      "Li ede ou separe obseve ak evalye, rapote ak entevni, epi travay CNA a ak responsabilite enfimye oswa pwofesyonel sante a."
    ),
  },
  {
    id: 3,
    title: t("Communication & Emotional Support", "Comunicacion y apoyo emocional", "Communication et soutien emotionnel", "Kominikasyon ak sipor emosyonel"),
    description: t(
      "This category tests how you speak to residents and how you respond verbally and emotionally in a calm, respectful, and supportive way.",
      "Esta categoria evalua como habla con los residentes y como responde verbal y emocionalmente de una manera calmada, respetuosa y de apoyo.",
      "Cette categorie evalue la facon dont vous parlez aux residents et dont vous repondez verbalement et emotionnellement avec calme, respect et soutien.",
      "Kategori sa a mezire fason ou pale ak rezidan yo ak fason ou reponn an pawol ak emosyon ak kalm, respe, ak sipor."
    ),
    ask: t(
      "Which answer shows patience, respect, and support?",
      "Que respuesta demuestra paciencia, respeto y apoyo?",
      "Quelle reponse montre de la patience, du respect et du soutien ?",
      "Ki repons ki montre pasyans, respe, ak sipor?"
    ),
    why: t(
      "It trains you to listen for emotional cues and choose responses that use reassurance, orientation cues, and the right tone and pacing.",
      "Le ensena a escuchar las senales emocionales y a elegir respuestas que usen tranquilidad, orientacion y el tono y ritmo adecuados.",
      "Elle vous apprend a reconnaitre les indices emotionnels et a choisir des reponses qui utilisent le reassurance, les reperes d'orientation et le bon ton et rythme.",
      "Li aprann ou remake siy emosyonel yo epi chwazi repons ki bay rasirans, endis oryantasyon, ak bon ton ak bon ritm."
    ),
  },
  {
    id: 4,
    title: t("Observation & Safety", "Observacion y seguridad", "Observation et securite", "Obsevasyon ak sekirite"),
    description: t(
      "This category tests whether you notice warning signs, risks, or safety concerns that must be recognized to keep the resident safe.",
      "Esta categoria evalua si usted detecta senales de alerta, riesgos o problemas de seguridad que deben reconocerse para mantener seguro al residente.",
      "Cette categorie evalue si vous remarquez des signes d'alerte, des risques ou des problemes de securite qui doivent etre reconnus pour garder le resident en securite.",
      "Kategori sa a mezire si ou remake siy avetisman, risk, oswa pwoblem sekirite ki dwe rekonet pou kenbe rezidan an an sekirite."
    ),
    ask: t(
      "What problem or danger do I need to notice first?",
      "Que problema o peligro debo notar primero?",
      "Quel probleme ou danger dois-je remarquer en premier ?",
      "Ki pwoblem oswa danje mwen dwe remake an premye?"
    ),
    why: t(
      "These questions often involve fall risk, fatigue, confusion, discomfort, or monitoring during care. They test whether you notice danger before it becomes harm.",
      "Estas preguntas suelen incluir riesgo de caidas, fatiga, confusion, incomodidad o vigilancia durante el cuidado. Evalúan si usted detecta el peligro antes de que se convierta en dano.",
      "Ces questions portent souvent sur le risque de chute, la fatigue, la confusion, l'inconfort ou la surveillance pendant les soins. Elles evaluent si vous remarquez le danger avant qu'il ne cause un prejudice.",
      "Kestyon sa yo souvan gen rapo ak risk tonbe, fatig, konfizyon, malez, oswa siveyans pandan swen. Yo teste si ou remake danje a anvan li tounen domaj."
    ),
  },
  {
    id: 5,
    title: t("Personal Care & Comfort", "Cuidado personal y comodidad", "Soins personnels et confort", "Swen pesonel ak konfo"),
    description: t(
      "This category tests whether care is promoting comfort, dignity, participation, and good daily support.",
      "Esta categoria evalua si el cuidado promueve comodidad, dignidad, participacion y un buen apoyo diario.",
      "Cette categorie evalue si les soins favorisent le confort, la dignite, la participation et un bon soutien quotidien.",
      "Kategori sa a mezire si swen an ap soutni konfo, diyite, patisipasyon, ak bon sipor chak jou."
    ),
    ask: t(
      "Which answer best supports comfort and proper care?",
      "Que respuesta favorece mejor la comodidad y el cuidado adecuado?",
        "Quelle reponse favorise le mieux le confort et des soins appropries ?",
      "Ki repons ki pi byen soutni konfo ak bon swen?"
    ),
    why: t(
      "It includes routine care like bathing, grooming, and feeding, while also reminding you to support preferences, comfort, and participation instead of rushing the task.",
      "Incluye cuidados rutinarios como bano, aseo y alimentacion, y tambien le recuerda apoyar las preferencias, la comodidad y la participacion en lugar de apresurar la tarea.",
      "Elle comprend les soins de routine comme le bain, la toilette et l'alimentation, tout en vous rappelant de soutenir les preferences, le confort et la participation au lieu de vous precipiter.",
      "Li gen ladan l swen woutin tankou benyen, netwayaj, ak manje, epi li raple ou soutni preferans, konfo, ak patisipasyon olye ou prese travay la."
    ),
  },
  {
    id: 6,
    title: t("Mobility & Positioning", "Movilidad y posicionamiento", "Mobilite et positionnement", "Mobilite ak pozisyonman"),
    description: t(
      "This category tests safe movement, transfers, repositioning, walking, and body positioning.",
      "Esta categoria evalua el movimiento seguro, los traslados, los cambios de posicion, la marcha y el posicionamiento del cuerpo.",
      "Cette categorie evalue les deplacements securitaires, les transferts, les changements de position, la marche et le positionnement du corps.",
      "Kategori sa a mezire mouvman an sekirite, transfere, chanje pozisyon, mache, ak bon pozisyonman ko a."
    ),
    ask: t(
      "What keeps the resident safest during movement?",
      "Que mantiene al residente mas seguro durante el movimiento?",
      "Qu'est-ce qui assure le plus de securite au resident pendant le deplacement ?",
      "Kisa ki kenbe rezidan an pi an sekirite pandan mouvman an?"
    ),
    why: t(
      "It helps you think about transfers, repositioning, body mechanics, and assistive devices before you move the resident.",
      "Le ayuda a pensar en los traslados, los cambios de posicion, la mecanica corporal y los dispositivos de ayuda antes de mover al residente.",
      "Elle vous aide a penser aux transferts, aux changements de position, a la mecanique du corps et aux dispositifs d'assistance avant de deplacer le resident.",
      "Li ede ou reflechi sou transfere, chanje pozisyon, mekanik ko, ak aparey asistans anvan ou deplase rezidan an."
    ),
  },
  {
    id: 7,
    title: t("Environment & Safety", "Entorno y seguridad", "Environnement et securite", "Anviwonman ak sekirite"),
    description: t(
      "This category tests whether the physical space is safe and supportive for the resident.",
      "Esta categoria evalua si el espacio fisico es seguro y adecuado para el residente.",
      "Cette categorie evalue si l'espace physique est sur et adapte au resident.",
      "Kategori sa a mezire si espas fizik la an sekirite epi li bon pou rezidan an."
    ),
    ask: t(
      "Is there a hazard in the environment?",
      "Hay algun peligro en el entorno?",
      "Y a-t-il un danger dans l'environnement ?",
      "Eske gen yon danje nan anviwonman an?"
    ),
    why: t(
      "Some risks come from the space itself. This category teaches you to look at bed position, call light access, clutter, wet floors, lighting, and equipment placement.",
      "Algunos riesgos vienen del entorno mismo. Esta categoria le ensena a mirar la posicion de la cama, el acceso al timbre, el desorden, los pisos mojados, la iluminacion y la ubicacion del equipo.",
      "Certains risques viennent de l'espace lui-meme. Cette categorie vous apprend a verifier la position du lit, l'acces a la sonnette, l'encombrement, les sols mouilles, l'eclairage et l'emplacement du materiel.",
      "Gen risk ki soti nan espas la menm. Kategori sa a aprann ou gade pozisyon kabann nan, aksè ak sonnet la, dezod, planche mouye, limyè, ak kote ekipman yo ye."
    ),
  },
  {
    id: 8,
    title: t("Dignity & Resident Rights", "Dignidad y derechos del residente", "Dignite et droits du resident", "Diyite ak dwa rezidan an"),
    description: t(
      "This category tests privacy, choice, respect, autonomy, and the resident's right to be treated with dignity.",
      "Esta categoria evalua la privacidad, la capacidad de elegir, el respeto, la autonomia y el derecho del residente a ser tratado con dignidad.",
      "Cette categorie evalue la vie privee, le choix, le respect, l'autonomie et le droit du resident d'etre traite avec dignite.",
      "Kategori sa a mezire vi prive, chwa, respe, otonomi, ak dwa rezidan an pou yo trete li ak diyite."
    ),
    ask: t(
      "Does this answer protect the resident's rights and dignity?",
      "Esta respuesta protege los derechos y la dignidad del residente?",
      "Cette reponse protege-t-elle les droits et la dignite du resident ?",
      "Eske repons sa a pwoteje dwa ak diyite rezidan an?"
    ),
    why: t(
      "It reminds you to protect choice and consent, avoid overhelping, preserve privacy during care, and use respectful language.",
      "Le recuerda proteger la eleccion y el consentimiento, evitar ayudar de mas, preservar la privacidad durante el cuidado y usar un lenguaje respetuoso.",
      "Elle vous rappelle de proteger le choix et le consentement, d'eviter d'aider excessivement, de preserver l'intimite pendant les soins et d'utiliser un langage respectueux.",
      "Li raple ou pwoteje chwa ak konsantman, evite ede twòp, prezève vi prive pandan swen, epi sèvi ak langaj ki gen respè."
    ),
  },
  {
    id: 9,
    title: t("Infection Control", "Control de infecciones", "Controle des infections", "Kontwol enfeksyon"),
    description: t(
      "This category tests how germs are prevented from spreading and how care is kept clean and safe.",
      "Esta categoria evalua como prevenir la propagacion de germenes y como mantener el cuidado limpio y seguro.",
      "Cette categorie evalue comment empecher la propagation des germes et comment garder les soins propres et securitaires.",
      "Kategori sa a mezire kijan yo anpeche mikwob gaye ak kijan yo kenbe swen an pwop ak an sekirite."
    ),
    ask: t(
      "What action helps prevent contamination?",
      "Que accion ayuda a prevenir la contaminacion?",
      "Quelle action aide a prevenir la contamination ?",
      "Ki aksyon ki ede anpeche kontaminasyon?"
    ),
    why: t(
      "It focuses on hand hygiene, PPE, clean versus dirty tasks, and the precautions that prevent contamination and spread.",
      "Se enfoca en la higiene de manos, el uso de EPP, las tareas limpias frente a las sucias y las precauciones que previenen la contaminacion y la propagacion.",
      "Elle porte sur l'hygiene des mains, l'EPI, les taches propres versus sales et les precautions qui previennent la contamination et la propagation.",
      "Li konsantre sou ijyèn men, EPP, travay pwòp kont travay sal, ak prekosyon ki anpeche kontaminasyon ak pwopagasyon."
    ),
  },
];

  const categoryById = Object.fromEntries(categories.map((category) => [category.id, category]));
  const orderedCategoryIds = [1, 2, 3, 4, 5, 6, 7, 8, 9];
  const expandedCategoryContent = {
    1: {
      description: t(
        "Questions in this category ask whether something about the resident is changing from baseline and what that change means for your next step.",
        "Las preguntas de esta categoria preguntan si algo en el residente esta cambiando con respecto a su estado basal y que significa ese cambio para su siguiente paso.",
        "Les questions de cette categorie demandent si quelque chose change par rapport a l'etat habituel du resident et ce que cela signifie pour votre prochaine etape.",
        "Kesyon nan kategori sa a mande si gen yon bagay k ap chanje nan eta nomal rezidan an epi sa chanjman sa a vle di pou pwochen etap ou."
      ),
      clues: t(
        "new weakness, confusion, sudden pain, breathing changes, fever, unusual behavior",
        "debilidad nueva, confusion, dolor repentino, cambios en la respiracion, fiebre, conducta inusual",
        "nouvelle faiblesse, confusion, douleur soudaine, changements respiratoires, fievre, comportement inhabituel",
        "nouvo febles, konfizyon, doule toudenkou, chanjman nan respirasyon, lafyèv, konpotman ki pa nomal"
      ),
      why: t(
        "It helps you stop and recognize when the safest answer is to report or respond to a new problem instead of treating it like normal care.",
        "Le ayuda a detenerse y reconocer cuando la respuesta mas segura es reportar o responder a un problema nuevo en lugar de tratarlo como cuidado normal.",
        "Elle vous aide a vous arreter et a reconnaitre quand la reponse la plus sure est de signaler ou de reagir a un nouveau probleme au lieu de le traiter comme un soin normal.",
        "Li ede ou pran poz epi rekonet le repons ki pi an sekirite a se rapote oswa reyaji ak yon nouvo pwoblem olye ou trete l tankou swen nomal."
      ),
    },
    2: {
      description: t(
        "Questions in this category ask what a CNA should do, what a CNA should not do, and when the correct action is to report instead of acting alone.",
        "Las preguntas de esta categoria preguntan que debe hacer un CNA, que no debe hacer y cuando la accion correcta es reportar en lugar de actuar por su cuenta.",
        "Les questions de cette categorie demandent ce qu'un CNA doit faire, ne doit pas faire, et quand l'action correcte est de signaler plutot que d'agir seul.",
        "Kesyon nan kategori sa a mande sa yon CNA dwe fe, sa yon CNA pa dwe fe, ak ki le aksyon ki korek la se rapote olye ou aji poukont ou."
      ),
      clues: t(
        "diagnosis, medication, treatment decisions, calling the nurse, reporting findings",
        "diagnostico, medicamentos, decisiones de tratamiento, llamar a la enfermera, reportar hallazgos",
        "diagnostic, medicaments, decisions de traitement, appeler l'infirmiere, signaler des observations",
        "dyagnostik, medikaman, desizyon tretman, rele enfimye a, rapote sa ou remake"
      ),
      why: t(
        "It keeps you anchored in the CNA role and protects you from choosing answers that go beyond observation, assistance, or reporting.",
        "Le mantiene enfocado en el rol del CNA y le protege de elegir respuestas que van mas alla de observar, ayudar o reportar.",
        "Elle vous maintient dans le role du CNA et vous protege contre des reponses qui depassent l'observation, l'aide ou le signalement.",
        "Li kenbe ou byen plase nan wol CNA a epi li pwoteje ou kont repons ki ale pi lwen pase obsevasyon, asistans, oswa rapo."
      ),
    },
    3: {
      description: t(
        "Questions in this category ask how to respond with the right words, tone, and emotional support.",
        "Las preguntas de esta categoria preguntan como responder con las palabras, el tono y el apoyo emocional adecuados.",
        "Les questions de cette categorie demandent comment repondre avec les bons mots, le bon ton et le bon soutien emotionnel.",
        "Kesyon nan kategori sa a mande kijan pou reponn ak bon mo yo, bon ton an, ak bon sipor emosyonel la."
      ),
      clues: t(
        "anxiety, fear, confusion, upset family, reassurance, validation, calm explanation",
        "ansiedad, miedo, confusion, familia angustiada, tranquilidad, validacion, explicacion calmada",
        "anxiete, peur, confusion, famille bouleversee, reassurance, validation, explication calme",
        "enkyetid, lapez, konfizyon, fanmi boulvese, rasirans, validasyon, eksplikasyon kalm"
      ),
      why: t(
        "It helps you pick the response that calms, respects, and supports instead of correcting too sharply or ignoring emotion.",
        "Le ayuda a elegir la respuesta que calma, respeta y apoya en lugar de corregir con dureza o ignorar la emocion.",
        "Elle vous aide a choisir la reponse qui apaise, respecte et soutient au lieu de corriger trop durement ou d'ignorer l'emotion.",
        "Li ede ou chwazi repons ki kalme, respekte, epi soutni olye ou korije two seve oswa inyore emosyon an."
      ),
    },
    4: {
      description: t(
        "Questions in this category ask what important clue or risk you should notice before something unsafe happens.",
        "Las preguntas de esta categoria preguntan que pista o riesgo importante debe notar antes de que ocurra algo inseguro.",
        "Les questions de cette categorie demandent quel indice ou risque important vous devez remarquer avant qu'une situation dangereuse n'arrive.",
        "Kesyon nan kategori sa a mande ki siy oswa risk enpotan ou dwe remake anvan yon sitiyasyon danjere rive."
      ),
      clues: t(
        "fall risk, fatigue, clutter, weak gait, alarm not in place, unsafe setup",
        "riesgo de caida, fatiga, desorden, marcha debil, alarma sin colocar, entorno inseguro",
        "risque de chute, fatigue, encombrement, demarche faible, alarme absente, installation peu sure",
        "risk tonbe, fatig, dezod, mache feb, alam pa an plas, anviwonman ki pa an sekirite"
      ),
      why: t(
        "It helps you see the warning sign before harm happens and choose the answer that protects the resident sooner.",
        "Le ayuda a ver la senal de alerta antes de que ocurra el dano y elegir la respuesta que protege al residente mas pronto.",
        "Elle vous aide a voir le signe d'alerte avant que le danger ne survienne et a choisir la reponse qui protege le resident plus tot.",
        "Li ede ou we siy avetisman an anvan domaj rive epi chwazi repons ki pwoteje rezidan an pi vit."
      ),
    },
    5: {
      description: t(
        "Questions in this category ask how to help with everyday care in a way that is safe, respectful, and comfortable for the resident.",
        "Las preguntas de esta categoria preguntan como ayudar con el cuidado diario de una manera segura, respetuosa y comoda para el residente.",
        "Les questions de cette categorie demandent comment aider aux soins quotidiens d'une facon sure, respectueuse et confortable pour le resident.",
        "Kesyon nan kategori sa a mande kijan pou ede ak swen chak jou yon fason ki an sekirite, respekte rezidan an, epi bay konfo."
      ),
      clues: t(
        "bathing, dressing, grooming, toileting, feeding, pain, comfort, preferences",
        "bano, vestido, aseo, toileteo, alimentacion, dolor, comodidad, preferencias",
        "bain, habillage, toilette, elimination, alimentation, douleur, confort, preferences",
        "benyen, abiye, swen ko, twalet, manje, doule, konfo, preferans"
      ),
      why: t(
        "It helps you choose answers that support dignity and comfort instead of rushing through the task.",
        "Le ayuda a elegir respuestas que apoyan la dignidad y la comodidad en lugar de apresurarse en la tarea.",
        "Elle vous aide a choisir des reponses qui soutiennent la dignite et le confort au lieu de se precipiter dans la tache.",
        "Li ede ou chwazi repons ki soutni diyite ak konfo olye ou prese fini travay la."
      ),
    },
    6: {
      description: t(
        "Questions in this category ask how to move, transfer, or position the resident safely.",
        "Las preguntas de esta categoria preguntan como mover, transferir o posicionar al residente de manera segura.",
        "Les questions de cette categorie demandent comment deplacer, transferer ou positionner le resident en toute securite.",
        "Kesyon nan kategori sa a mande kijan pou deplase, transfere, oswa pozisyone rezidan an san danje."
      ),
      clues: t(
        "gait belt, transfer, wheelchair, turning, lifting, alignment, body mechanics",
        "cinturon de marcha, transferencia, silla de ruedas, giro, levantamiento, alineacion, mecanica corporal",
        "ceinture de marche, transfert, fauteuil roulant, retournement, levage, alignement, mecanique du corps",
        "senti mache, transfer, chez woulant, vire, leve, aliyman, mouvman ko"
      ),
      why: t(
        "It helps you slow down and choose the answer that prevents falls, strain, and unsafe movement.",
        "Le ayuda a ir mas despacio y elegir la respuesta que previene caidas, esfuerzo fisico y movimientos inseguros.",
        "Elle vous aide a ralentir et a choisir la reponse qui previent les chutes, les efforts et les mouvements dangereux.",
        "Li ede ou ralanti epi chwazi repons ki anpeche tonbe, fos twop, ak mouvman ki pa an sekirite."
      ),
    },
    7: {
      description: t(
        "Questions in this category ask whether the room, equipment, or setup is safe enough before care continues.",
        "Las preguntas de esta categoria preguntan si la habitacion, el equipo o la preparacion son lo suficientemente seguros antes de continuar con el cuidado.",
        "Les questions de cette categorie demandent si la chambre, l'equipement ou l'installation sont suffisamment surs avant de poursuivre les soins.",
        "Kesyon nan kategori sa a mande si chanm nan, ekipman an, oswa fason tout bagay ranje a ase an sekirite anvan swen an kontinye."
      ),
      clues: t(
        "bed height, call light, spills, clutter, locked wheels, side rails, equipment placement",
        "altura de la cama, timbre, derrames, desorden, ruedas bloqueadas, barandas, ubicacion del equipo",
        "hauteur du lit, sonnette, deversements, encombrement, roues bloquees, barrieres, placement du materiel",
        "wote kabann, sonnet, likid ate, dezod, wou femen, baro kabann, kote ekipman an ye"
      ),
      why: t(
        "It reminds you that safe care starts with a safe setup, not only with what you do after the task begins.",
        "Le recuerda que el cuidado seguro empieza con una preparacion segura, no solo con lo que hace despues de comenzar la tarea.",
        "Elle vous rappelle que des soins surs commencent par une installation sure, pas seulement par ce que vous faites apres le debut de la tache.",
        "Li fe ou sonje swen ki an sekirite komanse ak yon bon preparasyon, pa selman ak sa ou fe apre travay la komanse."
      ),
    },
    8: {
      description: t(
        "Questions in this category ask how to protect the resident's privacy, choice, respect, and independence.",
        "Las preguntas de esta categoria preguntan como proteger la privacidad, la eleccion, el respeto y la independencia del residente.",
        "Les questions de cette categorie demandent comment proteger l'intimite, le choix, le respect et l'independance du resident.",
        "Kesyon nan kategori sa a mande kijan pou pwoteje vi prive, chwa, respe, ak endepandans rezidan an."
      ),
      clues: t(
        "privacy, refusal, choice, consent, independence, embarrassment, respectful language",
        "privacidad, rechazo, eleccion, consentimiento, independencia, verguenza, lenguaje respetuoso",
        "intimite, refus, choix, consentement, independance, gene, langage respectueux",
        "vi prive, refi, chwa, konsantman, endepandans, wont, langaj respe"
      ),
      why: t(
        "It helps you choose answers that preserve the personhood of the resident, not just finish the task.",
        "Le ayuda a elegir respuestas que preservan la dignidad de la persona residente, no solo terminar la tarea.",
        "Elle vous aide a choisir des reponses qui preservent la dignite de la personne residente, pas seulement a finir la tache.",
        "Li ede ou chwazi repons ki pwoteje diyite moun rezidan an, pa selman fini travay la."
      ),
    },
    9: {
      description: t(
        "Questions in this category ask how to stop germs from spreading during care.",
        "Las preguntas de esta categoria preguntan como evitar que los germenes se propaguen durante el cuidado.",
        "Les questions de cette categorie demandent comment empecher les germes de se propager pendant les soins.",
        "Kesyon nan kategori sa a mande kijan pou anpeche mikwob gaye pandan swen an."
      ),
      clues: t(
        "hand hygiene, gloves, PPE, clean vs dirty tasks, isolation, body fluids",
        "higiene de manos, guantes, PPE, tareas limpias y sucias, aislamiento, fluidos corporales",
        "hygiene des mains, gants, EPI, taches propres et sales, isolement, liquides corporels",
        "ijyen men, gan, PPE, travay pwop ak sal, izolasyon, likid ko"
      ),
      why: t(
        "It trains you to protect the resident, yourself, and other residents by choosing the cleanest and safest order of care.",
        "Le entrena para proteger al residente, a usted mismo y a otros residentes al elegir el orden de cuidado mas limpio y mas seguro.",
        "Elle vous entraine a proteger le resident, vous-meme et les autres residents en choisissant l'ordre de soins le plus propre et le plus sur.",
        "Li antrene ou pou pwoteje rezidan an, tet ou, ak lot rezidan yo le ou chwazi lod swen ki pi pwop ak pi an sekirite."
      ),
    },
  };

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
              <div style={{ color: "#385164", lineHeight: 1.7, fontSize: 14 }}>
                {practiceCalloutItems.map((item) => (
                  <div key={item}>{`\u2022 ${item}`}</div>
                ))}
              </div>
            </div>
          ) : null}

          <div
            style={{
              display: "none",
              border: `1px solid ${theme.chromeBorder}`,
              borderRadius: "16px",
              background: "white",
              padding: isNarrow ? "18px" : "20px",
              marginBottom: "16px",
            }}
          >
            <div style={{ fontWeight: 900, color: "var(--heading)", marginBottom: 8 }}>{frameworkTitle}</div>
            <div style={{ ...bodyText, marginBottom: 12 }}>{frameworkBody}</div>
            <div
              style={{
                display: "none",
                display: "grid",
                gridTemplateColumns: isNarrow ? "1fr" : "repeat(3, minmax(0, 1fr))",
                gap: 10,
              }}
            >
              {frameworkGroups.map((group) => (
                <div
                  key={group.id}
                  style={{
                    border: "1px solid var(--chrome-border)",
                    borderRadius: 14,
                    background: "var(--surface-soft)",
                    padding: 14,
                  }}
                >
                  <div style={{ fontWeight: 800, color: "var(--heading)", marginBottom: 6 }}>{group.title}</div>
                  <div style={{ ...bodyText, fontSize: 14, marginBottom: 8 }}>{group.body}</div>
                  <div style={{ color: "#385164", fontSize: 14, lineHeight: 1.7 }}>
                    {group.items.map((id) => categoryById[id]?.title).filter(Boolean).join(" • ")}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {isNarrow ? (
            <details style={helperDetailsStyle}>
              <summary style={helperSummaryStyle}>
                {t("Why they matter", "Por que importan", "Pourquoi elles sont importantes", "Poukisa yo enpotan")}
              </summary>
              <ul style={ul}>
                <li>{t("They help you notice important clues.", "Le ayudan a notar pistas importantes.", "Elles vous aident a remarquer des indices importants.", "Yo ede ou remake siy enpotan yo.")}</li>
                <li>{t("They help you use safe logic instead of only memorizing answers.", "Le ayudan a usar una logica segura en lugar de solo memorizar respuestas.", "Elles vous aident a utiliser une logique sure au lieu de seulement memoriser les reponses.", "Yo ede ou itilize yon lojik ki an sekirite olye ou selman memorize repons yo.")}</li>
                <li>{t("They help you stay within the nurse aide role.", "Le ayudan a mantenerse dentro del rol del auxiliar.", "Elles vous aident a rester dans le role de l'aide-soignant.", "Yo ede ou rete nan wol CNA a.")}</li>
                <li>{t("They help you choose safer answers with more confidence.", "Le ayudan a elegir respuestas mas seguras y con mas confianza.", "Elles vous aident a choisir des reponses plus sures avec plus d'assurance.", "Yo ede ou chwazi repons ki pi an sekirite ak plis konfyans.")}</li>
              </ul>
            </details>
          ) : (
            <>
              <div style={subhead}>{t("Why they matter", "Por que importan", "Pourquoi elles sont importantes", "Poukisa yo enpotan")}</div>
              <ul style={ul}>
                <li>{t("They help you notice important clues.", "Le ayudan a notar pistas importantes.", "Elles vous aident a remarquer des indices importants.", "Yo ede ou remake siy enpotan yo.")}</li>
                <li>{t("They help you use safe logic instead of only memorizing answers.", "Le ayudan a usar una logica segura en lugar de solo memorizar respuestas.", "Elles vous aident a utiliser une logique sure au lieu de seulement memoriser les reponses.", "Yo ede ou itilize yon lojik ki an sekirite olye ou selman memorize repons yo.")}</li>
                <li>{t("They help you stay within the nurse aide role.", "Le ayudan a mantenerse dentro del rol del auxiliar.", "Elles vous aident a rester dans le role de l'aide-soignant.", "Yo ede ou rete nan wol CNA a.")}</li>
                <li>{t("They help you choose safer answers with more confidence.", "Le ayudan a elegir respuestas mas seguras y con mas confianza.", "Elles vous aident a choisir des reponses plus sures avec plus d'assurance.", "Yo ede ou chwazi repons ki pi an sekirite ak plis konfyans.")}</li>
              </ul>
            </>
          )}

          {isNarrow ? (
            <details style={helperDetailsStyle}>
              <summary style={helperSummaryStyle}>
                {t("How to use them", "Como usarlas", "Comment les utiliser", "Kijan pou itilize yo")}
              </summary>
              <ul style={ul}>
                <li>{t("Look for the main clue in the question.", "Busque la pista principal en la pregunta.", "Cherchez l'indice principal dans la question.", "Chache siy prensipal la nan kestyon an.")}</li>
                <li>{t("Ask what kind of problem or decision the question is testing.", "Preguntese que tipo de problema o decision esta evaluando la pregunta.", "Demandez-vous quel type de probleme ou de decision la question evalue.", "Mande tet ou ki kalite pwoblem oswa desizyon kestyon an ap teste.")}</li>
                <li>{t("Identify which category best fits the question.", "Identifique que categoria se ajusta mejor a la pregunta.", "Identifiez quelle categorie correspond le mieux a la question.", "Idantifye ki kategori ki pi byen mache ak kestyon an.")}</li>
                <li>{t("Think about the safest next step.", "Piense en el siguiente paso mas seguro.", "Pensez a l'etape suivante la plus sure.", "Reflechi sou pwochen etap ki pi an sekirite a.")}</li>
                <li>{t("Ask whether you should do it, report it, or watch closely.", "Preguntese si debe hacerlo, reportarlo o vigilarlo de cerca.", "Demandez-vous si vous devez le faire, le signaler ou l'observer de pres.", "Mande tet ou si ou dwe fe li, rapote li, oswa siveye li byen pre.")}</li>
                <li>{t("Choose the answer that best protects the resident.", "Elija la respuesta que mejor protege al residente.", "Choisissez la reponse qui protege le mieux le resident.", "Chwazi repons ki pi byen pwoteje rezidan an.")}</li>
              </ul>
            </details>
          ) : (
            <>
              <div style={subhead}>{t("How to use them", "Como usarlas", "Comment les utiliser", "Kijan pou itilize yo")}</div>
              <ul style={ul}>
                <li>{t("Look for the main clue in the question.", "Busque la pista principal en la pregunta.", "Cherchez l'indice principal dans la question.", "Chache siy prensipal la nan kestyon an.")}</li>
                <li>{t("Ask what kind of problem or decision the question is testing.", "Preguntese que tipo de problema o decision esta evaluando la pregunta.", "Demandez-vous quel type de probleme ou de decision la question evalue.", "Mande tet ou ki kalite pwoblem oswa desizyon kestyon an ap teste.")}</li>
                <li>{t("Identify which category best fits the question.", "Identifique que categoria se ajusta mejor a la pregunta.", "Identifiez quelle categorie correspond le mieux a la question.", "Idantifye ki kategori ki pi byen mache ak kestyon an.")}</li>
                <li>{t("Think about the safest next step.", "Piense en el siguiente paso mas seguro.", "Pensez a l'etape suivante la plus sure.", "Reflechi sou pwochen etap ki pi an sekirite a.")}</li>
                <li>{t("Ask whether you should do it, report it, or watch closely.", "Preguntese si debe hacerlo, reportarlo o vigilarlo de cerca.", "Demandez-vous si vous devez le faire, le signaler ou l'observer de pres.", "Mande tet ou si ou dwe fe li, rapote li, oswa siveye li byen pre.")}</li>
                <li>{t("Choose the answer that best protects the resident.", "Elija la respuesta que mejor protege al residente.", "Choisissez la reponse qui protege le mieux le resident.", "Chwazi repons ki pi byen pwoteje rezidan an.")}</li>
              </ul>
            </>
          )}

          <div style={{ ...bodyText, marginTop: 14 }}>
            {t(
              "Chapters help you know where to review. Categories help you understand what kind of thinking needs more practice.",
              "Los capitulos le ayudan a saber que parte debe repasar. Las categorias le ayudan a entender que tipo de razonamiento necesita mas practica.",
              "Les chapitres vous aident a savoir quoi revoir. Les categories vous aident a comprendre quel type de raisonnement a besoin de plus de pratique.",
              "Chapit yo ede ou konnen ki sa pou revize. Kategori yo ede ou konprann ki kalite refleksyon ki bezwen plis pratik."
            )}
          </div>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))",
            gap: 12,
          }}
        >
          {orderedCategoryIds.map((categoryId) => {
            const category = categoryById[categoryId];
            const expanded = expandedCategoryContent[categoryId] || {};
            if (!category) return null;
            return (
              <div key={`direct-${category.id}`}>
                <details
                  style={detailsStyle}
                  data-category={String(category.id)}
                  onToggle={(e) => handleToggle(category.id, e)}
                >
                  <summary style={summaryStyle}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 8 }}>
                      <div>{`${category.id}. ${category.title}`}</div>
                      <div style={{ fontSize: 11, fontWeight: 700, color: "#607282", whiteSpace: "nowrap" }}>
                        {openCategoryId === category.id
                          ? isNarrow
                            ? t("Tap to close", "Toque para cerrar", "Touchez pour fermer", "Peze pou femen")
                            : t("Click to close", "Haga clic para cerrar", "Cliquez pour fermer", "Klike pou femen")
                          : isNarrow
                            ? t("Tap to open", "Toque para abrir", "Touchez pour ouvrir", "Peze pou louvri")
                            : t("Click to open", "Haga clic para abrir", "Cliquez pour ouvrir", "Klike pou louvri")}
                      </div>
                    </div>
                  </summary>

                  <div style={{ ...bodyText, marginTop: 10 }}>{expanded.description || category.description}</div>

                  {expanded.clues ? (
                    <>
                      <div style={subhead}>{t("Common clues", "Pistas comunes", "Indices frequents", "Siy komen")}</div>
                      <div style={bodyText}>{expanded.clues}</div>
                    </>
                  ) : null}

                  <div style={subhead}>{t("Ask yourself", "Preguntese", "Posez-vous la question", "Mande tet ou")}</div>
                  <div style={bodyText}>{category.ask}</div>

                  <div style={subhead}>{t("Why this category helps", "Por que esta categoria ayuda", "Pourquoi cette categorie aide", "Poukisa kategori sa a ede")}</div>
                  <div style={bodyText}>{expanded.why || category.why}</div>
                </details>
              </div>
            );
          })}
        </div>

        {false && frameworkGroups.map((group, groupIndex) => {
          const groupCategories = group.items.map((categoryId, index) => {
            const category = categoryById[categoryId];
            if (!category) return null;
            return (
              <div key={category.id}>
                <details
                  style={detailsStyle}
                  data-category={String(category.id)}
                  onToggle={(e) => handleToggle(category.id, e)}
                >
                  <summary style={summaryStyle}>{`${category.id}. ${category.title}`}</summary>

                  <div style={{ ...bodyText, marginTop: 10 }}>{category.description}</div>

                  <div style={subhead}>{t("Ask yourself", "Preguntese", "Posez-vous la question", "Mande tet ou")}</div>
                  <div style={bodyText}>{category.ask}</div>

                  <div style={subhead}>{t("Why this category helps", "Por que esta categoria ayuda", "Pourquoi cette categorie aide", "Poukisa kategori sa a ede")}</div>
                  <div style={bodyText}>{category.why}</div>
                </details>

                {(groupIndex !== frameworkGroups.length - 1 || index !== group.items.length - 1) && <div style={{ height: 10 }} />}
              </div>
            );
          });

          return (
            <details
              key={group.id}
              data-group={group.id}
              open={groupIndex === 0}
              onToggle={(e) => handleGroupToggle(group.id, e)}
              style={{
                border: `1px solid ${theme.chromeBorder}`,
                borderRadius: "16px",
                background: "white",
                overflow: "hidden",
                marginBottom: groupIndex === frameworkGroups.length - 1 ? 0 : 14,
              }}
            >
              <summary style={{ cursor: "pointer", listStyle: "none", padding: 0 }}>
                <div
                  style={{
                    padding: isNarrow ? "16px" : "18px",
                    background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
                  }}
                >
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      gap: 8,
                      marginBottom: 6,
                    }}
                  >
                    <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.08em", textTransform: "uppercase", color: "var(--brand-teal-dark)" }}>
                      {t("Thinking Group", "Grupo de razonamiento", "Groupe de raisonnement", "Gwoup refleksyon")}
                    </div>
                    <div style={{ fontSize: 11, fontWeight: 700, color: "#607282" }}>
                      {isNarrow
                        ? t("Tap to open", "Toque para abrir", "Touchez pour ouvrir", "Peze pou louvri")
                        : t("Click to open", "Haga clic para abrir", "Cliquez pour ouvrir", "Klike pou louvri")}
                    </div>
                  </div>
                  <div style={{ fontSize: isNarrow ? 18 : 20, fontWeight: 900, color: "var(--heading)", marginBottom: 6 }}>{group.title}</div>
                  <div style={bodyText}>{group.body}</div>
                </div>
              </summary>
              <div style={{ padding: isNarrow ? "0 16px 16px" : "0 18px 18px" }}>{groupCategories}</div>
            </details>
          );
        })}
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
