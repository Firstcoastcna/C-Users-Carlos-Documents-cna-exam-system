import { getBackendMode } from "../config";
import { getSupabaseServerClient } from "../supabase/serverClient";
import { getSupabaseConfigSnapshot, hasSupabaseServerConfig } from "../supabase/config";

export function getDatabaseConfig() {
  return {
    mode: getBackendMode(),
    hasDatabaseUrl: !!process.env.DATABASE_URL,
    databaseUrl: process.env.DATABASE_URL ? "[configured]" : "[missing]",
    provider: hasSupabaseServerConfig() ? "supabase" : "unconfigured",
    supabase: getSupabaseConfigSnapshot(),
  };
}

export async function assertDatabaseReady() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { error } = await supabase.from("app_users").select("id", { count: "exact", head: true });
  if (error) {
    throw new Error(`Supabase database check failed: ${error.message}`);
  }

  return {
    ok: true,
    provider: "supabase",
  };
}

export async function upsertAppUser(user) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: user.id,
    email: user.email,
    full_name: user.fullName || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("app_users")
    .upsert(payload, { onConflict: "id" })
    .select("id, email, full_name, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase upsert user failed: ${error.message}`);
  }

  return data;
}

export async function loadAppUser(userId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id, email, full_name, created_at, updated_at")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase load user failed: ${error.message}`);
  }

  return data;
}

export async function loadUserPreferences(userId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select("user_id, preferred_language, access_granted, skip_practice_welcome, skip_exam_welcome, created_at, updated_at")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase load user preferences failed: ${error.message}`);
  }

  return data;
}

export async function upsertUserPreferences(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    user_id: record.userId,
    preferred_language: record.preferredLanguage ?? null,
    access_granted: !!record.accessGranted,
    skip_practice_welcome: !!record.skipPracticeWelcome,
    skip_exam_welcome: !!record.skipExamWelcome,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select("user_id, preferred_language, access_granted, skip_practice_welcome, skip_exam_welcome, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase upsert user preferences failed: ${error.message}`);
  }

  return data;
}

export async function upsertSchool(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    name: record.name,
    slug: record.slug || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("schools")
    .upsert(payload, { onConflict: "id" })
    .select("id, name, slug, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase upsert school failed: ${error.message}`);
  }

  return data;
}

export async function upsertSchoolStaff(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    school_id: record.schoolId,
    user_id: record.userId,
    role: record.role,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("school_staff")
    .upsert(payload, { onConflict: "id" })
    .select("id, school_id, user_id, role, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase upsert school staff failed: ${error.message}`);
  }

  return data;
}

export async function upsertClassGroup(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    school_id: record.schoolId,
    name: record.name,
    code: record.code || null,
    status: record.status || "active",
    starts_on: record.startsOn || null,
    ends_on: record.endsOn || null,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("class_groups")
    .upsert(payload, { onConflict: "id" })
    .select("id, school_id, name, code, status, starts_on, ends_on, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase upsert class group failed: ${error.message}`);
  }

  return data;
}

export async function upsertClassGroupEnrollment(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    class_group_id: record.classGroupId,
    user_id: record.userId,
    role: record.role || "student",
    status: record.status || "active",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("class_group_enrollments")
    .upsert(payload, { onConflict: "id" })
    .select("id, class_group_id, user_id, role, status, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase upsert class enrollment failed: ${error.message}`);
  }

  return data;
}

export async function loadSchoolContextForUser(userId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const [staffResult, enrollmentResult] = await Promise.all([
    supabase
      .from("school_staff")
      .select("id, school_id, user_id, role, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
    supabase
      .from("class_group_enrollments")
      .select("id, class_group_id, user_id, role, status, created_at, updated_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false }),
  ]);

  if (staffResult.error) {
    throw new Error(`Supabase load school staff context failed: ${staffResult.error.message}`);
  }

  if (enrollmentResult.error) {
    throw new Error(`Supabase load class enrollment context failed: ${enrollmentResult.error.message}`);
  }

  const staffRows = Array.isArray(staffResult.data) ? staffResult.data : [];
  const enrollmentRows = Array.isArray(enrollmentResult.data) ? enrollmentResult.data : [];

  const schoolIds = Array.from(new Set(staffRows.map((row) => row.school_id).filter(Boolean)));
  const classGroupIds = Array.from(new Set(enrollmentRows.map((row) => row.class_group_id).filter(Boolean)));

  const [schoolsResult, classGroupsResult] = await Promise.all([
    schoolIds.length
      ? supabase
          .from("schools")
          .select("id, name, slug, created_at, updated_at")
          .in("id", schoolIds)
      : Promise.resolve({ data: [], error: null }),
    classGroupIds.length
      ? supabase
          .from("class_groups")
          .select("id, school_id, name, code, status, starts_on, ends_on, created_at, updated_at")
          .in("id", classGroupIds)
      : Promise.resolve({ data: [], error: null }),
  ]);

  if (schoolsResult.error) {
    throw new Error(`Supabase load schools failed: ${schoolsResult.error.message}`);
  }

  if (classGroupsResult.error) {
    throw new Error(`Supabase load class groups failed: ${classGroupsResult.error.message}`);
  }

  return {
    staff: staffRows,
    enrollments: enrollmentRows,
    schools: Array.isArray(schoolsResult.data) ? schoolsResult.data : [],
    classGroups: Array.isArray(classGroupsResult.data) ? classGroupsResult.data : [],
  };
}

export async function loadClassGroupRoster(classGroupId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data: enrollments, error: enrollmentError } = await supabase
    .from("class_group_enrollments")
    .select("id, class_group_id, user_id, role, status, created_at, updated_at")
    .eq("class_group_id", classGroupId)
    .order("created_at", { ascending: true });

  if (enrollmentError) {
    throw new Error(`Supabase load class roster failed: ${enrollmentError.message}`);
  }

  const rows = Array.isArray(enrollments) ? enrollments : [];
  const userIds = Array.from(new Set(rows.map((row) => row.user_id).filter(Boolean)));

  const { data: users, error: usersError } = userIds.length
    ? await supabase
        .from("app_users")
        .select("id, email, full_name, created_at, updated_at")
        .in("id", userIds)
    : { data: [], error: null };

  if (usersError) {
    throw new Error(`Supabase load class roster users failed: ${usersError.message}`);
  }

  const usersById = Object.fromEntries((Array.isArray(users) ? users : []).map((user) => [user.id, user]));

  return rows.map((row) => ({
    ...row,
    user: usersById[row.user_id] || null,
  }));
}

function normalizeQuestionIds(questionIds) {
  if (!Array.isArray(questionIds)) return [];
  return Array.from(
    new Set(
      questionIds
        .map((item) => String(item || "").trim())
        .filter(Boolean)
    )
  );
}

export async function recordQuestionHistoryBatch({
  userId,
  sourceType,
  sourceId,
  questionIds,
  lang = null,
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const ids = normalizeQuestionIds(questionIds);
  if (!ids.length) {
    return { ok: true, inserted: 0 };
  }

  const rows = ids.map((questionId) => ({
    id: `${userId}:${sourceType}:${sourceId}:${questionId}`,
    user_id: userId,
    question_id: questionId,
    source_type: sourceType,
    source_id: sourceId,
    lang: lang || null,
  }));

  const { error } = await supabase
    .from("question_history")
    .upsert(rows, { onConflict: "id", ignoreDuplicates: true });

  if (error) {
    throw new Error(`Supabase question history upsert failed: ${error.message}`);
  }

  return { ok: true, inserted: rows.length };
}

export async function createPracticeSessionRecord(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    user_id: record.userId,
    lang: record.lang,
    mode: record.mode,
    question_count: Number(record.questionCount || 0),
    status: record.status || "active",
    payload: record.payload || {},
  };

  const { data, error } = await supabase
    .from("practice_sessions")
    .insert(payload)
    .select("id, user_id, lang, mode, question_count, status, payload, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase create practice session failed: ${error.message}`);
  }

  await recordQuestionHistoryBatch({
    userId: record.userId,
    sourceType: "practice",
    sourceId: record.id,
    questionIds: record.payload?.questionIds || [],
    lang: record.lang,
  });

  return data;
}

export async function updatePracticeSessionRecord(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    user_id: record.userId,
    lang: record.lang,
    mode: record.mode,
    question_count: Number(record.questionCount || 0),
    status: record.status || "active",
    payload: record.payload || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("practice_sessions")
    .upsert(payload, { onConflict: "id" })
    .select("id, user_id, lang, mode, question_count, status, payload, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase update practice session failed: ${error.message}`);
  }

  await recordQuestionHistoryBatch({
    userId: record.userId,
    sourceType: "practice",
    sourceId: record.id,
    questionIds: record.payload?.questionIds || [],
    lang: record.lang,
  });

  return data;
}

export async function loadPracticeSessionRecord(userId, sessionId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("practice_sessions")
    .select("id, user_id, lang, mode, question_count, status, payload, created_at, updated_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase load practice session failed: ${error.message}`);
  }

  return data;
}

export async function loadPracticeSessionRecords(userId, lang = null) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  let query = supabase
    .from("practice_sessions")
    .select("id, user_id, lang, mode, question_count, status, payload, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (lang) query = query.eq("lang", lang);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase list practice sessions failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function createExamAttemptRecord(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    user_id: record.userId,
    test_id: Number(record.testId || 0),
    lang: record.lang,
    mode: record.mode || "exam",
    score: Number.isFinite(record.score) ? record.score : null,
    delivered_question_ids: Array.isArray(record.deliveredQuestionIds) ? record.deliveredQuestionIds : [],
    answers_by_qid: record.answersByQid || {},
    review_by_qid: record.reviewByQid || {},
    results_payload: record.resultsPayload || {},
  };

  const { data, error } = await supabase
    .from("exam_attempts")
    .insert(payload)
    .select("id, user_id, test_id, lang, mode, score, delivered_question_ids, answers_by_qid, review_by_qid, results_payload, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase create exam attempt failed: ${error.message}`);
  }

  await recordQuestionHistoryBatch({
    userId: record.userId,
    sourceType: "exam",
    sourceId: record.id,
    questionIds: record.deliveredQuestionIds || [],
    lang: record.lang,
  });

  return data;
}

export async function updateExamAttemptRecord(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    user_id: record.userId,
    test_id: Number(record.testId || 0),
    lang: record.lang,
    mode: record.mode || "exam",
    score: Number.isFinite(record.score) ? record.score : null,
    delivered_question_ids: Array.isArray(record.deliveredQuestionIds) ? record.deliveredQuestionIds : [],
    answers_by_qid: record.answersByQid || {},
    review_by_qid: record.reviewByQid || {},
    results_payload: record.resultsPayload || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("exam_attempts")
    .upsert(payload, { onConflict: "id" })
    .select("id, user_id, test_id, lang, mode, score, delivered_question_ids, answers_by_qid, review_by_qid, results_payload, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase update exam attempt failed: ${error.message}`);
  }

  await recordQuestionHistoryBatch({
    userId: record.userId,
    sourceType: "exam",
    sourceId: record.id,
    questionIds: record.deliveredQuestionIds || [],
    lang: record.lang,
  });

  return data;
}

export async function loadExamAttemptRecord(userId, attemptId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("exam_attempts")
    .select("id, user_id, test_id, lang, mode, score, delivered_question_ids, answers_by_qid, review_by_qid, results_payload, created_at, updated_at")
    .eq("id", attemptId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase load exam attempt failed: ${error.message}`);
  }

  return data;
}

export async function loadExamAttemptRecords(userId, lang = null) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  let query = supabase
    .from("exam_attempts")
    .select("id, user_id, test_id, lang, mode, score, delivered_question_ids, answers_by_qid, review_by_qid, results_payload, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (lang) query = query.eq("lang", lang);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase list exam attempts failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function deleteExamAttemptsForUser(userId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { error } = await supabase
    .from("exam_attempts")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Supabase delete exam attempts failed: ${error.message}`);
  }

  return { ok: true, userId };
}

export async function createRemediationSessionRecord(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    user_id: record.userId,
    lang: record.lang,
    status: record.status || "active",
    categories: Array.isArray(record.categories) ? record.categories : [],
    question_count: Number(record.questionCount || 0),
    payload: record.payload || {},
  };

  const { data, error } = await supabase
    .from("remediation_sessions")
    .insert(payload)
    .select("id, user_id, lang, status, categories, question_count, payload, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase create remediation session failed: ${error.message}`);
  }

  await recordQuestionHistoryBatch({
    userId: record.userId,
    sourceType: "remediation",
    sourceId: record.id,
    questionIds: record.payload?.questionIds || [],
    lang: record.lang,
  });

  return data;
}

export async function updateRemediationSessionRecord(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    user_id: record.userId,
    lang: record.lang,
    status: record.status || "active",
    categories: Array.isArray(record.categories) ? record.categories : [],
    question_count: Number(record.questionCount || 0),
    payload: record.payload || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("remediation_sessions")
    .upsert(payload, { onConflict: "id" })
    .select("id, user_id, lang, status, categories, question_count, payload, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase update remediation session failed: ${error.message}`);
  }

  await recordQuestionHistoryBatch({
    userId: record.userId,
    sourceType: "remediation",
    sourceId: record.id,
    questionIds: record.payload?.questionIds || [],
    lang: record.lang,
  });

  return data;
}

export async function loadRemediationSessionRecord(userId, sessionId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("remediation_sessions")
    .select("id, user_id, lang, status, categories, question_count, payload, created_at, updated_at")
    .eq("id", sessionId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase load remediation session failed: ${error.message}`);
  }

  return data;
}

export async function loadRemediationSessionRecords(userId, lang = null) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  let query = supabase
    .from("remediation_sessions")
    .select("id, user_id, lang, status, categories, question_count, payload, created_at, updated_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (lang) query = query.eq("lang", lang);

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase list remediation sessions failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function deleteRemediationSessionsForUser(userId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { error } = await supabase
    .from("remediation_sessions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Supabase delete remediation sessions failed: ${error.message}`);
  }

  return { ok: true, userId };
}

export async function loadQuestionHistoryRecords(userId, options = {}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  let query = supabase
    .from("question_history")
    .select("id, user_id, question_id, source_type, source_id, lang, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false });

  if (options.lang) query = query.eq("lang", options.lang);
  if (options.sourceType) query = query.eq("source_type", options.sourceType);
  if (Number.isFinite(options.limit) && options.limit > 0) {
    query = query.limit(options.limit);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase list question history failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function deletePracticeSessionsForUser(userId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { error } = await supabase
    .from("practice_sessions")
    .delete()
    .eq("user_id", userId);

  if (error) {
    throw new Error(`Supabase delete practice sessions failed: ${error.message}`);
  }

  return { ok: true, userId };
}
