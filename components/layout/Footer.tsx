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
    <footer style={{ backgroundColor: "#1A1A2E" }} className="text-white">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 pt-12 pb-8">

        {/* Main grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 mb-10">

          {/* Kategorien */}
          <div>
            <h3
              className="text-sm font-medium text-white/60 uppercase tracking-wider mb-4 font-body"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Kategorien
            </h3>
            <ul className="space-y-2">
              {CATEGORIES.map(({ key, label }) => (
                <li key={key}>
                  <Link
                    href={`/${locale}/${key}`}
                    className="text-sm text-white/70 hover:text-white transition-colors font-body"
                    style={{ fontFamily: "DM Sans, sans-serif" }}
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
              style={{ fontFamily: "DM Sans, sans-serif" }}
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
                    style={{ fontFamily: "DM Sans, sans-serif" }}
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
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              Für Salons
            </h3>
            <ul className="space-y-2">
              <li>
                <Link
                  href={`/${locale}/partner`}
                  className="text-sm text-white/70 hover:text-white transition-colors font-body"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  Partner werden
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/onboarding/salon`}
                  className="text-sm text-white/70 hover:text-white transition-colors font-body"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
                >
                  Salon registrieren
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/dashboard`}
                  className="text-sm text-white/70 hover:text-white transition-colors font-body"
                  style={{ fontFamily: "DM Sans, sans-serif" }}
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
              style={{ fontFamily: "DM Sans, sans-serif" }}
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
                  style={{ fontFamily: "DM Sans, sans-serif" }}
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
        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <span
              className="font-heading font-bold text-xl text-white"
              style={{ fontFamily: "Syne, sans-serif" }}
            >
              solen.ch
            </span>
            <p
              className="text-xs text-white/40 text-center font-body"
              style={{ fontFamily: "DM Sans, sans-serif" }}
            >
              © 2026 solen.ch — Alle Rechte vorbehalten.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
