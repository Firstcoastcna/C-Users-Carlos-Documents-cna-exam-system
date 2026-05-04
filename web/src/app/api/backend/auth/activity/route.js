import { NextResponse } from "next/server";
import { getServerStudentSession } from "@/app/lib/backend/auth/session";
import { recordUserSignInActivity, touchUserActivity } from "@/app/lib/backend/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export async function POST(request) {
  try {
    const user = await getServerStudentSession(request);
    if (!user?.id || !user?.email) {
      return NextResponse.json({ ok: false, error: "Please sign in first." }, { status: 401 });
    }

    const body = await request.json().catch(() => ({}));
    const mode = String(body?.mode || "connect").trim().toLowerCase();
    const runActivity = mode === "touch" ? touchUserActivity : recordUserSignInActivity;
    const activity = await runActivity({
      userId: user.id,
      email: user.email,
      fullName: user.fullName || "",
      entryPath: body?.entryPath || "/signin",
      entryLabel: body?.entryLabel || null,
    });

    return NextResponse.json({ ok: true, activity });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to record sign-in activity." },
      { status: 500 }
    );
  }
}
