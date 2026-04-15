import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  listAccessCodeRecords,
  listAccessCodeRedemptionRecords,
  listClassGroupRecords,
  listSchoolRecords,
  loadAppUser,
  loadClassGroupRoster,
} from "@/app/lib/backend/db/client";

function summarizeAccessCodes(codes, redemptions, usersById) {
  const redemptionsByCodeId = redemptions.reduce((acc, row) => {
    if (!acc[row.access_code_id]) acc[row.access_code_id] = [];
    acc[row.access_code_id].push(row);
    return acc;
  }, {});

  return codes.map((code) => {
    const usage = redemptionsByCodeId[code.id] || [];
    const latest = usage[0] || null;
    const latestUser = latest ? usersById[latest.user_id] || null : null;

    return {
      ...code,
      redemption_count: usage.length,
      latest_redemption_at: latest?.redeemed_at || null,
      latest_redeemer: latestUser
        ? {
            id: latestUser.id,
            full_name: latestUser.full_name || null,
            email: latestUser.email || null,
          }
        : null,
    };
  });
}

export async function GET(request) {
  try {
    const owner = await requireOwnerRequestUser(request);
    const [schools, classGroups, accessCodes, redemptions] = await Promise.all([
      listSchoolRecords(),
      listClassGroupRecords(),
      listAccessCodeRecords(),
      listAccessCodeRedemptionRecords(),
    ]);

    const rosterEntries = await Promise.all(
      classGroups.map(async (group) => ({
        classGroupId: group.id,
        roster: await loadClassGroupRoster(group.id),
      }))
    );
    const rosterByClassId = Object.fromEntries(
      rosterEntries.map((entry) => [entry.classGroupId, entry.roster])
    );

    const userIds = Array.from(new Set(redemptions.map((row) => row.user_id).filter(Boolean)));
    const users = await Promise.all(userIds.map((userId) => loadAppUser(userId)));
    const usersById = Object.fromEntries(users.filter(Boolean).map((user) => [user.id, user]));

    return NextResponse.json({
      ok: true,
      service: "admin-overview",
      owner: {
        id: owner.userId,
        email: owner.email,
        appUser: owner.appUser,
      },
      summary: {
        schoolCount: schools.length,
        classCount: classGroups.length,
        accessCodeCount: accessCodes.length,
        redemptionCount: redemptions.length,
      },
      schools,
      classGroups: classGroups.map((group) => ({
        ...group,
        roster: rosterByClassId[group.id] || [],
        enrollment_count: (rosterByClassId[group.id] || []).length,
      })),
      accessCodes: summarizeAccessCodes(accessCodes, redemptions, usersById),
      redemptions: redemptions.map((row) => ({
        ...row,
        user: usersById[row.user_id] || null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown admin overview error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-overview",
        error: message,
      },
      { status }
    );
  }
}
