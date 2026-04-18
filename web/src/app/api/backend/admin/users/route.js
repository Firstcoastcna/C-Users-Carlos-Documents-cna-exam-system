import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import { getPublicAppUrl } from "@/app/lib/backend/config";
import { getSupabaseServerClient } from "@/app/lib/backend/supabase/serverClient";
import {
  createManagedAuthUser,
  upsertAppUser,
  upsertSchoolStaff,
  upsertUserPreferences,
} from "@/app/lib/backend/db/client";

function normalizeRole(value) {
  const normalized = String(value || "").trim().toLowerCase();
  if (normalized === "school_admin") return "school_admin";
  if (normalized === "student") return "student";
  return "";
}

export async function POST(request) {
  try {
    await requireOwnerRequestUser(request);

    const body = await request.json().catch(() => ({}));
    const email = String(body?.email || "").trim().toLowerCase();
    const password = String(body?.password || "");
    const fullName = String(body?.fullName || "").trim();
    const role = normalizeRole(body?.role);
    const schoolId = String(body?.schoolId || "").trim();
    const supabase = getSupabaseServerClient();

    if (!email) {
      return NextResponse.json({ ok: false, service: "admin-create-user", error: "Email is required." }, { status: 400 });
    }

    if (role === "student" && !password) {
      return NextResponse.json({ ok: false, service: "admin-create-user", error: "Password is required." }, { status: 400 });
    }

    if (!role) {
      return NextResponse.json({ ok: false, service: "admin-create-user", error: "Select a user role." }, { status: 400 });
    }

    if (role === "school_admin" && !schoolId) {
      return NextResponse.json(
        { ok: false, service: "admin-create-user", error: "Choose a school for the school admin." },
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
      role === "school_admin"
        ? "/reset-password?next=/owner-access"
        : "/reset-password?next=/signin";
    const redirectTo = `${publicUrl}${redirectPath}`;

    let authUser;
    let appUser;

    if (role === "school_admin") {
      const { data: inviteData, error: inviteError } = await supabase.auth.admin.inviteUserByEmail(email, {
        redirectTo,
        data: fullName ? { full_name: fullName } : {},
      });

      if (inviteError) {
        throw new Error(`Admin invite failed: ${inviteError.message}`);
      }

      authUser = inviteData?.user;
      if (!authUser?.id) {
        throw new Error("Admin invite failed: Missing user record.");
      }

      appUser = await upsertAppUser({
        id: authUser.id,
        email: authUser.email || email,
        fullName: fullName || authUser.user_metadata?.full_name || "",
        accountRole: "school_admin",
      });
    } else {
      const created = await createManagedAuthUser({
        email,
        password,
        fullName,
        emailConfirmed: true,
        accountRole: "student",
      });
      authUser = created.authUser;
      appUser = created.appUser;
    }

    if (role === "school_admin") {
      await upsertSchoolStaff({
        id: `schoolstaff:${schoolId}:${authUser.id}`,
        schoolId,
        userId: authUser.id,
        role: "admin",
      });
    }

    if (role === "student") {
      await upsertUserPreferences({
        userId: authUser.id,
        preferredLanguage: null,
        accessGranted: false,
        skipPracticeWelcome: false,
        skipExamWelcome: false,
        hasSeenFoundation: false,
        hasSeenCategoryIntro: false,
      });
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo,
      });

      if (resetError) {
        throw new Error(`Setup email failed: ${resetError.message}`);
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
        schoolId: role === "school_admin" ? schoolId : null,
      },
      setupEmailSent: role === "school_admin" ? true : false,
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
