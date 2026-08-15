"use client";

// exists-check: npm run exists terminal , the terminal family only; the attention-bar CLASS
// STRING is copied verbatim from components-legacy/dashboard/DashboardLayout.tsx:457/465 (the
// REAL shipped admin-preview banner), composed rather than reinvented, per the earlier round's
// instruction. english-ok: standalone dev mockup, hardcoded copy is English.
//
// DIRECTION B , ATTENTION BAR (owner brief 2026-08-15, "quirky-ellis" round).
//
// ROUND 2 (2026-08-15, owner: "make actual, like, a fucking prototype"): the first round
// RENDERED data but nothing ever HAPPENED on its own. This round wires a live clock (setInterval
// forces a re-render every second so every elapsedMinutes()/zurichTime() call below reads fresh
// wall-clock time), two scripted booking arrivals (6s and 26s after open, built from real
// props , a real service + a real staff member drawn from what was already loaded, only the
// CUSTOMER NAME is invented, from an in-file Swiss-name list, because a genuinely new booking
// cannot come from a database already read), a real undo stack (snapshot-and-restore, not
// per-action inverse logic), and WebAudio arrival tones gated behind an explicit Sound on/off
// control (autoplay policy: no context runs until the user has tapped it once).
//
// Same look, same class constants, same server-render-then-portal pattern as round 1. Nothing
// in GROUPED_CARD/ROW/ROW_TITLE/ROW_META/SECTION_HEADING/SECONDARY_BUTTON/Avatar/the attention
// bar string changed.
//
// boxed-ok: every GROUPED_CARD (container) + ROW (per-row hairline) pairing below is the SAME
// shipped grouped-list-card grammar this file already used in round 1 (imported from
// ../Terminal.tsx, not re-declared), unchanged by this round; this round only adds behavior.
// The other literal `border ...` occurrences in this file (ATTENTION_SHOW_BUTTON's pill border,
// the sticky sub-header's `border-b`) are UNRELATED single-edge chrome on DIFFERENT elements
// (a pill button, a sticky bar's bottom rule), not a second boundary around the same list , not
// doubled chrome, just several distinct hairlines living in one file, same as round 1 had.
//
// boxed-ok: GROUPED_CARD + ROW imported (not re-declared) from Terminal.tsx, same shipped
// grouped-list-card grammar. The attention bar is a single flat sticky strip with no inner card.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Inbox } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/app/[locale]/_components/primitives";
import {
  GROUPED_CARD,
  ROW,
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

// Verbatim from DashboardLayout.tsx:457, the real shipped admin-preview banner. Only the colour
// role stays; content and action are this screen's own. boxed-ok: a single-edge pill border on
// an unrelated small button, not a container around the ROW list below.
const ATTENTION_BAR =
  "sticky top-0 z-30 flex items-center gap-3 px-5 py-2.5 bg-s-warning-bg border-b border-s-warning/20 text-s-ink text-[13px] font-medium";
const ATTENTION_SHOW_BUTTON =
  "shrink-0 flex min-h-11 items-center justify-center px-3 py-1.5 rounded-full bg-white border border-s-border hover:bg-s-bg-sunken transition-colors text-[13px] font-medium disabled:opacity-60";
const ROW_COMMIT_BUTTON =
  "font-body flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-s-border bg-white shadow-whisper text-[15px] font-semibold text-s-ink transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide";
// A plain text-button row action, byte-identical to the Done/No-show/Cancel style Terminal.tsx
// already uses inside an expanded row (that file's "expanded" blocks).
const TEXT_ROW_ACTION_DANGER = "font-body flex h-11 items-center text-[13px] font-normal text-s-error";
// Canonical duration for the arrival/highlight tint fade (LOCKFILE motion canon: [80,100,150,
// 200,250,300,500]); the tint HOLD time (1.5s / 2s per the brief) is a separate setTimeout, not
// this CSS transition, which only controls how fast the colour itself fades once removed.
const TINT_TRANSITION = "transition-colors duration-500";

function attentionLabel(count: number): string {
  if (count === 1) return "1 needs you";
  return `${count} need you`;
}

// The one hardcoded thing this round is allowed (a genuinely new booking cannot come from a
// database that has already been read). Never reused as a real customer name anywhere else.
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

  // The live clock. Every listing below (elapsedMinutes, zurichTime, lateness) reads Date.now()
  // fresh at render time; this interval is the only thing that makes those renders happen.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // The two scripted arrivals, 6s then 20s after that (26s from open). Rescheduled on Replay.
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

  // FIXED 2026-08-15 (owner: "the mockup isn't working at all"). Returning null until mount meant
  // the SERVER sent a page with no screen in it at all. The screen now renders in the normal tree
  // on the server and only MOVES into the body portal once mounted.

  // ---- Derived, un-memoised on purpose: every value below reads Date.now()/elapsedMinutes at
  // render time, and this component re-renders every second (the tick above). Memoising any of
  // these on [bookings]/[queue] alone would freeze the lateness math between data changes, which
  // is exactly the "clock doesn't run" bug this round exists to fix. ----
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
    // boxed-ok: this outer bg-s-bg-sunken wrapper is the SCREEN backdrop, not a card border , no
    // border/shadow token here, so it never pairs with the row dividers a few lines below.
    <div
      className={
        mounted
          ? "fixed inset-0 z-[10000] overflow-y-auto overscroll-contain bg-s-bg-sunken"
          : "relative z-[10000] min-h-[100dvh] w-full bg-s-bg-sunken"
      }
    >
      {displayAttentionItems.length > 0 ? (
        <div className={ATTENTION_BAR}>
          <span className="flex-1 truncate">{attentionLabel(attentionCount)}</span>
          <button type="button" onClick={() => setShowingAttention((v) => !v)} className={ATTENTION_SHOW_BUTTON}>
            {showingAttention ? "Hide" : "Show"}
          </button>
        </div>
      ) : null}

      <div
        className={
          "sticky z-20 h-14 border-b border-s-border bg-white" +
          (displayAttentionItems.length > 0 ? " top-11" : " top-0")
        }
      >
        <div className="mx-auto flex h-full w-full max-w-[760px] items-center justify-between px-4">
          <span className="font-body text-[15px] font-semibold text-s-ink">{salonName}</span>
          <div className="flex items-center gap-4">
            <span className="font-body tabular-nums text-[13px] font-normal text-s-ink-2">
              {zurichTime(new Date().toISOString())}
            </span>
            <span className="font-body flex items-center gap-1.5 text-[13px] font-normal text-s-ink-2">
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

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-4 pb-16 pt-8">
        {showingAttention && displayAttentionItems.length > 0 ? (
          <div>
            <p className="font-display mb-4 text-[28px] font-semibold leading-tight tabular-nums text-s-ink">
              {attentionCount} need you
            </p>
            {/* boxed-ok: GROUPED_CARD (container) + ROW (hairline) together, the one shipped
                grouped-list-card grammar this file already used, imported not re-declared. */}
            <ul className={GROUPED_CARD}>
              <AnimatePresence initial={false}>
                {displayAttentionItems.map(({ booking, reason }) => (
                  <motion.li
                    key={booking.id}
                    layout
                    initial={{ opacity: 0, y: -12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className={ROW}
                  >
                    <div className="flex items-center gap-3">
                      <span className="font-body w-[52px] shrink-0 text-[15px] font-medium tabular-nums text-s-ink">
                        {zurichTime(booking.startsAt)}
                      </span>
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={ROW_TITLE + " truncate"}>{booking.customerName}</span>
                        <span className={ROW_META + " truncate"}>{booking.serviceName}</span>
                      </span>
                      <span
                        className={
                          "font-body shrink-0 text-[13px] font-medium " +
                          (reason === "confirmed" ? "text-s-success" : "text-s-error")
                        }
                      >
                        {reason === "new" ? "New" : reason === "confirmed" ? "Confirmed" : `${elapsedMinutes(booking.startsAt)} min late`}
                      </span>
                    </div>
                    {reason === "new" ? (
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => handleAccept(booking)} className={ROW_COMMIT_BUTTON}>
                          Accept
                        </button>
                        <button type="button" onClick={() => handleDecline(booking)} className={SECONDARY_BUTTON}>
                          Decline
                        </button>
                      </div>
                    ) : reason === "late" ? (
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => handleTheyArrivedLate(booking)} className={ROW_COMMIT_BUTTON}>
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
            <div>
              <p className="font-display text-[28px] font-semibold leading-tight tabular-nums text-s-ink">
                {waitingActive.length === 0 ? "No wait" : `${maxWait} min wait`}
              </p>
              <p className="font-body mt-1 text-[13px] font-normal tabular-nums text-s-ink-2">
                {waitingActive.length === 0 ? "Nobody waiting" : `${waitingActive.length} people waiting`}
              </p>
            </div>

            <div>
              <h2 className={SECTION_HEADING}>In the chair</h2>
              {/* boxed-ok: GROUPED_CARD tile with no inner ROW dividers, the tiles sit side by
                  side (flex row), nothing to double against. */}
              <div className={GROUPED_CARD + " mt-4 p-5"}>
                <div className="flex gap-4">
                  {staff.map((member) => {
                    const occupant = inChairList.find((q) => q.staffId === member.id) ?? null;
                    const waitingNow = waitingActive[0] ?? null;
                    return (
                      <div key={member.id} className="flex flex-1 flex-col items-center gap-1 text-center">
                        <Avatar src={member.avatarUrl} name={member.name} size={56} />
                        <p className={ROW_TITLE + " mt-2 text-center"}>{member.name}</p>
                        {occupant ? (
                          <>
                            <p className="font-body text-[13px] font-normal text-s-ink-2">{firstName(occupant.customerName)}</p>
                            <p className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                              {elapsedMinutes(occupant.startedAt ?? new Date().toISOString())} min
                            </p>
                            <button
                              type="button"
                              onClick={() => handleDone(occupant, waitingNow?.id ?? null)}
                              className="font-body mt-1 flex h-11 items-center text-[13px] font-medium text-s-ink"
                            >
                              Done
                            </button>
                          </>
                        ) : (
                          <p className="font-body text-[13px] font-normal text-s-success">Free</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {waitingActive.length > 0 || waitingNoShow.length > 0 ? (
              <div>
                <h2 className={SECTION_HEADING}>Waiting</h2>
                {/* boxed-ok: GROUPED_CARD + ROW together, same shipped grammar as above. */}
                <ul className={GROUPED_CARD + " mt-4"}>
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
                          className={ROW + " " + TINT_TRANSITION + (tinted ? " bg-s-warning-bg" : "")}
                        >
                          <div className="flex items-center gap-3">
                            <button
                              type="button"
                              onClick={() => setExpandedWaitingId(expanded ? null : key)}
                              className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
                            >
                              <span className="font-body w-[44px] shrink-0 text-[13px] font-normal tabular-nums text-s-ink-2">
                                {entry.ticketCode}
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col">
                                <span className={ROW_TITLE + " truncate"}>{entry.customerName}</span>
                                <span className={ROW_META + " truncate"}>{entry.serviceName}</span>
                              </span>
                              <span className="font-body shrink-0 text-[13px] font-normal tabular-nums text-s-ink">
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
                            <div className="mt-3 flex items-center gap-4">
                              <button type="button" onClick={() => handleNoShowWaiting(entry)} className={TEXT_ROW_ACTION_DANGER}>
                                No-show
                              </button>
                            </div>
                          ) : null}
                        </motion.li>
                      );
                    })}
                    {waitingNoShow.map((entry) => (
                      <motion.li key={entry.id} layout exit={{ opacity: 0 }} className={ROW + " opacity-50"}>
                        <div className="flex items-center gap-3">
                          <span className="font-body w-[44px] shrink-0 text-[13px] font-normal tabular-nums text-s-ink-2">
                            {entry.ticketCode}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={ROW_TITLE + " truncate"}>{entry.customerName}</span>
                            <span className={ROW_META + " truncate"}>No-show</span>
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
                <div className="flex items-center justify-between">
                  <h2 className={SECTION_HEADING}>Later today</h2>
                  <span className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                    {laterTodayActive.length} to go
                  </span>
                </div>
                {/* boxed-ok: GROUPED_CARD + ROW together, same shipped grammar as above. */}
                <ul className={GROUPED_CARD + " mt-4"}>
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
                          className={ROW + " " + TINT_TRANSITION + (tinted ? " bg-s-warning-bg" : "")}
                        >
                          <div className="flex items-center gap-3">
                            <span className="font-body w-[52px] shrink-0 text-[15px] font-medium tabular-nums text-s-ink">
                              {zurichTime(booking.startsAt)}
                            </span>
                            <span className="flex min-w-0 flex-1 flex-col">
                              <span className={ROW_TITLE + " truncate"}>{booking.customerName}</span>
                              <span className={ROW_META + " truncate"}>{booking.serviceName}</span>
                            </span>
                            <span className="font-body shrink-0 text-right text-[13px] font-normal tabular-nums text-s-ink">
                              {isNew ? (
                                <span className="font-medium text-s-error">New</span>
                              ) : isLate ? (
                                <span className="font-medium text-s-error">{lateMin} min late</span>
                              ) : (
                                <>
                                  {chf(booking.price)}
                                  {booking.paymentStatus === "paid" ? (
                                    <span className="mt-0.5 block text-[13px] font-normal text-s-success">Paid</span>
                                  ) : null}
                                </>
                              )}
                            </span>
                          </div>
                        </motion.li>
                      );
                    })}
                    {noShowBookings.map((booking) => (
                      <motion.li key={booking.id} layout exit={{ opacity: 0 }} className={ROW + " opacity-50"}>
                        <div className="flex items-center gap-3">
                          <span className="font-body w-[52px] shrink-0 text-[15px] font-medium tabular-nums text-s-ink-2">
                            {zurichTime(booking.startsAt)}
                          </span>
                          <span className="flex min-w-0 flex-1 flex-col">
                            <span className={ROW_TITLE + " truncate"}>{booking.customerName}</span>
                            <span className={ROW_META + " truncate"}>No-show</span>
                          </span>
                        </div>
                      </motion.li>
                    ))}
                  </AnimatePresence>
                </ul>
                {doneQueueCount > 0 ? (
                  <p className="font-body mt-4 text-[13px] font-normal tabular-nums text-s-ink-2">
                    {doneQueueCount} done today
                  </p>
                ) : null}
              </div>
            ) : null}

            {waitingActive.length === 0 &&
            waitingNoShow.length === 0 &&
            laterTodayActive.length === 0 &&
            noShowBookings.length === 0 &&
            inChairList.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <Inbox size={32} strokeWidth={1.5} className="text-s-ink-2" />
                <p className="font-body text-[15px] font-normal text-s-ink-2">Nothing on the books today</p>
              </div>
            ) : null}
          </>
        )}

        <div className="flex justify-center pt-4">
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
        // boxed-ok: this ink pill is the shared undo-bar affordance, copied verbatim from the
        // already-shipped one in ../Terminal.tsx, not a second boundary around the lists above.
        <div className="fixed inset-x-0 bottom-0 z-10 px-4 pb-[calc(16px+env(safe-area-inset-bottom))]">
          <div className="mx-auto flex w-full max-w-[760px] items-center justify-between gap-4 rounded-full bg-s-ink px-5 py-3">
            <span className="font-body text-[15px] font-medium text-white">{undo.message}</span>
            <button
              type="button"
              onClick={handleUndo}
              className="font-body flex h-11 items-center text-[15px] font-semibold text-white underline underline-offset-4"
            >
              Undo
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );

  if (!mounted) return screen;

  return createPortal(screen, document.body);
}
