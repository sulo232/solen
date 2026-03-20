"use client";

import { useState, useEffect } from "react";
import { Trash2, Eye, EyeOff } from "lucide-react";
import Image from "next/image";
import type { DiscoveryItem } from "@/lib/types";

interface UserPostsSectionProps {
  userId: string;
}

export default function UserPostsSection({ userId }: UserPostsSectionProps) {
  const [posts, setPosts] = useState<DiscoveryItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const res = await fetch(`/api/discovery/feed?creator=${userId}&limit=50`);
        if (res.ok) {
          const data = await res.json();
          setPosts(data.items ?? []);
        }
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [userId]);

  if (loading) {
    return <div className="text-xs text-s-ink/30 dark:text-s-dm-text/30 py-4">Loading posts...</div>;
  }

  if (posts.length === 0) {
    return <div className="text-xs text-s-ink/30 dark:text-s-dm-text/30 py-4">No posts yet</div>;
  }

  return (
    <div className="grid grid-cols-3 gap-2">
      {posts.map((post) => (
        <div key={post.id} className="relative rounded-card overflow-hidden bg-s-ink/5 dark:bg-white/5 aspect-square group">
          {post.image_url ? (
            <Image src={post.image_url} alt={post.style_name ?? ""} fill className="object-cover" sizes="33vw" />
          ) : (
            <div className="flex items-center justify-center h-full text-[10px] text-s-ink/20">
              {post.media_type === "video" ? "Video" : "No image"}
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
            <div className="flex gap-2">
              <span className="text-white text-xs flex items-center gap-1">
                {post.status === "published" ? <Eye size={12} /> : <EyeOff size={12} />}
                {post.status}
              </span>
            </div>
          </div>
          {/* Status badge */}
          {post.status === "flagged" && (
            <div className="absolute top-1 right-1 px-1.5 py-0.5 rounded-pill bg-red-500/80 text-white text-[9px]">
              Flagged
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
