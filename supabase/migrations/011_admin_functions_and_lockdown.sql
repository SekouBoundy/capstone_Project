-- ============================================================
-- ADMIN SUPPORT FUNCTIONS + COLUMN-LEVEL LOCKDOWN
-- ============================================================
--
-- 1. SECURITY FIX: the "Users can update own profile" policy is
--    USING (auth.uid() = id) with no column restriction, and RLS
--    cannot restrict columns. Any user could therefore run
--      UPDATE profiles SET role = 'admin' WHERE id = <own id>
--    and promote themselves to admin, which unlocks every
--    `EXISTS (... role = 'admin')` policy. We fix this with
--    column-level UPDATE privileges: revoke the blanket grant and
--    re-grant only the columns a user is allowed to change.
--
-- 2. Email lives in auth.users, which PostgREST never exposes to
--    clients. We deliberately do NOT copy email into public.profiles
--    because the "Profiles are viewable by everyone" policy would
--    then publish every user's address to every client. Admins read
--    email through admin_search_users() instead.

-- ------------------------------------------------------------
-- 1. Restrict which profile columns a user may update
-- ------------------------------------------------------------
REVOKE UPDATE ON public.profiles FROM anon;
REVOKE UPDATE ON public.profiles FROM authenticated;

GRANT UPDATE (full_name, phone, avatar_url, university, faculty, year_of_study, bio, preferred_locale)
  ON public.profiles TO authenticated;

-- role and is_suspended are intentionally omitted: they are
-- admin-only, changed via admin_set_role() / admin_set_suspended().

-- ------------------------------------------------------------
-- 2. Admin helpers
-- ------------------------------------------------------------

-- True when the calling user is an active admin.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.profiles p
    WHERE p.id = auth.uid()
      AND p.role = 'admin'
      AND p.is_suspended = FALSE
  );
$$;

-- Admin user directory, searchable by name or email.
CREATE OR REPLACE FUNCTION public.admin_search_users(search_term TEXT DEFAULT NULL)
RETURNS TABLE (
  id UUID,
  full_name TEXT,
  role TEXT,
  email TEXT,
  phone TEXT,
  university TEXT,
  is_suspended BOOLEAN,
  created_at TIMESTAMPTZ
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin privileges required' USING ERRCODE = '42501';
  END IF;

  RETURN QUERY
    SELECT p.id, p.full_name, p.role, u.email::TEXT, p.phone,
           p.university, p.is_suspended, p.created_at
    FROM public.profiles p
    JOIN auth.users u ON u.id = p.id
    WHERE search_term IS NULL
       OR btrim(search_term) = ''
       OR p.full_name ILIKE '%' || search_term || '%'
       OR u.email ILIKE '%' || search_term || '%'
    ORDER BY p.created_at DESC;
END;
$$;

-- Change a user's role (also how a second admin is created).
CREATE OR REPLACE FUNCTION public.admin_set_role(target_id UUID, new_role TEXT)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin privileges required' USING ERRCODE = '42501';
  END IF;

  IF new_role IS NULL OR new_role NOT IN ('student', 'owner', 'agency', 'admin') THEN
    RAISE EXCEPTION 'invalid role: %', new_role USING ERRCODE = '22023';
  END IF;

  -- Avoid locking yourself out of the admin panel.
  IF target_id = auth.uid() AND new_role <> 'admin' THEN
    RAISE EXCEPTION 'admins cannot demote themselves' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles SET role = new_role WHERE id = target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

-- Suspend or reactivate a user.
CREATE OR REPLACE FUNCTION public.admin_set_suspended(target_id UUID, suspended BOOLEAN)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin privileges required' USING ERRCODE = '42501';
  END IF;

  IF target_id = auth.uid() AND suspended THEN
    RAISE EXCEPTION 'admins cannot suspend themselves' USING ERRCODE = '22023';
  END IF;

  UPDATE public.profiles SET is_suspended = suspended WHERE id = target_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'profile not found' USING ERRCODE = 'P0002';
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 3. Grants: authenticated only, never anon
-- ------------------------------------------------------------
REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_search_users(TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_role(UUID, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_set_suspended(UUID, BOOLEAN) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_search_users(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_role(UUID, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_set_suspended(UUID, BOOLEAN) TO authenticated;
