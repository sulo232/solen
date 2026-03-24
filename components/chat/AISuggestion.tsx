"use client";

import { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Check, X, Loader2 } from "lucide-react";

interface AISuggestionProps {
  conversationId: string;
  salonName: string;
  salonServices: string[];
  lastCustomerMessage: string | null;
  onAccept: (text: string) => void;
  visible: boolean;
}

export default function AISuggestion({
  conversationId,
  salonName,
  salonServices,
  lastCustomerMessage,
  onAccept,
  visible,
}: AISuggestionProps) {
  const [suggestion, setSuggestion] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [dismissed, setDismissed] = useState(false);
  const lastMsgRef = useRef<string | null>(null);

  useEffect(() => {
    if (!visible || !lastCustomerMessage || lastCustomerMessage === lastMsgRef.current) return;
    setDismissed(false);

    const timeout = setTimeout(async () => {
      lastMsgRef.current = lastCustomerMessage;
      setLoading(true);
      setSuggestion(null);

      try {
        const res = await fetch("/api/chat/suggest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            customerMessage: lastCustomerMessage,
            salonName,
            salonServices,
          }),
        });

        if (res.status === 204 || !res.ok) {
          setSuggestion(null);
          return;
        }

        const data = await res.json();
        if (data.suggestion) setSuggestion(data.suggestion);
      } catch {
        setSuggestion(null);
      } finally {
        setLoading(false);
      }
    }, 1000); // debounce 1s

    return () => clearTimeout(timeout);
  }, [lastCustomerMessage, visible, salonName, salonServices]);

  const show = visible && !dismissed && (loading || !!suggestion);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.2 }}
          className="mx-4 mb-2 bg-s-blue-subtle dark:bg-s-blue/10 border border-s-blue/20 dark:border-s-blue/30 rounded-card p-3"
        >
          {loading ? (
            <div className="flex items-center gap-2 text-s-blue dark:text-s-blue text-sm">
              <Loader2 size={14} className="animate-spin" />
              <span>Antwort wird vorgeschlagen…</span>
            </div>
          ) : suggestion ? (
            <div>
              <p className="text-sm text-s-ink dark:text-s-dm-text mb-2">
                <span className="font-medium">Vorgeschlagene Antwort: </span>
                {suggestion}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => { onAccept(suggestion); setDismissed(true); }}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-btn bg-s-blue/10 dark:bg-s-blue/20 text-s-blue dark:text-s-blue text-xs font-medium hover:bg-s-blue/20 dark:hover:bg-s-blue/30 transition-colors"
                >
                  <Check size={12} /> Übernehmen
                </button>
                <button
                  onClick={() => setDismissed(true)}
                  className="flex items-center gap-1 px-2.5 py-1 rounded-btn bg-s-bg-sunken dark:bg-s-dm-raised text-s-ink/60 dark:text-s-ink/30 text-xs font-medium hover:bg-s-sand dark:hover:bg-s-ink/60 transition-colors"
                >
                  <X size={12} /> Verwerfen
                </button>
              </div>
            </div>
          ) : null}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
