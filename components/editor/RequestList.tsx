"use client";

import { useState } from "react";
import { Copy, Check, ChevronDown, ChevronUp, Trash2, Loader2, ClipboardList } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import type { FeatureRequest } from "./EditPanel";

interface RequestListProps {
  requests: FeatureRequest[];
  nextCursor: string | null;
  loading: boolean;
  onLoadMore: () => void;
  onStatusUpdate: (id: string, status: string) => void;
  onDelete: (id: string) => void;
  deletingId: string | null;
}

const STATUS_TABS = ["all", "pending", "in_progress", "done"] as const;

const STATUS_LABELS: Record<string, string> = {
  all: "All",
  pending: "Pending",
  in_progress: "In Progress",
  done: "Done",
};

// Format a single request into a Claude-ready prompt block
function formatRequestForClaude(r: FeatureRequest): string {
  const lines: string[] = [];
  lines.push(`## Change Request: ${r.description.slice(0, 80)}`);
  lines.push("");
  lines.push(`**Page**: ${r.page_url}`);
  if (r.element_tag) lines.push(`**Element(s)**: <${r.element_tag}>`);
  if (r.element_selector) lines.push(`**Selector**: \`${r.element_selector}\``);
  if (r.element_text) lines.push(`**Visible text**: "${r.element_text.slice(0, 120)}"`);
  if (r.component_hint) lines.push(`**Component hint**: ${r.component_hint}`);
  lines.push(`**Priority**: ${r.priority}`);
  lines.push("");
  lines.push(`**Description**: ${r.description}`);
  return lines.join("\n");
}

// Format multiple requests into one combined prompt
function formatMultipleForClaude(requests: FeatureRequest[]): string {
  const header = `# Feature Requests for solen.ch

Please read CLAUDE.md and _tasks/ folder first, then create a roadmap (following R1-R8 standards) to implement these ${requests.length} change request${requests.length > 1 ? "s" : ""}:

---
`;
  const body = requests.map((r, i) => `### Request ${i + 1}\n${formatRequestForClaude(r)}`).join("\n\n---\n\n");
  const footer = `\n\n---\n\nGenerate a complete roadmap in \`_tasks/roadmap-editor-requests.md\` following CLAUDE.md Section 12 (R1-R8). Include exact file paths, code diffs, risk assessment, and verification steps.`;
  return header + body + footer;
}

export default function RequestList({
  requests,
  nextCursor,
  loading,
  onLoadMore,
  onStatusUpdate,
  onDelete,
  deletingId,
}: RequestListProps) {
  const [activeTab, setActiveTab] = useState<string>("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const filtered = activeTab === "all" ? requests : requests.filter((r) => r.status === activeTab);

  function handleCopySingle(r: FeatureRequest) {
    navigator.clipboard.writeText(formatMultipleForClaude([r]));
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCopySelected() {
    const selected = requests.filter((r) => selectedIds.has(r.id));
    if (selected.length === 0) return;
    navigator.clipboard.writeText(formatMultipleForClaude(selected));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function handleCopyAllPending() {
    const pending = requests.filter((r) => r.status === "pending");
    if (pending.length === 0) return;
    navigator.clipboard.writeText(formatMultipleForClaude(pending));
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function toggleSelection(id: string) {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const pendingCount = requests.filter((r) => r.status === "pending").length;

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

      {/* Copy for Claude section */}
      {requests.length > 0 && (
        <div className="border border-s-ink/10 dark:border-s-dm-text/10 rounded-[12px] p-3 space-y-2 bg-s-bg-sunken/50 dark:bg-s-dm-bg/50">
          <div className="flex items-center gap-1.5">
            <ClipboardList size={14} className="text-s-coral" />
            <p className="text-xs font-medium text-s-ink dark:text-s-dm-text">
              Copy for Claude Code
            </p>
          </div>
          <p className="text-[10px] text-s-ink/50 dark:text-s-dm-text/50">
            Select requests with checkboxes, then copy and paste into Claude Code.
          </p>
          <div className="flex gap-1.5 flex-wrap">
            {pendingCount > 0 && (
              <button
                onClick={handleCopyAllPending}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-btn transition-colors ${
                  copiedAll
                    ? "bg-s-success text-white"
                    : "bg-s-coral text-white hover:brightness-[1.06]"
                }`}
              >
                {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                {copiedAll ? "Copied!" : `Copy All Pending (${pendingCount})`}
              </button>
            )}
            {selectedIds.size > 0 && (
              <button
                onClick={handleCopySelected}
                className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-btn transition-colors ${
                  copiedAll
                    ? "bg-s-success text-white"
                    : "bg-s-ink dark:bg-s-dm-text text-white dark:text-s-dm-bg hover:bg-s-ink/80 dark:hover:bg-s-dm-text/80"
                }`}
              >
                {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                {copiedAll ? "Copied!" : `Copy Selected (${selectedIds.size})`}
              </button>
            )}
          </div>
        </div>
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
              className="bg-white dark:bg-s-dm-surface rounded-[12px] border border-s-ink/5 dark:border-s-dm-text/10 shadow-warm-md overflow-hidden"
            >
              <div className="p-3 space-y-2">
                <div className="flex items-start gap-2">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedIds.has(r.id)}
                    onChange={() => toggleSelection(r.id)}
                    className="mt-1 rounded border-s-ink/20 dark:border-s-dm-text/20 text-s-coral focus:ring-s-coral/30 w-3.5 h-3.5 flex-shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-s-ink/50 dark:text-s-dm-text/50 truncate">
                      {r.page_url}
                    </p>
                    <p className="text-sm text-s-ink dark:text-s-dm-text mt-0.5 line-clamp-2">
                      {r.description}
                    </p>
                    {r.element_tag && (
                      <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 font-mono mt-0.5 truncate">
                        &lt;{r.element_tag}&gt; {r.element_text ? `"${r.element_text.slice(0, 50)}"` : ""}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1 flex-shrink-0">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-medium ${
                      r.status === "done" ? "bg-s-success-bg text-s-success" :
                      r.status === "in_progress" ? "bg-s-amber-subtle text-s-amber-text" :
                      "bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/50 dark:text-s-dm-text/50"
                    }`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-medium ${
                      r.priority === "high" ? "bg-s-error-bg text-s-error" :
                      r.priority === "medium" ? "bg-s-amber-subtle text-s-amber-text" :
                      "bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/40 dark:text-s-dm-text/40"
                    }`}>
                      {r.priority}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pl-5.5">
                  <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30">
                    {new Date(r.created_at).toLocaleString()}
                  </span>
                </div>

                {/* Action buttons */}
                <div className="flex gap-1 flex-wrap items-center pl-5.5">
                  {/* Status buttons */}
                  {r.status !== "pending" && (
                    <button
                      onClick={() => onStatusUpdate(r.id, "pending")}
                      className="text-[10px] px-2 py-0.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
                    >
                      Reset
                    </button>
                  )}
                  {r.status !== "in_progress" && r.status !== "done" && (
                    <button
                      onClick={() => onStatusUpdate(r.id, "in_progress")}
                      className="text-[10px] px-2 py-0.5 rounded-btn bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
                    >
                      In Progress
                    </button>
                  )}
                  {r.status !== "done" && (
                    <button
                      onClick={() => onStatusUpdate(r.id, "done")}
                      className="text-[10px] px-2 py-0.5 rounded-btn bg-s-success-bg text-s-success hover:bg-s-success/15 transition-colors"
                    >
                      Done
                    </button>
                  )}

                  {/* Copy for Claude */}
                  <button
                    onClick={() => handleCopySingle(r)}
                    className={`text-[10px] px-2 py-0.5 rounded-btn flex items-center gap-1 transition-colors ${
                      copiedId === r.id
                        ? "bg-s-success-bg text-s-success"
                        : "bg-s-coral/10 text-s-coral hover:bg-s-coral/20"
                    }`}
                  >
                    {copiedId === r.id ? <Check size={9} /> : <Copy size={9} />}
                    {copiedId === r.id ? "Copied!" : "Copy for Claude"}
                  </button>

                  {/* Expand details */}
                  <button
                    onClick={() => setExpandedId(expandedId === r.id ? null : r.id)}
                    className="text-[10px] px-2 py-0.5 rounded-btn bg-s-ink/5 dark:bg-s-dm-text/5 text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors flex items-center gap-1"
                  >
                    {expandedId === r.id ? <ChevronUp size={9} /> : <ChevronDown size={9} />}
                    Details
                  </button>

                  {/* Delete */}
                  <button
                    onClick={() => onDelete(r.id)}
                    disabled={deletingId === r.id}
                    className="text-[10px] px-2 py-0.5 rounded-btn bg-s-error-bg dark:bg-s-error/10 text-s-error hover:bg-s-error/15 transition-colors flex items-center gap-1 disabled:opacity-50 ml-auto"
                  >
                    {deletingId === r.id ? <Loader2 size={9} className="animate-spin" /> : <Trash2 size={9} />}
                    Delete
                  </button>
                </div>

                {/* Expanded details - shows selector, element info, and Claude prompt preview */}
                {expandedId === r.id && (
                  <div className="space-y-2 pl-5.5 pt-1 border-t border-s-ink/5 dark:border-s-dm-text/5 mt-1">
                    {r.element_selector && (
                      <div>
                        <p className="text-[10px] font-medium text-s-ink/50 dark:text-s-dm-text/50">Selector</p>
                        <p className="text-[10px] font-mono text-s-ink/40 dark:text-s-dm-text/40 break-all">{r.element_selector}</p>
                      </div>
                    )}
                    {r.component_hint && (
                      <div>
                        <p className="text-[10px] font-medium text-s-ink/50 dark:text-s-dm-text/50">Component</p>
                        <p className="text-[10px] font-mono text-s-ink/40 dark:text-s-dm-text/40">{r.component_hint}</p>
                      </div>
                    )}
                    <div>
                      <p className="text-[10px] font-medium text-s-ink/50 dark:text-s-dm-text/50 mb-1">Claude Prompt Preview</p>
                      <pre className="text-[10px] bg-s-bg-sunken dark:bg-s-dm-bg rounded-btn p-2 overflow-auto max-h-40 text-s-ink/60 dark:text-s-dm-text/60 whitespace-pre-wrap">
                        {formatRequestForClaude(r)}
                      </pre>
                    </div>
                  </div>
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
