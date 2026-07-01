"use client";

/**
 * /dev/confirm-full , FULL-PAGE production mockup (owner 2026-07-02). English (mockup rule).
 * Exists-check: `npm run exists confirm-full` = 0; real = app/[locale]/confirmation/page.tsx +
 * BookingConfirmation.tsx. ONE full phone screen (390px, portal to body so no double header),
 * refined for production. Compared to the REAL confirmation (already has SuccessMark + essentials
 * card + access link + reference + Buchung verwalten): this keeps that, and ADDS the batch-2
 * pieces , CARD last-4 on the receipt + an account CTA (guest to account) + Add to calendar. The
 * back-to-search bug is fixed in real code (router.replace). Design rules: white, ink, sparse blue
 * (Manage link + VAT), green SuccessMark, no black-selected, >=12px, no em-dash/middot. Real tokens.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { ArrowLeft, ChevronRight, Calendar, Clock, CreditCard, Hash, UserPlus, CalendarPlus, KeyRound, Copy } from "lucide-react";
import { notFound } from "next/navigation";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";

function Screen() {
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
      <div className="relative mx-auto min-h-[844px] w-full max-w-[390px] bg-white px-4 pb-10">
        {/* top nav */}
        <div className="flex items-center justify-between py-3">
          <button className="grid h-10 w-10 place-items-center rounded-full border border-s-border bg-white text-s-ink" aria-label="Back"><ArrowLeft size={19} strokeWidth={2.2} /></button>
        </div>

        {/* success moment */}
        <div className="flex flex-col items-center pt-3 text-center">
          <SuccessMark size={60} />
          <h1 className="mt-4 font-heading text-[22px] font-bold text-s-ink">You&apos;re booked</h1>
          <p className="mt-1 text-[13px] text-s-ink-2">A confirmation is on its way to your phone.</p>
        </div>

        {/* essentials card */}
        <div className="mt-6 overflow-hidden rounded-[20px] border border-s-border bg-white">
          <button className="flex w-full items-center gap-3 border-b border-s-border p-4 text-left">
            <span className="h-11 w-11 shrink-0 rounded-xl bg-s-bg-sunken" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-heading text-[15px] font-bold text-s-ink">Maison Lumiere</span>
              <span className="block truncate text-[12.5px] text-s-ink-2">Bahnhofstrasse 21, Zurich</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-s-ink-3" />
          </button>
          <div className="space-y-3 p-4">
            <div className="flex items-center gap-3">
              <Calendar size={17} className="shrink-0 text-s-ink-3" />
              <span className="text-[14px] font-semibold text-s-ink">Sunday, 14 June</span>
            </div>
            <div className="flex items-center gap-3">
              <Clock size={17} className="shrink-0 text-s-ink-3" />
              <span className="text-[14px] text-s-ink">15:30 to 16:30 , 60 min</span>
            </div>
            <div className="pl-[29px]">
              <p className="text-[14px] font-medium text-s-ink">Women&apos;s cut &amp; blow-dry</p>
              <p className="text-[12.5px] text-s-ink-2">with Lena Brunner</p>
            </div>
          </div>
          {/* receipt , amount + card + paid (batch-2: card last-4) */}
          <div className="space-y-2.5 border-t border-s-border bg-s-bg-sunken p-4">
            <div className="flex items-center justify-between">
              <span className="text-[13px] text-s-ink-2">Total (incl. VAT)</span>
              <span className="font-heading text-[18px] font-bold tabular-nums text-s-ink">CHF 85.00</span>
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-1.5 text-s-ink-2"><CreditCard size={15} /> Paid with</span>
              <span className="font-medium text-s-ink">Mastercard ···· 4242</span>{/* drift-ok: masked card digits, not a separator */}
            </div>
            <div className="flex items-center justify-between text-[13px]">
              <span className="flex items-center gap-1.5 text-s-ink-2"><Hash size={15} /> Reference</span>
              <span className="font-mono text-[13px] font-semibold text-s-ink">SOL-7K2QX9</span>
            </div>
          </div>
        </div>

        {/* guest access link (from the real page) */}
        <div className="mt-3 rounded-[16px] border border-s-border p-3.5">
          <p className="flex items-start gap-2 text-[12.5px] text-s-ink-2"><KeyRound size={15} className="mt-px shrink-0" /> Your access link. As a guest, this is how you get back to this booking.</p>
          <div className="mt-2.5 flex items-center gap-2 rounded-xl bg-s-bg-sunken px-3 py-2">
            <span className="min-w-0 flex-1 truncate font-mono text-[12.5px] text-s-ink-2">solen.ch/de/booking/looku...</span>
            <button className="shrink-0 text-s-ink-2" aria-label="Copy"><Copy size={15} /></button>
          </div>
        </div>

        {/* account CTA (batch-2) */}
        <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-s-ink py-3.5 text-[15px] font-bold text-white" /* selected-ok: primary commit CTA (create account) */>
          <UserPlus size={17} /> Create an account to manage it
        </button>
        <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-s-border py-3 text-[14px] font-semibold text-s-ink">
          <CalendarPlus size={16} /> Add to calendar
        </button>
        <button className="mt-3 w-full text-center text-[13px] font-semibold text-s-accent">Manage booking</button>

        <p className="mt-4 text-center text-[12px] text-s-ink-3">VAT no. CHE-123.456.789 MWST</p>
        <div className="mx-auto mt-6 h-1 w-32 rounded-full bg-s-ink/20" />
      </div>
    </div>
  );
}

export default function ConfirmFullMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;
  return createPortal(<Screen />, document.body);
}
