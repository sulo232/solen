"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useLocale, useTranslations } from "next-intl";
import { MessageCircle, ChevronDown, ChevronLeft } from "lucide-react";
import DashboardLayout from "@/components-legacy/dashboard/DashboardLayout";
import Spinner from "@/components-legacy/ui/Spinner";

const ChatWindow = dynamic(() => import("@/components-legacy/ChatWindow"), {
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

const initials = (n: string) => {
  const p = (n || "").trim().split(/\s+/);
  return ((p[0]?.[0] ?? "") + (p[1]?.[0] ?? "")).toUpperCase() || "—";
};
const AV_GRADS = [
  "from-[#276EF1] to-[#1B4DCB]",
  "from-[#F0A868] to-[#C0524A]",
  "from-[#16A34A] to-[#0E7A37]",
  "from-[#8B5CF6] to-[#6D28D9]",
  "from-[#EC4899] to-[#BE185D]",
];
const avGrad = (s: string) => AV_GRADS[[...(s || "")].reduce((a, c) => a + c.charCodeAt(0), 0) % AV_GRADS.length];

export default function MessagesPage() {
  const locale = useLocale();
  const t = useTranslations("dashboard.messagesPage");
  const quickReplies = [
    t("quickReplyThanks"),
    t("quickReplyConfirmed"),
    t("quickReplyFullyBooked"),
  ];
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
      .catch((err) => console.error("[DashboardMessages] Failed to fetch conversations:", err))
      .finally(() => setLoading(false));
  }, []);

  const totalUnread = convos.reduce((sum, c) => sum + c.unread_count_salon, 0);

  const conversationList = (
    <>
      <h1 className="font-heading text-[26px] font-bold tracking-[-0.02em] text-s-ink leading-none mb-[18px]">
        {t("title")}
      </h1>
      {loading ? (
        <div className="flex justify-center py-10"><Spinner size="sm" /></div>
      ) : convos.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-s-ink-3 text-center">
          <MessageCircle size={28} className="mb-2" />
          <p className="text-sm">{t("emptyList")}</p>
        </div>
      ) : (
        <div className="rounded-[16px] border border-s-border bg-white overflow-hidden">
          {convos.map((c) => {
            const isUnread = c.unread_count_salon > 0;
            return (
              <button
                key={c.id}
                onClick={() => setActiveConvo(c)}
                className={[
                  "w-full text-left border-b border-s-border last:border-b-0 transition-colors",
                  activeConvo?.id === c.id ? "bg-s-bg-sunken" : "hover:bg-s-bg-sunken/60",
                ].join(" ")}
              >
                <div className="flex items-center gap-3 px-3.5 py-3">
                  <span
                    className={`grid place-items-center w-[40px] h-[40px] rounded-full bg-gradient-to-br ${avGrad(c.customer_name)} text-white font-heading font-semibold text-[13px] shrink-0`}
                  >
                    {initials(c.customer_name)}
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="flex items-center gap-1.5">
                      <span className="font-heading font-semibold text-[14.5px] text-s-ink leading-[1.2] truncate">
                        {c.customer_name}
                      </span>
                      {c.is_first_visit && (
                        <span className="text-[10px] font-bold px-[7px] py-px rounded-full bg-s-accent-bright/10 text-s-accent-bright shrink-0">
                          {t("newBadge")}
                        </span>
                      )}
                    </span>
                    {c.last_message_preview && (
                      <span
                        className={[
                          "block text-[12.5px] truncate mt-px",
                          isUnread ? "text-s-ink font-medium" : "text-s-ink-2",
                        ].join(" ")}
                      >
                        {c.last_message_preview}
                      </span>
                    )}
                  </span>
                  <span className="flex flex-col items-end gap-1.5 shrink-0">
                    {c.last_message_at && (
                      <span className="text-[11px] text-s-ink-3 tabular-nums">
                        {new Date(c.last_message_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                      </span>
                    )}
                    {isUnread && (
                      <span className="min-w-[18px] h-[18px] rounded-full bg-s-ink text-white text-[10.5px] font-bold grid place-items-center px-[5px]">
                        {c.unread_count_salon}
                      </span>
                    )}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </>
  );

  const chatPane = activeConvo && currentUserId ? (
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
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn border border-s-border text-xs text-s-ink-2 hover:border-s-accent-bright hover:text-s-accent-bright transition-colors"
        >
          {t("quickReply")} <ChevronDown size={12} className={showQuickReplies ? "rotate-180" : ""} />
        </button>
        {showQuickReplies && (
          <div className="absolute bottom-full mb-1 left-0 bg-white rounded-[12px] shadow-v5-float border border-s-border py-1 min-w-[240px] z-10">
            {quickReplies.map((r, i) => (
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
                className="w-full text-left px-4 py-2 text-sm text-s-ink-2 hover:bg-s-bg-sunken transition-colors"
              >
                {r}
              </button>
            ))}
          </div>
        )}
      </div>
    </>
  ) : (
    <div className="flex-1 flex flex-col items-center justify-center bg-white rounded-[12px] border border-s-border text-s-ink-3">
      <MessageCircle size={32} className="mb-3" />
      <p className="text-sm">{t("selectConversation")}</p>
    </div>
  );

  return (
    <DashboardLayout unreadCount={totalUnread}>
      {/* Mobile: list OR thread (full-width), never both */}
      <div className="lg:hidden">
        {activeConvo && currentUserId ? (
          <div className="flex flex-col gap-2 h-[calc(100vh-140px)]">
            <button
              onClick={() => setActiveConvo(null)}
              className="flex items-center gap-1 text-[13px] font-heading font-semibold text-s-ink-2 hover:text-s-ink transition-colors self-start"
            >
              <ChevronLeft size={18} /> {t("title")}
            </button>
            {chatPane}
          </div>
        ) : (
          conversationList
        )}
      </div>

      {/* Desktop: two-pane */}
      <div className="hidden lg:flex h-[calc(100vh-120px)] gap-4">
        <div className="w-72 shrink-0 flex flex-col overflow-y-auto">
          {conversationList}
        </div>
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          {chatPane}
        </div>
      </div>
    </DashboardLayout>
  );
}
