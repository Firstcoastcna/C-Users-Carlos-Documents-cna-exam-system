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

  const normalizedId = String(user.id || "").trim();
  const normalizedEmail = String(user.email || "").trim().toLowerCase();
  const normalizedFullName = user.fullName || null;
  const requestedRole = String(user.accountRole || "").trim().toLowerCase();
  const normalizedAccountRole =
    requestedRole === "owner" || requestedRole === "school_admin" || requestedRole === "student"
      ? requestedRole
      : null;

  if (!normalizedId) {
    throw new Error("User id is required.");
  }

  if (!normalizedEmail) {
    throw new Error("User email is required.");
  }

  async function loadAppUserByEmail(email) {
    const { data, error } = await supabase
      .from("app_users")
      .select("id, email, full_name, account_role, created_at, updated_at")
      .eq("email", email)
      .maybeSingle();

    if (error) {
      throw new Error(`Supabase load user by email failed: ${error.message}`);
    }

    return data;
  }

  async function migrateUserReferences(fromUserId, toUserId) {
    const [{ data: existingPrefs }, { data: existingSchoolStaff }, { data: existingEnrollments }, { data: existingRedemptions }] =
      await Promise.all([
        supabase
          .from("user_preferences")
          .select(
            "user_id, preferred_language, access_granted, skip_practice_welcome, skip_exam_welcome, has_seen_foundation, has_seen_category_intro, created_at, updated_at"
          )
          .eq("user_id", fromUserId)
          .maybeSingle(),
        supabase
          .from("school_staff")
          .select("id, school_id, user_id, role, created_at, updated_at")
          .eq("user_id", fromUserId),
        supabase
          .from("class_group_enrollments")
          .select("id, class_group_id, user_id, role, status, created_at, updated_at")
          .eq("user_id", fromUserId),
        supabase
          .from("access_code_redemptions")
          .select("id, access_code_id, user_id, redeemed_at, created_at, updated_at")
          .eq("user_id", fromUserId),
      ]);

    if (existingPrefs) {
      await upsertUserPreferences({
        userId: toUserId,
        preferredLanguage: existingPrefs.preferred_language ?? null,
        accessGranted: !!existingPrefs.access_granted,
        skipPracticeWelcome: !!existingPrefs.skip_practice_welcome,
        skipExamWelcome: !!existingPrefs.skip_exam_welcome,
        hasSeenFoundation: !!existingPrefs.has_seen_foundation,
        hasSeenCategoryIntro: !!existingPrefs.has_seen_category_intro,
      });
      await supabase.from("user_preferences").delete().eq("user_id", fromUserId);
    }

    if (Array.isArray(existingSchoolStaff) && existingSchoolStaff.length) {
      for (const row of existingSchoolStaff) {
        await upsertSchoolStaff({
          id: `schoolstaff:${row.school_id}:${toUserId}`,
          schoolId: row.school_id,
          userId: toUserId,
          role: row.role,
        });
      }
      await supabase.from("school_staff").delete().eq("user_id", fromUserId);
    }

    if (Array.isArray(existingEnrollments) && existingEnrollments.length) {
      for (const row of existingEnrollments) {
        await upsertClassGroupEnrollment({
          id: `enrollment:${row.class_group_id}:${toUserId}`,
          classGroupId: row.class_group_id,
          userId: toUserId,
          role: row.role,
          status: row.status,
        });
      }
      await supabase.from("class_group_enrollments").delete().eq("user_id", fromUserId);
    }

    if (Array.isArray(existingRedemptions) && existingRedemptions.length) {
      for (const row of existingRedemptions) {
        await createAccessCodeRedemption({
          id: `redemption:${row.access_code_id}:${toUserId}`,
          accessCodeId: row.access_code_id,
          userId: toUserId,
          redeemedAt: row.redeemed_at,
        });
      }
      await supabase.from("access_code_redemptions").delete().eq("user_id", fromUserId);
    }

    for (const table of ["exam_attempts", "practice_sessions", "remediation_sessions", "question_history"]) {
      const { error } = await supabase.from(table).update({ user_id: toUserId }).eq("user_id", fromUserId);
      if (error) {
        throw new Error(`Supabase migrate ${table} failed: ${error.message}`);
      }
    }
  }

  const existingById = await loadAppUser(normalizedId).catch(() => null);
  const existingByEmail = await loadAppUserByEmail(normalizedEmail);

  if (existingByEmail?.id && existingByEmail.id !== normalizedId) {
    const tempEmail = `${normalizedId}@migration.firstcoastcna.local`;
    const { error: createNewError } = await supabase.from("app_users").insert({
      id: normalizedId,
      email: tempEmail,
      full_name: normalizedFullName,
      account_role: normalizedAccountRole || existingByEmail.account_role || "student",
      updated_at: new Date().toISOString(),
    });

    if (createNewError && !existingById) {
      throw new Error(`Supabase create migrated user failed: ${createNewError.message}`);
    }

    await migrateUserReferences(existingByEmail.id, normalizedId);

    const { error: deleteOldError } = await supabase.from("app_users").delete().eq("id", existingByEmail.id);
    if (deleteOldError) {
      throw new Error(`Supabase delete old user failed: ${deleteOldError.message}`);
    }
  }

  const payload = {
    id: normalizedId,
    email: normalizedEmail,
    full_name: normalizedFullName,
    account_role: normalizedAccountRole || existingById?.account_role || existingByEmail?.account_role || "student",
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("app_users")
    .upsert(payload, { onConflict: "id" })
    .select("id, email, full_name, account_role, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase upsert user failed: ${error.message}`);
  }

  return data;
}

export async function createManagedAuthUser({
  email,
  password,
  fullName = "",
  emailConfirmed = true,
  accountRole = "student",
}) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const normalizedEmail = String(email || "").trim().toLowerCase();
  const normalizedPassword = String(password || "");
  const normalizedFullName = String(fullName || "").trim();

  if (!normalizedEmail) {
    throw new Error("Email is required.");
  }
  if (!normalizedPassword) {
    throw new Error("Password is required.");
  }

  const { data, error } = await supabase.auth.admin.createUser({
    email: normalizedEmail,
    password: normalizedPassword,
    email_confirm: !!emailConfirmed,
    user_metadata: normalizedFullName ? { full_name: normalizedFullName } : {},
  });

  if (error) {
    throw new Error(`Supabase create auth user failed: ${error.message}`);
  }

  const authUser = data?.user;
  if (!authUser?.id) {
    throw new Error("Supabase create auth user failed: Missing user record.");
  }

  const appUser = await upsertAppUser({
    id: authUser.id,
    email: authUser.email || normalizedEmail,
    fullName: normalizedFullName || authUser.user_metadata?.full_name || "",
    accountRole,
  });

  return {
    authUser,
    appUser,
  };
}

export async function loadAppUser(userId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("app_users")
    .select("id, email, full_name, account_role, created_at, updated_at")
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
    .select(
      "user_id, preferred_language, access_granted, skip_practice_welcome, skip_exam_welcome, has_seen_foundation, has_seen_category_intro, created_at, updated_at"
    )
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
    has_seen_foundation: !!record.hasSeenFoundation,
    has_seen_category_intro: !!record.hasSeenCategoryIntro,
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("user_preferences")
    .upsert(payload, { onConflict: "user_id" })
    .select(
      "user_id, preferred_language, access_granted, skip_practice_welcome, skip_exam_welcome, has_seen_foundation, has_seen_category_intro, created_at, updated_at"
    )
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

export async function listAccessGrantedPreferences() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("user_preferences")
    .select(
      "user_id, preferred_language, access_granted, skip_practice_welcome, skip_exam_welcome, has_seen_foundation, has_seen_category_intro, created_at, updated_at"
    )
    .eq("access_granted", true)
    .order("updated_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase list access-granted preferences failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function listClassGroupRecords(schoolId = null) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  let query = supabase
    .from("class_groups")
    .select("id, school_id, name, code, status, starts_on, ends_on, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (schoolId) {
    query = query.eq("school_id", schoolId);
  }

  const { data, error } = await query;

  if (error) {
    throw new Error(`Supabase list class groups failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function deleteClassGroupRecord(classGroupId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const [enrollmentCountResult, codeCountResult] = await Promise.all([
    supabase
      .from("class_group_enrollments")
      .select("id", { count: "exact", head: true })
      .eq("class_group_id", classGroupId),
    supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("class_group_id", classGroupId),
  ]);

  if (enrollmentCountResult.error) {
    throw new Error(`Supabase class enrollment check failed: ${enrollmentCountResult.error.message}`);
  }
  if (codeCountResult.error) {
    throw new Error(`Supabase class code check failed: ${codeCountResult.error.message}`);
  }

  if ((enrollmentCountResult.count || 0) > 0) {
    throw new Error("This class already has enrolled students. Remove enrollments first.");
  }
  if ((codeCountResult.count || 0) > 0) {
    throw new Error("This class still has access codes tied to it. Delete or deactivate those codes first.");
  }

  const { error } = await supabase.from("class_groups").delete().eq("id", classGroupId);
  if (error) {
    throw new Error(`Supabase delete class failed: ${error.message}`);
  }

  return { ok: true, classGroupId };
}

export async function listSchoolRecords() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("schools")
    .select("id, name, slug, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase list schools failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function deleteSchoolRecord(schoolId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const [classCountResult, codeCountResult, staffCountResult] = await Promise.all([
    supabase.from("class_groups").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase.from("access_codes").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
    supabase.from("school_staff").select("id", { count: "exact", head: true }).eq("school_id", schoolId),
  ]);

  if (classCountResult.error) {
    throw new Error(`Supabase school dependency check failed: ${classCountResult.error.message}`);
  }
  if (codeCountResult.error) {
    throw new Error(`Supabase school code check failed: ${codeCountResult.error.message}`);
  }
  if (staffCountResult.error) {
    throw new Error(`Supabase school staff check failed: ${staffCountResult.error.message}`);
  }

  if ((classCountResult.count || 0) > 0) {
    throw new Error("This school still has classes. Delete or move those classes first.");
  }
  if ((codeCountResult.count || 0) > 0) {
    throw new Error("This school still has access codes. Delete or deactivate those codes first.");
  }
  if ((staffCountResult.count || 0) > 0) {
    throw new Error("This school still has staff assignments.");
  }

  const { error } = await supabase.from("schools").delete().eq("id", schoolId);
  if (error) {
    throw new Error(`Supabase delete school failed: ${error.message}`);
  }

  return { ok: true, schoolId };
}

export async function upsertAccessCode(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    code: String(record.code || "").trim().toUpperCase(),
    code_type: record.codeType,
    label: record.label || null,
    status: record.status || "active",
    school_id: record.schoolId || null,
    class_group_id: record.classGroupId || null,
    grants_access: record.grantsAccess !== false,
    max_redemptions: Number.isFinite(record.maxRedemptions) ? Number(record.maxRedemptions) : null,
    expires_at: record.expiresAt || null,
    metadata: record.metadata || {},
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("access_codes")
    .upsert(payload, { onConflict: "id" })
    .select("id, code, code_type, label, status, school_id, class_group_id, grants_access, max_redemptions, expires_at, metadata, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase upsert access code failed: ${error.message}`);
  }

  return data;
}

export async function listAccessCodeRecords() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("access_codes")
    .select("id, code, code_type, label, status, school_id, class_group_id, grants_access, max_redemptions, expires_at, metadata, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase list access codes failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function updateAccessCodeStatus(accessCodeId, status) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("access_codes")
    .update({
      status,
      updated_at: new Date().toISOString(),
    })
    .eq("id", accessCodeId)
    .select("id, code, status, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase update access code status failed: ${error.message}`);
  }

  return data;
}

export async function loadAccessCodeByCode(code) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const normalizedCode = String(code || "").trim().toUpperCase();
  const { data, error } = await supabase
    .from("access_codes")
    .select("id, code, code_type, label, status, school_id, class_group_id, grants_access, max_redemptions, expires_at, metadata, created_at, updated_at")
    .eq("code", normalizedCode)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase load access code failed: ${error.message}`);
  }

  return data;
}

export async function loadAccessCodeRecord(accessCodeId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const normalizedId = String(accessCodeId || "").trim();
  const { data, error } = await supabase
    .from("access_codes")
    .select("id, code, code_type, label, status, school_id, class_group_id, grants_access, max_redemptions, expires_at, metadata, created_at, updated_at")
    .eq("id", normalizedId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase load access code record failed: ${error.message}`);
  }

  return data;
}

export async function loadAccessCodeRedemptionCount(accessCodeId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { count, error } = await supabase
    .from("access_code_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("access_code_id", accessCodeId);

  if (error) {
    throw new Error(`Supabase load access code redemption count failed: ${error.message}`);
  }

  return Number(count || 0);
}

export async function loadAccessCodeRedemptionForUser(accessCodeId, userId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("access_code_redemptions")
    .select("id, access_code_id, user_id, redeemed_at, created_at, updated_at")
    .eq("access_code_id", accessCodeId)
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw new Error(`Supabase load access code redemption failed: ${error.message}`);
  }

  return data;
}

export async function createAccessCodeRedemption(record) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const payload = {
    id: record.id,
    access_code_id: record.accessCodeId,
    user_id: record.userId,
    redeemed_at: record.redeemedAt || new Date().toISOString(),
    updated_at: new Date().toISOString(),
  };

  const { data, error } = await supabase
    .from("access_code_redemptions")
    .upsert(payload, { onConflict: "access_code_id,user_id" })
    .select("id, access_code_id, user_id, redeemed_at, created_at, updated_at")
    .single();

  if (error) {
    throw new Error(`Supabase create access code redemption failed: ${error.message}`);
  }

  return data;
}

export async function listAccessCodeRedemptionRecords() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("access_code_redemptions")
    .select("id, access_code_id, user_id, redeemed_at, created_at, updated_at")
    .order("redeemed_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase list access code redemptions failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function deleteAccessCodeRecord(accessCodeId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { count, error: countError } = await supabase
    .from("access_code_redemptions")
    .select("id", { count: "exact", head: true })
    .eq("access_code_id", accessCodeId);

  if (countError) {
    throw new Error(`Supabase access code delete check failed: ${countError.message}`);
  }

  if ((count || 0) > 0) {
    throw new Error("This code has already been redeemed. Deactivate it instead of deleting it.");
  }

  const { error } = await supabase.from("access_codes").delete().eq("id", accessCodeId);
  if (error) {
    throw new Error(`Supabase delete access code failed: ${error.message}`);
  }

  return { ok: true, accessCodeId };
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

export async function listClassGroupEnrollments() {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { data, error } = await supabase
    .from("class_group_enrollments")
    .select("id, class_group_id, user_id, role, status, created_at, updated_at")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Supabase list class enrollments failed: ${error.message}`);
  }

  return Array.isArray(data) ? data : [];
}

export async function deleteClassGroupEnrollments(classGroupId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const { error } = await supabase
    .from("class_group_enrollments")
    .delete()
    .eq("class_group_id", classGroupId);

  if (error) {
    throw new Error(`Supabase delete class enrollments failed: ${error.message}`);
  }

  return { ok: true, classGroupId };
}

export async function deleteSingleClassGroupEnrollment(enrollmentId) {
  const supabase = getSupabaseServerClient();
  if (!supabase) {
    throw new Error("Supabase server config is not configured.");
  }

  const normalizedId = String(enrollmentId || "").trim();
  if (!normalizedId) {
    throw new Error("Enrollment id is required.");
  }

  const { error } = await supabase
    .from("class_group_enrollments")
    .delete()
    .eq("id", normalizedId);

  if (error) {
    throw new Error(`Supabase delete class enrollment failed: ${error.message}`);
  }

  return { ok: true, enrollmentId: normalizedId };
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
