"use client";

// exists-check: npm run exists terminal = the terminal family (Terminal.tsx, this dev route);
// no other "one continuous stream" merchant screen exists anywhere in the repo.
// english-ok: standalone dev mockup, all hardcoded copy is English per the mockup rule.
//
// DIRECTION A , ONE STREAM (owner brief 2026-08-15, "quirky-ellis" round).
// No tab row, no sections. Walk-ins and appointments merge into ONE time-ordered list with a
// NOW divider between what already happened and what has not. The direction's whole thesis:
// position always means time, so a busy shop never loses its place. Reuses GROUPED_CARD/ROW/
// ROW_TITLE/ROW_META/PRIMARY_BUTTON/SECONDARY_BUTTON + the format helpers exported from the
// real Terminal.tsx (see that file's 2026-08-15 export note); the LAYOUT here is new, the
// grammar is not.
//
// boxed-ok: GROUPED_CARD + ROW imported (not re-declared) from Terminal.tsx, same shipped
// grouped-list-card grammar, see that file's header note.

import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { Inbox } from "lucide-react";
import {
  GROUPED_CARD,
  ROW,
  ROW_TITLE,
  ROW_META,
  PRIMARY_BUTTON,
  SECONDARY_BUTTON,
  chf,
  zurichTime,
  elapsedMinutes,
  type TerminalBooking,
  type TerminalQueueEntry,
} from "../Terminal";

interface ADirectionProps {
  salonName: string;
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
}

// CONTROL_ELEVATION.md "AMENDMENT 2026-07-24", rung F: a peer LIST where more than one row can
// carry the same commit (more than one pending-approval row can appear in this merged stream)
// does not get the page's one ink CTA repeated per row. Row-commit = white fill + hairline +
// shadow-whisper + ink semibold + pill + >=44px, identical on every row. Matches the same
// constant used in directions B and C, so the same action looks the same everywhere.
const ROW_COMMIT_BUTTON =
  "font-body flex h-11 flex-1 items-center justify-center gap-2 rounded-full border border-s-border bg-white shadow-whisper text-[15px] font-semibold text-s-ink transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide";

type StreamItem =
  | { kind: "booking"; sortMs: number; booking: TerminalBooking }
  | { kind: "queue"; sortMs: number; entry: TerminalQueueEntry };

export default function A({ salonName, bookings: initialBookings, queue: initialQueue }: ADirectionProps) {
  const [bookings, setBookings] = useState<TerminalBooking[]>(initialBookings);
  const [queue, setQueue] = useState<TerminalQueueEntry[]>(initialQueue);
  const [expandedKey, setExpandedKey] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [nowMs, setNowMs] = useState(() => Date.now());
  const nowLineRef = useRef<HTMLLIElement | null>(null);

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

  // The list opens scrolled to the now-line, once, after first paint.
  useEffect(() => {
    if (!mounted) return;
    const t = setTimeout(() => nowLineRef.current?.scrollIntoView({ block: "center" }), 50);
    return () => clearTimeout(t);
  }, [mounted]);

  const items = useMemo<StreamItem[]>(() => {
    const bookingItems: StreamItem[] = bookings.map((booking) => ({
      kind: "booking",
      sortMs: new Date(booking.startsAt).getTime(),
      booking,
    }));
    // A walk-in has no scheduled time, it is happening now. Sorted by queue position so the
    // order the shop sees them in the queue is the order they render in the stream, clustered
    // right at the now-line rather than scattered across the whole day.
    const queueItems: StreamItem[] = queue.map((entry) => ({
      kind: "queue",
      sortMs:
        entry.status === "in_chair" && entry.startedAt
          ? new Date(entry.startedAt).getTime()
          : nowMs + entry.position * 1000,
      entry,
    }));
    return [...bookingItems, ...queueItems].sort((a, b) => a.sortMs - b.sortMs);
  }, [bookings, queue, nowMs]);

  const nowIndex = useMemo(() => items.findIndex((item) => item.sortMs > nowMs), [items, nowMs]);
  const insertAt = nowIndex === -1 ? items.length : nowIndex;

  function toggle(key: string) {
    setExpandedKey((prev) => (prev === key ? null : key));
  }

  function acceptPending(id: string) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)));
  }

  function declinePending(id: string) {
    setBookings((prev) => prev.filter((b) => b.id !== id));
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
    setExpandedKey(null);
  }

  if (!mounted) return null;

  const screen = (
    <div className="fixed inset-0 z-[10000] overflow-y-auto overscroll-contain bg-s-bg-sunken">
      {/* The ONE bar of chrome. Nothing else is sticky. */}
      <div className="sticky top-0 z-30 h-14 border-b border-s-border bg-white">
        <div className="mx-auto flex h-full w-full max-w-[760px] items-center justify-between px-4">
          <span className="font-body text-[15px] font-semibold text-s-ink">{salonName}</span>
          <span className="font-body flex items-center gap-1.5 text-[13px] font-normal text-s-ink-2">
            <span className="h-1.5 w-1.5 rounded-full bg-s-success" />
            Live
          </span>
        </div>
      </div>

      <div className="mx-auto w-full max-w-[760px] px-4 pb-16 pt-4">
        {items.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-3 py-24 text-center">
            <Inbox size={32} strokeWidth={1.5} className="text-s-ink-2" />
            <p className="font-body text-[15px] font-normal text-s-ink-2">Nothing on the books today</p>
          </div>
        ) : (
          <ul className={GROUPED_CARD}>
            {items.map((item, index) => {
              const nodes: React.ReactNode[] = [];
              if (index === insertAt) {
                nodes.push(
                  <li key="now-line" ref={nowLineRef} className="relative flex h-16 items-center justify-center">
                    <span className="absolute inset-x-5 top-1/2 -translate-y-1/2 border-t border-s-border" />
                    <span className="font-display relative bg-white px-3 text-[28px] font-semibold leading-none tabular-nums text-s-ink">
                      {zurichTime(new Date(nowMs).toISOString())}
                    </span>
                  </li>
                );
              }

              if (item.kind === "booking") {
                const { booking } = item;
                const key = `b:${booking.id}`;
                const expanded = expandedKey === key;
                const isPast = item.sortMs <= nowMs && booking.status === "confirmed";
                const lateMin = isPast ? elapsedMinutes(booking.startsAt) : 0;

                nodes.push(
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
                        <span className={ROW_TITLE + " truncate"}>{booking.customerName}</span>
                        <span className={ROW_META + " truncate"}>{booking.serviceName}</span>
                      </span>
                      <span className="font-body shrink-0 text-right text-[13px] font-normal tabular-nums text-s-ink">
                        {booking.status === "pending_approval" ? (
                          <span className="font-medium text-s-error">New</span>
                        ) : booking.status === "completed" ? (
                          <span className="text-s-ink-2">Done</span>
                        ) : lateMin >= 15 ? (
                          <span className="font-medium text-s-error">{lateMin} min late</span>
                        ) : lateMin >= 5 ? (
                          <span className="text-s-ink-2">{lateMin} min late</span>
                        ) : lateMin > 0 ? (
                          <span className="text-s-ink">Due now</span>
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

                    {booking.status === "pending_approval" ? (
                      <div className="mt-3 flex gap-2">
                        <button type="button" onClick={() => acceptPending(booking.id)} className={ROW_COMMIT_BUTTON}>
                          Accept
                        </button>
                        <button type="button" onClick={() => declinePending(booking.id)} className={SECONDARY_BUTTON}>
                          Decline
                        </button>
                      </div>
                    ) : expanded ? (
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
              } else {
                const { entry } = item;
                const key = `q:${entry.id}`;
                const expanded = expandedKey === key;
                const inChair = entry.status === "in_chair";

                nodes.push(
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
                        <span className="font-body shrink-0 text-right text-[13px] font-normal tabular-nums text-s-ink">
                          {inChair
                            ? `In chair, ${elapsedMinutes(entry.startedAt ?? new Date().toISOString())} min`
                            : `${entry.estimatedWaitMinutes} min wait`}
                        </span>
                      </button>
                      {!inChair ? (
                        <div className="flex h-11 shrink-0 items-center">
                          <button type="button" onClick={() => startQueue(entry.id)} className={SECONDARY_BUTTON}>
                            Start
                          </button>
                        </div>
                      ) : null}
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
              }
              return nodes;
            })}
            {insertAt === items.length ? (
              <li key="now-line-end" ref={nowLineRef} className="relative flex h-16 items-center justify-center">
                <span className="absolute inset-x-5 top-1/2 -translate-y-1/2 border-t border-s-border" />
                <span className="font-display relative bg-white px-3 text-[28px] font-semibold leading-none tabular-nums text-s-ink">
                  {zurichTime(new Date(nowMs).toISOString())}
                </span>
              </li>
            ) : null}
          </ul>
        )}
      </div>
    </div>
  );

  return createPortal(screen, document.body);
}
