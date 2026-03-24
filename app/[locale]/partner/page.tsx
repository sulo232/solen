"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Store, TrendingUp, Calendar, ArrowRight, Star, Check, ChevronDown, UserPlus, Settings, Zap, Shield, Lock, CreditCard, Quote, BarChart3, Users, MessageSquare, Clock, Bell, Scissors, Sparkles, Droplets } from "lucide-react";
import InteractiveHoverButton from "@/components/ui/interactive-hover-button";

const FEATURES = [
  { icon: Calendar, title: "feat_bookings_title", desc: "feat_bookings_desc" },
  { icon: BarChart3, title: "feat_dashboard_title", desc: "feat_dashboard_desc" },
  { icon: Users, title: "feat_crm_title", desc: "feat_crm_desc" },
  { icon: UserPlus, title: "feat_team_title", desc: "feat_team_desc" },
  { icon: Star, title: "feat_reviews_title", desc: "feat_reviews_desc" },
  { icon: Clock, title: "feat_lastminute_title", desc: "feat_lastminute_desc" },
  { icon: TrendingUp, title: "feat_analytics_title", desc: "feat_analytics_desc" },
  { icon: Bell, title: "feat_reminders_title", desc: "feat_reminders_desc" },
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
  const locale = useLocale();
  const t = useTranslations("partner");
  const [expandedFaq, setExpandedFaq] = useState<number | null>(null);

  return (
    <div className="min-h-screen bg-white dark:bg-s-dm-bg">
      {/* Hero — Split Layout */}
      <div className="bg-gradient-to-b from-s-coral/5 to-white dark:from-s-coral/10 dark:to-s-dm-bg pt-24 pb-16 overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-center">
          
          {/* Left — Text + CTA */}
          <div className="text-center lg:text-left">
            <h1 className="font-heading font-bold text-3xl sm:text-4xl lg:text-5xl text-s-ink dark:text-s-dm-text mb-4 leading-tight">
              {t("hero_title_1")}{" "}
              <span className="text-s-coral">{t("hero_title_accent")}</span>
              <br />{t("hero_title_2")}
            </h1>
            <p className="text-lg text-s-ink/60 dark:text-s-dm-text/60 max-w-lg mb-8">
              {t("hero_subtitle")}
            </p>
            <Link href={`/${locale}/onboarding/salon?utm_source=partner_page&utm_content=hero`}>
              <InteractiveHoverButton
                text={t("hero_cta")}
                className="w-auto px-8 py-4"
              />
            </Link>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-3">
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
                className="rounded-card shadow-warm-md"
                priority
              />
              {/* Phone mockup — overlapping bottom-right */}
              <div className="absolute -bottom-6 -right-4 sm:-right-8 w-28 sm:w-36">
                <Image
                  src="/images/partner/profile-mockup.png"
                  alt={t("alt_profile")}
                  width={180}
                  height={360}
                  className="rounded-card shadow-warm-md border-4 border-white dark:border-s-dm-surface"
                />
              </div>
            </div>

            {/* Floating value badges — desktop only */}
            <div className="hidden lg:flex absolute top-4 -left-2 bg-white dark:bg-s-dm-surface rounded-card px-3 py-2 shadow-warm-sm border border-s-ink/5 dark:border-s-dm-text/10 items-center gap-2" aria-hidden="true">
              <TrendingUp className="w-4 h-4 text-s-sage" />
              <span className="text-xs font-body font-medium text-s-ink dark:text-s-dm-text">{t("badge_bookings")}</span>
            </div>
            <div className="hidden lg:flex absolute bottom-12 -left-4 bg-white dark:bg-s-dm-surface rounded-card px-3 py-2 shadow-warm-sm border border-s-ink/5 dark:border-s-dm-text/10 items-center gap-2" aria-hidden="true">
              <Star className="w-4 h-4 text-s-yellow" />
              <span className="text-xs font-body font-medium text-s-ink dark:text-s-dm-text">{t("badge_rating")}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-16">
        <div className="text-center mb-10">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
            {t("features_title")}
          </h2>
          <p className="text-s-ink/60 dark:text-s-dm-text/60">
            {t("features_subtitle")}
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {FEATURES.map((f, i) => (
            <div key={i} className="p-5 rounded-card bg-s-bg-surface dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 hover:shadow-warm-sm transition-shadow duration-200">
              <div className="w-10 h-10 rounded-card bg-s-coral/10 flex items-center justify-center mb-3">
                <f.icon className="w-5 h-5 text-s-coral" />
              </div>
              <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text mb-1">{t(f.title)}</h3>
              <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 leading-relaxed">{t(f.desc)}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      <div className="py-16 bg-s-bg-surface dark:bg-s-dm-surface">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
              {t("cat_title")}
            </h2>
            <p className="text-s-ink/60 dark:text-s-dm-text/60">
              {t("cat_subtitle")}
            </p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { icon: Scissors, key: "cat_coiffeur" },
              { icon: UserPlus, key: "cat_barbershop" },
              { icon: Sparkles, key: "cat_nails" },
              { icon: Droplets, key: "cat_spa" },
              { icon: Star, key: "cat_makeup" },
              { icon: Zap, key: "cat_waxing" },
            ].map((cat) => (
              <div key={cat.key} className="p-5 rounded-card bg-white dark:bg-s-dm-bg border border-s-ink/5 dark:border-s-dm-text/10 hover:border-s-coral/20 hover:shadow-warm-sm transition-all duration-200">
                <cat.icon className="w-6 h-6 text-s-coral mb-3" />
                <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text mb-1">{t(`${cat.key}_title`)}</h3>
                <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 leading-relaxed">{t(`${cat.key}_desc`)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* How It Works */}
      <div className="py-16 bg-s-bg-surface dark:bg-s-dm-surface">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
              {t("hiw_title")}
            </h2>
            <p className="text-s-ink/60 dark:text-s-dm-text/60">
              {t("hiw_subtitle")}
            </p>
          </div>

          {/* Steps */}
          <div className="relative grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
            {/* Connecting line — horizontal on desktop */}
            <div className="hidden md:block absolute top-10 left-[16.6%] right-[16.6%] h-0.5 border-t-2 border-dashed border-s-coral/20" aria-hidden="true" />
            {/* Connecting line — vertical on mobile */}
            <div className="md:hidden absolute top-10 bottom-10 left-6 w-0.5 border-l-2 border-dashed border-s-coral/20" aria-hidden="true" />

            {/* Step 1 */}
            <div className="relative text-center md:text-center pl-16 md:pl-0">
              <div className="w-12 h-12 rounded-pill bg-s-coral text-white font-heading font-bold text-lg flex items-center justify-center mx-auto md:mx-auto absolute md:relative left-0 md:left-auto top-0 md:top-auto mb-4">
                1
              </div>
              <div className="mt-2 md:mt-4">
                <UserPlus className="w-6 h-6 text-s-coral mx-auto mb-2 hidden md:block" />
                <h3 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-1">
                  {t("hiw_step1_title")}
                </h3>
                <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-2">
                  {t("hiw_step1_desc")}
                </p>
                <span className="inline-block text-xs font-body font-medium text-s-coral bg-s-coral/10 px-3 py-1 rounded-pill">
                  {t("hiw_step1_time")}
                </span>
              </div>
            </div>

            {/* Step 2 */}
            <div className="relative text-center md:text-center pl-16 md:pl-0">
              <div className="w-12 h-12 rounded-pill bg-s-coral text-white font-heading font-bold text-lg flex items-center justify-center mx-auto md:mx-auto absolute md:relative left-0 md:left-auto top-0 md:top-auto mb-4">
                2
              </div>
              <div className="mt-2 md:mt-4">
                <Settings className="w-6 h-6 text-s-coral mx-auto mb-2 hidden md:block" />
                <h3 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-1">
                  {t("hiw_step2_title")}
                </h3>
                <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-2">
                  {t("hiw_step2_desc")}
                </p>
                <span className="inline-block text-xs font-body font-medium text-s-coral bg-s-coral/10 px-3 py-1 rounded-pill">
                  {t("hiw_step2_time")}
                </span>
              </div>
            </div>

            {/* Step 3 */}
            <div className="relative text-center md:text-center pl-16 md:pl-0">
              <div className="w-12 h-12 rounded-pill bg-s-coral text-white font-heading font-bold text-lg flex items-center justify-center mx-auto md:mx-auto absolute md:relative left-0 md:left-auto top-0 md:top-auto mb-4">
                3
              </div>
              <div className="mt-2 md:mt-4">
                <Zap className="w-6 h-6 text-s-coral mx-auto mb-2 hidden md:block" />
                <h3 className="font-heading font-semibold text-base text-s-ink dark:text-s-dm-text mb-1">
                  {t("hiw_step3_title")}
                </h3>
                <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 mb-2">
                  {t("hiw_step3_desc")}
                </p>
                <span className="inline-block text-xs font-body font-medium text-s-sage bg-s-sage/10 px-3 py-1 rounded-pill">
                  {t("hiw_step3_time")}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Social Proof — Trust Badges + Testimonials */}
      <div className="py-16 bg-white dark:bg-s-dm-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-10">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
              {t("social_title")}
            </h2>
            <p className="text-s-ink/60 dark:text-s-dm-text/60">
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
              <div key={badge.key} className="flex flex-col items-center text-center p-4 bg-s-bg-surface dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-s-dm-text/10">
                <badge.icon className="w-6 h-6 text-s-coral mb-2" />
                <span className="text-xs font-body font-semibold text-s-ink dark:text-s-dm-text">{t(badge.key)}</span>
              </div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {["testimonial_1", "testimonial_2", "testimonial_3"].map((key) => (
              <div key={key} className="bg-s-bg-surface dark:bg-s-dm-surface rounded-card p-6 border border-s-ink/5 dark:border-s-dm-text/10">
                <Quote className="w-5 h-5 text-s-coral/30 mb-3" />
                <p className="text-sm text-s-ink/70 dark:text-s-dm-text/70 leading-relaxed mb-4 italic">
                  &ldquo;{t(`${key}_quote`)}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-pill bg-s-coral/10 flex items-center justify-center">
                    <span className="text-xs font-heading font-bold text-s-coral">{t(`${key}_initial`)}</span>
                  </div>
                  <div>
                    <p className="text-sm font-body font-semibold text-s-ink dark:text-s-dm-text">{t(`${key}_name`)}</p>
                    <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">{t(`${key}_role`)}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Pricing */}
      <div className="py-16 bg-white dark:bg-s-dm-bg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          {/* Section header */}
          <div className="text-center mb-12">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
              {t("pricing_title")}
            </h2>
            <p className="text-s-ink/60 dark:text-s-dm-text/60 max-w-2xl mx-auto">
              {t("pricing_subtitle")}
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Left — Pricing Card */}
            <div className="bg-white dark:bg-s-dm-surface border border-s-ink/5 dark:border-s-dm-text/10 rounded-card shadow-warm-md p-8 relative overflow-hidden">
              {/* Badge */}
              <div className="absolute top-4 right-4 bg-s-coral/10 text-s-coral text-xs font-body font-semibold px-3 py-1 rounded-pill">
                {t("pricing_badge")}
              </div>

              {/* Price */}
              <p className="text-sm font-body text-s-ink/50 dark:text-s-dm-text/50 mb-1">{t("pricing_label")}</p>
              <div className="flex items-baseline gap-2 mb-1">
                <span className="font-heading font-bold text-4xl text-s-coral">1%</span>
                <span className="text-s-ink/50 dark:text-s-dm-text/50 text-sm">{t("pricing_per_booking")}</span>
              </div>
              <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-6">{t("pricing_no_fixed")}</p>

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
                    <Check className="w-4 h-4 text-s-sage mt-0.5 shrink-0" />
                    <span className="text-sm text-s-ink/80 dark:text-s-dm-text/80">{t(key)}</span>
                  </li>
                ))}
              </ul>
            </div>

            {/* Right — Competitor Comparison Chart */}
            <div className="bg-s-bg-surface dark:bg-s-dm-surface rounded-card p-8">
              <h3 className="font-heading font-semibold text-lg text-s-ink dark:text-s-dm-text mb-6">
                {t("compare_title")}
              </h3>

              {/* Bar chart — CSS only */}
              <div className="space-y-6">
                {/* Solen */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body font-semibold text-s-coral">solen.ch</span>
                    <span className="text-sm font-body font-bold text-s-coral">1%</span>
                  </div>
                  <div className="h-8 w-full bg-s-ink/5 dark:bg-s-dm-text/5 rounded-btn overflow-hidden">
                    <div
                      className="h-full bg-s-coral rounded-btn"
                      style={{ width: "3.3%" }}
                    />
                  </div>
                </div>

                {/* Treatwell */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body text-s-ink/60 dark:text-s-dm-text/60">{t("compare_treatwell")}</span>
                    <span className="text-sm font-body font-bold text-s-ink/60 dark:text-s-dm-text/60">~30%</span>
                  </div>
                  <div className="h-8 w-full bg-s-ink/5 dark:bg-s-dm-text/5 rounded-btn overflow-hidden">
                    <div
                      className="h-full bg-s-ink/20 dark:bg-s-dm-text/20 rounded-btn"
                      style={{ width: "100%" }}
                    />
                  </div>
                </div>

                {/* Others */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-body text-s-ink/60 dark:text-s-dm-text/60">{t("compare_others")}</span>
                    <span className="text-sm font-body font-bold text-s-ink/60 dark:text-s-dm-text/60">15–25%</span>
                  </div>
                  <div className="h-8 w-full bg-s-ink/5 dark:bg-s-dm-text/5 rounded-btn overflow-hidden">
                    <div
                      className="h-full bg-s-ink/15 dark:bg-s-dm-text/15 rounded-btn"
                      style={{ width: "66%" }}
                    />
                  </div>
                </div>
              </div>

              {/* Savings callout */}
              <div className="mt-8 p-4 bg-s-sage/10 rounded-card border border-s-sage/20">
                <p className="text-sm text-s-sage-text dark:text-s-sage font-body">
                  <span className="font-semibold">{t("compare_savings_bold")}</span>{" "}
                  {t("compare_savings_text")}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* FAQ — Swipable Cards */}
      <div className="py-16 bg-s-bg-surface dark:bg-s-dm-bg">
        <div className="max-w-6xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-8">
            <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
              {t("faq_title")}
            </h2>
            <p className="text-s-ink/60 dark:text-s-dm-text/60">
              {t("faq_subtitle")}
            </p>
          </div>

          {/* Scrollable card row */}
          <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory pb-4 -mx-4 px-4 scrollbar-hide">
            {FAQ_KEYS.map((key, i) => (
              <button
                key={key}
                onClick={() => setExpandedFaq(expandedFaq === i ? null : i)}
                className={`snap-start shrink-0 w-72 sm:w-80 text-left rounded-card border transition-all duration-300 ${
                  expandedFaq === i
                    ? "bg-white dark:bg-s-dm-surface border-s-coral/30 shadow-warm-md"
                    : "bg-white dark:bg-s-dm-surface border-s-ink/5 dark:border-s-dm-text/10 shadow-warm-sm hover:shadow-warm-md hover:border-s-coral/20"
                }`}
              >
                <div className="p-6">
                  <div className="flex items-start justify-between gap-3">
                    <h3 className="font-heading font-semibold text-sm text-s-ink dark:text-s-dm-text leading-snug">
                      {t(`${key}_q`)}
                    </h3>
                    <ChevronDown
                      className={`w-4 h-4 shrink-0 text-s-ink/30 dark:text-s-dm-text/30 transition-transform duration-300 ${
                        expandedFaq === i ? "rotate-180 text-s-coral" : ""
                      }`}
                    />
                  </div>
                  <div
                    className={`overflow-hidden transition-all duration-300 ${
                      expandedFaq === i ? "max-h-48 opacity-100 mt-4" : "max-h-0 opacity-0"
                    }`}
                  >
                    <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60 leading-relaxed">
                      {t(`${key}_a`)}
                    </p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
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
              name: t(`${key}_q`),
              acceptedAnswer: {
                "@type": "Answer",
                text: t(`${key}_a`),
              },
            })),
          }),
        }}
      />

      {/* CTA */}
      <div className="bg-gradient-to-b from-s-bg-surface to-s-coral/5 dark:from-s-dm-surface dark:to-s-coral/10 py-20">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="font-heading font-bold text-2xl sm:text-3xl text-s-ink dark:text-s-dm-text mb-3">
            {t("cta_title")}
          </h2>
          <p className="text-s-ink/50 dark:text-s-dm-text/50 mb-8">
            {t("cta_subtitle")}
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link href={`/${locale}/onboarding/salon?utm_source=partner_page&utm_content=bottom_cta`}>
              <InteractiveHoverButton
                text={t("cta_button")}
                className="w-auto px-8 py-4"
              />
            </Link>
            <a
              href={`mailto:info@solen.ch?subject=${encodeURIComponent(t("cta_consult_subject"))}`}
              className="text-sm font-body font-medium text-s-coral hover:text-s-coral-dark transition-colors underline underline-offset-4"
            >
              {t("cta_consult")}
            </a>
          </div>
          <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mt-6">
            {t("cta_counter")}
          </p>
        </div>
      </div>
    </div>
  );
}
