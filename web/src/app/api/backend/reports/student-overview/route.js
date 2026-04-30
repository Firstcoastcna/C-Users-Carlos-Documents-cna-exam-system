import { NextResponse } from "next/server";
import { requireControlCenterRequestUser } from "@/app/lib/backend/auth/owner";
import { resolveBackendRequestUser } from "@/app/lib/backend/auth/requestUser";
import { loadQuestionBank } from "@/app/lib/questionBank";
import {
  loadAppUser,
  loadExamAttemptRecords,
  loadPracticeSessionRecords,
  loadQuestionHistoryRecords,
  loadRemediationSessionRecords,
  loadSchoolContextForUser,
} from "@/app/lib/backend/db/client";

export const dynamic = "force-dynamic";
export const revalidate = 0;

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
  const worstScore = scores.length ? Math.min(...scores) : null;

  return {
    totalAttempts: attempts.length,
    completedAttempts: completed.length,
    averageScore,
    bestScore,
    worstScore,
    latestAttempt: attempts[0] || null,
    latestCompletedAttempt: completed[0] || null,
  };
}

function buildQuestionBankIndex() {
  const bank = loadQuestionBank();
  return Object.fromEntries(
    (Array.isArray(bank) ? bank : []).map((question) => [question?.question_id, question]).filter(([qid]) => Boolean(qid))
  );
}

function getExamAnalyticsPayload(attempt) {
  return attempt?.results_payload?.final || attempt?.results_payload || null;
}

function pickWeakestCategoryFromAnalytics(analytics) {
  const ranked = Array.isArray(analytics?.category_priority) ? analytics.category_priority : [];
  return (
    ranked.find((item) => item?.is_high_risk && item?.level !== "Strong") ||
    ranked.find((item) => item?.level === "Weak" || item?.level === "Developing") ||
    ranked.find((item) => item?.level !== "Strong") ||
    ranked[0] ||
    null
  );
}

function summarizeExamResult(attempt, bankById) {
  if (!attempt || !Number.isFinite(attempt?.score)) return null;

  const deliveredQuestionIds = Array.isArray(attempt?.delivered_question_ids)
    ? attempt.delivered_question_ids
    : [];
  const answersByQid = attempt?.answers_by_qid || {};
  const chapterStats = {};
  let correctCount = 0;

  deliveredQuestionIds.forEach((questionId) => {
    const question = bankById?.[questionId];
    if (!question) return;

    const chapterId = Number(question?.chapter_tag);
    if (Number.isFinite(chapterId)) {
      if (!chapterStats[chapterId]) {
        chapterStats[chapterId] = { totalQuestions: 0, correctCount: 0 };
      }
      chapterStats[chapterId].totalQuestions += 1;
    }

    const selectedAnswer = answersByQid?.[questionId];
    const isCorrect =
      selectedAnswer != null &&
      question?.correct_answer != null &&
      String(selectedAnswer) === String(question.correct_answer);

    if (isCorrect) {
      correctCount += 1;
      if (Number.isFinite(chapterId) && chapterStats[chapterId]) {
        chapterStats[chapterId].correctCount += 1;
      }
    }
  });

  const chapterBreakdown = Object.entries(chapterStats)
    .map(([chapterId, stats]) => {
      const totalQuestions = Number(stats?.totalQuestions || 0);
      const chapterCorrect = Number(stats?.correctCount || 0);
      const missedCount = Math.max(0, totalQuestions - chapterCorrect);
      return {
        chapterId: Number(chapterId),
        totalQuestions,
        correctCount: chapterCorrect,
        missedCount,
        percent: totalQuestions ? Math.round((chapterCorrect / totalQuestions) * 100) : null,
      };
    })
    .sort((a, b) => a.chapterId - b.chapterId);

  const weakestChapter =
    [...chapterBreakdown].sort((a, b) => {
      if ((b.missedCount || 0) !== (a.missedCount || 0)) return (b.missedCount || 0) - (a.missedCount || 0);
      if ((a.percent || 0) !== (b.percent || 0)) return (a.percent || 0) - (b.percent || 0);
      return (b.totalQuestions || 0) - (a.totalQuestions || 0);
    })[0] || null;

  const analytics = getExamAnalyticsPayload(attempt);
  const weakestCategory = pickWeakestCategoryFromAnalytics(analytics);

  return {
    attemptId: attempt.id,
    score: Number.isFinite(attempt?.score) ? Number(attempt.score) : null,
    questionCount: deliveredQuestionIds.length,
    correctCount,
    missedCount: Math.max(0, deliveredQuestionIds.length - correctCount),
    completedAt: attempt?.completed_at || attempt?.created_at || attempt?.updated_at || null,
    weakestCategory: weakestCategory
      ? {
          category: weakestCategory.category_id || weakestCategory.category || null,
          level: weakestCategory.level || null,
        }
      : null,
    weakestChapter: weakestChapter
      ? {
          chapterId: weakestChapter.chapterId,
          missedCount: weakestChapter.missedCount,
          totalQuestions: weakestChapter.totalQuestions,
          percent: weakestChapter.percent,
        }
      : null,
    chapterBreakdown,
  };
}

function summarizeLatestCompletedExamResult(attempts, bankById) {
  const latestCompletedAttempt = getCompletedAttemptsSorted(attempts)[0] || null;
  return summarizeExamResult(latestCompletedAttempt, bankById);
}

function summarizeExamHistory(attempts, bankById) {
  return getCompletedAttemptsSorted(attempts)
    .map((attempt) => summarizeExamResult(attempt, bankById))
    .filter(Boolean)
    .sort((a, b) => {
      const timeA = a?.completedAt ? new Date(a.completedAt).getTime() : 0;
      const timeB = b?.completedAt ? new Date(b.completedAt).getTime() : 0;
      return timeB - timeA;
    });
}

function deriveOverallStatusFromScore(score) {
  if (!Number.isFinite(score)) return null;
  if (score >= 80) return "On Track";
  if (score < 70) return "High Risk";
  return "Borderline";
}

function summarizePracticeSessions(sessions) {
  const completed = sessions.filter((session) => session?.status === "completed");
  const active = sessions.filter((session) => session?.status === "active");
  const completedQuestionCount = completed.reduce((sum, session) => {
    const payload = session?.payload || {};
    const submittedTotal = Number(payload?.submitted_total);
    const questionCount = Number(session?.question_count || payload?.question_count || payload?.questionIds?.length || 0);
    return sum + (Number.isFinite(submittedTotal) && submittedTotal > 0 ? submittedTotal : questionCount);
  }, 0);

  return {
    totalSessions: sessions.length,
    completedSessions: completed.length,
    activeSessions: active.length,
    completedQuestionCount,
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

  const uniqueBySourceType = records.reduce((acc, record) => {
    const key = record?.source_type || "unknown";
    if (!acc[key]) acc[key] = new Set();
    if (record?.question_id) acc[key].add(record.question_id);
    return acc;
  }, {});

  const uniqueQuestionIds = Array.from(
    new Set(records.map((record) => record?.question_id).filter(Boolean))
  );

  return {
    totalExposureRows: records.length,
    uniqueQuestionCount: uniqueQuestionIds.length,
    bySourceType,
    uniqueBySourceType: Object.fromEntries(
      Object.entries(uniqueBySourceType).map(([key, set]) => [key, set.size])
    ),
    recent: records.slice(0, 10),
  };
}

function summarizePracticeFocus(sessions) {
  const chapterCounts = {};
  const categoryCounts = {};
  const modeCounts = {};

  sessions.forEach((session) => {
    const payload = session?.payload || {};
    const chapter = payload?.selectedChapter;
    const category = payload?.selectedCategory;
    const rawMode = String(session?.mode || payload?.mode || "").trim().toLowerCase();

    let normalizedMode = rawMode;
    if (chapter) normalizedMode = "chapter";
    else if (category) normalizedMode = "category";
    else if (!normalizedMode) normalizedMode = "mixed";

    modeCounts[normalizedMode] = (modeCounts[normalizedMode] || 0) + 1;

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
    modeCounts,
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

function rankPracticeStats(statsMap, kind) {
  const entries = Object.entries(statsMap || {})
    .map(([key, stats]) => {
      const percent = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;
      return {
        key,
        label: kind === "chapter" ? Number(key) : key,
        percent,
        total: stats.total,
        level: derivePracticeLevel(percent),
      };
    })
    .filter((item) => item.total > 0);

  const strongest = [...entries]
    .sort((a, b) => {
      if ((b.percent || 0) !== (a.percent || 0)) return (b.percent || 0) - (a.percent || 0);
      return (b.total || 0) - (a.total || 0);
    })[0] || null;

  const weakestCandidates = entries.filter((item) => Number.isFinite(item?.percent) && Number(item.percent) < 80);

  const weakest = [...weakestCandidates]
    .sort((a, b) => {
      if ((a.percent || 0) !== (b.percent || 0)) return (a.percent || 0) - (b.percent || 0);
      return (b.total || 0) - (a.total || 0);
    })[0] || null;

  return {
    strongest,
    weakest,
    entries,
  };
}

function summarizePracticeDiagnostics(practiceSessions) {
  const completed = practiceSessions.filter(
    (session) => session?.status === "completed" && session?.payload && typeof session.payload === "object"
  );

  const chapterStats = {};
  const categoryStats = {};

  completed.forEach((session) => {
    const payload = session.payload || {};
    const answers = payload.answers || {};
    const questionsById = payload.questionsById || {};
    const mode = String(session?.mode || payload?.mode || "").trim().toLowerCase();
    const isChapterSession = mode === "chapter";
    const isCategorySession = mode === "category";

    Object.entries(answers).forEach(([questionId, answer]) => {
      if (!answer?.submitted) return;
      const question = questionsById?.[questionId];
      if (!question) return;
      const isCorrect = Boolean(answer?.is_correct);

      if (isChapterSession && question.chapter_tag) {
        const chapterId = Number(question.chapter_tag);
        if (!chapterStats[chapterId]) chapterStats[chapterId] = { correct: 0, total: 0 };
        chapterStats[chapterId].total += 1;
        if (isCorrect) chapterStats[chapterId].correct += 1;
      }

      if (isCategorySession && question.category_tag) {
        const categoryId = String(question.category_tag);
        if (!categoryStats[categoryId]) categoryStats[categoryId] = { correct: 0, total: 0 };
        categoryStats[categoryId].total += 1;
        if (isCorrect) categoryStats[categoryId].correct += 1;
      }
    });
  });

  return {
    chapter: rankPracticeStats(chapterStats, "chapter"),
    category: rankPracticeStats(categoryStats, "category"),
  };
}

function derivePracticeLevel(percent) {
  if (!Number.isFinite(percent)) return null;
  if (percent >= 80) return "Strong";
  if (percent < 60) return "Weak";
  return "Developing";
}

function summarizePracticeLearningSignals(practiceSessions) {
  const completed = practiceSessions.filter(
    (session) => session?.status === "completed" && session?.payload && typeof session.payload === "object"
  );

  const categoryStats = {};
  const chapterStats = {};
  let totalCorrect = 0;
  let totalAnswered = 0;

  completed.forEach((session) => {
    const answers = session.payload?.answers || {};
    const questionsById = session.payload?.questionsById || {};

    Object.entries(answers).forEach(([questionId, answer]) => {
      if (!answer?.submitted) return;
      const question = questionsById?.[questionId];
      if (!question) return;

      const isCorrect = Boolean(answer?.is_correct);
      const categoryId = question.category_tag || null;
      const chapterId = question.chapter_tag || null;

      totalAnswered += 1;
      if (isCorrect) totalCorrect += 1;

      if (categoryId) {
        if (!categoryStats[categoryId]) categoryStats[categoryId] = { correct: 0, total: 0 };
        categoryStats[categoryId].total += 1;
        if (isCorrect) categoryStats[categoryId].correct += 1;
      }

      if (chapterId) {
        const key = Number(chapterId);
        if (!chapterStats[key]) chapterStats[key] = { correct: 0, total: 0 };
        chapterStats[key].total += 1;
        if (isCorrect) chapterStats[key].correct += 1;
      }
    });
  });

  if (!totalAnswered) {
    return {
      overallStatus: null,
      strongestCategories: [],
      categoriesNeedingWork: [],
      highRiskCategories: [],
      chapterPriorities: [],
      source: null,
    };
  }

  const overallPercent = Math.round((totalCorrect / totalAnswered) * 100);

  const rankedCategories = Object.entries(categoryStats)
    .map(([category, stats]) => {
      const percent = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;
      return {
        category,
        level: derivePracticeLevel(percent),
        percent,
        total: stats.total,
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => {
      if ((b.percent || 0) !== (a.percent || 0)) return (b.percent || 0) - (a.percent || 0);
      return (b.total || 0) - (a.total || 0);
    });

  const weakestCategories = [...rankedCategories].sort((a, b) => {
    if ((a.percent || 0) !== (b.percent || 0)) return (a.percent || 0) - (b.percent || 0);
    return (b.total || 0) - (a.total || 0);
  });
  const highRiskCategoryKeys = new Set(
    weakestCategories
      .filter((item) => item.percent != null && item.percent < 60)
      .map((item) => item.category)
      .filter(Boolean)
  );

  const rankedChapters = Object.entries(chapterStats)
    .map(([chapterId, stats]) => {
      const percent = stats.total ? Math.round((stats.correct / stats.total) * 100) : null;
      return {
        chapterId: Number(chapterId),
        priority: derivePracticeLevel(percent) || "Developing",
        percent,
        total: stats.total,
      };
    })
    .filter((item) => item.total > 0)
    .sort((a, b) => {
      if ((a.percent || 0) !== (b.percent || 0)) return (a.percent || 0) - (b.percent || 0);
      return (b.total || 0) - (a.total || 0);
    });

  return {
    overallStatus: deriveOverallStatusFromScore(overallPercent),
    strongestCategories: rankedCategories
      .filter((item) => item.level === "Strong")
      .slice(0, 3)
      .map((item) => item.category),
    categoriesNeedingWork: weakestCategories
      .filter(
        (item) =>
          (item.level === "Weak" || item.level === "Developing") &&
          !highRiskCategoryKeys.has(item.category)
      )
      .slice(0, 4)
      .map((item) => ({
        category: item.category,
        level: item.level,
      })),
    highRiskCategories: weakestCategories
      .filter((item) => item.percent != null && item.percent < 60)
      .slice(0, 4)
      .map((item) => ({
        category: item.category,
        level: item.level || "Weak",
      })),
    chapterPriorities: rankedChapters.slice(0, 3).map((item) => ({
      chapterId: item.chapterId,
      priority: item.priority,
    })),
    source: "practice",
  };
}

function summarizeLearningSignals(examAttempts, practiceSessions) {
  const examSummary = summarizeExamAttempts(examAttempts);
  const overallExamStatus = deriveOverallStatusFromScore(examSummary?.averageScore);
  const latestCompletedAttempt = getCompletedAttemptsSorted(examAttempts)[0] || null;
  const analytics = getExamAnalyticsPayload(latestCompletedAttempt);
  if (!analytics) {
    const practiceSignals = summarizePracticeLearningSignals(practiceSessions);
    if (practiceSignals.source === "practice" && Number(examSummary?.completedAttempts || 0) === 0) {
      return practiceSignals;
    }

    return {
      overallStatus: overallExamStatus,
      strongestCategories: [],
      categoriesNeedingWork: [],
      highRiskCategories: [],
      chapterPriorities: [],
      source: examSummary?.completedAttempts > 0 ? "exam-score" : null,
    };
  }

  const categoryPriority = Array.isArray(analytics.category_priority) ? analytics.category_priority : [];
  const chapterGuidance = Array.isArray(analytics.chapter_guidance) ? analytics.chapter_guidance : [];
  const overallStatus = overallExamStatus || analytics.overall_status || null;
  const highRiskCategoryKeys = new Set(
    categoryPriority
      .filter((item) => item?.is_high_risk && item?.level === "Weak")
      .map((item) => item?.category_id)
      .filter(Boolean)
  );

  return {
    overallStatus,
    strongestCategories: categoryPriority
      .filter((item) => item?.level === "Strong")
      .slice(0, 3)
      .map((item) => item.category_id),
    categoriesNeedingWork: categoryPriority
      .filter(
        (item) =>
          (item?.level === "Weak" || item?.level === "Developing") &&
          !highRiskCategoryKeys.has(item?.category_id)
      )
      .slice(0, 4)
      .map((item) => ({
        category: item.category_id,
        level: item.level,
      })),
    highRiskCategories: categoryPriority
      .filter((item) => item?.is_high_risk && item?.level === "Weak")
      .slice(0, 4)
      .map((item) => ({
        category: item.category_id,
        level: item.level,
      })),
    chapterPriorities: chapterGuidance.slice(0, 3).map((item) => ({
      chapterId: item.chapter_id,
      priority: item.priority,
    })),
    source: "exam-analytics",
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang");
    const requestedUserId = searchParams.get("user_id");
    let includeAllLanguages = false;

    let resolved = await resolveBackendRequestUser(request, null, "Student");
    let userId = resolved.userId;

    if (requestedUserId && requestedUserId !== resolved.userId) {
      const owner = await requireControlCenterRequestUser(request, { allowTeacher: true });
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

      if (String(owner?.role || "").toLowerCase() === "teacher") {
        const targetContext = await loadSchoolContextForUser(requestedUserId).catch(() => ({ enrollments: [] }));
        const targetClassIds = new Set(
          (targetContext?.enrollments || [])
            .filter((row) => String(row?.role || "").toLowerCase() === "student" && String(row?.status || "").toLowerCase() === "active")
            .map((row) => row?.class_group_id)
            .filter(Boolean)
        );
        const allowedClassIds = new Set(owner?.allowedClassGroupIds || []);
        const canAccess = Array.from(targetClassIds).some((classGroupId) => allowedClassIds.has(classGroupId));
        if (!canAccess) {
          return NextResponse.json(
            {
              ok: false,
              service: "student-overview-report",
              error: "This student is not available for this teacher account.",
            },
            { status: 403 }
          );
        }
      }

      userId = requestedUserId;
      includeAllLanguages = true;
      resolved = {
        ...owner,
        source: "owner-report",
        appUser: targetUser,
      };
    }

    const [examAttempts, practiceSessions, remediationSessions, questionHistory] = await Promise.all([
      loadExamAttemptRecords(userId, includeAllLanguages ? null : lang),
      loadPracticeSessionRecords(userId, includeAllLanguages ? null : lang),
      loadRemediationSessionRecords(userId, includeAllLanguages ? null : lang),
      loadQuestionHistoryRecords(userId, includeAllLanguages ? {} : { lang }),
    ]);

    const questionBankIndex = buildQuestionBankIndex();

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
        practiceDiagnostics: summarizePracticeDiagnostics(practiceSessions),
        remediationFocus: summarizeRemediationFocus(remediationSessions),
        learningSignals: summarizeLearningSignals(examAttempts, practiceSessions),
        latestExamResults: summarizeLatestCompletedExamResult(examAttempts, questionBankIndex),
        examHistory: summarizeExamHistory(examAttempts, questionBankIndex),
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
