import fs from "fs";
import path from "path";
import { createClient } from "@supabase/supabase-js";

function loadEnvFile(filePath) {
  if (!fs.existsSync(filePath)) return;
  const raw = fs.readFileSync(filePath, "utf8");
  raw.split(/\r?\n/).forEach((line) => {
    if (!line || /^\s*#/.test(line)) return;
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (!match) return;
    const [, key, valueRaw] = match;
    const value = valueRaw.replace(/^"(.*)"$/, "$1");
    if (!(key in process.env)) process.env[key] = value;
  });
}

loadEnvFile(path.join(process.cwd(), ".env.local"));

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
  throw new Error("Missing Supabase env values.");
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CATEGORY_TO_CHAPTERS = {
  "Scope of Practice & Reporting": {
    primary: [1],
    secondary: [4, 5],
  },
  "Change in Condition": {
    primary: [4],
    secondary: [3, 5],
  },
  "Observation & Safety": {
    primary: [4],
    secondary: [3, 2],
  },
  "Environment & Safety": {
    primary: [2],
    secondary: [3],
  },
  "Infection Control": {
    primary: [2],
    secondary: [3, 4],
  },
  "Personal Care & Comfort": {
    primary: [3],
    secondary: [4],
  },
  "Mobility & Positioning": {
    primary: [3],
    secondary: [4],
  },
  "Communication & Emotional Support": {
    primary: [5],
    secondary: [1, 3],
  },
  "Dignity & Resident Rights": {
    primary: [1],
    secondary: [3, 5],
  },
};

function loadQuestionBank() {
  const filePath = path.join(
    process.cwd(),
    "private_data",
    "questionBank_master_phase6_build_609_questions_04062026.json"
  );
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function buildQuestionBankIndex() {
  const bank = loadQuestionBank();
  return Object.fromEntries((Array.isArray(bank) ? bank : []).map((q) => [q?.question_id, q]));
}

function isCompletedExamAttempt(attempt) {
  if (!Number.isFinite(attempt?.score)) return false;
  if (attempt?.completed_at) return true;
  const mode = String(attempt?.mode || "").trim().toLowerCase();
  if (mode === "finished" || mode === "time_expired") return true;
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
    completedAttempts: completed.length,
    averageScore,
    bestScore,
    worstScore,
    latestCompletedAttempt: completed[0] || null,
  };
}

function deriveOverallStatusFromScore(score) {
  if (!Number.isFinite(score)) return null;
  if (score >= 80) return "On Track";
  if (score < 70) return "High Risk";
  return "Borderline";
}

function buildExamRecommendation({
  overallStatus,
  categoriesNeedingWork,
  highRiskCategories,
}) {
  const topHighRisk = Array.isArray(highRiskCategories) ? highRiskCategories[0] || null : null;
  const topWatch = Array.isArray(categoriesNeedingWork) ? categoriesNeedingWork[0] || null : null;
  const topSignal = topHighRisk || topWatch || null;

  if (!topSignal?.category) {
    return {
      category: null,
      categoryLevel: null,
      categorySource: "none",
      urgency: overallStatus === "High Risk" ? "firm" : overallStatus === "Borderline" ? "firm" : "watch",
      recommendedChapterId: null,
      chapterRelation: "none",
      supportChapterIds: [],
    };
  }

  let urgency = "watch";
  if (topHighRisk?.category) {
    urgency = "urgent";
  } else if (overallStatus === "High Risk" || overallStatus === "Borderline") {
    urgency = "firm";
  }

  const mapping = CATEGORY_TO_CHAPTERS[topSignal.category] || null;
  const primaryChapterId = mapping?.primary?.[0] || null;
  const supportChapterIds = Array.isArray(mapping?.secondary) ? mapping.secondary.slice(0, 2) : [];

  return {
    category: topSignal.category,
    categoryLevel: topSignal.level || null,
    categorySource: topHighRisk?.category ? "high-risk" : "watch",
    urgency,
    recommendedChapterId: primaryChapterId,
    chapterRelation: primaryChapterId ? "primary" : "none",
    supportChapterIds,
  };
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

  const bestChapter =
    [...chapterBreakdown].sort((a, b) => {
      if ((b.percent || 0) !== (a.percent || 0)) return (b.percent || 0) - (a.percent || 0);
      return (b.correctCount || 0) - (a.correctCount || 0);
    })[0] || null;

  const analytics = getExamAnalyticsPayload(attempt);
  const weakestCategory = pickWeakestCategoryFromAnalytics(analytics);

  return {
    score: Number(attempt.score),
    completedAt: attempt?.completed_at || attempt?.updated_at || attempt?.created_at || null,
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
    bestChapter: bestChapter
      ? {
          chapterId: bestChapter.chapterId,
          percent: bestChapter.percent,
        }
      : null,
  };
}

function summarizeLearningSignals(examAttempts) {
  const examSummary = summarizeExamAttempts(examAttempts);
  const overallExamStatus = deriveOverallStatusFromScore(examSummary?.averageScore);
  const latestCompletedAttempt = getCompletedAttemptsSorted(examAttempts)[0] || null;
  const analytics = getExamAnalyticsPayload(latestCompletedAttempt);

  if (!analytics) {
    return {
      overallStatus: overallExamStatus,
      strongestCategories: [],
      categoriesNeedingWork: [],
      highRiskCategories: [],
      chapterPriorities: [],
      examRecommendation: buildExamRecommendation({
        overallStatus: overallExamStatus,
        categoriesNeedingWork: [],
        highRiskCategories: [],
      }),
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

  const strongestCategories = categoryPriority
    .filter((item) => item?.level === "Strong")
    .slice(0, 3)
    .map((item) => item.category_id);
  const categoriesNeedingWork = categoryPriority
    .filter(
      (item) =>
        (item?.level === "Weak" || item?.level === "Developing") &&
        !highRiskCategoryKeys.has(item?.category_id)
    )
    .slice(0, 4)
    .map((item) => ({
      category: item.category_id,
      level: item.level,
    }));
  const highRiskCategories = categoryPriority
    .filter((item) => item?.is_high_risk && item?.level === "Weak")
    .slice(0, 4)
    .map((item) => ({
      category: item.category_id,
      level: item.level,
    }));
  const chapterPriorities = chapterGuidance.slice(0, 3).map((item) => ({
    chapterId: item.chapter_id,
    priority: item.priority,
  }));

  return {
    overallStatus,
    strongestCategories,
    categoriesNeedingWork,
    highRiskCategories,
    chapterPriorities,
    examRecommendation: buildExamRecommendation({
      overallStatus,
      categoriesNeedingWork,
      highRiskCategories,
    }),
    source: "exam-analytics",
  };
}

function buildStudentNextActions(learningSignals) {
  const actions = [];
  const overallStatus = learningSignals?.overallStatus || "";
  const examRecommendation = learningSignals?.examRecommendation || null;

  if (examRecommendation?.category) {
    if (examRecommendation.urgency === "urgent") {
      actions.push(`Start with ${examRecommendation.category} now. It is the clearest high-priority review area right now.`);
    } else if (examRecommendation.urgency === "firm") {
      actions.push(`Focus next on ${examRecommendation.category} before moving on to stronger areas.`);
    } else {
      actions.push(`Keep an eye on ${examRecommendation.category} as you continue building consistency.`);
    }
  }

  if (examRecommendation?.recommendedChapterId && examRecommendation.chapterRelation === "primary") {
    if (examRecommendation.urgency === "urgent") {
      actions.push(`Review Chapter ${examRecommendation.recommendedChapterId} first to strengthen ${examRecommendation.category}.`);
    } else if (examRecommendation.urgency === "firm") {
      actions.push(`Review Chapter ${examRecommendation.recommendedChapterId} next to strengthen ${examRecommendation.category}.`);
    } else {
      actions.push(`Use Chapter ${examRecommendation.recommendedChapterId} to keep strengthening ${examRecommendation.category}.`);
    }
  }

  if (overallStatus === "High Risk") {
    actions.push("Stay with shorter practice and remediation cycles until readiness becomes more stable.");
  } else if (overallStatus === "Borderline") {
    actions.push("Keep building consistency with another full exam after focused review.");
  } else if (overallStatus === "On Track") {
    actions.push("Keep momentum with full exams and targeted review only where weak signals still appear.");
  }

  if (!actions.length) {
    actions.push("Build more activity through practice, exams, or remediation so the report can surface clearer next steps.");
  }

  return actions.slice(0, 4);
}

function mismatchFlags(latestExamResults, learningSignals) {
  const flags = [];
  const recommendedChapter = learningSignals?.examRecommendation?.recommendedChapterId || null;
  const weakestChapter = latestExamResults?.weakestChapter?.chapterId || null;
  const bestChapter = latestExamResults?.bestChapter?.chapterId || null;

  if (recommendedChapter && weakestChapter && recommendedChapter !== weakestChapter) {
    flags.push(`recommended chapter ${recommendedChapter} != latest weakest chapter ${weakestChapter}`);
  }

  if (recommendedChapter && bestChapter && recommendedChapter === bestChapter) {
    flags.push(`recommended chapter ${recommendedChapter} == latest best chapter`);
  }

  return flags;
}

function classifyChapterRecommendation(topWeakCategory, recommendedChapter) {
  if (!topWeakCategory || !recommendedChapter) {
    return { relation: "none", mapping: null };
  }

  const mapping = CATEGORY_TO_CHAPTERS[topWeakCategory] || null;
  if (!mapping) {
    return { relation: "unmapped-category", mapping: null };
  }

  if (Array.isArray(mapping.primary) && mapping.primary.includes(recommendedChapter)) {
    return { relation: "primary", mapping };
  }

  if (Array.isArray(mapping.secondary) && mapping.secondary.includes(recommendedChapter)) {
    return { relation: "secondary", mapping };
  }

  return { relation: "outside-mapping", mapping };
}

async function fetchStudents() {
  const { data, error } = await supabase
    .from("app_users")
    .select("id,email,full_name,account_role")
    .eq("account_role", "student");
  if (error) throw error;
  return (Array.isArray(data) ? data : []).filter((student) => {
    const email = String(student?.email || "").trim().toLowerCase();
    const name = String(student?.full_name || "").trim().toLowerCase();

    if (!email) return false;
    if (email.endsWith("@study.firstcoastcna.com")) return false;
    if (name.includes("test")) return false;
    if (name.includes("exam student")) return false;
    if (name.includes("local")) return false;
    if (name.includes("demo")) return false;

    return true;
  });
}

async function fetchExamAttempts() {
  const { data, error } = await supabase
    .from("exam_attempts")
    .select("id,user_id,test_id,lang,mode,score,completed_at,delivered_question_ids,answers_by_qid,results_payload,created_at,updated_at")
    .order("completed_at", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false });
  if (error) throw error;
  return Array.isArray(data) ? data : [];
}

function groupByUser(attempts) {
  const map = new Map();
  for (const attempt of attempts) {
    const userId = attempt?.user_id;
    if (!userId) continue;
    if (!map.has(userId)) map.set(userId, []);
    map.get(userId).push(attempt);
  }
  return map;
}

function pickSamples(rows, perStatus = 8) {
  const buckets = {
    "On Track": [],
    Borderline: [],
    "High Risk": [],
  };

  for (const row of rows) {
    const status = row.learningSignals?.overallStatus;
    if (!buckets[status]) continue;
    if (buckets[status].length < perStatus) buckets[status].push(row);
  }

  return Object.entries(buckets).flatMap(([status, items]) =>
    items.map((item) => ({ ...item, sampleStatusBucket: status }))
  );
}

function fmtPercent(value) {
  return Number.isFinite(value) ? `${Math.round(value)}%` : "n/a";
}

function getTopWeakSignal(learningSignals) {
  const topHighRisk = learningSignals?.highRiskCategories?.[0] || null;
  if (topHighRisk) {
    return {
      category: topHighRisk.category || null,
      level: topHighRisk.level || "Weak",
      source: "high-risk",
    };
  }

  const topWeak = learningSignals?.categoriesNeedingWork?.[0] || null;
  if (topWeak) {
    return {
      category: topWeak.category || null,
      level: topWeak.level || null,
      source: "watch",
    };
  }

  return {
    category: null,
    level: null,
    source: "none",
  };
}

function classifyStudentUrgency(learningSignals) {
  const status = String(learningSignals?.overallStatus || "");
  const hasHighRiskCategory = Boolean(learningSignals?.highRiskCategories?.length);
  const topWeak = getTopWeakSignal(learningSignals);

  if (hasHighRiskCategory) return "urgent";
  if (status === "High Risk") return "firm";
  if (status === "Borderline") {
    return topWeak.level === "Weak" ? "firm" : "watch";
  }
  if (status === "On Track") return "watch";
  return "unclear";
}

function classifyCurrentActionTone(nextActions) {
  const text = (Array.isArray(nextActions) ? nextActions.join(" ") : "").toLowerCase();
  if (text.includes("stay with shorter practice") || text.includes("start with")) return "urgent";
  if (text.includes("review ") || text.includes("give extra attention")) return "firm";
  if (text.includes("keep momentum") || text.includes("keep building consistency")) return "watch";
  return "unclear";
}

function toneFlags(learningSignals, nextActions) {
  const flags = [];
  const expected = classifyStudentUrgency(learningSignals);
  const actual = classifyCurrentActionTone(nextActions);
  const topWeak = getTopWeakSignal(learningSignals);

  if (
    String(learningSignals?.overallStatus || "") === "On Track" &&
    topWeak.source === "watch" &&
    topWeak.level === "Developing" &&
    actual === "firm"
  ) {
    flags.push("on-track watch-level weakness is being described with firm action wording");
  }

  if (expected === "watch" && actual === "urgent") {
    flags.push("watch-level situation is being described with urgent wording");
  }

  return {
    expected,
    actual,
    flags,
  };
}

async function main() {
  const bankById = buildQuestionBankIndex();
  const [students, examAttempts] = await Promise.all([fetchStudents(), fetchExamAttempts()]);
  const studentById = new Map(students.map((student) => [student.id, student]));
  const attemptsByUser = groupByUser(examAttempts);

  const rows = [];

  for (const [userId, attempts] of attemptsByUser.entries()) {
    const student = studentById.get(userId);
    if (!student) continue;
    const examSummary = summarizeExamAttempts(attempts);
    if (!examSummary.completedAttempts) continue;

    const latestExamResults = summarizeExamResult(examSummary.latestCompletedAttempt, bankById);
    const learningSignals = summarizeLearningSignals(attempts);
    const nextActions = buildStudentNextActions(learningSignals);
    const flags = mismatchFlags(latestExamResults, learningSignals);

    rows.push({
      userId,
      name: student.full_name || "(no name)",
      email: student.email,
      averageScore: examSummary.averageScore,
      completedAttempts: examSummary.completedAttempts,
      learningSignals,
      latestExamResults,
      nextActions,
      flags,
      latestCompletedAt: latestExamResults?.completedAt || null,
    });
  }

  rows.sort((a, b) => {
    const bucketOrder = { "High Risk": 0, Borderline: 1, "On Track": 2 };
    const aOrder = bucketOrder[a.learningSignals?.overallStatus] ?? 9;
    const bOrder = bucketOrder[b.learningSignals?.overallStatus] ?? 9;
    if (aOrder !== bOrder) return aOrder - bOrder;
    const timeA = a.latestCompletedAt ? new Date(a.latestCompletedAt).getTime() : 0;
    const timeB = b.latestCompletedAt ? new Date(b.latestCompletedAt).getTime() : 0;
    return timeB - timeA;
  });

  const sample = pickSamples(rows, 8);
  const summaryByBucket = {};

  for (const row of sample) {
    const bucket = row.sampleStatusBucket;
    const topWeakSignal = getTopWeakSignal(row.learningSignals);
    const topWeakCategory = topWeakSignal.category;
    const recommendedChapter = row.learningSignals?.examRecommendation?.recommendedChapterId || null;
    const recommendationShape = classifyChapterRecommendation(topWeakCategory, recommendedChapter);
    const tone = toneFlags(row.learningSignals, row.nextActions);
    if (!summaryByBucket[bucket]) {
      summaryByBucket[bucket] = {
        total: 0,
        flagged: 0,
        primary: 0,
        secondary: 0,
        outside: 0,
        none: 0,
        toneConcern: 0,
      };
    }
    summaryByBucket[bucket].total += 1;
    if (row.flags.length) summaryByBucket[bucket].flagged += 1;
    if (tone.flags.length) summaryByBucket[bucket].toneConcern += 1;
    if (recommendationShape.relation === "primary") summaryByBucket[bucket].primary += 1;
    else if (recommendationShape.relation === "secondary") summaryByBucket[bucket].secondary += 1;
    else if (recommendationShape.relation === "outside-mapping" || recommendationShape.relation === "unmapped-category") {
      summaryByBucket[bucket].outside += 1;
    } else {
      summaryByBucket[bucket].none += 1;
    }
  }

  const lines = [];
  lines.push("# Student Report Audit Sample");
  lines.push("");
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push("");
  lines.push("## Bucket Summary");
  lines.push("");
  for (const [bucket, stats] of Object.entries(summaryByBucket)) {
    lines.push(
      `- ${bucket}: ${stats.flagged}/${stats.total} chapter-review flags | ${stats.toneConcern}/${stats.total} tone concerns | recommended chapter source -> primary ${stats.primary}, secondary ${stats.secondary}, outside ${stats.outside}, none ${stats.none}`
    );
  }
  lines.push("");

  for (const row of sample) {
    const topWeakSignal = getTopWeakSignal(row.learningSignals);
    const topWeakCategory = topWeakSignal.category;
    const recommendedChapter = row.learningSignals?.examRecommendation?.recommendedChapterId || null;
    const recommendationShape = classifyChapterRecommendation(topWeakCategory, recommendedChapter);
    const tone = toneFlags(row.learningSignals, row.nextActions);
    lines.push(`## ${row.name}`);
    lines.push(`- Email: ${row.email}`);
    lines.push(`- Bucket: ${row.sampleStatusBucket}`);
    lines.push(`- Readiness: ${row.learningSignals?.overallStatus || "n/a"}`);
    lines.push(`- Average exam: ${fmtPercent(row.averageScore)}`);
    lines.push(`- Completed exams: ${row.completedAttempts}`);
    lines.push(`- Latest exam score: ${fmtPercent(row.latestExamResults?.score)}`);
    lines.push(
      `- Latest weakest category: ${row.latestExamResults?.weakestCategory?.category || "n/a"}`
    );
    lines.push(
      `- Latest weakest chapter: ${row.latestExamResults?.weakestChapter?.chapterId ? `Chapter ${row.latestExamResults.weakestChapter.chapterId} (${fmtPercent(row.latestExamResults.weakestChapter.percent)})` : "n/a"}`
    );
    lines.push(
      `- Latest best chapter: ${row.latestExamResults?.bestChapter?.chapterId ? `Chapter ${row.latestExamResults.bestChapter.chapterId} (${fmtPercent(row.latestExamResults.bestChapter.percent)})` : "n/a"}`
    );
    lines.push(`- Top weak category from learning signals: ${topWeakSignal.category || "n/a"}`);
    lines.push(`- Top weak level/source: ${topWeakSignal.level || "n/a"} (${topWeakSignal.source})`);
    lines.push(
      `- Recommended study chapter: ${row.learningSignals?.examRecommendation?.recommendedChapterId ? `Chapter ${row.learningSignals.examRecommendation.recommendedChapterId}` : "n/a"}`
    );
    lines.push(`- Recommendation source relation: ${recommendationShape.relation}`);
    if (recommendationShape.mapping) {
      lines.push(
        `- Category mapping: primary ${recommendationShape.mapping.primary.map((id) => `Chapter ${id}`).join(", ")} | secondary ${recommendationShape.mapping.secondary.map((id) => `Chapter ${id}`).join(", ")}`
      );
    }
    lines.push("- What to do next:");
    for (const action of row.nextActions) {
      lines.push(`  - ${action}`);
    }
    lines.push(`- Suggested urgency for this student: ${tone.expected}`);
    lines.push(`- Current wording tone: ${tone.actual}`);
    lines.push(`- Tone flags: ${tone.flags.length ? tone.flags.join(" | ") : "none"}`);
    lines.push(`- Flags: ${row.flags.length ? row.flags.join(" | ") : "none"}`);
    lines.push("");
  }

  const outPath = path.join(process.cwd(), "docs", "student-report-audit-sample.md");
  fs.writeFileSync(outPath, `${lines.join("\n")}\n`, "utf8");
  console.log(outPath);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
});
