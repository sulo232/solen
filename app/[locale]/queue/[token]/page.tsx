"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import Link from "next/link";
import {
  Clock, Check, Scissors, AlertCircle, RefreshCw, Users, Armchair,
  Star, MapPin, ChevronRight, ChevronLeft, ArrowRight, Navigation, Ticket,
} from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import TipFlow from "@/app/[locale]/_components/tips/TipFlow";

// Mirrors the public GET /api/walkin/queue/status?token= response.
interface QueueStatus {
  id: string;
  customerName: string; // the ticket code, e.g. "A01"
  firstName?: string | null; // real customer first name NOT captured yet (backend gap); always null today
  position: number;
  status: "waiting" | "in_chair" | "completed" | "no_show" | "cancelled";
  estimatedWaitMinutes: number;
  aheadCount: number;
  joinedAt: string;
  calledAt: string | null;
  startedAt: string | null;
  completedAt: string | null;
  recipientName?: string | null;
  recipientPhoto?: string | null;
  recipientRating?: number | null;
  recipientReviewCount?: number | null;
  serviceName?: string | null;
  servicePrice?: number | null;
  serviceDuration?: number | null;
  salonName?: string | null;
  salonSlug?: string | null;
  salonAddress?: string | null;
  salonPhoto?: string | null;
  salonLat?: number | null;
  salonLng?: number | null;
}

type Copy = Record<string, string>;
const COPY: Record<string, Copy> = {
  de: { live: "Live", minLeft: "Noch", min: "Min", soon: "Gleich bist du dran", aheadLine: "vor dir in der Schlange", youreUp: "Du bist dran!", goToChair: "Geh zum Stuhl", whileYouWait: "Während du wartest", inspoTitle: "Brauchst du Inspiration?", inspoSub: "Stöber durch die Arbeiten und zeig deinen Lieblingslook direkt am Stuhl.", seeLooks: "Looks ansehen", yourBarber: "Dein Barber", directions: "Wegbeschreibung", ticketNr: "Ticket-Nr.", st_paid: "Bezahlt", st_queue: "In der Schlange", st_almost: "Fast dran", st_chair: "Dran", done: "Fertig!", doneSub: "Wir hoffen, der Schnitt sitzt. Schon bezahlt, alles erledigt.", noTip: "Kein Trinkgeld, danke", cancelled: "Storniert", cancelledSub: "Dieses Ticket ist nicht mehr aktiv", noShow: "Nummer verpasst", noShowSub: "Diese Nummer wurde aufgerufen, aber niemand war da", notFound: "Ticket nicht gefunden", notFoundSub: "Dieser Link ist ungültig oder abgelaufen", autoUpdate: "Aktualisiert sich automatisch", home: "Zur Startseite", cancel: "Stornieren", cancelConfirm: "Stornieren und Erstattung erhalten?", tip: "Trinkgeld geben" },
  en: { live: "Live", minLeft: "About", min: "min", soon: "You're up soon", aheadLine: "ahead of you in line", youreUp: "You're up!", goToChair: "Head to the chair", whileYouWait: "While you wait", inspoTitle: "Need some inspiration?", inspoSub: "Browse the work and show your favourite look right at the chair.", seeLooks: "See looks", yourBarber: "Your barber", directions: "Directions", ticketNr: "Ticket no.", st_paid: "Paid", st_queue: "In queue", st_almost: "Almost up", st_chair: "Your turn", done: "All done!", doneSub: "Hope the cut's perfect. Already paid, all sorted.", noTip: "No tip, thanks", cancelled: "Cancelled", cancelledSub: "This ticket is no longer active", noShow: "Number missed", noShowSub: "This number was called but no one was there", notFound: "Ticket not found", notFoundSub: "This link is invalid or expired", autoUpdate: "Updates automatically", home: "Go home", cancel: "Cancel", cancelConfirm: "Cancel and get a refund?", tip: "Leave a tip" },
  fr: { live: "Live", minLeft: "Encore", min: "min", soon: "Bientôt à vous", aheadLine: "devant vous dans la file", youreUp: "À vous !", goToChair: "Rendez-vous au fauteuil", whileYouWait: "En attendant", inspoTitle: "Besoin d'inspiration ?", inspoSub: "Parcourez les réalisations et montrez votre look préféré au fauteuil.", seeLooks: "Voir les looks", yourBarber: "Votre coiffeur", directions: "Itinéraire", ticketNr: "N° de ticket", st_paid: "Payé", st_queue: "Dans la file", st_almost: "Bientôt", st_chair: "À vous", done: "Terminé !", doneSub: "On espère que la coupe est parfaite. Déjà payé, tout est réglé.", noTip: "Pas de pourboire, merci", cancelled: "Annulé", cancelledSub: "Ce ticket n'est plus actif", noShow: "Numéro manqué", noShowSub: "Ce numéro a été appelé mais personne n'était là", notFound: "Ticket introuvable", notFoundSub: "Ce lien est invalide ou expiré", autoUpdate: "Mise à jour automatique", home: "Accueil", cancel: "Annuler", cancelConfirm: "Annuler et être remboursé ?", tip: "Laisser un pourboire" },
  it: { live: "Live", minLeft: "Ancora", min: "min", soon: "Presto tocca a te", aheadLine: "prima di te in coda", youreUp: "Tocca a te!", goToChair: "Vai alla poltrona", whileYouWait: "Mentre aspetti", inspoTitle: "Cerchi ispirazione?", inspoSub: "Sfoglia i lavori e mostra il tuo look preferito direttamente in poltrona.", seeLooks: "Vedi i look", yourBarber: "Il tuo barbiere", directions: "Indicazioni", ticketNr: "N. ticket", st_paid: "Pagato", st_queue: "In coda", st_almost: "Quasi", st_chair: "Tocca a te", done: "Fatto!", doneSub: "Speriamo che il taglio sia perfetto. Già pagato, tutto a posto.", noTip: "Nessuna mancia, grazie", cancelled: "Annullato", cancelledSub: "Questo ticket non è più attivo", noShow: "Numero saltato", noShowSub: "Questo numero è stato chiamato ma non c'era nessuno", notFound: "Ticket non trovato", notFoundSub: "Questo link non è valido o è scaduto", autoUpdate: "Si aggiorna automaticamente", home: "Home", cancel: "Annulla", cancelConfirm: "Annullare e ricevere il rimborso?", tip: "Lascia una mancia" },
};

type NodeState = "done" | "current" | "future";

export default function QueueTrackingPage() {
  const params = useParams<{ token: string }>()!;
  const token = params?.token;
  const locale = useLocale();
  const l = COPY[locale] ?? COPY.de;

  const [data, setData] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const dataRef = useRef<QueueStatus | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  const fetchStatus = useCallback(async () => {
    if (!token) return;
    setRefreshing(true);
    try {
      const res = await fetch(`/api/walkin/queue/status?token=${encodeURIComponent(token)}`, { cache: "no-store" });
      if (res.status === 404) { setNotFound(true); return; }
      if (!res.ok) throw new Error(`status ${res.status}`);
      const json = (await res.json()) as QueueStatus;
      setData(json);
      setNotFound(false);
    } catch (e) {
      console.error("[queue-track] status fetch failed:", e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [token]);

  // Adaptive, visibility-aware polling feels near-live without hammering the API:
  // faster when you're near the front, PAUSED when the tab is hidden, instant refetch
  // when you return, and it stops once the visit is terminal.
  useEffect(() => {
    let timer: ReturnType<typeof setTimeout> | null = null;
    const isTerminal = (s?: string) => s === "completed" || s === "cancelled" || s === "no_show";
    const schedule = () => {
      if (timer) clearTimeout(timer);
      const s = dataRef.current?.status;
      if (isTerminal(s) || (typeof document !== "undefined" && document.hidden)) return;
      const ahead = dataRef.current?.aheadCount ?? 99;
      const delay = s === "in_chair" ? 10000 : ahead <= 1 ? 8000 : ahead <= 4 ? 15000 : 25000;
      timer = setTimeout(async () => { await fetchStatus(); schedule(); }, delay);
    };
    const onVisibility = () => {
      if (document.hidden) { if (timer) { clearTimeout(timer); timer = null; } }
      else { fetchStatus().then(schedule); }
    };
    fetchStatus().then(schedule);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      if (timer) clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchStatus]);

  const handleCancel = async () => {
    if (!data || !token || cancelling) return;
    if (!window.confirm(l.cancelConfirm)) return;
    setCancelling(true);
    try {
      const res = await fetch(`/api/walkin/queue/${data.id}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      } else {
        const j = await res.json().catch(() => null);
        console.error("[queue-track] cancel failed:", j?.error);
      }
    } catch (e) {
      console.error("[queue-track] cancel error:", e);
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-white">
        <Spinner size="md" />
      </div>
    );
  }

  if (notFound || !data) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <AlertCircle size={40} className="mb-4 text-s-ink-3" />
        <h1 className="font-heading text-[20px] font-bold text-s-ink">{l.notFound}</h1>
        <p className="mt-1.5 text-[14px] text-s-ink-2">{l.notFoundSub}</p>
        <Link href={`/${locale}`} className="mt-6 rounded-btn bg-s-ink px-5 py-2.5 font-heading text-[14px] font-semibold text-white">
          {l.home}
        </Link>
      </div>
    );
  }

  const isWaiting = data.status === "waiting";
  const isUp = data.status === "in_chair";
  const isDone = data.status === "completed";
  const isCancelled = data.status === "cancelled";
  const isNoShow = data.status === "no_show";
  const isLive = isWaiting || isUp;
  const almost = isWaiting && data.aheadCount <= 1;

  // ---- Done: the success moment MERGED with the tip flow on one screen ----
  // Reuses the real Stripe-wired <TipFlow> inline under a green success peak (owner-approved
  // walkin-done-tip mockup), replacing the old "Fertig danke" + separate tip sheet.
  if (isDone) {
    const tipRecipient = data.recipientName || (locale === "en" ? "your stylist" : locale === "fr" ? "votre coiffeur" : locale === "it" ? "il tuo parrucchiere" : "dein Coiffeur");
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex flex-1 flex-col items-center px-5 pb-8 pt-12">
          {/* success peak (green = the moment of delight, then tip below) */}
          <div className="flex h-[66px] w-[66px] items-center justify-center rounded-full bg-s-success text-white shadow-[0_8px_20px_rgba(22,163,74,.32)]">
            <Check size={32} strokeWidth={3} />
          </div>
          <h1 className="mt-4 font-heading text-[26px] font-bold tracking-[-.02em] text-s-ink">{l.done}</h1>
          <p className="mt-1.5 max-w-[20rem] text-center text-[14px] leading-[1.45] text-s-ink-2">{l.doneSub}</p>

          {/* inline tip flow (real component: presets + Stripe card + blue send + its own 'Danke!') */}
          <div className="mt-6 w-full max-w-sm overflow-hidden rounded-[22px] border border-s-border bg-white shadow-[0_8px_26px_-16px_rgba(10,10,10,.16)]">
            <TipFlow
              recipientName={tipRecipient}
              recipientPhoto={data.recipientPhoto}
              recipientRating={data.recipientRating}
              recipientReviewCount={data.recipientReviewCount}
              contextLine={[data.serviceName, data.salonName].filter(Boolean).join(" ") || undefined}
              locale={locale}
              createIntent={(amount) => fetch("/api/walkin/tip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, amount }) }).then((r) => r.json())}
            />
          </div>

          <Link href={`/${locale}`} className="mt-4 text-[13.5px] font-medium text-s-ink-3 transition-colors hover:text-s-ink-2">
            {l.noTip}
          </Link>
        </div>
      </div>
    );
  }

  // ---- Cancelled / no-show: focused, centered ----
  if (isCancelled || isNoShow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <AlertCircle size={40} className="mb-4 text-s-ink-3" />
        <h1 className="font-heading text-[20px] font-bold text-s-ink">{isCancelled ? l.cancelled : l.noShow}</h1>
        <p className="mt-1.5 text-[14px] text-s-ink-2">{isCancelled ? l.cancelledSub : l.noShowSub}</p>
        <Link href={`/${locale}`} className="mt-6 rounded-btn bg-s-ink px-5 py-2.5 font-heading text-[14px] font-semibold text-white">
          {l.home}
        </Link>
      </div>
    );
  }

  // ---- Live (waiting / in_chair): the rich v2 layout ----
  // Stepper node states from real data: Bezahlt → In der Schlange → Fast dran → Dran.
  const nodeState = (node: "paid" | "queue" | "almost" | "chair"): NodeState => {
    if (isUp) return node === "chair" ? "current" : "done";
    if (node === "paid") return "done";
    if (node === "queue") return almost ? "done" : "current";
    if (node === "almost") return almost ? "current" : "future";
    return "future"; // chair
  };
  const STEPS: { key: "paid" | "queue" | "almost" | "chair"; label: string; Icon: typeof Check }[] = [
    { key: "paid", label: l.st_paid, Icon: Check },
    { key: "queue", label: l.st_queue, Icon: Users },
    { key: "almost", label: l.st_almost, Icon: Clock },
    { key: "chair", label: l.st_chair, Icon: Armchair },
  ];

  const mapsHref = data.salonLat != null && data.salonLng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${data.salonLat},${data.salonLng}`
    : data.salonAddress
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.salonAddress)}`
      : null;
  // Name-led header only once the backend captures a real first name (today firstName is always null
  // because the queue stores the ticket code AS the name). Falls back to no name never fabricated.
  const waitHeader = data.firstName ? `${l.whileYouWait}, ${data.firstName}` : l.whileYouWait;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* salon hero */}
      <div className="relative h-[150px] overflow-hidden bg-s-bg-sunken">
        {data.salonPhoto && (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={data.salonPhoto} alt="" className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/35" />
        <Link
          href={`/${locale}`}
          aria-label={l.home}
          className="absolute left-3.5 top-3.5 flex h-10 w-10 items-center justify-center rounded-full border border-white/60 bg-white/85 text-s-ink shadow-[0_2px_8px_rgba(10,10,10,.12)] backdrop-blur-md active:scale-95"
        >
          <ChevronLeft size={20} />
        </Link>
        <div className="absolute bottom-3.5 left-[18px] text-white">
          <div className="font-heading text-[18px] font-bold tracking-[-.015em]">{data.salonName ?? "Salon"}</div>
          {data.salonAddress && (
            <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] opacity-90">
              <MapPin size={13} />{data.salonAddress}
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 px-5 pt-[18px]">
        {/* LIVE badge */}
        <span className="inline-flex items-center gap-[7px] rounded-full bg-s-accent-pale py-[5px] pl-2.5 pr-[11px] text-[10.5px] font-bold uppercase tracking-[0.1em] text-s-accent">
          <span className="relative flex h-[7px] w-[7px]">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-s-accent opacity-60" />
            <span className="relative inline-flex h-[7px] w-[7px] rounded-full bg-s-accent" />
          </span>
          {l.live}
        </span>

        {/* clean status: ETA + position (no ticket code here) */}
        <h1 className="mt-[9px] font-heading text-[30px] font-bold leading-[1.05] tracking-[-.02em] text-s-ink">
          {isUp ? l.youreUp : data.estimatedWaitMinutes > 0 ? `${l.minLeft} ${data.estimatedWaitMinutes} ${l.min}` : l.soon}
        </h1>
        {isUp ? (
          <p className="mt-[5px] text-[14px] text-s-ink-2">{l.goToChair}</p>
        ) : (
          <p className="mt-[5px] text-[14px] text-s-ink-2">
            <span className="font-heading font-bold text-s-ink tabular-nums">{data.aheadCount}</span> {l.aheadLine}
          </p>
        )}

        {/* blue step tracker the ONE progress indicator */}
        <div className="mt-[22px] flex items-start justify-between px-1.5">
          {STEPS.map((s, i) => {
            const st = nodeState(s.key);
            const lineDone = nodeState(STEPS[i].key) === "done";
            return (
              <div key={s.key} className="contents">
                <div className="relative z-[2] flex w-16 flex-col items-center gap-2">
                  <div
                    className={[
                      "flex h-[42px] w-[42px] items-center justify-center rounded-full",
                      st === "done" ? "bg-s-accent text-white" : "",
                      st === "current" ? "bg-white text-s-accent walkin-ring-pulse" : "",
                      st === "future" ? "bg-s-bg-sunken text-s-ink-3" : "",
                    ].join(" ")}
                  >
                    <s.Icon size={18} strokeWidth={s.key === "paid" ? 2.6 : 2} />
                  </div>
                  <span className={`text-center text-[10.5px] font-semibold leading-[1.2] ${st === "future" ? "text-s-ink-3" : "text-s-ink"}`}>{s.label}</span>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`mt-[19px] h-[2px] min-w-[8px] flex-1 rounded-full ${lineDone ? "bg-s-accent" : "bg-s-border"}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* WHILE YOU WAIT - Uber pattern: header + one rich card (hidden once you're in the chair) */}
        {isWaiting && data.salonSlug && (
          <>
            <div className="mb-3 mt-6 font-heading text-[17px] font-bold tracking-[-.01em] text-s-ink">{waitHeader}</div>
            <Link
              href={`/${locale}/salon/${data.salonSlug}`}
              className="block overflow-hidden rounded-[18px] border border-s-border bg-white shadow-[0_8px_26px_-16px_rgba(10,10,10,.16)] transition-transform active:scale-[0.98]"
            >
              <div className="p-4">
                <span className="flex h-[34px] w-[34px] items-center justify-center rounded-[10px] bg-s-accent-pale text-s-accent">
                  <Scissors size={18} />
                </span>
                <div className="mt-2.5 font-heading text-[16px] font-bold tracking-[-.01em] text-s-ink">{l.inspoTitle}</div>
                <div className="mt-1 text-[13px] leading-[1.42] text-s-ink-2">{l.inspoSub}</div>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-s-accent-pale px-[15px] py-[9px] text-[13.5px] font-semibold text-s-accent">
                  {l.seeLooks} <ArrowRight size={15} />
                </span>
              </div>
            </Link>
          </>
        )}

        {/* Dein Termin barber + service */}
        {(data.recipientName || data.serviceName) && (
          <div className="mt-4 rounded-[20px] border border-s-border bg-white p-4 shadow-[0_8px_26px_-16px_rgba(10,10,10,.16)]">
            {data.recipientName && (
              <div className="flex items-center gap-[13px]">
                {data.recipientPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.recipientPhoto} alt="" className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-s-bg-sunken text-s-ink-2">
                    <Scissors size={20} />
                  </div>
                )}
                <div>
                  <div className="font-heading text-[15.5px] font-bold text-s-ink">{data.recipientName}</div>
                  <div className="mt-0.5 flex items-center gap-[5px] text-[12.5px] text-s-ink-3">
                    {data.recipientRating != null && (
                      <><Star size={13} className="fill-s-star text-s-star" /><span className="font-heading font-bold tabular-nums text-s-ink">{data.recipientRating.toFixed(1)}</span></>
                    )}
                    {l.yourBarber}
                  </div>
                </div>
              </div>
            )}
            {data.serviceName && (
              <div className={`flex items-center gap-3 ${data.recipientName ? "mt-3.5 border-t border-s-border pt-3.5" : ""}`}>
                <div className="flex-1">
                  <div className="font-heading text-[14.5px] font-semibold text-s-ink">{data.serviceName}</div>
                  {data.serviceDuration != null && <div className="mt-0.5 text-[12.5px] text-s-ink-3"><span className="tabular-nums">{data.serviceDuration}</span> {l.min}</div>}
                </div>
                {data.servicePrice != null && (
                  <span className="font-heading text-[15px] font-bold tabular-nums text-s-ink">CHF {data.servicePrice}</span>
                )}
              </div>
            )}
          </div>
        )}

        {/* location row → opens maps (no fake map / no fabricated walking time) */}
        {data.salonAddress && mapsHref && (
          <a
            href={mapsHref} target="_blank" rel="noopener noreferrer"
            className="mt-4 flex items-center gap-3 rounded-[20px] border border-s-border bg-white p-4 shadow-[0_8px_26px_-16px_rgba(10,10,10,.16)] transition-transform active:scale-[0.98]"
          >
            <MapPin size={18} className="text-s-ink-2" />
            <div className="flex-1 font-heading text-[14px] font-semibold text-s-ink">{data.salonAddress}</div>
            <ChevronRight size={18} className="text-s-ink-3" />
          </a>
        )}

        {/* small, support-only ticket reference */}
        <div className="mt-[18px] flex items-center justify-center gap-[7px] text-[12px] text-s-ink-3">
          <Ticket size={13} /> {l.ticketNr} <span className="font-heading font-semibold tabular-nums text-s-ink-2">{data.customerName}</span>
        </div>

        {/* quiet cancel only while still waiting (DELETE rejects once in the chair) */}
        {isWaiting && (
          <div className="mt-3 text-center">
            <button onClick={handleCancel} disabled={cancelling} className="text-[13px] font-medium text-s-ink-3 underline underline-offset-2 transition-colors hover:text-s-error disabled:opacity-50">
              {cancelling ? "…" : l.cancel}
            </button>
          </div>
        )}
      </div>

      {/* action bar */}
      <div className="flex gap-2.5 px-5 pb-6 pt-4">
        {mapsHref ? (
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-[7px] rounded-full bg-s-accent py-3.5 font-heading text-[14px] font-semibold text-white transition-transform active:scale-[0.98]">
            <Navigation size={17} /> {l.directions}
          </a>
        ) : (
          <Link href={`/${locale}`} className="flex flex-1 items-center justify-center rounded-full bg-s-ink py-3.5 font-heading text-[14px] font-semibold text-white transition-transform active:scale-[0.98]">
            {l.home}
          </Link>
        )}
        <button onClick={fetchStatus} aria-label={l.autoUpdate} className="flex w-[54px] items-center justify-center rounded-full border border-s-border bg-white text-s-ink active:scale-[0.98]">
          <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        </button>
      </div>
    </div>
  );
}
