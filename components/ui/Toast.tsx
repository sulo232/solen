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
  success: <CheckCircle size={16} className="flex-shrink-0" style={{ color: "#16A34A" }} />,
  error: <XCircle size={16} className="text-s-coral flex-shrink-0" />,
  info: <Info size={16} className="text-s-amber flex-shrink-0" />,
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
        "flex items-center gap-3 min-w-[200px] max-w-[calc(100vw-32px)]",
        "bg-white border",
        "rounded-card px-4 py-3.5",
        item.type === "error" && "border-s-coral/25",
        item.type === "success" && "border-s-sage/25",
        item.type === "info" && "border-s-ink/[0.08]"
      )}
      style={{ boxShadow: "0 4px 12px rgba(26,18,9,.10), 0 12px 28px rgba(26,18,9,.08)" }}
    >
      {icons[item.type]}
      <p className="flex-1 text-sm font-heading text-s-ink leading-snug">{item.message}</p>
      <button
        onClick={() => onRemove(item.id)}
        className="p-0.5 text-s-ink/30 hover:text-s-ink/60 transition-colors duration-150"
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
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none" role="alert" aria-live="assertive">
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
