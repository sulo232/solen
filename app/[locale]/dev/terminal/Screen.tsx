"use client";

// exists-check: net-new vs app/[locale]/dev/terminal/Terminal.tsx and .../b/B.tsx (both are the
// PRIOR terminal layouts being replaced, explicitly not extended per this build's brief) and vs
// app/[locale]/dev/terminal/page.tsx / loadTerminalData.ts (those stay as-is; page.tsx renders this
// component). The scripted-arrival and chime helpers live in ./prototype.ts rather than being
// re-declared here. components-legacy/ui/FilterBottomSheet.tsx, staff/StaffProfilePage.tsx,
// staff/StaffReviewsSheet.tsx, booking/StaffProfileSheet.tsx and _plans/motion-audit/
// PROFILE_LOYALTY_QUEUE.md are unrelated surfaces. This file is a from-scratch screen for the SAME
// route, replacing the b/B.tsx direction per the owner's rejection of it; b/B.tsx stays on disk
// untouched for comparison, this is not a duplicate of it.
//
// Shape taken from the owner's "weto" reference: a dark top band a white sheet overlaps, big
// left-aligned sentence headings, bare hairline rows with no cards, a floating bottom pill bar, and
// a story-row of circular avatars. Composed only from the Avatar primitive plus the named
// Terminal.tsx helpers; every class string below is hand-written for this screen.
//
// BEHAVIOUR (added 2026-08-17, R6-7): this is the working prototype, not a picture of one. A new
// booking arrives on its own with a sound, every action is reversible for eight seconds, a chair
// can be freed, the four bottom buttons each open a real view, and Replay resets the whole thing.

import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellOff, Clock, LayoutGrid, RotateCcw, Users } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";
import { chf, elapsedMinutes, firstName, zurichTime } from "./Terminal";
import type { TerminalBooking, TerminalQueueEntry, TerminalStaff } from "./Terminal";
import { buildArrivalBooking, getAudioContextCtor, playArrivalChime } from "./prototype";

interface ScreenProps {
  salonName: string;
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
  staff: TerminalStaff[];
}

type NavKey = "board" | "staff" | "clock" | "profile";

interface LogLine {
  id: string;
  at: string;
  text: string;
}

interface Snapshot {
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
  log: LogLine[];
}

// One shared row grammar for every list on this screen: a hairline above, generous vertical air, no
// card, no box. The bare row IS the merchant treatment (TASTE_LOG 2026-07-15).
const ROW = "flex items-center gap-3 border-t border-s-border px-5 py-4 first:border-t-0";
const ROW_LEAD = "font-body text-[13px] font-normal text-s-ink-2";
const ROW_NAME = "font-body mt-0.5 truncate text-[15px] font-medium text-s-ink";
const ROW_SUB = "font-body mt-0.5 truncate text-[13px] font-normal text-s-ink-2";
const ROW_TIME = "font-body text-[13px] font-normal tabular-nums text-s-ink-2";
const SECTION = "font-body px-5 text-[13px] font-semibold text-s-ink-2";
const QUIET_LINE = "font-body px-5 text-[13px] font-normal text-s-ink-2";
// The row-commit rung (CONTROL_ELEVATION.md amendment 2026-07-24): a commit that repeats down a
// peer list stays white + hairline + whisper, so the single ink fill stays the one page commit.
const ROW_BUTTON =
  "font-body flex h-11 items-center justify-center rounded-full border border-s-border bg-white px-4 text-[15px] font-semibold text-s-ink shadow-whisper";
// The only non-white surface this screen paints, and only for a second and a half.
const TINT = "transition-colors duration-500";

export default function Screen({ salonName, bookings: initialBookings, queue: initialQueue, staff }: ScreenProps) {
  const [bookings, setBookings] = useState<TerminalBooking[]>(initialBookings);
  const [queue, setQueue] = useState<TerminalQueueEntry[]>(initialQueue);
  const [log, setLog] = useState<LogLine[]>([]);
  const [activeNav, setActiveNav] = useState<NavKey>("board");
  const [mounted, setMounted] = useState(false);
  const [soundOn, setSoundOn] = useState(false);
  const [undo, setUndo] = useState<{ message: string } | null>(null);
  const [history, setHistory] = useState<Snapshot[]>([]);
  const [freshId, setFreshId] = useState<string | null>(null);
  const [replayKey, setReplayKey] = useState(0);
  const [, forceTick] = useState(0);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const usedNamesRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    setMounted(true);
  }, []);

  // Only the in-chair elapsed minutes are derived from the wall clock, and a minute is the smallest
  // unit any of them render, so 15s is as often as this can possibly change anything on screen.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  const addToLog = useCallback((text: string) => {
    setLog((prev) => [{ id: `log-${prev.length}-${Date.now()}`, at: new Date().toISOString(), text }, ...prev]);
  }, []);

  const addArrival = useCallback(
    (seq: number) => {
      const booking = buildArrivalBooking(seq, initialBookings, staff, usedNamesRef.current);
      setBookings((prev) => [booking, ...prev]);
      setFreshId(booking.id);
      setTimeout(() => setFreshId((cur) => (cur === booking.id ? null : cur)), 1500);
      addToLog(`${booking.customerName} booked ${booking.serviceName}`);
      if (soundOn && audioCtxRef.current) playArrivalChime(audioCtxRef.current);
    },
    [initialBookings, staff, soundOn, addToLog],
  );

  // The two scripted arrivals, 6s then 20s after that. Rescheduled by Replay.
  useEffect(() => {
    const t1 = setTimeout(() => addArrival(0), 6_000);
    const t2 = setTimeout(() => addArrival(1), 26_000);
    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
    };
  }, [replayKey, addArrival]);

  // Every action is reversible for eight seconds and then it is not, which is the honest version:
  // an undo that lives forever is a second source of truth.
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8_000);
    return () => clearTimeout(t);
  }, [undo]);

  function snapshot() {
    setHistory((prev) => [{ bookings, queue, log }, ...prev].slice(0, 20));
  }

  function handleUndo() {
    const [last, ...rest] = history;
    if (!last) return;
    setBookings(last.bookings);
    setQueue(last.queue);
    setLog(last.log);
    setHistory(rest);
    setUndo(null);
  }

  async function toggleSound() {
    if (soundOn) {
      setSoundOn(false);
      return;
    }
    try {
      if (!audioCtxRef.current) {
        const Ctor = getAudioContextCtor();
        if (!Ctor) return;
        audioCtxRef.current = new Ctor();
      }
      await audioCtxRef.current.resume();
      playArrivalChime(audioCtxRef.current);
      setSoundOn(true);
    } catch (err) {
      console.error("[Terminal] could not start the arrival sound:", err);
    }
  }

  function handleReplay() {
    usedNamesRef.current = new Set();
    setBookings(initialBookings);
    setQueue(initialQueue);
    setLog([]);
    setHistory([]);
    setUndo(null);
    setFreshId(null);
    setActiveNav("board");
    setReplayKey((k) => k + 1);
  }

  function handleAccept(booking: TerminalBooking) {
    snapshot();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: "confirmed" } : b)));
    addToLog(`${booking.customerName} confirmed`);
    setUndo({ message: `${firstName(booking.customerName)} confirmed` });
  }

  function handleDecline(booking: TerminalBooking) {
    snapshot();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b)));
    addToLog(`${booking.customerName} declined`);
    setUndo({ message: `${firstName(booking.customerName)} declined` });
  }

  // Start must MOVE the person, not delete them. The staff row shows who is in each chair by
  // matching `q.staffId === member.id`, so a start that leaves staffId null drops the customer off
  // the waiting list and out of every other list at once. Caught in verification 2026-08-17.
  function handleStart(entry: TerminalQueueEntry) {
    const occupied = new Set(
      queue.filter((q) => q.status === "in_chair" && q.staffId).map((q) => q.staffId as string),
    );
    const free = staff.find((member) => !occupied.has(member.id));
    if (!free) return;
    snapshot();
    setQueue((prev) =>
      prev.map((q) =>
        q.id === entry.id
          ? { ...q, status: "in_chair", staffId: free.id, startedAt: new Date().toISOString() }
          : q,
      ),
    );
    addToLog(`${entry.customerName} started with ${firstName(free.name)}`);
    setUndo({ message: `${firstName(entry.customerName)} started` });
  }

  function handleDone(entry: TerminalQueueEntry) {
    snapshot();
    setQueue((prev) => prev.map((q) => (q.id === entry.id ? { ...q, status: "done", staffId: null } : q)));
    addToLog(`${entry.customerName} done`);
    setUndo({ message: `${firstName(entry.customerName)} done` });
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending_approval");
  const waitingQueue = [...queue]
    .filter((q) => q.status === "waiting")
    .sort((a, b) => a.position - b.position);
  const todaysBookings = [...bookings]
    .filter((b) => b.status !== "pending_approval" && b.status !== "cancelled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const doneCount = queue.filter((q) => q.status === "done").length;
  const bookedToday = todaysBookings.reduce((sum, b) => sum + (b.price ?? 0), 0);

  const chairOf = (memberId: string) =>
    queue.find((q) => q.staffId === memberId && q.status === "in_chair") ?? null;
  const freeChairs = staff.filter((member) => !chairOf(member.id)).length;
  const aChairIsFree = freeChairs > 0;

  const waitMinutes = waitingQueue.length ? Math.max(...waitingQueue.map((q) => q.estimatedWaitMinutes)) : 0;

  const navButtons: { key: NavKey; icon: typeof LayoutGrid; label: string }[] = [
    { key: "board", icon: LayoutGrid, label: "Board" },
    { key: "staff", icon: Users, label: "Chairs" },
    { key: "clock", icon: Clock, label: "Log" },
  ];

  const headline =
    activeNav === "board"
      ? waitingQueue.length === 0
        ? "Nobody is waiting"
        : `The wait is ${waitMinutes} minutes`
      : activeNav === "staff"
        ? freeChairs === 0
          ? "Every chair is busy"
          : `${freeChairs} of ${staff.length} chairs are free`
        : activeNav === "clock"
          ? "Everything that happened"
          : salonName;

  const subline =
    activeNav === "board"
      ? `${waitingQueue.length} people in the queue`
      : activeNav === "staff"
        ? `${staff.length} people working today`
        : activeNav === "clock"
          ? `${log.length} things so far`
          : "This screen, signed in and left open";

  const screen = (
    <div className={mounted ? "fixed inset-0 z-[10000] overflow-y-auto bg-white" : "relative z-[10000] min-h-[100dvh] w-full bg-white"}>
      {/* Dark band the white sheet overlaps. Both buttons do something: a control that is only a
          costume is a dead affordance, and this screen has none. */}
      <div className="relative flex h-[110px] items-center justify-center bg-s-ink px-4">
        <button
          type="button"
          aria-label="Replay the demo"
          onClick={handleReplay}
          className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full text-white"
        >
          <RotateCcw size={22} strokeWidth={1.75} />
        </button>
        <span className="font-heading truncate px-14 text-[18px] font-semibold text-white">{salonName}</span>
        <button
          type="button"
          aria-label={soundOn ? "Turn the arrival sound off" : "Turn the arrival sound on"}
          onClick={toggleSound}
          className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full text-white"
        >
          {soundOn ? <Bell size={22} strokeWidth={1.75} /> : <BellOff size={22} strokeWidth={1.75} />}
        </button>
      </div>

      {/* Sheet: overlaps the band by 20px, very round top corners, drag handle. */}
      <div className="relative z-10 -mt-5 min-h-[calc(100dvh-90px)] rounded-t-[32px] bg-white pb-[calc(96px+env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-[10px] h-1 w-9 rounded-full bg-s-border" />

        {/* Staff row: full-bleed horizontal scroll of circular avatars. The board's own answer to
            "who is in a chair", so it belongs to the board and not to every view. */}
        {activeNav === "board" && (
          <div className="overflow-x-auto no-scrollbar">
            <div className="flex gap-4 px-5 pb-1 pt-5">
              {staff.map((member) => {
                const inChair = chairOf(member.id);
                return (
                  <div key={member.id} className="flex w-[64px] shrink-0 flex-col items-center text-center">
                    <Avatar src={member.avatarUrl} name={member.name} size={56} />
                    <p className="font-body mt-2 w-full truncate text-[13px] font-medium text-s-ink">
                      {firstName(member.name)}
                    </p>
                    <p
                      className={
                        "font-body w-full truncate text-[13px] font-normal " +
                        (inChair ? "text-s-ink-2" : "text-s-success")
                      }
                    >
                      {inChair ? firstName(inChair.customerName) : "Free"}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Headline block. One 30px anchor per view, never two. */}
        <div className={activeNav === "board" ? "px-5 pt-6" : "px-5 pt-7"}>
          <h1 className="font-heading text-[30px] font-semibold leading-[1.1] text-s-ink">{headline}</h1>
          <p className="font-body mt-1 text-[13px] font-normal text-s-ink-2">{subline}</p>
          {undo && (
            <div className="mt-2 flex items-center gap-3">
              <p className="font-body text-[13px] font-normal text-s-ink-2">{undo.message}</p>
              <button
                type="button"
                onClick={handleUndo}
                className="font-body flex h-11 items-center text-[13px] font-medium text-s-accent"
              >
                Undo
              </button>
            </div>
          )}
        </div>

        {activeNav === "board" && (
          <>
            {/* The one decision that needs to stay alive. Rendered from a .map() because more than
                one booking can be waiting on a decision at once, which is exactly what happens when
                the second scripted arrival lands before the first is answered. */}
            {pendingBookings.length > 0 && (
              <div className="mt-6">
                {pendingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className={
                      "border-b border-s-border px-5 pb-5 pt-1 " +
                      TINT +
                      (freshId === booking.id ? " bg-s-bg-sunken" : " bg-white")
                    }
                  >
                    <p className="font-body text-[13px] font-semibold text-s-ink-2">Needs a decision</p>
                    <p className="font-body mt-2 truncate text-[15px] font-medium text-s-ink">
                      {booking.customerName}
                    </p>
                    <p className={ROW_SUB}>
                      {booking.serviceName} at {zurichTime(booking.startsAt)}
                    </p>
                    <div className="mt-3 flex gap-3">
                      <button type="button" onClick={() => handleAccept(booking)} className="font-body flex h-11 flex-1 items-center justify-center rounded-full bg-s-ink text-[15px] font-semibold text-white">Accept</button> {/* row-ink-ok: the single page-level "needs a decision" commit, not a peer-list row */}
                      <button
                        type="button"
                        onClick={() => handleDecline(booking)}
                        className="font-body flex h-11 w-[120px] items-center justify-center rounded-full border border-s-border bg-white text-[15px] font-medium text-s-ink"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Waiting. */}
            <div className="mt-6">
              <p className={SECTION}>Waiting</p>
              {/* Start is disabled while every chair is taken, so the screen has to say why rather
                  than hand the counter a button that does nothing. Renders only when it is true. */}
              {waitingQueue.length > 0 && !aChairIsFree && (
                <p className={QUIET_LINE + " pt-1"}>Every chair is full. Finish someone in Chairs to free one.</p>
              )}
              {waitingQueue.length === 0 ? (
                <p className={QUIET_LINE + " pt-3"}>Nobody is waiting right now.</p>
              ) : (
                <ul>
                  {waitingQueue.map((entry) => (
                    <li key={entry.id} className={ROW}>
                      <div className="min-w-0 flex-1">
                        <p className={ROW_LEAD}>#{entry.ticketCode}</p>
                        <p className={ROW_NAME}>{entry.customerName}</p>
                        <p className={ROW_SUB}>{entry.serviceName}</p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        <span className={ROW_TIME}>{entry.estimatedWaitMinutes} min</span>
                        <button
                          type="button"
                          onClick={() => handleStart(entry)}
                          disabled={!aChairIsFree}
                          className={ROW_BUTTON + (aChairIsFree ? "" : " opacity-50 cursor-not-allowed")}
                        >
                          Start
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            {/* Today. */}
            <div className="mt-6">
              <p className={SECTION}>Today</p>
              {todaysBookings.length === 0 ? (
                <p className={QUIET_LINE + " pt-3"}>Nothing else booked today.</p>
              ) : (
                <ul>
                  {todaysBookings.map((booking) => (
                    <li key={booking.id} className={ROW}>
                      <div className="min-w-0 flex-1">
                        <p className={ROW_TIME}>{zurichTime(booking.startsAt)}</p>
                        <p className={ROW_NAME}>{booking.customerName}</p>
                        <p className={ROW_SUB}>{booking.serviceName}</p>
                      </div>
                      <span className="font-body shrink-0 text-[13px] font-medium tabular-nums text-s-ink">
                        {chf(booking.price)}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </>
        )}

        {/* Chairs: the one place a chair gets freed, which is why Start can tell the counter to come
            here when everything is full. */}
        {activeNav === "staff" && (
          <div className="mt-6">
            <ul>
              {staff.map((member) => {
                const inChair = chairOf(member.id);
                return (
                  <li key={member.id} className={ROW}>
                    <Avatar src={member.avatarUrl} name={member.name} size={44} />
                    <div className="min-w-0 flex-1">
                      <p className="font-body truncate text-[15px] font-medium text-s-ink">{member.name}</p>
                      <p
                        className={
                          "font-body mt-0.5 truncate text-[13px] font-normal " +
                          (inChair ? "text-s-ink-2" : "text-s-success")
                        }
                      >
                        {/* startedAt is nullable in the data, and a made-up elapsed time on a row
                            that never recorded one is exactly the fabrication rule. Name only. */}
                        {inChair
                          ? inChair.startedAt
                            ? `${inChair.customerName}, ${elapsedMinutes(inChair.startedAt)} min in the chair`
                            : inChair.customerName
                          : "Free"}
                      </p>
                    </div>
                    {inChair && (
                      <button type="button" onClick={() => handleDone(inChair)} className={ROW_BUTTON}>
                        Done
                      </button>
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {/* Log: what he asked for by name, "they can choose to actually have, like, logs and stuff".
            Every action this screen took, newest first, with the time it happened. */}
        {activeNav === "clock" && (
          <div className="mt-6">
            {log.length === 0 ? (
              <p className={QUIET_LINE}>
                Nothing has happened yet. Every accept, start and finish lands here with its time.
              </p>
            ) : (
              <ul>
                {log.map((line) => (
                  <li key={line.id} className={ROW}>
                    <span className={ROW_TIME + " w-[52px] shrink-0"}>{zurichTime(line.at)}</span>
                    <p className="font-body min-w-0 flex-1 text-[15px] font-medium text-s-ink">{line.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* This screen. Real derived numbers and an honest line about what is not wired yet. */}
        {activeNav === "profile" && (
          <div className="mt-6">
            <ul>
              <li className={ROW}>
                <p className="font-body min-w-0 flex-1 text-[15px] font-medium text-s-ink">Finished today</p>
                <span className="font-body shrink-0 text-[15px] font-medium tabular-nums text-s-ink">
                  {doneCount}
                </span>
              </li>
              <li className={ROW}>
                <p className="font-body min-w-0 flex-1 text-[15px] font-medium text-s-ink">Booked today</p>
                <span className="font-body shrink-0 text-[15px] font-medium tabular-nums text-s-ink">
                  {chf(bookedToday)}
                </span>
              </li>
              <li className={ROW}>
                <p className="font-body min-w-0 flex-1 text-[15px] font-medium text-s-ink">Arrival sound</p>
                <span className="font-body shrink-0 text-[15px] font-medium text-s-ink">
                  {soundOn ? "On" : "Off"}
                </span>
              </li>
            </ul>
            <p className={QUIET_LINE + " pt-4"}>
              Bookings arrive on a script here. Live arrivals need the realtime publication, which is
              the one thing this screen is still waiting on.
            </p>
          </div>
        )}
      </div>

      {/* Floating bottom pill bar. */}
      <div className="fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto flex max-w-[360px] items-center justify-between rounded-full bg-white px-3 py-2 shadow-elevation-2">
          {navButtons.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              aria-label={label}
              aria-current={activeNav === key ? "page" : undefined}
              onClick={() => setActiveNav(key)}
              className={
                "flex h-11 w-11 items-center justify-center rounded-full " +
                (activeNav === key ? "bg-s-bg-sunken" : "")
              }
            >
              <Icon size={20} strokeWidth={1.75} className="text-s-ink" />
            </button>
          ))}
          <button
            type="button"
            aria-label="This screen"
            aria-current={activeNav === "profile" ? "page" : undefined}
            onClick={() => setActiveNav("profile")}
            className={
              "flex h-11 w-11 items-center justify-center rounded-full " +
              (activeNav === "profile" ? "bg-s-bg-sunken" : "")
            }
          >
            {staff[0] ? (
              <Avatar src={staff[0].avatarUrl} name={staff[0].name} size={36} />
            ) : (
              <Avatar name="?" size={36} />
            )}
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return screen;
  return createPortal(screen, document.body);
}
