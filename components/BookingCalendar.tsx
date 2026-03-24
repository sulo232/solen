"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { RotateCcw, Info, ClipboardList, PartyPopper, CreditCard, ChevronDown, CalendarX2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import SolenDatePicker from "@/components/ui/date-picker";
import { today as ariaToday, getLocalTimeZone, CalendarDate } from "@internationalized/date";
import type { DateValue } from "react-aria-components";
import { formatCurrency } from "@/lib/format-currency";
import type { AvailabilitySlot, RecurringFrequency, StaffMember } from "@/lib/types";
import StaffPicker from "@/components/booking/StaffPicker";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";
import { loadStripe } from "@stripe/stripe-js";
import GuestBookingForm, { type GuestInfo } from "@/components/booking/GuestBookingForm";
import PackageRedeemBanner from "@/components/booking/PackageRedeemBanner";
import NailBookingSteps, { type NailOptions } from "@/components/nail/NailBookingSteps";

// ─────────────────────────────────────────
// Stripe setup
// ─────────────────────────────────────────

const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "");

// ─────────────────────────────────────────
// Types
// ─────────────────────────────────────────

interface SlotWithRelations extends AvailabilitySlot {
  services?: { id: string; name_de: string; name_en: string; duration_minutes: number; price: number } | null;
  staff_members?: Pick<StaffMember, "id" | "name" | "avatar_url"> | null;
}

export interface BookingCalendarProps {
  salonId: string;
  serviceId?: string;
  staffMemberId?: string;
  slotId?: string;
}

interface ActivePackage {
  id: string;
  package_name: string;
  sessions_used: number;
  total_sessions: number;
  service_id: string;
}

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

function addDays(d: Date, n: number) {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function getTimeGroup(iso: string): "morning" | "afternoon" | "evening" {
  const h = new Date(iso).getHours();
  if (h < 12) return "morning";
  if (h < 17) return "afternoon";
  return "evening";
}

const GROUP_LABELS = { morning: "Morgens", afternoon: "Nachmittags", evening: "Abends" };

const FREQ_OPTIONS: { value: RecurringFrequency; label: string }[] = [
  { value: "weekly", label: "Wöchentlich" },
  { value: "biweekly", label: "Zweiwöchentlich" },
  { value: "monthly", label: "Monatlich" },
];

const ACQUISITION_SOURCES = [
  { value: "", label_de: "Wie hast du von uns erfahren?", label_en: "How did you find us?" },
  { value: "google", label_de: "Google Suche", label_en: "Google Search" },
  { value: "instagram", label_de: "Instagram", label_en: "Instagram" },
  { value: "friend", label_de: "Empfehlung", label_en: "Friend/Referral" },
  { value: "solen", label_de: "Solen.ch", label_en: "Solen.ch" },
  { value: "walk_by", label_de: "Vorbeigelaufen", label_en: "Walked by" },
  { value: "other", label_de: "Andere", label_en: "Other" },
];

// ─────────────────────────────────────────
// Stripe Payment Form (inner component)
// ─────────────────────────────────────────

function StripePaymentForm({ onSuccess, onError }: { onSuccess: () => void; onError: (msg: string) => void }) {
  const stripe = useStripe();
  const elements = useElements();
  const [processing, setProcessing] = useState(false);

  const handleSubmit = async () => {
    if (!stripe || !elements) return;
    setProcessing(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (error) {
      onError(error.message ?? "Zahlung fehlgeschlagen");
    } else {
      onSuccess();
    }
    setProcessing(false);
  };

  return (
    <div className="space-y-3">
      <PaymentElement options={{ layout: "tabs" }} />
      <button
        onClick={handleSubmit}
        disabled={processing || !stripe}
        className="w-full flex items-center justify-center gap-2 py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white font-semibold text-sm hover:bg-s-coral/90 transition-all disabled:opacity-50"
      >
        {processing ? <Spinner size="sm" invert /> : <CreditCard size={16} />}
        {processing ? "Wird verarbeitet…" : "Jetzt bezahlen"}
      </button>
    </div>
  );
}

// ─────────────────────────────────────────
// Component
// ─────────────────────────────────────────

export default function BookingCalendar({ salonId, serviceId, staffMemberId, slotId }: BookingCalendarProps) {
  const locale = useLocale();
  const router = useRouter();

  const todayDate = new Date();
  todayDate.setHours(0, 0, 0, 0);

  const [selectedDate, setSelectedDate] = useState<Date>(todayDate);

  // Convert between JS Date and react-aria DateValue
  const toCalendarDate = (d: Date) => new CalendarDate(d.getFullYear(), d.getMonth() + 1, d.getDate());
  const fromCalendarDate = (d: DateValue) => new Date(d.year, d.month - 1, d.day);
  const ariaMinDate = ariaToday(getLocalTimeZone());
  const ariaMaxDate = toCalendarDate(addDays(todayDate, 30));
  const [slots, setSlots] = useState<SlotWithRelations[]>([]);
  const [selectedSlot, setSelectedSlot] = useState<SlotWithRelations | null>(null);
  const [selectedStaff, setSelectedStaff] = useState<string>(staffMemberId ?? "any");
  const [staffList, setStaffList] = useState<StaffMember[]>([]);
  const [isFirstVisit, setIsFirstVisit] = useState(false);
  const [recurring, setRecurring] = useState(false);
  const [recurringFreq, setRecurringFreq] = useState<RecurringFrequency>("biweekly");
  const [loadingSlots, setLoadingSlots] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fullyBookedDates, setFullyBookedDates] = useState<Set<string>>(new Set());
  const [showWaitlist, setShowWaitlist] = useState(false);
  const [waitlistDate, setWaitlistDate] = useState<string | null>(null);
  const [serviceCategory, setServiceCategory] = useState<string | null>(null);
  const [nailOptions, setNailOptions] = useState<NailOptions | null>(null);
  // Barbershop-specific state
  const [lastBarberCut, setLastBarberCut] = useState<{
    fade_type: string | null; top_style: string | null; side_length: string | null; beard_style: string | null;
    staff_members?: { first_name: string; last_name: string } | null;
  } | null>(null);
  const [barberChairs, setBarberChairs] = useState<{ chair_count: number; buffer_minutes: number } | null>(null);
  const [waitlistSubmitting, setWaitlistSubmitting] = useState(false);
  const [waitlistDone, setWaitlistDone] = useState(false);
  const channelRef = useRef<ReturnType<ReturnType<typeof createBrowserSupabaseClient>["channel"]> | null>(null);

  // Stripe checkout state
  const [checkoutStep, setCheckoutStep] = useState<"select" | "payment" | "guest">("select");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);
  const [userId, setUserId] = useState<string | null>(null);
  const [guestInfo, setGuestInfo] = useState<GuestInfo | null>(null);
  const [acquisitionSource, setAcquisitionSource] = useState("");

  // Salon cancellation policy
  const [cancelWindowHours, setCancelWindowHours] = useState(24);
  const [cancelFeePercent, setCancelFeePercent] = useState(30);

  // Active package
  const [activePackage, setActivePackage] = useState<ActivePackage | null>(null);

  // Check auth state
  useEffect(() => {
    createBrowserSupabaseClient().auth.getSession().then(({ data: { session } }) => {
      setIsAuthenticated(!!session?.user);
      setUserId(session?.user?.id ?? null);
    });
  }, []);

  // Fetch salon cancellation policy
  useEffect(() => {
    fetch(`/api/salons/${salonId}`)
      .then(r => r.json())
      .then(d => {
        if (d.cancellation_window_hours) setCancelWindowHours(d.cancellation_window_hours);
        if (d.cancellation_fee_percent) setCancelFeePercent(d.cancellation_fee_percent);
      })
      .catch(() => {});
  }, [salonId]);

  // Fetch active packages for user
  useEffect(() => {
    if (!isAuthenticated) return;
    fetch(`/api/packages?salon_id=${salonId}&active=true`)
      .then(r => r.json())
      .then(d => {
        const items = d.items ?? [];
        // Find a package matching the current service
        const matching = items.find((p: any) =>
          p.service_id === serviceId && p.sessions_used < p.total_sessions
        );
        if (matching) setActivePackage(matching);
      })
      .catch(() => {});
  }, [salonId, serviceId, isAuthenticated]);

  // Fetch fully booked dates for the 30-day window
  useEffect(() => {
    const from = isoDate(todayDate);
    const to = isoDate(addDays(todayDate, 30));
    fetch(`/api/availability/${salonId}?date_from=${from}&date_to=${to}`)
      .then((r) => r.json())
      .then((d) => {
        const booked = new Set<string>(d.fully_booked_dates ?? []);
        setFullyBookedDates(booked);
        if (booked.has(isoDate(todayDate))) {
          for (let i = 1; i <= 30; i++) {
            const candidate = addDays(todayDate, i);
            if (!booked.has(isoDate(candidate))) {
              setSelectedDate(candidate);
              break;
            }
          }
        }
      })
      .catch(() => {});
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [salonId]);

  const isDateFullyBooked = useCallback((date: DateValue) => {
    const iso = `${date.year}-${String(date.month).padStart(2, "0")}-${String(date.day).padStart(2, "0")}`;
    return fullyBookedDates.has(iso);
  }, [fullyBookedDates]);

  // Waitlist submit
  const handleWaitlistSubmit = async () => {
    if (!waitlistDate) return;
    setWaitlistSubmitting(true);
    try {
      const res = await fetch("/api/bookings/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ salon_id: salonId, service_id: serviceId, preferred_date: waitlistDate }),
      });
      if (res.ok) setWaitlistDone(true);
    } catch {
      // silent
    } finally {
      setWaitlistSubmitting(false);
    }
  };

  // Fetch staff list once
  useEffect(() => {
    fetch(`/api/salons/${salonId}`)
      .then((r) => r.json())
      .then((d) => { setStaffList(d.staff ?? []); })
      .catch(() => {});
  }, [salonId]);

  // Fetch profile for first-visit default
  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.ok ? r.json() : null)
      .then((d) => { if (d?.is_first_visit_default != null) setIsFirstVisit(d.is_first_visit_default); })
      .catch(() => {});
  }, []);

  // Fetch service category for nail detection
  useEffect(() => {
    if (!serviceId || !salonId) return;
    fetch(`/api/services?salon_id=${salonId}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const svc = (d?.services ?? []).find((s: { id: string; category?: string }) => s.id === serviceId);
        if (svc?.category) setServiceCategory(svc.category);
      })
      .catch(() => {});
  }, [serviceId, salonId]);

  // Fetch barbershop-specific data when service is barbershop + user is authenticated
  useEffect(() => {
    if (serviceCategory !== "barbershop" || !userId) return;
    fetch(`/api/clients/${userId}/repeat-last-cut`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.lastCut) setLastBarberCut(d.lastCut); })
      .catch(() => {});
    fetch(`/api/salon/chairs?salon_id=${salonId}`)
      .then(r => r.ok ? r.json() : null)
      .then(d => { if (d?.chair_count) setBarberChairs({ chair_count: d.chair_count, buffer_minutes: d.buffer_minutes ?? 5 }); })
      .catch(() => {});
  }, [serviceCategory, userId, salonId]);

  // Fetch slots
  const fetchSlots = useCallback(async (date: Date) => {
    setLoadingSlots(true);
    setSelectedSlot(null);
    setCheckoutStep("select");
    setClientSecret(null);
    try {
      const params = new URLSearchParams({ salon_id: salonId, date: isoDate(date) });
      if (serviceId) params.set("service_id", serviceId);
      if (selectedStaff !== "any") params.set("staff_member_id", selectedStaff);
      const data = await fetch(`/api/slots?${params}`).then((r) => r.json());
      const items: SlotWithRelations[] = data.items ?? [];
      setSlots(items);
      if (slotId) {
        const pre = items.find((s) => s.id === slotId);
        if (pre) setSelectedSlot(pre);
      }
    } finally {
      setLoadingSlots(false);
    }
  }, [salonId, serviceId, selectedStaff, slotId]);

  useEffect(() => { fetchSlots(selectedDate); }, [selectedDate, fetchSlots]);

  // Realtime slot updates
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`booking-cal-${salonId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "availability_slots", filter: `salon_id=eq.${salonId}` },
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (payload: any) => {
          const updated = payload.new as { id: string; status: string };
          setSlots((prev) =>
            prev.map((s) => s.id === updated.id ? { ...s, status: updated.status as AvailabilitySlot["status"] } : s)
          );
          if (selectedSlot?.id === updated.id && updated.status === "booked") {
            setSelectedSlot(null);
            setError("Dieser Slot wurde soeben gebucht. Bitte wähle einen anderen.");
          }
        }
      )
      .subscribe();
    channelRef.current = channel;
    return () => { supabase.removeChannel(channel); };
  }, [salonId, selectedSlot?.id]);

  // Escape key to close inline waitlist modal
  useEffect(() => {
    if (!showWaitlist) return;
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") setShowWaitlist(false); };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [showWaitlist]);

  const availableSlots = slots.filter((s) => s.status === "available");
  const grouped = {
    morning: availableSlots.filter((s) => getTimeGroup(s.starts_at) === "morning"),
    afternoon: availableSlots.filter((s) => getTimeGroup(s.starts_at) === "afternoon"),
    evening: availableSlots.filter((s) => getTimeGroup(s.starts_at) === "evening"),
  };

  // Determine if booking is >7 days away (use SetupIntent instead)
  const isMoreThan7Days = selectedSlot
    ? (new Date(selectedSlot.starts_at).getTime() - Date.now()) > 7 * 24 * 60 * 60 * 1000
    : false;

  // Create PaymentIntent or SetupIntent and proceed to payment
  const handleProceedToPayment = async () => {
    if (!selectedSlot) return;

    // Check if guest or authenticated
    if (!isAuthenticated && !guestInfo) {
      setCheckoutStep("guest");
      return;
    }

    setConfirming(true);
    setError(null);
    try {
      if (isMoreThan7Days) {
        // Save card for later (SetupIntent)
        const res = await fetch("/api/stripe/save-card", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ salon_id: salonId }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
        const data = await res.json();
        setClientSecret(data.client_secret ?? data.clientSecret);
      } else {
        // Immediate payment (PaymentIntent)
        const res = await fetch("/api/stripe/create-payment-intent", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            salon_id: salonId,
            slot_id: selectedSlot.id,
            service_id: serviceId ?? selectedSlot.service_id,
            estimated_price: selectedSlot.price_override ?? selectedSlot.services?.price ?? 0,
            deposit_amount: selectedSlot.price_override ?? selectedSlot.services?.price ?? 0,
            service_name: locale === "en" ? selectedSlot.services?.name_en : selectedSlot.services?.name_de,
            ...(guestInfo ? { guest_name: guestInfo.name, guest_phone: guestInfo.phone, guest_email: guestInfo.email } : {}),
          }),
        });
        if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
        const data = await res.json();
        setClientSecret(data.client_secret ?? data.clientSecret);
      }
      setCheckoutStep("payment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zahlung konnte nicht initialisiert werden");
    } finally {
      setConfirming(false);
    }
  };

  // After guest form → proceed to payment
  const handleGuestSubmit = (info: GuestInfo) => {
    setGuestInfo(info);
    setCheckoutStep("select"); // Reset, then auto-proceed
    // Proceed to payment with guest info
    setTimeout(() => {
      handleProceedToPaymentWithGuest(info);
    }, 0);
  };

  const handleProceedToPaymentWithGuest = async (info: GuestInfo) => {
    if (!selectedSlot) return;
    setConfirming(true);
    setError(null);
    try {
      const res = await fetch("/api/stripe/create-payment-intent", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          salon_id: salonId,
          slot_id: selectedSlot.id,
          service_id: serviceId ?? selectedSlot.service_id,
          estimated_price: selectedSlot.price_override ?? selectedSlot.services?.price ?? 0,
          deposit_amount: selectedSlot.price_override ?? selectedSlot.services?.price ?? 0,
          service_name: locale === "en" ? selectedSlot.services?.name_en : selectedSlot.services?.name_de,
          guest_name: info.name,
          guest_phone: info.phone,
          guest_email: info.email,
        }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Fehler");
      const data = await res.json();
      setClientSecret(data.client_secret ?? data.clientSecret);
      setCheckoutStep("payment");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Zahlung konnte nicht initialisiert werden");
    } finally {
      setConfirming(false);
    }
  };

  // After successful payment → create booking
  const handlePaymentSuccess = async () => {
    if (!selectedSlot) return;
    setConfirming(true);
    try {
      const endpoint = recurring ? "/api/bookings/recurring" : "/api/bookings";
      const body: Record<string, unknown> = {
        slot_id: selectedSlot.id,
        service_id: serviceId ?? selectedSlot.service_id,
        staff_member_id: selectedStaff !== "any" ? selectedStaff : selectedSlot.staff_member_id,
        is_first_visit: isFirstVisit,
        acquisition_source: acquisitionSource || undefined,
        ...(guestInfo ? { guest_name: guestInfo.name, guest_phone: guestInfo.phone, guest_email: guestInfo.email } : {}),
      };
      if (recurring) body.frequency = recurringFreq;
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).message ?? "Fehler");
      setConfirmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Buchung fehlgeschlagen");
    } finally {
      setConfirming(false);
    }
  };

  // Legacy confirm (for package redeem — no payment needed)
  const handleConfirmWithoutPayment = async () => {
    if (!selectedSlot) return;
    setConfirming(true);
    setError(null);
    try {
      const endpoint = recurring ? "/api/bookings/recurring" : "/api/bookings";
      const body: Record<string, unknown> = {
        slot_id: selectedSlot.id,
        service_id: serviceId ?? selectedSlot.service_id,
        staff_member_id: selectedStaff !== "any" ? selectedStaff : selectedSlot.staff_member_id,
        is_first_visit: isFirstVisit,
        acquisition_source: acquisitionSource || undefined,
      };
      if (recurring) body.frequency = recurringFreq;
      const res = await fetch(endpoint, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!res.ok) throw new Error((await res.json()).message ?? "Fehler");
      setConfirmed(true);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Buchung fehlgeschlagen");
    } finally {
      setConfirming(false);
    }
  };

  if (confirmed) {
    return (
      <div className="rounded-card border border-s-coral/20 bg-s-coral/5 p-8 flex flex-col items-center gap-4 text-center">
        <PartyPopper size={48} className="text-s-coral" />
        <p className="font-heading font-bold text-xl text-s-ink dark:text-s-dm-text">Buchung bestätigt!</p>
        <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60">Du erhältst eine Bestätigungs-E-Mail.</p>
        <a href={`/${locale}/profile`} className="mt-2 px-6 py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-all">
          Meine Buchungen
        </a>
      </div>
    );
  }

  return (
    <div className="rounded-card border border-s-ink/5 bg-white dark:bg-s-dm-raised overflow-hidden">
      {/* Staff picker */}
      <StaffPicker
        staffList={staffList}
        selectedStaff={selectedStaff}
        onSelect={setSelectedStaff}
      />

      {/* Barbershop: last cut repeat banner */}
      {serviceCategory === "barbershop" && lastBarberCut && (
        <div className="mx-4 mt-4 rounded-card bg-s-amber/5 border border-s-amber/20 px-4 py-3 flex items-start gap-3">
          <span className="text-lg">✂️</span>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-s-ink dark:text-s-dm-text">Letzter Schnitt wiederholen</p>
            <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 mt-0.5 truncate">
              {[
                lastBarberCut.fade_type && lastBarberCut.fade_type !== "none" && `${lastBarberCut.fade_type} fade`,
                lastBarberCut.top_style && lastBarberCut.top_style !== "other" && lastBarberCut.top_style,
                lastBarberCut.side_length && `#${lastBarberCut.side_length}`,
                lastBarberCut.beard_style && lastBarberCut.beard_style !== "none" && lastBarberCut.beard_style,
              ].filter(Boolean).join(" · ") || "Gleicher Schnitt"}
              {lastBarberCut.staff_members && ` bei ${lastBarberCut.staff_members.first_name}`}
            </p>
          </div>
        </div>
      )}

      {/* Barbershop: chair availability indicator */}
      {serviceCategory === "barbershop" && barberChairs && (
        <div className="mx-4 mt-2 flex items-center gap-1.5 text-xs text-s-ink/50 dark:text-s-dm-text/50">
          <span className="w-2 h-2 rounded-full bg-s-sage inline-block" />
          {barberChairs.chair_count} Stühle · {barberChairs.buffer_minutes} Min Puffer
        </div>
      )}

      {/* Nail booking steps — only for nail services */}
      {serviceCategory === "nails" && (
        <div className="px-4">
          <NailBookingSteps
            serviceCategory={serviceCategory}
            customerId={userId}
            staffId={selectedStaff !== "any" ? selectedStaff : null}
            salonId={salonId}
            onNailOptionsChange={setNailOptions}
          />
        </div>
      )}

      {/* Date picker */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0 }}
        className="px-4 py-4"
      >
        <SolenDatePicker
          label="Datum wählen"
          value={toCalendarDate(selectedDate)}
          onChange={(d) => setSelectedDate(fromCalendarDate(d))}
          minValue={ariaMinDate}
          maxValue={ariaMaxDate}
          isDateUnavailable={isDateFullyBooked}
        />
      </motion.div>

      {/* Time slots */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.1 }}
        className="px-4 pb-4 min-h-[140px]"
      >
        {loadingSlots ? (
          <div className="flex flex-wrap gap-2 py-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="w-16 h-8 rounded-btn" />
            ))}
          </div>
        ) : availableSlots.length === 0 ? (
          <EmptyState
            icon={CalendarX2}
            title="Keine freien Slots an diesem Tag"
            illustration="no-results"
            className="py-6"
            action={
              <button
                onClick={() => { setWaitlistDate(isoDate(selectedDate)); setWaitlistDone(false); setShowWaitlist(true); }}
                className="inline-flex items-center gap-1.5 text-sm text-s-coral hover:text-s-coral/80 transition-colors"
              >
                <ClipboardList className="w-4 h-4" />
                Auf Warteliste setzen
              </button>
            }
          />
        ) : (
          <div className="flex flex-col gap-4">
            {(["morning", "afternoon", "evening"] as const).map((group) => {
              const groupSlots = grouped[group];
              if (!groupSlots.length) return null;
              return (
                <div key={group}>
                  <p className="text-xs font-medium text-s-ink/40 dark:text-s-dm-text/40 uppercase tracking-wide mb-2">{GROUP_LABELS[group]}</p>
                  <div className="flex flex-wrap gap-2">
                    {groupSlots.map((slot) => {
                      const timeStr = new Date(slot.starts_at).toLocaleTimeString(
                        locale === "de" ? "de-CH" : "en-GB",
                        { hour: "2-digit", minute: "2-digit" }
                      );
                      const duration = slot.services?.duration_minutes;
                      const isSelected = selectedSlot?.id === slot.id;
                      const discount = slot.price_override && slot.services?.price
                        ? Math.round((1 - slot.price_override / slot.services.price) * 100)
                        : 0;
                      const offPeakPct = (slot as any).off_peak_discount as number | undefined;
                      return (
                        <motion.button
                          key={slot.id}
                          whileTap={{ scale: 0.95 }}
                          transition={{ type: "spring", stiffness: 300, damping: 20 }}
                          onClick={() => { setSelectedSlot(isSelected ? null : slot); setCheckoutStep("select"); setClientSecret(null); }}
                          className={[
                            "px-3 py-1.5 rounded-btn text-sm data-text font-medium transition-all duration-200",
                            isSelected
                              ? "bg-s-coral text-white shadow-card"
                              : offPeakPct
                                ? "bg-s-sage-subtle text-s-ink hover:bg-s-sage/20 hover:text-s-sage-text dark:bg-s-sage/10 dark:text-s-dm-text dark:hover:bg-s-sage/20"
                                : "bg-s-bg-sunken text-s-ink hover:bg-s-coral/10 hover:text-s-coral dark:bg-s-dm-bg dark:text-s-dm-text dark:hover:bg-s-coral/10",
                          ].join(" ")}
                          aria-label={`Termin um ${timeStr}${duration ? ` · ${duration} Min` : ""}${offPeakPct ? `, ${offPeakPct}% Off-Peak Rabatt` : discount > 0 ? `, ${discount}% Rabatt` : ""}`}
                          aria-pressed={isSelected}
                        >
                          {timeStr}
                          {duration && <span className="ml-1 text-[10px] opacity-60">· {duration} Min</span>}
                          {offPeakPct ? (
                            <span className="ml-1.5 text-[10px] text-s-sage-text dark:text-s-sage">-{offPeakPct}%</span>
                          ) : discount > 0 ? (
                            <span className="ml-1.5 text-[10px] text-s-coral">-{discount}%</span>
                          ) : null}
                        </motion.button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Summary strip — shown after slot selected */}
      <AnimatePresence>
      {selectedSlot && (
        <motion.div
          key="summary-strip"
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: "auto", opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25 }}
          className="border-t border-s-ink/5 backdrop-blur-sm bg-s-bg-surface/80 dark:bg-s-dm-bg/90 overflow-hidden"
        >
          <div className="px-4 py-4 flex flex-col gap-3">
          {/* Package redeem banner */}
          {activePackage && checkoutStep === "select" && (
            <PackageRedeemBanner
              packageId={activePackage.id}
              packageName={activePackage.package_name}
              sessionsUsed={activePackage.sessions_used}
              totalSessions={activePackage.total_sessions}
              slotId={selectedSlot.id}
              serviceId={serviceId ?? selectedSlot.service_id ?? ""}
              onRedeemed={() => { setConfirmed(true); }}
            />
          )}

          {/* First-visit */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isFirstVisit}
              onChange={(e) => setIsFirstVisit(e.target.checked)}
              className="w-4 h-4 rounded accent-s-coral"
            />
            <span className="text-sm text-s-ink/70 dark:text-s-dm-text/70">Erster Besuch in diesem Salon</span>
          </label>

          {/* Recurring */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={recurring}
              onChange={(e) => setRecurring(e.target.checked)}
              className="w-4 h-4 rounded accent-s-coral"
            />
            <span className="text-sm text-s-ink/70 dark:text-s-dm-text/70">
              {serviceCategory === "barbershop" ? "Regelmässig buchen?" : "Serienbuchung"}
            </span>
            <RotateCcw className="w-3.5 h-3.5 text-s-coral" />
          </label>
          {recurring && (
            <select
              value={recurringFreq}
              onChange={(e) => setRecurringFreq(e.target.value as RecurringFrequency)}
              className="text-sm px-3 py-1.5 rounded-btn border border-s-ink/10 bg-white dark:bg-s-dm-raised dark:text-s-dm-text dark:border-white/10 outline-none focus:border-s-coral"
            >
              {FREQ_OPTIONS.map(({ value, label }) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          )}

          {/* Acquisition source */}
          <select
            value={acquisitionSource}
            onChange={e => setAcquisitionSource(e.target.value)}
            className="text-sm px-3 py-1.5 rounded-btn border border-s-ink/10 dark:border-white/10 bg-white dark:bg-s-dm-raised text-s-ink/70 dark:text-s-dm-text/70 outline-none focus:border-s-coral"
          >
            {ACQUISITION_SOURCES.map(src => (
              <option key={src.value} value={src.value}>{locale === "en" ? src.label_en : src.label_de}</option>
            ))}
          </select>

          {/* Booking summary */}
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-sm text-s-ink dark:text-s-dm-text">
                {locale === "de" ? selectedSlot.services?.name_de : selectedSlot.services?.name_en}
              </p>
              <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 mt-0.5">
                {new Date(selectedSlot.starts_at).toLocaleDateString(locale === "de" ? "de-CH" : "en-GB", {
                  weekday: "short", day: "numeric", month: "short",
                })}{" · "}
                {new Date(selectedSlot.starts_at).toLocaleTimeString(locale === "de" ? "de-CH" : "en-GB", {
                  hour: "2-digit", minute: "2-digit",
                })}
                {selectedSlot.services?.duration_minutes && ` · ${selectedSlot.services.duration_minutes} Min`}
              </p>
            </div>
            <div className="text-right">
              {(selectedSlot as any).off_peak_discount && selectedSlot.services?.price != null ? (
                <>
                  <span className="data-text text-xs text-s-ink/40 dark:text-s-dm-text/40 line-through mr-1">
                    {formatCurrency(selectedSlot.services.price, locale)}
                  </span>
                  <span className="data-text font-bold text-lg text-s-sage-text dark:text-s-sage">
                    {formatCurrency((selectedSlot as any).discounted_price, locale)}
                  </span>
                  <span className="block text-[10px] text-s-sage-text dark:text-s-sage">Off-Peak -{(selectedSlot as any).off_peak_discount}%</span>
                </>
              ) : (
                <span className="data-text font-bold text-lg text-s-ink dark:text-s-dm-text">
                  {selectedSlot.price_override != null ? formatCurrency(selectedSlot.price_override, locale) : selectedSlot.services?.price != null ? formatCurrency(selectedSlot.services.price, locale) : "–"}
                </span>
              )}
            </div>
          </div>

          {/* Cancellation policy */}
          <div className="flex items-center gap-1.5 text-xs text-s-coral bg-s-coral/5 rounded-btn px-3 py-2">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Kostenlose Stornierung bis {cancelWindowHours}h vor dem Termin. Danach werden {cancelFeePercent}% einbehalten.
          </div>

          {isMoreThan7Days && (
            <div className="flex items-center gap-1.5 text-xs text-s-ink/40 dark:text-s-dm-text/40">
              <CreditCard className="w-3.5 h-3.5 shrink-0" />
              Termin &gt;7 Tage entfernt — deine Karte wird gespeichert und 5 Tage vorher belastet.
            </div>
          )}

          <div className="flex items-center gap-1.5 text-xs text-s-ink/40 dark:text-s-dm-text/40">
            <Info className="w-3.5 h-3.5 shrink-0" />
            Nach dem Termin kann der Salon den Preis anpassen. Du hast 48h zum Bestätigen.
          </div>

          {error && <p className="text-xs text-s-coral">{error}</p>}

          {/* Guest form / Stripe payment — animated transitions */}
          <AnimatePresence mode="wait">
            {checkoutStep === "guest" && (
              <motion.div key="guest" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <GuestBookingForm onSubmit={handleGuestSubmit} submitting={confirming} />
              </motion.div>
            )}
            {checkoutStep === "payment" && clientSecret && (
              <motion.div key="payment" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.25 }}>
                <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#E8624A" } } }}>
                  <StripePaymentForm
                    onSuccess={handlePaymentSuccess}
                    onError={(msg) => setError(msg)}
                  />
                </Elements>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Main action button (shown when not in payment/guest step) */}
          {checkoutStep === "select" && (
            <button
              onClick={handleProceedToPayment}
              disabled={confirming}
              className="w-full flex items-center justify-center gap-2 py-3 rounded-btn active:scale-[0.98] bg-s-coral text-white font-semibold text-sm hover:bg-s-coral/90 transition-all disabled:opacity-50"
            >
              {confirming && <Spinner size="sm" invert />}
              {confirming ? "Wird vorbereitet…" : isMoreThan7Days ? "Karte speichern & Buchen" : "Zur Zahlung"}
            </button>
          )}
          </div>
        </motion.div>
      )}
      </AnimatePresence>

      {/* Waitlist Modal */}
      {showWaitlist && (
        <div className="fixed inset-0 z-60 flex items-center justify-center bg-s-ink/40 backdrop-blur-sm" onClick={() => setShowWaitlist(false)}>
          <div className="bg-white dark:bg-s-dm-raised rounded-card p-6 mx-4 max-w-sm w-full shadow-glass" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3">
              <ClipboardList className="w-5 h-5 text-s-coral" />
              <h3 className="font-heading font-bold text-s-ink dark:text-s-dm-text">Warteliste</h3>
            </div>
            {waitlistDone ? (
              <div className="text-center py-4">
                <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70">Du wirst benachrichtigt, sobald ein Platz frei wird.</p>
                <button onClick={() => setShowWaitlist(false)} className="mt-3 px-4 py-2 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm hover:bg-s-coral/90 transition-all">
                  Schliessen
                </button>
              </div>
            ) : (
              <>
                <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-4">
                  Am {waitlistDate} sind leider keine Termine frei. Möchtest du benachrichtigt werden, wenn ein Platz frei wird?
                </p>
                <button
                  onClick={handleWaitlistSubmit}
                  disabled={waitlistSubmitting}
                  className="w-full py-2.5 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-all disabled:opacity-50"
                >
                  {waitlistSubmitting ? "Wird eingetragen…" : "Benachrichtige mich"}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
