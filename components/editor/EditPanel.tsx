"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Copy, Check, ChevronDown, ChevronUp, Trash2, Loader2, ClipboardList } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import type { ElementSelectedData } from "./DeviceFrame";

interface EditPanelProps {
  selectedElements: ElementSelectedData[];
  onRemoveElement: (selector: string) => void;
  pageUrl: string;
  onClose: () => void;
  requests: FeatureRequest[];
  onRequestsUpdate: () => void;
}

export interface FeatureRequest {
  id: string;
  page_url: string;
  element_selector: string | null;
  element_tag: string | null;
  element_text: string | null;
  component_hint: string | null;
  description: string;
  priority: string;
  status: string;
  generated_roadmap: string | null;
  roadmap_version: number;
  token_usage: { input_tokens: number; output_tokens: number } | null;
  created_at: string;
}

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

// Guess which area of the page the element is from based on selector/tag/text
function guessPageArea(el: ElementSelectedData): string {
  const s = (el.selector + " " + el.tag + " " + (el.text || "")).toLowerCase();
  if (s.includes("nav") || s.includes("header") || s.includes("logo")) return "Navigation / Header";
  if (s.includes("footer")) return "Footer";
  if (s.includes("hero") || s.includes("banner")) return "Hero Section";
  if (s.includes("card") || s.includes("salon")) return "Salon Card / Listing";
  if (s.includes("button") || s.includes("cta") || s.includes("btn")) return "Button / CTA";
  if (s.includes("form") || s.includes("input") || s.includes("textarea")) return "Form / Input";
  if (s.includes("sidebar") || s.includes("aside")) return "Sidebar";
  if (s.includes("modal") || s.includes("dialog")) return "Modal / Dialog";
  if (s.includes("tab") || s.includes("filter")) return "Tabs / Filters";
  if (el.tag === "img" || el.tag === "svg") return "Image / Icon";
  if (el.tag === "h1" || el.tag === "h2" || el.tag === "h3") return "Heading";
  if (el.tag === "p" || el.tag === "span") return "Text Content";
  if (el.tag === "a") return "Link";
  return "Page Element";
}

export default function EditPanel({
  selectedElements,
  onRemoveElement,
  pageUrl,
  onClose,
  requests,
  onRequestsUpdate,
}: EditPanelProps) {
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [saving, setSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [justSaved, setJustSaved] = useState(false);
  const [showHistory, setShowHistory] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [copiedAll, setCopiedAll] = useState(false);
  const [selectedRequestIds, setSelectedRequestIds] = useState<Set<string>>(new Set());

  // Reset state when elements change
  const selectionKey = selectedElements.map((e) => e.selector).join("|");
  useEffect(() => {
    setError(null);
    setJustSaved(false);
  }, [selectionKey]);

  async function handleSaveRequest() {
    if (!description.trim() || description.length < 5) {
      setError("Description must be at least 5 characters.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const selectors = selectedElements.map((e) => e.selector).join(" ; ");
      const tags = selectedElements.map((e) => e.tag).join(", ");
      const texts = selectedElements.map((e) => e.text).filter(Boolean).join(" | ");
      const hint = selectedElements.find((e) => e.componentHint)?.componentHint ?? null;

      const payload = {
        element_selector: selectors || null,
        element_tag: tags || null,
        element_text: texts || null,
        component_hint: hint,
        page_url: pageUrl,
        description,
        priority,
      };

      const res = await fetch("/api/admin/feature-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || data.message || "Failed to save");
      }

      setDescription("");
      setJustSaved(true);
      onRequestsUpdate();
      setTimeout(() => setJustSaved(false), 3000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save request.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteRequest(id: string) {
    if (!confirm("Delete this feature request?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/feature-requests/${id}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to delete");
      }
      setSelectedRequestIds((prev) => {
        const next = new Set(prev);
        next.delete(id);
        return next;
      });
      onRequestsUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to delete.");
    } finally {
      setDeletingId(null);
    }
  }

  function handleCopySingle(r: FeatureRequest) {
    const text = formatMultipleForClaude([r]);
    navigator.clipboard.writeText(text);
    setCopiedId(r.id);
    setTimeout(() => setCopiedId(null), 2000);
  }

  function handleCopySelected() {
    const selected = requests.filter((r) => selectedRequestIds.has(r.id));
    if (selected.length === 0) return;
    const text = formatMultipleForClaude(selected);
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function handleCopyAllPending() {
    const pending = requests.filter((r) => r.status === "pending");
    if (pending.length === 0) return;
    const text = formatMultipleForClaude(pending);
    navigator.clipboard.writeText(text);
    setCopiedAll(true);
    setTimeout(() => setCopiedAll(false), 2000);
  }

  function toggleRequestSelection(id: string) {
    setSelectedRequestIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const pageRequests = requests.filter((r) => r.page_url === pageUrl);
  const pendingCount = requests.filter((r) => r.status === "pending").length;

  return (
    <motion.aside
      initial={{ x: 360 }}
      animate={{ x: 0 }}
      exit={{ x: 360 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      className="w-[360px] flex-shrink-0 border-l border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface overflow-y-auto h-full"
    >
      <div className="p-4 space-y-4">
        {/* Header */}
        <div className="flex items-center justify-between">
          <h3 className="text-s-ink dark:text-s-dm-text font-heading font-bold text-sm">
            Edit Panel
          </h3>
          <button onClick={onClose} className="p-1 rounded-btn hover:bg-s-bg-sunken dark:hover:bg-s-dm-bg transition-colors">
            <X size={16} className="text-s-ink/50 dark:text-s-dm-text/50" />
          </button>
        </div>

        {/* Selected Elements with area info */}
        {selectedElements.length > 0 ? (
          <div className="space-y-1.5">
            <p className="text-[10px] text-s-ink/50 dark:text-s-dm-text/50">
              {selectedElements.length} element{selectedElements.length > 1 ? "s" : ""} selected — click more in preview to add
            </p>
            {selectedElements.map((el) => (
              <div key={el.selector} className="bg-s-bg-sunken dark:bg-s-dm-bg rounded-card p-2 flex items-start gap-2">
                <div className="flex-1 min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] px-1.5 py-0.5 rounded-pill bg-s-coral/10 text-s-coral font-medium">
                      {guessPageArea(el)}
                    </span>
                    <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 font-mono">
                      &lt;{el.tag}&gt;
                    </span>
                  </div>
                  <p className="text-[10px] text-s-ink/70 dark:text-s-dm-text/70 truncate">
                    {el.text || "(no visible text)"}
                  </p>
                  <p className="text-[9px] text-s-ink/30 dark:text-s-dm-text/30 font-mono truncate">
                    {el.selector.length > 60 ? "..." + el.selector.slice(-57) : el.selector}
                  </p>
                </div>
                <button
                  onClick={() => onRemoveElement(el.selector)}
                  className="p-0.5 rounded hover:bg-s-ink/10 dark:hover:bg-s-dm-text/10 transition-colors flex-shrink-0"
                  title="Remove selection"
                >
                  <X size={12} className="text-s-ink/40 dark:text-s-dm-text/40" />
                </button>
              </div>
            ))}
            {/* Page context */}
            <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40 font-mono">
              Page: {pageUrl}
            </p>
          </div>
        ) : (
          <div className="bg-s-blue/5 dark:bg-s-blue/10 rounded-card p-3 space-y-1">
            <p className="text-xs font-medium text-s-blue">
              General page feedback
            </p>
            <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50">
              Page: <span className="font-mono">{pageUrl}</span>
            </p>
            <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
              No element selected — describe the change for this page below.
            </p>
          </div>
        )}

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-s-ink dark:text-s-dm-text mb-1 block">
            What do you want changed?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={selectedElements.length > 0 ? "Describe the change you want for these elements..." : "Describe what you want changed on this page..."}
            rows={4}
            className="w-full bg-s-bg-sunken dark:bg-s-dm-bg rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 p-3 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 focus:outline-none focus:ring-2 focus:ring-s-coral/30 resize-none"
          />
        </div>

        {/* Priority */}
        <div>
          <label className="text-xs font-medium text-s-ink dark:text-s-dm-text mb-1 block">
            Priority
          </label>
          <div className="flex gap-2">
            {(["low", "medium", "high"] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPriority(p)}
                className={`flex-1 py-1.5 text-xs font-medium rounded-btn transition-colors ${
                  priority === p
                    ? "bg-s-coral text-white"
                    : "bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60 hover:bg-s-bg-surface dark:hover:bg-s-dm-bg/80"
                }`}
              >
                {p.charAt(0).toUpperCase() + p.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-s-error-bg dark:bg-s-error/10 border border-s-error/20 rounded-btn p-3">
            <p className="text-xs text-s-error">{error}</p>
          </div>
        )}

        {/* Save button */}
        <button
          onClick={handleSaveRequest}
          disabled={saving || !description.trim()}
          className={`w-full rounded-btn px-4 py-2 text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
            justSaved
              ? "bg-s-success text-white"
              : "bg-s-coral text-white hover:brightness-[1.06] disabled:opacity-50 disabled:cursor-not-allowed"
          }`}
        >
          {saving ? <Spinner size="sm" invert /> : justSaved ? <Check size={16} /> : null}
          {saving ? "Saving..." : justSaved ? "Saved! Copy below to use with Claude" : "Save Request"}
        </button>

        {/* Copy Actions for Claude */}
        {requests.length > 0 && (
          <div className="border border-s-ink/10 dark:border-s-dm-text/10 rounded-card p-3 space-y-2 bg-s-bg-sunken/50 dark:bg-s-dm-bg/50">
            <div className="flex items-center gap-1.5">
              <ClipboardList size={14} className="text-s-coral" />
              <p className="text-xs font-medium text-s-ink dark:text-s-dm-text">
                Copy for Claude Code
              </p>
            </div>
            <p className="text-[10px] text-s-ink/50 dark:text-s-dm-text/50">
              Copy requests and paste into Claude Code to generate a roadmap.
            </p>

            <div className="flex gap-1.5">
              {pendingCount > 0 && (
                <button
                  onClick={handleCopyAllPending}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-btn transition-colors ${
                    copiedAll
                      ? "bg-s-success text-white"
                      : "bg-s-coral text-white hover:brightness-[1.06]"
                  }`}
                >
                  {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                  {copiedAll ? "Copied!" : `Copy All Pending (${pendingCount})`}
                </button>
              )}
              {selectedRequestIds.size > 0 && (
                <button
                  onClick={handleCopySelected}
                  className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-btn transition-colors ${
                    copiedAll
                      ? "bg-s-success text-white"
                      : "bg-s-ink dark:bg-s-dm-text text-white dark:text-s-dm-bg hover:bg-s-ink/80 dark:hover:bg-s-dm-text/80"
                  }`}
                >
                  {copiedAll ? <Check size={12} /> : <Copy size={12} />}
                  {copiedAll ? "Copied!" : `Copy Selected (${selectedRequestIds.size})`}
                </button>
              )}
            </div>
          </div>
        )}

        {/* Request History for this page */}
        <div>
          <button
            onClick={() => setShowHistory(!showHistory)}
            className="flex items-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
          >
            {showHistory ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Request History ({pageRequests.length})
          </button>
          {showHistory && pageRequests.length > 0 && (
            <div className="mt-2 space-y-2">
              {pageRequests.map((r) => (
                <div key={r.id} className="bg-s-bg-sunken dark:bg-s-dm-bg rounded-btn p-2 space-y-1.5">
                  {/* Checkbox + status + date row */}
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedRequestIds.has(r.id)}
                      onChange={() => toggleRequestSelection(r.id)}
                      className="rounded border-s-ink/20 dark:border-s-dm-text/20 text-s-coral focus:ring-s-coral/30 w-3.5 h-3.5"
                    />
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-medium ${
                      r.status === "done" ? "bg-s-success-bg text-s-success" :
                      r.status === "roadmap_generated" ? "bg-s-blue/10 text-s-blue" :
                      r.status === "in_progress" ? "bg-s-amber-subtle text-s-amber-text" :
                      "bg-s-ink/5 dark:bg-s-dm-text/5 text-s-ink/50 dark:text-s-dm-text/50"
                    }`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-medium ${
                      r.priority === "high" ? "bg-s-error-bg text-s-error" :
                      r.priority === "medium" ? "bg-s-amber-subtle text-s-amber-text" :
                      "bg-s-ink/5 dark:bg-s-dm-text/5 text-s-ink/40 dark:text-s-dm-text/40"
                    }`}>
                      {r.priority}
                    </span>
                    <span className="text-[10px] text-s-ink/30 dark:text-s-dm-text/30 ml-auto">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Description */}
                  <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 line-clamp-2 pl-5.5">{r.description}</p>

                  {/* Element info */}
                  {r.element_tag && (
                    <p className="text-[9px] text-s-ink/40 dark:text-s-dm-text/40 font-mono pl-5.5 truncate">
                      &lt;{r.element_tag}&gt; {r.element_text ? `"${r.element_text.slice(0, 40)}"` : ""}
                    </p>
                  )}

                  {/* Action buttons */}
                  <div className="flex items-center gap-1 pl-5.5">
                    {/* Copy for Claude */}
                    <button
                      onClick={() => handleCopySingle(r)}
                      className={`flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-btn transition-colors ${
                        copiedId === r.id
                          ? "bg-s-success-bg text-s-success"
                          : "bg-s-coral/10 text-s-coral hover:bg-s-coral/20"
                      }`}
                      title="Copy this request formatted for Claude Code"
                    >
                      {copiedId === r.id ? <Check size={10} /> : <Copy size={10} />}
                      {copiedId === r.id ? "Copied!" : "Copy for Claude"}
                    </button>

                    {/* Delete */}
                    <button
                      onClick={() => handleDeleteRequest(r.id)}
                      disabled={deletingId === r.id}
                      className="flex items-center gap-1 px-2 py-1 text-[10px] font-medium rounded-btn bg-s-error-bg dark:bg-s-error/10 text-s-error hover:bg-s-error/15 transition-colors disabled:opacity-50 ml-auto"
                      title="Delete request"
                    >
                      {deletingId === r.id ? (
                        <Loader2 size={10} className="animate-spin" />
                      ) : (
                        <Trash2 size={10} />
                      )}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          {showHistory && pageRequests.length === 0 && (
            <p className="mt-2 text-[10px] text-s-ink/30 dark:text-s-dm-text/30 italic">
              No requests for this page yet.
            </p>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
