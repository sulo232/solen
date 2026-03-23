"use client";

import { useState, useEffect } from "react";
import { createBrowserSupabaseClient } from "@/lib/supabase";
import { CURRENT_TOS_VERSION } from "@/lib/tos-version";
import Link from "next/link";
import { AlertCircle, X } from "lucide-react";

export default function TOSUpdateBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [isAccepting, setIsAccepting] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const checkTOS = async () => {
      const supabase = createBrowserSupabaseClient();
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session?.user) return;
      
      const { data: profile } = await supabase
        .from("profiles")
        .select("tos_accepted_version")
        .eq("id", session.user.id)
        .single();

      if (profile && profile.tos_accepted_version !== CURRENT_TOS_VERSION) {
        setUserId(session.user.id);
        setIsVisible(true);
      }
    };

    checkTOS();
  }, []);

  const handleAccept = async () => {
    try {
      setIsAccepting(true);
      const res = await fetch("/api/tos/accept", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ version: CURRENT_TOS_VERSION })
      });

      if (res.ok) {
        setIsVisible(false);
      } else {
        console.error("Failed to accept TOS");
        setIsAccepting(false);
      }
    } catch (err) {
      console.error("Error accepting TOS:", err);
      setIsAccepting(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-s-coral text-white px-4 py-3 shadow-md print:hidden">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 relative pr-8 sm:pr-0">
        <div className="flex items-center gap-3 text-sm font-medium">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <p>
            Wir haben unsere Nutzungsbedingungen (AGB) und Datenschutzerklärung aktualisiert. / 
            We have updated our Terms of Service and Privacy Policy.
          </p>
        </div>
        
        <div className="flex items-center gap-3 shrink-0">
          <Link 
            href="/terms" 
            className="text-white/80 hover:text-white underline text-sm transition-colors"
          >
            Lesen / Read
          </Link>
          <button
            onClick={handleAccept}
            disabled={isAccepting}
            className="bg-white text-s-coral px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-white/90 transition-colors disabled:opacity-50"
          >
            {isAccepting ? "Wird akzeptiert..." : "Akzeptieren / Accept"}
          </button>
        </div>

        {/* Optional close button if we want to allow ignoring it for the current session - but legally it might be better to force it */}
        {/* <button onClick={() => setIsVisible(false)} className="absolute right-0 top-0 sm:static p-1 text-white/80 hover:text-white transition-colors">
          <X className="w-4 h-4" />
        </button> */}
      </div>
    </div>
  );
}
