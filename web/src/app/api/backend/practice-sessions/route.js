import { NextResponse } from "next/server";
import {
  createPracticeSessionRecord,
  loadPracticeSessionRecord,
  loadPracticeSessionRecords,
  updatePracticeSessionRecord,
} from "@/app/lib/backend/db/client";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const lang = searchParams.get("lang");
    const { userId } = await resolveBackendRequestUser(request, null, "Practice Student");

    if (sessionId) {
      const session = await loadPracticeSessionRecord(userId, sessionId);
      return NextResponse.json({
        ok: true,
        service: "practice-sessions",
        session,
      });
    }

    const sessions = await loadPracticeSessionRecords(userId, lang);
    return NextResponse.json({
      ok: true,
      service: "practice-sessions",
      sessions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "practice-sessions",
        error: error instanceof Error ? error.message : "Unknown practice session read error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = await resolveBackendRequestUser(request, body, "Practice Student");
    const record = {
      id: body.id,
      userId,
      lang: body.lang,
      mode: body.mode,
      questionCount: body.questionCount,
      status: body.status,
      payload: body.payload,
    };

    const created = await createPracticeSessionRecord(record);
    return NextResponse.json({
      ok: true,
      service: "practice-sessions",
      session: created,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "practice-sessions",
        error: error instanceof Error ? error.message : "Unknown practice session create error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId } = await resolveBackendRequestUser(request, body, "Practice Student");
    const record = {
      id: body.id,
      userId,
      lang: body.lang,
      mode: body.mode,
      questionCount: body.questionCount,
      status: body.status,
      payload: body.payload,
    };

    const updated = await updatePracticeSessionRecord(record);
    return NextResponse.json({
      ok: true,
      service: "practice-sessions",
      session: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "practice-sessions",
        error: error instanceof Error ? error.message : "Unknown practice session update error",
      },
      { status: 500 }
    );
  }
}
