"use client";

/**
 * /dev/checkout-confirm , MOCKUP (owner 2026-07-01, #8). English copy (mockup rule). Exists-check:
 * `npm run exists checkout-confirm` = 0; real screens = PayConfirmStep + BookingConfirmation.tsx
 * (already has the essentials card + SuccessMark). Council synthesis: the "did I pay?" doubt is
 * about CONFIRMATION DENSITY, not time , add the CARD last-4 (the missing receipt-triangle leg) +
 * an HONEST processing beat on the Pay button (spinner while Stripe actually works, NO fake floor).
 * Reuses the real SuccessMark primitive. Real tokens, Lucide, no CDN.
 */
import { useState } from "react";
import { Loader2, CreditCard, Hash, Clock, Users, CalendarPlus, UserPlus } from "lucide-react";
import { notFound } from "next/navigation";
import { SuccessMark } from "@/app/[locale]/_components/primitives/SuccessMark";

function Phone({ children }: { children: React.ReactNode }) {
  return (
    <div className="w-full max-w-[340px] rounded-[26px] border border-s-border bg-s-bg-sunken p-3">
      <div className="min-h-[380px] rounded-[20px] bg-white p-5">{children}</div>
    </div>
  );
}

export default function CheckoutConfirmMockup() {
  if (process.env.NODE_ENV === "production") notFound();
  const [busy, setBusy] = useState(false);
  return (
    <main className="min-h-screen bg-white">
      <div className="mx-auto max-w-[900px] px-4 pb-16 pt-6">
        <p className="text-[12px] font-semibold text-s-ink-2">Mockup , checkout confidence (#8)</p>
        <h1 className="mt-1 font-heading text-[19px] font-bold text-s-ink">An honest processing beat, then a receipt you can trust</h1>
        <p className="mt-1 max-w-[640px] text-[13px] text-s-ink-2">The doubt (&ldquo;did I actually pay?&rdquo;) isn&apos;t about time , it&apos;s density. Show the card last-4 + amount + reference, and a real spinner ONLY while Stripe is working (no fake delay).</p>

        <div className="mt-7 flex flex-wrap gap-8">
          <div>
            <h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">1 , Pay (honest processing)</h2>
            <Phone>
              <p className="text-[13px] text-s-ink-2">Herrenschnitt , Old Town Barbers</p>
              <p className="mt-1 font-heading text-[15px] font-bold text-s-ink">Do 11. Juni, 12:00</p>
              <div className="mt-4 rounded-2xl border border-s-border p-3 text-[13px] text-s-ink-2">
                <div className="flex justify-between"><span>Total</span><span className="font-semibold tabular-nums text-s-ink">CHF 45.00</span></div>
              </div>
              <button onClick={() => setBusy((v) => !v)}
                className="mt-6 flex w-full items-center justify-center gap-2 rounded-full bg-s-ink px-6 py-3.5 text-[15px] font-bold text-white active:scale-[0.98]" /* selected-ok: primary commit CTA (pay) */>
                {busy ? <><Loader2 size={17} className="animate-spin" /> Processing payment…</> : "Pay CHF 45.00"}
              </button>
              <p className="mt-2 text-center text-[12px] text-s-ink-2">Tap to toggle the processing state</p>
            </Phone>
          </div>

          <div>
            <h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">2 , Confirmation (dense receipt)</h2>
            <Phone>
              <div className="flex flex-col items-center pt-2 text-center">
                <SuccessMark size={54} />
                <h3 className="mt-4 font-heading text-[19px] font-bold text-s-ink">Booking confirmed</h3>
                <p className="mt-0.5 text-[13px] text-s-ink-2">Old Town Barbers , Do 11. Juni, 12:00</p>
              </div>
              <div className="mt-5 space-y-2.5 rounded-2xl border border-s-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-s-ink-2">Charged</span>
                  <span className="font-heading text-[18px] font-bold tabular-nums text-s-ink">CHF 45.00</span>
                </div>
                <div className="h-px bg-s-border" />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-s-ink-2"><CreditCard size={15} /> Card</span>
                  <span className="font-medium text-s-ink">Mastercard ···· 4242</span>{/* drift-ok: masked card digits, not a separator */}
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-s-ink-2"><Hash size={15} /> Reference</span>
                  <span className="font-mono text-[13px] font-semibold text-s-ink">4F2K9</span>
                </div>
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-s-ink-2"><Clock size={15} /> When</span>
                  <span className="font-medium text-s-ink">Do 11. Juni, 12:00</span>
                </div>
              </div>
              {/* owner 2026-07-02: a button to the login/account page (guests) + add to calendar */}
              <button className="mt-4 flex w-full items-center justify-center gap-1.5 rounded-full bg-s-ink py-3 text-[14px] font-bold text-white" /* selected-ok: primary commit CTA (create account) */>
                <UserPlus size={16} /> Create an account to manage it
              </button>
              <button className="mt-2 flex w-full items-center justify-center gap-1.5 rounded-full border border-s-border py-3 text-[14px] font-semibold text-s-ink">
                <CalendarPlus size={16} /> Add to calendar
              </button>
            </Phone>
          </div>

          <div>
            <h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">3 , Walk-in (same beat, queue ticket)</h2>
            <Phone>
              <div className="flex flex-col items-center pt-2 text-center">
                <SuccessMark size={54} />
                <h3 className="mt-4 font-heading text-[19px] font-bold text-s-ink">You&apos;re in the queue</h3>
                <p className="mt-0.5 text-[13px] text-s-ink-2">Old Town Barbers , show this number at the counter</p>
              </div>
              <div className="mt-5 flex flex-col items-center rounded-2xl border border-s-border bg-s-bg-sunken py-5">
                <span className="text-[12px] font-medium text-s-ink-2">Your number</span>
                <span className="font-mono text-[40px] font-bold leading-none tracking-tight text-s-ink">A17</span>
                <span className="mt-2 flex items-center gap-1.5 text-[13px] text-s-ink-2"><Users size={15} /> 3 ahead , about 25 min</span>
              </div>
              <div className="mt-4 space-y-2.5 rounded-2xl border border-s-border p-4">
                <div className="flex items-center justify-between">
                  <span className="text-[13px] text-s-ink-2">Charged</span>
                  <span className="font-heading text-[16px] font-bold tabular-nums text-s-ink">CHF 45.00</span>
                </div>
                <div className="h-px bg-s-border" />
                <div className="flex items-center justify-between text-[13px]">
                  <span className="flex items-center gap-1.5 text-s-ink-2"><CreditCard size={15} /> Card</span>
                  <span className="font-medium text-s-ink">Mastercard ···· 4242</span>{/* drift-ok: masked card digits, not a separator */}
                </div>
              </div>
            </Phone>
          </div>

          <div>
            <h2 className="mb-2 text-[13px] font-semibold text-s-ink-2">4 , Certainty (popup + push)</h2>
            <Phone>
              {/* a push notification lands the moment it's booked (owner 2026-07-02: "no notification mark to be certain") */}
              <div className="flex items-center gap-2.5 rounded-2xl border border-s-border bg-white px-3 py-2.5 shadow-[0_1px_2px_rgba(10,10,10,0.10),0_6px_20px_rgba(10,10,10,0.08)]">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-s-ink"><SuccessMark size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-bold text-s-ink">Solen</p>
                  <p className="truncate text-[13px] text-s-ink-2">Appointment confirmed , Do 11. Juni, 12:00</p>
                </div>
                <span className="shrink-0 text-[12px] text-s-ink-2">now</span>
              </div>

              {/* the in-app confirmation popup (modal) , unmistakable "you're booked" */}
              <div className="mt-6 rounded-[24px] border border-s-border bg-white p-6 text-center shadow-[0_1px_2px_rgba(10,10,10,0.10),0_16px_40px_rgba(10,10,10,0.14)]">
                <div className="mx-auto flex flex-col items-center">
                  <SuccessMark size={56} />
                  <h3 className="mt-4 font-heading text-[20px] font-bold text-s-ink">You&apos;re booked</h3>
                  <p className="mt-1 text-[13px] text-s-ink-2">Old Town Barbers</p>
                  <p className="text-[13px] font-semibold text-s-ink">Do 11. Juni, 12:00</p>
                </div>
                <button className="mt-5 w-full rounded-full bg-s-ink py-3 text-[14px] font-bold text-white" /* selected-ok: primary commit CTA */>View my booking</button>
                <button className="mt-2 w-full rounded-full py-2.5 text-[14px] font-semibold text-s-accent">Add to calendar</button>
              </div>
            </Phone>
          </div>
        </div>

        <ul className="mt-7 max-w-[640px] space-y-2 text-[13px] text-s-ink-2">
          <li><b className="text-s-ink">Card last-4 is the missing piece</b> , the confirmation already has amount + reference + date; adding the card closes the &ldquo;did I pay?&rdquo; loop.</li>
          <li><b className="text-s-ink">Real spinner, no fake delay</b> , the button shows &ldquo;Processing payment…&rdquo; only while Stripe actually resolves. Fast is trustworthy; padding it would add doubt.</li>
          <li><b className="text-s-ink">Same for walk-in</b> , pay to join the queue shows the same processing beat + ticket number as the receipt.</li>
          <li><b className="text-s-ink">Account CTA</b> , guests get a &ldquo;Create an account to manage it&rdquo; button + Add to calendar on the receipt.</li>
          <li><b className="text-s-ink">Certainty</b> , a push notification lands the moment it&apos;s booked, plus an unmistakable &ldquo;You&apos;re booked&rdquo; popup. And pressing back no longer drops you into the search flow (fixed in code this turn).</li>
        </ul>
      </div>
    </main>
  );
}
