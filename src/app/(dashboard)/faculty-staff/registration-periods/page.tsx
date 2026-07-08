"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { RegistrationPeriodResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";

interface SemesterOption {
  code: string;
  label: string;
  term: number;
}

const SEMESTER_OPTIONS: SemesterOption[] = [
  { code: "1A", label: "Học kỳ 1A (HK1 chính)", term: 1 },
  { code: "1B", label: "Học kỳ 1B (HK1 hè)", term: 1 },
  { code: "2A", label: "Học kỳ 2A (HK2 chính)", term: 2 },
  { code: "2B", label: "Học kỳ 2B (HK2 hè)", term: 2 },
  { code: "3", label: "Học kỳ 3 (HK hè)", term: 3 },
];

const termLabel = (term: number): string => {
  if (term === 1) return "HK1";
  if (term === 2) return "HK2";
  if (term === 3) return "HK3";
  return `HK${term}`;
};

export default function RegistrationPeriodsPage() {
  const [periods, setPeriods] = useState<RegistrationPeriodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RegistrationPeriodResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    semesterCode: "",
    name: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
    minGPA: 0,
    maxStudentsPerTopic: 3,
    maxTopicPerLecturer: 5,
    maxStudentPerGroup: 3,
  });

  const load = () => {
    setLoading(true);
    api.get("/registration-periods")
      .then((res) => setPeriods(res.data || []))
      .catch(() => showToast("error", "Không thể tải danh sách đợt đăng ký"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      semesterCode: "1A",
      name: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
      minGPA: 0,
      maxStudentsPerTopic: 3,
      maxTopicPerLecturer: 5,
      maxStudentPerGroup: 3,
    });
    setShowModal(true);
  };

  const openEdit = (period: RegistrationPeriodResponse) => {
    setEditing(period);
    const matchedCode =
      SEMESTER_OPTIONS.find(
        (s) =>
          s.term === (period as unknown as { term?: number }).term &&
          period.name.toUpperCase().includes(s.code)
      )?.code || SEMESTER_OPTIONS.find((s) => s.term === (period as unknown as { term?: number }).term)?.code || "";

    setForm({
      semesterCode: matchedCode,
      name: period.name,
      startDate: period.startDate.split("T")[0],
      endDate: period.endDate.split("T")[0],
      status: period.status,
      minGPA: period.minGPA ?? 0,
      maxStudentsPerTopic: 3,
      maxTopicPerLecturer: 5,
      maxStudentPerGroup: 3,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (new Date(form.startDate) >= new Date(form.endDate)) {
      showToast("error", "Ngày bắt đầu phải trước ngày kết thúc");
      return;
    }
    const semester = SEMESTER_OPTIONS.find((s) => s.code === form.semesterCode);
    if (!semester) {
      showToast("error", "Vui lòng chọn học kỳ");
      return;
    }

    setSubmitting(true);
    try {
      const payload = {
        term: semester.term,
        name: form.name.trim(),
        startDate: form.startDate,
        endDate: form.endDate,
        status: form.status,
        minGPA: form.minGPA,
      };
      if (editing) {
        await api.put(`/registration-periods/${editing.id}`, payload);
        showToast("success", "Cập nhật thành công!");
      } else {
        await api.post("/registration-periods", payload);
        showToast("success", "Tạo đợt thành công!");
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const axiosErr = err as { response?: { data?: { message?: string }; status?: number } };
      const message = axiosErr?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa đợt đăng ký này?")) return;
    try {
      await api.delete(`/registration-periods/${id}`);
      showToast("success", "Xóa thành công!");
      load();
    } catch {
      showToast("error", "Xóa thất bại.");
    }
  };

  const handleToggleStatus = async (id: string, currentStatus: string) => {
    const period = periods.find((p) => p.id === id);
    if (!period) return;

    if (currentStatus === "OPEN") {
      try {
        await api.post(`/registration-periods/${id}/close`);
        showToast("success", "Đã đóng đợt đăng ký!");
        load();
      } catch (err: unknown) {
        const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Đóng đợt thất bại.";
        showToast("error", message);
      }
      return;
    }

    const semester = SEMESTER_OPTIONS.find((s) =>
      period.name.toUpperCase().includes(s.code)
    ) || SEMESTER_OPTIONS.find((s) => s.term === (period as unknown as { term?: number }).term);
    const newStatus = "OPEN";
    try {
      await api.put(`/registration-periods/${id}`, {
        term: semester?.term ?? (period as unknown as { term?: number }).term ?? 1,
        name: period.name,
        startDate: period.startDate.split("T")[0],
        endDate: period.endDate.split("T")[0],
        status: newStatus,
        minGPA: period.minGPA,
      });
      showToast("success", "Đợt đăng ký đã mở!");
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Mở đợt thất bại.";
      showToast("error", message);
    }
  };

  const columns = [
    { key: "name", header: "Tên đợt", render: (r: RegistrationPeriodResponse) => <span className="font-medium">{r.name}</span> },
    {
      key: "term",
      header: "Học kỳ",
      render: (r: RegistrationPeriodResponse) => {
        const matched = SEMESTER_OPTIONS.find((s) => r.name.toUpperCase().includes(s.code));
        const term = (r as unknown as { term?: number }).term;
        return (
          <span className="rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
            {matched ? matched.label : term ? termLabel(term) : "—"}
          </span>
        );
      },
    },
    {
      key: "startDate",
      header: "Bắt đầu",
      render: (r: RegistrationPeriodResponse) => new Date(r.startDate).toLocaleDateString("vi-VN"),
    },
    {
      key: "endDate",
      header: "Kết thúc",
      render: (r: RegistrationPeriodResponse) => new Date(r.endDate).toLocaleDateString("vi-VN"),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r: RegistrationPeriodResponse) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      render: (r: RegistrationPeriodResponse) => (
        <div className="flex items-center gap-1">
          <button
            onClick={() => handleToggleStatus(r.id, r.status)}
            className={`rounded p-1.5 text-xs font-medium ${
              r.status === "OPEN"
                ? "text-red-600 hover:bg-red-50"
                : "text-green-600 hover:bg-green-50"
            }`}
          >
            {r.status === "OPEN" ? "Đóng" : "Mở"}
          </button>
          <button onClick={() => openEdit(r)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(r.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đợt đăng ký</h1>
          <p className="text-sm text-gray-500">
            Quản lý các đợt đăng ký đề tài. Học kỳ được cố định: 1A, 1B, 2A, 2B, 3.
          </p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tạo đợt mới
        </Button>
      </div>

      {periods.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <CalendarDays className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có đợt đăng ký nào</p>
          <Button className="mt-4" size="sm" onClick={openCreate}>Tạo đợt đầu tiên</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={periods} loading={loading} rowKey="id" />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Sửa đợt đăng ký" : "Tạo đợt đăng ký mới"}
        size="lg"
      >
        <div className="space-y-4">
          <Input
            label="Tên đợt *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Đợt đăng ký đồ án HK1A 2025-2026"
          />
          <Select
            label="Học kỳ *"
            value={form.semesterCode}
            onChange={(e) => setForm({ ...form, semesterCode: e.target.value })}
            options={SEMESTER_OPTIONS.map((s) => ({ value: s.code, label: s.label }))}
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
          <Select
            label="Trạng thái"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={[
              { value: "DRAFT", label: "Bản nháp" },
              { value: "OPEN", label: "Mở" },
              { value: "CLOSED", label: "Đóng" },
            ]}
          />
          <Input
            label="Điểm GPA tối thiểu"
            type="number"
            min={0}
            max={4}
            step={0.1}
            value={form.minGPA}
            onChange={(e) => setForm({ ...form, minGPA: Number(e.target.value) })}
          />
          <p className="rounded-md bg-amber-50 px-3 py-2 text-xs text-amber-700">
            Lưu ý: cấu hình SV/đề tài/nhóm tối đa đang được quản lý theo Khoa/Chuyên ngành,
            không thuộc đợt đăng ký.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>
              {editing ? "Lưu thay đổi" : "Tạo đợt"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}