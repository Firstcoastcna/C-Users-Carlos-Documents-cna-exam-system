import { NextResponse } from "next/server";
import { assertDatabaseReady, getDatabaseConfig } from "@/app/lib/backend/db/client";

export async function GET() {
  try {
    const result = await assertDatabaseReady();
    return NextResponse.json({
      ok: true,
      service: "database-check",
      database: getDatabaseConfig(),
      result,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "database-check",
        database: getDatabaseConfig(),
        error: error instanceof Error ? error.message : "Unknown database error",
      },
      { status: 500 }
    );
  }
}

