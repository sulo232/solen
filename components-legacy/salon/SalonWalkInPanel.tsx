"use client";

import { useState } from "react";
import Link from "next/link";
import { Users, Info, X, Check } from "lucide-react";
import { SelectedCheckBadge } from "@/components-legacy/ui/SelectedCheckBadge";
import { Avatar } from "@/app/[locale]/_components/primitives";
import { useWalkInQueue } from "@/components-legacy/salon/WalkInQueueContext";
import { localizedField } from "@/lib/i18n/localized-field";

interface WalkInService {
  id: string;
  name_de?: string | null;
  name_en?: string | null;
  price: number;
  duration_minutes?: number | null;
  category?: string | null;
  subcategory?: string | null;
}

interface WalkInStaff {
  id: string;
  name: string;
  avatar_url?: string | null;
  specialties?: string[] | null;
  staff_average_rating?: number | null;
  staff_review_count?: number | null;
  service_ids?: string[] | null; // services this barber performs (staff_services)
  languages?: string[] | null; // spoken languages (Team-card principle); rides on salon.staff at runtime
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
      "Kein Termin. Zahlen Sie und kommen Sie einfach vorbei.",
      "Zahlen sichert Ihren Platz in der Schlange.",
      "Karte wird nur gehalten, belastet wenn Sie dran sind.",
      "Kostenlos stornierbar, bis Sie aufgerufen werden.",
    ],
    openLabel: "Offen", busyLabel: "Stark gefragt", closedLabel: "Geschlossen",
    emptyBig: "Keine Wartezeit, kommen Sie vorbei", emptySub: "Jetzt zahlen und Platz sichern",
    busySub: "Jetzt zahlen, Platz in der Schlange sichern", closedBig: "Gerade geschlossen",
    ahead: "vor Ihnen", min: "Min", waitW: "Wartezeit",
    pick: "Wählen Sie Ihren Service", from: "ab", join: "Anstehen", barberPick: "Ihr Barber", anyone: "Egal", noPref: "Keine Präferenz", close: "Schliessen",
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
    openLabel: "Open", busyLabel: "In demand", closedLabel: "Closed",
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
    openLabel: "Ouvert", busyLabel: "Forte affluence", closedLabel: "Fermé",
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
    openLabel: "Aperto", busyLabel: "Molto richiesto", closedLabel: "Chiuso",
    emptyBig: "Nessuna attesa, entra pure", emptySub: "Paga ora per assicurarti il posto",
    busySub: "Paga ora per tenere il posto", closedBig: "Ora chiuso",
    ahead: "prima di te", min: "min", waitW: "di attesa",
    pick: "Scegli un servizio", from: "da", join: "In coda", barberPick: "Il tuo barbiere", anyone: "Indifferente", noPref: "Nessuna preferenza", close: "Chiudi",
  },
};

const CLOSED_PILL: Record<string, string> = { de: "Geschlossen", en: "Closed", fr: "Fermé", it: "Chiuso" };
const ALL_LABEL: Record<string, string> = { de: "Alle", en: "All", fr: "Tous", it: "Tutti" };
const SEE_ALL: Record<string, string> = { de: "Alle ansehen", en: "See all", fr: "Voir tout", it: "Vedi tutti" };
const SHOW_LESS: Record<string, string> = { de: "Weniger anzeigen", en: "Show less", fr: "Voir moins", it: "Mostra meno" };

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
  // barberId + live queue stats come from the shared WalkInQueueProvider so this panel
  // and the sticky bar always read ONE source (owner 2026-07-24: they used to fetch
  // separately and could disagree). setBarberId refetches THAT barber's line in the provider.
  const { barberId, setBarberId, stats } = useWalkInQueue();
  const [infoOpen, setInfoOpen] = useState(false);
  const [activeCat, setActiveCat] = useState<string>("alle");
  const [showAllServices, setShowAllServices] = useState(false); // Termin-style preview + "Alle ansehen"

  const svcName = (s: WalkInService) => localizedField(s as unknown as Record<string, unknown>, "name", locale) || "Service";

  // Orange only when the salon's configured capacity is exceeded (stats.busy). Until the
  // dashboard exposes max_walkin_queue, busy is never set → stays green. See _tasks/WALKIN_DASHBOARD_NEEDS.md.
  const ahead = stats?.ahead ?? 0;
  const wait = stats?.wait_minutes ?? 0;
  const busy = !!stats?.busy;
  const hasQueue = ahead > 0;
  // Fresha open-green #1F8900 (s-open token; owner: the bright #16A34A read off)
  const dotColor = !isOpen ? "#9CA3AF" : busy ? "#C2410C" : "#1F8900";
  const statusLabel = !isOpen ? l.closedLabel : busy ? l.busyLabel : l.openLabel;
  // v3 (LOCKFILE §0 rule 12): wait is a RANGE "20–35 Min" (en-dash allowed only
  // in numeric ranges), caption is the count only ("3 vor dir").
  const low = stats?.wait_low ?? 0;
  const bigLine = !isOpen ? l.closedBig : hasQueue ? `${l.from} ${low} ${l.min}` : l.emptyBig;
  const subLine = !isOpen ? "" : hasQueue ? `${ahead} ${l.ahead}` : l.emptySub;
  // Per-service live wait tag (owner 2026-07-24 "CO"): the current wait, shown on each row so it
  // reads per-service and updates live with the selected barber. No per-service queue data exists,
  // so this reflects the salon/barber wait, never a fabricated per-service number.
  const rowWaitLabel = isOpen && hasQueue ? `${l.from} ${low} ${l.min}` : null;

  // staff_id rides the join link → pay-intent metadata → barber_walkin_queue.preferred_barber_id.
  const joinHref = (serviceId: string) =>
    `/${locale}/walk-in-pay?salon_id=${salonId}&service_id=${serviceId}${barberId ? `&staff_id=${barberId}` : ""}`;

  // Staff↔service link (staff_services): a chosen barber filters the list to what they actually
  // do. Falls back to all services if the barber has no links (so the list never goes empty).
  const selectedStaff = barberId ? staff.find((b) => b.id === barberId) : null;
  const visibleServices = selectedStaff && (selectedStaff.service_ids?.length ?? 0) > 0
    ? services.filter((s) => selectedStaff.service_ids!.includes(s.id))
    : services;

  // Group by the salon's OWN category (subcategory, falling back to top-level),
  // exactly like the booking flow / "Alle ansehen" (ServicesStaffStep, owner
  // 2026-07-19) — the real service taxonomy drives the sections, never the
  // removed hardcoded Express/Klassisch/Signature duration split (which was
  // invented and mismatched the booking view). category/subcategory ride along
  // on the same salon.services object Termin gets; grouped here, not fabricated.
  const svcGroupKey = (s: WalkInService) => s.subcategory ?? s.category ?? "andere";
  const svcCategories = Array.from(new Set(visibleServices.map(svcGroupKey))).sort();
  // Termin "normal appointment" pattern (owner 2026-07-24): a FLAT preview of the active
  // category's first 5, + an "Alle ansehen" button to expand — not the whole grouped list.
  const activeServices = activeCat === "alle" ? visibleServices : visibleServices.filter((s) => svcGroupKey(s) === activeCat);
  const previewServices = showAllServices ? activeServices : activeServices.slice(0, 5);

  return (
    <div>
      {/* Option B (owner pick 2026-07-24): COMPACT live-status bar + barber + services with
          category chips (Termin parity). The status is a slim, always-compact row (not a tall
          card); the sticky bar on scroll mirrors it 1:1. Reverses the earlier tall status card. */}
      <div className="space-y-7">
        {/* (a) Compact live-status bar */}
        <div className="flex items-center gap-3 rounded-[20px] border border-s-border bg-white shadow-whisper px-5 py-3.5">
          <span className="inline-flex shrink-0 items-center gap-2">
            {isOpen ? (
              <span className="relative flex h-2 w-2">
                {/* mockup-ok: WCAG 2.2.2 conformance fix. This ran `infinite`, gated on no
                    fetch, for as long as the salon reads open (hours), beside the whole PDP,
                    with no user mechanism to stop it. Bounded to ONE pulse (2.6s, well under
                    the 5s ceiling) and held on its final frame (fill-mode forwards), which for
                    this keyframe is opacity 0: the ring fades out and the solid dot below
                    (unanimated, always rendered) carries the "open" status on its own. */}
                <span className="absolute inline-flex h-full w-full rounded-full opacity-50" style={{ background: dotColor, animation: "ping 2.6s cubic-bezier(0,0,.2,1) 1 forwards" }} />
                <span className="relative inline-flex h-2 w-2 rounded-full" style={{ background: dotColor }} />
              </span>
            ) : (
              <span className="h-2 w-2 rounded-full" style={{ background: dotColor }} />
            )}
            <span className="font-display text-[14px] font-semibold tracking-[-.01em]" style={{ color: dotColor }}>{statusLabel}</span>
          </span>
          {isOpen && hasQueue && (
            <span className="min-w-0 font-display text-[15px] font-semibold tabular-nums tracking-[-.01em] text-s-ink">{l.from} {low} {l.min}</span>
          )}
          {isOpen && !hasQueue && (
            <span className="min-w-0 truncate font-body text-[13px] text-s-ink-2">{l.emptyBig}</span>
          )}
          <div className="ml-auto flex shrink-0 items-center gap-2">
            {isOpen && hasQueue && (
              <span className="font-body text-[12px] tabular-nums text-s-ink-2">{ahead} {l.ahead}</span>
            )}
            <button
              type="button"
              onClick={() => setInfoOpen(true)}
              aria-label={l.howTitle}
              className="grid h-7 w-7 shrink-0 place-items-center rounded-full text-s-ink-2 transition hover:text-s-ink active:scale-[0.94] active:duration-[80ms] active:ease-glide"
            >
              <Info className="h-[15px] w-[15px]" />
            </button>
          </div>
        </div>

        {/* (b) Stylist section — the SINGLE walk-in stylist section (owner 2026-07-24: was a
            small 64px picker AND a separate SalonTeam = two; deduped to one). Applies the LOCKED
            Team-card principle (COMPONENT_REGISTRY -> SalonTeam: 88px Avatar + floating star badge
            + spoken languages + SelectedCheckBadge). Tapping SELECTS your barber, driving the wait
            (shared provider) + filtering that barber's services below. id="section-team" so the
            sub-nav Team tab lands here; SalonTeam is Termin-only now. */}
        {staff.length > 0 && (
          <section id="section-team">
            <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">{l.barberPick}</h2>
            <div className="-mx-1 mt-4 flex gap-5 overflow-x-auto px-1 pt-2 pb-3 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {/* Egal / anyone */}
              <button
                type="button"
                onClick={() => setBarberId(null)}
                aria-pressed={barberId === null}
                className="w-[104px] shrink-0 text-center md:w-[112px]"
              >
                <div className="relative mx-auto w-[88px]">
                  <div className="grid h-[88px] w-[88px] place-items-center overflow-hidden rounded-full bg-s-bg-sunken ring-1 ring-s-ink/[0.05]">
                    <Users className="h-8 w-8 text-s-ink-2" />
                  </div>
                  <SelectedCheckBadge selected={barberId === null} />
                </div>
                <div className={`mt-3 font-body text-[14px] leading-tight text-s-ink md:text-[15px] ${barberId === null ? "font-semibold" : "font-medium"}`}>{l.anyone}</div>
                <div className="mt-1 font-body text-[12px] leading-snug text-s-ink-2 md:text-[13px]">{l.noPref}</div>
              </button>
              {staff.map((b) => {
                const active = barberId === b.id;
                const hasRating = (b.staff_review_count ?? 0) > 0;
                const displayRating = hasRating ? b.staff_average_rating : null;
                const showRating = hasRating && displayRating != null && displayRating > 0;
                const langs = b.languages && b.languages.length > 0 ? b.languages.map((x) => x.toUpperCase()).join(" / ") : null;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => setBarberId(active ? null : b.id)}
                    aria-pressed={active}
                    className="w-[104px] shrink-0 text-center md:w-[112px]"
                  >
                    <div className="relative mx-auto w-[88px]">
                      <Avatar src={b.avatar_url} name={b.name} size={88} badge={showRating ? { rating: displayRating as number } : undefined} />
                      <SelectedCheckBadge selected={active} />
                    </div>
                    <div className={`mt-3 font-body text-[14px] leading-tight text-s-ink md:text-[15px] ${active ? "font-semibold" : "font-medium"}`}>{b.name.split(" ")[0]}</div>
                    {langs && <div className="mt-1 font-body text-[12px] leading-snug text-s-ink-2 md:text-[13px]">{langs}</div>}
                  </button>
                );
              })}
            </div>
          </section>
        )}

        {/* (c) Services section — #section-services, category chips (Termin parity) + grouped list */}
        <section id="section-services">
          <h2 className="font-display text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink">Services</h2>
          {svcCategories.length > 0 && (
            <div className="mt-3 flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {["alle", ...svcCategories].map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => { setActiveCat(c); setShowAllServices(false); }}
                  className={`shrink-0 rounded-full border px-4 py-1.5 text-[13px] font-semibold capitalize transition-colors ${
                    activeCat === c ? "border-transparent bg-s-bg-sunken text-s-ink" : "border-s-border text-s-ink-2 hover:text-s-ink"
                  }`}
                >
                  {c === "alle" ? (ALL_LABEL[locale] ?? ALL_LABEL.de) : c}
                </button>
              ))}
            </div>
          )}
          <div className="mt-4 overflow-hidden rounded-[24px] border border-s-border bg-white shadow-whisper pb-2 pt-[18px]">
            <p className="px-5 text-[13px] font-semibold text-s-ink">{l.pick}</p>
            <ul className="mt-3">
              {previewServices.map((s) => (
                <WalkInServiceRow key={s.id} service={s} name={svcName(s)} isOpen={isOpen} joinHref={joinHref(s.id)} waitLabel={rowWaitLabel} l={l} locale={locale} />
              ))}
            </ul>
          </div>
          {activeServices.length > 5 && (
            <button
              type="button"
              onClick={() => setShowAllServices((v) => !v)}
              className="mt-3 w-full rounded-full border border-s-border py-3 font-heading text-[14px] font-semibold text-s-ink transition-colors hover:border-s-ink/25"
            >
              {showAllServices ? (SHOW_LESS[locale] ?? SHOW_LESS.de) : `${SEE_ALL[locale] ?? SEE_ALL.de} (${activeServices.length})`}
            </button>
          )}
        </section>
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
              <button type="button" onClick={() => setInfoOpen(false)} aria-label={l.close} className="-mr-1 -mt-1 grid h-8 w-8 shrink-0 place-items-center rounded-full text-s-ink-2 transition active:scale-[0.94] active:duration-[80ms] active:ease-glide">
                <X size={20} strokeWidth={2.2} />
              </button>
            </div>
            <ul className="mt-4 space-y-3.5">
              {l.bullets.map((b, i) => (
                <li key={i} className="flex items-start gap-3 font-body text-[13.5px] leading-relaxed text-s-ink-2">
                  <Check size={15} strokeWidth={1.9} className="mt-[3px] shrink-0 text-s-open" aria-hidden />
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

// Extracted so the tiered + untiered lists share one row (V2 fix 2026-07-24, was
// two near-identical inline <li> blocks). Content unchanged: name / "{duration}
// min, ab {price} CHF" / Join-link or closed-pill — only the card/grouping wrapper
// this sits inside changed. Matches SalonServices.tsx's ServiceRow row grammar
// (px-5 py-[18px] hairline-divided, border-t first:border-t-0).
function WalkInServiceRow({
  service,
  name,
  isOpen,
  joinHref,
  waitLabel,
  l,
  locale,
}: {
  service: WalkInService;
  name: string;
  isOpen: boolean;
  joinHref: string;
  waitLabel?: string | null;
  l: (typeof COPY)["de"];
  locale: string;
}) {
  return (
    <li className="border-t border-s-border px-5 py-[18px] first:border-t-0">
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0 flex-1">
          <div className="font-body text-[15px] font-semibold text-s-ink">{name}</div>
          <div className="font-body mt-0.5 text-[13px] text-s-ink-2">
            {service.duration_minutes ? `${service.duration_minutes} ${l.min}, ` : ""}{l.from} {Number(service.price).toFixed(0)} CHF
          </div>
          {waitLabel && (
            <div className="mt-1.5 inline-flex items-center rounded-full bg-s-bg-sunken px-2 py-0.5 text-[11.5px] font-medium text-s-ink-2">
              <span className="tabular-nums">{waitLabel}</span>
            </div>
          )}
        </div>
        {isOpen ? (
          <Link
            href={joinHref}
            className="font-body shrink-0 rounded-full bg-s-bg-sunken px-5 py-2 text-[13px] font-semibold text-s-ink transition-colors hover:bg-s-border"
          >
            {l.join}
          </Link>
        ) : (
          <span
            aria-disabled="true"
            className="font-body shrink-0 cursor-not-allowed rounded-full bg-s-bg-sunken px-5 py-2 text-[13px] font-semibold text-s-ink-2 opacity-70"
          >
            {CLOSED_PILL[locale] ?? CLOSED_PILL.de}
          </span>
        )}
      </div>
    </li>
  );
}
