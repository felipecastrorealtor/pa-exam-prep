-- 012_retention.sql
-- Keeping a lapsed student's work for a year, then clearing it — with two
-- warnings first, so nobody loses a year of study without being told twice.
--
-- The clock is stamped by the nightly sweep, not by the Stripe webhook: that
-- way it also covers access codes that simply ran out, and accounts that
-- lapsed before any of this existed.

alter table profiles add column if not exists lapsed_at          timestamptz;
alter table profiles add column if not exists purge_warned_60_at timestamptz;
alter table profiles add column if not exists purge_warned_30_at timestamptz;
alter table profiles add column if not exists progress_purged_at timestamptz;

comment on column profiles.lapsed_at is
  'When the account last lost access (subscription cancelled, or free access '
  'expired). Cleared the moment access comes back. Study data is cleared one '
  'year after this date.';
comment on column profiles.progress_purged_at is
  'When the retention sweep cleared this account''s study data. The account '
  'itself, and the person''s ability to sign in, are never touched.';

create index if not exists profiles_lapsed_idx on profiles(lapsed_at)
  where lapsed_at is not null;

-- down:
--   drop index if exists profiles_lapsed_idx;
--   alter table profiles
--     drop column if exists lapsed_at,
--     drop column if exists purge_warned_60_at,
--     drop column if exists purge_warned_30_at,
--     drop column if exists progress_purged_at;
