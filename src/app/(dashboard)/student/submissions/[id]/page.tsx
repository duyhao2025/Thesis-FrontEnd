"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { ArrowLeft, FileText, Upload, Clock, CheckCircle2, AlertCircle, History } from "lucide-react";
import clsx from "clsx";
import { StudentMilestoneSubmissionResponse, SubmissionVersionResponse } from "@/types/entities";
import FileActionButton from "@/components/ui/FileActionButton";
import FileIcon from "@/components/ui/FileIcon";

export default function SubmissionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { showToast } = useToast();
  const submissionId = params.id as string;

  const [submission, setSubmission] = useState<StudentMilestoneSubmissionResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showResubmitModal, setShowResubmitModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [resubmitForm, setResubmitForm] = useState({ title: "", fileUrl: "" });

  useEffect(() => {
    loadSubmission();
  }, [submissionId]);

  const loadSubmission = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/milestone-submissions/${submissionId}/versions`);
      setSubmission(res.data);
      setResubmitForm({ title: res.data.title || "", fileUrl: "" });
    } catch {
      showToast("error", "Không thể tải thông tin bài nộp");
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const handleResubmit = async () => {
    if (!resubmitForm.title.trim() || !resubmitForm.fileUrl.trim()) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }

    setSubmitting(true);
    try {
      await api.post(`/milestone-submissions/${submissionId}/resubmit`, {
        title: resubmitForm.title,
        fileUrl: resubmitForm.fileUrl,
      });
      showToast("success", "Nộp lại thành công!");
      setShowResubmitModal(false);
      loadSubmission();
    } catch {
      showToast("error", "Nộp lại thất bại. Vui lòng thử lại.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-500 border-t-transparent" />
      </div>
    );
  }

  if (!submission) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="h-16 w-16 text-red-400" />
        <h2 className="mt-4 text-lg font-semibold text-gray-700">Không tìm thấy bài nộp</h2>
        <Button variant="outline" className="mt-4" onClick={() => router.back()}>
          Quay lại
        </Button>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status.toUpperCase()) {
      case "COMPLETED":
        return <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800"><CheckCircle2 className="h-3 w-3" /> Hoàn thành</span>;
      case "PENDING":
        return <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-0.5 text-xs font-medium text-yellow-800"><Clock className="h-3 w-3" /> Đang chờ</span>;
      case "NEEDSREVISION":
        return <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-800"><AlertCircle className="h-3 w-3" /> Cần sửa</span>;
      default:
        return <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800">{status}</span>;
    }
  };

  const isDeadlinePassed = submission.revisionDeadline && new Date(submission.revisionDeadline) < new Date();

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="sm" onClick={() => router.back()}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chi tiết bài nộp</h1>
          <p className="text-sm text-gray-500">{submission.milestoneTitle}</p>
        </div>
      </div>

      {/* Current Submission */}
      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <FileIcon url={submission.fileUrl} size="lg" showLabel />
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">{submission.title}</h2>
                <span className="rounded bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-800">
                  Phiên bản {submission.version}
                </span>
                {getStatusBadge(submission.status)}
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Nộp lúc: {format(new Date(submission.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
              </p>
            </div>
          </div>

          {submission.canResubmit && !isDeadlinePassed && (
            <Button onClick={() => setShowResubmitModal(true)}>
              <Upload className="h-4 w-4" />
              Nộp lại
            </Button>
          )}
        </div>

        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <div>
            <label className="text-sm font-medium text-gray-500">File bài nộp</label>
            <div className="mt-1 rounded-lg border border-gray-200 bg-white p-3">
              <FileActionButton
                url={submission.fileUrl}
                title={submission.title}
                variant="button"
              />
              <p className="mt-2 truncate text-xs text-gray-400">{submission.fileUrl}</p>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-gray-500">Hạn chót sửa lại</label>
            <p className={clsx(
              "mt-1 text-sm",
              isDeadlinePassed ? "text-red-600 font-medium" : "text-gray-700"
            )}>
              {submission.revisionDeadline
                ? format(new Date(submission.revisionDeadline), "dd/MM/yyyy HH:mm", { locale: vi })
                : "Không có"}
              {isDeadlinePassed && " (Đã hết hạn)"}
            </p>
          </div>
        </div>

        {submission.feedback && (
          <div className="mt-4 rounded-lg bg-amber-50 p-4">
            <h3 className="flex items-center gap-2 text-sm font-semibold text-amber-800">
              <AlertCircle className="h-4 w-4" />
              Phản hồi từ giáo viên
            </h3>
            <p className="mt-2 text-sm text-amber-900">{submission.feedback}</p>
          </div>
        )}

        {submission.status.toUpperCase() === "NEEDSREVISION" && isDeadlinePassed && (
          <div className="mt-4 rounded-lg border border-red-200 bg-red-50 p-4">
            <p className="text-sm text-red-800">
              Đã hết hạn sửa lại. Bạn không thể nộp thêm phiên bản mới.
            </p>
          </div>
        )}
      </Card>

      {/* Version History */}
      {submission.versions.length > 1 && (
        <Card>
          <div className="mb-4 flex items-center gap-2">
            <History className="h-5 w-5 text-gray-500" />
            <h3 className="font-semibold text-gray-900">Lịch sử các phiên bản</h3>
          </div>
          <div className="space-y-4">
            {submission.versions.map((version, idx) => (
              <div key={version.id} className={clsx(
                "relative rounded-lg border p-4",
                version.id === submission.id
                  ? "border-blue-300 bg-blue-50"
                  : "border-gray-200 bg-white"
              )}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={clsx(
                      "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                      version.id === submission.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-200 text-gray-600"
                    )}>
                      v{version.version}
                    </div>
                    {version.fileUrl && <FileIcon url={version.fileUrl} size="sm" />}
                    <div>
                      <p className="font-medium text-gray-900">{version.title}</p>
                      <p className="text-xs text-gray-500">
                        {format(new Date(version.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusBadge(version.status)}
                    {version.fileUrl && (
                      <FileActionButton
                        url={version.fileUrl}
                        title={`${version.title} (v${version.version})`}
                      />
                    )}
                  </div>
                </div>

                {version.feedback && version.id !== submission.id && (
                  <div className="mt-3 rounded bg-amber-50 p-2 text-xs text-amber-800">
                    <span className="font-medium">Feedback:</span> {version.feedback}
                  </div>
                )}

                {idx < submission.versions.length - 1 && (
                  <div className="absolute -bottom-4 left-1/2 h-4 w-px -translate-x-1/2 border-l-2 border-dashed border-gray-300" />
                )}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Resubmit Modal */}
      <Modal
        isOpen={showResubmitModal}
        onClose={() => setShowResubmitModal(false)}
        title="Nộp lại bài"
        size="lg"
      >
        <div className="space-y-4">
          {submission.revisionDeadline && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              <Clock className="h-4 w-4 mt-0.5 flex-shrink-0" />
              <div>
                <span className="font-medium">Lưu ý:</span> Bạn cần nộp lại trước ngày{" "}
                {format(new Date(submission.revisionDeadline), "dd/MM/yyyy HH:mm", { locale: vi })}.
                Sau thời điểm này, bạn sẽ không thể nộp thêm.
              </div>
            </div>
          )}

          <div className="rounded-lg bg-amber-50 p-3 text-sm text-amber-800">
            <p className="font-medium">Phản hồi từ giáo viên:</p>
            <p className="mt-1">{submission.feedback}</p>
          </div>

          <Input
            label="Tiêu đề bài nộp"
            value={resubmitForm.title}
            onChange={(e) => setResubmitForm({ ...resubmitForm, title: e.target.value })}
            placeholder="VD: Báo cáo tuần 3 - Cập nhật phiên bản 2"
          />

          <Input
            label="Link file (Google Drive, Dropbox,...)"
            value={resubmitForm.fileUrl}
            onChange={(e) => setResubmitForm({ ...resubmitForm, fileUrl: e.target.value })}
            placeholder="https://drive.google.com/..."
          />

          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowResubmitModal(false)}>
              Hủy
            </Button>
            <Button isLoading={submitting} onClick={handleResubmit}>
              <Upload className="h-4 w-4" />
              Nộp lại (Phiên bản {submission.version + 1})
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
