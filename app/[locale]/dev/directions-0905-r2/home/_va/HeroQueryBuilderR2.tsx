// Exists-check: `npm run exists hero` -> app/[locale]/dev/directions-0905/home/_va/
// HeroQueryBuilder.tsx (round 1's own copy of the real Hero.tsx, see that file's own header for
// why it is a copy and not an import). `npm run exists directions-0905-r2 home hero` -> no
// round-2 hero file exists yet; this is the first. This is a REPAIR file, not a new direction: it
// exists only because the critic on home variant a found the H1 below computing to 31.2px
// (`clamp(30px,8vw,44px)` at 390px = 8vw = 31.2), a closed-ramp violation against the kit's own
// TYPE_RAMP.anchor (28px) and a sameness break against home b and c, both of which already render
// their one display anchor through `<SectionTitle as="anchor">` (HomeFeedB.tsx:126,
// HomeDirectionC.tsx:223).
//
// Grounded-in: app/[locale]/dev/directions-0905/home/_va/HeroQueryBuilder.tsx (COPIED, not
// imported, same reasoning that file's own header already gives for copying Hero.tsx: the one
// line this repair changes, the H1, is a structural/typography change the brief's mockup-copy
// clause allows, and HeroQueryBuilder.tsx is itself round 1's own artifact, not the shared
// production Hero.tsx). Every other line -- the session greeting, the subtitle, the mobile
// whitespace trim, the FreshaQueryPill mount -- is unchanged, copied verbatim.
// Depicts: the screen's one 28px display anchor -> app/[locale]/dev/directions-0905-r2/_kit
// SectionTitle (as="anchor"), reading TYPE_RAMP.anchor so this screen never re-types a font-size.
//
// measured: TYPE_RAMP.anchor = 28px / font-medium / line-height 1.15 (_kit/tokens.ts A5 row 1,
// itself citing R2_LOOK_SYSTEMS.md A5 row 1 and CLAUDE.md FLOORS LAW 6). The greeting line above
// it and the subtitle below it are untouched round-1 sizes (14px/16px greeting, clamp(18,2vw,20)
// subtitle), neither is the screen's anchor so neither is bound by A5's anchor row.
//
// system: none (SectionTitle carries no per-system delta, per its own file header: "Part B
// systems change GROUPING devices, not the type ramp itself"). This file only fixes a type-ramp
// violation; it does not touch HomeR2DirectionA.tsx's own system="lift" assignment.
import FreshaQueryPill from "@/app/[locale]/dev/directions-0905/home/_va/FreshaQueryPill";
import { getSessionUser } from "@/lib/supabase";
import { getTranslations } from "next-intl/server";
import { SectionTitle } from "../../_kit";

export default async function HeroQueryBuilderR2({ locale }: { locale: string }) {
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
      <div className="relative z-[1] mx-auto flex w-full max-w-[1280px] flex-col justify-center px-4 pt-6 pb-0 md:px-8 md:pt-14 md:pb-16">
        <div className="w-full">
          {displayName && (
            <p className="mb-3 font-body text-[14px] md:text-[16px] font-medium text-s-ink-2 tracking-[-0.005em]">
              Hi, {displayName}
            </p>
          )}
          {/* REPAIR: was `<h1 className="... text-[clamp(30px,8vw,44px)] font-semibold ...">`,
              31.2px at 390px width. Now the kit's own 28px anchor tier, the same component home
              b and c already use for their one display anchor. */}
          <SectionTitle as="anchor" className="mb-3 tracking-[-0.02em]">
            {t("instantlyConfirmed")}
          </SectionTitle>
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
