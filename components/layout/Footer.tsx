import Link from "next/link";
import { Instagram } from "lucide-react";

interface FooterProps {
  locale: string;
}

const CATEGORIES = [
  { href: "coiffeur", label: "Coiffeur" },
  { href: "barbershop", label: "Barbershop" },
  { href: "nails", label: "Nails" },
  { href: "spa", label: "Spa & Massage" },
  { href: "makeup", label: "Makeup" },
  { href: "waxing", label: "Waxing" },
];

export default function Footer({ locale }: FooterProps) {
  return (
    <footer style={{ backgroundColor: "#1A1A2E" }} className="text-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div>
            <p className="font-heading font-bold text-xl mb-3">
              solen<span className="text-teal">.</span>ch
            </p>
            <p className="text-white/50 text-sm font-body leading-relaxed">
              Die Buchungsplattform für Salons in Basel.
            </p>
          </div>

          {/* Kategorien */}
          <div>
            <p className="font-heading font-semibold text-sm text-white/80 uppercase tracking-wider mb-4">
              Kategorien
            </p>
            <ul className="flex flex-col gap-2.5">
              {CATEGORIES.map(({ href, label }) => (
                <li key={href}>
                  <Link
                    href={`/${locale}/${href}`}
                    className="text-sm text-white/50 font-body hover:text-teal transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Unternehmen */}
          <div>
            <p className="font-heading font-semibold text-sm text-white/80 uppercase tracking-wider mb-4">
              Unternehmen
            </p>
            <ul className="flex flex-col gap-2.5">
              {[
                { href: "#", label: "Über uns" },
                { href: "#", label: "Kontakt" },
                { href: "#", label: "Impressum" },
                { href: "#", label: "Datenschutz" },
              ].map(({ href, label }) => (
                <li key={label}>
                  <Link
                    href={href}
                    className="text-sm text-white/50 font-body hover:text-teal transition-colors"
                  >
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Für Salons */}
          <div>
            <p className="font-heading font-semibold text-sm text-white/80 uppercase tracking-wider mb-4">
              Für Salons
            </p>
            <ul className="flex flex-col gap-2.5">
              <li>
                <Link
                  href={`/${locale}/onboarding/salon`}
                  className="text-sm text-white/50 font-body hover:text-teal transition-colors"
                >
                  Salon registrieren
                </Link>
              </li>
              <li>
                <Link
                  href={`/${locale}/dashboard`}
                  className="text-sm text-white/50 font-body hover:text-teal transition-colors"
                >
                  Dashboard
                </Link>
              </li>
            </ul>

            <div className="mt-6">
              <p className="font-heading font-semibold text-sm text-white/80 uppercase tracking-wider mb-3">
                Sozial
              </p>
              <a
                href="https://instagram.com/solen.ch"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-sm text-white/50 font-body hover:text-teal transition-colors"
              >
                <Instagram className="w-4 h-4" />
                Instagram
              </a>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/10 pt-6 text-center">
          <p className="text-xs text-white/30 font-body">
            © {new Date().getFullYear()} solen.ch — Alle Rechte vorbehalten.
          </p>
        </div>
      </div>
    </footer>
  );
}
