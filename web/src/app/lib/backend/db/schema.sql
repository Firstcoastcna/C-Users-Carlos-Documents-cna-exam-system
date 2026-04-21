-- Initial backend schema draft
-- This is a planning scaffold only. It is not applied automatically yet.

create table if not exists app_users (
  id text primary key,
  email text unique not null,
  full_name text,
  account_role text not null default 'student',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists user_preferences (
  user_id text primary key references app_users(id) on delete cascade,
  preferred_language text,
  access_granted boolean not null default false,
  skip_practice_welcome boolean not null default false,
  skip_exam_welcome boolean not null default false,
  has_seen_foundation boolean not null default false,
  has_seen_category_intro boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists schools (
  id text primary key,
  name text not null,
  slug text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists school_staff (
  id text primary key,
  school_id text not null references schools(id) on delete cascade,
  user_id text not null references app_users(id) on delete cascade,
  role text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (school_id, user_id)
);

create table if not exists class_groups (
  id text primary key,
  school_id text not null references schools(id) on delete cascade,
  name text not null,
  code text,
  status text not null default 'active',
  starts_on date,
  ends_on date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists class_groups_school_idx on class_groups(school_id, created_at desc);

create table if not exists access_codes (
  id text primary key,
  code text unique not null,
  code_type text not null,
  label text,
  status text not null default 'active',
  school_id text references schools(id) on delete set null,
  class_group_id text references class_groups(id) on delete set null,
  grants_access boolean not null default true,
  max_redemptions integer,
  expires_at timestamptz,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists access_codes_code_idx on access_codes(code);
create index if not exists access_codes_type_idx on access_codes(code_type, created_at desc);

create table if not exists access_code_redemptions (
  id text primary key,
  access_code_id text not null references access_codes(id) on delete cascade,
  user_id text not null references app_users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (access_code_id, user_id)
);

create index if not exists access_code_redemptions_code_idx on access_code_redemptions(access_code_id, redeemed_at desc);
create index if not exists access_code_redemptions_user_idx on access_code_redemptions(user_id, redeemed_at desc);

create table if not exists class_group_enrollments (
  id text primary key,
  class_group_id text not null references class_groups(id) on delete cascade,
  user_id text not null references app_users(id) on delete cascade,
  role text not null default 'student',
  status text not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_group_id, user_id)
);

create index if not exists class_group_enrollments_class_idx on class_group_enrollments(class_group_id, created_at desc);
create index if not exists class_group_enrollments_user_idx on class_group_enrollments(user_id, created_at desc);

create table if not exists class_group_staff (
  id text primary key,
  class_group_id text not null references class_groups(id) on delete cascade,
  user_id text not null references app_users(id) on delete cascade,
  role text not null default 'teacher',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (class_group_id, user_id)
);

create index if not exists class_group_staff_class_idx on class_group_staff(class_group_id, created_at desc);
create index if not exists class_group_staff_user_idx on class_group_staff(user_id, created_at desc);

create table if not exists exam_attempts (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  test_id integer not null,
  lang text not null,
  mode text not null,
  score integer,
  completed_at timestamptz,
  delivered_question_ids jsonb not null default '[]'::jsonb,
  answers_by_qid jsonb not null default '{}'::jsonb,
  review_by_qid jsonb not null default '{}'::jsonb,
  results_payload jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table if exists exam_attempts
add column if not exists completed_at timestamptz;

create index if not exists exam_attempts_user_idx on exam_attempts(user_id, created_at desc);

create table if not exists practice_sessions (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  lang text not null,
  mode text not null,
  question_count integer not null,
  status text not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists practice_sessions_user_idx on practice_sessions(user_id, created_at desc);

create table if not exists remediation_sessions (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  lang text not null,
  status text not null,
  categories jsonb not null default '[]'::jsonb,
  question_count integer not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists remediation_sessions_user_idx on remediation_sessions(user_id, created_at desc);

create table if not exists question_history (
  id text primary key,
  user_id text not null references app_users(id) on delete cascade,
  question_id text not null,
  source_type text not null,
  source_id text not null,
  lang text,
  created_at timestamptz not null default now()
);

create index if not exists question_history_user_idx on question_history(user_id, created_at desc);
create index if not exists question_history_lookup_idx on question_history(user_id, question_id);

-- RLS safety baseline
-- This app uses the Supabase service role on the server for database access,
-- so public-schema tables should not be directly readable or writable from the
-- browser unless we intentionally add policies later.

alter table if exists app_users enable row level security;
alter table if exists user_preferences enable row level security;
alter table if exists schools enable row level security;
alter table if exists school_staff enable row level security;
alter table if exists class_groups enable row level security;
alter table if exists access_codes enable row level security;
alter table if exists access_code_redemptions enable row level security;
alter table if exists class_group_enrollments enable row level security;
alter table if exists class_group_staff enable row level security;
alter table if exists exam_attempts enable row level security;
alter table if exists practice_sessions enable row level security;
alter table if exists remediation_sessions enable row level security;
alter table if exists question_history enable row level security;
