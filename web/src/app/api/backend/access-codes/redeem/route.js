import { NextResponse } from "next/server";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";
import {
  createAccessCodeRedemption,
  loadAccessCodeByCode,
  loadAccessCodeRedemptionCount,
  loadAccessCodeRedemptionForUser,
  loadSchoolContextForUser,
  loadUserPreferences,
  upsertAccessCode,
  upsertClassGroup,
  upsertClassGroupEnrollment,
  upsertSchool,
  upsertUserPreferences,
} from "@/app/lib/backend/db/client";

const LEGACY_INDEPENDENT_CODE = "FCCNA2026";
const DEMO_CLASS_CODE = "SPRING-A";
const DEMO_SCHOOL_ID = "school_firstcoastcna_demo";
const DEMO_CLASS_GROUP_ID = "classgroup_spring_demo_a";

async function ensureFallbackAccessCode(code) {
  if (code === LEGACY_INDEPENDENT_CODE) {
    return upsertAccessCode({
      id: "accesscode_independent_fccna2026",
      code,
      codeType: "independent",
      label: "Legacy Independent Access",
      status: "active",
      grantsAccess: true,
      maxRedemptions: null,
      metadata: { source: "legacy-fallback" },
    });
  }

  if (code === DEMO_CLASS_CODE) {
    await upsertSchool({
      id: DEMO_SCHOOL_ID,
      name: "First Coast CNA Demo School",
      slug: "firstcoastcna-demo",
    });

    await upsertClassGroup({
      id: DEMO_CLASS_GROUP_ID,
      schoolId: DEMO_SCHOOL_ID,
      name: "Spring Demo Cohort A",
      code,
      status: "active",
    });

    return upsertAccessCode({
      id: "accesscode_class_spring_a",
      code,
      codeType: "class",
      label: "Spring Demo Cohort A",
      status: "active",
      schoolId: DEMO_SCHOOL_ID,
      classGroupId: DEMO_CLASS_GROUP_ID,
      grantsAccess: true,
      maxRedemptions: null,
      metadata: { source: "demo-fallback" },
    });
  }

  return null;
}

function normalizeCodeRecord(record) {
  if (!record) return null;

  return {
    id: record.id,
    code: record.code,
    codeType: record.code_type,
    label: record.label || null,
    status: record.status,
    schoolId: record.school_id || null,
    classGroupId: record.class_group_id || null,
    grantsAccess: !!record.grants_access,
    maxRedemptions: Number.isFinite(record.max_redemptions) ? record.max_redemptions : null,
    expiresAt: record.expires_at || null,
    metadata: record.metadata || {},
  };
}

export async function POST(request) {
  try {
    const body = await request.json().catch(() => ({}));
    const rawCode = typeof body?.code === "string" ? body.code.trim().toUpperCase() : "";
    const preferredLanguage =
      typeof body?.preferredLanguage === "string" && body.preferredLanguage.trim()
        ? body.preferredLanguage.trim()
        : null;

    if (!rawCode) {
      return NextResponse.json(
        {
          ok: false,
          service: "access-code-redeem",
          error: "Please enter an access code.",
        },
        { status: 400 }
      );
    }

    const resolved = await resolveBackendRequestUser(request, body, "Access Code Student");
    const userId = resolved.userId;

    let codeRecord = await loadAccessCodeByCode(rawCode);
    if (!codeRecord) {
      codeRecord = await ensureFallbackAccessCode(rawCode);
    }

    if (!codeRecord) {
      return NextResponse.json(
        {
          ok: false,
          service: "access-code-redeem",
          error: "Invalid access code.",
        },
        { status: 404 }
      );
    }

    if (codeRecord.status !== "active") {
      return NextResponse.json(
        {
          ok: false,
          service: "access-code-redeem",
          error: "This access code is not active.",
        },
        { status: 400 }
      );
    }

    if (codeRecord.expires_at && new Date(codeRecord.expires_at).getTime() < Date.now()) {
      return NextResponse.json(
        {
          ok: false,
          service: "access-code-redeem",
          error: "This access code has expired.",
        },
        { status: 400 }
      );
    }

    const existingRedemption = await loadAccessCodeRedemptionForUser(codeRecord.id, userId);
    if (!existingRedemption && Number.isFinite(codeRecord.max_redemptions) && codeRecord.max_redemptions >= 0) {
      const redemptionCount = await loadAccessCodeRedemptionCount(codeRecord.id);
      if (redemptionCount >= codeRecord.max_redemptions) {
        return NextResponse.json(
          {
            ok: false,
            service: "access-code-redeem",
            error: "This access code has reached its limit.",
          },
          { status: 400 }
        );
      }
    }

    const redemption =
      existingRedemption ||
      (await createAccessCodeRedemption({
        id: `redemption:${codeRecord.id}:${userId}`,
        accessCodeId: codeRecord.id,
        userId,
      }));

    let enrollment = null;
    if (codeRecord.code_type === "class" && codeRecord.class_group_id) {
      enrollment = await upsertClassGroupEnrollment({
        id: `enrollment:${codeRecord.class_group_id}:${userId}`,
        classGroupId: codeRecord.class_group_id,
        userId,
        role: "student",
        status: "active",
      });
    }

    const existingPrefs = await loadUserPreferences(userId);
    const preferences = await upsertUserPreferences({
      userId,
      preferredLanguage: preferredLanguage ?? existingPrefs?.preferred_language ?? null,
      accessGranted: codeRecord.grants_access !== false,
      skipPracticeWelcome: !!existingPrefs?.skip_practice_welcome,
      skipExamWelcome: !!existingPrefs?.skip_exam_welcome,
      hasSeenFoundation: !!existingPrefs?.has_seen_foundation,
      hasSeenCategoryIntro: !!existingPrefs?.has_seen_category_intro,
    });

    const schoolContext = await loadSchoolContextForUser(userId);

    return NextResponse.json({
      ok: true,
      service: "access-code-redeem",
      user: {
        id: userId,
        source: resolved.source,
        appUser: resolved.appUser,
      },
      code: normalizeCodeRecord(codeRecord),
      redemption,
      enrollment,
      preferences: {
        userId,
        preferredLanguage: preferences?.preferred_language || null,
        accessGranted: !!preferences?.access_granted,
      },
      schoolContext,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "access-code-redeem",
        error: error instanceof Error ? error.message : "Unknown access code redeem error.",
      },
      { status: 500 }
    );
  }
}
