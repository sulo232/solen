import Link from "next/link";
import TermsSidebar from "./components/TermsSidebar";
import TermsContent from "./components/TermsContent";
import BackToTopButton from "./components/BackToTopButton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "AGB / Terms of Service — solen.ch",
  description: "Allgemeine Geschäftsbedingungen und Terms of Service für solen.ch",
  alternates: {
    canonical: "https://solen.ch/de/terms",
    languages: { de: "https://solen.ch/de/terms", en: "https://solen.ch/en/terms", fr: "https://solen.ch/fr/terms", it: "https://solen.ch/it/terms" },
  },
};

export default async function TermsPage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Sticky header area just for the back link and updated date */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-s-ink/10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <Link href="/" className="text-sm font-medium text-s-coral hover:underline flex items-center gap-1 group">
            <span className="transition-transform group-hover:-translate-x-1">←</span> Zurück zur Startseite / Back to Home
          </Link>
          <div className="text-xs font-mono text-s-ink/60 bg-s-ink/5 py-1 px-3 rounded-full">
            Letzte Aktualisierung / Last Updated: 23. März 2026
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        
        {/* Page Header */}
        <div className="mb-8 md:mb-16">
          <h1 className="font-heading text-3xl md:text-5xl text-s-ink mb-4">
            Allgemeine Geschäftsbedingungen (AGB)
          </h1>
          <h2 className="font-heading text-xl md:text-3xl text-s-ink/60">
            Terms of Service
          </h2>
          
          <div className="mt-8 p-4 bg-s-yellow-subtle border border-s-yellow/20 rounded-xl text-s-ink text-sm">
            <p className="font-semibold mb-1">Hinweis: Die deutsche Fassung dieser AGB ist massgebend.</p>
            <p>Die englische Übersetzung dient ausschliesslich der Information. Bei Widersprüchen zwischen den beiden Fassungen gilt die deutsche Version.</p>
            <div className="h-px w-full border-t border-s-yellow/20 my-3" />
            <p className="font-semibold mb-1 italic">Note: The German version of these Terms of Service is authoritative.</p>
            <p className="italic">The English translation is provided for information purposes only. In case of any discrepancy between the two versions, the German version shall prevail.</p>
          </div>
        </div>

        {/* Layout: Sidebar + Main Content */}
        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start relative">
          <TermsSidebar />
          
          {/* Main Terms Content */}
          <div className="flex-1 min-w-0 max-w-3xl pb-24">
            <TermsContent />
            
            {/* Footer Area within content */}
            <div className="mt-16 pt-8 border-t border-s-ink/10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-s-ink/70">
                <div>
                  © 2026 solen.ch. Alle Rechte vorbehalten.
                </div>
                <div className="flex gap-4">
                  <Link href="/privacy" className="hover:text-s-coral transition-colors underline underline-offset-4">
                    Datenschutzerklärung / Privacy Policy
                  </Link>
                  <a href="mailto:support@solen.ch" className="hover:text-s-coral transition-colors underline underline-offset-4">
                    Kontakt / Contact
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Back to top button */}
        <BackToTopButton />
      </main>
    </div>
  );
}

