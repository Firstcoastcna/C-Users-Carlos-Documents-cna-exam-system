import { NextResponse } from "next/server";
import {
  createRemediationSessionRecord,
  loadRemediationSessionRecord,
  loadRemediationSessionRecords,
  updateRemediationSessionRecord,
} from "@/app/lib/backend/db/client";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const sessionId = searchParams.get("session_id");
    const lang = searchParams.get("lang");
    const { userId } = await resolveBackendRequestUser(request, null, "Remediation Student");

    if (sessionId) {
      const session = await loadRemediationSessionRecord(userId, sessionId);
      return NextResponse.json({
        ok: true,
        service: "remediation-sessions",
        session,
      });
    }

    const sessions = await loadRemediationSessionRecords(userId, lang);
    return NextResponse.json({
      ok: true,
      service: "remediation-sessions",
      sessions,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "remediation-sessions",
        error: error instanceof Error ? error.message : "Unknown remediation session read error",
      },
      { status: 500 }
    );
  }
}

export async function POST(request) {
  try {
    const body = await request.json();
    const { userId } = await resolveBackendRequestUser(request, body, "Remediation Student");

    const record = {
      id: body.id,
      userId,
      lang: body.lang,
      status: body.status,
      categories: body.categories,
      questionCount: body.questionCount,
      payload: body.payload,
    };

    const created = await createRemediationSessionRecord(record);
    return NextResponse.json({
      ok: true,
      service: "remediation-sessions",
      session: created,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "remediation-sessions",
        error: error instanceof Error ? error.message : "Unknown remediation session create error",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json();
    const { userId } = await resolveBackendRequestUser(request, body, "Remediation Student");

    const record = {
      id: body.id,
      userId,
      lang: body.lang,
      status: body.status,
      categories: body.categories,
      questionCount: body.questionCount,
      payload: body.payload,
    };

    const updated = await updateRemediationSessionRecord(record);
    return NextResponse.json({
      ok: true,
      service: "remediation-sessions",
      session: updated,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "remediation-sessions",
        error: error instanceof Error ? error.message : "Unknown remediation session update error",
      },
      { status: 500 }
    );
  }
}
