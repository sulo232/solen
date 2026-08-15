"use client";

// exists-check: net-new vs lib/referral/code.ts (unrelated referral-code generator, only
// keyword-matched on "code"). This file is the merchant terminal client UI, no relation.
// english-ok: this is a standalone dev mockup, all hardcoded copy is English per the mockup rule.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Bell, BellOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";

export interface TerminalBooking {
  id: string;
  startsAt: string;
  endsAt: string;
  status: string;
  customerName: string;
  serviceName: string;
  price: number;
  paymentStatus: string;
  createdAt: string;
  staffId: string | null;
  staffName: string | null;
}

export interface TerminalQueueEntry {
  id: string;
  customerName: string;
  status: string;
  position: number;
  ticketCode: string;
  estimatedWaitMinutes: number;
  startedAt: string | null;
  serviceName: string;
  staffId: string | null;
  staffName: string | null;
}

export interface TerminalStaff {
  id: string;
  name: string;
  avatarUrl: string | null;
}

interface TerminalProps {
  salonName: string;
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
  staff: TerminalStaff[];
}

type Variant = "quiet" | "new" | "move";

const MOVE_TIME_CHIPS = ["09:45", "10:30", "11:15", "12:00", "12:45", "15:15", "16:45", "18:15"];

function chf(amount: number): string {
  return `CHF ${amount.toFixed(2)}`;
}

function zurichTime(iso: string): string {
  return new Date(iso).toLocaleTimeString("en-GB", {
    timeZone: "Europe/Zurich",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
}

function elapsedMinutes(iso: string): number {
  return Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
}

// The 24 hour window is not invented: app/api/cron/pending-timeout cancels any booking left in
// pending_approval for longer than that. This counts down against the row's own created_at.
const PENDING_TIMEOUT_MS = 24 * 60 * 60 * 1000;

function expiresIn(createdAtIso: string): string {
  const left = new Date(createdAtIso).getTime() + PENDING_TIMEOUT_MS - Date.now();
  if (left <= 0) return "Expired";
  const h = Math.floor(left / 3_600_000);
  const m = Math.floor((left % 3_600_000) / 60_000);
  return `Expires in ${h}h ${m}m`;
}

function firstName(fullName: string): string {
  return fullName.split(" ")[0] ?? fullName;
}

export default function Terminal({ salonName, bookings: initialBookings, queue: initialQueue, staff }: TerminalProps) {
  const [variant, setVariant] = useState<Variant>("quiet");
  const [bookings, setBookings] = useState<TerminalBooking[]>(initialBookings);
  const [queue, setQueue] = useState<TerminalQueueEntry[]>(initialQueue);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [moveBookingId, setMoveBookingId] = useState<string | null>(null);
  const [selectedChip, setSelectedChip] = useState<string | null>(null);
  const [bellOn, setBellOn] = useState(true);
  const [queuePaused, setQueuePaused] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    // The page behind the overlay must not scroll under it.
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, []);

  const pendingBooking = useMemo(
    () => bookings.find((b) => b.status === "pending_approval") ?? null,
    [bookings]
  );

  const waiting = useMemo(
    () => queue.filter((q) => q.status === "waiting").sort((a, b) => a.position - b.position),
    [queue]
  );

  const inChair = useMemo(() => queue.find((q) => q.status === "in_chair") ?? null, [queue]);

  // "Later today" means what is still to come. A finished appointment is not "later", so the
  // completed ones drop out of the list and survive only as a count under it.
  const laterToday = useMemo(
    () =>
      bookings
        .filter((b) => b.status === "confirmed")
        .sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [bookings]
  );

  const doneCount = useMemo(
    () => bookings.filter((b) => b.status === "completed").length,
    [bookings]
  );

  const freeCount = staff.length - (inChair ? 1 : 0);

  const maxWait = useMemo(
    () => waiting.reduce((acc, q) => Math.max(acc, q.estimatedWaitMinutes), 0),
    [waiting]
  );

  const moveBooking = useMemo(
    () => (moveBookingId ? (bookings.find((b) => b.id === moveBookingId) ?? null) : null),
    [bookings, moveBookingId]
  );

  function openMove(bookingId: string) {
    setMoveBookingId(bookingId);
    setSelectedChip(null);
    setExpandedKey(null);
    setVariant("move");
  }

  function closeMove() {
    setVariant("quiet");
    setMoveBookingId(null);
    setSelectedChip(null);
  }

  function acceptPending() {
    if (!pendingBooking) return;
    const id = pendingBooking.id;
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)));
  }

  function declinePending() {
    if (!pendingBooking) return;
    const id = pendingBooking.id;
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }

  function startWaiting(id: string) {
    const freeStaff = staff.find((s) => s.id !== inChair?.staffId);
    setQueue((prev) =>
      prev.map((q) =>
        q.id === id
          ? { ...q, status: "in_chair", staffId: freeStaff?.id ?? null, startedAt: new Date().toISOString() }
          : q
      )
    );
    setExpandedKey(null);
  }

  function resolveWaiting(id: string, next: "completed" | "no_show" | "cancelled") {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: next } : q)));
    setExpandedKey(null);
  }

  function resolveBooking(id: string, next: "completed" | "no_show" | "cancelled") {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: next } : b)));
    setExpandedKey(null);
  }

  function withZurichClock(originalIso: string, hours: number, minutes: number): string {
    // Replace only the displayed Zurich wall-clock time, keep the same calendar date.
    const base = new Date(originalIso);
    const dateStr = base.toLocaleDateString("en-CA", { timeZone: "Europe/Zurich" });
    const [y, mo, d] = dateStr.split("-").map(Number);
    const guess = new Date(Date.UTC(y, mo - 1, d, hours, minutes, 0));
    const asUtc = new Date(guess.toLocaleString("en-US", { timeZone: "UTC" }));
    const asZurich = new Date(guess.toLocaleString("en-US", { timeZone: "Europe/Zurich" }));
    const offsetMs = asZurich.getTime() - asUtc.getTime();
    return new Date(guess.getTime() - offsetMs).toISOString();
  }

  function confirmMove() {
    if (!moveBooking || !selectedChip) return;
    const [h, m] = selectedChip.split(":").map(Number);
    setBookings((prev) =>
      prev.map((b) => (b.id === moveBooking.id ? { ...b, startsAt: withZurichClock(b.startsAt, h, m) } : b))
    );
    closeMove();
  }

  // Full-bleed (_BASE.md rule 1: the body IS the screen). Portalled to document.body because the
  // locale layout wraps children in a transformed page-transition element, and a transformed
  // ancestor becomes the containing block for `fixed`, which pinned the overlay to the wrapper
  // instead of the viewport. The portal escapes it and covers the header, breadcrumb, footer and
  // cookie bar, so this is judged as a screen and not as a page inside solen.ch.
  if (!mounted) return null;

  const screen = (
    <div className="fixed inset-0 z-[10000] overflow-y-auto overscroll-contain bg-s-bg-sunken">
      <div className="sticky top-0 z-30 bg-white">
        <div className="mx-auto flex min-h-11 w-full max-w-[760px] items-center gap-2 px-4">
          {(
            [
              { key: "quiet", label: "Quiet" },
              { key: "new", label: "New booking" },
              { key: "move", label: "Move" },
            ] as { key: Variant; label: string }[]
          ).map((v) => {
            const selected = variant === v.key;
            return (
              <button
                key={v.key}
                type="button"
                onClick={() => {
                  if (v.key !== "move") {
                    setMoveBookingId(null);
                    setSelectedChip(null);
                  } else if (!moveBookingId) {
                    setMoveBookingId(laterToday.find((b) => b.status === "confirmed")?.id ?? null);
                    setSelectedChip(null);
                  }
                  setVariant(v.key);
                }}
                className={
                  "h-9 rounded-full border px-4 text-[13px] " +
                  (selected
                    ? "border-transparent bg-s-bg-sunken font-semibold text-s-ink"
                    : "border-s-border bg-white font-normal text-s-ink-2")
                }
              >
                {v.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="sticky top-9 z-20 h-14 border-b border-s-border bg-white">
        <div className="mx-auto flex h-full w-full max-w-[760px] items-center justify-between px-4">
          <span className="font-display text-[15px] font-semibold text-s-ink">{salonName}</span>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-[13px] font-normal text-s-ink-2">
              <span className="h-1.5 w-1.5 rounded-full bg-s-success" />
              Live
            </span>
            <button
              type="button"
              aria-label={bellOn ? "Mute alerts" : "Unmute alerts"}
              onClick={() => setBellOn((v) => !v)}
              className="flex h-11 w-11 items-center justify-center text-s-ink"
            >
              {bellOn ? <Bell size={20} strokeWidth={1.75} /> : <BellOff size={20} strokeWidth={1.75} />}
            </button>
            <button
              type="button"
              onClick={() => setQueuePaused((v) => !v)}
              className="text-[13px] font-normal text-s-accent"
            >
              {queuePaused ? "Resume queue" : "Pause queue"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-4 pb-16 pt-8">
        {variant === "new" && pendingBooking ? (
          <AnimatePresence>
            <motion.div
              key={pendingBooking.id}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className="rounded-card border border-s-border bg-white p-4"
            >
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-semibold text-s-ink">New request</span> {/* drift-ok: eyebrow, LOCKFILE text-size row "eyebrow 11" */}
                <span className="text-[11px] font-normal tabular-nums text-s-ink-2">{expiresIn(pendingBooking.createdAt)}</span> {/* drift-ok: eyebrow, LOCKFILE text-size row "eyebrow 11" */}
              </div>
              <p className="mt-4 font-display text-[28px] font-semibold leading-tight text-s-ink">
                {pendingBooking.customerName}
              </p>
              <p className="mt-4 text-[15px] font-normal text-s-ink-2">
                {pendingBooking.serviceName}, {zurichTime(pendingBooking.startsAt)}
              </p>
              <p className="text-[15px]">
                <span className="font-semibold tabular-nums text-s-ink">{chf(pendingBooking.price)}</span>
                {pendingBooking.staffName ? (
                  <span className="text-[13px] font-normal text-s-ink-2"> with {pendingBooking.staffName}</span>
                ) : null}
              </p>
              <div className="mt-4 flex gap-2">
                <button
                  type="button"
                  onClick={acceptPending}
                  className="h-11 flex-1 rounded-full bg-s-ink text-[15px] font-semibold text-white"
                >
                  Accept
                </button>
                <button
                  type="button"
                  onClick={declinePending}
                  className="h-11 w-[120px] rounded-full border border-s-border text-[15px] font-semibold text-s-ink"
                >
                  Decline
                </button>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}

        {variant === "move" && moveBooking ? (
          <div className="rounded-card border border-s-border bg-white p-4">
            <span className="text-[11px] font-semibold text-s-ink">Move appointment</span> {/* drift-ok: eyebrow, LOCKFILE text-size row "eyebrow 11" */}
            <p className="mt-4 font-display text-[28px] font-semibold leading-tight text-s-ink">
              {moveBooking.customerName}
            </p>
            <p className="mt-4 text-[15px] font-normal text-s-ink-2">
              {moveBooking.serviceName}, {zurichTime(moveBooking.startsAt)}
            </p>
            <p className="mt-4 text-[13px] font-semibold text-s-ink">New time</p>
            <div className="mt-4 flex flex-wrap gap-2">
              {MOVE_TIME_CHIPS.map((time) => {
                const selected = selectedChip === time;
                return (
                  <div key={time} className="flex min-h-11 items-center">
                    <button
                      type="button"
                      onClick={() => setSelectedChip(time)}
                      className={
                        "h-9 rounded-full border px-4 text-[13px] tabular-nums " +
                        (selected
                          ? "border-transparent bg-s-bg-sunken font-semibold text-s-ink"
                          : "border-s-border bg-white font-normal text-s-ink")
                      }
                    >
                      {time}
                    </button>
                  </div>
                );
              })}
            </div>
            <button
              type="button"
              disabled={!selectedChip}
              onClick={confirmMove}
              className={
                "mt-4 h-11 w-full rounded-full bg-s-ink text-[15px] font-semibold text-white " +
                (selectedChip ? "" : "cursor-not-allowed opacity-50")
              }
            >
              {selectedChip ? `Move to ${selectedChip}` : "Move"}
            </button>
            <button
              type="button"
              onClick={closeMove}
              className="mt-4 block w-full text-center text-[13px] font-normal text-s-ink-2"
            >
              Keep {zurichTime(moveBooking.startsAt)}
            </button>
          </div>
        ) : null}

        {/* The screen's display anchor (FLOORS LAW 6, >= 28px). At rest the one number a barbershop
            counter actually needs is the wait, so it is the biggest thing on the screen. Bare text
            on the canvas, not a card, per the 2026-07-15 card-economy decision. */}
        {variant === "quiet" ? (
          <div>
            <p className="font-display text-[28px] font-semibold leading-tight tabular-nums text-s-ink">
              {waiting.length === 0 ? "No wait" : `${maxWait} min wait`}
            </p>
            <p className="text-[13px] font-normal tabular-nums text-s-ink-2">
              {waiting.length === 0 ? "Nobody waiting" : `${waiting.length} people waiting`}
            </p>
          </div>
        ) : (
          <p className="text-[15px] font-normal tabular-nums text-s-ink-2">
            {waiting.length === 0
              ? "Nobody waiting"
              : `${maxWait} min wait, ${waiting.length} people`}
          </p>
        )}

        <div className="rounded-[24px] bg-white p-4 shadow-whisper">
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-s-ink">In the chair</span>
            <span className="text-[13px] font-normal tabular-nums text-s-ink-2">{freeCount} free</span>
          </div>
          <div className="mt-4 flex gap-4">
            {staff.map((member) => {
              const busy = inChair?.staffId === member.id;
              return (
                <div key={member.id} className="flex flex-1 flex-col items-center text-center">
                  <div className="relative h-14 w-14 overflow-hidden rounded-full bg-s-bg-sunken">
                    {member.avatarUrl ? (
                      <Image src={member.avatarUrl} alt="" fill sizes="56px" className="object-cover" />
                    ) : null}
                  </div>
                  <p className="mt-4 text-[13px] font-semibold text-s-ink">{member.name}</p>
                  {busy && inChair ? (
                    <>
                      <p className="text-[13px] font-normal text-s-ink-2">{firstName(inChair.customerName)}</p>
                      <p className="text-[13px] font-normal tabular-nums text-s-ink-2">
                        {elapsedMinutes(inChair.startedAt ?? new Date().toISOString())} min
                      </p>
                    </>
                  ) : (
                    <p className="text-[13px] font-semibold text-s-success">Free</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-s-ink">Waiting</span>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {waiting.map((entry) => {
              const key = `waiting:${entry.id}`;
              const expanded = expandedKey === key;
              return (
                <div key={entry.id} className="rounded-card border border-s-border bg-white p-3">
                  <button
                    type="button"
                    onClick={() => setExpandedKey(expanded ? null : key)}
                    className="flex min-h-11 w-full items-center gap-3 text-left"
                  >
                    <span className="w-[48px] shrink-0 text-[13px] font-normal tabular-nums text-s-ink-2">
                      {entry.ticketCode}
                    </span>
                    {/* name over service: at 402 a single row truncated both to three letters */}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className="truncate text-[15px] font-normal text-s-ink">
                        {entry.customerName}
                      </span>
                      <span className="truncate text-[13px] font-normal text-s-ink-2">
                        {entry.serviceName}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] font-normal tabular-nums text-s-ink">
                      {entry.estimatedWaitMinutes} min
                    </span>
                    <span
                      role="button"
                      tabIndex={0}
                      onClick={(e) => {
                        e.stopPropagation();
                        startWaiting(entry.id);
                      }}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.stopPropagation();
                          startWaiting(entry.id);
                        }
                      }}
                      className="flex h-9 shrink-0 items-center rounded-full border border-s-border bg-white px-4 text-[13px] font-normal text-s-ink"
                    >
                      Start
                    </span>
                  </button>
                  {expanded ? (
                    <div className="mt-2 flex min-h-11 items-center gap-4">
                      <button
                        type="button"
                        onClick={() => resolveWaiting(entry.id, "completed")}
                        className="text-[13px] font-normal text-s-ink"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveWaiting(entry.id, "no_show")}
                        className="text-[13px] font-normal text-s-ink"
                      >
                        No-show
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveWaiting(entry.id, "cancelled")}
                        className="text-[13px] font-normal text-s-error"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between">
            <span className="text-[13px] font-semibold text-s-ink">Later today</span>
            <span className="text-[13px] font-normal tabular-nums text-s-ink-2">{laterToday.length} to go</span>
          </div>
          <div className="mt-4 flex flex-col gap-2">
            {laterToday.map((booking) => {
              const key = `booking:${booking.id}`;
              const expanded = expandedKey === key;
              const completed = booking.status === "completed";
              const textColor = completed ? "text-s-ink-2" : "text-s-ink";
              return (
                <div key={booking.id} className="rounded-card border border-s-border bg-white p-3">
                  <button
                    type="button"
                    onClick={() => !completed && setExpandedKey(expanded ? null : key)}
                    className="flex min-h-11 w-full items-center gap-3 text-left"
                  >
                    <span className={"w-[52px] shrink-0 text-[15px] font-normal tabular-nums " + textColor}>
                      {zurichTime(booking.startsAt)}
                    </span>
                    {/* name over service: at 402 a single row truncated both to three letters */}
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={"truncate text-[15px] font-normal " + textColor}>
                        {booking.customerName}
                      </span>
                      <span className="truncate text-[13px] font-normal text-s-ink-2">
                        {booking.serviceName}
                      </span>
                    </span>
                    <span className="shrink-0 text-[13px] font-normal tabular-nums text-s-ink">
                      {chf(booking.price)}
                      {booking.paymentStatus === "paid" ? (
                        <span className="ml-1 font-normal text-s-success">Paid</span>
                      ) : null}
                    </span>
                  </button>
                  {expanded && !completed ? (
                    <div className="mt-2 flex min-h-11 items-center gap-4">
                      <button
                        type="button"
                        onClick={() => openMove(booking.id)}
                        className="text-[13px] font-normal text-s-ink"
                      >
                        Move
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveBooking(booking.id, "completed")}
                        className="text-[13px] font-normal text-s-ink"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveBooking(booking.id, "no_show")}
                        className="text-[13px] font-normal text-s-ink"
                      >
                        No-show
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveBooking(booking.id, "cancelled")}
                        className="text-[13px] font-normal text-s-error"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
          {doneCount > 0 ? (
            <p className="mt-4 text-[13px] font-normal tabular-nums text-s-ink-2">{doneCount} done today</p>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(screen, document.body);
}
