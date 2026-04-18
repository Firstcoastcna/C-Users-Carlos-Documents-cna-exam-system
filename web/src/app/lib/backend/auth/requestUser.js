import { getServerStudentSession } from "./session";
import { upsertAppUser } from "../db/client";

const DEV_USER_ID = "dev-local-user";

export async function resolveBackendRequestUser(request, body = null, fallbackLabel = "Backend Test User") {
  const student = await getServerStudentSession(request).catch(() => null);
  if (student?.id) {
    const appUser = await upsertAppUser({
      id: student.id,
      email: student.email || `${student.id}@study.firstcoastcna.com`,
      fullName: student.fullName || fallbackLabel,
      accountRole: "student",
    });

    return {
      userId: student.id,
      appUser,
      source: "auth",
    };
  }

  const searchParams = new URL(request.url).searchParams;
  const userId = body?.serverUser || searchParams.get("server_user") || DEV_USER_ID;
  const appUser = await upsertAppUser({
    id: userId,
    email: `${userId}@study.firstcoastcna.com`,
    fullName: userId === DEV_USER_ID ? "Local Dev User" : fallbackLabel,
    accountRole: "student",
  });

  return {
    userId,
    appUser,
    source: userId === DEV_USER_ID ? "dev-local" : "server-user",
  };
}
