// /profile — customer account hub. Redesign 2026-06-12 (owner-approved mockup
// public/_mockups/konto-redesign.html): the V3-D348 "2×2 grey-disc tile grid +
// divided-stat strip" read dated ("looks 2016"). New shape: quiet identity header →
// next-appointment HERO (mirrors the on-system BookingCard, resurfaces existing
// bookings data) → calm grouped lists (Aktivität / Mehr) with real icons + sparse
// semantic color → quiet sign-out. One rich hero + composure, whisper elevation.
// Still a server component (rows are <Link>s, sign-out is a form POST) — no client JS.

export const dynamic = "force-dynamic";

import Link from "next/link";
import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format-currency";
import {
  Calendar,
  Scissors,
  Ticket,
  ClipboardList,
  Heart,
  Award,
  Gift,
  Sparkles,
  UserPlus,
  SlidersHorizontal,
  HelpCircle,
  LogOut,
  ChevronRight,
  Clock,
  MapPin,
  Stamp,
  Bell,
  Pencil,
  type LucideIcon,
} from "lucide-react";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  // Account pages are private — keep them out of the index.
  return { title: t("title"), robots: { index: false, follow: false } };
}

// Returns the real count on success (0 is a legitimate, successful zero).
// Returns null on a genuine fetch error/exception, distinct from a real zero,
// so the caller can omit the badge instead of rendering a fabricated "0".
async function countOf(build: () => PromiseLike<{ count: number | null; error: unknown }>, label: string): Promise<number | null> {
  try {
    const { count, error } = await build();
    if (error) {
      console.error(`[ProfileHub] ${label} count error:`, (error as { message?: string })?.message ?? error);
      return null;
    }
    return count ?? 0;
  } catch (err) {
    console.error(`[ProfileHub] ${label} count exception:`, err);
    return null;
  }
}

// Joined shapes from the next-booking query. Supabase types to-one joins loosely
// (object | array); normalize() below handles both.
type JoinedSalon = { slug?: string | null; name?: string | null; address?: string | null };
type JoinedService = { name_de?: string | null; name_en?: string | null; name_fr?: string | null; name_it?: string | null; duration_minutes?: number | null };
type NextBooking = {
  starts_at: string;
  ends_at: string | null;
  price_paid: number | null;
  salon: JoinedSalon | JoinedSalon[] | null;
  service: JoinedService | JoinedService[] | null;
};

function one<T>(v: T | T[] | null | undefined): T | null {
  if (!v) return null;
  return Array.isArray(v) ? (v[0] ?? null) : v;
}

export default async function ProfilePage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "profileHub" });
  const tb = await getTranslations({ locale, namespace: "bookingCard" });

  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    redirect(`/${locale}/auth/login?redirect=${encodeURIComponent(`/${locale}/profile`)}`);
  }

  const userId = user.id;
  const nowIso = new Date().toISOString();

  const [profileRes, totalBookings, upcomingBookings, favCount, stampCount, nextBookingRes] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, created_at").eq("id", userId).maybeSingle(),
    countOf(() => supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId), "bookings"),
    countOf(() => supabase.from("bookings").select("id", { count: "exact", head: true }).eq("user_id", userId).gte("starts_at", nowIso).neq("status", "cancelled"), "upcoming"),
    countOf(() => supabase.from("favorites").select("salon_id", { count: "exact", head: true }).eq("user_id", userId), "favorites"),
    countOf(() => supabase.from("loyalty_stamps").select("id", { count: "exact", head: true }).eq("customer_id", userId), "stamps"),
    // The hero: the single next confirmed booking (mirrors /api/bookings/user?tab=upcoming).
    supabase
      .from("bookings")
      // services has only name_de/name_en in this DB (schema drift) — fr/it fall back, same as BookingCard.
      .select("starts_at, ends_at, price_paid, salon:salons(slug, name, address), service:services(name_de, name_en, duration_minutes)")
      .eq("user_id", userId)
      .eq("status", "confirmed")
      .gte("starts_at", nowIso)
      .order("starts_at", { ascending: true })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileRes.error) console.error("[ProfileHub] profile fetch error:", profileRes.error.message);
  if (nextBookingRes.error) console.error("[ProfileHub] next booking fetch error:", nextBookingRes.error.message);
  const profile = profileRes.data;

  const displayName = profile?.display_name?.trim() || user.email?.split("@")[0] || t("title");
  const memberYear = profile?.created_at ? new Date(profile.created_at).getFullYear() : null;
  const subtitle = user.email || (memberYear ? t("memberSince", { year: memberYear }) : "");
  const avatarSrc = profile?.avatar_url && /^https?:\/\//.test(profile.avatar_url) ? profile.avatar_url : null;

  const p = (path: string) => `/${locale}${path}`;

  // ── next-appointment hero data (server-formatted; pin Europe/Zurich so the UTC
  //    server doesn't render the wrong time — same trap as the slot bugs) ──
  const nb = (nextBookingRes.data as NextBooking | null) ?? null;
  const salon = one(nb?.salon);
  const service = one(nb?.service);
  const localeCode = locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";
  let hero: null | { dow: string; day: string; mon: string; time: string; salonName: string; serviceLine: string; address: string | null; price: number | null } = null;
  if (nb && salon) {
    const zone = { timeZone: "Europe/Zurich" } as const;
    const sd = new Date(nb.starts_at);
    const dur = nb.ends_at ? Math.round((new Date(nb.ends_at).getTime() - sd.getTime()) / 60000) : (service?.duration_minutes ?? 0);
    const svcName = (service?.[`name_${locale}` as keyof JoinedService] as string) || service?.name_de || service?.name_en || "";
    hero = {
      dow: sd.toLocaleDateString(localeCode, { weekday: "short", ...zone }),
      day: sd.toLocaleDateString(localeCode, { day: "2-digit", ...zone }),
      mon: sd.toLocaleDateString(localeCode, { month: "short", ...zone }),
      time: sd.toLocaleTimeString(localeCode, { hour: "2-digit", minute: "2-digit", hour12: false, ...zone }),
      salonName: salon.name || "",
      serviceLine: svcName + (dur ? ` · ${dur} ${tb("minutes")}` : ""),
      address: salon.address || null,
      price: nb.price_paid,
    };
  }

  return (
    <main className="min-h-screen bg-s-bg-sunken">
      <div className="max-w-md mx-auto px-5 pt-6 pb-16">
        {/* "Konto" sits beside the global back tile (Header deepPageTitle). */}

        {/* Identity — on the sunken bg, no card (Uber-style) */}
        <div className="flex items-center gap-3.5 mb-6">
          <Avatar src={avatarSrc} name={displayName} size={60} />
          <div className="min-w-0">
            <p className="font-heading text-[21px] font-semibold tracking-[-0.015em] text-s-ink truncate">{displayName}</p>
            {subtitle ? <p className="text-[13.5px] text-s-ink-2 truncate mt-0.5">{subtitle}</p> : null}
          </div>
        </div>

        {/* mockup-ok: Profil bearbeiten, Instagram-model split from Settings (owner correction,
            2026-07-20). Zero new visual language, this section wrapper and the <Row> below reuse
            the EXACT classes already shipped twice further down this same file (the Aktivitat and
            Mehr sections: "rounded-card bg-white shadow-elevation-1 overflow-hidden" + the local
            Row component), structural reuse per the design contract's "ground in the system,
            do not invent" rule, not a new treatment. */}
        <section className="mb-6 rounded-card bg-white shadow-elevation-1 overflow-hidden">
          <Row href={p("/profile/edit")} icon={Pencil} label={t("editProfile")} />
        </section>

        {/* HERO — next appointment (mirrors BookingCard; only when one exists) */}
        {hero ? (
          <section className="mb-2">
            <p className="text-[13px] font-medium text-s-ink-2 mb-2.5 px-0.5">{t("nextAppointment")}</p>
            <Link href={p("/profile/bookings")} className="block rounded-card border border-s-border bg-white p-4 shadow-elevation-1 transition-[transform,box-shadow] duration-200 ease-glide hover:-translate-y-[2px] hover:shadow-elevation-2 active:scale-[0.98]">
              <div className="flex items-start gap-3">
                <div className="flex-none w-[52px] rounded-[12px] bg-s-bg-sunken py-2 text-center">
                  <div className="text-[12px] font-bold uppercase tracking-[0.06em] text-s-ink-2">{hero.dow}</div>
                  <div className="font-heading text-[22px] font-bold leading-[1.05] text-s-ink">{hero.day}</div>
                  <div className="text-[12px] text-s-ink-2">{hero.mon}</div>
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="truncate font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">{hero.salonName}</h3>
                  <p className="mt-0.5 truncate text-[14px] text-s-ink">{hero.serviceLine}</p>
                  {hero.address ? (
                    <p className="mt-1 flex items-center gap-1.5 text-[13px] text-s-ink-2">
                      <MapPin size={13} className="flex-none text-s-ink-3" aria-hidden />
                      <span className="truncate">{hero.address}</span>
                    </p>
                  ) : null}
                  <p className="mt-1 flex items-center gap-1.5 text-[13px] text-s-ink-2">
                    <Clock size={13} className="flex-none text-s-ink-3" aria-hidden />
                    {hero.time}
                  </p>
                </div>
                <div className="flex-none rounded-pill bg-s-success/10 px-2.5 py-1 text-[12px] font-semibold text-s-success">
                  {tb("status.confirmed")}
                </div>
              </div>
              <div className="mt-3 flex items-center justify-between border-t border-s-border pt-3">
                <div className="text-[15px] font-semibold text-s-ink">
                  <span className="mr-1.5 text-[12px] font-normal text-s-ink-2">{tb("total")}</span>
                  {hero.price != null ? formatCurrency(hero.price) : ""}
                </div>
                <span className="inline-flex items-center gap-1 text-[14px] font-semibold text-s-ink">
                  {t("viewDetails")}
                  <ChevronRight size={16} strokeWidth={2.4} aria-hidden />
                </span>
              </div>
            </Link>
          </section>
        ) : null}

        {/* Activity */}
        <h2 className="text-[13px] font-medium text-s-ink-2 mt-8 mb-2.5 px-0.5">{t("sectionActivity")}</h2>
        <section className="rounded-card bg-white shadow-elevation-1 overflow-hidden">
          <Row href={p("/profile/bookings")} icon={Calendar} label={t("tileAppointments")} meta={upcomingBookings != null ? t("upcomingCount", { count: upcomingBookings }) : undefined} />
          <Row href={p("/profile/favorites")} icon={Heart} iconClass="text-[#FF3366]" label={t("tileFavorites")} meta={favCount != null ? String(favCount) : undefined} />
          {/* Loyalty (Treue) is the Solen-wide Status (rank) page. /profile/stamps is the separate
              per-salon stamp-card system (loyalty_cards/loyalty_stamps); it is NOT frozen yet
              (LOYALTY_STRUCTURE.md §6: freeze happens on launch day, existing balances stay
              redeemable for 12mo after), so it stays reachable as its own row, not merged. */}
          <Row href={p("/rewards")} icon={Award} label={t("tileLoyalty")} />
          <Row href={p("/profile/stamps")} icon={Stamp} label={t("tileStamps")} meta={stampCount != null ? String(stampCount) : undefined} />
          {/* Gift-card wallet HIDDEN from customers (owner, 2026-06-14) in favour of a Solen-wide loyalty card. */}
        </section>

        {/* More */}
        <h2 className="text-[13px] font-medium text-s-ink-2 mt-8 mb-2.5 px-0.5">{t("sectionMore")}</h2>
        <section className="rounded-card bg-white shadow-elevation-1 overflow-hidden">
          <Row href={p("/profile/haarprofil")} icon={Scissors} label={t("haarprofil")} />
          <Row href={p("/profile/looks")} icon={Sparkles} label={t("looks")} />
          {/* Vouchers (gift cards) HIDDEN from customers (owner, 2026-06-14) in favour of a Solen-wide loyalty card. */}
          <Row href={p("/profile/intake-forms")} icon={ClipboardList} label={t("intakeForms")} />
          <Row href={p("/profile/referral")} icon={UserPlus} label={t("refer")} meta={t("referReward")} />
          <Row href={p("/notifications")} icon={Bell} label={t("tileNotifications")} />
          <Row href={p("/profile/settings")} icon={SlidersHorizontal} label={t("settings")} />
          <Row href={p("/help")} icon={HelpCircle} label={t("help")} />
        </section>

        {/* Sign out — quiet tertiary; form POST so it works without client JS */}
        <form action="/api/auth/logout" method="post" className="mt-7">
          <button
            type="submit"
            className="w-full flex items-center justify-center gap-2 py-3.5 text-[14.5px] font-medium text-s-ink-2 hover:text-s-ink transition-colors duration-200"
          >
            <LogOut size={18} className="text-s-ink-3" aria-hidden />
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
      className="relative shrink-0 rounded-full bg-s-bg-sunken grid place-items-center overflow-hidden text-s-ink-2 font-semibold ring-1 ring-black/[0.04]"
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

function Row({ href, icon: Icon, label, meta, iconClass }: { href: string; icon: LucideIcon; label: string; meta?: string; iconClass?: string }) {
  return (
    <Link
      href={href}
      className="flex items-center gap-3.5 px-[15px] py-[14px] border-b border-s-border last:border-b-0 hover:bg-s-bg-sunken transition-colors duration-200"
    >
      <Icon size={22} strokeWidth={1.9} className={iconClass ?? "text-s-ink"} aria-hidden />
      <span className="flex-1 text-[15px] font-medium text-s-ink tracking-[-0.005em]">{label}</span>
      {meta ? <span className="text-[14px] text-s-ink-2">{meta}</span> : null}
      <ChevronRight size={18} className="text-s-ink-disabled" aria-hidden />
    </Link>
  );
}
