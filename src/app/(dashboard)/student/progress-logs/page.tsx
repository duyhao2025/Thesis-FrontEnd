"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import { ProgressLogResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, ClipboardList } from "lucide-react";
import clsx from "clsx";

export default function ProgressLogsPage() {
  const [logs, setLogs] = useState<ProgressLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    topicId: "",
    content: "",
    completionPercentage: 0,
  });

  const loadLogs = () => {
    api.get("/progress-logs/topic/00000000-0000-0000-0000-000000000000")
      .then((res) => setLogs(res.data || []))
      .catch(() => setLogs([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadLogs(); }, []);

  const handleSubmit = async () => {
    if (!form.topicId || !form.content) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/progress-logs", form);
      showToast("success", "Thêm nhật ký thành công!");
      setShowModal(false);
      setForm({ topicId: "", content: "", completionPercentage: 0 });
      loadLogs();
    } catch {
      showToast("error", "Thêm nhật ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "submittedAt",
      header: "Ngày",
      render: (row: ProgressLogResponse) =>
        format(new Date(row.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi }),
    },
    {
      key: "content",
      header: "Nội dung",
      render: (row: ProgressLogResponse) => (
        <p className="line-clamp-2 max-w-md text-sm">{row.content}</p>
      ),
    },
    {
      key: "completionPercentage",
      header: "Tiến độ",
      render: (row: ProgressLogResponse) => (
        <div className="flex items-center gap-2">
          <div className="h-2 w-24 rounded-full bg-gray-200">
            <div
              className={clsx(
                "h-2 rounded-full transition-all",
                row.completionPercentage >= 75 ? "bg-green-500" :
                row.completionPercentage >= 50 ? "bg-blue-500" :
                row.completionPercentage >= 25 ? "bg-amber-500" : "bg-red-500"
              )}
              style={{ width: `${row.completionPercentage}%` }}
            />
          </div>
          <span className="text-xs font-medium">{row.completionPercentage}%</span>
        </div>
      ),
    },
    {
      key: "lecturerFeedback",
      header: "Phản hồi GV",
      render: (row: ProgressLogResponse) => (
        <span className={clsx(
          "text-xs",
          row.lecturerFeedback ? "text-green-600" : "text-gray-400"
        )}>
          {row.lecturerFeedback || "Chưa có phản hồi"}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nhật ký tiến độ</h1>
          <p className="text-sm text-gray-500">Cập nhật tiến độ làm việc của bạn</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Thêm nhật ký
        </Button>
      </div>

      {logs.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <ClipboardList className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có nhật ký nào</p>
          <Button className="mt-4" size="sm" onClick={() => setShowModal(true)}>Thêm nhật ký đầu tiên</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={logs} loading={loading} rowKey="id" />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Thêm nhật ký tiến độ" size="lg">
        <div className="space-y-4">
          <Input
            label="Topic ID"
            value={form.topicId}
            onChange={(e) => setForm({ ...form, topicId: e.target.value })}
            placeholder="Nhập ID đề tài của bạn"
          />
          <Textarea
            label="Nội dung công việc đã làm"
            value={form.content}
            onChange={(e) => setForm({ ...form, content: e.target.value })}
            placeholder="Mô tả chi tiết công việc đã hoàn thành..."
            rows={4}
          />
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Tiến độ hoàn thành: {form.completionPercentage}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={form.completionPercentage}
              onChange={(e) => setForm({ ...form, completionPercentage: Number(e.target.value) })}
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>Lưu nhật ký</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
