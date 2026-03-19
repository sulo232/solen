"use client";

import { useState, useRef, useCallback } from "react";
import { Camera, Upload, X, Loader2 } from "lucide-react";
import { createBrowserSupabaseClient } from "@/lib/supabase-browser";

interface ImageUploaderProps {
  bucket: string;
  onUpload: (url: string) => void;
  maxSizeMB?: number;
  label?: string;
  currentImageUrl?: string;
}

const ACCEPTED = "image/jpeg,image/png,image/webp";

export default function ImageUploader({
  bucket,
  onUpload,
  maxSizeMB = 5,
  label = "Foto hochladen",
  currentImageUrl,
}: ImageUploaderProps) {
  const [preview, setPreview] = useState<string | null>(currentImageUrl || null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    setError(null);

    // Validate type
    if (!["image/jpeg", "image/png", "image/webp"].includes(file.type)) {
      setError("Nur JPEG, PNG oder WebP erlaubt.");
      return;
    }

    // Validate size
    if (file.size > maxSizeMB * 1024 * 1024) {
      setError(`Datei zu gross (max. ${maxSizeMB} MB).`);
      return;
    }

    // Show preview immediately
    const reader = new FileReader();
    reader.onload = (e) => setPreview(e.target?.result as string);
    reader.readAsDataURL(file);

    // Upload to Supabase Storage
    setUploading(true);
    setProgress(10);

    try {
      const supabase = createBrowserSupabaseClient();
      const ext = file.name.split(".").pop() || "jpg";
      const fileName = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const filePath = `uploads/${fileName}`;

      setProgress(30);

      const { error: uploadError } = await supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: "3600",
          upsert: false,
        });

      setProgress(80);

      if (uploadError) {
        setError("Upload fehlgeschlagen. Bitte versuche es erneut.");
        setPreview(null);
        return;
      }

      const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filePath);
      setProgress(100);
      onUpload(urlData.publicUrl);
    } catch {
      setError("Upload fehlgeschlagen.");
      setPreview(null);
    } finally {
      setUploading(false);
      setProgress(0);
    }
  }, [bucket, maxSizeMB, onUpload]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
    // Reset input so the same file can be re-selected
    e.target.value = "";
  };

  const clearImage = () => {
    setPreview(null);
    setError(null);
    onUpload("");
  };

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED}
        onChange={handleChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative rounded-card overflow-hidden border border-s-ink/10">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Vorschau"
            className="w-full h-48 object-cover"
          />
          <button
            type="button"
            onClick={clearImage}
            className="absolute top-2 right-2 p-1.5 rounded-full bg-white/90 text-s-ink/60 hover:text-s-coral transition-colors shadow-sm"
            aria-label="Bild entfernen"
          >
            <X size={14} />
          </button>
          {uploading && (
            <div className="absolute bottom-0 left-0 right-0 h-1.5 bg-s-sand">
              <div
                className="h-full bg-s-coral rounded-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          disabled={uploading}
          className="w-full h-48 rounded-card border-2 border-dashed border-s-ink/10 hover:border-s-coral transition-colors flex flex-col items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
        >
          {uploading ? (
            <>
              <Loader2 size={24} className="text-s-coral animate-spin" />
              <span className="text-xs text-s-ink/40">Wird hochgeladen…</span>
            </>
          ) : (
            <>
              <div className="w-12 h-12 rounded-full bg-s-coral/10 flex items-center justify-center">
                <Camera size={20} className="text-s-coral" />
              </div>
              <span className="text-sm font-medium text-s-ink/60">{label}</span>
              <span className="text-xs text-s-ink/30">
                <Upload size={10} className="inline mr-1" />
                JPEG, PNG oder WebP (max. {maxSizeMB} MB)
              </span>
            </>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-s-coral mt-1.5">{error}</p>
      )}
    </div>
  );
}
