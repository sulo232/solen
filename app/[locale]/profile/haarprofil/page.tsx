// /profile/haarprofil — customer hair profile editor (owner mockup haarprofil.html).
//
// V1 ships the REAL subset only: Haartyp / Länge / Dicke — live profiles columns
// (hair_type / hair_length / hair_thickness), shared option values with onboarding +
// the booking HairStep (beautyFields single source). The mockup's further sections
// (Allergien, Coloration history, bevorzugte:r Stylist:in, Referenzfotos, KI-Notiz)
// have NO backing schema yet — building them now would mean fabricated data; they are
// tracked as the haarprofil V2 follow-up in CUSTOMER_FIX_PROGRESS.md instead.

export const dynamic = "force-dynamic";

import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import HaarprofilForm from "./HaarprofilForm";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "haarprofil" });
  return { title: t("title"), robots: { index: false, follow: false } };
}

export default async function HaarprofilPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile/haarprofil`)}`);
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("hair_type, hair_length, hair_thickness")
    .eq("id", user.id)
    .single();

  const t = await getTranslations({ locale, namespace: "haarprofil" });

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      {/* Title sits beside the global back tile (Header deepPageTitle); the lead
          subtitle stays — it tells the customer why the profile helps the stylist. */}
      <p className="text-[14px] text-s-ink-2">{t("subtitle")}</p>
      <HaarprofilForm
        initial={{
          hair_type: profile?.hair_type ?? "",
          hair_length: profile?.hair_length ?? "",
          hair_thickness: profile?.hair_thickness ?? "",
        }}
      />
    </main>
  );
}
