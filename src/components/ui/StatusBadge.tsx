"use client";

import React from "react";
import clsx from "clsx";

type StatusType =
  | "Pending"
  | "Approved"
  | "Rejected"
  | "Draft"
  | "Open"
  | "Closed"
  | "Active"
  | "Inactive"
  | "Published"
  | "Cancelled"
  | "Submitted"
  | "InProgress"
  | "Completed";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<StatusType, { label: string; className: string }> = {
  Pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  Approved: { label: "Đã duyệt", className: "bg-green-100 text-green-800" },
  Rejected: { label: "Từ chối", className: "bg-red-100 text-red-800" },
  Draft: { label: "Bản nháp", className: "bg-gray-100 text-gray-700" },
  Open: { label: "Mở", className: "bg-blue-100 text-blue-800" },
  Closed: { label: "Đóng", className: "bg-gray-100 text-gray-600" },
  Active: { label: "Hoạt động", className: "bg-green-100 text-green-800" },
  Inactive: { label: "Không hoạt động", className: "bg-gray-100 text-gray-600" },
  Published: { label: "Đã đăng tải", className: "bg-indigo-100 text-indigo-800" },
  Cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
  Submitted: { label: "Đã nộp", className: "bg-blue-100 text-blue-800" },
  InProgress: { label: "Đang tiến hành", className: "bg-yellow-100 text-yellow-800" },
  Completed: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
};

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status as StatusType] || {
    label: status,
    className: "bg-gray-100 text-gray-700",
  };

  return (
    <span
      className={clsx(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}
