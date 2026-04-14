"use client";

import React, { Suspense, useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { fetchUserPreferences, updateUserPreferences } from "../lib/backend/auth/browserAuth";

function Frame({ title, children, footer, theme, headerAction }) {
  return (
    <div style={{ maxWidth: "980px", margin: "0 auto", padding: "20px" }}>
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

function SectionCard({ title, children, tint = "white", border = "var(--chrome-border)" }) {
  return (
    <div
      style={{
        border: `1px solid ${border}`,
        borderRadius: "18px",
        background: tint,
        padding: "20px",
        display: "grid",
        gap: "12px",
      }}
    >
      <div style={{ fontSize: 20, fontWeight: 800, color: "var(--heading)", lineHeight: 1.2 }}>{title}</div>
      <div style={{ color: "#456173", lineHeight: 1.7, fontSize: 14 }}>{children}</div>
    </div>
  );
}

function MiniBullet({ text }) {
  return (
    <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
      <div
        style={{
          width: 8,
          height: 8,
          borderRadius: 999,
          background: "var(--brand-teal)",
          marginTop: 7,
          flex: "0 0 auto",
        }}
      />
      <div style={{ color: "#456173", lineHeight: 1.7, fontSize: 14 }}>{text}</div>
    </div>
  );
}

function ExampleBullet({ text }) {
  return (
    <div style={{ display: "flex", gap: "12px", alignItems: "flex-start" }}>
      <div
        style={{
          width: 24,
          height: 24,
          borderRadius: 999,
          background: "var(--brand-teal-soft)",
          color: "var(--brand-teal-dark)",
          display: "grid",
          placeItems: "center",
          fontSize: 13,
          fontWeight: 800,
          flex: "0 0 auto",
          marginTop: 2,
        }}
      >
        +
      </div>
      <div style={{ color: "#456173", lineHeight: 1.7, fontSize: 14 }}>{text}</div>
    </div>
  );
}

function MobileCollapsibleSection({ isNarrow, title, openLabel, closeLabel, children }) {
  const [isOpen, setIsOpen] = useState(!isNarrow);

  return (
    <details
      open={!isNarrow}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      style={{
        border: "1px solid var(--chrome-border)",
        borderRadius: "18px",
        background: "linear-gradient(180deg, #ffffff 0%, var(--surface-soft) 100%)",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          cursor: isNarrow ? "pointer" : "default",
          listStyle: "none",
          padding: "20px",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 20, fontWeight: 800, color: "var(--heading)", lineHeight: 1.2 }}>{title}</div>
          {isNarrow ? (
            <div style={{ fontSize: 11, fontWeight: 700, color: "#607282", whiteSpace: "nowrap" }}>
              {isOpen ? closeLabel : openLabel}
            </div>
          ) : null}
        </div>
      </summary>
      <div style={{ padding: "0 20px 20px", display: "grid", gap: "12px", color: "#456173", lineHeight: 1.7, fontSize: 14 }}>
        {children}
      </div>
    </details>
  );
}

function CategoryTile({ name, meaning, clues, why, isNarrow, labels }) {
  const [isOpen, setIsOpen] = useState(!isNarrow);

  return (
    <details
      open={!isNarrow}
      onToggle={(event) => setIsOpen(event.currentTarget.open)}
      style={{
        border: "1px solid var(--chrome-border)",
        borderRadius: "16px",
        background: "white",
        overflow: "hidden",
      }}
    >
      <summary
        style={{
          cursor: isNarrow ? "pointer" : "default",
          listStyle: "none",
          padding: "16px",
          background: isNarrow ? "var(--surface-soft)" : "white",
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 10 }}>
          <div style={{ fontSize: 17, fontWeight: 800, color: "var(--heading)", lineHeight: 1.25 }}>{name}</div>
          {isNarrow ? (
            <div style={{ fontSize: 11, fontWeight: 700, color: "#607282", whiteSpace: "nowrap" }}>
              {isOpen ? labels.closeHint : labels.openHint}
            </div>
          ) : null}
        </div>
      </summary>
      <div style={{ padding: "0 16px 16px", display: "grid", gap: "8px" }}>
        <div style={{ color: "#456173", lineHeight: 1.65, fontSize: 14 }}>{meaning}</div>
        <div style={{ color: "#315061", fontSize: 13, lineHeight: 1.6 }}>
          <strong>{labels.commonClues}:</strong> {clues}
        </div>
        <div style={{ color: "#315061", fontSize: 13, lineHeight: 1.6 }}>
          <strong>{labels.whyItHelps}:</strong> {why}
        </div>
      </div>
    </details>
  );
}

function DraftInner() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const [isNarrow, setIsNarrow] = useState(false);
  const [showMainMenu, setShowMainMenu] = useState(() => {
    if (typeof window === "undefined") return false;
    try {
      return localStorage.getItem("cna_access_granted") === "1";
    } catch {
      return false;
    }
  });

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
    let cancelled = false;
    void (async () => {
      let granted = false;
      try {
        granted = localStorage.getItem("cna_access_granted") === "1";
      } catch {}

      try {
        const payload = await fetchUserPreferences();
        const prefs = payload?.preferences;
        if (cancelled) return;
        setShowMainMenu(!!prefs?.accessGranted || granted);
      } catch {
        if (!cancelled) setShowMainMenu(granted);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const theme = useMemo(
    () => ({
      frameBorder: "var(--frame-border)",
      chromeBorder: "var(--chrome-border)",
      primaryBg: "var(--brand-teal)",
      primaryText: "white",
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
    width: isNarrow ? "100%" : "240px",
    fontWeight: 700,
  };

  const btnUtility = {
    padding: "9px 12px",
    fontSize: "13px",
    borderRadius: "10px",
    border: `1px solid ${theme.chromeBorder}`,
    background: "white",
    color: "var(--brand-teal-dark)",
    cursor: "pointer",
    fontWeight: 700,
  };

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  const categoryLabels = {
    openHint: t("Tap to open", "Toque para abrir", "Touchez pour ouvrir", "Peze pou louvri"),
    closeHint: t("Tap to close", "Toque para cerrar", "Touchez pour fermer", "Peze pou femen"),
    commonClues: t("Common clues", "Pistas comunes", "Indices frequents", "Siy komen"),
    whyItHelps: t("Why it helps", "Por que ayuda", "Pourquoi cela aide", "Poukisa sa ede"),
  };

  const categories = [
    {
      name: t("Change in Condition", "Cambio en la condicion", "Changement d'etat", "Chanjman nan kondisyon"),
      meaning: t(
        "Questions in this category ask whether something about the resident is changing from baseline and what that change means for your next step.",
        "Las preguntas de esta categoria preguntan si algo en el residente esta cambiando con respecto a su estado basal y que significa ese cambio para su siguiente paso.",
        "Les questions de cette categorie demandent si quelque chose change par rapport a l'etat habituel du resident et ce que cela signifie pour votre prochaine etape.",
        "Kesyon nan kategori sa a mande si gen yon bagay k ap chanje nan eta nòmal rezidan an epi sa chanjman sa a vle di pou pwochen etap ou."
      ),
      clues: t(
        "new weakness, confusion, sudden pain, breathing changes, fever, unusual behavior",
        "debilidad nueva, confusion, dolor repentino, cambios en la respiracion, fiebre, conducta inusual",
        "nouvelle faiblesse, confusion, douleur soudaine, changements respiratoires, fievre, comportement inhabituel",
        "nouvo febles, konfizyon, doulè toudenkou, chanjman nan respirasyon, lafyèv, konpòtman ki pa nòmal"
      ),
      why: t(
        "It helps you stop and recognize when the safest answer is to report or respond to a new problem instead of treating it like normal care.",
        "Le ayuda a detenerse y reconocer cuando la respuesta mas segura es reportar o responder a un problema nuevo en lugar de tratarlo como cuidado normal.",
        "Elle vous aide a vous arreter et a reconnaitre quand la reponse la plus sure est de signaler ou de reagir a un nouveau probleme au lieu de le traiter comme un soin normal.",
        "Li ede ou pran poz epi rekonèt lè repons ki pi an sekirite a se rapòte oswa reyaji ak yon nouvo pwoblèm olye ou trete l tankou swen nòmal."
      ),
    },
    {
      name: t("Scope of Practice & Reporting", "Limites del rol y reporte", "Limites du role et signalement", "Limit wòl ak rapò"),
      meaning: t(
        "Questions in this category ask what a CNA should do, what a CNA should not do, and when the correct action is to report instead of acting alone.",
        "Las preguntas de esta categoria preguntan que debe hacer un CNA, que no debe hacer y cuando la accion correcta es reportar en lugar de actuar por su cuenta.",
        "Les questions de cette categorie demandent ce qu'un CNA doit faire, ne doit pas faire, et quand l'action correcte est de signaler plutot que d'agir seul.",
        "Kesyon nan kategori sa a mande sa yon CNA dwe fè, sa yon CNA pa dwe fè, ak ki lè aksyon ki kòrèk la se rapòte olye ou aji poukont ou."
      ),
      clues: t(
        "diagnosis, medication, treatment decisions, calling the nurse, reporting findings",
        "diagnostico, medicamentos, decisiones de tratamiento, llamar a la enfermera, reportar hallazgos",
        "diagnostic, medicaments, decisions de traitement, appeler l'infirmiere, signaler des observations",
        "dyagnostik, medikaman, desizyon tretman, rele enfimyè a, rapòte sa ou remake"
      ),
      why: t(
        "It keeps you anchored in the CNA role and protects you from choosing answers that go beyond observation, assistance, or reporting.",
        "Le mantiene enfocado en el rol del CNA y le protege de elegir respuestas que van mas alla de observar, ayudar o reportar.",
        "Elle vous maintient dans le role du CNA et vous protege contre des reponses qui depassent l'observation, l'aide ou le signalement.",
        "Li kenbe ou byen plase nan wòl CNA a epi li pwoteje ou kont repons ki ale pi lwen pase obsèvasyon, asistans, oswa rapò."
      ),
    },
    {
      name: t("Observation & Safety", "Observacion y seguridad", "Observation et securite", "Obsèvasyon ak sekirite"),
      meaning: t(
        "Questions in this category ask what important clue or risk you should notice before something unsafe happens.",
        "Las preguntas de esta categoria preguntan que pista o riesgo importante debe notar antes de que ocurra algo inseguro.",
        "Les questions de cette categorie demandent quel indice ou risque important vous devez remarquer avant qu'une situation dangereuse n'arrive.",
        "Kesyon nan kategori sa a mande ki siy oswa risk enpòtan ou dwe remake anvan yon sitiyasyon danjere rive."
      ),
      clues: t(
        "fall risk, fatigue, clutter, weak gait, alarm not in place, unsafe setup",
        "riesgo de caida, fatiga, desorden, marcha debil, alarma sin colocar, entorno inseguro",
        "risque de chute, fatigue, encombrement, demarche faible, alarme absente, installation peu sure",
        "risk tonbe, fatig, dezòd, mache fèb, alam pa an plas, anviwònman ki pa an sekirite"
      ),
      why: t(
        "It helps you see the warning sign before harm happens and choose the answer that protects the resident sooner.",
        "Le ayuda a ver la senal de alerta antes de que ocurra el dano y elegir la respuesta que protege al residente mas pronto.",
        "Elle vous aide a voir le signe d'alerte avant que le danger ne survienne et a choisir la reponse qui protege le resident plus tot.",
        "Li ede ou wè siy avètisman an anvan domaj rive epi chwazi repons ki pwoteje rezidan an pi vit."
      ),
    },
    {
      name: t("Infection Control", "Control de infecciones", "Controle des infections", "Kontwòl enfeksyon"),
      meaning: t(
        "Questions in this category ask how to stop germs from spreading during care.",
        "Las preguntas de esta categoria preguntan como evitar que los germenes se propaguen durante el cuidado.",
        "Les questions de cette categorie demandent comment empecher les germes de se propager pendant les soins.",
        "Kesyon nan kategori sa a mande kijan pou anpeche mikwòb gaye pandan swen an."
      ),
      clues: t(
        "hand hygiene, gloves, PPE, clean vs dirty tasks, isolation, body fluids",
        "higiene de manos, guantes, PPE, tareas limpias y sucias, aislamiento, fluidos corporales",
        "hygiene des mains, gants, EPI, taches propres et sales, isolement, liquides corporels",
        "ijyèn men, gan, PPE, travay pwòp ak sal, izolasyon, likid kò"
      ),
      why: t(
        "It trains you to protect the resident, yourself, and other residents by choosing the cleanest and safest order of care.",
        "Le entrena para proteger al residente, a usted mismo y a otros residentes al elegir el orden de cuidado mas limpio y mas seguro.",
        "Elle vous entraine a proteger le resident, vous-meme et les autres residents en choisissant l'ordre de soins le plus propre et le plus sur.",
        "Li antrene ou pou pwoteje rezidan an, tèt ou, ak lòt rezidan yo lè ou chwazi lòd swen ki pi pwòp ak pi an sekirite."
      ),
    },
    {
      name: t("Personal Care & Comfort", "Cuidado personal y comodidad", "Soins personnels et confort", "Swen pèsonèl ak konfò"),
      meaning: t(
        "Questions in this category ask how to help with everyday care in a way that is safe, respectful, and comfortable for the resident.",
        "Las preguntas de esta categoria preguntan como ayudar con el cuidado diario de una manera segura, respetuosa y comoda para el residente.",
        "Les questions de cette categorie demandent comment aider aux soins quotidiens d'une facon sure, respectueuse et confortable pour le resident.",
        "Kesyon nan kategori sa a mande kijan pou ede ak swen chak jou yon fason ki an sekirite, respekte rezidan an, epi bay konfò."
      ),
      clues: t(
        "bathing, dressing, grooming, toileting, feeding, pain, comfort, preferences",
        "bano, vestido, aseo, toileteo, alimentacion, dolor, comodidad, preferencias",
        "bain, habillage, toilette, elimination, alimentation, douleur, confort, preferences",
        "benyen, abiye, swen kò, twalèt, manje, doulè, konfò, preferans"
      ),
      why: t(
        "It helps you choose answers that support dignity and comfort instead of rushing through the task.",
        "Le ayuda a elegir respuestas que apoyan la dignidad y la comodidad en lugar de apresurarse en la tarea.",
        "Elle vous aide a choisir des reponses qui soutiennent la dignite et le confort au lieu de se precipiter dans la tache.",
        "Li ede ou chwazi repons ki soutni diyite ak konfò olye ou prese fini travay la."
      ),
    },
    {
      name: t("Mobility & Positioning", "Movilidad y posicionamiento", "Mobilite et positionnement", "Mobilite ak pozisyonman"),
      meaning: t(
        "Questions in this category ask how to move, transfer, or position the resident safely.",
        "Las preguntas de esta categoria preguntan como mover, transferir o posicionar al residente de manera segura.",
        "Les questions de cette categorie demandent comment deplacer, transferer ou positionner le resident en toute securite.",
        "Kesyon nan kategori sa a mande kijan pou deplase, transfere, oswa pozisyone rezidan an san danje."
      ),
      clues: t(
        "gait belt, transfer, wheelchair, turning, lifting, alignment, body mechanics",
        "cinturon de marcha, transferencia, silla de ruedas, giro, levantamiento, alineacion, mecanica corporal",
        "ceinture de marche, transfert, fauteuil roulant, retournement, levage, alignement, mecanique du corps",
        "senti mache, transfè, chèz woulant, vire, leve, aliyman, mouvman kò"
      ),
      why: t(
        "It helps you slow down and choose the answer that prevents falls, strain, and unsafe movement.",
        "Le ayuda a ir mas despacio y elegir la respuesta que previene caidas, esfuerzo fisico y movimientos inseguros.",
        "Elle vous aide a ralentir et a choisir la reponse qui previent les chutes, les efforts et les mouvements dangereux.",
        "Li ede ou ralanti epi chwazi repons ki anpeche tonbe, fòs twòp, ak mouvman ki pa an sekirite."
      ),
    },
    {
      name: t("Dignity & Resident Rights", "Dignidad y derechos del residente", "Dignite et droits du resident", "Diyite ak dwa rezidan an"),
      meaning: t(
        "Questions in this category ask how to protect the resident's privacy, choice, respect, and independence.",
        "Las preguntas de esta categoria preguntan como proteger la privacidad, la eleccion, el respeto y la independencia del residente.",
        "Les questions de cette categorie demandent comment proteger l'intimite, le choix, le respect et l'independance du resident.",
        "Kesyon nan kategori sa a mande kijan pou pwoteje vi prive, chwa, respè, ak endepandans rezidan an."
      ),
      clues: t(
        "privacy, refusal, choice, consent, independence, embarrassment, respectful language",
        "privacidad, rechazo, eleccion, consentimiento, independencia, vergüenza, lenguaje respetuoso",
        "intimite, refus, choix, consentement, independance, gene, langage respectueux",
        "vi prive, refi, chwa, konsantman, endepandans, wont, langaj respè"
      ),
      why: t(
        "It helps you choose answers that preserve the personhood of the resident, not just finish the task.",
        "Le ayuda a elegir respuestas que preservan la dignidad de la persona residente, no solo terminar la tarea.",
        "Elle vous aide a choisir des reponses qui preservent la dignite de la personne residente, pas seulement a finir la tache.",
        "Li ede ou chwazi repons ki pwoteje diyite moun rezidan an, pa sèlman fini travay la."
      ),
    },
    {
      name: t("Communication & Emotional Support", "Comunicacion y apoyo emocional", "Communication et soutien emotionnel", "Kominikasyon ak sipò emosyonèl"),
      meaning: t(
        "Questions in this category ask how to respond with the right words, tone, and emotional support.",
        "Las preguntas de esta categoria preguntan como responder con las palabras, el tono y el apoyo emocional adecuados.",
        "Les questions de cette categorie demandent comment repondre avec les bons mots, le bon ton et le bon soutien emotionnel.",
        "Kesyon nan kategori sa a mande kijan pou reponn ak bon mo yo, bon ton an, ak bon sipò emosyonèl la."
      ),
      clues: t(
        "anxiety, fear, confusion, upset family, reassurance, validation, calm explanation",
        "ansiedad, miedo, confusion, familia angustiada, tranquilidad, validacion, explicacion calmada",
        "anxiete, peur, confusion, famille bouleversee, reassurance, validation, explication calme",
        "enkyetid, laperèz, konfizyon, fanmi boulvèse, rasirans, validasyon, eksplikasyon kalm"
      ),
      why: t(
        "It helps you pick the response that calms, respects, and supports instead of correcting too sharply or ignoring emotion.",
        "Le ayuda a elegir la respuesta que calma, respeta y apoya en lugar de corregir con dureza o ignorar la emocion.",
        "Elle vous aide a choisir la reponse qui apaise, respecte et soutient au lieu de corriger trop durement ou d'ignorer l'emotion.",
        "Li ede ou chwazi repons ki kalme, respekte, epi soutni olye ou korije twò sevè oswa inyore emosyon an."
      ),
    },
    {
      name: t("Environment & Safety", "Entorno y seguridad", "Environnement et securite", "Anviwònman ak sekirite"),
      meaning: t(
        "Questions in this category ask whether the room, equipment, or setup is safe enough before care continues.",
        "Las preguntas de esta categoria preguntan si la habitacion, el equipo o la preparacion son lo suficientemente seguros antes de continuar con el cuidado.",
        "Les questions de cette categorie demandent si la chambre, l'equipement ou l'installation sont suffisamment surs avant de poursuivre les soins.",
        "Kesyon nan kategori sa a mande si chanm nan, ekipman an, oswa fason tout bagay ranje a ase an sekirite anvan swen an kontinye."
      ),
      clues: t(
        "bed height, call light, spills, clutter, locked wheels, side rails, equipment placement",
        "altura de la cama, timbre, derrames, desorden, ruedas bloqueadas, barandas, ubicacion del equipo",
        "hauteur du lit, sonnette, deversements, encombrement, roues bloquees, barrieres, placement du materiel",
        "wotè kabann, sonnèt, likid atè, dezòd, wou fèmen, baro kabann, kote ekipman an ye"
      ),
      why: t(
        "It reminds you that safe care starts with a safe setup, not only with what you do after the task begins.",
        "Le recuerda que el cuidado seguro empieza con una preparacion segura, no solo con lo que hace despues de comenzar la tarea.",
        "Elle vous rappelle que des soins surs commencent par une installation sure, pas seulement par ce que vous faites apres le debut de la tache.",
        "Li fè ou sonje swen ki an sekirite kòmanse ak yon bon preparasyon, pa sèlman ak sa ou fè apre travay la kòmanse."
      ),
    },
  ];

  return (
    <Frame
      title={t(
        "CATEGORY EXPLANATION",
        "EXPLICACION DE CATEGORIAS",
        "EXPLICATION DES CATEGORIES",
        "EKSPLIKASYON KATEGORI YO"
      )}
      theme={theme}
      headerAction={
        <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", justifyContent: "flex-end" }}>
          {(showMainMenu
            ? [
                {
                  key: "main",
                  label: t(
                    "Continue to Main Menu",
                    "Continuar al menu principal",
                    "Continuer vers le menu principal",
                    "Kontinye nan meni prensipal la"
                  ),
                  onClick: () => router.push(`/start?lang=${lang}`),
                },
              ]
            : [])
            .filter(Boolean)
            .map((item) => (
              <button key={item.key} style={btnUtility} onClick={item.onClick}>
                {item.label}
              </button>
            ))}
        </div>
      }
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px", flexWrap: "wrap" }}>
          <button
            style={btnPrimary}
            onClick={async () => {
              try {
                await updateUserPreferences({
                  preferredLanguage: lang,
                  hasSeenCategoryIntro: true,
                });
              } catch {
                // Continue even if server write fails.
              }
              router.push(`/start?lang=${lang}`);
            }}
          >
            {t(
              "Continue to Main Menu",
              "Continuar al menu principal",
              "Continuer vers le menu principal",
              "Kontinye nan meni prensipal la"
            )}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "840px", margin: "0 auto", display: "grid", gap: "18px" }}>
        <SectionCard
          title={t(
            "What Are Categories and Why Do They Matter?",
            "Que son las categorias y por que importan",
            "Que sont les categories et pourquoi sont-elles importantes",
            "Kisa kategori yo ye epi poukisa yo enpotan"
          )}
          tint="linear-gradient(180deg, #ffffff 0%, #f3fbfd 100%)"
          border="var(--frame-border)"
        >
          <div>
            {t(
              "This platform tests your chapter knowledge, but it also helps you strengthen the decision-making skills behind CNA questions.",
              "Esta plataforma evalua su conocimiento por capitulos, pero tambien le ayuda a fortalecer las habilidades de toma de decisiones que hay detras de las preguntas de CNA.",
              "Cette plateforme evalue vos connaissances par chapitre, mais elle vous aide aussi a renforcer les competences de prise de decision qui se cachent derriere les questions CNA.",
              "Platfom sa a teste konesans ou pa chapit, men li ede ou ranfose kapasite pou pran desizyon ki deye kestyon CNA yo tou."
            )}
          </div>
          <div>
            {t(
              "Chapters tell you what topic the question is about. Categories tell you what kind of CNA decision the question is testing.",
              "Los capitulos le dicen de que tema trata la pregunta. Las categorias le dicen que tipo de decision de CNA esta evaluando la pregunta.",
              "Les chapitres vous disent de quel sujet parle la question. Les categories vous disent quel type de decision CNA la question est en train d'evaluer.",
              "Chapit yo di ou ki sijè kestyon an ap pale. Kategori yo di ou ki kalite desizyon CNA kestyon an ap teste."
            )}
          </div>
          <div>
            {t(
              "They exist because many CNA questions are not hard only because of the content. They are hard because they ask you to notice the right clue, understand the right risk, and choose the safest next step before acting.",
              "Existen porque muchas preguntas de CNA no son dificiles solo por el contenido. Son dificiles porque le piden notar la pista correcta, entender el riesgo correcto y elegir el siguiente paso mas seguro antes de actuar.",
              "Elles existent parce que de nombreuses questions CNA ne sont pas difficiles seulement a cause du contenu. Elles sont difficiles parce qu'elles vous demandent de remarquer le bon indice, de comprendre le bon risque et de choisir l'etape suivante la plus sure avant d'agir.",
              "Yo egziste paske anpil kestyon CNA pa difisil sèlman poutèt kontni an. Yo difisil paske yo mande ou remake bon siy la, konprann bon risk la, epi chwazi pwochen etap ki pi an sekirite anvan ou aji."
            )}
          </div>
        </SectionCard>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
            gap: "16px",
          }}
        >
          <SectionCard
            title={t("Chapters", "Capitulos", "Chapitres", "Chapit")}
            tint="white"
          >
            <MiniBullet
              text={t(
                "Help you study by official topic area.",
                "Le ayudan a estudiar por area oficial de contenido.",
                "Vous aident a etudier par domaine officiel.",
                "Yo ede ou etidye pa sijè ofisyèl yo."
              )}
            />
            <MiniBullet
              text={t(
                "Match the CNA blueprint and your book structure.",
                "Coinciden con la estructura del examen CNA y de su libro.",
                "Correspondent a la structure de l'examen CNA et de votre livre.",
                "Yo mache ak plan egzamen CNA a ak estrikti liv ou."
              )}
            />
            <MiniBullet
              text={t(
                "Best when you want to review a content area.",
                "Son mejores cuando quiere repasar un area de contenido.",
                "Sont plus utiles quand vous voulez revoir un domaine de contenu.",
                "Yo pi bon lè ou vle revize yon zòn kontni."
              )}
            />
          </SectionCard>

          <SectionCard
            title={t("Categories", "Categorias", "Categories", "Kategori")}
            tint="white"
          >
            <MiniBullet
              text={t(
                "Help you study the kind of decision the question is testing.",
                "Le ayudan a estudiar el tipo de decision que la pregunta esta evaluando.",
                "Vous aident a etudier le type de decision que la question evalue.",
                "Yo ede ou etidye kalite desizyon kestyon an ap teste."
              )}
            />
            <MiniBullet
              text={t(
                "Show patterns in the mistakes you make.",
                "Muestran patrones en los errores que usted comete.",
                "Montrent les tendances dans les erreurs que vous faites.",
                "Yo montre modèl nan erè ou fè yo."
              )}
            />
            <MiniBullet
              text={t(
              "Best when you want to improve CNA judgment before acting.",
              "Son mejores cuando quiere mejorar el juicio clinico de CNA antes de actuar.",
              "Sont plus utiles quand vous voulez ameliorer votre jugement CNA avant d'agir.",
                "Yo pi bon lè ou vle amelyore jijman CNA anvan ou aji."
              )}
            />
          </SectionCard>
        </div>

        <SectionCard
          title={t(
            "Why they matter",
            "Por que importan",
            "Pourquoi elles sont importantes",
            "Poukisa yo enpotan"
          )}
        >
          <MiniBullet
            text={t(
              "They help you notice important clues.",
              "Le ayudan a notar pistas importantes.",
              "Elles vous aident a remarquer des indices importants.",
              "Yo ede ou remake siy enpotan yo."
            )}
          />
          <MiniBullet
            text={t(
              "They help you use safe logic instead of only memorizing answers.",
              "Le ayudan a usar una logica segura en lugar de solo memorizar respuestas.",
              "Elles vous aident a utiliser une logique sure au lieu de seulement memoriser les reponses.",
              "Yo ede ou itilize yon lojik ki an sekirite olye ou selman memorize repons yo."
            )}
          />
          <MiniBullet
            text={t(
              "They help you stay within the nurse aide role.",
              "Le ayudan a mantenerse dentro del rol del auxiliar.",
              "Elles vous aident a rester dans le role de l'aide-soignant.",
              "Yo ede ou rete nan wol CNA a."
            )}
          />
          <MiniBullet
            text={t(
              "They help you choose safer answers with more confidence.",
              "Le ayudan a elegir respuestas mas seguras y con mas confianza.",
              "Elles vous aident a choisir des reponses plus sures avec plus d'assurance.",
              "Yo ede ou chwazi repons ki pi an sekirite ak plis konfyans."
            )}
          />
        </SectionCard>

        <SectionCard
          title={t(
            "How categories help in this platform",
            "Como ayudan las categorias en esta plataforma",
            "Comment les categories vous aident dans cette plateforme",
            "Kijan kategori yo ede nan platfom sa a"
          )}
        >
          <MiniBullet
            text={t(
              "In Practice: choose a category when you want to train one kind of CNA decision at a time.",
              "En Practica: elija una categoria cuando quiera practicar un tipo de decision de CNA a la vez.",
              "En pratique : choisissez une categorie lorsque vous voulez entrainer un type de decision CNA a la fois.",
              "Nan Pratik: chwazi yon kategori lè ou vle antrene yon sèl kalite desizyon CNA a la fwa."
            )}
          />
          <MiniBullet
            text={t(
              "In Analytics: categories show the kinds of decisions you missed most often, not just the chapters you should review.",
              "En Analitica: las categorias muestran los tipos de decisiones que usted falla con mas frecuencia, no solo los capitulos que debe repasar.",
              "Dans l'analyse : les categories montrent les types de decisions que vous manquez le plus souvent, pas seulement les chapitres a revoir.",
              "Nan Analiz: kategori yo montre kalite desizyon ou te rate pi souvan yo, pa sèlman chapit ou dwe revize yo."
            )}
          />
          <MiniBullet
            text={t(
              "In Remediation: categories guide the next targeted set of questions so you can strengthen the decision pattern behind the mistake.",
              "En Remediacion: las categorias guian el siguiente grupo de preguntas dirigidas para fortalecer el patron de decision que esta detras del error.",
              "En remediation : les categories guident le prochain groupe cible de questions afin de renforcer le schema de decision qui se trouve derriere l'erreur.",
              "Nan Remedyasyon: kategori yo gide pwochen gwoup kestyon yo pou ranfòse modèl desizyon ki dèyè erè a."
            )}
          />
        </SectionCard>

        <SectionCard
          title={t(
            "How to use them",
            "Como usarlas",
            "Comment les utiliser",
            "Kijan pou itilize yo"
          )}
        >
          <MiniBullet
            text={t(
              "Look for the main clue in the question.",
              "Busque la pista principal en la pregunta.",
              "Cherchez l'indice principal dans la question.",
              "Chache siy prensipal la nan kestyon an."
            )}
          />
          <MiniBullet
            text={t(
              "Ask what kind of problem or decision the question is testing.",
              "Preguntese que tipo de problema o decision esta evaluando la pregunta.",
              "Demandez-vous quel type de probleme ou de decision la question evalue.",
              "Mande tet ou ki kalite pwoblem oswa desizyon kestyon an ap teste."
            )}
          />
          <MiniBullet
            text={t(
              "Identify which category best fits the question.",
              "Identifique que categoria se ajusta mejor a la pregunta.",
              "Identifiez quelle categorie correspond le mieux a la question.",
              "Idantifye ki kategori ki pi byen mache ak kestyon an."
            )}
          />
          <MiniBullet
            text={t(
              "Think about the safest next step.",
              "Piense en el siguiente paso mas seguro.",
              "Pensez a l'etape suivante la plus sure.",
              "Reflechi sou pwochen etap ki pi an sekirite a."
            )}
          />
          <MiniBullet
            text={t(
              "Ask whether you should do it, report it, or watch closely.",
              "Preguntese si debe hacerlo, reportarlo o vigilarlo de cerca.",
              "Demandez-vous si vous devez le faire, le signaler ou l'observer de pres.",
              "Mande tet ou si ou dwe fe li, rapote li, oswa siveye li byen pre."
            )}
          />
          <MiniBullet
            text={t(
              "Choose the answer that best protects the resident.",
              "Elija la respuesta que mejor protege al residente.",
              "Choisissez la reponse qui protege le mieux le resident.",
              "Chwazi repons ki pi byen pwoteje rezidan an."
            )}
          />
        </SectionCard>

        <MobileCollapsibleSection
          key={`examples-${isNarrow ? "narrow" : "wide"}`}
          isNarrow={isNarrow}
          title={t(
            "A couple of examples",
            "Un par de ejemplos",
            "Quelques exemples",
            "Kek egzanp"
          )}
          openLabel={t("Tap to open", "Toque para abrir", "Touchez pour ouvrir", "Peze pou louvri")}
          closeLabel={t("Tap to close", "Toque para cerrar", "Touchez pour fermer", "Peze pou femen")}
        >
          <ExampleBullet
            text={t(
              "A question about a resident who suddenly looks weaker could belong to Chapter 4 because it involves changes in health. But the category might be Change in Condition because the key skill is recognizing that something is different from baseline and deciding what to do next.",
              "Una pregunta sobre un residente que de repente parece mas debil puede pertenecer al Capitulo 4 porque involucra cambios de salud. Pero la categoria puede ser Cambio en la condicion porque la habilidad clave es reconocer que algo es diferente del estado basal y decidir que hacer despues.",
              "Une question sur un resident qui semble soudain plus faible peut appartenir au Chapitre 4 parce qu'elle concerne un changement de sante. Mais la categorie peut etre Changement d'etat parce que la competence cle est de reconnaitre que quelque chose est different de l'etat habituel et de decider quoi faire ensuite.",
              "Yon kestyon sou yon rezidan ki sanble vin pi fèb toudenkou ka fè pati Chapit 4 paske li enplike chanjman nan sante. Men kategori a ka Chanjman nan kondisyon paske kapasite kle a se rekonèt gen yon bagay ki diferan ak nòmal epi deside sa pou fè apre."
            )}
          />
          <ExampleBullet
            text={t(
              "Another question might be about helping a resident get out of bed when the floor is wet and the call light is out of reach. The chapter could still be about basic care or safety. But the category may be Environment & Safety because the real decision is whether the setup is safe before you continue.",
              "Otra pregunta puede tratar sobre ayudar a un residente a salir de la cama cuando el piso esta mojado y el timbre esta fuera de alcance. El capitulo todavia puede ser sobre cuidado basico o seguridad. Pero la categoria puede ser Entorno y seguridad porque la decision real es si el entorno es seguro antes de continuar.",
              "Une autre question peut porter sur l'aide a un resident pour sortir du lit alors que le sol est mouille et que la sonnette est hors de portee. Le chapitre peut toujours concerner les soins de base ou la securite. Mais la categorie peut etre Environnement et securite parce que la vraie decision est de savoir si l'installation est sure avant de continuer.",
              "Yon lot kestyon ka pale sou ede yon rezidan soti nan kabann pandan planche a mouye epi sonnèt la pa nan men li. Chapit la ka toujou konsène swen debaz oswa sekirite. Men kategori a ka Anviwònman ak sekirite paske vrè desizyon an se konnen si anviwònman an an sekirite anvan ou kontinye."
            )}
          />
        </MobileCollapsibleSection>

        <SectionCard
          title={t("The 9 categories", "Las 9 categorias", "Les 9 categories", "9 kategori yo")}
        >
          <div
            style={{
              display: "grid",
              gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr",
              gap: "14px",
            }}
          >
            {categories.map((category) => (
              <CategoryTile
                key={`${category.name}-${isNarrow ? "narrow" : "wide"}`}
                name={category.name}
                meaning={category.meaning}
                clues={category.clues}
                why={category.why}
                isNarrow={isNarrow}
                labels={categoryLabels}
              />
            ))}
          </div>
        </SectionCard>
      </div>
    </Frame>
  );
}

export default function CategoryFoundationDraftPage() {
  return (
    <Suspense fallback={<div style={{ padding: 20 }}>Loading...</div>}>
      <DraftInner />
    </Suspense>
  );
}
