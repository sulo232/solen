import Link from "next/link";
import { Scissors, Store } from "lucide-react";

/**
 * SalonRegister — Fresha-for-Business style (2026-05-14).
 *
 * SUPERSEDES the V2-D46 / V2-D49k image-left + bullet-list-right layout.
 * New pattern matches Fresha's "Fresha for Business" homepage section:
 * copy LEFT (eyebrow + h1 + lede + CTA + trust line) + product UI mockup
 * RIGHT (CSS-built Solen Dashboard preview + floating salon card).
 *
 * File name kept as WhySolen.tsx (logical name: SalonRegister) so existing
 * imports don't break. Default export reflects the role.
 *
 * Audience: salon owners (B2B acquisition). The product mockup signals
 * "this is what your day looks like with Solen" — booking calendar + your
 * salon as a customer-discovery card.
 *
 * Anatomy:
 *   ┌──────────────────────────────────────────────────────────┐
 *   │  ● FÜR SALONS              ┌─────────────────────────┐  │
 *   │  Solen für                 │  solen·  [Heute] [Mit.] │  │
 *   │  dein Geschäft.            │  Di · Mi · Do · Fr · Sa │  │
 *   │                            │  9:00  [Lara K]  ...    │  │
 *   │  Mehr Buchungen...         │  10:00 [Sara R] ...     │  │
 *   │  [Mehr erfahren →]         │  ...                    │  │
 *   │                            │     ┌──────────────┐   │  │
 *   │  Bewertet 4.9 / 5 ★★★★★   │     │ Salon Maria  │   │  │
 *   │  Über 1'200 Salons...      │     │ ★★★★★ 5.0    │   │  │
 *   │                            │     │ Sofort buchbar│   │  │
 *   │                            │     └──────────────┘   │  │
 *   │                            └─────────────────────────┘  │
 *   └──────────────────────────────────────────────────────────┘
 *
 * On mobile (<lg breakpoint), the right product mockup is hidden — copy
 * block stacks at full width with no decoration. Mobile users don't need
 * the dashboard preview to grasp the offer.
 */

interface BookingBlock {
  name: string;
  service: string;
  /** Earthen Wellness palette: emerald-pale / cream-warm / bone / sage-pale / butter */
  tint: "emerald" | "cream" | "bone" | "sage" | "butter";
}

const CALENDAR: { day: string; bookings: BookingBlock[] }[] = [
  {
    day: "Di",
    bookings: [
      { name: "Lara K.", service: "Schnitt + Föhn", tint: "emerald" },
      { name: "Marc H.", service: "Fade", tint: "cream" },
      { name: "Anna M.", service: "Coloration", tint: "sage" },
    ],
  },
  {
    day: "Mi",
    bookings: [
      { name: "Sara R.", service: "Gel-Maniküre", tint: "butter" },
      { name: "Tobias W.", service: "Bart-Trim", tint: "emerald" },
    ],
  },
  {
    day: "Do",
    bookings: [
      { name: "Eva S.", service: "Hochsteck", tint: "bone" },
      { name: "Niklas B.", service: "Schnitt", tint: "cream" },
      { name: "Sophie L.", service: "Spa", tint: "sage" },
    ],
  },
  {
    day: "Fr",
    bookings: [
      { name: "David K.", service: "Pflege", tint: "emerald" },
      { name: "Lena F.", service: "Balayage", tint: "butter" },
    ],
  },
  {
    day: "Sa",
    bookings: [
      { name: "Anna M.", service: "Schnitt", tint: "bone" },
      { name: "Mira L.", service: "Nail-Art", tint: "emerald" },
      { name: "Tim O.", service: "Fade", tint: "cream" },
    ],
  },
];

const TINT_BG: Record<BookingBlock["tint"], string> = {
  emerald: "#D4F2E0",  // V2-D60: matches new s-brand.subtle
  cream:   "#FFE8D8",  // V2-D60: warmer peach (was generic cream)
  bone:    "#EAE0D0",  // V2-D60: matches new s-border/sunken
  sage:    "#D4DDC8",
  butter:  "#FFF1C2",  // V2-D60: more saturated butter
};

export default function SalonRegister() {
  return (
    <section className="relative z-[1] mx-auto max-w-[1280px] px-3 py-3 md:px-4 md:py-6 mb-1 md:mb-3">
      <div
        className="relative overflow-hidden rounded-[28px] md:rounded-[40px] shadow-[0_8px_24px_rgba(42,31,24,0.06)]"
        style={{ background: "#FFFFFF", border: "1.5px solid #1A8F5C" }}
      >
        <div className="grid grid-cols-1 gap-8 p-6 md:p-12 lg:grid-cols-[1fr_1.2fr] lg:gap-12 lg:p-16">

          {/* LEFT — Copy + CTA + trust */}
          <div className="flex flex-col justify-center text-s-ink">
            {/* V2-D66 (2026-05-16, Hayden move #7): dropped uppercase + heavy
                tracking on the eyebrow. Was `text-[11px] font-bold uppercase
                tracking-[0.18em]` — read as "loud category label" competing
                with the giant h2 below. Sentence-case medium at slightly larger
                size keeps the leading-dot motif but reads as soft caption. */}
            <span className="mb-3 inline-flex items-center gap-2 font-body text-[14px] font-medium text-s-accent before:block before:h-[5px] before:w-[5px] before:rounded-full before:bg-s-accent before:content-['']">
              Für Salons
            </span>
            <h2 className="font-display text-[clamp(32px,4.5vw,64px)] font-black leading-[1.0] tracking-normal text-s-ink">
              Solen für<br />
              <span className="text-s-accent">dein Geschäft.</span>
            </h2>
            <p className="mt-5 font-body text-[15px] md:text-[17px] leading-[1.55] text-s-ink-2 max-w-[480px]">
              Mehr Buchungen, weniger Aufwand. Solen bringt die richtigen
              Kund:innen zu dir &mdash; automatisiert, transparent, fair.
              Schweizer Salon-Plattform Nr. 1 in Basel.
            </p>

            <Link
              href="/business/signup"
              className="mt-7 inline-flex items-center gap-2.5 self-start rounded-full bg-s-brand px-6 py-3.5 font-body text-[14px] font-bold text-white shadow-[0_4px_14px_rgba(31,92,66,0.25)] transition-all duration-200 ease-glide hover:bg-s-brand-mid hover:-translate-y-[1px] hover:shadow-[0_6px_20px_rgba(31,92,66,0.32)] active:scale-[0.97] active:duration-[80ms]"
            >
              Mehr erfahren
              <span aria-hidden className="text-[16px]">→</span>
            </Link>

            <div className="mt-10">
              <div className="flex items-center gap-3 mb-2">
                <span className="font-display text-[22px] font-black tracking-[-0.01em] text-s-ink leading-none">
                  Bewertet 4.9 / 5
                </span>
                <span aria-hidden className="text-[16px] tracking-[0.06em]" style={{ color: "#F3A864" }}>
                  ★★★★★
                </span>
              </div>
              <p className="font-body text-[13px] text-s-ink-3">
                Über 1&apos;200 Salons buchen schon mit Solen
              </p>
            </div>
          </div>

          {/* RIGHT — Product UI mockup (hidden on small viewports) */}
          <div className="hidden lg:block relative aspect-[1.2/1] w-full">
            <div
              className="relative w-full h-full rounded-[28px] overflow-hidden"
              style={{ background: "linear-gradient(135deg, #D4F2E0 0%, #FFE8D8 100%)" }}
              aria-hidden
            >
              {/* Dashboard preview */}
              <div className="absolute top-8 left-8 right-20 bottom-20 bg-white rounded-2xl border border-[#E0E5DD] shadow-[0_12px_40px_rgba(31,23,9,0.10)] overflow-hidden p-[18px] flex flex-col gap-3">
                {/* Toolbar */}
                <div className="flex items-center gap-2 pb-3 border-b border-[#F0EDE8]">
                  <span className="font-display text-[14px] font-black text-s-ink mr-4 inline-flex items-baseline">
                    solen
                    <span className="ml-[2px] inline-block h-[5px] w-[5px] rounded-full bg-s-accent" />
                  </span>
                  <span className="rounded-md bg-s-brand text-white px-[11px] py-[5px] text-[11px] font-semibold">Heute</span>
                  <span className="rounded-md bg-[#F2F0EB] text-s-ink-2 px-[11px] py-[5px] text-[11px] font-semibold">Mitarbeiter</span>
                  <span className="rounded-md bg-[#F2F0EB] text-s-ink-2 px-[11px] py-[5px] text-[11px] font-semibold">Woche</span>
                  <span className="flex-1" />
                  <span className="text-[11px] text-s-ink-3 font-semibold">Di 14. Mai · 2026</span>
                </div>
                {/* Calendar grid */}
                <div className="grid gap-1 flex-1" style={{ gridTemplateColumns: "50px repeat(5, 1fr)" }}>
                  {/* Time column */}
                  <div className="flex flex-col gap-1 pt-3">
                    {["9:00", "10:00", "11:00", "12:00", "13:00", "14:00"].map((t) => (
                      <div key={t} className="text-[9px] text-s-ink-3 h-7 flex items-start">{t}</div>
                    ))}
                  </div>
                  {/* Day columns */}
                  {CALENDAR.map((col) => (
                    <div key={col.day} className="bg-[#FAFAF8] rounded-md p-2 flex flex-col gap-1">
                      <div className="text-[9px] font-bold text-s-ink-2 text-center mb-1">{col.day}</div>
                      {col.bookings.map((b, i) => (
                        <div
                          key={i}
                          className="rounded px-1.5 py-1 text-[8.5px] leading-tight"
                          style={{ background: TINT_BG[b.tint] }}
                        >
                          <span className="block font-bold text-s-ink">{b.name}</span>
                          <span className="text-s-ink-2 text-[8px]">{b.service}</span>
                        </div>
                      ))}
                    </div>
                  ))}
                </div>
              </div>

              {/* Floating salon preview card */}
              <div className="absolute bottom-8 right-8 w-[200px] bg-white rounded-[18px] shadow-[0_16px_48px_rgba(31,23,9,0.15)] overflow-hidden">
                <div
                  className="w-full aspect-[4/3] relative grid place-items-center"
                  style={{ background: "linear-gradient(135deg, #D4DDC8 0%, #A8E0BF 100%)" }}
                >
                  <Scissors size={36} strokeWidth={1.5} className="text-s-brand opacity-40" />
                </div>
                <div className="p-3">
                  <div className="font-display text-[13px] font-black text-s-ink mb-1">Salon Maria</div>
                  <div className="flex items-center gap-1 text-[10px] text-s-ink-2">
                    <span style={{ color: "#F3A864" }} className="text-[9px] tracking-[0.06em]">★★★★★</span>
                    <span>5.0 · 247 Bewertungen</span>
                  </div>
                  <div className="text-[9px] text-s-ink-3 mt-[2px]">2.0 km · Kleinbasel</div>
                  <span className="inline-flex items-center gap-1 mt-1.5 px-2 py-[3px] rounded-full bg-s-brand text-white text-[9px] font-bold">
                    <Store size={9} aria-hidden />
                    Sofort buchbar
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </section>
  );
}
