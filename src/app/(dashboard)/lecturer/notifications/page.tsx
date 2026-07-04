"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import { NotificationResponse } from "@/types/api";
import { Bell, Check, Loader2, FileText, UserPlus } from "lucide-react";

export default function LecturerNotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const fetchNotifications = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<NotificationResponse[]>("/notifications");
      setNotifications(res.data);
    } catch {
      setNotifications([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const handleMarkRead = async (id: string) => {
    try {
      await api.put(`/notifications/${id}/read`);
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
      );
    } catch {
      // Silently fail
    }
  };

  const handleMarkAllRead = async () => {
    try {
      await api.put("/notifications/read-all");
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    } catch {
      // Silently fail
    }
  };

  const handleViewDetails = async (notification: NotificationResponse) => {
    if (!notification.isRead) {
      await handleMarkRead(notification.id);
    }

    // Handle milestone submission notification - redirect to progress plans
    if (notification.type === "MilestoneSubmission" && notification.referenceId) {
      router.push(`/lecturer/progress-plans?highlight=${notification.referenceId}`);
    }

    // Handle new topic registration notification - redirect to pending approvals
    if (notification.type === "TopicRegistrationNew") {
      router.push("/lecturer/topic-registrations");
    }
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr);
    return d.toLocaleString("vi-VN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const getNotificationIcon = (type: string) => {
    switch (type) {
      case "MilestoneSubmission":
        return <FileText className="h-4 w-4 text-teal-600" />;
      case "TopicRegistrationNew":
        return <UserPlus className="h-4 w-4 text-purple-600" />;
      default:
        return <Bell className="h-4 w-4 text-teal-600" />;
    }
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Thông báo</h1>
          {unreadCount > 0 && (
            <p className="mt-1 text-sm text-gray-500">{unreadCount} thông báo chưa đọc</p>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            onClick={handleMarkAllRead}
            className="text-sm text-teal-600 hover:text-teal-700 font-medium"
          >
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {/* Notification List */}
      {notifications.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <Bell className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-sm font-medium text-gray-500">Không có thông báo nào</p>
        </div>
      ) : (
        <div className="space-y-2">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => handleViewDetails(n)}
              className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${
                n.isRead
                  ? "border-gray-100 bg-white"
                  : "border-teal-100 bg-teal-50/50"
              }`}
            >
              <div className={`mt-0.5 rounded-full p-2 ${n.isRead ? "bg-gray-100" : "bg-teal-100"}`}>
                {getNotificationIcon(n.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm ${n.isRead ? "text-gray-600" : "font-semibold text-gray-900"}`}>
                  {n.title}
                </p>
                <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{n.message}</p>
                <p className="mt-1 text-xs text-gray-400">{formatDate(n.createdAt)}</p>
              </div>
              {!n.isRead && (
                <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-teal-500" />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
