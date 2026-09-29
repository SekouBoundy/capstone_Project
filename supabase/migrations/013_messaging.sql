-- ============================================================
-- MESSAGING: denormalised preview + realtime publication
-- ============================================================
--
-- 1. `conversations.last_message_body`. The conversation list needs the
--    latest message text to render a preview row. Embedding
--    `last_message:messages(*)` pulls the ENTIRE thread for every
--    conversation in the list, and PostgREST cannot take "top 1 per
--    group", so the payload grows with thread length. A denormalised
--    preview column is the same trade-off the table already made with
--    `last_message_at`.
--
-- 2. A trigger owns both preview columns. Previously the chat screen
--    updated `last_message_at` from the client after sending, which is
--    racy (last writer wins between two devices) and skipped entirely
--    for deletes. The database is the only place that can be correct.
--
-- 3. `messages` and `conversations` are added to the `supabase_realtime`
--    publication. Without this, `postgres_changes` subscriptions never
--    fire no matter what the client subscribes to, so live message
--    delivery and live conversation lists are silently dead.

-- ------------------------------------------------------------
-- 1. Preview column
-- ------------------------------------------------------------
ALTER TABLE public.conversations
  ADD COLUMN IF NOT EXISTS last_message_body TEXT;

COMMENT ON COLUMN public.conversations.last_message_body IS
  'Body of the most recent message, maintained by '
  'public.sync_conversation_last_message(). Denormalised so the '
  'conversation list does not have to embed every thread in full.';

-- ------------------------------------------------------------
-- 2. Trigger maintains the preview
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION public.sync_conversation_last_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  target_conversation UUID;
  latest RECORD;
BEGIN
  target_conversation := COALESCE(NEW.conversation_id, OLD.conversation_id);

  SELECT m.created_at, m.body
  INTO latest
  FROM public.messages m
  WHERE m.conversation_id = target_conversation
  ORDER BY m.created_at DESC, m.id DESC
  LIMIT 1;

  IF FOUND THEN
    UPDATE public.conversations
    SET last_message_at = latest.created_at,
        last_message_body = latest.body
    WHERE id = target_conversation;
  ELSE
    -- Thread is now empty (last message deleted). Keep the row, but
    -- clear the preview so the list falls back to its empty-thread
    -- treatment instead of showing a body that no longer exists.
    UPDATE public.conversations
    SET last_message_body = NULL
    WHERE id = target_conversation;
  END IF;

  -- AFTER trigger: the return value is ignored, but be explicit.
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS on_message_written ON public.messages;

CREATE TRIGGER on_message_written
  AFTER INSERT OR UPDATE OR DELETE ON public.messages
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_conversation_last_message();

-- Backfill any existing threads.
UPDATE public.conversations c
SET
  last_message_at = latest.created_at,
  last_message_body = latest.body
FROM LATERAL (
  SELECT m.created_at, m.body
  FROM public.messages m
  WHERE m.conversation_id = c.id
  ORDER BY m.created_at DESC, m.id DESC
  LIMIT 1
) AS latest;

-- ------------------------------------------------------------
-- 3. Realtime publication
-- ------------------------------------------------------------
-- The publication must exist before tables can join it, and a hosted
-- project may not have created it yet. ADD TABLE is not idempotent, so
-- both steps are guarded.
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    CREATE PUBLICATION supabase_realtime;
  END IF;
END;
$$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'messages'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.messages;
  END IF;

  IF NOT EXISTS (
    SELECT 1
    FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime'
      AND schemaname = 'public'
      AND tablename = 'conversations'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.conversations;
  END IF;
END;
$$;
