import { NextResponse } from "next/server";
import {
  createExamAttemptRecord,
  loadExamAttemptRecord,
  updateExamAttemptRecord,
  upsertAppUser,
} from "@/app/lib/backend/db/client";

const DEV_USER_ID = "dev-exam-bootstrap-user";
const TEST_ATTEMPT_ID = "exam-server-test-001";

export async function GET() {
  try {
    await upsertAppUser({
      id: DEV_USER_ID,
      email: "dev-exam-bootstrap-user@study.firstcoastcna.com",
      fullName: "Exam Bootstrap User",
    });

    const created = await createExamAttemptRecord({
      id: TEST_ATTEMPT_ID,
      userId: DEV_USER_ID,
      testId: 1,
      lang: "en",
      mode: "exam",
      score: null,
      deliveredQuestionIds: ["Q00001", "Q00002", "Q00003", "Q00004", "Q00005"],
      answersByQid: {},
      reviewByQid: {},
      resultsPayload: {
        state: {
          exam_form_id: "form_001",
          index: 0,
          summaryPage: 1,
          summaryFilter: "all",
          endAtMs: Date.now() + 60_000,
          pausedRemainingSec: 60,
        },
        final: null,
      },
    }).catch(async (error) => {
      if (!String(error?.message || "").includes("duplicate key")) throw error;
      return loadExamAttemptRecord(DEV_USER_ID, TEST_ATTEMPT_ID);
    });

    const updated = await updateExamAttemptRecord({
      id: TEST_ATTEMPT_ID,
      userId: DEV_USER_ID,
      testId: 1,
      lang: "en",
      mode: "finished",
      score: 80,
      deliveredQuestionIds: ["Q00001", "Q00002", "Q00003", "Q00004", "Q00005"],
      answersByQid: {
        Q00001: "A",
        Q00002: "B",
      },
      reviewByQid: {
        Q00004: true,
      },
      resultsPayload: {
        state: {
          exam_form_id: "form_001",
          index: 4,
          summaryPage: 1,
          summaryFilter: "all",
          endAtMs: null,
          pausedRemainingSec: null,
        },
        final: {
          attempt_id: TEST_ATTEMPT_ID,
          score_percent: 80,
          did_pass: true,
        },
      },
    });

    const loaded = await loadExamAttemptRecord(DEV_USER_ID, TEST_ATTEMPT_ID);

    return NextResponse.json({
      ok: true,
      service: "exam-attempt-bootstrap-check",
      created,
      updated,
      loaded,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "exam-attempt-bootstrap-check",
        error: error instanceof Error ? error.message : "Unknown exam bootstrap error",
      },
      { status: 500 }
    );
  }
}
