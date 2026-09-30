-- ============================================================
-- ADMIN WEB PANEL: read models + moderated write actions
-- ============================================================
--
-- Migration 011 gave the in-app admin panel four helpers:
-- is_admin(), admin_search_users(), admin_set_role() and
-- admin_set_suspended(). That is enough to list users and flip
-- two flags, but not enough to run a real dashboard:
--
--   1. Counts for the dashboard. public.profiles has no
--      client-readable email and no client-writable columns, and
--      migration 012 revoked table-level SELECT, so a client
--      cannot `select count(*)` its way to a total. Aggregates
--      have to be computed for the caller.
--
--   2. Reading other people's rows. "Profiles are viewable by
--      everyone" (009) resolves to `is_suspended = FALSE OR
--      auth.uid() = id`, so an admin cannot read a suspended
--      profile through PostgREST at all -- and a moderation table
--      that hides the people it exists to moderate is useless.
--      011 sidestepped this for the user list with a SECURITY
--      DEFINER join to auth.users; the same trick is needed for
--      verifications, reports and listings.
--
--   3. Moderated writes. Approving a verification has to set
--      verification_requests.status AND promote profiles.role in
--      one shot. `role` is deliberately outside the column-level
--      UPDATE grant (011), so a client can never do the second
--      half. Same for the notification rows: notifications has
--      SELECT and UPDATE policies but no INSERT policy, so
--      telling a user their verification was approved has to go
--      through here.
--
-- Every function below is SECURITY DEFINER with an empty
-- search_path and an explicit is_admin() gate, matching 011.
-- None of them expose anything to `anon`; EXECUTE is granted to
-- `authenticated` only.

-- ------------------------------------------------------------
-- 1. Dashboard aggregates
-- ------------------------------------------------------------
-- One round trip for the whole landing page rather than seven
-- count queries the client cannot write.

CREATE OR REPLACE FUNCTION public.admin_dashboard_stats()
RETURNS TABLE (
  total_users          BIGINT,
  suspended_users     BIGINT,
  new_users_7d        BIGINT,
  total_properties    BIGINT,
  published_properties BIGINT,
  total_products      BIGINT,
  active_products     BIGINT,
  pending_verifications BIGINT,
  open_reports        BIGINT
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
    SELECT
      (SELECT count(*) FROM public.profiles),
      (SELECT count(*) FROM public.profiles WHERE is_suspended),
      (SELECT count(*) FROM public.profiles
        WHERE created_at > now() - INTERVAL '7 days'),
      (SELECT count(*) FROM public.properties),
      (SELECT count(*) FROM public.properties WHERE status = 'published'),
      (SELECT count(*) FROM public.products),
      (SELECT count(*) FROM public.products WHERE status = 'active'),
      (SELECT count(*) FROM public.verification_requests WHERE status = 'pending'),
      (SELECT count(*) FROM public.reports WHERE status IN ('open', 'investigating'));
END;
$$;

-- ------------------------------------------------------------
-- 2. Paginated user directory
-- ------------------------------------------------------------
-- Supersedes admin_search_users() for the web panel: same
-- admin-gated join to auth.users, but paginated, sortable, and
-- carrying the profile columns a directory table renders.
-- admin_search_users() is left in place because 011 granted it
-- and other clients may already call it.
--
-- `total_count` rides along via a window function so the table
-- can render "showing 1-25 of 213" without a second query.

CREATE OR REPLACE FUNCTION public.admin_list_users(
  search_term TEXT DEFAULT NULL,
  role_filter TEXT DEFAULT NULL,
  status_filter TEXT DEFAULT NULL,
  page_size INTEGER DEFAULT 25,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  total_count      BIGINT,
  id               UUID,
  full_name        TEXT,
  role             TEXT,
  email            TEXT,
  phone            TEXT,
  university       TEXT,
  faculty          TEXT,
  year_of_study    TEXT,
  is_suspended     BOOLEAN,
  preferred_locale TEXT,
  property_count   BIGINT,
  product_count    BIGINT,
  report_count     BIGINT,
  created_at       TIMESTAMPTZ
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
    WITH filtered AS (
      SELECT p.id, p.full_name, p.role, p.phone, p.university,
             p.faculty, p.year_of_study, p.is_suspended,
             p.preferred_locale, p.created_at,
             u.email::TEXT AS email,
             (SELECT count(*) FROM public.properties pr WHERE pr.owner_id = p.id) AS property_count,
             (SELECT count(*) FROM public.products pd WHERE pd.seller_id = p.id) AS product_count,
             (SELECT count(*) FROM public.reports rp WHERE rp.reporter_id = p.id) AS report_count
      FROM public.profiles p
      JOIN auth.users u ON u.id = p.id
      WHERE (search_term IS NULL
             OR btrim(search_term) = ''
             OR p.full_name ILIKE '%' || search_term || '%'
             OR u.email ILIKE '%' || search_term || '%'
             OR COALESCE(p.university, '') ILIKE '%' || search_term || '%')
        AND (role_filter IS NULL OR role_filter = '' OR p.role = role_filter)
        AND (status_filter IS NULL
             OR status_filter = ''
             OR (status_filter = 'suspended' AND p.is_suspended)
             OR (status_filter = 'active' AND NOT p.is_suspended))
    )
    SELECT count(*) OVER (),
           f.id, f.full_name, f.role, f.email, f.phone, f.university,
           f.faculty, f.year_of_study, f.is_suspended, f.preferred_locale,
           f.property_count, f.product_count, f.report_count, f.created_at
    FROM filtered f
    ORDER BY f.created_at DESC
    LIMIT LEAST(GREATEST(page_size, 1), 200)
    OFFSET GREATEST(page_offset, 0);
END;
$$;

-- ------------------------------------------------------------
-- 3. Verifications queue
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_verifications(
  status_filter TEXT DEFAULT 'pending',
  page_size INTEGER DEFAULT 25,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  total_count        BIGINT,
  id                 UUID,
  profile_id         UUID,
  role_type          TEXT,
  id_document_url    TEXT,
  agency_name        TEXT,
  business_reg_url   TEXT,
  contact_person     TEXT,
  status             TEXT,
  admin_notes        TEXT,
  reviewed_at        TIMESTAMPTZ,
  created_at         TIMESTAMPTZ,
  applicant_name     TEXT,
  applicant_email    TEXT,
  applicant_phone    TEXT,
  applicant_suspended BOOLEAN
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
    WITH filtered AS (
      SELECT v.id, v.profile_id, v.role_type, v.id_document_url,
             v.agency_name, v.business_reg_url, v.contact_person,
             v.status, v.admin_notes, v.reviewed_at, v.created_at,
             p.full_name, u.email::TEXT, p.phone, p.is_suspended
      FROM public.verification_requests v
      JOIN public.profiles p ON p.id = v.profile_id
      JOIN auth.users u ON u.id = p.id
      WHERE status_filter IS NULL
         OR status_filter = ''
         OR v.status = status_filter
    )
    SELECT count(*) OVER (),
           f.id, f.profile_id, f.role_type, f.id_document_url,
           f.agency_name, f.business_reg_url, f.contact_person,
           f.status, f.admin_notes, f.reviewed_at, f.created_at,
           f.full_name, f.email, f.phone, f.is_suspended
    FROM filtered f
    ORDER BY f.created_at DESC
    LIMIT LEAST(GREATEST(page_size, 1), 200)
    OFFSET GREATEST(page_offset, 0);
END;
$$;

-- Approve or reject a request. Sets the request status, promotes
-- the applicant's role on approval, and leaves a notification --
-- three writes that have to succeed or fail together, and none of
-- which a client is permitted to perform directly.
CREATE OR REPLACE FUNCTION public.admin_review_verification(
  request_id UUID,
  decision TEXT,
  notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  request_row RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin privileges required' USING ERRCODE = '42501';
  END IF;

  IF decision IS NULL OR decision NOT IN ('approved', 'rejected') THEN
    RAISE EXCEPTION 'invalid decision: %', decision USING ERRCODE = '22023';
  END IF;

  SELECT v.profile_id, v.role_type
  INTO request_row
  FROM public.verification_requests v
  WHERE v.id = request_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'verification request not found' USING ERRCODE = 'P0002';
  END IF;

  -- Re-deciding an already-reviewed request would double-apply the
  -- role promotion and produce a duplicate notification, so the queue
  -- is treated as a one-shot transition.
  IF EXISTS (
    SELECT 1 FROM public.verification_requests v
    WHERE v.id = request_id AND v.status <> 'pending'
  ) THEN
    RAISE EXCEPTION 'request has already been reviewed' USING ERRCODE = '22023';
  END IF;

  UPDATE public.verification_requests
  SET status = decision,
      admin_notes = notes,
      reviewed_by = auth.uid(),
      reviewed_at = now()
  WHERE id = request_id;

  IF decision = 'approved' THEN
    UPDATE public.profiles
    SET role = request_row.role_type
    WHERE id = request_row.profile_id;
  END IF;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    request_row.profile_id,
    'verification_update',
    CASE WHEN decision = 'approved'
         THEN 'Verification approved'
         ELSE 'Verification rejected' END,
    CASE WHEN decision = 'approved'
         THEN 'Your ' || request_row.role_type || ' verification was approved.'
         ELSE 'Your ' || request_row.role_type || ' verification was rejected.'
              || CASE WHEN notes IS NOT NULL AND btrim(notes) <> ''
                      THEN ' Reason: ' || notes ELSE '' END
    END,
    jsonb_build_object('verification_id', request_id, 'status', decision)
  );
END;
$$;

-- ------------------------------------------------------------
-- 4. Reports queue
-- ------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.admin_list_reports(
  status_filter TEXT DEFAULT 'open',
  reason_filter TEXT DEFAULT NULL,
  page_size INTEGER DEFAULT 25,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  total_count    BIGINT,
  id             UUID,
  reporter_id    UUID,
  reporter_name  TEXT,
  reporter_email TEXT,
  target_type    TEXT,
  target_id      UUID,
  target_title   TEXT,
  reason         TEXT,
  description    TEXT,
  status         TEXT,
  admin_notes    TEXT,
  created_at     TIMESTAMPTZ
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
    WITH filtered AS (
      SELECT r.id, r.reporter_id, r.target_type, r.target_id, r.reason,
             r.description, r.status, r.admin_notes, r.created_at,
             p.full_name, u.email::TEXT,
             -- Resolve the reported target to a title so the queue can
             -- show what was reported. Three shapes to one column, and
             -- a missing row (deleted listing) must not drop the
             -- report, so the COALESCE arm is load-bearing.
             COALESCE(
               (SELECT pr.title FROM public.properties pr WHERE pr.id = r.target_id),
               (SELECT pd.title FROM public.products pd WHERE pd.id = r.target_id),
               (SELECT p2.full_name FROM public.profiles p2 WHERE p2.id = r.target_id),
               '(deleted)'
             ) AS target_title
      FROM public.reports r
      JOIN public.profiles p ON p.id = r.reporter_id
      JOIN auth.users u ON u.id = p.id
      WHERE (status_filter IS NULL
             OR status_filter = ''
             OR (status_filter = 'unresolved' AND r.status IN ('open', 'investigating'))
             OR r.status = status_filter)
        AND (reason_filter IS NULL OR reason_filter = '' OR r.reason = reason_filter)
    )
    SELECT count(*) OVER (),
           f.id, f.reporter_id, f.full_name, f.email,
           f.target_type, f.target_id, f.target_title,
           f.reason, f.description, f.status, f.admin_notes, f.created_at
    FROM filtered f
    ORDER BY f.created_at DESC
    LIMIT LEAST(GREATEST(page_size, 1), 200)
    OFFSET GREATEST(page_offset, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_update_report(
  report_id UUID,
  new_status TEXT,
  notes TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  report_row RECORD;
  old_status TEXT;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin privileges required' USING ERRCODE = '42501';
  END IF;

  IF new_status IS NULL
     OR new_status NOT IN ('open', 'investigating', 'resolved', 'dismissed') THEN
    RAISE EXCEPTION 'invalid status: %', new_status USING ERRCODE = '22023';
  END IF;

  SELECT r.reporter_id, r.status
  INTO report_row
  FROM public.reports r
  WHERE r.id = report_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'report not found' USING ERRCODE = 'P0002';
  END IF;

  old_status := report_row.status;

  -- Only overwrite the stored note when the admin typed one, so
  -- changing status without retyping the note does not erase it.
  UPDATE public.reports
  SET status = new_status,
      admin_notes = COALESCE(notes, admin_notes)
  WHERE id = report_id;

  IF old_status IS DISTINCT FROM new_status THEN
    INSERT INTO public.notifications (user_id, type, title, body, data)
    VALUES (
      report_row.reporter_id,
      'report_update',
      'Report update',
      'Your report was marked as ' || new_status || '.',
      jsonb_build_object('report_id', report_id, 'status', new_status)
    );
  END IF;
END;
$$;

-- ------------------------------------------------------------
-- 5. Moderation queues
-- ------------------------------------------------------------
-- Admins can already UPDATE/DELETE these rows through RLS (009), but
-- not without an owner-side read to find them, and never with a
-- notification. Both tables get the same shape so the moderation
-- screen can render them from one component.

CREATE OR REPLACE FUNCTION public.admin_list_properties(
  status_filter TEXT DEFAULT NULL,
  city_filter TEXT DEFAULT NULL,
  page_size INTEGER DEFAULT 25,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  total_count    BIGINT,
  id             UUID,
  owner_id       UUID,
  owner_name     TEXT,
  owner_email    TEXT,
  owner_suspended BOOLEAN,
  title          TEXT,
  property_type  TEXT,
  price_monthly  NUMERIC,
  currency       TEXT,
  city           TEXT,
  available      BOOLEAN,
  is_verified    BOOLEAN,
  status         TEXT,
  created_at     TIMESTAMPTZ,
  report_count   BIGINT
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
    WITH filtered AS (
      SELECT pr.id, pr.owner_id, pr.title, pr.property_type, pr.price_monthly,
             pr.currency, pr.city, pr.available, pr.is_verified, pr.status,
             pr.created_at, p.full_name, u.email::TEXT, p.is_suspended,
             (SELECT count(*) FROM public.reports rp
              WHERE rp.target_type = 'property' AND rp.target_id = pr.id) AS report_count
      FROM public.properties pr
      JOIN public.profiles p ON p.id = pr.owner_id
      JOIN auth.users u ON u.id = p.id
      WHERE (status_filter IS NULL OR status_filter = '' OR pr.status = status_filter)
        AND (city_filter IS NULL OR city_filter = '' OR pr.city = city_filter)
    )
    SELECT count(*) OVER (),
           f.id, f.owner_id, f.full_name, f.email, f.is_suspended,
           f.title, f.property_type, f.price_monthly, f.currency, f.city,
           f.available, f.is_verified, f.status, f.created_at, f.report_count
    FROM filtered f
    ORDER BY f.created_at DESC
    LIMIT LEAST(GREATEST(page_size, 1), 200)
    OFFSET GREATEST(page_offset, 0);
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_list_products(
  status_filter TEXT DEFAULT NULL,
  category_filter TEXT DEFAULT NULL,
  page_size INTEGER DEFAULT 25,
  page_offset INTEGER DEFAULT 0
)
RETURNS TABLE (
  total_count    BIGINT,
  id             UUID,
  seller_id      UUID,
  seller_name    TEXT,
  seller_email   TEXT,
  seller_suspended BOOLEAN,
  title          TEXT,
  category       TEXT,
  condition      TEXT,
  price          NUMERIC,
  currency       TEXT,
  city           TEXT,
  status         TEXT,
  created_at     TIMESTAMPTZ,
  report_count   BIGINT
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
    WITH filtered AS (
      SELECT pd.id, pd.seller_id, pd.title, pd.category, pd.condition,
             pd.price, pd.currency, pd.city, pd.status, pd.created_at,
             p.full_name, u.email::TEXT, p.is_suspended,
             (SELECT count(*) FROM public.reports rp
              WHERE rp.target_type = 'product' AND rp.target_id = pd.id) AS report_count
      FROM public.products pd
      JOIN public.profiles p ON p.id = pd.seller_id
      JOIN auth.users u ON u.id = p.id
      WHERE (status_filter IS NULL OR status_filter = '' OR pd.status = status_filter)
        AND (category_filter IS NULL OR category_filter = '' OR pd.category = category_filter)
    )
    SELECT count(*) OVER (),
           f.id, f.seller_id, f.full_name, f.email, f.is_suspended,
           f.title, f.category, f.condition, f.price, f.currency,
           f.city, f.status, f.created_at, f.report_count
    FROM filtered f
    ORDER BY f.created_at DESC
    LIMIT LEAST(GREATEST(page_size, 1), 200)
    OFFSET GREATEST(page_offset, 0);
END;
$$;

-- Remove or restore a listing. Properties and products have
-- different status vocabularies (properties carry 'unavailable' and
-- 'removed'; products carry 'sold' and 'removed'), so the allowed
-- target states are enumerated per table rather than shared.
--
-- 'removed' is a soft state, not a DELETE: the row survives so
-- reports pointing at it still resolve, and the owner can be told
-- why. Restoring puts the listing back to its live state.
CREATE OR REPLACE FUNCTION public.admin_moderate_property(
  property_id UUID,
  new_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  owner_row RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin privileges required' USING ERRCODE = '42501';
  END IF;

  IF new_status IS NULL OR new_status NOT IN ('published', 'removed') THEN
    RAISE EXCEPTION 'invalid status: %', new_status USING ERRCODE = '22023';
  END IF;

  SELECT pr.owner_id, pr.title
  INTO owner_row
  FROM public.properties pr
  WHERE pr.id = property_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'property not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.properties SET status = new_status WHERE id = property_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    owner_row.owner_id,
    'listing_approved',
    CASE WHEN new_status = 'removed'
         THEN 'Listing removed' ELSE 'Listing restored' END,
    CASE WHEN new_status = 'removed'
         THEN 'Your listing "' || owner_row.title || '" was removed by a moderator.'
              || CASE WHEN reason IS NOT NULL AND btrim(reason) <> ''
                      THEN ' Reason: ' || reason ELSE '' END
         ELSE 'Your listing "' || owner_row.title || '" is live again.'
    END,
    jsonb_build_object('listing_type', 'property', 'listing_id', property_id, 'status', new_status)
  );
END;
$$;

CREATE OR REPLACE FUNCTION public.admin_moderate_product(
  product_id UUID,
  new_status TEXT,
  reason TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  owner_row RECORD;
BEGIN
  IF NOT public.is_admin() THEN
    RAISE EXCEPTION 'admin privileges required' USING ERRCODE = '42501';
  END IF;

  IF new_status IS NULL OR new_status NOT IN ('active', 'removed') THEN
    RAISE EXCEPTION 'invalid status: %', new_status USING ERRCODE = '22023';
  END IF;

  SELECT pd.seller_id, pd.title
  INTO owner_row
  FROM public.products pd
  WHERE pd.id = product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'product not found' USING ERRCODE = 'P0002';
  END IF;

  UPDATE public.products SET status = new_status WHERE id = product_id;

  INSERT INTO public.notifications (user_id, type, title, body, data)
  VALUES (
    owner_row.seller_id,
    'listing_approved',
    CASE WHEN new_status = 'removed'
         THEN 'Item removed' ELSE 'Item restored' END,
    CASE WHEN new_status = 'removed'
         THEN 'Your item "' || owner_row.title || '" was removed by a moderator.'
              || CASE WHEN reason IS NOT NULL AND btrim(reason) <> ''
                      THEN ' Reason: ' || reason ELSE '' END
         ELSE 'Your item "' || owner_row.title || '" is listed again.'
    END,
    jsonb_build_object('listing_type', 'product', 'listing_id', product_id, 'status', new_status)
  );
END;
$$;

-- ------------------------------------------------------------
-- 6. Grants: authenticated only, never anon
-- ------------------------------------------------------------

REVOKE ALL ON FUNCTION public.admin_dashboard_stats() FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_verifications(TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_review_verification(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_reports(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_update_report(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_properties(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_list_products(TEXT, TEXT, INTEGER, INTEGER) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_moderate_property(UUID, TEXT, TEXT) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.admin_moderate_product(UUID, TEXT, TEXT) FROM PUBLIC;

GRANT EXECUTE ON FUNCTION public.admin_dashboard_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_users(TEXT, TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_verifications(TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_review_verification(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_reports(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_update_report(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_properties(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_list_products(TEXT, TEXT, INTEGER, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_property(UUID, TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.admin_moderate_product(UUID, TEXT, TEXT) TO authenticated;
