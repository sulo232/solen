import { cookies } from "next/headers";
import type { SupabaseClient } from "@supabase/supabase-js";

/**
 * Active-salon resolution for multi-salon owners (V3 — salon switcher).
 *
 * Background: ~40 owner API routes used to resolve "the owner's salon" with
 * `.eq("owner_id", user.id).single()`, which 406/PGRST116-errored for owners
 * with more than one salon (→ 403 "no salon"). The stopgap made them pick the
 * OLDEST salon. This helper supersedes that: it honours an explicit selection
 * (the `solen_active_salon` cookie, set by the switcher) when the selected
 * salon is actually owned by the user, and otherwise falls back to the oldest
 * owned salon — so behaviour is identical to the stopgap when no cookie is set
 * (fully back-compatible, purely additive).
 */
export const ACTIVE_SALON_COOKIE = "solen_active_salon";

/**
 * Returns the id of the owner's active salon, or null if they own none.
 * - cookie-selected salon, IF it is owned by `userId`
 * - else the oldest owned salon (created_at asc)
 */
export async function getActiveSalonId(
  supabase: SupabaseClient,
  userId: string,
): Promise<string | null> {
  const cookieStore = await cookies();
  const selected = cookieStore.get(ACTIVE_SALON_COOKIE)?.value ?? null;

  if (selected) {
    const { data } = await supabase
      .from("salons")
      .select("id")
      .eq("id", selected)
      .eq("owner_id", userId)
      .maybeSingle();
    if (data?.id) return data.id;
  }

  const { data: oldest } = await supabase
    .from("salons")
    .select("id")
    .eq("owner_id", userId)
    .order("created_at", { ascending: true })
    .limit(1)
    .maybeSingle();

  return oldest?.id ?? null;
}

/**
 * Convenience: returns the active salon ROW (selected columns) for an owner, or
 * null if they own none. Drop-in replacement for the stopgap pattern
 * `.from("salons").select(cols).eq("owner_id", uid).order("created_at").limit(1).maybeSingle()`.
 */
export async function getActiveSalon<T = Record<string, unknown>>(
  supabase: SupabaseClient,
  userId: string,
  columns = "*",
): Promise<T | null> {
  const id = await getActiveSalonId(supabase, userId);
  if (!id) return null;
  const { data } = await supabase
    .from("salons")
    .select(columns)
    .eq("id", id)
    .maybeSingle();
  return (data as T) ?? null;
}
