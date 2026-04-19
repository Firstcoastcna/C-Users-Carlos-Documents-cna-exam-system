import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  deleteClassGroupStaffRecord,
  upsertClassGroupStaff,
} from "@/app/lib/backend/db/client";

export async function PATCH(request) {
  try {
    await requireOwnerRequestUser(request);

    const body = await request.json().catch(() => ({}));
    const teacherId = String(body?.teacherId || "").trim();
    const classGroupId = String(body?.classGroupId || "").trim();

    if (!teacherId || !classGroupId) {
      return NextResponse.json(
        {
          ok: false,
          service: "admin-teacher-assignments",
          error: "Teacher and class are required.",
        },
        { status: 400 }
      );
    }

    const record = await upsertClassGroupStaff({
      id: `classstaff:${classGroupId}:${teacherId}`,
      classGroupId,
      userId: teacherId,
      role: "teacher",
    });

    return NextResponse.json({
      ok: true,
      service: "admin-teacher-assignments",
      assignment: record,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown teacher assignment error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-teacher-assignments",
        error: message,
      },
      { status }
    );
  }
}

export async function DELETE(request) {
  try {
    await requireOwnerRequestUser(request);

    const id = new URL(request.url).searchParams.get("id") || "";
    if (!id.trim()) {
      return NextResponse.json(
        { ok: false, service: "admin-teacher-assignments", error: "Assignment id is required." },
        { status: 400 }
      );
    }

    await deleteClassGroupStaffRecord(id);

    return NextResponse.json({
      ok: true,
      service: "admin-teacher-assignments",
      removedId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown teacher assignment delete error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-teacher-assignments",
        error: message,
      },
      { status }
    );
  }
}
