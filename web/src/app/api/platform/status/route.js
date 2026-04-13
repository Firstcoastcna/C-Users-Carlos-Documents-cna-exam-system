import { NextResponse } from "next/server";
import { getBackendConfigSnapshot } from "@/app/lib/backend/config";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "platform-status",
    backend: getBackendConfigSnapshot(),
  });
}

