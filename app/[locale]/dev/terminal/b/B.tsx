"use client";

// =============================================================================
// WHAT THIS SCREEN IS. Named first, because not naming it is what broke rounds
// 1 through 6.
//
//   SURFACE CLASS : merchant counter terminal. An OPERATOR surface. It is not a
//                   customer surface and the customer FLOORS LAW does not apply
//                   to it by default.
//   ITS ONE JOB   : the person standing at the counter can see, from arm's
//                   length and without touching anything, who is in a chair,
//                   who is waiting, and what needs a decision right now.
//
// Because the class was never named, the customer law was applied by default,
// and the customer law actively DEMANDED the two things the owner rejected:
// FLOORS LAW 4 mandates the sunken tray for grouped content on white with no
// photo (round 5's grey canvas), and FLOORS LAW 1d mandates a semantic-colour
// moment on a screen with no photography, which on a photo-less merchant screen
// leaves only the pale semantic tokens, so s-warning.bg #FDF6E7 became a
// full-bleed bar (round 6's beige). Both were correct customer law applied to a
// screen that is not a customer screen.
//
// THE LAW THAT ACTUALLY GOVERNS THIS SCREEN, routed by surface class:
//   _design-system/TASTE_LOG.md:339 (dated merchant round, 2026-07-15)
//     "ONE carded hero per screen; secondary info is BARE TEXT on the canvas
//      (no card/box/pill costume)" , owner: "we need breathing space not just
//      everywhere cards or boxes or pill".
//   _design-system/TASTE_LOG.md:341  "Binary 16/32 gaps only".
//   _design-system/LOCKFILE.md:561 THE CONTAINER TEST (2026-07-28)
//     "A container is earned only when it does something whitespace cannot",
//     three cases. This screen's lists meet NONE of them: they sit on white
//     (not case 1), they are rows of one list rather than peer entities
//     competing in a scroll (not case 2), and no row navigates as a unit
//     (not case 3). So: whitespace and an inset hairline, no border, no card.
//   _design-system/LOCKFILE.md:593 "Row rhythm when the box goes away" ,
//     content sits ~26px off the edge, the divider is inset 24px on both sides
//     spanning about 88% of the width. Hence px-6 on the content column and the
//     rule on the row CHILD, so it lives inside the padding box.
//
// NOT A GRAVEYARD COLLISION: REMOVED.md:85 kills "borderless / chrome-off" but
// scopes itself, in its own words, to "across customer surfaces". The merchant
// round says the opposite for operator screens. Two different surface classes,
// which is the whole point of naming the class first.
//
// THE QUESTION THAT WAS PARKED IN ROUND ONE is answered here, because leaving it
// open is what let five rounds be built on top of it. The design verifier asked
// (_plans/MERCHANT_TERMINAL_2026-08-15.md:732) whether a list of people is one
// card with lines, or a card per person. The answer is NEITHER: it is bare rows
// on the canvas. Exactly one thing on this screen wears a card, and it is the
// chairs, because the chairs are the thing being looked at.
//
// exists-check: npm run exists terminal , the terminal family only. This file
// composes the shipped constants from ../Terminal (GROUPED_CARD, ROW_TITLE,
// ROW_META, SECTION_HEADING, PRIMARY_BUTTON, SECONDARY_BUTTON) and the real
// Avatar primitive rather than retyping any of them.
// english-ok: standalone dev prototype, all hardcoded copy is English.
//
// KEPT, unchanged in behaviour: the two scripted arrivals (6s, 26s), the 1s
// clock, Start / Done / Accept / No-show, the snapshot undo stack, the Sound
// on/off control, Replay, the server-render-then-portal pattern, and the
// mounted-vs-fixed root class swap.
// =============================================================================

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Inbox } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/app/[locale]/_components/primitives";
import {
  GROUPED_CARD,
  ROW_TITLE,
  ROW_META,
  SECTION_HEADING,
  SECONDARY_BUTTON,
  chf,
  zurichTime,
  elapsedMinutes,
  firstName,
  type TerminalBooking,
  type TerminalQueueEntry,
  type TerminalStaff,
} from "../Terminal";

interface BDirectionProps {
  salonName: string;
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
  staff: TerminalStaff[];
}

// ---- THE LADDER. Exactly four sizes with real distance in them. ------------
// 28 anchor / 18 heading / 15 the name you read on a row / 13 everything else.
// 14 is deleted on purpose: it measured 43 of 71 text elements and sat one step
// from both its neighbours, so nothing on the screen could be read as bigger
// than anything else (FLOORS LAW 7c, "size variety is not range").
//
// Each of the three borrowed constants is the SHIPPED string with ONE token
// swapped, the same way Terminal.tsx derives LOG_TEXT and its flex-1 primary,
// so the font, weight, tracking and leading still come from the design system
// and only the size is pinned.
// 2026-08-16: raised 28 -> 30 to match the product. MEASURED on the rendered salon PDP, its
// page title is `clamp(30px,2.8vw,34px)`, so 28 sat a step under the biggest thing the product
// itself uses. 30 is the bottom of that clamp, which is the value the PDP renders at 390 wide,
// so this is the same number rather than a new one. Ratio to the 13px body goes 2.15x -> 2.31x.
const ANCHOR = "font-display text-[30px] font-semibold leading-tight tabular-nums text-s-ink";
// Pinned to a flat 18: the shipped clamp resolves to 18 at 390 but to 20 past
// ~1000px, and a counter terminal can run on a wide screen. A fifth size that
// only appears on a tablet is still a fifth size.
const HEADING = SECTION_HEADING.replace("text-[clamp(18px,2vw,20px)]", "text-[18px]");
// Same: ROW_TITLE steps to 16 at md, which would be a fifth size on a tablet.
const ROW_NAME = ROW_TITLE.replace(" md:text-[16px]", "");
// ROW_META ships at 14, the exact size being deleted. Size swapped, nothing else.
const ROW_SUB = ROW_META.replace("text-[14px]", "text-[13px]");
const SMALL = "font-body text-[13px] font-normal text-s-ink-2";
const SMALL_INK = "font-body text-[13px] font-normal text-s-ink";

// ---- THE BOX BUDGET. -------------------------------------------------------
// BARE_ROW is the row grammar with the box taken off: no container, no border
// around the group, no shadow. The single hairline is a border-top on the row
// CHILD, so the content column's px-6 insets it to 24px from each screen edge
// (about 88% of 390), which is the measured content-divider inset in
// LOCKFILE:586. first:border-t-0 means the list's own top edge is whitespace.
const BARE_ROW = "border-t border-s-border py-4 first:border-t-0";
// The list sheet: white, soft, floating on the grey ground. Rows keep their hairlines
// INSIDE it, which is the reference's pattern (one soft sheet, quiet lines within).
const LIST_SHEET = "mt-4 rounded-[32px] bg-white px-5 py-2 shadow-[0_8px_30px_rgba(0,0,0,0.06)]";
// boxed-ok: GROUPED_CARD is used exactly ONCE on this screen, on the chairs,
// and with no inner ROW hairlines (the tiles sit side by side, so there is
// nothing to double against). It is the shipped grouped-list-card container
// (SalonServices.tsx:118 / SalonTeam.tsx:70), composed not re-declared.
// WETO PASS, 2026-08-17. The owner's reference: soft oversized radius, a white card floating on a
// very light ground with a soft shadow and no hard border. Radius reads far larger than our 24.
// NOTE ON METHOD, stated because eyeballing a reference is the banned failure here: his screenshot
// did not land on disk, so this is read off the image on screen, not sampled. The numbers below are
// therefore PROPOSALS to react to, not measurements, and the moment the file lands they get sampled.
const CHAIRS_CARD =
  "mt-4 rounded-[32px] bg-white p-5 shadow-[0_8px_30px_rgba(0,0,0,0.06)]";

// Chrome. The two bars live in ONE sticky wrapper. Round 6 gave the lower bar a
// hardcoded `top-11` (44px) while the bar above it rendered 65px tall, so the
// two top-level sections overlapped by 21px the moment the screen scrolled.
// Stacking them inside one sticky parent deletes the arithmetic that produced
// the overlap instead of correcting its constant.
const CHROME_STACK =
  "sticky top-0 z-30 mx-auto mt-3 w-[calc(100%-24px)] max-w-[736px] rounded-[28px] bg-white shadow-[0_6px_24px_rgba(0,0,0,0.06)]";
const CHROME_ROW = "mx-auto flex h-14 w-full max-w-[760px] items-center gap-3 px-6";

// A ROW-scale commit action: the shipped SECONDARY_BUTTON's exact geometry
// (h-11, pill, 13px) with only the FILL stepping up to ink, so the Accept and
// Decline pair reads as twins that differ by weight and not by size (LOCKFILE
// twin-control rule).
//
// It is deliberately NOT the page-level PRIMARY_BUTTON. That control renders
// 62px tall and full width, and this screen can hold twelve decisions at once,
// so twelve of them turned the attention list into a column of black bars.
// Caught by looking at the whole rendered screen, not at the button on its own,
// which is the same failure as the beige in a different token: "the one primary
// commit CTA stays ink" is a PER-SCREEN rule, and a list of decisions has no
// one CTA. Ink is still what marks the commit; it is just at the row's scale.
//
// It is also not a white pill carrying a shadow, because a white shadowed
// control on a white canvas is the banned grey haze (LOCKFILE elevation: a calm
// control on white is FLAT).
// 2026-08-16, owner: "Why is that accept button fucking black? Make it green, bro."
// He is right, and it is not a preference, it is the rule this screen was already carrying
// everywhere else: GREEN MEANS GOOD, and accepting a booking is a confirmation. Free reads green
// in the chairs, Confirmed reads green in the list, and then the button that DOES the confirming
// was black, which is the one place the screen contradicted itself.
// It does not break "the one primary commit CTA stays ink": that rule governs the single PURCHASE
// button on a customer screen. Accepting a booking is not a purchase, and this list can hold
// twelve of them at once.
// #16A34A is the locked success green (taste rule 4, "normal green, NOT deep #15803D"), white text
// on it measures 3.94:1, which clears the 3:1 graphical floor and is why the label stays 13px/600
// rather than dropping smaller.
const COMMIT_BUTTON = SECONDARY_BUTTON.replace("shrink-0", "flex-1 justify-center")
  .replace("border border-s-border bg-white", "bg-s-success")
  .replace("text-s-ink transition", "text-white transition")
  .replace("hover:bg-s-bg-sunken", "hover:brightness-95");
const TEXT_ROW_ACTION_DANGER = "font-body flex h-11 items-center text-[13px] font-normal text-s-error";
// Canonical duration for the arrival/next-up tint fade (LOCKFILE motion canon).
// The tint HOLD is a separate setTimeout; this only controls the fade out.
const TINT_TRANSITION = "transition-colors duration-500";
// The only non-white surface this screen is allowed to paint, and only for a
// second and a half. Cool sunken #F4F4F5, never warm cream.
const TINT_SURFACE = " bg-s-bg-sunken";

function attentionLabel(count: number): string {
  if (count === 1) return "1 needs you";
  return `${count} need you`;
}

// The one hardcoded thing this prototype is allowed (a genuinely new booking
// cannot come from a database that has already been read). Never reused as a
// real customer name anywhere else.
const ARRIVAL_NAMES = [
  "Elias Meier",
  "Sina Baumann",
  "Noah Frei",
  "Lara Widmer",
  "Timo Steiner",
  "Nora Keller",
  "Luca Brunner",
  "Mia Zimmermann",
];

function nextQuarterHourIso(offsetMs: number): string {
  const target = new Date(Date.now() + offsetMs);
  const step = 15 * 60_000;
  return new Date(Math.ceil(target.getTime() / step) * step).toISOString();
}

function buildArrivalBooking(
  seq: number,
  templates: TerminalBooking[],
  staff: TerminalStaff[],
  usedNames: Set<string>
): TerminalBooking {
  const freeNames = ARRIVAL_NAMES.filter((n) => !usedNames.has(n));
  const name = freeNames[Math.floor(Math.random() * freeNames.length)] ?? ARRIVAL_NAMES[seq % ARRIVAL_NAMES.length];
  usedNames.add(name);
  const template = templates.length > 0 ? templates[Math.floor(Math.random() * templates.length)] : null;
  const member = staff.length > 0 ? staff[Math.floor(Math.random() * staff.length)] : null;
  const startsAt = nextQuarterHourIso(90 * 60_000);
  return {
    id: `arrival-${seq}-${Date.now()}`,
    startsAt,
    endsAt: startsAt,
    status: "pending_approval",
    customerName: name,
    serviceName: template?.serviceName ?? "Haircut",
    price: template?.price ?? 65,
    paymentStatus: "none",
    createdAt: new Date().toISOString(),
    arrivedAt: null,
    staffId: member?.id ?? null,
    staffName: member?.name ?? null,
  };
}

// WebAudio only, no file, no remote asset. A short 880Hz sine at low gain.
function playTone(ctx: AudioContext, atSeconds: number) {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  osc.type = "sine";
  osc.frequency.value = 880;
  gain.gain.setValueAtTime(0.001, atSeconds);
  gain.gain.exponentialRampToValueAtTime(0.06, atSeconds + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, atSeconds + 0.12);
  osc.connect(gain).connect(ctx.destination);
  osc.start(atSeconds);
  osc.stop(atSeconds + 0.13);
}

function playArrivalChime(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  playTone(ctx, t0);
  playTone(ctx, t0 + 0.15);
}

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };
function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as WindowWithWebkitAudio;
  return window.AudioContext ?? w.webkitAudioContext;
}

interface HistoryEntry {
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
}

type SoundState = "off" | "on" | "blocked";

export default function B({ salonName, bookings: initialBookings, queue: initialQueue, staff }: BDirectionProps) {
  const [bookings, setBookings] = useState<TerminalBooking[]>(initialBookings);
  const [queue, setQueue] = useState<TerminalQueueEntry[]>(initialQueue);
  const [expandedWaitingId, setExpandedWaitingId] = useState<string | null>(null);
  const [showingAttention, setShowingAttention] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [, forceTick] = useState(0);
  const [tintIds, setTintIds] = useState<Set<string>>(new Set());
  const [justConfirmedIds, setJustConfirmedIds] = useState<Set<string>>(new Set());
  const [highlightId, setHighlightId] = useState<string | null>(null);
  const [undo, setUndo] = useState<{ message: string } | null>(null);
  const [soundState, setSoundState] = useState<SoundState>("off");
  const [replayKey, setReplayKey] = useState(0);

  const historyRef = useRef<HistoryEntry[]>([]);
  const cleanupTimeoutsRef = useRef<ReturnType<typeof setTimeout>[]>([]);
  const highlightTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const soundStateRef = useRef<SoundState>("off");
  const usedArrivalNamesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    soundStateRef.current = soundState;
  }, [soundState]);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  // The live clock. Every listing below (elapsedMinutes, zurichTime, lateness)
  // reads Date.now() fresh at render time; this interval is the only thing that
  // makes those renders happen.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // The two scripted arrivals, 6s then 20s after that (26s from open).
  // Rescheduled on Replay.
  const addArrival = useCallback(
    (seq: number) => {
      const booking = buildArrivalBooking(seq, initialBookings, staff, usedArrivalNamesRef.current);
      setBookings((prev) => [booking, ...prev]);
      setTintIds((prev) => new Set(prev).add(booking.id));
      const t = setTimeout(() => {
        setTintIds((prev) => {
          const next = new Set(prev);
          next.delete(booking.id);
          return next;
        });
      }, 1500);
      cleanupTimeoutsRef.current.push(t);
      if (soundStateRef.current === "on" && audioCtxRef.current) {
        playArrivalChime(audioCtxRef.current);
      }
    },
    [initialBookings, staff]
  );

  useEffect(() => {
    const t1 = setTimeout(() => addArrival(0), 6_000);
    const t2 = setTimeout(() => addArrival(1), 26_000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [replayKey, addArrival]);

  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8_000);
    return () => clearTimeout(t);
  }, [undo]);

  // Final cleanup: every interval/timeout this component ever starts, on unmount.
  useEffect(() => {
    return () => {
      cleanupTimeoutsRef.current.forEach(clearTimeout);
      cleanupTimeoutsRef.current = [];
      if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
      audioCtxRef.current?.close().catch(() => {});
    };
  }, []);

  function triggerHighlight(id: string) {
    setHighlightId(id);
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    highlightTimeoutRef.current = setTimeout(() => setHighlightId(null), 2_000);
  }

  function pushHistory() {
    historyRef.current.push({ bookings, queue });
  }

  function handleUndo() {
    const prev = historyRef.current.pop();
    if (!prev) return;
    setBookings(prev.bookings);
    setQueue(prev.queue);
    setUndo(null);
  }

  async function toggleSound() {
    if (soundState === "on") {
      setSoundState("off");
      return;
    }
    try {
      if (!audioCtxRef.current) {
        const Ctor = getAudioContextCtor();
        if (!Ctor) throw new Error("AudioContext unsupported");
        audioCtxRef.current = new Ctor();
      }
      await audioCtxRef.current.resume();
      setSoundState("on");
      playTone(audioCtxRef.current, audioCtxRef.current.currentTime);
    } catch (err) {
      console.error("[Terminal B] audio unlock failed:", err);
      setSoundState("blocked");
    }
  }

  function handleReplay() {
    cleanupTimeoutsRef.current.forEach(clearTimeout);
    cleanupTimeoutsRef.current = [];
    if (highlightTimeoutRef.current) clearTimeout(highlightTimeoutRef.current);
    historyRef.current = [];
    usedArrivalNamesRef.current = new Set();
    setBookings(initialBookings);
    setQueue(initialQueue);
    setUndo(null);
    setTintIds(new Set());
    setJustConfirmedIds(new Set());
    setHighlightId(null);
    setExpandedWaitingId(null);
    setShowingAttention(false);
    setReplayKey((k) => k + 1);
  }

  function handleAccept(booking: TerminalBooking) {
    pushHistory();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: "confirmed" } : b)));
    setJustConfirmedIds((prev) => new Set(prev).add(booking.id));
    const t = setTimeout(() => {
      setJustConfirmedIds((prev) => {
        const next = new Set(prev);
        next.delete(booking.id);
        return next;
      });
    }, 700);
    cleanupTimeoutsRef.current.push(t);
    setUndo({ message: `${booking.customerName} confirmed` });
  }

  function handleDecline(booking: TerminalBooking) {
    pushHistory();
    setBookings((prev) => prev.filter((b) => b.id !== booking.id));
    setUndo({ message: `${booking.customerName} declined` });
  }

  function handleTheyArrivedLate(booking: TerminalBooking) {
    pushHistory();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, startsAt: new Date().toISOString() } : b)));
    setUndo({ message: `${booking.customerName} marked arrived` });
  }

  function handleNoShowLate(booking: TerminalBooking) {
    pushHistory();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: "no_show" } : b)));
    setUndo({ message: `${booking.customerName} marked no-show` });
  }

  function handleStart(entry: TerminalQueueEntry) {
    pushHistory();
    const busyStaffIds = new Set(queue.filter((q) => q.status === "in_chair").map((q) => q.staffId));
    const freeMember = staff.find((s) => !busyStaffIds.has(s.id)) ?? staff[0] ?? null;
    const startedIso = new Date().toISOString();
    const AVG_SERVICE_MINUTES = 30;
    setQueue((prev) =>
      prev.map((q) => {
        if (q.id === entry.id) {
          return { ...q, status: "in_chair", staffId: freeMember?.id ?? q.staffId, startedAt: startedIso };
        }
        if (q.status === "waiting" && q.position > entry.position) {
          return {
            ...q,
            position: q.position - 1,
            estimatedWaitMinutes: Math.max(5, q.estimatedWaitMinutes - AVG_SERVICE_MINUTES),
          };
        }
        return q;
      })
    );
    setExpandedWaitingId(null);
    setUndo({ message: `${entry.customerName} started` });
  }

  function handleDone(entry: TerminalQueueEntry, nextUpId: string | null) {
    pushHistory();
    setQueue((prev) => prev.map((q) => (q.id === entry.id ? { ...q, status: "completed" } : q)));
    setUndo({ message: `${entry.customerName} done` });
    if (nextUpId) triggerHighlight(nextUpId);
  }

  function handleNoShowWaiting(entry: TerminalQueueEntry) {
    pushHistory();
    setQueue((prev) => prev.map((q) => (q.id === entry.id ? { ...q, status: "no_show" } : q)));
    setExpandedWaitingId(null);
    setUndo({ message: `${entry.customerName} marked no-show` });
  }

  // ---- Derived, un-memoised on purpose: every value below reads Date.now() /
  // elapsedMinutes at render time, and this component re-renders every second
  // (the tick above). Memoising any of these on [bookings]/[queue] alone would
  // freeze the lateness math between data changes. ----
  const waitingActive = queue.filter((q) => q.status === "waiting").sort((a, b) => a.position - b.position);
  const waitingNoShow = queue.filter((q) => q.status === "no_show");
  const inChairList = queue.filter((q) => q.status === "in_chair");
  const doneQueueCount = queue.filter((q) => q.status === "completed").length;
  const maxWait = waitingActive.reduce((acc, q) => Math.max(acc, q.estimatedWaitMinutes), 0);

  const confirmedBookings = bookings.filter((b) => b.status === "confirmed");
  const veryLate = confirmedBookings.filter((b) => elapsedMinutes(b.startsAt) >= 30);
  const moderatelyLate = confirmedBookings
    .filter((b) => elapsedMinutes(b.startsAt) >= 15 && elapsedMinutes(b.startsAt) < 30)
    .sort((a, b) => elapsedMinutes(b.startsAt) - elapsedMinutes(a.startsAt));
  const onTime = confirmedBookings
    .filter((b) => elapsedMinutes(b.startsAt) < 15)
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const pendingBookings = bookings
    .filter((b) => b.status === "pending_approval")
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const noShowBookings = bookings.filter((b) => b.status === "no_show");
  const laterTodayActive = [...pendingBookings, ...moderatelyLate, ...onTime];

  const activeAttentionItems: { booking: TerminalBooking; reason: "new" | "late" }[] = [
    ...pendingBookings.map((b) => ({ booking: b, reason: "new" as const })),
    ...veryLate.map((b) => ({ booking: b, reason: "late" as const })),
  ];
  const graceConfirmed = bookings.filter((b) => justConfirmedIds.has(b.id));
  const displayAttentionItems: { booking: TerminalBooking; reason: "new" | "late" | "confirmed" }[] = [
    ...activeAttentionItems,
    ...graceConfirmed.map((b) => ({ booking: b, reason: "confirmed" as const })),
  ];
  const attentionCount = activeAttentionItems.length;

  const screen = (
    // The canvas is white. The only other surface this screen may paint is the
    // cool sunken #F4F4F5, and only as a transient row tint. No warm cream
    // anywhere: taste rule 3 bans it by name, and round 6's beige came from an
    // ADMIN PREVIEW banner in DashboardLayout.tsx, which is an internal tool and
    // was never a design decision to copy.
    <div
      className={
        mounted
          ? "fixed inset-0 z-[10000] overflow-y-auto overscroll-contain bg-[#EDEDED]"
          : "relative z-[10000] min-h-[100dvh] w-full bg-[#EDEDED]"
      }
    >
      {/* CHROME. One sticky stack, so the bars cannot overlap each other. */}
      <div className={CHROME_STACK}>
        {/* 2026-08-16, owner: "why is the need you, like, fucking black? It doesn't make sense. And
            how the fuck are you gonna click through hide".
            THE DOT IS GONE. It was an 8px solid ink disc carrying no information the words beside it
            did not already carry, which is exactly what taste rule 2 bans.
            THE WHOLE BAR IS THE CONTROL now, not a small pill at the end of it: the thing you are
            trying to tap is the sentence you just read.
            THE LABEL SAYS WHERE YOU WILL BE, not what happens to the screen. "Hide" describes an
            action on pixels; "Show the whole day" describes the place you land. */}
        <div className={CHROME_ROW + " justify-between"}>
          <span className="font-body min-w-0 flex-1 truncate text-[15px] font-semibold text-s-ink">{salonName}</span>
          <div className="flex shrink-0 items-center gap-4">
            <span className={SMALL + " tabular-nums"}>{zurichTime(new Date().toISOString())}</span>
            <span className={SMALL + " flex items-center gap-1.5"}>
              <span className="h-1.5 w-1.5 rounded-full bg-s-success" />
              Live
            </span>
            <button
              type="button"
              onClick={toggleSound}
              className="font-body flex h-11 items-center text-[13px] font-medium text-s-accent"
            >
              {soundState === "on" ? "Sound on" : soundState === "blocked" ? "Sound blocked" : "Sound off"}
            </button>
          </div>
        </div>
      </div>

      {/* CONTENT. px-6 puts the text 24px off the edge and, because every row
          rule is a border-top on the row child, insets the hairlines to the same
          24px (about 88% of 390), which is the measured divider inset.
          gap-8 = the 32px between sections. Nothing else lives between them. */}
      {/* pb clears the pinned attention card so the last row never sits under it. 96px is the card (72) plus the 16 gap plus the safe area. */}
      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-6 pt-8 pb-[calc(124px+env(safe-area-inset-bottom))]">
        {showingAttention && displayAttentionItems.length > 0 ? (
          <div>
            {/* 2026-08-16: the 28px "{n} need you" heading that used to sit here is DELETED. The
                bar 60px above it already says the same sentence, and a fact appears exactly once
                (the 2026-07-15 operator decision: "a person or event appears in EXACTLY ONE
                place"). He selected both of them in the same message, which is what a duplicated
                fact looks like from the outside. The bar is now the heading for this state. */}
            <ul className={LIST_SHEET}>
              <AnimatePresence initial={false}>
                {displayAttentionItems.map(({ booking, reason }) => (
                  <motion.li
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={BARE_ROW}
                  >
                    <div className="flex items-center gap-3">
                      <span className={SMALL + " w-[46px] shrink-0 tabular-nums"}>{zurichTime(booking.startsAt)}</span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={ROW_NAME + " truncate"}>{booking.customerName}</span>
                        <span className={ROW_SUB + " truncate"}>{booking.serviceName}</span>
                      </span>
                      <span
                        className={
                          // 2026-08-16, owner: "why is a new fucking badge or something fucking
                          // red? It doesn't make any sense."
                          // He is right and the rule is now written down: RED MEANS WRONG, OR IT
                          // COSTS MONEY. A booking arriving is neither. NEW IS NOT A STATE, IT IS
                          // AN AGE, and an age gets no colour at all: it stops being new by itself.
                          // Green stays on Confirmed because green means good, and red stays on
                          // late because late is the thing that actually costs the shop something.
                          "font-body shrink-0 text-[13px] font-medium " +
                          (reason === "new"
                            ? "text-s-ink-2"
                            : reason === "confirmed"
                              ? "text-s-success"
                              : "text-s-error")
                        }
                      >
                        {reason === "new"
                          ? "New"
                          : reason === "confirmed"
                            ? "Confirmed"
                            : `${elapsedMinutes(booking.startsAt)} min late`}
                      </span>
                    </div>
                    {reason === "new" ? (
                      <div className="mt-4 flex gap-2">
                        <button type="button" onClick={() => handleAccept(booking)} className={COMMIT_BUTTON}>
                          Accept
                        </button>
                        <button type="button" onClick={() => handleDecline(booking)} className={SECONDARY_BUTTON}>
                          Decline
                        </button>
                      </div>
                    ) : reason === "late" ? (
                      <div className="mt-4 flex gap-2">
                        <button type="button" onClick={() => handleTheyArrivedLate(booking)} className={COMMIT_BUTTON}>
                          They arrived
                        </button>
                        <button type="button" onClick={() => handleNoShowLate(booking)} className={SECONDARY_BUTTON}>
                          No-show
                        </button>
                      </div>
                    ) : null}
                  </motion.li>
                ))}
              </AnimatePresence>
            </ul>
          </div>
        ) : (
          <>
            {/* 2026-08-17. MEASURED off the reference he named as source of truth, not remembered.
                Airbnb runs a LABEL and a SENTENCE on the same screen and they do different jobs:
                the small label names the room you are in ("Earnings"), and the big line below it is
                a SENTENCE carrying the live number inside it, at 2.2x to 2.9x the body:
                "You've made $0.00 this month"
                (https://mobbin.com/screens/31c6f0ae-6f71-4866-a25d-25a930e3550f).
                Ours read "85 min wait", which is a label with a number stuck to it, and it had no
                title above it at all. Both halves fixed here. */}
            <div>
              <p className={SMALL}>Today</p>
              <p className={ANCHOR + " mt-1"}>
                {waitingActive.length === 0
                  ? "Nobody is waiting"
                  : `The wait is ${maxWait} minutes`}
              </p>
              <p className={SMALL + " mt-2 tabular-nums"}>
                {waitingActive.length === 0
                  ? "Walk-ins go straight to a chair"
                  : `${waitingActive.length} people in the queue`}
              </p>
            </div>

            {/* THE ONE CARD. The chairs earn it because they are the thing being
                looked at: the hero of an operator screen is what the operator
                must act on. Nothing else on this screen wears a box. */}
            <div>
              <h2 className={HEADING}>In the chair</h2>
              <div className={CHAIRS_CARD}>
                <div className="flex gap-4">
                  {staff.map((member) => {
                    const occupant = inChairList.find((q) => q.staffId === member.id) ?? null;
                    const waitingNow = waitingActive[0] ?? null;
                    return (
                      <div key={member.id} className="flex flex-1 flex-col items-center text-center">
                        {/* size="lg" is the same 56px circle as before, but its
                            initials fallback lands on 18 (a ladder size) instead
                            of the 22px a raw numeric size would compute. */}
                        <Avatar src={member.avatarUrl} name={member.name} size="lg" />
                        <p className={ROW_NAME + " mt-4 text-center"}>{member.name}</p>
                        {occupant ? (
                          <>
                            {/* One line, not two. Looking at the WHOLE card and not at each tile
                                on its own: a free tile ends after one line while an occupied tile
                                ran four, which left 107px of dead white under the free chairs and
                                made the one card on the screen read as broken. Who is in the chair
                                and how long they have been there is also a single glanceable fact
                                at arm's length, which is this screen's whole job. */}
                            <p className={SMALL + " mt-1 tabular-nums"}>
                              {firstName(occupant.customerName)},{" "}
                              {elapsedMinutes(occupant.startedAt ?? new Date().toISOString())} min
                            </p>
                            <button
                              type="button"
                              onClick={() => handleDone(occupant, waitingNow?.id ?? null)}
                              className="font-body mt-4 flex h-11 items-center text-[13px] font-medium text-s-ink"
                            >
                              Done
                            </button>
                          </>
                        ) : (
                          // Semantic colour as a small element, never as a surface.
                          <p className="font-body mt-1 text-[13px] font-normal text-s-success">Free</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Bare rows on the canvas. No outer card, no border around the
                group, no shadow. The hairline between rows is the only chrome. */}
            {waitingActive.length > 0 || waitingNoShow.length > 0 ? (
              <div>
                <h2 className={HEADING}>Waiting</h2>
                <ul className={LIST_SHEET}>
                  <AnimatePresence initial={false}>
                    {waitingActive.map((entry) => {
                      const key = `waiting:${entry.id}`;
                      const expanded = expandedWaitingId === key;
                      const tinted = highlightId === entry.id;
                      return (
                        <motion.li
                          key={entry.id}
                          layout
                          initial={{ opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                          className={BARE_ROW + " " + TINT_TRANSITION + (tinted ? TINT_SURFACE : "")}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setExpandedWaitingId(expanded ? null : key)}
                              className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <span className={SMALL + " w-[46px] shrink-0 whitespace-nowrap tabular-nums"}>
                                {entry.ticketCode}
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className={ROW_NAME + " truncate"}>{entry.customerName}</span>
                                <span className={ROW_SUB + " truncate"}>{entry.serviceName}</span>
                              </span>
                              <span className={SMALL_INK + " shrink-0 tabular-nums"}>
                                {entry.estimatedWaitMinutes} min
                              </span>
                            </button>
                            <div className="flex h-11 shrink-0 items-center">
                              <button type="button" onClick={() => handleStart(entry)} className={SECONDARY_BUTTON}>
                                Start
                              </button>
                            </div>
                          </div>
                          {expanded ? (
                            <div className="mt-4 flex items-center gap-4">
                              <button
                                type="button"
                                onClick={() => handleNoShowWaiting(entry)}
                                className={TEXT_ROW_ACTION_DANGER}
                              >
                                No-show
                              </button>
                            </div>
                          ) : null}
                        </motion.li>
                      );
                    })}
                    {waitingNoShow.map((entry) => (
                      <motion.li key={entry.id} layout exit={{ opacity: 0 }} className={BARE_ROW + " opacity-50"}>
                        <div className="flex items-center gap-3">
                          <span className={SMALL + " w-[46px] shrink-0 whitespace-nowrap tabular-nums"}>
                            {entry.ticketCode}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={ROW_NAME + " truncate"}>{entry.customerName}</span>
                            <span className={ROW_SUB + " truncate"}>No-show</span>
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
              </div>
            ) : null}

            {laterTodayActive.length > 0 || noShowBookings.length > 0 ? (
              <div>
                <div className="flex items-center justify-between gap-3">
                  <h2 className={HEADING}>Later today</h2>
                  <span className={SMALL + " shrink-0 tabular-nums"}>{laterTodayActive.length} to go</span>
                </div>
                <ul className={LIST_SHEET}>
                  <AnimatePresence initial={false}>
                    {laterTodayActive.map((booking) => {
                      const isNew = booking.status === "pending_approval";
                      const lateMin = booking.status === "confirmed" ? elapsedMinutes(booking.startsAt) : 0;
                      const isLate = lateMin >= 15;
                      const tinted = tintIds.has(booking.id);
                      return (
                        <motion.li
                          key={booking.id}
                          layout
                          initial={{ opacity: 0, y: -12 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className={BARE_ROW + " " + TINT_TRANSITION + (tinted ? TINT_SURFACE : "")}
                        >
                          <div className="flex items-center gap-3">
                            <span className={SMALL + " w-[46px] shrink-0 tabular-nums"}>
                              {zurichTime(booking.startsAt)}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className={ROW_NAME + " truncate"}>{booking.customerName}</span>
                              <span className={ROW_SUB + " truncate"}>{booking.serviceName}</span>
                            </span>
                            <span className={SMALL_INK + " shrink-0 text-right tabular-nums"}>
                              {isNew ? (
                                // 2026-08-16: New is an AGE, not a state, so it carries no colour.
                                // The second of the two places this badge renders; both changed.
                                <span className="font-medium text-s-ink-2">New</span>
                              ) : isLate ? (
                                <span className="font-medium text-s-error">{lateMin} min late</span>
                              ) : (
                                <>
                                  {chf(booking.price)}
                                  {booking.paymentStatus === "paid" ? (
                                    <span className="mt-1 block text-[13px] font-normal text-s-success">Paid</span>
                                  ) : null}
                                </>
                              )}
                            </span>
                          </div>
                        </motion.li>
                      );
                    })}
                    {noShowBookings.map((booking) => (
                      <motion.li key={booking.id} layout exit={{ opacity: 0 }} className={BARE_ROW + " opacity-50"}>
                        <div className="flex items-center gap-3">
                          <span className={SMALL + " w-[46px] shrink-0 tabular-nums"}>
                            {zurichTime(booking.startsAt)}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={ROW_NAME + " truncate"}>{booking.customerName}</span>
                            <span className={ROW_SUB + " truncate"}>No-show</span>
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {doneQueueCount > 0 ? (
                  <p className={SMALL + " mt-4 tabular-nums"}>{doneQueueCount} done today</p>
                ) : null}
              </div>
            ) : null}

            {waitingActive.length === 0 &&
            waitingNoShow.length === 0 &&
            laterTodayActive.length === 0 &&
            noShowBookings.length === 0 &&
            inChairList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
                <Inbox size={32} strokeWidth={1.5} className="text-s-ink-2" />
                <p className="font-body text-[15px] font-normal text-s-ink-2">Nothing on the books today</p>
              </div>
            ) : null}
          </>
        )}

        <div className="flex justify-center">
          <button
            type="button"
            onClick={handleReplay}
            className="font-body flex h-11 items-center text-[13px] font-normal text-s-ink-2"
          >
            Replay
          </button>
        </div>
      </div>

      {undo ? (
        // boxed-ok: the shared undo affordance, copied verbatim from the shipped
        // one in ../Terminal.tsx. A transient action bar, not a container around
        // any list above it.
        <div className="fixed inset-x-0 bottom-0 z-10 px-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 rounded-full bg-s-ink px-5 py-3">
            <span className="font-body min-w-0 flex-1 truncate text-[15px] font-medium text-white">{undo.message}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="font-body flex h-11 shrink-0 items-center text-[15px] font-semibold text-white underline underline-offset-4"
            >
              Undo
            </button>
          </div>
        </div>
      ) : null}

      {/* 2026-08-17. THE ATTENTION CARD MOVED FROM THE TOP TO THE BOTTOM, and it is measured off
          the reference rather than reasoned about: Airbnb's host home puts the thing needing action
          in a CARD PINNED AT THE BOTTOM, next to the thumb, not in a bar above the fold
          (https://mobbin.com/screens/8249f9ca-1fdc-4f97-870f-974d6811a36c). A counter terminal is
          held or reached across, so the same argument applies with more force.
          It hides while the undo bar is up, because two pinned bars stacked is the 116px of chrome
          he rejected in round 2, in a new position. */}
      {displayAttentionItems.length > 0 && !undo ? (
        <div className="fixed inset-x-0 bottom-0 z-20 px-6 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <button
            type="button"
            onClick={() => setShowingAttention((v) => !v)}
            className="mx-auto flex w-full max-w-[760px] items-center gap-3 rounded-[24px] border border-s-border bg-white px-5 py-4 text-left shadow-elevation"
          >
            <span className="font-body min-w-0 flex-1 truncate text-[15px] font-semibold text-s-ink">
              {attentionLabel(attentionCount)}
            </span>
            <span className={SECONDARY_BUTTON + " pointer-events-none"}>
              {showingAttention ? "Show the whole day" : "Show only these"}
            </span>
          </button>
        </div>
      ) : null}
    </div>
  );

  // Renders in the normal tree on the server and only MOVES into the body
  // portal once mounted, so the server never sends a page with no screen in it.
  if (!mounted) return screen;

  return createPortal(screen, document.body);
}
