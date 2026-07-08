"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { StudentGroupResponse, ProgressLogResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { GraduationCap, MessageSquare, X, Send } from "lucide-react";
import FileActionButton from "@/components/ui/FileActionButton";
import FileIcon from "@/components/ui/FileIcon";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import clsx from "clsx";

interface GroupSubmissionResponse {
  id: string;
  milestoneId: string;
  milestoneTitle: string;
  studentFullName?: string;
  title: string;
  fileUrl: string;
  feedback: string | null;
  submittedAt: string;
  status: string;
}

export default function LecturerStudentsPage() {
  const [groups, setGroups] = useState<StudentGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroupResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [feedbackLogs, setFeedbackLogs] = useState<ProgressLogResponse[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [submissions, setSubmissions] = useState<GroupSubmissionResponse[]>([]);
  const [submissionsLoading, setSubmissionsLoading] = useState(false);

  // Inline feedback editor: which log is currently being replied to
  const [activeLogId, setActiveLogId] = useState<string | null>(null);
  const [activeFeedback, setActiveFeedback] = useState("");
  const [submittingFeedback, setSubmittingFeedback] = useState(false);

  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.get("/lecturer/groups")
      .then((res) => setGroups(Array.isArray(res.data) ? res.data : []))
      .catch(() => showToast("error", "Không thể tải danh sách sinh viên"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openGroup = async (group: StudentGroupResponse) => {
    setSelectedGroup(group);
    setShowDetailModal(true);
    setActiveLogId(null);
    setActiveFeedback("");

    if (group.topicId) {
      // Load progress logs (now contains lecturerFeedback details)
      setLogsLoading(true);
      api.get(`/progress-logs/topic/${group.topicId}`)
        .then((res) => setFeedbackLogs(res.data || []))
        .catch(() => setFeedbackLogs([]))
        .finally(() => setLogsLoading(false));

      // Load nhiệm vụ submissions for this topic
      setSubmissionsLoading(true);
      api.get(`/milestone-submissions/topic/${group.topicId}`)
        .then((res) => setSubmissions(res.data || []))
        .catch(() => setSubmissions([]))
        .finally(() => setSubmissionsLoading(false));
    } else {
      setFeedbackLogs([]);
      setSubmissions([]);
    }
  };

  const reloadLogs = async () => {
    if (!selectedGroup?.topicId) return;
    setLogsLoading(true);
    try {
      const res = await api.get(`/progress-logs/topic/${selectedGroup.topicId}`);
      setFeedbackLogs(res.data || []);
    } catch {
      setFeedbackLogs([]);
    } finally {
      setLogsLoading(false);
    }
  };

  const submitFeedback = async (log: ProgressLogResponse) => {
    if (!activeFeedback.trim()) {
      showToast("error", "Vui lòng nhập phản hồi");
      return;
    }
    setSubmittingFeedback(true);
    try {
      await api.post(`/progress-logs/${log.id}/feedbacks`, {
        comment: activeFeedback.trim(),
        status: "Reviewed",
      });
      showToast("success", "Đã gửi phản hồi cho nhật ký!");
      setActiveLogId(null);
      setActiveFeedback("");
      await reloadLogs();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gửi phản hồi thất bại.";
      showToast("error", message);
    } finally {
      setSubmittingFeedback(false);
    }
  };

  const columns = [
    {
      key: "groupName",
      header: "Nhóm sinh viên",
      render: (row: StudentGroupResponse) => (
        <div>
          <p className="font-medium text-gray-900">{row.groupName || "Nhóm không tên"}</p>
          <p className="mt-0.5 text-xs text-gray-500">
            {row.members?.length || 0} thành viên
          </p>
        </div>
      ),
    },
    {
      key: "members",
      header: "Thành viên",
      render: (row: StudentGroupResponse) => (
        <div className="space-y-0.5">
          {row.members?.slice(0, 3).map((m) => (
            <p key={m.id} className="text-sm">{m.name}</p>
          ))}
          {(row.members?.length || 0) > 3 && (
            <p className="text-xs text-gray-400">+{row.members!.length - 3} người</p>
          )}
        </div>
      ),
    },
    {
      key: "topic",
      header: "Đề tài",
      render: (row: StudentGroupResponse) => (
        <span className="text-sm">{row.topicTitle || "—"}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (row: StudentGroupResponse) => (
        <Button size="sm" variant="outline" onClick={() => openGroup(row)}>
          Chi tiết
        </Button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Sinh viên đang hướng dẫn</h1>
        <p className="text-sm text-gray-500">Xem tiến độ và gửi phản hồi cho sinh viên</p>
      </div>

      {groups.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <GraduationCap className="mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-500">Chưa có nhóm sinh viên nào</p>
          <p className="mt-1 text-sm text-gray-400">
            Sinh viên đăng ký đề tài của bạn sẽ hiển thị tại đây
          </p>
        </div>
      ) : (
        <div className="rounded-lg border border-gray-200 bg-white">
          <table className="w-full">
            <thead className="bg-gray-50 text-left text-xs font-medium uppercase text-gray-500">
              <tr>
                {columns.map((c) => (
                  <th key={c.key} className="px-4 py-3">{c.header}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 text-sm text-gray-700">
              {groups.map((g) => (
                <tr key={g.id} className="hover:bg-gray-50">
                  {columns.map((c) => (
                    <td key={c.key} className="px-4 py-3 align-top">
                      {c.render(g)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal
        isOpen={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        title="Chi tiết nhóm sinh viên"
        size="xl"
      >
        {selectedGroup && (
          <div className="space-y-5">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="mb-3 font-semibold text-gray-900">
                {selectedGroup.topicTitle || "Chưa có đề tài"}
              </h3>
              <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                {selectedGroup.members?.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center gap-3 rounded-lg border border-white bg-white p-2"
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {m.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <div className="mb-3 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 text-amber-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Bài nộp Nhiệm vụ ({submissions.length})
                </span>
              </div>
              {submissionsLoading ? (
                <div className="flex items-center justify-center py-6">
                  <div className="h-5 w-5 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : submissions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                  Chưa có bài nộp nào
                </p>
              ) : (
                <div className="space-y-2">
                  {submissions.map((sub) => (
                    <div key={sub.id} className="flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <FileIcon url={sub.fileUrl} size="md" showLabel />
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900">{sub.title}</p>
                          <p className="truncate text-xs text-gray-500">
                            {sub.milestoneTitle && `${sub.milestoneTitle} · `}
                            {new Date(sub.submittedAt).toLocaleDateString("vi-VN")}
                          </p>
                        </div>
                      </div>
                      <FileActionButton url={sub.fileUrl} title={sub.title} />
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <span className="flex items-center gap-2 text-sm font-medium text-gray-700">
                  <MessageSquare className="h-4 w-4 text-gray-500" />
                  Nhật ký tiến độ ({feedbackLogs.length})
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={reloadLogs}
                  isLoading={logsLoading}
                >
                  Làm mới
                </Button>
              </div>

              {logsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
                </div>
              ) : feedbackLogs.length === 0 ? (
                <p className="rounded-lg border border-dashed border-gray-300 py-6 text-center text-sm text-gray-400">
                  Chưa có nhật ký tiến độ
                </p>
              ) : (
                <div className="max-h-[28rem] space-y-3 overflow-y-auto pr-1">
                  {feedbackLogs.map((log) => {
                    const isActive = activeLogId === log.id;
                    const hasFeedback = !!log.lecturerFeedback;
                    return (
                      <div
                        key={log.id}
                        className={clsx(
                          "rounded-lg border bg-white p-3 transition",
                          hasFeedback ? "border-amber-300" : "border-gray-200"
                        )}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <p className="text-xs text-gray-500">
                                {format(new Date(log.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                              </p>
                              <span
                                className={clsx(
                                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                                  log.completionPercentage >= 75
                                    ? "bg-green-100 text-green-700"
                                    : log.completionPercentage >= 50
                                    ? "bg-blue-100 text-blue-700"
                                    : log.completionPercentage >= 25
                                    ? "bg-amber-100 text-amber-700"
                                    : "bg-red-100 text-red-700"
                                )}
                              >
                                {log.completionPercentage}%
                              </span>
                              {hasFeedback && (
                                <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                                  <MessageSquare className="h-3 w-3" />
                                  Đã phản hồi
                                </span>
                              )}
                            </div>
                            <p className="text-sm text-gray-800 whitespace-pre-wrap">{log.content}</p>

                            {log.feedbacks && log.feedbacks.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {log.feedbacks.map((fb) => (
                                  <div key={fb.id} className="rounded-md bg-amber-50 border border-amber-200 p-2">
                                    <p className="text-xs font-semibold text-amber-800">
                                      {fb.lecturerFullName || "Giảng viên"} · {format(new Date(fb.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                                    </p>
                                    <p className="text-sm text-amber-900 whitespace-pre-wrap">{fb.comment}</p>
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                          <button
                            onClick={() => {
                              setActiveLogId(isActive ? null : log.id);
                              setActiveFeedback("");
                            }}
                            className={clsx(
                              "inline-flex items-center gap-1 rounded-md border px-2 py-1 text-xs font-medium transition",
                              isActive
                                ? "border-blue-300 bg-blue-50 text-blue-700"
                                : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
                            )}
                          >
                            {isActive ? <X className="h-3 w-3" /> : <Send className="h-3 w-3" />}
                            {isActive ? "Đóng" : hasFeedback ? "Phản hồi tiếp" : "Phản hồi"}
                          </button>
                        </div>

                        {isActive && (
                          <div className="mt-3 space-y-2 rounded-md bg-gray-50 p-3">
                            <textarea
                              value={activeFeedback}
                              onChange={(e) => setActiveFeedback(e.target.value)}
                              placeholder="Nhập phản hồi cho nhật ký tiến độ..."
                              rows={3}
                              className="w-full resize-none rounded-md border border-gray-300 px-2 py-1.5 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                            />
                            <div className="flex justify-end gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => { setActiveLogId(null); setActiveFeedback(""); }}
                              >
                                Hủy
                              </Button>
                              <Button
                                size="sm"
                                isLoading={submittingFeedback}
                                onClick={() => submitFeedback(log)}
                              >
                                <Send className="h-3 w-3" />
                                Gửi phản hồi
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-1">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}