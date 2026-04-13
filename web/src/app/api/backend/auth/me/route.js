import { NextResponse } from "next/server";
import { getServerStudentSession } from "@/app/lib/backend/auth/session";
import { upsertAppUser } from "@/app/lib/backend/db/client";

export async function GET(request) {
  try {
    const student = await getServerStudentSession(request);
    if (!student) {
      return NextResponse.json(
        {
          ok: false,
          service: "auth-me",
          error: "No authenticated student session was found.",
        },
        { status: 401 }
      );
    }

    const appUser = await upsertAppUser({
      id: student.id,
      email: student.email || `${student.id}@study.firstcoastcna.com`,
      fullName: student.fullName,
    });

    return NextResponse.json({
      ok: true,
      service: "auth-me",
      student,
      appUser,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "auth-me",
        error: error instanceof Error ? error.message : "Unknown auth/me error",
      },
      { status: 500 }
    );
  }
}
