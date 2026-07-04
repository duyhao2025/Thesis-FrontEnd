"use client";

import React, { useState, useEffect, useCallback } from "react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import { Check, X, Clock, Users, FileText, Loader2, AlertCircle } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface PendingApproval {
  approvalId: string;
  topicRegistrationId: string;
  title: string;
  description: string;
  objective: string;
  scope: string;
  studentFullName: string;
  groupMemberCount: number;
  lecturerFullName: string;
  submittedAt: string;
  currentLevel: string;
}


export default function PendingApprovalsPage() {
  const [approvals, setApprovals] = useState<PendingApproval[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedApproval, setSelectedApproval] = useState<PendingApproval | null>(null);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectComment, setRejectComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const fetchApprovals = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get<PendingApproval[]>("/topic-registrations/pending-approval");
      setApprovals(res.data || []);
    } catch {
      setApprovals([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchApprovals();
  }, [fetchApprovals]);

  const handleApproval = async (approvalId: string, action: "approve" | "reject") => {
    setSubmitting(true);
    try {
      if (action === "approve") {
        await api.put(`/approvals/${approvalId}/approve`, {});
      } else {
        await api.put(`/approvals/${approvalId}/reject`, { comment: rejectComment || null });
      }
      showToast("success", action === "approve" ? "Duyệt thành công!" : "Đã từ chối");
      setShowRejectModal(false);
      setRejectComment("");
      setSelectedApproval(null);
      fetchApprovals();
    } catch (err: unknown) {
      const message =
        (err as { response?: { data?: { message?: string } } })?.response?.data?.message ||
        "Có lỗi xảy ra.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const openRejectModal = (approval: PendingApproval) => {
    setSelectedApproval(approval);
    setRejectComment("");
    setShowRejectModal(true);
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-teal-500" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Duyệt đăng ký đề tài</h1>
          <p className="text-sm text-gray-500">
            {approvals.length} đăng ký đang chờ duyệt
          </p>
        </div>
        <Button variant="outline" onClick={fetchApprovals}>
          Làm mới
        </Button>
      </div>

      {approvals.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <Check className="mb-3 h-12 w-12 text-green-300" />
          <p className="text-sm font-medium text-gray-500">Không có đăng ký nào đang chờ duyệt</p>
        </div>
      ) : (
        <div className="space-y-4">
          {approvals.map((approval) => (
            <div
              key={approval.approvalId}
              className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{approval.title}</h3>
                    <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                      <Clock className="h-3 w-3" />
                      {approval.currentLevel}
                    </span>
                  </div>

                  <div className="grid grid-cols-2 gap-4 text-sm mb-4">
                    <div>
                      <span className="text-gray-500">Sinh viên: </span>
                      <span className="font-medium">{approval.studentFullName}</span>
                    </div>
                    {approval.groupMemberCount > 0 && (
                      <div>
                        <span className="text-gray-500">Số thành viên nhóm: </span>
                        <span className="font-medium flex items-center gap-1">
                          <Users className="h-4 w-4" />
                          {approval.groupMemberCount}
                        </span>
                      </div>
                    )}
                    <div>
                      <span className="text-gray-500">Ngày đăng ký: </span>
                      <span className="font-medium">
                        {format(new Date(approval.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </span>
                    </div>
                  </div>

                  {approval.description && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Mô tả:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {approval.description}
                      </p>
                    </div>
                  )}

                  {approval.objective && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Mục tiêu:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {approval.objective}
                      </p>
                    </div>
                  )}

                  {approval.scope && (
                    <div className="mb-3">
                      <p className="text-sm text-gray-500 mb-1">Phạm vi:</p>
                      <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3">
                        {approval.scope}
                      </p>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700"
                    onClick={() => handleApproval(approval.approvalId, "approve")}
                  >
                    <Check className="h-4 w-4 mr-1" />
                    Duyệt
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="border-red-200 text-red-600 hover:bg-red-50"
                    onClick={() => openRejectModal(approval)}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Từ chối
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Reject Modal */}
      <Modal
        isOpen={showRejectModal}
        onClose={() => {
          setShowRejectModal(false);
          setSelectedApproval(null);
          setRejectComment("");
        }}
        title="Từ chối đăng ký"
        size="md"
      >
        <div className="space-y-4">
          {selectedApproval && (
            <div className="rounded-lg bg-amber-50 border border-amber-200 p-4">
              <p className="text-sm text-amber-800">
                <strong>{selectedApproval.title}</strong>
              </p>
              <p className="text-xs text-amber-600 mt-1">
                Sinh viên: {selectedApproval.studentFullName}
              </p>
            </div>
          )}

          <Textarea
            label="Lý do từ chối (bắt buộc)"
            value={rejectComment}
            onChange={(e) => setRejectComment(e.target.value)}
            placeholder="Nhập lý do từ chối đăng ký này..."
            rows={4}
          />

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowRejectModal(false);
                setSelectedApproval(null);
                setRejectComment("");
              }}
            >
              Hủy
            </Button>
            <Button
              className="bg-red-600 hover:bg-red-700"
              isLoading={submitting}
              onClick={() => {
                if (selectedApproval) {
                  handleApproval(selectedApproval.approvalId, "reject");
                }
              }}
            >
              Xác nhận từ chối
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
