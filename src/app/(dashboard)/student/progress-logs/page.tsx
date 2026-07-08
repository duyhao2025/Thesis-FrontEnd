"use client";

import React, { useEffect, useState, useCallback } from "react";
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
import { Plus, ClipboardList, BookOpen, RefreshCw, MessageSquare, ChevronDown, ChevronRight } from "lucide-react";
import clsx from "clsx";

export default function ProgressLogsPage() {
  const [logs, setLogs] = useState<ProgressLogResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [topicId, setTopicId] = useState<string>("");
  const [form, setForm] = useState({
    topicId: "",
    content: "",
    completionPercentage: 0,
  });

  // Auto-detect student's approved topic
  const detectTopicId = useCallback(async () => {
    try {
      const res = await api.get("/topic-registrations/my");
      const registrations = res.data || [];
      // Find approved registration
      const approved = registrations.find(
        (r: { status: string }) => r.status?.toUpperCase() === "APPROVED"
      );
      if (approved) {
        setTopicId(approved.topicId);
        setForm((f) => ({ ...f, topicId: approved.topicId }));
      }
    } catch {
      // silently fail
    }
  }, []);

  const loadLogs = useCallback(
    async (tid: string) => {
      if (!tid) {
        setLogs([]);
        setLoading(false);
        return;
      }
      setLoading(true);
      try {
        const res = await api.get(`/progress-logs/topic/${tid}`);
        setLogs(res.data || []);
      } catch {
        setLogs([]);
      } finally {
        setLoading(false);
      }
    },
    []
  );

  useEffect(() => {
    detectTopicId();
  }, [detectTopicId]);

  useEffect(() => {
    if (topicId) {
      loadLogs(topicId);
    } else {
      setLoading(false);
    }
  }, [topicId, loadLogs]);

  // Auto-refresh when student returns to tab so newly-arrived lecturer
  // feedback (with its notification) becomes visible without manual reload.
  useEffect(() => {
    if (!topicId) return;
    const onFocus = () => loadLogs(topicId);
    window.addEventListener("focus", onFocus);
    document.addEventListener("visibilitychange", onFocus);
    return () => {
      window.removeEventListener("focus", onFocus);
      document.removeEventListener("visibilitychange", onFocus);
    };
  }, [topicId, loadLogs]);

  const handleSubmit = async () => {
    if (!topicId || !form.content) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/progress-logs", {
        topicId,
        content: form.content,
        completionPercentage: form.completionPercentage,
      });
      showToast("success", "Thêm nhật ký thành công!");
      setShowModal(false);
      setForm({ topicId, content: "", completionPercentage: 0 });
      loadLogs(topicId);
    } catch {
      showToast("error", "Thêm nhật ký thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nhật ký tiến độ</h1>
          <p className="text-sm text-gray-500">
            Cập nhật tiến độ làm việc của bạn
          </p>
        </div>
        <div className="flex items-center gap-2">
          {topicId && (
            <Button variant="outline" onClick={() => loadLogs(topicId)}>
              <RefreshCw className="h-4 w-4" />
              Làm mới
            </Button>
          )}
          {topicId && (
            <Button onClick={() => setShowModal(true)}>
              <Plus className="h-4 w-4" />
              Thêm nhật ký
            </Button>
          )}
        </div>
      </div>

      {!topicId ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <BookOpen className="mb-3 h-12 w-12 text-gray-300" />
          <p className="font-medium text-gray-600">
            Bạn chưa có đề tài được duyệt
          </p>
          <p className="mt-1 text-sm text-gray-500">
            Vui lòng đăng ký hoặc đề xuất đề tài trước
          </p>
        </div>
      ) : logs.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <ClipboardList className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có nhật ký nào</p>
          <Button
            className="mt-4"
            size="sm"
            onClick={() => setShowModal(true)}
          >
            Thêm nhật ký đầu tiên
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {logs.map((log) => (
            <ProgressLogCard key={log.id} log={log} />
          ))}
        </div>
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Thêm nhật ký tiến độ"
        size="lg"
      >
        <div className="space-y-4">
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
              onChange={(e) =>
                setForm({
                  ...form,
                  completionPercentage: Number(e.target.value),
                })
              }
              className="w-full accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>0%</span>
              <span>50%</span>
              <span>100%</span>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>
              Hủy
            </Button>
            <Button isLoading={submitting} onClick={handleSubmit}>
              Lưu nhật ký
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

// ============================================================
// ProgressLogCard
// ============================================================
function ProgressLogCard({ log }: { log: ProgressLogResponse }) {
  const [expanded, setExpanded] = useState(true);
  const hasFeedback = !!log.lecturerFeedback;
  const feedbackCount = log.feedbacks?.length ?? 0;

  return (
    <div
      className={clsx(
        "overflow-hidden rounded-lg border bg-white shadow-sm transition",
        hasFeedback ? "border-amber-300" : "border-gray-200"
      )}
    >
      <div className="flex items-start gap-3 p-4">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="mt-0.5 rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-700"
          title={expanded ? "Thu gọn" : "Mở rộng"}
        >
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </button>

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
              Tiến độ {log.completionPercentage}%
            </span>
            {feedbackCount > 0 && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                <MessageSquare className="h-3 w-3" />
                {feedbackCount} phản hồi
              </span>
            )}
          </div>
          <p className="whitespace-pre-wrap text-sm text-gray-800">{log.content}</p>
        </div>
      </div>

      {expanded && feedbackCount > 0 && (
        <div className="space-y-2 border-t border-amber-200 bg-amber-50/60 p-4">
          <div className="flex items-center gap-2 mb-1">
            <MessageSquare className="h-4 w-4 text-amber-700" />
            <p className="text-xs font-bold uppercase tracking-wide text-amber-800">
              Phản hồi từ giảng viên
            </p>
          </div>

          <div className="space-y-2">
            {log.feedbacks!.map((fb, idx) => (
              <div
                key={fb.id}
                className={clsx(
                  "rounded-lg border bg-white p-3 shadow-sm",
                  idx === log.feedbacks!.length - 1
                    ? "border-amber-300"
                    : "border-gray-200 opacity-90"
                )}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <p className="text-sm font-semibold text-gray-900">
                    {fb.lecturerFullName || "Giảng viên"}
                  </p>
                  <p className="text-xs text-gray-500">
                    {format(new Date(fb.createdAt), "dd/MM/yyyy HH:mm", { locale: vi })}
                  </p>
                </div>
                <p className="whitespace-pre-wrap text-sm text-gray-800">{fb.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}