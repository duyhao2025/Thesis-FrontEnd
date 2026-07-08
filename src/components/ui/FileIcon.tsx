import React from "react";
import {
  FileText,
  FileImage,
  FileArchive,
  FileCode,
  FileSpreadsheet,
  FileVideo,
  FileAudio,
  File,
} from "lucide-react";
import clsx from "clsx";

export type FileKind =
  | "pdf"
  | "doc"
  | "docx"
  | "xls"
  | "xlsx"
  | "ppt"
  | "pptx"
  | "image"
  | "video"
  | "audio"
  | "archive"
  | "code"
  | "unknown";

const EXT_MAP: Record<string, { kind: FileKind; color: string }> = {
  pdf: { kind: "pdf", color: "text-red-600 bg-red-50 ring-red-200" },
  doc: { kind: "doc", color: "text-blue-700 bg-blue-50 ring-blue-200" },
  docx: { kind: "docx", color: "text-blue-700 bg-blue-50 ring-blue-200" },
  xls: { kind: "xls", color: "text-green-700 bg-green-50 ring-green-200" },
  xlsx: { kind: "xlsx", color: "text-green-700 bg-green-50 ring-green-200" },
  ppt: { kind: "ppt", color: "text-orange-600 bg-orange-50 ring-orange-200" },
  pptx: { kind: "pptx", color: "text-orange-600 bg-orange-50 ring-orange-200" },
  png: { kind: "image", color: "text-purple-600 bg-purple-50 ring-purple-200" },
  jpg: { kind: "image", color: "text-purple-600 bg-purple-50 ring-purple-200" },
  jpeg: { kind: "image", color: "text-purple-600 bg-purple-50 ring-purple-200" },
  gif: { kind: "image", color: "text-purple-600 bg-purple-50 ring-purple-200" },
  webp: { kind: "image", color: "text-purple-600 bg-purple-50 ring-purple-200" },
  svg: { kind: "image", color: "text-purple-600 bg-purple-50 ring-purple-200" },
  mp4: { kind: "video", color: "text-pink-600 bg-pink-50 ring-pink-200" },
  mov: { kind: "video", color: "text-pink-600 bg-pink-50 ring-pink-200" },
  avi: { kind: "video", color: "text-pink-600 bg-pink-50 ring-pink-200" },
  webm: { kind: "video", color: "text-pink-600 bg-pink-50 ring-pink-200" },
  mp3: { kind: "audio", color: "text-amber-600 bg-amber-50 ring-amber-200" },
  wav: { kind: "audio", color: "text-amber-600 bg-amber-50 ring-amber-200" },
  ogg: { kind: "audio", color: "text-amber-600 bg-amber-50 ring-amber-200" },
  zip: { kind: "archive", color: "text-yellow-700 bg-yellow-50 ring-yellow-200" },
  rar: { kind: "archive", color: "text-yellow-700 bg-yellow-50 ring-yellow-200" },
  "7z": { kind: "archive", color: "text-yellow-700 bg-yellow-50 ring-yellow-200" },
  tar: { kind: "archive", color: "text-yellow-700 bg-yellow-50 ring-yellow-200" },
  gz: { kind: "archive", color: "text-yellow-700 bg-yellow-50 ring-yellow-200" },
  js: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  ts: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  tsx: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  jsx: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  py: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  java: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  cs: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  cpp: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  c: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  html: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
  css: { kind: "code", color: "text-slate-700 bg-slate-50 ring-slate-200" },
};

export function getFileInfo(url: string): { ext: string; kind: FileKind; color: string; label: string } {
  const cleanUrl = (url || "").split("?")[0].split("#")[0];
  const ext = cleanUrl.split(".").pop()?.toLowerCase() || "";
  const entry = EXT_MAP[ext];
  if (entry) {
    return { ext, kind: entry.kind, color: entry.color, label: ext.toUpperCase() };
  }
  return { ext, kind: "unknown", color: "text-gray-600 bg-gray-50 ring-gray-200", label: ext ? ext.toUpperCase() : "FILE" };
}

export function canInline(kind: FileKind): boolean {
  return kind === "pdf" || kind === "image";
}

interface FileIconProps {
  url: string;
  size?: "sm" | "md" | "lg";
  className?: string;
  showLabel?: boolean;
}

export default function FileIcon({ url, size = "md", className, showLabel = false }: FileIconProps) {
  const { kind, color, label } = getFileInfo(url);
  const sizeMap = {
    sm: { box: "h-8 w-8", icon: "h-4 w-4", label: "text-[9px]" },
    md: { box: "h-10 w-10", icon: "h-5 w-5", label: "text-[10px]" },
    lg: { box: "h-14 w-14", icon: "h-7 w-7", label: "text-xs" },
  };
  const s = sizeMap[size];

  const Icon = (() => {
    switch (kind) {
      case "pdf":
      case "doc":
      case "docx":
      case "xls":
      case "xlsx":
      case "ppt":
      case "pptx":
        return FileText;
      case "image":
        return FileImage;
      case "video":
        return FileVideo;
      case "audio":
        return FileAudio;
      case "archive":
        return FileArchive;
      case "code":
        return FileCode;
      case "unknown":
        return File;
      default:
        return FileText;
    }
  })();

  return (
    <div className={clsx("flex items-center gap-2", className)}>
      <div className={clsx("relative flex items-center justify-center rounded-lg ring-1", color, s.box)}>
        <Icon className={clsx(s.icon)} />
        {showLabel && (
          <span className={clsx("absolute -bottom-1.5 left-1/2 -translate-x-1/2 rounded bg-white px-1 font-bold uppercase shadow", color.split(" ")[0], s.label)}>
            {label}
          </span>
        )}
      </div>
    </div>
  );
}