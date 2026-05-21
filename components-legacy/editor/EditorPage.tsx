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
  const [selectedElements, setSelectedElements] = useState<ElementSelectedData[]>([]);
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
        setSelectedElements([]);
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
    setSelectedElements((prev) => {
      // Don't add duplicates (same selector)
      if (prev.some((el) => el.selector === data.selector)) return prev;
      return [...prev, data];
    });
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
    setSelectedElements([]);
    setShowPanel(false);
  };

  const [deletingId, setDeletingId] = useState<string | null>(null);

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

  const handleDeleteRequest = async (id: string) => {
    if (!confirm("Delete this feature request?")) return;
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/feature-requests/${id}`, { method: "DELETE" });
      if (res.ok) fetchRequests();
    } catch {
      // Silent fail
    } finally {
      setDeletingId(null);
    }
  };

  // Mobile gate
  if (width < 1024) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-white p-8">
        <div className="text-center max-w-md">
          <Monitor size={48} className="mx-auto text-s-ink/30 mb-4" />
          <h2 className="text-lg font-heading text-s-ink mb-2">
            Desktop Required
          </h2>
          <p className="text-sm text-s-ink/60">
            Visual Editor requires a desktop browser (1024px+). Please switch to a larger screen.
          </p>
        </div>
      </div>
    );
  }

  const iframeUrl = window.location.origin + urlPath;

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-s-ink/5 bg-white flex-shrink-0">
        {/* Back */}
        <button
          onClick={() => router.push(`/${locale}/dashboard`)}
          className="p-1.5 rounded-btn hover:bg-s-bg-sunken transition-colors"
          title="Back to Dashboard"
        >
          <ArrowLeft size={16} className="text-s-ink" />
        </button>

        {/* URL bar */}
        <div className="flex-1 flex items-center gap-1">
          <input
            ref={urlInputRef}
            type="text"
            value={urlPath}
            onChange={(e) => setUrlPath(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleNavigate()}
            className="flex-1 bg-s-bg-sunken rounded-btn border border-s-ink/10 px-3 py-1.5 text-xs font-mono text-s-ink focus:outline-none focus:ring-2 focus:ring-s-coral/30"
            placeholder="/de/..."
          />
        </div>

        {/* Device presets */}
        <div className="flex items-center gap-0.5 bg-s-bg-sunken rounded-btn p-0.5">
          {([
            { key: "desktop" as const, icon: Monitor, label: "Desktop" },
            { key: "tablet" as const, icon: Tablet, label: "Tablet" },
            { key: "mobile" as const, icon: Smartphone, label: "Mobile" },
          ]).map(({ key, icon: Icon, label }) => (
            <button
              key={key}
              onClick={() => setDevice(key)}
              className={`p-1.5 rounded-btn transition-colors ${
                device === key
                  ? "bg-white shadow-warm-sm text-s-coral"
                  : "text-s-ink/40 hover:text-s-ink"
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
          className="p-1.5 rounded-btn hover:bg-s-bg-sunken text-s-ink/50 hover:text-s-ink transition-colors"
          title="Revert to live"
        >
          <RotateCcw size={14} />
        </button>

        {/* Edit mode toggle */}
        <button
          onClick={() => setEditMode(!editMode)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
            editMode
              ? "bg-s-coral text-white"
              : "bg-s-bg-sunken text-s-ink/60"
          }`}
        >
          <Pencil size={12} />
          {editMode ? "Edit ON" : "Edit OFF"}
        </button>

        {/* Open panel (no selection) */}
        <button
          onClick={() => {
            setSelectedElements([]);
            setShowPanel(true);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium bg-s-bg-sunken text-s-ink/60 hover:text-s-ink transition-colors"
          title="Describe a change without selecting an element"
        >
          <Pencil size={12} />
          Describe
        </button>

        {/* View toggle */}
        <button
          onClick={() => setView(view === "preview" ? "requests" : "preview")}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-btn text-xs font-medium transition-colors ${
            view === "requests"
              ? "bg-s-ink text-white"
              : "bg-s-bg-sunken text-s-ink/60"
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
                  selectedElements={selectedElements}
                  onRemoveElement={(selector) => {
                    setSelectedElements((prev) => prev.filter((el) => el.selector !== selector));
                  }}
                  pageUrl={urlPath}
                  onClose={() => {
                    setShowPanel(false);
                    setSelectedElements([]);
                  }}
                  requests={requests}
                  onRequestsUpdate={() => fetchRequests()}
                />
              )}
            </AnimatePresence>
          </>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 max-w-3xl mx-auto">
            <h2 className="text-lg font-heading text-s-ink mb-4">
              All Feature Requests
            </h2>
            <RequestList
              requests={requests}
              nextCursor={nextCursor}
              loading={loadingRequests}
              onLoadMore={() => nextCursor && fetchRequests(nextCursor)}
              onStatusUpdate={handleStatusUpdate}
              onDelete={handleDeleteRequest}
              deletingId={deletingId}
            />
          </div>
        )}
      </div>

      {/* Status bar */}
      <div className="px-3 py-1.5 border-t border-s-ink/5 bg-white flex items-center gap-3 text-[10px] text-s-ink/40 flex-shrink-0">
        <span>{bridgeReady ? "Bridge connected" : "Waiting for bridge…"}</span>
        <span>•</span>
        <span>{editMode ? "Edit mode ON" : "Edit mode OFF"}</span>
        {selectedElements.length > 0 && (
          <>
            <span>•</span>
            <span>Selected: {selectedElements.length} element{selectedElements.length > 1 ? "s" : ""}</span>
          </>
        )}
        {hoveredElement && selectedElements.length === 0 && (
          <>
            <span>•</span>
            <span>Hovering: &lt;{hoveredElement.tag}&gt;</span>
          </>
        )}
      </div>
    </div>
  );
}
