import { NextResponse } from "next/server";
import { requireControlCenterRequestUser } from "@/app/lib/backend/auth/owner";
import {
  deleteSchoolStaffRecord,
  loadSchoolStaffRecord,
  upsertSchoolStaff,
} from "@/app/lib/backend/db/client";

export async function PATCH(request) {
  try {
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: false });

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const userId = String(body?.userId || "").trim();
    const schoolId = String(body?.schoolId || "").trim();
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);

    if (!id || !userId || !schoolId) {
      return NextResponse.json(
        { ok: false, service: "admin-school-admins", error: "Admin record, user, and school are required." },
        { status: 400 }
      );
    }

    if (viewerRole === "school_admin" && !allowedSchoolIds.has(schoolId)) {
      return NextResponse.json(
        { ok: false, service: "admin-school-admins", error: "School admins can only manage admin assignments inside their own school." },
        { status: 403 }
      );
    }

    const record = await upsertSchoolStaff({
      id,
      schoolId,
      userId,
      role: "admin",
    });

    return NextResponse.json({
      ok: true,
      service: "admin-school-admins",
      schoolAdmin: record,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown school-admin update error.";
    const status = message.includes("authorized") || message.includes("sign in")
      ? 403
      : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-school-admins",
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
        { ok: false, service: "admin-school-admins", error: "School admin record id is required." },
        { status: 400 }
      );
    }

    if (viewerRole === "school_admin") {
      const record = await loadSchoolStaffRecord(id);
      if (!record || !allowedSchoolIds.has(String(record.school_id || ""))) {
        return NextResponse.json(
          { ok: false, service: "admin-school-admins", error: "School admins can only remove admin assignments inside their own school." },
          { status: 403 }
        );
      }
    }

    const record = await loadSchoolStaffRecord(id);
    if (!record) {
      return NextResponse.json(
        { ok: false, service: "admin-school-admins", error: "School staff record could not be found." },
        { status: 404 }
      );
    }

    const normalizedRole = String(record.role || "").toLowerCase();
    const unassignedRole =
      normalizedRole === "admin"
        ? "unassigned_admin"
        : normalizedRole === "teacher"
          ? "unassigned_teacher"
          : "";

    if (!unassignedRole) {
      await deleteSchoolStaffRecord(id);
    } else {
      await upsertSchoolStaff({
        id: record.id,
        schoolId: record.school_id,
        userId: record.user_id,
        role: unassignedRole,
      });
    }

    return NextResponse.json({
      ok: true,
      service: "admin-school-admins",
      removedId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown school-admin delete error.";
    const status = message.includes("authorized") || message.includes("sign in")
      ? 403
      : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-school-admins",
        error: message,
      },
      { status }
    );
  }
}
