import Link from "next/link";
import PrivacySidebar from "./components/PrivacySidebar";
import PrivacyContent from "./components/PrivacyContent";
import BackToTopButton from "../terms/components/BackToTopButton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung / Privacy Policy — solen.ch",
  description: "Datenschutzerklärung und Privacy Policy für solen.ch",
  alternates: {
    canonical: "https://solen.ch/de/privacy",
    languages: { de: "https://solen.ch/de/privacy", en: "https://solen.ch/en/privacy", fr: "https://solen.ch/fr/privacy", it: "https://solen.ch/it/privacy" },
  },
};

export default async function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* V3-D299: retired s-coral → s-accent (Layer 2 link accent per LOCKFILE §1); s-yellow-subtle/s-yellow undefined → s-warning-bg + s-warning/20 (universal-color warning per LOCKFILE §1 + §0.4); arbitrary s-ink/X opacities → canonical s-ink-2; font-mono → font-body (LOCKFILE §2 — only Inter Tight + Hanken Grotesk) */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-s-border print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <Link href="/" className="text-sm font-semibold text-s-ink-2 transition-colors hover:text-s-ink flex items-center gap-1 group">
            <span className="transition-transform group-hover:-translate-x-1">←</span> Zurück zur Startseite / Back to Home
          </Link>
          <div className="text-xs font-body text-s-ink-2 bg-s-bg-sunken py-1 px-3 rounded-full">
            Letzte Aktualisierung / Last Updated: 23. März 2026
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">

        <div className="mb-8 md:mb-16">
          <h1 className="font-display text-3xl md:text-5xl font-semibold tracking-tight text-s-ink leading-[1.05] mb-4">
            Datenschutzerklärung
          </h1>
          <h2 className="font-display text-xl md:text-3xl font-semibold tracking-tight text-s-ink-2">
            Privacy Policy
          </h2>

          <div className="mt-8 p-4 bg-s-warning-bg border border-s-warning/20 rounded-[12px] text-s-ink text-sm">
            <p className="font-semibold mb-1">Hinweis: Die deutsche Fassung dieser Datenschutzerklärung ist massgebend.</p>
            <p>Die englische Übersetzung dient ausschliesslich der Information. Bei Widersprüchen zwischen den beiden Fassungen gilt die deutsche Version.</p>
            <div className="h-px w-full border-t border-s-warning/20 my-3" />
            <p className="font-semibold mb-1 italic">Note: The German version of this Privacy Policy is authoritative.</p>
            <p className="italic">The English translation is provided for information purposes only. In case of any discrepancy between the two versions, the German version shall prevail.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start relative">
          <PrivacySidebar />

          {/* ig7 (2026-07-17): hand-rolled max-w-3xl (768px, wider than the 68ch/
              80ch reading-width cap) replaced with the shared .prose-measure
              utility, same swap already applied to SalonAbout.tsx. */}
          <div className="prose-measure min-w-0 flex-1 pb-24">
            <PrivacyContent />

            <div className="mt-16 pt-8 border-t border-s-border">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-s-ink-2">
                <div>
                  © 2026 solen.ch. Alle Rechte vorbehalten.
                </div>
                <div className="flex gap-4">
                  <Link href="/terms" className="text-s-accent">
                    AGB / Terms of Service
                  </Link>
                  <a href="mailto:support@solen.ch" className="text-s-accent">
                    Kontakt / Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        <BackToTopButton />
      </main>
    </div>
  );
}
