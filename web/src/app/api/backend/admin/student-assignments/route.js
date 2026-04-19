import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import { upsertClassGroupEnrollment } from "@/app/lib/backend/db/client";

export async function PATCH(request) {
  try {
    await requireOwnerRequestUser(request);
    const body = await request.json().catch(() => ({}));
    const userId = String(body?.userId || "").trim();
    const classGroupId = String(body?.classGroupId || "").trim();

    if (!userId || !classGroupId) {
      return NextResponse.json(
        { ok: false, service: "admin-student-assignments", error: "Student and class are required." },
        { status: 400 }
      );
    }

    const enrollment = await upsertClassGroupEnrollment({
      id: `enrollment:${classGroupId}:${userId}`,
      classGroupId,
      userId,
      role: "student",
      status: "active",
    });

    return NextResponse.json({
      ok: true,
      service: "admin-student-assignments",
      enrollment,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown student assignment error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      { ok: false, service: "admin-student-assignments", error: message },
      { status }
    );
  }
}
