// exists-check: `npm run exists report-window-note` = 0 hits. Net-new dev route, scoped to
// app/[locale]/dev/report-window-note/ only; does not touch the live ReportRefundEntry.tsx.
// Grounded-in: components-legacy/refund/ReportRefundEntry.tsx (the real screen this proposes
// one line for; the booking-summary card and reason heading below are copied verbatim from it).
//
// ONE-ELEMENT mockup (2026-08-15 amendment: scope matches what is being decided). Rendered at
// 402 CSS px with no page chrome, silent, one screen, one tap.
//
// Depicts: booking summary card -> components-legacy/refund/ReportRefundEntry.tsx (unchanged context)
// Depicts: reportWindowNote line -> NET-NEW: existing i18n string (messages/en.json refundFlow.reportWindowNote) never rendered before, this is the one change under review, using the identical treatment already shipped as reviewTimelineNote in the same real component
// Depicts: reason heading -> components-legacy/refund/ReportRefundEntry.tsx (unchanged context)

import { notFound } from "next/navigation";
import { createAdminSupabaseClient } from "@/lib/supabase";
import { Info } from "lucide-react";
import { getTranslations } from "next-intl/server";

// A real, paid, completed seed booking (Cuts & Culture, CHF 45.00), the same row the
// report-window-enforcement live test ran against this session.
const SAMPLE_BOOKING_ID = "5e2650c6-357c-4b58-8508-9e880819e0ef";

function salonInitials(name: string): string {
  const initials = name.trim().split(/\s+/).slice(0, 2).map((w) => w.charAt(0)).join("").toUpperCase();
  return initials || "•"; // drift-ok: avatar-fallback glyph when a name has no initials, not a separator, verbatim copy of ReportRefundEntry.tsx salonInitials()
}

export default async function ReportWindowNoteDevPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  if (process.env.NODE_ENV === "production") notFound();
  const { locale } = await params;

  const t = await getTranslations({ locale, namespace: "refundFlow" });
  const admin = createAdminSupabaseClient();
  const { data: bk } = await admin
    .from("bookings")
    .select("id, reference_code, paid_amount, salons(name, cover_photo_url), services(name_de, name_en)")
    .eq("id", SAMPLE_BOOKING_ID)
    .maybeSingle();

  const salon = (bk?.salons ?? null) as { name?: string; cover_photo_url?: string | null } | null;
  const service = (bk?.services ?? null) as { name_de?: string | null; name_en?: string | null } | null;
  const salonLabel = salon?.name ?? "Salon";
  const photo = salon?.cover_photo_url ?? null;
  const svc = locale === "de" ? service?.name_de : service?.name_en;
  const summaryMeta = svc ?? ""; // context only, not the reviewed element, dropped the ref-code join
  const paidAmount = bk?.paid_amount ?? 0;

  return (
    <div className="mx-auto min-h-[100dvh] w-full max-w-[402px] bg-white px-4 pt-3">
      {/* booking summary, context only, not the reviewed element */}
      <div className="mb-3 flex items-center gap-3 rounded-[14px] bg-s-bg-sunken px-[14px] py-3">
        {photo ? (
          <img src={photo} alt={salonLabel} className="h-[42px] w-[42px] flex-shrink-0 rounded-xl object-cover" />
        ) : (
          <span className="flex h-[42px] w-[42px] flex-shrink-0 items-center justify-center rounded-xl bg-s-bg-sunken font-heading text-[15px] font-semibold text-s-ink">
            {salonInitials(salonLabel)}
          </span>
        )}
        <div className="min-w-0 flex-1">
          <div className="truncate font-heading text-[14.5px] font-semibold tracking-[-0.01em] text-s-ink">
            {salonLabel}
          </div>
          {summaryMeta && <div className="mt-[2px] truncate text-[12px] text-s-ink-2">{summaryMeta}</div>}
        </div>
        <div className="flex-shrink-0 text-right">
          <div className="text-[12px] font-medium text-s-ink-2">{t("reviewPaid")}</div>
          <div className="mt-[1px] font-heading text-[14px] font-semibold tabular-nums tracking-[-0.01em] text-s-ink">
            {new Intl.NumberFormat(locale === "en" ? "en-CH" : `${locale}-CH`, {
              style: "currency",
              currency: "CHF",
              minimumFractionDigits: 2,
            }).format(paidAmount / 100)}
          </div>
        </div>
      </div>

      {/* PROPOSED: the reportWindowNote string, added here, using the identical treatment
          already shipped 5 lines below it in the same file (the reviewTimelineNote footer note). */}
      <div className="mb-5 flex gap-2 text-[12px] leading-[1.4] text-s-ink-2">
        <Info size={15} className="mt-[1px] flex-shrink-0 text-s-ink-2 opacity-70" aria-hidden />
        <span>{t("reportWindowNote")}</span>
      </div>

      {/* reason heading, context only, so the note reads in its real place on the screen */}
      <h1 className="mb-[10px] font-heading text-[15px] font-semibold tracking-[-0.01em] text-s-ink">
        {t("reasonQuestion")}
      </h1>
    </div>
  );
}
