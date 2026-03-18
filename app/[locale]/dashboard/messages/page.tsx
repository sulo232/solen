"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale } from "next-intl";
import { MessageCircle, ChevronDown } from "lucide-react";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import Spinner from "@/components/ui/Spinner";

const ChatWindow = dynamic(() => import("@/components/ChatWindow"), {
  loading: () => <div className="flex justify-center py-12"><Spinner /></div>,
});

interface ConversationItem {
  id: string;
  customer_id: string;
  customer_name: string;
  customer_avatar: string | null;
  last_message_at: string | null;
  last_message_preview: string | null;
  unread_count_salon: number;
  is_first_visit?: boolean;
}

const QUICK_REPLIES = [
  "Vielen Dank für Ihre Nachricht!",
  "Ihr Termin wurde bestätigt.",
  "Leider sind wir ausgebucht.",
];

export default function MessagesPage() {
  const locale = useLocale();
  const [convos, setConvos] = useState<ConversationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeConvo, setActiveConvo] = useState<ConversationItem | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [salonId, setSalonId] = useState<string | null>(null);
  const [showQuickReplies, setShowQuickReplies] = useState(false);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => {
        setCurrentUserId(p?.id ?? null);
        setSalonId(p?.salon_id ?? null);
        const sid = p?.salon_id;
        if (sid) return fetch(`/api/conversations?salon_id=${sid}`).then((r) => r.json());
        return null;
      })
      .then((data) => {
        if (data) setConvos(data.conversations ?? []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const totalUnread = convos.reduce((sum, c) => sum + c.unread_count_salon, 0);

  return (
    <DashboardLayout unreadCount={totalUnread}>
      <div className="flex h-[calc(100vh-120px)] gap-4">
        {/* Conversation list */}
        <div className="w-72 shrink-0 flex flex-col bg-white rounded-card border border-gray-100 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100">
            <h2 className="font-heading font-bold text-base text-dark">Nachrichten</h2>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Spinner size="sm" /></div>
          ) : convos.length === 0 ? (
            <div className="flex flex-col items-center justify-center flex-1 text-dark/30 p-6 text-center">
              <MessageCircle size={28} className="mb-2 opacity-30" />
              <p className="text-sm">Keine Nachrichten</p>
            </div>
          ) : (
            <div className="flex-1 overflow-y-auto divide-y divide-gray-50">
              {convos.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setActiveConvo(c)}
                  className={[
                    "w-full text-left px-4 py-3 hover:bg-gray-50 transition-colors",
                    activeConvo?.id === c.id ? "bg-s-coral/5 border-l-2 border-s-coral" : "",
                  ].join(" ")}
                >
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-s-coral/10 flex items-center justify-center shrink-0 text-sm font-bold text-s-coral">
                      {c.customer_name[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5">
                        <p className="text-sm font-medium text-dark truncate">{c.customer_name}</p>
                        {c.is_first_visit && (
                          <span className="px-1 py-0.5 rounded-pill bg-s-coral/10 text-s-coral text-[9px] font-bold shrink-0">NEU</span>
                        )}
                      </div>
                      {c.last_message_preview && (
                        <p className="text-xs text-dark/40 truncate mt-0.5">{c.last_message_preview}</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      {c.last_message_at && (
                        <p className="text-[10px] text-dark/30">
                          {new Date(c.last_message_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      )}
                      {c.unread_count_salon > 0 && (
                        <span className="w-4 h-4 rounded-full bg-s-coral text-white text-[9px] flex items-center justify-center font-bold">
                          {c.unread_count_salon}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Chat area */}
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {activeConvo && currentUserId ? (
            <>
              <ChatWindow
                conversationId={activeConvo.id}
                perspective="salon"
                currentUserId={currentUserId}
              />
              {/* Quick replies */}
              <div className="relative">
                <button
                  onClick={() => setShowQuickReplies((s) => !s)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-button border border-gray-200 text-xs text-dark/50 hover:border-s-coral hover:text-s-coral transition-colors"
                >
                  Schnellantwort <ChevronDown size={12} className={showQuickReplies ? "rotate-180" : ""} />
                </button>
                {showQuickReplies && (
                  <div className="absolute bottom-full mb-1 left-0 bg-white rounded-card shadow-xl border border-gray-100 py-1 min-w-[240px] z-10">
                    {QUICK_REPLIES.map((r, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          // Inject into ChatWindow by dispatching a custom event
                          // (ChatWindow is self-contained — quick reply triggers a send)
                          fetch(`/api/conversations/${activeConvo.id}/messages`, {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ content: r, message_type: "text" }),
                          }).finally(() => setShowQuickReplies(false));
                        }}
                        className="w-full text-left px-4 py-2 text-sm text-dark/70 hover:bg-gray-50 transition-colors"
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-card border border-gray-100 text-dark/30">
              <MessageCircle size={32} className="mb-3 opacity-30" />
              <p className="text-sm">Gespräch auswählen</p>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
