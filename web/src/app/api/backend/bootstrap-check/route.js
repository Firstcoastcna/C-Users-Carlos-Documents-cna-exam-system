import { NextResponse } from "next/server";
import { loadAppUser, upsertAppUser } from "@/app/lib/backend/db/client";

const TEST_USER = {
  id: "dev-local-user",
  email: "dev-local-user@study.firstcoastcna.com",
  fullName: "Local Dev User",
};

export async function GET() {
  try {
    const saved = await upsertAppUser(TEST_USER);
    const loaded = await loadAppUser(TEST_USER.id);

    return NextResponse.json({
      ok: true,
      service: "bootstrap-check",
      wroteUser: saved,
      readUser: loaded,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "bootstrap-check",
        error: error instanceof Error ? error.message : "Unknown bootstrap error",
      },
      { status: 500 }
    );
  }
}
