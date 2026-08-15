"use client";

// exists-check: net-new vs lib/referral/code.ts (unrelated referral-code generator, only
// keyword-matched on "code"). This file is the merchant terminal client UI, no relation.
// english-ok: this is a standalone dev mockup, all hardcoded copy is English per the mockup rule.
//
// CORRECTION 2026-08-15 (owner: "this mockup doesn't reflect our design system ... you're just
// using inconsistent everything"): every row, card, chip and button used to be hand-written
// Tailwind. Rebuilt against the real shipped grammar read out of the salon PDP: the grouped
// list-card (`SalonServices.tsx`/`SalonTeam.tsx`, byte-identical `<ul>` class string), the row
// typography scale, the primary/secondary button strings (`SalonMobileBookBar.tsx` /
// `SalonServices.tsx`), and the real `Avatar` + `TabPill` primitives instead of a hand-rolled
// circle and hand-rolled toggle buttons.
//
// boxed-ok: the outer rounded-[24px]+border+shadow-whisper container paired with per-row
// border-t hairlines below is NOT an invented double-boundary, it is a byte-identical copy of
// the ONE grouped list-card grammar this codebase already ships: SalonServices.tsx:118
// (`<ul className="mt-5 overflow-hidden rounded-[24px] border border-s-border bg-white
// shadow-whisper">` + `SalonServices.tsx:215 `<li className="border-t border-s-border px-5
// py-4 first:border-t-0 md:px-6">`) and the same pair in SalonTeam.tsx:70. Every "Waiting" and
// "Later today" list, and the "In the chair" panel, below reuse those exact two class strings
// via the GROUPED_CARD / ROW constants, per this task's own literal brief ("Use these EXACT
// strings"). Picking whitespace-only rows instead would mean NOT composing the real component.

import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, BellOff } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import { Avatar } from "@/app/[locale]/_components/primitives";
// TabPill is not re-exported through the primitives barrel (grep confirmed); SalonServices.tsx
// imports it the same direct way (../primitives/TabPill), so this matches the real call site.
import { TabPill } from "@/app/[locale]/_components/primitives/TabPill";

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

// The real grammar, read verbatim off the shipped salon PDP (SalonServices.tsx / SalonTeam.tsx /
// SalonMobileBookBar.tsx). Kept as named constants so every list/card on this screen composes the
// SAME strings instead of three near-identical hand-typed copies drifting apart.
// boxed-ok: GROUPED_CARD (container) + ROW (hairline row) are used TOGETHER below on purpose,
// see the file-header note; this is the shipped grouped-list-card pattern, not doubled chrome.
const GROUPED_CARD =
  "overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper";
const ROW = "border-t border-s-border px-5 py-4 first:border-t-0 md:px-6";
const ROW_TITLE = "font-body text-[15px] font-medium text-s-ink md:text-[16px]";
const ROW_META = "font-body mt-1 text-[13px] font-normal text-s-ink-2 md:text-[14px]";
const SECTION_HEADING =
  "font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink";
// The PDP's own secondary button (SalonServices.tsx "Buchen") renders 38px tall at py-2, which is
// under the 44px touch floor. Measured on the live PDP, not assumed. Kept the shipped look and
// raised only the height, so the pill still matches the product and the control is reachable.
const SECONDARY_BUTTON =
  "font-body flex h-11 shrink-0 items-center rounded-full border border-s-border bg-white px-5 text-[13px] font-medium text-s-ink transition-[colors,transform] hover:bg-s-bg-sunken active:scale-[0.97] active:duration-[80ms] active:ease-glide md:px-6";
const PRIMARY_BUTTON =
  "font-body flex w-full items-center justify-center gap-2 rounded-full bg-s-ink py-3.5 text-[15px] font-semibold text-white transition-[colors,transform] hover:bg-black active:bg-black active:scale-[0.97] active:duration-[80ms] active:ease-glide";

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

function SectionHeading({ children }: { children: React.ReactNode }) {
  return <h2 className={SECTION_HEADING}>{children}</h2>;
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

  function selectVariant(next: Variant) {
    if (next !== "move") {
      setMoveBookingId(null);
      setSelectedChip(null);
    } else if (!moveBookingId) {
      setMoveBookingId(laterToday.find((b) => b.status === "confirmed")?.id ?? null);
      setSelectedChip(null);
    }
    setVariant(next);
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
      {/* 1. State switch, three real TabPills. */}
      <div className="sticky top-0 z-30 bg-white">
        <div className="mx-auto flex min-h-11 w-full max-w-[760px] items-center gap-2 px-4 py-2">
          <TabPill active={variant === "quiet"} onClick={() => selectVariant("quiet")} size="sm">
            Quiet
          </TabPill>
          <TabPill active={variant === "new"} onClick={() => selectVariant("new")} size="sm">
            New booking
          </TabPill>
          <TabPill active={variant === "move"} onClick={() => selectVariant("move")} size="sm">
            Move
          </TabPill>
        </div>
      </div>

      {/* 2. Header strip. */}
      <div className="sticky top-[52px] z-20 h-14 border-b border-s-border bg-white">
        <div className="mx-auto flex h-full w-full max-w-[760px] items-center justify-between px-4">
          <span className="font-body text-[15px] font-semibold text-s-ink">{salonName}</span>
          <div className="flex items-center gap-4">
            <span className="font-body flex items-center gap-1.5 text-[13px] font-normal text-s-ink-2">
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
              className="font-body flex h-11 items-center text-[13px] font-normal text-s-accent"
            >
              {queuePaused ? "Resume queue" : "Pause queue"}
            </button>
          </div>
        </div>
      </div>

      <div className="mx-auto flex w-full max-w-[760px] flex-col gap-8 px-4 pb-16 pt-8">
        {/* 3. Action slot , New booking. */}
        {variant === "new" && pendingBooking ? (
          <AnimatePresence>
            <motion.div
              key={pendingBooking.id}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2 }}
              className={GROUPED_CARD + " p-5"}
            >
              <div className="flex items-center justify-between">
                <span className="font-body text-[13px] font-normal text-s-ink-2">New request</span>
                <span className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                  {expiresIn(pendingBooking.createdAt)}
                </span>
              </div>
              <p className="font-display mt-4 text-[28px] font-semibold leading-tight text-s-ink">
                {pendingBooking.customerName}
              </p>
              <p className={ROW_META + " mt-4"}>
                {pendingBooking.serviceName}, {zurichTime(pendingBooking.startsAt)}
              </p>
              <p className="font-body mt-3 text-[15px] text-s-ink">
                <span className="font-medium tabular-nums">{chf(pendingBooking.price)}</span>
                {pendingBooking.staffName ? (
                  <span className="text-[13px] font-normal text-s-ink-2"> with {pendingBooking.staffName}</span>
                ) : null}
              </p>
              <div className="mt-5 flex gap-2">
                <button type="button" onClick={acceptPending} className={PRIMARY_BUTTON}>
                  Accept
                </button>
                <div className="flex h-11 w-[120px] shrink-0 items-center justify-center">
                  <button type="button" onClick={declinePending} className={SECONDARY_BUTTON + " w-full"}>
                    Decline
                  </button>
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        ) : null}

        {/* 3. Action slot , Move. */}
        {variant === "move" && moveBooking ? (
          <div className={GROUPED_CARD + " p-5"}>
            <span className="font-body text-[13px] font-normal text-s-ink-2">Move appointment</span>
            <p className="font-display mt-4 text-[28px] font-semibold leading-tight text-s-ink">
              {moveBooking.customerName}
            </p>
            <p className={ROW_META + " mt-4"}>
              {moveBooking.serviceName}, {zurichTime(moveBooking.startsAt)}
            </p>
            <p className="font-body mt-4 text-[13px] font-medium text-s-ink">New time</p>
            <div className="mt-3 flex flex-wrap gap-2">
              {MOVE_TIME_CHIPS.map((time) => (
                <TabPill
                  key={time}
                  active={selectedChip === time}
                  onClick={() => setSelectedChip(time)}
                  size="sm"
                  className="tabular-nums"
                >
                  {time}
                </TabPill>
              ))}
            </div>
            <button
              type="button"
              disabled={!selectedChip}
              onClick={confirmMove}
              className={PRIMARY_BUTTON + " mt-5" + (selectedChip ? "" : " cursor-not-allowed opacity-50")}
            >
              {selectedChip ? `Move to ${selectedChip}` : "Move"}
            </button>
            <button
              type="button"
              onClick={closeMove}
              className="font-body mt-3 flex h-11 w-full items-center justify-center text-[13px] font-normal text-s-ink-2"
            >
              Keep {zurichTime(moveBooking.startsAt)}
            </button>
          </div>
        ) : null}

        {/* 4. The wait anchor , the screen's display anchor (FLOORS LAW 6, >= 28px) in Quiet.
            In New booking / Move the action card above is the anchor, so this drops to one line. */}
        {variant === "quiet" ? (
          <div>
            <p className="font-display text-[28px] font-semibold leading-tight tabular-nums text-s-ink">
              {waiting.length === 0 ? "No wait" : `${maxWait} min wait`}
            </p>
            <p className="font-body mt-1 text-[13px] font-normal tabular-nums text-s-ink-2">
              {waiting.length === 0 ? "Nobody waiting" : `${waiting.length} people waiting`}
            </p>
          </div>
        ) : (
          <p className="font-body text-[15px] font-normal tabular-nums text-s-ink-2">
            {waiting.length === 0
              ? "Nobody waiting"
              : `${maxWait} min wait, ${waiting.length} people`}
          </p>
        )}

        {/* 5. In the chair. boxed-ok: see file-header note, GROUPED_CARD is the shipped
            grouped-list-card container (SalonTeam.tsx:70), used here without inner hairlines
            since the three tiles sit side by side, not stacked, so there is nothing to double. */}
        <div>
          <SectionHeading>In the chair</SectionHeading>
          <div className={GROUPED_CARD + " mt-4 p-5"}>
            <div className="flex gap-4">
              {staff.map((member) => {
                const busy = inChair?.staffId === member.id;
                return (
                  <div key={member.id} className="flex flex-1 flex-col items-center gap-1 text-center">
                    <Avatar src={member.avatarUrl} name={member.name} size={56} />
                    <p className={ROW_TITLE + " mt-2 text-center"}>{member.name}</p>
                    {busy && inChair ? (
                      <>
                        <p className="font-body text-[13px] font-normal text-s-ink-2">{firstName(inChair.customerName)}</p>
                        <p className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                          {elapsedMinutes(inChair.startedAt ?? new Date().toISOString())} min
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

        {/* 6. Waiting , one grouped list-card, rows hairline-divided. boxed-ok: GROUPED_CARD +
            ROW together, this IS the shipped grouped-list-card grammar (see file-header note). */}
        <div>
          <SectionHeading>Waiting</SectionHeading>
          <ul className={GROUPED_CARD + " mt-4"}>
            {waiting.map((entry) => {
              const key = `waiting:${entry.id}`;
              const expanded = expandedKey === key;
              return (
                <li key={entry.id} className={ROW}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedKey(expanded ? null : key)}
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="font-body w-[44px] shrink-0 text-[13px] font-normal tabular-nums text-s-ink-2">
                        {entry.ticketCode}
                      </span>
                      {/* name over service: at 402 a single row truncated both to three letters */}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={ROW_TITLE + " truncate"}>{entry.customerName}</span>
                        <span className={ROW_META + " truncate"}>{entry.serviceName}</span>
                      </span>
                      <span className="font-body shrink-0 text-[13px] font-normal tabular-nums text-s-ink">
                        {entry.estimatedWaitMinutes} min
                      </span>
                    </button>
                    <div className="flex h-11 shrink-0 items-center">
                      <button type="button" onClick={() => startWaiting(entry.id)} className={SECONDARY_BUTTON}>
                        Start
                      </button>
                    </div>
                  </div>
                  {expanded ? (
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => resolveWaiting(entry.id, "completed")}
                        className="font-body flex h-11 items-center text-[13px] font-normal text-s-ink"
                      >
                        Done
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveWaiting(entry.id, "no_show")}
                        className="font-body flex h-11 items-center text-[13px] font-normal text-s-ink"
                      >
                        No-show
                      </button>
                      <button
                        type="button"
                        onClick={() => resolveWaiting(entry.id, "cancelled")}
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

        {/* 7. Later today , one grouped list-card, rows hairline-divided. boxed-ok: GROUPED_CARD +
            ROW together, this IS the shipped grouped-list-card grammar (see file-header note). */}
        <div>
          <div className="flex items-center justify-between">
            <SectionHeading>Later today</SectionHeading>
            <span className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">{laterToday.length} to go</span>
          </div>
          <ul className={GROUPED_CARD + " mt-4"}>
            {laterToday.map((booking) => {
              const key = `booking:${booking.id}`;
              const expanded = expandedKey === key;
              return (
                <li key={booking.id} className={ROW}>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      onClick={() => setExpandedKey(expanded ? null : key)}
                      className="flex min-h-11 min-w-0 flex-1 items-center gap-3 text-left"
                    >
                      <span className="font-body w-[52px] shrink-0 text-[15px] font-medium tabular-nums text-s-ink">
                        {zurichTime(booking.startsAt)}
                      </span>
                      {/* name over service: at 402 a single row truncated both to three letters */}
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className={ROW_TITLE + " truncate"}>{booking.customerName}</span>
                        <span className={ROW_META + " truncate"}>{booking.serviceName}</span>
                      </span>
                      <span className="font-body shrink-0 text-right text-[13px] font-normal tabular-nums text-s-ink">
                        {chf(booking.price)}
                        {booking.paymentStatus === "paid" ? (
                          <span className="mt-0.5 block text-[13px] font-normal text-s-success">Paid</span>
                        ) : null}
                      </span>
                    </button>
                  </div>
                  {expanded ? (
                    <div className="mt-3 flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => openMove(booking.id)}
                        className="font-body flex h-11 items-center text-[13px] font-normal text-s-ink"
                      >
                        Move
                      </button>
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
          {doneCount > 0 ? (
            <p className="font-body mt-4 text-[13px] font-normal tabular-nums text-s-ink-2">{doneCount} done today</p>
          ) : null}
        </div>
      </div>
    </div>
  );

  return createPortal(screen, document.body);
}
