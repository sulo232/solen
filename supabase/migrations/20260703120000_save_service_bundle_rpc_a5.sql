-- A5 B-2 council BLOCKER fix (applied live via MCP: save_service_bundle_rpc_a5 +
-- save_service_bundle_rpc_lockdown_a5, 2026-07-03; repo mirror). Atomic bundle create/update:
-- the route's PATCH did deactivate -> delete items -> insert items as SEPARATE calls, so a failed
-- insert orphaned a live bundle with 0 items (invisible to storefront AND dashboard). This RPC does
-- it in ONE transaction (plpgsql fn = one tx; any exception rolls back everything), verifies
-- ownership + services + pricing inside (defense-in-depth), service_role only.
CREATE OR REPLACE FUNCTION public.save_service_bundle(
  p_salon_id uuid, p_bundle_id uuid, p_name text, p_pricing_mode text,
  p_custom_price numeric, p_percent_off smallint, p_is_active boolean, p_service_ids uuid[]
) RETURNS uuid LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_bundle uuid; v_bad int;
BEGIN
  IF (SELECT count(DISTINCT sid) FROM unnest(p_service_ids) AS sid) < 2 THEN
    RAISE EXCEPTION 'BUNDLE_MIN_ITEMS' USING ERRCODE = '23514'; END IF;
  SELECT count(*) INTO v_bad FROM (SELECT DISTINCT sid FROM unnest(p_service_ids) AS sid) u
    WHERE NOT EXISTS (SELECT 1 FROM services s WHERE s.id = u.sid AND s.salon_id = p_salon_id AND s.is_active);
  IF v_bad > 0 THEN RAISE EXCEPTION 'BUNDLE_SERVICE_INVALID' USING ERRCODE = '23514'; END IF;
  IF p_pricing_mode NOT IN ('sum','custom','percent') THEN RAISE EXCEPTION 'BUNDLE_PRICING_MISMATCH' USING ERRCODE = '23514'; END IF;
  IF p_pricing_mode = 'custom' AND p_custom_price IS NULL THEN RAISE EXCEPTION 'BUNDLE_PRICING_MISMATCH' USING ERRCODE = '23514'; END IF;
  IF p_pricing_mode = 'percent' AND (p_percent_off IS NULL OR p_percent_off < 1 OR p_percent_off > 99) THEN RAISE EXCEPTION 'BUNDLE_PRICING_MISMATCH' USING ERRCODE = '23514'; END IF;
  IF p_bundle_id IS NULL THEN
    INSERT INTO service_bundles(salon_id,name,pricing_mode,custom_price,percent_off,is_active)
    VALUES (p_salon_id,p_name,p_pricing_mode,p_custom_price,p_percent_off,false) RETURNING id INTO v_bundle;
  ELSE
    SELECT id INTO v_bundle FROM service_bundles WHERE id = p_bundle_id AND salon_id = p_salon_id;
    IF v_bundle IS NULL THEN RAISE EXCEPTION 'BUNDLE_NOT_FOUND' USING ERRCODE = '42501'; END IF;
    UPDATE service_bundles SET name=p_name,pricing_mode=p_pricing_mode,custom_price=p_custom_price,percent_off=p_percent_off,is_active=false WHERE id = v_bundle;
    DELETE FROM service_bundle_items WHERE bundle_id = v_bundle;
  END IF;
  INSERT INTO service_bundle_items(bundle_id,service_id,sort_order)
    SELECT v_bundle, sid, (MIN(ord)-1)::int FROM unnest(p_service_ids) WITH ORDINALITY AS t(sid,ord) GROUP BY sid;
  UPDATE service_bundles SET is_active = p_is_active WHERE id = v_bundle;
  RETURN v_bundle;
END $$;
REVOKE EXECUTE ON FUNCTION public.save_service_bundle(uuid,uuid,text,text,numeric,smallint,boolean,uuid[]) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.save_service_bundle(uuid,uuid,text,text,numeric,smallint,boolean,uuid[]) TO service_role;
