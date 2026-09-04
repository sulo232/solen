"use client";

// Mockup-scope: whole-page
// Exists-check: client half of app/[locale]/dev/rhythm/page.tsx. Uses the shipped TabPill shape
// (16px corner, calm grey when selected) rather than inventing a chip, and the shipped ink commit
// button. Nothing is redrawn that the system already owns.
//
// measure-ok: taken from his reference clip, read frame by frame, confirmed on frame 70 by eye.
// One tap on a duration chip sets everything at once. Each duration has its OWN colour. Only one is
// ever active. A live count badge sits top right and cross-fades rather than snapping. Colours in
// the clip: amber for the shortest, green next, blue, then violet. Ours use the tokens we already
// own rather than copying his hexes, because a colour here has to survive our own contrast floors.
//
// emphasis-ok: the preview panel deliberately carries its own anchor, which is the thing being
// judged. Page chrome keeps weight 600 on the title and the selected option only.

import * as React from "react";

type Rhythm = { key: string; label: string; weeks: number; tint: string; ink: string };

// WHY THESE FOUR: the job that exists today assumes 28 days for every customer. A haircut, a
// colour and a set of nails are not on the same clock, so the point of asking is that the customer
// says which. Four is the most that fits one row at his width without scrolling, measured at 390.
const RHYTHMS: Rhythm[] = [
  { key: "3", label: "3 weeks", weeks: 3, tint: "bg-s-warning-bg", ink: "text-s-warning" },
  { key: "4", label: "4 weeks", weeks: 4, tint: "bg-s-success-bg", ink: "text-s-success" },
  { key: "6", label: "6 weeks", weeks: 6, tint: "bg-s-accent-subtle", ink: "text-s-accent" },
  { key: "8", label: "8 weeks", weeks: 8, tint: "bg-s-bg-sunken", ink: "text-s-ink" },
];

const DE_MONTH = ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun", "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"];

function addWeeks(base: Date, w: number) {
  const d = new Date(base);
  d.setDate(d.getDate() + w * 7);
  return d;
}
function fmt(d: Date) {
  return `${d.getDate()}. ${DE_MONTH[d.getMonth()]}`;
}

const ON = "h-11 rounded-[16px] bg-s-ink-soft px-4 font-body text-[13px] font-semibold text-white"; // selected-ok
const OFF = "h-11 rounded-[16px] border border-s-border bg-white px-4 font-body text-[13px] font-medium text-s-ink-2";

export function RhythmClient() {
  const [pick, setPick] = React.useState<string | null>(null);
  const [view, setView] = React.useState("prompt");

  // The booking just made. Fixed so the mockup reads the same every time it is opened, and clearly
  // a stand-in rather than a claim about a real appointment.
  const booked = React.useMemo(() => {
    const d = new Date();
    d.setHours(14, 30, 0, 0);
    return d;
  }, []);
  const chosen = RHYTHMS.find((r) => r.key === pick) ?? null;
  const next = chosen ? [1, 2, 3].map((n) => addWeeks(booked, chosen.weeks * n)) : [];

  return (
    <main className="min-h-screen bg-white px-5 py-8">
      <div className="mx-auto max-w-[430px]">
        <h1 className="font-display text-[28px] font-semibold leading-[1.15] tracking-[-0.02em] text-s-ink">
          Book it again, on their rhythm
        </h1>
        <p className="mt-3 font-body text-[15px] leading-relaxed text-s-ink">
          This is what a customer sees the moment a booking is confirmed. Tap a rhythm and watch the
          dates fill in, the way the chips work in the clip you sent.
        </p>

        <div className="mt-6 flex flex-wrap gap-2">
          {[
            { k: "prompt", l: "The prompt" },
            { k: "after", l: "Once it is on" },
            { k: "why", l: "Why these words" },
          ].map((t) => (
            <button key={t.k} type="button" onClick={() => setView(t.k)} className={view === t.k ? ON : OFF}>
              {t.l}
            </button>
          ))}
        </div>

        {view === "prompt" && (
          <section className="mt-7">
            {/* The card a customer sees. One question, one row of rhythms, one commit. */}
            <div className="rounded-[24px] border border-s-border bg-white p-5 shadow-whisper">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="font-display text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
                    Want this again?
                  </p>
                  <p className="mt-1.5 font-body text-[14px] leading-relaxed text-s-ink-2">
                    Same barber, same time. We hold it and remind you. Change or stop it whenever.
                  </p>
                </div>
                {/* the live count, the one thing that cross-fades in his clip */}
                <span
                  className={`shrink-0 rounded-full px-3 py-1.5 font-body text-[12px] font-semibold tabular-nums transition-opacity duration-200 ${
                    chosen ? `${chosen.tint} ${chosen.ink}` : "bg-s-bg-sunken text-s-ink-2"
                  }`}
                >
                  {chosen ? `alle ${chosen.weeks} Wochen` : "Kein Rhythmus"}
                </span>
              </div>

              <div className="mt-5 flex gap-2">
                {RHYTHMS.map((r) => {
                  const on = pick === r.key;
                  return (
                    <button
                      key={r.key}
                      type="button"
                      onClick={() => setPick(on ? null : r.key)}
                      className={`h-11 flex-1 rounded-[16px] border font-body text-[13px] font-medium transition-colors duration-150 ${
                        on ? `${r.tint} ${r.ink} border-transparent font-semibold` : "border-s-border bg-white text-s-ink-2"
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>

              {/* The dates the rhythm would actually book. This is his "more automatic": he does not
                  get a reminder to go and book, he sees the appointments that will exist. */}
              <div className="mt-5 min-h-[104px]">
                {chosen ? (
                  <ul className="flex flex-col gap-2.5">
                    {next.map((d, i) => (
                      <li key={i} className="flex items-center gap-3">
                        <span className={`h-2 w-2 shrink-0 rounded-full ${chosen.tint}`} aria-hidden />
                        <span className="font-body text-[15px] text-s-ink tabular-nums">{fmt(d)}</span>
                        <span className="font-body text-[13px] text-s-ink-2">14:30</span>
                        {i === 0 && (
                          <span className="ml-auto font-body text-[12px] text-s-ink-2">als Nächstes</span>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <p className="font-body text-[14px] leading-relaxed text-s-ink-2">
                    Pick a rhythm and the next three appointments show up here before you agree to
                    anything.
                  </p>
                )}
              </div>

              <button
                type="button"
                disabled={!chosen}
                className="mt-5 h-12 w-full rounded-[16px] bg-s-ink font-body text-[15px] font-semibold text-white disabled:cursor-not-allowed disabled:opacity-50"
              >
                {chosen ? `Alle ${chosen.weeks} Wochen buchen` : "Rhythmus wählen"}
              </button>
              <button
                type="button"
                className="font-body mt-2 h-11 w-full rounded-[16px] text-[14px] font-medium text-s-ink-2"
              >
                Nein danke
              </button>
            </div>
          </section>
        )}

        {view === "after" && (
          <section className="mt-7">
            <div className="rounded-[24px] border border-s-border bg-white p-5 shadow-whisper">
              <p className="font-display text-[22px] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">
                Alle 4 Wochen
              </p>
              <p className="mt-1.5 font-body text-[14px] leading-relaxed text-s-ink-2">
                Your next three are held. We message you three days before each one, and you can move
                or stop it from that message.
              </p>
              <ul className="mt-4 flex flex-col gap-2.5">
                {[1, 2, 3].map((n) => (
                  <li key={n} className="flex items-center gap-3">
                    <span className="h-2 w-2 shrink-0 rounded-full bg-s-success-bg" aria-hidden />
                    <span className="font-body text-[15px] text-s-ink tabular-nums">
                      {fmt(addWeeks(booked, 4 * n))}
                    </span>
                    <span className="font-body text-[13px] text-s-ink-2">14:30</span>
                  </li>
                ))}
              </ul>
              <button
                type="button"
                className="font-body mt-5 h-11 w-full rounded-[16px] border border-s-border text-[14px] font-medium text-s-ink"
              >
                Rhythmus ändern
              </button>
            </div>
            <p className="mt-5 font-body text-[13px] leading-relaxed text-s-ink-2">
              This is the difference from what exists today. Right now a job emails anyone whose last
              booking was 28 days ago, the same 28 for everybody, and the email asks them to go and
              book. Here the appointments already exist and the message is a heads up they can undo.
            </p>
          </section>
        )}

        {view === "why" && (
          <section className="mt-7 flex flex-col gap-4">
            <div className="rounded-[16px] border border-s-border p-4">
              <p className="font-body text-[15px] font-semibold text-s-ink">Asked once, at the only moment it makes sense</p>
              <p className="mt-1.5 font-body text-[14px] leading-relaxed text-s-ink-2">
                Right after a booking is confirmed, when they already know when they want to come
                back. Not a message weeks later asking them to start again.
              </p>
            </div>
            <div className="rounded-[16px] border border-s-border p-4">
              <p className="font-body text-[15px] font-semibold text-s-ink">Their number, not ours</p>
              <p className="mt-1.5 font-body text-[14px] leading-relaxed text-s-ink-2">
                A fade is three weeks and a colour is eight. The four choices exist so nobody is told
                what their own hair does.
              </p>
            </div>
            <div className="rounded-[16px] border border-s-border p-4">
              <p className="font-body text-[15px] font-semibold text-s-ink">You see it before you agree</p>
              <p className="mt-1.5 font-body text-[14px] leading-relaxed text-s-ink-2">
                Tapping a rhythm shows the actual dates first. That is the part taken from your clip:
                the chip fills the whole thing in and the count updates before you commit.
              </p>
            </div>
            <div className="rounded-[16px] border border-s-border p-4">
              <p className="font-body text-[15px] font-semibold text-s-ink">Stopping is one tap, always</p>
              <p className="mt-1.5 font-body text-[14px] leading-relaxed text-s-ink-2">
                Every reminder carries the way out. A repeat booking nobody can escape is a trap, and
                a trap costs a customer permanently.
              </p>
            </div>
          </section>
        )}

        <p className="mt-8 font-body text-[13px] leading-relaxed text-s-ink-2">
          Nothing here is wired up. The dates are counted forward from today so they read correctly,
          and the times are a stand-in.
        </p>
      </div>
    </main>
  );
}
