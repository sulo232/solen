"use client";

import { useState, useRef, useCallback } from "react";
import { useTranslations } from "next-intl";
import { Camera, X, Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

interface PendingFile {
  id: string;
  file: File;
  previewUrl: string;
  progress: number;
  status: "pending" | "uploading" | "done" | "error";
  error?: string;
  uploadedUrl?: string;
}

export interface ImageUploadProps {
  /** Called with all successfully uploaded URLs from this session */
  onUpload: (urls: string[]) => void;
  /** Maximum total files (existing + new). Default 20 */
  maxFiles?: number;
  /** Existing uploaded images (shown in edit mode) */
  existingUrls?: string[];
  /** Supabase Storage bucket name. Default "salon-gallery" */
  bucket?: string;
  /** Path prefix inside bucket (e.g. salonId) */
  pathPrefix?: string;
  /** Custom upload function — overrides direct Supabase upload */
  uploadFn?: (file: File) => Promise<string>;
}

// ─── Canvas resize ────────────────────────────────────────────────────────────

async function resizeImage(file: File, maxWidth = 2000): Promise<Blob> {
  return new Promise((resolve) => {
    const img = new window.Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      if (img.width <= maxWidth) {
        resolve(file);
        return;
      }
      const scale = maxWidth / img.width;
      const canvas = document.createElement("canvas");
      canvas.width = maxWidth;
      canvas.height = Math.round(img.height * scale);
      const ctx = canvas.getContext("2d");
      if (!ctx) { resolve(file); return; }
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => resolve(blob ?? file),
        file.type,
        0.88,
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); resolve(file); };
    img.src = url;
  });
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function ImageUpload({
  onUpload,
  maxFiles = 20,
  existingUrls = [],
  bucket = "salon-gallery",
  pathPrefix = "",
  uploadFn,
}: ImageUploadProps) {
  const t = useTranslations("imageUpload") as any;
  const [pending, setPending] = useState<PendingFile[]>([]);
  const [isDragOver, setIsDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  // Collect uploaded URLs without stale-closure issues
  const uploadedUrlsRef = useRef<string[]>([]);

  const MAX_SIZE_MB = 10;
  const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // ── Upload a single file ──────────────────────────────────────────────────

  const uploadFile = useCallback(
    async (item: PendingFile) => {
      const setProgress = (progress: number) =>
        setPending((prev) =>
          prev.map((p) => (p.id === item.id ? { ...p, progress, status: "uploading" } : p)),
        );

      try {
        setProgress(10);

        // 1. Client-side resize
        const resized = await resizeImage(item.file, 2000);
        setProgress(30);

        let publicUrl: string;

        if (uploadFn) {
          // Custom upload (e.g. via gallery API route)
          setProgress(50);
          publicUrl = await uploadFn(item.file);
          setProgress(90);
        } else {
          // Direct Supabase Storage upload
          const supabase = createBrowserSupabaseClient();
          const ext = item.file.name.split(".").pop() || "jpg";
          const prefix = pathPrefix ? `${pathPrefix}/` : "";
          const fileName = `${prefix}${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

          const { error: uploadError } = await supabase.storage
            .from(bucket)
            .upload(fileName, resized, { cacheControl: "3600", upsert: false });

          setProgress(80);

          if (uploadError) throw uploadError;

          const {
            data: { publicUrl: url },
          } = supabase.storage.from(bucket).getPublicUrl(fileName);
          publicUrl = url;
          setProgress(95);
        }

        uploadedUrlsRef.current = [...uploadedUrlsRef.current, publicUrl];

        setPending((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "done", progress: 100, uploadedUrl: publicUrl }
              : p,
          ),
        );

        onUpload([...uploadedUrlsRef.current]);
      } catch (err: any) {
        console.error("[ImageUpload] Upload failed:", err);
        setPending((prev) =>
          prev.map((p) =>
            p.id === item.id
              ? { ...p, status: "error", progress: 0, error: t("errorUpload") }
              : p,
          ),
        );
      }
    },
    [bucket, pathPrefix, uploadFn, onUpload, t],
  );

  // ── Process incoming files ────────────────────────────────────────────────

  const processFiles = useCallback(
    (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      const currentCount =
        existingUrls.length +
        pending.filter((p) => p.status !== "error").length;
      const remaining = maxFiles - currentCount;
      const toProcess = fileArray.slice(0, Math.max(remaining, 0));

      const newItems: PendingFile[] = toProcess.map((file) => {
        const id = `${Date.now()}-${Math.random().toString(36).slice(2)}`;

        if (!ALLOWED_TYPES.includes(file.type)) {
          return {
            id,
            file,
            previewUrl: "",
            progress: 0,
            status: "error" as const,
            error: t("errorType"),
          };
        }
        if (file.size > MAX_SIZE_MB * 1024 * 1024) {
          return {
            id,
            file,
            previewUrl: "",
            progress: 0,
            status: "error" as const,
            error: t("errorSize", { max: MAX_SIZE_MB }),
          };
        }
        return {
          id,
          file,
          previewUrl: URL.createObjectURL(file),
          progress: 0,
          status: "pending" as const,
        };
      });

      setPending((prev) => [...prev, ...newItems]);

      // Kick off uploads for valid files
      newItems
        .filter((item) => item.status === "pending")
        .forEach((item) => uploadFile(item));
    },
    [existingUrls.length, maxFiles, pending, uploadFile, t],
  );

  // ── Event handlers ────────────────────────────────────────────────────────

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    processFiles(e.dataTransfer.files);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) processFiles(e.target.files);
    e.target.value = "";
  };

  const removePending = (id: string) => {
    setPending((prev) => {
      const item = prev.find((p) => p.id === id);
      if (item?.previewUrl) URL.revokeObjectURL(item.previewUrl);
      // Remove from uploaded ref if it was done
      if (item?.uploadedUrl) {
        uploadedUrlsRef.current = uploadedUrlsRef.current.filter(
          (u) => u !== item.uploadedUrl,
        );
        onUpload([...uploadedUrlsRef.current]);
      }
      return prev.filter((p) => p.id !== id);
    });
  };

  const totalCount =
    existingUrls.length + pending.filter((p) => p.status !== "error").length;
  const canAddMore = totalCount < maxFiles;
  const isUploading = pending.some((p) => p.status === "uploading");

  return (
    <div className="space-y-4">
      {/* Pending upload previews */}
      {pending.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {pending.map((item) => (
            <div
              key={item.id}
              className="relative w-20 h-20 rounded-[10px] overflow-hidden border border-s-ink/10 bg-s-bg-sunken flex-shrink-0 animate-[fadeIn_0.2s_ease]"
            >
              {item.previewUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.previewUrl}
                  alt={item.file.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-red-50">
                  <AlertCircle size={16} className="text-red-400" />
                </div>
              )}

              {/* Coral progress bar */}
              {item.status === "uploading" && (
                <div className="absolute bottom-0 left-0 right-0 h-[3px] bg-white/30">
                  <div
                    className="h-full bg-s-coral transition-[width] duration-300"
                    style={{ width: `${item.progress}%` }}
                  />
                </div>
              )}

              {/* Uploading overlay */}
              {item.status === "uploading" && (
                <div className="absolute inset-0 bg-s-ink/20 flex items-center justify-center">
                  <Loader2 size={16} className="text-white animate-spin" />
                </div>
              )}

              {/* Done checkmark */}
              {item.status === "done" && (
                <div className="absolute bottom-1 right-1">
                  <CheckCircle2
                    size={14}
                    className="text-white drop-shadow"
                    fill="rgba(16,185,129,0.85)"
                  />
                </div>
              )}

              {/* Error overlay */}
              {item.status === "error" && (
                <div className="absolute inset-0 bg-red-500/80 flex items-center justify-center">
                  <AlertCircle size={16} className="text-white" />
                </div>
              )}

              {/* Remove button (not during upload) */}
              {item.status !== "uploading" && (
                <button
                  type="button"
                  onClick={() => removePending(item.id)}
                  aria-label={t("remove")}
                  className="absolute top-1 right-1 w-5 h-5 rounded-full bg-s-ink/60 text-white flex items-center justify-center hover:bg-s-ink transition-colors"
                >
                  <X size={10} />
                </button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Drop zone */}
      {canAddMore && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragOver(true);
          }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={handleDrop}
          disabled={isUploading}
          aria-label={t("dropZoneLabel")}
          className={[
            "w-full h-36 rounded-[16px] border-2 border-dashed flex flex-col items-center justify-center gap-2.5 transition-colors cursor-pointer disabled:opacity-60 disabled:cursor-not-allowed",
            isDragOver
              ? "border-s-coral bg-s-coral/5"
              : "border-s-ink/10 hover:border-s-coral/40 hover:bg-s-coral/[0.02]",
          ].join(" ")}
        >
          <div
            className={`w-11 h-11 rounded-full flex items-center justify-center transition-colors ${
              isDragOver ? "bg-s-coral/20" : "bg-s-coral/10"
            }`}
          >
            <Camera size={20} className="text-s-coral" />
          </div>
          <div className="text-center px-4">
            <p className="text-sm font-medium text-s-ink/60">
              {t("dropZoneTitle")}
            </p>
            <p className="text-xs text-s-ink/35 mt-0.5">
              {t("dropZoneHint", { max: MAX_SIZE_MB })}
            </p>
          </div>
        </button>
      )}

      {maxFiles > 1 && (
        <p className="text-[10px] text-s-ink/35 text-right">
          {t("countHint", {
            count: totalCount,
            max: maxFiles,
          })}
        </p>
      )}

      {/* Inline validation errors for invalid files */}
      {pending.some((p) => p.status === "error") && (
        <ul role="alert" className="space-y-1">
          {pending
            .filter((p) => p.status === "error")
            .map((p) => (
              <li
                key={p.id}
                className="text-xs text-red-500 flex items-center gap-1.5"
              >
                <AlertCircle size={11} className="shrink-0" />
                <span className="truncate max-w-[180px] font-medium">
                  {p.file.name}
                </span>
                <span>— {p.error}</span>
              </li>
            ))}
        </ul>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        multiple
        className="hidden"
        onChange={handleChange}
        aria-label={t("dropZoneLabel")}
      />
    </div>
  );
}
