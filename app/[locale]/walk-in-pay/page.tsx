"use client";

import { useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Star, MapPin, Lock, Check, AlertTriangle, ChevronLeft, Scissors, Clock, Menu, X, Navigation, Info } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import QRCode from "qrcode";
import WalkInPaymentForm from "@/components-legacy/barber/WalkInPaymentForm";

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
  /** Public capability token for the live queue-tracking page (/queue/[token]). */
  tracking_token: string | null;
  amount: number;
  /** Card / wallet used, e.g. "Visa ···· 4242" — populated from Stripe after payment (null until then). */
  payment_method: string | null;
  starts_at: string;
  stripe_account_id: string | null;
}

const LOCALE_TAG: Record<string, string> = { de: "de-CH", en: "en-GB", fr: "fr-CH", it: "it-CH" };

export default function WalkInPayPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const locale = useLocale();
  const token = searchParams.get("token");

  const [booking, setBooking] = useState<BookingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paying, setPaying] = useState(false);
  const [paid, setPaid] = useState(false);
  const [qrUrl, setQrUrl] = useState<string | null>(null);
  const [cancelled, setCancelled] = useState(false);
  const [rotIdx, setRotIdx] = useState(0);
  const [receiptOpen, setReceiptOpen] = useState(false);
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [qrExpanded, setQrExpanded] = useState(false);
  const [serviceInfoOpen, setServiceInfoOpen] = useState(false);

  useEffect(() => {
    // Preview mode (?demo=1): render the booking state with sample data so the page
    // is visually verifiable without a live booking. Only active when ?demo is set;
    // never affects the real token-based flow.
    if (searchParams.get("demo")) {
      // ?demo=1 → walk-in; ?demo=normal → a scheduled appointment (to preview the adaptive layout)
      const isWalkin = searchParams.get("demo") !== "normal";
      setBooking({ id: "demo", salon_id: "s", service_id: "v", salon_name: "Barbier Studio Zürich", salon_image: "https://images.unsplash.com/photo-1599351431202-1e0f0137899a?w=240&q=80", salon_rating: 4.9, salon_review_count: 128, salon_address: "Niederdorfstrasse 21, 8001 Zürich", salon_phone: "+41 44 123 45 67", salon_slug: "barbier-studio-zuerich", service_name: "Herrenschnitt & Bart", service_duration: 45, barber_name: "Marco Bianchi", barber_avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=120&q=80", barber_id: "demo-barber", barber_role: "Fade & Bart-Spezialist", barber_rating: 4.9, barber_review_count: 62, salon_open_until: "19:00", wait_minutes: isWalkin ? 12 : null, queue_ahead: isWalkin ? 3 : null, is_walkin: isWalkin, ticket_number: isWalkin ? "A47" : null, tracking_token: "demo", amount: 45, payment_method: "Visa ···· 4242", starts_at: isWalkin ? new Date().toISOString() : new Date(Date.now() + 3 * 86400000).toISOString(), stripe_account_id: null });
      if (searchParams.get("demo") === "paid") setPaid(true); // preview the after-payment ticket
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
      fetch(`/api/bookings/walk-in-verify?token=${encodeURIComponent(token)}`)
        .then(async (r) => {
          const data = await r.json();
          if (!r.ok) {
            setError(data.error ?? "Invalid token");
            return;
          }
          setBooking(data.booking);
          if (data.booking?.ticket_number) setPaid(true);
        })
        .catch(() => setError("Failed to verify token"))
        .finally(() => setLoading(false));
    } else if (salonId && serviceId) {
      // Tokenless flow: customer joined via QR/in-app. Create a minimal booking
      // object from params; pay-intent endpoint will look up salon/service details.
      fetch(`/api/walkin/salon-info?salon_id=${salonId}&locale=${locale}`)
        .then(async (r) => {
          if (!r.ok) throw new Error("Salon not found");
          const data = await r.json();
          const salon = data.salon;
          const service = data.services.find((s: { id: string }) => s.id === serviceId);
          if (!service) throw new Error("Service not found");
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
            tracking_token: null,
            amount: service.price,
            payment_method: null,
            starts_at: new Date().toISOString(),
            stripe_account_id: null,
          } as BookingData);
        })
        .catch(() => setError("Could not load salon / service"))
        .finally(() => setLoading(false));
    } else {
      setError("No token or salon provided");
      setLoading(false);
    }
  }, [token, searchParams]);

  // Generate the in-store QR ticket once payment succeeds. It encodes the live-queue
  // tracking URL — the customer reopens it for the count, the salon scans it on arrival.
  // `qrcode` is a client-safe dep already in package.json.
  useEffect(() => {
    if (!paid || !booking) return;
    const ticketUrl = `${window.location.origin}/${locale}/queue/${booking.tracking_token ?? booking.id}`;
    QRCode.toDataURL(ticketUrl, { width: 460, margin: 1, color: { dark: "#0A0A0A", light: "#FFFFFF" } })
      .then(setQrUrl)
      .catch((e) => console.error("[walk-in-pay] QR generation failed:", e));
  }, [paid, booking, locale]);

  // Rotate the reassurance microcopy while in the queue (Uber-style living text). The
  // interval only counts up; render does the modulo so it never depends on the array.
  useEffect(() => {
    if (!paid) return;
    const id = setInterval(() => setRotIdx((p) => p + 1), 2800);
    return () => clearInterval(id);
  }, [paid]);

  // Real booking (either token or tokenless) that's still unpaid → create a manual-capture PaymentIntent
  // so the Stripe card form can mount. Skipped in demo mode and once a ticket already exists.
  useEffect(() => {
    if (paid || clientSecret) return;
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
      body: JSON.stringify(body),
    })
      .then(async (r) => {
        const d = await r.json();
        if (!cancelled && r.ok && d.client_secret) setClientSecret(d.client_secret);
        else if (!r.ok) console.error("[walk-in-pay] pay-intent failed:", d?.error);
      })
      .catch((e) => console.error("[walk-in-pay] pay-intent error:", e));
    return () => { cancelled = true; };
  }, [token, booking, paid, clientSecret, searchParams]);

  const handleCancel = () => {
    // TODO(functional): confirm + POST /api/walkin/cancel — refund per the salon's
    // cancellation policy (free until called / partial fee inside window). Stubbed for design.
    setCancelled(true);
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
        setPayError(data?.error ?? "Bestätigung fehlgeschlagen");
        return;
      }
      setBooking((prev) => prev ? {
        ...prev,
        ticket_number: data.ticket_number ?? prev.ticket_number,
        tracking_token: data.tracking_token ?? prev.tracking_token,
        payment_method: data.payment_method ?? prev.payment_method,
        queue_ahead: data.queue_ahead ?? prev.queue_ahead,
        wait_minutes: data.wait_minutes ?? prev.wait_minutes,
      } : prev);
      setPaid(true);
    } catch (e) {
      console.error("[walk-in-pay] confirm error:", e);
      setPayError("Bestätigung fehlgeschlagen");
    } finally {
      setPaying(false);
    }
  };

  const labels = {
    de: { title: "Bestätigen & zahlen", total: "Gesamt", today: "Heute", now: "Sofort", secure: "Sichere Zahlung über Stripe", min: "Min", back: "Zurück", barber: "Dein Barber", salonEyebrow: "Salon", serviceEyebrow: "Service", walkinEyebrow: "Walk-in", openUntil: "Geöffnet bis", numberOnArrival: "Nummer bei Ankunft", ahead: "vor dir", payOnce: "Einmalzahlung, sofort bestätigt", wait: "Wartezeit", paymentEyebrow: "Zahlung", vat: "inkl. 8.1% MwSt", terminLabel: "Termin", afterPayment: "Nummer & QR nach der Zahlung", paidTitle: "Du bist in der Schlange", yourNumber: "Deine Nummer", showInStore: "Zeig diesen Code im Salon", addressLabel: "Adresse", phoneLabel: "Telefon", walkOut: "Du kannst gehen. Wir sagen dir Bescheid, wenn du dran bist.", cancelPolicy: "Kostenlose Stornierung bis zum Aufruf", cancelBtn: "Stornieren", stepPaid: "Bezahlt", stepNow: "Warten", stepNext: "Bald", stepChair: "Stuhl", barberEyebrow: "Barber", reassure: ["Wir halten dir den Platz frei", "Du musst nicht warten", "Wir melden uns, wenn du dran bist", "Entspann dich, dein Stuhl kommt"], cancelled: "Storniert", cancelledDesc: "Dein Walk-in wurde storniert. Die Zahlung wird erstattet.", paid: "Zahlung erfolgreich", paidDesc: "Deine Zahlung wurde verarbeitet. Du kannst dieses Fenster schliessen.", invalid: "Ungültiger oder abgelaufener Link", noToken: "Kein Token angegeben", errorEyebrow: "Fehler", paidEyebrow: "Zahlung", receiptTitle: "Beleg", methodLabel: "Zahlungsart", dateRowLabel: "Datum" },
    en: { title: "Confirm & pay", total: "Total", today: "Today", now: "Now", secure: "Secure payment via Stripe", min: "min", back: "Back", barber: "Your barber", salonEyebrow: "Salon", serviceEyebrow: "Service", walkinEyebrow: "Walk-in", openUntil: "Open until", numberOnArrival: "Number on arrival", ahead: "ahead of you", payOnce: "One-time payment, confirmed instantly", wait: "wait", paymentEyebrow: "Payment", vat: "incl. 8.1% VAT", terminLabel: "When", afterPayment: "Number & QR after payment", paidTitle: "You're in the queue", yourNumber: "Your number", showInStore: "Show this code at the salon", addressLabel: "Address", phoneLabel: "Phone", walkOut: "You can leave. We'll let you know when it's your turn.", cancelPolicy: "Free cancellation until you're called", cancelBtn: "Cancel", stepPaid: "Paid", stepNow: "Waiting", stepNext: "Next", stepChair: "Chair", barberEyebrow: "Barber", reassure: ["Hold tight, we've got your spot", "No need to wait around", "We'll ping you when you're close", "Relax, your chair is coming"], cancelled: "Cancelled", cancelledDesc: "Your walk-in was cancelled. Your payment will be refunded.", paid: "Payment successful", paidDesc: "Your payment has been processed. You can close this window.", invalid: "Invalid or expired link", noToken: "No token provided", errorEyebrow: "Error", paidEyebrow: "Payment", receiptTitle: "Receipt", methodLabel: "Payment method", dateRowLabel: "Date" },
    fr: { title: "Confirmer & payer", total: "Total", today: "Aujourd'hui", now: "Maintenant", secure: "Paiement sécurisé via Stripe", min: "min", back: "Retour", barber: "Votre coiffeur", salonEyebrow: "Salon", serviceEyebrow: "Service", walkinEyebrow: "Walk-in", openUntil: "Ouvert jusqu'à", numberOnArrival: "Numéro à l'arrivée", ahead: "devant vous", payOnce: "Paiement unique, confirmé immédiatement", wait: "d'attente", paymentEyebrow: "Paiement", vat: "TVA 8.1% incluse", terminLabel: "Quand", afterPayment: "Numéro & QR après paiement", paidTitle: "Vous êtes dans la file", yourNumber: "Votre numéro", showInStore: "Montrez ce code au salon", addressLabel: "Adresse", phoneLabel: "Téléphone", walkOut: "Vous pouvez partir. Nous vous préviendrons quand ce sera votre tour.", cancelPolicy: "Annulation gratuite jusqu'à votre appel", cancelBtn: "Annuler", stepPaid: "Payé", stepNow: "En file", stepNext: "Bientôt", stepChair: "Fauteuil", barberEyebrow: "Coiffeur", reassure: ["On garde ta place au chaud", "Pas besoin d'attendre sur place", "On te prévient quand c'est bientôt à toi", "Détends-toi, ton fauteuil arrive"], cancelled: "Annulé", cancelledDesc: "Votre walk-in a été annulé. Votre paiement sera remboursé.", paid: "Paiement réussi", paidDesc: "Votre paiement a été traité. Vous pouvez fermer cette fenêtre.", invalid: "Lien invalide ou expiré", noToken: "Aucun jeton fourni", errorEyebrow: "Erreur", paidEyebrow: "Paiement", receiptTitle: "Reçu", methodLabel: "Moyen de paiement", dateRowLabel: "Date" },
    it: { title: "Conferma e paga", total: "Totale", today: "Oggi", now: "Subito", secure: "Pagamento sicuro con Stripe", min: "min", back: "Indietro", barber: "Il tuo barbiere", salonEyebrow: "Salon", serviceEyebrow: "Servizio", walkinEyebrow: "Walk-in", openUntil: "Aperto fino alle", numberOnArrival: "Numero all'arrivo", ahead: "prima di te", payOnce: "Pagamento unico, confermato subito", wait: "di attesa", paymentEyebrow: "Pagamento", vat: "IVA 8.1% inclusa", terminLabel: "Quando", afterPayment: "Numero e QR dopo il pagamento", paidTitle: "Sei in coda", yourNumber: "Il tuo numero", showInStore: "Mostra questo codice al salone", addressLabel: "Indirizzo", phoneLabel: "Telefono", walkOut: "Puoi uscire. Ti avviseremo quando è il tuo turno.", cancelPolicy: "Cancellazione gratuita fino alla chiamata", cancelBtn: "Annulla", stepPaid: "Pagato", stepNow: "In attesa", stepNext: "A breve", stepChair: "Sedia", barberEyebrow: "Barbiere", reassure: ["Ti teniamo il posto", "Non c'è bisogno di aspettare", "Ti avvisiamo quando manca poco", "Rilassati, la tua poltrona sta arrivando"], cancelled: "Annullato", cancelledDesc: "Il tuo walk-in è stato annullato. Il pagamento sarà rimborsato.", paid: "Pagamento riuscito", paidDesc: "Il pagamento è stato elaborato. Puoi chiudere questa finestra.", invalid: "Link non valido o scaduto", noToken: "Nessun token fornito", errorEyebrow: "Errore", paidEyebrow: "Pagamento", receiptTitle: "Ricevuta", methodLabel: "Metodo di pagamento", dateRowLabel: "Data" },
  };
  const l = labels[locale as keyof typeof labels] ?? labels.de;
  const tag = LOCALE_TAG[locale] ?? "de-CH";

  // Payment surface → always 2 decimals + locale-correct symbol position
  // (de-CH renders "CHF 45.00"). `amount` is CHF gross (incl. VAT), not Rappen.
  // Swiss consumer prices are shown incl. 8.1% MwSt; we surface the VAT portion
  // for transparency: vat = gross × rate / (1 + rate).
  const VAT_RATE = 0.081;
  const fmtChf = (chf: number) =>
    new Intl.NumberFormat(tag, { style: "currency", currency: "CHF", minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(chf);
  const amountStr = booking ? fmtChf(booking.amount) : "";
  const vatStr = booking ? fmtChf((booking.amount * VAT_RATE) / (1 + VAT_RATE)) : "";
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
      {/* Top nav — back + menu in one bar, using the SAME button treatment as the site
          Header (white rounded-xl + soft shadow, Menu 22/2.2) for consistency. */}
      {!loading && (
        <div className="mx-auto flex w-full max-w-md items-center justify-between px-4 pt-4">
          <button
            type="button"
            onClick={() => router.back()}
            aria-label={l.back}
            className="grid h-10 w-10 place-items-center rounded-xl bg-white text-s-ink shadow-[0_6px_18px_rgba(26,18,9,0.10)] transition-transform duration-200 active:scale-[0.94]"
          >
            <ChevronLeft size={22} strokeWidth={2.2} />
          </button>
          <button
            type="button"
            aria-label="Menü öffnen"
            className="grid h-10 w-10 place-items-center rounded-xl bg-white text-s-ink shadow-[0_6px_18px_rgba(26,18,9,0.10)] transition-transform duration-200 active:scale-[0.94]"
          >
            <Menu size={22} strokeWidth={2.2} />
          </button>
        </div>
      )}
      {loading ? (
        <div className="mx-auto flex w-full max-w-md flex-1 items-center justify-center gap-1.5 px-5">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-1.5 w-1.5 animate-pulse rounded-full bg-s-ink/50" style={{ animationDelay: `${i * 0.2}s` }} />
          ))}
        </div>
      ) : cancelled ? (
        <motion.div {...fade} className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-s-ink/[0.06]">
            <Check size={24} className="text-s-ink-2" />
          </div>
          <h2 className="font-heading text-[18px] font-semibold text-s-ink">{l.cancelled}</h2>
          <p className="mt-1.5 max-w-[280px] font-body text-[13.5px] leading-relaxed text-s-ink-2">{l.cancelledDesc}</p>
        </motion.div>
      ) : paid ? (
        // After-payment LIVE STATUS — no card. Full-bleed on white: number + rotating
        // reassurance + status pill + journey stepper, then a bento grid (QR / Paid + Barber /
        // Salon). Tap QR → expands fullscreen; tap barber → opens their staff profile.
        <>
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pb-6">
          <div className="flex flex-1 flex-col justify-center">
            {/* Hero */}
            <div className="animate-enter-up text-center" style={{ animationDelay: "0.05s" }}>
              <p className="text-[11.5px] font-bold uppercase tracking-[0.05em] text-s-ink-3">{l.yourNumber}</p>
              {booking?.ticket_number && (
                <div className="mt-1 font-heading text-[60px] font-extrabold leading-[0.9] tracking-[-.035em] text-s-ink">{booking.ticket_number}</div>
              )}
              {/* Rotating reassurance — living microcopy (no card, this carries the feeling) */}
              <div className="relative mt-3 h-[24px] overflow-hidden">
                {l.reassure.map((msg, i) => (
                  <span
                    key={i}
                    className={`absolute inset-x-0 top-0 font-body text-[15px] font-semibold text-s-ink-2 transition-all duration-500 ${i === rotIdx % l.reassure.length ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"}`}
                  >
                    {msg}
                  </span>
                ))}
              </div>
              {/* Live status pill */}
              {booking?.queue_ahead != null && (
                <div className="mt-4 flex justify-center">
                  <span className="inline-flex items-center gap-2.5 rounded-full bg-s-success/10 px-4 py-1.5">
                    <span className="font-heading text-[13.5px] font-semibold tabular-nums text-s-success">{booking.queue_ahead} {l.ahead}</span>
                    {booking.wait_minutes != null && <span className="font-heading text-[13.5px] font-semibold tabular-nums text-s-success">~{booking.wait_minutes} {l.min}</span>}
                  </span>
                </div>
              )}
              {/* Journey stepper — nodes pop in sequence and the green progress draws to "Warten" */}
              <div className="mt-6">
                <div className="flex items-center">
                  {/* Bezahlt — done */}
                  <span className="h-3 w-3 shrink-0 rounded-full bg-s-success" />
                  {/* segment Bezahlt → Warten: green draws over the grey track (CSS scaleX = compositor-smooth) */}
                  <span className="relative h-[3px] flex-1 overflow-hidden rounded-full bg-s-ink/[0.10]">
                    <span className="animate-draw-x absolute inset-0 block origin-left rounded-full bg-s-success" style={{ animationDelay: "0.4s" }} />
                  </span>
                  {/* Warten — now: a soft ping ring (Tailwind animate-ping = scale + opacity only, smooth) */}
                  <span className="relative flex h-3 w-3 shrink-0 items-center justify-center">
                    <span className="animate-ping-slow absolute inline-flex h-3 w-3 rounded-full bg-s-success/60" />
                    <span className="relative h-3 w-3 rounded-full bg-s-success" />
                  </span>
                  <span className="h-[3px] flex-1 rounded-full bg-s-ink/[0.10]" />
                  <span className="h-3 w-3 shrink-0 rounded-full bg-s-ink/[0.14]" />
                  <span className="h-[3px] flex-1 rounded-full bg-s-ink/[0.10]" />
                  <span className="h-3 w-3 shrink-0 rounded-full bg-s-ink/[0.14]" />
                </div>
                <div className="mt-2 flex justify-between text-[10.5px] font-semibold text-s-ink-3">
                  <span>{l.stepPaid}</span>
                  <span className="text-s-ink">{l.stepNow}</span>
                  <span>{l.stepNext}</span>
                  <span>{l.stepChair}</span>
                </div>
              </div>
            </div>

            {/* Bento grid — each tile rises in (CSS, compositor-smooth); the QR morphs open via shared layout */}
            <div className="mt-7 flex flex-col gap-3">
              {/* QR — tap to expand (the code itself morphs to fullscreen, no icon) */}
              <button
                type="button"
                onClick={() => setQrExpanded(true)}
                className="animate-enter-up flex items-center gap-4 rounded-[20px] bg-s-bg-sunken p-4 text-left transition active:scale-[0.99]"
                style={{ animationDelay: "0.13s" }}
              >
                {qrUrl && (
                  <div className="shrink-0 rounded-xl bg-white p-1.5">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={qrUrl} alt="" className="h-[76px] w-[76px]" />
                  </div>
                )}
                <p className="min-w-0 flex-1 font-heading text-[14.5px] font-semibold leading-snug text-s-ink">{l.showInStore}</p>
              </button>

              {/* Paid + Barber, side by side */}
              <div className="animate-enter-up flex gap-3" style={{ animationDelay: "0.2s" }}>
                <button
                  type="button"
                  onClick={() => setReceiptOpen(true)}
                  className="flex flex-1 flex-col justify-center rounded-[20px] bg-s-bg-sunken p-4 text-left transition active:scale-[0.99]"
                >
                  <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-s-ink-3">{paidLabel}</p>
                  <p className="mt-1 font-heading text-[20px] font-extrabold tracking-[-.02em] text-s-ink">{amountStr}</p>
                  <p className="mt-0.5 text-[11px] text-s-ink-3">{l.vat}</p>
                </button>
                {booking?.barber_name && (
                  <button
                    type="button"
                    onClick={openBarber}
                    disabled={!canOpenBarber}
                    className="flex flex-1 flex-col rounded-[20px] bg-s-bg-sunken p-4 text-left transition active:scale-[0.99] disabled:active:scale-100"
                  >
                    <p className="text-[10.5px] font-bold uppercase tracking-[0.05em] text-s-ink-3">{l.barberEyebrow}</p>
                    <div className="mt-2 flex items-center gap-2.5">
                      {booking.barber_avatar ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={booking.barber_avatar} alt="" className="h-10 w-10 shrink-0 rounded-full object-cover" />
                      ) : (
                        <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-s-ink/[0.06]"><Scissors size={16} className="text-s-ink-2" /></div>
                      )}
                      <div className="min-w-0">
                        <p className="truncate font-heading text-[14px] font-bold leading-tight text-s-ink">{booking.barber_name}</p>
                        <p className="truncate text-[11.5px] text-s-ink-2">{booking.service_name}</p>
                      </div>
                    </div>
                  </button>
                )}
              </div>

              {/* Salon — tap the name/address to open the salon page; Route stays separate (maps) */}
              {booking?.salon_name && (
                <div className="animate-enter-up flex items-stretch overflow-hidden rounded-[20px] bg-s-bg-sunken" style={{ animationDelay: "0.27s" }}>
                  <button
                    type="button"
                    onClick={openSalon}
                    disabled={!canOpenSalon}
                    className="flex min-w-0 flex-1 items-center gap-2 p-4 text-left transition active:scale-[0.99] disabled:active:scale-100"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-[14.5px] font-bold leading-tight text-s-ink">{booking.salon_name}</p>
                      {booking.salon_address && <p className="truncate text-[12.5px] text-s-ink-2">{booking.salon_address}</p>}
                    </div>
                  </button>
                  {mapsHref && (
                    <a
                      href={mapsHref}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex shrink-0 items-center gap-1.5 border-l border-s-ink/[0.06] px-4 font-heading text-[13px] font-semibold text-s-accent transition-opacity active:opacity-60"
                    >
                      <Navigation size={15} />{routeLabel}
                    </a>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quiet cancel — states the salon-set policy, demoted per the live-status pattern */}
          <div className="animate-enter-up mt-5 text-center" style={{ animationDelay: "0.34s" }}>
            <p className="text-[12px] text-s-ink-3">{l.cancelPolicy}</p>
            <button
              type="button"
              onClick={handleCancel}
              className="mt-1 font-heading text-[14.5px] font-semibold text-s-error transition-opacity active:opacity-60"
            >
              {l.cancelBtn}
            </button>
          </div>
        </div>

        {/* Tap-to-expand QR — the code morphs from its tile to fullscreen (shared layout) */}
        <AnimatePresence>
          {qrExpanded && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setQrExpanded(false)}
              className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 px-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="flex w-full max-w-[330px] flex-col items-center rounded-[28px] bg-white px-7 py-8"
              >
                <p className="text-[11.5px] font-bold uppercase tracking-[0.05em] text-s-ink-3">{l.yourNumber}</p>
                {booking?.ticket_number && (
                  <p className="font-heading text-[34px] font-extrabold leading-none tracking-[-.03em] text-s-ink">{booking.ticket_number}</p>
                )}
                {qrUrl && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={qrUrl} alt="" className="mt-5 h-[256px] w-[256px]" />
                )}
                <p className="mt-5 font-heading text-[15px] font-semibold text-s-ink">{l.showInStore}</p>
              </motion.div>
              <button
                type="button"
                onClick={() => setQrExpanded(false)}
                aria-label={l.back}
                className="mt-7 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition active:scale-95"
              >
                <X size={20} />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Tap-the-price receipt — what was paid for, method, VAT (scales in as one card) */}
        <AnimatePresence>
          {receiptOpen && booking && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setReceiptOpen(false)}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-8"
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.92 }}
                transition={{ type: "spring", stiffness: 300, damping: 24 }}
                onClick={(e) => e.stopPropagation()}
                className="relative w-full max-w-[340px] rounded-[28px] bg-white px-6 py-7"
              >
                <button
                  type="button"
                  onClick={() => setReceiptOpen(false)}
                  aria-label={l.back}
                  className="absolute right-3.5 top-3.5 grid h-8 w-8 place-items-center rounded-full text-s-ink-3 transition active:scale-90"
                >
                  <X size={18} />
                </button>
                <p className="text-center text-[11.5px] font-bold uppercase tracking-[0.05em] text-s-ink-3">{l.receiptTitle}</p>
                <div className="mt-5 flex flex-col gap-3.5">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="shrink-0 text-[13px] text-s-ink-3">{l.serviceEyebrow}</span>
                    <span className="text-right font-heading text-[14px] font-semibold text-s-ink">{booking.service_name}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="shrink-0 text-[13px] text-s-ink-3">{l.salonEyebrow}</span>
                    <span className="text-right font-heading text-[14px] font-semibold text-s-ink">{booking.salon_name}</span>
                  </div>
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="shrink-0 text-[13px] text-s-ink-3">{l.dateRowLabel}</span>
                    <span className="text-right font-heading text-[14px] font-semibold text-s-ink">{dateLabel}</span>
                  </div>
                  {booking.payment_method && (
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="shrink-0 text-[13px] text-s-ink-3">{l.methodLabel}</span>
                      <span className="text-right font-heading text-[14px] font-semibold tabular-nums text-s-ink">{booking.payment_method}</span>
                    </div>
                  )}
                </div>
                <div className="mt-5 flex items-baseline justify-between gap-4 border-t border-s-ink/[0.08] pt-4">
                  <span className="font-heading text-[15px] font-bold text-s-ink">{l.total}</span>
                  <div className="text-right">
                    <div className="font-heading text-[20px] font-extrabold tracking-[-.02em] text-s-ink">{amountStr}</div>
                    <div className="text-[11px] text-s-ink-3">{l.vat} {vatStr}</div>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
        </>
      ) : error ? (
        <motion.div {...fade} className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center px-5 text-center">
          <div className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-[18px] bg-s-warning/10">
            <AlertTriangle size={26} className="text-s-warning" />
          </div>
          <p className="mb-2 font-heading text-[10px] uppercase tracking-[.20em] text-s-ink-3">{l.errorEyebrow}</p>
          <p className="font-body text-sm text-s-ink-2">{error === "No token provided" ? l.noToken : l.invalid}</p>
        </motion.div>
      ) : booking ? (
        <motion.div {...fade} className="flex flex-1 flex-col">
          {/* Scrollable content */}
          <div className="mx-auto w-full max-w-md px-4 pt-1 pb-6">
            <h1 className="mb-4 px-1 font-heading text-[22px] font-semibold leading-[1.15] tracking-[-.02em] text-s-ink">{l.title}</h1>

            {/* Card 1 — booking details, icon-led rows (Uber-checkout pattern: white card on
                grey, leading photo/face/icon per row, hairlines between rows). */}
            <div className="rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,18,16,.04),0_6px_18px_rgba(20,18,16,.05)]">
              {/* Salon */}
              <div className="flex items-center gap-3">
                {booking.salon_image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={booking.salon_image} alt="" className="h-11 w-11 shrink-0 rounded-[12px] object-cover shadow-elevation-1" />
                ) : (
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[12px] bg-s-ink/[0.06] font-heading text-base font-semibold text-s-ink">
                    {booking.salon_name?.charAt(0) ?? "?"}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="truncate font-heading text-[15px] font-semibold tracking-[-.01em] text-s-ink">{booking.salon_name}</div>
                  <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px]">
                    {booking.salon_rating != null && booking.salon_rating > 0 && (
                      <span className="flex items-center gap-1.5">
                        <Star size={13} fill="#FFC32B" stroke="none" aria-hidden />
                        <span className="font-heading font-semibold tabular-nums text-s-ink">{booking.salon_rating.toFixed(1)}</span>
                        {booking.salon_review_count != null && <span className="tabular-nums text-s-ink-2">({booking.salon_review_count})</span>}
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
                <div className="mt-3 flex items-center gap-3 border-t border-s-ink/[0.06] pt-3">
                  {booking.barber_avatar ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={booking.barber_avatar} alt="" className="h-11 w-11 shrink-0 rounded-full object-cover ring-1 ring-s-ink/[0.06]" />
                  ) : (
                    <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-s-ink/[0.06] font-heading text-sm font-semibold text-s-ink-2">
                      {booking.barber_name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-heading text-[15px] font-semibold text-s-ink">{booking.barber_name}</div>
                    <div className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[13px] text-s-ink-2">
                      {booking.barber_role && <span className="truncate">{booking.barber_role}</span>}
                      {booking.barber_rating != null && booking.barber_rating > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={12} fill="#FFC32B" stroke="none" aria-hidden />
                          <span className="font-semibold tabular-nums text-s-ink">{booking.barber_rating.toFixed(1)}</span>
                          {booking.barber_review_count != null && (
                            canOpenBarber ? (
                              <button type="button" onClick={openBarber} className="tabular-nums font-semibold text-s-accent transition-opacity active:opacity-60">({booking.barber_review_count})</button>
                            ) : (
                              <span className="tabular-nums">({booking.barber_review_count})</span>
                            )
                          )}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Service */}
              <div className="mt-3 flex items-center gap-3 border-t border-s-ink/[0.06] pt-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <Scissors size={20} className="text-s-ink-2" />
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="font-heading text-[15px] font-semibold text-s-ink">{booking.service_name}</span>
                    {booking.service_description && (
                      <button type="button" onClick={() => setServiceInfoOpen((v) => !v)} aria-label={booking.service_name} className="grid h-5 w-5 shrink-0 place-items-center rounded-full text-s-ink-3 transition active:scale-90">
                        <Info size={14} />
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
              <div className="mt-3 flex items-center gap-3 border-t border-s-ink/[0.06] pt-3">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center">
                  <Clock size={20} className="text-s-ink-2" />
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
                <div className="flex items-baseline justify-between gap-3 text-[13px]">
                  <span className="text-s-ink-2">{l.vat}</span>
                  <span className="shrink-0 tabular-nums text-s-ink-2">{vatStr}</span>
                </div>
              </div>
              <div className="mt-2.5 flex items-baseline justify-between gap-3 border-t border-s-ink/[0.08] pt-2.5">
                <span className="self-center font-heading text-[15px] font-semibold text-s-ink">{l.total}</span>
                <span className="font-body text-[22px] font-semibold tabular-nums text-s-accent">{amountStr}</span>
              </div>
            </div>

            {/* Payment — real Stripe Elements (manual-capture hold). Demo mode skips to the CTA below. */}
            {clientSecret && (
              <div className="mt-3 rounded-2xl bg-white p-4 shadow-[0_1px_2px_rgba(20,18,16,.04),0_6px_18px_rgba(20,18,16,.05)]">
                <WalkInPaymentForm
                  clientSecret={clientSecret}
                  amount={booking.amount}
                  locale={locale}
                  onPaid={onPaid}
                  payLabel="bezahlen"
                  secureLabel={l.secure}
                />
              </div>
            )}
            {token && !clientSecret && !booking.ticket_number && (
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
                className="flex h-[54px] w-full items-center justify-center gap-2 rounded-btn bg-s-ink font-heading text-[15px] font-semibold text-white shadow-elevation-2 transition-[transform,filter] hover:brightness-[1.06] active:scale-[0.98] disabled:opacity-50"
              >
                {paying && <Spinner size="sm" invert />}
                {payCta}
              </button>
              <div className="mt-3 flex items-center justify-center gap-1.5 text-[12px] font-medium text-s-ink-2">
                <Lock size={12} />
                {l.secure}
              </div>
            </div>
          </div>
          )}
        </motion.div>
      ) : null}
    </div>
  );
}
