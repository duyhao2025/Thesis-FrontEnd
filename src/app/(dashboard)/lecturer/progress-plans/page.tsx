"use client";

import React, { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import { TopicResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, Calendar, CheckCircle2, FileText, MessageSquare, ThumbsUp, Clock, Send, Users } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import clsx from "clsx";

interface MilestoneSubmissionResponse {
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  milestoneDeadline: string;
  topicId: string;
  topicTitle: string;
  studentId: string;
  studentFullName: string;
  title: string;
  fileUrl: string;
  feedback: string | null;
  submittedAt: string;
  status: string;
}

interface MilestoneDetail {
  id: string;
  title: string;
  deadline: string;
  requiredSubmission: boolean;
  isCompleted: boolean;
  submissionId: string | null;
  submissionTitle: string | null;
  submissionFileUrl: string | null;
  submittedAt: string | null;
  submissionStatus: string | null;
  studentFullName: string | null;
}

interface ProgressPlanResponse {
  id: string;
  topicId: string;
  topicTitle: string;
  startDate: string;
  endDate: string;
  status: string;
  milestones: MilestoneDetail[];
}

interface StudentInfo {
  id: string;
  fullName: string;
  email: string;
  source: string; // "registration" or "group"
}

function ProgressPlansContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const highlightMilestone = searchParams.get("highlight");

  const [plans, setPlans] = useState<ProgressPlanResponse[]>([]);
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProgressPlanResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  // Submission review state
  const [selectedMilestoneId, setSelectedMilestoneId] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<MilestoneSubmissionResponse[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [feedbackText, setFeedbackText] = useState("");
  const [reviewingSubmission, setReviewingSubmission] = useState<MilestoneSubmissionResponse | null>(null);

  // Students list for a topic
  const [topicStudents, setTopicStudents] = useState<StudentInfo[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);

  const [form, setForm] = useState({
    topicId: "",
    startDate: "",
    endDate: "",
    milestones: [{ title: "", deadline: "", requiredSubmission: false }],
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/progress-plans"),
      api.get("/topics/my/topics-for-plan"),
    ]).then(([planRes, topicRes]) => {
      setPlans(planRes.data || []);
      setTopics(topicRes.data || []);

      // Auto-highlight milestone if redirected from notification
      if (highlightMilestone) {
        const targetPlan = planRes.data?.find((p: ProgressPlanResponse) =>
          p.milestones?.some((m: MilestoneDetail) => m.id === highlightMilestone)
        );
        if (targetPlan) {
          setSelectedPlan(targetPlan);
          setShowDetailModal(true);
          // Auto-expand to show the milestone submissions
          setTimeout(() => {
            loadSubmissions(highlightMilestone);
            const el = document.getElementById(`milestone-${highlightMilestone}`);
            if (el) {
              el.scrollIntoView({ behavior: "smooth", block: "center" });
            }
          }, 300);
        }
      }
    }).catch(() => showToast("error", "Không thể tải dữ liệu"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setSelectedPlan(null);
    setForm({
      topicId: "",
      startDate: "",
      endDate: "",
      milestones: [{ title: "", deadline: "", requiredSubmission: false }],
    });
    setShowModal(true);
  };

  const openDetail = (plan: ProgressPlanResponse) => {
    setSelectedPlan(plan);
    setShowDetailModal(true);
    loadTopicStudents(plan.topicId);
  };

  const loadTopicStudents = async (topicId: string) => {
    setLoadingStudents(true);
    setTopicStudents([]);
    try {
      const res = await api.get(`/topics/${topicId}/students`);
      setTopicStudents(res.data || []);
    } catch {
      setTopicStudents([]);
    } finally {
      setLoadingStudents(false);
    }
  };

  const addMilestone = () => {
    setForm((prev) => ({
      ...prev,
      milestones: [...prev.milestones, { title: "", deadline: "", requiredSubmission: false }],
    }));
  };

  const updateMilestone = (idx: number, field: string, value: string | boolean) => {
    setForm((prev) => {
      const ms = [...prev.milestones];
      (ms[idx] as Record<string, unknown>)[field] = value;
      return { ...prev, milestones: ms };
    });
  };

  const removeMilestone = (idx: number) => {
    setForm((prev) => ({
      ...prev,
      milestones: prev.milestones.filter((_, i) => i !== idx),
    }));
  };

  const handleSubmit = async () => {
    if (!form.topicId || !form.startDate || !form.endDate) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/progress-plans", form);
      showToast("success", "Tạo kế hoạch thành công!");
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Tạo kế hoạch thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa kế hoạch này?")) return;
    try {
      await api.delete(`/progress-plans/${id}`);
      showToast("success", "Xóa thành công!");
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xóa thất bại.";
      showToast("error", message);
    }
  };

  // Load submissions for a milestone
  const loadSubmissions = async (milestoneId: string) => {
    setSelectedMilestoneId(milestoneId);
    setLoadingSubmissions(true);
    try {
      const res = await api.get<MilestoneSubmissionResponse[]>(`/milestone-submissions/${milestoneId}/submissions`);
      setSubmissions(res.data || []);
    } catch {
      setSubmissions([]);
    } finally {
      setLoadingSubmissions(false);
    }
  };

  // Handle review submission
  const handleReview = async (action: "approve" | "feedback") => {
    if (action === "feedback" && !feedbackText.trim()) {
      showToast("warning", "Vui lòng nhập phản hồi");
      return;
    }
    if (!reviewingSubmission) return;

    setSubmitting(true);
    try {
      await api.put(`/milestone-submissions/${reviewingSubmission.id}/review`, {
        action,
        feedback: feedbackText.trim() || null,
      });
      showToast("success", action === "approve" ? "Đã đánh dấu hoàn thành!" : "Đã gửi phản hồi!");
      setShowFeedbackModal(false);
      setFeedbackText("");
      setReviewingSubmission(null);
      if (selectedMilestoneId) {
        loadSubmissions(selectedMilestoneId);
      }
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Có lỗi xảy ra.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const openFeedbackModal = (submission: MilestoneSubmissionResponse) => {
    setReviewingSubmission(submission);
    setFeedbackText("");
    setShowFeedbackModal(true);
  };

  const columns = [
    {
      key: "TopicTitle",
      header: "Đề tài",
      render: (row: ProgressPlanResponse) => <span className="font-medium">{row.topicTitle}</span>,
    },
    {
      key: "startDate",
      header: "Bắt đầu",
      render: (r: ProgressPlanResponse) => format(new Date(r.startDate), "dd/MM/yyyy", { locale: vi }),
    },
    {
      key: "endDate",
      header: "Kết thúc",
      render: (r: ProgressPlanResponse) => format(new Date(r.endDate), "dd/MM/yyyy", { locale: vi }),
    },
    {
      key: "milestones",
      header: "Milestone",
      render: (r: ProgressPlanResponse) => {
        const required = r.milestones?.filter((m: MilestoneDetail) => m.requiredSubmission).length || 0;
        const completed = r.milestones?.filter((m: MilestoneDetail) => m.isCompleted).length || 0;
        const submitted = r.milestones?.filter((m: MilestoneDetail) => m.submissionId).length || 0;
        return <span className="text-sm text-gray-600">{completed}/{submitted}/{required}</span>;
      },
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r: ProgressPlanResponse) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (r: ProgressPlanResponse) => (
        <div className="flex gap-1">
          <Button size="sm" variant="ghost" onClick={() => openDetail(r)}>
            <Calendar className="h-4 w-4" />
          </Button>
          <Button size="sm" variant="ghost" onClick={() => handleDelete(r.id)}>
            <Trash2 className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      ),
    },
  ];

  const getMilestoneStatus = (m: MilestoneDetail) => {
    if (m.isCompleted) {
      return { label: "Hoàn thành", class: "bg-green-100 text-green-700", icon: <CheckCircle2 className="h-4 w-4" /> };
    }
    if (m.submissionId) {
      return { label: "Đã nộp", class: "bg-blue-100 text-blue-700", icon: <FileText className="h-4 w-4" /> };
    }
    if (m.requiredSubmission) {
      return { label: "Chưa nộp", class: "bg-amber-100 text-amber-700", icon: <Clock className="h-4 w-4" /> };
    }
    return { label: "—", class: "bg-gray-100 text-gray-500", icon: null };
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Kế hoạch tiến độ</h1>
          <p className="text-sm text-gray-500">Tạo và quản lý kế hoạch tiến độ cho đề tài</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tạo kế hoạch
        </Button>
      </div>

      <DataTable columns={columns} data={plans} loading={loading} rowKey="id" emptyMessage="Chưa có kế hoạch nào" />

      {/* Create/Edit Modal */}
      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo kế hoạch tiến độ" size="xl">
        <div className="space-y-4">
          <Select
            label="Đề tài *"
            value={form.topicId}
            onChange={(e) => setForm({ ...form, topicId: e.target.value })}
            options={topics.map((t) => ({ value: t.id, label: t.title }))}
            placeholder="Chọn đề tài"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Ngày bắt đầu *"
              type="date"
              value={form.startDate}
              onChange={(e) => setForm({ ...form, startDate: e.target.value })}
            />
            <Input
              label="Ngày kết thúc *"
              type="date"
              value={form.endDate}
              onChange={(e) => setForm({ ...form, endDate: e.target.value })}
            />
          </div>

          <div>
            <div className="mb-2 flex items-center justify-between">
              <label className="text-sm font-medium text-gray-700">Milestones</label>
              <Button size="sm" variant="outline" onClick={addMilestone}>
                <Plus className="h-4 w-4" /> Thêm milestone
              </Button>
            </div>
            <div className="space-y-3">
              {form.milestones.map((ms, idx) => (
                <div key={idx} className="flex items-start gap-3 rounded-lg border border-gray-200 p-3">
                  <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-gray-200 text-xs font-bold">
                    {idx + 1}
                  </div>
                  <div className="flex-1 space-y-2">
                    <Input
                      placeholder="Tên milestone"
                      value={ms.title}
                      onChange={(e) => updateMilestone(idx, "title", e.target.value)}
                    />
                    <div className="flex gap-3">
                      <Input
                        type="date"
                        value={ms.deadline}
                        onChange={(e) => updateMilestone(idx, "deadline", e.target.value)}
                      />
                      <label className="flex items-center gap-2 text-sm">
                        <input
                          type="checkbox"
                          checked={ms.requiredSubmission}
                          onChange={(e) => updateMilestone(idx, "requiredSubmission", e.target.checked)}
                          className="rounded border-gray-300"
                        />
                        Bắt buộc nộp
                      </label>
                    </div>
                  </div>
                  {form.milestones.length > 1 && (
                    <button onClick={() => removeMilestone(idx)} className="rounded p-1 text-red-500 hover:bg-red-50">
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>Tạo kế hoạch</Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal with Submissions */}
      <Modal isOpen={showDetailModal} onClose={() => { setShowDetailModal(false); setSelectedMilestoneId(null); setSubmissions([]); setTopicStudents([]); }} title="Chi tiết kế hoạch" size="xl">
        {selectedPlan && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">{selectedPlan.topicTitle}</h3>
              <StatusBadge status={selectedPlan.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-gray-500">Bắt đầu:</span> {format(new Date(selectedPlan.startDate), "dd/MM/yyyy", { locale: vi })}</div>
              <div><span className="font-medium text-gray-500">Kết thúc:</span> {format(new Date(selectedPlan.endDate), "dd/MM/yyyy", { locale: vi })}</div>
            </div>

            {/* Danh sách sinh viên của đề tài */}
            <div className="rounded-lg border border-purple-200 bg-purple-50 p-4">
              <h4 className="font-medium text-purple-800 mb-2 flex items-center gap-2">
                <span className="h-5 w-5">👥</span>
                Sinh viên đăng ký đề tài này (sẽ nhận thông báo milestone)
              </h4>
              {loadingStudents ? (
                <div className="flex items-center justify-center py-3">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-purple-600" />
                </div>
              ) : topicStudents.length === 0 ? (
                <p className="text-sm text-gray-500 italic">Chưa có sinh viên nào đăng ký đề tài này</p>
              ) : (
                <div className="space-y-2">
                  {topicStudents.map((student) => (
                    <div key={student.id} className="flex items-center justify-between rounded bg-white px-3 py-2 text-sm">
                      <div>
                        <p className="font-medium text-gray-800">{student.fullName || "(Không có tên)"}</p>
                        <p className="text-xs text-gray-500">{student.email || "(Không có email)"}</p>
                      </div>
                      <span className={`rounded-full px-2 py-0.5 text-xs ${
                        student.source === "group" ? "bg-blue-100 text-blue-700" : "bg-green-100 text-green-700"
                      }`}>
                        {student.source === "group" ? "Qua nhóm" : "Qua đăng ký"}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-3">
              {(selectedPlan.milestones || []).map((ms: MilestoneDetail, idx: number) => {
                const status = getMilestoneStatus(ms);
                return (
                  <div key={ms.id} id={`milestone-${ms.id}`}>
                    <div
                      className={clsx(
                        "flex items-center gap-3 rounded-lg border p-3 cursor-pointer transition-all",
                        selectedMilestoneId === ms.id ? "border-teal-300 bg-teal-50" : "border-gray-200 hover:border-gray-300"
                      )}
                      onClick={() => ms.requiredSubmission && loadSubmissions(ms.id)}
                    >
                      <div className={clsx(
                        "flex h-8 w-8 items-center justify-center rounded-full text-sm font-bold",
                        ms.isCompleted ? "bg-green-500 text-white" : "bg-gray-200 text-gray-600"
                      )}>
                        {ms.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-800">{ms.title}</p>
                        <p className="text-xs text-gray-500">
                          Deadline: {format(new Date(ms.deadline), "dd/MM/yyyy", { locale: vi })}
                        </p>
                      </div>
                      {ms.requiredSubmission && (
                        <span className={clsx("inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium", status.class)}>
                          {status.icon}
                          {status.label}
                        </span>
                      )}
                      {ms.requiredSubmission && !ms.isCompleted && (
                        <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Bắt buộc</span>
                      )}
                    </div>

                    {/* Submissions for this milestone */}
                    {selectedMilestoneId === ms.id && ms.requiredSubmission && (
                      <div className="mt-2 ml-4 space-y-3">
                        {loadingSubmissions ? (
                          <div className="flex items-center justify-center py-4">
                            <div className="h-6 w-6 animate-spin rounded-full border-2 border-gray-200 border-t-teal-600" />
                          </div>
                        ) : submissions.length === 0 ? (
                          <div className="rounded-lg border border-dashed border-gray-200 bg-gray-50 p-4 text-center text-sm text-gray-500">
                            Chưa có sinh viên nào nộp bài
                          </div>
                        ) : (
                          submissions.map((sub) => (
                            <div key={sub.id} className="rounded-lg border border-gray-200 bg-white p-4">
                              <div className="flex items-start justify-between gap-3">
                                <div className="flex-1">
                                  <p className="font-medium text-gray-900">{sub.studentFullName}</p>
                                  <p className="text-sm text-gray-600 mt-1">{sub.title}</p>
                                  <p className="text-xs text-gray-400 mt-1">
                                    Nộp lúc: {format(new Date(sub.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                  </p>
                                  {sub.fileUrl && (
                                    <a
                                      href={sub.fileUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-sm text-blue-600 hover:underline mt-1 inline-block"
                                    >
                                      Xem file bài nộp
                                    </a>
                                  )}
                                  {sub.feedback && (
                                    <div className="mt-3 rounded-lg bg-amber-50 border border-amber-200 p-3">
                                      <p className="text-xs font-medium text-amber-700 flex items-center gap-1">
                                        <MessageSquare className="h-3 w-3" /> Phản hồi:
                                      </p>
                                      <p className="text-sm text-amber-800 mt-1">{sub.feedback}</p>
                                    </div>
                                  )}
                                </div>
                                <span className={clsx(
                                  "rounded-full px-2.5 py-0.5 text-xs font-medium",
                                  sub.status === "Completed" ? "bg-green-100 text-green-700" :
                                  sub.status === "NeedsRevision" ? "bg-amber-100 text-amber-700" :
                                  "bg-blue-100 text-blue-700"
                                )}>
                                  {sub.status === "Completed" ? "Hoàn thành" :
                                   sub.status === "NeedsRevision" ? "Cần chỉnh sửa" : "Chờ duyệt"}
                                </span>
                              </div>

                              {sub.status !== "Completed" && (
                                <div className="mt-4 flex justify-end gap-2 border-t border-gray-100 pt-3">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => openFeedbackModal(sub)}
                                  >
                                    <MessageSquare className="h-4 w-4 mr-1" />
                                    Phản hồi
                                  </Button>
                                  <Button
                                    size="sm"
                                    onClick={() => {
                                      setReviewingSubmission(sub);
                                      handleReview("approve");
                                    }}
                                    isLoading={submitting}
                                  >
                                    <ThumbsUp className="h-4 w-4 mr-1" />
                                    Hoàn thành tốt
                                  </Button>
                                </div>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <div className="flex justify-end pt-3">
              <Button variant="outline" onClick={() => { setShowDetailModal(false); setSelectedMilestoneId(null); setSubmissions([]); }}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Feedback Modal */}
      <Modal isOpen={showFeedbackModal} onClose={() => { setShowFeedbackModal(false); setFeedbackText(""); setReviewingSubmission(null); }} title="Phản hồi bài nộp" size="md">
        <div className="space-y-4">
          {reviewingSubmission && (
            <div className="rounded-lg bg-gray-50 p-3 text-sm">
              <p><span className="font-medium">Sinh viên:</span> {reviewingSubmission.studentFullName}</p>
              <p><span className="font-medium">Bài nộp:</span> {reviewingSubmission.title}</p>
            </div>
          )}
          <Textarea
            label="Nội dung phản hồi"
            placeholder="Nhập phản hồi cho sinh viên..."
            value={feedbackText}
            onChange={(e) => setFeedbackText(e.target.value)}
            rows={4}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => { setShowFeedbackModal(false); setFeedbackText(""); setReviewingSubmission(null); }}>
              Hủy
            </Button>
            <Button isLoading={submitting} onClick={() => handleReview("feedback")}>
              <Send className="h-4 w-4 mr-1" />
              Gửi phản hồi
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

export default function ProgressPlansPage() {
  return (
    <Suspense fallback={
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-gray-200 border-t-teal-600" />
      </div>
    }>
      <ProgressPlansContent />
    </Suspense>
  );
}
