-- ═══════════════════════════════════════════════════════════════════════════
-- Migration 002 — Helper RPCs for atomic increments
-- Run after 001_initial_schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Atomic XP increment (avoids race conditions from client-side reads)
create or replace function increment_xp(p_user_id uuid, p_xp integer)
returns void language plpgsql security definer set search_path = public as $$
begin
  update user_progress
  set xp    = xp + p_xp,
      level = floor((xp + p_xp) / 500) + 1
  where user_id = p_user_id;
end;
$$;

-- Atomic session counter increment
create or replace function increment_sessions(p_user_id uuid)
returns void language plpgsql security definer set search_path = public as $$
begin
  update user_progress
  set total_sessions = total_sessions + 1
  where user_id = p_user_id;
end;
$$;

-- Get full user stats for dashboard (used by study/page.tsx)
create or replace function get_user_stats(p_user_id uuid)
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_progress user_progress%rowtype;
  v_mastered integer;
  v_units    integer;
begin
  select * into v_progress from user_progress where user_id = p_user_id;
  if not found then return '{}'::jsonb; end if;

  select count(distinct (select unit_id from questions q where q.id = qa.question_id))
    into v_units
    from question_attempts qa
   where qa.user_id = p_user_id and qa.mastery = 3;

  select count(*) into v_mastered
    from question_attempts
   where user_id = p_user_id and mastery = 3;

  return jsonb_build_object(
    'xp',             v_progress.xp,
    'level',          v_progress.level,
    'daily_streak',   v_progress.daily_streak,
    'longest_streak', v_progress.longest_streak,
    'today_questions',v_progress.today_questions,
    'total_questions',v_progress.total_questions,
    'total_correct',  v_progress.total_correct,
    'total_sessions', v_progress.total_sessions,
    'daily_goal',     v_progress.daily_goal,
    'exam_date',      v_progress.exam_date,
    'mastered_count', v_mastered,
    'units_with_mastery', v_units
  );
end;
$$;

-- Admin: aggregate user stats
create or replace function admin_get_stats()
returns jsonb language plpgsql security definer set search_path = public as $$
declare
  v_total      bigint;
  v_today      bigint;
  v_this_week  bigint;
  v_this_month bigint;
  v_active_sub bigint;
  v_avg_score  numeric;
  v_avg_streak numeric;
begin
  select count(*) into v_total from profiles;

  select count(distinct user_id) into v_today
    from auth_events
   where created_at >= current_date;

  select count(distinct user_id) into v_this_week
    from auth_events
   where created_at >= current_date - 7;

  select count(distinct user_id) into v_this_month
    from auth_events
   where created_at >= current_date - 30;

  select count(*) into v_active_sub
    from profiles
   where subscription_status in ('active','trialing','free_access');

  select avg(score_pct) into v_avg_score
    from study_sessions
   where completed_at >= current_date - 30;

  select avg(daily_streak) into v_avg_streak
    from user_progress;

  return jsonb_build_object(
    'total_users',     v_total,
    'active_today',    v_today,
    'active_7d',       v_this_week,
    'active_30d',      v_this_month,
    'active_subs',     v_active_sub,
    'avg_score_30d',   round(coalesce(v_avg_score, 0), 1),
    'avg_streak',      round(coalesce(v_avg_streak, 0), 1)
  );
end;
$$;
