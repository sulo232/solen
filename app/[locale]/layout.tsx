import Image from "next/image";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, unstable_setRequestLocale } from "next-intl/server";
import { locales } from "@/i18n";
import { PostHogProvider } from "@/components-legacy/PostHogProvider";
// V3-D195 (2026-05-26): primitives Toast singleton + portal. The legacy
// ToastProvider (components-legacy/ui/Toast) has been retired — all callers now
// import `{ toast }` from this module and fire `toast.success("…")` / `toast.error("…")`
// from anywhere (module-level singleton, no provider needed). The `<Toaster />`
// portal below is the only mount required.
import { Toaster } from "./_components/primitives/Toast";
import Header from "./_components/layout/Header";
import Footer from "./_components/layout/Footer";
import HideInBooking from "./_components/layout/HideInBooking";
import OfflineBanner from "./_components/layout/OfflineBanner";
// V3-D348 (tweak #3): CityTopBar retired — city control moved into the Header
// as a single responsive "Basel" location pill (DesktopCitySelector). File kept on
// disk for revert.
// BottomTabBar import removed 2026-05-03 per Q58 (deprecated for web rendering).
// Keep file at components/layout/BottomTabBar.tsx for future PWA mount.
// import BottomTabBar from "@/components-legacy/layout/BottomTabBar";
// Legacy CookieBanner replaced by V3 CookieConsentProvider (§F.8) which
// auto-mounts the banner + provides useCookieConsent hook. Original at
// components-legacy/ui/CookieBanner.tsx kept until next sweep.
import { CookieConsentProvider } from "./_components/primitives/CookieConsent";
import PWAInstallPrompt from "@/components-legacy/ui/PWAInstallPrompt";
import TosPrompt from "@/components-legacy/auth/TosPrompt";
import TOSUpdateBanner from "@/components-legacy/global/TOSUpdateBanner";
import Breadcrumb from "@/components-legacy/ui/Breadcrumb";
import PageTransitionWrapper from "@/components-legacy/layout/PageTransitionWrapper";
import MotionProvider from "@/components-legacy/layout/MotionProvider";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

export default async function LocaleLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  // next-intl v3: establish the request locale so getMessages() + the client provider
  // resolve the URL locale for client components (without this, requestLocale falls back
  // to the de default and every en/fr/it client component renders German).
  unstable_setRequestLocale(locale);
  const messages = await getMessages();

  return (
    <MotionProvider>
    <NextIntlClientProvider messages={messages}>
      <PostHogProvider>
        <CookieConsentProvider>
          {/* Skip-to-content: first focusable element for keyboard users.
              V3-D312 (W9 follow-up): retired focus:bg-s-ink → focus:bg-s-ink per LOCKFILE §0 rule 2 (primary CTA = ink). */}
          <a
            href="#main-content"
            className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[100] focus:px-4 focus:py-2 focus:bg-s-ink focus:text-white focus:rounded-btn focus:shadow-elevation-2 focus:text-sm focus:font-medium"
          >
            Zum Inhalt springen
          </a>
          {/* V3-D92 (2026-05-21): Hims-style top promo banner — dimensions
              measured from live hims.com mobile @ 393 viewport via Playwright
              getBoundingClientRect:
                - banner total height: 44px
                - padding: 12px vertical, 16px horizontal
                - text: 12px / weight 600 (semibold)
              Solen uses royal blue bg + white text (vs Hims peach bg + ink text).
              Copy is PLACEHOLDER — swap with real promo / feature copy when ready. */}
          {/* V3-D97 (2026-05-22): banner uses Hims-style concave-bottom pattern.
              Reference IMG_4306.jpeg measured via screenshot-spec canvas pixel sampling
              (spec: _audits/screenshots/hims-banner-ref/spec.md):
                - Banner total height at corners: ~63 CSS px (190 image px / 3× DPR)
                - Banner flat-bottom height at center: ~52 CSS px (156 image px / 3×)
                - Curve depth: ~12 CSS px → matches `rounded-xl` (12px)
              Shape is NOT `rounded-b-X` — that chops corners INWARD. The correct
              pattern: peach is a square-cornered rectangle, and a white absolute-
              positioned strip with `rounded-t-xl` overlaps the bottom, creating the
              concave "tucked tab" effect where the white page scoops UP into the
              banner's center while corners hang lower. Two prior attempts (floating
              pill, then rounded-b-2xl) were eyeballed and went the wrong way; this
              fix uses measured pixel data from the reference. */}
          {/* V3-D125 (2026-05-24): top promo banner ("Sofort verfügbar · 320
              Buchungen heute" + "Salons finden" pill on bg-s-ink strip with
              concave scoop) REMOVED per user. Full history:
                V3-D111 — was bg-s-ink orange strip
                V3-D119 — flipped to bg-s-ink dark strip
                V3-D125 — fully removed.
              To revive: pull the deleted block from git history (last seen
              in layout.tsx at HEAD~1, lines 85-109). */}
          {/* V3-D348 (tweak #3): the redundant CityTopBar row is retired —
              the city control is now a single "Basel" location pill inside the
              Header (DesktopCitySelector, made responsive). Reclaims the top
              strip and removes the duplicate-Basel + mystery-arrow clutter.
              Header carries showOnAuth so login + register keep the global
              Solen wordmark + hamburger. */}
          <HideInBooking showOnAuth coverSalonDetail>
            <Header locale={locale} />
          </HideInBooking>
          <PageTransitionWrapper>
            <main id="main-content" tabIndex={-1} className="pb-[env(safe-area-inset-bottom)] isolate">
              <HideInBooking coverSalonDetail>
                <Breadcrumb />
              </HideInBooking>
              {children}
            </main>
          </PageTransitionWrapper>
          {/* V2-D46 (2026-05-09): V3 Footer mounted at locale-layout level
              so it renders site-wide (not just homepage). Replaces the
              legacy components-legacy/layout/Footer.tsx which was never
              mounted in the V3 rebuild. */}
          <HideInBooking hideOnFeed hideOnDashboard>
            <Footer locale={locale} />
          </HideInBooking>
          {/* BottomTabBar removed from web rendering 2026-05-03 per Q58
              ("No bottom nav (web-only decision); bottom-nav components
              deprecated for web rendering. Mobile native/PWA can re-introduce
              bottom nav later"). Component file preserved at
              `components/layout/BottomTabBar.tsx` for the future PWA path.
              FloatingNavPill was already removed; BottomTabBar mount was the
              second resurrection that page-level verifier caught. */}
          {/* CookieConsentProvider auto-mounts the banner; placed at provider
              level so analytics / marketing consent is queryable everywhere. */}
          <PWAInstallPrompt />
          <TosPrompt />
          <TOSUpdateBanner />
        </CookieConsentProvider>
        {/* V3-D195: primitives Toaster portal — the single mount for the
            toast.success()/toast.error() module-singleton API. */}
        <Toaster />
        {/* Mockup 10 offline, as a connectivity banner (see OfflineBanner.md) */}
        <OfflineBanner />
      </PostHogProvider>
    </NextIntlClientProvider>
    </MotionProvider>
  );
}
