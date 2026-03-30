"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { Compass, Search, Bookmark, User, X, Chrome } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import type { Session } from "@supabase/supabase-js";

const TABS = [
  { key: "discover", href: "/discover", Icon: Compass, requiresAuth: false },
  { key: "search",   href: "/search",   Icon: Search,  requiresAuth: false },
  { key: "saved",    href: "/account/saved", Icon: Bookmark, requiresAuth: true },
  { key: "account",  href: "/profile",  Icon: User,    requiresAuth: true },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function BottomTabBar() {
  const pathname = usePathname();
  const locale = useLocale();
  const t = useTranslations("navigation") as any;

  const [session, setSession] = useState<Session | null>(null);
  const [loginSheet, setLoginSheet] = useState<{ open: boolean; context: TabKey }>({ open: false, context: "saved" });

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

  const handleTabClick = (key: TabKey, requiresAuth: boolean, e: React.MouseEvent) => {
    if (requiresAuth && !session) {
      e.preventDefault();
      setLoginSheet({ open: true, context: key });
    }
  };

  const handleGoogleLogin = () => {
    const supabase = createBrowserSupabaseClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${window.location.origin}/api/auth/callback` },
    });
  };

  const contextMessage = loginSheet.context === "saved"
    ? t("loginToSave") ?? "Melde dich an, um Salons zu speichern"
    : t("loginToProfile") ?? "Melde dich an, um dein Profil zu sehen";

  return (
    <>
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 md:hidden glass-frost border-t border-white/20 dark:border-s-dm-text/10"
        style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
        aria-label={t("mobileNavigation") ?? "Navigation"}
      >
        <div className="flex items-stretch h-[58px]">
          {TABS.map(({ key, href, Icon, requiresAuth }) => {
            const fullHref = `/${locale}${href}`;
            const isActive = pathname === fullHref || pathname.startsWith(fullHref + "/");
            return (
              <Link
                key={key}
                href={fullHref}
                onClick={(e) => handleTabClick(key, requiresAuth, e)}
                className={cn(
                  "relative flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[44px] transition-colors duration-150",
                  isActive ? "text-s-coral" : "text-s-ink/45 dark:text-s-dm-text/45 hover:text-s-ink/70"
                )}
                aria-label={t(key as any)}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="w-5 h-5" strokeWidth={isActive ? 2.2 : 1.6} />
                <span className={cn(
                  "text-[10px] font-heading font-semibold tracking-[.04em] leading-none",
                  isActive ? "text-s-coral" : "text-s-ink/40 dark:text-s-dm-text/40"
                )}>
                  {t(key as any)}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Login prompt sheet */}
      <AnimatePresence>
        {loginSheet.open && (
          <>
            <motion.div
              key="login-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18 }}
              className="fixed inset-0 z-[60] bg-s-ink/30 dark:bg-black/50 backdrop-blur-[2px]"
              onClick={() => setLoginSheet(s => ({ ...s, open: false }))}
              aria-hidden="true"
            />
            <motion.div
              key="login-sheet"
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
              className="fixed bottom-0 inset-x-0 z-[61] bg-white dark:bg-s-dm-surface rounded-t-[24px] px-6 pb-10 pt-4"
              style={{ boxShadow: "0 -4px 32px rgba(0,0,0,.12)" }}
              role="dialog"
              aria-modal="true"
            >
              {/* Handle */}
              <div className="w-9 h-1 rounded-full bg-s-ink/15 dark:bg-white/15 mx-auto mb-5" aria-hidden="true" />

              {/* Close */}
              <button
                onClick={() => setLoginSheet(s => ({ ...s, open: false }))}
                aria-label="Schliessen"
                className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center rounded-full hover:bg-s-ink/[0.06] dark:hover:bg-white/[0.06] transition-colors"
              >
                <X size={16} className="text-s-ink/50 dark:text-s-dm-text/50" />
              </button>

              <h2 className="font-heading font-bold text-lg text-s-ink dark:text-s-dm-text mb-1">
                {t("loginCta") ?? "Jetzt anmelden"}
              </h2>
              <p className="text-sm font-body text-s-ink/55 dark:text-s-dm-text/55 mb-6">
                {contextMessage}
              </p>

              {/* Google login */}
              <button
                onClick={handleGoogleLogin}
                className="w-full flex items-center justify-center gap-3 py-3.5 rounded-btn border border-s-ink/12 dark:border-white/12 text-sm font-heading font-semibold text-s-ink dark:text-s-dm-text hover:border-s-ink/25 dark:hover:border-white/25 hover:brightness-[0.98] active:scale-[0.98] transition-all mb-3"
              >
                <Chrome size={18} className="text-s-coral" aria-hidden="true" />
                Mit Google anmelden
              </button>

              {/* Email login link */}
              <Link
                href={`/${locale}/auth/login`}
                onClick={() => setLoginSheet(s => ({ ...s, open: false }))}
                className="w-full flex items-center justify-center py-3.5 rounded-btn bg-s-coral text-white text-sm font-heading font-bold hover:brightness-[1.06] active:scale-[0.98] transition-[transform,filter] duration-150"
                style={{ boxShadow: "0 2px 6px rgba(232,98,74,.30)" }}
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
