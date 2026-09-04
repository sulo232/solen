// Grounded-in: components-legacy/booking/BookingConfirmation.tsx, app/[locale]/confirmation/page.tsx,
// app/[locale]/tip/[bookingId]/page.tsx
//
// Exists-check: `npm run exists confirm-tip` ran this turn (again, this turn, not carried over
// from an earlier one). Its only 2 hits are this same folder's own sibling component files,
// ConfirmationTipTextLink.tsx and ConfirmationTipButton.tsx, both byte-copies of the real
// components-legacy/booking/BookingConfirmation.tsx built by an earlier attempt at this exact
// task (their own header comments explain the byte-copy, read in full before this file was
// written). No REMOVED.md hit for "tip" or "confirmation". The real tip flow already exists and
// is untouched: app/[locale]/tip/[bookingId]/page.tsx (BookingTipPage) opens the shared
// <TipSheet> (app/[locale]/_components/tips/TipSheet.tsx) over POST /api/tips, 100% to the
// salon's Connect account. The one new thing in this file: the comparison page itself, stacking
// the real confirmation screen against the two already-built variants with one real seeded
// paid booking, which no existing route does.
//
// Depicts: current booking confirmation (no tip entry point) -> components-legacy/booking/BookingConfirmation.tsx (real, unmodified import)
// Depicts: proposed A, text link under the summary -> ./ConfirmationTipTextLink.tsx (byte-copy of the real file above; see that file's header for why a byte-copy was needed)
// Depicts: proposed B, secondary button beside the primary action -> ./ConfirmationTipButton.tsx (byte-copy of the real file above; see that file's header for why a byte-copy was needed)
// Mockup-scope: section (one entry-point decision on one existing screen, not a new route or a whole-page redesign)
//
// CHROME NOTE: this route lives under /dev/, and app/[locale]/_components/layout/HideInBooking.tsx
// has an explicit early return for any `/dev(/|$)` path (owner 2026-08-16, "cant press button on
// review question": a /dev preview page shows only the section under review, no header, no bottom
// nav, no cookie banner). The REAL /confirmation route this page compares against keeps the global
// Header + BottomNav (it is on HideInBooking's own kept-list, reverted 2026-08-09: "we should keep
// the back. how else are they gonna go back?"), so /confirmation renders 1 header + BottomNav's
// nav landmark live, and this /dev page renders 0 of either. That gap is the shared, deliberate
// /dev convention (see app/[locale]/dev/mockups-0904/stamps-redeem/page.tsx's identical note), not
// chrome drawn by this file, which draws none.
//
// DATA: one real, live, paid booking read with the SAME select shape and the SAME derivation
// (isPaid, priceLabel, vat) as the real app/[locale]/confirmation/page.tsx, via the admin client
// (dev-only route, gated by the same NODE_ENV check every other /dev page uses). No field is
// invented: booking b1a8dd05-bb41-400d-bd92-f57dc6cb209f, Old Town Barbers, "Cut & Beard" with
// staff Mara, CHF 68, reference_code SEEDA-b1a8dd05, payment_status 'paid', confirmed live via a
// direct query before this file was written.
//
// measure-ok: not built from a reference screenshot; every size below (heading 20/13/12 labels)
// is on the LOCKFILE scale (section label 13/600, meta 12/400), and the receipt itself is the
// real, unmodified BookingConfirmation.tsx (source-read sizes logged in ~/.claude/ss-measured.flag).

import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { formatCurrency } from "@/lib/format-currency";
import { computeVat } from "@/lib/vat";
import { localizedField } from "@/lib/i18n/localized-field";
import BookingConfirmation from "@/components-legacy/booking/BookingConfirmation";
import ConfirmationTipTextLink from "./ConfirmationTipTextLink";
import ConfirmationTipButton from "./ConfirmationTipButton";

const BOOKING_ID = "b1a8dd05-bb41-400d-bd92-f57dc6cb209f";

const BOOKING_SELECT = `id, salon_id, service_id, staff_member_id, starts_at, ends_at,
  price_paid, remaining_at_salon, paid_amount, status, payment_status, payment_intent_id, reference_code, paid_via, user_id, vat_rate,
  salons(id, name, slug, address, phone, cover_photo_url, vat_number),
  services(id, name_de, name_en, duration_minutes, price),
  staff_members(name)`;

export default async function ConfirmTipMockupPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production" && process.env.SOLEN_DEV_PAGES !== "1") notFound();

  const { locale } = await params;
  const admin = createAdminSupabaseClient();

  const { data: booking, error } = await admin
    .from("bookings")
    .select(BOOKING_SELECT)
    .eq("id", BOOKING_ID)
    .maybeSingle();

  if (error) console.error("[dev/confirm-tip] booking fetch failed:", error);
  if (!booking) {
    return (
      <main className="min-h-[100dvh] bg-white px-4 pt-6">
        <p className="text-[13px] text-s-ink-2">The seeded booking did not resolve from the live query.</p>
      </main>
    );
  }

  const localeCode =
    locale === "de" ? "de-CH" : locale === "fr" ? "fr-CH" : locale === "it" ? "it-CH" : "en-CH";

  const salon = (Array.isArray((booking as any).salons) ? (booking as any).salons[0] : (booking as any).salons) as any;
  const service = (Array.isArray((booking as any).services) ? (booking as any).services[0] : (booking as any).services) as any;
  const staff = (Array.isArray((booking as any).staff_members) ? (booking as any).staff_members[0] : (booking as any).staff_members) as any;

  const serviceName = localizedField(service as Record<string, unknown> | null, "name", locale);

  const vatRateApplied = Number((booking as any).vat_rate ?? 0);
  const grossRappen = Math.round(Number((booking as any).price_paid ?? 0) * 100);
  const vat =
    vatRateApplied > 0 && grossRappen > 0
      ? computeVat(grossRappen, { registered: true, ratePercent: vatRateApplied })
      : { netRappen: 0, vatRappen: 0, ratePercent: 0 };

  const sharedProps = {
    referenceCode: (booking as any).reference_code ?? null,
    salonName: salon?.name || "",
    salonSlug: salon?.slug || "",
    salonAddress: salon?.address || "",
    salonCoverUrl: salon?.cover_photo_url || null,
    serviceName,
    servicePrice: service?.price ?? null,
    staffName: staff?.name || null,
    startsAt: (booking as any).starts_at,
    durationMinutes: service?.duration_minutes ?? null,
    pricePaid: (booking as any).price_paid,
    priceLabel: formatCurrency((booking as any).price_paid, localeCode),
    paidVia: (booking as any).paid_via ?? null,
    status: (booking as any).status ?? null,
    paymentStatus: (booking as any).payment_status ?? null,
    paidNowLabel: formatCurrency(Number((booking as any).paid_amount ?? 0) / 100, localeCode),
    remainingAtSalonLabel:
      (booking as any).remaining_at_salon != null
        ? formatCurrency(Number((booking as any).remaining_at_salon), localeCode)
        : null,
    hasOnlinePayment: Boolean((booking as any).payment_intent_id),
    isGuest: false,
    accessLink: null,
    accessToken: null,
    contactEmail: null,
    vatRate: vat.ratePercent,
    netLabel: formatCurrency(vat.netRappen / 100, localeCode),
    vatLabel: formatCurrency(vat.vatRappen / 100, localeCode),
    salonVatNumber: salon?.vat_number ?? null,
    bookingId: (booking as any).id,
    salonId: (booking as any).salon_id ?? salon?.id ?? "",
    serviceId: (booking as any).service_id ?? "",
    staffId: (booking as any).staff_member_id ?? null,
    endsAt: (booking as any).ends_at,
  };

  return (
    <main className="min-h-[100dvh] bg-white pb-16">
      <div className="mx-auto max-w-[390px] px-4 pt-6">
        <h1 className="font-display text-[20px] font-semibold text-s-ink">Tip link on the confirmation</h1>
        <p className="mt-1 text-[13px] text-s-ink-2">
          One real paid booking, current then two proposed entry points into the existing tip flow.
        </p>

        <PairLabel variant="Current" rule="components-legacy/booking/BookingConfirmation.tsx as-is: no way to tip from this screen." />
      </div>
      <BookingConfirmation {...sharedProps} />

      <div className="mx-auto max-w-[390px] px-4">
        <PairLabel variant="Proposed A" rule="Text link (blue s-accent) under the booking summary, above the primary action." />
      </div>
      <ConfirmationTipTextLink {...sharedProps} />

      <div className="mx-auto max-w-[390px] px-4">
        <PairLabel variant="Proposed B" rule="Neutral outline secondary button beside the primary action, never a second ink button." />
      </div>
      <ConfirmationTipButton {...sharedProps} />
    </main>
  );
}

function PairLabel({ variant, rule }: { variant: string; rule: string }) {
  return (
    <div className="mb-2 mt-10 border-t border-s-border pt-6">
      <p className="text-[13px] font-semibold text-s-ink">{variant}</p>
      <p className="text-[12px] text-s-ink-2">{rule}</p>
    </div>
  );
}
