-- 009_reclassify_agency_listing_contracts.sql
-- Move 13 questions that were absorbed into the wrong book unit during the
-- renumbering pass into the book units where they topically belong.
--   -> unit 17  Listing Agreements and Buyer Representation Contracts (was empty)
--   -> unit 18  Sales Contracts (was empty)
--   -> unit 15  Agency in Real Estate (appends after the existing 20)
-- Safe to re-run: every statement is keyed on the question id.

begin;

-- ---------------------------------------------------------------- unit 17
update public.questions set unit_id = 17, legacy_id = 1
  where id = 'e6c28af0-302f-4e84-83aa-a412f99134f6';  -- listing agreement = which contract type
update public.questions set unit_id = 17, legacy_id = 2
  where id = '45b1a123-9b0a-436d-a97b-886ac29de0db';  -- net listing under PA law
update public.questions set unit_id = 17, legacy_id = 3
  where id = '69e184e3-5a2e-4eb3-ac37-8acf42856f77';  -- buyer representation agreement

-- ---------------------------------------------------------------- unit 18
update public.questions set unit_id = 18, legacy_id = 1
  where id = '027e170d-a2ab-44f1-931f-2dcd7c56b028';  -- earnest money deposit described
update public.questions set unit_id = 18, legacy_id = 2
  where id = '4033c68b-27c5-463b-9ac0-0ae9cff52a98';  -- financing contingency clause
update public.questions set unit_id = 18, legacy_id = 3
  where id = '11a5698c-6f34-46e7-9f8a-2208635ab34b';  -- earnest money at closing
update public.questions set unit_id = 18, legacy_id = 4
  where id = '7db99f0e-76df-4bb7-86c6-74863d53eb89';  -- stigmatized property

-- ---------------------------------------------------------------- unit 15
update public.questions set unit_id = 15, legacy_id = 21
  where id = '981843eb-d7db-42c1-9452-a3ef6bdd4a51';  -- Consumer Notice: when
update public.questions set unit_id = 15, legacy_id = 22
  where id = '446debd6-a1f0-4939-b39e-b82752284970';  -- Consumer Notice: by whom
update public.questions set unit_id = 15, legacy_id = 23
  where id = 'f6ef4c20-423f-4a07-89cb-3670926c41da';  -- dual agent requirements
update public.questions set unit_id = 15, legacy_id = 24
  where id = '354a7c15-7a01-41f2-b634-e63fe4790f84';  -- designated agent
update public.questions set unit_id = 15, legacy_id = 25
  where id = '1bb00b03-8e43-4cfa-8e1d-92d963551c33';  -- duties owed to all parties
update public.questions set unit_id = 15, legacy_id = 26
  where id = 'd4833f4f-47ca-406e-8d54-58488564b510';  -- transaction licensee

commit;

-- Verify
select u.id, u.title_en, count(q.id) as questions
from public.units u left join public.questions q on q.unit_id = u.id
group by u.id, u.title_en order by u.id;
