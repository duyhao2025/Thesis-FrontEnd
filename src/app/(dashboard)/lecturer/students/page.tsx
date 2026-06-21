"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { StudentGroupResponse, ProgressLogResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { GraduationCap, MessageSquare } from "lucide-react";

export default function LecturerStudentsPage() {
  const [groups, setGroups] = useState<StudentGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroupResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [feedbackLogs, setFeedbackLogs] = useState<ProgressLogResponse[]>([]);
  const [logsLoading, setLogsLoading] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
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
    setFeedback("");
    setShowDetailModal(true);

    if (group.topicId) {
      setLogsLoading(true);
      try {
        const res = await api.get(`/progress-logs/topic/${group.topicId}`);
        setFeedbackLogs(res.data || []);
      } catch {
        setFeedbackLogs([]);
      } finally {
        setLogsLoading(false);
      }
    } else {
      setFeedbackLogs([]);
    }
  };

  const sendFeedback = async () => {
    if (!feedback.trim()) {
      showToast("error", "Vui lòng nhập phản hồi");
      return;
    }
    if (feedbackLogs.length === 0) {
      showToast("error", "Chưa có nhật ký để phản hồi");
      return;
    }
    setSubmitting(true);
    try {
      const firstLog = feedbackLogs[0];
      await api.post(`/progress-logs/${firstLog.id}/feedbacks`, {
        Comment: feedback,
      });
      showToast("success", "Phản hồi đã được gửi!");
      setShowDetailModal(false);
      setFeedback("");
      if (selectedGroup?.topicId) {
        const res = await api.get(`/progress-logs/topic/${selectedGroup.topicId}`);
        setFeedbackLogs(res.data || []);
      }
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string } }; message?: string };
      const detail = axiosErr?.response?.data?.message || axiosErr?.message || "Lỗi không xác định";
      console.error("sendFeedback error:", axiosErr?.response?.data || err);
      showToast("error", `Gửi phản hồi thất bại: ${detail}`);
    } finally {
      setSubmitting(false);
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
        <DataTable
          columns={columns}
          data={groups as unknown as StudentGroupResponse[]}
          loading={loading}
          rowKey="id"
        />
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
              <div className="mb-2 flex items-center gap-2">
                <MessageSquare className="h-4 w-4 text-gray-500" />
                <span className="text-sm font-medium text-gray-700">
                  Nhật ký tiến độ ({feedbackLogs.length})
                </span>
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
                <div className="max-h-48 space-y-2 overflow-y-auto rounded-lg border border-gray-200 p-3">
                  {feedbackLogs.map((log) => (
                    <div key={log.id} className="rounded-lg bg-gray-50 p-3">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm text-gray-800">{log.content}</p>
                        <span className="shrink-0 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                          {log.completionPercentage}%
                        </span>
                      </div>
                      {log.lecturerFeedback && (
                        <p className="mt-1.5 text-xs text-green-600">
                          ✓ {log.lecturerFeedback}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {feedbackLogs.length > 0 && (
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  <MessageSquare className="mr-1 inline h-4 w-4" />
                  Gửi phản hồi
                </label>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Nhập phản hồi cho nhóm sinh viên..."
                  rows={3}
                  className="w-full resize-none rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
                />
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>
                Đóng
              </Button>
              {feedbackLogs.length > 0 && (
                <Button isLoading={submitting} onClick={sendFeedback}>
                  <MessageSquare className="h-4 w-4" />
                  Gửi phản hồi
                </Button>
              )}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
