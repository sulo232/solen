"use client";

import { useState, useEffect, useCallback } from "react";
import { MessageCircle, Send, ChevronDown } from "lucide-react";
import Image from "next/image";
import ReportButton from "./ReportButton";
import { useTranslations } from "next-intl";

interface Comment {
  id: string;
  user_id: string;
  text: string;
  created_at: string;
  user: { display_name: string; avatar_url: string | null };
}

interface CommentSectionProps {
  itemId: string;
  isAuthenticated: boolean;
  onAuthRequired?: () => void;
}

export default function CommentSection({ itemId, isAuthenticated, onAuthRequired }: CommentSectionProps) {
  const t = useTranslations("discover.comments") as any;
  const [comments, setComments] = useState<Comment[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [posting, setPosting] = useState(false);
  const [expanded, setExpanded] = useState(false);

  const fetchComments = useCallback(async (p: number) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/discovery/comments?item_id=${itemId}&page=${p}`);
      if (!res.ok) return;
      const data = await res.json();
      if (p === 1) {
        setComments(data.comments);
      } else {
        setComments((prev) => [...prev, ...data.comments]);
      }
      setTotal(data.total);
      setHasMore(data.has_more);
    } finally {
      setLoading(false);
    }
  }, [itemId]);

  useEffect(() => {
    if (expanded) fetchComments(1);
  }, [expanded, fetchComments]);

  const handlePost = async () => {
    if (!isAuthenticated) {
      onAuthRequired?.();
      return;
    }
    if (!text.trim() || posting) return;

    setPosting(true);
    try {
      const res = await fetch("/api/discovery/comments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ item_id: itemId, text: text.trim() }),
      });
      if (res.ok) {
        setText("");
        // Refresh comments
        fetchComments(1);
        setPage(1);
      }
    } finally {
      setPosting(false);
    }
  };

  const loadMore = () => {
    const next = page + 1;
    setPage(next);
    fetchComments(next);
  };

  return (
    <div className="mt-3">
      <button
        onClick={() => setExpanded(!expanded)}
        className="flex items-center gap-1.5 text-xs text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
      >
        <MessageCircle size={14} />
        <span>{total > 0 ? t("count", { count: total }) : t("label")}</span>
      </button>

      {expanded && (
        <div className="mt-2 space-y-2">
          {/* Input */}
          <div className="flex gap-2">
            <input
              type="text"
              value={text}
              onChange={(e) => setText(e.target.value.slice(0, 500))}
              placeholder={isAuthenticated ? t("placeholder") : t("loginPrompt")}
              className="flex-1 text-xs px-3 py-2 rounded-pill bg-s-bg-sunken dark:bg-s-dm-surface border border-s-ink/10 dark:border-white/5 text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30"
              onKeyDown={(e) => e.key === "Enter" && handlePost()}
              disabled={!isAuthenticated}
            />
            <button
              onClick={handlePost}
              disabled={!text.trim() || posting}
              className="p-2 rounded-full bg-s-coral text-white disabled:opacity-40 transition-opacity"
              aria-label="Post comment"
            >
              <Send size={14} />
            </button>
          </div>

          {/* Comments list */}
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-2 text-xs">
                <div className="w-6 h-6 rounded-full bg-s-ink/10 dark:bg-white/10 flex items-center justify-center text-[10px] font-medium text-s-ink/50 dark:text-s-dm-text/50 shrink-0">
                  {c.user.avatar_url ? (
                    <Image src={c.user.avatar_url} alt={c.user.display_name} width={24} height={24} className="rounded-full object-cover" />
                  ) : (
                    c.user.display_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="font-medium text-s-ink dark:text-s-dm-text truncate">{c.user.display_name}</span>
                    <span className="text-s-ink/30 dark:text-s-dm-text/30">
                      {new Date(c.created_at).toLocaleDateString()}
                    </span>
                    <ReportButton type="comment" targetId={c.id} />
                  </div>
                  <p className="text-s-ink/70 dark:text-s-dm-text/70 break-words">{c.text}</p>
                </div>
              </div>
            ))}
            {loading && <p className="text-xs text-s-ink/30 dark:text-s-dm-text/30">{t("loading") ?? "..."}</p>}
          </div>

          {hasMore && !loading && (
            <button
              onClick={loadMore}
              className="flex items-center gap-1 text-xs text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink/70 mx-auto"
            >
              <ChevronDown size={12} /> {t("loadMore")}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
