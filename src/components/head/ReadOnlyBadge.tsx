"use client";

import React from "react";
import { Lock } from "lucide-react";

interface ReadOnlyBadgeProps {
  message?: string;
  className?: string;
}

export default function ReadOnlyBadge({
  message = "Chế độ xem — Liên hệ nhân viên khoa để chỉnh sửa",
  className,
}: ReadOnlyBadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-800 ${className ?? ""}`}
      title={message}
    >
      <Lock className="h-3.5 w-3.5" />
      {message}
    </span>
  );
}
