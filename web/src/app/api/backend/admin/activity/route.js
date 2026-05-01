import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  listUserSignInActivityRecords,
  listSchoolStaffRecords,
  listClassGroupStaffRecords,
  listClassGroupRecords,
  listClassGroupEnrollments,
  listSchoolRecords,
} from "@/app/lib/backend/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function buildSchoolLookup(schools) {
  return new Map((Array.isArray(schools) ? schools : []).map((school) => [school.id, school.name || school.id]));
}

function mergeUserSchoolNames({ userId, schoolStaff, classStaff, enrollments, classGroups, schoolLookup }) {
  const schoolIds = new Set();

  (Array.isArray(schoolStaff) ? schoolStaff : [])
    .filter((row) => row?.user_id === userId)
    .forEach((row) => schoolIds.add(row.school_id));

  const classIds = new Set([
    ...(Array.isArray(classStaff) ? classStaff : [])
      .filter((row) => row?.user_id === userId)
      .map((row) => row?.class_group_id),
    ...(Array.isArray(enrollments) ? enrollments : [])
      .filter((row) => row?.user_id === userId)
      .map((row) => row?.class_group_id),
  ]);

  const classGroupLookup = new Map((Array.isArray(classGroups) ? classGroups : []).map((row) => [row.id, row]));
  Array.from(classIds)
    .filter(Boolean)
    .forEach((classId) => {
      const classGroup = classGroupLookup.get(classId);
      if (classGroup?.school_id) schoolIds.add(classGroup.school_id);
    });

  return Array.from(schoolIds)
    .map((schoolId) => schoolLookup.get(schoolId) || schoolId)
    .filter(Boolean)
    .sort((a, b) => String(a).localeCompare(String(b), undefined, { sensitivity: "base" }));
}

export async function GET(request) {
  try {
    await requireOwnerRequestUser(request);

    const [users, schools, schoolStaff, classStaff, classGroups, enrollments] = await Promise.all([
      listUserSignInActivityRecords(),
      listSchoolRecords(),
      listSchoolStaffRecords(),
      listClassGroupStaffRecords(),
      listClassGroupRecords(),
      listClassGroupEnrollments(),
    ]);

    const schoolLookup = buildSchoolLookup(schools);
    const items = (Array.isArray(users) ? users : []).map((user) => ({
      ...user,
      schoolNames: mergeUserSchoolNames({
        userId: user.id,
        schoolStaff,
        classStaff,
        enrollments,
        classGroups,
        schoolLookup,
      }),
    }));

    return NextResponse.json({ ok: true, items });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to load owner activity." },
      { status: 500 }
    );
  }
}
