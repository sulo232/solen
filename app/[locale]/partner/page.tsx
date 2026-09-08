"use client";

import { useState } from "react";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { Store, TrendingUp, Calendar, ArrowRight, Star, Check, ChevronDown, ChevronRight, UserPlus, Settings, Shield, Lock, CreditCard, Quote, BarChart3, Users, MessageSquare, Clock, Bell, Scissors, Droplets, Hand, Rocket } from "lucide-react";
import InteractiveHoverButton from "@/components-legacy/ui/interactive-hover-button";
import PartnerSignupForm from "@/components-legacy/partner/PartnerSignupForm";

const FEATURES = [
  { icon: Calendar, title: "feat_bookings_title", desc: "feat_bookings_desc", live: true },
  { icon: BarChart3, title: "feat_dashboard_title", desc: "feat_dashboard_desc", live: true },
  { icon: Users, title: "feat_crm_title", desc: "feat_crm_desc", live: true },
  { icon: UserPlus, title: "feat_team_title", desc: "feat_team_desc", live: true },
  { icon: Star, title: "feat_reviews_title", desc: "feat_reviews_desc", live: true },
  { icon: Clock, title: "feat_lastminute_title", desc: "feat_lastminute_desc", live: true },
  { icon: TrendingUp, title: "feat_analytics_title", desc: "feat_analytics_desc", live: false },
  { icon: Bell, title: "feat_reminders_title", desc: "feat_reminders_desc", live: false },
];

const FAQ_KEYS = [
  "faq_cost",
  "faq_contract",
  "faq_payments",
  "faq_edit_profile",
  "faq_more_clients",
  "faq_no_show",
  "faq_existing_system",
  "faq_how_fast",
  "faq_categories",
];

export default function PartnerPage() {
  const t = useTranslations("partner") as any;
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white">
      {/* Hero — Split Layout */}
      <div className="pt-24 pb-16 overflow-hidden bg-s-bg-sunken">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">

          {/* Left — Text + CTA */}
          <div className="text-center lg:text-left">
            {/* Section eyebrows on this page: size is already card-meta 12px (owner
                decision 5A, 2026-08-09) and is left as-is. Sentence-cased per the
                2026-06-18 owner law; tracking 0.16em (non-canonical, drift A8) →
                0.08em, the locked Eyebrow value in LOCKFILE §2. Same edit on the 7
                section eyebrows below. Source strings are already sentence case in
                all four locales, so no i18n change was needed. */}
            <p className="text-[12px] md:text-[12px] font-body font-bold tracking-[0.08em] text-s-ink-2 mb-3">
              {t("for_owners")}
            </p>
            <h1 className="font-heading text-[clamp(26px,7vw,30px)] md:text-[46px] font-semibold text-s-ink mb-4 leading-[1.0] tracking-[-0.03em]">
              {t("hero_title_1")}{" "}
              <span className="text-s-ink">{t("hero_title_accent")}</span>
              <br />{t("hero_title_2")}
            </h1>
            <p className="text-lg font-body font-normal text-s-ink-2 max-w-lg mb-8">
              {t("hero_subtitle")}
            </p>
            <div id="contact" className="scroll-mt-24">
              <PartnerSignupForm />
            </div>
            <p className="text-[12px] md:text-[12px] font-body font-bold uppercase tracking-[0.16em] text-s-ink-2 mt-3">
              {t("hero_subtext")}
            </p>
          </div>

          {/* Right — Product Mockups */}
          <div className="relative flex items-center justify-center lg:justify-end">
            {/* Laptop mockup */}
            <div className="relative w-full max-w-md lg:max-w-lg">
              <Image
                src="/images/partner/dashboard-mockup.png"
                alt={t("alt_dashboard")}
                width={600}
                height={400}
                className="rounded-[12px] shadow-elevation-3"
                priority
              />
              {/* Phone mockup — overlapping bottom-right */}
              <div className="absolute -bottom-6 -right-4 sm:-right-8 w-28 sm:w-36">
                <Image
                  src="/images/partner/profile-mockup.png"
                  alt={t("alt_profile")}
                  width={180}
                  height={360}
                  className="rounded-[12px] border-4 border-white shadow-elevation-3"
                />
              </div>
            </div>


          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <p className="text-[12px] md:text-[12px] font-body font-bold tracking-[0.08em] text-s-ink-2 mb-2">
            {t("section_features")}
          </p>
          <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
            {t("features_title")}
          </h2>
          <p className="text-s-ink-2 font-body font-normal">
            {t("features_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="relative p-5 rounded-[14px] bg-s-bg-sunken border border-s-border hover:shadow-elevation-1 transition-[border-color,box-shadow] duration-200">
              {!f.live && (
                <span className="absolute top-3 right-3 text-[12px] font-heading uppercase tracking-[.06em] px-2 py-0.5 rounded-pill bg-s-ink text-white">
                  {t("coming_soon")}
                </span>
              )}
              <div className="w-10 h-10 rounded-[10px] flex items-center justify-center mb-3 bg-s-bg-sunken">
                <f.icon className="w-5 h-5 text-s-ink" />
              </div>
              <h3 className="font-heading text-sm text-s-ink mb-1">{t(f.title as any)}</h3>
              <p className="text-xs font-body font-normal text-s-ink-2 leading-relaxed">{t(f.desc as any)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[12px] md:text-[12px] font-body font-bold tracking-[0.08em] text-s-ink-2 mb-2">
              {t("section_categories")}
            </p>
            <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
              {t("cat_title")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal">
              {t("cat_subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Scissors, key: "cat_coiffeur" },
              { icon: UserPlus, key: "cat_barbershop" },
              { icon: Hand, key: "cat_nails" },
              { icon: Droplets, key: "cat_spa" },
              { icon: Star, key: "cat_makeup" },
              { icon: Droplets, key: "cat_waxing" },
            ].map((cat) => (
              <div key={cat.key} className="p-5 rounded-[14px] bg-white border border-s-border hover:border-s-ink hover:shadow-elevation-1 transition-[border-color,box-shadow] duration-200">
                <cat.icon className="w-6 h-6 text-s-ink mb-3" />
                <h3 className="font-heading text-sm text-s-ink mb-1">{t(`${cat.key}_title` as any)}</h3>
                <p className="text-xs font-body font-normal text-s-ink-2 leading-relaxed">{t(`${cat.key}_desc` as any)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-s-bg-sunken">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <p className="text-[12px] md:text-[12px] font-body font-bold tracking-[0.08em] text-s-ink-2 mb-2">
              {t("section_how_it_works")}
            </p>
            <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
              {t("hiw_title")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal">
              {t("hiw_subtitle")}
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Connecting line — horizontal on desktop */}
            <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-0.5 border-t-2 border-dashed border-s-border" aria-hidden="true" />
            {/* Connecting line — vertical on mobile */}
            <div className="md:hidden absolute top-10 bottom-10 left-6 w-0.5 border-l-2 border-dashed border-s-border" aria-hidden="true" />
            {/* Chevron arrows — desktop only, positioned over the connecting line */}
            <ChevronRight className="hidden md:block absolute top-[18px] left-[calc(33.3%-12px)] w-5 h-5 text-s-ink-2" aria-hidden="true" />
            <ChevronRight className="hidden md:block absolute top-[18px] left-[calc(66.6%-12px)] w-5 h-5 text-s-ink-2" aria-hidden="true" />

            {/* Step 1 */}
            <div className="relative text-center md:text-center pl-16 md:pl-0">
              {/* V3-D330 / LOCKFILE §1.5: step circles ink (accent forbidden on step circles, supersedes V3-D319). */}
              <div className="w-12 h-12 rounded-pill bg-s-ink text-white font-heading text-lg flex items-center justify-center mx-auto md:mx-auto absolute md:relative left-0 md:left-auto top-0 md:top-auto mb-4">
                1
              </div>
              <div className="mt-2 md:mt-4">
                <UserPlus className="w-6 h-6 text-s-ink mx-auto mb-2 hidden md:block" />
                <h3 className="font-heading text-base text-s-ink mb-1">
                  {t("hiw_step1_title")}
                </h3>
                <p className="text-sm text-s-ink-2 mb-2">
                  {t("hiw_step1_desc")}
                </p>
                <span className="inline-block text-[12px] font-heading uppercase tracking-[.12em] text-s-ink-2 px-3 py-1.5 rounded-pill bg-s-bg-sunken">
                  {t("hiw_step1_time")}
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative text-center md:text-center pl-16 md:pl-0">
              {/* V3-D330 / LOCKFILE §1.5: step circles ink (accent forbidden on step circles, supersedes V3-D319). */}
              <div className="w-12 h-12 rounded-pill bg-s-ink text-white font-heading text-lg flex items-center justify-center mx-auto md:mx-auto absolute md:relative left-0 md:left-auto top-0 md:top-auto mb-4">
                2
              </div>
              <div className="mt-2 md:mt-4">
                <Settings className="w-6 h-6 text-s-ink mx-auto mb-2 hidden md:block" />
                <h3 className="font-heading text-base text-s-ink mb-1">
                  {t("hiw_step2_title")}
                </h3>
                <p className="text-sm text-s-ink-2 mb-2">
                  {t("hiw_step2_desc")}
                </p>
                <span className="inline-block text-[12px] font-heading uppercase tracking-[.12em] text-s-ink-2 px-3 py-1.5 rounded-pill bg-s-bg-sunken">
                  {t("hiw_step2_time")}
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative text-center md:text-center pl-16 md:pl-0">
              {/* V3-D330 / LOCKFILE §1.5: step circles ink (accent forbidden on step circles, supersedes V3-D319). */}
              <div className="w-12 h-12 rounded-pill bg-s-ink text-white font-heading text-lg flex items-center justify-center mx-auto md:mx-auto absolute md:relative left-0 md:left-auto top-0 md:top-auto mb-4">
                3
              </div>
              <div className="mt-2 md:mt-4">
                <Rocket className="w-6 h-6 text-s-ink mx-auto mb-2 hidden md:block" />
                <h3 className="font-heading text-base text-s-ink mb-1">
                  {t("hiw_step3_title")}
                </h3>
                <p className="text-sm text-s-ink-2 mb-2">
                  {t("hiw_step3_desc")}
                </p>
                <span className="inline-block text-[12px] font-heading uppercase tracking-[.12em] text-s-success px-3 py-1.5 rounded-pill bg-s-success-bg">
                  {t("hiw_step3_time")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof — Trust Badges + Testimonials */}
      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <p className="text-[12px] md:text-[12px] font-body font-bold tracking-[0.08em] text-s-ink-2 mb-2">
              {t("section_testimonials")}
            </p>
            <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
              {t("social_title")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal">
              {t("social_subtitle")}
            </p>
          </div>

          {/* Trust Badges */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-12">
            {[
              { icon: Shield, key: "trust_basel" },
              { icon: Lock, key: "trust_gdpr" },
              { icon: CreditCard, key: "trust_stripe" },
              { icon: Check, key: "trust_no_contract" },
            ].map((badge) => (
              <div key={badge.key} className="flex flex-col items-center text-center p-4 bg-s-bg-sunken rounded-[14px] border border-s-border">
                <badge.icon className="w-6 h-6 text-s-ink mb-2" />
                <span className="text-xs font-heading text-s-ink">{t(badge.key as any)}</span>
              </div>
            ))}
          </div>


        </div>
      </div>

      {/* Pricing */}
      <div className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Section header */}
          <div className="text-center mb-12">
            <p className="text-[12px] md:text-[12px] font-body font-bold tracking-[0.08em] text-s-ink-2 mb-2">
              {t("section_pricing")}
            </p>
            <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
              {t("pricing_title")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal max-w-2xl mx-auto">
              {t("pricing_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left — Pricing Card */}
            <div className="bg-white border border-s-border rounded-[18px] p-8 relative overflow-hidden shadow-elevation-2">
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-s-ink text-white text-[12px] font-heading uppercase tracking-[.14em] px-3 py-1.5 rounded-pill">
                {t("pricing_badge")}
              </div>

              {/* Price */}
              <p className="text-sm font-body text-s-ink-2 mb-1">{t("pricing_label")}</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-heading text-4xl text-s-ink">15%</span>
                <span className="text-s-ink-2 text-sm">{t("pricing_per_booking")}</span>
              </div>
              <p className="text-[12px] font-body text-s-ink-2 mb-0.5">{t("pricing_intro_model")}</p>
              <p className="text-[12px] font-body text-s-warning italic mb-5">{t("pricing_intro_qualifier")}</p>
              <p className="text-xs text-s-ink-2 mb-6">{t("pricing_no_fixed")}</p>

              {/* Feature checklist */}
              <ul className="space-y-3">
                {[
                  "pricing_feature_1",
                  "pricing_feature_2",
                  "pricing_feature_3",
                  "pricing_feature_4",
                  "pricing_feature_5",
                  "pricing_feature_6",
                  "pricing_feature_7",
                  "pricing_feature_8",
                ].map((key) => (
                  <li key={key} className="flex items-start gap-3">
                    <Check className="w-4 h-4 text-s-success mt-0.5 shrink-0" />
                    <span className="text-sm text-s-ink">{t(key as any)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — Competitor Comparison Chart */}
            <div className="bg-s-bg-sunken rounded-[16px] p-8">
              <h3 className="font-heading text-lg text-s-ink mb-6">
                {t("compare_title")}
              </h3>

              {/* Bar chart — CSS only */}
              <div className="space-y-6">
                {/* Solen */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body font-semibold text-s-ink">solen.ch</span>
                    <span className="text-sm font-body font-bold text-s-ink">15%</span>
                  </div>
                  <div className="h-8 w-full bg-white border border-s-border rounded-btn overflow-hidden">
                    <div
                      className="h-full bg-s-ink rounded-btn"
                      style={{ width: "33%" }}
                    />
                  </div>
                </div>

                {/* Treatwell */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body text-s-ink-2">{t("compare_treatwell")}</span>
                    <span className="text-sm font-body font-bold text-s-ink-2">~30%</span>
                  </div>
                  {/* V3-D315 (W9 follow-up): swap opacity-modifier-on-ink-2 → discrete chart-grey token per LOCKFILE §1 chart-grey scale */}
                  <div className="h-8 w-full bg-white border border-s-border rounded-btn overflow-hidden">
                    <div
                      className="h-full bg-s-chart-2 rounded-btn"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                {/* Others */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body text-s-ink-2">{t("compare_others")}</span>
                    <span className="text-sm font-body font-bold text-s-ink-2">15–25%</span>
                  </div>
                  <div className="h-8 w-full bg-white border border-s-border rounded-btn overflow-hidden">
                    <div
                      className="h-full bg-s-chart-3 rounded-btn"
                      style={{ width: "66%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Savings callout */}
              <div className="mt-8 p-4 rounded-[12px] border border-s-success/20 bg-s-success-bg">
                <p className="text-sm font-body text-s-success">
                  <span className="font-heading">{t("compare_savings_bold")}</span>{" "}
                  {t("compare_savings_text")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ — Swipable Cards */}
      <div className="py-16 bg-s-bg-sunken">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <p className="text-[12px] md:text-[12px] font-body font-bold tracking-[0.08em] text-s-ink-2 mb-2">
              {t("section_faq")}
            </p>
            <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
              {t("faq_title")}
            </h2>
            <p className="text-s-ink-2 font-body font-normal">
              {t("faq_subtitle")}
            </p>
          </div>

          {/* Scrollable card row */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
            {FAQ_KEYS.map((key, i) => (
              <button
                key={key}
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className={`snap-start shrink-0 w-72 sm:w-80 text-left rounded-[16px] border transition-[border-color,box-shadow] duration-300 ${
                  expandedFaq === i
                    ? "bg-white border-s-ink shadow-elevation-2"
                    : "bg-white border-s-border shadow-elevation-1 hover:shadow-elevation-2 hover:border-s-ink"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading text-sm text-s-ink leading-snug">
                      {t(`${key}_q` as any)}
                    </h3>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-s-ink-2 transition-transform duration-300 ${
                        expandedFaq === i ? "rotate-180 text-s-ink" : ""
                      }`}
                    />
                  </div>
                  {/* mockup-ok: hard-rule-2 conformance fix. The old
                      `transition-[height,opacity]` named `height` (forbidden by hard
                      rule 2) while the class actually toggled was `max-height`, so
                      only the opacity animated and the height snapped, a dead
                      transition on top of the rule breach. Content height is
                      variable per FAQ answer, so this reuses the
                      `grid-template-rows: 0fr -> 1fr` reveal (SearchOverlay.tsx),
                      which interpolates the grid TRACK, never the element's own
                      layout-height property, on the reveal tier (280ms). */}
                  <div
                    className="grid transition-[grid-template-rows] duration-[280ms] ease-glide" // mockup-ok
                    style={{ gridTemplateRows: expandedFaq === i ? "minmax(0,1fr)" : "minmax(0,0fr)" }}
                  >
                    <div
                      className="overflow-hidden transition-opacity duration-[280ms] ease-glide"
                      style={{ opacity: expandedFaq === i ? 1 : 0 }}
                    >
                      <p className="mt-4 text-sm text-s-ink-2 leading-relaxed">
                        {t(`${key}_a` as any)}
                      </p>
                    </div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sticky bottom CTA */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-s-border shadow-elevation-1 p-3 flex justify-center z-50">
        <a
          href="#contact"
          className="bg-s-ink text-white font-heading text-sm px-7 py-3 rounded-btn hover:brightness-[1.06] active:scale-[0.97] transition-[transform,filter] duration-150"
        >
          {t("sticky_cta")}
        </a>
      </div>

      {/* JSON-LD FAQPage structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: FAQ_KEYS.map((key) => ({
              "@type": "Question",
              name: t(`${key}_q` as any),
              acceptedAnswer: {
                "@type": "Answer",
                text: t(`${key}_a` as any),
              },
            })),
          }),
        }}
      />

      {/* CTA */}
      <div className="py-20 bg-s-bg-sunken">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[12px] md:text-[12px] font-body font-bold tracking-[0.08em] text-s-ink-2 mb-2">
            {t("section_start")}
          </p>
          <h2 className="font-heading text-[clamp(18px,2vw,20px)] font-semibold leading-[1.2] tracking-[-0.02em] text-s-ink mb-3">
            {t("cta_title")}
          </h2>
          <p className="text-s-ink-2 mb-8">
            {t("cta_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <a href="#contact">
              <InteractiveHoverButton
                text={t("cta_button")}
                className="w-auto px-8 py-4"
              />
            </a>
            <a
              href={`mailto:info@solen.ch?subject=${encodeURIComponent(t("cta_consult_subject"))}`}
              className="text-xs font-heading text-s-ink hover:text-s-ink-2 transition-colors underline underline-offset-4"
            >
              {t("cta_consult")}
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
