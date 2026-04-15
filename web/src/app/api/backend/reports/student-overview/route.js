import { NextResponse } from "next/server";
import { requireOwnerRequestUser } from "@/app/lib/backend/auth/owner";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";
import {
  loadAppUser,
  loadExamAttemptRecords,
  loadPracticeSessionRecords,
  loadQuestionHistoryRecords,
  loadRemediationSessionRecords,
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
    latestAttempt: attempts[0] || null,
    latestCompletedAttempt: completed[0] || null,
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
    latestSession: sessions[0] || null,
  };
}

function summarizeRemediationSessions(sessions) {
  const completed = sessions.filter((session) => session?.status === "completed");
  const active = sessions.filter((session) => session?.status === "active");

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    activeSessions: active.length,
    latestSession: sessions[0] || null,
  };
}

function summarizeQuestionHistory(records) {
  const bySourceType = records.reduce((acc, record) => {
    const key = record?.source_type || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const uniqueQuestionIds = Array.from(
    new Set(records.map((record) => record?.question_id).filter(Boolean))
  );

  return {
    totalExposureRows: records.length,
    uniqueQuestionCount: uniqueQuestionIds.length,
    bySourceType,
    recent: records.slice(0, 10),
  };
}

function summarizePracticeFocus(sessions) {
  const chapterCounts = {};
  const categoryCounts = {};

  sessions.forEach((session) => {
    const payload = session?.payload || {};
    const chapter = payload?.selectedChapter;
    const category = payload?.selectedCategory;

    if (chapter) {
      const key = `Chapter ${chapter}`;
      chapterCounts[key] = (chapterCounts[key] || 0) + 1;
    }

    if (category) {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    }
  });

  return {
    chapterCounts,
    categoryCounts,
  };
}

function summarizeRemediationFocus(sessions) {
  const categoryCounts = {};
  const outcomeCounts = {};
  const recentSessions = sessions.slice(0, 5).map((session) => {
    const payload = session?.payload || {};
    return {
      sessionId: session?.id,
      status: session?.status,
      categories: Array.isArray(payload.selectedCategories) ? payload.selectedCategories : [],
      microOutcome: payload.microOutcome || null,
      submittedCorrect: payload.submitted_correct ?? null,
      submittedTotal: payload.submitted_total ?? null,
      updatedAt: session?.updated_at || session?.created_at || null,
    };
  });

  sessions.forEach((session) => {
    const payload = session?.payload || {};
    const categories = Array.isArray(payload.selectedCategories) ? payload.selectedCategories : [];
    categories.forEach((category) => {
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    const outcome = payload.microOutcome;
    if (outcome) {
      outcomeCounts[outcome] = (outcomeCounts[outcome] || 0) + 1;
    }
  });

  return {
    categoryCounts,
    outcomeCounts,
    recentSessions,
  };
}

function summarizeLearningSignals(examAttempts) {
  const latestAttemptWithAnalytics =
    examAttempts.find((attempt) => {
      const analytics = getExamAnalyticsPayload(attempt);
      return analytics && Array.isArray(analytics.category_priority);
    }) || null;

  const analytics = getExamAnalyticsPayload(latestAttemptWithAnalytics);
  if (!analytics) {
    return {
      overallStatus: null,
      strongestCategories: [],
      categoriesNeedingWork: [],
      highRiskCategories: [],
      chapterPriorities: [],
    };
  }

  const categoryPriority = Array.isArray(analytics.category_priority) ? analytics.category_priority : [];
  const chapterGuidance = Array.isArray(analytics.chapter_guidance) ? analytics.chapter_guidance : [];

  return {
    overallStatus: analytics.overall_status || null,
    strongestCategories: categoryPriority
      .filter((item) => item?.level === "Strong")
      .slice(0, 3)
      .map((item) => item.category_id),
    categoriesNeedingWork: categoryPriority
      .filter((item) => item?.level === "Weak" || item?.level === "Developing")
      .slice(0, 4)
      .map((item) => ({
        category: item.category_id,
        level: item.level,
      })),
    highRiskCategories: categoryPriority
      .filter((item) => item?.is_high_risk && item?.level !== "Strong")
      .slice(0, 4)
      .map((item) => ({
        category: item.category_id,
        level: item.level,
      })),
    chapterPriorities: chapterGuidance.slice(0, 3).map((item) => ({
      chapterId: item.chapter_id,
      priority: item.priority,
    })),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang");
    const requestedUserId = searchParams.get("user_id");

    let resolved = await resolveBackendRequestUser(request, null, "Student");
    let userId = resolved.userId;

    if (requestedUserId && requestedUserId !== resolved.userId) {
      const owner = await requireOwnerRequestUser(request);
      const targetUser = await loadAppUser(requestedUserId);
      if (!targetUser) {
        return NextResponse.json(
          {
            ok: false,
            service: "student-overview-report",
            error: "The requested student was not found.",
          },
          { status: 404 }
        );
      }

      userId = requestedUserId;
      resolved = {
        ...owner,
        source: "owner-report",
        appUser: targetUser,
      };
    }

    const [examAttempts, practiceSessions, remediationSessions, questionHistory] = await Promise.all([
      loadExamAttemptRecords(userId, lang),
      loadPracticeSessionRecords(userId, lang),
      loadRemediationSessionRecords(userId, lang),
      loadQuestionHistoryRecords(userId, { lang }),
    ]);

    return NextResponse.json({
      ok: true,
      service: "student-overview-report",
      user: {
        id: userId,
        source: resolved.source,
        appUser: resolved.appUser,
      },
      filters: {
        lang: lang || null,
      },
      summary: {
        exams: summarizeExamAttempts(examAttempts),
        practice: summarizePracticeSessions(practiceSessions),
        remediation: summarizeRemediationSessions(remediationSessions),
        questionHistory: summarizeQuestionHistory(questionHistory),
        practiceFocus: summarizePracticeFocus(practiceSessions),
        remediationFocus: summarizeRemediationFocus(remediationSessions),
        learningSignals: summarizeLearningSignals(examAttempts),
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        ok: false,
        service: "student-overview-report",
        error: error instanceof Error ? error.message : "Unknown student overview report error",
      },
      { status: 500 }
    );
  }
}
