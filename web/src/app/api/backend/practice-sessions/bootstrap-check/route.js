import { NextResponse } from "next/server";
import {
  createPracticeSessionRecord,
  loadPracticeSessionRecord,
  upsertAppUser,
  updatePracticeSessionRecord,
} from "@/app/lib/backend/db/client";

const DEV_USER_ID = "dev-bootstrap-user";
const TEST_SESSION_ID = "practice-server-test-001";

export async function GET() {
  try {
    await upsertAppUser({
      id: DEV_USER_ID,
      email: "dev-bootstrap-user@study.firstcoastcna.com",
      fullName: "Practice Bootstrap User",
    });

    const created = await createPracticeSessionRecord({
      id: TEST_SESSION_ID,
      userId: DEV_USER_ID,
      lang: "en",
      mode: "chapter",
      questionCount: 5,
      status: "active",
      payload: {
        selectedChapter: 1,
        questionIds: ["demo-q-1", "demo-q-2", "demo-q-3", "demo-q-4", "demo-q-5"],
        currentIndex: 0,
        answers: {},
      },
    }).catch(async (error) => {
      if (!String(error?.message || "").includes("duplicate key")) throw error;
      return loadPracticeSessionRecord(DEV_USER_ID, TEST_SESSION_ID);
    });

    const updated = await updatePracticeSessionRecord({
      id: TEST_SESSION_ID,
      userId: DEV_USER_ID,
      lang: "en",
      mode: "chapter",
      questionCount: 5,
      status: "completed",
      payload: {
        selectedChapter: 1,
        questionIds: ["demo-q-1", "demo-q-2", "demo-q-3", "demo-q-4", "demo-q-5"],
        currentIndex: 4,
        answers: {
          "demo-q-1": { selected_answer_id: "A", submitted: true, is_correct: true },
          "demo-q-2": { selected_answer_id: "B", submitted: true, is_correct: false },
        },
        submitted_correct: 1,
        submitted_total: 2,
      },
    });

    const loaded = await loadPracticeSessionRecord(DEV_USER_ID, TEST_SESSION_ID);

    return NextResponse.json({
      ok: true,
      service: "practice-session-bootstrap-check",
      created,
      updated,
      loaded,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "practice-session-bootstrap-check",
        error: error instanceof Error ? error.message : "Unknown practice bootstrap error",
      },
      { status: 500 }
    );
  }
}

