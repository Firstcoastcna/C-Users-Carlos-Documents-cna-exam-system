import { getServerStudentSession } from "./session";
import { loadClassGroupStaffForUser, loadSchoolContextForUser, upsertAppUser } from "../db/client";

const DEFAULT_OWNER_EMAILS = [
  "cchaveztafur@gmail.com",
  "carlos@firstcoasttrainingcenter.com",
];

function isLocalDevOwnerBypassEnabled() {
  return process.env.NODE_ENV !== "production";
}

function normalizeEmail(value) {
  return String(value || "").trim().toLowerCase();
}

function hasSchoolAdminRole(context) {
  const staff = context?.staff;
  return Array.isArray(staff) && staff.some((row) => String(row?.role || "").toLowerCase() === "admin");
}

function hasTeacherRole(context) {
  const staff = context?.staff;
  return Array.isArray(staff) && staff.some((row) => String(row?.role || "").toLowerCase() === "teacher");
}

function hasTeacherClassAssignments(classStaff) {
  return Array.isArray(classStaff) && classStaff.some((row) => String(row?.role || "").toLowerCase() === "teacher");
}

export function getOwnerEmails() {
  const configured = String(process.env.OWNER_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  return configured.length ? configured : DEFAULT_OWNER_EMAILS;
}

export async function requireControlCenterRequestUser(request, { allowTeacher = false } = {}) {
  const student = await getServerStudentSession(request);
  if (!student?.id) {
    if (isLocalDevOwnerBypassEnabled()) {
      const searchParams = new URL(request.url).searchParams;
      const userId = searchParams.get("server_user") || "dev-local-user";
      const appUser = await upsertAppUser({
        id: userId,
        email: `${userId}@study.firstcoastcna.com`,
        fullName: "Local Owner User",
        accountRole: "owner",
      });

      return {
        userId,
        email: appUser.email,
        appUser,
        source: "dev-owner",
      };
    }

    throw new Error("Please sign in to access the owner workspace.");
  }

  const email = student.email || "";
  const schoolContext = await loadSchoolContextForUser(student.id).catch(() => null);
  const classStaff = allowTeacher ? await loadClassGroupStaffForUser(student.id).catch(() => []) : [];
  const requestedAccountRole = getOwnerEmails().includes(normalizeEmail(email))
    ? "owner"
    : hasSchoolAdminRole(schoolContext)
      ? "school_admin"
      : hasTeacherRole(schoolContext) || hasTeacherClassAssignments(classStaff)
        ? "teacher"
        : null;
  const appUser = await upsertAppUser({
    id: student.id,
    email: email || `${student.id}@study.firstcoastcna.com`,
    fullName: student.fullName || "Owner User",
    accountRole: requestedAccountRole,
  });

  const isAllowedControlCenterUser =
    isLocalDevOwnerBypassEnabled() ||
    getOwnerEmails().includes(normalizeEmail(email)) ||
    hasSchoolAdminRole(schoolContext) ||
    (allowTeacher && (hasTeacherRole(schoolContext) || hasTeacherClassAssignments(classStaff)));

  if (!isAllowedControlCenterUser) {
    throw new Error("This account is not authorized for the owner workspace.");
  }

  const allowedSchoolIds =
    requestedAccountRole === "owner"
      ? []
      : Array.from(new Set((schoolContext?.schools || []).map((school) => school?.id).filter(Boolean)));
  const allowedClassGroupIds =
    requestedAccountRole === "teacher"
      ? Array.from(
          new Set(
            (Array.isArray(classStaff) ? classStaff : [])
              .filter((row) => String(row?.role || "").toLowerCase() === "teacher")
              .map((row) => row?.class_group_id)
              .filter(Boolean)
          )
        )
      : [];

  return {
    userId: student.id,
    email,
    appUser,
    role: requestedAccountRole,
    schoolContext,
    classStaff,
    allowedSchoolIds,
    allowedClassGroupIds,
    source: getOwnerEmails().includes(normalizeEmail(email))
      ? "auth-owner"
      : requestedAccountRole === "teacher"
        ? "auth-teacher"
        : "auth-school-admin",
  };
}

export async function requireOwnerRequestUser(request) {
  return requireControlCenterRequestUser(request, { allowTeacher: false });
}
