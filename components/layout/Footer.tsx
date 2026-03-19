"use client";

import Link from "next/link";
import { useLocale } from "next-intl";
import { Instagram } from "lucide-react";
import TrustBadges from "@/components/ui/TrustBadges";

const CATEGORIES = [
  { key: "coiffeur",   label: "Coiffeur"     },
  { key: "barbershop", label: "Barbershop"   },
  { key: "nails",      label: "Nails"        },
  { key: "spa",        label: "Spa & Massage" },
  { key: "makeup",     label: "Makeup"       },
  { key: "waxing",     label: "Waxing"       },
];

export default function Footer() {
  const locale = useLocale();

  return (
    <footer className="bg-s-ink text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          {/* Kategorien */}
          <div>
            <h3
              className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 font-body"
            >
              Kategorien
            </h3>
            <ul className="space-y-2">
              {CATEGORIES.map(({ key, label }) => (
                <li key={key}>
                  <Link
                    href={`/${locale}/${key}`}
                    className="text-sm text-white/70 hover:text-white transition-colors font-body"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <h3
              className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 font-body"
            >
              Unternehmen
            </h3>
            <ul className="space-y-2">
              {[
                { label: "Impressum",   href: `/${locale}/impressum` },
                { label: "AGB",         href: `/${locale}/agb` },
                { label: "Datenschutz", href: `/${locale}/datenschutz` },
                { label: "Hilfe",       href: `/${locale}/help` },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-white/70 hover:text-white transition-colors font-body"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Für Salons */}
          <div>
            <h3
              className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 font-body"
            >
              Für Salons
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/partner`}
                  className="text-sm text-white/70 hover:text-white transition-colors font-body"
                >
                  Partner werden
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/onboarding/salon`}
                  className="text-sm text-white/70 hover:text-white transition-colors font-body"
                >
                  Salon registrieren
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/dashboard`}
                  className="text-sm text-white/70 hover:text-white transition-colors font-body"
                >
                  Dashboard
                </Link>
              </li>
            </ul>
          </div>

          {/* Sozial */}
          <div>
            <h3
              className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 font-body"
            >
              Sozial
            </h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="https://instagram.com/solen.ch"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-sm text-white/70 hover:text-white transition-colors font-body"
                >
                  <Instagram size={14} />
                  Instagram
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Trust Badges */}
        <TrustBadges />

        {/* Divider */}
        <div className="border-t border-s-dm-text/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span className="font-display text-3xl tracking-[0.06em] uppercase text-white">
              so<span className="text-s-coral">.</span>len
            </span>
            <p
              className="text-xs text-white/40 text-center font-body"
            >
              © {new Date().getFullYear()} solen.ch — Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
