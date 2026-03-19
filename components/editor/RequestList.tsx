"use client";

import { useState } from "react";
import { Copy, Download, ChevronDown, ChevronUp } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import type { FeatureRequest } from "./EditPanel";

interface RequestListProps {
  requests: FeatureRequest[];
  nextCursor: string | null;
  loading: boolean;
  onLoadMore: () => void;
  onStatusUpdate: (id: string, status: string) => void;
}

const STATUS_TABS = ["all", "pending", "roadmap_generated", "in_progress", "done"] as const;

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  pending: "Pending",
  roadmap_generated: "Roadmap Generated",
  in_progress: "In Progress",
  done: "Done",
};

export default function RequestList({
  requests,
  nextCursor,
  loading,
  onLoadMore,
  onStatusUpdate,
}: RequestListProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const filtered = activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  // Cumulative cost
  const totalCost = requests.reduce((acc, r) => {
    if (!r.token_usage) return acc;
    return acc + (r.token_usage.input_tokens * 0.003 + r.token_usage.output_tokens * 0.015) / 1000;
  }, 0);

  function handleCopy(text: string) {
    navigator.clipboard.writeText(text);
  }

  function handleDownload(roadmap: string, pageUrl: string) {
    const slug = pageUrl.replace(/\//g, "-").replace(/^-/, "");
    const blob = new Blob([roadmap], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadmap-editor${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="space-y-3">
      {/* Status tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-3 py-1.5 text-xs font-medium rounded-pill whitespace-nowrap transition-colors ${
              activeTab === tab
                ? "bg-s-coral text-white"
                : "bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-bg-surface dark:hover:bg-s-dm-bg/80"
            }`}
          >
            {STATUS_LABELS[tab]}
          </button>
        ))}
      </div>

      {/* Cumulative cost */}
      {totalCost > 0 && (
        <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
          Total API cost: ${totalCost.toFixed(3)} ({requests.filter((r) => r.token_usage).length} generations)
        </p>
      )}

      {/* Request cards */}
      {filtered.length === 0 ? (
        <p className="text-sm text-s-ink/40 dark:text-s-dm-text/40 text-center py-8">
          No requests found.
        </p>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div
              key={r.id}
              className="bg-white dark:bg-s-dm-surface rounded-card border border-s-ink/5 dark:border-s-dm-text/10 shadow-card overflow-hidden"
            >
              <div className="p-3 space-y-2">
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-s-ink/50 dark:text-s-dm-text/50 truncate">
                      {r.page_url}
                    </p>
                    <p className="text-sm text-s-ink dark:text-s-dm-text mt-0.5 line-clamp-2">
                      {r.description}
                    </p>
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-medium ${
                      r.status === "done" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      r.status === "roadmap_generated" ? "bg-s-blue/10 text-s-blue" :
                      r.status === "in_progress" ? "bg-s-amber-subtle text-s-amber-text" :
                      "bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/50 dark:text-s-dm-text/50"
                    }`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-medium ${
                      r.priority === "high" ? "bg-red-100 dark:bg-red-900/20 text-red-600 dark:text-red-400" :
                      r.priority === "medium" ? "bg-s-amber-subtle text-s-amber-text" :
                      "bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/40 dark:text-s-dm-text/40"
                    }`}>
                      {r.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                  {r.token_usage && (
                    <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30">
                      ≈ ${((r.token_usage.input_tokens * 0.003 + r.token_usage.output_tokens * 0.015) / 1000).toFixed(3)}
                    </span>
                  )}
                </div>

                {/* Status update buttons */}
                <div className="flex gap-1 flex-wrap">
                  {r.status !== "in_progress" && r.status !== "done" && (
                    <button
                      onClick={() => onStatusUpdate(r.id, "in_progress")}
                      className="text-[10px] px-2 py-0.5 rounded-button bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
                    >
                      Mark In Progress
                    </button>
                  )}
                  {r.status !== "done" && (
                    <button
                      onClick={() => onStatusUpdate(r.id, "done")}
                      className="text-[10px] px-2 py-0.5 rounded-button bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
                    >
                      Mark Done
                    </button>
                  )}
                  {r.status === "done" && (
                    <button
                      onClick={() => onStatusUpdate(r.id, "reverted")}
                      className="text-[10px] px-2 py-0.5 rounded-button bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
                    >
                      Revert
                    </button>
                  )}
                </div>

                {/* Expand roadmap */}
                {r.generated_roadmap && (
                  <>
                    <button
                      onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                      className="flex items-center gap-1 text-xs text-s-blue hover:text-s-blue/80 transition-colors"
                    >
                      {expandedId === r.id ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                      Roadmap v{r.roadmap_version}
                    </button>
                    {expandedId === r.id && (
                      <div className="space-y-1">
                        <div className="flex gap-1">
                          <button onClick={() => handleCopy(r.generated_roadmap!)} className="p-1 rounded-button hover:bg-s-bg-sunken dark:hover:bg-s-dm-bg" title="Copy">
                            <Copy size={12} className="text-s-ink/40 dark:text-s-dm-text/40" />
                          </button>
                          <button onClick={() => handleDownload(r.generated_roadmap!, r.page_url)} className="p-1 rounded-button hover:bg-s-bg-sunken dark:hover:bg-s-dm-bg" title="Download">
                            <Download size={12} className="text-s-ink/40 dark:text-s-dm-text/40" />
                          </button>
                        </div>
                        <pre className="text-xs bg-s-bg-sunken dark:bg-s-dm-bg rounded-button p-2 overflow-auto max-h-60 text-s-ink dark:text-s-dm-text whitespace-pre-wrap">
                          {r.generated_roadmap}
                        </pre>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Load more */}
      {nextCursor && (
        <button
          onClick={onLoadMore}
          disabled={loading}
          className="w-full py-2 text-xs text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors flex items-center justify-center gap-2"
        >
          {loading ? <Spinner size="sm" /> : null}
          {loading ? "Loading..." : "Load more"}
        </button>
      )}
    </div>
  );
}
