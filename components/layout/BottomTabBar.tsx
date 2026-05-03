"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Home, Compass, Search, User, X } from "lucide-react";
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
  const tAuth = useTranslations("auth") as any;

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
          paddingBottom: "max(16px,env(safe-area-inset-bottom))",
          // Liquid glass
          background: "var(--glass-bg)",
          backdropFilter: "blur(20px) saturate(180%)",
          WebkitBackdropFilter: "blur(20px) saturate(180%)",
          borderTop: "1px solid rgba(26,18,9,0.07)",
          boxShadow: "0 -1px 0 rgba(26,18,9,0.04), 0 -8px 32px rgba(26,18,9,0.06)",
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
                className="relative flex-1 flex flex-col items-center justify-center gap-1 min-h-[44px]"
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
                      isActive ? "text-s-coral" : "text-s-ink/40"
                    )}
                    strokeWidth={isActive ? 2.2 : 1.7}
                  />
                </motion.div>

                {/* Label */}
                <span className={cn(
                  "text-[10px] font-heading tracking-[.03em] leading-none transition-colors duration-150",
                  isActive ? "text-s-coral" : "text-s-ink/40"
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
                boxShadow: "0 -4px 40px rgba(26,18,9,0.14)",
              }}
              role="dialog"
              aria-modal="true"
            >
              {/* Handle */}
              <div className="w-9 h-1 rounded-full bg-s-ink/15 mx-auto mb-6" aria-hidden="true" />

              {/* Close */}
              <button
                onClick={() => setLoginSheet(s => ({ ...s, open: false }))}
                aria-label={tAuth("close")}
                className="absolute top-4 right-4 w-11 h-11 flex items-center justify-center rounded-full bg-s-bg-surface hover:bg-s-ink/[0.08] transition-colors"
              >
                <X size={15} className="text-s-ink/60" />
              </button>

              <h2 className="font-heading text-xl text-s-ink mb-1">
                {t("loginCta") ?? "Jetzt anmelden"}
              </h2>
              <p className="text-sm font-body text-s-ink/60 mb-7 leading-snug">
                {contextMessage}
              </p>

              {/* Google login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-btn border border-s-ink/[0.08] text-sm font-heading text-s-ink hover:border-s-ink/40 hover:bg-white active:scale-[0.97] transition-[transform,filter] duration-150 mb-3"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09A6.97 6.97 0 015.48 12c0-.72.12-1.43.35-2.09V7.07H2.18A11.96 11.96 0 001 12c0 1.93.46 3.76 1.18 5.43l3.66-2.84z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                {tAuth("google_login")}
              </button>

              {/* Email login link */}
              <Link
                href={`/${locale}/auth/login`}
                onClick={() => setLoginSheet(s => ({ ...s, open: false }))}
                className="w-full flex items-center justify-center py-3.5 rounded-btn bg-s-coral text-white text-sm font-heading active:scale-[0.97] transition-[transform,filter,border-color,background-color] duration-150"
                style={{ boxShadow: "0 2px 12px rgba(232,98,74,.32)" }}
              >
                {tAuth("continue_with_email")}
              </Link>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
