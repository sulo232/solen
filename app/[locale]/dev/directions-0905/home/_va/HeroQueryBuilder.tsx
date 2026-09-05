// Exists-check: `npm run exists home` -> app/[locale]/_components/homepage/Hero.tsx is the real
// hero (H1 + English-locale subtitle + <SearchBar/>), currently rendered `max-md:hidden`
// (desktop only) since the 2026-08-01 owner decision moved mobile to HomeSearchPill instead
// (comment at Hero.tsx:158-161). `npm run exists SearchBar` -> real, wired, live component at
// app/[locale]/_components/homepage/SearchBar.tsx, unchanged, imported below (never forked): its
// mobile "collapsed" layout already IS the Fresha 3-stacked-field query builder (Service / Stadt /
// Zeit rows + one ink "Termine finden" button), each row opening the real SearchOverlay, which
// submits to /{locale}/search. This file does not rebuild that field stack; it makes the EXISTING
// one visible on a phone width, which is the one thing this direction changes.
//
// Grounded-in: app/[locale]/_components/homepage/Hero.tsx (COPIED, not imported: Hero.tsx is
// off-limits/read-only per the brief, and this direction needs the desktop-only `max-md:hidden`
// wrapper removed plus the hardcoded German subtitle translated to English, both structural/copy
// changes the brief's own "copy that component into your own _v folder" clause allows). Every
// class, the H1 i18n key, the session-greeting query and the SearchBar mount are copied verbatim
// off Hero.tsx lines 162-243; only the visibility class and the one hardcoded string differ.
//
// Depicts: H1 + session greeting -> app/[locale]/_components/homepage/Hero.tsx (real
// getTranslations("home.hero").instantlyConfirmed key, real session/profile lookup, unchanged).
// Depicts: the 3-field query builder + closing Search button -> ./FreshaQueryPill.tsx (own header
// carries the full REPAIR ROUND reasoning: forked off SearchBar.tsx's real collapsed-row anatomy
// and wiring into a Fresha-shaped ONE continuous pill, replacing the earlier 3-stacked-card
// version this file used to mount directly).
//
// Sources: fresha--home.md item 3 (one continuous pill, segments divided by whitespace, one
// solid closing Search button) -> matched by ./FreshaQueryPill.tsx now, not SearchBar's own real
// mobile layout (that real layout is a 250px 3-row stacked card, the anatomy mismatch a punch-list
// round measured against this same spec item); airbnb--look-recipe.md is not applied here (this
// direction is LOCK MODE, Solen look kept, see HomeVariantA.tsx's own header).
//
// Conflict, named per the brief: replacing HomeSearchPill's mobile slot with this hero block
// collides with two dated owner decisions that put HomeSearchPill there instead (2026-08-01, "why
// is homepage still that bro" / "it should be search bar instead of category bar"). Direction A is
// the deliberate reopening of that call for comparison; HomeVariantA.tsx's header carries the full
// conflicts list, not repeated here.
import FreshaQueryPill from "./FreshaQueryPill";
import { getSessionUser } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";

export default async function HeroQueryBuilder({ locale }: { locale: string }) {
  const t = await getTranslations({ locale, namespace: "home.hero" });
  const { supabase, user } = await getSessionUser();
  let displayName: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("id", user.id)
      .maybeSingle();
    displayName = (profile as { display_name?: string | null } | null)?.display_name ?? null;
    if (!displayName && user.email) {
      const local = user.email.split("@")[0] ?? "";
      displayName = local ? local.charAt(0).toUpperCase() + local.slice(1) : null;
    }
  }

  return (
    <section className="relative overflow-hidden">
      {/* Same wrapper Hero.tsx uses for its desktop block, minus `max-md:hidden`: this direction's
          whole point is showing this block on a phone width. */}
      {/* pt-10->pt-6, pb-2->pb-0, mt-6->mt-4 on mobile only (md: untouched): the REPAIR ROUND's
          punch-list imagery fix (see ./FreshaQueryPill.tsx header) trims this section's own
          whitespace on top of shrinking the pill itself, so real salon photography rises further
          into the first viewport. Desktop breakpoints are unchanged, this direction is judged on
          a phone width. */}
      <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col justify-center px-4 pt-6 pb-0 md:px-8 md:pt-14 md:pb-16">
        <div className="w-full">
          {displayName && (
            <p className="mb-3 font-body text-[14px] md:text-[16px] font-medium text-s-ink-2 tracking-[-0.005em]">
              Hi, {displayName}
            </p>
          )}
          <h1 className="mb-3 font-display text-[clamp(30px,8vw,44px)] font-semibold leading-[1.08] tracking-[-0.02em] text-s-ink">
            {t("instantlyConfirmed")}
          </h1>
          {/* Hero.tsx's own subtitle is a hardcoded German literal (its own TODO comment says so,
              never i18n'd). This copy translates it to English rather than porting the German
              string, per the mockup-english rule. */}
          <p className="font-body text-[clamp(18px,2vw,20px)] font-normal leading-[1.35] tracking-[-0.005em] text-s-ink-2">
            Beauty and wellness across Switzerland.
          </p>
        </div>

        <div className="relative mt-4 md:mt-8">
          <FreshaQueryPill locale={locale} />
        </div>
      </div>
    </section>
  );
}
