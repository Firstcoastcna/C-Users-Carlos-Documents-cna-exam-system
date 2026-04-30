import { NextResponse } from "next/server";
import { requireControlCenterRequestUser } from "@/app/lib/backend/auth/owner";
import {
  createAccessCodeRedemption,
  deleteSingleClassGroupEnrollment,
  deleteClassGroupEnrollments,
  loadClassGroupRecord,
  loadClassGroupEnrollmentRecord,
  loadClassGroupRoster,
  loadUserPreferences,
  deleteClassGroupRecord,
  upsertClassGroupStaff,
  upsertAccessCode,
  upsertClassGroup,
  upsertUserPreferences,
} from "@/app/lib/backend/db/client";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

function codeToken(value) {
  return String(value || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "")
    .slice(0, 18);
}

async function moveUserToIndependentHolding({ userId, schoolId, scope = "school" }) {
  const existingPrefs = await loadUserPreferences(userId);

  await upsertUserPreferences({
    userId,
    preferredLanguage: existingPrefs?.preferred_language || null,
    accessGranted: true,
    skipPracticeWelcome: !!existingPrefs?.skip_practice_welcome,
    skipExamWelcome: !!existingPrefs?.skip_exam_welcome,
    hasSeenFoundation: !!existingPrefs?.has_seen_foundation,
    hasSeenCategoryIntro: !!existingPrefs?.has_seen_category_intro,
  });

  if (scope !== "school" || !schoolId) {
    return { ok: true, scope: "owner", schoolId: null, accessCodeId: null };
  }

  const schoolToken = codeToken(schoolId) || "SCHOOL";
  const holdingCode = await upsertAccessCode({
    id: `accesscode_independent_hold_${String(schoolId).toLowerCase().replace(/[^a-z0-9]+/g, "_")}`,
    code: `HOLD-${schoolToken}`,
    codeType: "independent",
    label: "System independent holding",
    status: "active",
    schoolId,
    classGroupId: null,
    grantsAccess: true,
    maxRedemptions: null,
    metadata: {
      system_generated: true,
      purpose: "holding",
      visibility: "internal",
    },
  });

  await createAccessCodeRedemption({
    id: `redemption:${holdingCode.id}:${userId}`,
    accessCodeId: holdingCode.id,
    userId,
  });

  return { ok: true, scope: "school", schoolId, accessCodeId: holdingCode.id };
}

export async function POST(request) {
  try {
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: true });
    const body = await request.json().catch(() => ({}));
    const schoolId = String(body?.schoolId || "").trim();
    const name = String(body?.name || "").trim();
    const code = String(body?.code || "").trim().toUpperCase();
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);

    if (!schoolId) {
      return NextResponse.json(
        { ok: false, service: "admin-class-groups", error: "School selection is required." },
        { status: 400 }
      );
    }

    if (!name) {
      return NextResponse.json(
        { ok: false, service: "admin-class-groups", error: "Class name is required." },
        { status: 400 }
      );
    }

    if (viewerRole === "school_admin" && !allowedSchoolIds.has(schoolId)) {
      return NextResponse.json(
        { ok: false, service: "admin-class-groups", error: "School admins can only create classes inside their own school." },
        { status: 403 }
      );
    }

    if (viewerRole === "teacher" && !allowedSchoolIds.has(schoolId)) {
      return NextResponse.json(
        { ok: false, service: "admin-class-groups", error: "Teachers can only create classes inside their own school." },
        { status: 403 }
      );
    }

    const generatedId =
      typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
        ? `classgroup_${crypto.randomUUID().replace(/-/g, "").slice(0, 20)}`
        : `classgroup_${slugify(name)}_${Date.now().toString(36)}`;
    const id = String(body?.id || generatedId).trim();
    const classGroup = await upsertClassGroup({
      id,
      schoolId,
      name,
      code: code || null,
      status: String(body?.status || "active").trim() || "active",
      startsOn: body?.startsOn || null,
      endsOn: body?.endsOn || null,
    });

    if (viewerRole === "teacher") {
      await upsertClassGroupStaff({
        id: `classstaff:${classGroup.id}:${viewer.userId}`,
        classGroupId: classGroup.id,
        userId: viewer.userId,
        role: "teacher",
      });
    }

    return NextResponse.json({
      ok: true,
      service: "admin-class-groups",
      classGroup,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown class create error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      { ok: false, service: "admin-class-groups", error: message },
      { status }
    );
  }
}

export async function DELETE(request) {
  try {
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: false });
    const classGroupId = new URL(request.url).searchParams.get("id") || "";
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);

    if (!classGroupId) {
      return NextResponse.json(
        { ok: false, service: "admin-class-groups", error: "Class id is required." },
        { status: 400 }
      );
    }

    if (viewerRole === "school_admin") {
      const classGroup = await loadClassGroupRecord(classGroupId);
      if (!classGroup || !allowedSchoolIds.has(String(classGroup.school_id || ""))) {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "School admins can only delete classes inside their own school." },
          { status: 403 }
        );
      }
    }

    const result = await deleteClassGroupRecord(classGroupId);
    return NextResponse.json({
      ok: true,
      service: "admin-class-groups",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown class delete error.";
    const status =
      message.includes("authorized") || message.includes("sign in")
        ? 403
        : message.includes("Delete") || message.includes("still has") || message.includes("already has")
          ? 400
          : 500;

    return NextResponse.json(
      { ok: false, service: "admin-class-groups", error: message },
      { status }
    );
  }
}

export async function PATCH(request) {
  try {
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: true });
    const body = await request.json().catch(() => ({}));
    const classGroupId = String(body?.id || "").trim();
    const action = String(body?.action || "").trim();
    const enrollmentId = String(body?.enrollmentId || "").trim();
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedClassGroupIds = new Set(viewer?.allowedClassGroupIds || []);
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);

    if (!action) {
      return NextResponse.json(
        { ok: false, service: "admin-class-groups", error: "Class action is required." },
        { status: 400 }
      );
    }

    if (action === "clear-enrollments") {
      if (viewerRole === "teacher") {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "Teachers cannot clear an entire class roster." },
          { status: 403 }
        );
      }

      if (!classGroupId) {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "Class id is required." },
          { status: 400 }
        );
      }

      const classGroup = await loadClassGroupRecord(classGroupId);
      if (!classGroup) {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "That class could not be found." },
          { status: 404 }
        );
      }

      if (viewerRole === "school_admin" && !allowedSchoolIds.has(String(classGroup.school_id || ""))) {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "School admins can only manage classes inside their own school." },
          { status: 403 }
        );
      }

      const roster = await loadClassGroupRoster(classGroupId);
      const userIds = Array.from(new Set((roster || []).map((row) => row.user_id).filter(Boolean)));
      for (const userId of userIds) {
        await moveUserToIndependentHolding({
          userId,
          schoolId: String(classGroup.school_id || ""),
          scope: viewerRole === "owner" ? "owner" : "school",
        });
      }

      const result = await deleteClassGroupEnrollments(classGroupId);
      return NextResponse.json({
        ok: true,
        service: "admin-class-groups",
        moved_to_independent: userIds.length,
        ...result,
      });
    }

    if (action === "remove-enrollment") {
      if (!enrollmentId) {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "Enrollment id is required." },
          { status: 400 }
        );
      }

      if (viewerRole === "teacher") {
        const enrollment = await loadClassGroupEnrollmentRecord(enrollmentId);
        if (!enrollment || !allowedClassGroupIds.has(String(enrollment.class_group_id || ""))) {
          return NextResponse.json(
            { ok: false, service: "admin-class-groups", error: "Teachers can only remove students from their assigned classes." },
            { status: 403 }
          );
        }
      }

      const enrollment = await loadClassGroupEnrollmentRecord(enrollmentId);
      if (!enrollment) {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "That class enrollment could not be found." },
          { status: 404 }
        );
      }

      const classGroup = await loadClassGroupRecord(String(enrollment.class_group_id || ""));
      if (!classGroup) {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "That class could not be found." },
          { status: 404 }
        );
      }

      if (viewerRole === "school_admin" && !allowedSchoolIds.has(String(classGroup.school_id || ""))) {
        return NextResponse.json(
          { ok: false, service: "admin-class-groups", error: "School admins can only manage classes inside their own school." },
          { status: 403 }
        );
      }

      await moveUserToIndependentHolding({
        userId: String(enrollment.user_id || ""),
        schoolId: String(classGroup.school_id || ""),
        scope: viewerRole === "owner" ? "owner" : "school",
      });

      const result = await deleteSingleClassGroupEnrollment(enrollmentId);
      return NextResponse.json({
        ok: true,
        service: "admin-class-groups",
        moved_to_independent: 1,
        ...result,
      });
    }

    return NextResponse.json(
      { ok: false, service: "admin-class-groups", error: "Unsupported class action." },
      { status: 400 }
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown class update error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      { ok: false, service: "admin-class-groups", error: message },
      { status }
    );
  }
}
