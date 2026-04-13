import { NextResponse } from "next/server";
import { deletePracticeSessionsForUser } from "@/app/lib/backend/db/client";

const DEV_APP_USER_ID = "dev-local-user";
const DEV_BOOTSTRAP_USER_ID = "dev-bootstrap-user";
const DEV_SERVER_TEST_USER_ID = "dev-practice-server-user";

async function runReset() {
  const appReset = await deletePracticeSessionsForUser(DEV_APP_USER_ID);
  const bootstrapReset = await deletePracticeSessionsForUser(DEV_BOOTSTRAP_USER_ID);
  const serverTestReset = await deletePracticeSessionsForUser(DEV_SERVER_TEST_USER_ID);

  return {
    ok: true,
    service: "practice-sessions-dev-reset",
    appReset,
    bootstrapReset,
    serverTestReset,
  };
}

export async function GET() {
  try {
    return NextResponse.json(await runReset());
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "practice-sessions-dev-reset",
        error: error instanceof Error ? error.message : "Unknown dev reset error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  return GET();
}
