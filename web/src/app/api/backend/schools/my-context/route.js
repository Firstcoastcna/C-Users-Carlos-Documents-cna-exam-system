import { NextResponse } from "next/server";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";
import { loadSchoolContextForUser } from "@/app/lib/backend/db/client";

export async function GET(request) {
  try {
    const resolved = await resolveBackendRequestUser(request, null, "School User");
    const context = await loadSchoolContextForUser(resolved.userId);

    return NextResponse.json({
      ok: true,
      service: "schools-my-context",
      user: {
        id: resolved.userId,
        source: resolved.source,
        appUser: resolved.appUser,
      },
      context,
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
