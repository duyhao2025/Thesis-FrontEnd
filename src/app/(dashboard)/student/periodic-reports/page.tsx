"use client";

import React, { useEffect, useState, useCallback, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import FileDropzone from "@/components/common/FileDropzone";
import { PeriodicReportResponse, ReportType } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, FileBarChart, Upload, AlertCircle, BookOpen, CheckCircle, Clock, MessageSquare, Target, RefreshCw, Megaphone } from "lucide-react";

const reportTypeLabels: Record<ReportType, string> = {
  Weekly: "Báo cáo 5 phút",
  Monthly: "Báo cáo 1 tháng",
  Quarterly: "Báo cáo 3 tháng",
  Semester: "Báo cáo kết thúc",
};

interface MilestoneTask {
  id: string;
  title: string;
  deadline: string;
  requiredSubmission: boolean;
  isCompleted: boolean;
  topicId: string;
  topicTitle: string;
  submissionId: string | null;
  submissionTitle: string | null;
  submissionFileUrl: string | null;
  submittedAt: string | null;
  submissionStatus: string | null;
  feedback: string | null;
  canResubmit: boolean;
  revisionDeadline: string | null;
}

function PeriodicReportsContent() {
  const searchParams = useSearchParams();
  const highlightMilestone = searchParams.get("milestone");

  const [reports, setReports] = useState<PeriodicReportResponse[]>([]);
  const [milestones, setMilestones] = useState<MilestoneTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [topicId, setTopicId] = useState<string>("");
  const [form, setForm] = useState({
    topicId: "",
    reportType: "Monthly" as ReportType,
    fileUrl: "",
  });

  const [milestoneForm, setMilestoneForm] = useState({
    milestoneId: "",
    title: "",
    fileUrl: "",
  });
  const [selectedMilestone, setSelectedMilestone] = useState<MilestoneTask | null>(null);

  // Auto-detect student's approved topic
  const detectTopicId = useCallback(async () => {
    try {
      const res = await api.get("/topic-registrations/my");
      const registrations = res.data || [];
      const approved = registrations.find(
        (r: { status: string }) =>
          r.status === "Approved" || r.status === "APPROVED"
      );
      if (approved) {
        setTopicId(approved.topicId);
        setForm((f) => ({ ...f, topicId: approved.topicId }));
      }
    } catch {
      // silently fail
    }
  }, []);

  // Load my reports
  const loadReports = useCallback(
    async (tid: string) => {
      if (!tid) {
        setReports([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/reports/topic/${tid}`);
        setReports(res.data || []);
      } catch {
        setReports([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  // Load milestone tasks
  const loadMilestones = useCallback(async () => {
    try {
      const res = await api.get<MilestoneTask[]>("/milestone-submissions/my");
      setMilestones(res.data || []);

      // Auto-select milestone if redirected from notification
      if (highlightMilestone) {
        const target = res.data?.find((m: MilestoneTask) => m.id === highlightMilestone);
        if (target) {
          setSelectedMilestone(target);
          if (!target.submissionId) {
            setMilestoneForm({
              milestoneId: target.id,
              title: "",
              fileUrl: "",
            });
            setShowModal(true);
          }
        }
      }
    } catch {
      setMilestones([]);
    }
  }, [highlightMilestone]);

  useEffect(() => {
    detectTopicId();
  }, [detectTopicId]);

  useEffect(() => {
    if (topicId) {
      loadReports(topicId);
    }
    loadMilestones();
  }, [topicId, loadReports, loadMilestones]);

  // Auto-refresh milestones when user returns to the tab so feedback from
  // lecturer appears without manual reload
  useEffect(() => {
    const onFocus = () => loadMilestones();
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [loadMilestones]);

  const handleSubmit = async () => {
    if (!form.topicId) {
      showToast("error", "Không xác định được đề tài. Vui lòng đăng ký đề tài trước.");
      return;
    }
    if (!form.fileUrl) {
      showToast("warning", "Vui lòng upload file báo cáo trước khi nộp.");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/reports", {
        topicId: form.topicId,
        reportType: form.reportType,
        fileUrl: form.fileUrl,
      });
      showToast("success", "Nộp báo cáo thành công!");
      setShowModal(false);
      setForm({ topicId, reportType: "Monthly", fileUrl: "" });
      loadReports(topicId);
    } catch {
      showToast("error", "Nộp báo cáo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleMilestoneSubmit = async () => {
    if (!milestoneForm.milestoneId) {
      showToast("error", "Vui lòng chọn nhiệm vụ.");
      return;
    }
    if (!milestoneForm.title.trim()) {
      showToast("warning", "Vui lòng nhập tiêu đề bài nộp.");
      return;
    }
    if (!milestoneForm.fileUrl) {
      showToast("warning", "Vui lòng upload file báo cáo trước khi nộp.");
      return;
    }
    setSubmitting(true);
    try {
      // Check if this is a resubmit (existing submission with NeedsRevision status)
      const isResubmit = selectedMilestone?.submissionId && selectedMilestone?.canResubmit;
      
      if (isResubmit && selectedMilestone?.submissionId) {
        // Call resubmit API
        await api.post(`/milestone-submissions/${selectedMilestone.submissionId}/resubmit`, {
          title: milestoneForm.title.trim(),
          fileUrl: milestoneForm.fileUrl,
        });
        showToast("success", "Nộp lại bài thành công!");
      } else {
        // Normal submit
        await api.post("/milestone-submissions", {
          milestoneId: milestoneForm.milestoneId,
          title: milestoneForm.title.trim(),
          fileUrl: milestoneForm.fileUrl,
        });
        showToast("success", "Nộp bài thành công!");
      }
      setShowModal(false);
      setMilestoneForm({ milestoneId: "", title: "", fileUrl: "" });
      setSelectedMilestone(null);
      loadMilestones();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Nộp bài thất bại.";
      showToast("error", msg);
    } finally {
      setSubmitting(false);
    }
  };

  const openMilestoneModal = (milestone: MilestoneTask) => {
    setSelectedMilestone(milestone);
    setMilestoneForm({
      milestoneId: milestone.id,
      title: "",
      fileUrl: "",
    });
    setShowModal(true);
  };

  const columns = [
    {
      key: "reportType",
      header: "Loại báo cáo",
      render: (row: PeriodicReportResponse) => (
        <span className="font-medium">
          {reportTypeLabels[row.reportType] || row.reportType}
        </span>
      ),
    },
    {
      key: "submittedAt",
      header: "Ngày nộp",
      render: (row: PeriodicReportResponse) =>
        row.submittedAt
          ? format(new Date(row.submittedAt), "dd/MM/yyyy HH:mm", {
              locale: vi,
            })
          : "—",
    },
    {
      key: "fileUrl",
      header: "File",
      render: (row: PeriodicReportResponse) =>
        row.fileUrl && row.fileUrl !== "pending" ? (
          <a
            href={row.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Xem file
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "lecturerFeedback",
      header: "Phản hồi",
      render: (row: PeriodicReportResponse) => (
        <span
          className={
            row.lecturerFeedback ? "text-green-600" : "text-gray-400"
          }
        >
          {row.lecturerFeedback || "Chưa có"}
        </span>
      ),
    },
    {
      key: "score",
      header: "Điểm",
      render: (row: PeriodicReportResponse) =>
        row.score != null ? (
          <span className="font-semibold text-blue-600">{row.score}/10</span>
        ) : (
          "—"
        ),
    },
  ];

  const getStatusBadge = (milestone: MilestoneTask) => {
    if (milestone.isCompleted) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
          <CheckCircle className="h-3 w-3" /> Hoàn thành
        </span>
      );
    }
    if (milestone.submissionStatus?.toUpperCase() === "NEEDSREVISION") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          <AlertCircle className="h-3 w-3" /> Cần sửa
        </span>
      );
    }
    if (milestone.submissionId) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-700">
          <Clock className="h-3 w-3" /> Đã nộp
        </span>
      );
    }
    if (new Date(milestone.deadline) < new Date()) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-700">
          Quá hạn
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-700">
        <Target className="h-3 w-3" /> Chưa nộp
      </span>
    );
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Báo cáo tiến độ</h1>
          <p className="text-sm text-gray-500">Nộp báo cáo định kỳ và nhiệm vụ từ giáo viên</p>
        </div>
      </div>

      {/* Nhiệm vụ từ giáo viên */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <Target className="h-5 w-5 text-teal-600" />
            Nhiệm vụ từ giáo viên
          </h2>
          <button
            onClick={() => loadMilestones()}
            className="inline-flex items-center gap-1 rounded-md border border-gray-200 bg-white px-2 py-1 text-xs font-medium text-gray-600 hover:bg-gray-100"
            title="Tải lại danh sách"
          >
            <RefreshCw className="h-3 w-3" />
            Làm mới
          </button>
        </div>

        {milestones.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <Target className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center">Chưa có nhiệm vụ nào từ giáo viên</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {milestones.map((milestone) => (
              <div key={milestone.id} className="p-4">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-medium text-gray-900">{milestone.title}</h3>
                      {getStatusBadge(milestone)}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">
                      Đề tài: <span className="text-gray-700">{milestone.topicTitle}</span>
                    </p>
                    <p className="text-sm text-gray-500">
                      Hạn nộp:{" "}
                      <span className={new Date(milestone.deadline) < new Date() ? "text-red-600 font-medium" : "text-gray-700"}>
                        {format(new Date(milestone.deadline), "dd/MM/yyyy", { locale: vi })}
                      </span>
                    </p>

                    {(milestone.feedback || milestone.submissionStatus?.toUpperCase() === "NEEDSREVISION") && (
                      <div className="mt-3 rounded-lg border-2 border-amber-300 bg-amber-50 p-3 shadow-sm">
                        <div className="flex items-start gap-2">
                          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-amber-200">
                            <MessageSquare className="h-4 w-4 text-amber-700" />
                          </div>
                          <div className="flex-1">
                            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
                              Phản hồi từ giáo viên
                            </p>
                            {milestone.feedback ? (
                              <p className="mt-1 text-sm font-medium text-amber-900 whitespace-pre-wrap">
                                {milestone.feedback}
                              </p>
                            ) : (
                              <p className="mt-1 text-sm italic text-amber-700">
                                Giáo viên yêu cầu bạn chỉnh sửa lại bài nộp.
                              </p>
                            )}
                            {milestone.revisionDeadline && (
                              <p className="mt-2 inline-flex items-center gap-1 rounded-md bg-amber-200 px-2 py-0.5 text-xs font-semibold text-amber-900">
                                <Clock className="h-3 w-3" />
                                Hạn sửa: {format(new Date(milestone.revisionDeadline), "dd/MM/yyyy", { locale: vi })}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}

                    {milestone.submissionId && (
                      <div className="mt-3 flex items-center gap-3">
                        <p className="text-sm text-gray-600">
                          <span className="font-medium">Bài đã nộp:</span> {milestone.submissionTitle}
                        </p>
                        {milestone.submissionFileUrl && (
                          <a
                            href={milestone.submissionFileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-blue-600 hover:underline"
                          >
                            Xem file
                          </a>
                        )}
                        <span className="text-xs text-gray-400">
                          {milestone.submittedAt && format(new Date(milestone.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                        </span>
                      </div>
                    )}
                  </div>

                  {!milestone.submissionId && (
                    <Button
                      size="sm"
                      onClick={() => openMilestoneModal(milestone)}
                    >
                      Nộp bài
                    </Button>
                  )}
                  {milestone.canResubmit && (
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={() => openMilestoneModal(milestone)}
                    >
                      Nộp lại
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Báo cáo định kỳ */}
      <div className="rounded-lg border border-gray-200 bg-white">
        <div className="border-b border-gray-200 bg-gray-50 px-4 py-3 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 flex items-center gap-2">
            <FileBarChart className="h-5 w-5 text-blue-600" />
            Báo cáo định kỳ
          </h2>
          {topicId && (
            <Button size="sm" onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4 mr-1" />
              Nộp báo cáo
            </Button>
          )}
        </div>

        {!topicId ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <BookOpen className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500 text-center">Bạn chưa có đề tài được duyệt</p>
          </div>
        ) : reports.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-12 px-4">
            <FileBarChart className="h-10 w-10 text-gray-300 mb-3" />
            <p className="text-sm text-gray-500">Chưa có báo cáo nào</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={reports}
            loading={loading}
            rowKey="id"
          />
        )}
      </div>

      {/* Modal Nộp báo cáo định kỳ */}
      <Modal
        isOpen={showModal && !selectedMilestone}
        onClose={() => { setShowModal(false); setSelectedMilestone(null); }}
        title="Nộp báo cáo định kỳ"
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            Đề tài: <span className="font-medium">{topicId}</span>
          </div>
          <Select
            label="Loại báo cáo"
            value={form.reportType}
            onChange={(e) =>
              setForm({ ...form, reportType: e.target.value as ReportType })
            }
            options={[
              { value: "Weekly", label: "Báo cáo 5 phút" },
              { value: "Monthly", label: "Báo cáo 1 tháng" },
              { value: "Quarterly", label: "Báo cáo 3 tháng" },
              { value: "Semester", label: "Báo cáo kết thúc" },
            ]}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              File báo cáo
            </label>
            <FileDropzone
              value={form.fileUrl}
              onChange={(url) => setForm({ ...form, fileUrl: url })}
              category="reports"
            />
            <p className="mt-1 text-xs text-gray-500">
              Chấp nhận PDF, Word (.doc/.docx), hoặc ZIP. Tối đa 20 MB.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button isLoading={submitting} onClick={handleSubmit}>
              <Upload className="h-4 w-4" />
              Nộp báo cáo
            </Button>
          </div>
        </div>
      </Modal>

      {/* Modal Nộp bài nhiệm vụ */}
      <Modal
        isOpen={showModal && !!selectedMilestone}
        onClose={() => { setShowModal(false); setSelectedMilestone(null); }}
        title={selectedMilestone?.canResubmit ? `Nộp lại: ${selectedMilestone?.title || ""}` : `Nộp bài: ${selectedMilestone?.title || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-lg bg-teal-50 p-3 text-sm text-teal-700">
            <p><span className="font-medium">Đề tài:</span> {selectedMilestone?.topicTitle}</p>
            <p><span className="font-medium">Hạn nộp:</span> {selectedMilestone && format(new Date(selectedMilestone.deadline), "dd/MM/yyyy", { locale: vi })}</p>
          </div>
          <Input
            label="Tiêu đề bài nộp"
            placeholder="Ví dụ: Nhóm em nộp bài báo cáo"
            value={milestoneForm.title}
            onChange={(e) => setMilestoneForm({ ...milestoneForm, title: e.target.value })}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              File báo cáo
            </label>
            <FileDropzone
              value={milestoneForm.fileUrl}
              onChange={(url) => setMilestoneForm({ ...milestoneForm, fileUrl: url })}
              category="milestones"
            />
            <p className="mt-1 text-xs text-gray-500">
              Chấp nhận PDF, Word (.doc/.docx), hoặc ZIP. Tối đa 20 MB.
            </p>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowModal(false); setSelectedMilestone(null); }}>
              Hủy
            </Button>
            <Button isLoading={submitting} onClick={handleMilestoneSubmit}>
              <Upload className="h-4 w-4" />
              Nộp bài
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function PeriodicReportsPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600" />
      </div>
    }>
      <PeriodicReportsContent />
    </Suspense>
  );
}
