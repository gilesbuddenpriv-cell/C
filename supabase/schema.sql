-- ============================================================
-- BASRaT Revision Assistant — Supabase Schema
-- Run this in your Supabase project: SQL Editor → New Query
-- ============================================================

-- Enable UUID extension (enabled by default on Supabase)
create extension if not exists "uuid-ossp";

-- ── Topics (pre-built, seeded) ───────────────────────────────
create table if not exists topics (
  id          uuid primary key default gen_random_uuid(),
  slug        text unique not null,
  title       text not null,
  subtitle    text not null,
  emoji       text not null,
  category    text not null
    check (category in ('core_science','clinical_practice','rehabilitation','professional_practice')),
  sort_order  int not null,
  created_at  timestamptz default now()
);

-- ── Custom topics (user-uploaded documents) ──────────────────
create table if not exists custom_topics (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references auth.users(id) on delete cascade not null,
  title         text not null,
  document_url  text,
  document_name text,
  status        text not null default 'processing'
    check (status in ('processing','ready','error')),
  created_at    timestamptz default now()
);

-- ── Questions ─────────────────────────────────────────────────
create table if not exists questions (
  id              uuid primary key default gen_random_uuid(),
  topic_id        uuid references topics(id) on delete cascade,
  custom_topic_id uuid references custom_topics(id) on delete cascade,
  question_text   text not null,
  option_a        text not null,
  option_b        text not null,
  option_c        text not null,
  option_d        text not null,
  correct_option  text not null check (correct_option in ('a','b','c','d')),
  explanation     text not null,
  created_at      timestamptz default now(),
  -- At least one of topic_id or custom_topic_id must be set
  constraint questions_has_topic check (
    topic_id is not null or custom_topic_id is not null
  )
);

create index if not exists questions_topic_id_idx on questions(topic_id);
create index if not exists questions_custom_topic_id_idx on questions(custom_topic_id);

-- ── User question progress (SM-2) ────────────────────────────
create table if not exists user_question_progress (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid references auth.users(id) on delete cascade not null,
  question_id    uuid references questions(id) on delete cascade not null,
  ease_factor    decimal not null default 2.5,
  interval_days  int not null default 0,
  repetitions    int not null default 0,
  next_review_at timestamptz not null default now(),
  last_rating    text check (last_rating in ('again','hard','good','easy')),
  updated_at     timestamptz default now(),
  unique(user_id, question_id)
);

create index if not exists progress_user_question_idx on user_question_progress(user_id, question_id);

-- ── User settings ─────────────────────────────────────────────
create table if not exists user_settings (
  user_id    uuid primary key references auth.users(id) on delete cascade,
  exam_date  date not null default '2026-06-08',
  created_at timestamptz default now()
);

-- ── Study sessions (heatmap) ──────────────────────────────────
create table if not exists study_sessions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid references auth.users(id) on delete cascade not null,
  topic_id          uuid references topics(id) on delete set null,
  custom_topic_id   uuid references custom_topics(id) on delete set null,
  questions_answered int not null default 0,
  correct_answers    int not null default 0,
  session_date       date not null default current_date,
  created_at         timestamptz default now()
);

create index if not exists sessions_user_date_idx on study_sessions(user_id, session_date);

-- ============================================================
-- Row Level Security
-- ============================================================

alter table topics enable row level security;
alter table custom_topics enable row level security;
alter table questions enable row level security;
alter table user_question_progress enable row level security;
alter table user_settings enable row level security;
alter table study_sessions enable row level security;

-- Topics: readable by everyone (anon included)
create policy "topics_public_read" on topics
  for select using (true);

-- Questions for pre-built topics: readable by everyone
create policy "questions_public_read" on questions
  for select using (topic_id is not null);

-- Questions for custom topics: only the owner can read
create policy "questions_custom_owner_read" on questions
  for select using (
    custom_topic_id is not null and
    exists (
      select 1 from custom_topics ct
      where ct.id = questions.custom_topic_id
        and ct.user_id = auth.uid()
    )
  );

-- Custom topics: owner only
create policy "custom_topics_owner" on custom_topics
  for all using (user_id = auth.uid());

-- User question progress: owner only
create policy "progress_owner" on user_question_progress
  for all using (user_id = auth.uid());

-- Questions insert (API service role only — done server-side)
create policy "questions_insert_service" on questions
  for insert with check (true);

-- User settings: owner only
create policy "settings_owner" on user_settings
  for all using (user_id = auth.uid());

-- Study sessions: owner only
create policy "sessions_owner" on study_sessions
  for all using (user_id = auth.uid());

-- ============================================================
-- Seed pre-built topics
-- ============================================================

insert into topics (slug, title, subtitle, emoji, category, sort_order) values
  ('musculoskeletal-anatomy','Musculoskeletal Anatomy','Joints · ligaments · tendons','🦴','core_science',1),
  ('exercise-physiology','Exercise Physiology','Energy systems · adaptation','⚡','core_science',2),
  ('neuroanatomy','Neuroanatomy','PNS · dermatomes · reflexes','🧠','core_science',3),
  ('tissue-healing','Tissue Healing','Pathophysiology · repair','🔬','core_science',4),
  ('pharmacology','Pharmacology','Medications · WADA · doping','💊','core_science',5),
  ('biomechanics','Biomechanics','Gait · force · kinematics','⚙️','core_science',6),
  ('clinical-assessment','Clinical Assessment','History · examination · tests','🔍','clinical_practice',7),
  ('outcome-measures','Outcome Measures','Validated tools · psychometrics','📊','clinical_practice',8),
  ('imaging-investigations','Imaging & Investigations','Indications · triage · flags','🩻','clinical_practice',9),
  ('clinical-cardiology','Clinical Cardiology','Screening · ECG · athlete heart','❤️','clinical_practice',10),
  ('pain-science','Pain Science','Mechanisms · classification','🧩','clinical_practice',11),
  ('strength-conditioning','Strength & Conditioning','Periodisation · loading','🏋️','rehabilitation',12),
  ('return-to-sport','Return to Sport','Criteria · testing · decisions','🏃','rehabilitation',13),
  ('lower-limb-rehab','Lower Limb Rehab','ACL · patellofemoral · ankle','🦵','rehabilitation',14),
  ('upper-limb-rehab','Upper Limb Rehab','Shoulder · elbow · wrist','👋','rehabilitation',15),
  ('manual-therapy','Manual Therapy','Joint mob · soft tissue · evidence','🙌','rehabilitation',16),
  ('load-management','Load Management','ACWR · monitoring · prevention','📈','rehabilitation',17),
  ('spinal-rehabilitation','Spinal Rehabilitation','LBP · cervical · postural','🌿','rehabilitation',18),
  ('professional-ethics','Professional Ethics','BASRaT · consent · scope','⚖️','professional_practice',19),
  ('safeguarding','Safeguarding','Child protection · vulnerable adults','🛡️','professional_practice',20),
  ('research-ebp','Research & EBP','Study design · stats · appraisal','📚','professional_practice',21),
  ('emergency-first-aid','Emergency & First Aid','Pitch-side · ABCDE · concussion','🚑','professional_practice',22)
on conflict (slug) do nothing;
