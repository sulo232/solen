-- exists-check: net-new migration (append-only convention); records the E2E security
-- REVOKEs + rating trigger already applied to prod via MCP, not a duplicate of any existing migration.
-- E2E audit security hardening (applied to prod via MCP 2026-07-06, owner-authorized).
-- Recorded here for repo reproducibility. All REVOKEs are reversible via GRANT;
-- service_role retains EXECUTE on every function so the app is unaffected.

-- P1 (CRITICAL): money/credit/voucher/promo SECURITY DEFINER RPCs were anon-executable
-- (double-spend via restore_*, griefing via redeem_*). Zero in-app anon callers.
REVOKE EXECUTE ON FUNCTION public.redeem_voucher(text, uuid, numeric, uuid, uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.redeem_user_credits(uuid, numeric, uuid, text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_voucher(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.restore_user_credits(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.increment_promo_use(text) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.next_walkin_ticket_seq(uuid) FROM anon, authenticated, PUBLIC;

-- P4: discovery/persona RPCs. like/save/persona are called by the AUTHENTICATED
-- session client (p_user_id = user.id) so keep authenticated, revoke anon.
-- recent_searches/trending/recompute are called via the service-role admin client.
REVOKE EXECUTE ON FUNCTION public.toggle_discovery_like(uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.toggle_discovery_save(uuid, uuid, uuid) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.set_customer_persona(jsonb) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.discovery_recent_searches(uuid, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.discovery_trending_terms(integer, integer, integer) FROM anon, authenticated, PUBLIC;
REVOKE EXECUTE ON FUNCTION public.recompute_user_style_affinity() FROM anon, authenticated, PUBLIC;

-- P2: staff_members.commission_rate + permissions were anon-readable via the anon key
-- (RLS can't filter columns). Revoke from anon only; authenticated (owner dashboard) keeps it.
REVOKE SELECT (commission_rate, permissions) ON public.staff_members FROM anon;

-- P5: pin search_path on the one flagged function.
ALTER FUNCTION public.service_bundles_min_items() SET search_path = 'public, pg_temp';

-- P6: rating-cache drift on review moderation. The old trigger counted hidden reviews
-- and only fired AFTER INSERT, so a moderated (is_hidden) / deleted review never left
-- the cached aggregate that feeds search ranking. Fix: exclude hidden + fire on
-- INSERT/UPDATE/DELETE.
CREATE OR REPLACE FUNCTION public.update_salon_rating()
 RETURNS trigger LANGUAGE plpgsql SET search_path TO 'public', 'pg_temp'
AS $function$
DECLARE sid uuid := COALESCE(NEW.salon_id, OLD.salon_id);
BEGIN
  UPDATE public.salons SET
    average_rating = (SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE salon_id = sid AND is_hidden = false),
    review_count   = (SELECT COUNT(*) FROM public.reviews WHERE salon_id = sid AND is_hidden = false)
  WHERE id = sid;
  RETURN COALESCE(NEW, OLD);
END;
$function$;
CREATE OR REPLACE TRIGGER reviews_update_salon_rating
  AFTER INSERT OR UPDATE OR DELETE ON public.reviews
  FOR EACH ROW EXECUTE FUNCTION public.update_salon_rating();

-- NOT changed (documented decisions):
--   profile_summaries / public_profiles SECDEF views: expose only id/display_name/avatar;
--     profiles RLS is owner-only, so these views ARE the intentional public-display path.
--     Converting to security_invoker would break public reviewer name/avatar display. Left.
--   search_salons_ranked / search_suggest: public search, intentionally anon. Left.
--   toggle_discovery_like/save + set_customer_persona: authenticated can still call with
--     another user's p_user_id (act-as-other); proper fix = auth.uid() rewrite. PARKED.
--   HaveIBeenPwned leaked-password protection: enable in the Auth dashboard (no SQL). PARKED.
