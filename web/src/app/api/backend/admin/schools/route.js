import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import { deleteSchoolRecord, upsertSchool } from "@/app/lib/backend/db/client";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60);
}

export async function POST(request) {
  try {
    await requireOwnerRequestUser(request);
    const body = await request.json().catch(() => ({}));
    const name = String(body?.name || "").trim();
    const slug = slugify(body?.slug || name);

    if (!name) {
      return NextResponse.json(
        { ok: false, service: "admin-schools", error: "School name is required." },
        { status: 400 }
      );
    }

    const id = String(body?.id || `school_${slug}`).trim();
    const school = await upsertSchool({
      id,
      name,
      slug: slug || null,
    });

    return NextResponse.json({
      ok: true,
      service: "admin-schools",
      school,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown school create error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      { ok: false, service: "admin-schools", error: message },
      { status }
    );
  }
}

export async function DELETE(request) {
  try {
    await requireOwnerRequestUser(request);
    const schoolId = new URL(request.url).searchParams.get("id") || "";

    if (!schoolId) {
      return NextResponse.json(
        { ok: false, service: "admin-schools", error: "School id is required." },
        { status: 400 }
      );
    }

    const result = await deleteSchoolRecord(schoolId);
    return NextResponse.json({
      ok: true,
      service: "admin-schools",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown school delete error.";
    const status =
      message.includes("authorized") || message.includes("sign in")
        ? 403
        : message.includes("Delete") || message.includes("still has")
          ? 400
          : 500;

    return NextResponse.json(
      { ok: false, service: "admin-schools", error: message },
      { status }
    );
  }
}
