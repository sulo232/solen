"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion } from "motion/react";
import { Star, MapPin, Lock, Check, AlertTriangle, ChevronLeft, Scissors, Clock, Info, ArrowRight } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import WalkInPaymentForm from "@/components-legacy/barber/WalkInPaymentForm";
import { computeVat } from "@/lib/vat";
import { toast } from "@/app/[locale]/_components/primitives/Toast";

interface BookingData {
  id: string;
  salon_id: string;
  service_id: string;
  salon_name: string;
  salon_image: string | null;
  salon_rating: number | null;
  salon_review_count: number | null;
  salon_address: string | null;
  salon_phone: string | null;
  salon_slug: string | null;
  salon_vat_registered?: boolean | null;
  salon_vat_rate?: number | null;
  service_name: string;
  service_duration: number | null;
  service_description?: string | null;
  barber_name: string | null;
  barber_avatar: string | null;
  barber_id: string | null;
  barber_role: string | null;
  barber_rating: number | null;
  barber_review_count: number | null;
  salon_open_until: string | null;
  wait_minutes: number | null;
  queue_ahead: number | null;
  /** Walk-in (pay-now-skip-the-line) vs a normal booked appointment. Drives which
      sections show: walk-in → Sofort + wait + queue ticket; normal → fixed date/time. */
  is_walkin: boolean;
  /** Queue ticket number, assigned after payment (shown on the in-store QR ticket). */
  ticket_number: string | null;
  /** Walk-in queue-entry row id, returned by /api/walkin/confirm — needed to cancel (DELETE). */
  queue_id: string | null;
  /** Public capability token for the live queue-tracking page (/queue/[token]). */
  tracking_token: string | null;
  amount: number;
  /** Card / wallet used, e.g. "Visa ···· 4242" — populated from Stripe after payment (null until then). */
  payment_method: string | null;
  starts_at: string;
  stripe_account_id: string | null;
}

const LOCALE_TAG: Record<string, string> = { de: "de-CH", en: "en-CH", fr: "fr-CH", it: "it-CH" };

export default function WalkInPayPage() {
  const searchParams = useSearchParams() ?? new URLSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [cancelled, setCancelled] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);
  // What the cancel actually did to the money — drives the cancelled-screen copy.
  // "refunded" = hold was captured then refunded; "released" = uncaptured hold dropped.
  const [cancelPayment, setCancelPayment] = useState<"refunded" | "released" | null>(null);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [paymentSummary, setPaymentSummary] = useState<{ amount: number; salon_vat_registered?: boolean | null; salon_vat_rate?: number | null } | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [serviceInfoOpen, setServiceInfoOpen] = useState(false);
  // Walk-in can't be paid online right now — non-destructive (the summary stays readable).
  // "counter" = salon takes it in person / payouts not connected; "paused" = no walk-ins now.
  const [payBlocked, setPayBlocked] = useState<null | "counter" | "paused">(null);

  useEffect(() => {
    // Preview mode (?demo=1): render the booking state with sample data so the page
    // is visually verifiable without a live booking. Only active when ?demo is set;
    // never affects the real token-based flow.
    if (searchParams.get("demo")) {
      // ?demo=1 → walk-in; ?demo=normal → a scheduled appointment (to preview the adaptive layout)
      const isWalkin = searchParams.get("demo") !== "normal";
      setBooking({ id: "demo", salon_id: "s", service_id: "v", salon_name: "Barbier Studio Zürich", salon_image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=240&q=80", salon_rating: 4.9, salon_review_count: 128, salon_address: "Niederdorfstrasse 21, 8001 Zürich", salon_phone: "+41 44 123 45 67", salon_slug: "barbier-studio-zuerich", service_name: "Herrenschnitt & Bart", service_duration: 45, barber_name: "Marco Bianchi", barber_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80", barber_id: "demo-barber", barber_role: "Fade & Bart-Spezialist", barber_rating: 4.9, barber_review_count: 62, salon_open_until: "19:00", wait_minutes: isWalkin ? 12 : null, queue_ahead: isWalkin ? 3 : null, is_walkin: isWalkin, ticket_number: isWalkin ? "A47" : null, queue_id: null, tracking_token: "demo", amount: 45, payment_method: "Visa ···· 4242", starts_at: isWalkin ? new Date().toISOString() : new Date(Date.now() + 3 * 86400000).toISOString(), stripe_account_id: null });
      setLoading(false);
      return;
    }
    // Three entry points:
    // 1. ?token=... (salon SMS link) → verify via walk-in-verify endpoint
    // 2. ?salon_id=...&service_id=... (customer self-serve / QR) → synthesize booking from params
    // 3. ?demo (preview mode) — already handled above
    const salonId = searchParams.get("salon_id");
    const serviceId = searchParams.get("service_id");
    const staffId = searchParams.get("staff_id"); // optional preferred barber (null = "Egal")

    if (token) {
      // Token flow: verify the booking via the HMAC token.
      fetch(`/api/bookings/walk-in-verify?token=${encodeURIComponent(token)}&locale=${locale}`)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) {
            setError(l.invalid);
            return;
          }
          setBooking(data.booking);
          if (data.booking?.ticket_number) setPaid(true);
        })
        .catch((e) => { console.error("[walk-in-pay] token verify failed:", e); setError(l.verifyFailed); })
        .finally(() => setLoading(false));
    } else if (salonId && serviceId) {
      // Tokenless flow: customer joined via QR/in-app. Create a minimal booking
      // object from params; pay-intent endpoint will look up salon/service details.
      fetch(`/api/walkin/salon-info?salon_id=${salonId}&locale=${locale}`)
        .then(async (r) => {
          if (!r.ok) throw new Error(l.salonNotFound);
          const data = await r.json();
          const salon = data.salon;
          const service = data.services.find((s: { id: string }) => s.id === serviceId);
          if (!service) throw new Error(l.serviceNotFound);
          // Optional chosen barber (from &staff_id) → show their face on the pay screen.
          const barber = staffId
            ? (data.staff || []).find((b: { id: string }) => b.id === staffId) ?? null
            : null;
          setBooking({
            id: `walkin-${Date.now()}`,
            salon_id: salon.id,
            service_id: service.id,
            salon_name: salon.name,
            salon_image: salon.cover_photo_url ?? null,
            salon_rating: salon.average_rating ?? null,
            salon_review_count: salon.review_count ?? null,
            salon_address: salon.address,
            salon_phone: null,
            salon_slug: salon.slug ?? null,
            salon_vat_registered: salon.vat_registered,
            salon_vat_rate: salon.vat_rate,
            service_name: service.name,
            service_duration: service.duration_minutes,
            service_description: service.description ?? null,
            barber_name: barber?.name ?? null,
            barber_avatar: barber?.avatar_url ?? null,
            barber_id: barber?.id ?? null,
            barber_role: barber?.role ?? null,
            barber_rating: barber?.rating ?? null,
            barber_review_count: barber?.review_count ?? null,
            salon_open_until: null,
            wait_minutes: null,
            queue_ahead: null,
            is_walkin: true,
            ticket_number: null,
            queue_id: null,
            tracking_token: null,
            amount: service.price,
            payment_method: null,
            starts_at: new Date().toISOString(),
            stripe_account_id: null,
          } as BookingData);
        })
        .catch((e) => {
          console.error("[walk-in-pay] salon-info load failed:", e);
          // Preserve the specific localized message (salon / service not found) when we threw it
          // above; fall back to the generic load error for network / parse failures.
          const msg = e instanceof Error && (e.message === l.salonNotFound || e.message === l.serviceNotFound) ? e.message : l.loadFailed;
          setError(msg);
        })
        .finally(() => setLoading(false));
    } else {
      setError(l.noTokenOrSalon);
      setLoading(false);
    }
  }, [token, searchParams]);

  // Payment-only screen: the moment the queue ticket exists (paid + tracking_token), hand
  // off to the single live tracker (/queue/[token]). No second in-queue view here, no QR.
  useEffect(() => {
    if (paid && booking?.tracking_token) {
      router.replace(`/${locale}/queue/${booking.tracking_token}`);
    }
  }, [paid, booking?.tracking_token, locale, router]);

  // Real booking (either token or tokenless) that's still unpaid → create a manual-capture PaymentIntent
  // so the Stripe card form can mount. Skipped in demo mode and once a ticket already exists.
  useEffect(() => {
    if (paid || clientSecret || searchParams.get("demo")) return;
    let body: { salon_id: string; service_id: string; booking_id?: string; preferred_barber_id?: string } | null = null;
    if (token) {
      // Token flow: salon/service come from the verified booking, so wait for it.
      if (!booking || booking.ticket_number) return;
      body = { salon_id: booking.salon_id, service_id: booking.service_id, booking_id: booking.id };
    } else {
      // Tokenless (QR / in-app): fire straight from the URL params, IN PARALLEL with salon-info —
      // no need to wait for the booking object. Cuts a full round-trip off the perceived load.
      const salonId = searchParams.get("salon_id");
      const serviceId = searchParams.get("service_id");
      const staffId = searchParams.get("staff_id");
      if (!salonId || !serviceId) return;
      body = { salon_id: salonId, service_id: serviceId, preferred_barber_id: staffId ?? undefined };
    }
    let cancelled = false;
    fetch("/api/walkin/pay-intent", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...body, locale }),
    })
      .then(async (r) => {
        const d = await r.json().catch(() => null);
        if (cancelled) return;
        if (r.ok && d?.client_secret) {
          setPaymentSummary({ amount: d.amount, salon_vat_registered: d.salon_vat_registered, salon_vat_rate: d.salon_vat_rate });
          setClientSecret(d.client_secret);
          return;
        }
        // Non-OK → keep the summary readable (non-destructive) when the shop simply can't
        // take this walk-in online right now (audit #6 state B). `code` distinguishes the
        // cases; only genuine load/parse failures fall through to the full-page error.
        console.error("[walk-in-pay] pay-intent failed:", r.status, d?.error, d?.code);
        if (d?.code === "walkins_paused") setPayBlocked("paused");
        else if (d?.code === "counter_only" || d?.code === "payouts_not_connected") setPayBlocked("counter");
        else setError(l.loadFailed);
      })
      .catch((e) => {
        if (cancelled) return;
        console.error("[walk-in-pay] pay-intent error:", e);
        setError(l.loadFailed);
      });
    return () => { cancelled = true; };
  }, [token, token ? booking : null, paid, clientSecret, searchParams, locale]);

  const handleCancel = async () => {
    if (cancelling) return;
    // Demo preview (?demo) has no real queue entry → keep the local-only confirmation,
    // don't hit the API (it would 404 on the synthetic id).
    if (searchParams?.get("demo")) {
      setCancelPayment("refunded");
      setCancelled(true);
      return;
    }
    // Real cancel → DELETE the queue entry. The endpoint refunds (captured hold) or releases
    // (uncaptured hold) and re-sequences the queue. Requires the entry id + its tracking_token.
    const queueId = booking?.queue_id;
    const trackingToken = booking?.tracking_token;
    if (!queueId || !trackingToken) {
      console.error("[walk-in-pay] cancel missing queue_id/tracking_token:", { queueId, trackingToken });
      setCancelError(l.cancelFailed);
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const res = await fetch(`/api/walkin/queue/${queueId}?token=${encodeURIComponent(trackingToken)}`, { method: "DELETE" });
      const data = await res.json().catch(() => null);
      if (!res.ok || !data?.success) {
        console.error("[walk-in-pay] cancel failed:", data?.error ?? res.status);
        setCancelError(l.cancelFailed);
        return;
      }
      // Reflect the REAL money outcome from the endpoint (refunded vs released vs nothing).
      setCancelPayment(data.payment ?? null);
      setCancelled(true);
    } catch (e) {
      console.error("[walk-in-pay] cancel error:", e);
      setCancelError(l.cancelFailed);
    } finally {
      setCancelling(false);
    }
  };

  // Demo preview (?demo) has no real payment — tapping pay just reveals the ticket.
  const handleDemoPay = () => setPaid(true);

  // Real payment: once Stripe authorizes the manual-capture hold, /api/walkin/confirm
  // creates the queue entry and issues the ticket number — then we show the ticket.
  const onPaid = async (paymentIntentId: string) => {
    setPaying(true);
    setPayError(null);
    try {
      // confirm works both ways: with token (salon-SMS booking) or tokenless (QR / in-app).
      const res = await fetch("/api/walkin/confirm", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: token ?? undefined, payment_intent_id: paymentIntentId }),
      });
      const data = await res.json();
      if (!res.ok) {
        console.error("[walk-in-pay] confirm failed:", data?.error);
        setPayError(l.confirmFailed);
        // Charge may have gone through — sticky toast so the reference isn't lost.
        toast.error(l.confirmFailed, { duration: Infinity });
        return;
      }
      setBooking((prev) => prev ? {
        ...prev,
        ticket_number: data.ticket_number ?? prev.ticket_number,
        queue_id: data.queue_id ?? prev.queue_id,
        tracking_token: data.tracking_token ?? prev.tracking_token,
        payment_method: data.payment_method ?? prev.payment_method,
        queue_ahead: data.queue_ahead ?? prev.queue_ahead,
        wait_minutes: data.wait_minutes ?? prev.wait_minutes,
      } : prev);
      setPaid(true);
    } catch (e) {
      console.error("[walk-in-pay] confirm error:", e);
      setPayError(l.confirmFailed);
      toast.error(l.confirmFailed, { duration: Infinity });
    } finally {
      setPaying(false);
    }
  };

  const labels = {
    de: { title: "Bestätigen & zahlen", total: "Gesamt", today: "Heute", now: "Sofort", secure: "Sichere Zahlung über Stripe", min: "Min", back: "Zurück", barber: "Ihr Barber", salonEyebrow: "Salon", serviceEyebrow: "Service", walkinEyebrow: "Walk-in", openUntil: "Geöffnet bis", numberOnArrival: "Nummer bei Ankunft", ahead: "vor Ihnen", payOnce: "Einmalzahlung, sofort bestätigt", wait: "Wartezeit", paymentEyebrow: "Zahlung", vat: "inkl. {rate}% MwSt", terminLabel: "Termin", afterPayment: "Nummer nach der Zahlung", paidTitle: "Sie sind in der Schlange", yourNumber: "Ihre Nummer", showInStore: "Zeigen Sie diesen Code im Salon", addressLabel: "Adresse", phoneLabel: "Telefon", walkOut: "Sie können gehen. Wir sagen Ihnen Bescheid, wenn Sie dran sind.", cancelPolicy: "Kostenlose Stornierung bis zum Aufruf", cancelBtn: "Stornieren", payVerb: "bezahlen", confirmFailed: "Bestätigung fehlgeschlagen", cancelFailed: "Stornierung fehlgeschlagen. Bitte versuchen Sie es erneut.", salonNotFound: "Salon nicht gefunden", serviceNotFound: "Service nicht gefunden", loadFailed: "Salon / Service konnte nicht geladen werden", payAtCounter: "Dieser Salon kann Walk-ins noch nicht online bezahlen. Bitte zahlen Sie am Schalter.", blockedCounterTitle: "Online-Zahlung nicht möglich", blockedCounterBody: "Dieser Salon nimmt diesen Termin nur vor Ort an. Zahlen Sie direkt im Salon am Tresen.", blockedPausedTitle: "Walk-ins gerade pausiert", blockedPausedBody: "Dieser Salon nimmt im Moment keine neuen Walk-ins an. Versuchen Sie es später nochmal oder wählen Sie einen anderen Salon.", chooseAnotherSalon: "Anderen Salon wählen", viewSalon: "Zum Salon", verifyFailed: "Token konnte nicht überprüft werden", noTokenOrSalon: "Kein Token oder Salon angegeben", stepNext: "Bald", cancelled: "Storniert", cancelledDesc: "Ihr Walk-in wurde storniert. Die Zahlung wird erstattet.", cancelledRefunded: "Ihr Walk-in wurde storniert. Die Zahlung wird erstattet.", cancelledReleased: "Ihr Walk-in wurde storniert. Die Kartenreservierung wurde aufgehoben.", paid: "Zahlung erfolgreich", paidDesc: "Ihre Zahlung wurde verarbeitet. Sie können dieses Fenster schliessen.", invalid: "Ungültiger oder abgelaufener Link", noToken: "Kein Token angegeben", errorEyebrow: "Fehler", paidEyebrow: "Zahlung", receiptTitle: "Beleg", methodLabel: "Zahlungsart", dateRowLabel: "Datum" },
    en: { title: "Confirm & pay", total: "Total", today: "Today", now: "Now", secure: "Secure payment via Stripe", min: "min", back: "Back", barber: "Your barber", salonEyebrow: "Store", serviceEyebrow: "Service", walkinEyebrow: "Walk-in", openUntil: "Open until", numberOnArrival: "Number on arrival", ahead: "ahead of you", payOnce: "One-time payment, confirmed instantly", wait: "wait", paymentEyebrow: "Payment", vat: "incl. {rate}% VAT", terminLabel: "When", afterPayment: "Number after payment", paidTitle: "You're in the queue", yourNumber: "Your number", showInStore: "Show this code at the store", addressLabel: "Address", phoneLabel: "Phone", walkOut: "You can leave. We'll let you know when it's your turn.", cancelPolicy: "Free cancellation until you're called", cancelBtn: "Cancel", payVerb: "pay", confirmFailed: "Confirmation failed", cancelFailed: "Cancellation failed. Please try again.", salonNotFound: "Store not found", serviceNotFound: "Service not found", loadFailed: "Could not load store / service", payAtCounter: "This store can't take walk-in payments online yet. Please pay at the counter.", blockedCounterTitle: "Online payment unavailable", blockedCounterBody: "This store only takes this appointment in person. Pay at the counter when you arrive.", blockedPausedTitle: "Walk-ins paused right now", blockedPausedBody: "This store isn't taking new walk-ins at the moment. Try again later or pick another store.", chooseAnotherSalon: "Choose another store", viewSalon: "View store", verifyFailed: "Failed to verify token", noTokenOrSalon: "No token or store provided", stepNext: "Next", cancelled: "Cancelled", cancelledDesc: "Your walk-in was cancelled. Your payment will be refunded.", cancelledRefunded: "Your walk-in was cancelled. Your payment will be refunded.", cancelledReleased: "Your walk-in was cancelled. The card hold has been released.", paid: "Payment successful", paidDesc: "Your payment has been processed. You can close this window.", invalid: "Invalid or expired link", noToken: "No token provided", errorEyebrow: "Error", paidEyebrow: "Payment", receiptTitle: "Receipt", methodLabel: "Payment method", dateRowLabel: "Date" },
    fr: { title: "Confirmer & payer", total: "Total", today: "Aujourd'hui", now: "Maintenant", secure: "Paiement sécurisé via Stripe", min: "min", back: "Retour", barber: "Votre coiffeur", salonEyebrow: "Salon", serviceEyebrow: "Service", walkinEyebrow: "Walk-in", openUntil: "Ouvert jusqu'à", numberOnArrival: "Numéro à l'arrivée", ahead: "devant vous", payOnce: "Paiement unique, confirmé immédiatement", wait: "d'attente", paymentEyebrow: "Paiement", vat: "TVA {rate}% incluse", terminLabel: "Quand", afterPayment: "Numéro après paiement", paidTitle: "Vous êtes dans la file", yourNumber: "Votre numéro", showInStore: "Montrez ce code au salon", addressLabel: "Adresse", phoneLabel: "Téléphone", walkOut: "Vous pouvez partir. Nous vous préviendrons quand ce sera votre tour.", cancelPolicy: "Annulation gratuite jusqu'à votre appel", cancelBtn: "Annuler", payVerb: "payer", confirmFailed: "Échec de la confirmation", cancelFailed: "Échec de l'annulation. Veuillez réessayer.", salonNotFound: "Salon introuvable", serviceNotFound: "Service introuvable", loadFailed: "Impossible de charger le salon / service", payAtCounter: "Ce salon ne peut pas encore accepter les paiements walk-in en ligne. Veuillez payer au comptoir.", blockedCounterTitle: "Paiement en ligne indisponible", blockedCounterBody: "Ce salon ne prend ce rendez-vous qu'en personne. Payez au comptoir à votre arrivée.", blockedPausedTitle: "Walk-ins en pause", blockedPausedBody: "Ce salon n'accepte pas de nouveaux walk-ins pour le moment. Réessayez plus tard ou choisissez un autre salon.", chooseAnotherSalon: "Choisir un autre salon", viewSalon: "Voir le salon", verifyFailed: "Échec de la vérification du jeton", noTokenOrSalon: "Aucun jeton ou salon fourni", stepNext: "Bientôt", cancelled: "Annulé", cancelledDesc: "Votre walk-in a été annulé. Votre paiement sera remboursé.", cancelledRefunded: "Votre walk-in a été annulé. Votre paiement sera remboursé.", cancelledReleased: "Votre walk-in a été annulé. La préautorisation de la carte a été levée.", paid: "Paiement réussi", paidDesc: "Votre paiement a été traité. Vous pouvez fermer cette fenêtre.", invalid: "Lien invalide ou expiré", noToken: "Aucun jeton fourni", errorEyebrow: "Erreur", paidEyebrow: "Paiement", receiptTitle: "Reçu", methodLabel: "Moyen de paiement", dateRowLabel: "Date" },
    it: { title: "Conferma e paga", total: "Totale", today: "Oggi", now: "Subito", secure: "Pagamento sicuro con Stripe", min: "min", back: "Indietro", barber: "Il tuo barbiere", salonEyebrow: "Store", serviceEyebrow: "Servizio", walkinEyebrow: "Walk-in", openUntil: "Aperto fino alle", numberOnArrival: "Numero all'arrivo", ahead: "prima di te", payOnce: "Pagamento unico, confermato subito", wait: "di attesa", paymentEyebrow: "Pagamento", vat: "IVA {rate}% inclusa", terminLabel: "Quando", afterPayment: "Numero dopo il pagamento", paidTitle: "Sei in coda", yourNumber: "Il tuo numero", showInStore: "Mostra questo codice allo store", addressLabel: "Indirizzo", phoneLabel: "Telefono", walkOut: "Puoi uscire. Ti avviseremo quando è il tuo turno.", cancelPolicy: "Cancellazione gratuita fino alla chiamata", cancelBtn: "Annulla", payVerb: "paga", confirmFailed: "Conferma non riuscita", cancelFailed: "Annullamento non riuscito. Riprova.", salonNotFound: "Store non trovato", serviceNotFound: "Servizio non trovato", loadFailed: "Impossibile caricare store / servizio", payAtCounter: "Questo store non può ancora accettare pagamenti walk-in online. Paga allo sportello.", blockedCounterTitle: "Pagamento online non disponibile", blockedCounterBody: "Questo store accetta questo appuntamento solo di persona. Paga allo sportello all'arrivo.", blockedPausedTitle: "Walk-in in pausa", blockedPausedBody: "Questo store non accetta nuovi walk-in al momento. Riprova più tardi o scegli un altro store.", chooseAnotherSalon: "Scegli un altro store", viewSalon: "Vai allo store", verifyFailed: "Verifica del token non riuscita", noTokenOrSalon: "Nessun token o store fornito", stepNext: "A breve", cancelled: "Annullato", cancelledDesc: "Il tuo walk-in è stato annullato. Il pagamento sarà rimborsato.", cancelledRefunded: "Il tuo walk-in è stato annullato. Il pagamento sarà rimborsato.", cancelledReleased: "Il tuo walk-in è stato annullato. Il blocco sulla carta è stato rilasciato.", paid: "Pagamento riuscito", paidDesc: "Il pagamento è stato elaborato. Puoi chiudere questa finestra.", invalid: "Link non valido o scaduto", noToken: "Nessun token fornito", errorEyebrow: "Errore", paidEyebrow: "Pagamento", receiptTitle: "Ricevuta", methodLabel: "Metodo di pagamento", dateRowLabel: "Data" },
  };
  const l = labels[locale as keyof typeof labels] ?? labels.de;
  const tag = LOCALE_TAG[locale] ?? "de-CH";

  // Payment surface → always 2 decimals + locale-correct symbol position
  // (de-CH renders "CHF 45.00"). `amount` is CHF gross (incl. VAT), not Rappen.
  // The payment response owns the payable total; a later salon-info response cannot overwrite it.
  const summary = paymentSummary ?? booking;
  const vatRate = summary?.salon_vat_rate;
  const showVat = summary?.salon_vat_registered === true && typeof vatRate === "number" && Number.isFinite(vatRate) && vatRate >= 0;
  const vat = summary && showVat ? computeVat(Math.round(summary.amount * 100), { registered: true, ratePercent: vatRate }) : null;
  const vatRateLabel = vat ? new Intl.NumberFormat(tag, { maximumFractionDigits: 20 }).format(vat.ratePercent) : "";
  const fmtChf = (chf: number) =>
    new Intl.NumberFormat(tag, { style: "currency", currency: "CHF", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(chf);
  const amountStr = summary ? fmtChf(summary.amount) : "";
  const vatStr = vat ? fmtChf(vat.vatRappen / 100) : "";
  const payCta = locale === "en" ? `Pay ${amountStr}` : locale === "fr" ? `Payer ${amountStr}` : locale === "it" ? `Paga ${amountStr}` : `${amountStr} bezahlen`;
  const paidLabel = locale === "en" ? "Paid" : locale === "fr" ? "Payé" : locale === "it" ? "Pagato" : "Bezahlt";
  const routeLabel = locale === "en" ? "Route" : locale === "fr" ? "Itinéraire" : locale === "it" ? "Percorso" : "Route";
  // Barber tile → staff profile (only when we have the salon slug + staff id from the verified booking)
  const canOpenBarber = Boolean(booking?.salon_slug && booking?.barber_id);
  const openBarber = () => {
    if (booking?.salon_slug && booking?.barber_id) router.push(`/${locale}/salon/${booking.salon_slug}/staff/${booking.barber_id}`);
  };
  // Salon tile → the salon's page (tap the name/address). Route link stays separate (maps).
  const canOpenSalon = Boolean(booking?.salon_slug);
  const openSalon = () => {
    if (booking?.salon_slug) router.push(`/${locale}/salon/${booking.salon_slug}`);
  };
  const mapsHref = booking?.salon_address ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.salon_address)}` : null;

  let dateLabel = "";
  if (booking) {
    const d = new Date(booking.starts_at);
    const time = d.toLocaleTimeString(tag, { hour: "2-digit", minute: "2-digit" });
    const isToday = new Date().toDateString() === d.toDateString();
    dateLabel = isToday ? `${l.today}, ${time}` : `${d.toLocaleDateString(tag, { day: "numeric", month: "short" })}, ${time}`;
  }

  const fade = { initial: { opacity: 0, y: 16 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.4, ease: [0.25, 1, 0.5, 1] as const } };

  return (
    <div className={`flex min-h-screen flex-col ${paid ? "bg-white" : "bg-s-bg-sunken"}`}>
      {/* Top nav — back only, using the SAME button treatment as the site
          Header (white rounded-xl + soft shadow, icon 22/2.2) for consistency. */}
      {!loading && (
        <div className="mx-auto flex w-full max-w-md items-center justify-start px-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={l.back}
            className="grid h-11 w-11 place-items-center rounded-xl bg-white text-s-ink shadow-[0_6px_18px_rgba(26,18,9,0.10)] transition-transform duration-200 active:scale-[0.94]"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
        </div>
      )}
      {loading ? (
        // mockup-ok: WCAG 2.2.2 conformance, mount-load dots bounded (tailwind.config.js pulse-bounded)
        <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center gap-1.5 px-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1.5 w-1.5 animate-pulse-bounded rounded-full bg-s-ink/50" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      ) : cancelled ? (
        <motion.div {...fade} className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-s-bg-sunken">
            <Check size={24} strokeWidth={2.4} className="text-s-ink-2" />
          </div>
          <h2 className="font-heading text-[18px] font-semibold text-s-ink">{l.cancelled}</h2>
          <p className="mt-1.5 max-w-[280px] font-body text-[13.5px] leading-relaxed text-s-ink-2">{cancelPayment === "released" ? l.cancelledReleased : cancelPayment === "refunded" ? l.cancelledRefunded : l.cancelledDesc}</p>
        </motion.div>
      ) : paid ? (
        // brief spinner, the redirect effect sends to /queue/[token] once the ticket exists
        // mockup-ok: WCAG 2.2.2 conformance, auto-redirect dots bounded (tailwind.config.js pulse-bounded)
        <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center gap-1.5 px-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1.5 w-1.5 animate-pulse-bounded rounded-full bg-s-ink/50" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      ) : error ? (
        <motion.div {...fade} className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[18px] bg-s-warning/10">
            <AlertTriangle size={26} className="text-s-warning" />
          </div>
          <p className="mb-2 font-heading text-[12px] uppercase tracking-[.20em] text-s-ink-2">{l.errorEyebrow}</p>
          <p className="font-body text-sm text-s-ink-2">{error ?? l.invalid}</p>
        </motion.div>
      ) : booking ? (
        <motion.div {...fade} className="flex flex-1 flex-col">
          {/* Scrollable content */}
          <div className="mx-auto w-full max-w-md px-4 pt-1 pb-6">
            <h1 className="mb-4 px-1 font-heading text-[22px] font-semibold leading-[1.15] tracking-[-.02em] text-s-ink">{l.title}</h1>

            {/* Pay-at-counter / paused banner (audit #6 state B) — non-destructive: the summary
                below stays fully readable. Warning (amber) refined-pastel pattern, never red:
                this is informational, not a failure. */}
            {payBlocked && (
              <div className="mb-3 flex items-start gap-3 rounded-2xl bg-s-warning/10 p-4">
                <div className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-s-warning/15">
                  <AlertTriangle size={18} strokeWidth={1.9} className="text-s-warning" aria-hidden />
                </div>
                <div className="min-w-0">
                  <div className="font-heading text-[15px] font-semibold text-s-ink">{payBlocked === "paused" ? l.blockedPausedTitle : l.blockedCounterTitle}</div>
                  <p className="mt-0.5 text-[13.5px] leading-relaxed text-s-ink-2">{payBlocked === "paused" ? l.blockedPausedBody : l.blockedCounterBody}</p>
                </div>
              </div>
            )}

            {/* Card 1 — booking details, icon-led rows (Uber-checkout pattern: white card on
                grey, leading photo/face/icon per row, hairlines between rows). */}
            <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,18,16,.04),0_6px_18px_rgba(20,18,16,.05)]">
              {/* Salon */}
              <div className="flex items-center gap-3">
                {booking.salon_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={booking.salon_image} alt="" className="h-11 w-11 shrink-0 rounded-[12px] object-cover shadow-elevation-1" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-s-bg-sunken font-heading text-base font-semibold text-s-ink">
                    {booking.salon_name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-heading text-[15px] font-semibold tracking-[-.01em] text-s-ink">{booking.salon_name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px]">
                    {booking.salon_rating != null && booking.salon_rating > 0 &&
                      booking.salon_review_count != null && booking.salon_review_count > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Star size={13} stroke="none" className="fill-s-star" aria-hidden />
                        <span className="font-heading font-semibold tabular-nums text-s-ink">{booking.salon_rating.toFixed(1)}</span>
                        {canOpenSalon ? (
                          <button type="button" onClick={openSalon} className="tabular-nums font-semibold text-s-accent transition-opacity active:opacity-60">({booking.salon_review_count})</button>
                        ) : (
                          <span className="tabular-nums text-s-ink-2">({booking.salon_review_count})</span>
                        )}
                      </span>
                    )}
                    {booking.salon_open_until && (
                      <span className="font-medium text-s-success">{l.openUntil} {booking.salon_open_until}</span>
                    )}
                  </div>
                  {booking.salon_address && (
                    <a
                      href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(booking.salon_address)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-0.5 flex items-center gap-1 text-[12.5px] text-s-ink-2 no-underline transition-colors hover:text-s-ink"
                    >
                      <MapPin size={12} className="shrink-0" />
                      <span className="truncate">{booking.salon_address}</span>
                    </a>
                  )}
                </div>
              </div>

              {/* Barber — face kept (your requirement), as the row's leading element */}
              {booking.barber_name && (
                <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
                  {booking.barber_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={booking.barber_avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-s-border" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-s-bg-sunken font-heading text-sm font-semibold text-s-ink-2">
                      {booking.barber_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-heading text-[15px] font-semibold text-s-ink">{booking.barber_name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-s-ink-2">
                      {booking.barber_role && <span className="truncate">{booking.barber_role}</span>}
                      {booking.barber_rating != null && booking.barber_rating > 0 &&
                        booking.barber_review_count != null && booking.barber_review_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={12} stroke="none" className="fill-s-star" aria-hidden />
                          <span className="font-semibold tabular-nums text-s-ink">{booking.barber_rating.toFixed(1)}</span>
                          {canOpenBarber ? (
                            <button type="button" onClick={openBarber} className="tabular-nums font-semibold text-s-accent transition-opacity active:opacity-60">({booking.barber_review_count})</button>
                          ) : (
                            <span className="tabular-nums">({booking.barber_review_count})</span>
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Service */}
              <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <Scissors size={20} strokeWidth={2.2} className="text-s-ink-2" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading text-[15px] font-semibold text-s-ink">{booking.service_name}</span>
                    {booking.service_description && (
                      <button type="button" onClick={() => setServiceInfoOpen((v) => !v)} aria-label={booking.service_name} className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-s-ink-2 transition active:scale-90">
                        <Info size={14} strokeWidth={1.6} />
                      </button>
                    )}
                  </div>
                  {booking.service_duration ? <div className="mt-0.5 text-[13px] tabular-nums text-s-ink-2">ca. {booking.service_duration} {l.min}</div> : null}
                  {serviceInfoOpen && booking.service_description && (
                    <div className="mt-1.5 text-[13px] leading-relaxed text-s-ink-2">{booking.service_description}</div>
                  )}
                </div>
              </div>

              {/* When — adaptive: walk-in (Sofort + ETA + ticket-after-pay) vs scheduled (date/time) */}
              <div className="mt-3 flex items-center gap-3 border-t border-s-border pt-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <Clock size={20} strokeWidth={2.2} className="text-s-ink-2" />
                </div>
                <div className="min-w-0 flex-1">
                  {booking.is_walkin ? (
                    <>
                      <div className="font-heading text-[15px] font-semibold text-s-success">{l.now}</div>
                      {booking.wait_minutes != null && <div className="mt-0.5 text-[13px] tabular-nums text-s-ink-2">~{booking.wait_minutes} {l.min} {l.wait}</div>}
                      <div className="mt-0.5 text-[13px] text-s-ink-2">{l.afterPayment}</div>
                    </>
                  ) : (
                    dateLabel && <div className="font-heading text-[15px] font-semibold text-s-ink">{dateLabel}</div>
                  )}
                </div>
              </div>
            </div>

            {/* Card 2 — payment breakdown incl. VAT */}
            <div className="mt-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,18,16,.04),0_6px_18px_rgba(20,18,16,.05)]">
              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between gap-3 text-[14px]">
                  <span className="truncate text-s-ink">{booking.service_name}</span>
                  <span className="shrink-0 font-body tabular-nums text-s-ink">{amountStr}</span>
                </div>
                {showVat && (
                  <div className="flex items-baseline justify-between gap-3 text-[13px]">
                    <span className="text-s-ink-2">{l.vat.replace("{rate}", vatRateLabel)}</span>
                    <span className="shrink-0 tabular-nums text-s-ink-2">{vatStr}</span>
                  </div>
                )}
              </div>
              <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-s-border pt-2.5">
                <span className="self-center font-heading text-[15px] font-semibold text-s-ink">{l.total}</span>
                <span className="font-body text-[22px] font-semibold tabular-nums text-s-ink">{amountStr}</span>
              </div>
              {/* mockup-ok: content-only fix (hierarchy-density-05), reuses the exact text-[12px] font-medium text-s-ink-2 style already used for the "secure" trust line below the CTA on this same page. Renders an i18n string (cancelPolicy) that already existed in all 4 locale objects but had zero JSX render sites. */}
              <div className="mt-2 text-[12px] font-medium text-s-ink-2">{l.cancelPolicy}</div>
            </div>

            {/* Payment — real Stripe Elements (manual-capture hold). Demo mode skips to the CTA below. */}
            {clientSecret && (
              <div className="mt-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,18,16,.04),0_6px_18px_rgba(20,18,16,.05)]">
                <WalkInPaymentForm
                  clientSecret={clientSecret}
                  amount={summary?.amount ?? booking.amount}
                  locale={locale}
                  onPaid={onPaid}
                  payLabel={l.payVerb}
                  secureLabel={l.secure}
                />
              </div>
            )}
            {token && !clientSecret && !booking.ticket_number && !payBlocked && (
              <div className="mt-4 flex justify-center"><Spinner size="sm" /></div>
            )}
            {payError && <p className="mt-3 text-center text-[12.5px] font-medium text-s-error">{payError}</p>}
          </div>

          {/* Demo CTA — preview mode ONLY. Real flows (token + tokenless) use the Stripe form above. */}
          {searchParams.get("demo") && (
          <div
            className="mt-auto bg-white px-5 pt-5 pb-[calc(18px+env(safe-area-inset-bottom))]"
            style={{ boxShadow: "0 -10px 28px -14px rgba(10,10,10,0.12)" }}
          >
            <div className="mx-auto w-full max-w-md">
              <button
                onClick={handleDemoPay}
                disabled={paying}
                className="flex h-[54px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-semibold text-white shadow-elevation-2 transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
              >
                {payCta}
                {paying ? <Spinner size="sm" invert /> : <ArrowRight size={16} strokeWidth={1.9} />}
              </button>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-medium text-s-ink-2">
                <Lock size={12} />
                {l.secure}
              </div>
            </div>
          </div>
          )}

          {/* Pay-at-counter / paused (audit #6 state B) — the only real paths forward. No
              "reserve spot" CTA: there is no backend to reserve a walk-in without paying. */}
          {payBlocked && (
            <div
              className="mt-auto bg-white px-5 pt-5 pb-[calc(18px+env(safe-area-inset-bottom))]"
              style={{ boxShadow: "0 -10px 28px -14px rgba(10,10,10,0.12)" }}
            >
              <div className="mx-auto w-full max-w-md">
                <button
                  onClick={() => router.push(`/${locale}/search`)}
                  className="flex h-[54px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-body text-[15px] font-semibold text-white shadow-elevation-2 transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98]"
                >
                  {l.chooseAnotherSalon}
                </button>
                {booking.salon_slug && (
                  <button
                    onClick={() => router.push(`/${locale}/salon/${booking.salon_slug}`)}
                    className="mt-3 w-full text-center text-[14px] font-semibold text-s-ink-2 transition-colors hover:text-s-ink active:opacity-60"
                  >
                    {l.viewSalon}
                  </button>
                )}
              </div>
            </div>
          )}
        </motion.div>
      ) : null}
    </div>
  );
}
