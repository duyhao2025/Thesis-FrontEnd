"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import {
  NotificationResponse,
  GroupInvitationResponse,
  RespondToInvitationRequest,
} from "@/types/api";
import { Bell, Check, X, Clock, Users, Loader2, Target } from "lucide-react";

type Tab = "all" | "invitations";

export default function NotificationsPage() {
  const router = useRouter();
  const [tab, setTab] = useState<Tab>("all");
  const [notifications, setNotifications] = useState<NotificationResponse[]>([]);
  const [invitations, setInvitations] = useState<GroupInvitationResponse[]>([]);
  const [receivedInvitations, setReceivedInvitations] = useState<GroupInvitationResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [error, setError] = useState("");

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const [notifRes, sentRes, receivedRes] = await Promise.all([
        api.get<NotificationResponse[]>("/notifications"),
        api.get<GroupInvitationResponse[]>("/groups/invitations/sent"),
        api.get<GroupInvitationResponse[]>("/groups/invitations/received"),
      ]);
      setNotifications(notifRes.data);
      setInvitations(sentRes.data);
      setReceivedInvitations(receivedRes.data);
    } catch {
      setError("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

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

  const handleAcceptInvite = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      const req: RespondToInvitationRequest = { accepted: true };
      await api.put(`/groups/invitations/${invitationId}/respond`, req);
      await fetchAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Có lỗi xảy ra.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleRejectInvite = async () => {
    if (!showRejectModal || !rejectReason.trim()) return;
    setActionLoading(showRejectModal);
    try {
      const req: RespondToInvitationRequest = { accepted: false, rejectionReason: rejectReason.trim() };
      await api.put(`/groups/invitations/${showRejectModal}/respond`, req);
      setShowRejectModal(null);
      setRejectReason("");
      await fetchAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Có lỗi xảy ra.";
      setError(msg);
    } finally {
      setActionLoading(null);
    }
  };

  const handleCancelInvite = async (invitationId: string) => {
    setActionLoading(invitationId);
    try {
      await api.delete(`/groups/invitations/${invitationId}`);
      await fetchAll();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Có lỗi xảy ra.";
      setError(msg);
    } finally {
      setActionLoading(null);
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

  const statusBadge = (status: string) => {
    const map: Record<string, { label: string; class: string }> = {
      PENDING: { label: "Đang chờ", class: "bg-yellow-100 text-yellow-800" },
      ACCEPTED: { label: "Đã chấp nhận", class: "bg-green-100 text-green-800" },
      REJECTED: { label: "Đã từ chối", class: "bg-red-100 text-red-800" },
      CANCELLED: { label: "Đã hủy", class: "bg-gray-100 text-gray-600" },
      EXPIRED: { label: "Hết hạn", class: "bg-gray-100 text-gray-500" },
    };
    const s = map[status] || { label: status, class: "bg-gray-100 text-gray-700" };
    return (
      <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${s.class}`}>
        {status === "PENDING" && <Clock className="h-3 w-3" />}
        {status === "ACCEPTED" && <Check className="h-3 w-3" />}
        {status === "REJECTED" && <X className="h-3 w-3" />}
        {s.label}
      </span>
    );
  };

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
            className="text-sm text-emerald-600 hover:text-emerald-700 font-medium"
          >
            Đánh dấu đã đọc tất cả
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="mb-4 flex gap-1 rounded-lg bg-gray-100 p-1">
        {[
          { key: "all" as Tab, label: "Tất cả thông báo" },
          { key: "invitations" as Tab, label: "Lời mời nhóm" },
        ].map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-md px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="mb-4 rounded-lg bg-red-50 border border-red-200 px-4 py-3 text-sm text-red-700">
          {error}
          <button className="ml-2 underline" onClick={() => setError("")}>Đóng</button>
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-gray-400" />
        </div>
      ) : tab === "all" ? (
        <NotificationList
          notifications={notifications}
          onMarkRead={handleMarkRead}
          onViewDetails={(n) => {
            if (n.type === "GroupInvitation" && n.referenceId) {
              setTab("invitations");
            }
            // Handle milestone notifications - redirect to periodic reports
            if ((n.type === "MilestoneTask" || n.type === "MilestoneFeedback" || n.type === "MilestoneCompleted") && n.referenceId) {
              router.push(`/student/periodic-reports?milestone=${n.referenceId}`);
            }
            // Progress log feedback - jump to the Nhật ký tiến độ page and
            // anchor the specific log so the student sees the lecturer reply.
            if (n.type === "ProgressLogFeedback" && n.referenceId) {
              router.push(`/student/progress-logs?log=${n.referenceId}`);
            }
          }}
          formatDate={formatDate}
        />
      ) : (
        <InvitationList
          invitations={invitations}
          receivedInvitations={receivedInvitations}
          onCancel={handleCancelInvite}
          onAccept={handleAcceptInvite}
          onReject={(id) => setShowRejectModal(id)}
          actionLoading={actionLoading}
          showRejectModal={showRejectModal}
          rejectReason={rejectReason}
          setRejectReason={setRejectReason}
          onConfirmReject={handleRejectInvite}
          onCloseReject={() => { setShowRejectModal(null); setRejectReason(""); }}
          formatDate={formatDate}
          statusBadge={statusBadge}
        />
      )}
    </div>
  );
}

// ============================================================
// Notification List
// ============================================================
function NotificationList({
  notifications,
  onMarkRead,
  onViewDetails,
  formatDate,
}: {
  notifications: NotificationResponse[];
  onMarkRead: (id: string) => void;
  onViewDetails: (n: NotificationResponse) => void;
  formatDate: (d: string) => string;
}) {
  if (notifications.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-gray-400">
        <Bell className="mb-3 h-12 w-12" />
        <p className="text-sm font-medium">Không có thông báo nào</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {notifications.map((n) => (
        <div
          key={n.id}
          onClick={() => { if (!n.isRead) onMarkRead(n.id); onViewDetails(n); }}
          className={`flex cursor-pointer items-start gap-3 rounded-xl border p-4 transition-all hover:shadow-sm ${
            n.isRead
              ? "border-gray-100 bg-white"
              : "border-emerald-100 bg-emerald-50/50"
          }`}
        >
          <div className={`mt-0.5 rounded-full p-2 ${n.isRead ? "bg-gray-100" : "bg-emerald-100"}`}>
            {n.type === "GroupInvitation" ? (
              <Users className={`h-4 w-4 ${n.isRead ? "text-gray-400" : "text-emerald-600"}`} />
            ) : n.type === "MilestoneTask" || n.type === "MilestoneSubmission" || n.type === "MilestoneFeedback" || n.type === "MilestoneCompleted" ? (
              <Target className={`h-4 w-4 ${n.isRead ? "text-gray-400" : "text-emerald-600"}`} />
            ) : (
              <Bell className={`h-4 w-4 ${n.isRead ? "text-gray-400" : "text-emerald-600"}`} />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-sm ${n.isRead ? "text-gray-600" : "font-semibold text-gray-900"}`}>
              {n.title}
            </p>
            <p className="mt-0.5 text-sm text-gray-500 line-clamp-2">{n.message}</p>
            <p className="mt-1 text-xs text-gray-400">{formatDate(n.createdAt)}</p>
          </div>
          {!n.isRead && (
            <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-emerald-500" />
          )}
        </div>
      ))}
    </div>
  );
}

// ============================================================
// Invitation List
// ============================================================
function InvitationList({
  invitations,
  receivedInvitations,
  onCancel,
  onAccept,
  onReject,
  actionLoading,
  showRejectModal,
  rejectReason,
  setRejectReason,
  onConfirmReject,
  onCloseReject,
  formatDate,
  statusBadge,
}: {
  invitations: GroupInvitationResponse[];
  receivedInvitations: GroupInvitationResponse[];
  onCancel: (id: string) => void;
  onAccept: (id: string) => void;
  onReject: (id: string) => void;
  actionLoading: string | null;
  showRejectModal: string | null;
  rejectReason: string;
  setRejectReason: (v: string) => void;
  onConfirmReject: () => void;
  onCloseReject: () => void;
  formatDate: (d: string) => string;
  statusBadge: (s: string) => React.ReactNode;
}) {
  return (
    <div className="space-y-8">
      {/* Received invitations */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Lời mời nhận được
        </h2>
        {receivedInvitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-gray-400">
            <Users className="mb-2 h-8 w-8" />
            <p className="text-sm">Chưa có lời mời nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {receivedInvitations.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{inv.title}</h3>
                      <span className="text-xs text-gray-400">từ {inv.inviterFullName}</span>
                      {statusBadge(inv.status)}
                    </div>
                    <p className="text-xs text-gray-500">{inv.inviterEmail}</p>
                    {inv.message && (
                      <p className="mt-2 text-sm text-gray-700 italic">&ldquo;{inv.message}&rdquo;</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">Gửi lúc: {formatDate(inv.createdAt)}</p>
                  </div>
                </div>

                {inv.status === "PENDING" && (
                  <div className="mt-4 flex gap-2 justify-end">
                    <button
                      onClick={() => onReject(inv.id)}
                      disabled={actionLoading === inv.id}
                      className="flex items-center gap-1.5 rounded-lg border border-red-200 bg-white px-4 py-2 text-sm font-medium text-red-600 transition-colors hover:bg-red-50 disabled:opacity-50"
                    >
                      <X className="h-4 w-4" />
                      Từ chối
                    </button>
                    <button
                      onClick={() => onAccept(inv.id)}
                      disabled={actionLoading === inv.id}
                      className="flex items-center gap-1.5 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {actionLoading === inv.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4" />
                      )}
                      Chấp nhận
                    </button>
                  </div>
                )}

                {inv.status === "REJECTED" && inv.rejectionReason && (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                    <p className="text-xs font-medium text-red-700">Lý do từ chối:</p>
                    <p className="text-sm text-red-600 mt-0.5">{inv.rejectionReason}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Sent invitations */}
      <section>
        <h2 className="mb-3 text-sm font-semibold text-gray-500 uppercase tracking-wide">
          Lời mời đã gửi
        </h2>
        {invitations.length === 0 ? (
          <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-gray-200 py-10 text-gray-400">
            <Users className="mb-2 h-8 w-8" />
            <p className="text-sm">Chưa gửi lời mời nào</p>
          </div>
        ) : (
          <div className="space-y-3">
            {invitations.map((inv) => (
              <div key={inv.id} className="rounded-xl border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-semibold text-gray-900 text-sm">
                        {inv.title}
                      </h3>
                      <span className="text-xs text-gray-400">→ {inv.inviteeFullName}</span>
                      {statusBadge(inv.status)}
                    </div>
                    <p className="text-xs text-gray-500">{inv.inviteeEmail}</p>
                    {inv.message && (
                      <p className="mt-2 text-sm text-gray-700 italic">&ldquo;{inv.message}&rdquo;</p>
                    )}
                    <p className="mt-2 text-xs text-gray-400">Gửi lúc: {formatDate(inv.createdAt)}</p>
                    {inv.respondedAt && (
                      <p className="text-xs text-gray-400">Phản hồi lúc: {formatDate(inv.respondedAt)}</p>
                    )}
                  </div>
                </div>

                {inv.status === "REJECTED" && inv.rejectionReason && (
                  <div className="mt-3 rounded-lg bg-red-50 border border-red-100 px-3 py-2">
                    <p className="text-xs font-medium text-red-700">Lý do từ chối:</p>
                    <p className="text-sm text-red-600 mt-0.5">{inv.rejectionReason}</p>
                  </div>
                )}

                {inv.status === "PENDING" && (
                  <div className="mt-3 flex justify-end">
                    <button
                      onClick={() => onCancel(inv.id)}
                      disabled={actionLoading === inv.id}
                      className="text-xs text-gray-400 hover:text-red-500 transition-colors disabled:opacity-50"
                    >
                      Hủy lời mời
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Reject modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-4">Từ chối lời mời</h3>
            <p className="text-sm text-gray-500 mb-3">
              Vui lòng cho biết lý do từ chối lời mời này.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Ví dụ: Lịch học không phù hợp, muốn tự lập nhóm..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100 transition-all"
            />
            <div className="mt-4 flex gap-3 justify-end">
              <button
                onClick={onCloseReject}
                className="rounded-lg border border-gray-200 px-4 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors"
              >
                Hủy
              </button>
              <button
                onClick={onConfirmReject}
                disabled={!rejectReason.trim() || actionLoading === showRejectModal}
                className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center gap-2"
              >
                {actionLoading === showRejectModal && <Loader2 className="h-4 w-4 animate-spin" />}
                Xác nhận từ chối
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
