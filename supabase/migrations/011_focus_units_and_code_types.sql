-- 011_focus_units_and_code_types.sql
-- Two admin capabilities: excluding whole units from Focus mode, and access
-- codes that are not all "30 days".
--
-- Reversible: the down-migration is noted under each block.

-- ─────────────────────────────────────────────────────────────────────────────
-- 1. Focus mode can skip whole units
-- ─────────────────────────────────────────────────────────────────────────────
-- `enabled` hides a unit from the app entirely. This is different: the unit
-- stays fully available in Complete mode and is simply not drawn from when the
-- student is in Focus mode.
alter table units
  add column if not exists focus_enabled boolean not null default true;

comment on column units.focus_enabled is
  'False = this unit is skipped when the student studies in Focus mode. '
  'The unit is still fully available in Complete mode.';

-- down: alter table units drop column focus_enabled;

-- ─────────────────────────────────────────────────────────────────────────────
-- 2. Access code types beyond free_30d / promo_15
-- ─────────────────────────────────────────────────────────────────────────────
-- The enum can't gain values inside a transaction, so the column becomes text
-- with a CHECK — same guarantees, and new kinds of code no longer need a
-- migration that has to run alone.
do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_name = 'access_codes' and column_name = 'type' and data_type = 'USER-DEFINED'
  ) then
    alter table access_codes alter column type type text using type::text;
  end if;
end $$;

alter table access_codes
  drop constraint if exists access_codes_type_chk;

alter table access_codes
  add constraint access_codes_type_chk check (
    type in ('free_30d', 'promo_15', 'free_12m', 'lifetime', 'custom')
  );

-- down:
--   alter table access_codes drop constraint access_codes_type_chk;
--   alter table access_codes alter column type type access_code_type using type::access_code_type;
--   (only possible once no row uses a value outside the enum)

-- A label the admin sets when generating a batch, so a hundred single-use
-- codes handed out one by one are still recognisable as one campaign.
alter table access_codes
  add column if not exists batch_label text;

comment on column access_codes.batch_label is
  'Groups codes generated together, e.g. "Lifetime — instructors, Sep 2026".';

create index if not exists access_codes_batch_idx on access_codes(batch_label)
  where batch_label is not null;

-- down: drop index access_codes_batch_idx; alter table access_codes drop column batch_label;
