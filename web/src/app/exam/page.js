import { redirect } from "next/navigation";
import { loadQuestionBank } from "../lib/questionBank";
import { loadForm } from "../lib/form";
import ExamClient from "./ExamClient";

export const dynamic = "force-dynamic";

export default async function ExamPage({ searchParams }) {
  const sp = await searchParams;
  const lang = sp?.lang;

if (!lang) {
  redirect("/"); // forces language selection first
}

  const bank = loadQuestionBank();
  const form = loadForm("form_001.json");

  const bankById = {};
  bank.forEach((q) => {
    bankById[q.question_id] = q;
  });

  return (
    <main style={{ padding: "20px", fontFamily: "Arial, sans-serif" }}>
      <ExamClient form={form} bankById={bankById} lang={lang} />
    </main>
  );
}
