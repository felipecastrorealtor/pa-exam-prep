-- ═══════════════════════════════════════════════════════════════════════════
-- PA Real Estate Exam Prep — Initial Schema
-- Migration: 001_initial_schema.sql
--
-- SECURITY MODEL:
--   • All tables have RLS enabled. Default: DENY ALL.
--   • Users can read/write only their own rows.
--   • Admin access uses service-role key (server-side only, never in browser).
--   • Questions/units readable by any authenticated user with active subscription
--     (checked in app layer via middleware; DB layer allows authenticated reads).
-- ═══════════════════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────────────────────────────────────────
-- EXTENSIONS
-- ─────────────────────────────────────────────────────────────────────────────
create extension if not exists "pgcrypto";
create extension if not exists "pg_trgm"; -- fuzzy search for glossary

-- ─────────────────────────────────────────────────────────────────────────────
-- ENUMS
-- ─────────────────────────────────────────────────────────────────────────────
create type user_role as enum ('user', 'admin');
create type subscription_status as enum (
  'trialing',
  'active',
  'free_access',   -- redeemed a 30-day free-access code, no card on file
  'past_due',
  'canceled',
  'incomplete',
  'paused'
);
create type access_code_type as enum ('free_30d', 'promo_15');

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: profiles
-- One row per auth.users entry — created automatically via trigger.
-- ─────────────────────────────────────────────────────────────────────────────
create table profiles (
  id                      uuid primary key references auth.users(id) on delete cascade,
  email                   text not null,
  display_name            text,
  role                    user_role not null default 'user',
  preferred_lang          text not null default 'en' check (preferred_lang in ('en', 'es')),

  -- Subscription fields (denormalized for fast middleware checks)
  subscription_status     subscription_status,
  subscription_expires_at timestamptz,  -- for free_access codes
  stripe_customer_id      text unique,
  stripe_subscription_id  text unique,

  created_at              timestamptz not null default now(),
  updated_at              timestamptz not null default now()
);

alter table profiles enable row level security;

-- Users can read & update their own profile
create policy "profiles: own read"   on profiles for select using (auth.uid() = id);
create policy "profiles: own update" on profiles for update using (auth.uid() = id)
  with check (
    auth.uid() = id
    and role = (select role from profiles where id = auth.uid()) -- prevent self-elevation
  );

-- Trigger: create profile on new user signup
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, email, display_name)
  values (
    new.id,
    new.email,
    coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1))
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure handle_new_user();

-- Trigger: keep updated_at current
create or replace function update_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end;
$$;

create trigger profiles_updated_at before update on profiles
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: access_codes
-- Promotional and free-trial codes (not Stripe).
-- ─────────────────────────────────────────────────────────────────────────────
create table access_codes (
  id            uuid primary key default gen_random_uuid(),
  code          text not null unique,          -- uppercase, user-entered
  type          access_code_type not null,
  duration_days integer not null default 30,   -- for free_30d: 30 days access
  max_uses      integer,                       -- null = unlimited
  uses_count    integer not null default 0,
  active        boolean not null default true,
  expires_at    timestamptz,                   -- code validity window (null = forever)
  notes         text,                          -- admin notes
  created_at    timestamptz not null default now()
);

alter table access_codes enable row level security;
-- Only service-role (admin) can read/write access_codes
-- No user-facing RLS policies — all validation done server-side

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: units
-- 21 exam prep units (IDs 1–12, 14–22; unit 13 is a disabled placeholder).
-- ─────────────────────────────────────────────────────────────────────────────
create table units (
  id            integer primary key,           -- matches original app unit IDs
  title_en      text not null,
  title_es      text not null,
  description_en text,
  description_es text,
  enabled       boolean not null default true,
  sort_order    integer not null default 0,
  is_pa_specific boolean not null default false, -- PA state-specific content
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

alter table units enable row level security;

-- Any authenticated user can read enabled units
create policy "units: auth read enabled" on units for select
  to authenticated using (enabled = true);

create trigger units_updated_at before update on units
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: questions
-- English question text + correct answer letter.
-- ─────────────────────────────────────────────────────────────────────────────
create table questions (
  id            uuid primary key default gen_random_uuid(),
  unit_id       integer not null references units(id),
  -- Stable integer ID within unit (matches original app's question numbering)
  legacy_id     integer not null,
  question_en   text not null,
  option_a_en   text not null,
  option_b_en   text not null,
  option_c_en   text not null,
  option_d_en   text not null,
  -- Correct answer is the LETTER (A/B/C/D), tied to option position in EN
  correct       char(1) not null check (correct in ('A','B','C','D')),
  explanation_en text,
  page_ref      integer,                        -- textbook page reference
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  unique(unit_id, legacy_id)
);

create index questions_unit_id_idx on questions(unit_id);
create index questions_enabled_idx on questions(enabled) where enabled = true;

alter table questions enable row level security;

create policy "questions: auth read enabled" on questions for select
  to authenticated using (enabled = true);

create trigger questions_updated_at before update on questions
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: question_translations
-- Spanish translations. Option order MUST match the English options exactly
-- (correct answer letter references EN option positions).
-- ─────────────────────────────────────────────────────────────────────────────
create table question_translations (
  question_id   uuid primary key references questions(id) on delete cascade,
  question_es   text not null,
  option_a_es   text not null,
  option_b_es   text not null,
  option_c_es   text not null,
  option_d_es   text not null,
  explanation_es text,
  updated_at    timestamptz not null default now()
);

alter table question_translations enable row level security;

create policy "question_translations: auth read" on question_translations for select
  to authenticated using (true);

create trigger question_translations_updated_at before update on question_translations
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: glossary_terms
-- 129 entries from the original app, extensible.
-- ─────────────────────────────────────────────────────────────────────────────
create table glossary_terms (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,           -- stable URL slug
  term_en       text not null,
  definition_en text not null,
  term_es       text,
  definition_es text,
  unit_ids      integer[],                      -- which units this term appears in
  enabled       boolean not null default true,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index glossary_slug_idx on glossary_terms(slug);
create index glossary_search_idx on glossary_terms using gin(
  to_tsvector('english', term_en || ' ' || coalesce(definition_en, ''))
);

alter table glossary_terms enable row level security;

create policy "glossary_terms: auth read" on glossary_terms for select
  to authenticated using (enabled = true);

create trigger glossary_updated_at before update on glossary_terms
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: achievements
-- 21 achievement definitions (seeded below).
-- ─────────────────────────────────────────────────────────────────────────────
create table achievements (
  id            text primary key,              -- slug like 'first_question'
  title_en      text not null,
  title_es      text not null,
  description_en text not null,
  description_es text not null,
  icon          text not null,                 -- emoji or SVG path reference
  xp_reward     integer not null default 0,
  condition     jsonb not null,               -- {type, threshold} for server-side eval
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now()
);

alter table achievements enable row level security;

create policy "achievements: auth read" on achievements for select
  to authenticated using (true);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: user_progress
-- One row per user — overall XP, streaks, study goals.
-- ─────────────────────────────────────────────────────────────────────────────
create table user_progress (
  user_id             uuid primary key references profiles(id) on delete cascade,
  xp                  integer not null default 0,
  level               integer not null default 1,
  daily_streak        integer not null default 0,
  longest_streak      integer not null default 0,
  last_study_date     date,
  today_questions     integer not null default 0,
  total_questions     integer not null default 0,
  total_correct       integer not null default 0,
  total_sessions      integer not null default 0,
  exam_date           date,
  daily_goal          integer not null default 20,
  updated_at          timestamptz not null default now()
);

alter table user_progress enable row level security;

create policy "user_progress: own read"   on user_progress for select using (auth.uid() = user_id);
create policy "user_progress: own insert" on user_progress for insert with check (auth.uid() = user_id);
create policy "user_progress: own update" on user_progress for update using (auth.uid() = user_id);

create trigger user_progress_updated_at before update on user_progress
  for each row execute procedure update_updated_at();

-- Trigger: auto-create user_progress row on profile creation
create or replace function handle_new_profile()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into user_progress (user_id) values (new.id);
  return new;
end;
$$;

create trigger on_profile_created
  after insert on profiles
  for each row execute procedure handle_new_profile();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: question_attempts
-- Per-user, per-question attempt history.
-- ─────────────────────────────────────────────────────────────────────────────
create table question_attempts (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references profiles(id) on delete cascade,
  question_id     uuid not null references questions(id) on delete cascade,
  attempts        integer not null default 0,
  correct         integer not null default 0,
  -- mastery: 0=unseen, 1=seen, 2=learning, 3=mastered
  mastery         smallint not null default 0 check (mastery between 0 and 3),
  last_answer     char(1) check (last_answer in ('A','B','C','D')),
  last_attempt_at timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now(),

  unique(user_id, question_id)
);

create index qa_user_id_idx on question_attempts(user_id);
create index qa_question_id_idx on question_attempts(question_id);
create index qa_mastery_idx on question_attempts(user_id, mastery);

alter table question_attempts enable row level security;

create policy "question_attempts: own read"   on question_attempts for select using (auth.uid() = user_id);
create policy "question_attempts: own insert" on question_attempts for insert with check (auth.uid() = user_id);
create policy "question_attempts: own update" on question_attempts for update using (auth.uid() = user_id);

create trigger question_attempts_updated_at before update on question_attempts
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: study_sessions
-- Each study session (quiz, flashcard, review).
-- ─────────────────────────────────────────────────────────────────────────────
create table study_sessions (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  session_type  text not null check (session_type in ('quiz','flashcard','review','exam')),
  unit_id       integer references units(id),
  questions_answered integer not null default 0,
  correct       integer not null default 0,
  duration_sec  integer,
  score_pct     numeric(5,2),
  lang          text not null default 'en',
  started_at    timestamptz not null default now(),
  completed_at  timestamptz
);

create index study_sessions_user_id_idx on study_sessions(user_id);
create index study_sessions_started_idx on study_sessions(user_id, started_at desc);

alter table study_sessions enable row level security;

create policy "study_sessions: own read"   on study_sessions for select using (auth.uid() = user_id);
create policy "study_sessions: own insert" on study_sessions for insert with check (auth.uid() = user_id);
create policy "study_sessions: own update" on study_sessions for update using (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: flashcard_progress
-- Per-user flashcard spaced-repetition state.
-- ─────────────────────────────────────────────────────────────────────────────
create table flashcard_progress (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references profiles(id) on delete cascade,
  term_id       uuid not null references glossary_terms(id) on delete cascade,
  -- SRS fields
  ease_factor   numeric(4,2) not null default 2.5,
  interval_days integer not null default 1,
  repetitions   integer not null default 0,
  due_at        timestamptz not null default now(),
  last_review   timestamptz,
  updated_at    timestamptz not null default now(),

  unique(user_id, term_id)
);

create index flashcard_due_idx on flashcard_progress(user_id, due_at);

alter table flashcard_progress enable row level security;

create policy "flashcard_progress: own read"   on flashcard_progress for select using (auth.uid() = user_id);
create policy "flashcard_progress: own insert" on flashcard_progress for insert with check (auth.uid() = user_id);
create policy "flashcard_progress: own update" on flashcard_progress for update using (auth.uid() = user_id);

create trigger flashcard_progress_updated_at before update on flashcard_progress
  for each row execute procedure update_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: user_achievements
-- Which achievements each user has unlocked.
-- ─────────────────────────────────────────────────────────────────────────────
create table user_achievements (
  user_id        uuid not null references profiles(id) on delete cascade,
  achievement_id text not null references achievements(id) on delete cascade,
  unlocked_at    timestamptz not null default now(),

  primary key (user_id, achievement_id)
);

alter table user_achievements enable row level security;

create policy "user_achievements: own read"   on user_achievements for select using (auth.uid() = user_id);
create policy "user_achievements: own insert" on user_achievements for insert with check (auth.uid() = user_id);

-- ─────────────────────────────────────────────────────────────────────────────
-- TABLE: events  (reuse existing analytics table, extend with user_id)
-- ─────────────────────────────────────────────────────────────────────────────
-- NOTE: The existing 'events' table in Supabase (used by pa_real_estate_v4.html)
-- should be kept as-is for historical data. New authenticated events can go in a
-- separate 'auth_events' table or we add a nullable user_id column to events.
-- For now, create auth_events for post-auth data:

create table auth_events (
  id         bigint generated always as identity primary key,
  user_id    uuid references profiles(id) on delete set null,
  event      text not null,
  properties jsonb,
  created_at timestamptz not null default now()
);

create index auth_events_user_id_idx on auth_events(user_id);
create index auth_events_event_idx on auth_events(event, created_at desc);

alter table auth_events enable row level security;

create policy "auth_events: own insert" on auth_events for insert
  with check (auth.uid() = user_id or user_id is null);

-- ─────────────────────────────────────────────────────────────────────────────
-- FUNCTION: redeem_access_code
-- Atomically validates + redeems a free-access code for a user.
-- Called from a Netlify Function (service-role), not directly from browser.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function redeem_access_code(
  p_user_id uuid,
  p_code    text
)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_code access_codes%rowtype;
  v_expires timestamptz;
begin
  -- Lock the row so concurrent redemptions don't exceed max_uses
  select * into v_code
  from access_codes
  where code = upper(trim(p_code))
  for update;

  if not found then
    return jsonb_build_object('ok', false, 'error', 'invalid_code');
  end if;

  if not v_code.active then
    return jsonb_build_object('ok', false, 'error', 'inactive_code');
  end if;

  if v_code.expires_at is not null and v_code.expires_at < now() then
    return jsonb_build_object('ok', false, 'error', 'expired_code');
  end if;

  if v_code.max_uses is not null and v_code.uses_count >= v_code.max_uses then
    return jsonb_build_object('ok', false, 'error', 'used_up');
  end if;

  -- Calculate expiry
  v_expires := now() + (v_code.duration_days || ' days')::interval;

  -- Increment uses_count
  update access_codes set uses_count = uses_count + 1 where id = v_code.id;

  -- Grant access on profile
  update profiles set
    subscription_status     = 'free_access',
    subscription_expires_at = v_expires
  where id = p_user_id;

  return jsonb_build_object(
    'ok', true,
    'expires_at', v_expires,
    'duration_days', v_code.duration_days
  );
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Units
-- ─────────────────────────────────────────────────────────────────────────────
insert into units (id, title_en, title_es, sort_order, enabled, is_pa_specific) values
  (1,  'Real Property and the Law',                    'Propiedad Real y la Ley',                      1,  true,  false),
  (2,  'Land Use Controls and Property Development',   'Controles de Uso de Tierra y Desarrollo',      2,  true,  false),
  (3,  'Environmental Issues',                          'Problemas Ambientales',                        3,  true,  false),
  (4,  'Legal Descriptions',                            'Descripciones Legales',                        4,  true,  false),
  (5,  'Interests in Real Estate',                      'Intereses en Bienes Raíces',                   5,  true,  false),
  (6,  'Forms of Real Estate Ownership',                'Formas de Propiedad Inmobiliaria',              6,  true,  false),
  (7,  'Real Estate Brokerage',                         'Corretaje de Bienes Raíces',                   7,  true,  false),
  (8,  'Listing Agreements and Buyer Representation',   'Contratos de Listado y Representación',        8,  true,  false),
  (9,  'Interests in Real Estate / Contracts',          'Contratos Inmobiliarios',                      9,  true,  false),
  (10, 'Real Estate Financing: Principles',             'Financiamiento: Principios',                  10,  true,  false),
  (11, 'Real Estate Financing: Practice',               'Financiamiento: Práctica',                    11,  true,  false),
  (12, 'Leases',                                        'Arrendamientos',                              12,  true,  false),
  (13, '[Placeholder — Unit 13 not in this edition]',   '[Marcador — Unidad 13 no incluida]',          13, false,  false),
  (14, 'Property Management',                           'Administración de Propiedades',               14,  true,  false),
  (15, 'Real Estate Appraisal',                         'Tasación de Bienes Raíces',                   15,  true,  false),
  (16, 'Real Estate Investment',                        'Inversión en Bienes Raíces',                  16,  true,  false),
  (17, 'Closing the Real Estate Transaction',           'Cierre de Transacción Inmobiliaria',          17,  true,  false),
  (18, 'Real Estate Taxation',                          'Tributación Inmobiliaria',                    18,  true,  false),
  (19, 'Fair Housing and Ethical Practices',            'Vivienda Justa y Prácticas Éticas',           19,  true,  false),
  (20, 'Introduction to Construction',                  'Introducción a la Construcción',              20,  true,  false),
  (21, 'License Law and License Administration (PA)',   'Ley de Licencias de PA (RELRA)',              21,  true,  true),
  (22, 'The Real Estate Transaction in Pennsylvania',   'La Transacción Inmobiliaria en PA',           22,  true,  true);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Achievements (21 from original app)
-- ─────────────────────────────────────────────────────────────────────────────
insert into achievements (id, title_en, title_es, description_en, description_es, icon, xp_reward, condition, sort_order) values
  ('first_question',  'First Step',        'Primer Paso',        'Answer your first question',           'Responde tu primera pregunta',        '🎯', 50,  '{"type":"total_questions","threshold":1}',   1),
  ('streak_3',        '3-Day Streak',      'Racha de 3 días',    'Study 3 days in a row',                'Estudia 3 días seguidos',              '🔥', 75,  '{"type":"streak","threshold":3}',            2),
  ('streak_7',        'Week Warrior',      'Guerrero Semanal',   'Study 7 days in a row',                'Estudia 7 días seguidos',              '⚔️', 150, '{"type":"streak","threshold":7}',            3),
  ('streak_30',       'Month Master',      'Maestro Mensual',    'Study 30 days in a row',               'Estudia 30 días seguidos',             '🏆', 500, '{"type":"streak","threshold":30}',           4),
  ('q50',             '50 Questions',      '50 Preguntas',       'Answer 50 questions',                  'Responde 50 preguntas',                '📚', 100, '{"type":"total_questions","threshold":50}',  5),
  ('q100',            'Century Club',      'Club del Centenario','Answer 100 questions',                 'Responde 100 preguntas',               '💯', 200, '{"type":"total_questions","threshold":100}', 6),
  ('q250',            'Question Master',   'Maestro de Preguntas','Answer 250 questions',               'Responde 250 preguntas',               '🎓', 350, '{"type":"total_questions","threshold":250}', 7),
  ('q500',            'Half Thousand',     'Medio Millar',       'Answer 500 questions',                 'Responde 500 preguntas',               '⭐', 500, '{"type":"total_questions","threshold":500}', 8),
  ('perfect_10',      'Perfect 10',        'Perfecto 10',        'Score 100% on a 10-question quiz',     '100% en quiz de 10 preguntas',         '💎', 200, '{"type":"perfect_quiz","min_questions":10}', 9),
  ('unit_complete',   'Unit Complete',     'Unidad Completa',    'Complete all questions in any unit',   'Completa todas las preguntas de un bloque','🏅', 150, '{"type":"unit_complete","threshold":1}',  10),
  ('all_units',       'Full Coverage',     'Cobertura Total',    'Complete all 21 units',                'Completa las 21 unidades',             '🗺️', 750, '{"type":"units_complete","threshold":21}',  11),
  ('mastery_10',      'Rising Expert',     'Experto en Ascenso', 'Master 10 questions',                  'Domina 10 preguntas',                  '🔬', 100, '{"type":"mastered_questions","threshold":10}',12),
  ('mastery_50',      'Expert',            'Experto',            'Master 50 questions',                  'Domina 50 preguntas',                  '🧠', 250, '{"type":"mastered_questions","threshold":50}',13),
  ('mastery_100',     'Master',            'Maestro',            'Master 100 questions',                 'Domina 100 preguntas',                 '🎖️', 500, '{"type":"mastered_questions","threshold":100}',14),
  ('flash_25',        'Flash Learner',     'Aprendiz Flash',     'Review 25 flashcards',                 'Revisa 25 tarjetas',                   '⚡', 75,  '{"type":"flashcards_reviewed","threshold":25}',15),
  ('flash_100',       'Flash Master',      'Maestro Flash',      'Review 100 flashcards',                'Revisa 100 tarjetas',                  '🃏', 200, '{"type":"flashcards_reviewed","threshold":100}',16),
  ('score_90',        'High Scorer',       'Alto Puntaje',       'Score 90%+ on an exam',                '90%+ en un examen',                    '🥇', 200, '{"type":"session_score","threshold":90}',   17),
  ('session_10',      'Dedicated',         'Dedicado',           'Complete 10 study sessions',           'Completa 10 sesiones de estudio',      '📅', 150, '{"type":"total_sessions","threshold":10}',  18),
  ('session_50',      'Committed',         'Comprometido',       'Complete 50 study sessions',           'Completa 50 sesiones de estudio',      '🎯', 400, '{"type":"total_sessions","threshold":50}',  19),
  ('bilingual',       'Bilingual',         'Bilingüe',           'Study in both EN and ES',              'Estudia en inglés y español',           '🌎', 100, '{"type":"bilingual_study","threshold":1}',  20),
  ('exam_ready',      'Exam Ready',        'Listo para el Examen','Achieve 80%+ overall score',         '80%+ de puntuación general',           '📋', 300, '{"type":"overall_score","threshold":80}',   21);

-- ─────────────────────────────────────────────────────────────────────────────
-- SEED: Sample Access Codes
-- Create your own codes in the admin panel or by inserting here.
-- ─────────────────────────────────────────────────────────────────────────────
-- insert into access_codes (code, type, duration_days, max_uses, notes) values
--   ('LAUNCH30', 'free_30d', 30, 100, 'Launch promotion — 30 days free, no card'),
--   ('BETA2024',  'free_30d', 30, null, 'Beta testers unlimited');
