import { getTranslations } from "next-intl/server";

const SECTIONS = [
  "copyright",
  "license",
  "content_rules",
  "removal",
  "gdpr",
  "disclaimer",
] as const;

export default async function DiscoveryTermsPage() {
  const t = await getTranslations("discovery_tos");

  return (
    <main className="min-h-screen bg-white px-4 py-12">
      {/* V3-D298: H1 normalized to LOCKFILE Page H2 spec (display 25/40 700); muted ink (s-ink/70, s-ink/30) → canonical s-ink-2 */}
      {/* mockup-ok: max-w-2xl swapped for the shared prose-measure utility (68ch), punch-list
          long-form-prose sweep (globals.css:223-225, owner-approved law TASTE_LOG.md:187 2026-07-15). */}
      <div className="prose-measure mx-auto">
        <h1 className="font-display text-[25px] md:text-[40px] font-semibold tracking-tight text-s-ink leading-[1.05] mb-8">{t("title")}</h1>
        <div className="space-y-6">
          {SECTIONS.map((key) => (
            <div key={key}>
              <h2 className="text-lg font-display font-semibold text-s-ink mb-2">
                {t(`${key}_heading`)}
              </h2>
              <p className="text-sm text-s-ink-2 leading-relaxed">
                {t(`${key}_text`)}
              </p>
            </div>
          ))}
        </div>
        <p className="text-xs text-s-ink-2 mt-12">
          © {new Date().getFullYear()} solen.ch — Basel, Switzerland
        </p>
      </div>
    </main>
  );
}
