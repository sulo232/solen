"use client";

import * as React from "react";
import Link from "next/link";
import { useLocale, useTranslations } from "next-intl";
import { ChevronRight, Star, Clock } from "lucide-react";
import Spinner from "@/components-legacy/ui/Spinner";
import { useRecentlyViewed } from "@/app/[locale]/_components/homepage/useRecentlyViewed";

/**
 * Recently-viewed full page (audit gap #9), built from the approved mockup
 * `public/_mockups/restraint/recently-viewed-page.html`.
 *
 * Real data only: the slugs come from the same `solen.recently-viewed` localStorage the
 * homepage rail uses, then we bulk-fetch the live salon rows via GET /api/salons/by-slugs
 * (its intended consumer per that route's docstring). Shows real name / rating / review
 * count / photo / address — NOT a fabricated "ab CHF" price (by-slugs carries no service
 * price, so the price line is omitted rather than invented).
 */

type RichSalon = {
  id: string;
  name: string;
  slug: string;
  average_rating: number | null;
  review_count: number | null;
  cover_photo_url: string | null;
  address: string | null;
  categories: string[] | null;
};

export default function RecentlyViewedClient() {
  const t = useTranslations("recentlyViewed");
  const locale = useLocale();
  const { items } = useRecentlyViewed(12);
  const [rich, setRich] = React.useState<RichSalon[] | null>(null);
  // The hook reads localStorage in a mount effect, so the very first pass always sees an
  // empty list even when the user HAS history. Skip the "empty" verdict on that first pass
  // (stay on the spinner) so a returning user never flashes the empty state.
  const firstPassRef = React.useRef(true);

  React.useEffect(() => {
    const slugs = items.map((i) => i.slug).filter(Boolean);
    if (slugs.length === 0) {
      if (firstPassRef.current) { firstPassRef.current = false; return; }
      setRich([]);
      return;
    }
    firstPassRef.current = false;
    let alive = true;
    fetch(`/api/salons/by-slugs?slugs=${encodeURIComponent(slugs.join(","))}`)
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((j) => { if (alive) setRich(j.items ?? []); })
      .catch((e) => { console.error("[RecentlyViewed] by-slugs fetch failed:", e); if (alive) setRich([]); })
      .finally(() => { /* rich set above */ });
    return () => { alive = false; };
  }, [items]);

  const loading = rich === null;
  const list = rich ?? [];

  return (
    <div className="min-h-screen bg-white">
      {/* Header — title + count only. The global site Header already provides the deep-page
          back arrow (V3-D461); a second back here would duplicate it. */}
      <header className="sticky top-0 z-40 border-b border-s-border bg-white/95 backdrop-blur-sm">
        <div className="mx-auto flex max-w-2xl flex-col px-4 py-3.5">
          <h1 className="truncate font-heading text-[20px] font-bold tracking-[-0.01em] text-s-ink">{t("title")}</h1>
          {!loading && list.length > 0 && (
            <p className="text-[13px] text-s-ink-2">{t("count", { count: list.length })}</p>
          )}
        </div>
      </header>

      <main className="mx-auto max-w-2xl px-4">
        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : list.length === 0 ? (
          // Empty state — sunken clock disc + ink CTA (mockup)
          <div className="flex flex-col items-center px-8 pb-14 pt-16 text-center">
            <Clock size={56} strokeWidth={1.25} className="mb-6 text-s-ink" aria-hidden />
            <h2 className="font-heading text-[22px] font-bold tracking-[-0.02em] text-s-ink">{t("emptyTitle")}</h2>
            <p className="mt-2 max-w-[260px] text-[14px] leading-relaxed text-s-ink-2">{t("emptyBody")}</p>
            <Link
              href={`/${locale}/search`}
              className="mt-6 rounded-btn bg-s-ink px-6 py-3 font-heading text-[14px] font-semibold text-white transition-transform active:scale-[0.98]"
            >
              {t("emptyCta")}
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-s-border">
            {list.map((s) => (
              <li key={s.slug}>
                <Link href={`/${locale}/salon/${s.slug}`} className="flex items-center gap-3.5 py-3.5 transition active:opacity-70">
                  {s.cover_photo_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={s.cover_photo_url} alt="" className="h-14 w-14 shrink-0 rounded-[14px] object-cover" />
                  ) : (
                    <div className="grid h-14 w-14 shrink-0 place-items-center rounded-[14px] bg-s-bg-sunken font-heading text-lg font-semibold text-s-ink">
                      {s.name.charAt(0)}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="truncate font-heading text-[16px] font-semibold tracking-[-0.01em] text-s-ink">{s.name}</div>
                    <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[13px]">
                      {s.average_rating != null && s.average_rating > 0 &&
                        s.review_count != null && s.review_count > 0 && (
                        <span className="flex items-center gap-1">
                          <Star size={13} className="fill-s-star text-s-star" aria-hidden />
                          <span className="font-semibold tabular-nums text-s-ink">{s.average_rating.toFixed(1)}</span>
                          <span className="tabular-nums text-s-accent">({s.review_count})</span>
                        </span>
                      )}
                      {s.address && <span className="truncate text-s-ink-2">{s.address}</span>}
                    </div>
                  </div>
                  <ChevronRight size={18} strokeWidth={1.9} className="shrink-0 text-s-ink" aria-hidden />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </main>
    </div>
  );
}
