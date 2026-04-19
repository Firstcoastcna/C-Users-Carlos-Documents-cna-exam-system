import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  deleteSchoolStaffRecord,
  upsertSchoolStaff,
} from "@/app/lib/backend/db/client";

function assertPrimaryOwner(owner) {
  if (owner?.appUser?.account_role !== "owner") {
    throw new Error("Only the owner can manage school admins.");
  }
}

export async function PATCH(request) {
  try {
    const owner = await requireOwnerRequestUser(request);
    assertPrimaryOwner(owner);

    const body = await request.json().catch(() => ({}));
    const id = String(body?.id || "").trim();
    const userId = String(body?.userId || "").trim();
    const schoolId = String(body?.schoolId || "").trim();

    if (!id || !userId || !schoolId) {
      return NextResponse.json(
        { ok: false, service: "admin-school-admins", error: "Admin record, user, and school are required." },
        { status: 400 }
      );
    }

    const record = await upsertSchoolStaff({
      id,
      schoolId,
      userId,
      role: "admin",
    });

    return NextResponse.json({
      ok: true,
      service: "admin-school-admins",
      schoolAdmin: record,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown school-admin update error.";
    const status = message.includes("authorized") || message.includes("sign in") || message.includes("owner")
      ? 403
      : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-school-admins",
        error: message,
      },
      { status }
    );
  }
}

export async function DELETE(request) {
  try {
    const owner = await requireOwnerRequestUser(request);
    assertPrimaryOwner(owner);

    const id = new URL(request.url).searchParams.get("id") || "";
    if (!id.trim()) {
      return NextResponse.json(
        { ok: false, service: "admin-school-admins", error: "School admin record id is required." },
        { status: 400 }
      );
    }

    await deleteSchoolStaffRecord(id);

    return NextResponse.json({
      ok: true,
      service: "admin-school-admins",
      removedId: id,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown school-admin delete error.";
    const status = message.includes("authorized") || message.includes("sign in") || message.includes("owner")
      ? 403
      : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-school-admins",
        error: message,
      },
      { status }
    );
  }
}
