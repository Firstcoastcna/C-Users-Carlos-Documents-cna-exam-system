import { NextResponse } from "next/server";
import { requireControlCenterRequestUser } from "@/app/lib/backend/auth/owner";
import { loadQuestionBank } from "@/app/lib/questionBank";
import {
  loadClassGroupRoster,
  loadExamAttemptRecords,
  loadPracticeSessionRecords,
  loadQuestionHistoryRecords,
  loadRemediationSessionRecords,
  listClassGroupRecords,
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
  const worstScore = scores.length ? Math.min(...scores) : null;

  return {
    totalAttempts: attempts.length,
    completedAttempts: completed.length,
    averageScore,
    bestScore,
    worstScore,
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
  const uniqueQuestionIds = Array.from(new Set(records.map((record) => record?.question_id).filter(Boolean)));
  const bySourceType = records.reduce((acc, record) => {
    const key = record?.source_type || "unknown";
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const uniqueBySourceType = {};
  records.forEach((record) => {
    const key = record?.source_type || "unknown";
    if (!uniqueBySourceType[key]) uniqueBySourceType[key] = new Set();
    if (record?.question_id) uniqueBySourceType[key].add(record.question_id);
  });

  return {
    totalExposureRows: records.length,
    uniqueQuestionCount: uniqueQuestionIds.length,
    bySourceType,
    uniqueQuestionIds,
    uniqueBySourceType: Object.fromEntries(
      Object.entries(uniqueBySourceType).map(([key, ids]) => [key, Array.from(ids)])
    ),
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
  };
}

function summarizeCompletedExamChapterPerformance(examAttempts, bankById) {
  const chapterStats = {};

  examAttempts
    .filter((attempt) => isCompletedExamAttempt(attempt))
    .forEach((attempt) => {
      const deliveredQuestionIds = Array.isArray(attempt?.delivered_question_ids)
        ? attempt.delivered_question_ids
        : [];
      const answersByQid = attempt?.answers_by_qid || {};

      deliveredQuestionIds.forEach((questionId) => {
        const question = bankById?.[questionId];
        const chapterId = Number(question?.chapter_tag);
        if (!Number.isFinite(chapterId)) return;

        const rawAnswer = answersByQid?.[questionId];
        const selectedAnswerId =
          rawAnswer && typeof rawAnswer === "object" ? rawAnswer.selected_answer_id : rawAnswer;
        const isAnswered = selectedAnswerId !== undefined && selectedAnswerId !== null && selectedAnswerId !== "";
        const isCorrect =
          isAnswered &&
          question?.correct_answer != null &&
          String(selectedAnswerId) === String(question.correct_answer);

        if (!chapterStats[chapterId]) {
          chapterStats[chapterId] = { correct: 0, total: 0 };
        }
        chapterStats[chapterId].total += 1;
        if (isCorrect) chapterStats[chapterId].correct += 1;
      });
    });

  return Object.fromEntries(
    Object.entries(chapterStats).map(([chapterId, stats]) => {
      const total = Number(stats?.total || 0);
      const correct = Number(stats?.correct || 0);
      return [
        `Chapter ${chapterId}`,
        {
          correct,
          total,
          percent: total ? Math.round((correct / total) * 100) : null,
        },
      ];
    })
  );
}

function summarizeCompletedExamCategoryPerformance(examAttempts, bankById) {
  const categoryStats = {};

  examAttempts
    .filter((attempt) => isCompletedExamAttempt(attempt))
    .forEach((attempt) => {
      const deliveredQuestionIds = Array.isArray(attempt?.delivered_question_ids)
        ? attempt.delivered_question_ids
        : [];
      const answersByQid = attempt?.answers_by_qid || {};

      deliveredQuestionIds.forEach((questionId) => {
        const question = bankById?.[questionId];
        const categoryId = String(question?.category_tag || question?.primary_category || "").trim();
        if (!categoryId) return;

        const rawAnswer = answersByQid?.[questionId];
        const selectedAnswerId =
          rawAnswer && typeof rawAnswer === "object" ? rawAnswer.selected_answer_id : rawAnswer;
        const isAnswered = selectedAnswerId !== undefined && selectedAnswerId !== null && selectedAnswerId !== "";
        const isCorrect =
          isAnswered &&
          question?.correct_answer != null &&
          String(selectedAnswerId) === String(question.correct_answer);

        if (!categoryStats[categoryId]) {
          categoryStats[categoryId] = { correct: 0, total: 0 };
        }
        categoryStats[categoryId].total += 1;
        if (isCorrect) categoryStats[categoryId].correct += 1;
      });
    });

  return Object.fromEntries(
    Object.entries(categoryStats).map(([categoryId, stats]) => {
      const total = Number(stats?.total || 0);
      const correct = Number(stats?.correct || 0);
      return [
        categoryId,
        {
          correct,
          total,
          percent: total ? Math.round((correct / total) * 100) : null,
        },
      ];
    })
  );
}

function buildStudentSummary({ member, examAttempts, practiceSessions, remediationSessions, questionHistory, bankById }) {
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
    practiceFocus: summarizePracticeFocus(practiceSessions),
    remediation: summarizeRemediationSessions(remediationSessions),
    remediationFocus: summarizeRemediationFocus(remediationSessions),
    questionHistory: summarizeQuestionHistory(questionHistory),
    chapterPerformance: summarizeCompletedExamChapterPerformance(examAttempts, bankById),
    categoryPerformance: summarizeCompletedExamCategoryPerformance(examAttempts, bankById),
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
  const chapterPerformance = {};
  const categoryPerformance = {};
  const practiceChapterCounts = {};
  const practiceCategoryCounts = {};
  const practiceModeCounts = {};
  const remediationCategoryCounts = {};
  const remediationOutcomeCounts = {};
  const questionExposureBySourceType = {};
  const uniqueQuestionIds = new Set();
  const uniqueQuestionIdsBySourceType = {};

  studentSummaries.forEach((student) => {
    const analytics = student.latestExamAnalytics;
    if (analytics) {
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
    }

    Object.entries(student.chapterPerformance || {}).forEach(([chapterName, stats]) => {
      if (!chapterPerformance[chapterName]) {
        chapterPerformance[chapterName] = { correct: 0, total: 0 };
      }
      chapterPerformance[chapterName].correct += Number(stats?.correct || 0);
      chapterPerformance[chapterName].total += Number(stats?.total || 0);
    });

    Object.entries(student.categoryPerformance || {}).forEach(([categoryName, stats]) => {
      if (!categoryPerformance[categoryName]) {
        categoryPerformance[categoryName] = { correct: 0, total: 0 };
      }
      categoryPerformance[categoryName].correct += Number(stats?.correct || 0);
      categoryPerformance[categoryName].total += Number(stats?.total || 0);
    });

    Object.entries(student.practiceFocus?.chapterCounts || {}).forEach(([chapterName, count]) => {
      practiceChapterCounts[chapterName] = (practiceChapterCounts[chapterName] || 0) + Number(count || 0);
    });
    Object.entries(student.practiceFocus?.categoryCounts || {}).forEach(([categoryName, count]) => {
      practiceCategoryCounts[categoryName] = (practiceCategoryCounts[categoryName] || 0) + Number(count || 0);
    });
    Object.entries(student.practiceFocus?.modeCounts || {}).forEach(([mode, count]) => {
      practiceModeCounts[mode] = (practiceModeCounts[mode] || 0) + Number(count || 0);
    });

    Object.entries(student.remediationFocus?.categoryCounts || {}).forEach(([categoryName, count]) => {
      remediationCategoryCounts[categoryName] = (remediationCategoryCounts[categoryName] || 0) + Number(count || 0);
    });
    Object.entries(student.remediationFocus?.outcomeCounts || {}).forEach(([outcome, count]) => {
      remediationOutcomeCounts[outcome] = (remediationOutcomeCounts[outcome] || 0) + Number(count || 0);
    });

    Object.entries(student.questionHistory?.bySourceType || {}).forEach(([sourceType, count]) => {
      questionExposureBySourceType[sourceType] = (questionExposureBySourceType[sourceType] || 0) + Number(count || 0);
    });
    (student.questionHistory?.uniqueQuestionIds || []).forEach((questionId) => {
      if (questionId) uniqueQuestionIds.add(questionId);
    });
    Object.entries(student.questionHistory?.uniqueBySourceType || {}).forEach(([sourceType, ids]) => {
      if (!uniqueQuestionIdsBySourceType[sourceType]) uniqueQuestionIdsBySourceType[sourceType] = new Set();
      (Array.isArray(ids) ? ids : []).forEach((questionId) => {
        if (questionId) uniqueQuestionIdsBySourceType[sourceType].add(questionId);
      });
    });
  });

  const bestScores = studentSummaries
    .map((student) => Number(student.exams?.bestScore))
    .filter(Number.isFinite);
  const worstScores = studentSummaries
    .map((student) => Number(student.exams?.worstScore))
    .filter(Number.isFinite);

  return {
    totalStudents,
    activeStudents,
    classAverageScore: scores.length
      ? Math.round(scores.reduce((sum, value) => sum + value, 0) / scores.length)
      : null,
    bestScore: bestScores.length ? Math.max(...bestScores) : null,
    worstScore: worstScores.length ? Math.min(...worstScores) : null,
    rawExamAttempts: studentSummaries.reduce((sum, student) => sum + student.exams.totalAttempts, 0),
    totalExamAttempts: studentSummaries.reduce((sum, student) => sum + student.exams.completedAttempts, 0),
    totalPracticeSessions: studentSummaries.reduce((sum, student) => sum + student.practice.totalSessions, 0),
    totalRemediationSessions: studentSummaries.reduce((sum, student) => sum + student.remediation.totalSessions, 0),
    overallStatusCounts,
    categoryWeaknessCounts,
    highRiskCategoryCounts,
    chapterPriorityCounts,
    practiceFocus: {
      chapterCounts: practiceChapterCounts,
      categoryCounts: practiceCategoryCounts,
      modeCounts: practiceModeCounts,
    },
    remediationFocus: {
      categoryCounts: remediationCategoryCounts,
      outcomeCounts: remediationOutcomeCounts,
    },
    questionHistory: {
      totalExposureRows: Object.values(questionExposureBySourceType).reduce((sum, count) => sum + Number(count || 0), 0),
      uniqueQuestionCount: uniqueQuestionIds.size,
      bySourceType: questionExposureBySourceType,
      uniqueBySourceType: Object.fromEntries(
        Object.entries(uniqueQuestionIdsBySourceType).map(([sourceType, ids]) => [sourceType, ids.size])
      ),
    },
    categoryPerformance: Object.fromEntries(
      Object.entries(categoryPerformance).map(([categoryName, stats]) => {
        const total = Number(stats?.total || 0);
        const correct = Number(stats?.correct || 0);
        return [
          categoryName,
          {
            correct,
            total,
            percent: total ? Math.round((correct / total) * 100) : null,
          },
        ];
      })
    ),
    chapterPerformance: Object.fromEntries(
      Object.entries(chapterPerformance).map(([chapterName, stats]) => {
        const total = Number(stats?.total || 0);
        const correct = Number(stats?.correct || 0);
        return [
          chapterName,
          {
            correct,
            total,
            percent: total ? Math.round((correct / total) * 100) : null,
          },
        ];
      })
    ),
  };
}

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const lang = searchParams.get("lang");
    const resolved = await requireControlCenterRequestUser(request, { allowTeacher: true });
    const schoolContext = resolved.schoolContext || { classGroups: [], enrollments: [] };
    const targetClassGroupId =
      searchParams.get("class_group_id") ||
      resolved.allowedClassGroupIds?.[0] ||
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

    const allClassGroups = await listClassGroupRecords();
    const targetClassGroup = allClassGroups.find((group) => group.id === targetClassGroupId) || null;

    if (!targetClassGroup) {
      return NextResponse.json(
        {
          ok: false,
          service: "class-overview-report",
          error: "This class group could not be found.",
        },
        { status: 404 }
      );
    }

    const viewerRole = String(resolved?.role || resolved?.appUser?.account_role || "").toLowerCase();
    const allowedSchoolIds = new Set(resolved?.allowedSchoolIds || []);
    const allowedClassGroupIds = new Set(resolved?.allowedClassGroupIds || []);
    const canAccessClass =
      viewerRole === "owner" ||
      (viewerRole === "school_admin" && allowedSchoolIds.has(targetClassGroup.school_id)) ||
      (viewerRole === "teacher" && allowedClassGroupIds.has(targetClassGroupId));

    if (!canAccessClass) {
      return NextResponse.json(
        {
          ok: false,
          service: "class-overview-report",
          error: "This class is not available for this account.",
        },
        { status: 403 }
      );
    }

    const roster = await loadClassGroupRoster(targetClassGroupId);
    const questionBank = loadQuestionBank();
    const bankById = Object.fromEntries(
      (Array.isArray(questionBank) ? questionBank : [])
        .map((question) => [question?.question_id, question])
        .filter(([questionId]) => Boolean(questionId))
    );

    const studentSummaries = await Promise.all(
      roster.map(async (member) => {
        const [examAttempts, practiceSessions, remediationSessions, questionHistory] = await Promise.all([
          // Owner-side class reporting should reflect all student activity, not just one UI language.
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
          bankById,
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
