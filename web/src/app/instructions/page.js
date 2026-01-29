"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";

export default function InstructionsPage() {
  const router = useRouter();
  const sp = useSearchParams();
  const lang = sp.get("lang") || "en";

  const [showNextTime, setShowNextTime] = useState(true);

  // Access gate + initialize toggle state
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
      // Mark as "seen" (so future continues can skip if toggle is off)
      localStorage.setItem("cna_instructions_seen", "1");

      const v = localStorage.getItem("cna_show_instructions_next_time");
      if (v === null) {
        localStorage.setItem("cna_show_instructions_next_time", "1");
        setShowNextTime(true);
      } else {
        setShowNextTime(v !== "0");
      }
    } catch {}
  }, [router, lang]);

  const theme = useMemo(
    () => ({
      frameBorder: "#9fb2c7",
      chromeBg: "#e9f0f7",
      chromeBorder: "#b7c6d6",
      primaryBg: "#2b6cb0",
      primaryText: "white",
      secondaryBg: "#f4f6f8",
      secondaryText: "#1a1a1a",
      buttonBorder: "#9aa8b5",
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

  function Frame({ title, children, footer }) {
    return (
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "20px" }}>
        <div
          style={{
            height: "675px",
            border: `2px solid ${theme.frameBorder}`,
            borderRadius: "12px",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            background: "white",
          }}
        >
          <div
            style={{
              borderBottom: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
              fontWeight: "bold",
              textTransform: "uppercase",
            }}
          >
            {title}
          </div>

          <div style={{ flex: 1, padding: "18px", overflowY: "auto" }}>{children}</div>

          <div
            style={{
              borderTop: `1px solid ${theme.chromeBorder}`,
              padding: "12px 14px",
              background: theme.chromeBg,
            }}
          >
            {footer}
          </div>
        </div>
      </div>
    );
  }

  function t(en, es, fr, ht) {
    if (lang === "es") return es;
    if (lang === "fr") return fr;
    if (lang === "ht") return ht;
    return en;
  }

  function saveToggle(value) {
    setShowNextTime(value);
    try {
      localStorage.setItem("cna_show_instructions_next_time", value ? "1" : "0");
    } catch {}
  }

  return (
    <Frame
      title={t("INSTRUCTIONS", "INSTRUCCIONES", "INSTRUCTIONS", "ENSTRIKSYON")}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "10px" }}>
          <button
            style={{ ...btnSecondary, width: "220px" }}
            onClick={() => router.push(`/chapters?lang=${lang}`)}
          >
            {t("Chapters", "Capítulos", "Chapitres", "Chapit")}
          </button>

          <button
            style={{ ...btnPrimary, width: "220px" }}
            onClick={() => router.push(`/pilot?lang=${lang}`)}
          >
            {t("Go to Pilot Hub", "Ir al Piloto", "Aller au hub pilote", "Ale nan Pilot")}
          </button>
        </div>
      }
    >
      <div style={{ maxWidth: "720px", margin: "0 auto" }}>
        <div style={{ fontSize: "20px", fontWeight: "bold", marginBottom: "10px" }}>
          {t("How this works", "Cómo funciona", "Comment ça marche", "Kijan sa mache")}
        </div>

        <ul style={{ lineHeight: "1.7", color: "#333", paddingLeft: "18px" }}>
  <li>
    {t(
      "This is a timed 60-question exam. The timer continues until you finish or time expires.",
      "Este es un examen cronometrado de 60 preguntas. El tiempo continúa hasta que termine o se agote.",
      "C’est un examen chronométré de 60 questions. Le temps continue jusqu’à la fin ou l’expiration.",
      "Sa a se yon egzamen 60 kesyon ki gen tan. Tan an kontinye jiskaske ou fini oswa tan an fini."
    )}
  </li>

  <li>
    {t(
      "Use Previous and Next to move between questions. Your selected answer is saved automatically.",
      "Use Anterior y Siguiente para moverse entre preguntas. Su respuesta se guarda automáticamente.",
      "Utilisez Précédent et Suivant pour naviguer. Votre réponse est enregistrée automatiquement.",
      "Sèvi ak Previous ak Next pou deplase. Repons ou chwazi a sove otomatikman."
    )}
  </li>

  <li>
    {t(
      "Use Summary to see all questions, jump to any item, and filter by Answered / Unanswered / Marked.",
      "Use Resumen para ver todas las preguntas, saltar a cualquier ítem y filtrar por Respondidas / Sin responder / Marcadas.",
      "Utilisez Résumé pour voir toutes les questions, aller à n’importe quel item et filtrer par Répondues / Sans réponse / Marquées.",
      "Sèvi ak Summary pou wè tout kesyon yo, ale sou nenpòt kestyon, epi filtre: Reponn / San repons / Make."
    )}
  </li>

  <li>
    {t(
      "Use 🚩 Mark for Review to flag a question you want to revisit. Use 🚩 Unmark Review to remove the flag.",
      "Use 🚩 Marcar para revisar para señalar una pregunta. Use 🚩 Quitar marca para eliminarla.",
      "Utilisez 🚩 Marquer à revoir pour signaler une question. Utilisez 🚩 Retirer la marque pour l’enlever.",
      "Sèvi ak 🚩 Mark for Review pou make yon kestyon ou vle retounen. Sèvi ak 🚩 Unmark Review pou retire mak la."
    )}
  </li>

  <li>
    {t(
      "Use Exit if you need to leave mid-exam. Your progress stays saved on this device, and you can resume later (same question + same timer).",
      "Use Salir si necesita salir a mitad del examen. Su progreso queda guardado en este dispositivo y puede reanudar después (misma pregunta + mismo tiempo).",
      "Utilisez Quitter si vous devez sortir en cours d’examen. Votre progression est sauvegardée sur cet appareil et vous pourrez reprendre (même question + même minuteur).",
      "Sèvi ak Exit si ou bezwen sòti nan mitan egzamen an. Pwogrè ou rete sove sou aparèy sa a epi ou ka reprann pita (menm kestyon + menm tan)."
    )}
  </li>

  <li>
    {t(
      "Use End Test only when you are ready to submit. After you end the test, answers cannot be changed.",
      "Use Finalizar examen solo cuando esté listo para enviar. Después de finalizar, no se pueden cambiar las respuestas.",
      "Utilisez Terminer le test seulement quand vous êtes prêt. Après la fin, les réponses ne peuvent plus être modifiées.",
      "Sèvi ak End Test sèlman lè ou pare pou fini. Apre ou fini, ou pa ka chanje repons yo ankò."
    )}
  </li>

  <li>
    {t(
      "After finishing (or if time expires), you will see a Results Page, then Analytics and Review Questions for study guidance.",
      "Después de finalizar (o si se agota el tiempo), verá una página de Resultados, luego Análisis y Revisar preguntas para guiar su estudio.",
      "Après la fin (ou si le temps expire), vous verrez la page Résultats, puis Analyse et Revoir les questions pour guider vos révisions.",
      "Apre ou fini (oswa tan an fini), ou pral wè paj Rezilta, epi Analiz ak Revize kesyon yo pou gid etid."
    )}
  </li>

  <li>
    {t(
      "The Chapters button is optional study guidance (high-level overview). It does not affect your exam attempts.",
      "El botón Capítulos es una guía opcional (resumen general). No afecta sus intentos del examen.",
      "Le bouton Chapitres est un guide optionnel (aperçu général). Il n’affecte pas vos tentatives.",
      "Bouton Chapit yo se yon gid opsyonèl (apèsi jeneral). Li pa chanje tantativ egzamen ou."
    )}
  </li>
</ul>


        <div style={{ marginTop: "18px", padding: "12px", border: `1px solid ${theme.chromeBorder}`, borderRadius: "10px", background: "#fafcff" }}>
          <div style={{ fontWeight: "bold", marginBottom: "6px" }}>
            {t("Show instructions again?", "¿Mostrar instrucciones otra vez?", "Afficher les instructions à nouveau ?", "Montre enstriksyon ankò?")}
          </div>

          <label style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <input
              type="checkbox"
              checked={!showNextTime}
onChange={(e) => {
  const skip = e.target.checked; // checked = skip instructions
  const show = !skip;            // show instructions when continuing
  saveToggle(show);              // writes localStorage + updates state
}}

            />
            <span style={{ color: "#333" }}>
              {t(
  "Skip instructions and go directly to the Pilot Hub",
  "Omitir las instrucciones e ir directamente al Piloto",
  "Ignorer les instructions et aller directement au hub pilote",
  "Sote enstriksyon yo epi ale dirèkteman nan Pilot la"
)}


            </span>
          </label>

          <div style={{ marginTop: "8px", fontSize: "12px", color: "#666" }}>
            {t(
  "If checked, you will skip this page next time.",
  "Si está marcado, omitirá esta página la próxima vez.",
  "Si coché, cette page sera ignorée la prochaine fois.",
  "Si bwat la make, paj sa a pap parèt pwochen fwa."
)}

          </div>
        </div>
      </div>
    </Frame>
  );
}
