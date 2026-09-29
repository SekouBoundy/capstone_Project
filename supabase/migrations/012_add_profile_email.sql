-- ============================================================
-- ADD email TO public.profiles (without exposing it to clients)
-- ============================================================
--
-- Migration 011 deliberately kept email out of public.profiles because
-- the "Profiles are viewable by everyone" RLS policy (009) would then
-- publish every user's address to every client, and the five
-- `profiles(*)` embeds in the app would carry it along.
--
-- This migration adds the column for admin tooling, reporting and SQL
-- joins, then closes the leak with COLUMN-LEVEL SELECT grants -- the
-- same technique 011 used for UPDATE. RLS operates on rows and cannot
-- restrict columns; table privileges can.
--
-- CONSEQUENCE FOR CLIENT CODE: `select *` on public.profiles now fails
-- for anon/authenticated, because Postgres refuses to expand `*` into a
-- column the role cannot read. Every client query must name its columns
-- explicitly and must omit `email`. See src/lib/profileColumns.ts.
-- 012 also revokes the client-side INSERT path, so nothing in the app
-- may create profile rows either; the trigger above owns that.

-- ------------------------------------------------------------
-- 1. The column
-- ------------------------------------------------------------
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS email TEXT;

COMMENT ON COLUMN public.profiles.email IS
  'Mirror of auth.users.email. Readable by the table owner and by '
  'SECURITY DEFINER helpers only; withheld from anon/authenticated by '
  'column-level grants. Clients read their own address from the auth '
  'session (authStore.user.email).';

-- ------------------------------------------------------------
-- 2. Backfill from the authoritative source
-- ------------------------------------------------------------
UPDATE public.profiles p
SET email = u.email
FROM auth.users u
WHERE u.id = p.id
  AND p.email IS DISTINCT FROM u.email;

-- auth.users.email is unique, so the backfill cannot collide.
-- Phone-only accounts have a NULL email and are excluded, since a
-- unique index would otherwise reject the second one.
CREATE UNIQUE INDEX IF NOT EXISTS idx_profiles_email
  ON public.profiles(email)
  WHERE email IS NOT NULL;

-- ------------------------------------------------------------
-- 3. Populate the column on signup
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role, preferred_locale)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    COALESCE(NEW.raw_user_meta_data ->> 'preferred_locale', 'en')
  );
  RETURN NEW;
END;
$$;

-- ------------------------------------------------------------
-- 4. Keep it in sync when the address changes in auth.users
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_profile_email()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  UPDATE public.profiles
  SET email = NEW.email
  WHERE id = NEW.id
    AND email IS DISTINCT FROM NEW.email;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_email_updated ON auth.users;

CREATE TRIGGER on_auth_user_email_updated
  AFTER UPDATE OF email ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_profile_email();

-- ------------------------------------------------------------
-- 5. Revoke the client-side INSERT path
-- ------------------------------------------------------------
-- Row creation is owned by the SECURITY DEFINER trigger above. The
-- "Users can insert own profile" policy (009) therefore only leaves a
-- way for a caller to plant an arbitrary email on their own row,
-- which would then show up in admin tooling and SQL joins. The trigger
-- is unaffected: it runs as its owner, not as the calling role.
REVOKE INSERT ON public.profiles FROM anon;
REVOKE INSERT ON public.profiles FROM authenticated;

-- ------------------------------------------------------------
-- 6. Column-level lockdown
-- ------------------------------------------------------------
REVOKE SELECT ON public.profiles FROM anon;
REVOKE SELECT ON public.profiles FROM authenticated;

-- Same column set to both roles as before this migration, minus email.
-- anon keeps the identical read access it had, so the public-listing
-- policy (009) still resolves its embeds.
GRANT SELECT (
  id, role, full_name, phone, avatar_url, university,
  faculty, year_of_study, bio, preferred_locale,
  is_suspended, created_at, updated_at
)
  ON public.profiles TO anon, authenticated;

-- email is intentionally absent. It is reachable from a client only
-- through public.admin_search_users() (migration 011), which is
-- SECURITY DEFINER and gated on public.is_admin().
