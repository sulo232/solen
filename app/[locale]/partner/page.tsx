"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Store, TrendingUp, Calendar, ArrowRight } from "lucide-react";

const BENEFITS = [
  {
    icon: Store,
    title: "Mehr Sichtbarkeit",
    description: "Erreiche neue Kunden in deiner Umgebung. Dein Salon erscheint auf solen.ch — Basels grösster Beauty-Plattform.",
  },
  {
    icon: Calendar,
    title: "Online-Buchungen",
    description: "Kunden buchen rund um die Uhr. Du verwaltest alles in einem übersichtlichen Dashboard — weniger Telefonanrufe, mehr Termine.",
  },
  {
    icon: TrendingUp,
    title: "Wachstum & Insights",
    description: "Sieh, welche Services am beliebtesten sind, wann deine Spitzenzeiten sind, und steigere deinen Umsatz mit Last-Minute-Angeboten.",
  },
];

export default function PartnerPage() {
  const locale = useLocale();

  return (
    <div className="min-h-screen bg-white dark:bg-dm-bg">
      {/* Hero */}
      <div className="bg-gradient-to-b from-s-coral/5 to-white dark:from-s-coral/10 dark:to-dm-bg pt-28 pb-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h1 className="font-heading font-bold text-3xl sm:text-4xl text-dark dark:text-dm-text mb-4">
            Werde Solen-Partner
          </h1>
          <p className="text-lg text-dark/60 dark:text-dm-text/60 max-w-2xl mx-auto mb-8">
            Registriere deinen Salon kostenlos und erreiche tausende neue Kunden in Basel und Umgebung.
          </p>
          <Link
            href={`/${locale}/onboarding`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-card bg-s-coral text-white font-body font-semibold text-base shadow-warm-md hover:bg-s-coral/90 transition-colors"
          >
            Kostenlos registrieren
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>

      {/* Benefits */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {BENEFITS.map((b, i) => (
            <div key={i} className="text-center p-6">
              <div className="w-14 h-14 rounded-2xl bg-s-coral/10 flex items-center justify-center mx-auto mb-4">
                <b.icon className="w-7 h-7 text-s-coral" />
              </div>
              <h3 className="font-heading font-semibold text-lg text-dark dark:text-dm-text mb-2">{b.title}</h3>
              <p className="text-sm text-dark/60 dark:text-dm-text/60 leading-relaxed">{b.description}</p>
            </div>
          ))}
        </div>
      </div>

      {/* CTA */}
      <div className="bg-gray-50 dark:bg-dm-surface py-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading font-bold text-2xl text-dark dark:text-dm-text mb-3">
            Bereit loszulegen?
          </h2>
          <p className="text-dark/50 dark:text-dm-text/50 mb-6">
            Die Registrierung ist kostenlos. Erstelle dein Profil in wenigen Minuten.
          </p>
          <Link
            href={`/${locale}/onboarding`}
            className="inline-flex items-center gap-2 px-8 py-4 rounded-card bg-s-coral text-white font-body font-semibold text-base shadow-warm-md hover:bg-s-coral/90 transition-colors"
          >
            Jetzt Salon registrieren
            <ArrowRight className="w-5 h-5" />
          </Link>
        </div>
      </div>
    </div>
  );
}
