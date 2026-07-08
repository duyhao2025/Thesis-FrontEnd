import React, { useState } from "react";
import FileViewerModal from "@/components/ui/FileViewerModal";
import FileIcon, { canInline } from "@/components/ui/FileIcon";
import { Eye, Download } from "lucide-react";
import clsx from "clsx";
import { downloadFile } from "@/lib/fileDownload";

interface FileActionButtonProps {
  url: string;
  title?: string;
  variant?: "row" | "button";
  className?: string;
}

export default function FileActionButton({ url, title, variant = "row", className }: FileActionButtonProps) {
  const [open, setOpen] = useState(false);

  if (!url) return null;
  const inline = canInline(getFileKind(url));

  const handleDownload = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    e?.preventDefault();
    downloadFile(url);
  };

  if (variant === "button") {
    return (
      <>
        <button
          onClick={() => setOpen(true)}
          className={clsx("inline-flex items-center gap-1.5 rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50", className)}
        >
          <Eye className="h-4 w-4" />
          Xem file
        </button>
        <button
          onClick={handleDownload}
          className="inline-flex items-center gap-1.5 rounded-md border border-blue-600 bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700"
        >
          <Download className="h-4 w-4" />
          Tải xuống
        </button>
        <FileViewerModal isOpen={open} onClose={() => setOpen(false)} url={url} title={title} />
      </>
    );
  }

  // row variant — compact file chip
  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className={clsx(
          "inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-2 py-1 text-left transition hover:border-blue-300 hover:bg-blue-50",
          className
        )}
        title={inline ? "Nhấn để xem trực tiếp" : "Nhấn để mở trình xem file"}
      >
        <FileIcon url={url} size="sm" />
        <span className="max-w-[160px] truncate text-xs font-medium text-gray-700">
          {title || "Xem file"}
        </span>
        {inline && <Eye className="h-3 w-3 text-blue-600" />}
      </button>
      <button
        onClick={handleDownload}
        className="ml-1 inline-flex items-center justify-center rounded-md border border-gray-200 p-1 text-gray-500 hover:bg-gray-50 hover:text-blue-600"
        title="Tải xuống"
      >
        <Download className="h-3.5 w-3.5" />
      </button>
      <FileViewerModal isOpen={open} onClose={() => setOpen(false)} url={url} title={title} />
    </>
  );
}

function getFileKind(url: string) {
  const ext = (url || "").split("?")[0].split(".").pop()?.toLowerCase() || "";
  if (ext === "pdf") return "pdf";
  if (["png", "jpg", "jpeg", "gif", "webp", "svg"].includes(ext)) return "image";
  return "unknown";
}