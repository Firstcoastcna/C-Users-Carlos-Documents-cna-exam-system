import { redirect } from "next/navigation";
import { loadQuestionBank } from "../lib/questionBank";
import PracticeSessionClient from "./PracticeSessionClient";

export const dynamic = "force-dynamic";

export default async function PracticeSessionPage({ searchParams }) {
  const sp = await searchParams;
  const lang = sp?.lang;
  if (!lang) redirect("/");

  const bank = loadQuestionBank();
  const bankById = {};
  bank.forEach((question) => {
    bankById[question.question_id] = question;
  });

  return (
    <main style={{ padding: "20px" }}>
      <PracticeSessionClient bankById={bankById} />
    </main>
  );
}
