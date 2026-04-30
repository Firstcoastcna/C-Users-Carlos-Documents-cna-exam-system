import { NextResponse } from "next/server";
import { requireControlCenterRequestUser } from "@/app/lib/backend/auth/owner";
import {
  deleteAccessCodeRecord,
  loadAccessCodeByCode,
  loadAccessCodeRecord,
  loadClassGroupRecord,
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
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: true });
    const body = await request.json().catch(() => ({}));
    const code = String(body?.code || "").trim().toUpperCase();
    const codeType = String(body?.codeType || "").trim();
    const schoolId = String(body?.schoolId || "").trim() || null;
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);
    const allowedClassGroupIds = new Set(viewer?.allowedClassGroupIds || []);

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

    const requestedId = String(body?.id || `accesscode_${slugify(code)}`).trim();
    const existingCode = await loadAccessCodeByCode(code);
    if (existingCode && String(existingCode.id || "") !== requestedId) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "That code is already in use. Choose a different one." },
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

    const classGroup = classGroupId ? await loadClassGroupRecord(classGroupId) : null;
    const resolvedSchoolId = classGroupId
      ? String(classGroup?.school_id || "")
      : String(schoolId || "");

    if (viewerRole === "teacher") {
      if (codeType !== "class" || !classGroupId || !allowedClassGroupIds.has(classGroupId)) {
        return NextResponse.json(
          { ok: false, service: "admin-access-codes", error: "Teachers can only create class codes for their own classes." },
          { status: 403 }
        );
      }
    }

    if (viewerRole === "school_admin") {
      if (!resolvedSchoolId || !allowedSchoolIds.has(resolvedSchoolId)) {
        return NextResponse.json(
          { ok: false, service: "admin-access-codes", error: "School admins can only create codes inside their own school." },
          { status: 403 }
        );
      }
    }

    const maxRedemptions =
      body?.maxRedemptions === "" || body?.maxRedemptions == null
        ? null
        : Number(body.maxRedemptions);

    const accessCode = await upsertAccessCode({
      id: requestedId,
      code,
      codeType,
      label: String(body?.label || "").trim() || null,
      status: String(body?.status || "active").trim() || "active",
      schoolId: resolvedSchoolId || null,
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

export async function GET(request) {
  try {
    await requireControlCenterRequestUser(request, { allowTeacher: true });
    const { searchParams } = new URL(request.url);
    const code = String(searchParams.get("check_code") || "").trim().toUpperCase();

    if (!code) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "Code value is required." },
        { status: 400 }
      );
    }

    const accessCode = await loadAccessCodeByCode(code);
    return NextResponse.json({
      ok: true,
      service: "admin-access-codes",
      exists: !!accessCode,
      code,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown access code lookup error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      { ok: false, service: "admin-access-codes", error: message },
      { status }
    );
  }
}

export async function PATCH(request) {
  try {
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: false });
    const body = await request.json().catch(() => ({}));
    const accessCodeId = String(body?.id || "").trim();
    const status = String(body?.status || "").trim();
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);

    if (!accessCodeId || !status) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "Code id and status are required." },
        { status: 400 }
      );
    }

    if (viewerRole === "school_admin") {
      const accessCode = await loadAccessCodeRecord(accessCodeId);
      const targetSchoolId =
        (accessCode?.class_group_id ? String((await loadClassGroupRecord(accessCode.class_group_id))?.school_id || "") : "") ||
        accessCode?.school_id;
      if (!targetSchoolId || !allowedSchoolIds.has(String(targetSchoolId))) {
        return NextResponse.json(
          { ok: false, service: "admin-access-codes", error: "School admins can only update codes inside their own school." },
          { status: 403 }
        );
      }
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
    const viewer = await requireControlCenterRequestUser(request, { allowTeacher: false });
    const accessCodeId = new URL(request.url).searchParams.get("id") || "";
    const viewerRole = String(viewer?.role || "").toLowerCase();
    const allowedSchoolIds = new Set(viewer?.allowedSchoolIds || []);

    if (!accessCodeId) {
      return NextResponse.json(
        { ok: false, service: "admin-access-codes", error: "Code id is required." },
        { status: 400 }
      );
    }

    if (viewerRole === "school_admin") {
      const accessCode = await loadAccessCodeRecord(accessCodeId);
      const targetSchoolId =
        (accessCode?.class_group_id ? String((await loadClassGroupRecord(accessCode.class_group_id))?.school_id || "") : "") ||
        accessCode?.school_id;
      if (!targetSchoolId || !allowedSchoolIds.has(String(targetSchoolId))) {
        return NextResponse.json(
          { ok: false, service: "admin-access-codes", error: "School admins can only delete codes inside their own school." },
          { status: 403 }
        );
      }
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
