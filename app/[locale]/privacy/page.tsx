import Link from "next/link";
import PrivacySidebar from "./components/PrivacySidebar";
import PrivacyContent from "./components/PrivacyContent";
import BackToTopButton from "../terms/components/BackToTopButton";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Datenschutzerklärung / Privacy Policy — solen.ch",
  description: "Datenschutzerklärung und Privacy Policy für solen.ch",
};

export default async function PrivacyPage() {
  return (
    <div className="min-h-screen bg-white dark:bg-s-dm-bg">
      <div className="sticky top-0 z-50 bg-white/80 dark:bg-s-dm-bg/80 backdrop-blur-md border-b border-s-ink/10 dark:border-s-dm-text/10 print:hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <Link href="/" className="text-sm font-medium text-s-coral hover:underline flex items-center gap-1 group">
            <span className="transition-transform group-hover:-translate-x-1">←</span> Zurück zur Startseite / Back to Home
          </Link>
          <div className="text-xs font-mono text-s-ink/60 dark:text-s-dm-text/60 bg-s-ink/5 dark:bg-white/5 py-1 px-3 rounded-full">
            Letzte Aktualisierung / Last Updated: 23. März 2026
          </div>
        </div>
      </div>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-16">
        
        <div className="mb-8 md:mb-16">
          <h1 className="font-heading font-bold text-3xl md:text-5xl text-s-ink dark:text-s-dm-text mb-4">
            Datenschutzerklärung
          </h1>
          <h2 className="font-heading text-xl md:text-3xl text-s-ink/60 dark:text-s-dm-text/60">
            Privacy Policy
          </h2>
          
          <div className="mt-8 p-4 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-900/50 rounded-xl text-s-ink dark:text-s-dm-text text-sm">
            <p className="font-semibold mb-1">Hinweis: Die deutsche Fassung dieser Datenschutzerklärung ist massgebend.</p>
            <p>Die englische Übersetzung dient ausschliesslich der Information. Bei Widersprüchen zwischen den beiden Fassungen gilt die deutsche Version.</p>
            <div className="h-px w-full bg-yellow-200 dark:bg-yellow-900/50 my-3" />
            <p className="font-semibold mb-1 italic">Note: The German version of this Privacy Policy is authoritative.</p>
            <p className="italic">The English translation is provided for information purposes only. In case of any discrepancy between the two versions, the German version shall prevail.</p>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-8 lg:gap-16 items-start relative">
          <PrivacySidebar />
          
          <div className="flex-1 min-w-0 max-w-3xl pb-24">
            <PrivacyContent />
            
            <div className="mt-16 pt-8 border-t border-s-ink/10 dark:border-s-dm-text/10">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-sm text-s-ink/70 dark:text-s-dm-text/70">
                <div>
                  © 2026 solen.ch. Alle Rechte vorbehalten.
                </div>
                <div className="flex gap-4">
                  <Link href="/terms" className="hover:text-s-coral transition-colors underline underline-offset-4">
                    AGB / Terms of Service
                  </Link>
                  <a href="mailto:support@solen.ch" className="hover:text-s-coral transition-colors underline underline-offset-4">
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
