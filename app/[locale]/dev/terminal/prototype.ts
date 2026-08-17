/**
 * Prototype-only helpers for the merchant terminal: the scripted arrival feed and the arrival
 * chime. Pure functions, no JSX, safe to import from any client component on this route.
 *
 * exists-check: `npm run exists arrival` / `npm run exists chime` return nothing outside this
 * terminal family. The one place these already existed is `b/B.tsx`, the frozen before-picture that
 * is awaiting a keep-or-graveyard decision (R6-6 in _plans/MERCHANT_TERMINAL_2026-08-15.md). B is
 * deliberately not edited to import from here: it is the comparison artefact, and reopening it is
 * exactly the loop the restart-dont-repaint gate exists to stop. When B is decided, its copies go
 * with it and this module stays as the single home.
 *
 * WHY A SCRIPTED ARRIVAL AT ALL. `bookings` is not in the Supabase realtime publication (verified
 * live 2026-08-15), so no subscription can fire yet. Until that migration lands, a new booking
 * cannot actually arrive on its own, and the whole question the terminal has to answer is "what
 * happens when one does". These names are the ONE hardcoded thing this prototype carries, and they
 * exist only inside the scripted feed, never as a rendered claim about a real customer.
 */
import type { TerminalBooking, TerminalStaff } from "./Terminal";

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

/** A brand-new booking, as if it had just landed from the customer app. */
export function buildArrivalBooking(
  seq: number,
  templates: TerminalBooking[],
  staff: TerminalStaff[],
  usedNames: Set<string>,
): TerminalBooking {
  const freeNames = ARRIVAL_NAMES.filter((n) => !usedNames.has(n));
  const name = freeNames[seq % Math.max(freeNames.length, 1)] ?? ARRIVAL_NAMES[seq % ARRIVAL_NAMES.length];
  usedNames.add(name);
  const template = templates.length > 0 ? templates[seq % templates.length] : null;
  const member = staff.length > 0 ? staff[seq % staff.length] : null;
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

type WindowWithWebkitAudio = Window & { webkitAudioContext?: typeof AudioContext };

export function getAudioContextCtor(): typeof AudioContext | undefined {
  if (typeof window === "undefined") return undefined;
  const w = window as WindowWithWebkitAudio;
  return window.AudioContext ?? w.webkitAudioContext;
}

// WebAudio only, no file, no remote asset: two short 880Hz sine blips at low gain. A custom sound
// can only come from the foreground page, which is the whole reason the terminal has to be a screen
// somebody leaves open rather than a notification.
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

export function playArrivalChime(ctx: AudioContext) {
  const t0 = ctx.currentTime;
  playTone(ctx, t0);
  playTone(ctx, t0 + 0.15);
}
