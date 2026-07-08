"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import {
  BookOpen,
  User,
  FolderKanban,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  Eye,
  Award,
  GraduationCap,
  MessageSquare,
  ListChecks,
} from "lucide-react";
import clsx from "clsx";
import {
  StudentFinalResultResponse,
  StudentEvaluationResultResponse,
} from "@/types/gradeManagement";

export default function MyTopicPage() {
  const [data, setData] = useState<{
    topic: {
      id: string;
      title: string;
      description: string;
      objective: string;
      scope: string;
      status: string;
      lecturerName: string;
      supervisingLecturerName?: string;
      topicCategoryName: string;
      createdAt: string;
    } | null;
    progressPlan: {
      id: string;
      startDate: string;
      endDate: string;
      status: string;
      milestones: {
        id: string;
        title: string;
        deadline: string;
        requiredSubmission: boolean;
        isCompleted: boolean;
      }[];
    } | null;
    registrationStatus: string;
    submissions: {
      milestoneId: string;
      submissionId?: string;
      submissionTitle?: string;
      submittedAt?: string;
      status?: string;
      feedback?: string;
      canResubmit: boolean;
    }[];
  } | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();
  const router = useRouter();

  // Phase 5: state cho phần hiển thị điểm
  const [finalResults, setFinalResults] = useState<StudentFinalResultResponse[]>([]);
  const [evaluationResults, setEvaluationResults] = useState<StudentEvaluationResultResponse[]>([]);
  const [gradeLoading, setGradeLoading] = useState(true);

  useEffect(() => {
    const fetchMyTopic = async () => {
      try {
        // 1. Lấy tất cả registration của sinh viên (cá nhân + nhóm)
        const regRes = await api.get("/topic-registrations/my");
        const registrations = regRes.data || [];

        // Tìm registration đầu tiên có trạng thái APPROVED hoặc PENDING
        const approved = registrations.find(
          (r: { status: string }) => r.status === "APPROVED"
        );
        const pending = registrations.find(
          (r: { status: string }) => r.status === "PENDING"
        );
        const target = approved || pending;

        if (!target) {
          setData({ topic: null, progressPlan: null, registrationStatus: "Chưa có đề tài", submissions: [] });
          setLoading(false);
          setGradeLoading(false);
          return;
        }

        // 2. Lấy chi tiết đề tài
        const topicRes = await api.get(`/topics/${target.topicId}`);

        // 3. Lấy kế hoạch tiến độ
        let progressPlan = null;
        try {
          const planRes = await api.get(`/progress-plans/topic/${target.topicId}`);
          progressPlan = planRes.data;
        } catch {
          // Không có kế hoạch tiến độ
        }

        // 4. Lấy thông tin bài nộp của sinh viên
        let submissions: {
          milestoneId: string;
          submissionId?: string;
          submissionTitle?: string;
          submittedAt?: string;
          status?: string;
          feedback?: string;
          canResubmit: boolean;
        }[] = [];
        try {
          const subRes = await api.get("/milestone-submissions/my");
          submissions = (subRes.data || []).map((s: {
            milestoneId: string;
            id?: string;
            submissionTitle?: string;
            submittedAt?: string;
            submissionStatus?: string;
            feedback?: string;
            canResubmit?: boolean;
          }) => ({
            milestoneId: s.milestoneId,
            submissionId: s.id,
            submissionTitle: s.submissionTitle,
            submittedAt: s.submittedAt,
            status: s.submissionStatus,
            feedback: s.feedback,
            canResubmit: s.canResubmit || false,
          }));
        } catch {
          // Không có submission
        }

        setData({
          topic: {
            id: topicRes.data.id,
            title: topicRes.data.title,
            description: topicRes.data.description,
            objective: topicRes.data.objective,
            scope: topicRes.data.scope,
            status: topicRes.data.status,
            lecturerName: topicRes.data.supervisingLecturerName || topicRes.data.lecturerName || "",
            supervisingLecturerName: topicRes.data.supervisingLecturerName,
            topicCategoryName: topicRes.data.topicCategoryName,
            createdAt: topicRes.data.createdAt,
          },
          progressPlan: progressPlan
            ? {
                id: progressPlan.id,
                startDate: progressPlan.startDate,
                endDate: progressPlan.endDate,
                status: progressPlan.status,
                milestones: progressPlan.milestones || [],
              }
            : null,
          registrationStatus: target.status === "APPROVED" ? "Đã được duyệt" : "Đang chờ duyệt",
          submissions,
        });

        // 5. Phase 5: Lấy điểm tổng kết & điểm chi tiết từng giảng viên
        try {
          const [finalRes, evalRes] = await Promise.all([
            api.get("/student/final-results/my"),
            api.get("/student/evaluations/my"),
          ]);
          setFinalResults(finalRes.data || []);
          setEvaluationResults(evalRes.data || []);
        } catch (err) {
          // Chưa có điểm hoặc lỗi → không hiển thị
          setFinalResults([]);
          setEvaluationResults([]);
        } finally {
          setGradeLoading(false);
        }
      } catch {
        setData({ topic: null, progressPlan: null, registrationStatus: "Chưa có đề tài", submissions: [] });
        setGradeLoading(false);
      } finally {
        setLoading(false);
      }
    };

    fetchMyTopic();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  if (!data?.topic) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <AlertCircle className="mb-4 h-16 w-16 text-gray-300" />
        <h2 className="text-xl font-semibold text-gray-700">Bạn chưa có đề tài</h2>
        <p className="mt-2 text-sm text-gray-500">
          Vui lòng đăng ký hoặc đề xuất đề tài để bắt đầu.
        </p>
      </div>
    );
  }

  const { topic, progressPlan } = data;
  const completedMilestones = progressPlan?.milestones.filter((m) => m.isCompleted).length || 0;
  const totalMilestones = progressPlan?.milestones.length || 0;
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0;

  // Gom tất cả evaluation từ các assignment
  const allEvaluations = evaluationResults.flatMap((a) => a.evaluations);
  const hasAnyGrade = allEvaluations.length > 0;
  const finalResultRow = finalResults[0];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Đề tài của tôi</h1>
        <p className="text-sm text-gray-500">Thông tin chi tiết đề tài, kế hoạch tiến độ và kết quả bảo vệ</p>
      </div>

      <Card>
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <BookOpen className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-bold text-gray-900">{topic.title}</h2>
                <StatusBadge status={topic.status} />
              </div>
              <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-600">
                <span className="flex items-center gap-1">
                  <User className="h-4 w-4" />
                  GV: {topic.supervisingLecturerName || topic.lecturerName}
                </span>
                <span className="flex items-center gap-1">
                  <FolderKanban className="h-4 w-4" />
                  {topic.topicCategoryName}
                </span>
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {format(new Date(topic.createdAt), "dd/MM/yyyy", { locale: vi })}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-4 space-y-3 border-t border-gray-100 pt-4">
          <div>
            <h3 className="text-sm font-semibold text-gray-700">Mô tả</h3>
            <p className="mt-1 text-sm text-gray-600">{topic.description}</p>
          </div>
          {topic.objective && (
            <div>
              <h3 className="text-sm font-semibold text-gray-700">Mục tiêu</h3>
              <p className="mt-1 text-sm text-gray-600">{topic.objective}</p>
            </div>
          )}
        </div>
      </Card>

      {progressPlan && (
        <Card title="Kế hoạch tiến độ" subtitle={`${completedMilestones}/${totalMilestones} nhiệm vụ hoàn thành`}>
          <div className="mb-4">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-500">Tiến độ tổng thể</span>
              <span className="font-semibold text-blue-600">{progressPercent}%</span>
            </div>
            <div className="h-3 w-full rounded-full bg-gray-200">
              <div
                className="h-3 rounded-full bg-blue-600 transition-all"
                style={{ width: `${progressPercent}%` }}
              />
            </div>
          </div>

          <div className="space-y-3">
            {(progressPlan.milestones || []).map((milestone, idx) => {
              const submission = data?.submissions?.find(s => s.milestoneId === milestone.id);
              const getStatusColor = () => {
                if (milestone.isCompleted) return { border: "border-green-200", bg: "bg-green-50" };
                if (submission?.status?.toUpperCase() === "NEEDSREVISION") return { border: "border-red-200", bg: "bg-red-50" };
                if (new Date(milestone.deadline) < new Date()) return { border: "border-amber-200", bg: "bg-amber-50" };
                return { border: "border-gray-200", bg: "bg-white" };
              };
              const statusColor = getStatusColor();

              return (
                <div key={milestone.id} className={clsx("rounded-lg border p-4", statusColor.border, statusColor.bg)}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className={clsx(
                        "flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold",
                        milestone.isCompleted
                          ? "bg-green-500 text-white"
                          : "bg-gray-200 text-gray-600"
                      )}>
                        {milestone.isCompleted ? <CheckCircle2 className="h-5 w-5" /> : idx + 1}
                      </div>
                      <div>
                        <p className={clsx(
                          "text-sm font-medium",
                          milestone.isCompleted ? "text-green-800" : "text-gray-800"
                        )}>
                          {milestone.title}
                        </p>
                        <p className="mt-0.5 flex items-center gap-2 text-xs text-gray-500">
                          <Clock className="h-3 w-3" />
                          Deadline: {format(new Date(milestone.deadline), "dd/MM/yyyy", { locale: vi })}
                        </p>
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-1">
                      <StatusBadge status={milestone.isCompleted ? "Completed" : "Pending"} />
                      {milestone.requiredSubmission && submission?.submissionId && (
                        <button
                          onClick={() => router.push(`/student/submissions/${submission.submissionId}`)}
                          className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800"
                        >
                          <Eye className="h-3 w-3" />
                          Xem chi tiết
                        </button>
                      )}
                    </div>
                  </div>

                  {submission && (
                    <div className="mt-3 rounded bg-white/50 p-2">
                      <div className="flex items-center justify-between text-xs">
                        <span className="flex items-center gap-1 text-gray-600">
                          <FileText className="h-3 w-3" />
                          {submission.submissionTitle || "Đã nộp"}
                        </span>
                        {submission.status?.toUpperCase() === "NEEDSREVISION" && (
                          <span className="flex items-center gap-1 font-medium text-red-600">
                            <AlertCircle className="h-3 w-3" />
                            Cần sửa
                          </span>
                        )}
                      </div>
                      {submission.feedback && (
                        <p className="mt-1 rounded bg-amber-50 p-1.5 text-xs text-amber-800">
                          <span className="font-medium">GV phản hồi:</span> {submission.feedback}
                        </p>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* ============================================================ */}
      {/* Phase 5: Kết quả bảo vệ                                     */}
      {/* ============================================================ */}
      {gradeLoading ? (
        <Card title="Kết quả bảo vệ">
          <div className="flex items-center justify-center py-8">
            <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-500 border-t-transparent" />
          </div>
        </Card>
      ) : hasAnyGrade ? (
        <DefenseResultCard
          finalResult={finalResultRow}
          evaluationResults={evaluationResults}
        />
      ) : null}
    </div>
  );
}

// ============================================================
// Sub-component: hiển thị kết quả bảo vệ
// ============================================================
function DefenseResultCard({
  finalResult,
  evaluationResults,
}: {
  finalResult?: StudentFinalResultResponse;
  evaluationResults: StudentEvaluationResultResponse[];
}) {
  const allEvaluations = evaluationResults.flatMap((a) => a.evaluations);

  const gradeBadge = (() => {
    if (!finalResult?.grade) return null;
    const colorMap: Record<string, string> = {
      "A+": "bg-emerald-100 text-emerald-800 ring-emerald-200",
      "A": "bg-emerald-100 text-emerald-800 ring-emerald-200",
      "B+": "bg-blue-100 text-blue-800 ring-blue-200",
      "B": "bg-blue-100 text-blue-800 ring-blue-200",
      "C+": "bg-amber-100 text-amber-800 ring-amber-200",
      "C": "bg-amber-100 text-amber-800 ring-amber-200",
      "D+": "bg-orange-100 text-orange-800 ring-orange-200",
      "D": "bg-orange-100 text-orange-800 ring-orange-200",
      "F": "bg-red-100 text-red-800 ring-red-200",
    };
    return (
      <span
        className={clsx(
          "inline-flex items-center gap-1 rounded-full px-3 py-1 text-sm font-bold ring-1",
          colorMap[finalResult.grade] || "bg-gray-100 text-gray-800 ring-gray-200"
        )}
      >
        <Award className="h-4 w-4" />
        {finalResult.grade}
      </span>
    );
  })();

  return (
    <Card
      title="Kết quả bảo vệ"
      subtitle={
        finalResult?.defenseDate
          ? `Ngày bảo vệ: ${format(new Date(finalResult.defenseDate), "dd/MM/yyyy HH:mm", { locale: vi })}`
          : undefined
      }
      action={
        finalResult?.resultStatus ? (
          <StatusBadge status={finalResult.resultStatus} />
        ) : undefined
      }
    >
      {/* Điểm tổng kết */}
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-lg border border-blue-100 bg-blue-50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-blue-700">
            <GraduationCap className="h-4 w-4" />
            Điểm trung bình
          </div>
          <div className="mt-2 text-3xl font-bold text-blue-900">
            {finalResult?.averageScore != null
              ? Number(finalResult.averageScore).toFixed(2)
              : "—"}
            <span className="ml-1 text-base font-medium text-blue-600">/ 10</span>
          </div>
        </div>
        <div className="rounded-lg border border-emerald-100 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-emerald-700">
            <Award className="h-4 w-4" />
            Xếp loại
          </div>
          <div className="mt-2">{gradeBadge || <span className="text-2xl font-bold text-gray-400">—</span>}</div>
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-4">
          <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-gray-700">
            <CheckCircle2 className="h-4 w-4" />
            Trạng thái
          </div>
          <div className="mt-2 text-base font-semibold text-gray-900">
            {finalResult?.isFinalized
              ? "Đã công bố"
              : "Chưa công bố"}
          </div>
        </div>
      </div>

      {/* Bảng điểm chi tiết từng giảng viên */}
      <div className="space-y-4">
        {/* Sinh viên bảo vệ */}
        {finalResult?.students && finalResult.students.length > 0 && (
          <div className="rounded-lg border border-blue-200 bg-blue-50/40 p-4">
            <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
              <User className="h-4 w-4" />
              Sinh viên bảo vệ
            </h4>
            <ul className="mt-3 divide-y divide-blue-100 rounded-lg border border-blue-100 bg-white">
              {finalResult.students.map((s) => (
                <li key={s.studentId} className="flex items-center gap-3 px-4 py-3">
                  <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-blue-100 text-sm font-semibold text-blue-700">
                    {s.fullName?.charAt(0)?.toUpperCase() || "?"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-900">
                      {s.fullName}
                      {s.studentCode && (
                        <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-600">
                          {s.studentCode}
                        </span>
                      )}
                      {s.isLeader && (
                        <span className="ml-2 inline-flex items-center gap-0.5 rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                          Nhóm trưởng
                        </span>
                      )}
                    </p>
                    <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <FolderKanban className="h-3 w-3" />
                        {s.departmentName || "—"}
                      </span>
                      <span className="flex items-center gap-1">
                        <BookOpen className="h-3 w-3" />
                        {s.majorName || "—"}
                      </span>
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-800">
          <ListChecks className="h-4 w-4" />
          Chi tiết điểm từng thành viên hội đồng
        </h4>

        {evaluationResults.map((assignment) => (
          <div
            key={assignment.assignmentId}
            className="rounded-lg border border-gray-200 bg-white"
          >
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-2 text-xs text-gray-600">
              <span className="flex items-center gap-1">
                <User className="h-3 w-3" />
                Hội đồng: <strong>{assignment.councilName || "—"}</strong>
              </span>
              {assignment.defenseDate && (
                <span className="flex items-center gap-1">
                  <Clock className="h-3 w-3" />
                  {format(new Date(assignment.defenseDate), "dd/MM/yyyy HH:mm", { locale: vi })}
                </span>
              )}
            </div>

            <div className="divide-y divide-gray-100">
              {assignment.evaluations.map((ev, idx) => (
                <div key={idx} className="px-4 py-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full bg-indigo-100 text-sm font-semibold text-indigo-700">
                        {ev.lecturerName?.charAt(0)?.toUpperCase() || "?"}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-gray-900">
                          {ev.lecturerName || "Giảng viên"}
                          {ev.lecturerCode && (
                            <span className="ml-2 rounded bg-gray-100 px-1.5 py-0.5 text-xs font-mono text-gray-600">
                              {ev.lecturerCode}
                            </span>
                          )}
                          {ev.lecturerName?.toLowerCase().includes("giảng viên 1") && (
                            <span className="ml-2 text-xs italic text-gray-400">
                              (seed placeholder)
                            </span>
                          )}
                        </p>
                        <p className="mt-0.5 flex flex-wrap items-center gap-x-3 gap-y-0.5 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <FolderKanban className="h-3 w-3" />
                            {ev.departmentName || "—"}
                          </span>
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {ev.majorName || "—"}
                          </span>
                          <span>
                            Điểm tổng:{" "}
                            <span className="font-bold text-gray-900">
                              {Number(ev.totalScore).toFixed(2)}
                            </span>{" "}
                            / 10
                          </span>
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-700">
                        {Number(ev.totalScore).toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500">/ 10</div>
                    </div>
                  </div>

                  {/* Bảng tiêu chí */}
                  {ev.scores && ev.scores.length > 0 && (
                    <div className="mt-3 overflow-hidden rounded-lg border border-gray-200">
                      <table className="w-full text-sm">
                        <thead className="bg-gray-50 text-xs uppercase text-gray-600">
                          <tr>
                            <th className="px-3 py-2 text-left">Tiêu chí</th>
                            <th className="px-3 py-2 text-center">Trọng số</th>
                            <th className="px-3 py-2 text-center">Điểm tối đa</th>
                            <th className="px-3 py-2 text-center">Điểm chấm</th>
                            <th className="px-3 py-2 text-left">Nhận xét</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                          {ev.scores.map((s, sIdx) => (
                            <tr key={sIdx} className="hover:bg-gray-50">
                              <td className="px-3 py-2 text-gray-800">{s.criteriaName}</td>
                              <td className="px-3 py-2 text-center text-gray-600">
                                {Math.round(Number(s.weight) * 100)}%
                              </td>
                              <td className="px-3 py-2 text-center text-gray-600">
                                {Number(s.maxScore).toFixed(1)}
                              </td>
                              <td className="px-3 py-2 text-center">
                                <span className="font-semibold text-blue-700">
                                  {Number(s.score).toFixed(2)}
                                </span>
                              </td>
                              <td className="px-3 py-2 text-xs text-gray-600">
                                {s.comment || <span className="italic text-gray-400">—</span>}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}

                  {/* Nhận xét tổng */}
                  {ev.comment && (
                    <div className="mt-3 rounded-lg bg-amber-50 p-3 text-sm">
                      <div className="flex items-start gap-2">
                        <MessageSquare className="mt-0.5 h-4 w-4 flex-shrink-0 text-amber-700" />
                        <div>
                          <p className="text-xs font-semibold uppercase tracking-wide text-amber-700">
                            Nhận xét tổng
                          </p>
                          <p className="mt-1 whitespace-pre-line text-sm text-amber-900">
                            {ev.comment}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}