import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  listAccessCodeRecords,
  listAccessCodeRedemptionRecords,
  listAccessGrantedPreferences,
  listClassGroupEnrollments,
  listClassGroupRecords,
  listClassGroupStaffRecords,
  listSchoolRecords,
  listSchoolStaffRecords,
  listUserSignInActivityRecords,
} from "@/app/lib/backend/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function uniqueById(items) {
  const seen = new Set();
  return (Array.isArray(items) ? items : []).filter((item) => {
    const key = String(item?.id || "");
    if (!key || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

function buildActivityUser(user) {
  if (!user?.id) return null;
  return {
    id: user.id,
    email: user.email || null,
    full_name: user.full_name || null,
    account_role: user.account_role || "student",
    sign_in_count: Number(user.sign_in_count || 0),
    first_sign_in_at: user.first_sign_in_at || null,
    last_sign_in_at: user.last_sign_in_at || null,
    last_seen_at: user.last_seen_at || null,
    last_entry_path: user.last_entry_path || null,
    last_entry_label: user.last_entry_label || null,
  };
}

function getIndependentSchoolId({ userId, redemptionsByUserId, accessCodesById, classGroupsById }) {
  const rows = redemptionsByUserId.get(userId) || [];
  for (const row of rows) {
    const accessCode = accessCodesById.get(row.access_code_id);
    if (!accessCode) continue;
    if (accessCode.class_group_id) {
      const classGroup = classGroupsById.get(accessCode.class_group_id);
      if (classGroup?.school_id) return classGroup.school_id;
    }
    if (accessCode.school_id) return accessCode.school_id;
  }
  return null;
}

export async function GET(request) {
  try {
    await requireOwnerRequestUser(request);

    const [users, schools, schoolStaff, classStaff, classGroups, enrollments, accessPrefs, accessCodes, redemptions] = await Promise.all([
      listUserSignInActivityRecords(),
      listSchoolRecords(),
      listSchoolStaffRecords(),
      listClassGroupStaffRecords(),
      listClassGroupRecords(),
      listClassGroupEnrollments(),
      listAccessGrantedPreferences(),
      listAccessCodeRecords(),
      listAccessCodeRedemptionRecords(),
    ]);

    const usersById = new Map((Array.isArray(users) ? users : []).map((user) => [user.id, user]));
    const classGroupsById = new Map((Array.isArray(classGroups) ? classGroups : []).map((row) => [row.id, row]));
    const accessCodesById = new Map((Array.isArray(accessCodes) ? accessCodes : []).map((row) => [row.id, row]));
    const redemptionsByUserId = new Map();
    (Array.isArray(redemptions) ? redemptions : []).forEach((row) => {
      const key = row?.user_id;
      if (!key) return;
      if (!redemptionsByUserId.has(key)) redemptionsByUserId.set(key, []);
      redemptionsByUserId.get(key).push(row);
    });

    const schoolNodes = new Map(
      (Array.isArray(schools) ? schools : []).map((school) => [
        school.id,
        {
          id: school.id,
          name: school.name || school.id,
          slug: school.slug || null,
          admins: [],
          unassignedTeachers: [],
          independentStudents: [],
          classes: [],
        },
      ])
    );

    const classNodes = new Map(
      (Array.isArray(classGroups) ? classGroups : []).map((classGroup) => {
        const node = {
          id: classGroup.id,
          school_id: classGroup.school_id,
          name: classGroup.name || classGroup.id,
          teachers: [],
          students: [],
        };
        const schoolNode = schoolNodes.get(classGroup.school_id);
        if (schoolNode) {
          schoolNode.classes.push(node);
        }
        return [classGroup.id, node];
      })
    );

    const owners = uniqueById(
      (Array.isArray(users) ? users : [])
        .filter((user) => String(user?.account_role || "").toLowerCase() === "owner")
        .map(buildActivityUser)
        .filter(Boolean)
    );

    (Array.isArray(schoolStaff) ? schoolStaff : []).forEach((row) => {
      const schoolNode = schoolNodes.get(row.school_id);
      const user = buildActivityUser(usersById.get(row.user_id));
      if (!schoolNode || !user || String(user.account_role || "").toLowerCase() === "owner") return;

      const normalizedRole = String(row.role || "").toLowerCase();
      if (normalizedRole === "admin") {
        schoolNode.admins.push(user);
      }
      if (normalizedRole === "teacher") {
        schoolNode.unassignedTeachers.push(user);
      }
    });

    const teacherAssignmentsBySchool = new Map();
    (Array.isArray(classStaff) ? classStaff : []).forEach((row) => {
      const classNode = classNodes.get(row.class_group_id);
      const user = buildActivityUser(usersById.get(row.user_id));
      if (!classNode || !user) return;
      if (String(row.role || "").toLowerCase() !== "teacher") return;

      classNode.teachers.push(user);

      const schoolId = classNode.school_id;
      if (!teacherAssignmentsBySchool.has(schoolId)) teacherAssignmentsBySchool.set(schoolId, new Set());
      teacherAssignmentsBySchool.get(schoolId).add(user.id);
    });

    (Array.isArray(enrollments) ? enrollments : []).forEach((row) => {
      const classNode = classNodes.get(row.class_group_id);
      const user = buildActivityUser(usersById.get(row.user_id));
      if (!classNode || !user) return;
      if (String(row.role || "").toLowerCase() !== "student") return;
      if (String(row.status || "").toLowerCase() !== "active") return;
      classNode.students.push(user);
    });

    schoolNodes.forEach((schoolNode) => {
      const assignedTeacherIds = teacherAssignmentsBySchool.get(schoolNode.id) || new Set();
      schoolNode.admins = uniqueById(schoolNode.admins);
      schoolNode.unassignedTeachers = uniqueById(schoolNode.unassignedTeachers).filter((teacher) => !assignedTeacherIds.has(teacher.id));
      schoolNode.classes = schoolNode.classes
        .map((classNode) => ({
          ...classNode,
          teachers: uniqueById(classNode.teachers),
          students: uniqueById(classNode.students),
        }))
        .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }));
    });

    const activeStudentIds = new Set(
      (Array.isArray(enrollments) ? enrollments : [])
        .filter((row) => String(row.role || "").toLowerCase() === "student" && String(row.status || "").toLowerCase() === "active")
        .map((row) => row.user_id)
        .filter(Boolean)
    );

    const independentCandidates = (Array.isArray(accessPrefs) ? accessPrefs : [])
      .map((pref) => usersById.get(pref.user_id))
      .filter((user) => user && String(user.account_role || "").toLowerCase() === "student" && !activeStudentIds.has(user.id));

    const platformIndependentStudents = [];
    independentCandidates.forEach((user) => {
      const activityUser = buildActivityUser(user);
      if (!activityUser) return;
      const schoolId = getIndependentSchoolId({
        userId: user.id,
        redemptionsByUserId,
        accessCodesById,
        classGroupsById,
      });

      if (schoolId && schoolNodes.has(schoolId)) {
        schoolNodes.get(schoolId).independentStudents.push(activityUser);
      } else {
        platformIndependentStudents.push(activityUser);
      }
    });

    const normalizedSchools = Array.from(schoolNodes.values())
      .map((schoolNode) => ({
        ...schoolNode,
        independentStudents: uniqueById(schoolNode.independentStudents),
      }))
      .sort((a, b) => String(a.name || "").localeCompare(String(b.name || ""), undefined, { sensitivity: "base" }));

    return NextResponse.json({
      ok: true,
      owners,
      schools: normalizedSchools,
      platformIndependentStudents: uniqueById(platformIndependentStudents),
    });
  } catch (error) {
    return NextResponse.json(
      { ok: false, error: error?.message || "Unable to load owner activity." },
      { status: 500 }
    );
  }
}
