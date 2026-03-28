"use client";

import { useEffect, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";

export type DevicePreset = "desktop" | "tablet" | "mobile";

interface DeviceFrameProps {
  url: string;
  device: DevicePreset;
  editMode: boolean;
  onBridgeReady: () => void;
  onElementSelected: (data: ElementSelectedData) => void;
  onElementHovered: (data: ElementHoveredData) => void;
  iframeRef: React.RefObject<HTMLIFrameElement | null>;
}

export interface ElementSelectedData {
  selector: string;
  tag: string;
  id: string | null;
  classes: string | null;
  text: string;
  componentHint: string | null;
  rect: { left: number; top: number; width: number; height: number };
  pageUrl: string;
}

export interface ElementHoveredData {
  rect: { left: number; top: number; width: number; height: number };
  tag: string;
  text: string;
}

const DEVICE_WIDTHS: Record<DevicePreset, string> = {
  desktop: "100%",
  tablet: "768px",
  mobile: "375px",
};

export default function DeviceFrame({
  url,
  device,
  editMode,
  onBridgeReady,
  onElementSelected,
  onElementHovered,
  iframeRef,
}: DeviceFrameProps) {
  const t = useTranslations("ui.deviceFrame") as any;
  const bridgeReady = useRef(false);

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      if (e.origin !== window.location.origin) return;
      const { type, ...data } = e.data ?? {};
      if (type === "EDITOR_BRIDGE_READY") {
        bridgeReady.current = true;
        onBridgeReady();
        if (editMode) {
          iframeRef.current?.contentWindow?.postMessage(
            { type: "EDITOR_ACTIVATE" },
            window.location.origin
          );
        }
      }
      if (type === "EDITOR_ELEMENT_SELECTED") onElementSelected(data as ElementSelectedData);
      if (type === "EDITOR_ELEMENT_HOVERED") onElementHovered(data as ElementHoveredData);
    },
    [editMode, onBridgeReady, onElementSelected, onElementHovered, iframeRef]
  );

  useEffect(() => {
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage]);

  // Inject bridge script when iframe loads
  const handleIframeLoad = useCallback(() => {
    try {
      const doc = iframeRef.current?.contentDocument;
      if (!doc) return;
      // Only inject if not already present
      if (doc.getElementById("__editor-bridge")) return;
      const script = doc.createElement("script");
      script.id = "__editor-bridge";
      script.src = "/editor-bridge.js";
      doc.body.appendChild(script);
    } catch {
      // Cross-origin iframe — bridge won't work, but that's expected for external pages
    }
  }, [iframeRef]);

  // Toggle edit mode in iframe
  useEffect(() => {
    if (!bridgeReady.current || !iframeRef.current?.contentWindow) return;
    iframeRef.current.contentWindow.postMessage(
      { type: editMode ? "EDITOR_ACTIVATE" : "EDITOR_DEACTIVATE" },
      window.location.origin
    );
  }, [editMode, iframeRef]);

  const isFramed = device !== "desktop";

  return (
    <div className="flex-1 flex items-start justify-center overflow-auto bg-s-bg-sunken dark:bg-s-dm-bg p-4">
      <div
        className={`relative bg-white dark:bg-s-dm-surface transition-[width,height] duration-300 ${
          isFramed
            ? "rounded-[12px] shadow-warm-md border border-s-ink/5 dark:border-s-dm-text/10"
            : "w-full h-full"
        }`}
        style={{
          width: DEVICE_WIDTHS[device],
          height: isFramed ? "80vh" : "100%",
          ...(device === "mobile" ? { borderRadius: "24px" } : {}),
        }}
      >
        <iframe
          ref={iframeRef}
          src={url}
          className="w-full h-full border-0"
          style={device === "mobile" ? { borderRadius: "24px" } : {}}
          title={t("previewTitle")}
          onLoad={handleIframeLoad}
        />
      </div>
    </div>
  );
}
