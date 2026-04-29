import { NextResponse } from "next/server";
import { requireControlCenterRequestUser } from "@/app/lib/backend/auth/owner";
import {
  loadClassGroupStaffRecord,
  deleteClassGroupStaffRecord,
  loadAppUser,
  loadClassGroupRecord,
  loadSchoolStaffForUser,
  upsertClassGroupStaff,
} from "@/app/lib/backend/db/client";

export async function PATCH(request) {
  try {
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: false });

    const body = await request.json().catch(() => ({}));
    const teacherId = String(body?.teacherId || "").trim();
    const classGroupId = String(body?.classGroupId || "").trim();
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);

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

    const [appUser, classGroup, staffRows] = await Promise.all([
      loadAppUser(teacherId),
      loadClassGroupRecord(classGroupId),
      loadSchoolStaffForUser(teacherId),
    ]);

    if (!appUser) {
      return NextResponse.json(
        { ok: false, service: "admin-teacher-assignments", error: "Teacher could not be found." },
        { status: 404 }
      );
    }

    if (String(appUser.account_role || "").toLowerCase() !== "teacher") {
      return NextResponse.json(
        {
          ok: false,
          service: "admin-teacher-assignments",
          error: "Only users with the teacher role can be assigned to a class as teachers.",
        },
        { status: 400 }
      );
    }

    if (!classGroup) {
      return NextResponse.json(
        { ok: false, service: "admin-teacher-assignments", error: "Class could not be found." },
        { status: 404 }
      );
    }

    if (viewerRole === "school_admin" && !allowedSchoolIds.has(String(classGroup.school_id || ""))) {
      return NextResponse.json(
        {
          ok: false,
          service: "admin-teacher-assignments",
          error: "School admins can only assign teachers inside their own school.",
        },
        { status: 403 }
      );
    }

    const matchingSchoolStaff = staffRows.find(
      (row) =>
        String(row.school_id || "") === String(classGroup.school_id || "") &&
        String(row.role || "").toLowerCase() === "teacher"
    );

    if (!matchingSchoolStaff) {
      return NextResponse.json(
        {
          ok: false,
          service: "admin-teacher-assignments",
          error: "This teacher is not assigned to the same school as that class.",
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
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: false });

    const id = new URL(request.url).searchParams.get("id") || "";
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);
    if (!id.trim()) {
      return NextResponse.json(
        { ok: false, service: "admin-teacher-assignments", error: "Assignment id is required." },
        { status: 400 }
      );
    }

    if (viewerRole === "school_admin") {
      const assignment = await loadClassGroupStaffRecord(id);
      const classGroup = assignment?.class_group_id ? await loadClassGroupRecord(assignment.class_group_id) : null;
      if (!assignment || !classGroup || !allowedSchoolIds.has(String(classGroup.school_id || ""))) {
        return NextResponse.json(
          {
            ok: false,
            service: "admin-teacher-assignments",
            error: "School admins can only remove teacher assignments inside their own school.",
          },
          { status: 403 }
        );
      }
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
