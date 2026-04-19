import { getServerStudentSession } from "./session";
import { loadSchoolContextForUser, upsertAppUser } from "../db/client";

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

export function getOwnerEmails() {
  const configured = String(process.env.OWNER_EMAILS || "")
    .split(",")
    .map((item) => normalizeEmail(item))
    .filter(Boolean);

  return configured.length ? configured : DEFAULT_OWNER_EMAILS;
}

export async function requireOwnerRequestUser(request) {
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
  const requestedAccountRole = getOwnerEmails().includes(normalizeEmail(email))
    ? "owner"
    : hasSchoolAdminRole(schoolContext)
      ? "school_admin"
      : hasTeacherRole(schoolContext)
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
    hasSchoolAdminRole(schoolContext);

  if (!isAllowedControlCenterUser) {
    throw new Error("This account is not authorized for the owner workspace.");
  }

  return {
    userId: student.id,
    email,
    appUser,
    source: getOwnerEmails().includes(normalizeEmail(email)) ? "auth-owner" : "auth-school-admin",
  };
}
