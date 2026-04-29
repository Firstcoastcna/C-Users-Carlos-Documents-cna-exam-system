import { NextResponse } from "next/server";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";
import { loadClassGroupStaffForUser, loadSchoolContextForUser } from "@/app/lib/backend/db/client";

export async function GET(request) {
  try {
    const resolved = await resolveBackendRequestUser(request, null, "School User");
    const [context, classStaff] = await Promise.all([
      loadSchoolContextForUser(resolved.userId),
      loadClassGroupStaffForUser(resolved.userId).catch(() => []),
    ]);

    return NextResponse.json({
      ok: true,
      service: "schools-my-context",
      user: {
        id: resolved.userId,
        source: resolved.source,
        appUser: resolved.appUser,
      },
      context: {
        ...(context || {}),
        classStaff: Array.isArray(classStaff) ? classStaff : [],
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "schools-my-context",
        error: error instanceof Error ? error.message : "Unknown school context error",
      },
      { status: 500 }
    );
  }
}
