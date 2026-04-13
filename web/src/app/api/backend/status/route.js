import { NextResponse } from "next/server";
import { getBackendConfigSnapshot } from "@/app/lib/backend/config";
import { getDatabaseConfig } from "@/app/lib/backend/db/client";
import { getAuthConfig } from "@/app/lib/backend/auth/session";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "backend-status",
    backend: getBackendConfigSnapshot(),
    database: getDatabaseConfig(),
    auth: getAuthConfig(),
  });
}

