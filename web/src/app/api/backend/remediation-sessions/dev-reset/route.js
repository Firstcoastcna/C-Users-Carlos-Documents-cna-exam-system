import { NextResponse } from "next/server";
import { deleteRemediationSessionsForUser } from "@/app/lib/backend/db/client";

const DEV_APP_USER_ID = "dev-local-user";
const DEV_BOOTSTRAP_USER_ID = "dev-remediation-bootstrap-user";
const DEV_SERVER_TEST_USER_ID = "dev-remediation-server-user";

async function handleReset() {
  const [appReset, bootstrapReset, serverTestReset] = await Promise.all([
    deleteRemediationSessionsForUser(DEV_APP_USER_ID),
    deleteRemediationSessionsForUser(DEV_BOOTSTRAP_USER_ID),
    deleteRemediationSessionsForUser(DEV_SERVER_TEST_USER_ID),
  ]);

  return NextResponse.json({
    ok: true,
    service: "remediation-sessions-dev-reset",
    appReset,
    bootstrapReset,
    serverTestReset,
  });
}

export async function GET() {
  try {
    return await handleReset();
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "remediation-sessions-dev-reset",
        error: error instanceof Error ? error.message : "Unknown remediation reset error",
      },
      { status: 500 }
    );
  }
}

export async function POST() {
  try {
    return await handleReset();
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "remediation-sessions-dev-reset",
        error: error instanceof Error ? error.message : "Unknown remediation reset error",
      },
      { status: 500 }
    );
  }
}
