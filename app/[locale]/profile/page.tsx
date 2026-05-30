// /profile — customer account hub (V3-D348, 2026-05-30).
// Ground-up rebuild replacing the legacy `components-legacy/ProfilePage` monolith.
// Variant C (user pick): identity+stat header card → 2×2 action tiles → "More" list
// → sign-out. Pure server component — tiles/rows are <Link>s, sign-out is a form POST
// to /api/auth/logout, so no client JS. Locked B&W tokens, A13 one-ink-anchor per item.
// Structure source: public/solen-profile-variants.html (variant C). Aesthetic: LOCKFILE.

export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import {
  Settings,
  Calendar,
  Heart,
  Award,
  Gift,
  Sparkles,
  UserPlus,
  SlidersHorizontal,
  HelpCircle,
  LogOut,
  ChevronRight,
  type LucideIcon,
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  // Account pages are private — keep them out of the index.
  return { title: t("title"), robots: { index: false, follow: false } };
}

async function countOf(build: () => PromiseLike<{ count: number | null; error: unknown }>, label: string): Promise<number> {
  try {
    const { count, error } = await build();
    if (error) {
      console.error(`[ProfileHub] ${label} count error:`, (error as { message?: string })?.message ?? error);
      return 0;
    }
    return count ?? 0;
  } catch (err) {
    console.error(`[ProfileHub] ${label} count exception:`, err);
    return 0;
  }
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });

  const supabase = await createServerSupabaseClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile`)}`);
  }

  const userId = user.id;
  const nowIso = new Date().toISOString();

  const [profileRes, totalBookings, upcomingBookings, favCount, stampCount] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, created_at").eq("id", userId).maybeSingle(),
    countOf(() => supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId), "bookings"),
    countOf(() => supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("starts_at", nowIso).neq("status", "cancelled"), "upcoming"),
    countOf(() => supabase.from("favorites").select("salon_id", { count: "exact", head: true }).eq("user_id", userId), "favorites"),
    countOf(() => supabase.from("loyalty_stamps").select("id", { count: "exact", head: true }).eq("customer_id", userId), "stamps"),
  ]);

  if (profileRes.error) console.error("[ProfileHub] profile fetch error:", profileRes.error.message);
  const profile = profileRes.data;

  const displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || t("title");
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;
  const subtitle = user.email || (memberYear ? t("memberSince", { year: memberYear }) : "");
  const avatarSrc = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  const p = (path: string) => `/${locale}${path}`;

  return (
    <main className="min-h-screen bg-white">
      <div className="max-w-md mx-auto px-5 pt-6 pb-16">
        {/* Page header */}
        <div className="flex items-center justify-between mb-5">
          <h1 className="text-[22px] font-semibold tracking-[-0.015em] text-s-ink">{t("title")}</h1>
          <Link
            href={p("/profile/settings")}
            aria-label={t("settings")}
            className="grid place-items-center w-10 h-10 rounded-full border border-s-border text-s-ink hover:bg-s-bg-sunken transition-colors duration-200"
          >
            <Settings size={18} aria-hidden />
          </Link>
        </div>

        {/* Identity + stats card */}
        <section className="rounded-card border border-s-border bg-white shadow-card p-[18px]">
          <div className="flex items-center gap-[14px]">
            <Avatar src={avatarSrc} name={displayName} size={52} />
            <div className="min-w-0">
              <p className="text-[18px] font-semibold tracking-[-0.015em] text-s-ink truncate">{displayName}</p>
              {subtitle ? <p className="text-[13px] text-s-ink-2 truncate mt-0.5">{subtitle}</p> : null}
            </div>
          </div>
          <div className="flex mt-4 border-t border-s-border pt-[14px]">
            <Stat num={totalBookings} cap={t("statBookings")} />
            <Stat num={favCount} cap={t("statFavorites")} divider />
            <Stat num={stampCount} cap={t("statStamps")} divider />
          </div>
        </section>

        {/* Action tiles */}
        <div className="grid grid-cols-2 gap-[10px] mt-4">
          <Tile href={p("/profile/bookings")} icon={Calendar} label={t("tileAppointments")} meta={t("upcomingCount", { count: upcomingBookings })} />
          <Tile href={p("/profile/favorites")} icon={Heart} label={t("tileFavorites")} meta={t("savedCount", { count: favCount })} />
          <Tile href={p("/profile/stamps")} icon={Award} label={t("tileLoyalty")} meta={t("stampsCount", { count: stampCount })} />
          <Tile href={p("/profile/gift-cards")} icon={Gift} label={t("tileWallet")} meta={t("walletDesc")} />
        </div>

        {/* More */}
        <h2 className="text-[13px] font-medium text-s-ink-2 mt-[22px] mb-2 px-0.5">{t("sectionMore")}</h2>
        <section className="rounded-card border border-s-border bg-white overflow-hidden">
          <Row href={p("/profile/looks")} icon={Sparkles} label={t("looks")} />
          <Row href={p("/profile/referral")} icon={UserPlus} label={t("refer")} meta={t("referReward")} />
          <Row href={p("/profile/settings")} icon={SlidersHorizontal} label={t("settings")} />
          <Row href={p("/help")} icon={HelpCircle} label={t("help")} />
        </section>

        {/* Sign out — form POST so it works without client JS */}
        <form action="/api/auth/logout" method="post" className="mt-[22px]">
          <button
            type="submit"
            className="w-full h-[46px] rounded-btn border border-s-border bg-white text-s-ink text-[15px] font-medium flex items-center justify-center gap-2 hover:bg-s-bg-sunken transition-colors duration-200"
          >
            <LogOut size={17} className="text-s-ink-2" aria-hidden />
            {t("signOut")}
          </button>
        </form>
      </div>
    </main>
  );
}

function Avatar({ src, name, size }: { src: string | null; name: string; size: number }) {
  const initials = name.trim().charAt(0).toUpperCase() || "·";
  return (
    <div
      className="relative shrink-0 rounded-full bg-s-bg-sunken grid place-items-center overflow-hidden text-s-ink-2 font-semibold"
      style={{ width: size, height: size, fontSize: Math.round(size * 0.34) }}
    >
      <span aria-hidden>{initials}</span>
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element -- arbitrary user-supplied avatar URL; next/image remote config not guaranteed
        <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
      ) : null}
    </div>
  );
}

function Stat({ num, cap, divider }: { num: number; cap: string; divider?: boolean }) {
  return (
    <div className={`flex-1 text-center ${divider ? "border-l border-s-border" : ""}`}>
      <div className="text-[17px] font-semibold text-s-ink tabular-nums">{num}</div>
      <div className="text-[12px] text-s-ink-2 mt-0.5">{cap}</div>
    </div>
  );
}

function Tile({ href, icon: Icon, label, meta }: { href: string; icon: LucideIcon; label: string; meta: string }) {
  return (
    <Link
      href={href}
      className="block rounded-card border border-s-border bg-white p-[15px] hover:bg-s-bg-sunken transition-colors duration-200"
    >
      <div className="w-[34px] h-[34px] rounded-full bg-s-bg-sunken grid place-items-center text-s-ink">
        <Icon size={17} aria-hidden />
      </div>
      <div className="text-[14px] font-medium text-s-ink mt-3">{label}</div>
      <div className="text-[12px] text-s-ink-2 mt-0.5">{meta}</div>
    </Link>
  );
}

function Row({ href, icon: Icon, label, meta }: { href: string; icon: LucideIcon; label: string; meta?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-[14px] px-[14px] py-[13px] border-b border-s-border last:border-b-0 hover:bg-s-bg-sunken transition-colors duration-200"
    >
      <div className="w-9 h-9 rounded-full bg-s-bg-sunken grid place-items-center text-s-ink shrink-0">
        <Icon size={18} aria-hidden />
      </div>
      <span className="flex-1 text-[15px] font-medium text-s-ink">{label}</span>
      {meta ? <span className="text-[14px] text-s-ink-2">{meta}</span> : null}
      <ChevronRight size={18} className="text-s-ink-disabled" aria-hidden />
    </Link>
  );
}
