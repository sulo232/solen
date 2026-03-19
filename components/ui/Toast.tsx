"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle, XCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toastVariants } from "@/lib/animations";

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: string;
  type: ToastType;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType, duration?: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

const icons: Record<ToastType, React.ReactNode> = {
  success: <CheckCircle size={18} className="text-s-coral flex-shrink-0" />,
  error: <XCircle size={18} className="text-s-coral flex-shrink-0" />,
  info: <Info size={18} className="text-dark/50 dark:text-s-dm-text/50 flex-shrink-0" />,
};

function ToastItem({ item, onRemove }: { item: ToastItem; onRemove: (id: string) => void }) {
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    timerRef.current = setTimeout(() => onRemove(item.id), item.duration ?? 4000);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [item.id, item.duration, onRemove]);

  return (
    <motion.div
      key={item.id}
      layout
      variants={toastVariants}
      initial="hidden"
      animate="visible"
      exit="exit"
      className={cn(
        "flex items-center gap-3 min-w-[260px] max-w-[360px]",
        "bg-white/95 dark:bg-s-dm-surface/95 backdrop-blur-glass border border-white/80 dark:border-white/10",
        "rounded-2xl shadow-glass px-4 py-3",
        item.type === "error" && "border-s-coral/20",
        item.type === "success" && "border-s-coral/20"
      )}
    >
      {icons[item.type]}
      <p className="flex-1 text-sm text-dark dark:text-s-dm-text font-body leading-snug">{item.message}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="p-0.5 text-dark/30 dark:text-s-dm-text/30 hover:text-dark/60 dark:hover:text-s-dm-text/60 transition-colors"
        aria-label="Schliessen"
      >
        <X size={14} />
      </button>
    </motion.div>
  );
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const remove = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const toast = useCallback((message: string, type: ToastType = "info", duration = 4000) => {
    const id = Math.random().toString(36).slice(2);
    setToasts((prev) => [...prev.slice(-4), { id, type, message, duration }]);
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <div key={t.id} className="pointer-events-auto">
              <ToastItem item={t} onRemove={remove} />
            </div>
          ))}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  );
}

/** Use inside any component wrapped by ToastProvider */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used inside ToastProvider");
  return ctx.toast;
}

export default ToastProvider;
