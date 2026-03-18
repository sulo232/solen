"use client";

import { useEffect, useState } from "react";

interface QuickReplyChipsProps {
  salonId: string;
  onSelectTemplate: (text: string) => void;
}

const DEFAULT_TEMPLATES = [
  "Ja, das machen wir! ✓",
  "Leider gerade ausgebucht 😔",
  "Gerne, schick mir ein Foto!",
  "Wir bestätigen deinen Termin!",
  "Preis auf Anfrage — welche Behandlung?",
];

export default function QuickReplyChips({ salonId, onSelectTemplate }: QuickReplyChipsProps) {
  const [templates, setTemplates] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/chat-templates")
      .then((r) => r.json())
      .then((d) => {
        const items = d.templates ?? [];
        setTemplates(items.map((t: { text: string }) => t.text));
      })
      .catch(() => setTemplates(DEFAULT_TEMPLATES));
  }, [salonId]);

  if (templates.length === 0) return null;

  return (
    <div className="overflow-x-auto flex gap-2 px-4 py-2 scrollbar-hide">
      {templates.map((text, i) => (
        <button
          key={i}
          type="button"
          onClick={() => onSelectTemplate(text)}
          className="px-3 py-1.5 rounded-full bg-teal-50 dark:bg-teal-900/30 text-teal-700 dark:text-teal-300 text-sm whitespace-nowrap cursor-pointer hover:bg-teal-100 dark:hover:bg-teal-800/50 transition-colors shrink-0"
        >
          {text}
        </button>
      ))}
    </div>
  );
}
