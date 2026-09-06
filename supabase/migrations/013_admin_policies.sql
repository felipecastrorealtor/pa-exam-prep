-- 013_admin_policies.sql
-- Give the admin role real permissions in the database, instead of relying on
-- the application always reaching Postgres with the service-role key.
--
-- Why: the admin screens are supposed to run as service_role, which ignores RLS
-- entirely. When anything makes them arrive as `authenticated` instead — a bad
-- client, a missing env var on one deploy — every read comes back empty and
-- every write is refused, which is what "new row violates row-level security
-- policy for table access_codes" was. With these policies an admin is allowed to
-- do admin things either way, and a non-admin still cannot.

-- ─────────────────────────────────────────────────────────────────────────────
-- is_admin(): SECURITY DEFINER, so it reads `profiles` without triggering the
-- policies on `profiles` — a policy on that table that queried the same table
-- would recurse forever.
-- ─────────────────────────────────────────────────────────────────────────────
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1 from profiles
    where id = auth.uid() and role = 'admin'
  );
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to authenticated;

comment on function public.is_admin() is
  'True when the caller is an admin. SECURITY DEFINER so RLS policies can call '
  'it without recursing through profiles.';

-- ─────────────────────────────────────────────────────────────────────────────
-- units — an admin sees every unit (including disabled ones) and may change
-- `enabled` and `focus_enabled`. Students keep the read-only view they had.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "units: admin all" on units;
create policy "units: admin all" on units
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- access_codes — no policy existed at all, so the table was invisible and
-- unwritable to everyone but service_role. Admins only; students never touch
-- this table directly (redemption goes through redeem_access_code(), which is
-- SECURITY DEFINER).
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "access_codes: admin all" on access_codes;
create policy "access_codes: admin all" on access_codes
  for all to authenticated
  using (public.is_admin())
  with check (public.is_admin());

-- ─────────────────────────────────────────────────────────────────────────────
-- Read access for the admin screens. SELECT only, deliberately: an admin can
-- see the numbers but cannot rewrite a student's progress, and the existing
-- "profiles: own update" guard against self-elevation stays the only way in.
-- ─────────────────────────────────────────────────────────────────────────────
drop policy if exists "profiles: admin read" on profiles;
create policy "profiles: admin read" on profiles
  for select to authenticated
  using (public.is_admin());

drop policy if exists "user_progress: admin read" on user_progress;
create policy "user_progress: admin read" on user_progress
  for select to authenticated
  using (public.is_admin());

drop policy if exists "study_sessions: admin read" on study_sessions;
create policy "study_sessions: admin read" on study_sessions
  for select to authenticated
  using (public.is_admin());

drop policy if exists "question_attempts: admin read" on question_attempts;
create policy "question_attempts: admin read" on question_attempts
  for select to authenticated
  using (public.is_admin());

-- down:
--   drop policy if exists "units: admin all" on units;
--   drop policy if exists "access_codes: admin all" on access_codes;
--   drop policy if exists "profiles: admin read" on profiles;
--   drop policy if exists "user_progress: admin read" on user_progress;
--   drop policy if exists "study_sessions: admin read" on study_sessions;
--   drop policy if exists "question_attempts: admin read" on question_attempts;
--   drop function if exists public.is_admin();
