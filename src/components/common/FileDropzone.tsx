"use client";

import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import api from "@/lib/api";
import { Upload, FileText, X, AlertCircle, CheckCircle2 } from "lucide-react";
import clsx from "clsx";

interface FileDropzoneProps {
  value?: string;
  onChange: (url: string, file: { name: string; size: number } | null) => void;
  category?: string;
  disabled?: boolean;
}

interface UploadedFile {
  name: string;
  size: number;
  url: string;
}

const MAX_SIZE = 20 * 1024 * 1024;

const ACCEPTED_MIME: Record<string, string[]> = {
  "application/pdf": [".pdf"],
  "application/msword": [".doc"],
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": [
    ".docx",
  ],
  "application/zip": [".zip"],
  "application/x-zip-compressed": [".zip"],
};

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export default function FileDropzone({
  value,
  onChange,
  category = "reports",
  disabled,
}: FileDropzoneProps) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [current, setCurrent] = useState<UploadedFile | null>(() => {
    if (!value || value === "pending") return null;
    return {
      name: value.split("/").pop() || value,
      size: 0,
      url: value,
    };
  });

  const onDrop = useCallback(
    async (files: File[]) => {
      setError(null);
      const file = files[0];
      if (!file) return;

      if (file.size > MAX_SIZE) {
        setError(`File vượt quá 20 MB (kích thước: ${formatSize(file.size)}).`);
        return;
      }

      const formData = new FormData();
      formData.append("file", file);
      formData.append("category", category);

      setUploading(true);
      try {
        const res = await api.post("/shared/files/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
        });
        const data = res.data as { url: string; fileName: string; size: number };
        const uploaded: UploadedFile = {
          name: data.fileName,
          size: data.size,
          url: data.url,
        };
        setCurrent(uploaded);
        onChange(uploaded.url, { name: uploaded.name, size: uploaded.size });
      } catch (err: unknown) {
        const e = err as {
          response?: { data?: { message?: string } };
        };
        setError(e.response?.data?.message || "Upload thất bại.");
      } finally {
        setUploading(false);
      }
    },
    [category, onChange]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: ACCEPTED_MIME,
    maxFiles: 1,
    maxSize: MAX_SIZE,
    disabled: disabled || uploading,
  });

  const handleRemove = () => {
    setCurrent(null);
    setError(null);
    onChange("", null);
  };

  if (current) {
    return (
      <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-emerald-100">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="truncate text-sm font-medium text-emerald-900">
              {current.name}
            </p>
            <p className="text-xs text-emerald-700">
              Đã upload thành công
              {current.size > 0 && ` (${formatSize(current.size)})`}
            </p>
          </div>
          <a
            href={current.url}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs font-medium text-emerald-700 hover:underline"
          >
            Xem
          </a>
          <button
            type="button"
            onClick={handleRemove}
            className="rounded-lg p-1.5 text-emerald-700 hover:bg-emerald-100"
            title="Xóa file"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div
        {...getRootProps()}
        className={clsx(
          "rounded-lg border-2 border-dashed p-6 text-center cursor-pointer transition-colors",
          isDragActive
            ? "border-emerald-400 bg-emerald-50"
            : "border-gray-300 bg-gray-50 hover:border-emerald-300 hover:bg-emerald-50/50",
          (disabled || uploading) && "cursor-not-allowed opacity-60"
        )}
      >
        <input {...getInputProps()} />
        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            <p className="text-sm font-medium text-gray-700">
              Đang upload...
            </p>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-100">
              <Upload className="h-5 w-5 text-emerald-600" />
            </div>
            <p className="text-sm font-medium text-gray-800">
              {isDragActive
                ? "Thả file vào đây..."
                : "Kéo thả hoặc bấm để chọn file"}
            </p>
            <p className="text-xs text-gray-500">
              PDF, Word (.doc, .docx), hoặc ZIP. Tối đa 20 MB.
            </p>
            <FileText className="h-4 w-4 text-gray-400" />
          </div>
        )}
      </div>
      {error && (
        <div className="mt-2 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-2 text-sm text-red-700">
          <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
