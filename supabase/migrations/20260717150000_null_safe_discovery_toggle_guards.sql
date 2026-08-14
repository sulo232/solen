-- exists-check: `npm run exists toggle_discovery` HITS both functions (created in
-- supabase/migrations/067_discovery.sql). This migration REPLACES those two in place. It creates
-- nothing new. Bodies below were read from pg_get_functiondef on the LIVE database this session,
-- not copied from 067, so nothing is reconstructed from a possibly-stale file.
--
-- AUTHZ-LIVE-02 (LOW, hardening). Both guards read:
--     IF p_user_id != auth.uid() THEN RAISE EXCEPTION 'unauthorized'; END IF;
--
-- That comparison is NULL-UNSAFE, and SQL's three-valued logic is the whole bug. If auth.uid() is
-- NULL, `p_user_id != NULL` evaluates to NULL, not TRUE. `IF NULL THEN` does not take the branch.
-- So the guard does not fire, execution falls through, and the function proceeds using the
-- CALLER-SUPPLIED p_user_id. These are SECURITY DEFINER functions, so at that point the caller
-- would be liking and saving as any user id they cared to name.
--
-- IS IT LIVE TODAY? NO, and the reason it is not is the point. Verified against the live catalog:
--   toggle_discovery_like  EXECUTE -> authenticated, postgres, service_role
--   toggle_discovery_save  EXECUTE -> authenticated, postgres, service_role
-- anon has no grant, and any authenticated JWT carries a non-null auth.uid(), so the NULL branch is
-- currently unreachable. Note what that means: the guard is not doing the work, the ABSENCE OF A
-- GRANT is. That is one `GRANT EXECUTE ... TO anon` away from a forge-any-user hole, and Supabase's
-- own advisor already flags that exact grant shape on 9 other functions in this database. A
-- security property that holds by accident is worth fixing while it is still cheap.
--
-- The right shape already exists here. create_group_booking IS granted to PUBLIC and anon, and it
-- is safe, because it checks NULL explicitly first. It is safe BECAUSE of the shape this migration
-- copies. So this is not an invention, it is making two outliers match the sibling that is already
-- proven under anon exposure.
--
-- DELIBERATELY NOT CHANGED:
--   - the signature. Dropping p_user_id and using auth.uid() directly would be stronger, but it
--     breaks every caller, so it is its own decision, not a drive-by.
--   - the error code. Adding `USING ERRCODE = '42501'` would flip PostgREST's response from 400 to
--     403 and could break a client branching on the status. This closes the NULL hole and changes
--     nothing a legitimate caller can observe.
--
-- Idempotent + forward-only: CREATE OR REPLACE with the identical body plus a fixed guard.
-- Re-running is a no-op.

create or replace function public.toggle_discovery_like(p_item_id uuid, p_user_id uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
DECLARE v_existed BOOLEAN;
BEGIN
  -- NULL-safe: an anonymous caller (auth.uid() IS NULL) is rejected explicitly instead of falling
  -- through a NULL comparison. Matches create_group_booking, the sibling that is anon-exposed.
  IF (SELECT auth.uid()) IS NULL OR p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT EXISTS(SELECT 1 FROM discovery_likes WHERE user_id = p_user_id AND item_id = p_item_id) INTO v_existed;
  IF v_existed THEN
    DELETE FROM discovery_likes WHERE user_id = p_user_id AND item_id = p_item_id;
    UPDATE discovery_items SET like_count = GREATEST(like_count - 1, 0) WHERE id = p_item_id;
  ELSE
    INSERT INTO discovery_likes (user_id, item_id) VALUES (p_user_id, p_item_id);
    UPDATE discovery_items SET like_count = like_count + 1 WHERE id = p_item_id;
  END IF;
  RETURN NOT v_existed;
END; $function$;

create or replace function public.toggle_discovery_save(p_item_id uuid, p_user_id uuid, p_collection_id uuid DEFAULT NULL::uuid)
returns boolean
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
DECLARE v_existed BOOLEAN;
BEGIN
  -- NULL-safe, see the note on toggle_discovery_like above.
  IF (SELECT auth.uid()) IS NULL OR p_user_id != (SELECT auth.uid()) THEN
    RAISE EXCEPTION 'unauthorized';
  END IF;
  SELECT EXISTS(SELECT 1 FROM discovery_saves WHERE user_id = p_user_id AND item_id = p_item_id) INTO v_existed;
  IF v_existed THEN
    DELETE FROM discovery_saves WHERE user_id = p_user_id AND item_id = p_item_id;
    UPDATE discovery_items SET save_count = GREATEST(save_count - 1, 0) WHERE id = p_item_id;
  ELSE
    INSERT INTO discovery_saves (user_id, item_id, collection_id) VALUES (p_user_id, p_item_id, p_collection_id);
    UPDATE discovery_items SET save_count = save_count + 1 WHERE id = p_item_id;
  END IF;
  RETURN NOT v_existed;
END; $function$;
