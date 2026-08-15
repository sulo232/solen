-- exists-check: ALTER of an existing live policy (chat-media INSERT on storage.objects); net-new file
-- (never edit an applied migration). APPLIED LIVE 2026-07-12 via MCP.
-- deep-audit R2 + backend-systems health check: the chat-media INSERT policy was WITH CHECK
-- (bucket_id='chat-media') only , NO folder-ownership check, so any authenticated user could upload
-- into any other user's conversation folder. The bucket's own DELETE policy already scopes to
-- auth.uid() = folder[1]; this mirrors that on INSERT. Matters once in-app messaging (currently off)
-- is re-enabled; closed now because it is cheap and the bucket is live regardless.
ALTER POLICY "chat-media: authenticated users can upload" ON storage.objects
  WITH CHECK (bucket_id = 'chat-media' AND (auth.uid())::text = (storage.foldername(name))[1]);
