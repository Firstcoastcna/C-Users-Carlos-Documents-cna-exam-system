import { NextResponse } from "next/server";
import {
  createRemediationSessionRecord,
  loadRemediationSessionRecord,
  updateRemediationSessionRecord,
  upsertAppUser,
} from "@/app/lib/backend/db/client";

const DEV_USER_ID = "dev-remediation-bootstrap-user";
const TEST_SESSION_ID = "remediation-server-test-001";

export async function GET() {
  try {
    await upsertAppUser({
      id: DEV_USER_ID,
      email: "dev-remediation-bootstrap-user@study.firstcoastcna.com",
      fullName: "Remediation Bootstrap User",
    });

    const created = await createRemediationSessionRecord({
      id: TEST_SESSION_ID,
      userId: DEV_USER_ID,
      lang: "en",
      status: "active",
      categories: ["Change in Condition", "Infection Control"],
      questionCount: 12,
      payload: {
        created_at: Date.now(),
        lang: "en",
        mode: "targeted",
        results_attempt_id: "att_demo_001",
        selectedCategories: ["Change in Condition", "Infection Control"],
        totalQuestions: 12,
        perCategoryCount: {
          "Change in Condition": 6,
          "Infection Control": 6,
        },
        categoryChapterSources: {
          "Change in Condition": [4, 3, 5],
          "Infection Control": [2, 3, 4],
        },
        questionIds: ["Q00001", "Q00002", "Q00003"],
        questionsById: {},
        currentIndex: 0,
        answers: {},
        status: "active",
      },
    }).catch(async (error) => {
      if (!String(error?.message || "").includes("duplicate key")) throw error;
      return loadRemediationSessionRecord(DEV_USER_ID, TEST_SESSION_ID);
    });

    const updated = await updateRemediationSessionRecord({
      id: TEST_SESSION_ID,
      userId: DEV_USER_ID,
      lang: "en",
      status: "completed",
      categories: ["Change in Condition", "Infection Control"],
      questionCount: 12,
      payload: {
        ...(created?.payload || {}),
        completed_at: Date.now(),
        status: "completed",
        submitted_correct: 8,
        submitted_total: 12,
        microOutcome: "Improving",
      },
    });

    const loaded = await loadRemediationSessionRecord(DEV_USER_ID, TEST_SESSION_ID);

    return NextResponse.json({
      ok: true,
      service: "remediation-session-bootstrap-check",
      created,
      updated,
      loaded,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "remediation-session-bootstrap-check",
        error: error instanceof Error ? error.message : "Unknown remediation bootstrap error",
      },
      { status: 500 }
    );
  }
}
