-- Track whether an account has already consumed its free trial.
-- Server-side eligibility must never depend on the client asking nicely.

alter table profiles add column if not exists trial_used_at timestamptz;

comment on column profiles.trial_used_at is
  'Set the first time a Stripe subscription for this user enters a trial. '
  'Non-null means the account is no longer eligible for a free trial.';

-- Backfill: anyone who already has, or had, a subscription has used their trial.
update profiles
   set trial_used_at = coalesce(trial_used_at, updated_at, now())
 where trial_used_at is null
   and (stripe_subscription_id is not null
        or subscription_status in ('trialing','active','past_due','canceled'));

create index if not exists profiles_trial_used_idx on profiles(trial_used_at)
  where trial_used_at is not null;
