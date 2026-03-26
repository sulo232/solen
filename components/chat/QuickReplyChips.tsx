"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { motion } from "framer-motion";

interface QuickReplyChipsProps {
  salonId: string;
  onSelectTemplate: (text: string) => void;
}

export default function QuickReplyChips({ salonId, onSelectTemplate }: QuickReplyChipsProps) {
  const t = useTranslations("chat.quickReplyChips");
  const [templates, setTemplates] = useState<string[]>([]);

  const defaultTemplates = [
    t("defaults.0"),
    t("defaults.1"),
    t("defaults.2"),
    t("defaults.3"),
    t("defaults.4"),
  ];

  useEffect(() => {
    fetch("/api/chat-templates")
      .then((r) => r.json())
      .then((d) => {
        const items = d.templates ?? [];
        setTemplates(items.map((tmpl: { text: string }) => tmpl.text));
      })
      .catch(() => setTemplates(defaultTemplates));
  }, [salonId, defaultTemplates]);

  if (templates.length === 0) return null;

  return (
    <div className="overflow-x-auto flex gap-2 px-4 py-2 scrollbar-hide">
      {templates.map((text, i) => (
        <motion.button
          key={i}
          type="button"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: i * 0.05 }}
          onClick={() => onSelectTemplate(text)}
          className="px-3 py-1.5 rounded-pill bg-s-coral-50 dark:bg-s-coral-900/30 text-s-coral-700 dark:text-s-coral-300 text-sm whitespace-nowrap cursor-pointer hover:bg-s-coral-100 dark:hover:bg-s-coral-800/50 transition-colors shrink-0"
        >
          {text}
        </motion.button>
      ))}
    </div>
  );
}
