"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  fetchStudentOverviewReport,
  resolveStudentEntryState,
} from "../lib/backend/auth/browserAuth";
import { useDisableBrowserNavigation } from "../lib/backend/auth/useDisableBrowserNavigation";
import { useProtectedPlatformPage } from "../lib/backend/auth/useProtectedPlatformPage";

const shell = {
  maxWidth: 920,
  margin: "24px auto",
  padding: 20,
};

const card = {
  border: "2px solid var(--frame-border)",
  borderRadius: 16,
  overflow: "hidden",
  background: "white",
  boxShadow: "0 12px 32px rgba(31, 52, 74, 0.08)",
};

const header = {
  padding: "18px 20px",
  borderBottom: "1px solid var(--chrome-border)",
  background: "linear-gradient(180deg, var(--surface-tint) 0%, var(--chrome-bg) 100%)",
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: 12,
  flexWrap: "wrap",
};

const body = {
  padding: 20,
  display: "grid",
  gap: 16,
};

const title = {
  fontSize: 28,
  fontWeight: 800,
  color: "var(--heading)",
};

const subjectTitle = {
  fontSize: 18,
  fontWeight: 700,
  color: "#4f6272",
  lineHeight: 1.3,
};

const subText = {
  color: "#5a6b78",
  lineHeight: 1.6,
  fontSize: 14,
};

const btnSecondary = {
  padding: "8px 11px",
  borderRadius: 9,
  border: "1px solid #cfdde6",
  background: "white",
  color: "#536779",
  cursor: "pointer",
  fontWeight: 700,
  fontSize: 13,
};

const sectionCard = {
  border: "1px solid #d6e1e8",
  borderRadius: 14,
  background: "#fcfeff",
  padding: 14,
  display: "grid",
  gap: 8,
};

const analysisGrid = {
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
  gap: 14,
  alignItems: "start",
};

const detailsSummary = {
  cursor: "pointer",
  listStyle: "none",
};

function InlineMessage({ tone = "info", children }) {
  const styles =
    tone === "error"
      ? { background: "#fff0ef", border: "1px solid #f4c5c0", color: "#9b1c1c" }
      : { background: "#fff8eb", border: "1px solid #f0d59b", color: "#755200" };

  return <div style={{ padding: "12px 14px", borderRadius: 12, ...styles }}>{children}</div>;
}

function formatPercent(value) {
  return Number.isFinite(value) ? `${value}%` : null;
}

function buildStudentStrengths(summary) {
  return {
    strongestCategories: summary?.learningSignals?.strongestCategories || [],
    bestScore: summary?.exams?.bestScore,
    completedPractice: summary?.practice?.completedSessions ?? 0,
    completedRemediation: summary?.remediation?.completedSessions ?? 0,
  };
}

function buildStudentWeaknesses(summary) {
  return {
    categoriesNeedingWork: summary?.learningSignals?.categoriesNeedingWork || [],
    highRiskCategories: summary?.learningSignals?.highRiskCategories || [],
    chapterPriorities: summary?.learningSignals?.chapterPriorities || [],
  };
}

function buildStudentNextActions(summary) {
  const actions = [];
  const overallStatus = summary?.learningSignals?.overallStatus || "";
  const topWeak = summary?.learningSignals?.categoriesNeedingWork?.[0] || null;
  const topHighRisk = summary?.learningSignals?.highRiskCategories?.[0] || null;
  const topChapter = summary?.learningSignals?.chapterPriorities?.[0] || null;

  if (topHighRisk?.category) {
    actions.push({ kind: "highRisk", value: topHighRisk.category });
  } else if (topWeak?.category) {
    actions.push({ kind: "weak", value: topWeak.category });
  }

  if (topChapter?.chapterId) {
    actions.push({ kind: "chapter", value: topChapter.chapterId });
  }

  if (overallStatus === "High Risk") {
    actions.push({ kind: "status", value: "highRisk" });
  } else if (overallStatus === "Borderline") {
    actions.push({ kind: "status", value: "borderline" });
  } else if (overallStatus === "On Track") {
    actions.push({ kind: "status", value: "onTrack" });
  }

  if (!actions.length) {
    actions.push({ kind: "buildActivity" });
  }

  return actions.slice(0, 4);
}

function buildStudentProgress(summary) {
  return {
    examAverage: summary?.exams?.averageScore,
    bestScore: summary?.exams?.bestScore,
    completedAttempts: summary?.exams?.completedAttempts ?? 0,
    totalPractice: summary?.practice?.totalSessions ?? 0,
    totalRemediation: summary?.remediation?.totalSessions ?? 0,
    totalExposure: summary?.questionHistory?.totalExposureRows ?? 0,
  };
}

function OpenHint({ isOpen, lang }) {
  const [isNarrow, setIsNarrow] = useState(false);

  useEffect(() => {
    function syncWidth() {
      if (typeof window === "undefined") return;
      setIsNarrow(window.innerWidth < 760);
    }
    syncWidth();
    window.addEventListener("resize", syncWidth);
    return () => window.removeEventListener("resize", syncWidth);
  }, []);

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  return (
    <span style={{ color: "#607282", fontSize: 12.5, fontWeight: 700 }}>
      {isNarrow
        ? isOpen
          ? t("Tap here to close", "Toque aqui para cerrar", "Touchez ici pour fermer", "Peze la a pou femen")
          : t("Tap here to open", "Toque aqui para abrir", "Touchez ici pour ouvrir", "Peze la a pou louvri")
        : isOpen
          ? t("Click here to close", "Haga clic aqui para cerrar", "Cliquez ici pour fermer", "Klike la a pou femen")
          : t("Click here to open", "Haga clic aqui para abrir", "Cliquez ici pour ouvrir", "Klike la a pou louvri")}
    </span>
  );
}

export default function ReportsClient() {
  const router = useRouter();
  const searchParams = useSearchParams();
  useProtectedPlatformPage();
  useDisableBrowserNavigation();

  const [lang, setLang] = useState("en");
  const [loading, setLoading] = useState(true);
  const [showLoadingNotice, setShowLoadingNotice] = useState(false);
  const [message, setMessage] = useState("");
  const [report, setReport] = useState(null);
  const [activityOpen, setActivityOpen] = useState(false);
  const [isNarrow, setIsNarrow] = useState(false);

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  function noDataLabel() {
    return t("No data yet", "Sin datos todavia", "Pas encore de donnees", "Poko gen done");
  }

  function formatStatusLabel(value) {
    if (value === "On Track") return t("On Track", "En buen camino", "En bonne voie", "Sou bon chimen");
    if (value === "Borderline") return t("Borderline", "Al limite", "Limite", "Sou limit la");
    if (value === "High Risk") return t("High Risk", "Alto riesgo", "Haut risque", "Gwo risk");
    return value || t("No current signal", "Sin senal actual", "Aucun signal actuel", "Pa gen siyal aktyel");
  }

  function formatSourceTypeLabel(value) {
    if (value === "exam") return t("Exam", "Examen", "Examen", "Egzamen");
    if (value === "practice") return t("Practice", "Practica", "Pratique", "Pratik");
    if (value === "remediation") return t("Remediation", "Remediacion", "Remediation", "Remedyasyon");
    return value;
  }

  function formatCategoryLabel(value) {
    const map = {
      "Change in Condition": t("Change in Condition", "Cambio en la condicion", "Changement d'etat", "Chanjman nan kondisyon"),
      "Scope of Practice & Reporting": t("Scope of Practice & Reporting", "Alcance de la practica y reporte", "Champ de pratique et signalement", "Wol mwen ak sa pou rapote"),
      "Communication & Emotional Support": t("Communication & Emotional Support", "Comunicacion y apoyo emocional", "Communication et soutien emotionnel", "Kominikasyon ak sipo emosyonel"),
      "Observation & Safety": t("Observation & Safety", "Observacion y seguridad", "Observation et securite", "Obsevasyon ak sekirite"),
      "Personal Care & Comfort": t("Personal Care & Comfort", "Cuidado personal y comodidad", "Soins personnels et confort", "Swen pesonel ak konfo"),
      "Mobility & Positioning": t("Mobility & Positioning", "Movilidad y posicionamiento", "Mobilite et positionnement", "Mobilite ak pozisyonman"),
      "Environment & Safety": t("Environment & Safety", "Entorno y seguridad", "Environnement et securite", "Anviwonman ak sekirite"),
      "Dignity & Resident Rights": t("Dignity & Resident Rights", "Dignidad y derechos del residente", "Dignite et droits du resident", "Diyite ak dwa rezidan an"),
      "Infection Control": t("Infection Control", "Control de infecciones", "Controle des infections", "Kontwol enfeksyon"),
    };
    return map[value] || value;
  }

  function renderNextAction(item) {
    if (item.kind === "highRisk") {
      return t(
        `Start with ${formatCategoryLabel(item.value)}. It is showing the clearest high-risk signal right now.`,
        `Empiece con ${formatCategoryLabel(item.value)}. Es la senal de mayor riesgo en este momento.`,
        `Commencez par ${formatCategoryLabel(item.value)}. C'est le signal a haut risque le plus clair pour le moment.`,
        `Komanse ak ${formatCategoryLabel(item.value)}. Se li menm ki montre siyal gwo risk ki pi kle kounye a.`
      );
    }
    if (item.kind === "weak") {
      return t(
        `Review ${formatCategoryLabel(item.value)} first before moving on to stronger areas.`,
        `Revise primero ${formatCategoryLabel(item.value)} antes de pasar a areas mas fuertes.`,
        `Revoyez d'abord ${formatCategoryLabel(item.value)} avant de passer aux domaines plus forts.`,
        `Revize ${formatCategoryLabel(item.value)} an premye anvan ou pase nan zon ki pi fo yo.`
      );
    }
    if (item.kind === "chapter") {
      return t(
        `Give extra attention to Chapter ${item.value}. It is the clearest chapter-level priority.`,
        `Ponga atencion extra al Capitulo ${item.value}. Es la prioridad mas clara a nivel de capitulo.`,
        `Accordez plus d'attention au Chapitre ${item.value}. C'est la priorite la plus claire au niveau du chapitre.`,
        `Bay Chapit ${item.value} plis atansyon. Se li menm ki pi kle kom priyorite nan nivo chapit la.`
      );
    }
    if (item.kind === "status" && item.value === "highRisk") {
      return t(
        "Stay with shorter practice and remediation cycles until readiness becomes more stable.",
        "Mantengase con ciclos mas cortos de practica y remediacion hasta que su preparacion sea mas estable.",
        "Restez sur des cycles plus courts de pratique et de remediation jusqu'a ce que votre niveau soit plus stable.",
        "Kenbe sesyon pratik ak remedyasyon yo pi kout jiskaske preparasyon an vin pi estab."
      );
    }
    if (item.kind === "status" && item.value === "borderline") {
      return t(
        "Keep building consistency with another full exam after focused review.",
        "Siga construyendo consistencia con otro examen completo despues de una revision enfocada.",
        "Continuez a construire votre constance avec un autre examen complet apres une revision ciblee.",
        "Kontinye bati plis regilarite ak yon lot egzamen konple apre yon revizyon ki byen vize."
      );
    }
    if (item.kind === "status" && item.value === "onTrack") {
      return t(
        "Keep momentum with full exams and targeted review only where weak signals still appear.",
        "Mantenga el impulso con examenes completos y revision dirigida solo donde todavia aparezcan senales debiles.",
        "Gardez votre elan avec des examens complets et une revision ciblee seulement la ou les signaux faibles apparaissent encore.",
        "Kenbe bon ritm nan ak egzamen konple ak revizyon vize selman kote siyal feb yo toujou paret."
      );
    }
    return t(
      "Build more activity through practice, exams, or remediation so the report can surface clearer next steps.",
      "Genere mas actividad con practica, examenes o remediacion para que el reporte pueda mostrar pasos siguientes mas claros.",
      "Ajoutez plus d'activite par la pratique, les examens ou la remediation afin que le rapport puisse montrer des etapes suivantes plus claires.",
      "Fe plis aktivite ak pratik, egzamen, oswa remedyasyon pou rapo a ka montre pwochen etap ki pi kle."
    );
  }

  const loadErrorMessage = t(
    "Unable to load your report.",
    "No se pudo cargar su reporte.",
    "Impossible de charger votre rapport.",
    "Nou pa t kapab chaje rapo ou a."
  );

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
      try {
        const state = await resolveStudentEntryState();
        if (cancelled) return;
        if (state.status === "signin") {
          router.replace("/signin");
          return;
        }
        if (state.status === "access") {
          router.replace("/access");
          return;
        }
      } catch {}
    })();

    return () => {
      cancelled = true;
    };
  }, [router]);

  useEffect(() => {
    const urlLang = searchParams.get("lang");
    if (urlLang === "en" || urlLang === "es" || urlLang === "fr" || urlLang === "ht") {
      setLang(urlLang);
      return;
    }

    try {
      const saved = localStorage.getItem("cna_pilot_lang");
      if (saved === "en" || saved === "es" || saved === "fr" || saved === "ht") {
        setLang(saved);
      }
    } catch {}
  }, [searchParams]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      setLoading(true);
      setMessage("");
      try {
        const nextReport = await fetchStudentOverviewReport(lang);
        if (!cancelled) {
          setReport(nextReport);
        }
      } catch (error) {
        if (!cancelled) {
          setMessage(error instanceof Error ? error.message : loadErrorMessage);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [lang, loadErrorMessage]);

  useEffect(() => {
    if (!loading) {
      setShowLoadingNotice(false);
      return undefined;
    }

    const timer = window.setTimeout(() => setShowLoadingNotice(true), 350);
    return () => window.clearTimeout(timer);
  }, [loading]);

  const summary = report?.summary || null;
  const studentName =
    report?.user?.appUser?.full_name ||
    report?.user?.appUser?.email ||
    t("My Progress", "Mi progreso", "Mon progres", "Pwogre mwen");
  const strengths = buildStudentStrengths(summary);
  const weaknesses = buildStudentWeaknesses(summary);
  const nextActions = buildStudentNextActions(summary);
  const progress = buildStudentProgress(summary);

  return (
    <main style={shell}>
      <div style={card}>
        <div style={header}>
          <div style={{ display: "grid", gap: 4 }}>
            <div style={title}>{t("My Progress", "Mi progreso", "Mon progres", "Pwogre mwen")}</div>
            <div style={subjectTitle}>{studentName}</div>
            <div style={subText}>
              {t(
                "See your current readiness, strengths, weak areas, and what to do next.",
                "Vea su preparacion actual, fortalezas, areas debiles y que hacer despues.",
                "Voyez votre niveau actuel, vos forces, vos points faibles et la prochaine etape.",
                "Gade nivo preparasyon ou, fos ou, febles ou, ak sa pou fe apre."
              )}
            </div>
          </div>
          <button style={btnSecondary} onClick={() => router.push(`/start?lang=${lang}`)}>
            {t("Back to Main Menu", "Volver al menu principal", "Retour au menu principal", "Retounen nan meni prensipal la")}
          </button>
        </div>

        <div style={body}>
          {message ? <InlineMessage tone="error">{message}</InlineMessage> : null}
          {showLoadingNotice ? (
            <InlineMessage>
              {t("Loading your report...", "Cargando su reporte...", "Chargement de votre rapport...", "Ap chaje rapo ou a...")}
            </InlineMessage>
          ) : null}

          {!loading && summary ? (
            <>
              <div style={sectionCard}>
                <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Status summary", "Resumen de estado", "Resume de situation", "Rezime sitiyasyon")}</div>
                <div style={subText}>
                  {formatStatusLabel(summary.learningSignals?.overallStatus)}
                  {" | "}
                  {t("Completed full exams", "Examenes completos terminados", "Examens complets termines", "Egzamen konple fini")}: {summary.exams?.completedAttempts ?? 0}
                  {" | "}
                  {t("Practice sessions", "Sesiones de practica", "Sessions de pratique", "Sesyon pratik")}: {summary.practice?.totalSessions ?? 0}
                </div>
                <div style={subText}>
                  {t("Average exam score", "Promedio del examen", "Score moyen a l'examen", "Mwayen egzamen")}: {formatPercent(summary.exams?.averageScore) || noDataLabel()}
                  {" | "}
                  {t("Best exam score", "Mejor puntaje del examen", "Meilleur score a l'examen", "Pi bon not egzamen")}: {formatPercent(summary.exams?.bestScore) || noDataLabel()}
                  {" | "}
                  {t("Remediation sessions", "Sesiones de remediacion", "Sessions de remediation", "Sesyon remedyasyon")}: {summary.remediation?.totalSessions ?? 0}
                </div>
              </div>

              <div style={analysisGrid}>
                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Strengths", "Fortalezas", "Forces", "Fos")}</div>
                  <div style={subText}>
                    {t("Strongest categories", "Categorias mas fuertes", "Categories les plus fortes", "Kategori ki pi fo yo")}:{" "}
                    {strengths.strongestCategories.length
                      ? strengths.strongestCategories.map(formatCategoryLabel).join(" | ")
                      : t("No clear strengths yet", "Aun no hay fortalezas claras", "Pas encore de forces claires", "Poko gen fos kle")}
                  </div>
                  <div style={subText}>
                    {t("Best full exam score", "Mejor puntaje de examen completo", "Meilleur score d'examen complet", "Pi bon not egzamen konple")}: {formatPercent(strengths.bestScore) || noDataLabel()}
                  </div>
                  <div style={subText}>
                    {t("Completed practice", "Practica completada", "Pratique terminee", "Pratik fini")}: {strengths.completedPractice}
                    {" | "}
                    {t("Completed remediation", "Remediacion completada", "Remediation terminee", "Remedyasyon fini")}: {strengths.completedRemediation}
                  </div>
                </div>

                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Priority weak areas", "Areas debiles prioritarias", "Faiblesses prioritaires", "Febles ki pi enpotan yo")}</div>
                  <div style={subText}>
                    {t("Categories needing work", "Categorias que necesitan trabajo", "Categories a renforcer", "Kategori ki bezwen travay")}:{" "}
                    {weaknesses.categoriesNeedingWork.length
                      ? weaknesses.categoriesNeedingWork.map((item) => `${formatCategoryLabel(item.category)} (${item.level})`).join(" | ")
                      : t("No repeated weak category yet", "Todavia no hay una categoria debil repetida", "Pas encore de categorie faible repetee", "Poko gen kategori feb ki repete")}
                  </div>
                  <div style={subText}>
                    {t("High-risk categories", "Categorias de alto riesgo", "Categories a haut risque", "Kategori gwo risk")}:{" "}
                    {weaknesses.highRiskCategories.length
                      ? weaknesses.highRiskCategories.map((item) => `${formatCategoryLabel(item.category)} (${item.level})`).join(" | ")
                      : t("No current high-risk category signal", "Sin senal actual de categoria de alto riesgo", "Aucun signal actuel de categorie a haut risque", "Pa gen siyal kategori gwo risk kounye a")}
                  </div>
                  <div style={subText}>
                    {t("Priority chapters", "Capitulos prioritarios", "Chapitres prioritaires", "Chapit ki pi enpotan yo")}:{" "}
                    {weaknesses.chapterPriorities.length
                      ? weaknesses.chapterPriorities.map((item) => `${t("Chapter", "Capitulo", "Chapitre", "Chapit")} ${item.chapterId} (${item.priority})`).join(" | ")
                      : t("No clear chapter priority yet", "Todavia no hay una prioridad clara por capitulo", "Pas encore de priorite claire par chapitre", "Poko gen priyorite chapit ki kle")}
                  </div>
                </div>
              </div>

              <div style={analysisGrid}>
                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Progress over time", "Progreso en el tiempo", "Progression dans le temps", "Pwogre sou tan")}</div>
                  <div style={subText}>
                    {t("Average exam score", "Promedio del examen", "Score moyen a l'examen", "Mwayen egzamen")}: {formatPercent(progress.examAverage) || noDataLabel()}
                    {" | "}
                    {t("Best score", "Mejor puntaje", "Meilleur score", "Pi bon not")}: {formatPercent(progress.bestScore) || noDataLabel()}
                  </div>
                  <div style={subText}>
                    {t("Completed full exams", "Examenes completos terminados", "Examens complets termines", "Egzamen konple fini")}: {progress.completedAttempts}
                    {" | "}
                    {t("Practice sessions", "Sesiones de practica", "Sessions de pratique", "Sesyon pratik")}: {progress.totalPractice}
                  </div>
                  <div style={subText}>
                    {t("Remediation sessions", "Sesiones de remediacion", "Sessions de remediation", "Sesyon remedyasyon")}: {progress.totalRemediation}
                    {" | "}
                    {t("Total delivered questions", "Preguntas totales mostradas", "Questions totales affichees", "Total kestyon yo te montre")}: {progress.totalExposure}
                  </div>
                </div>

                <div style={sectionCard}>
                  <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Next action", "Proximo paso", "Prochaine etape", "Pwochen etap")}</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    {nextActions.map((item, index) => (
                      <div key={`${item.kind}-${item.value || index}`} style={subText}>
                        • {renderNextAction(item)}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <details style={sectionCard} open={activityOpen}>
                <summary
                  style={detailsSummary}
                  onClick={(e) => {
                    e.preventDefault();
                    setActivityOpen((prev) => !prev);
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Activity details", "Detalles de actividad", "Details d'activite", "Detay aktivite")}</div>
                    <OpenHint isOpen={activityOpen} lang={lang} />
                  </div>
                  <div style={subText}>
                    {t(
                      "Open to see exam activity, question exposure, practice focus, and remediation focus behind this report.",
                      "Abra para ver la actividad de examenes, la exposicion a preguntas, el enfoque de practica y el enfoque de remediacion detras de este reporte.",
                      "Ouvrez pour voir l'activite d'examen, l'exposition aux questions, l'axe de pratique et l'axe de remediation derriere ce rapport.",
                      "Louvri pou we aktivite egzamen, kestyon yo ou deja we, konsantrasyon pratik la, ak konsantrasyon remedyasyon an deye rapo sa a."
                    )}
                  </div>
                </summary>
                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns: isNarrow ? "1fr" : "repeat(2, minmax(0, 1fr))",
                    gap: 10,
                    marginTop: 10,
                  }}
                >
                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Exam activity", "Actividad de examen", "Activite d'examen", "Aktivite egzamen")}</div>
                    <div style={subText}>
                      {t("Total attempts", "Intentos totales", "Tentatives totales", "Total tantativ")}: {summary.exams?.totalAttempts ?? 0}
                      {" | "}
                      {t("Completed", "Completados", "Termines", "Fini")}: {summary.exams?.completedAttempts ?? 0}
                    </div>
                    <div style={subText}>
                      {t("Average score", "Puntaje promedio", "Score moyen", "Not mwayen")}: {formatPercent(summary.exams?.averageScore) || noDataLabel()}
                      {" | "}
                      {t("Best score", "Mejor puntaje", "Meilleur score", "Pi bon not")}: {formatPercent(summary.exams?.bestScore) || noDataLabel()}
                    </div>
                    <div style={subText}>
                      {t("Current readiness signal", "Senal actual de preparacion", "Signal actuel de preparation", "Siyal preparasyon aktyel")}: {formatStatusLabel(summary.learningSignals?.overallStatus)}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Question exposure", "Exposicion a preguntas", "Exposition aux questions", "Ekspozisyon kestyon yo")}</div>
                    <div style={subText}>{t("Total delivered", "Total mostradas", "Total affiche", "Total kestyon yo te montre")}: {summary.questionHistory?.totalExposureRows ?? 0}</div>
                    <div style={subText}>{t("Unique questions seen", "Preguntas unicas vistas", "Questions uniques vues", "K kestyon diferan ou te we")}: {summary.questionHistory?.uniqueQuestionCount ?? 0}</div>
                    <div style={subText}>
                      {t("By mode", "Por modo", "Par mode", "Pa mod")}:{" "}
                      {Object.entries(summary.questionHistory?.bySourceType || {})
                        .map(([key, value]) => `${formatSourceTypeLabel(key)}: ${value}`)
                        .join(" | ") || noDataLabel()}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Practice focus", "Enfoque de practica", "Axe de pratique", "Konsantrasyon pratik")}</div>
                    <div style={subText}>
                      {t("Chapters", "Capitulos", "Chapitres", "Chapit")}:{" "}
                      {Object.entries(summary.practiceFocus?.chapterCounts || {})
                        .map(([key, value]) => `${key}: ${value}`)
                        .join(" | ") || t("No chapter focus yet", "Todavia no hay enfoque por capitulo", "Pas encore d'axe par chapitre", "Poko gen konsantrasyon pa chapit")}
                    </div>
                    <div style={subText}>
                      {t("Categories", "Categorias", "Categories", "Kategori")}:{" "}
                      {Object.entries(summary.practiceFocus?.categoryCounts || {})
                        .map(([key, value]) => `${formatCategoryLabel(key)}: ${value}`)
                        .join(" | ") || t("No category focus yet", "Todavia no hay enfoque por categoria", "Pas encore d'axe par categorie", "Poko gen konsantrasyon pa kategori")}
                    </div>
                  </div>

                  <div style={{ ...sectionCard, background: "white", padding: 12 }}>
                    <div style={{ fontWeight: 800, color: "var(--heading)" }}>{t("Remediation focus", "Enfoque de remediacion", "Axe de remediation", "Konsantrasyon remedyasyon")}</div>
                    <div style={subText}>
                      {t("Categories", "Categorias", "Categories", "Kategori")}:{" "}
                      {Object.entries(summary.remediationFocus?.categoryCounts || {})
                        .map(([key, value]) => `${formatCategoryLabel(key)}: ${value}`)
                        .join(" | ") || t("No remediation focus yet", "Todavia no hay enfoque de remediacion", "Pas encore d'axe de remediation", "Poko gen konsantrasyon remedyasyon")}
                    </div>
                    <div style={subText}>
                      {t("Outcomes", "Resultados", "Resultats", "Rezilta yo")}:{" "}
                      {Object.entries(summary.remediationFocus?.outcomeCounts || {})
                        .map(([key, value]) => `${value}: ${formatStatusLabel(key)}`)
                        .join(" | ") || t("No remediation outcomes yet", "Todavia no hay resultados de remediacion", "Pas encore de resultats de remediation", "Poko gen rezilta remedyasyon")}
                    </div>
                  </div>
                </div>
              </details>
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
