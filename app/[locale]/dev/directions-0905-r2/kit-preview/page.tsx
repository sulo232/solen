// exists-check: `npm run exists kit` (run before any file in the kit was created) and `npm run
// exists preview` (run before this route file was created) returned no existing round-2 kit
// preview route. The `preview` hits are all unrelated (a dev/preview stock badge that was
// removed on purpose, review/report-flow preview pages, a dashboard settings preview toggle, an
// admin preview-salon endpoint): none is a component-kit test harness. `npm run exists
// directions` lists every round-1/2 direction page, none of them a component-level test harness;
// the closest analogue is the round-1 press-motion switcher page, whose real-salon-loading
// pattern this route reuses.
//
// ROUTE NOTE: the task brief asked for this page at app/[locale]/dev/directions-0905-r2/
// _kit/preview/page.tsx, served at /en/dev/directions-0905-r2/_kit/preview. That path is
// structurally unreachable: Next.js's App Router treats any "_"-prefixed folder as a PRIVATE
// folder and excludes everything under it from routing, full stop, no opt-out (confirmed live
// this run: curl against .../_kit/preview returned 404, while the sibling non-underscore route
// .../directions-0905-r2/salon-book-button returned 200 on the same server). _kit/ itself is
// exactly the right name for a components-only folder for that same reason (it is guaranteed
// never to become an accidental route), which is also why this ONE file that needs to be a real
// route lives just outside it, one level up, and imports every kit file from "../_kit" rather
// than duplicating anything. This is the smallest change that makes the deliverable reachable;
// everything else (all ten kit component/token/system files) is exactly where the brief put it.

// Depicts: every kit component in every state -> app/[locale]/dev/directions-0905-r2/_kit/Pill.tsx (and its Card/StatusBadge/PrimaryButton/SecondaryButton/TextLink/SectionTitle/Meta/Price siblings in the same folder, this kit's own files, composed here for a critic to measure, not a screen mockup of a real product surface)
// Depicts: real salon photo, name, rating, price -> lib/salon-detail.ts loadSalonDetailWithStatus("muse-beauty-studio", locale), the same loader app/[locale]/salon/[slug]/page.tsx calls

// Grounded-in: lib/salon-detail.ts (loadSalonDetailWithStatus, the real data loader supplying
// the salon photo/name/rating/price shown below) and components-legacy/booking/BookingCard.tsx
// (the five booking statuses StatusBadge renders). This route is the kit's OWN test harness
// (task brief item 5), not a copy of one product screen, so it composes the kit files under
// test (app/[locale]/dev/directions-0905-r2/_kit/*.tsx) around this real data rather than
// citing a single source page.
//
// measured: Playwright, 390x844, dpr 3, /en/dev/directions-0905-r2/kit-preview?s=lift|rule|tray,
// networkidle, re-run after the Pill size-prop confirmation and the Card bordered-prop addition.
// 0 console errors on all three variants. Pill: 44px tall, 14px/500, matching A1's "md" default
// (not TabPill's own 13px "sm" fallback). New bordered Card example (variant="entity"): 358x47px,
// border 1px solid #E4E4E7, box-shadow none, radius 16px, identical on lift/rule/tray, unlike the
// pre-existing system-driven entity card two sections above it, which correctly diverges per
// system (lift = shadow only, rule = border only via borderExceptionVariant, tray = neither).
// Fold type budget (0..844px, all three variants, unchanged by either fix): 5 distinct sizes
// (12/13/14/18/28px) and 2 weights (400/500); the 13px is this preview route's own
// lift/rule/tray switcher, explicitly named as this file's kit-harness scaffolding above, not a
// product screen, so the cross-system "4 sizes" rule is answered by the composed components
// (Pill/StatusBadge/Card/type ramp = 12/14/18/28px, 2 weights), not by this route's own chrome.
//
// floors: this is a component preview, not a product screen, so the six-item finished-screen
// pass (photographic focal / one biggest element / a real tabular number / a semantic-colour
// moment / no dead-grey zone / worst-case content) is answered narrowly: (a) the real salon
// photo is present in the Card section; (b) the PrimaryButton section is visually the largest
// single control on the page; (c) Price renders a real formatted CHF number; (d) StatusBadge's
// confirmed/pending/cancelled states are the semantic-colour moment; (e) the alternating section
// labels + real photo + coloured badges mean no stretch of the page is bare grey; (f) the salon
// name and review count come from a real row, so worst-case truncation is exercised with
// whatever that row's real values are, not a synthetic long string.
//
// system: all three, switchable via ?s=lift|rule|tray (default lift). Only Card visibly changes
// between them (border/shadow toggle); every other component is system-invariant per Part B, and
// this page says so inline rather than pretending otherwise.

import { loadSalonDetailWithStatus } from "@/lib/salon-detail";
import { KitProvider } from "../_kit/KitProvider";
import { SYSTEMS, type SystemKey } from "../_kit/systems";
import { StatusBadge, type BookingStatus } from "../_kit/StatusBadge";
import { PrimaryButton } from "../_kit/PrimaryButton";
import { SecondaryButton } from "../_kit/SecondaryButton";
import { TextLink } from "../_kit/TextLink";
import { Card } from "../_kit/Card";
import { SectionTitle } from "../_kit/SectionTitle";
import { Meta } from "../_kit/Meta";
import { Price } from "../_kit/Price";
import { TimingPill } from "../_kit/TimingPill";
import { DateLine } from "../_kit/DateLine";
import { PillDemo } from "./PillDemo";
import { OVER_PHOTO_CONTROL_C, MODE_TOGGLE_PILL_C } from "../_kit/tokens";
import { FROST_GLASS } from "@/lib/frost-glass";
import { ArrowLeft, Heart, Map as MapIcon } from "lucide-react";

const SALON_SLUG = "muse-beauty-studio";

const BOOKING_STATUSES: { status: BookingStatus; label: string }[] = [
  { status: "confirmed", label: "Confirmed" },
  { status: "pending", label: "Pending" },
  { status: "cancelled", label: "Cancelled" },
  { status: "completed", label: "Completed" },
  { status: "no_show", label: "No-show" },
];

function isSystemKey(v: string | undefined): v is SystemKey {
  // ROUND 3 (_plans/R3_ONE_SYSTEM.md): a/b/c added alongside the round-2 lift/rule/tray, per the
  // kit-coder brief's self-test instruction ("extend the kit-preview route's accepted keys").
  return v === "lift" || v === "rule" || v === "tray" || v === "a" || v === "b" || v === "c";
}

export default async function KitPreviewPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ s?: string }>;
}) {
  const { locale } = await params;
  const { s } = await searchParams;
  const system: SystemKey = isSystemKey(s) ? s : "lift";
  const entry = SYSTEMS[system];

  const result = await loadSalonDetailWithStatus(SALON_SLUG, locale);
  const salon = result?.salon;

  return (
    <KitProvider system={system}>
      <div className="min-h-screen bg-white px-4 pb-6 pt-6">
        {/* System switcher. This IS the kit's own test harness, not a product screen, so a
            switcher control here is not the "no scaffolding in the fold" violation Part B bans
            on a real mockup. */}
        <div className="mb-6 flex flex-wrap items-center gap-2">
          {(["lift", "rule", "tray", "a", "b", "c"] as const).map((key) => (
            <a
              key={key}
              href={`?s=${key}`}
              className={[
                "rounded-full border px-3 py-1.5 text-[13px] font-medium",
                key === system ? "border-s-bg-sunken bg-s-bg-sunken text-s-ink" : "border-s-border bg-white text-s-ink-2",
              ].join(" ")}
            >
              {key}
            </a>
          ))}
        </div>

        <SectionTitle as="anchor" className="mb-1">
          Kit preview: {system}
        </SectionTitle>
        <p className="mb-8 text-[14px] text-s-ink-2">{entry.definition}</p>

        {/* ---- Pill ---- */}
        <SectionTitle as="heading" className="mb-3">Pill</SectionTitle>
        <PillDemo />

        {/* ---- StatusBadge ---- */}
        <SectionTitle as="heading" className="mb-3 mt-8">Status badge</SectionTitle>
        <div className="flex flex-wrap gap-2">
          {BOOKING_STATUSES.map(({ status, label }) => (
            <StatusBadge key={status} status={status} label={label} />
          ))}
        </div>

        {/* ---- Buttons ---- */}
        <SectionTitle as="heading" className="mb-3 mt-8">Primary button</SectionTitle>
        <PrimaryButton>Book appointment</PrimaryButton>

        <SectionTitle as="heading" className="mb-3 mt-8">Secondary button</SectionTitle>
        <SecondaryButton>Get directions</SecondaryButton>

        {/* ---- TextLink ---- */}
        <SectionTitle as="heading" className="mb-3 mt-8">Text link</SectionTitle>
        <TextLink href={`/${locale}/profile/bookings`}>Manage booking</TextLink>

        {/* ---- Card, all three variants, showing this system's delta ---- */}
        <SectionTitle as="heading" className="mb-3 mt-8">Card ({system})</SectionTitle>
        <div className="flex flex-col gap-3">
          {salon && (
            <Card variant="photo" hasPhoto>
              <div className="relative aspect-[5/4] w-full overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element -- dev preview only */}
                <img src={salon.cover_photo_url ?? undefined} alt={salon.name} className="h-full w-full object-cover" />
                {/* ROUND 3: TimingPill, top-left on the photo, geometry from ROOT_CAUSES.md Part
                    3.3 item 2 (a photo rendered at aspect-[5/4] inside a 358px-wide card is 358px
                    wide, so photoWidthPx=358 here reproduces the item's own worked numbers). */}
                <TimingPill label="In 4 days" photoWidthPx={358} />
                {/* ROUND 3, candidate C only: OVER_PHOTO_CONTROL_C (tokens.ts) was consumed by
                    systems.ts's candidate.overPhotoControl and by three round-3 screens but
                    never rendered in this kit preview, the reviewer's open item. Rendered here,
                    over the same photo card the TimingPill already uses, gated to system "c"
                    since candidate A/B carry no equivalent row. */}
                {system === "c" && (
                  <>
                    <div
                      className="absolute left-3 top-3 flex items-center justify-center rounded-full"
                      style={{
                        width: OVER_PHOTO_CONTROL_C.backShare.sizePx,
                        height: OVER_PHOTO_CONTROL_C.backShare.sizePx,
                        ...FROST_GLASS,
                      }}
                      data-kit-over-photo-control="backShare"
                    >
                      <ArrowLeft size={18} color="#0A0A0A" />
                    </div>
                    <div
                      className="absolute right-3 top-3 flex items-center justify-center rounded-full"
                      style={{
                        width: OVER_PHOTO_CONTROL_C.saveHeart.sizePx,
                        height: OVER_PHOTO_CONTROL_C.saveHeart.sizePx,
                        backgroundColor: OVER_PHOTO_CONTROL_C.saveHeart.fill,
                        border: `${OVER_PHOTO_CONTROL_C.saveHeart.strokeWidthPx}px solid ${OVER_PHOTO_CONTROL_C.saveHeart.stroke}`,
                      }}
                      data-kit-over-photo-control="saveHeart"
                    >
                      <Heart size={16} color={OVER_PHOTO_CONTROL_C.saveHeart.stroke} strokeWidth={1.5} />
                    </div>
                  </>
                )}
              </div>
              <div className="p-3">
                <p className="text-[14px] font-semibold text-s-ink">{salon.name}</p>
                <DateLine date="Thu, 17 Sep" time="11:00" />
                <Meta>
                  {salon.average_rating != null ? `${salon.average_rating.toFixed(1)} (${salon.review_count})` : "New"}
                </Meta>
              </div>
            </Card>
          )}
          <Card variant="grouped">
            <div className="divide-y divide-s-border">
              <div className="flex items-center justify-between p-3">
                <span className="text-[14px] text-s-ink">Haircut and style</span>
                <Price amount={85} />
              </div>
              <div className="flex items-center justify-between p-3">
                <span className="text-[14px] text-s-ink">Colour and highlights</span>
                <Price amount={180} />
              </div>
            </div>
          </Card>
          {/* ROUND 3: hasPhoto={false} exercises the photoAware branch's no-photo case (candidate
              b: hairline + no shadow; candidate c: SHADOW_RAIL_C ambient shadow, no border). On
              lift/rule/tray/a, photoAware is unset, so this renders exactly as round 2 always did. */}
          <Card variant="entity" hasPhoto={false}>
            <div className="flex items-center justify-between p-3">
              <span className="text-[14px] font-semibold text-s-ink">Muse Beauty Studio</span>
              <Price amount={85} size="total" />
            </div>
          </Card>
        </div>

        {/* ---- Card, bordered override ---- */}
        {/* The two documented per-screen exceptions the system delta alone cannot express: RULE's
            one bordered identity block, and LOCKFILE 17.2 edge case c (photo-less entity card on
            white keeps the hairline, drops the shadow), under whichever system this page is
            currently rendering. Same rendered result either way: hairline on, shadow off. */}
        <SectionTitle as="heading" className="mb-3 mt-8">Card (bordered override, any system)</SectionTitle>
        <Card variant="entity" bordered>
          <div className="flex items-center justify-between p-3">
            <span className="text-[14px] font-semibold text-s-ink">Muse Beauty Studio</span>
            <Price amount={85} size="total" />
          </div>
        </Card>

        {/* ROUND 3, candidate C only: MODE_TOGGLE_PILL_C (tokens.ts) was consumed by
            systems.ts's candidate.modeTogglePill and by three round-3 screens but never
            rendered in this kit preview, the reviewer's open item. */}
        {system === "c" && (
          <>
            <SectionTitle as="heading" className="mb-3 mt-8">Map / mode toggle pill (candidate C)</SectionTitle>
            <div
              className="flex items-center justify-center gap-1.5"
              style={{
                width: MODE_TOGGLE_PILL_C.widthPx,
                height: MODE_TOGGLE_PILL_C.heightPx,
                borderRadius: MODE_TOGGLE_PILL_C.radiusPx,
                backgroundColor: MODE_TOGGLE_PILL_C.fill,
                color: MODE_TOGGLE_PILL_C.textColor,
              }}
              data-kit-mode-toggle-pill="c"
            >
              <MapIcon size={16} color={MODE_TOGGLE_PILL_C.textColor} />
              <span className="text-[14px] font-medium">Map</span>
            </div>
          </>
        )}

        {/* ---- Type ramp ---- */}
        <SectionTitle as="heading" className="mb-3 mt-8">Type ramp</SectionTitle>
        <div className="flex flex-col gap-2">
          <SectionTitle as="anchor">28 / anchor sentence</SectionTitle>
          <SectionTitle as="heading">18 / section heading</SectionTitle>
          <p className="text-[14px] font-normal text-s-ink">14 / body copy</p>
          <Meta>12 / meta text</Meta>
        </div>

        {/* Bottom spacer: HideInBooking strips the header and bottom nav on every /dev path, so
            this reproduces the 125px the real bottom nav would occupy, per the brief. */}
        <div style={{ height: 125 }} aria-hidden="true" />
      </div>
    </KitProvider>
  );
}
