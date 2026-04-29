import { NextResponse } from "next/server";
import { requireControlCenterRequestUser } from "@/app/lib/backend/auth/owner";
import {
  listClassGroupRecords,
  listSchoolRecords,
  loadClassGroupRoster,
  loadExamAttemptRecords,
  loadPracticeSessionRecords,
  loadQuestionHistoryRecords,
  loadRemediationSessionRecords,
  loadSchoolContextForUser,
} from "@/app/lib/backend/db/client";

function isCompletedExamAttempt(attempt) {
  if (!Number.isFinite(attempt?.score)) return false;
  if (attempt?.completed_at) return true;

  const mode = String(attempt?.mode || "").trim().toLowerCase();
  if (mode === "finished" || mode === "time_expired") {
    return true;
  }

  return Boolean(attempt?.results_payload?.final);
}

function getCompletedAttemptSortTime(attempt) {
  const timestamp = attempt?.completed_at || attempt?.updated_at || attempt?.created_at || null;
  const time = timestamp ? new Date(timestamp).getTime() : 0;
  return Number.isFinite(time) ? time : 0;
}

function getCompletedAttemptsSorted(attempts) {
  return (Array.isArray(attempts) ? attempts : [])
    .filter((attempt) => isCompletedExamAttempt(attempt))
    .sort((a, b) => getCompletedAttemptSortTime(b) - getCompletedAttemptSortTime(a));
}

function summarizeExamAttempts(attempts) {
  const completed = getCompletedAttemptsSorted(attempts);
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
  return getCompletedAttemptsSorted(attempts)[0] || null;
}

function getLatestAttemptWithAnalytics(attempts) {
  const latestCompletedAttempt = getCompletedAttemptsSorted(attempts)[0] || null;
  if (!latestCompletedAttempt) return null;
  const analytics = getExamAnalyticsPayload(latestCompletedAttempt);
  if (!analytics) return null;
  return Array.isArray(analytics.category_priority) || Array.isArray(analytics.chapter_guidance)
    ? latestCompletedAttempt
    : null;
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

function buildStudentSummary({ member, examAttempts, practiceSessions, remediationSessions, questionHistory }) {
  const examSummary = summarizeExamAttempts(examAttempts);
  const latestAnalyticsExam = getLatestAttemptWithAnalytics(examAttempts);
  const latestExamAnalytics = getExamAnalyticsPayload(latestAnalyticsExam);
  const derivedOverallStatus =
    deriveOverallStatusFromScore(Number(examSummary?.averageScore)) ||
    latestExamAnalytics?.overall_status ||
    null;

  return {
    user: member.user,
    enrollment: {
      id: member.id,
      role: member.role,
      status: member.status,
    },
    exams: examSummary,
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
  };
}

function buildClassAggregate(studentSummaries) {
  const scores = studentSummaries
    .map((student) => student.exams.averageScore)
    .filter(Number.isFinite);
  const totalStudents = studentSummaries.length;
  const activeStudents = studentSummaries.filter((student) => {
    return (
      student.exams.totalAttempts > 0 ||
      student.practice.totalSessions > 0 ||
      student.remediation.totalSessions > 0
    );
  }).length;

  const overallStatusCounts = {};
  const categoryWeaknessCounts = {};
  const highRiskCategoryCounts = {};
  const chapterPriorityCounts = {};

  studentSummaries.forEach((student) => {
    const analytics = student.latestExamAnalytics;
    if (!analytics) return;

    const overallStatus = analytics.overallStatus || "Unknown";
    overallStatusCounts[overallStatus] = (overallStatusCounts[overallStatus] || 0) + 1;

    (analytics.categoryPriority || []).forEach((item) => {
      const categoryId = item?.category_id;
      if (!categoryId) return;

      if (item.level === "Weak" || item.level === "Developing") {
        categoryWeaknessCounts[categoryId] = (categoryWeaknessCounts[categoryId] || 0) + 1;
      }

      if (item.is_high_risk && item.level !== "Strong") {
        highRiskCategoryCounts[categoryId] = (highRiskCategoryCounts[categoryId] || 0) + 1;
      }
    });

    (analytics.chapterGuidance || []).forEach((item) => {
      const chapterId = item?.chapter_id;
      if (!chapterId) return;
      const key = `Chapter ${chapterId}`;
      chapterPriorityCounts[key] = (chapterPriorityCounts[key] || 0) + 1;
    });
  });

  return {
    totalStudents,
    activeStudents,
    classAverageScore: scores.length
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : null,
    totalExamAttempts: studentSummaries.reduce((sum, student) => sum + student.exams.totalAttempts, 0),
    totalPracticeSessions: studentSummaries.reduce((sum, student) => sum + student.practice.totalSessions, 0),
    totalRemediationSessions: studentSummaries.reduce((sum, student) => sum + student.remediation.totalSessions, 0),
    overallStatusCounts,
    categoryWeaknessCounts,
    highRiskCategoryCounts,
    chapterPriorityCounts,
  };
}

function mergeCountMaps(target, source) {
  Object.entries(source || {}).forEach(([key, value]) => {
    target[key] = (target[key] || 0) + Number(value || 0);
  });
}

function buildSchoolAggregate(classSummaries) {
  const overallStatusCounts = {};
  const categoryWeaknessCounts = {};
  const highRiskCategoryCounts = {};
  const chapterPriorityCounts = {};

  let totalStudents = 0;
  let activeStudents = 0;
  let totalExamAttempts = 0;
  let totalPracticeSessions = 0;
  let totalRemediationSessions = 0;
  let weightedScoreSum = 0;
  let weightedScoreStudents = 0;

  classSummaries.forEach((item) => {
    const aggregate = item.aggregate || {};
    totalStudents += Number(aggregate.totalStudents || 0);
    activeStudents += Number(aggregate.activeStudents || 0);
    totalExamAttempts += Number(aggregate.totalExamAttempts || 0);
    totalPracticeSessions += Number(aggregate.totalPracticeSessions || 0);
    totalRemediationSessions += Number(aggregate.totalRemediationSessions || 0);

    if (Number.isFinite(aggregate.classAverageScore) && Number(aggregate.totalStudents || 0) > 0) {
      weightedScoreSum += Number(aggregate.classAverageScore) * Number(aggregate.totalStudents || 0);
      weightedScoreStudents += Number(aggregate.totalStudents || 0);
    }

    mergeCountMaps(overallStatusCounts, aggregate.overallStatusCounts);
    mergeCountMaps(categoryWeaknessCounts, aggregate.categoryWeaknessCounts);
    mergeCountMaps(highRiskCategoryCounts, aggregate.highRiskCategoryCounts);
    mergeCountMaps(chapterPriorityCounts, aggregate.chapterPriorityCounts);
  });

  return {
    totalClasses: classSummaries.length,
    activeClasses: classSummaries.filter((item) => Number(item.aggregate?.activeStudents || 0) > 0).length,
    totalStudents,
    activeStudents,
    schoolAverageScore: weightedScoreStudents ? Math.round(weightedScoreSum / weightedScoreStudents) : null,
    totalExamAttempts,
    totalPracticeSessions,
    totalRemediationSessions,
    overallStatusCounts,
    categoryWeaknessCounts,
    highRiskCategoryCounts,
    chapterPriorityCounts,
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang");
    const requestedSchoolId = searchParams.get("school_id") || "";

    const resolved = await requireControlCenterRequestUser(request, { allowTeacher: false });
    const schoolContext = await loadSchoolContextForUser(resolved.userId).catch(() => ({
      schools: [],
    }));
    const allSchools = await listSchoolRecords();

    const accessibleSchoolIds =
      resolved.appUser?.account_role === "owner"
        ? allSchools.map((school) => school.id)
        : (schoolContext.schools || []).map((school) => school.id);

    const targetSchoolId =
      requestedSchoolId ||
      accessibleSchoolIds[0] ||
      allSchools[0]?.id ||
      null;

    if (!targetSchoolId) {
      return NextResponse.json(
        {
          ok: false,
          service: "school-overview-report",
          error: "No school was found for this account.",
        },
        { status: 404 }
      );
    }

    if (!accessibleSchoolIds.includes(targetSchoolId)) {
      return NextResponse.json(
        {
          ok: false,
          service: "school-overview-report",
          error: "This school is not available for this account.",
        },
        { status: 403 }
      );
    }

    const school = allSchools.find((item) => item.id === targetSchoolId) || null;
    const classGroups = await listClassGroupRecords(targetSchoolId);

    const classSummaries = await Promise.all(
      classGroups.map(async (group) => {
        const roster = await loadClassGroupRoster(group.id);

        const studentSummaries = await Promise.all(
          roster.map(async (member) => {
            const [examAttempts, practiceSessions, remediationSessions, questionHistory] = await Promise.all([
              // School-level reporting should aggregate all student activity, regardless of UI language.
              loadExamAttemptRecords(member.user_id),
              loadPracticeSessionRecords(member.user_id),
              loadRemediationSessionRecords(member.user_id),
              loadQuestionHistoryRecords(member.user_id),
            ]);

            return buildStudentSummary({
              member,
              examAttempts,
              practiceSessions,
              remediationSessions,
              questionHistory,
            });
          })
        );

        return {
          id: group.id,
          name: group.name,
          status: group.status || "active",
          aggregate: buildClassAggregate(studentSummaries),
        };
      })
    );

    return NextResponse.json({
      ok: true,
      service: "school-overview-report",
      user: {
        id: resolved.userId,
        source: resolved.source,
        appUser: resolved.appUser,
      },
      filters: {
        lang: lang || null,
        schoolId: targetSchoolId,
      },
      school,
      summary: {
        aggregate: buildSchoolAggregate(classSummaries),
        classes: classSummaries,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "school-overview-report",
        error: error instanceof Error ? error.message : "Unknown school overview report error",
      },
      { status: 500 }
    );
  }
}
