"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { TopicResponse, ProgressPlanResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, Calendar, CheckCircle2 } from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import clsx from "clsx";

export default function ProgressPlansPage() {
  const [plans, setPlans] = useState<ProgressPlanResponse[]>([]);
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<ProgressPlanResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

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
      api.get("/topics"),
    ]).then(([planRes, topicRes]) => {
      setPlans(planRes.data || []);
      setTopics(topicRes.data || []);
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
        const done = r.milestones.filter((m) => m.isCompleted).length;
        return <span className="text-sm text-gray-600">{done}/{r.milestones.length}</span>;
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

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết kế hoạch" size="lg">
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
            <div className="space-y-3">
              {selectedPlan.milestones.map((ms, idx) => (
                <div
                  key={ms.id}
                  className={clsx(
                    "flex items-center gap-3 rounded-lg border p-3",
                    ms.isCompleted ? "border-green-200 bg-green-50" : "border-gray-200"
                  )}
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
                    <span className="rounded bg-blue-100 px-2 py-0.5 text-xs text-blue-700">Bắt buộc</span>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
