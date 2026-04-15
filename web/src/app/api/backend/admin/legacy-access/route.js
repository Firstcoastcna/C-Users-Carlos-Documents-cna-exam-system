import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  createAccessCodeRedemption,
  listAccessCodeRedemptionRecords,
  listAccessGrantedPreferences,
  listClassGroupEnrollments,
  loadAccessCodeByCode,
  loadAppUser,
  upsertAccessCode,
} from "@/app/lib/backend/db/client";

const LEGACY_INDEPENDENT_CODE = "FCCNA2026";

async function ensureLegacyCode() {
  const existing = await loadAccessCodeByCode(LEGACY_INDEPENDENT_CODE);
  if (existing) return existing;

  return upsertAccessCode({
    id: "accesscode_independent_fccna2026",
    code: LEGACY_INDEPENDENT_CODE,
    codeType: "independent",
    label: "Legacy Independent Access",
    status: "active",
    grantsAccess: true,
    maxRedemptions: null,
    metadata: { source: "legacy-backfill" },
  });
}

async function loadLegacyCandidates() {
  const [prefs, redemptions, enrollments] = await Promise.all([
    listAccessGrantedPreferences(),
    listAccessCodeRedemptionRecords(),
    listClassGroupEnrollments(),
  ]);

  const redeemedUserIds = new Set(redemptions.map((row) => row.user_id).filter(Boolean));
  const enrolledUserIds = new Set(enrollments.map((row) => row.user_id).filter(Boolean));

  const candidates = prefs.filter((pref) => {
    if (!pref?.user_id) return false;
    if (redeemedUserIds.has(pref.user_id)) return false;
    if (enrolledUserIds.has(pref.user_id)) return false;
    return true;
  });

  const users = await Promise.all(candidates.map((pref) => loadAppUser(pref.user_id)));
  return candidates.map((pref, index) => ({
    preference: pref,
    user: users[index] || null,
  }));
}

export async function GET(request) {
  try {
    const owner = await requireOwnerRequestUser(request);
    const code = await ensureLegacyCode();
    const candidates = await loadLegacyCandidates();

    return NextResponse.json({
      ok: true,
      service: "admin-legacy-access",
      owner: {
        id: owner.userId,
        email: owner.email,
      },
      code: {
        id: code.id,
        code: code.code,
      },
      summary: {
        candidateCount: candidates.length,
      },
      candidates: candidates.map((item) => ({
        userId: item.preference.user_id,
        preferredLanguage: item.preference.preferred_language || null,
        user: item.user,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown legacy access preview error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-legacy-access",
        error: message,
      },
      { status }
    );
  }
}

export async function POST(request) {
  try {
    const owner = await requireOwnerRequestUser(request);
    const code = await ensureLegacyCode();
    const candidates = await loadLegacyCandidates();

    const created = [];
    for (const item of candidates) {
      const userId = item.preference.user_id;
      const redemption = await createAccessCodeRedemption({
        id: `redemption:${code.id}:${userId}`,
        accessCodeId: code.id,
        userId,
        redeemedAt: item.preference.updated_at || item.preference.created_at || new Date().toISOString(),
      });
      created.push(redemption);
    }

    return NextResponse.json({
      ok: true,
      service: "admin-legacy-access",
      owner: {
        id: owner.userId,
        email: owner.email,
      },
      code: {
        id: code.id,
        code: code.code,
      },
      summary: {
        createdCount: created.length,
      },
      created,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown legacy access backfill error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-legacy-access",
        error: message,
      },
      { status }
    );
  }
}
