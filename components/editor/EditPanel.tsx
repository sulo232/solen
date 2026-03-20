"use client";

import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { X, Copy, Download, ChevronDown, ChevronUp, Loader2 } from "lucide-react";
import Spinner from "@/components/ui/Spinner";
import type { ElementSelectedData } from "./DeviceFrame";

interface EditPanelProps {
  selectedElement: ElementSelectedData | null;
  pageUrl: string;
  onClose: () => void;
  requests: FeatureRequest[];
  onRequestsUpdate: () => void;
}

export interface FeatureRequest {
  id: string;
  page_url: string;
  description: string;
  priority: string;
  status: string;
  generated_roadmap: string | null;
  roadmap_version: number;
  token_usage: { input_tokens: number; output_tokens: number } | null;
  created_at: string;
}

export default function EditPanel({
  selectedElement,
  pageUrl,
  onClose,
  requests,
  onRequestsUpdate,
}: EditPanelProps) {
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high">("medium");
  const [saving, setSaving] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [roadmap, setRoadmap] = useState<string | null>(null);
  const [roadmapVersion, setRoadmapVersion] = useState<number>(0);
  const [tokenUsage, setTokenUsage] = useState<{ input_tokens: number; output_tokens: number } | null>(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showHistory, setShowHistory] = useState(false);
  const [lastRequestId, setLastRequestId] = useState<string | null>(null);
  const abortRef = useRef<AbortController | null>(null);

  // Reset state when element changes
  useEffect(() => {
    setDescription("");
    setRoadmap(null);
    setError(null);
    setLastRequestId(null);
  }, [selectedElement?.selector]);

  async function handleSaveRequest() {
    if (!description.trim() || description.length < 5) {
      setError("Description must be at least 5 characters.");
      return;
    }
    setError(null);
    setSaving(true);
    try {
      const payload = {
        element_selector: selectedElement?.selector,
        element_tag: selectedElement?.tag,
        element_text: selectedElement?.text,
        component_hint: selectedElement?.componentHint,
        page_url: pageUrl,
        description,
        priority,
      };

      let res: Response;
      try {
        res = await fetch("/api/admin/feature-requests", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } catch (fetchErr: unknown) {
        const msg = fetchErr instanceof Error ? fetchErr.message : String(fetchErr);
        throw new Error(`[fetch] ${msg}`);
      }

      let data;
      try {
        data = await res.json();
      } catch (jsonErr: unknown) {
        const text = await res.clone().text().catch(() => "(unreadable)");
        throw new Error(`[json parse] status=${res.status}, body=${text.slice(0, 200)}`);
      }

      if (!res.ok) throw new Error(data.error || data.message || "Failed to save");
      setLastRequestId(data.request.id);
      onRequestsUpdate();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Failed to save request. Try again.");
    } finally {
      setSaving(false);
    }
  }

  async function handleGenerateRoadmap() {
    if (!lastRequestId) {
      setError("Save the request first before generating a roadmap.");
      return;
    }
    setError(null);
    setGenerating(true);

    // Cancel previous generation
    if (abortRef.current) abortRef.current.abort();
    abortRef.current = new AbortController();

    try {
      const res = await fetch("/api/admin/generate-roadmap", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ requestId: lastRequestId }),
        signal: abortRef.current.signal,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Roadmap generation failed");
      setRoadmap(data.roadmap);
      setRoadmapVersion(data.version);
      setTokenUsage(data.tokenUsage);
      onRequestsUpdate();
    } catch (err: unknown) {
      if (err instanceof Error && err.name === "AbortError") return;
      setError(err instanceof Error ? err.message : "Roadmap generation failed.");
    } finally {
      setGenerating(false);
    }
  }

  function handleCopyRoadmap() {
    if (roadmap) navigator.clipboard.writeText(roadmap);
  }

  function handleDownloadRoadmap() {
    if (!roadmap) return;
    const slug = pageUrl.replace(/\//g, "-").replace(/^-/, "");
    const blob = new Blob([roadmap], { type: "text/markdown" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `roadmap-editor${slug}.md`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const pageRequests = requests.filter((r) => r.page_url === pageUrl);

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
          <button onClick={onClose} className="p-1 rounded-button hover:bg-s-bg-sunken dark:hover:bg-s-dm-bg transition-colors">
            <X size={16} className="text-s-ink/50 dark:text-s-dm-text/50" />
          </button>
        </div>

        {/* Element Info */}
        {selectedElement ? (
          <div className="bg-s-bg-sunken dark:bg-s-dm-bg rounded-card p-3 space-y-1">
            <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60 font-mono">
              &lt;{selectedElement.tag}&gt;
            </p>
            <p className="text-xs text-s-ink/80 dark:text-s-dm-text/80 truncate">
              {selectedElement.text || "(no text)"}
            </p>
            <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 font-mono truncate">
              {selectedElement.selector}
            </p>
            <p className="text-xs text-s-ink/60 dark:text-s-dm-text/60">
              Component: {selectedElement.componentHint || "Unknown — type manually below"}
            </p>
          </div>
        ) : (
          <p className="text-xs text-s-ink/50 dark:text-s-dm-text/50 italic">
            Click an element in the preview to select it
          </p>
        )}

        {/* Description */}
        <div>
          <label className="text-xs font-medium text-s-ink dark:text-s-dm-text mb-1 block">
            What do you want changed?
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Describe the change you want..."
            rows={4}
            className="w-full bg-s-bg-sunken dark:bg-s-dm-bg rounded-button border border-s-ink/10 dark:border-s-dm-text/10 p-3 text-sm text-s-ink dark:text-s-dm-text placeholder:text-s-ink/30 dark:placeholder:text-s-dm-text/30 focus:outline-none focus:ring-2 focus:ring-s-coral/30 resize-none"
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
                className={`flex-1 py-1.5 text-xs font-medium rounded-button transition-colors ${
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
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800/30 rounded-button p-3">
            <p className="text-xs text-red-600 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Action buttons */}
        <div className="space-y-2">
          <button
            onClick={handleSaveRequest}
            disabled={saving || !description.trim()}
            className="w-full bg-s-coral text-white rounded-button px-4 py-2 text-sm font-medium hover:bg-s-coral-hover transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {saving ? <Spinner size="sm" invert /> : null}
            {saving ? "Saving..." : "Save Request"}
          </button>

          <button
            onClick={handleGenerateRoadmap}
            disabled={generating || !lastRequestId}
            className="w-full bg-s-ink dark:bg-s-dm-text text-white dark:text-s-dm-bg rounded-button px-4 py-2 text-sm font-medium hover:bg-s-ink/90 dark:hover:bg-s-dm-text/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {generating ? <Loader2 size={14} className="animate-spin" /> : null}
            {generating ? "Generating roadmap… (10-30s)" : "Generate Roadmap"}
          </button>
        </div>

        {/* Preview Prompt (collapsible) */}
        {selectedElement && (
          <button
            onClick={() => setShowPrompt(!showPrompt)}
            className="flex items-center gap-1 text-xs text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
          >
            {showPrompt ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
            Preview Prompt
          </button>
        )}
        {showPrompt && selectedElement && (
          <pre className="text-[10px] leading-tight bg-s-bg-sunken dark:bg-s-dm-bg rounded-button p-2 overflow-auto max-h-40 text-s-ink/60 dark:text-s-dm-text/60 whitespace-pre-wrap">
            {`Page: ${pageUrl}\nElement: <${selectedElement.tag}> at "${selectedElement.selector}"\nComponent: ${selectedElement.componentHint || "Unknown"}\nText: "${selectedElement.text}"\n\nDescription: "${description}"\nPriority: ${priority}`}
          </pre>
        )}

        {/* Generated Roadmap */}
        {roadmap && (
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h4 className="text-xs font-medium text-s-ink dark:text-s-dm-text">
                Generated Roadmap (v{roadmapVersion})
              </h4>
              <div className="flex gap-1">
                <button onClick={handleCopyRoadmap} className="p-1 rounded-button hover:bg-s-bg-sunken dark:hover:bg-s-dm-bg" title="Copy">
                  <Copy size={12} className="text-s-ink/50 dark:text-s-dm-text/50" />
                </button>
                <button onClick={handleDownloadRoadmap} className="p-1 rounded-button hover:bg-s-bg-sunken dark:hover:bg-s-dm-bg" title="Download">
                  <Download size={12} className="text-s-ink/50 dark:text-s-dm-text/50" />
                </button>
              </div>
            </div>
            <pre className="text-xs leading-relaxed bg-s-bg-sunken dark:bg-s-dm-bg rounded-card p-3 overflow-auto max-h-[50vh] text-s-ink dark:text-s-dm-text whitespace-pre-wrap border border-s-ink/5 dark:border-s-dm-text/10">
              {roadmap}
            </pre>
            {tokenUsage && (
              <p className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
                Tokens: {tokenUsage.input_tokens} in / {tokenUsage.output_tokens} out
                {" "}≈ ${((tokenUsage.input_tokens * 0.003 + tokenUsage.output_tokens * 0.015) / 1000).toFixed(3)}
              </p>
            )}
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
                <div key={r.id} className="bg-s-bg-sunken dark:bg-s-dm-bg rounded-button p-2 space-y-1">
                  <div className="flex items-center justify-between">
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-pill font-medium ${
                      r.status === "done" ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400" :
                      r.status === "roadmap_generated" ? "bg-s-blue/10 text-s-blue" :
                      "bg-s-amber-subtle text-s-amber-text"
                    }`}>
                      {r.status.replace(/_/g, " ")}
                    </span>
                    <span className="text-[10px] text-s-ink/40 dark:text-s-dm-text/40">
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-s-ink/70 dark:text-s-dm-text/70 line-clamp-2">{r.description}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </motion.aside>
  );
}
