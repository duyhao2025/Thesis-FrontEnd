"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import StatusBadge from "@/components/ui/StatusBadge";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { BookOpen, User, FolderKanban, CheckCircle2, Clock, AlertCircle, FileText, Eye } from "lucide-react";
import clsx from "clsx";

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
      } catch {
        setData({ topic: null, progressPlan: null, registrationStatus: "Chưa có đề tài", submissions: [] });
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Đề tài của tôi</h1>
        <p className="text-sm text-gray-500">Thông tin chi tiết đề tài và kế hoạch tiến độ</p>
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
        <Card title="Kế hoạch tiến độ" subtitle={`${completedMilestones}/${totalMilestones} milestone hoàn thành`}>
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
    </div>
  );
}
