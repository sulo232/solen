-- exists-check: `npm run exists chat-media` and `npm run exists "chat media read policy"` both
-- return 0 matches, and no other migration in this folder narrows the chat-media SELECT policy
-- (grepped the whole folder). The INSERT and DELETE policies on this bucket are already
-- folder-scoped; only SELECT was not. This is net-new and narrowing-only.
--
-- WHAT WAS OPEN. `chat-media` is a PRIVATE bucket holding photos people send inside a
-- salon-to-customer conversation. Its three policies, read live 2026-08-14:
--
--   INSERT  bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]   scoped
--   DELETE  bucket_id = 'chat-media' AND auth.uid()::text = (storage.foldername(name))[1]   scoped
--   SELECT  bucket_id = 'chat-media'                                                        NOT scoped
--
-- So writing was correctly limited to your own folder while READING was open to every signed-in
-- account, for every object in the bucket. Anyone with an account could read anyone else's chat
-- photos given the object path.
--
-- WHY IT IS NOT AN INCIDENT TODAY, checked rather than assumed: both messaging surfaces are turned
-- off (the owner switched them off on 2026-06-13 and both pages hard-redirect away), and no code
-- path anywhere writes into this bucket, so it holds nothing. This closes the hole while it is
-- still empty rather than after messaging comes back. Worth naming: the `messaging` feature flag in
-- the database says enabled = true, so anyone re-enabling the screens on the strength of that flag
-- would have brought the open read policy back with them.
--
-- WHAT THIS DOES. Makes SELECT match INSERT and DELETE: you can read what is in your own folder.
-- The service-role client used by server routes bypasses RLS and is unaffected, so any future
-- server-side read (for example a salon reading a customer's photo inside a conversation they are
-- part of) keeps working and stays the place to enforce who is in that conversation.
--
-- TO REVERT, exactly one statement, in place, nothing dropped:
--   alter policy "chat-media: authenticated users can view" on storage.objects
--     using (bucket_id = 'chat-media');
--
-- APPLIED LIVE 2026-08-14 and verified after: the SELECT policy now reads
--   ((bucket_id = 'chat-media') AND ((auth.uid())::text = (storage.foldername(name))[1]))
-- which matches DELETE exactly. Written as ALTER rather than DROP + CREATE on purpose: a guard in
-- this estate refuses destructive DDL, correctly, because a dropped policy between the drop and the
-- create is a window with no policy at all.

alter policy "chat-media: authenticated users can view"
  on storage.objects
  using (
    bucket_id = 'chat-media'
    and (auth.uid())::text = (storage.foldername(name))[1]
  );
