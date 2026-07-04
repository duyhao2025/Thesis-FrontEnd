"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { SemesterResponse, SemesterStatus } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, BookMarked } from "lucide-react";

const STATUS_OPTIONS = [
  { value: "DRAFT", label: "Bản nháp" },
  { value: "ACTIVE", label: "Đang hoạt động" },
  { value: "COMPLETED", label: "Hoàn thành" },
  { value: "ARCHIVED", label: "Lưu trữ" },
];

export default function SemestersPage() {
  const [semesters, setSemesters] = useState<SemesterResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<SemesterResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    name: "",
    year: new Date().getFullYear(),
    term: 1,
    startDate: "",
    endDate: "",
    status: "DRAFT" as SemesterStatus,
  });

  const load = () => {
    setLoading(true);
    api.get("/semesters")
      .then((res) => setSemesters(res.data || []))
      .catch(() => showToast("error", "Không thể tải danh sách học kỳ"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({
      name: "",
      year: new Date().getFullYear(),
      term: 1,
      startDate: "",
      endDate: "",
      status: "DRAFT",
    });
    setShowModal(true);
  };

  const openEdit = (sem: SemesterResponse) => {
    setEditing(sem);
    setForm({
      name: sem.name,
      year: sem.year,
      term: sem.term,
      startDate: sem.startDate.split("T")[0],
      endDate: sem.endDate.split("T")[0],
      status: sem.status,
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
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/semesters/${editing.id}`, form);
        showToast("success", "Cập nhật học kỳ thành công!");
      } else {
        await api.post("/semesters", form);
        showToast("success", "Tạo học kỳ thành công!");
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Xóa học kỳ này?")) return;
    try {
      await api.delete(`/semesters/${id}`);
      showToast("success", "Xóa thành công!");
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xóa thất bại.";
      showToast("error", message);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Tên học kỳ",
      render: (r: SemesterResponse) => <span className="font-medium">{r.name}</span>,
    },
    {
      key: "year",
      header: "Năm học",
      render: (r: SemesterResponse) => `${r.year} - HK${r.term}`,
    },
    {
      key: "startDate",
      header: "Bắt đầu",
      render: (r: SemesterResponse) => new Date(r.startDate).toLocaleDateString("vi-VN"),
    },
    {
      key: "endDate",
      header: "Kết thúc",
      render: (r: SemesterResponse) => new Date(r.endDate).toLocaleDateString("vi-VN"),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r: SemesterResponse) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      render: (r: SemesterResponse) => (
        <div className="flex items-center gap-1">
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
          <h1 className="text-xl font-bold text-gray-900">Quản lý Học kỳ</h1>
          <p className="text-sm text-gray-500">Tạo và quản lý các học kỳ trong hệ thống</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm học kỳ
        </Button>
      </div>

      {semesters.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <BookMarked className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có học kỳ nào</p>
          <Button className="mt-4" size="sm" onClick={openCreate}>Thêm học kỳ đầu tiên</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={semesters} loading={loading} rowKey="id" />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Sửa học kỳ" : "Thêm học kỳ mới"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Tên học kỳ *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Học kỳ 1 năm học 2025-2026"
          />
          <div className="grid grid-cols-2 gap-4">
            <Input
              label="Năm bắt đầu *"
              type="number"
              value={form.year}
              onChange={(e) => setForm({ ...form, year: Number(e.target.value) })}
              min={2000}
              max={2100}
            />
            <Input
              label="Học kỳ (1, 2, 3) *"
              type="number"
              value={form.term}
              onChange={(e) => setForm({ ...form, term: Number(e.target.value) })}
              min={1}
              max={3}
            />
          </div>
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
            onChange={(e) => setForm({ ...form, status: e.target.value as SemesterStatus })}
            options={STATUS_OPTIONS}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>
              {editing ? "Lưu thay đổi" : "Tạo học kỳ"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
