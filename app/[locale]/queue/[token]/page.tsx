"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import Link from "next/link";
import {
  Clock, Check, Scissors, AlertCircle, RefreshCw, Users, Armchair,
  Star, MapPin, ChevronRight, ArrowRight, Navigation, Ticket, TicketX, HelpCircle, Send, X,
} from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import TipFlow from "@/app/[locale]/_components/tips/TipFlow";
import { BackButton } from "@/app/[locale]/_components/primitives/BackButton";
import { toast } from "@/app/[locale]/_components/primitives/Toast";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "@/app/[locale]/_components/primitives/Modal";
import { localizedField } from "@/lib/i18n/localized-field";
import { strokeForSize } from "@/lib/icon-stroke";

// Mirrors the public GET /api/walkin/queue/status?token= response.
interface QueueStatus {
  id: string;
  customerName: string; // the ticket code, e.g. "A01"
  firstName?: string | null; // first word of a REAL captured customer_name (never the ticket-code fallback), computed server-side in /api/walkin/queue/status
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
  serviceNameDe?: string | null;
  serviceNameEn?: string | null;
  serviceNameFr?: string | null;
  serviceNameIt?: string | null;
  servicePrice?: number | null;
  serviceDuration?: number | null;
  salonName?: string | null;
  salonSlug?: string | null;
  salonAddress?: string | null;
  salonPhoto?: string | null;
  salonPhotos?: string[] | null; // swipeable hero gallery (PDP-style)
  salonLat?: number | null;
  salonLng?: number | null;
}

type Copy = Record<string, string>;
const COPY: Record<string, Copy> = {
  de: { live: "Live", minLeft: "Noch", min: "Min", soon: "Gleich sind Sie dran", aheadLine: "vor Ihnen in der Schlange", youreUp: "Sie sind dran!", goToChair: "Gehen Sie zum Stuhl", whileYouWait: "Während Sie warten", inspoTitle: "Brauchen Sie Inspiration?", inspoSub: "Stöbern Sie durch die Arbeiten und zeigen Sie Ihren Lieblingslook direkt am Stuhl.", seeLooks: "Looks ansehen", yourBarber: "Ihr Barber", directions: "Wegbeschreibung", ticketNr: "Ticket Nr", st_paid: "Bezahlt", st_queue: "In der Schlange", st_almost: "Fast dran", st_chair: "Dran", done: "Fertig!", doneSub: "Wir hoffen, der Schnitt sitzt. Schon bezahlt, alles erledigt.", noTip: "Kein Trinkgeld, danke", cancelled: "Storniert", cancelledSub: "Dieses Ticket ist nicht mehr aktiv", noShow: "Nummer verpasst", noShowSub: "Diese Nummer wurde aufgerufen, aber niemand war da", notFound: "Ticket nicht gefunden", notFoundSub: "Dieses Walk-in-Ticket ist abgelaufen oder wurde bereits eingelöst. Prüfen Sie den Link oder sichern Sie sich einen neuen Platz.", autoUpdate: "Aktualisiert sich automatisch", home: "Zur Startseite", help: "Hilfe", cancel: "Stornieren", cancelConfirm: "Stornieren und Erstattung erhalten?", keepTicket: "Ticket behalten", tip: "Trinkgeld geben", ask: "Wie war Ihr Schnitt?", r1: "Schlecht", r2: "Nicht so gut", r3: "Okay", r4: "Gut", r5: "Ausgezeichnet!", lowTitle: "Das tut uns leid.", lowSub: "Was lief schief? Ihr Feedback geht direkt an den Salon.", fbPlaceholder: "Erzählen Sie uns mehr (optional)", helpTitle: "Brauchen Sie Hilfe?", helpSub: "Salon kontaktieren", fbSend: "Feedback senden", skip2: "Überspringen" }, // copy-ok: pre-existing "(optional)" placeholder, unrelated to this edit
  en: { live: "Live", minLeft: "About", min: "min", soon: "You're up soon", aheadLine: "ahead of you in line", youreUp: "You're up!", goToChair: "Head to the chair", whileYouWait: "While you wait", inspoTitle: "Need some inspiration?", inspoSub: "Browse the work and show your favourite look right at the chair.", seeLooks: "See looks", yourBarber: "Your barber", directions: "Directions", ticketNr: "Ticket No", st_paid: "Paid", st_queue: "In queue", st_almost: "Almost up", st_chair: "Your turn", done: "All done!", doneSub: "Hope the cut's perfect. Already paid, all sorted.", noTip: "No tip, thanks", cancelled: "Cancelled", cancelledSub: "This ticket is no longer active", noShow: "Number missed", noShowSub: "This number was called but no one was there", notFound: "Ticket not found", notFoundSub: "This walk-in ticket has expired or was already redeemed. Check the link or grab a new spot.", autoUpdate: "Updates automatically", home: "Go home", help: "Help", cancel: "Cancel", cancelConfirm: "Cancel and get a refund?", keepTicket: "Keep ticket", tip: "Leave a tip", ask: "How was your cut?", r1: "Poor", r2: "Not great", r3: "Okay", r4: "Good", r5: "Excellent!", lowTitle: "We're sorry.", lowSub: "What went wrong? Your feedback goes straight to the store.", fbPlaceholder: "Tell us more (optional)", helpTitle: "Need help?", helpSub: "Contact the store", fbSend: "Send feedback", skip2: "Skip" }, // copy-ok: pre-existing "(optional)" placeholder, unrelated to this edit
  fr: { live: "Live", minLeft: "Encore", min: "min", soon: "Bientôt à vous", aheadLine: "devant vous dans la file", youreUp: "À vous !", goToChair: "Rendez-vous au fauteuil", whileYouWait: "En attendant", inspoTitle: "Besoin d'inspiration ?", inspoSub: "Parcourez les réalisations et montrez votre look préféré au fauteuil.", seeLooks: "Voir les looks", yourBarber: "Votre coiffeur", directions: "Itinéraire", ticketNr: "N° de ticket", st_paid: "Payé", st_queue: "Dans la file", st_almost: "Bientôt", st_chair: "À vous", done: "Terminé !", doneSub: "On espère que la coupe est parfaite. Déjà payé, tout est réglé.", noTip: "Pas de pourboire, merci", cancelled: "Annulé", cancelledSub: "Ce ticket n'est plus actif", noShow: "Numéro manqué", noShowSub: "Ce numéro a été appelé mais personne n'était là", notFound: "Ticket introuvable", notFoundSub: "Ce ticket walk-in a expiré ou a déjà été utilisé. Vérifie le lien ou réserve une nouvelle place.", autoUpdate: "Mise à jour automatique", home: "Accueil", help: "Aide", cancel: "Annuler", cancelConfirm: "Annuler et être remboursé ?", keepTicket: "Garder le ticket", tip: "Laisser un pourboire", ask: "Comment était ta coupe ?", r1: "Mauvais", r2: "Moyen", r3: "Correct", r4: "Bien", r5: "Excellent !", lowTitle: "Nous sommes désolés.", lowSub: "Qu'est-ce qui n'a pas été ? Votre retour va directement au salon.", fbPlaceholder: "Dis-nous en plus (facultatif)", helpTitle: "Besoin d'aide ?", helpSub: "Contacter le salon", fbSend: "Envoyer", skip2: "Passer" }, // copy-ok: pre-existing "(facultatif)" placeholder, unrelated to this edit
  it: { live: "Live", minLeft: "Ancora", min: "min", soon: "Presto tocca a te", aheadLine: "prima di te in coda", youreUp: "Tocca a te!", goToChair: "Vai alla poltrona", whileYouWait: "Mentre aspetti", inspoTitle: "Cerchi ispirazione?", inspoSub: "Sfoglia i lavori e mostra il tuo look preferito direttamente in poltrona.", seeLooks: "Vedi i look", yourBarber: "Il tuo barbiere", directions: "Indicazioni", ticketNr: "N. ticket", st_paid: "Pagato", st_queue: "In coda", st_almost: "Quasi", st_chair: "Tocca a te", done: "Fatto!", doneSub: "Speriamo che il taglio sia perfetto. Già pagato, tutto a posto.", noTip: "Nessuna mancia, grazie", cancelled: "Annullato", cancelledSub: "Questo ticket non è più attivo", noShow: "Numero saltato", noShowSub: "Questo numero è stato chiamato ma non c'era nessuno", notFound: "Ticket non trovato", notFoundSub: "Questo ticket walk-in è scaduto o è già stato usato. Controlla il link o prenota un nuovo posto.", autoUpdate: "Si aggiorna automaticamente", home: "Home", help: "Aiuto", cancel: "Annulla", cancelConfirm: "Annullare e ricevere il rimborso?", keepTicket: "Mantieni il ticket", tip: "Lascia una mancia", ask: "Com'è andato il taglio?", r1: "Scarso", r2: "Così così", r3: "Okay", r4: "Bene", r5: "Eccellente!", lowTitle: "Ci dispiace.", lowSub: "Cosa non è andato? Il tuo feedback va dritto allo store.", fbPlaceholder: "Dicci di più (facoltativo)", helpTitle: "Serve aiuto?", helpSub: "Contatta lo store", fbSend: "Invia feedback", skip2: "Salta" }, // copy-ok: pre-existing "(facoltativo)" placeholder, unrelated to this edit
};

// copy-i18n-04 (2026-07-27): the star-rating aria-label was hardcoded German
// ("Stern"/"Sterne") regardless of locale via an n===1 ternary. Locale-keyed like COPY above.
const STAR_LABEL: Record<string, (n: number) => string> = {
  de: (n) => `${n} ${n === 1 ? "Stern" : "Sterne"}`,
  en: (n) => `${n} ${n === 1 ? "star" : "stars"}`,
  fr: (n) => `${n} ${n === 1 ? "étoile" : "étoiles"}`,
  it: (n) => `${n} ${n === 1 ? "stella" : "stelle"}`,
};

type NodeState = "done" | "current" | "future";

export default function QueueTrackingPage() {
  const params = useParams<{ token: string }>()!;
  const token = params?.token;
  const locale = useLocale();
  const router = useRouter();
  const l = COPY[locale] ?? COPY.de;
  const tt = useTranslations("toasts");

  const [data, setData] = useState<QueueStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [photoIdx, setPhotoIdx] = useState(0);
  const [cancelling, setCancelling] = useState(false);
  const [cancelConfirmOpen, setCancelConfirmOpen] = useState(false);
  const dataRef = useRef<QueueStatus | null>(null);
  useEffect(() => { dataRef.current = data; }, [data]);

  // Done-screen rating: stars → submit to the token-gated review endpoint → reveal tip (>=3)
  // or feedback+help (<3). One write per visit (reviewSentRef). High path submits on tap; low
  // path submits on "Feedback senden"/skip so the typed comment is included.
  const [rating, setRating] = useState(0);
  const [feedback, setFeedback] = useState("");
  const ratingRef = useRef(0); // latest rating, read by the exit actions (avoids stale-closure / wrong-rating sends)
  const reviewSentRef = useRef(false);
  const sendReview = useCallback(async (n: number, withComment: boolean) => {
    if (reviewSentRef.current || !token) return;
    reviewSentRef.current = true;
    try {
      await fetch("/api/walkin/review", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        keepalive: true, // survive the navigation that follows "Feedback senden" / skip
        body: JSON.stringify({ token, rating: n, comment: withComment && feedback.trim() ? feedback.trim() : undefined }),
      });
    } catch (e) {
      console.error("[queue-track] review submit failed:", e);
      reviewSentRef.current = false;
    }
  }, [token, feedback]);

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

  // Modal primitive replaces window.confirm() for this destructive refund/hold-release
  // action (design contract: states are componentised, don't hand-roll native browser UI).
  // requestCancel opens the modal; handleCancel runs the actual DELETE.
  const requestCancel = () => {
    if (!data || !token || cancelling) return;
    setCancelConfirmOpen(true);
  };

  const handleCancel = async () => {
    if (!data || !token || cancelling) return;
    setCancelConfirmOpen(false);
    setCancelling(true);
    try {
      const res = await fetch(`/api/walkin/queue/${data.id}?token=${encodeURIComponent(token)}`, { method: "DELETE" });
      if (res.ok) {
        setData((prev) => (prev ? { ...prev, status: "cancelled" } : prev));
      } else {
        const j = await res.json().catch(() => null);
        console.error("[queue-track] cancel failed:", j?.error);
        toast.error(tt("cancelFailed"), { action: { label: tt("retry"), onClick: () => { void handleCancel(); } } });
      }
    } catch (e) {
      console.error("[queue-track] cancel error:", e);
      toast.error(tt("cancelFailed"), { action: { label: tt("retry"), onClick: () => { void handleCancel(); } } });
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
        <TicketX size={60} strokeWidth={1.25} className="mb-6 text-s-ink" aria-hidden />
        <h1 className="font-heading text-[20px] font-bold text-s-ink">{l.notFound}</h1>
        <p className="mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-s-ink-2">{l.notFoundSub}</p>
        <Link href={`/${locale}`} className="mt-6 rounded-btn bg-s-ink px-6 py-3 font-heading text-[14px] font-semibold text-white transition-transform active:scale-[0.98]">
          {l.home}
        </Link>
        <Link href={`/${locale}/help`} className="mt-4 text-[14px] font-semibold text-s-accent transition-opacity active:opacity-60">
          {l.help}
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

  const localizedServiceName = localizedField({
    name_de: data.serviceNameDe,
    name_en: data.serviceNameEn,
    name_fr: data.serviceNameFr,
    name_it: data.serviceNameIt,
  }, "name", locale) || data.serviceName?.trim() || null;

  // ---- Done: rate (stars) → then tip (>=3) OR feedback+help (<3), one smooth screen ----
  // Owner-approved walkin-rate-tip: capture a per-staff rating on every visit (feeds the
  // token-gated /api/walkin/review), prime tipping for happy customers, and route unhappy
  // ones to feedback + help instead of a tip prompt. Tip reuses the real Stripe <TipFlow>.
  if (isDone) {
    const tipRecipient = data.recipientName || (locale === "en" ? "your stylist" : locale === "fr" ? "votre coiffeur" : locale === "it" ? "il tuo parrucchiere" : "Ihr Coiffeur");
    // Don't submit on tap (a 5→2 re-tap would otherwise lock a wrong rating). Track the latest;
    // the review is sent once at the exit action below, reading ratingRef.
    const onRate = (n: number) => { setRating(n); ratingRef.current = n; };
    const exitHome = async (withComment: boolean) => { await sendReview(ratingRef.current, withComment); router.push(`/${locale}`); };
    const senti = [l.r1, l.r2, l.r3, l.r4, l.r5];
    const sentiColor = rating >= 4 ? "text-s-success" : rating === 3 ? "text-s-ink-2" : "text-s-warning-text";
    return (
      <div className="flex min-h-screen flex-col bg-white">
        <div className="flex flex-1 flex-col items-center px-5 pb-8 pt-12">
          {/* success peak */}
          <div className="flex h-[58px] w-[58px] items-center justify-center rounded-full bg-s-success text-white shadow-[0_8px_20px_rgba(22,163,74,.32)]">
            <Check size={28} strokeWidth={3} />
          </div>
          <h1 className="mt-3.5 font-heading text-[24px] font-bold tracking-[-.02em] text-s-ink">{l.done}</h1>

          {/* barber chip + rate prompt */}
          {data.recipientName && (
            <div className="mt-3.5 flex items-center gap-2 rounded-full bg-s-bg-sunken py-1.5 pl-1.5 pr-3.5">
              {data.recipientPhoto ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={data.recipientPhoto} alt="" className="h-[30px] w-[30px] rounded-full object-cover" />
              ) : (
                <span className="flex h-[30px] w-[30px] items-center justify-center rounded-full bg-white text-s-ink-2"><Scissors size={15} strokeWidth={1.9} /></span>
              )}
              <span className="font-heading text-[14px] font-bold text-s-ink">{data.recipientName}</span>
            </div>
          )}
          <p className="mt-4 text-[14px] text-s-ink-2">{l.ask}</p>

          {/* interactive stars */}
          <div className="mt-3 flex gap-2">
            {[1, 2, 3, 4, 5].map((n) => (
              <button key={n} type="button" onClick={() => onRate(n)} aria-label={(STAR_LABEL[locale] ?? STAR_LABEL.de)(n)} className="p-1 transition-transform active:scale-90">
                <Star size={38} className={n <= rating ? "fill-s-star text-s-star" : "fill-s-border text-s-border"} />
              </button>
            ))}
          </div>
          {rating > 0 && <div className={`mt-3 font-heading text-[16px] font-bold ${sentiColor}`}>{senti[rating - 1]}</div>}
          {rating === 0 && <p className="mt-2.5 text-[12.5px] text-s-ink-2">{locale === "en" ? "Tap to rate" : locale === "fr" ? "Touchez pour noter" : locale === "it" ? "Tocca per votare" : "Tippe zum Bewerten"}</p>}

          {/* >=3 → tip (reuses the real Stripe-wired TipFlow) */}
          {rating >= 3 && (
            <>
              <div className="mt-6 w-full max-w-sm overflow-hidden rounded-[22px] border border-s-border bg-white shadow-[0_8px_26px_-16px_rgba(10,10,10,.16)]">
                <TipFlow
                  recipientName={tipRecipient}
                  recipientPhoto={data.recipientPhoto}
                  recipientRating={data.recipientRating}
                  recipientReviewCount={data.recipientReviewCount}
                  contextLine={[localizedServiceName, data.salonName].filter(Boolean).join(" ") || undefined}
                  locale={locale}
                  createIntent={(amount) => fetch("/api/walkin/tip", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, amount }) }).then((r) => r.json())}
                  onClose={() => { void sendReview(ratingRef.current, false); router.push(`/${locale}`); }}
                />
              </div>
              <button type="button" onClick={() => exitHome(false)} className="mt-4 text-[13.5px] font-medium text-s-ink-2 transition-colors hover:text-s-ink-2">{l.noTip}</button>
            </>
          )}

          {/* <3 → feedback + help instead of a tip ask */}
          {rating > 0 && rating < 3 && (
            <>
              <div className="mt-6 w-full max-w-sm rounded-[22px] border border-s-border bg-white p-[18px] shadow-[0_8px_26px_-16px_rgba(10,10,10,.16)]">
                <div className="font-heading text-[16px] font-bold text-s-ink">{l.lowTitle}</div>
                <div className="mt-1 text-[13px] leading-[1.4] text-s-ink-2">{l.lowSub}</div>
                <textarea
                  value={feedback} onChange={(e) => setFeedback(e.target.value)} placeholder={l.fbPlaceholder}
                  className="mt-3 min-h-[74px] w-full resize-none p-3 text-[13.5px] text-s-ink placeholder:text-s-ink-2" // mockup-ok: dead-class removal only (V3-D-input-fill-2026-07-17)
                />
                {data.salonSlug && (
                  <Link href={`/${locale}/salon/${data.salonSlug}`} className="mt-3 flex items-center gap-3 rounded-[14px] border border-s-border p-3 transition-transform active:scale-[0.98]">
                    <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-[9px] bg-s-accent-pale text-s-accent"><HelpCircle size={19} strokeWidth={2.2} /></span>
                    <div className="flex-1"><div className="text-[13.5px] font-semibold text-s-ink">{l.helpTitle}</div><div className="mt-0.5 text-[11.5px] text-s-ink-2">{l.helpSub}</div></div>
                    <ChevronRight size={18} strokeWidth={1.9} className="text-s-ink-2" />
                  </Link>
                )}
              </div>
              <div className="mt-5 w-full max-w-sm">
                <button type="button" onClick={() => exitHome(true)} className="flex w-full items-center justify-center gap-2 rounded-full bg-s-accent py-3.5 font-heading text-[14px] font-semibold text-white transition-transform active:scale-[0.98]">
                  <Send size={17} strokeWidth={1.9} /> {l.fbSend}
                </button>
                <button type="button" onClick={() => exitHome(false)} className="mt-3 block w-full text-center text-[13.5px] font-medium text-s-ink-2">{l.skip2}</button>
              </div>
            </>
          )}
        </div>
      </div>
    );
  }

  // ---- Cancelled / no-show: focused, centered ----
  if (isCancelled || isNoShow) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-white px-6 text-center">
        <AlertCircle size={60} strokeWidth={1.25} className="mb-6 text-s-ink" aria-hidden />
        <h1 className="font-heading text-[20px] font-bold text-s-ink">{isCancelled ? l.cancelled : l.noShow}</h1>
        <p className="mt-1.5 max-w-[300px] text-[14px] leading-relaxed text-s-ink-2">{isCancelled ? l.cancelledSub : l.noShowSub}</p>
        <Link href={`/${locale}`} className="mt-6 rounded-btn bg-s-ink px-6 py-3 font-heading text-[14px] font-semibold text-white transition-transform active:scale-[0.98]">
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

  const photos = (data.salonPhotos?.length ? data.salonPhotos : data.salonPhoto ? [data.salonPhoto] : []).filter(Boolean);
  const mapsHref = data.salonLat != null && data.salonLng != null
    ? `https://www.google.com/maps/dir/?api=1&destination=${data.salonLat},${data.salonLng}`
    : data.salonAddress
      ? `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(data.salonAddress)}`
      : null;
  // Name-led header when a real customer name was captured (staff-added cash walk-ins). Most
  // visits are the pay-first flow, which never captures a name (row falls back to the ticket
  // code, "staff call the number"); the status API already tells those apart, so this never
  // fabricates a name out of a ticket code. Falls back to no name, never fabricated.
  const waitHeader = data.firstName ? `${l.whileYouWait}, ${data.firstName}` : l.whileYouWait;

  return (
    <div className="flex min-h-screen flex-col bg-white">
      {/* salon hero */}
      <div className="relative h-[280px] overflow-hidden bg-s-bg-sunken">
        {/* swipeable photo gallery — mirrors the PDP mobile carousel (native scroll-snap) */}
        {photos.length > 0 ? (
          <div
            onScroll={(e) => { const w = e.currentTarget.clientWidth || 1; setPhotoIdx(Math.round(e.currentTarget.scrollLeft / w)); }}
            className="flex h-full w-full snap-x snap-mandatory overflow-x-auto overflow-y-hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
          >
            {photos.map((u, i) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img key={i} src={u} alt={data.salonName ? `${data.salonName}, Foto ${i + 1}` : `Store-Foto ${i + 1}`} className="h-full w-full shrink-0 snap-center object-cover" />
            ))}
          </div>
        ) : (
          <div className="h-full w-full bg-s-bg-sunken" />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/35 via-transparent to-black/45" />
        {/* mockup-ok: public/_mockups/back-arrow-to-the-lock/index.html (both variants,
            including the over-photo frost swatch) , restores the NAV CONTROLS lock
            (_design-system/LOCKFILE.md, owner-measured 2026-08-10). Composing the registered
            BackButton primitive per FLOORS LAW 9 in place of the hand-drawn control; variant
            ="glass" because this control sits over the salon photo gallery hero above. */}
        <BackButton
          href={`/${locale}`}
          label={l.home}
          variant="glass"
          className="absolute left-3.5 top-3.5"
        />
        {/* top-right help — same frosted-circle treatment as the back button */}
        {data.salonSlug && (
          <Link
            href={`/${locale}/salon/${data.salonSlug}`}
            aria-label={l.helpTitle}
            className="absolute right-3.5 top-3.5 flex h-11 w-11 items-center justify-center rounded-full border border-white/60 bg-white/85 text-s-ink shadow-[0_2px_8px_rgba(10,10,10,.12)] backdrop-blur-md transition-transform duration-150 active:scale-[0.94] active:duration-[80ms] active:ease-glide"
          >
            <HelpCircle size={20} strokeWidth={2.2} />
          </Link>
        )}
        {/* photo counter (Fresha/PDP pattern) — only with more than one photo */}
        {photos.length > 1 && (
          <div className="pointer-events-none absolute bottom-8 right-3.5 rounded-full bg-black/45 px-2.5 py-1 text-[11px] font-bold tabular-nums text-white backdrop-blur-sm">
            {photoIdx + 1} / {photos.length}
          </div>
        )}
        <div className="pointer-events-none absolute bottom-8 left-[18px] text-white">
          <div className="font-heading text-[19px] font-bold tracking-[-.015em]">{data.salonName ?? "Store"}</div>
          {data.salonAddress && (
            <div className="mt-0.5 flex items-center gap-1.5 text-[12.5px] opacity-90">
              <MapPin size={13} />{data.salonAddress}
            </div>
          )}
        </div>
      </div>

      <div className="relative z-10 -mt-5 flex-1 rounded-t-[20px] bg-white px-5 pt-5">
        {/* mockup-ok: LIVE badge sentence case per copy rule 5, no uppercase/tracking */}
        <span className="inline-flex items-center gap-[7px] rounded-full bg-s-accent-pale py-[5px] pl-2.5 pr-[11px] text-[12px] font-semibold text-s-accent">
          <span className="relative flex h-[7px] w-[7px]">
            {/* mockup-ok: WCAG 2.2.2 conformance fix. `animate-ping` (Tailwind default,
                infinite) ran for as long as this tracker is open, "a screen built to be
                watched for minutes" (RANKED.md), beside walkin-ring-pulse below. Bounded
                to 3 pulses (3s total, under the 5s ceiling) via an inline override of the
                shared keyframe, then held on its final frame (forwards): opacity 0, so the
                ring fades out and the solid dot + "LIVE" label carry the status on their
                own, same fix shape as SalonWalkInPanel's status dot. */}
            <span className="absolute inline-flex h-full w-full rounded-full bg-s-accent opacity-60" style={{ animation: "ping 1s cubic-bezier(0,0,.2,1) 3 forwards" }} />
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
            <span key={data.aheadCount} className="animate-num-flip font-heading font-bold text-s-ink tabular-nums">{data.aheadCount}</span> {l.aheadLine}
          </p>
        )}

        {/* time-progress bar (owner mockup walkin-rich-v2): elapsed wait vs estimated total.
            Real numbers only — joinedAt + the live ETA; hidden once you're up. */}
        {isWaiting && data.joinedAt && data.estimatedWaitMinutes > 0 && (() => {
          const elapsedMin = Math.max(0, Math.round((Date.now() - new Date(data.joinedAt).getTime()) / 60000));
          const totalMin = elapsedMin + data.estimatedWaitMinutes;
          const pct = Math.min(95, Math.round((elapsedMin / Math.max(1, totalMin)) * 100));
          return (
            <div className="mt-3.5">
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-s-bg-sunken">
                {/* motion audit RANK 5 fix: was `transition-[width] duration-700`, the longest
                    non-full-screen duration in the audit AND a hard-rule-2 break (width reflows).
                    Converted to a transform-only scaleX from the track's left edge, retimed to
                    the reveal tier (250-300ms, THE SPEED LAW) since the fill travels. */}
                <div
                  className="h-full w-full origin-left rounded-full bg-s-accent transition-transform duration-[280ms]"
                  style={{ transform: `scaleX(${pct / 100})` }}
                />
              </div>
              <p className="mt-1.5 text-[12px] tabular-nums text-s-ink-2">
                {elapsedMin} / ~{totalMin} {l.min}
              </p>
            </div>
          );
        })()}

        {/* blue step tracker */}
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
                      st === "future" ? "bg-s-bg-sunken text-s-ink-2" : "",
                    ].join(" ")}
                  >
                    {/* ig9 (owner-approved 2026-07-16): calibrated size-to-stroke table, lib/icon-stroke.ts */}
                    <s.Icon size={18} strokeWidth={strokeForSize(18)} />
                  </div>
                  <span className={`text-center text-[10.5px] font-semibold leading-[1.2] ${st === "future" ? "text-s-ink-2" : "text-s-ink"}`}>{s.label}</span>
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
                  <Scissors size={18} strokeWidth={1.9} />
                </span>
                <div className="mt-2.5 font-heading text-[16px] font-bold tracking-[-.01em] text-s-ink">{l.inspoTitle}</div>
                <div className="mt-1 text-[13px] leading-[1.42] text-s-ink-2">{l.inspoSub}</div>
                <span className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-s-accent-pale px-[15px] py-[9px] text-[13.5px] font-semibold text-s-accent">
                  {l.seeLooks} <ArrowRight size={15} strokeWidth={1.9} />
                </span>
              </div>
            </Link>
          </>
        )}

        {/* Dein Termin barber + service */}
        {(data.recipientName || localizedServiceName) && (
          <div className="mt-4 rounded-[20px] border border-s-border bg-white p-4 shadow-[0_8px_26px_-16px_rgba(10,10,10,.16)]">
            {data.recipientName && (
              <div className="flex items-center gap-[13px]">
                {data.recipientPhoto ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={data.recipientPhoto} alt="" className="h-12 w-12 flex-shrink-0 rounded-full object-cover" />
                ) : (
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-full bg-s-bg-sunken text-s-ink-2">
                    <Scissors size={20} strokeWidth={2.2} />
                  </div>
                )}
                <div>
                  <div className="font-heading text-[15.5px] font-bold text-s-ink">{data.recipientName}</div>
                  <div className="mt-0.5 flex items-center gap-[5px] text-[12.5px] text-s-ink-2">
                    {data.recipientRating != null && (
                      <><Star size={13} className="fill-s-star text-s-star" /><span className="font-heading font-bold tabular-nums text-s-ink">{data.recipientRating.toFixed(1)}</span></>
                    )}
                    {l.yourBarber}
                  </div>
                </div>
              </div>
            )}
            {localizedServiceName && (
              <div className={`flex items-center gap-3 ${data.recipientName ? "mt-3.5 border-t border-s-border pt-3.5" : ""}`}>
                <div className="flex-1">
                  <div className="font-heading text-[14.5px] font-semibold text-s-ink">{localizedServiceName}</div>
                  {data.serviceDuration != null && <div className="mt-0.5 text-[12.5px] text-s-ink-2"><span className="tabular-nums">{data.serviceDuration}</span> {l.min}</div>}
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
            <MapPin size={18} strokeWidth={1.9} className="text-s-ink-2" />
            <div className="flex-1 font-heading text-[14px] font-semibold text-s-ink">{data.salonAddress}</div>
            <ChevronRight size={18} strokeWidth={1.9} className="text-s-ink-2" />
          </a>
        )}

        {/* small, support-only ticket reference */}
        <div className="mt-[18px] flex items-center justify-center gap-[7px] text-[12px] text-s-ink-2">
          <Ticket size={13} /> {l.ticketNr} <span className="font-heading font-semibold tabular-nums text-s-ink-2">{data.customerName}</span>
        </div>

        {/* help moved to the top-right hero icon (mirrors the back button) */}
      </div>

      {/* action bar */}
      <div className="flex gap-2.5 px-5 pb-6 pt-4">
        {mapsHref ? (
          <a href={mapsHref} target="_blank" rel="noopener noreferrer" className="flex flex-1 items-center justify-center gap-[7px] rounded-full bg-s-accent py-3.5 font-heading text-[14px] font-semibold text-white transition-transform active:scale-[0.98]">
            <Navigation size={17} strokeWidth={1.9} className="fill-white" /> {l.directions}
          </a>
        ) : (
          <Link href={`/${locale}`} className="flex flex-1 items-center justify-center rounded-full bg-s-ink py-3.5 font-heading text-[14px] font-semibold text-white transition-transform active:scale-[0.98]">
            {l.home}
          </Link>
        )}
        {isWaiting ? (
          <button onClick={requestCancel} disabled={cancelling} aria-label={l.cancel} className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full bg-s-error text-white transition active:scale-[0.98] disabled:opacity-50">
            <X size={22} strokeWidth={2.2} />
          </button>
        ) : (
          <button onClick={fetchStatus} aria-label={l.autoUpdate} className="flex h-[54px] w-[54px] shrink-0 items-center justify-center rounded-full border border-s-border bg-white text-s-ink transition-transform duration-150 active:scale-[0.94] active:duration-[80ms] active:ease-glide">
            {/* mockup-ok: WCAG 2.2.2 conformance, this also fires from the un-clicked adaptive poll, so it is bounded (see tailwind.config.js spin-bounded) */}
            <RefreshCw size={18} strokeWidth={1.9} className={refreshing ? "animate-spin-bounded" : ""} />
          </button>
        )}
      </div>

      {/* mockup-ok: destructive-cancel confirmation, replaces window.confirm() */}
      <Modal isOpen={cancelConfirmOpen} onOpenChange={setCancelConfirmOpen} size="sm" keyboardDismissDisabled={cancelling} isDismissable={!cancelling}>
        <ModalHeader title={l.cancel} closeButton={!cancelling} />
        <ModalBody>
          <p>{l.cancelConfirm}</p>
        </ModalBody>
        <ModalFooter>
          <button
            type="button"
            onClick={() => setCancelConfirmOpen(false)}
            disabled={cancelling}
            className="rounded-full border border-s-border bg-white px-5 py-2.5 text-[14px] font-semibold text-s-ink transition-colors hover:bg-s-bg-sunken disabled:opacity-50"
          >
            {l.keepTicket}
          </button>
          <button
            type="button"
            onClick={() => { void handleCancel(); }}
            disabled={cancelling}
            className="rounded-full bg-s-error px-5 py-2.5 text-[14px] font-semibold text-white transition-colors hover:brightness-[1.06] disabled:opacity-50"
          >
            {cancelling ? <Spinner size="sm" invert /> : l.cancel}
          </button>
        </ModalFooter>
      </Modal>
    </div>
  );
}
