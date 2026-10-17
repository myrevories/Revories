"use client";

import type { AssetKind } from "@/lib/types";

export interface PreparedFile {
  filename: string;
  url: string;
  kind: AssetKind;
}

export function kindOf(file: File): AssetKind {
  if (file.type.startsWith("image/")) return "photo";
  if (file.type.startsWith("video/")) return "video";
  return "document";
}

/** Downscale an image in the browser; keeps demo-mode payloads small. */
async function toPreviewDataUrl(file: File, max = 1600): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const scale = Math.min(1, max / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.round(bitmap.width * scale);
  canvas.height = Math.round(bitmap.height * scale);
  canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL("image/jpeg", 0.82);
}

/**
 * Get each file somewhere durable and return a URL for it.
 * - With R2 configured: ask our API for a presigned PUT URL and upload directly
 *   from the browser to the bucket (bytes never pass through the app server).
 * - Demo mode: embed a downscaled copy as a data URL.
 */
export async function prepareFiles(
  projectId: string,
  files: File[],
  onProgress?: (done: number) => void,
  uploadToken?: string,
): Promise<PreparedFile[]> {
  const out: PreparedFile[] = [];
  const useR2 = process.env.NEXT_PUBLIC_STORAGE === "r2";
  for (const file of files) {
    const kind = kindOf(file);
    let url: string;
    if (useR2) {
      const res = await fetch("/api/uploads/presign", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ projectId, uploadToken, filename: file.name, contentType: file.type, size: file.size }),
      });
      if (!res.ok) throw new Error(`Couldn't start upload for ${file.name}`);
      const { uploadUrl, publicUrl } = (await res.json()) as { uploadUrl: string; publicUrl: string };
      const put = await fetch(uploadUrl, { method: "PUT", body: file, headers: { "content-type": file.type } });
      if (!put.ok) throw new Error(`Upload failed for ${file.name}`);
      url = publicUrl;
    } else if (kind === "photo") {
      url = await toPreviewDataUrl(file);
    } else {
      url = ""; // documents/videos need real storage; keep the record so it can be organized
    }
    out.push({ filename: file.name, url, kind });
    onProgress?.(out.length);
  }
  return out;
}
