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
  | "Completed"
  | "PENDING"
  | "APPROVED"
  | "REJECTED"
  | "OPEN"
  | "CLOSED"
  | "DRAFT"
  | "ARCHIVED"
  | "INPROGRESS"
  | "DELAYED"
  | "REVIEWING"
  | "ELIGIBLEFORDEFENSE"
  | "DEFENDED"
  | "PASSED"
  | "FAILED"
  | "FORMING"
  | "DISSOLVED";

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  // Title case (frontend)
  Pending: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  Approved: { label: "Đã duyệt", className: "bg-green-100 text-green-800" },
  Rejected: { label: "Từ chối", className: "bg-red-100 text-red-800" },
  Draft: { label: "Bản nháp", className: "bg-gray-100 text-gray-700" },
  Open: { label: "Mở", className: "bg-blue-100 text-blue-800" },
  Closed: { label: "Đóng", className: "bg-gray-100 text-gray-600" },
  ACTIVE: { label: "Hoạt động", className: "bg-green-100 text-green-800" },
  COMPLETED: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
  Inactive: { label: "Không hoạt động", className: "bg-gray-100 text-gray-600" },
  Published: { label: "Đã đăng tải", className: "bg-indigo-100 text-indigo-800" },
  Cancelled: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
  Submitted: { label: "Đã nộp", className: "bg-blue-100 text-blue-800" },
  InProgress: { label: "Đang tiến hành", className: "bg-yellow-100 text-yellow-800" },
  Completed: { label: "Hoàn thành", className: "bg-green-100 text-green-800" },
  // Uppercase (backend enum values)
  PENDING: { label: "Chờ duyệt", className: "bg-amber-100 text-amber-800" },
  APPROVED: { label: "Đã duyệt", className: "bg-green-100 text-green-800" },
  REJECTED: { label: "Từ chối", className: "bg-red-100 text-red-800" },
  DRAFT: { label: "Bản nháp", className: "bg-gray-100 text-gray-700" },
  OPEN: { label: "Mở", className: "bg-blue-100 text-blue-800" },
  CLOSED: { label: "Đóng", className: "bg-gray-100 text-gray-600" },
  ARCHIVED: { label: "Lưu trữ", className: "bg-gray-100 text-gray-600" },
  INPROGRESS: { label: "Đang tiến hành", className: "bg-yellow-100 text-yellow-800" },
  DELAYED: { label: "Trễ tiến độ", className: "bg-orange-100 text-orange-800" },
  REVIEWING: { label: "Đang xem xét", className: "bg-indigo-100 text-indigo-800" },
  ELIGIBLEFORDEFENSE: { label: "Đủ điều kiện bảo vệ", className: "bg-green-100 text-green-800" },
  DEFENDED: { label: "Đã bảo vệ", className: "bg-teal-100 text-teal-800" },
  PASSED: { label: "Đạt", className: "bg-green-100 text-green-800" },
  FAILED: { label: "Không đạt", className: "bg-red-100 text-red-800" },
  FORMING: { label: "Đang hình thành", className: "bg-blue-100 text-blue-800" },
  DISSOLVED: { label: "Đã giải tán", className: "bg-gray-100 text-gray-700" },
  CANCELLED: { label: "Đã hủy", className: "bg-red-100 text-red-700" },
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
