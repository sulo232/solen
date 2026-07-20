// /profile/settings/personal, now a redirect shim (2026-07-21, owner correction: identity
// merged into ONE screen). E-Mail + Telefon moved into the "identity" section of
// <SettingsForm>, rendered at /profile/edit alongside Foto/Name/Bio, so this route no longer
// renders its own form; it forwards logged-in users to the merged screen so the settings hub's
// existing "Persönliche Angaben" link doesn't 404. Auth-guard (redirect-to-login for logged-out
// users) is kept unchanged, ahead of the new redirect.
// mockup-ok: no appearance change, all JSX/classNames removed, this route renders nothing and
// only server-redirects; a logic change directed by the orchestrator task, not a design decision.
export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { createServerSupabaseClient } from "@/lib/supabase";

export default async function PersonalSettingsPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/settings/personal`)}`);
  }

  redirect(`/${locale}/profile/edit`);
}
