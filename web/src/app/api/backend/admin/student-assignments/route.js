import { NextResponse } from "next/server";
import { requireControlCenterRequestUser } from "@/app/lib/backend/auth/owner";
import { loadAppUser, loadSchoolContextForUser, upsertClassGroupEnrollment } from "@/app/lib/backend/db/client";

export async function PATCH(request) {
  try {
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: true });
    const body = await request.json().catch(() => ({}));
    const userId = String(body?.userId || "").trim();
    const classGroupId = String(body?.classGroupId || "").trim();

    if (!userId || !classGroupId) {
      return NextResponse.json(
        { ok: false, service: "admin-student-assignments", error: "Student and class are required." },
        { status: 400 }
      );
    }

    const appUser = await loadAppUser(userId);
    if (!appUser) {
      return NextResponse.json(
        { ok: false, service: "admin-student-assignments", error: "Student could not be found." },
        { status: 404 }
      );
    }

    if (String(appUser.account_role || "student").toLowerCase() !== "student") {
      return NextResponse.json(
        {
          ok: false,
          service: "admin-student-assignments",
          error: "Only users with the student role can be assigned to a class as students.",
        },
        { status: 400 }
      );
    }

    if (String(viewer?.role || "").toLowerCase() === "teacher") {
      const allowedClassGroupIds = new Set(viewer?.allowedClassGroupIds || []);
      if (!allowedClassGroupIds.has(classGroupId)) {
        return NextResponse.json(
          {
            ok: false,
            service: "admin-student-assignments",
            error: "Teachers can only move students into their assigned classes.",
          },
          { status: 403 }
        );
      }

      const studentContext = await loadSchoolContextForUser(userId).catch(() => ({ enrollments: [] }));
      const activeStudentClasses = (studentContext?.enrollments || [])
        .filter((row) => String(row?.role || "").toLowerCase() === "student" && String(row?.status || "").toLowerCase() === "active")
        .map((row) => row?.class_group_id)
        .filter(Boolean);

      if (activeStudentClasses.length && !activeStudentClasses.every((id) => allowedClassGroupIds.has(id))) {
        return NextResponse.json(
          {
            ok: false,
            service: "admin-student-assignments",
            error: "Teachers can only move students between classes they are assigned to.",
          },
          { status: 403 }
        );
      }
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
