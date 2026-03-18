"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import Image from "next/image";
import { Send, Image as ImageIcon, X, Paperclip, DollarSign } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Spinner from "@/components/ui/Spinner";
import type { Message } from "@/lib/types";

interface ChatWindowProps {
  conversationId: string;
  perspective: "customer" | "salon";
  currentUserId: string;
}

const PAGE_SIZE = 30;

export default function ChatWindow({ conversationId, perspective, currentUserId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [showImageInput, setShowImageInput] = useState(false);
  const [uploading, setUploading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

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

  // Supabase Realtime — new messages
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
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

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
    if (file.size > 10 * 1024 * 1024) { alert("Datei zu gross (max 10MB)"); return; }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch(`/api/conversations/${conversationId}/upload`, {
        method: "POST",
        body: formData,
      });
      if (!res.ok) { const err = await res.json(); alert(err.error || "Upload fehlgeschlagen"); return; }
      const { url } = await res.json();

      // Send as image message
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
      alert("Upload fehlgeschlagen");
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage("text"); }
  };

  const isOwn = (msg: Message) => msg.sender_id === currentUserId;

  return (
    <div className="flex flex-col h-full min-h-[400px] bg-white rounded-card border border-gray-100">
      {/* Header */}
      <div className="px-4 py-3 border-b border-gray-100">
        <span className="text-xs text-dark/40 font-medium uppercase tracking-wide">
          {perspective === "salon" ? "Kundennachricht" : "Nachricht ans Salon"}
        </span>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
        {loading ? (
          <div className="flex justify-center py-8"><Spinner size="sm" /></div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-dark/30 text-sm">
            <p>Noch keine Nachrichten.</p>
            <p className="text-xs mt-1">Starte das Gespräch!</p>
          </div>
        ) : messages.map((msg) => (
          <div key={msg.id} className={["flex gap-2", isOwn(msg) ? "flex-row-reverse" : "flex-row"].join(" ")}>
            <div className={[
              "max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-relaxed",
              isOwn(msg) ? "bg-teal text-white rounded-tr-sm" : "bg-gray-100 text-dark rounded-tl-sm",
            ].join(" ")}>
              {msg.message_type === "image" && msg.image_url ? (
                <div className="rounded-xl overflow-hidden max-w-[200px]">
                  <Image src={msg.image_url} alt="Bild" width={200} height={150} className="object-cover" />
                </div>
              ) : msg.message_type === "price_offer" ? (
                <div className="flex items-center gap-2 bg-white/20 rounded-lg p-2">
                  <DollarSign className="w-4 h-4 shrink-0" />
                  <p className="whitespace-pre-wrap break-words text-xs">{msg.content}</p>
                </div>
              ) : (
                <p className="whitespace-pre-wrap break-words">{msg.content}</p>
              )}
              <p className={["text-[10px] mt-0.5", isOwn(msg) ? "text-white/60 text-right" : "text-dark/30"].join(" ")}>
                {new Date(msg.created_at).toLocaleTimeString("de-CH", { hour: "2-digit", minute: "2-digit" })}
                {msg.id.startsWith("optimistic") && " · Senden..."}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Image URL input */}
      {showImageInput && (
        <div className="px-4 pb-2 flex gap-2">
          <input type="url" value={imageUrl} onChange={(e) => setImageUrl(e.target.value)}
            placeholder="Bild-URL eingeben..."
            className="flex-1 px-3 py-2 text-sm border border-gray-200 rounded-button focus:outline-none focus:border-teal"
            autoFocus />
          <button onClick={() => sendMessage("image")} disabled={!imageUrl.trim() || sending}
            className="px-3 py-2 rounded-button bg-teal text-white text-sm disabled:opacity-50">Senden</button>
          <button onClick={() => { setShowImageInput(false); setImageUrl(""); }}
            className="px-2 py-2 rounded-button border border-gray-200 text-dark/40 hover:text-dark">
            <X size={14} />
          </button>
        </div>
      )}

      {/* Hidden file input for uploads */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/gif,image/webp,video/mp4,video/quicktime"
        className="hidden"
        onChange={handleFileUpload}
      />

      {/* Compose bar */}
      <div className="px-4 py-3 border-t border-gray-100 flex items-end gap-2">
        <button
          onClick={() => fileInputRef.current?.click()}
          disabled={uploading}
          className="p-2 rounded-button text-dark/30 hover:text-teal hover:bg-teal/5 transition-colors shrink-0 disabled:opacity-40"
          title="Datei anhängen"
        >
          {uploading ? <Spinner size="sm" /> : <Paperclip size={18} />}
        </button>
        <button onClick={() => setShowImageInput((s) => !s)}
          className="p-2 rounded-button text-dark/30 hover:text-teal hover:bg-teal/5 transition-colors shrink-0"
          title="Bild-URL senden">
          <ImageIcon size={18} />
        </button>
        <textarea ref={inputRef} value={text} onChange={(e) => setText(e.target.value)}
          onKeyDown={handleKeyDown} placeholder="Nachricht schreiben…" rows={1}
          className="flex-1 resize-none px-3 py-2 text-sm border border-gray-200 rounded-button focus:outline-none focus:border-teal max-h-32 overflow-y-auto"
          style={{ minHeight: "38px" }} />
        <button onClick={() => sendMessage("text")} disabled={!text.trim() || sending}
          className="p-2 rounded-full bg-teal text-white disabled:opacity-40 hover:bg-teal/90 transition-colors shrink-0">
          {sending ? <Spinner size="sm" invert /> : <Send size={16} />}
        </button>
      </div>
    </div>
  );
}
