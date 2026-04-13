import { NextResponse } from "next/server";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";
import {
  loadClassGroupRoster,
  loadExamAttemptRecords,
  loadPracticeSessionRecords,
  loadQuestionHistoryRecords,
  loadRemediationSessionRecords,
  loadSchoolContextForUser,
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
  const latestExam = examAttempts[0] || null;
  const latestExamAnalytics = getExamAnalyticsPayload(latestExam);

  return {
    user: member.user,
    enrollment: {
      id: member.id,
      role: member.role,
      status: member.status,
    },
    exams: summarizeExamAttempts(examAttempts),
    latestExamAnalytics: latestExamAnalytics
      ? {
          overallStatus: latestExamAnalytics.overall_status || null,
          categoryPriority: Array.isArray(latestExamAnalytics.category_priority)
            ? latestExamAnalytics.category_priority
            : [],
          chapterGuidance: Array.isArray(latestExamAnalytics.chapter_guidance)
            ? latestExamAnalytics.chapter_guidance
            : [],
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

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang");

    const resolved = await resolveBackendRequestUser(request, null, "Class Reporter");
    const schoolContext = await loadSchoolContextForUser(resolved.userId);
    const targetClassGroupId =
      searchParams.get("class_group_id") ||
      schoolContext.classGroups?.[0]?.id ||
      schoolContext.enrollments?.[0]?.class_group_id ||
      null;

    if (!targetClassGroupId) {
      return NextResponse.json(
        {
          ok: false,
          service: "class-overview-report",
          error: "No class group was found for this user.",
        },
        { status: 404 }
      );
    }

    const roster = await loadClassGroupRoster(targetClassGroupId);

    const studentSummaries = await Promise.all(
      roster.map(async (member) => {
        const [examAttempts, practiceSessions, remediationSessions, questionHistory] = await Promise.all([
          loadExamAttemptRecords(member.user_id, lang),
          loadPracticeSessionRecords(member.user_id, lang),
          loadRemediationSessionRecords(member.user_id, lang),
          loadQuestionHistoryRecords(member.user_id, { lang }),
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

    return NextResponse.json({
      ok: true,
      service: "class-overview-report",
      user: {
        id: resolved.userId,
        source: resolved.source,
        appUser: resolved.appUser,
      },
      filters: {
        lang: lang || null,
        classGroupId: targetClassGroupId,
      },
      classContext: {
        schoolContext,
      },
      summary: {
        aggregate: buildClassAggregate(studentSummaries),
        students: studentSummaries,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "class-overview-report",
        error: error instanceof Error ? error.message : "Unknown class overview report error",
      },
      { status: 500 }
    );
  }
}
