"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { useLocale } from "next-intl";
import { Send, Image as ImageIcon, X, Paperclip, DollarSign, Camera, Check, CheckCheck, Languages } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
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
}

const PAGE_SIZE = 30;

export default function ChatWindow({ conversationId, perspective, currentUserId, salonId, salonName, salonSlug, salonServices }: ChatWindowProps) {
  const locale = useLocale();
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

  const isSalonOwner = perspective === "salon";

  const loadMessages = useCallback(async () => {
    try {
      const res = await fetch(`/api/conversations/${conversationId}/messages?limit=${PAGE_SIZE}`);
      const data = await res.json();
      setMessages(data.messages ?? []);
    } catch { /* ignore */ } finally {
      setLoading(false);
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
    if (file.size > 10 * 1024 * 1024) { toast("Datei zu gross (max 10MB)", "error"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) { const err = await res.json(); toast(err.error || "Upload fehlgeschlagen", "error"); return; }
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
      toast("Upload fehlgeschlagen", "error");
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
        toast("Angebot gesendet", "success");
        loadMessages();
      } else {
        toast("Angebot konnte nicht gesendet werden", "error");
      }
    } catch {
      toast("Angebot konnte nicht gesendet werden", "error");
    }
  };

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-white/5">
      {/* Tab header */}
      <div className="flex border-b border-s-ink/10 dark:border-gray-700">
        <button
          onClick={() => setActiveTab("chat")}
          className={["flex-1 py-2 text-sm font-medium transition-colors",
            activeTab === "chat" ? "text-s-coral border-b-2 border-s-coral" : "text-s-ink/50 dark:text-s-ink/40"
          ].join(" ")}
        >
          Chat
        </button>
        <button
          onClick={() => setActiveTab("photos")}
          className={["flex-1 py-2 text-sm font-medium transition-colors",
            activeTab === "photos" ? "text-s-coral border-b-2 border-s-coral" : "text-s-ink/50 dark:text-s-ink/40"
          ].join(" ")}
        >
          <Camera size={14} className="inline mr-1 -mt-0.5" />
          Fotos
        </button>
      </div>

      {/* Photo Gallery */}
      <div style={{ display: activeTab === "photos" ? "block" : "none" }} className="flex-1 overflow-y-auto">
        <PhotoGallery
          conversationId={conversationId}
          isSalonOwner={isSalonOwner}
          onCreateOffer={handleCreatePhotoOffer}
        />
      </div>

      {/* Chat content */}
      <div style={{ display: activeTab === "chat" ? "flex" : "none" }} className="flex flex-col flex-1 min-h-0">
        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loading ? (
            <div className="flex justify-center py-8"><Spinner size="sm" /></div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-s-ink/30 dark:text-s-dm-text/30 text-sm">
              <p>Noch keine Nachrichten.</p>
              <p className="text-xs mt-1">Starte das Gespräch!</p>
            </div>
          ) : messages.map((msg) => (
            <div key={msg.id} className={["group flex gap-2", isOwn(msg) ? "flex-row-reverse" : "flex-row"].join(" ")}>
              <div className={[
                "max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
                isOwn(msg) ? "bg-s-coral text-white rounded-tr-sm" : "bg-s-bg-sunken dark:bg-gray-800 text-s-ink dark:text-s-dm-text rounded-tl-sm",
              ].join(" ")}>
                {msg.message_type === "image" && msg.image_url ? (
                  <div>
                    <div className="rounded-xl overflow-hidden max-w-[200px]">
                      <Image src={msg.image_url} alt="Bild" width={200} height={150} className="object-cover" />
                    </div>
                    {isSalonOwner && (
                      <button
                        onClick={() => handleCreatePhotoOffer(msg.image_url!)}
                        className="mt-1 text-xs text-s-coral-200 hover:text-white hover:underline flex items-center gap-1"
                        aria-label="Angebot für dieses Foto erstellen"
                      >
                        <Camera size={12} /> Angebot erstellen
                      </button>
                    )}
                  </div>
                ) : msg.message_type === "price_offer" ? (
                  <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
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
                        <span className="ml-1 opacity-50">Übersetzt</span>
                      </p>
                    )}
                  </div>
                )}
                <div className={["flex items-center gap-1 mt-0.5", isOwn(msg) ? "justify-end" : ""].join(" ")}>
                  <span className={["text-[10px]", isOwn(msg) ? "text-white/60" : "text-s-ink/30 dark:text-s-dm-text/30"].join(" ")}>
                    {new Date(msg.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                    {msg.id.startsWith("optimistic") && " · Senden..."}
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
                      title="Übersetzen"
                      style={{ opacity: translating === msg.id ? 1 : undefined }}
                    >
                      {translating === msg.id ? <Spinner size="sm" /> : <Languages size={10} />}
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
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
              placeholder="Bild-URL eingeben..."
              className="flex-1 px-3 py-2 text-sm border border-s-ink/10 dark:border-gray-700 rounded-button focus:outline-none focus:border-s-coral bg-white dark:bg-s-dm-surface dark:text-s-dm-text"
              autoFocus />
            <button onClick={() => sendMessage("image")} disabled={!imageUrl.trim() || sending}
              className="px-3 py-2 rounded-button bg-s-coral text-white text-sm disabled:opacity-50">Senden</button>
            <button onClick={() => { setShowImageInput(false); setImageUrl(""); }}
              className="px-2 py-2 rounded-button border border-s-ink/10 dark:border-gray-700 text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text">
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
        <div className="px-4 py-3 border-t border-s-ink/5 dark:border-gray-700 flex items-end gap-2">
          <button
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="p-2 rounded-button text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral hover:bg-s-coral/5 transition-colors shrink-0 disabled:opacity-40"
            title="Datei anhängen"
          >
            {uploading ? <Spinner size="sm" /> : <Paperclip size={18} />}
          </button>
          <button onClick={() => setShowImageInput((s) => !s)}
            className="p-2 rounded-button text-s-ink/30 dark:text-s-dm-text/30 hover:text-s-coral hover:bg-s-coral/5 transition-colors shrink-0"
            title="Bild-URL senden">
            <ImageIcon size={18} />
          </button>
          <textarea ref={inputRef} value={text} onChange={handleTextChange}
            onKeyDown={handleKeyDown} placeholder="Nachricht schreiben…" rows={1}
            className="flex-1 resize-none px-3 py-2 text-sm border border-s-ink/10 dark:border-gray-700 rounded-button focus:outline-none focus:border-s-coral max-h-32 overflow-y-auto bg-white dark:bg-s-dm-surface dark:text-s-dm-text"
            style={{ minHeight: "38px" }} />
          <button onClick={() => sendMessage("text")} disabled={!text.trim() || sending}
            className="p-2 rounded-full bg-s-coral text-white disabled:opacity-40 hover:bg-s-coral/90 transition-colors shrink-0">
            {sending ? <Spinner size="sm" invert /> : <Send size={16} />}
          </button>
        </div>
      </div>

      {/* Price Offer Modal */}
      <PriceOfferModal
        open={priceOfferModal.open}
        onClose={() => setPriceOfferModal({ open: false, photoUrl: "" })}
        onSubmit={handlePriceOfferSubmit}
      />
    </div>
  );
}
