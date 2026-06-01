"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Clock, Users, Info, Star, X } from "lucide-react";
import { SelectedCheckBadge } from "@/components-legacy/ui/SelectedCheckBadge";

interface WalkInService {
  id: string;
  name_de?: string | null;
  name_en?: string | null;
  price: number;
  duration_minutes?: number | null;
}

interface WalkInStaff {
  id: string;
  name: string;
  avatar_url?: string | null;
  specialties?: string[] | null;
  staff_average_rating?: number | null;
  staff_review_count?: number | null;
  service_ids?: string[] | null; // services this barber performs (staff_services)
}

// No em-dashes anywhere (user rule). Separators are middots (·) or commas.
const COPY: Record<string, {
  what: string; tagline: string; howTitle: string; bullets: string[];
  openLabel: string; busyLabel: string; closedLabel: string;
  emptyBig: string; emptySub: string; busySub: string; closedBig: string;
  ahead: string; min: string; waitW: string;
  pick: string; from: string; join: string; barberPick: string; anyone: string; noPref: string; close: string;
}> = {
  de: {
    what: "Walk-in", tagline: "jetzt zahlen, Schlange überspringen",
    howTitle: "So funktioniert Walk-in",
    bullets: [
      "Kein Termin. Zahl und komm einfach vorbei.",
      "Zahlen sichert deinen Platz in der Schlange.",
      "Karte wird nur gehalten, belastet wenn du dran bist.",
      "Kostenlos stornierbar, bis du aufgerufen wirst.",
    ],
    openLabel: "Walk-ins offen", busyLabel: "Stark gefragt", closedLabel: "Momentan geschlossen",
    emptyBig: "Keine Wartezeit, komm vorbei", emptySub: "Jetzt zahlen und Platz sichern",
    busySub: "Jetzt zahlen, Platz in der Schlange sichern", closedBig: "Gerade geschlossen",
    ahead: "vor dir", min: "Min", waitW: "Wartezeit",
    pick: "Wähle deinen Service", from: "ab", join: "Anstehen", barberPick: "Dein Barber", anyone: "Egal", noPref: "Keine Präferenz", close: "Schliessen",
  },
  en: {
    what: "Walk-in", tagline: "pay now, skip the line",
    howTitle: "How walk-in works",
    bullets: [
      "No appointment. Just pay and drop by.",
      "Paying holds your spot in the queue.",
      "Card is held now, charged when it's your turn.",
      "Cancel free until you're called.",
    ],
    openLabel: "Open for walk-ins", busyLabel: "In demand", closedLabel: "Currently closed",
    emptyBig: "No wait, walk right in", emptySub: "Pay now to lock your spot",
    busySub: "Pay now to hold your place in line", closedBig: "Closed right now",
    ahead: "ahead", min: "min", waitW: "wait",
    pick: "Choose a service", from: "from", join: "Join", barberPick: "Your barber", anyone: "Anyone", noPref: "No preference", close: "Close",
  },
  fr: {
    what: "Walk-in", tagline: "payez maintenant, sautez la file",
    howTitle: "Comment ça marche",
    bullets: [
      "Sans rendez-vous. Payez et passez.",
      "Le paiement réserve votre place dans la file.",
      "Carte préautorisée, débitée quand c'est votre tour.",
      "Annulation gratuite jusqu'à votre appel.",
    ],
    openLabel: "Walk-ins ouverts", busyLabel: "Forte affluence", closedLabel: "Actuellement fermé",
    emptyBig: "Pas d'attente, entrez", emptySub: "Payez pour réserver votre place",
    busySub: "Payez pour garder votre place", closedBig: "Fermé pour le moment",
    ahead: "devant vous", min: "min", waitW: "d'attente",
    pick: "Choisissez un service", from: "dès", join: "Rejoindre", barberPick: "Ton coiffeur", anyone: "Peu importe", noPref: "Aucune préférence", close: "Fermer",
  },
  it: {
    what: "Walk-in", tagline: "paga ora, salta la coda",
    howTitle: "Come funziona",
    bullets: [
      "Senza appuntamento. Paga e passa.",
      "Il pagamento assicura il posto in coda.",
      "Carta trattenuta, addebitata quando tocca a te.",
      "Annullamento gratuito fino alla chiamata.",
    ],
    openLabel: "Walk-in aperti", busyLabel: "Molto richiesto", closedLabel: "Attualmente chiuso",
    emptyBig: "Nessuna attesa, entra pure", emptySub: "Paga ora per assicurarti il posto",
    busySub: "Paga ora per tenere il posto", closedBig: "Ora chiuso",
    ahead: "prima di te", min: "min", waitW: "di attesa",
    pick: "Scegli un servizio", from: "da", join: "In coda", barberPick: "Il tuo barbiere", anyone: "Indifferente", noPref: "Nessuna preferenza", close: "Chiudi",
  },
};

const VIEW_ALL: Record<string, string> = { de: "Alle ansehen", en: "View all", fr: "Voir tout", it: "Vedi tutti" };
const CLOSED_PILL: Record<string, string> = { de: "Geschlossen", en: "Closed", fr: "Fermé", it: "Chiuso" };

export default function SalonWalkInPanel({
  salonId,
  services,
  staff = [],
  salonAverageRating = null,
  slug,
  locale,
  isOpen = true,
}: {
  salonId: string;
  services: WalkInService[];
  staff?: WalkInStaff[];
  salonAverageRating?: number | null;
  slug?: string;
  locale: string;
  isOpen?: boolean;
}) {
  const l = COPY[locale] ?? COPY.de;
  const [stats, setStats] = useState<{ ahead: number; wait_minutes: number; busy?: boolean } | null>(null);
  const [barberId, setBarberId] = useState<string | null>(null); // null = "Egal"
  const [infoOpen, setInfoOpen] = useState(false);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/walkin/queue-stats?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (!cancelled && d) setStats(d); })
      .catch((e) => console.error("[SalonWalkInPanel] queue-stats failed:", e));
    return () => { cancelled = true; };
  }, [salonId]);

  const svcName = (s: WalkInService) => (locale === "en" ? s.name_en : s.name_de) || s.name_de || s.name_en || "Service";

  // Orange only when the salon's configured capacity is exceeded (stats.busy). Until the
  // dashboard exposes max_walkin_queue, busy is never set → stays green. See _tasks/WALKIN_DASHBOARD_NEEDS.md.
  const ahead = stats?.ahead ?? 0;
  const wait = stats?.wait_minutes ?? 0;
  const busy = !!stats?.busy;
  const hasQueue = ahead > 0;
  const dotColor = !isOpen ? "#9CA3AF" : busy ? "#C2410C" : "#16A34A";
  const statusLabel = !isOpen ? l.closedLabel : busy ? l.busyLabel : l.openLabel;
  const bigLine = !isOpen ? l.closedBig : hasQueue ? `${ahead} ${l.ahead} · ~${wait} ${l.min} ${l.waitW}` : l.emptyBig;
  const subLine = !isOpen ? "" : hasQueue ? l.busySub : l.emptySub;

  // staff_id rides the join link → pay-intent metadata → barber_walkin_queue.preferred_barber_id.
  const joinHref = (serviceId: string) =>
    `/${locale}/walk-in-pay?salon_id=${salonId}&service_id=${serviceId}${barberId ? `&staff_id=${barberId}` : ""}`;

  // Staff↔service link (staff_services): a chosen barber filters the list to what they actually
  // do. Falls back to all services if the barber has no links (so the list never goes empty).
  const selectedStaff = barberId ? staff.find((b) => b.id === barberId) : null;
  const visibleServices = selectedStaff && (selectedStaff.service_ids?.length ?? 0) > 0
    ? services.filter((s) => selectedStaff.service_ids!.includes(s.id))
    : services;

  return (
    <div className="flex flex-col gap-5">
      {/* Explainer — one line + (i) opens the details popup (no long copy, no em-dashes). */}
      <div className="flex items-center justify-between gap-3 rounded-2xl bg-s-bg-sunken px-4 py-3">
        <span className="font-display text-[14.5px] font-semibold tracking-[-.01em] text-s-ink">
          {l.what} <span className="text-s-ink-3">·</span> <span className="font-medium text-s-ink-2">{l.tagline}</span>
        </span>
        <button
          type="button"
          onClick={() => setInfoOpen(true)}
          aria-label={l.howTitle}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-s-ink-2 transition hover:text-s-ink active:scale-90"
        >
          <Info className="h-[15px] w-[15px]" />
        </button>
      </div>

      {/* Live queue status — Variant A: status word + one confident line. Slow pulse (2.6s). */}
      <div className="rounded-2xl border border-s-border bg-white p-[18px]">
        <div className="flex items-center gap-2.5">
          {isOpen ? (
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: dotColor, animation: "ping 2.6s cubic-bezier(0,0,.2,1) infinite" }} />
              <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: dotColor }} />
            </span>
          ) : (
            <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />
          )}
          <span className="font-display text-[13px] font-semibold tracking-[-.01em]" style={{ color: dotColor }}>{statusLabel}</span>
        </div>
        <div className="mt-3 font-display text-[19px] font-semibold leading-[1.15] tracking-[-.02em] tabular-nums text-s-ink">{bigLine}</div>
        {subLine ? <div className="mt-1 font-body text-[13px] text-s-ink-2">{subLine}</div> : null}
      </div>

      {/* Barber picker — the SAME card as the booking "Team" section, selectable.
          78px avatar + rating pill + name + role. "Egal" first. Selected = dark photo
          overlay + white check (Option 4); "Alle ansehen" opens the full team. */}
      {staff.length > 0 && (
        <div>
          <div className="mb-3 flex items-baseline justify-between gap-3">
            <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">{l.barberPick}</h2>
            {slug && (
              <Link href={`/${locale}/salon/${slug}/booking`} className="font-body shrink-0 text-[14px] font-medium text-s-accent transition-opacity hover:opacity-80">
                {VIEW_ALL[locale] ?? VIEW_ALL.de}
              </Link>
            )}
          </div>
          <div className="-mx-1 flex gap-4 overflow-x-auto px-1 pt-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {/* Egal / anyone */}
            <button
              type="button"
              onClick={() => setBarberId(null)}
              aria-pressed={barberId === null}
              className="flex w-[88px] shrink-0 flex-col items-center text-center"
            >
              <div className="relative">
                <div className="grid h-[78px] w-[78px] place-items-center overflow-hidden rounded-full bg-s-bg-sunken ring-1 ring-s-ink/[0.05]">
                  <Users className="h-7 w-7 text-s-ink-2" />
                </div>
                <SelectedCheckBadge selected={barberId === null} size={24} />
              </div>
              <div className={`mt-3 font-body text-[14px] leading-tight text-s-ink ${barberId === null ? "font-semibold" : "font-medium"}`}>{l.anyone}</div>
              <div className="mt-1 font-body text-[12px] leading-snug text-s-ink-2">{l.noPref}</div>
            </button>
            {staff.map((b) => {
              const active = barberId === b.id;
              const role = b.specialties?.[0] ?? null;
              const hasRating = (b.staff_review_count ?? 0) > 0;
              const displayRating = hasRating ? b.staff_average_rating : salonAverageRating;
              const showRating = displayRating != null && displayRating > 0;
              return (
                <button
                  key={b.id}
                  type="button"
                  onClick={() => setBarberId(active ? null : b.id)}
                  aria-pressed={active}
                  className="flex w-[88px] shrink-0 flex-col items-center text-center"
                >
                  <div className="relative">
                    <div className="relative grid h-[78px] w-[78px] place-items-center overflow-hidden rounded-full bg-white ring-1 ring-s-ink/[0.05]">
                      {b.avatar_url ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={b.avatar_url} alt="" className="h-full w-full object-cover" loading="lazy" />
                      ) : (
                        <span className="font-display text-[28px] font-semibold text-s-ink-2">{b.name.charAt(0).toUpperCase()}</span>
                      )}
                    </div>
                    <SelectedCheckBadge selected={active} size={24} />
                    {showRating && (
                      <span className="absolute -bottom-2 left-1/2 inline-flex -translate-x-1/2 items-center gap-0.5 rounded-full bg-white px-2 py-[3px] shadow-[0_2px_8px_rgba(0,0,0,0.14)] ring-1 ring-s-ink/[0.05]">
                        <Star size={11} fill="#FFC32B" stroke="none" />
                        <span className={`text-[12px] font-semibold leading-none tabular-nums text-s-ink ${!hasRating ? "opacity-70" : ""}`}>{displayRating?.toFixed(1)}</span>
                      </span>
                    )}
                  </div>
                  <div className={`mt-4 font-body text-[14px] leading-tight text-s-ink ${active ? "font-semibold" : "font-medium"}`}>{b.name.split(" ")[0]}</div>
                  {role && <div className="mt-1 font-body text-[12px] leading-snug text-s-ink-2">{role}</div>}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Service pick — SAME card as the Services (Termin) section. Per-row pill → pay. */}
      <div>
        <h2 className="mb-3 font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">{l.pick}</h2>
        <ul className="flex flex-col gap-3">
          {visibleServices.map((s) => (
            <li key={s.id} className="rounded-2xl border border-s-border bg-white p-5 transition-shadow hover:shadow-[0_2px_12px_rgba(0,0,0,0.04)]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  <div className="font-body text-[15px] font-semibold text-s-ink md:text-[16px]">{svcName(s)}</div>
                  {s.duration_minutes ? (
                    <div className="font-body mt-1 text-[13px] text-s-ink-3 md:text-[14px]">{s.duration_minutes} {l.min}</div>
                  ) : null}
                  <div className="font-body mt-3 text-[14px] text-s-ink-2 md:text-[15px]">{l.from} {Number(s.price).toFixed(0)} CHF</div>
                </div>
                {isOpen ? (
                  <Link
                    href={joinHref(s.id)}
                    className="font-body shrink-0 rounded-full bg-s-bg-sunken px-5 py-2 text-[13px] font-semibold text-s-ink transition-colors hover:bg-s-border md:px-6 md:py-2.5 md:text-[14px]"
                  >
                    {l.join}
                  </Link>
                ) : (
                  <span
                    aria-disabled="true"
                    className="font-body shrink-0 cursor-not-allowed rounded-full bg-s-bg-sunken px-5 py-2 text-[13px] font-semibold text-s-ink-3 opacity-70 md:px-6 md:py-2.5 md:text-[14px]"
                  >
                    {CLOSED_PILL[locale] ?? CLOSED_PILL.de}
                  </span>
                )}
              </div>
            </li>
          ))}
        </ul>
      </div>

      {/* "How walk-in works" popup — bottom sheet on mobile, centered on desktop. */}
      {infoOpen && (
        <div
          className="fixed inset-0 z-[70] flex items-end justify-center bg-black/40 px-4 pb-4 sm:items-center sm:pb-0"
          onClick={() => setInfoOpen(false)}
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-sm rounded-3xl bg-white p-6 shadow-[0_24px_60px_-20px_rgba(0,0,0,0.4)]" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-start justify-between gap-4">
              <h3 className="font-display text-[17px] font-bold tracking-[-.01em] text-s-ink">{l.howTitle}</h3>
              <button type="button" onClick={() => setInfoOpen(false)} aria-label={l.close} className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-s-ink-3 transition active:scale-90">
                <X size={18} />
              </button>
            </div>
            <ul className="mt-4 space-y-3.5">
              {l.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 font-body text-[13.5px] leading-relaxed text-s-ink-2">
                  <span className="mt-[7px] h-[7px] w-[7px] shrink-0 rounded-full bg-s-success" />
                  <span>{b}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  );
}
