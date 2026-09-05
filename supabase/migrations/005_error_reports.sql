-- Student-reported problems with questions, translations, or the app itself.
-- With 321 questions to validate, reader feedback is the cheapest way to find
-- the ones that are wrong.

create table if not exists error_reports (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid references profiles(id) on delete set null,
  question_id   uuid references questions(id) on delete set null,
  kind          text not null check (kind in ('answer','translation','flashcard','app','other')),
  message       text not null,
  context       jsonb,                    -- page, mode, unit, language, user agent
  status        text not null default 'open' check (status in ('open','resolved','dismissed')),
  created_at    timestamptz not null default now(),
  resolved_at   timestamptz
);

create index if not exists error_reports_status_idx   on error_reports(status) where status = 'open';
create index if not exists error_reports_question_idx on error_reports(question_id);

alter table error_reports enable row level security;

-- A signed-in user may file a report as themselves, and read their own.
create policy "error_reports: own insert" on error_reports for insert
  to authenticated with check (auth.uid() = user_id);

create policy "error_reports: own read" on error_reports for select
  to authenticated using (auth.uid() = user_id);

-- Admins read and triage everything.
create policy "error_reports: admin all" on error_reports for all
  to authenticated
  using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'))
  with check (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));
