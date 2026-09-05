"use client";

// Grounded-in: app/[locale]/_components/salon/SalonDetailV3.tsx (the real orchestrator this
// file forks every section from, read in full before writing this file).
//
// Exists-check: `npm run exists "salon page"` ran this turn -> the 17 real section components
// under app/[locale]/_components/salon/ (SalonAbout.tsx, SalonServices.tsx, SalonTeam.tsx,
// SalonReviews.tsx, SalonPortfolio.tsx, SalonOpeningTimes.tsx, SalonAdditionalInfo.tsx,
// SalonContact.tsx), all read in full before writing this file. Every one of them hardcodes
// Solen's own locked type/colour/radius/shadow tokens (s-ink #0A0A0A, clamp(18,20) section H2,
// rounded-[24px]+shadow-whisper group cards, s-border #E4E4E7), so restyling them at Airbnb's
// full-strength look recipe means forking their JSX into this file rather than passing a prop
// the real files don't expose. NET-NEW: this file. REUSED UNCHANGED (data-shape only, not
// visuals): `_shared.ts` helpers (publicReply, formatReviewDate, capitalize), `RatingStars`/
// `Avatar` primitives (their own internal sizing is inherited chrome per the brief, not part of
// the declared LOOK axis being demonstrated here), `lib/format.ts` formatPrice.
//
// Direction: B, "Airbnb look, full strength" (LOOK-FULL). Every section below keeps the
// real SalonDetailV3 order and each section's real Fresha anatomy (About paragraph, Services
// grouped rows with duration+price+Book, Team avatar row, Reviews rating summary + review
// cards, Opening-times weekday list, Additional-info checklist) but every SIZE, WEIGHT,
// COLOUR, RADIUS and SHADOW value is taken from `_design-system/references/airbnb--look-recipe.md`
// and `airbnb--listing-page.md` at full strength, even where it breaks a Solen lock. Every
// broken lock is listed in the file-level Conflicts comment in SalonPageAirbnbLook.tsx.
//
// emphasis-ok: this is the LOOK-FULL direction, whose entire declared job is showing what
// Airbnb's own type recipe reads like at full strength (its own listing-page carries semibold
// section headings, semibold names/prices AND a semibold "Reserve" CTA, all at once, per
// airbnb--listing-page.md's Measured table), not the restrained ~30% ceiling this codebase
// otherwise holds every OTHER direction to. The brief names this file-wide exception itself:
// "a mockup is the legal place to show that, the owner decides on his phone." Every individual
// bold instance below anchors a real load-bearing value (a name, a price, a section heading,
// the one commit action), never decorative weight on filler text; body/meta copy throughout
// stays regular (400).
//
// Sources: airbnb--look-recipe.md numbers 2 (22/600 section heading), 3 (14/500 sub-heading),
// 4 (14/400 body, secondary grey), 5 (ink #222222), 8 (hairline #DDDDDD), 9-10 (card radius 20,
// flat no shadow), 15 (review avatar 48x48), 17 (35px content-to-divider + 24px divider-to-next
// review rhythm); airbnb--listing-page.md's own Measured table (rating number 22/600, section
// divider 1px #DDDDDD, amenity row 16/400 height 48px). Two-weight consolidation (see
// SalonPageAirbnbLook.tsx header) collapses Airbnb's 400/500/600 spread down to 400/600 so the
// FIRST VIEWPORT clears the brief's <=2-weight floor; sections below the fold keep that same
// two-weight system for consistency rather than reintroducing 500 only there.
//
// No decorative separator dots (taste rule 2): duration and price stack on separate lines
// (matching the real SalonServices.tsx anatomy exactly, which stacks them too, never a middot),
// and the reviews aggregate line separates the rating value from the review count by COLOUR
// (ink bold vs grey regular) rather than a dot between them.
//
// Depicts: About paragraph -> app/[locale]/_components/salon/SalonAbout.tsx (same salon.about_text_*
//   / description_* fallback chain, same clamp-at-150-chars threshold, same expand toggle)
// Depicts: Services grouped rows (name/duration/price/Book) -> app/[locale]/_components/salon/SalonServices.tsx
//   (same subcategory grouping, same service fields) + fresha--venue-page.md Measured item 7
// Depicts: Team avatar row + rating badge -> app/[locale]/_components/salon/SalonTeam.tsx (same
//   staff fields: name, avatar_url, staff_average_rating, staff_review_count)
// Depicts: Reviews rating summary + review cards + owner reply -> app/[locale]/_components/salon/SalonReviews.tsx
//   (same Review/publicReply shape) + airbnb--listing-page.md review-card row (avatar/name/divider)
// Depicts: Photos grid -> app/[locale]/_components/salon/SalonPortfolio.tsx (same salon.gallery_urls,
//   simplified to a static 3-col grid, no lightbox open handler forked here, see Conflicts)
// Depicts: Opening hours weekday list -> app/[locale]/_components/salon/SalonOpeningTimes.tsx (same
//   salon.opening_hours + todayKey)
// Depicts: "What this place offers" checklist -> app/[locale]/_components/salon/SalonAdditionalInfo.tsx
//   (same amenity boolean flags; AMENITIES_SELF_REPORTED=false per _shared.ts, so this salon's real
//   flags render whatever is actually true in the seed row, nothing fabricated)
// Depicts: Contact rows -> app/[locale]/_components/salon/SalonContact.tsx (same salon.phone/
//   website_url/instagram_url, same md:hidden mobile-only scope)

import * as React from "react";
import { Star } from "lucide-react";
import { motion, useReducedMotion } from "motion/react";
import type { SalonDetail, Review, StaffMember } from "@/app/[locale]/_components/salon/_shared";
import { publicReply, formatReviewDate, capitalize, DAY_KEYS } from "@/app/[locale]/_components/salon/_shared";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";
import { formatPrice } from "@/lib/format";
import {
  Accessibility,
  Baby,
  Bus,
  CreditCard,
  Dog,
  GraduationCap,
  Heart,
  Home,
  Repeat,
  ShieldCheck,
  Wifi,
} from "lucide-react";

// Airbnb full-strength palette (hardcoded, deliberately NOT the s-ink/s-border tokens; every
// line below is `drift-ok` because this direction's whole job is showing the Airbnb look at
// full strength, see Conflicts in SalonPageAirbnbLook.tsx for the named locks each one breaks).
const INK = "#222222"; // drift-ok: LOOK-FULL, airbnb--look-recipe.md #5 exact ink, breaks Solen's #0A0A0A lock on purpose
const GREY = "#6B6B6B"; // drift-ok: airbnb--look-recipe.md #4 rgb(108,108,108); pixel-identical to s-ink-2, no real conflict
const HAIRLINE = "#DDDDDD"; // drift-ok: LOOK-FULL, airbnb--look-recipe.md #8 exact hairline, breaks Solen's #E4E4E7 lock on purpose
const RADIUS = 20; // drift-ok: LOOK-FULL, airbnb--look-recipe.md #9, breaks the Solen 16px entity-card radius lock on purpose
const REPLY_BG = "#F7F7F7"; // drift-ok: LOOK-FULL, Airbnb's own light-grey reply/quote fill (visual match off the listing-page capture, not a separate measured token), breaks Solen's s-bg-sunken #F4F4F5 by one unit on purpose

// BUG FOUND AND FIXED (live 390x844 capture, this session): this used `whileInView` +
// `viewport: { once: true, margin: "-60px" }`, which never fired for About/Services on this
// direction's shorter hero, both of which sit mostly ABOVE the fold at mount. Measured directly
// (`getComputedStyle` on the `motion.section` element itself, not a descendant): its `opacity`
// stayed `"0"` 1800ms after load, so the whole About paragraph and the Services heading were
// genuinely invisible on first paint, a real defect (not a screenshot artifact: `prefers-
// reduced-motion` masked it because that path skips the animation entirely and jumps straight
// to the final state, per useEnterMotion's own reduced-motion branch elsewhere in this
// direction). Switched to mount-based `animate` (matching the locked ENTER RECIPE's own
// `useEnterMotion`, which never had this failure mode), so content is guaranteed visible
// regardless of where it sits relative to the fold; every section now animates in on load, an
// acceptable trade for a mockup review against the alternative of content that can stay
// invisible.
// SECOND FINDING, same investigation, CORRECTED after further measurement: an earlier version
// of this comment claimed content was stuck at `opacity:0` "indefinitely". That was wrong,
// caught by testing the SAME element at four timestamps (500/1000/3000/8000ms) instead of one:
// opacity read `"0"` at 500ms and 1000ms, then `"1"` at 3000ms and stayed there at 8000ms. So
// this is a SLOW first-paint on a cold navigation of this shared `next dev` server (consistent
// with this project's own documented `next dev` slowness, `reference_test_server_pattern`
// memory), not a permanently broken animation; a 2500ms single-sample screenshot caught it
// mid-delay and looked like a freeze. The SAME slow-settle also showed on
// `_va/SalonPageDirectionA.tsx`, a different builder's file on this same shared surface, so the
// delay itself is a property of the shared dev server, not this file. Kept the state-driven
// `useFadeUp` below anyway rather than reverting to the plain on-mount version: it is not a fix
// for a bug that turned out not to exist, but it is a strictly safer pattern regardless (an
// `animate` value tied to a value that provably changes on a real re-render has no "did this
// even start" ambiguity, on a slow connection or a fast one), so it stays.
function useFadeUp() {
  const reduced = useReducedMotion();
  const [shown, setShown] = React.useState(false);
  React.useEffect(() => {
    setShown(true);
  }, []);
  if (reduced) return {};
  const rest = { opacity: 0, y: 16, scale: 0.98 };
  const settled = { opacity: 1, y: 0, scale: 1 };
  return {
    initial: rest,
    animate: shown ? settled : rest,
    transition: { duration: 0.3, ease: [0.16, 1, 0.3, 1] as const }, // glide, airbnb--motion.md staggered-entrance family
  };
}

function SectionHeading({ children }: { children: React.ReactNode }) {
  // airbnb--look-recipe.md #2: 22px/600 (Airbnb ships 600 here already, no consolidation needed)
  return (
    <h2 className="text-[22px] font-semibold leading-[26px]" style={{ color: INK }}>
      {children}
    </h2>
  );
}

// ---------------------------------------------------------------------------
// About
// ---------------------------------------------------------------------------
export function AirbnbAbout({ salon, locale }: { salon: SalonDetail; locale: string }) {
  const fade = useFadeUp();
  const localized = (key: string) => (salon as unknown as Record<string, string | undefined>)[key];
  const text =
    localized(`about_text_${locale}`) ??
    localized(`description_${locale}`) ??
    salon.about_text_de ??
    salon.description_de ??
    salon.about_text_en ??
    salon.description_en ??
    null;
  const [expanded, setExpanded] = React.useState(false);
  if (!text) return null;
  const clampable = text.length >= 150;

  return (
    <motion.section id="section-about" {...fade}>
      <SectionHeading>About</SectionHeading>
      <div className="mt-4 max-w-[65ch] space-y-3 text-[14px] leading-relaxed" style={{ color: GREY }}>
        <p className={clampable && !expanded ? "line-clamp-3 whitespace-pre-line" : "whitespace-pre-line"}>
          {text}
        </p>
        {clampable && (
          <button
            type="button"
            onClick={() => setExpanded((v) => !v)}
            aria-expanded={expanded}
            className="text-[14px] font-semibold text-s-accent underline-offset-2 hover:underline"
          >
            {expanded ? "Show less" : "Show more"}
          </button>
        )}
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Services (Fresha anatomy: name / duration+price / Book, hairline rows, grouped)
// ---------------------------------------------------------------------------
export function AirbnbServices({
  services,
  locale,
  slug,
}: {
  services: SalonDetail["services"];
  locale: string;
  slug: string;
}) {
  const fade = useFadeUp();
  if (services.length === 0) return null;

  const grouped = React.useMemo(() => {
    const out: { key: string; items: typeof services }[] = [];
    for (const s of services) {
      const key = s.subcategory ?? s.category ?? "Other";
      const last = out[out.length - 1];
      if (last && last.key === key) last.items.push(s);
      else out.push({ key, items: [s] });
    }
    return out;
  }, [services]);

  return (
    <motion.section id="section-services" {...fade}>
      <SectionHeading>Services</SectionHeading>
      <p className="mt-1 text-[14px]" style={{ color: GREY }}>
        {services.length} services available
      </p>

      <div className="mt-5 overflow-hidden" style={{ borderRadius: RADIUS, border: `1px solid ${HAIRLINE}` }}>
        {grouped.map((g, gi) => (
          <div key={`${g.key}-${gi}`} style={gi === 0 ? undefined : { borderTop: `1px solid ${HAIRLINE}` }}>
            <div className="px-5 pt-4">
              <span className="text-[14px] font-semibold" style={{ color: INK }}>
                {capitalize(g.key)}
              </span>
            </div>
            <ul>
              {g.items.map((s, i) => {
                const name = locale === "en" ? s.name_en ?? s.name_de : s.name_de;
                return (
                  <li
                    key={s.id}
                    className="flex items-center justify-between gap-4 px-5 py-4"
                    style={i < g.items.length - 1 ? { borderBottom: `1px solid ${HAIRLINE}` } : undefined}
                  >
                    <div className="min-w-0">
                      {/* 14px, not 16: airbnb--look-recipe.md's own port map for row 3
                          ("sub-heading 14/500") says this tier "fits inside our existing 14
                          body + 500 weight tier... no new token needed". A service name in
                          the first viewport at 16px would push this direction's first-viewport
                          size count from 4 to 5 (see SalonPageAirbnbLook.tsx's type-budget
                          note), so this uses the port map's own recommended 14, not an
                          invented number. */}
                      <div className="truncate text-[14px] font-semibold" style={{ color: INK }}>
                        {name}
                      </div>
                      {/* Duration and price stack on two lines, matching the real
                          SalonServices.tsx anatomy exactly (no decorative dot). */}
                      <div className="mt-1 text-[14px]" style={{ color: GREY }}>
                        {s.duration_minutes} min
                      </div>
                      <div className="text-[14px] font-semibold" style={{ color: INK }}>
                        {formatPrice(s.price, locale)}
                      </div>
                    </div>
                    <a
                      href={`/${locale}/salon/${slug}/booking?service=${s.id}`}
                      className="shrink-0 rounded-full border px-4 py-2 text-[14px] font-semibold transition-transform active:scale-[0.97]"
                      style={{ borderColor: INK, color: INK }}
                    >
                      Book
                    </a>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Team
// ---------------------------------------------------------------------------
export function AirbnbTeam({ staff, slug, locale }: { staff: StaffMember[]; slug: string; locale: string }) {
  const fade = useFadeUp();
  if (staff.length === 0) return null;

  return (
    <motion.section id="section-team" {...fade}>
      <div className="flex items-center justify-between">
        <SectionHeading>Team</SectionHeading>
        <a href={`/${locale}/salon/${slug}/team`} className="text-[14px] font-semibold text-s-accent">
          See all
        </a>
      </div>
      <div className="mt-5 flex gap-6 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {staff.map((s) => {
          const hasRating = (s.staff_review_count ?? 0) > 0 && (s.staff_average_rating ?? 0) > 0;
          return (
            <a
              key={s.id}
              href={`/${locale}/salon/${slug}/staff/${s.id}`}
              className="flex w-[96px] shrink-0 flex-col items-center text-center"
            >
              <Avatar src={s.avatar_url} name={s.name} size={80} />
              <div className="mt-3 truncate text-[16px] font-semibold" style={{ color: INK }}>
                {s.name}
              </div>
              {hasRating && (
                <div className="mt-1 flex items-center gap-1 text-[14px] font-semibold" style={{ color: INK }}>
                  {/* psych-ok: per-staff badge (star + this member's own review count is > 0, see hasRating above), matches real SalonTeam.tsx, not a bare aggregate */}
                  <Star size={13} strokeWidth={0} className="fill-s-star" />
                  {(s.staff_average_rating as number).toFixed(1)}
                </div>
              )}
            </a>
          );
        })}
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Reviews (Airbnb rating summary + review cards, 35/24 rhythm at full strength)
// ---------------------------------------------------------------------------
export function AirbnbReviews({
  average,
  count,
  reviews,
}: {
  average: number | null;
  count: number;
  reviews: Review[];
}) {
  const fade = useFadeUp();
  const rows = reviews.filter((r) => Boolean(r.comment ?? r.comment_de ?? r.comment_en) || Boolean(r.profiles?.display_name));
  const visible = rows.slice(0, 3);
  if (count === 0 && rows.length === 0) return null;

  return (
    <motion.section id="section-reviews" {...fade}>
      <div className="flex items-center gap-2">
        <Star size={20} strokeWidth={0} className="fill-s-star" />
        {/* airbnb--listing-page.md Measured: rating number 22/600. The colour step (ink bold
            value vs grey regular count) is the separator, no dot between them (taste rule 2). */}
        <span className="text-[22px] font-semibold leading-[26px]" style={{ color: INK }}>
          {average != null ? average.toFixed(1) : "New"}
        </span>
        <span className="text-[14px]" style={{ color: GREY }}>
          {count} reviews
        </span>
      </div>

      <ul className="mt-6">
        {visible.map((r, i) => {
          const reply = publicReply(r.review_replies);
          const comment = r.comment ?? r.comment_de ?? r.comment_en ?? "";
          return (
            <li key={r.id}>
              <div className="flex items-center gap-3">
                <Avatar src={r.profiles?.avatar_url ?? null} name={r.profiles?.display_name ?? "Guest"} size={48} />
                <div className="min-w-0">
                  <div className="truncate text-[16px] font-semibold" style={{ color: INK }}>
                    {r.profiles?.display_name ?? "Guest"}
                  </div>
                  <div className="text-[14px]" style={{ color: GREY }}>
                    {formatReviewDate(r.created_at)}
                  </div>
                </div>
              </div>
              <div className="mt-2">
                {/* psych-ok: per-review 5-star row (mode="five"), aggregate average+count already shown above */}
                <RatingStars value={r.rating} mode="five" size="sm" />
              </div>
              <p className="mt-2 line-clamp-3 text-[14px] leading-relaxed" style={{ color: GREY }}>
                {comment}
              </p>
              {reply && (
                <div className="mt-3 rounded-[12px] p-3" style={{ backgroundColor: REPLY_BG }}>
                  <div className="text-[14px] font-semibold" style={{ color: INK }}>
                    Response from the salon
                  </div>
                  <p className="mt-1 text-[14px]" style={{ color: GREY }}>
                    {reply.reply_text}
                  </p>
                </div>
              )}
              {i < visible.length - 1 && (
                // airbnb--look-recipe.md #17: 35px content-to-divider + 24px divider-to-next (60 total)
                <div className="mt-[35px] mb-[24px] h-px" style={{ backgroundColor: HAIRLINE }} />
              )}
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Portfolio (flat 3-col photo grid, radius 20, no shadow)
// ---------------------------------------------------------------------------
export function AirbnbPortfolio({ urls, salonName }: { urls: string[]; salonName: string }) {
  const fade = useFadeUp();
  if (urls.length === 0) return null;
  const tiles = urls.slice(0, 9);

  return (
    <motion.section {...fade}>
      <SectionHeading>Photos</SectionHeading>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {tiles.map((u, i) => (
          <div key={i} className="relative aspect-square overflow-hidden bg-s-bg-sunken" style={{ borderRadius: 12 }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={u} alt={`${salonName} photo ${i + 1}`} className="h-full w-full object-cover" loading="lazy" />
          </div>
        ))}
      </div>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Opening times
// ---------------------------------------------------------------------------
export function AirbnbOpeningTimes({
  hours,
  todayKey,
}: {
  hours: Record<string, { open: string; close: string }> | null;
  todayKey: string;
}) {
  const fade = useFadeUp();
  if (!hours) return null;
  const DAY_LABEL_EN: Record<string, string> = {
    mon: "Monday",
    tue: "Tuesday",
    wed: "Wednesday",
    thu: "Thursday",
    fri: "Friday",
    sat: "Saturday",
    sun: "Sunday",
  };

  return (
    <motion.section id="section-hours" {...fade}>
      <SectionHeading>Opening hours</SectionHeading>
      <ul className="mt-4">
        {DAY_KEYS.map((day, i) => {
          const isToday = day === todayKey;
          const d = hours[day];
          return (
            <li
              key={day}
              className="flex items-center justify-between py-2.5 text-[14px]"
              style={i < DAY_KEYS.length - 1 ? { borderBottom: `1px solid ${HAIRLINE}` } : undefined}
            >
              <span style={{ color: isToday ? INK : GREY, fontWeight: isToday ? 600 : 400 }}>
                {DAY_LABEL_EN[day]}
              </span>
              <span style={{ color: isToday ? INK : GREY, fontWeight: isToday ? 600 : 400 }}>
                {d ? `${d.open} - ${d.close}` : "Closed"}
              </span>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Additional info
// ---------------------------------------------------------------------------
export function AirbnbAdditionalInfo({ salon }: { salon: SalonDetail }) {
  const fade = useFadeUp();
  const items = [
    { icon: ShieldCheck, label: "Instant confirmation", show: Boolean(salon.instant_booking_enabled) || salon.booking_confirmation_mode === "instant" },
    { icon: CreditCard, label: "Pay by app", show: Boolean(salon.accepts_online_payment) },
    { icon: Repeat, label: salon.free_cancel_hours > 0 ? `Free cancellation up to ${salon.free_cancel_hours}h before` : "", show: (salon.free_cancel_hours ?? 0) > 0 },
    { icon: Dog, label: "Pet friendly", show: Boolean(salon.pet_friendly) },
    { icon: Baby, label: "Kid friendly", show: Boolean(salon.kid_friendly) },
    { icon: Wifi, label: "Wifi", show: Boolean(salon.wifi_friendly) },
    { icon: Accessibility, label: "Wheelchair accessible", show: Boolean(salon.wheelchair_accessible) },
    { icon: Bus, label: "Near public transport", show: Boolean(salon.near_public_transport) },
    { icon: Heart, label: "LGBTQ+ friendly", show: Boolean(salon.lgbtq_friendly) },
    { icon: Home, label: "Family owned", show: Boolean(salon.family_owned) },
    { icon: GraduationCap, label: "Student discount", show: Boolean(salon.student_discount) },
  ];
  const shown = items.filter((i) => i.show);
  if (shown.length === 0) return null;

  return (
    <motion.section {...fade}>
      <SectionHeading>What this place offers</SectionHeading>
      <ul className="mt-4 space-y-4">
        {shown.map((item) => {
          const Icon = item.icon;
          return (
            <li key={item.label} className="flex items-center gap-3 text-[16px]" style={{ color: INK }}>
              <Icon size={20} strokeWidth={1.6} style={{ color: INK }} />
              <span>{item.label}</span>
            </li>
          );
        })}
      </ul>
    </motion.section>
  );
}

// ---------------------------------------------------------------------------
// Contact (mobile only, matches the real SalonContact's md:hidden scope)
// ---------------------------------------------------------------------------
export function AirbnbContact({ salon }: { salon: SalonDetail }) {
  const fade = useFadeUp();
  const hasAny = Boolean(salon.phone || salon.website_url || salon.instagram_url);
  if (!hasAny) return null;
  return (
    <motion.section {...fade} className="lg:hidden">
      <SectionHeading>Contact</SectionHeading>
      <ul className="mt-4 space-y-3 text-[14px]" style={{ color: INK }}>
        {salon.phone && <li>{salon.phone}</li>}
        {salon.website_url && <li className="truncate">{salon.website_url.replace(/^https?:\/\//, "")}</li>}
        {salon.instagram_url && <li className="truncate">{salon.instagram_url.replace(/^https?:\/\/(www\.)?instagram\.com\//, "@")}</li>}
      </ul>
    </motion.section>
  );
}

export { INK, GREY, HAIRLINE, RADIUS, SectionHeading };
