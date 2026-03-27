import { redirect } from "next/navigation";
import { loadQuestionBank } from "../lib/questionBank";
import RemediationClient from "./RemediationClient";

export const dynamic = "force-dynamic";

export default async function RemediationPage({ searchParams }) {
  const sp = await searchParams;

  const lang = sp?.lang;
  if (!lang) redirect("/");

  const bank = loadQuestionBank();
  const bankById = {};
  bank.forEach((q) => {
    bankById[q.question_id] = q;
  });

  return (
    <main style={{ padding: "20px" }}>
      <RemediationClient bankById={bankById} />
    </main>
  );
}
