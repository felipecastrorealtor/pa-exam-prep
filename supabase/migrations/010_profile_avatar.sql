-- 010_profile_avatar.sql
-- Profile picture: either a preset id ("preset:house") or a small square JPEG
-- data URL produced client-side by the avatar picker. Kept on the profile row
-- so no storage bucket, no extra RLS surface, nothing public by default.
--
-- The existing "profiles: own update" policy already covers this column, and it
-- still blocks self-elevation because role is unchanged by the update.

alter table profiles
  add column if not exists avatar_url text;

-- Guard rails: only the two shapes the app writes, and small enough that a row
-- stays cheap to read on every page load.
alter table profiles
  drop constraint if exists profiles_avatar_url_shape;

alter table profiles
  add constraint profiles_avatar_url_shape check (
    avatar_url is null
    or avatar_url ~ '^preset:[a-z]{3,12}$'
    or (avatar_url like 'data:image/%;base64,%' and length(avatar_url) <= 200000)
  );
