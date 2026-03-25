"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, Camera, FolderOpen, X } from "lucide-react";
import { useTranslations } from "next-intl";

interface InspoUploaderProps {
  bookingId?: string;
  onImagesChange: (images: File[]) => void;
  onOpenBoard: () => void;
}

export default function InspoUploader({ bookingId, onImagesChange, onOpenBoard }: InspoUploaderProps) {
  const t = useTranslations("booking");
  const [previews, setPreviews] = useState<{ file: File; url: string }[]>([]);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  const addFiles = useCallback((files: FileList | null) => {
    if (!files) return;
    const newPreviews = Array.from(files)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 5 - previews.length) // max 5
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    const updated = [...previews, ...newPreviews];
    setPreviews(updated);
    onImagesChange(updated.map((p) => p.file));
  }, [previews, onImagesChange]);

  const removeFile = useCallback((index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    URL.revokeObjectURL(previews[index].url);
    setPreviews(updated);
    onImagesChange(updated.map((p) => p.file));
  }, [previews, onImagesChange]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    addFiles(e.dataTransfer.files);
  }, [addFiles]);

  return (
    <div>
      <p className="text-sm font-medium text-s-ink dark:text-s-dm-text mb-2">{t("inspo_upload")}</p>

      {/* Dropzone */}
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        className="border-2 border-dashed border-s-ink/10 dark:border-s-dm-text/10 rounded-[16px] p-4 text-center hover:border-s-coral/30 transition-colors"
      >
        <Upload size={24} className="mx-auto text-s-ink/20 dark:text-s-dm-text/20 mb-2" />
        <p className="text-xs text-s-ink/40 dark:text-s-dm-text/40 mb-3">
          {t("inspo_drag_or")}
        </p>
        <div className="flex justify-center gap-2">
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral/30 transition-colors"
          >
            <Upload size={12} />
            {t("inspo_choose_file")}
          </button>
          <button
            type="button"
            onClick={() => cameraRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-btn border border-s-ink/10 dark:border-s-dm-text/10 text-s-ink/70 dark:text-s-dm-text/70 hover:border-s-coral/30 transition-colors"
          >
            <Camera size={12} />
            {t("inspo_camera")}
          </button>
          <button
            type="button"
            onClick={onOpenBoard}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-btn bg-s-coral/10 text-s-coral hover:bg-s-coral/20 transition-colors"
          >
            <FolderOpen size={12} />
            {t("inspo_from_board")}
          </button>
        </div>
      </div>

      <input ref={fileRef} type="file" accept="image/*" multiple className="hidden" onChange={(e) => addFiles(e.target.files)} />
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" className="hidden" onChange={(e) => addFiles(e.target.files)} />

      {/* Thumbnails */}
      {previews.length > 0 && (
        <div className="flex gap-2 mt-3 overflow-x-auto">
          {previews.map((p, i) => (
            <div key={i} className="relative shrink-0 w-16 h-16 rounded-btn overflow-hidden">
              <Image src={p.url} alt="" fill className="object-cover" />
              <button
                type="button"
                onClick={() => removeFile(i)}
                aria-label={t("inspo_remove")}
                className="absolute top-0.5 right-0.5 w-4 h-4 rounded-full bg-s-ink/60 text-white flex items-center justify-center"
              >
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
