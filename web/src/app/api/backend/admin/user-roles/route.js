import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  deleteClassGroupEnrollmentsForUser,
  deleteClassGroupStaffRecordsForUser,
  deleteSchoolStaffRecordsForUser,
  loadAppUser,
  loadSchoolStaffForUser,
  upsertAppUser,
  upsertSchoolStaff,
} from "@/app/lib/backend/db/client";

function assertPrimaryOwner(owner) {
  if (owner?.appUser?.account_role !== "owner") {
    throw new Error("Only the owner can reassign roles.");
  }
}

function normalizeTargetRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "student" || normalized === "teacher" || normalized === "school_admin") {
    return normalized;
  }
  return "";
}

export async function PATCH(request) {
  try {
    const owner = await requireOwnerRequestUser(request);
    assertPrimaryOwner(owner);

    const body = await request.json().catch(() => ({}));
    const userId = String(body?.userId || "").trim();
    const targetRole = normalizeTargetRole(body?.targetRole);
    const schoolId = String(body?.schoolId || "").trim();

    if (!userId) {
      return NextResponse.json(
        { ok: false, service: "admin-user-roles", error: "User id is required." },
        { status: 400 }
      );
    }

    if (!targetRole) {
      return NextResponse.json(
        { ok: false, service: "admin-user-roles", error: "Choose a valid target role." },
        { status: 400 }
      );
    }

    const existingUser = await loadAppUser(userId);
    if (!existingUser) {
      return NextResponse.json(
        { ok: false, service: "admin-user-roles", error: "User could not be found." },
        { status: 404 }
      );
    }

    if (String(existingUser.account_role || "").toLowerCase() === "owner") {
      return NextResponse.json(
        { ok: false, service: "admin-user-roles", error: "Owner accounts cannot be reassigned here." },
        { status: 400 }
      );
    }

    if ((targetRole === "teacher" || targetRole === "school_admin") && !schoolId) {
      return NextResponse.json(
        {
          ok: false,
          service: "admin-user-roles",
          error: "Choose a school when promoting this user to teacher or school admin.",
        },
        { status: 400 }
      );
    }

    const existingStaff = await loadSchoolStaffForUser(userId);

    await upsertAppUser({
      id: existingUser.id,
      email: existingUser.email,
      fullName: existingUser.full_name || "",
      accountRole: targetRole,
    });

    if (targetRole === "student") {
      await deleteSchoolStaffRecordsForUser(userId);
      await deleteClassGroupStaffRecordsForUser(userId);
    } else {
      await deleteClassGroupEnrollmentsForUser(userId);
      await deleteSchoolStaffRecordsForUser(userId);
      await deleteClassGroupStaffRecordsForUser(userId);
      await upsertSchoolStaff({
        id: `schoolstaff:${schoolId}:${userId}`,
        schoolId,
        userId,
        role: targetRole === "school_admin" ? "admin" : "teacher",
      });
    }

    return NextResponse.json({
      ok: true,
      service: "admin-user-roles",
      updated: {
        userId,
        previousRole: existingUser.account_role || "student",
        previousSchoolId: existingStaff[0]?.school_id || null,
        targetRole,
        schoolId: targetRole === "student" ? null : schoolId,
      },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown user-role update error.";
    const status =
      message.includes("authorized") || message.includes("sign in") || message.includes("owner") ? 403 : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-user-roles",
        error: message,
      },
      { status }
    );
  }
}
