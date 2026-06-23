-- exists-check: net-new, ADDITIVE + idempotent. Closes "Gap 1" (DNA persona sync): the shared write
-- path so the mobile onboarding persona reaches profiles.customer_preferences.persona, which the web
-- Hair-DNA API (app/api/persona/hair-dna) ALREADY reads. One security-definer RPC both web + mobile
-- call (same Supabase project) — merges the persona slice WITHOUT clobbering the rest of
-- customer_preferences (skinType/categories/interests). Only ever touches the caller's own row.

create or replace function public.set_customer_persona(p_persona jsonb)
returns void
language plpgsql
security definer
set search_path = public
as $func$
begin
  if auth.uid() is null then return; end if;
  if p_persona is null or jsonb_typeof(p_persona) <> 'object' then return; end if; -- only a persona object
  update public.profiles
     set customer_preferences = coalesce(customer_preferences, '{}'::jsonb)
                                || jsonb_build_object('persona', p_persona)
   where id = auth.uid();
end;
$func$;

grant execute on function public.set_customer_persona(jsonb) to authenticated;
