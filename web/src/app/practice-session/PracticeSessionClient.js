"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

import { buildPracticeSession } from "../lib/practiceSessionBuilder";
import { loadPracticeSession, savePracticeSession } from "../lib/practiceSessionStorage";

function getDisplayBlocks(question, lang) {
  const blocks = [];
  if (!question?.variants) return blocks;
  if (lang === "en") blocks.push({ label: "", v: question.variants.en });
  if (lang === "es") blocks.push({ label: "", v: question.variants.es });
  if (lang === "fr") {
    blocks.push({ label: "EN", v: question.variants.en });
    blocks.push({ label: "FR", v: question.variants.fr });
  }
  if (lang === "ht") {
    blocks.push({ label: "EN", v: question.variants.en });
    blocks.push({ label: "HT", v: question.variants.ht });
  }
  if (!blocks.length) blocks.push({ label: "EN", v: question.variants.en });
  return blocks;
}

function localizeChapter(lang, chapter) {
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
  }[lang]?.[chapter] || `Chapter ${chapter}`;
}

function localizeCategory(lang, category) {
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
  }[lang]?.[category] || category;
}

export default function PracticeSessionClient({ bankById }) {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";
  const sessionId = sp.get("session_id");
  const mode = sp.get("mode") || "mixed";
  const count = Number(sp.get("count") || 10);
  const chapter = sp.get("chapter");
  const category = sp.get("category");
  const [session, setSession] = useState(null);
  const [view, setView] = useState(sessionId ? "session" : "boot");
  const [isNarrow, setIsNarrow] = useState(false);
  const [error, setError] = useState("");

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  const btnPrimary = {
    padding: "10px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: "1px solid var(--brand-teal)",
    background: "var(--brand-teal)",
    color: "#fff",
    cursor: "pointer",
  };

  const btnSecondary = {
    padding: "9px 12px",
    fontSize: "14px",
    borderRadius: "10px",
    border: "1px solid var(--button-border)",
    background: "var(--brand-teal-soft)",
    color: "var(--brand-teal-dark)",
    cursor: "pointer",
  };

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
    let granted = false;
    try {
      granted = localStorage.getItem("cna_access_granted") === "1";
    } catch {}
    if (!granted) {
      router.replace(`/access?lang=${lang}`);
      return;
    }

    try {
      if (sessionId) {
        const loaded = loadPracticeSession(sessionId);
        if (!loaded) {
          router.replace(`/practice?lang=${lang}`);
          return;
        }
        queueMicrotask(() => {
          setSession(loaded);
          setView(loaded.status === "completed" ? "complete" : "session");
        });
        return;
      }

      const built = buildPracticeSession({
        mode,
        questionCount: count,
        selectedChapter: chapter ? Number(chapter) : null,
        selectedCategory: category || null,
        questionBankSnapshot: Object.values(bankById || {}),
      });
      queueMicrotask(() => {
        setSession(built);
        setView("session");
      });
      router.replace(`/practice-session?lang=${lang}&session_id=${built.session_id}`);
    } catch (e) {
      queueMicrotask(() => {
        setError(String(e?.message || e));
      });
    }
  }, [bankById, category, chapter, count, lang, mode, router, sessionId]);

  function persist(next) {
    setSession(next);
    savePracticeSession(next);
  }

  function handleSelect(answerId) {
    if (!session) return;
    const questionId = session.questionIds?.[session.currentIndex];
    const question = session.questionsById?.[questionId];
    if (!question) return;
    persist({
      ...session,
      answers: {
        ...(session.answers || {}),
        [questionId]: {
          selected_answer_id: answerId,
          submitted: true,
          is_correct: String(question.correct_answer) === String(answerId),
        },
      },
    });
  }

  function goPrev() {
    if (!session) return;
    persist({ ...session, currentIndex: Math.max(0, (session.currentIndex || 0) - 1) });
  }

  function goNext() {
    if (!session) return;
    const max = (session.questionIds || []).length - 1;
    persist({ ...session, currentIndex: Math.min(max, (session.currentIndex || 0) + 1) });
  }

  function finish() {
    if (!session) return;
    const entries = Object.values(session.answers || {});
    persist({
      ...session,
      status: "completed",
      completed_at: Date.now(),
      submitted_total: entries.length,
      submitted_correct: entries.filter((entry) => entry?.is_correct).length,
    });
    setView("complete");
  }

  function requestExit() {
    setView("confirm_exit");
  }

  function exitToHub() {
    router.push(`/practice?lang=${lang}`);
  }

  if (error) {
    return <div style={{ maxWidth: 900, margin: "20px auto", padding: 20 }}>{error}</div>;
  }

  if (!session) {
    return <div style={{ maxWidth: 900, margin: "20px auto", padding: 20 }}>{t("Loading...", "Cargando...", "Chargement...", "Ap chaje...")}</div>;
  }

  const practicedLabel =
    session.mode === "chapter" && session.selectedChapter
      ? localizeChapter(lang, session.selectedChapter)
      : session.mode === "category" && session.selectedCategory
        ? localizeCategory(lang, session.selectedCategory)
        : t("Mixed Practice", "Practica mixta", "Pratique mixte", "Pratik melanje");

  const practicedTypeLabel =
    session.mode === "chapter"
      ? t("Chapter focus", "Enfoque por capitulo", "Focus chapitre", "Fokus sou chapit")
      : session.mode === "category"
        ? t("Category focus", "Enfoque por categoria", "Focus categorie", "Fokus sou kategori")
        : t("Practice mode", "Modo de practica", "Mode de pratique", "Mod pratik");

  const scoreTotal = session.submitted_total || session.totalQuestions || 0;
  const scoreCorrect = session.submitted_correct || 0;
  const scoreRatio = scoreTotal > 0 ? scoreCorrect / scoreTotal : 0;

  const performanceMessage =
    scoreRatio >= 0.8
      ? t(
          "Nice work. You are building strong consistency in this area.",
          "Buen trabajo. Esta construyendo una buena consistencia en esta area.",
          "Beau travail. Vous developpez une bonne regularite dans ce domaine.",
          "Bon travay. Ou ap devlope yon bon nivo regilarite nan zon sa a."
        )
      : scoreRatio >= 0.6
        ? t(
            "You are making progress. A little more practice in this area can help reinforce the pattern.",
            "Esta avanzando. Un poco mas de practica en esta area puede ayudar a reforzar el patron.",
            "Vous progressez. Un peu plus de pratique dans ce domaine peut aider a renforcer le raisonnement.",
            "Ou ap avanse. Yon ti kras plis pratik nan zon sa a ka ede ranfose fason pou reflechi a."
          )
        : t(
            "This area may benefit from more repetition before you move on.",
            "Esta area puede beneficiarse de mas repeticion antes de continuar.",
            "Ce domaine pourrait beneficier d'un peu plus de repetition avant de passer a la suite.",
            "Zon sa a ka bezwen plis repetisyon anvan ou pase pi lwen."
          );

  const nextStepMessage =
    session.mode === "mixed"
      ? t(
          "You can start another mixed set or return to the Practice Hub and choose a chapter or category for more focused review.",
          "Puede iniciar otro set mixto o regresar al Centro de Practica y elegir un capitulo o una categoria para un repaso mas enfocado.",
          "Vous pouvez commencer une autre serie mixte ou retourner au hub de pratique pour choisir un chapitre ou une categorie pour un travail plus cible.",
          "Ou ka komanse yon lot seri melanje oswa retounen nan Hub Pratik la pou chwazi yon chapit oswa yon kategori pou yon revizyon ki pi vize."
        )
      : t(
          "You can practice this same area again or return to the Practice Hub and choose a different focus.",
          "Puede practicar esta misma area otra vez o regresar al Centro de Practica y elegir un enfoque diferente.",
          "Vous pouvez pratiquer encore ce meme domaine ou retourner au hub de pratique pour choisir un autre focus.",
          "Ou ka pratike menm zon sa a anko oswa retounen nan Hub Pratik la pou chwazi yon lot fokus."
        );

  function buildPracticeAgainHref() {
    const next = new URLSearchParams({ lang });
    next.set("mode", session.mode || "mixed");
    next.set("count", String(session.totalQuestions || 10));
    if (session.mode === "chapter" && session.selectedChapter) next.set("chapter", String(session.selectedChapter));
    if (session.mode === "category" && session.selectedCategory) next.set("category", session.selectedCategory);
    return `/practice-session?${next.toString()}`;
  }

  if (view === "complete") {
    return (
      <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
        <div style={{ border: "2px solid var(--frame-border)", borderRadius: 16, overflow: "hidden", background: "white", boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--chrome-border)", background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)", fontSize: 28, fontWeight: 800, color: "var(--heading)" }}>
            {t("Practice complete", "Practica completada", "Pratique terminee", "Pratik la fini")}
          </div>
          <div style={{ padding: 20, display: "grid", gap: 14 }}>
            <div>{t("You finished this guided practice set.", "Termino este set de practica guiada.", "Vous avez termine cette serie de pratique guidee.", "Ou fini set pratik gide sa a.")}</div>
            <div style={{ display: "grid", gap: 14, gridTemplateColumns: isNarrow ? "1fr" : "1fr 1fr" }}>
              <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 14, background: "var(--surface-soft)", padding: 16, display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
                  {practicedTypeLabel}
                </div>
                <div style={{ fontSize: 20, fontWeight: 800, color: "var(--heading)" }}>{practicedLabel}</div>
                <div style={{ color: "var(--muted)" }}>
                  {t("Questions completed", "Preguntas completadas", "Questions completees", "Kesyon fini")}: {scoreTotal}
                </div>
              </div>
              <div style={{ border: "1px solid #b7d7c1", borderRadius: 14, background: "#f3fbf5", padding: 16, display: "grid", gap: 6 }}>
                <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "#2f6b43" }}>
                  {t("Score", "Puntuacion", "Score", "Not")}
                </div>
                <div style={{ fontSize: 28, fontWeight: 800, color: "#245b38" }}>
                  {scoreCorrect} / {scoreTotal}
                </div>
                <div style={{ color: "#2f6b43" }}>
                  {performanceMessage}
                </div>
              </div>
            </div>
            <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 14, background: "#fff", padding: 16, display: "grid", gap: 8 }}>
              <div style={{ fontSize: 12, fontWeight: 700, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--muted)" }}>
                {t("Next step", "Siguiente paso", "Etape suivante", "Pwochen etap")}
              </div>
              <div style={{ color: "var(--body)" }}>{nextStepMessage}</div>
            </div>
          </div>
          <div style={{ padding: "14px 20px", background: "var(--surface-soft)", borderTop: "1px solid var(--chrome-border)", display: "flex", gap: 12, justifyContent: "flex-end", flexDirection: isNarrow ? "column" : "row" }}>
            <button style={{ ...btnSecondary, width: isNarrow ? "100%" : 220 }} onClick={() => router.push(`/practice?lang=${lang}`)}>{t("Back to Practice Hub", "Volver al Centro de Practica", "Retour au hub de pratique", "Retounen nan Hub Pratik la")}</button>
            <button style={{ ...btnPrimary, width: isNarrow ? "100%" : 220 }} onClick={() => router.push(buildPracticeAgainHref())}>{t("Practice Again", "Practicar otra vez", "Pratiquer encore", "Pratike anko")}</button>
          </div>
        </div>
      </div>
    );
  }

  if (view === "confirm_exit" && session) {
    return (
      <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
        <div style={{ border: "2px solid var(--frame-border)", borderRadius: 16, overflow: "hidden", background: "white", boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)" }}>
          <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--chrome-border)", background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)", fontSize: 28, fontWeight: 800, color: "var(--heading)" }}>
            {t("Exit practice?", "Salir de la practica?", "Quitter la pratique ?", "Soti nan pratik la?")}
          </div>
          <div style={{ padding: 20, display: "grid", gap: 14 }}>
            <div style={{ fontSize: 42, lineHeight: 1, textAlign: "center", color: "var(--brand-red)" }}>!</div>
            <div style={{ textAlign: "center", fontWeight: 700, color: "var(--heading)" }}>
              {t("You are leaving this practice session.", "Va a salir de esta sesion de practica.", "Vous allez quitter cette session de pratique.", "Ou pral kite sesyon pratik sa a.")}
            </div>
            <div style={{ textAlign: "center", color: "#456173", lineHeight: 1.7 }}>
              {t(
                "Your progress in this session will stay saved on this device.",
                "Su progreso en esta sesion quedara guardado en este dispositivo.",
                "Votre progression dans cette session restera enregistree sur cet appareil.",
                "Pwogre ou nan sesyon sa a ap rete sove sou aparey sa a."
              )}
            </div>
            <div style={{ textAlign: "center", color: "#456173", lineHeight: 1.7 }}>
              {t(
                "You can return to the Practice Hub and continue it later.",
                "Puede volver al Centro de Practica y continuarla mas tarde.",
                "Vous pourrez revenir au hub de pratique et la reprendre plus tard.",
                "Ou ka retounen nan Hub Pratik la epi kontinye li pita."
              )}
            </div>
          </div>
          <div style={{ padding: "14px 20px", background: "var(--surface-soft)", borderTop: "1px solid var(--chrome-border)" }}>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end", flexDirection: isNarrow ? "column" : "row" }}>
              <button onClick={() => setView("session")} style={{ ...btnSecondary, width: isNarrow ? "100%" : 200 }}>
                {t("Continue Practice", "Continuar practica", "Continuer la pratique", "Kontinye Pratik")}
              </button>
              <button onClick={exitToHub} style={{ ...btnPrimary, width: isNarrow ? "100%" : 200 }}>
                {t("Exit Practice", "Salir de la practica", "Quitter la pratique", "Soti nan pratik la")}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const questionId = session.questionIds?.[session.currentIndex];
  const question = session.questionsById?.[questionId];
  const saved = session.answers?.[questionId];
  const submitted = !!saved?.submitted;
  const isLast = session.currentIndex >= (session.questionIds || []).length - 1;
  const displayBlocks = getDisplayBlocks(question, lang);
  const isBilingualSupport = lang === "fr" || lang === "ht";
  const variantEn = question?.variants?.en || null;
  const variantSupport = isBilingualSupport ? question?.variants?.[lang] || null : null;
  const variantPrimary = isBilingualSupport ? variantEn : question?.variants?.[lang] || variantEn;
  const rationalePrimary = isBilingualSupport ? variantEn?.rationale || null : question?.variants?.[lang]?.rationale || variantEn?.rationale || null;
  const rationaleSupport = isBilingualSupport ? variantSupport?.rationale || null : null;
  const focusLabel =
    session.mode === "chapter"
      ? localizeChapter(lang, session.selectedChapter)
      : session.mode === "category"
        ? localizeCategory(lang, session.selectedCategory)
        : t("Mixed Practice", "Practica mixta", "Pratique mixte", "Pratik melanje");

  return (
    <div style={{ maxWidth: 900, margin: "20px auto", padding: 16 }}>
      <div style={{ border: "2px solid var(--frame-border)", borderRadius: 16, overflow: "hidden", background: "white", boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)" }}>
        <div style={{ padding: "18px 20px", borderBottom: "1px solid var(--chrome-border)", background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)", display: "flex", justifyContent: "space-between", gap: 12, alignItems: "flex-start", flexWrap: isNarrow ? "wrap" : "nowrap" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, letterSpacing: "0.06em", textTransform: "uppercase", color: "var(--brand-teal-dark)", marginBottom: 6 }}>
              {focusLabel}
            </div>
            <div style={{ fontWeight: "bold", fontSize: 22, color: "var(--heading)" }}>{t("Question", "Pregunta", "Question", "Kestyon")} {session.currentIndex + 1} {t("of", "de", "sur", "sou")} {session.questionIds.length}</div>
            <div style={{ fontSize: 12, color: "#607282", marginTop: 4 }}>ID: {questionId}</div>
          </div>
          <button style={btnSecondary} onClick={requestExit}>{t("Exit", "Salir", "Quitter", "Soti")}</button>
        </div>

        <div style={{ padding: 18 }}>
          <div style={{ border: "1px solid var(--chrome-border)", borderRadius: 14, background: "var(--surface-soft)", padding: 18 }}>
            <div style={{ marginBottom: 16 }}>
              {displayBlocks.map((block) => (
                <div key={`${block.label || "primary"}-${block.v?.question_text || ""}`} style={{ marginTop: block.label === "" || block.label === "EN" || block.label === "ES" ? 0 : 12 }}>
                  <div style={{ fontSize: isNarrow ? 17 : 20, fontWeight: 600, lineHeight: isNarrow ? 1.42 : 1.5, color: "#1e3342" }}>
                    {block.label ? <span style={{ display: "inline-block", fontWeight: "bold", fontSize: isNarrow ? 12 : 13, color: "#607282", marginRight: 8 }}>{block.label}</span> : null}
                    {block.v?.question_text}
                  </div>
                </div>
              ))}
            </div>

            <div>
              {Object.entries(variantPrimary?.options || {}).map(([key, textPrimary]) => (
                <div
                  key={key}
                  style={{
                    padding: isNarrow ? "10px 12px" : "12px 14px",
                    marginBottom: 10,
                    fontSize: isNarrow ? 15 : 16,
                    border:
                      submitted && key === question.correct_answer
                        ? "2px solid #3d9b5f"
                        : "1px solid var(--chrome-border)",
                    borderRadius: 12,
                    background:
                      submitted && key === question.correct_answer
                        ? "linear-gradient(180deg, #f2fff5 0%, #dcf6e4 100%)"
                        : saved?.selected_answer_id === key
                          ? "var(--surface-tint)"
                          : "white",
                    boxShadow:
                      submitted && key === question.correct_answer
                        ? "0 0 0 3px rgba(61, 155, 95, 0.12)"
                        : "none",
                  }}
                >
                  <label style={{ display: "block", cursor: submitted ? "default" : "pointer" }}>
                    <input type="radio" name={`practice-${session.session_id}`} value={key} checked={saved?.selected_answer_id === key} onChange={() => handleSelect(key)} style={{ marginRight: 10 }} disabled={submitted} />
                    <strong style={{ marginRight: 8 }}>{key}.</strong>
                    {textPrimary}
                  </label>
                  {isBilingualSupport && variantSupport?.options?.[key] ? <div style={{ marginTop: 6, paddingLeft: 28, fontSize: isNarrow ? 14 : 16, color: "#333", opacity: 0.92 }}>{variantSupport.options[key]}</div> : null}
                </div>
              ))}
            </div>

            {submitted ? (
              <div
                style={{
                  marginTop: 16,
                  padding: "14px 16px",
                  borderRadius: 14,
                  border: saved?.is_correct ? "2px solid #3d9b5f" : "2px solid rgba(204, 0, 0, 0.18)",
                  background: saved?.is_correct
                    ? "linear-gradient(180deg, #f5fff7 0%, #e2f8e9 100%)"
                    : "linear-gradient(180deg, #fff8f8 0%, #fff1f1 100%)",
                  boxShadow: saved?.is_correct
                    ? "0 8px 18px rgba(61, 155, 95, 0.10)"
                    : "0 8px 18px rgba(204, 0, 0, 0.06)",
                }}
              >
                <div style={{ fontWeight: "bold", fontSize: 17, marginBottom: 8, color: saved?.is_correct ? "#1f6f3d" : "var(--brand-red)" }}>
                  {saved?.is_correct ? t("Correct", "Correcto", "Correct", "Korek") : t(`Incorrect - correct answer is ${question.correct_answer}`, `Incorrecto - la respuesta correcta es ${question.correct_answer}`, `Incorrect - la bonne reponse est ${question.correct_answer}`, `Pa korek - bon repons lan se ${question.correct_answer}`)}
                </div>
                {(rationalePrimary?.why_correct || rationaleSupport?.why_correct) ? (
                  <details>
                    <summary style={{ cursor: "pointer", fontSize: 14, fontWeight: 700, color: "var(--brand-teal-dark)" }}>{t("Show explanation", "Ver explicacion", "Voir l'explication", "Gade eksplikasyon")}</summary>
                    <div style={{ marginTop: 10, fontSize: 13, color: "#333", lineHeight: 1.7 }}>
                      {rationalePrimary?.why_correct ? <div>{rationalePrimary.why_correct}</div> : null}
                      {isBilingualSupport && rationaleSupport?.why_correct && rationaleSupport.why_correct !== rationalePrimary?.why_correct ? <div style={{ marginTop: 6, opacity: 0.92 }}>{rationaleSupport.why_correct}</div> : null}
                    </div>
                  </details>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>

        <div style={{ padding: "14px 20px", background: "var(--surface-soft)", borderTop: "1px solid var(--chrome-border)" }}>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "flex-end", flexDirection: isNarrow ? "column" : "row" }}>
            <button onClick={goPrev} style={{ ...btnSecondary, width: isNarrow ? "100%" : 160 }} disabled={(session.currentIndex || 0) === 0}>{t("Back", "Atras", "Retour", "Retounen")}</button>
            {!isLast ? <button onClick={goNext} style={{ ...btnPrimary, width: isNarrow ? "100%" : 180 }} disabled={!submitted}>{t("Next", "Siguiente", "Suivant", "Pwochen")}</button> : <button onClick={finish} style={{ ...btnPrimary, width: isNarrow ? "100%" : 220 }} disabled={!submitted}>{t("Finish Practice", "Finalizar practica", "Terminer la pratique", "Fini Pratik la")}</button>}
          </div>
        </div>
      </div>
    </div>
  );
}
