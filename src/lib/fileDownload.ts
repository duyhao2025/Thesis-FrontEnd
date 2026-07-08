/**
 * Helper to download a server-side file (PDF, DOCX, ZIP, ...) via fetch+Blob
 * because the endpoint is [Authorize]-protected and a plain <a href> would
 * hit a 401 in the browser.
 *
 * Usage:
 *   <button onClick={() => downloadFile(url, "report.pdf")}>Tải xuống</button>
 */

const API_BASE = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api").replace(/\/api$/, "");

interface DownloadOptions {
  /** Override the filename in the download dialog */
  fileName?: string;
  /** Extra headers */
  headers?: Record<string, string>;
}

/**
 * Fetches the file with the current access token and triggers a save dialog.
 * Falls back to the direct URL if the fetch fails.
 */
export async function downloadFile(url: string, options: DownloadOptions = {}): Promise<void> {
  if (!url) return;
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";

  const downloadUrl = `${API_BASE}/api/shared/files/download?url=${encodeURIComponent(url)}`;

  try {
    const res = await fetch(downloadUrl, {
      headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
    });

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    // Try to extract filename from Content-Disposition
    const disposition = res.headers.get("Content-Disposition") || "";
    const match = disposition.match(/filename\*?=(?:UTF-8'')?"?([^";]+)"?/i);
    const serverName = match ? decodeURIComponent(match[1]) : null;

    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = options.fileName || serverName || extractNameFromUrl(url);
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    // Revoke after a short delay to give the browser time to start the download
    setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
  } catch (err) {
    // Last resort: open direct URL in a new tab (might be blocked by auth if same origin,
    // but at least the user sees something).
    window.open(url, "_blank", "noopener,noreferrer");
  }
}

/**
 * Fetches the file and returns an Object URL that can be used as <iframe src>
 * or <img src>. The returned URL must be revoked by the caller when done.
 */
export async function fetchFileAsBlobUrl(
  url: string,
  options: { headers?: Record<string, string> } = {}
): Promise<{ blobUrl: string; contentType: string; size: number }> {
  const token = typeof window !== "undefined" ? localStorage.getItem("accessToken") || "" : "";
  const fullUrl = `${API_BASE}/api/shared/files/download?url=${encodeURIComponent(url)}&inline=true`;

  const res = await fetch(fullUrl, {
    headers: { Authorization: `Bearer ${token}`, ...(options.headers || {}) },
  });

  if (!res.ok) {
    throw new Error(`HTTP ${res.status}`);
  }

  const blob = await res.blob();
  return {
    blobUrl: URL.createObjectURL(blob),
    contentType: res.headers.get("Content-Type") || blob.type || "application/octet-stream",
    size: blob.size,
  };
}

function extractNameFromUrl(url: string): string {
  const clean = (url || "").split("?")[0].split("#")[0];
  return clean.split("/").pop() || "download";
}