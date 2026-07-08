import React, { useEffect, useState } from "react";
import Modal from "@/components/ui/Modal";
import Button from "@/components/ui/Button";
import FileIcon, { canInline, getFileInfo } from "@/components/ui/FileIcon";
import { ExternalLink, Download, AlertTriangle, FileText, X } from "lucide-react";
import { downloadFile, fetchFileAsBlobUrl } from "@/lib/fileDownload";

interface FileViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title?: string;
}

export default function FileViewerModal({ isOpen, onClose, url, title }: FileViewerModalProps) {
  const [meta, setMeta] = useState<{ ext: string; size: number; contentType: string } | null>(null);
  const [loadingMeta, setLoadingMeta] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // For inline preview (PDF/image) we fetch as blob to attach the auth token
  const [inlineBlobUrl, setInlineBlobUrl] = useState<string | null>(null);
  const [inlineLoading, setInlineLoading] = useState(false);
  const [inlineError, setInlineError] = useState<string | null>(null);

  const { kind } = getFileInfo(url);
  const isInlineSupported = canInline(kind);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setInlineBlobUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setInlineError(null);
      setError(null);
      setMeta(null);
    }
  }, [isOpen]);

  // Fetch metadata for non-PDF files (size, mime)
  useEffect(() => {
    if (!isOpen || !url || isInlineSupported) return;
    setError(null);
    setLoadingMeta(true);
    const apiBase = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api";
    fetch(`${apiBase}/shared/files/meta?url=${encodeURIComponent(url)}`, {
      headers: { Authorization: `Bearer ${localStorage.getItem("accessToken") || ""}` },
    })
      .then((r) => r.ok ? r.json() : Promise.reject(new Error("Không lấy được thông tin file")))
      .then((data) => setMeta({ ext: data.extension, size: data.size, contentType: data.contentType }))
      .catch((e) => setError(e.message || "Lỗi"))
      .finally(() => setLoadingMeta(false));
  }, [isOpen, url, isInlineSupported]);

  // Fetch PDF/image as blob with auth header
  useEffect(() => {
    if (!isOpen || !url || !isInlineSupported) return;
    setInlineLoading(true);
    setInlineError(null);
    fetchFileAsBlobUrl(url)
      .then(({ blobUrl }) => setInlineBlobUrl(blobUrl))
      .catch((e) => setInlineError(e.message || "Không tải được file"))
      .finally(() => setInlineLoading(false));
  }, [isOpen, url, isInlineSupported]);

  const handleDownload = () => downloadFile(url);
  const handleOpenInNewTab = async () => {
    const token = localStorage.getItem("accessToken") || "";
    try {
      const res = await fetch(
        `${(process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000/api")}/shared/files/download?url=${encodeURIComponent(url)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error("Tải file thất bại");
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      window.open(blobUrl, "_blank", "noopener,noreferrer");
    } catch {
      window.open(url, "_blank", "noopener,noreferrer");
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
  };

  const renderHeader = () => (
    <div className="flex items-center justify-between rounded-lg border border-gray-200 bg-gray-50 p-3">
      <div className="flex items-center gap-3">
        <FileIcon url={url} size="md" showLabel />
        <div className="min-w-0">
          <p className="truncate text-sm font-medium text-gray-900">{title || "Tài liệu"}</p>
          <p className="text-xs text-gray-500">
            {meta?.size
              ? formatBytes(meta.size)
              : isInlineSupported
                ? "PDF — xem trực tiếp"
                : loadingMeta
                  ? "Đang tải thông tin..."
                  : "Định dạng không hỗ trợ xem trực tiếp"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" onClick={handleOpenInNewTab}>
          <ExternalLink className="h-4 w-4" />
          Mở tab mới
        </Button>
        <Button size="sm" onClick={handleDownload}>
          <Download className="h-4 w-4" />
          Tải xuống
        </Button>
      </div>
    </div>
  );

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title || "Xem file"} size="xl">
      <div className="space-y-4">
        {renderHeader()}

        {error && (
          <div className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0" />
            <div>
              <p className="font-medium">Không thể tải thông tin file</p>
              <p className="mt-1">{error}</p>
            </div>
          </div>
        )}

        {isInlineSupported ? (
          // PDF or image — embed directly via blob URL with auth token
          <div className="overflow-hidden rounded-lg border border-gray-200 bg-white">
            {inlineLoading ? (
              <div className="flex h-[70vh] items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
              </div>
            ) : inlineError || !inlineBlobUrl ? (
              <div className="flex h-[50vh] flex-col items-center justify-center gap-3 p-6 text-center">
                <AlertTriangle className="h-10 w-10 text-amber-500" />
                <p className="text-sm text-gray-700">
                  Không thể hiển thị trực tiếp. Vui lòng tải xuống hoặc mở tab mới.
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={handleOpenInNewTab}>
                    <ExternalLink className="h-4 w-4" />
                    Mở tab mới
                  </Button>
                  <Button onClick={handleDownload}>
                    <Download className="h-4 w-4" />
                    Tải xuống
                  </Button>
                </div>
              </div>
            ) : kind === "pdf" ? (
              <iframe
                src={inlineBlobUrl}
                title={title || "PDF viewer"}
                className="h-[70vh] w-full"
              />
            ) : (
              <div className="flex max-h-[70vh] items-center justify-center overflow-auto bg-gray-50 p-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={inlineBlobUrl} alt={title || "image"} className="max-w-full rounded" />
              </div>
            )}
          </div>
        ) : (
          // Non-PDF — show download prompt with icon
          <div className="flex flex-col items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-gray-50 px-6 py-12 text-center">
            <div className="mb-4">
              <FileIcon url={url} size="lg" showLabel />
            </div>
            <div className="flex items-start gap-2 rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
              <FileText className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <p>
                Định dạng <strong>{meta?.ext?.toUpperCase() || getFileInfo(url).ext.toUpperCase()}</strong> không hỗ trợ xem trực tiếp trên web.
                <br />
                Vui lòng <strong>tải file xuống</strong> hoặc mở trong tab mới để xem.
              </p>
            </div>
            <div className="mt-5 flex gap-2">
              <Button variant="outline" onClick={handleOpenInNewTab}>
                <ExternalLink className="h-4 w-4" />
                Mở tab mới
              </Button>
              <Button onClick={handleDownload}>
                <Download className="h-4 w-4" />
                Tải xuống
              </Button>
            </div>
            {meta && (
              <p className="mt-4 text-xs text-gray-500">
                {meta.contentType} · {formatBytes(meta.size)}
              </p>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2">
          <Button variant="outline" onClick={onClose}>Đóng</Button>
        </div>
      </div>
    </Modal>
  );
}