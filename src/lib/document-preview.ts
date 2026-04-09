import { getApiBaseUrl } from "@/lib/config";

/** Mozilla pdf.js sample — stable public PDF for mock previews. */
export const MOCK_SAMPLE_PDF_URL =
  "https://mozilla.github.io/pdf.js/web/compressed.tracemonkey-pldi-09.pdf";

export const MOCK_SAMPLE_IMAGE_URL = "https://picsum.photos/seed/storekeeper-doc/900/1200";

export function isPdfFile(fileName: string, mimeType?: string): boolean {
  const m = mimeType?.toLowerCase() ?? "";
  if (m.includes("pdf")) return true;
  return fileName.toLowerCase().endsWith(".pdf");
}

export function isImageFile(fileName: string, mimeType?: string): boolean {
  const m = mimeType?.toLowerCase() ?? "";
  if (m.startsWith("image/")) return true;
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(fileName);
}

/**
 * Turn FastAPI `file_path` into a fetchable URL (absolute http(s), or resolved against `NEXT_PUBLIC_API_URL`).
 */
export function absoluteUrlFromApiFilePath(filePath: string): string {
  const t = filePath.trim();
  if (!t) return "";
  const base = getApiBaseUrl().replace(/\/$/, "");
  try {
    return new URL(t, `${base}/`).href;
  } catch {
    const p = t.startsWith("/") ? t : `/${t}`;
    return `${base}${p}`;
  }
}
