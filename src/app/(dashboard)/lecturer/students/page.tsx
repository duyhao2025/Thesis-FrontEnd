"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { StudentGroupResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { GraduationCap, MessageSquare } from "lucide-react";

export default function LecturerStudentsPage() {
  const [groups, setGroups] = useState<StudentGroupResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedGroup, setSelectedGroup] = useState<StudentGroupResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [feedback, setFeedback] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    api.get("/topics")
      .then((res) => setGroups(res.data || []))
      .catch(() => showToast("error", "Không thể tải danh sách sinh viên"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openGroup = (group: StudentGroupResponse) => {
    setSelectedGroup(group);
    setFeedback("");
    setShowDetailModal(true);
  };

  const sendFeedback = async () => {
    if (!feedback.trim()) {
      showToast("error", "Vui lòng nhập phản hồi");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/progress-logs", { content: feedback });
      showToast("success", "Phản hồi đã được gửi!");
      setShowDetailModal(false);
    } catch {
      showToast("error", "Gửi phản hồi thất bại.");
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
          {row.members?.map((m) => (
            <p key={m.id} className="text-sm">{m.name}</p>
          ))}
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
      className: "w-20",
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
        <p className="text-sm text-gray-500">Xem nhật ký và báo cáo của sinh viên</p>
      </div>

      {groups.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <GraduationCap className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có nhóm sinh viên nào</p>
        </div>
      ) : (
        <DataTable columns={columns} data={groups as unknown as StudentGroupResponse[]} loading={loading} rowKey="id" />
      )}

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết nhóm sinh viên" size="lg">
        {selectedGroup && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <h3 className="font-semibold text-gray-900">{selectedGroup.topicTitle || "Chưa có đề tài"}</h3>
              <div className="mt-3 space-y-2">
                {selectedGroup.members?.map((m) => (
                  <div key={m.id} className="flex items-center gap-3">
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-xs font-bold text-blue-700">
                      {m.name?.charAt(0) || "?"}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{m.name}</p>
                      <p className="text-xs text-gray-500">{m.email}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">
                <MessageSquare className="mr-1 inline h-4 w-4" />
                Gửi phản hồi
              </label>
              <Textarea
                value={feedback}
                onChange={(e) => setFeedback(e.target.value)}
                placeholder="Nhập phản hồi cho nhóm sinh viên..."
                rows={4}
              />
            </div>

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
              <Button isLoading={submitting} onClick={sendFeedback}>
                Gửi phản hồi
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
