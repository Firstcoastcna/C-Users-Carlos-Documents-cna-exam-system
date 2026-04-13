import { NextResponse } from "next/server";
import {
  createExamAttemptRecord,
  loadExamAttemptRecord,
  loadExamAttemptRecords,
  updateExamAttemptRecord,
} from "@/app/lib/backend/db/client";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const attemptId = searchParams.get("attempt_id");
    const lang = searchParams.get("lang");
    const { userId } = await resolveBackendRequestUser(request, null, "Exam Student");

    if (attemptId) {
      const attempt = await loadExamAttemptRecord(userId, attemptId);
      return NextResponse.json({
        ok: true,
        service: "exam-attempts",
        attempt,
      });
    }

    const attempts = await loadExamAttemptRecords(userId, lang);
    return NextResponse.json({
      ok: true,
      service: "exam-attempts",
      attempts,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "exam-attempts",
        error: error instanceof Error ? error.message : "Unknown exam attempt read error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = await resolveBackendRequestUser(request, body, "Exam Student");

    const record = {
      id: body.id,
      userId,
      testId: body.testId,
      lang: body.lang,
      mode: body.mode,
      score: body.score,
      deliveredQuestionIds: body.deliveredQuestionIds,
      answersByQid: body.answersByQid,
      reviewByQid: body.reviewByQid,
      resultsPayload: body.resultsPayload,
    };

    const created = await createExamAttemptRecord(record);
    return NextResponse.json({
      ok: true,
      service: "exam-attempts",
      attempt: created,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "exam-attempts",
        error: error instanceof Error ? error.message : "Unknown exam attempt create error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId } = await resolveBackendRequestUser(request, body, "Exam Student");

    const record = {
      id: body.id,
      userId,
      testId: body.testId,
      lang: body.lang,
      mode: body.mode,
      score: body.score,
      deliveredQuestionIds: body.deliveredQuestionIds,
      answersByQid: body.answersByQid,
      reviewByQid: body.reviewByQid,
      resultsPayload: body.resultsPayload,
    };

    const updated = await updateExamAttemptRecord(record);
    return NextResponse.json({
      ok: true,
      service: "exam-attempts",
      attempt: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "exam-attempts",
        error: error instanceof Error ? error.message : "Unknown exam attempt update error",
      },
      { status: 500 }
    );
  }
}
