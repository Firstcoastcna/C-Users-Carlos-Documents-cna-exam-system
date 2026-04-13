import { NextResponse } from "next/server";
import { deleteExamAttemptsForUser } from "@/app/lib/backend/db/client";

const DEV_APP_USER_ID = "dev-local-user";
const DEV_BOOTSTRAP_USER_ID = "dev-exam-bootstrap-user";
const DEV_SERVER_TEST_USER_ID = "dev-exam-server-user";

async function handleReset() {
  const [appReset, bootstrapReset, serverTestReset] = await Promise.all([
    deleteExamAttemptsForUser(DEV_APP_USER_ID),
    deleteExamAttemptsForUser(DEV_BOOTSTRAP_USER_ID),
    deleteExamAttemptsForUser(DEV_SERVER_TEST_USER_ID),
  ]);

  return NextResponse.json({
    ok: true,
    service: "exam-attempts-dev-reset",
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
        service: "exam-attempts-dev-reset",
        error: error instanceof Error ? error.message : "Unknown exam reset error",
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
        service: "exam-attempts-dev-reset",
        error: error instanceof Error ? error.message : "Unknown exam reset error",
      },
      { status: 500 }
    );
  }
}
