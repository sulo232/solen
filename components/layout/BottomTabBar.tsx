"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Home, Compass, Search, User, X, Chrome } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

const TABS = [
  { key: "home",     href: "/",         Icon: Home,    requiresAuth: false },
  { key: "discover", href: "/discover", Icon: Compass, requiresAuth: false },
  { key: "search",   href: "/search",   Icon: Search,  requiresAuth: false },
  { key: "account",  href: "/profile",  Icon: User,    requiresAuth: true },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function BottomTabBar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation") as any;

  const [session, setSession] = useState<Session | null>(null);
  const [loginSheet, setLoginSheet] = useState<{ open: boolean; context: TabKey }>({ open: false, context: "account" });
  const [tappedKey, setTappedKey] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  // Hide on dashboard + auth + booking pages
  const isHidden =
    pathname.includes("/dashboard") ||
    pathname.includes("/auth/") ||
    pathname.includes("/booking/");

  if (isHidden) return null;

  const handleTabClick = (key: TabKey, requiresAuth: boolean, isActive: boolean, e: React.MouseEvent) => {
    // Trigger tap animation
    setTappedKey(key);
    setTimeout(() => setTappedKey(null), 300);

    if (requiresAuth && !session) {
      e.preventDefault();
      setLoginSheet({ open: true, context: key });
      return;
    }
    if (isActive) {
      e.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleGoogleLogin = () => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  const contextMessage = t("loginToProfile") ?? "Melde dich an, um dein Profil zu sehen";

  return (
    <>
      {/* ── Bottom Nav ── */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden"
        style={{
          paddingBottom: "env(safe-area-inset-bottom)",
          // Liquid glass
          background: "rgba(255,255,255,0.82)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "1px solid rgba(0,0,0,0.07)",
          boxShadow: "0 -1px 0 rgba(0,0,0,0.04), 0 -8px 32px rgba(0,0,0,0.06)",
        }}
        aria-label={t("mobileNavigation") ?? "Navigation"}
      >
        <div className="flex items-stretch h-[60px]">
          {TABS.map(({ key, href, Icon, requiresAuth }) => {
            const fullHref = href === "/" ? `/${locale}` : `/${locale}${href}`;
            const isActive = href === "/"
              ? pathname === `/${locale}` || pathname === `/${locale}/`
              : pathname === fullHref || pathname.startsWith(fullHref + "/");
            const isTapped = tappedKey === key;

            return (
              <Link
                key={key}
                href={fullHref}
                onClick={(e) => handleTabClick(key, requiresAuth, isActive, e)}
                className="relative flex-1 flex flex-col items-center justify-center gap-[3px] min-h-[44px]"
                aria-label={t(key as any)}
                aria-current={isActive ? "page" : undefined}
                style={{ WebkitTapHighlightColor: "transparent" }}
              >
                {/* Icon with spring scale */}
                <motion.div
                  animate={{
                    scale: isTapped ? 0.82 : isActive ? 1.08 : 1,
                    y: isActive ? -1 : 0,
                  }}
                  transition={{
                    type: "spring",
                    stiffness: 500,
                    damping: 28,
                    mass: 0.6,
                  }}
                  className="flex items-center justify-center"
                >
                  <Icon
                    className={cn(
                      "w-[22px] h-[22px] transition-colors duration-150",
                      isActive ? "text-s-coral" : "text-[#8A8A8A]"
                    )}
                    strokeWidth={isActive ? 2.2 : 1.7}
                  />
                </motion.div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] font-heading font-semibold tracking-[.03em] leading-none transition-colors duration-150",
                  isActive ? "text-s-coral" : "text-[#8A8A8A]"
                )}>
                  {t(key as any)}
                </span>

                {/* Active dot */}
                <AnimatePresence>
                  {isActive && (
                    <motion.div
                      key="dot"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 600, damping: 30 }}
                      className="absolute bottom-[7px] left-1/2 -translate-x-1/2 w-[5px] h-[5px] rounded-full bg-s-coral"
                      aria-hidden="true"
                    />
                  )}
                </AnimatePresence>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* ── Login prompt sheet ── */}
      <AnimatePresence>
        {loginSheet.open && (
          <>
            <motion.div
              key="login-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] bg-black/30"
              style={{ backdropFilter: "blur(3px)", WebkitBackdropFilter: "blur(3px)" }}
              onClick={() => setLoginSheet(s => ({ ...s, open: false }))}
              aria-hidden="true"
            />
            <motion.div
              key="login-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.34, ease: [0.32, 0.72, 0, 1] }}
              className="fixed bottom-0 inset-x-0 z-[61] bg-white rounded-t-[28px] px-6 pt-4"
              style={{
                paddingBottom: "calc(env(safe-area-inset-bottom) + 32px)",
                boxShadow: "0 -4px 40px rgba(0,0,0,.14)",
              }}
              role="dialog"
              aria-modal="true"
            >
              {/* Handle */}
              <div className="w-9 h-1 rounded-full bg-[#E4E4E4] mx-auto mb-6" aria-hidden="true" />

              {/* Close */}
              <button
                onClick={() => setLoginSheet(s => ({ ...s, open: false }))}
                aria-label="Schliessen"
                className="absolute top-4 right-4 w-9 h-9 flex items-center justify-center rounded-full bg-[#F5F5F5] hover:bg-[#ECECEC] transition-colors"
              >
                <X size={15} className="text-[#717171]" />
              </button>

              <h2 className="font-heading font-bold text-[20px] text-[#1A1A1A] mb-1">
                {t("loginCta") ?? "Jetzt anmelden"}
              </h2>
              <p className="text-[14px] font-body text-[#717171] mb-7 leading-snug">
                {contextMessage}
              </p>

              {/* Google login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-btn border border-[#EBEBEB] text-[14px] font-heading font-semibold text-[#222222] hover:border-[#AAAAAA] hover:bg-[#FAFAFA] active:scale-[0.98] transition-all mb-3"
              >
                <Chrome size={18} className="text-s-coral" aria-hidden="true" />
                Mit Google anmelden
              </button>

              {/* Email login link */}
              <Link
                href={`/${locale}/auth/login`}
                onClick={() => setLoginSheet(s => ({ ...s, open: false }))}
                className="w-full flex items-center justify-center py-3.5 rounded-btn bg-s-coral text-white text-[14px] font-heading font-bold active:scale-[0.98] transition-all duration-150"
                style={{ boxShadow: "0 2px 12px rgba(232,98,74,.32)" }}
              >
                Mit E-Mail anmelden
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
