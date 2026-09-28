-- ============================================================
-- FIX: pin search_path on trigger functions
-- ============================================================
-- GoTrue (Supabase Auth) runs with a search_path that does not
-- include "public" (e.g. "auth, public" or "auth" only). Our
-- trigger functions previously relied on the caller's
-- search_path to resolve "profiles", so signup failed with:
--   ERROR: relation "profiles" does not exist
-- which GoTrue surfaced as HTTP 500 "Database error saving new user".
--
-- Fix: use SET search_path = '' and fully schema-qualify every
-- reference, so resolution never depends on the caller.

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
BEGIN
  INSERT INTO public.profiles (id, role, preferred_locale)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data ->> 'role', 'student'),
    COALESCE(NEW.raw_user_meta_data ->> 'preferred_locale', 'en')
  );
  RETURN NEW;
END;
$$;

-- Same hardening for the updated_at trigger function.
-- pg_catalog is always implicitly on the search path, so
-- now() resolves fine with an empty search_path.
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = ''
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;
