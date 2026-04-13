import { NextResponse } from "next/server";
import {
  loadUserPreferences,
  upsertUserPreferences,
} from "../../../lib/backend/db/client";
import { resolveBackendRequestUser } from "../../../lib/backend/auth/requestUser";

function normalizePreferences(record, userId) {
  return {
    userId,
    preferredLanguage: record?.preferred_language || null,
    accessGranted: !!record?.access_granted,
    skipPracticeWelcome: !!record?.skip_practice_welcome,
    skipExamWelcome: !!record?.skip_exam_welcome,
    hasSeenFoundation: !!record?.has_seen_foundation,
    hasSeenCategoryIntro: !!record?.has_seen_category_intro,
    createdAt: record?.created_at || null,
    updatedAt: record?.updated_at || null,
  };
}

export async function GET(request) {
  try {
    const user = await resolveBackendRequestUser(request, null, "Preferences User");
    const prefs = await loadUserPreferences(user.userId);

    return NextResponse.json({
      ok: true,
      service: "user-preferences",
      user: {
        id: user.userId,
        source: user.source,
        appUser: user.appUser,
      },
      preferences: normalizePreferences(prefs, user.userId),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "user-preferences",
        error: error instanceof Error ? error.message : "Unknown user preferences error.",
      },
      { status: 500 }
    );
  }
}

export async function PUT(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const user = await resolveBackendRequestUser(request, body, "Preferences User");
    const existing = await loadUserPreferences(user.userId);

    const next = await upsertUserPreferences({
      userId: user.userId,
      preferredLanguage:
        Object.prototype.hasOwnProperty.call(body, "preferredLanguage")
          ? body.preferredLanguage || null
          : existing?.preferred_language || null,
      accessGranted:
        Object.prototype.hasOwnProperty.call(body, "accessGranted")
          ? !!body.accessGranted
          : !!existing?.access_granted,
      skipPracticeWelcome:
        Object.prototype.hasOwnProperty.call(body, "skipPracticeWelcome")
          ? !!body.skipPracticeWelcome
          : !!existing?.skip_practice_welcome,
      skipExamWelcome:
        Object.prototype.hasOwnProperty.call(body, "skipExamWelcome")
          ? !!body.skipExamWelcome
          : !!existing?.skip_exam_welcome,
      hasSeenFoundation:
        Object.prototype.hasOwnProperty.call(body, "hasSeenFoundation")
          ? !!body.hasSeenFoundation
          : !!existing?.has_seen_foundation,
      hasSeenCategoryIntro:
        Object.prototype.hasOwnProperty.call(body, "hasSeenCategoryIntro")
          ? !!body.hasSeenCategoryIntro
          : !!existing?.has_seen_category_intro,
    });

    return NextResponse.json({
      ok: true,
      service: "user-preferences",
      user: {
        id: user.userId,
        source: user.source,
        appUser: user.appUser,
      },
      preferences: normalizePreferences(next, user.userId),
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "user-preferences",
        error: error instanceof Error ? error.message : "Unknown user preferences error.",
      },
      { status: 500 }
    );
  }
}
