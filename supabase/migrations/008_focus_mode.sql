-- Focus mode: study only the questions teachers flag as essential for passing,
-- instead of the whole bank.

-- Marks a question as one of the essentials. Set by an admin in the question
-- editor; students only ever read it.
alter table questions add column if not exists is_essential boolean not null default false;

comment on column questions.is_essential is
  'True when a question covers material that reliably appears on the PSI exam. '
  'Focus mode draws only from these.';

create index if not exists questions_essential_idx on questions(is_essential)
  where is_essential = true;

-- The student's choice, so it persists across devices and sessions.
alter table user_progress add column if not exists study_mode text not null default 'complete'
  check (study_mode in ('complete', 'focus'));

comment on column user_progress.study_mode is
  'complete = the whole question bank; focus = essentials only.';
