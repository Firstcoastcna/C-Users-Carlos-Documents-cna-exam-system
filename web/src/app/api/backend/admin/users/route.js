import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import { getPublicAppUrl } from "@/app/lib/backend/config";
import { getSupabaseServerClient } from "@/app/lib/backend/supabase/serverClient";
import {
  createAccessCodeRedemption,
  loadAccessCodeRecord,
  loadAccessCodeRedemptionCount,
  upsertAppUser,
  upsertClassGroupEnrollment,
  upsertSchoolStaff,
  upsertUserPreferences,
} from "@/app/lib/backend/db/client";

function normalizeRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "school_admin") return "school_admin";
  if (normalized === "teacher") return "teacher";
  if (normalized === "student") return "student";
  return "";
}

function getInviteRoleLabel(role) {
  if (role === "school_admin") return "School Admin";
  if (role === "teacher") return "Teacher";
  return "Student";
}

export async function POST(request) {
  try {
    await requireOwnerRequestUser(request);

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const fullName = String(body?.fullName || "").trim();
    const role = normalizeRole(body?.role);
    const schoolId = String(body?.schoolId || "").trim();
    const classGroupId = String(body?.classGroupId || "").trim();
    const accessCodeId = String(body?.accessCodeId || "").trim();
    const supabase = getSupabaseServerClient();

    if (!email) {
      return NextResponse.json({ ok: false, service: "admin-create-user", error: "Email is required." }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ ok: false, service: "admin-create-user", error: "Select a user role." }, { status: 400 });
    }

    if ((role === "school_admin" || role === "teacher") && !schoolId) {
      return NextResponse.json(
        { ok: false, service: "admin-create-user", error: "Choose a school for this staff user." },
        { status: 400 }
      );
    }

    if (role === "student" && !classGroupId && !accessCodeId) {
      return NextResponse.json(
        {
          ok: false,
          service: "admin-create-user",
          error: "Choose an independent access code, or assign the student to a class.",
        },
        { status: 400 }
      );
    }

    if (!supabase) {
      return NextResponse.json(
        { ok: false, service: "admin-create-user", error: "Supabase server config is not configured." },
        { status: 500 }
      );
    }

    const publicUrl = String(getPublicAppUrl() || "").trim().replace(/\/+$/, "");
    const redirectPath =
      role === "school_admin" || role === "teacher"
        ? "/reset-password?next=/owner-access"
        : "/reset-password?next=/signin";
    const redirectTo = `${publicUrl}${redirectPath}`;
    const roleLabel = getInviteRoleLabel(role);

    let authUser;
    let appUser;

    if (role === "school_admin" || role === "teacher" || role === "student") {
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: {
          ...(fullName ? { full_name: fullName } : {}),
          role,
          role_label: roleLabel,
        },
      });

      if (inviteError) {
        throw new Error(`User invite failed: ${inviteError.message}`);
      }

      authUser = inviteData?.user;
      if (!authUser?.id) {
        throw new Error("User invite failed: Missing user record.");
      }

      appUser = await upsertAppUser({
        id: authUser.id,
        email: authUser.email || email,
        fullName: fullName || authUser.user_metadata?.full_name || "",
        accountRole: role === "school_admin" ? "school_admin" : role === "teacher" ? "teacher" : "student",
      });
    }

    if (role === "school_admin" || role === "teacher") {
      await upsertSchoolStaff({
        id: `schoolstaff:${schoolId}:${authUser.id}`,
        schoolId,
        userId: authUser.id,
        role: role === "school_admin" ? "admin" : "teacher",
      });
    }

    if (role === "student") {
      let accessCodeRecord = null;

      if (accessCodeId) {
        accessCodeRecord = await loadAccessCodeRecord(accessCodeId);

        if (!accessCodeRecord) {
          throw new Error("That access code could not be found.");
        }
        if (accessCodeRecord.status !== "active") {
          throw new Error("Choose an active access code.");
        }
        if (accessCodeRecord.code_type !== "independent" || accessCodeRecord.class_group_id) {
          throw new Error("Choose an independent access code for this student.");
        }
        if (Number.isFinite(accessCodeRecord.max_redemptions) && accessCodeRecord.max_redemptions >= 0) {
          const redemptionCount = await loadAccessCodeRedemptionCount(accessCodeRecord.id);
          if (redemptionCount >= accessCodeRecord.max_redemptions) {
            throw new Error("That access code has already reached its redemption limit.");
          }
        }
      }

      await upsertUserPreferences({
        userId: authUser.id,
        preferredLanguage: null,
        accessGranted: true,
        skipPracticeWelcome: false,
        skipExamWelcome: false,
        hasSeenFoundation: false,
        hasSeenCategoryIntro: false,
      });
      if (classGroupId) {
        await upsertClassGroupEnrollment({
          id: `enrollment:${classGroupId}:${authUser.id}`,
          classGroupId,
          userId: authUser.id,
          role: "student",
          status: "active",
        });
      }

      if (accessCodeRecord) {
        await createAccessCodeRedemption({
          id: `redemption:${accessCodeRecord.id}:${authUser.id}`,
          accessCodeId: accessCodeRecord.id,
          userId: authUser.id,
        });
      }
    }

    return NextResponse.json({
      ok: true,
      service: "admin-create-user",
      created: {
        id: authUser.id,
        email: authUser.email,
        fullName: appUser.full_name,
        role,
        schoolId: role === "school_admin" || role === "teacher" ? schoolId : null,
        classGroupId: role === "student" ? classGroupId || null : null,
        accessCodeId: role === "student" ? accessCodeId || null : null,
      },
      setupEmailSent: true,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown admin create-user error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-create-user",
        error: message,
      },
      { status }
    );
  }
}
