'use client';

import React, { useState, useEffect } from "react";
import { ChatWindow } from "../../components/ChatWindow";
import { Spinner } from "../../components/ui/Spinner";
import { MessageCircle, Plus } from "lucide-react";
import type { Conversation } from "../../lib/types";

interface MessagesPageProps {
  locale?: string;
}

function ConversationCard({ conv, isActive, onClick }: { conv: Conversation; isActive: boolean; onClick: () => void }) {
  const initials = conv.salon.name[0];
  const time = conv.last_message_at
    ? new Date(conv.last_message_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })
    : "";

  return (
    <button
      onClick={onClick}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors ${
        isActive ? "bg-teal/5 border-l-2 border-teal" : "hover:bg-gray-50 border-l-2 border-transparent"
      }`}
    >
      <div className="w-10 h-10 rounded-full bg-teal/20 flex-shrink-0 flex items-center justify-center font-bold text-teal text-sm">
        {conv.salon.cover_photo_url ? (
          <img src={conv.salon.cover_photo_url} alt="" className="w-full h-full rounded-full object-cover" />
        ) : initials}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <p className="font-medium text-sm text-dark truncate">{conv.salon.name}</p>
          <span className="text-[10px] text-gray-400 flex-shrink-0 ml-2">{time}</span>
        </div>
        <p className="text-xs text-gray-500 truncate mt-0.5">{conv.last_message_preview ?? ""}</p>
      </div>
      {conv.unread_count_customer > 0 && (
        <span className="w-4 h-4 bg-coral rounded-full flex items-center justify-center text-[9px] text-white font-bold flex-shrink-0">
          {conv.unread_count_customer}
        </span>
      )}
    </button>
  );
}

export function MessagesPage({ locale = "de" }: MessagesPageProps) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [activeConvId, setActiveConvId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const currentUserId = localStorage.getItem("solen_user_id") ?? "";

  useEffect(() => {
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data: Conversation[]) => {
        const sorted = (data ?? []).sort((a, b) =>
          (b.last_message_at ?? "").localeCompare(a.last_message_at ?? "")
        );
        setConversations(sorted);
        if (sorted.length > 0) setActiveConvId(sorted[0].id);
      })
      .catch(console.error)
      .finally(() => setIsLoading(false));
  }, []);

  const activeConv = conversations.find((c) => c.id === activeConvId);

  return (
    <div className="min-h-screen bg-white pt-16">
      <div className="max-w-5xl mx-auto flex h-[calc(100vh-4rem)]">
        {/* Conversation list */}
        <div className="w-80 flex-shrink-0 border-r border-gray-100 flex flex-col">
          <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100">
            <h2 className="font-heading font-semibold text-dark text-sm">Nachrichten</h2>
            <button className="p-1.5 rounded-button hover:bg-gray-100 text-gray-500 hover:text-dark transition-colors">
              <Plus size={16} />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto">
            {isLoading ? (
              <div className="flex justify-center py-8"><Spinner size={20} /></div>
            ) : conversations.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <MessageCircle size={32} className="mx-auto mb-2 text-gray-200" />
                <p className="text-xs">Noch keine Nachrichten</p>
              </div>
            ) : (
              conversations.map((conv) => (
                <ConversationCard
                  key={conv.id}
                  conv={conv}
                  isActive={conv.id === activeConvId}
                  onClick={() => setActiveConvId(conv.id)}
                />
              ))
            )}
          </div>
        </div>

        {/* Chat view */}
        <div className="flex-1 flex flex-col">
          {activeConvId && activeConv ? (
            <ChatWindow
              conversationId={activeConvId}
              perspective="customer"
              currentUserId={currentUserId}
              otherPartyName={activeConv.salon.name}
              className="flex-1 rounded-none shadow-none border-none"
            />
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-400 flex-col gap-2">
              <MessageCircle size={40} className="text-gray-200" />
              <p className="text-sm">Wähle eine Konversation</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
