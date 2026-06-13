"use client";

// Fires a one-shot "Willkommen zurück" toast on the page the user lands on
// AFTER a successful login. Login does a full-page navigation
// (window.location.href), which destroys the in-memory toast store — so the
// toast can't fire in the SignIn form. Instead SignIn sets WELCOME_FLAG in
// sessionStorage at the moment of success; this component, mounted once at the
// root next to <Toaster />, reads + clears it on the destination and greets.
//
// sessionStorage survives same-tab navigations (including the OAuth round-trip
// to Google/Apple and back), so one flag covers email/password + social login.
// A session check guards against a cancelled OAuth leaving a stale flag.

import * as React from "react";
import { useTranslations } from "next-intl";
import { Heart } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import { toast } from "./Toast";

/** sessionStorage key handshake between SignIn (setter) and WelcomeToast (reader). */
export const WELCOME_FLAG = "solen:welcome";

export default function WelcomeToast() {
  const t = useTranslations("toasts");
  const message = t("welcomeBack");

  React.useEffect(() => {
    if (typeof window === "undefined") return;

    let flag: string | null = null;
    try {
      flag = window.sessionStorage.getItem(WELCOME_FLAG);
    } catch {
      // sessionStorage can throw in private mode / blocked storage — no greeting.
      return;
    }
    if (flag !== "1") return;

    // Clear immediately so a refresh / re-mount never re-fires the greeting.
    try {
      window.sessionStorage.removeItem(WELCOME_FLAG);
    } catch {
      /* best-effort */
    }

    // Confirm a real session before greeting (a cancelled OAuth can leave the
    // flag set without a login actually completing).
    const supabase = createBrowserSupabaseClient();
    supabase.auth
      .getSession()
      .then(({ data }) => {
        // Warm "welcome back" treatment: a heart glyph in a cinnamon (burnt-amber)
        // circle badge instead of the clinical green check. Tone stays `success`
        // (polite aria-live + dismiss timing); only the icon + badge tint change.
        if (data.session)
          toast.success(message, {
            icon: Heart,
            iconClassName: "bg-s-urgency-bg text-s-urgency",
          });
      })
      .catch((err) => console.error("[WelcomeToast] session check failed:", err));
  }, [message]);

  return null;
}
