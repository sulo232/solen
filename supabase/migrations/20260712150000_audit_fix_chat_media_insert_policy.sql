-- exists-check: net-new vs 002_profiles.sql, 031_audit_log.sql, 065_social_media.sql, 056_chat_templates.sql,
-- 033_guest_checkout.sql, 029_review_policies.sql, 060_chat_read_receipts.sql, 061_fix_review_inserts.sql
-- because none of those define storage.objects policies for the chat-media bucket; grep across all of
-- supabase/migrations for "chat-media" returns zero files before this one.
--
-- Ring: chat-media storage INSERT policy has no folder-ownership check.
-- The live INSERT policy on storage.objects for bucket 'chat-media' only checks
-- bucket_id = 'chat-media', with no restriction on which folder is targeted. The
-- sibling DELETE policy on the same bucket already restricts to
-- auth.uid()::text = (storage.foldername(name))[1], so any authenticated user can
-- currently write into any other user's chat-media path. This policy is live-only
-- today (not tracked in any migration file), so land it here for reproducibility too.
--
-- The exact live policy name is unknown, so find and drop whichever INSERT policy
-- on storage.objects currently scopes the chat-media bucket, then recreate it with
-- the same folder-ownership predicate the DELETE policy already uses.
DO $$
DECLARE
  pol record;
BEGIN
  FOR pol IN
    SELECT policyname FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects'
      AND cmd = 'INSERT'
      AND (coalesce(with_check, '') ILIKE '%chat-media%' OR coalesce(qual, '') ILIKE '%chat-media%')
  LOOP
    EXECUTE format('DROP POLICY %I ON storage.objects', pol.policyname);
  END LOOP;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'chat_media_insert_own'
  ) THEN
    CREATE POLICY "chat_media_insert_own" ON storage.objects
      FOR INSERT WITH CHECK (
        bucket_id = 'chat-media'
        AND auth.uid()::text = (storage.foldername(name))[1]
      );
  END IF;
END $$;
