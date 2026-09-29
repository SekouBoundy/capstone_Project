-- ============================================================
-- SEED DATA
-- ============================================================
--
-- Referenced by supabase/config.toml ([db.seed] sql_paths). Safe to
-- re-run: every statement is keyed on a fixed UUID with
-- ON CONFLICT DO NOTHING / DO UPDATE, so a second run is a no-op
-- rather than a duplicate.
--
-- Five demo accounts are inserted into auth.users. Their profiles are
-- then created explicitly rather than relying solely on the
-- handle_new_user trigger, so the seed still produces listings if the
-- trigger is ever disabled or an older copy of it is deployed. The
-- trigger, when present, simply creates the row first and the upsert
-- below enriches it.
--
-- Those accounts have a NULL encrypted_password on purpose: they exist
-- for listings and message threads, and must not be loggable into.
--
-- Images use picsum.photos seeded URLs — deterministic per seed, no API
-- key, and the app already renders remote images via expo-image.

-- ------------------------------------------------------------
-- 1. Demo accounts
-- ------------------------------------------------------------
INSERT INTO auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
)
VALUES
  ('00000000-0000-0000-0000-000000000000',
   '11111111-1111-4111-8111-111111111111', 'authenticated', 'authenticated',
   'maria.owner@demo.doucsoft.app', NULL, now(),
   '{"provider":"email","providers":["email"]}',
   '{"role":"owner","preferred_locale":"en"}', now(), now()),

  ('00000000-0000-0000-0000-000000000000',
   '22222222-2222-4222-8222-222222222222', 'authenticated', 'authenticated',
   'agency@demo.doucsoft.app', NULL, now(),
   '{"provider":"email","providers":["email"]}',
   '{"role":"agency","preferred_locale":"en"}', now(), now()),

  ('00000000-0000-0000-0000-000000000000',
   '33333333-3333-4333-8333-333333333333', 'authenticated', 'authenticated',
   'ahmet.student@demo.doucsoft.app', NULL, now(),
   '{"provider":"email","providers":["email"]}',
   '{"role":"student","preferred_locale":"en"}', now(), now()),

  ('00000000-0000-0000-0000-000000000000',
   '44444444-4444-4444-8444-444444444444', 'authenticated', 'authenticated',
   'elena.student@demo.doucsoft.app', NULL, now(),
   '{"provider":"email","providers":["email"]}',
   '{"role":"student","preferred_locale":"en"}', now(), now()),

  ('00000000-0000-0000-0000-000000000000',
   '55555555-5555-4555-8555-555555555555', 'authenticated', 'authenticated',
   'george.owner@demo.doucsoft.app', NULL, now(),
   '{"provider":"email","providers":["email"]}',
   '{"role":"owner","preferred_locale":"en"}', now(), now())
-- Conflict target is `id`, NOT `email`. This project's auth.users has no
-- unique constraint on email -- current Supabase uses a *partial* index
-- (WHERE is_sso_user = false), and a bare `ON CONFLICT (email)` fails with
--   42P10: there is no unique or exclusion constraint matching the
--   ON CONFLICT specification
-- because Postgres only matches a partial index when the same predicate
-- is supplied. `id` is the primary key, so it is always matchable, and
-- the fixed UUIDs below make it sufficient for idempotency.
ON CONFLICT (id) DO NOTHING;

-- Enrich the profiles (created either by the trigger above or here).
INSERT INTO public.profiles (id, role, full_name, phone, university, faculty, year_of_study, bio, preferred_locale)
VALUES
  ('11111111-1111-4111-8111-111111111111', 'owner', 'Maria Papadopoulou', '+357 99 111 001',
   'Near East University (NEU)', 'Real Estate', NULL,
   'Owner of a small family rental portfolio around Nicosia.', 'en'),
  ('22222222-2222-4222-8222-222222222222', 'agency', 'Doric Realty Ltd', '+357 22 555 900',
   NULL, 'Agency', NULL,
   'Full-service agency covering Nicosia, Kyrenia and Famagusta.', 'en'),
  ('33333333-3333-4333-8333-333333333333', 'student', 'Ahmet Yilmaz', '+357 99 222 002',
   'Eastern Mediterranean University (EMU)', 'Computer Science', 'Year 2',
   'Looking for a room close to campus for the autumn term.', 'en'),
  ('44444444-4444-4444-8444-444444444444', 'student', 'Elena Rossi', '+357 99 333 003',
   'Cyprus International University (CIU)', 'Business Administration', 'Year 3',
   'Furnished room preferred, near the university shuttle route.', 'en'),
  ('55555555-5555-4555-8555-555555555555', 'owner', 'George Christou', '+357 99 444 004',
   'Cyprus University of Technology', 'Landlord', NULL,
   'Rent out a spare studio in Famagusta while working abroad.', 'en')
ON CONFLICT (id) DO UPDATE SET
  full_name = EXCLUDED.full_name,
  phone = EXCLUDED.phone,
  university = EXCLUDED.university,
  faculty = EXCLUDED.faculty,
  year_of_study = EXCLUDED.year_of_study,
  bio = EXCLUDED.bio;

-- Mark the agency verified; properties carry their own is_verified flag.
UPDATE public.profiles
SET role = 'agency'
WHERE id = '22222222-2222-4222-8222-222222222222';

-- ------------------------------------------------------------
-- 2. Properties
-- ------------------------------------------------------------
INSERT INTO public.properties (
  id, owner_id, title, description, property_type, price_monthly,
  charges, currency, rooms, bathrooms, area_sqm, furnished, amenities,
  address, city, available_from, available, is_verified, status, created_at
)
VALUES
  ('a1111111-1111-4111-8111-111111111111', '11111111-1111-4111-8111-111111111111',
   'Sunny studio near university campus', 'Bright studio on the third floor with a balcony, five minutes walk from the main campus gate. Bills included except electricity.',
   'studio', 520, 60, 'EUR', 1, 1, 28, TRUE,
   ARRAY['wifi','ac','heating','furnished','balcony','elevator'],
   '12 Themistokli Ave', 'Nicosia', CURRENT_DATE + 14, TRUE, TRUE, 'published', now() - INTERVAL '6 days'),

  ('a2222222-2222-4222-8222-222222222222', '11111111-1111-4111-8111-111111111111',
   'Shared room in quiet family apartment', 'A large room in a shared two-bedroom apartment. Shared kitchen and bathroom, quiet building, no parties.',
   'room', 280, 40, 'EUR', 1, 1, 18, TRUE,
   ARRAY['wifi','ac','heating','washer','furnished'],
   '4 Arch. Makarios III', 'Nicosia', CURRENT_DATE + 7, TRUE, TRUE, 'published', now() - INTERVAL '4 days'),

  ('a3333333-3333-4333-8333-333333333333', '22222222-2222-4222-8222-222222222222',
   'Modern one-bedroom with sea view', 'Fully renovated one-bedroom in a new development, walking distance to the beach and the marina.',
   'apartment', 1150, 120, 'EUR', 1, 1, 55, TRUE,
   ARRAY['wifi','ac','heating','washer','dishwasher','parking','gym','pool','balcony','elevator','security'],
   '88 Apostolou Pavlou Ave', 'Kyrenia', CURRENT_DATE + 30, TRUE, TRUE, 'published', now() - INTERVAL '2 days'),

  ('a4444444-4444-4444-8444-444444444444', '22222222-2222-4222-8222-222222222222',
   'Two-bedroom house with private garden', 'Detached two-bedroom house with a private garden and covered parking. Pets considered.',
   'house', 1450, 150, 'EUR', 2, 2, 120, FALSE,
   ARRAY['wifi','ac','heating','washer','dryer','dishwasher','parking','furnished','balcony','security','pets_allowed','elevator'],
   '7 Afania Street', 'Famagusta', CURRENT_DATE + 45, TRUE, TRUE, 'published', now() - INTERVAL '1 day'),

  ('a5555555-5555-4555-8555-555555555555', '55555555-5555-4555-8555-555555555555',
   'Affordable room near the university', 'Simple clean room in a student building, utilities included. Popular with first years.',
   'room', 240, 50, 'EUR', 1, 1, 15, TRUE,
   ARRAY['wifi','heating','furnished'],
   '21 Oct. 28th Oct', 'Lefke', CURRENT_DATE + 5, TRUE, FALSE, 'published', now() - INTERVAL '9 days'),

  -- Occupied: exercises the "unavailable" overlay on the card.
  ('a6666666-6666-4666-8666-666666666666', '55555555-5555-4555-8555-555555555555',
   'Loft apartment currently let', 'Modern loft, currently occupied until the end of the summer term.',
   'apartment', 890, 90, 'EUR', 2, 1, 70, TRUE,
   ARRAY['wifi','ac','heating','washer','dishwasher','balcony','elevator'],
   '3 Makarios Ave', 'Nicosia', CURRENT_DATE - 60, FALSE, TRUE, 'published', now() - INTERVAL '20 days')
ON CONFLICT (id) DO NOTHING;

-- Three images per seeded listing, deterministic per listing id.
-- property_images has no natural unique key (its id is a fresh
-- gen_random_uuid() default), so ON CONFLICT would never fire and a
-- second run would append three more images per listing. Guard on
-- (property_id, sort_order) explicitly instead.
INSERT INTO public.property_images (property_id, image_url, sort_order)
SELECT p.id,
       'https://picsum.photos/seed/' || replace(p.id::text, '-', '') || '-' || img.ord || '/900/600',
       img.ord
FROM public.properties p
CROSS JOIN (VALUES (0), (1), (2)) AS img(ord)
WHERE p.id IN (
  'a1111111-1111-4111-8111-111111111111',
  'a2222222-2222-4222-8222-222222222222',
  'a3333333-3333-4333-8333-333333333333',
  'a4444444-4444-4444-8444-444444444444',
  'a5555555-5555-4555-8555-555555555555',
  'a6666666-6666-4666-8666-666666666666'
)
  AND NOT EXISTS (
    SELECT 1
    FROM public.property_images existing
    WHERE existing.property_id = p.id
      AND existing.sort_order = img.ord
  );

-- ------------------------------------------------------------
-- 3. Marketplace products
-- ------------------------------------------------------------
INSERT INTO public.products (
  id, seller_id, title, description, category, price, currency,
  condition, image_urls, city, status, created_at
)
VALUES
  ('b1111111-1111-4111-8111-111111111111', '33333333-3333-4333-8333-333333333333',
   'Ergonomic desk chair', 'Mesh back office chair, height adjustable, no longer needed after a room move.',
   'furniture', 45, 'EUR', 'good',
   ARRAY['https://picsum.photos/seed/prod-b1/700/700','https://picsum.photos/seed/prod-b1b/700/700'],
   'Nicosia', 'active', now() - INTERVAL '3 days'),

  ('b2222222-2222-4222-8222-222222222222', '44444444-4444-4444-8444-444444444444',
   'Calculus and linear algebra textbooks', 'Two university maths books with light pencil notes. Both in good condition.',
   'books', 25, 'EUR', 'good',
   ARRAY['https://picsum.photos/seed/prod-b2/700/700'],
   'Nicosia', 'active', now() - INTERVAL '5 days'),

  ('b3333333-3333-4333-8333-333333333333', '11111111-1111-4111-8111-111111111111',
   'Small fridge with freezer', 'Haul size mini fridge, ideal for a studio. Clean and working, moving abroad.',
   'kitchen', 90, 'EUR', 'like_new',
   ARRAY['https://picsum.photos/seed/prod-b3/700/700'],
   'Nicosia', 'active', now() - INTERVAL '1 day'),

  ('b4444444-4444-4444-8444-444444444444', '44444444-4444-4444-8444-444444444444',
   'Winter coat, size M', 'Black padded coat, worn two winters. Warm and waterproof.',
   'clothing', 30, 'EUR', 'good',
   ARRAY['https://picsum.photos/seed/prod-b4/700/700'],
   'Kyrenia', 'active', now() - INTERVAL '7 days'),

  ('b5555555-5555-4555-8555-555555555555', '33333333-3333-4333-8333-333333333333',
   'Mechanical keyboard', 'Quiet tactile switches, RGB backlight. Includes the original box and keycap puller.',
   'electronics', 60, 'EUR', 'like_new',
   ARRAY['https://picsum.photos/seed/prod-b5/700/700','https://picsum.photos/seed/prod-b5b/700/700'],
   'Nicosia', 'active', now() - INTERVAL '2 days'),

  ('b6666666-6666-4666-8666-666666666666', '11111111-1111-4111-8111-111111111111',
   'Dining table and four chairs', 'Solid wood set, some wear on the tabletop. Buyer collects.',
   'furniture', 120, 'EUR', 'fair',
   ARRAY['https://picsum.photos/seed/prod-b6/700/700'],
   'Nicosia', 'active', now() - INTERVAL '11 days'),

  ('b7777777-7777-4777-8777-777777777777', '44444444-4444-4444-8444-444444444444',
   'Espresso machine', 'Descaling and backflushed a week ago. Selling because I am moving out.',
   'kitchen', 110, 'EUR', 'good',
   ARRAY['https://picsum.photos/seed/prod-b7/700/700'],
   'Nicosia', 'sold', now() - INTERVAL '14 days'),

  ('b8888888-8888-4888-8888-888888888888', '55555555-5555-4555-8555-555555555555',
   'Laptop stand, aluminium', 'Adjustable stand, used for a few months. No scratches.',
   'other', 20, 'EUR', 'like_new',
   ARRAY['https://picsum.photos/seed/prod-b8/700/700'],
   'Lefke', 'active', now() - INTERVAL '4 days')
ON CONFLICT (id) DO NOTHING;

-- ------------------------------------------------------------
-- 4. A conversation, so Messages is not empty
-- ------------------------------------------------------------
-- Targets the real signed-in account (any profile that is not one of
-- the five demo users above) and the seeded owner of a listing.
DO $$
DECLARE
  viewer UUID;
  thread_id UUID;
  seeded_listing UUID := 'a1111111-1111-4111-8111-111111111111';
  seeded_owner  UUID := '11111111-1111-4111-8111-111111111111';
BEGIN
  SELECT p.id INTO viewer
  FROM public.profiles p
  WHERE p.id NOT IN (
    '11111111-1111-4111-8111-111111111111',
    '22222222-2222-4222-8222-222222222222',
    '33333333-3333-4333-8333-333333333333',
    '44444444-4444-4444-8444-444444444444',
    '55555555-5555-4555-8555-555555555555'
  )
  ORDER BY p.created_at ASC
  LIMIT 1;

  IF viewer IS NULL THEN
    RAISE NOTICE 'No real profile found yet (sign up first); skipping conversation seed.';
    RETURN;
  END IF;

  -- participant_a is always the listing owner. The unique constraint is
  -- (listing_type, listing_id, participant_a, participant_b), so a
  -- swapped pair would open a second thread for the same listing.
  INSERT INTO public.conversations (
    id, listing_type, listing_id, participant_a, participant_b,
    created_at, last_message_at
  )
  VALUES (
    'c1111111-1111-4111-8111-111111111111', 'property', seeded_listing,
    seeded_owner, viewer,
    now() - INTERVAL '2 days', now() - INTERVAL '5 hours'
  )
  ON CONFLICT (id) DO NOTHING;

  thread_id := 'c1111111-1111-4111-8111-111111111111';

  -- The two replies from the owner are left unread on purpose so the
  -- conversation list shows an unread badge out of the box.
  INSERT INTO public.messages (id, conversation_id, sender_id, body, read_at, created_at)
  VALUES
    ('d1111111-1111-4111-8111-111111111111', thread_id, viewer,
     'Hi Maria, is the studio still available from the 15th?', NULL,
     now() - INTERVAL '2 days'),

    ('d2222222-2222-4222-8222-222222222222', thread_id, seeded_owner,
     'Yes it is. It is a ten minute walk from the campus gate and the balcony faces east, so it gets morning light.',
     NULL, now() - INTERVAL '1 day'),

    ('d3333333-3333-4333-8333-333333333333', thread_id, viewer,
     'That sounds ideal. Are the bills included in the 520?', now() - INTERVAL '20 hours', now() - INTERVAL '20 hours'),

    ('d4444444-4444-4444-8444-444444444444', thread_id, seeded_owner,
     'Water, heating and internet are included. Electricity is metered and usually comes to about 30 a month.',
     NULL, now() - INTERVAL '5 hours')
  ON CONFLICT (id) DO NOTHING;

  -- If migration 013 has been applied its trigger has already set
  -- last_message_body. Set it directly otherwise, so the seed works in
  -- either order. The column check keeps this from erroring on a
  -- 012-only database.
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public'
      AND table_name = 'conversations'
      AND column_name = 'last_message_body'
  ) THEN
    EXECUTE format(
      'UPDATE public.conversations
          SET last_message_body = (
            SELECT body FROM public.messages
            WHERE conversation_id = %L::uuid
            ORDER BY created_at DESC, id DESC
            LIMIT 1
          )
        WHERE id = %L::uuid
          AND last_message_body IS NULL',
      thread_id, thread_id
    );
  END IF;
END;
$$;
