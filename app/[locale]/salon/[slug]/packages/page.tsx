"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useLocale } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Package, Gift, ArrowLeft, X, AlertCircle } from "lucide-react";
import { formatCurrency } from "@/lib/format-currency";
import Spinner from "@/components/ui/Spinner";
import Link from "next/link";
import { loadStripe } from "@stripe/stripe-js";
import { Elements, PaymentElement, useStripe, useElements } from "@stripe/react-stripe-js";

interface PackageData {
  id: string;
  name: string;
  total_sessions: number;
  bonus_sessions: number;
  price: number;
  services: { name_de: string; name_en: string; category: string } | null;
}

const STRIPE_KEY = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

// ─── Stripe payment form ───────────────────────────────────────────────────
function PackagePaymentForm({
  onSuccess,
  onError,
}: {
  onSuccess: () => void;
  onError: (msg: string) => void;
}) {
  const stripe = useStripe();
  const elements = useElements();
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;
    setSubmitting(true);
    const { error } = await stripe.confirmPayment({
      elements,
      confirmParams: { return_url: window.location.href },
      redirect: "if_required",
    });
    if (error) {
      onError(error.message ?? "Zahlung fehlgeschlagen");
      setSubmitting(false);
    } else {
      onSuccess();
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />
      <button
        type="submit"
        disabled={submitting || !stripe}
        className="w-full py-3 rounded-btn bg-s-coral text-white text-sm font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] disabled:opacity-50 flex items-center justify-center gap-2"
      >
        {submitting && <Spinner size="sm" invert />}
        Jetzt bezahlen
      </button>
    </form>
  );
}

// ─── Purchase modal ─────────────────────────────────────────────────────────
function PurchaseModal({
  pkg,
  locale,
  onClose,
}: {
  pkg: PackageData;
  locale: string;
  onClose: () => void;
}) {
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [loadingIntent, setLoadingIntent] = useState(true);
  const [intentError, setIntentError] = useState<string | null>(null);
  const [payError, setPayError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    fetch("/api/packages/purchase", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ package_id: pkg.id }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.clientSecret) {
          setClientSecret(d.clientSecret);
        } else {
          setIntentError(d.error ?? "Fehler beim Laden der Zahlung");
        }
      })
      .catch(() => setIntentError("Verbindungsfehler. Bitte erneut versuchen."))
      .finally(() => setLoadingIntent(false));
  }, [pkg.id]);

  const name = locale === "en" ? pkg.services?.name_en : pkg.services?.name_de;
  const totalSessions = pkg.total_sessions + (pkg.bonus_sessions ?? 0);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40" onClick={onClose} />
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 24 }}
        transition={{ duration: 0.2 }}
        className="relative w-full max-w-md bg-white dark:bg-s-dm-surface rounded-card-lg p-6 shadow-v5-float"
      >
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-s-ink/30 hover:text-s-ink dark:text-s-dm-text/30 dark:hover:text-s-dm-text transition-colors"
          aria-label="Schliessen"
        >
          <X size={18} />
        </button>

        <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-1">{pkg.name}</h2>
        {name && <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-4">{name}</p>}

        <div className="flex items-center justify-between mb-6 p-3 bg-s-ink/[0.03] dark:bg-white/[0.04] rounded-input">
          <span className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
            {totalSessions} {locale === "en" ? "sessions" : "Sitzungen"}
            {pkg.bonus_sessions > 0 && (
              <span className="text-s-coral ml-1">
                (+{pkg.bonus_sessions} {locale === "en" ? "bonus" : "Bonus"})
              </span>
            )}
          </span>
          <span className="data-text font-bold text-s-coral">{formatCurrency(pkg.price, locale)}</span>
        </div>

        {success ? (
          <div className="text-center py-4 space-y-2">
            <div className="w-12 h-12 rounded-full mx-auto flex items-center justify-center bg-green-50">
              <Package size={22} className="text-green-500" />
            </div>
            <p className="font-heading font-bold text-s-ink dark:text-s-dm-text">
              {locale === "en" ? "Purchase successful!" : "Kauf erfolgreich!"}
            </p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
              {locale === "en"
                ? "Your package is now available in your profile."
                : "Dein Paket ist jetzt in deinem Profil verfügbar."}
            </p>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2.5 rounded-btn border border-s-ink/10 text-sm text-s-ink/60 hover:border-s-coral hover:text-s-coral transition-colors"
            >
              {locale === "en" ? "Close" : "Schliessen"}
            </button>
          </div>
        ) : loadingIntent ? (
          <div className="flex justify-center py-8"><Spinner size="lg" /></div>
        ) : intentError ? (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-input text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>{intentError}</span>
          </div>
        ) : clientSecret && stripePromise ? (
          <Elements stripe={stripePromise} options={{ clientSecret, appearance: { theme: "stripe", variables: { colorPrimary: "#E8624A" } } }}>
            {payError && (
              <div className="flex items-start gap-2 p-3 mb-4 bg-red-50 dark:bg-red-950/30 rounded-input text-red-600 dark:text-red-400 text-sm">
                <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
                <span>{payError}</span>
              </div>
            )}
            <PackagePaymentForm
              onSuccess={() => setSuccess(true)}
              onError={(msg) => setPayError(msg)}
            />
          </Elements>
        ) : (
          <div className="flex items-start gap-2 p-3 bg-red-50 dark:bg-red-950/30 rounded-input text-red-600 dark:text-red-400 text-sm">
            <AlertCircle size={16} className="mt-0.5 flex-shrink-0" />
            <span>
              {locale === "en"
                ? "Payment is currently unavailable. Please contact hallo@solen.ch."
                : "Zahlung ist momentan nicht verfügbar. Bitte kontaktiere uns unter hallo@solen.ch."}
            </span>
          </div>
        )}
      </motion.div>
    </div>
  );
}

// ─── Main page ───────────────────────────────────────────────────────────────
export default function SalonPackagesPage() {
  const { slug } = useParams<{ slug: string }>();
  const locale = useLocale();
  const [packages, setPackages] = useState<PackageData[]>([]);
  const [salonName, setSalonName] = useState("");
  const [loading, setLoading] = useState(true);
  const [purchasing, setPurchasing] = useState<PackageData | null>(null);

  useEffect(() => {
    fetch(`/api/salons?slug=${slug}`)
      .then((r) => r.ok ? r.json() : null)
      .then((d) => {
        if (!d) return null;
        const salon = d.data ?? d;
        if (salon?.id) {
          setSalonName(salon.name ?? "");
          return fetch(`/api/packages?salon_id=${salon.id}`);
        }
        return null;
      })
      .then((r) => (r?.ok ? r.json() : null))
      .then((d) => {
        if (d?.items) setPackages(d.items);
      })
      .catch((err) => console.error("[Packages] failed to load packages:", err))
      .finally(() => setLoading(false));
  }, [slug]);

  const serviceName = useCallback(
    (pkg: PackageData) => (locale === "en" ? pkg.services?.name_en : pkg.services?.name_de),
    [locale]
  );

  const labels = {
    de: { title: "Pakete", sessions: "Sitzungen", bonus: "Bonus", perSession: "Pro Sitzung", buy: "Paket kaufen", empty: "Keine Pakete verfügbar", back: "Zurück zum Salon" },
    en: { title: "Packages", sessions: "sessions", bonus: "bonus", perSession: "Per session", buy: "Buy Package", empty: "No packages available", back: "Back to salon" },
  };
  const l = labels[locale as "de" | "en"] ?? labels.de;

  return (
    <div className="min-h-screen bg-s-bg-base dark:bg-s-dm-bg">
      <div className="max-w-2xl mx-auto px-4 py-8">
        <Link href={`/${locale}/salon/${slug}`} className="text-sm text-s-coral flex items-center gap-1 mb-6">
          <ArrowLeft size={14} /> {l.back}
        </Link>

        <h1 className="font-heading font-bold text-2xl text-s-ink dark:text-s-dm-text mb-1">{l.title}</h1>
        {salonName && <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50 mb-6">{salonName}</p>}

        {loading ? (
          <div className="flex justify-center py-12"><Spinner size="lg" /></div>
        ) : packages.length === 0 ? (
          <div className="text-center py-12">
            <Package size={32} className="mx-auto mb-3 text-s-ink/20 dark:text-s-dm-text/20" />
            <p className="text-sm text-s-ink/50 dark:text-s-dm-text/50">{l.empty}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {packages.map((pkg, i) => {
              const totalSessions = pkg.total_sessions + (pkg.bonus_sessions ?? 0);
              const perSession = Math.round(pkg.price / totalSessions);

              return (
                <motion.div
                  key={pkg.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.05 }}
                  className="bg-white dark:bg-s-dm-surface rounded-[16px] shadow-warm-md p-5"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-heading font-bold text-s-ink dark:text-s-dm-text">{pkg.name}</h3>
                      <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40">{serviceName(pkg)}</p>
                    </div>
                    <span className="data-text text-xl font-bold text-s-coral">
                      {formatCurrency(pkg.price, locale)}
                    </span>
                  </div>

                  <div className="flex items-center gap-4 text-sm mb-4">
                    <span className="text-s-ink/60 dark:text-s-dm-text/60">
                      {pkg.total_sessions} {l.sessions}
                    </span>
                    {pkg.bonus_sessions > 0 && (
                      <span className="text-s-coral flex items-center gap-1">
                        <Gift size={12} /> +{pkg.bonus_sessions} {l.bonus}
                      </span>
                    )}
                    <span className="text-s-ink/40 dark:text-s-dm-text/40 ml-auto">
                      {l.perSession}: {formatCurrency(perSession, locale)}
                    </span>
                  </div>

                  <button
                    onClick={() => setPurchasing(pkg)}
                    className="w-full py-2.5 rounded-btn bg-s-coral text-white text-[11px] font-heading font-bold uppercase tracking-[.06em] hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter]"
                  >
                    {l.buy}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      <AnimatePresence>
        {purchasing && (
          <PurchaseModal
            pkg={purchasing}
            locale={locale}
            onClose={() => setPurchasing(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
