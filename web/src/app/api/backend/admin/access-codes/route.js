import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  deleteAccessCodeRecord,
  updateAccessCodeStatus,
  upsertAccessCode,
} from "@/app/lib/backend/db/client";

function slugify(value) {
  return String(value || "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "")
    .slice(0, 60);
}

export async function POST(request) {
  try {
    await requireOwnerRequestUser(request);
    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || "").trim().toUpperCase();
    const codeType = String(body?.codeType || "").trim();

    if (!code) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "Code value is required." },
        { status: 400 }
      );
    }

    if (!["independent", "class"].includes(codeType)) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "Code type must be independent or class." },
        { status: 400 }
      );
    }

    const classGroupId = String(body?.classGroupId || "").trim() || null;
    if (codeType === "class" && !classGroupId) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "Class code requires a class group." },
        { status: 400 }
      );
    }

    const maxRedemptions =
      body?.maxRedemptions === "" || body?.maxRedemptions == null
        ? null
        : Number(body.maxRedemptions);

    const accessCode = await upsertAccessCode({
      id: String(body?.id || `accesscode_${slugify(code)}`).trim(),
      code,
      codeType,
      label: String(body?.label || "").trim() || null,
      status: String(body?.status || "active").trim() || "active",
      schoolId: String(body?.schoolId || "").trim() || null,
      classGroupId,
      grantsAccess: body?.grantsAccess !== false,
      maxRedemptions: Number.isFinite(maxRedemptions) ? maxRedemptions : null,
      expiresAt: body?.expiresAt || null,
      metadata: body?.metadata && typeof body.metadata === "object" ? body.metadata : {},
    });

    return NextResponse.json({
      ok: true,
      service: "admin-access-codes",
      accessCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown access code create error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      { ok: false, service: "admin-access-codes", error: message },
      { status }
    );
  }
}

export async function PATCH(request) {
  try {
    await requireOwnerRequestUser(request);
    const body = await request.json().catch(() => ({}));
    const accessCodeId = String(body?.id || "").trim();
    const status = String(body?.status || "").trim();

    if (!accessCodeId || !status) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "Code id and status are required." },
        { status: 400 }
      );
    }

    const accessCode = await updateAccessCodeStatus(accessCodeId, status);
    return NextResponse.json({
      ok: true,
      service: "admin-access-codes",
      accessCode,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown access code update error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      { ok: false, service: "admin-access-codes", error: message },
      { status }
    );
  }
}

export async function DELETE(request) {
  try {
    await requireOwnerRequestUser(request);
    const accessCodeId = new URL(request.url).searchParams.get("id") || "";

    if (!accessCodeId) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "Code id is required." },
        { status: 400 }
      );
    }

    const result = await deleteAccessCodeRecord(accessCodeId);
    return NextResponse.json({
      ok: true,
      service: "admin-access-codes",
      ...result,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown access code delete error.";
    const status =
      message.includes("authorized") || message.includes("sign in")
        ? 403
        : message.includes("redeemed")
          ? 400
          : 500;

    return NextResponse.json(
      { ok: false, service: "admin-access-codes", error: message },
      { status }
    );
  }
}
