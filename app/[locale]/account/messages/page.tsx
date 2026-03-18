"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import { MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";
import Spinner from "@/components/ui/Spinner";
import type { Conversation } from "@/lib/types";

const ChatWindow = dynamic(() => import("@/components/ChatWindow"), { ssr: false });

interface ConversationWithMeta extends Conversation {
  other_party_name: string;
  other_party_avatar: string | null;
}

export default function MessagesPage() {
  const locale = useLocale();
  const [conversations, setConversations] = useState<ConversationWithMeta[]>([]);
  const [selected, setSelected] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Load current user
    fetch("/api/profile")
      .then((r) => r.json())
      .then((p) => setCurrentUserId(p?.id ?? null))
      .catch(() => {});

    // Load conversations
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        const convs = data.conversations ?? [];
        setConversations(convs);
        if (convs.length > 0) setSelected(convs[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const selectedConv = conversations.find((c) => c.id === selected);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Spinner size="lg" />
      </div>
    );
  }

  if (conversations.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center gap-4 text-center px-4">
        <MessageCircle className="w-12 h-12 text-dark/20" />
        <p className="font-heading font-semibold text-dark text-lg">Keine Nachrichten</p>
        <p className="text-sm text-dark/50">
          Wenn du einen Salon kontaktierst, erscheinen deine Unterhaltungen hier.
        </p>
        <a
          href={`/${locale}/coiffeur`}
          className="mt-2 px-5 py-2.5 rounded-button bg-s-coral text-white text-sm font-medium hover:bg-s-coral/90 transition-colors"
        >
          Salons entdecken
        </a>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto pt-20 pb-8 px-4 sm:px-6">
        <h1 className="font-heading font-bold text-2xl text-dark mb-6">Nachrichten</h1>

        <div className="flex gap-4 h-[calc(100vh-160px)]">
          {/* Conversation list */}
          <div className="w-72 shrink-0 flex flex-col gap-1 overflow-y-auto">
            {conversations.map((conv) => {
              const unread = conv.unread_count_customer;
              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv.id)}
                  className={[
                    "flex items-start gap-3 p-3 rounded-card text-left transition-colors w-full",
                    selected === conv.id
                      ? "bg-s-coral/5 border border-s-coral/20"
                      : "bg-white border border-gray-100 hover:border-s-coral/20",
                  ].join(" ")}
                >
                  {/* Avatar */}
                  <div className="w-10 h-10 rounded-full bg-s-coral/20 flex items-center justify-center text-s-coral font-semibold text-sm shrink-0">
                    {conv.other_party_name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-medium text-dark truncate">{conv.other_party_name}</p>
                      {unread > 0 && (
                        <span className="w-5 h-5 rounded-full bg-s-coral text-white text-[10px] flex items-center justify-center font-bold shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    {conv.last_message_preview && (
                      <p className="text-xs text-dark/40 truncate mt-0.5">{conv.last_message_preview}</p>
                    )}
                    {conv.last_message_at && (
                      <p className="text-[10px] text-dark/25 mt-0.5">
                        {new Date(conv.last_message_at).toLocaleDateString("de-CH", {
                          day: "numeric",
                          month: "short",
                        })}
                      </p>
                    )}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Chat window */}
          <div className="flex-1 min-w-0">
            {selected && currentUserId ? (
              <div className="h-full">
                <div className="mb-2 flex items-center gap-2">
                  <p className="text-sm font-medium text-dark">
                    {selectedConv?.other_party_name}
                  </p>
                </div>
                <div className="h-[calc(100%-36px)]">
                  <ChatWindow
                    conversationId={selected}
                    perspective="customer"
                    currentUserId={currentUserId}
                  />
                </div>
              </div>
            ) : (
              <div className="h-full flex items-center justify-center text-dark/30 text-sm">
                Wähle eine Unterhaltung
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
