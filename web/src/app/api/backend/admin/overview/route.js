import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import {
  listAccessCodeRecords,
  listAccessCodeRedemptionRecords,
  listAccessGrantedPreferences,
  listClassGroupStaffRecords,
  listClassGroupRecords,
  loadExamAttemptRecords,
  loadPracticeSessionRecords,
  loadQuestionHistoryRecords,
  loadRemediationSessionRecords,
  listSchoolRecords,
  listSchoolStaffRecords,
  loadAppUser,
  loadClassGroupRoster,
} from "@/app/lib/backend/db/client";

function summarizeExamAttempts(attempts) {
  const completed = attempts.filter((attempt) => Number.isFinite(attempt?.score));
  const scores = completed.map((attempt) => Number(attempt.score)).filter(Number.isFinite);
  const averageScore = scores.length
    ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
    : null;
  const bestScore = scores.length ? Math.max(...scores) : null;

  return {
    totalAttempts: attempts.length,
    completedAttempts: completed.length,
    averageScore,
    bestScore,
  };
}

function getExamAnalyticsPayload(attempt) {
  return attempt?.results_payload?.final || attempt?.results_payload || null;
}

function deriveOverallStatusFromScore(score) {
  if (!Number.isFinite(score)) return null;
  if (score >= 80) return "On Track";
  if (score < 70) return "High Risk";
  return "Borderline";
}

function getLatestScoredAttempt(attempts) {
  return attempts.find((attempt) => Number.isFinite(attempt?.score)) || null;
}

function getLatestAttemptWithAnalytics(attempts) {
  return (
    attempts.find((attempt) => {
      const analytics = getExamAnalyticsPayload(attempt);
      return analytics && (Array.isArray(analytics.category_priority) || Array.isArray(analytics.chapter_guidance));
    }) || null
  );
}

function summarizePracticeSessions(sessions) {
  const completed = sessions.filter((session) => session?.status === "completed");
  const active = sessions.filter((session) => session?.status === "active");
  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    activeSessions: active.length,
  };
}

function summarizeRemediationSessions(sessions) {
  const completed = sessions.filter((session) => session?.status === "completed");
  const active = sessions.filter((session) => session?.status === "active");
  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    activeSessions: active.length,
  };
}

function summarizeQuestionHistory(records) {
  const uniqueQuestionCount = new Set(records.map((record) => record?.question_id).filter(Boolean)).size;
  const bySourceType = records.reduce((acc, record) => {
    const key = record?.source_type || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return {
    totalExposureRows: records.length,
    uniqueQuestionCount,
    bySourceType,
  };
}

async function enrichRosterMember(member) {
  const [examAttempts, practiceSessions, remediationSessions, questionHistory] = await Promise.all([
    loadExamAttemptRecords(member.user_id),
    loadPracticeSessionRecords(member.user_id),
    loadRemediationSessionRecords(member.user_id),
    loadQuestionHistoryRecords(member.user_id),
  ]);

  const latestAnalyticsExam = getLatestAttemptWithAnalytics(examAttempts);
  const latestExamAnalytics = getExamAnalyticsPayload(latestAnalyticsExam);
  const latestScoredExam = getLatestScoredAttempt(examAttempts);
  const derivedOverallStatus =
    latestExamAnalytics?.overall_status ||
    deriveOverallStatusFromScore(Number(latestScoredExam?.score));

  return {
    ...member,
    studentSummary: {
      exams: summarizeExamAttempts(examAttempts),
      latestExamAnalytics: latestExamAnalytics
        ? {
            overallStatus: derivedOverallStatus,
            categoryPriority: Array.isArray(latestExamAnalytics.category_priority)
              ? latestExamAnalytics.category_priority
              : [],
            chapterGuidance: Array.isArray(latestExamAnalytics.chapter_guidance)
              ? latestExamAnalytics.chapter_guidance
              : [],
          }
        : derivedOverallStatus
          ? {
              overallStatus: derivedOverallStatus,
              categoryPriority: [],
              chapterGuidance: [],
            }
          : null,
      practice: summarizePracticeSessions(practiceSessions),
      remediation: summarizeRemediationSessions(remediationSessions),
      questionHistory: summarizeQuestionHistory(questionHistory),
    },
  };
}

function summarizeAccessCodes(codes, redemptions, usersById) {
  const redemptionsByCodeId = redemptions.reduce((acc, row) => {
    if (!acc[row.access_code_id]) acc[row.access_code_id] = [];
    acc[row.access_code_id].push(row);
    return acc;
  }, {});

  return codes.map((code) => {
    const usage = redemptionsByCodeId[code.id] || [];
    const latest = usage[0] || null;
    const latestUser = latest ? usersById[latest.user_id] || null : null;

    return {
      ...code,
      redemption_count: usage.length,
      latest_redemption_at: latest?.redeemed_at || null,
      latest_redeemer: latestUser
        ? {
            id: latestUser.id,
            full_name: latestUser.full_name || null,
            email: latestUser.email || null,
          }
        : null,
    };
  });
}

export async function GET(request) {
  try {
    const owner = await requireOwnerRequestUser(request);
    const [schools, classGroups, accessCodes, redemptions, accessGrantedPreferences, schoolStaff, classGroupStaff] = await Promise.all([
      listSchoolRecords(),
      listClassGroupRecords(),
      listAccessCodeRecords(),
      listAccessCodeRedemptionRecords(),
      listAccessGrantedPreferences(),
      listSchoolStaffRecords(),
      listClassGroupStaffRecords(),
    ]);

    const rosterEntries = await Promise.all(
      classGroups.map(async (group) => ({
        classGroupId: group.id,
        roster: await Promise.all((await loadClassGroupRoster(group.id)).map((member) => enrichRosterMember(member))),
      }))
    );
    const rosterByClassId = Object.fromEntries(
      rosterEntries.map((entry) => [entry.classGroupId, entry.roster])
    );

    const userIds = Array.from(
      new Set([
        ...redemptions.map((row) => row.user_id).filter(Boolean),
        ...accessGrantedPreferences.map((row) => row.user_id).filter(Boolean),
        ...schoolStaff.map((row) => row.user_id).filter(Boolean),
        ...classGroupStaff.map((row) => row.user_id).filter(Boolean),
      ])
    );
    const users = await Promise.all(userIds.map((userId) => loadAppUser(userId)));
    const usersById = Object.fromEntries(users.filter(Boolean).map((user) => [user.id, user]));
    const schoolsById = Object.fromEntries(schools.map((school) => [school.id, school]));

    const accessGrantedStudents = accessGrantedPreferences
      .map((prefs) => {
        const user = usersById[prefs.user_id];
        if (!user) return null;
        if ((user.account_role || "student") !== "student") return null;

        return {
          id: user.id,
          email: user.email || null,
          full_name: user.full_name || null,
          account_role: user.account_role || "student",
          access_granted_at: prefs.updated_at || prefs.created_at || null,
          preferred_language: prefs.preferred_language || null,
          preferences: prefs,
        };
      })
      .filter(Boolean);

    const schoolAdmins = schoolStaff
      .filter((row) => String(row.role || "").toLowerCase() === "admin")
      .map((row) => {
        const user = usersById[row.user_id];
        const school = schoolsById[row.school_id];
        if (!user || !school) return null;

        return {
          id: row.id,
          school_id: row.school_id,
          user_id: row.user_id,
          role: row.role,
          created_at: row.created_at,
          updated_at: row.updated_at,
          school: {
            id: school.id,
            name: school.name,
            slug: school.slug || null,
          },
          user: {
            id: user.id,
            email: user.email || null,
            full_name: user.full_name || null,
            account_role: user.account_role || "school_admin",
          },
        };
      })
      .filter(Boolean);

    const schoolTeachers = schoolStaff
      .filter((row) => String(row.role || "").toLowerCase() === "teacher")
      .map((row) => {
        const user = usersById[row.user_id];
        const school = schoolsById[row.school_id];
        if (!user || !school) return null;

        return {
          id: row.id,
          school_id: row.school_id,
          user_id: row.user_id,
          role: row.role,
          created_at: row.created_at,
          updated_at: row.updated_at,
          school: {
            id: school.id,
            name: school.name,
            slug: school.slug || null,
          },
          user: {
            id: user.id,
            email: user.email || null,
            full_name: user.full_name || null,
            account_role: user.account_role || "teacher",
          },
        };
      })
      .filter(Boolean);

    const teacherClassAssignments = classGroupStaff
      .filter((row) => String(row.role || "").toLowerCase() === "teacher")
      .map((row) => {
        const teacher = usersById[row.user_id];
        const classGroup = classGroups.find((item) => item.id === row.class_group_id);
        if (!teacher || !classGroup) return null;

        return {
          id: row.id,
          class_group_id: row.class_group_id,
          user_id: row.user_id,
          role: row.role,
          created_at: row.created_at,
          updated_at: row.updated_at,
          user: {
            id: teacher.id,
            email: teacher.email || null,
            full_name: teacher.full_name || null,
            account_role: teacher.account_role || "teacher",
          },
          classGroup: {
            id: classGroup.id,
            school_id: classGroup.school_id,
            name: classGroup.name,
            status: classGroup.status || "active",
          },
        };
      })
      .filter(Boolean);

    return NextResponse.json({
      ok: true,
      service: "admin-overview",
      owner: {
        id: owner.userId,
        email: owner.email,
        appUser: owner.appUser,
      },
      summary: {
        schoolCount: schools.length,
        classCount: classGroups.length,
        accessCodeCount: accessCodes.length,
        redemptionCount: redemptions.length,
      },
      schools,
      classGroups: classGroups.map((group) => ({
        ...group,
        roster: rosterByClassId[group.id] || [],
        enrollment_count: (rosterByClassId[group.id] || []).length,
      })),
      schoolAdmins,
      schoolTeachers,
      teacherClassAssignments,
      accessGrantedStudents,
      accessCodes: summarizeAccessCodes(accessCodes, redemptions, usersById),
      redemptions: redemptions.map((row) => ({
        ...row,
        user: usersById[row.user_id] || null,
      })),
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown admin overview error.";
    const status = message.includes("authorized") || message.includes("sign in") ? 403 : 500;

    return NextResponse.json(
      {
        ok: false,
        service: "admin-overview",
        error: message,
      },
      { status }
    );
  }
}
