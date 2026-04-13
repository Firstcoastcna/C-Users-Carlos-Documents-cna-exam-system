import { NextResponse } from "next/server";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";
import {
  loadSchoolContextForUser,
  upsertClassGroup,
  upsertClassGroupEnrollment,
  upsertSchool,
  upsertSchoolStaff,
} from "@/app/lib/backend/db/client";

export async function GET(request) {
  try {
    const resolved = await resolveBackendRequestUser(request, null, "School Admin");
    const userId = resolved.userId;

    const school = await upsertSchool({
      id: "school_firstcoastcna_demo",
      name: "First Coast CNA Demo School",
      slug: "firstcoastcna-demo",
    });

    const staffMembership = await upsertSchoolStaff({
      id: `schoolstaff:${school.id}:${userId}`,
      schoolId: school.id,
      userId,
      role: "admin",
    });

    const classGroup = await upsertClassGroup({
      id: "classgroup_spring_demo_a",
      schoolId: school.id,
      name: "Spring Demo Cohort A",
      code: "SPRING-A",
      status: "active",
    });

    const enrollment = await upsertClassGroupEnrollment({
      id: `enrollment:${classGroup.id}:${userId}`,
      classGroupId: classGroup.id,
      userId,
      role: "student",
      status: "active",
    });

    const context = await loadSchoolContextForUser(userId);

    return NextResponse.json({
      ok: true,
      service: "schools-bootstrap-check",
      user: {
        id: userId,
        source: resolved.source,
        appUser: resolved.appUser,
      },
      created: {
        school,
        staffMembership,
        classGroup,
        enrollment,
      },
      context,
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "schools-bootstrap-check",
        error: error instanceof Error ? error.message : "Unknown school bootstrap error",
      },
      { status: 500 }
    );
  }
}
