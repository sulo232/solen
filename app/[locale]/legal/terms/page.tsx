import { getTranslations } from "next-intl/server";

export default async function TermsPage() {
  const t = await getTranslations("legal");
  return (
    <main className="min-h-screen bg-white py-16 px-4">
      {/* V3-D297: H1 normalized to LOCKFILE Page H2 spec (display 25/40 700, -0.03em tracking); muted ink → canonical s-ink-2 */}
      <article className="max-w-2xl mx-auto prose prose-sm">
        <h1 className="font-display text-[25px] md:text-[40px] font-semibold tracking-tight text-s-ink leading-[1.05] mb-6">{t("terms.title")}</h1>
        <p className="text-s-ink-2 text-xs mb-8">{t("terms.lastUpdated")}</p>

        <h2>{t("terms.s1Title")}</h2>
        <p>{t("terms.s1Body")}</p>

        <h2>{t("terms.s2Title")}</h2>
        <p>{t("terms.s2Body")}</p>

        <h2>{t("terms.s3Title")}</h2>
        <p>{t("terms.s3Body")}</p>

        <h2>{t("terms.s4Title")}</h2>
        <p>{t("terms.s4Body")}</p>

        <h2>{t("terms.s5Title")}</h2>
        <p>{t("terms.s5Body")}</p>
      </article>
    </main>
  );
}
