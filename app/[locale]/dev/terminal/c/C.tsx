"use client";

// exists-check: npm run exists terminal , the terminal family only. english-ok: standalone dev
// mockup, hardcoded copy is English.
//
// DIRECTION C , NOW AND NEXT (owner brief 2026-08-15, "quirky-ellis" round).
// A fixed operational top half (the three chairs, like a till) and a scrolling bottom half (one
// list, no sections). No tabs. Anything needing a decision is a compact ONE-LINE strip pinned at
// the boundary between the two halves, so five of them stack as five lines, never five cards.
// Reuses GROUPED_CARD/ROW/ROW_TITLE/ROW_META/SECONDARY_BUTTON + Avatar exactly as the current
// Terminal.tsx already composes them.
//
// boxed-ok: GROUPED_CARD + ROW imported (not re-declared) from Terminal.tsx, same shipped
// grouped-list-card grammar, see that file's header note. The fixed chair strip and the
// needs-you strip below are deliberately borderless/cardless (a till readout, not a list).

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Check, Inbox, X } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";
import {
  GROUPED_CARD,
  ROW,
  ROW_TITLE,
  ROW_META,
  SECONDARY_BUTTON,
  chf,
  zurichTime,
  elapsedMinutes,
  firstName,
  type TerminalBooking,
  type TerminalQueueEntry,
  type TerminalStaff,
} from "../Terminal";

interface CDirectionProps {
  salonName: string;
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
  staff: TerminalStaff[];
}

type ListItem =
  | { kind: "booking"; sortMs: number; booking: TerminalBooking }
  | { kind: "queue"; sortMs: number; entry: TerminalQueueEntry };

export default function C({ salonName, bookings: initialBookings, queue: initialQueue, staff }: CDirectionProps) {
  const [bookings, setBookings] = useState<TerminalBooking[]>(initialBookings);
  const [queue, setQueue] = useState<TerminalQueueEntry[]>(initialQueue);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), 60_000);
    return () => clearInterval(timer);
  }, []);

  const inChair = useMemo(() => queue.filter((q) => q.status === "in_chair"), [queue]);
  const waiting = useMemo(
    () => queue.filter((q) => q.status === "waiting").sort((a, b) => a.position - b.position),
    [queue]
  );
  const maxWait = useMemo(() => waiting.reduce((acc, q) => Math.max(acc, q.estimatedWaitMinutes), 0), [waiting]);

  const pending = useMemo(() => bookings.filter((b) => b.status === "pending_approval"), [bookings]);
  // Computed off the real clock, never hardcoded: any confirmed booking at least 15 minutes past
  // its own start time needs a decision (G4's own +15 threshold).
  const lateConfirmed = useMemo(
    () =>
      bookings.filter(
        (b) => b.status === "confirmed" && new Date(b.startsAt).getTime() <= nowMs && elapsedMinutes(b.startsAt) >= 15
      ),
    [bookings, nowMs]
  );
  const needsYou = useMemo(
    () => [
      ...pending.map((b) => ({ booking: b, reason: "new" as const })),
      ...lateConfirmed.map((b) => ({ booking: b, reason: "late" as const })),
    ],
    [pending, lateConfirmed]
  );
  const needsYouIds = useMemo(() => new Set(needsYou.map((n) => n.booking.id)), [needsYou]);

  // "Everything else" for the scrolling half: waiting walk-ins + every booking not already
  // shown in the fixed chairs (in_chair walk-ins) or the needs-you strip (pending/late).
  const listItems = useMemo<ListItem[]>(() => {
    const bookingItems: ListItem[] = bookings
      .filter((b) => !needsYouIds.has(b.id))
      .map((b) => ({ kind: "booking", sortMs: new Date(b.startsAt).getTime(), booking: b }));
    const queueItems: ListItem[] = waiting.map((entry) => ({
      kind: "queue",
      sortMs: nowMs + entry.position * 1000,
      entry,
    }));
    return [...bookingItems, ...queueItems].sort((a, b) => a.sortMs - b.sortMs);
  }, [bookings, waiting, needsYouIds, nowMs]);

  function toggle(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key));
  }
  function acceptPending(id: string) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)));
  }
  function declinePending(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
  }
  function markArrived(id: string) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, startsAt: new Date().toISOString() } : b)));
  }
  function markNoShow(id: string) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "no_show" } : b)));
  }
  function resolveBooking(id: string, next: "completed" | "no_show" | "cancelled") {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: next } : b)));
    setExpandedKey(null);
  }
  function resolveQueue(id: string, next: "completed" | "no_show" | "cancelled") {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: next } : q)));
    setExpandedKey(null);
  }
  function startQueue(id: string) {
    setQueue((prev) => prev.map((q) => (q.id === id ? { ...q, status: "in_chair", startedAt: new Date().toISOString() } : q)));
  }

  // FIXED 2026-08-15 (owner: "the mockup isn't working at all"). Returning null until mount meant
  // the SERVER sent a page with no screen in it, so on a phone he got the plain Solen site and a
  // footer while he waited for the script. Measured: zero occurrences of the overlay class in the
  // server HTML of all four routes.

  const screen = (
    // Before hydration this is a normal full-height block, because `fixed` inside the layout's
    // transformed page-transition wrapper is bounded BY that wrapper and collapsed the screen into
    // a squashed band with the site footer showing under it (what the owner saw, 2026-08-15).
    <div
      className={
        mounted
          ? "fixed inset-0 z-[10000] flex flex-col overflow-hidden bg-s-bg-sunken"
          : "relative z-[10000] flex min-h-[100dvh] w-full flex-col bg-s-bg-sunken"
      }
    >
      {/* Top, fixed. The ONE bar of chrome, the chairs, and the wait line all sit inside it. */}
      <div className="shrink-0 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-[760px] items-center justify-between px-4">
          <span className="font-body text-[15px] font-semibold text-s-ink">{salonName}</span>
          <span className="font-body flex items-center gap-1.5 text-[13px] font-normal text-s-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-s-success" />
            Live
          </span>
        </div>
        <div className="mx-auto w-full max-w-[760px] px-4 pb-5">
          <div className="flex justify-center gap-8">
            {staff.map((member) => {
              const active = inChair.find((q) => q.staffId === member.id);
              return (
                <div key={member.id} className="flex flex-col items-center gap-1 text-center">
                  <Avatar src={member.avatarUrl} name={member.name} size={56} />
                  <p className={ROW_TITLE + " mt-2 text-center"}>{member.name}</p>
                  {active ? (
                    <p className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                      {firstName(active.customerName)}, {elapsedMinutes(active.startedAt ?? new Date().toISOString())} min
                    </p>
                  ) : (
                    <p className="font-body text-[13px] font-normal text-s-success">Free</p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="mt-4 flex items-baseline justify-center gap-2 text-center">
            <span className="font-display text-[28px] font-semibold leading-none tabular-nums text-s-ink">
              {waiting.length === 0 ? "No wait" : `${maxWait} min wait`}
            </span>
            <span className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
              {waiting.length === 0 ? "" : `${waiting.length} waiting`}
            </span>
          </p>
        </div>

        {/* The boundary strip. Anything needing a decision, one line per person, never a card. */}
        {needsYou.length > 0 ? (
          <div className="border-t border-s-border bg-white px-4 py-1">
            {needsYou.map(({ booking, reason }) => (
              <div key={booking.id} className="flex items-center gap-2 py-1.5">
                <span className="font-body min-w-0 flex-1 truncate text-[13px] font-normal text-s-ink">
                  <span className="font-medium tabular-nums text-s-ink">{zurichTime(booking.startsAt)}</span>{" "}
                  {booking.customerName},{" "}
                  <span className="font-medium text-s-error">
                    {reason === "new" ? "new request" : `${elapsedMinutes(booking.startsAt)} min late`}
                  </span>
                </span>
                <div className="flex shrink-0 items-center">
                  <button
                    type="button"
                    aria-label={reason === "new" ? "Accept" : "Mark arrived"}
                    onClick={() => (reason === "new" ? acceptPending(booking.id) : markArrived(booking.id))}
                    className="flex h-11 w-11 items-center justify-center text-s-ink"
                  >
                    <Check size={18} strokeWidth={2} />
                  </button>
                  <button
                    type="button"
                    aria-label={reason === "new" ? "Decline" : "Mark no-show"}
                    onClick={() => (reason === "new" ? declinePending(booking.id) : markNoShow(booking.id))}
                    className="flex h-11 w-11 items-center justify-center text-s-error"
                  >
                    <X size={18} strokeWidth={2} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>

      {/* Bottom, scrolls. One list, no sections. */}
      <div className="flex-1 overflow-y-auto overscroll-contain">
        <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-5">
          {listItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
              <Inbox size={32} strokeWidth={1.5} className="text-s-ink-2" />
              <p className="font-body text-[15px] font-normal text-s-ink-2">Nothing else today</p>
            </div>
          ) : (
            <ul className={GROUPED_CARD}>
              {listItems.map((item) => {
                if (item.kind === "booking") {
                  const { booking } = item;
                  const key = `b:${booking.id}`;
                  const expanded = expandedKey === key;
                  const done = booking.status === "completed";
                  return (
                    <li key={key} className={ROW}>
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className="flex min-h-11 w-full items-center gap-3 text-left"
                      >
                        <span className="font-body w-[52px] shrink-0 text-[15px] font-medium tabular-nums text-s-ink">
                          {zurichTime(booking.startsAt)}
                        </span>
                        <span className="flex min-w-0 flex-1 flex-col">
                          <span className={ROW_TITLE + (done ? " truncate text-s-ink-2" : " truncate")}>{booking.customerName}</span>
                          <span className={ROW_META + " truncate"}>{booking.serviceName}</span>
                        </span>
                        <span className="font-body shrink-0 text-right text-[13px] font-normal tabular-nums text-s-ink">
                          {done ? (
                            <span className="text-s-ink-2">Done</span>
                          ) : (
                            <>
                              {chf(booking.price)}
                              {booking.paymentStatus === "paid" ? (
                                <span className="mt-0.5 block text-[13px] font-normal text-s-success">Paid</span>
                              ) : null}
                            </>
                          )}
                        </span>
                      </button>
                      {expanded && !done ? (
                        <div className="mt-3 flex items-center gap-4">
                          <button
                            type="button"
                            onClick={() => resolveBooking(booking.id, "completed")}
                            className="font-body flex h-11 items-center text-[13px] font-normal text-s-ink"
                          >
                            Done
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveBooking(booking.id, "no_show")}
                            className="font-body flex h-11 items-center text-[13px] font-normal text-s-ink"
                          >
                            No-show
                          </button>
                          <button
                            type="button"
                            onClick={() => resolveBooking(booking.id, "cancelled")}
                            className="font-body flex h-11 items-center text-[13px] font-normal text-s-error"
                          >
                            Cancel
                          </button>
                        </div>
                      ) : null}
                    </li>
                  );
                }

                const { entry } = item;
                const key = `q:${entry.id}`;
                const expanded = expandedKey === key;
                return (
                  <li key={key} className={ROW}>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => toggle(key)}
                        className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
                      >
                        <span className="font-body w-[52px] shrink-0 text-[13px] font-normal tabular-nums text-s-ink-2">
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
                        <button type="button" onClick={() => startQueue(entry.id)} className={SECONDARY_BUTTON}>
                          Start
                        </button>
                      </div>
                    </div>
                    {expanded ? (
                      <div className="mt-3 flex items-center gap-4">
                        <button
                          type="button"
                          onClick={() => resolveQueue(entry.id, "completed")}
                          className="font-body flex h-11 items-center text-[13px] font-normal text-s-ink"
                        >
                          Done
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveQueue(entry.id, "no_show")}
                          className="font-body flex h-11 items-center text-[13px] font-normal text-s-ink"
                        >
                          No-show
                        </button>
                        <button
                          type="button"
                          onClick={() => resolveQueue(entry.id, "cancelled")}
                          className="font-body flex h-11 items-center text-[13px] font-normal text-s-error"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </div>
    </div>
  );

  // Server and first paint: render inline, so the screen exists before any script runs.
  // After hydration: move into the body portal, so the overlay escapes the locale layout's
  // transformed page-transition wrapper.
  if (!mounted) return screen;

  return createPortal(screen, document.body);
}
