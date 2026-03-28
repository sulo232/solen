"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Image as ImageIcon, X, Paperclip, DollarSign, Camera, Check, CheckCheck, Languages, MessageCircle } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import Skeleton from "@/components/ui/Skeleton";
import EmptyState from "@/components/ui/EmptyState";
import { TypingIndicator } from "@/components/ui/TypingIndicator";
import { useToast } from "@/components/ui/Toast";
import PriceOfferModal from "@/components/ui/PriceOfferModal";
import QuickReplyChips from "@/components/chat/QuickReplyChips";
import AISuggestion from "@/components/chat/AISuggestion";
import PhotoGallery from "@/components/chat/PhotoGallery";
import BookingBubble from "@/components/chat/BookingBubble";
import type { Message } from "@/lib/types";

interface ChatWindowProps {
  conversationId: string;
  perspective: "customer" | "salon";
  currentUserId: string;
  salonId?: string;
  salonName?: string;
  salonSlug?: string;
  salonServices?: string[];
  isNailSalon?: boolean;
}

const PAGE_SIZE = 30;

export default function ChatWindow({ conversationId, perspective, currentUserId, salonId, salonName, salonSlug, salonServices, isNailSalon }: ChatWindowProps) {
  const locale = useLocale();
  const t = useTranslations("chat") as any;
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [activeTab, setActiveTab] = useState<"chat" | "photos">("chat");
  const [remoteTyping, setRemoteTyping] = useState<string | null>(null);
  const [translations, setTranslations] = useState<Record<string, string>>({});
  const [translating, setTranslating] = useState<string | null>(null);
  const [priceOfferModal, setPriceOfferModal] = useState<{ open: boolean; photoUrl: string }>({ open: false, photoUrl: "" });
  const toast = useToast();
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const initialLoadDone = useRef(false);

  const isSalonOwner = perspective === "salon";

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=${PAGE_SIZE}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
      requestAnimationFrame(() => { initialLoadDone.current = true; });
    }
  }, [conversationId]);

  useEffect(() => { loadMessages(); }, [loadMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Mark messages as read when conversation is opened
  useEffect(() => {
    if (messages.length === 0) return;
    const unreadIds = messages
      .filter((m) => m.sender_id !== currentUserId && !m.read_at)
      .map((m) => m.id)
      .filter((id) => !id.startsWith("optimistic"));
    if (unreadIds.length === 0) return;

    fetch(`/api/conversations/${conversationId}/messages/read`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message_ids: unreadIds }),
    }).catch(() => {});

    // Update local state
    setMessages((prev) =>
      prev.map((m) =>
        unreadIds.includes(m.id) ? { ...m, read_at: new Date().toISOString() } : m
      )
    );
  }, [messages.length, conversationId, currentUserId]); // eslint-disable-line react-hooks/exhaustive-deps

  // Supabase Realtime — new messages + read receipt updates
  useEffect(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase
      .channel(`chat:${conversationId}`)
      .on("postgres_changes", {
        event: "INSERT", schema: "public", table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const m = payload.new as Message;
        setMessages((prev) => prev.some((x) => x.id === m.id) ? prev : [...prev, m]);
      })
      .on("postgres_changes", {
        event: "UPDATE", schema: "public", table: "messages",
        filter: `conversation_id=eq.${conversationId}`,
      }, (payload) => {
        const updated = payload.new as Message;
        setMessages((prev) =>
          prev.map((m) => m.id === updated.id ? { ...m, read_at: updated.read_at } : m)
        );
      })
      .subscribe();

    // Presence for typing indicator
    const presenceChannel = supabase
      .channel(`presence:${conversationId}`)
      .on("presence", { event: "sync" }, () => {
        const state = presenceChannel.presenceState();
        const others = Object.values(state).flat().filter(
          (p: any) => p.user_id !== currentUserId && p.typing
        );
        if (others.length > 0) {
          setRemoteTyping((others[0] as any).name ?? "Jemand");
        } else {
          setRemoteTyping(null);
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
      supabase.removeChannel(presenceChannel);
    };
  }, [conversationId, currentUserId]);

  // Broadcast typing state
  const broadcastTyping = useCallback(() => {
    const supabase = createBrowserSupabaseClient();
    const channel = supabase.channel(`presence:${conversationId}`);
    channel.track({ user_id: currentUserId, typing: true, name: isSalonOwner ? salonName : "Kunde" });

    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      channel.track({ user_id: currentUserId, typing: false, name: "" });
    }, 2000);
  }, [conversationId, currentUserId, isSalonOwner, salonName]);

  const sendMessage = async (type: "text" | "image" = "text") => {
    const content = type === "image" ? imageUrl.trim() : text.trim();
    if (!content) return;
    setSending(true);

    const optimistic: Message = {
      id: `optimistic-${Date.now()}`,
      conversation_id: conversationId,
      sender_id: currentUserId,
      content,
      message_type: type,
      image_url: type === "image" ? content : null,
      read_at: null,
      created_at: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, optimistic]);
    if (type === "text") setText("");
    else { setImageUrl(""); setShowImageInput(false); }

    try {
      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, message_type: type }),
      });
    } catch {
      setMessages((prev) => prev.filter((m) => m.id !== optimistic.id));
    } finally {
      setSending(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { toast(t("fileTooLarge"), "error"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || t("uploadFailed"), "error"); return; }
      const { url } = await res.json();

      const optimistic: Message = {
        id: `optimistic-${Date.now()}`,
        conversation_id: conversationId,
        sender_id: currentUserId,
        content: url,
        message_type: "image",
        image_url: url,
        read_at: null,
        created_at: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, optimistic]);

      await fetch(`/api/conversations/${conversationId}/messages`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: url, message_type: "image", image_url: url }),
      });
    } catch {
      toast(t("uploadFailed"), "error");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage("text"); }
  };

  const handleTextChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setText(e.target.value);
    broadcastTyping();
  };

  const isOwn = (msg: Message) => msg.sender_id === currentUserId;

  // Translation
  const handleTranslate = async (msgId: string, msgContent: string) => {
    const cacheKey = `translate_${msgId}_${locale}`;
    const cached = typeof window !== "undefined" ? localStorage.getItem(cacheKey) : null;
    if (cached) {
      setTranslations((prev) => ({ ...prev, [msgId]: cached }));
      return;
    }

    setTranslating(msgId);
    try {
      const res = await fetch("/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: msgContent, to: locale }),
      });
      if (res.status === 204) return;
      const data = await res.json();
      if (data.translation) {
        setTranslations((prev) => ({ ...prev, [msgId]: data.translation }));
        localStorage.setItem(cacheKey, data.translation);
      }
    } catch { /* ignore */ } finally {
      setTranslating(null);
    }
  };

  // Get last customer message for AI suggestion
  const lastCustomerMessage = isSalonOwner
    ? [...messages].reverse().find((m) => m.sender_id !== currentUserId && m.message_type === "text")?.content ?? null
    : null;

  // Photo-based quoting
  const handleCreatePhotoOffer = (photoUrl: string) => {
    setPriceOfferModal({ open: true, photoUrl });
  };

  const handlePriceOfferSubmit = async ({ description, amount }: { description: string; amount: number }) => {
    const photoUrl = priceOfferModal.photoUrl;
    setPriceOfferModal({ open: false, photoUrl: "" });
    try {
      const res = await fetch(`/api/conversations/${conversationId}/price-offer`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description,
          amount_chf: amount,
          photo_url: photoUrl,
        }),
      });
      if (res.ok) {
        toast(t("offerSent"), "success");
        loadMessages();
      } else {
        toast(t("offerFailed"), "error");
      }
    } catch {
      toast(t("offerFailed"), "error");
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="flex flex-col h-full min-h-[400px] bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-white/5"
    >
      {/* Tab header */}
      <div className="flex border-b border-s-ink/10 dark:border-white/10">
        <button
          onClick={() => setActiveTab("chat")}
          className={["relative flex-1 py-2 text-sm font-medium transition-colors",
            activeTab === "chat" ? "text-s-coral" : "text-s-ink/50 dark:text-s-ink/40"
          ].join(" ")}
        >
          {t("tabs.chat")}
          {activeTab === "chat" && (
            <motion.div layoutId="chat-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-s-coral" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={["relative flex-1 py-2 text-sm font-medium transition-colors",
            activeTab === "photos" ? "text-s-coral" : "text-s-ink/50 dark:text-s-ink/40"
          ].join(" ")}
        >
          <Camera size={14} className="inline mr-1 -mt-0.5" />
          {t("tabs.photos")}
          {activeTab === "photos" && (
            <motion.div layoutId="chat-tab-indicator" className="absolute bottom-0 left-0 right-0 h-0.5 bg-s-coral" />
          )}
        </button>
      </div>

      <AnimatePresence mode="wait">
       {activeTab === "photos" ? (
        <motion.div
          key="photos"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex-1 overflow-y-auto"
        >
          <PhotoGallery
            conversationId={conversationId}
            isSalonOwner={isSalonOwner}
            isNailSalon={isNailSalon}
            onCreateOffer={handleCreatePhotoOffer}
          />
        </motion.div>
       ) : (
        <motion.div
          key="chat"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.15 }}
          className="flex flex-col flex-1 min-h-0"
        >
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3" aria-live="polite" aria-label={t("messagesLabel")}>
          <AnimatePresence mode="wait">
          {loading ? (
            <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <div className="space-y-3 py-4">
                {["w-3/4", "w-5/12", "w-3/5"].map((w, i) => (
                  <div key={i} className={i % 2 ? "flex justify-end" : "flex"}>
                    <Skeleton className={`h-10 ${w} rounded-[12px]`} />
                  </div>
                ))}
              </div>
            </motion.div>
          ) : messages.length === 0 ? (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.15 }}>
              <EmptyState
                icon={MessageCircle}
                title={t("emptyTitle")}
                message={t("emptyMessage")}
                illustration="no-results"
              />
            </motion.div>
          ) : messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={initialLoadDone.current ? { opacity: 0, y: 8 } : false}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2 }}
              className={["group flex gap-2", isOwn(msg) ? "flex-row-reverse" : "flex-row"].join(" ")}
            >
              <div className={[
                "max-w-[75%] px-3 py-2 rounded-[12px] text-sm leading-relaxed",
                isOwn(msg) ? "bg-s-coral text-white rounded-tr-sm" : "bg-s-bg-sunken dark:bg-s-dm-surface text-s-ink dark:text-s-dm-text rounded-tl-sm",
              ].join(" ")}>
                {msg.message_type === "image" && msg.image_url ? (
                  <div>
                    <div className="rounded-[12px] overflow-hidden max-w-[200px]">
                      <Image src={msg.image_url} alt={t("imageAlt")} width={200} height={150} className="object-cover" />
                    </div>
                    {isSalonOwner && (
                      <button
                        onClick={() => handleCreatePhotoOffer(msg.image_url!)}
                        className="mt-1 text-xs text-s-coral-200 hover:text-white hover:underline flex items-center gap-1"
                        aria-label={t("createOffer")}
                      >
                        <Camera size={12} /> {t("createOffer")}
                      </button>
                    )}
                  </div>
                ) : msg.message_type === "price_offer" ? (
                  <div className="flex items-center gap-2 bg-white/20 rounded-btn p-2">
                    <DollarSign className="w-4 h-4 shrink-0" />
                    <p className="whitespace-pre-wrap break-words text-xs">{msg.content}</p>
                  </div>
                ) : (
                  <div>
                    <p className="whitespace-pre-wrap break-words">{msg.content}</p>
                    {/* Translation */}
                    {translations[msg.id] && (
                      <p className="text-xs italic mt-1 opacity-75 border-t border-current/10 pt-1">
                        {translations[msg.id]}
                        <span className="ml-1 opacity-50">{t("translated")}</span>
                      </p>
                    )}
                  </div>
                )}
                <div className={["flex items-center gap-1 mt-0.5", isOwn(msg) ? "justify-end" : ""].join(" ")}>
                  <span className={["text-[10px]", isOwn(msg) ? "text-white/60" : "text-s-ink/30 dark:text-s-dm-text/30"].join(" ")}>
                    {new Date(msg.created_at).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                    {msg.id.startsWith("optimistic") && ` · ${t("sending")}`}
                  </span>
                  {/* Read receipts */}
                  {isOwn(msg) && !msg.id.startsWith("optimistic") && (
                    msg.read_at ? (
                      <CheckCheck size={12} className="text-s-coral-200" />
                    ) : (
                      <Check size={12} className="text-white/40" />
                    )
                  )}
                  {/* Translate button */}
                  {msg.message_type === "text" && !translations[msg.id] && (
                    <button
                      onClick={() => handleTranslate(msg.id, msg.content)}
                      disabled={translating === msg.id}
                      className={["ml-1 opacity-0 group-hover:opacity-100 hover:opacity-100 focus:opacity-100 transition-opacity",
                        isOwn(msg) ? "text-white/40 hover:text-white/70" : "text-s-ink/20 dark:text-s-dm-text/20 hover:text-s-ink/50 dark:hover:text-s-dm-text/50"
                      ].join(" ")}
                      title={t("translate")}
                      style={{ opacity: translating === msg.id ? 1 : undefined }}
                    >
                      {translating === msg.id ? <Spinner size="sm" /> : <Languages size={10} />}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
          </AnimatePresence>
          {/* Typing indicator */}
          {remoteTyping && <TypingIndicator name={remoteTyping} />}
          <div ref={bottomRef} />
        </div>

        {/* Booking bubble (customer side, after 3+ messages) */}
        {!isSalonOwner && salonName && salonSlug && (
          <BookingBubble
            salonName={salonName}
            salonSlug={salonSlug}
            conversationId={conversationId}
            messageCount={messages.length}
          />
        )}

        {/* Image URL input */}
        {showImageInput && (
          <div className="px-4 pb-2 flex gap-2">
            <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
              placeholder={t("imageUrlPlaceholder")}
              className="flex-1 px-3 py-2 text-sm border border-s-ink/10 dark:border-white/10 rounded-btn focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 bg-white dark:bg-s-dm-surface dark:text-s-dm-text"
              autoFocus />
            <button onClick={() => sendMessage("image")} disabled={!imageUrl.trim() || sending}
              className="px-3 py-2 rounded-btn active:scale-[0.98] bg-s-coral text-white text-sm disabled:opacity-50 transition-all">{t("send")}</button>
            <button onClick={() => { setShowImageInput(false); setImageUrl(""); }}
              className="px-2 py-2 rounded-btn border border-s-ink/10 dark:border-white/10 text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text">
              <X size={14} />
            </button>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
          className="hidden"
          onChange={handleFileUpload}
        />

        {/* AI Suggestion (salon side only) */}
        {isSalonOwner && salonName && (
          <AISuggestion
            conversationId={conversationId}
            salonName={salonName}
            salonServices={salonServices ?? []}
            lastCustomerMessage={lastCustomerMessage}
            onAccept={(suggestion) => setText(suggestion)}
            visible={isSalonOwner}
          />
        )}

        {/* Quick Reply Chips (salon side only) */}
        {isSalonOwner && salonId && (
          <QuickReplyChips
            salonId={salonId}
            onSelectTemplate={(tmpl) => setText(tmpl)}
          />
        )}

        {/* Compose bar */}
        <div className="px-4 py-3 border-t border-s-ink/5 dark:border-white/10 backdrop-blur-sm bg-white/90 dark:bg-s-dm-surface/90 shadow-warm-sm flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-btn text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral hover:bg-s-coral/5 transition-colors shrink-0 disabled:opacity-40"
            title={t("attachFile")}
          >
            {uploading ? <Spinner size="sm" /> : <Paperclip size={18} />}
          </button>
          <button onClick={() => setShowImageInput((s) => !s)}
            className="p-2 rounded-btn text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral hover:bg-s-coral/5 transition-colors shrink-0"
            title={t("sendImageUrl")}>
            <ImageIcon size={18} />
          </button>
          <textarea ref={inputRef} value={text} onChange={handleTextChange}
            onKeyDown={handleKeyDown} placeholder={t("messagePlaceholder")} rows={1}
            className="flex-1 resize-none px-3 py-2 text-sm border border-s-ink/10 dark:border-white/10 rounded-btn focus:outline-none focus:border-s-coral focus:ring-2 focus:ring-s-coral/20 max-h-32 overflow-y-auto bg-white dark:bg-s-dm-surface dark:text-s-dm-text min-h-[38px]" />
          <button onClick={() => sendMessage("text")} disabled={!text.trim() || sending}
            className="p-2 rounded-full bg-s-coral text-white disabled:opacity-40 hover:brightness-[1.06] transition-colors shrink-0">
            {sending ? <Spinner size="sm" invert /> : <Send size={16} />}
          </button>
        </div>
      </motion.div>
       )}
      </AnimatePresence>

      {/* Price Offer Modal */}
      <PriceOfferModal
        open={priceOfferModal.open}
        onClose={() => setPriceOfferModal({ open: false, photoUrl: "" })}
        onSubmit={handlePriceOfferSubmit}
      />
    </motion.div>
  );
}
