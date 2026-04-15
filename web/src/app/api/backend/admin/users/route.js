import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  createManagedAuthUser,
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

    if (!email) {
      return NextResponse.json({ ok: false, service: "admin-create-user", error: "Email is required." }, { status: 400 });
    }

    if (!password) {
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

    const { authUser, appUser } = await createManagedAuthUser({
      email,
      password,
      fullName,
      emailConfirmed: true,
    });

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
