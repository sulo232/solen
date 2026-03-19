"use client";

import { useEffect, useState, useRef } from "react";
import { X, Download, Share } from "lucide-react";

const STORAGE_KEY = "solen_pwa_prompt_seen";
const BOOKING_KEY = "solen_has_booked";

/**
 * PWA install prompt — shown after first successful booking.
 * Uses `beforeinstallprompt` on Chrome/Android, shows manual instructions on iOS.
 */
export default function PWAInstallPrompt() {
  const [show, setShow] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const deferredPrompt = useRef<any>(null);

  useEffect(() => {
    // Don't show if already seen or no booking yet
    if (localStorage.getItem(STORAGE_KEY)) return;
    if (!localStorage.getItem(BOOKING_KEY)) return;

    // Check if already installed
    if (window.matchMedia("(display-mode: standalone)").matches) return;

    // Detect iOS
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream;
    setIsIOS(ios);

    if (ios) {
      // iOS: show manual instructions
      setShow(true);
      return;
    }

    // Chrome/Android: listen for beforeinstallprompt
    const handler = (e: Event) => {
      e.preventDefault();
      deferredPrompt.current = e;
      setShow(true);
    };

    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleInstall = async () => {
    if (deferredPrompt.current) {
      deferredPrompt.current.prompt();
      await deferredPrompt.current.userChoice;
    }
    dismiss();
  };

  const dismiss = () => {
    localStorage.setItem(STORAGE_KEY, "1");
    setShow(false);
  };

  if (!show) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 animate-in slide-in-from-bottom-4">
      <div className="bg-white dark:bg-s-dm-surface rounded-card shadow-lg border border-s-ink/5 dark:border-white/10 p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-s-coral/10 flex items-center justify-center shrink-0">
              <Download className="w-5 h-5 text-s-coral" />
            </div>
            <div>
              <p className="font-heading font-semibold text-sm text-dark dark:text-s-dm-text">
                Installiere Solen
              </p>
              <p className="text-xs text-dark/50 dark:text-s-dm-text/50 mt-0.5">
                Für schnelle Buchungen und Erinnerungen
              </p>
            </div>
          </div>
          <button onClick={dismiss} className="text-dark/30 hover:text-dark/60 p-1">
            <X className="w-4 h-4" />
          </button>
        </div>

        {isIOS ? (
          <div className="mt-3 flex items-center gap-2 text-xs text-dark/60 dark:text-s-dm-text/60 bg-s-bg-surface dark:bg-white/5 rounded-button p-2.5">
            <Share className="w-4 h-4 shrink-0 text-s-coral" />
            <span>Tippe auf <strong>Teilen</strong> → <strong>Zum Home-Bildschirm</strong></span>
          </div>
        ) : (
          <button
            onClick={handleInstall}
            className="mt-3 w-full py-2 bg-s-coral text-white text-sm font-medium rounded-button hover:bg-s-coral/90 transition-colors"
          >
            App installieren
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Call this after a successful booking to enable the PWA prompt.
 */
export function markFirstBooking() {
  if (typeof window !== "undefined") {
    localStorage.setItem(BOOKING_KEY, "1");
  }
}
