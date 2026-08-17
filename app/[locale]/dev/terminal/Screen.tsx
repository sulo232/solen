"use client";

// exists-check: net-new vs app/[locale]/dev/terminal/Terminal.tsx and .../b/B.tsx (both are the
// PRIOR terminal layouts being replaced, explicitly not extended per this build's brief) and vs
// app/[locale]/dev/terminal/page.tsx / loadTerminalData.ts (those stay as-is; page.tsx is updated
// separately to render this component instead of B). components-legacy/ui/FilterBottomSheet.tsx,
// staff/StaffProfilePage.tsx, staff/StaffReviewsSheet.tsx, booking/StaffProfileSheet.tsx and
// _plans/motion-audit/PROFILE_LOYALTY_QUEUE.md are unrelated surfaces (sheets/staff-profile/motion
// docs, not a merchant terminal). This file is a from-scratch screen for the SAME route, replacing
// the b/B.tsx direction per the owner's rejection of it; b/B.tsx stays on disk untouched for
// comparison, this is not a duplicate of it.
//
// New build, written from nothing (see the header note on page.tsx for why the old
// b/B.tsx direction was retired). Shape taken from the owner's "weto" reference: a
// dark top band a white sheet overlaps, big left-aligned sentence headings, a
// floating bottom pill bar, and a story-row of circular avatars. Composed only from
// the Avatar primitive + the four named Terminal.tsx helpers, per the brief; every
// class string below is hand-written for this screen, nothing copied from Terminal.tsx
// or b/B.tsx layout.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Bell, Clock, LayoutGrid, Menu, Users } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";
import { chf, firstName, zurichTime } from "./Terminal";
import type { TerminalBooking, TerminalQueueEntry, TerminalStaff } from "./Terminal";

interface ScreenProps {
  salonName: string;
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
  staff: TerminalStaff[];
}

type NavKey = "board" | "staff" | "clock" | "profile";

export default function Screen({ salonName, bookings: initialBookings, queue: initialQueue, staff }: ScreenProps) {
  const [bookings, setBookings] = useState<TerminalBooking[]>(initialBookings);
  const [queue, setQueue] = useState<TerminalQueueEntry[]>(initialQueue);
  const [activeNav, setActiveNav] = useState<NavKey>("board");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  function handleStart(id: string) {
    setQueue((prev) =>
      prev.map((entry) =>
        entry.id === id ? { ...entry, status: "in_chair", startedAt: new Date().toISOString() } : entry,
      ),
    );
  }

  function handleAccept(id: string) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "confirmed" } : b)));
  }

  function handleDecline(id: string) {
    setBookings((prev) => prev.map((b) => (b.id === id ? { ...b, status: "cancelled" } : b)));
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending_approval");
  const waitingQueue = [...queue]
    .filter((q) => q.status === "waiting")
    .sort((a, b) => a.position - b.position);
  const todaysBookings = [...bookings]
    .filter((b) => b.status !== "pending_approval" && b.status !== "cancelled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));

  const waitMinutes = waitingQueue.length ? Math.max(...waitingQueue.map((q) => q.estimatedWaitMinutes)) : 0;
  const headline = waitingQueue.length === 0 ? "Nobody is waiting" : `The wait is ${waitMinutes} minutes`;

  const navButtons: { key: NavKey; icon: typeof LayoutGrid; label: string }[] = [
    { key: "board", icon: LayoutGrid, label: "Board" },
    { key: "staff", icon: Users, label: "Staff" },
    { key: "clock", icon: Clock, label: "Clock" },
  ];

  const screen = (
    <div className={mounted ? "fixed inset-0 z-[10000] overflow-y-auto bg-white" : "relative z-[10000] min-h-[100dvh] w-full bg-white"}>
      {/* Dark band the white sheet overlaps. */}
      <div className="relative flex h-[110px] items-center justify-center bg-s-ink px-4">
        <button
          type="button"
          aria-label="Menu"
          className="absolute left-4 flex h-11 w-11 items-center justify-center rounded-full text-white"
        >
          <Menu size={22} strokeWidth={1.75} />
        </button>
        <span className="font-heading truncate px-14 text-[18px] font-semibold text-white">{salonName}</span>
        <button
          type="button"
          aria-label="Notifications"
          className="absolute right-4 flex h-11 w-11 items-center justify-center rounded-full text-white"
        >
          <Bell size={22} strokeWidth={1.75} />
        </button>
      </div>

      {/* Sheet: overlaps the band by 20px, very round top corners, drag handle. */}
      <div className="relative z-10 -mt-5 min-h-[calc(100dvh-90px)] rounded-t-[32px] bg-white pb-[calc(96px+env(safe-area-inset-bottom))]">
        <div className="mx-auto mt-[10px] h-1 w-9 rounded-full bg-s-border" />

        {/* Staff row: full-bleed horizontal scroll of circular avatars. */}
        <div className="overflow-x-auto no-scrollbar">
          <div className="flex gap-4 px-5 pb-1 pt-5">
            {staff.map((member) => {
              const inChair = queue.find((q) => q.staffId === member.id && q.status === "in_chair");
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

        {/* Headline block. */}
        <div className="px-5 pt-6">
          <h1 className="font-heading text-[30px] font-semibold leading-[1.1] text-s-ink">{headline}</h1>
          <p className="font-body mt-1 text-[13px] font-normal text-s-ink-2">
            {waitingQueue.length} people in the queue
          </p>
        </div>

        {/* The one decision that needs to stay alive. Rendered from a .map() defensively (the
            data shape allows more than one pending_approval row), but this is structurally the
            single page-level commit the screen surfaces above everything else, not a peer-list
            row: the seeded data carries exactly one, per _plans/MERCHANT_TERMINAL_2026-08-15.md. */}
        {pendingBookings.length > 0 && (
          <div className="mt-6">
            {pendingBookings.map((booking) => (
              <div key={booking.id} className="border-b border-s-border px-5 pb-5">
                <p className="font-body text-[13px] font-semibold text-s-ink-2">Needs a decision</p>
                <p className="font-body mt-2 truncate text-[15px] font-medium text-s-ink">{booking.customerName}</p>
                <p className="font-body mt-0.5 truncate text-[13px] font-normal text-s-ink-2">
                  {booking.serviceName} at {zurichTime(booking.startsAt)}
                </p>
                <div className="mt-3 flex gap-3">
                  <button type="button" onClick={() => handleAccept(booking.id)} className="font-body flex h-11 flex-1 items-center justify-center rounded-full bg-s-ink text-[15px] font-semibold text-white">Accept</button> {/* row-ink-ok: single page-level "needs a decision" commit, not a peer-list row */}
                  <button
                    type="button"
                    onClick={() => handleDecline(booking.id)}
                    className="font-body flex h-11 w-[120px] items-center justify-center rounded-full border border-s-border bg-white text-[15px] font-medium text-s-ink"
                  >
                    Decline
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Waiting list. */}
        <div className="mt-6">
          <p className="font-body px-5 text-[13px] font-semibold text-s-ink-2">Waiting</p>
          {waitingQueue.length === 0 ? (
            <p className="font-body px-5 pt-3 text-[13px] font-normal text-s-ink-2">Nobody is waiting right now.</p>
          ) : (
            <ul>
              {waitingQueue.map((entry) => (
                <li key={entry.id} className="flex items-center gap-3 border-t border-s-border px-5 py-4 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] font-normal text-s-ink-2">#{entry.ticketCode}</p>
                    <p className="font-body mt-0.5 truncate text-[15px] font-medium text-s-ink">{entry.customerName}</p>
                    <p className="font-body mt-0.5 truncate text-[13px] font-normal text-s-ink-2">{entry.serviceName}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-2">
                    <span className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                      {entry.estimatedWaitMinutes} min
                    </span>
                    {/* row-commit rung (CONTROL_ELEVATION.md AMENDMENT 2026-07-24): a peer-list row
                        commit stays white + hairline + whisper, not ink, so the ink fill above stays
                        the one page-level commit. */}
                    <button
                      type="button"
                      onClick={() => handleStart(entry.id)}
                      className="font-body flex h-11 items-center justify-center rounded-full border border-s-border bg-white px-4 text-[15px] font-semibold text-s-ink shadow-whisper"
                    >
                      Start
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Today's appointments. */}
        <div className="mt-6">
          <p className="font-body px-5 text-[13px] font-semibold text-s-ink-2">Today</p>
          {todaysBookings.length === 0 ? (
            <p className="font-body px-5 pt-3 text-[13px] font-normal text-s-ink-2">Nothing else booked today.</p>
          ) : (
            <ul>
              {todaysBookings.map((booking) => (
                <li key={booking.id} className="flex items-center gap-3 border-t border-s-border px-5 py-4 first:border-t-0">
                  <div className="min-w-0 flex-1">
                    <p className="font-body text-[13px] font-normal tabular-nums text-s-ink-2">
                      {zurichTime(booking.startsAt)}
                    </p>
                    <p className="font-body mt-0.5 truncate text-[15px] font-medium text-s-ink">{booking.customerName}</p>
                    <p className="font-body mt-0.5 truncate text-[13px] font-normal text-s-ink-2">{booking.serviceName}</p>
                  </div>
                  <span className="font-body shrink-0 text-[13px] font-medium tabular-nums text-s-ink">
                    {chf(booking.price)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {/* Floating bottom pill bar. */}
      <div className="fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto flex max-w-[360px] items-center justify-between rounded-full bg-white px-3 py-2 shadow-elevation-2">
          {navButtons.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              aria-label={label}
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
            aria-label="Your profile"
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
