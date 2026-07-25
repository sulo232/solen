// exists-check: `npm run exists "scroll motion condensing top bar frosted"` (2026-07-25), 0
// matches , net-new. Deliberately does NOT reuse the real `SalonServices.tsx` / `SalonTeam.tsx` /
// `SalonReviews.tsx` / `SalonAbout.tsx` section components: those carry booking/staff-filter/
// lightbox interaction state that this route has no use for (it exists to compare TOP BAR scroll
// motion, not to re-review the section components themselves), so re-wiring their full prop
// contracts would be scope creep against the SCOPE FENCE. This file instead renders the salon's
// REAL data (services/staff/reviews/about text from `loadSalonDetailWithStatus`, same loader
// `app/[locale]/salon/[slug]/page.tsx` uses , no lorem) using the SAME locked grammar those real
// components use: grouped list card = `rounded-[24px]` + `shadow-whisper` (design contract
// "radius" row), row name 14/500 + meta 12/400 ink-2 (two-anchor rule, V3-D442), section-H2 18px
// (design contract "text size" row). Section headings are my own chrome (English, per constraint);
// row content is the salon's real data.

import { Fragment } from "react";
import { Avatar, RatingStars } from "@/app/[locale]/_components/primitives";
import { MetaDot } from "@/app/[locale]/_components/salon/MetaDot";
import { formatPrice } from "@/lib/format";
import { formatReviewDate, type SalonDetail } from "@/app/[locale]/_components/salon/_shared";
import { cn } from "@/lib/utils";

function SectionShell({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="px-4 pt-8">
      <h2 className="font-display text-[18px] font-semibold text-s-ink">{title}</h2>
      <div className="mt-3 rounded-[24px] bg-white p-2 shadow-whisper">{children}</div>
    </section>
  );
}

function ServicesBlock({ services }: { services: SalonDetail["services"] }) {
  if (!services.length) return null;
  return (
    <SectionShell title="Services">
      {services.map((s, i) => (
        <div
          key={s.id}
          className={cn("flex items-center justify-between gap-3 px-3 py-3.5", i > 0 && "border-t border-s-border")}
        >
          <div className="min-w-0">
            <p className="truncate font-body text-[14px] font-medium text-s-ink">{s.name_de}</p>
            <p className="mt-0.5 font-body text-[12px] text-s-ink-2">{s.duration_minutes} min</p>
          </div>
          <p className="shrink-0 font-body text-[14px] font-semibold text-s-ink">{formatPrice(s.price)}</p>
        </div>
      ))}
    </SectionShell>
  );
}

function TeamBlock({ staff }: { staff: SalonDetail["staff"] }) {
  if (!staff.length) return null;
  return (
    <SectionShell title="Team">
      {staff.map((m, i) => (
        <div key={m.id} className={cn("flex items-center gap-3 px-3 py-3", i > 0 && "border-t border-s-border")}>
          <Avatar src={m.avatar_url} name={m.name} size="md" />
          <div className="min-w-0">
            <p className="truncate font-body text-[14px] font-medium text-s-ink">{m.name}</p>
            {m.specialties.length > 0 && (
              <p className="truncate font-body text-[12px] text-s-ink-2">
                {m.specialties.slice(0, 2).map((sp, idx) => (
                  <Fragment key={sp}>
                    {idx > 0 && <MetaDot />}
                    {sp}
                  </Fragment>
                ))}
              </p>
            )}
          </div>
        </div>
      ))}
    </SectionShell>
  );
}

function ReviewsBlock({ reviews, locale }: { reviews: SalonDetail["reviews"]; locale: string }) {
  if (!reviews.length) return null;
  return (
    <SectionShell title="Reviews">
      {reviews.slice(0, 8).map((r, i) => (
        <div key={r.id} className={cn("px-3 py-3.5", i > 0 && "border-t border-s-border")}>
          <div className="flex items-center justify-between gap-2">
            <p className="truncate font-body text-[14px] font-medium text-s-ink">
              {r.profiles?.display_name ?? "Guest"}
            </p>
            <RatingStars value={r.rating} mode="five" size="sm" /> {/* psych-ok: one review's own rating (mode="five", matches SalonReviews.tsx:242), not an aggregate average, there is no count for a single review's own star input to carry */}
          </div>
          {r.comment && (
            <p className="mt-1 font-body text-[13px] leading-relaxed text-s-ink-2">{r.comment}</p>
          )}
          <p className="mt-1 font-body text-[12px] text-s-ink-3">{formatReviewDate(r.created_at, locale)}</p>
        </div>
      ))}
    </SectionShell>
  );
}

function AboutBlock({ salon }: { salon: SalonDetail }) {
  const text = salon.about_text_de || salon.description_de || salon.about_text_en || salon.description_en;
  if (!text) return null;
  return (
    <SectionShell title="About this salon">
      <p className="px-3 py-3.5 font-body text-[14px] leading-relaxed text-s-ink-2">{text}</p>
    </SectionShell>
  );
}

export function ContentSections({ salon, locale }: { salon: SalonDetail; locale: string }) {
  return (
    <div className="pb-16">
      <ServicesBlock services={salon.services} />
      <TeamBlock staff={salon.staff} />
      <ReviewsBlock reviews={salon.reviews} locale={locale} />
      <AboutBlock salon={salon} />
    </div>
  );
}
