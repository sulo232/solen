"use client";

// exists-check: net-new vs app/[locale]/dev/terminal/Terminal.tsx and .../b/B.tsx (both are the
// PRIOR terminal layouts being replaced, explicitly not extended per this build's brief) and vs
// app/[locale]/dev/terminal/page.tsx / loadTerminalData.ts (those stay as-is; page.tsx renders this
// component). The chime helper lives in ./prototype.ts rather than being
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
import { useRouter } from "next/navigation";
import { createPortal } from "react-dom";
import { Bell, BellOff, Check, Clock, LayoutGrid, MoreHorizontal, RotateCcw, Trash2, UserX, Users } from "lucide-react";
import { Avatar } from "@/app/[locale]/_components/primitives";
import StaffChip from "./StaffChip";
import { minutesLeft, staffTone, waitingTone, TONE_TEXT } from "./status";
import { chf, elapsedMinutes, firstName, zurichTime } from "./Terminal";
import type { TerminalBooking, TerminalQueueEntry, TerminalStaff } from "./Terminal";
import { getAudioContextCtor, playArrivalChime } from "./prototype";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { TERMINAL_SALON_ID } from "./loadTerminalData";
import type { TerminalService } from "./loadTerminalData";
import { zurichWallClockToUtc } from "@/lib/time/zurich";

interface ScreenProps {
  salonName: string;
  bookings: TerminalBooking[];
  queue: TerminalQueueEntry[];
  staff: TerminalStaff[];
  services: TerminalService[];
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
//
// TWO WEIGHTS, 2026-08-17. The screen ran three (400/500/600) against a written ceiling of two, and
// the doc recorded the breach as if it were the spec. The 500 is gone, and nothing was lost, because
// this system's own contract already says the name leads BY SIZE: a customer's name is 15 against a
// 13 meta line, which is a clear step without a second lever. 600 is now reserved for the four
// things that genuinely commit or label: the anchor, the section labels, the buttons, and anything
// wrong. Measured before: 18 elements at 500. After: none.
const ROW = "flex items-center gap-3 border-t border-s-border px-5 py-4 first:border-t-0";
const ROW_LEAD = "font-body text-[13px] font-normal text-s-ink-2";
const ROW_NAME = "font-body mt-0.5 truncate text-[15px] font-normal text-s-ink";
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
// How many decisions get the boxed treatment before the rest fall back to bare rows. Measured on the
// live screen at 390x844: four boxes took 57.8% of the viewport, three took 43%, and in both cases
// not one waiting person was visible. Two is 29%, which clears the 35% ceiling and leaves the queue
// on screen. The number is the answer to a measurement, not a preference.
const DECISION_CARD_CAP = 2;

// Every colour on this screen comes from ./status.ts, which is the one place that says what a tone
// MEANS and what has to be true in the data for it to appear. The ring around a stylist's photo is
// where it shows (./StaffChip.tsx). Nothing here picks a colour on its own.

// DAY + TIME for the phone-booking sheet (2026-08-18). The old chip row was minutes from now, so
// "tomorrow" silently meant this exact minute in 24 hours and a call asking for Thursday at 14:00
// could not be recorded at all. These replace it with two pill rows in the same grammar as the
// service and stylist rows above. Local to this screen: the Zurich date helpers in
// loadTerminalData.ts are not exported and that file is out of scope for this fix.
const ZURICH_DATE_FMT = new Intl.DateTimeFormat("en-CA", {
  timeZone: "Europe/Zurich",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const ZURICH_CLOCK_FMT = new Intl.DateTimeFormat("en-GB", {
  timeZone: "Europe/Zurich",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});
const ZURICH_WEEKDAY_FMT = new Intl.DateTimeFormat("en-GB", { timeZone: "Europe/Zurich", weekday: "short" });

function zurichToday(): string {
  const parts = ZURICH_DATE_FMT.formatToParts(new Date());
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

function addDays(dateStr: string, days: number): string {
  const [y, m, d] = dateStr.split("-").map(Number);
  return new Date(Date.UTC(y, m - 1, d + days)).toISOString().slice(0, 10);
}

// The loader window now reaches one day past today (R19-4), so bookings need to be split by Zurich
// CALENDAR DAY, not a fixed 24-hour offset from now: "add a day" gets a booking at 23:30 tonight and
// one at 00:30 tomorrow onto the wrong sides of each other across the DST switch.
function zurichDateOf(iso: string): string {
  const parts = ZURICH_DATE_FMT.formatToParts(new Date(iso));
  const y = parts.find((p) => p.type === "year")?.value ?? "1970";
  const m = parts.find((p) => p.type === "month")?.value ?? "01";
  const d = parts.find((p) => p.type === "day")?.value ?? "01";
  return `${y}-${m}-${d}`;
}

// Today plus the next 13, fourteen pills, because a salon books a few weeks out and a row scrolls.
function dayOptions(todayStr: string): { value: string; label: string }[] {
  return Array.from({ length: 14 }, (_, i) => {
    const value = addDays(todayStr, i);
    if (i === 0) return { value, label: "Today" };
    if (i === 1) return { value, label: "Tomorrow" };
    const [y, m, d] = value.split("-").map(Number);
    const noon = new Date(Date.UTC(y, m - 1, d, 12, 0, 0));
    return { value, label: `${ZURICH_WEEKDAY_FMT.format(noon)} ${d}` };
  });
}

// Quarter hours 08:00 to 19:00, fixed regardless of which day is picked.
const ALL_TIME_SLOTS: { hour: number; minute: number }[] = (() => {
  const slots: { hour: number; minute: number }[] = [];
  for (let h = 8; h <= 19; h++) {
    for (const m of [0, 15, 30, 45]) {
      if (h === 19 && m > 0) break;
      slots.push({ hour: h, minute: m });
    }
  }
  return slots;
})();

function zurichNow(): { hour: number; minute: number } {
  const parts = ZURICH_CLOCK_FMT.formatToParts(new Date());
  return {
    hour: Number(parts.find((p) => p.type === "hour")?.value ?? "0"),
    minute: Number(parts.find((p) => p.type === "minute")?.value ?? "0"),
  };
}

// TODAY drops every slot already past. If that empties the row (the shop is calling after 19:00),
// fall back to the next quarter hour from now, so the row is never empty.
function timeOptionsFor(dateStr: string, todayStr: string): { hour: number; minute: number }[] {
  if (dateStr !== todayStr) return ALL_TIME_SLOTS;
  const now = zurichNow();
  const nowTotal = now.hour * 60 + now.minute;
  const upcoming = ALL_TIME_SLOTS.filter((s) => s.hour * 60 + s.minute > nowTotal);
  if (upcoming.length > 0) return upcoming;
  const nextTotal = Math.ceil((nowTotal + 1) / 15) * 15;
  return [{ hour: Math.floor(nextTotal / 60) % 24, minute: nextTotal % 60 }];
}

function timeLabel(t: { hour: number; minute: number }): string {
  return `${String(t.hour).padStart(2, "0")}:${String(t.minute).padStart(2, "0")}`;
}

// WHERE "THE SHOP LAST TOLD US ANYTHING" SURVIVES A RELOAD (2026-08-18). `lastTouched` used to be
// forgotten the moment the tablet refreshed, which meant the one thing that could clear the stale
// warning on purpose reset itself every reload. Keyed per salon, not globally, so a browser that
// ever tests a second salon's terminal never reads the wrong shop's "I checked this".
const LAST_TOUCHED_KEY = `terminal:${TERMINAL_SALON_ID}:last-touched`;

export default function Screen({
  salonName,
  bookings: initialBookings,
  queue: initialQueue,
  staff,
  services,
}: ScreenProps) {
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
  // Which row has its menu open. One at a time, by id, so a second tap elsewhere closes the first.
  const [menuFor, setMenuFor] = useState<string | null>(null);
  // Which of the two menus is open. They are separate on purpose: one picks a chair, the other ends
  // a queue entry, and a single menu doing both was the version he rejected.
  const [menuKind, setMenuKind] = useState<"chair" | "more">("more");
  // Shown only when a write did NOT land, so the board never quietly disagrees with the database.
  const [writeError, setWriteError] = useState<string | null>(null);
  // Whether the live booking feed is actually connected. Shown on the Shop view, because "no new
  // bookings" and "not listening" look identical on a board and mean opposite things.
  const [feedLive, setFeedLive] = useState(false);
  // The phone-booking sheet. Open, three taps and a name, closed. It is a sheet rather than a row
  // because it is the only thing on this screen that needs a keyboard, and the keyboard is the whole
  // cost: the outside council's four-second nameless version broke on the case that decides this
  // feature, a stylist calling in sick and the shop having to ring those customers back.
  const [phoneOpen, setPhoneOpen] = useState(false);
  const [phoneName, setPhoneName] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneStaff, setPhoneStaff] = useState<string | null>(null);
  const [phoneService, setPhoneService] = useState<string | null>(null);
  const [phoneDay, setPhoneDay] = useState<string>(() => zurichToday());
  const [phoneTime, setPhoneTime] = useState<{ hour: number; minute: number } | null>(null);
  const [phoneSaving, setPhoneSaving] = useState(false);
  // WHEN THE SHOP LAST TOLD US ANYTHING. His concern, and the one my phone-booking form did not
  // answer: the risk is not that they cannot type a booking in, it is what happens when they stop.
  // The moment they stop, this board keeps stating a wait and painting chairs green with total
  // confidence, and confident and wrong is the thing that makes people abandon a screen. So it
  // tracks its own freshness and says plainly when it is out of date instead of guessing on.
  const [lastTouched, setLastTouched] = useState<string | null>(null);
  // Where the menu goes, in viewport coordinates, measured from the button that opened it. Anchoring
  // it to the ROW put it under the floating bar for anything low on the screen and clean off the
  // screen for a row below the fold; a fixed menu placed from a measured rect cannot do either.
  const [menuAt, setMenuAt] = useState<{ top: number; right: number } | null>(null);
  const [, forceTick] = useState(0);

  const router = useRouter();
  const audioCtxRef = useRef<AudioContext | null>(null);
  // Read inside the subscription callback, which is created once: a state value captured there would
  // be the value from mount forever, so turning the sound on later would never be heard.
  const soundOnRef = useRef(false);
  // The wait each person had when the page first opened, captured ONCE. Replay rebases to these, so
  // the tenth run of the demo opens exactly as the first one did rather than a little later.
  const openingWaitsRef = useRef<Record<string, number>>(
    Object.fromEntries(
      initialQueue.filter((q) => q.joinedAt).map((q) => [q.id, elapsedMinutes(q.joinedAt as string)]),
    ),
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  // READ THE LAST CONFIRMATION BACK. Deliberately a post-mount effect, not the `useState`
  // initialiser: `page.tsx` server-renders this screen, the server has no localStorage, and reading
  // it synchronously during render would make the first client render disagree with the server's
  // HTML the instant a real confirmation exists. Waiting for mount costs one extra render and buys a
  // hydration that never mismatches.
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LAST_TOUCHED_KEY);
      if (stored) setLastTouched((cur) => cur ?? stored);
    } catch (err) {
      // Storage can be unavailable (private mode, quota). The board simply opens as if nobody had
      // confirmed it yet, which is the safe direction to be wrong in.
      console.error("[Terminal] could not read the last-checked time:", err);
    }
  }, []);

  // Only the in-chair elapsed minutes are derived from the wall clock, and a minute is the smallest
  // unit any of them render, so 15s is as often as this can possibly change anything on screen.
  useEffect(() => {
    const id = setInterval(() => forceTick((t) => t + 1), 15_000);
    return () => clearInterval(id);
  }, []);

  // EVERY ACTION IS A REAL WRITE NOW (R12-1/R12-3a). It used to change React state and vanish on
  // reload, which meant a chair you freed came back occupied. The screen still moves immediately,
  // because a counter cannot wait on a round trip, and then the write either confirms it or the
  // error line says it did not land. A silent failure here would be worse than no write at all: the
  // board would say one thing and the shop would be another.
  const commit = useCallback(async (body: Record<string, unknown>) => {
    try {
      const res = await fetch("/api/dev/terminal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      touch();
      if (!res.ok) {
        const detail = await res.json().catch(() => ({}));
        console.error("[Terminal] the write was refused:", res.status, detail);
        setWriteError(
          res.status === 409
            ? "That chair is already taken. The board has been put back."
            : "That did not save. The board has been put back.",
        );
        return false;
      }
      setWriteError(null);
      return true;
    } catch (err) {
      console.error("[Terminal] could not reach the server:", err);
      setWriteError("No connection. The board has been put back.");
      return false;
    }
  }, []);

  const touch = useCallback(() => {
    const now = new Date().toISOString();
    setLastTouched(now);
    try {
      window.localStorage.setItem(LAST_TOUCHED_KEY, now);
    } catch (err) {
      // Same fallback as the read above: the state still updates for this session, it just will
      // not survive a reload. Not fatal, nothing downstream depends on the write succeeding.
      console.error("[Terminal] could not save the last-checked time:", err);
    }
  }, []);

  const addToLog = useCallback((text: string) => {
    setLog((prev) => [{ id: `log-${prev.length}-${Date.now()}`, at: new Date().toISOString(), text }, ...prev]);
  }, []);

  // A REAL ARRIVAL (R12-3b). Until 2026-08-17 `bookings` was not in the `supabase_realtime`
  // publication, so no subscription could fire and the two arrivals on this screen were scripted in
  // prototype.ts. The publication carries it now, so this listens for the real thing: a booking
  // inserted for this salon by anyone, from anywhere, lands here with the same tint and the same
  // chime the scripted ones had.
  //
  // The insert payload is the raw row, so the service name is not on it. Rather than invent one, the
  // row is added with what the database actually said and the screen reloads its data in the
  // background to fill in the joined names. A guessed service name would be exactly the fabrication
  // this project bans.
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    // THE SOCKET NEEDS THE TOKEN, EXPLICITLY. `bookings` is protected by `bookings_select_own`, so
    // realtime only delivers a row to a subscriber whose token can read it. Without this the channel
    // still reports SUBSCRIBED and simply never fires, which is the exact silent-no-op this project
    // names as its worst failure: measured here first, three inserts that reached the database and
    // never reached the screen while the log said SUBSCRIBED.
    void (async () => {
      const { data } = await supabase.auth.getSession();
      const token = data.session?.access_token;
      if (token) await supabase.realtime.setAuth(token);
      channel = subscribeToBookings(supabase);
    })();

    function subscribeToBookings(client: typeof supabase) {
      return client
      .channel("terminal-bookings")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "bookings", filter: `salon_id=eq.${TERMINAL_SALON_ID}` },
        (payload) => {
          const row = payload.new as Record<string, unknown>;
          const arrival: TerminalBooking = {
            id: String(row.id),
            startsAt: String(row.starts_at),
            endsAt: String(row.ends_at ?? row.starts_at),
            status: String(row.status ?? "pending_approval"),
            customerName: String(row.guest_name ?? "Guest"),
            serviceName: "Booking",
            price: Number(row.estimated_price ?? 0),
            paymentStatus: String(row.payment_status ?? "none"),
            createdAt: String(row.created_at ?? new Date().toISOString()),
            arrivedAt: (row.arrived_at as string) ?? null,
            staffId: (row.staff_id as string) ?? null,
            staffName: null,
          };
          setBookings((prev) => (prev.some((b) => b.id === arrival.id) ? prev : [arrival, ...prev]));
          setFreshId(arrival.id);
          setTimeout(() => setFreshId((cur) => (cur === arrival.id ? null : cur)), 1500);
          addToLog(`${arrival.customerName} booked`);
          if (soundOnRef.current && audioCtxRef.current) playArrivalChime(audioCtxRef.current);
          router.refresh();
        },
      )
      // The status is LOGGED, not assumed. A postgres_changes subscription that is refused by RLS or
      // by the publication fails silently and looks exactly like a quiet shop, which is this
      // project's named worst failure mode. CHANNEL_ERROR here means the session cannot read
      // `bookings`: the policy is `bookings_select_own`, so the screen must be signed in as the
      // salon owner (in dev: /api/dev/login?to=/terminal).
      .subscribe((status) => {
        console.log("[Terminal] booking feed:", status);
        setFeedLive(status === "SUBSCRIBED");
      });
    }

    return () => {
      if (channel) void supabase.removeChannel(channel);
    };
  }, [addToLog, router, replayKey]);

  // Every action is reversible for eight seconds and then it is not, which is the honest version:
  // an undo that lives forever is a second source of truth.
  useEffect(() => {
    if (!undo) return;
    const t = setTimeout(() => setUndo(null), 8_000);
    return () => clearTimeout(t);
  }, [undo]);

  // Put the board back exactly as it was. Used when a write is refused, so the screen never keeps
  // showing a change the database rejected.
  function rollback(before: Snapshot) {
    setBookings(before.bookings);
    setQueue(before.queue);
    setLog(before.log);
    setUndo(null);
  }

  function snapshot() {
    setHistory((prev) => [{ bookings, queue, log }, ...prev].slice(0, 20));
  }

  // One placement rule for both menus, measured off the control that opened it. Anchoring to the row
  // put the menu under the floating bar for anything low on the screen.
  function openMenu(
    e: React.MouseEvent,
    id: string,
    kind: "chair" | "more",
    rect?: DOMRect,
  ) {
    const r = rect ?? (e.currentTarget as HTMLElement).getBoundingClientRect();
    const height = kind === "chair" ? 56 * Math.max(1, staff.length) + 8 : 56 * 2 + 8;
    // The floating bar owns the bottom ~96px, so "fits below" has to stop above it, not at the
    // window edge. Without this the menu opened downward and sat behind the bar by about 20px.
    const usableBottom = window.innerHeight - 96;
    const top = r.bottom + height > usableBottom ? r.top - height : r.bottom + 8;
    setMenuAt({ top: Math.max(16, top), right: Math.max(16, window.innerWidth - r.right) });
    const sameOne = menuFor === id && menuKind === kind;
    setMenuKind(kind);
    setMenuFor(sameOne ? null : id);
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
      soundOnRef.current = false;
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
      soundOnRef.current = true;
    } catch (err) {
      console.error("[Terminal] could not start the arrival sound:", err);
    }
  }

  // Replay has to rebase the CLOCK, not just the rows. Caught by a verifier 2026-08-17: two waiting
  // people read "waited longer than promised" the instant the demo restarted, because the rows came
  // back from the seed while their `joined_at` stayed where it was in real time, so a fresh run
  // opened already late. Every waiting entry restarts at the same fraction of its own promise it had
  // when the page first loaded, which is what "replay" has to mean for anything time-derived.
  function handleReplay() {
    setBookings(initialBookings);
    const now = Date.now();
    setQueue(
      initialQueue.map((q) => {
        const opening = openingWaitsRef.current[q.id];
        if (opening === undefined) return q;
        return { ...q, joinedAt: new Date(now - opening * 60_000).toISOString() };
      }),
    );
    setLog([]);
    setHistory([]);
    setUndo(null);
    setFreshId(null);
    setActiveNav("board");
    setReplayKey((k) => k + 1);
  }

  // Somebody is standing at the counter and they are the 14:30. This is what a shop does all day and
  // the product has never had a way to record it.
  function handleArrived(booking: TerminalBooking) {
    const before = { bookings, queue, log };
    snapshot();
    const at = new Date().toISOString();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, arrivedAt: at } : b)));
    addToLog(`${booking.customerName} arrived`);
    setUndo({ message: `${firstName(booking.customerName)} is here` });
    void commit({ action: "arrived", id: booking.id }).then((ok) => ok || rollback(before));
  }

  function handleUnarrive(booking: TerminalBooking) {
    const before = { bookings, queue, log };
    snapshot();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, arrivedAt: null } : b)));
    addToLog(`${booking.customerName} arrival undone`);
    setUndo({ message: `${firstName(booking.customerName)} not here after all` });
    void commit({ action: "unarrive", id: booking.id }).then((ok) => ok || rollback(before));
  }

  // THE SHOP SAYING "I LOOKED, THE DAY IS RIGHT" (2026-08-18). Before this the stale state only
  // ever cleared by accident, when someone happened to start a walk-in or mark an arrival; there
  // was no way to say it on purpose. One tap, nothing to type, no undo, because confirming that a
  // board is still right is not a destructive act with something to roll back. No server round
  // trip either: `touch()` already writes the moment to `localStorage`, which is the smallest
  // thing that survives the reload this control exists to survive.
  function handleConfirmBoard() {
    touch();
    addToLog("Board checked, up to date");
  }

  // Every name this salon has taken before, newest first, so a regular is two letters and a tap.
  // Real rows only: no invented customers, and an empty list simply shows nothing.
  const knownCustomers = Array.from(
    new Map(
      bookings
        .filter((b) => b.customerName && b.customerName !== "Guest")
        .map((b) => [b.customerName.toLowerCase(), b.customerName] as const),
    ).values(),
  );

  // Derived every render so a sheet left open past midnight still offers the right "Today". The
  // fallback in timeOptionsFor means this is never empty, so the picker always has a selection.
  const todayStr = zurichToday();
  const dayChoices = dayOptions(todayStr);
  const timeChoices = timeOptionsFor(phoneDay, todayStr);
  const selectedTime =
    phoneTime && timeChoices.some((t) => t.hour === phoneTime.hour && t.minute === phoneTime.minute)
      ? phoneTime
      : (timeChoices[0] ?? null);

  async function savePhoneBooking() {
    if (!phoneName.trim() || !phoneNumber.trim() || !phoneStaff || !phoneService || !selectedTime) return;
    setPhoneSaving(true);
    // One ISO instant from the day pill and the time pill together, via the shared Zurich helper
    // (never a hand-rolled offset, Zurich is +1 or +2 depending on the date). Sent as the absolute
    // instant, not minutes-from-now (2026-08-18 fix): a duration meant the route re-derived it
    // against its own Date.now(), a second clock reading, so the seconds between the two leaked
    // into the stored time and a 10:30 pick could land on 10:29.
    const target = zurichWallClockToUtc(phoneDay, selectedTime.hour, selectedTime.minute);
    const ok = await commit({
      action: "phone_booking",
      name: phoneName.trim(),
      phone: phoneNumber.trim(),
      staffId: phoneStaff,
      serviceId: phoneService,
      minutes: services.find((sv) => sv.id === phoneService)?.minutes ?? 30,
      startsAt: target.toISOString(),
    });
    setPhoneSaving(false);
    if (!ok) return;
    addToLog(`${phoneName.trim()} booked by phone`);
    setUndo({ message: `${firstName(phoneName.trim())} booked` });
    setPhoneOpen(false);
    setPhoneName("");
    setPhoneNumber("");
    // The row comes back from the database rather than being guessed into the list, so what the
    // screen shows after saving is what actually landed.
    router.refresh();
  }

  function handleAccept(booking: TerminalBooking) {
    const before = { bookings, queue, log };
    snapshot();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: "confirmed" } : b)));
    addToLog(`${booking.customerName} confirmed`);
    setUndo({ message: `${firstName(booking.customerName)} confirmed` });
    void commit({ action: "accept", id: booking.id }).then((ok) => ok || rollback(before));
  }

  function handleDecline(booking: TerminalBooking) {
    const before = { bookings, queue, log };
    snapshot();
    setBookings((prev) => prev.map((b) => (b.id === booking.id ? { ...b, status: "cancelled" } : b)));
    addToLog(`${booking.customerName} declined`);
    setUndo({ message: `${firstName(booking.customerName)} declined` });
    void commit({ action: "decline", id: booking.id }).then((ok) => ok || rollback(before));
  }

  // Start must MOVE the person, not delete them. The staff row shows who is in each chair by
  // matching `q.staffId === member.id`, so a start that leaves staffId null drops the customer off
  // the waiting list and out of every other list at once. Caught in verification 2026-08-17.
  // `member` is optional on purpose. The button is the fast path and picks the first free chair,
  // because at a counter the common case is "next person, next free chair" and it should cost one
  // tap. Choosing a specific stylist is a real need too (owner 2026-08-17: a customer waiting too
  // long should be movable to whoever is free), so it lives one tap deeper in the row's menu rather
  // than turning every start into a two-step picker.
  function handleStart(entry: TerminalQueueEntry, member?: TerminalStaff) {
    const before = { bookings, queue, log };
    const occupied = new Set(
      queue.filter((q) => q.status === "in_chair" && q.staffId).map((q) => q.staffId as string),
    );
    const free = member && !occupied.has(member.id) ? member : staff.find((m) => !occupied.has(m.id));
    if (!free) return;
    setMenuFor(null);
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
    void commit({ action: "start", id: entry.id, staffId: free.id }).then((ok) => ok || rollback(before));
  }

  // Both are real states on `barber_walkin_queue.status`, not invented ones: a person who never
  // turned up and a person who left. Neither is a delete, so the log keeps them and Undo restores
  // them for eight seconds like every other action.
  function handleNoShow(entry: TerminalQueueEntry) {
    const before = { bookings, queue, log };
    setMenuFor(null);
    snapshot();
    setQueue((prev) => prev.map((q) => (q.id === entry.id ? { ...q, status: "no_show" } : q)));
    addToLog(`${entry.customerName} did not turn up`);
    setUndo({ message: `${firstName(entry.customerName)} marked no-show` });
    void commit({ action: "no_show", id: entry.id }).then((ok) => ok || rollback(before));
  }

  function handleRemove(entry: TerminalQueueEntry) {
    const before = { bookings, queue, log };
    setMenuFor(null);
    snapshot();
    setQueue((prev) => prev.map((q) => (q.id === entry.id ? { ...q, status: "cancelled" } : q)));
    addToLog(`${entry.customerName} left the queue`);
    setUndo({ message: `${firstName(entry.customerName)} removed` });
    void commit({ action: "cancel", id: entry.id }).then((ok) => ok || rollback(before));
  }

  // staffId is KEPT on a finished entry on purpose: `chairOf` matches on status "in_chair" as well,
  // so the chair frees itself, and holding the id is what lets each stylist's own finished count be
  // a real derived number instead of an invented one.
  function handleDone(entry: TerminalQueueEntry) {
    const before = { bookings, queue, log };
    snapshot();
    setQueue((prev) => prev.map((q) => (q.id === entry.id ? { ...q, status: "done" } : q)));
    addToLog(`${entry.customerName} done`);
    setUndo({ message: `${firstName(entry.customerName)} done` });
    void commit({ action: "done", id: entry.id }).then((ok) => ok || rollback(before));
  }

  const pendingBookings = bookings.filter((b) => b.status === "pending_approval");
  const waitingQueue = [...queue]
    .filter((q) => q.status === "waiting")
    .sort((a, b) => a.position - b.position);
  const activeBookings = [...bookings]
    .filter((b) => b.status !== "pending_approval" && b.status !== "cancelled")
    .sort((a, b) => a.startsAt.localeCompare(b.startsAt));
  const todaysBookings = activeBookings.filter((b) => zurichDateOf(b.startsAt) === todayStr);
  const tomorrowsBookings = activeBookings.filter((b) => zurichDateOf(b.startsAt) === addDays(todayStr, 1));
  const doneCount = queue.filter((q) => q.status === "done").length;
  // Scoped to `todaysBookings` on purpose, not `activeBookings`: the loader window now reaches one
  // day further (R19-4) so the board can show tomorrow's appointments too, and summing the wider list
  // here would silently fold tomorrow's takings into today's figure with nothing on screen to say so.
  const bookedToday = todaysBookings.reduce((sum, b) => sum + (b.price ?? 0), 0);

  // Two requests for the same slot are both acceptable on their own, so accepting both double-books
  // the shop with no warning. And a slot that lands inside the queue's own reach collides with the
  // walk-ins already standing there. Both are said on the card rather than left as arithmetic.
  function conflictOf(booking: TerminalBooking): string | null {
    const clash = pendingBookings.find(
      (b) => b.id !== booking.id && zurichTime(b.startsAt) === zurichTime(booking.startsAt),
    );
    if (clash) return `Same slot as ${firstName(clash.customerName)}`;
    const minutesAway = Math.round((new Date(booking.startsAt).getTime() - Date.now()) / 60_000);
    if (minutesAway >= 0 && minutesAway < waitMinutes) {
      return `Queue runs ${waitMinutes} min, this is in ${minutesAway}`;
    }
    return null;
  }

  // A STYLIST IS BUSY IF EITHER KIND OF WORK IS ON THEM. This used to look only at the walk-in
  // queue, so a stylist in the middle of a booked appointment had no queue entry and their ring
  // rendered GREEN while they were cutting. Green is the one colour the counter acts on instantly,
  // so the board was sending the next walk-in to an occupied chair. Found 2026-08-17 by a review
  // that read the formula rather than the screen.
  const bookingOnChair = (memberId: string) => {
    const now = Date.now();
    return (
      bookings.find(
        (b) =>
          b.staffId === memberId &&
          b.status === "confirmed" &&
          new Date(b.startsAt).getTime() <= now &&
          new Date(b.endsAt).getTime() > now,
      ) ?? null
    );
  };

  const chairOf = (memberId: string) =>
    queue.find((q) => q.staffId === memberId && q.status === "in_chair") ?? null;

  const isBusy = (memberId: string) => Boolean(chairOf(memberId) || bookingOnChair(memberId));
  const freeStaff = staff.filter((member) => !isBusy(member.id));
  const freeChairs = freeStaff.length;
  const aChairIsFree = freeChairs > 0;

  // THE JOIN-NOW WAIT, computed rather than read off a column. It used to be
  // `max(estimated_wait_minutes)`, a number written into the row when the person joined, so it never
  // moved while every row beneath it ticked, and it reconciled with nothing on screen. This is the
  // work still in the shop divided by the chairs: everyone waiting at their service's own duration,
  // plus what is left of each chair, over the number of stylists. Rounded to five so it reads as an
  // estimate rather than a promise. Falls back to the stored estimate only when no service on the
  // board has a duration on file.
  // The freshest thing the shop has actually done: somebody started, somebody arrived, somebody
  // joined the queue, from the data itself, plus `lastTouched`, which is set by `touch()` inside
  // EVERY `commit()` (accept, decline, start, done, arrived, and a phone booking the shop just took)
  // and now persisted to `localStorage`, so a phone booking the shop typed in five minutes ago still
  // counts as life after the tablet reloads, not only for the rest of this tab's session. A
  // CUSTOMER'S own online booking is deliberately not in this list: it lands through the realtime
  // subscription above, which never calls `touch()`, because the shop noticing a booking arrive is
  // not the same fact as the shop having looked at the board. On first load there is no click to go
  // on, so this is what tells the board whether the day is being kept up or has been left alone
  // since the morning.
  const lastSignal = [
    lastTouched,
    ...queue.map((q) => q.startedAt),
    ...queue.map((q) => q.joinedAt),
    ...bookings.map((b) => b.arrivedAt),
  ]
    .filter(Boolean)
    .sort()
    .pop() as string | undefined;
  const staleMinutes = lastSignal ? elapsedMinutes(lastSignal) : null;
  // 90 minutes is a HOUSE NUMBER and named as one: long enough that a quiet hour does not nag,
  // short enough that a half-day of silence is called out while the day can still be fixed.
  const boardIsStale = staleMinutes !== null && staleMinutes > 90;

  const chairsCount = Math.max(1, staff.length);
  // Appointments count as work. Leaving them out was not a rounding error: a shop whose day is
  // mostly booked appointments would have shown a near-zero wait while every chair was full.
  const appointmentMinutesLeft = bookings
    .filter((b) => b.status === "confirmed" && new Date(b.endsAt).getTime() > Date.now() &&
      new Date(b.startsAt).getTime() <= Date.now())
    .reduce((sum, b) => sum + Math.max(0, Math.round((new Date(b.endsAt).getTime() - Date.now()) / 60_000)), 0);
  const workAhead =
    waitingQueue.reduce((sum, q) => sum + (q.durationMinutes ?? 0), 0) +
    queue
      .filter((q) => q.status === "in_chair")
      .reduce((sum, q) => sum + (minutesLeft(q.startedAt, q.durationMinutes) ?? 0), 0) +
    appointmentMinutesLeft;
  const computedWait = Math.round(workAhead / chairsCount / 5) * 5;
  const storedWait = waitingQueue.length ? Math.max(...waitingQueue.map((q) => q.estimatedWaitMinutes)) : 0;
  const waitMinutes = workAhead > 0 ? computedWait : storedWait;

  const navButtons: { key: NavKey; icon: typeof LayoutGrid; label: string }[] = [
    { key: "board", icon: LayoutGrid, label: "Board" },
    { key: "staff", icon: Users, label: "Chairs" },
    { key: "clock", icon: Clock, label: "Log" },
  ];

  const headline =
    activeNav === "board"
      ? waitingQueue.length === 0
        ? "Nobody is waiting"
        : boardIsStale
          ? `About ${waitMinutes} minutes`
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
      ? `If you walk in now. ${waitingQueue.length} people ahead of you.`
      : activeNav === "staff"
        ? `${staff.length} people working today`
        : activeNav === "clock"
          ? `${log.length} things so far`
          : "This screen, signed in and left open";

  const screen = (
    <div className={mounted ? "fixed inset-0 z-[10000] overflow-y-auto bg-white" : "relative z-[10000] min-h-[100dvh] w-full bg-white"}>
      {/* Dark band the white sheet overlaps. Both buttons do something: a control that is only a
          costume is a dead affordance, and this screen has none. */}
      {/* Sticky, 2026-08-17: scrolling 400px used to take the shop's name and both controls off the
          screen entirely, so the counter lost every piece of context at once. */}
      <div className="sticky top-0 z-30 flex h-[110px] items-center justify-center bg-s-ink px-4">
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
      <div className="relative z-10 -mt-5 min-h-[calc(100dvh-90px)] rounded-t-[32px] bg-white pb-[calc(88px+env(safe-area-inset-bottom)+24px)]">
        <div className="mx-auto mt-[10px] h-1 w-9 rounded-full bg-s-border" />

        {/* Staff row: full-bleed horizontal scroll of circular avatars. The board's own answer to
            "who is in a chair", so it belongs to the board and not to every view. */}
        {activeNav === "board" && (
          <div className="overflow-x-auto scrollbar-hide">
            {/* Three 104px cells plus two 16px gaps plus the 20px page padding either side comes to
                392 of 390, so a fourth stylist crops immediately, which is the scroll promise. */}
            <div className="flex gap-4 px-5 pb-1 pt-5">
              {staff.map((member) => {
                const inChair = chairOf(member.id);
                const appt = inChair ? null : bookingOnChair(member.id);
                const left = inChair
                  ? minutesLeft(inChair.startedAt, inChair.durationMinutes)
                  : appt
                    ? Math.max(0, Math.round((new Date(appt.endsAt).getTime() - Date.now()) / 60_000))
                    : null;
                return (
                  // 104 not 78: the cell is as wide as its widest LINE, not as wide as the photo.
                  // "Luca, 22 min" truncated to "Luca, 22 ..." at chip width, which is the one
                  // number the line exists to carry.
                  <div
                    key={member.id}
                    className="flex w-[104px] shrink-0 flex-col items-center text-center"
                  >
                    <StaffChip
                      name={member.name}
                      avatarUrl={member.avatarUrl}
                      tone={staffTone(isBusy(member.id), boardIsStale)}
                    />
                    <p className="font-body mt-2 w-full truncate text-[13px] font-normal text-s-ink">
                      {firstName(member.name)}
                    </p>
                    {/* Neutral on purpose: the ring is the indicator, so the word underneath must
                        not also be a colour. And a busy chair says WHEN it frees, because "who is in
                        it" without "for how long" is the half of the answer nobody needs. The
                        minutes come from the service's own duration and are omitted, never guessed,
                        when the service has none on file. */}
                    <p className="font-body w-full truncate text-[13px] font-normal text-s-ink-2">
                      {(() => {
                        const who = inChair ? inChair.customerName : appt?.customerName ?? null;
                        // "Not checked", not "Free", once the board has gone quiet. The ring already
                        // turned orange for this, and leaving the word at "Free" underneath it is the
                        // same contradiction he caught on 2026-08-17, when a green "Free" sat under an
                        // orange ring: one stylist reporting two states. The word does not repeat the
                        // colour, it says what the colour is about.
                        if (!who) return boardIsStale ? "Not checked" : "Free";
                        if (left === null) return firstName(who);
                        return `${firstName(who)}, ${left === 0 ? "now" : `${left}m`}`;
                      })()}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Headline block. One 30px anchor per view, never two. */}
        <div className={activeNav === "board" ? "px-5 pt-8" : "px-5 pt-8"}>
          <h1 className="font-heading text-[30px] font-semibold leading-[1.1] text-s-ink">{headline}</h1>
          <p className="font-body mt-1 text-[13px] font-normal text-s-ink-2">{subline}</p>
          {/* THE BOARD ADMITS WHAT IT DOES NOT KNOW, AND OFFERS THE ONE WAY OUT. A screen that
              states a wait confidently while nobody has touched it since the morning is the exact
              failure that makes staff stop trusting it, and a screen people stopped trusting is
              worse than no screen. The remedy sits in the same block as the sentence it clears
              (2026-08-18): it only exists when there is something for it to fix. */}
          {activeNav === "board" && boardIsStale && lastSignal && (
            <div className="mt-2">
              <p className="font-body text-[13px] font-medium text-s-urgency">
                Nobody has updated this since {zurichTime(lastSignal)}. Chairs may be busier than
                this shows.
              </p>
              <button
                type="button"
                onClick={handleConfirmBoard}
                className="font-body -ml-2 mt-1 flex h-11 items-center px-2 text-[13px] font-semibold text-s-accent"
              >
                I checked. The day is right.
              </button>
            </div>
          )}
          {/* Only ever visible when a write did NOT land. Red because a board that disagrees with the
              database is the one genuinely wrong state this screen can be in. */}
          {writeError && (
            <p className="font-body mt-2 text-[13px] font-semibold text-s-error">{writeError}</p>
          )}
          {undo && (
            <div className="mt-2 flex items-center gap-3">
              <p className="font-body text-[13px] font-normal text-s-ink-2">{undo.message}</p>
              <button
                type="button"
                onClick={handleUndo}
                // px-3: the target was 44 tall and 33 wide, which is a thumb-sized miss on the one
                // control that exists to rescue a mis-tap.
                className="font-body -mx-3 flex h-11 items-center px-3 text-[13px] font-semibold text-s-accent"
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
              <div className="mt-8">
                {/* ONE section header for the whole group. Every card used to repeat "Needs a
                    decision", which cost about 90px of a phone screen to say the same thing twice. */}
                <p className={SECTION + " pb-3"}>
                  Needs a decision ({pendingBookings.length})
                </p>
                <div className="px-5">
                {pendingBookings.slice(0, DECISION_CARD_CAP).map((booking) => (
                  // A ROW, not a stacked card. Two stacked cards cost 466px of a 844px screen and
                  // pushed every queue row below the fold, so the counter opened the board and could
                  // not see a single person waiting. Accept keeps the ink pill on the right; Decline
                  // is the rarer action and sits as a text button under the meta.
                  <div
                    key={booking.id}
                    className={
                      "mb-3 flex items-center gap-3 rounded-[24px] border border-s-border p-4 " +
                      TINT +
                      (freshId === booking.id ? " bg-s-bg-sunken" : " bg-white")
                    }
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-body truncate text-[15px] font-normal text-s-ink">
                        {booking.customerName}
                      </p>
                      {/* One meta line, not three. The AGE is in it because a request with no age
                          rots quietly and the counter cannot tell a four-minute-old one from
                          yesterday's. */}
                      <p className={ROW_SUB}>
                        {booking.serviceName} at {zurichTime(booking.startsAt)}, asked{" "}
                        {elapsedMinutes(booking.createdAt)} min ago
                      </p>
                      {/* THE CONFLICT, said out loud instead of left as arithmetic for somebody
                          mid-cut. Two requests for one slot can BOTH be accepted otherwise, and a
                          slot inside the current queue's reach collides with the people already
                          standing there. */}
                      {conflictOf(booking) && (
                        <p className="font-body mt-0.5 truncate text-[13px] font-semibold text-s-urgency">
                          {conflictOf(booking)}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 flex-col items-center">
                      <button type="button" onClick={() => handleAccept(booking)} className="font-body flex h-11 items-center justify-center rounded-full bg-s-ink px-5 text-[15px] font-semibold text-white">Accept</button> {/* row-ink-ok: the single page-level "needs a decision" commit, not a peer-list row */}
                      <button
                        type="button"
                        onClick={() => handleDecline(booking)}
                        className="font-body flex h-11 items-center px-2 text-[13px] font-normal text-s-ink-2"
                      >
                        Decline
                      </button>
                    </div>
                  </div>
                ))}
                {/* THE CAP. A box is a container and a container is earned once; the Board used to
                    draw one per pending request with no ceiling, so four requests filled 58% of the
                    screen with boxes and pushed every waiting person out of sight. Past the cap the
                    rest are bare rows, which is what everything else on this screen already is. */}
                {pendingBookings.slice(DECISION_CARD_CAP).map((booking) => (
                  <div
                    key={booking.id}
                    className="flex items-center gap-3 border-t border-s-border py-4"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-body truncate text-[15px] font-normal text-s-ink">
                        {booking.customerName}
                      </p>
                      <p className={ROW_SUB}>
                        {booking.serviceName} at {zurichTime(booking.startsAt)}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleAccept(booking)}
                      className={ROW_BUTTON}
                    >
                      Accept
                    </button>
                  </div>
                ))}
                </div>
              </div>
            )}

            {/* Waiting. */}
            <div className="mt-8">
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
                  {waitingQueue.map((entry) => {
                    // The ONE honest red on this screen. joined_at is a real column on
                    // barber_walkin_queue (confirmed against the live table, and it was missing from
                    // the loader until 2026-08-17), so "waited longer than we promised" is a fact the
                    // data supports, not a state invented to have something to colour.
                    const waited = entry.joinedAt ? elapsedMinutes(entry.joinedAt) : null;
                    const tone = waitingTone(waited);
                    const nextFree = freeStaff[0] ?? null;
                    return (
                    <li key={entry.id} className={ROW + " relative"}>
                      <div className="min-w-0 flex-1">
                        {/* The NAME leads. The ticket code used to sit above it, which gave the least
                            useful thing on the row the top line; it trails the name now. */}
                        <p className={ROW_NAME + " !mt-0"}>{entry.customerName}</p>
                        <p className={ROW_SUB}>
                          {entry.serviceName}, #{entry.ticketCode}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-col items-end gap-2">
                        {/* LABELLED, because "31 min" alone reads as either waited-31 or seen-in-31,
                            which are opposite meanings on the most important number in the row. */}
                        <span
                          className={
                            "font-body text-[13px] tabular-nums " +
                            (tone === "free" ? "font-normal " : "font-semibold ") +
                            TONE_TEXT[tone]
                          }
                        >
                          {waited === null ? `${entry.estimatedWaitMinutes} min` : `waiting ${waited} min`}
                        </span>
                        <div className="flex items-center gap-2">
                          {/* WHO, as a face rather than a name. The name used to sit on the button,
                              which put the same stylist on all six rows and then repeated her inside
                              the menu, so the screen read as if it were stuck. The avatar answers
                              "which chair" once per row and doubles as the way to change it. */}
                          {nextFree && (
                            <button
                              type="button"
                              aria-label={`Chair for ${entry.customerName}: ${nextFree.name}. Change it.`}
                              onClick={(e) => {
                                const r = (e.currentTarget as HTMLElement).getBoundingClientRect();
                                openMenu(e, entry.id, "chair", r);
                              }}
                              className="flex h-11 w-11 items-center justify-center rounded-full"
                            >
                              <Avatar src={nextFree.avatarUrl} name={nextFree.name} size={32} />
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => handleStart(entry)}
                            disabled={!aChairIsFree}
                            className={ROW_BUTTON + (aChairIsFree ? "" : " opacity-50 cursor-not-allowed")}
                          >
                            Start
                          </button>
                          {/* The dots hold the two ENDINGS that are not a haircut, and nothing else.
                              Mixing the chair picker in here was the mistake: one menu was doing two
                              unrelated jobs, so neither was obvious. */}
                          <button
                            type="button"
                            aria-label={`More for ${entry.customerName}`}
                            aria-expanded={menuFor === entry.id}
                            onClick={(e) => openMenu(e, entry.id, "more")}
                            className="flex h-11 w-8 items-center justify-center rounded-full text-s-ink-2"
                          >
                            <MoreHorizontal size={20} strokeWidth={1.75} />
                          </button>
                        </div>
                      </div>
                      {menuFor === entry.id && (
                        <>
                          {/* A full-screen catcher rather than a document listener: one tap anywhere
                              closes it, including a tap on another row's control. */}
                          <button
                            type="button"
                            aria-label="Close menu"
                            onClick={() => setMenuFor(null)}
                            className="fixed inset-0 z-40 cursor-default"
                          />
                          <div
                            className="fixed z-50 w-[240px] overflow-hidden rounded-[20px] bg-white py-1 shadow-elevation-3"
                            style={{ top: menuAt?.top ?? 16, right: menuAt?.right ?? 16 }}
                          >
                            {menuKind === "chair" ? (
                              // Every stylist, so the menu answers "who is even here", with the busy
                              // ones shown and unpickable rather than hidden. A list that silently
                              // drops people reads as a bug the first time somebody looks for a name.
                              staff.map((m) => {
                                const busy = Boolean(chairOf(m.id));
                                const picked = m.id === nextFree?.id;
                                return (
                                  <button
                                    key={m.id}
                                    type="button"
                                    disabled={busy}
                                    onClick={() => handleStart(entry, m)}
                                    className={
                                      "font-body flex h-14 w-full items-center gap-3 px-4 text-left text-[15px] " +
                                      (busy ? "opacity-50 cursor-not-allowed font-normal" : "font-semibold") +
                                      " text-s-ink"
                                    }
                                  >
                                    <Avatar src={m.avatarUrl} name={m.name} size={32} />
                                    <span className="min-w-0 flex-1 truncate">{firstName(m.name)}</span>
                                    {busy ? (
                                      <span className="font-body shrink-0 text-[13px] font-normal text-s-ink-2">
                                        busy
                                      </span>
                                    ) : picked ? (
                                      <Check size={18} strokeWidth={2} className="shrink-0 text-s-ink" />
                                    ) : null}
                                  </button>
                                );
                              })
                            ) : (
                              <>
                                <button
                                  type="button"
                                  onClick={() => handleNoShow(entry)}
                                  className="font-body flex h-14 w-full items-center gap-3 px-4 text-left text-[15px] font-normal text-s-ink"
                                >
                                  <UserX size={18} strokeWidth={1.75} className="shrink-0 text-s-ink-2" />
                                  Did not turn up
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleRemove(entry)}
                                  className="font-body flex h-14 w-full items-center gap-3 px-4 text-left text-[15px] font-normal text-s-error"
                                >
                                  <Trash2 size={18} strokeWidth={1.75} className="shrink-0" />
                                  Remove from queue
                                </button>
                              </>
                            )}
                          </div>
                        </>
                      )}
                    </li>
                    );
                  })}
                </ul>
              )}
            </div>

            {/* Today. */}
            <div className="mt-8">
              <div className="flex items-center justify-between px-5">
                <p className="font-body text-[13px] font-semibold text-s-ink-2">Today</p>
                {/* The one thing on this screen the shop does rather than reacts to. It sits with
                    Today because a phone booking IS a row in that list, and putting it anywhere else
                    would make it look like a separate feature instead of the same day. */}
                <button
                  type="button"
                  onClick={() => {
                    setPhoneStaff(staff[0]?.id ?? null);
                    setPhoneService(services[0]?.id ?? null);
                    setPhoneDay(zurichToday());
                    setPhoneTime(null);
                    setPhoneOpen(true);
                  }}
                  className="font-body -mr-2 flex h-11 items-center px-2 text-[13px] font-semibold text-s-accent"
                >
                  Phone booking
                </button>
              </div>
              {todaysBookings.length === 0 ? (
                <p className={QUIET_LINE + " pt-3"}>Nothing else booked today.</p>
              ) : (
                <ul>
                  {todaysBookings.map((booking) => (
                    <li key={booking.id} className={ROW}>
                      <div className="min-w-0 flex-1">
                        <p className={ROW_TIME}>{zurichTime(booking.startsAt)}</p>
                        <p className={ROW_NAME}>{booking.customerName}</p>
                        <p className={ROW_SUB}>
                          {booking.serviceName}, {chf(booking.price)}
                        </p>
                      </div>
                      {/* THE ONE TAP THIS SCREEN EXISTS FOR (owner: "click if showed up"). Once
                          somebody is here the button is spent, so it becomes the time they arrived,
                          which is a fact rather than a control. Tapping that time takes it back, for
                          the tap that was meant for the row below. */}
                      {booking.arrivedAt ? (
                        <button
                          type="button"
                          onClick={() => handleUnarrive(booking)}
                          className="font-body flex h-11 shrink-0 items-center px-2 text-[13px] font-normal tabular-nums text-s-ink-2"
                        >
                          here {zurichTime(booking.arrivedAt)}
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleArrived(booking)}
                          className={ROW_BUTTON}
                        >
                          Here
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
              {/* Tomorrow, in the same section as Today (R19-4): the loader now reaches one day
                  further so a shop can answer a closing-time phone call. Same row grammar, no
                  arrival button, nobody arrives tomorrow. Renders nothing at all when empty, this is
                  not an empty state, it is the absence of a section that has nothing to say. */}
              {tomorrowsBookings.length > 0 && (
                <>
                  <p className="font-body mt-3 px-5 text-[13px] font-semibold text-s-ink-2">Tomorrow</p>
                  <ul>
                    {tomorrowsBookings.map((booking) => (
                      <li key={booking.id} className={ROW}>
                        <div className="min-w-0 flex-1">
                          <p className={ROW_TIME}>{zurichTime(booking.startsAt)}</p>
                          <p className={ROW_NAME}>{booking.customerName}</p>
                          <p className={ROW_SUB}>
                            {booking.serviceName}, {chf(booking.price)}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          </>
        )}

        {/* Chairs: the one place a chair gets freed, which is why Start can tell the counter to come
            here when everything is full. */}
        {activeNav === "staff" && (
          <div className="mt-8">
            <ul>
              {staff.map((member) => {
                const inChair = chairOf(member.id);
                const appt = inChair ? null : bookingOnChair(member.id);
                const left = inChair
                  ? minutesLeft(inChair.startedAt, inChair.durationMinutes)
                  : appt
                    ? Math.max(0, Math.round((new Date(appt.endsAt).getTime() - Date.now()) / 60_000))
                    : null;
                const finished = queue.filter((q) => q.status === "done" && q.staffId === member.id).length;
                return (
                  <li key={member.id} className={ROW}>
                    {/* Same chip as the board, in its row size: one stylist, one anatomy. */}
                    <StaffChip
                      name={member.name}
                      avatarUrl={member.avatarUrl}
                      tone={staffTone(isBusy(member.id), boardIsStale)}
                      size="row"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="font-body truncate text-[15px] font-normal text-s-ink">{member.name}</p>
                      {/* Neutral for the same reason as the board: the ring reports the state. */}
                      <p className="font-body mt-0.5 truncate text-[13px] font-normal text-s-ink-2">
                        {/* startedAt is nullable in the data, and a made-up elapsed time on a row
                            that never recorded one is exactly the fabrication rule. Name only. */}
                        {(() => {
                          const who = inChair ? inChair.customerName : appt?.customerName ?? null;
                          // Same truthfulness rule as the board: an unconfirmed chair does not get
                          // to call itself free in words while its ring says otherwise.
                          if (!who) return boardIsStale ? "Not checked" : "Free";
                          if (left === null) return who;
                          return `${who}, ${left === 0 ? "finishing now" : `${left} min left`}`;
                        })()}
                      </p>
                      {/* Colon-and-number rather than "3 finished today": a count sentence needs the
                          locale's plural grammar, and this screen has no translations yet. */}
                      <p className={ROW_SUB}>Finished today: {finished}</p>
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
          <div className="mt-8">
            {log.length === 0 ? (
              <p className={QUIET_LINE}>
                Nothing has happened yet. Every accept, start and finish lands here with its time.
              </p>
            ) : (
              <ul>
                {log.map((line) => (
                  <li key={line.id} className={ROW}>
                    <span className={ROW_TIME + " w-[52px] shrink-0"}>{zurichTime(line.at)}</span>
                    <p className="font-body min-w-0 flex-1 text-[15px] font-normal text-s-ink">{line.text}</p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* Shop. Real derived numbers and an honest line about whether the live feed is connected.
            Named Shop everywhere, including in the docs: it used to be "This screen" in the doc and
            "Shop" on the tab, which is two names for one view. */}
        {activeNav === "profile" && (
          <div className="mt-8">
            <ul>
              <li className={ROW}>
                <p className="font-body min-w-0 flex-1 text-[15px] font-normal text-s-ink">Finished today</p>
                <span className="font-body shrink-0 text-[15px] font-normal tabular-nums text-s-ink">
                  {doneCount}
                </span>
              </li>
              <li className={ROW}>
                <p className="font-body min-w-0 flex-1 text-[15px] font-normal text-s-ink">Booked today</p>
                <span className="font-body shrink-0 text-[15px] font-normal tabular-nums text-s-ink">
                  {chf(bookedToday)}
                </span>
              </li>
              <li className={ROW}>
                <p className="font-body min-w-0 flex-1 text-[15px] font-normal text-s-ink">Arrival sound</p>
                <span className="font-body shrink-0 text-[15px] font-normal text-s-ink">
                  {soundOn ? "On" : "Off"}
                </span>
              </li>
            </ul>
            <p className={QUIET_LINE + " pt-4"}>
              {feedLive
                ? "Live. A new booking lands here on its own, no reload."
                : "Not listening. This screen has to be signed in as the salon to receive bookings."}
            </p>
          </div>
        )}
      </div>

      {/* THE PHONE SHEET. Everything on it is one tap except the two fields that cannot be, because a
          booking you cannot ring back is one the shop keeps on paper as well, and paper as well is
          exactly the double entry this exists to remove. */}
      {phoneOpen && (
        <>
          <button
            type="button"
            aria-label="Close"
            onClick={() => setPhoneOpen(false)}
            className="fixed inset-0 z-[60] cursor-default bg-s-ink/20"
          />
          <div className="fixed inset-x-0 bottom-0 z-[70] rounded-t-[28px] bg-white pb-[calc(24px+env(safe-area-inset-bottom))] pt-2 shadow-elevation-3">
            <div className="mx-auto mt-1 h-1 w-9 rounded-full bg-s-border" />
            <h2 className="font-heading px-5 pt-5 text-[18px] font-semibold text-s-ink">
              Booking on the phone
            </h2>

            <input
              value={phoneName}
              onChange={(e) => setPhoneName(e.target.value)}
              placeholder="Name"
              autoFocus
              className="font-body mt-4 h-12 w-[calc(100%-40px)] rounded-xl bg-s-bg-sunken px-4 text-[15px] font-normal text-s-ink placeholder:text-s-ink-2 mx-5"
            />
            {/* Regulars are two letters and a tap. Real past customers only, never a suggestion the
                shop has not actually served. */}
            {phoneName.trim().length >= 2 && (
              <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto px-5">
                {knownCustomers
                  .filter((n) => n.toLowerCase().includes(phoneName.trim().toLowerCase()) && n !== phoneName)
                  .slice(0, 4)
                  .map((n) => (
                    <button
                      key={n}
                      type="button"
                      onClick={() => setPhoneName(n)}
                      className="font-body flex h-11 shrink-0 items-center rounded-full border border-s-border bg-white px-4 text-[13px] font-normal text-s-ink"
                    >
                      {n}
                    </button>
                  ))}
              </div>
            )}

            <input
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              placeholder="Phone number"
              inputMode="tel"
              className="font-body mt-3 h-12 w-[calc(100%-40px)] rounded-xl bg-s-bg-sunken px-4 text-[15px] font-normal text-s-ink placeholder:text-s-ink-2 mx-5"
            />

            <div className="scrollbar-hide mt-4 flex gap-2 overflow-x-auto px-5">
              {staff.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setPhoneStaff(m.id)}
                  className={
                    "font-body flex h-11 shrink-0 items-center gap-2 rounded-full border px-3 text-[13px] " +
                    (phoneStaff === m.id
                      ? "border-s-ink bg-s-bg-sunken font-semibold text-s-ink"
                      : "border-s-border bg-white font-normal text-s-ink-2")
                  }
                >
                  <Avatar src={m.avatarUrl} name={m.name} size={24} />
                  {firstName(m.name)}
                </button>
              ))}
            </div>

            <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto px-5">
              {services.slice(0, 8).map((sv) => (
                <button
                  key={sv.id}
                  type="button"
                  onClick={() => setPhoneService(sv.id)}
                  className={
                    "font-body flex h-11 shrink-0 items-center rounded-full border px-4 text-[13px] " +
                    (phoneService === sv.id
                      ? "border-s-ink bg-s-bg-sunken font-semibold text-s-ink"
                      : "border-s-border bg-white font-normal text-s-ink-2")
                  }
                >
                  {sv.name}, {sv.minutes}m
                </button>
              ))}
            </div>

            {/* DAY, today plus the next 13. */}
            <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto px-5">
              {dayChoices.map((d) => (
                <button
                  key={d.value}
                  type="button"
                  onClick={() => {
                    setPhoneDay(d.value);
                    setPhoneTime(null);
                  }}
                  className={
                    "font-body flex h-11 shrink-0 items-center rounded-full border px-4 text-[13px] " +
                    (phoneDay === d.value
                      ? "border-s-ink bg-s-bg-sunken font-semibold text-s-ink"
                      : "border-s-border bg-white font-normal text-s-ink-2")
                  }
                >
                  {d.label}
                </button>
              ))}
            </div>

            {/* TIME, quarter hours 08:00 to 19:00. On Today, already-past slots are dropped and the
                fallback (next quarter hour from now) can render outside that window on purpose. */}
            <div className="scrollbar-hide mt-2 flex gap-2 overflow-x-auto px-5">
              {timeChoices.map((t) => (
                <button
                  key={`${t.hour}-${t.minute}`}
                  type="button"
                  onClick={() => setPhoneTime(t)}
                  className={
                    "font-body flex h-11 shrink-0 items-center rounded-full border px-4 text-[13px] tabular-nums " +
                    (selectedTime && selectedTime.hour === t.hour && selectedTime.minute === t.minute
                      ? "border-s-ink bg-s-bg-sunken font-semibold text-s-ink"
                      : "border-s-border bg-white font-normal text-s-ink-2")
                  }
                >
                  {timeLabel(t)}
                </button>
              ))}
            </div>

            <div className="px-5 pt-5">
              <button
                type="button"
                onClick={savePhoneBooking}
                disabled={
                  phoneSaving ||
                  !phoneName.trim() ||
                  !phoneNumber.trim() ||
                  !phoneStaff ||
                  !phoneService ||
                  !selectedTime
                }
                className={
                  "font-body flex h-12 w-full items-center justify-center rounded-full bg-s-ink text-[15px] font-semibold text-white" +
                  (phoneSaving || !phoneName.trim() || !phoneNumber.trim() || !phoneStaff || !phoneService || !selectedTime
                    ? " opacity-50 cursor-not-allowed"
                    : "")
                }
              >
                {phoneSaving ? "Saving" : "Put it in the book"}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Floating bottom pill bar. */}
      <div className="fixed inset-x-4 bottom-[calc(16px+env(safe-area-inset-bottom))] z-20">
        <div className="mx-auto flex max-w-[360px] items-center justify-between rounded-full bg-white px-2 py-2 shadow-elevation-2">
          {navButtons.map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              type="button"
              aria-current={activeNav === key ? "page" : undefined}
              onClick={() => setActiveNav(key)}
              className="flex h-11 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-full px-2"
            >
              <Icon
                size={20}
                strokeWidth={activeNav === key ? 2 : 1.75}
                className={activeNav === key ? "text-s-ink" : "text-s-ink-2"}
              />
              <span
                className={
                  "font-body text-[13px] leading-none " +
                  (activeNav === key ? "font-semibold text-s-ink" : "font-normal text-s-ink-2")
                }
              >
                {label}
              </span>
            </button>
          ))}
          <button
            type="button"
            aria-label="Shop"
            aria-current={activeNav === "profile" ? "page" : undefined}
            onClick={() => setActiveNav("profile")}
            className="flex h-11 min-w-[56px] flex-col items-center justify-center gap-0.5 rounded-full px-2"
          >
            {staff[0] ? (
              <Avatar src={staff[0].avatarUrl} name={staff[0].name} size={20} />
            ) : (
              <Avatar name="?" size={20} />
            )}
            <span
              className={
                "font-body text-[13px] leading-none " +
                (activeNav === "profile" ? "font-semibold text-s-ink" : "font-normal text-s-ink-2")
              }
            >
              Shop
            </span>
          </button>
        </div>
      </div>
    </div>
  );

  if (!mounted) return screen;
  return createPortal(screen, document.body);
}
