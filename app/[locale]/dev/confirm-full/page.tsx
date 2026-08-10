"use client";

/**
 * /dev/confirm-full , FULL-PAGE production mockup (owner 2026-07-02 v2). English (mockup rule).
 * Exists-check: `npm run exists confirm-full` = 0; real = app/[locale]/confirmation/page.tsx.
 * ONE full phone screen (390px, portal). v2 owner refinements:
 *   - LOADING stage first (fake, flight-booking style) -> then the confirmation. Auto-advances;
 *     "Replay" re-shows it. ("even as a fake I want that , that's what I meant before.")
 *   - un-gray the total (was a gray block; now white with a hairline).
 *   - LESS text (trimmed the sub-copy + access-link blurb).
 *   - MORE photos (salon cover photo band on the card).
 *   - bottom NAV bar so you can reach Bookings/walk-in after booking ("how to access the walk-in").
 * Real tokens, green SuccessMark, no black/blue-selected, >=12px, no em-dash/middot.
 */
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Calendar, Scissors, CreditCard, Hash, UserPlus, ChevronRight, Loader2, Home, Search, Sparkles, CalendarDays, User, RotateCcw } from "lucide-react";
import { notFound } from "next/navigation";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";

function BottomNav() {
  return (
    <nav className="absolute inset-x-0 bottom-0 z-10 flex h-16 items-center justify-around border-t border-s-border bg-white/95 backdrop-blur-xl">
      {[[Home, "Home", false], [Search, "Search", false], [Sparkles, "Inspo", false], [CalendarDays, "Bookings", true], [User, "Profile", false]].map(([Icon, label, on], i) => {
        const I = Icon as typeof Home;
        return (
          <span key={i} className={`flex flex-col items-center gap-0.5 text-[12px] ${on ? "font-semibold text-s-ink" : "text-s-ink-2"}`}>
            <I size={21} strokeWidth={on ? 2.4 : 2} /> {label as string}
          </span>
        );
      })}
    </nav>
  );
}

function Loading() {
  return (
    <div className="flex min-h-[844px] flex-col items-center justify-center bg-white px-8 text-center">
      <Loader2 size={40} className="animate-spin text-s-ink" />
      <p className="mt-5 font-heading text-[17px] font-bold text-s-ink">Confirming your booking</p>
      <p className="mt-1 text-[13px] text-s-ink-2">One moment, securing your slot.</p>
    </div>
  );
}

function Done({ replay }: { replay: () => void }) {
  return (
    <div className="relative min-h-[844px] bg-white pb-20">
      <div className="px-4">
        <div className="flex flex-col items-center pt-10 text-center">
          <SuccessMark size={60} />
          <h1 className="mt-4 font-heading text-[22px] font-bold text-s-ink">You&apos;re booked</h1>
        </div>

        {/* essentials card , now WITH a cover photo (more photos), receipt un-grayed */}
        <div className="mt-6 overflow-hidden rounded-[20px] border border-s-border bg-white">
          <div className="h-[132px] w-full bg-s-bg-sunken" />
          <button className="flex w-full items-center gap-3 border-b border-s-border p-4 text-left">
            <span className="-mt-9 h-14 w-14 shrink-0 rounded-2xl border-2 border-white bg-s-bg-sunken shadow-sm" />
            <span className="min-w-0 flex-1">
              <span className="block truncate font-heading text-[15px] font-bold text-s-ink">Maison Lumiere</span>
              <span className="block truncate text-[12.5px] text-s-ink-2">Bahnhofstrasse 21, Zurich</span>
            </span>
            <ChevronRight size={18} className="shrink-0 text-s-ink-2" />
          </button>
          {/* 3 sections: date, service, staff (with name + profile avatar) , owner 2026-07-02 */}
          <div className="divide-y divide-s-border">
            <div className="flex items-center gap-3 p-4">
              <Calendar size={18} className="shrink-0 text-s-ink-2" />
              <div className="min-w-0"><p className="text-[14px] font-semibold text-s-ink">Sunday, 14 June</p><p className="text-[12.5px] text-s-ink-2">15:30 to 16:30</p></div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <Scissors size={18} className="shrink-0 text-s-ink-2" />
              <div className="min-w-0"><p className="text-[14px] font-semibold text-s-ink">Women&apos;s cut &amp; blow-dry</p><p className="text-[12.5px] text-s-ink-2">60 min</p></div>
            </div>
            <div className="flex items-center gap-3 p-4">
              <span className="h-9 w-9 shrink-0 rounded-full bg-s-bg-sunken" />
              <div className="min-w-0"><p className="text-[14px] font-semibold text-s-ink">Lena Brunner</p><p className="text-[12.5px] text-s-ink-2">Your stylist</p></div>
            </div>
          </div>
          {/* receipt , WHITE + hairline (un-grayed) */}
          <div className="space-y-2.5 border-t border-s-border p-4">
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

        {/* trimmed actions (less text) */}
        <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-s-ink py-3.5 text-[15px] font-bold text-white" /* selected-ok: primary commit CTA */>
          <UserPlus size={17} /> Create an account
        </button>
        <div className="mt-3 flex items-center justify-center gap-6">
          <button className="text-[13px] font-semibold text-s-accent">Add to calendar</button>
          <button className="text-[13px] font-semibold text-s-accent">Manage booking</button>
        </div>

        <button onClick={replay} className="mx-auto mt-6 flex items-center gap-1.5 text-[12px] font-medium text-s-ink-2">
          <RotateCcw size={13} /> Replay the loading beat
        </button>
      </div>
      <BottomNav />
    </div>
  );
}

function Screen() {
  const [phase, setPhase] = useState<"loading" | "done">("loading");
  useEffect(() => {
    if (phase !== "loading") return;
    const t = setTimeout(() => setPhase("done"), 1600);
    return () => clearTimeout(t);
  }, [phase]);
  return (
    <div className="fixed inset-0 z-[9999] overflow-y-auto bg-white">
      <div className="mx-auto w-full max-w-[390px]">
        {phase === "loading" ? <Loading /> : <Done replay={() => setPhase("loading")} />}
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
