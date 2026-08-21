import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Blog — Solen",
  description: "Tipps, Trends und Neues aus der Solen-Welt. Bald hier.",
};

export default async function BlogPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const p = `/${locale}`;

  return (
    <main className="min-h-screen bg-white pb-24">
      <div className="max-w-2xl mx-auto px-4 pt-8">
        <h1 className="font-display text-4xl md:text-5xl font-semibold tracking-tight text-s-ink mb-2">
          Blog
        </h1>
        <p className="text-sm text-s-ink-2 mb-10">
          Tipps, Trends und Neues aus der Solen-Welt.
        </p>

        <div className="space-y-8">
          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              Bald hier
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Unser Blog ist in Arbeit. Schon bald finden Sie hier Beauty-Tipps,
              Trend-Guides und Geschichten aus Salons in der ganzen Schweiz.
            </p>
          </section>

          <section>
            <h2 className="font-display text-s-ink text-lg font-semibold mb-3 pb-2 border-b border-s-border">
              In der Zwischenzeit
            </h2>
            <p className="text-sm text-s-ink-2 leading-relaxed">
              Aktuelle Looks und Trends gibt es schon jetzt in{" "}
              <Link href={`${p}/inspo`} className="text-s-accent hover:underline">
                Inspo
              </Link>
              .
            </p>
          </section>
        </div>
      </div>
    </main>
  );
}
