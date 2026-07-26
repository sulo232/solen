import { NextResponse } from "next/server";

// Shared hardening for every multipart upload route (app/api/**/photos, gallery,
// avatar, formula-photo, documents). Three defects lived on all of them before this
// file existed: the client-supplied `file.type` string was trusted as-is, no user
// upload stripped EXIF/GPS metadata before it reached Storage, and 8 of the 9 routes
// authenticated via the Supabase session cookie with no header a plain HTML form
// could not also send (multipart CSRF). This file is the one place all three get
// fixed so every route calls the same checks instead of re-implementing them.
// A15-upload-hardening, 2026-07-27.

export const UPLOAD_HEADER_NAME = "x-solen-upload";

/**
 * Multipart CSRF guard. A plain HTML `<form method="post" enctype="multipart/form-data">`
 * hosted on another origin rides the visitor's Supabase session cookie automatically on
 * submit (cookies attach regardless of origin unless SameSite=Strict, and this project's
 * auth cookie is not) and a top-level form POST is not blocked by CORS. Crucially, an HTML
 * form cannot set a custom request header, only fetch()/XHR can, so requiring this header
 * rejects any cross-site form-based upload while same-origin client code (which sets it
 * explicitly on every fetch call below) passes through unaffected. Call this BEFORE doing
 * any real work (auth lookups are cheap, but storage writes and DB writes are not free to
 * let a forged cross-site request trigger).
 */
export function requireUploadHeader(req: Request): NextResponse | null {
  if (req.headers.get(UPLOAD_HEADER_NAME) !== "1") {
    return NextResponse.json(
      { error: "Missing required upload header" },
      { status: 403 }
    );
  }
  return null;
}

const IMAGE_FORMAT_TO_MIME: Record<string, string> = {
  jpeg: "image/jpeg",
  png: "image/png",
  webp: "image/webp",
  gif: "image/gif",
};

export type AllowedImageFormat = keyof typeof IMAGE_FORMAT_TO_MIME;

export interface ProcessedImage {
  buffer: Buffer;
  format: AllowedImageFormat;
  contentType: string;
  ext: string;
}

/**
 * Verifies the REAL image format by reading the file's bytes (sharp's format sniff
 * reads the magic-byte signature, never the client-supplied `file.type` string or the
 * client-supplied filename extension) and re-encodes it in that same format. Re-encoding
 * is what strips EXIF/GPS/ICC metadata: sharp drops all metadata on output unless
 * `.withMetadata()` is called, which nothing here ever does, so a photo's embedded GPS
 * coordinates never reach Storage.
 *
 * Throws on anything that is not a decodable image in `allowed`: a text file renamed to
 * `.jpg` fails sharp's own format sniff inside `.metadata()` before any re-encode is
 * attempted, so a caller only needs one try/catch around this call.
 *
 * Pass `allowed` containing "gif" only when animated GIFs must survive re-encoding
 * (e.g. avatars): sharp reads a GIF as a single still frame by default, so this
 * function reads with `{ animated: true }` whenever "gif" is in `allowed`, which keeps
 * every frame through the strip-and-re-encode pass instead of collapsing it to one.
 */
export async function verifyAndStripImage(
  input: Buffer,
  allowed: AllowedImageFormat[] = ["jpeg", "png", "webp"]
): Promise<ProcessedImage> {
  const sharp = (await import("sharp")).default;
  const readOpts = allowed.includes("gif")
    ? { failOn: "error" as const, animated: true }
    : { failOn: "error" as const };

  const metadata = await sharp(input, readOpts).metadata();
  const format = metadata.format as AllowedImageFormat | undefined;

  if (!format || !allowed.includes(format)) {
    throw new Error(`Unsupported or unverifiable image format: ${format ?? "unknown"}`);
  }

  const pipeline = sharp(input, readOpts);
  let buffer: Buffer;
  switch (format) {
    case "jpeg":
      buffer = await pipeline.jpeg({ quality: 90 }).toBuffer();
      break;
    case "png":
      buffer = await pipeline.png().toBuffer();
      break;
    case "webp":
      buffer = await pipeline.webp({ quality: 90 }).toBuffer();
      break;
    case "gif":
      buffer = await pipeline.gif().toBuffer();
      break;
    default:
      throw new Error(`Unsupported image format: ${format}`);
  }

  return { buffer, format, contentType: IMAGE_FORMAT_TO_MIME[format], ext: format === "jpeg" ? "jpg" : format };
}

const PDF_SIGNATURE = Buffer.from("%PDF-", "ascii");

/** True bytes-level check for a PDF: the first 5 bytes of every valid PDF are `%PDF-`. */
export function isPdfSignature(buffer: Buffer): boolean {
  return buffer.length >= PDF_SIGNATURE.length && buffer.subarray(0, PDF_SIGNATURE.length).equals(PDF_SIGNATURE);
}
