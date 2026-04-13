import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    ok: true,
    service: "env-debug",
    raw: {
      NEXT_PUBLIC_APP_STORAGE_MODE: process.env.NEXT_PUBLIC_APP_STORAGE_MODE || null,
      APP_STORAGE_MODE: process.env.APP_STORAGE_MODE || null,
    },
    normalized: String(
      process.env.NEXT_PUBLIC_APP_STORAGE_MODE || process.env.APP_STORAGE_MODE || "local"
    )
      .trim()
      .toLowerCase(),
  });
}
