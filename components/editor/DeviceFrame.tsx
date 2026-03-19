"use client";

import { useEffect, useRef, useCallback } from "react";

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
        className={`relative bg-white dark:bg-s-dm-surface transition-all duration-300 ${
          isFramed
            ? "rounded-card shadow-warm-md border border-s-ink/5 dark:border-s-dm-text/10"
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
          title="Site Preview"
        />
      </div>
    </div>
  );
}
