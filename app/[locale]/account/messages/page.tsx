"use client";

import { useEffect, useState } from "react";
import { useLocale } from "next-intl";
import Link from "next/link";
import { MessageCircle } from "lucide-react";
import dynamic from "next/dynamic";
import Spinner from "@/components-legacy/ui/Spinner";
import type { Conversation } from "@/lib/types";

const ChatWindow = dynamic(() => import("@/components-legacy/ChatWindow"), { ssr: false });

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
      .catch((err) => console.error("[AccountMessages] failed to load current user profile:", err));

    // Load conversations
    fetch("/api/conversations")
      .then((r) => r.json())
      .then((data) => {
        const convs = data.conversations ?? [];
        setConversations(convs);
        if (convs.length > 0) setSelected(convs[0].id);
      })
      .catch((err) => console.error("[AccountMessages] failed to load conversations:", err))
      .finally(() => setLoading(false));
  }, []);

  const selectedConv = conversations.find((c) => c.id === selected);

  if (loading) {
    return (
      <div className="min-h-screen bg-s-bg-surface">
        <div className="max-w-5xl mx-auto pt-6 pb-8 px-4 sm:px-6 animate-pulse">
          <div className="h-2.5 w-20 bg-s-bg-sunken rounded mb-1" />
          <div className="h-7 w-36 bg-s-bg-sunken rounded mb-6" />
          <div className="flex gap-4">
            {/* Conversation list skeleton */}
            <div className="w-72 shrink-0 flex flex-col gap-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex gap-3 p-3 rounded-[12px] bg-white border border-s-border">
                  <div className="w-10 h-10 rounded-full bg-s-bg-sunken shrink-0" />
                  <div className="flex-1 space-y-1.5 pt-1">
                    <div className="h-2.5 w-3/4 bg-s-bg-sunken rounded" />
                    <div className="h-2 w-1/2 bg-s-bg-sunken rounded" />
                  </div>
                </div>
              ))}
            </div>
            {/* Chat pane skeleton */}
            <div className="flex-1 rounded-[14px] bg-white border border-s-border" />
          </div>
        </div>
      </div>
    );
  }

  if (conversations.length === 0) {
    // V3-D281: empty-state retired-token swap (s-coral → s-ink primary CTA per LOCKFILE §0 rule 2)
    return (
      <div className="min-h-screen bg-s-bg-surface flex flex-col items-center justify-center gap-3 text-center px-4">
        <div className="w-16 h-16 rounded-[18px] flex items-center justify-center mb-2 bg-s-bg-sunken">
          <MessageCircle size={28} className="text-s-ink-2" />
        </div>
        <p className="text-[12px] font-heading uppercase tracking-[.22em] text-s-ink-2">
          Nachrichten
        </p>
        <p className="font-heading text-lg text-s-ink">Noch keine Nachrichten</p>
        <p className="text-sm font-body text-s-ink/45 max-w-xs leading-relaxed">
          Wenn du einen Salon kontaktierst, erscheinen deine Unterhaltungen hier.
        </p>
        <Link href={`/${locale}/coiffeur`}
          className="mt-2 px-6 py-3.5 rounded-btn bg-s-ink text-white text-xs font-heading uppercase tracking-[.04em] active:scale-[0.97] transition-[transform,filter] duration-150 shadow-elevation-2">
          Salons entdecken
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-s-bg-surface">
      <div className="max-w-5xl mx-auto pt-6 pb-8 px-4 sm:px-6">
        <div className="mb-6">
          <p className="text-[12px] font-heading uppercase tracking-[.22em] text-s-ink-2 mb-1">
            Account
          </p>
          <h1 className="font-heading text-2xl text-s-ink">Nachrichten</h1>
        </div>

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
                    // V3-D281: conversation row — retired s-coral + hardcoded green rgba swapped to ink/sunken tokens
                    "flex items-start gap-3 p-3 rounded-[12px] text-left w-full transition-[transform,filter] duration-150",
                    selected === conv.id
                      ? "border border-s-border bg-s-bg-sunken"
                      : "bg-white border border-s-border hover:border-s-border",
                  ].join(" ")}
                >
                  {/* Avatar — V3-D281: was rgba(27,77,27,.15) green wash → sunken neutral */}
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-s-ink text-xs font-heading shrink-0 bg-s-bg-sunken">
                    {conv.other_party_name?.[0] ?? "?"}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1">
                      <p className="text-sm font-heading text-s-ink truncate">
                        {conv.other_party_name}
                      </p>
                      {unread > 0 && (
                        // V3-D281: unread badge — s-coral → s-accent (info signal, small footprint OK per LOCKFILE §1 Layer 2)
                        <span className="w-5 h-5 rounded-full bg-s-accent text-white text-[12px] flex items-center justify-center font-heading shrink-0">
                          {unread}
                        </span>
                      )}
                    </div>
                    {conv.last_message_preview && (
                      <p className="text-xs font-body text-s-ink/40 truncate mt-0.5">
                        {conv.last_message_preview}
                      </p>
                    )}
                    {conv.last_message_at && (
                      <p className="text-[12px] font-heading uppercase tracking-[.08em] text-s-ink/25 mt-0.5">
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
                <div className="mb-3 pb-3 border-b border-s-border flex items-center gap-2">
                  {/* V3-D281: header avatar — was rgba(27,77,27,.12) green wash + s-coral text → sunken neutral */}
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-s-ink text-[12px] font-heading shrink-0 bg-s-bg-sunken">
                    {selectedConv?.other_party_name?.[0] ?? "?"}
                  </div>
                  <div>
                    <p className="text-sm font-heading text-s-ink">
                      {selectedConv?.other_party_name}
                    </p>
                    <p className="text-[12px] font-heading uppercase tracking-[.10em] text-s-ink-2">Salon</p>
                  </div>
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
              <div className="h-full flex flex-col items-center justify-center gap-2 text-center">
                <p className="text-[12px] font-heading uppercase tracking-[.18em] text-s-ink/25">
                  Unterhaltung auswählen
                </p>
                <p className="text-xs font-body text-s-ink/25">Wähle links eine Unterhaltung</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
