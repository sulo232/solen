"use client";

// exists-check: npm run exists terminal , the terminal family only; the attention-bar CLASS
// STRING is copied verbatim from components-legacy/dashboard/DashboardLayout.tsx:457/465 (the
// REAL shipped admin-preview banner), composed rather than reinvented, per this task's literal
// instruction. english-ok: standalone dev mockup, hardcoded copy is English.
//
// DIRECTION B , ATTENTION BAR (owner brief 2026-08-15, "quirky-ellis" round).
// The calm day, with everything needing a human collected into ONE count at the top. No tabs.
// The attention bar is ABSENT (not empty) when nothing needs attention, so the screen is calm on
// a normal day and only interrupts itself when it genuinely has to. Reuses GROUPED_CARD/ROW/
// ROW_TITLE/ROW_META/SECTION_HEADING/PRIMARY_BUTTON/SECONDARY_BUTTON + Avatar, exactly as the
// grouped sections in the current Terminal.tsx already render them.
//
// boxed-ok: GROUPED_CARD + ROW imported (not re-declared) from Terminal.tsx, same shipped
// grouped-list-card grammar, see that file's header note. The attention bar itself is a single
// flat sticky strip with no inner card, not a second box around the content below it.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Inbox } from "lucide-react";
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
// role stays; content and action are this screen's own.
const ATTENTION_BAR =
  "sticky top-0 z-30 flex items-center gap-3 px-5 py-2.5 bg-s-warning-bg border-b border-s-warning/20 text-s-ink text-[13px] font-medium";
// Pill from DashboardLayout.tsx:465, the "Show" action. That pill renders 27px tall at
// text-[12px] on the live dashboard: under the 44px a11y floor this task requires, and a 5th
// distinct size against this task's own 4-size/13-15-18-28 type budget. Kept every other part of
// the copied class verbatim and changed only two tokens (12 -> 13, the nearest allowed size; and
// min-h-11 added for the touch floor), the same precedent Terminal.tsx already uses for the
// PDP's undersized secondary button (see that file's SECONDARY_BUTTON comment). Named deviation,
// not silent: this is the one line in this task that copies a real class string AND has to fit a
// closed size list, and the two instructions collide on this token.
const ATTENTION_SHOW_BUTTON =
  "shrink-0 flex min-h-11 items-center justify-center px-3 py-1.5 rounded-full bg-white border border-s-border hover:bg-s-bg-sunken transition-colors text-[13px] font-medium disabled:opacity-60";
// CONTROL_ELEVATION.md "AMENDMENT 2026-07-24", rung F: a peer LIST where every row carries the
// same commit (every attention-item row below has an Accept / They-arrived action) does not get
// the page's one ink CTA repeated per row, that multiplies the ink fill down a .map() and
// destroys the hierarchy the ink-CTA lock protects. Row-commit = white fill + hairline +
// shadow-whisper + ink semibold + pill + >=44px, identical on every row.
const ROW_COMMIT_BUTTON =
  "font-body flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-s-border bg-white shadow-whisper text-[15px] font-semibold text-s-ink transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide";

// Dev-only mockup, hardcoded English per the mockup-english-gate rule (no messages/*.json key
// exists for this dev route); avoids a plural ternary entirely by naming the count, not counting.
function attentionLabel(count: number): string {
  if (count === 1) return "1 needs you";
  return `${count} need you`;
}

export default function B({ salonName, bookings: initialBookings, queue: initialQueue, staff }: BDirectionProps) {
  const [bookings, setBookings] = useState<TerminalBooking[]>(initialBookings);
  const [queue, setQueue] = useState<TerminalQueueEntry[]>(initialQueue);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [showingAttention, setShowingAttention] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const pending = useMemo(() => bookings.filter((b) => b.status === "pending_approval"), [bookings]);

  // "Needs a human" = a pending request, or a confirmed appointment at least 15 minutes past its
  // own start time. Computed off the real clock every render, never hardcoded (G4's own +15
  // threshold: "the terminal raises it").
  const lateConfirmed = useMemo(
    () =>
      bookings.filter((b) => b.status === "confirmed" && elapsedMinutes(b.startsAt) >= 15 && new Date(b.startsAt).getTime() <= Date.now()),
    [bookings]
  );

  const attentionItems = useMemo(
    () => [...pending.map((b) => ({ booking: b, reason: "new" as const })), ...lateConfirmed.map((b) => ({ booking: b, reason: "late" as const }))],
    [pending, lateConfirmed]
  );

  const waiting = useMemo(
    () => queue.filter((q) => q.status === "waiting").sort((a, b) => a.position - b.position),
    [queue]
  );
  const inChair = useMemo(() => queue.filter((q) => q.status === "in_chair"), [queue]);
  const laterToday = useMemo(
    () => bookings.filter((b) => b.status === "confirmed" || b.status === "pending_approval").sort((a, b) => a.startsAt.localeCompare(b.startsAt)),
    [bookings]
  );
  const maxWait = useMemo(() => waiting.reduce((acc, q) => Math.max(acc, q.estimatedWaitMinutes), 0), [waiting]);

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
  // the SERVER sent a page with no screen in it at all, so on a phone he got the plain Solen site
  // and a footer while he waited for the script. Measured: the server HTML for all four routes
  // contained zero occurrences of the overlay class. The screen now renders in the normal tree on
  // the server and only MOVES into the body portal once mounted, so it is there from the first byte.

  const screen = (
    // Before hydration this is a normal full-height block, because `fixed` inside the layout's
    // transformed page-transition wrapper is bounded BY that wrapper and collapsed the screen into
    // a squashed band with the site footer showing under it (what the owner saw, 2026-08-15).
    // After hydration the portal moves it to <body>, where `fixed` means the viewport again.
    <div
      className={
        mounted
          ? "fixed inset-0 z-[10000] overflow-y-auto overscroll-contain bg-s-bg-sunken"
          : "relative z-[10000] min-h-[100dvh] w-full bg-s-bg-sunken"
      }
    >
      {attentionItems.length > 0 ? (
        <div className={ATTENTION_BAR}>
          <span className="flex-1 truncate">{attentionLabel(attentionItems.length)}</span>
          <button type="button" onClick={() => setShowingAttention((v) => !v)} className={ATTENTION_SHOW_BUTTON}>
            {showingAttention ? "Hide" : "Show"}
          </button>
        </div>
      ) : null}

      <div className={"sticky z-20 h-14 border-b border-s-border bg-white" + (attentionItems.length > 0 ? " top-11" : " top-0")}>
        <div className="mx-auto flex h-full w-full max-w-[760px] items-center justify-between px-4">
          <span className="font-body text-[15px] font-semibold text-s-ink">{salonName}</span>
          <span className="font-body flex items-center gap-1.5 text-[13px] font-normal text-s-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-s-success" />
            Live
          </span>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-4 pb-16 pt-8">
        {showingAttention && attentionItems.length > 0 ? (
          <div>
            {/* The filtered view needs its own display anchor (FLOORS LAW 6, >= 28px). Measured
                2026-08-15: without this it topped out at 15px, because the wait headline lives in
                the calm branch. In this mode the count IS the biggest thing that matters. */}
            <p className="font-display mb-4 text-[28px] font-semibold leading-tight tabular-nums text-s-ink">
              {attentionItems.length} need you
            </p>
            <ul className={GROUPED_CARD}>
              {attentionItems.map(({ booking, reason }) => (
                <li key={booking.id} className={ROW}>
                  <div className="flex items-center gap-3">
                    <span className="font-body w-[52px] shrink-0 text-[15px] font-medium tabular-nums text-s-ink">
                      {zurichTime(booking.startsAt)}
                    </span>
                    <span className="flex min-w-0 flex-1 flex-col">
                      <span className={ROW_TITLE + " truncate"}>{booking.customerName}</span>
                      <span className={ROW_META + " truncate"}>{booking.serviceName}</span>
                    </span>
                    <span className="font-body shrink-0 text-[13px] font-medium text-s-error">
                      {reason === "new" ? "New" : `${elapsedMinutes(booking.startsAt)} min late`}
                    </span>
                  </div>
                  <div className="mt-3 flex gap-2">
                    {reason === "new" ? (
                      <>
                        <button type="button" onClick={() => acceptPending(booking.id)} className={ROW_COMMIT_BUTTON}>
                          Accept
                        </button>
                        <button type="button" onClick={() => declinePending(booking.id)} className={SECONDARY_BUTTON}>
                          Decline
                        </button>
                      </>
                    ) : (
                      <>
                        <button type="button" onClick={() => markArrived(booking.id)} className={ROW_COMMIT_BUTTON}>
                          They arrived
                        </button>
                        <button type="button" onClick={() => markNoShow(booking.id)} className={SECONDARY_BUTTON}>
                          No-show
                        </button>
                      </>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        ) : (
          <>
            <div>
              <p className="font-display text-[28px] font-semibold leading-tight tabular-nums text-s-ink">
                {waiting.length === 0 ? "No wait" : `${maxWait} min wait`}
              </p>
              <p className="font-body mt-1 text-[13px] font-normal tabular-nums text-s-ink-2">
                {waiting.length === 0 ? "Nobody waiting" : `${waiting.length} people waiting`}
              </p>
            </div>

            <div>
              <h2 className={SECTION_HEADING}>In the chair</h2>
              <div className={GROUPED_CARD + " mt-4 p-5"}>
                <div className="flex gap-4">
                  {staff.map((member) => {
                    const active = inChair.find((q) => q.staffId === member.id);
                    return (
                      <div key={member.id} className="flex flex-1 flex-col items-center gap-1 text-center">
                        <Avatar src={member.avatarUrl} name={member.name} size={56} />
                        <p className={ROW_TITLE + " mt-2 text-center"}>{member.name}</p>
                        {active ? (
                          <>
                            <p className="font-body text-[13px] font-normal text-s-ink-2">{firstName(active.customerName)}</p>
                            <p className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                              {elapsedMinutes(active.startedAt ?? new Date().toISOString())} min
                            </p>
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

            {waiting.length > 0 ? (
              <div>
                <h2 className={SECTION_HEADING}>Waiting</h2>
                <ul className={GROUPED_CARD + " mt-4"}>
                  {waiting.map((entry) => {
                    const key = `waiting:${entry.id}`;
                    const expanded = expandedKey === key;
                    return (
                      <li key={entry.id} className={ROW}>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggle(key)}
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
              </div>
            ) : null}

            {laterToday.length > 0 ? (
              <div>
                <div className="flex items-center justify-between">
                  <h2 className={SECTION_HEADING}>Later today</h2>
                  <span className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">{laterToday.length} to go</span>
                </div>
                <ul className={GROUPED_CARD + " mt-4"}>
                  {laterToday.map((booking) => {
                    const key = `booking:${booking.id}`;
                    const expanded = expandedKey === key;
                    const isNew = booking.status === "pending_approval";
                    return (
                      <li key={booking.id} className={ROW}>
                        <div className="flex items-center gap-3">
                          <button
                            type="button"
                            onClick={() => toggle(key)}
                            className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
                          >
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
                        </div>
                        {expanded && !isNew ? (
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
                  })}
                </ul>
              </div>
            ) : null}

            {waiting.length === 0 && laterToday.length === 0 && inChair.length === 0 ? (
              <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
                <Inbox size={32} strokeWidth={1.5} className="text-s-ink-2" />
                <p className="font-body text-[15px] font-normal text-s-ink-2">Nothing on the books today</p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </div>
  );

  // Server and first paint: render inline, so the screen exists before any script runs.
  // After hydration: move into the body portal, so the overlay escapes the locale layout's
  // transformed page-transition wrapper (a transformed ancestor is the containing block for
  // `fixed`, which is why an inline-only version pins itself to the wrapper instead of the screen).
  if (!mounted) return screen;

  return createPortal(screen, document.body);
}
