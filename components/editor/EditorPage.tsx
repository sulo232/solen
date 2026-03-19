"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import { AnimatePresence } from "framer-motion";
import { ArrowLeft, Monitor, Tablet, Smartphone, RotateCcw, Pencil, List } from "lucide-react";
import { useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import { useWindowSize } from "usehooks-ts";
import DeviceFrame, { type DevicePreset, type ElementSelectedData, type ElementHoveredData } from "./DeviceFrame";
import EditPanel, { type FeatureRequest } from "./EditPanel";
import RequestList from "./RequestList";

type EditorView = "preview" | "requests";

export default function EditorPage() {
  const router = useRouter();
  const locale = useLocale();
  const { width = 1200 } = useWindowSize();

  // State
  const [urlPath, setUrlPath] = useState(`/${locale}/`);
  const [device, setDevice] = useState<DevicePreset>("desktop");
  const [editMode, setEditMode] = useState(true);
  const [selectedElement, setSelectedElement] = useState<ElementSelectedData | null>(null);
  const [hoveredElement, setHoveredElement] = useState<ElementHoveredData | null>(null);
  const [showPanel, setShowPanel] = useState(false);
  const [view, setView] = useState<EditorView>("preview");
  const [bridgeReady, setBridgeReady] = useState(false);

  // Requests state
  const [requests, setRequests] = useState<FeatureRequest[]>([]);
  const [nextCursor, setNextCursor] = useState<string | null>(null);
  const [loadingRequests, setLoadingRequests] = useState(false);

  const iframeRef = useRef<HTMLIFrameElement | null>(null);
  const urlInputRef = useRef<HTMLInputElement>(null);

  // Keyboard shortcuts
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === "Escape") {
        setSelectedElement(null);
        setShowPanel(false);
      }
      if (e.key === "e" || e.key === "E") {
        setEditMode((prev) => !prev);
      }
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        // Submit shortcut handled by EditPanel
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  // Fetch requests
  const fetchRequests = useCallback(async (cursor?: string) => {
    setLoadingRequests(true);
    try {
      const params = new URLSearchParams({ limit: "20" });
      if (cursor) params.set("cursor", cursor);
      const res = await fetch(`/api/admin/feature-requests?${params}`);
      if (!res.ok) return;
      const data = await res.json();
      if (cursor) {
        setRequests((prev) => [...prev, ...data.requests]);
      } else {
        setRequests(data.requests);
      }
      setNextCursor(data.nextCursor);
    } catch {
      // Silent fail — requests list is non-critical
    } finally {
      setLoadingRequests(false);
    }
  }, []);

  useEffect(() => {
    fetchRequests();
  }, [fetchRequests]);

  // Handlers
  const handleBridgeReady = useCallback(() => setBridgeReady(true), []);

  const handleElementSelected = useCallback((data: ElementSelectedData) => {
    setSelectedElement(data);
    setShowPanel(true);
  }, []);

  const handleElementHovered = useCallback((data: ElementHoveredData) => {
    setHoveredElement(data);
  }, []);

  const handleNavigate = () => {
    if (!iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: "EDITOR_NAVIGATE", url: window.location.origin + urlPath },
      window.location.origin
    );
    setBridgeReady(false);
  };

  const handleRevert = () => {
    if (!iframeRef.current) return;
    iframeRef.current.src = window.location.origin + urlPath;
    setBridgeReady(false);
    setSelectedElement(null);
    setShowPanel(false);
  };

  const handleStatusUpdate = async (id: string, status: string) => {
    try {
      await fetch(`/api/admin/feature-requests/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      fetchRequests();
    } catch {
      // Silent fail
    }
  };

  // Mobile gate
  if (width < 1024) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-s-bg-base dark:bg-s-dm-bg p-8">
        <div className="text-center max-w-md">
          <Monitor size={48} className="mx-auto text-s-ink/30 dark:text-s-dm-text/30 mb-4" />
          <h2 className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text mb-2">
            Desktop Required
          </h2>
          <p className="text-sm text-s-ink/60 dark:text-s-dm-text/60">
            Visual Editor requires a desktop browser (1024px+). Please switch to a larger screen.
          </p>
        </div>
      </div>
    );
  }

  const iframeUrl = window.location.origin + urlPath;

  return (
    <div className="flex flex-col h-screen bg-s-bg-base dark:bg-s-dm-bg">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface flex-shrink-0">
        {/* Back */}
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="p-1.5 rounded-button hover:bg-s-bg-sunken dark:hover:bg-s-dm-bg transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} className="text-s-ink dark:text-s-dm-text" />
        </button>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={urlInputRef}
            type="text"
            value={urlPath}
            onChange={(e) => setUrlPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
            className="flex-1 bg-s-bg-sunken dark:bg-s-dm-bg rounded-button border border-s-ink/10 dark:border-s-dm-text/10 px-3 py-1.5 text-xs font-mono text-s-ink dark:text-s-dm-text focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            placeholder="/de/..."
          />
        </div>

        {/* Device presets */}
        <div className="flex items-center gap-0.5 bg-s-bg-sunken dark:bg-s-dm-bg rounded-button p-0.5">
          {([
            { key: "desktop" as const, icon: Monitor, label: "Desktop" },
            { key: "tablet" as const, icon: Tablet, label: "Tablet" },
            { key: "mobile" as const, icon: Smartphone, label: "Mobile" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setDevice(key)}
              className={`p-1.5 rounded-button transition-colors ${
                device === key
                  ? "bg-white dark:bg-s-dm-surface shadow-sm text-s-coral"
                  : "text-s-ink/40 dark:text-s-dm-text/40 hover:text-s-ink dark:hover:text-s-dm-text"
              }`}
              title={label}
            >
              <Icon size={14} />
            </button>
          ))}
        </div>

        {/* Revert */}
        <button
          onClick={handleRevert}
          className="p-1.5 rounded-button hover:bg-s-bg-sunken dark:hover:bg-s-dm-bg text-s-ink/50 dark:text-s-dm-text/50 hover:text-s-ink dark:hover:text-s-dm-text transition-colors"
          title="Revert to live"
        >
          <RotateCcw size={14} />
        </button>

        {/* Edit mode toggle */}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium transition-colors ${
            editMode
              ? "bg-s-coral text-white"
              : "bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60"
          }`}
        >
          <Pencil size={12} />
          {editMode ? "Edit ON" : "Edit OFF"}
        </button>

        {/* View toggle */}
        <button
          onClick={() => setView(view === "preview" ? "requests" : "preview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-button text-xs font-medium transition-colors ${
            view === "requests"
              ? "bg-s-ink dark:bg-s-dm-text text-white dark:text-s-dm-bg"
              : "bg-s-bg-sunken dark:bg-s-dm-bg text-s-ink/60 dark:text-s-dm-text/60"
          }`}
        >
          <List size={12} />
          Requests
        </button>
      </div>

      {/* Main area */}
      <div className="flex flex-1 overflow-hidden">
        {view === "preview" ? (
          <>
            <DeviceFrame
              url={iframeUrl}
              device={device}
              editMode={editMode}
              onBridgeReady={handleBridgeReady}
              onElementSelected={handleElementSelected}
              onElementHovered={handleElementHovered}
              iframeRef={iframeRef}
            />

            <AnimatePresence>
              {showPanel && (
                <EditPanel
                  selectedElement={selectedElement}
                  pageUrl={urlPath}
                  onClose={() => {
                    setShowPanel(false);
                    setSelectedElement(null);
                  }}
                  requests={requests}
                  onRequestsUpdate={() => fetchRequests()}
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto">
            <h2 className="text-lg font-heading font-bold text-s-ink dark:text-s-dm-text mb-4">
              All Feature Requests
            </h2>
            <RequestList
              requests={requests}
              nextCursor={nextCursor}
              loading={loadingRequests}
              onLoadMore={() => nextCursor && fetchRequests(nextCursor)}
              onStatusUpdate={handleStatusUpdate}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1.5 border-t border-s-ink/5 dark:border-s-dm-text/10 bg-white dark:bg-s-dm-surface flex items-center gap-3 text-[10px] text-s-ink/40 dark:text-s-dm-text/40 flex-shrink-0">
        <span>{bridgeReady ? "Bridge connected" : "Waiting for bridge…"}</span>
        <span>•</span>
        <span>{editMode ? "Edit mode ON" : "Edit mode OFF"}</span>
        {selectedElement && (
          <>
            <span>•</span>
            <span>Selected: &lt;{selectedElement.tag}&gt; on {selectedElement.pageUrl}</span>
          </>
        )}
        {hoveredElement && !selectedElement && (
          <>
            <span>•</span>
            <span>Hovering: &lt;{hoveredElement.tag}&gt;</span>
          </>
        )}
      </div>
    </div>
  );
}
