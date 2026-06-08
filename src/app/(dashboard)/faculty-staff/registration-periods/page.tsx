"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import { RegistrationPeriodResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, CalendarDays } from "lucide-react";

export default function RegistrationPeriodsPage() {
  const [periods, setPeriods] = useState<RegistrationPeriodResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<RegistrationPeriodResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    semesterId: "",
    name: "",
    startDate: "",
    endDate: "",
    status: "DRAFT",
    maxTopicPerLecturer: 5,
    maxStudentPerGroup: 3,
  });

  const load = () => {
    setLoading(true);
    api.get("/registration-periods")
      .then((res) => setPeriods(res.data || []))
      .catch(() => showToast("error", "Không thể tải dữ liệu"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      semesterId: "",
      name: "",
      startDate: "",
      endDate: "",
      status: "DRAFT",
      maxTopicPerLecturer: 5,
      maxStudentPerGroup: 3,
    });
    setShowModal(true);
  };

  const openEdit = (period: RegistrationPeriodResponse) => {
    setEditing(period);
    setForm({
      semesterId: period.semesterId,
      name: period.name,
      startDate: period.startDate.split("T")[0],
      endDate: period.endDate.split("T")[0],
      status: period.status,
      maxTopicPerLecturer: period.maxTopicPerLecturer,
      maxStudentPerGroup: period.maxStudentPerGroup,
    });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name || !form.startDate || !form.endDate) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/registration-periods/${editing.id}`, form);
        showToast("success", "Cập nhật thành công!");
      } else {
        await api.post("/registration-periods", form);
        showToast("success", "Tạo đợt thành công!");
      }
      setShowModal(false);
      load();
    } catch {
      showToast("error", "Thao tác thất bại.");
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
    const newStatus = currentStatus === "OPEN" ? "CLOSED" : "OPEN";
    try {
      await api.put(`/registration-periods/${id}`, { ...periods.find((p) => p.id === id), status: newStatus });
      showToast("success", `Đợt đăng ký đã ${newStatus === "OPEN" ? "mở" : "đóng"}!`);
      load();
    } catch {
      showToast("error", "Thao tác thất bại.");
    }
  };

  const columns = [
    { key: "name", header: "Tên đợt", render: (r: RegistrationPeriodResponse) => <span className="font-medium">{r.name}</span> },
    { key: "semesterName", header: "Học kỳ" },
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
          <p className="text-sm text-gray-500">Quản lý các đợt đăng ký đề tài</p>
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
            placeholder="VD: Đợt đăng ký HK2 2025-2026"
          />
          <Input
            label="Semester ID"
            value={form.semesterId}
            onChange={(e) => setForm({ ...form, semesterId: e.target.value })}
            placeholder="Nhập ID học kỳ"
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
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Đề tài tối đa/GV"
              type="number"
              min={1}
              max={20}
              value={form.maxTopicPerLecturer}
              onChange={(e) => setForm({ ...form, maxTopicPerLecturer: Number(e.target.value) })}
            />
            <Input
              label="SV tối đa/nhóm"
              type="number"
              min={1}
              max={10}
              value={form.maxStudentPerGroup}
              onChange={(e) => setForm({ ...form, maxStudentPerGroup: Number(e.target.value) })}
            />
          </div>
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
