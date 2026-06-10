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
import { TopicResponse, TopicCategoryResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { Plus, BookOpen, Pencil, Trash2, Eye } from "lucide-react";
import clsx from "clsx";

export default function TopicsPage() {
  const { user } = useAuth();
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [categories, setCategories] = useState<TopicCategoryResponse[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [majors, setMajors] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<TopicResponse | null>(null);
  const [editingTopic, setEditingTopic] = useState<TopicResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    objective: "",
    scope: "",
    topicCategoryId: "",
    departmentId: "",
    majorId: "",
    maxStudents: 3,
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get("/topics/my"),
      api.get("/topic-categories"),
      api.get("/shared/departments"),
      api.get("/shared/majors"),
    ]).then(([topicRes, catRes, deptRes, majorRes]) => {
      setTopics(topicRes.data || []);
      setCategories(catRes.data || []);
      setDepartments(deptRes.data || []);
      setMajors(majorRes.data || []);
    }).catch(() => showToast("error", "Không thể tải dữ liệu"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const openCreate = () => {
    setEditingTopic(null);
    setForm({ title: "", description: "", objective: "", scope: "", topicCategoryId: "", departmentId: "", majorId: "", maxStudents: 3 });
    setShowModal(true);
  };

  const openEdit = (topic: TopicResponse) => {
    setEditingTopic(topic);
    setForm({
      title: topic.title,
      description: topic.description,
      objective: topic.objective,
      scope: topic.scope,
      topicCategoryId: topic.topicCategoryId,
      departmentId: topic.departmentId,
      majorId: topic.majorId,
      maxStudents: topic.maxStudents,
    });
    setShowModal(true);
  };

  const openDetail = (topic: TopicResponse) => {
    setSelectedTopic(topic);
    setShowDetailModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || !form.description || !form.objective || !form.scope) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (!form.topicCategoryId || !form.departmentId || !form.majorId) {
      showToast("error", "Vui lòng chọn danh mục, bộ môn và ngành");
      return;
    }
    setSubmitting(true);
    try {
      if (editingTopic) {
        await api.put(`/topics/${editingTopic.id}`, form);
        showToast("success", "Cập nhật thành công!");
      } else {
        await api.post("/topics", { ...form, lecturerId: user?.id });
        showToast("success", "Tạo đề tài thành công!");
      }
      setShowModal(false);
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc muốn xóa đề tài này?")) return;
    try {
      await api.delete(`/topics/${id}`);
      showToast("success", "Xóa thành công!");
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xóa thất bại.";
      showToast("error", message);
    }
  };

  const handlePublish = async (id: string) => {
    try {
      await api.put(`/topics/${id}/publish`);
      showToast("success", "Đề tài đã được công khai!");
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", message);
    }
  };

  const handleClose = async (id: string) => {
    try {
      await api.put(`/topics/${id}/close`);
      showToast("success", "Đề tài đã đóng!");
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", message);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Tên đề tài",
      render: (row: TopicResponse) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    { key: "lecturerName", header: "Giảng viên" },
    { key: "topicCategoryName", header: "Danh mục" },
    {
      key: "students",
      header: "SV",
      render: (r: TopicResponse) => `${r.currentStudents}/${r.maxStudents}`,
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (r: TopicResponse) => <StatusBadge status={r.status} />,
    },
    {
      key: "actions",
      header: "",
      className: "w-32",
      render: (row: TopicResponse) => (
        <div className="flex items-center gap-1">
          <button onClick={() => openDetail(row)} className="rounded p-1.5 text-gray-500 hover:bg-gray-100">
            <Eye className="h-4 w-4" />
          </button>
          <button onClick={() => openEdit(row)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => handleDelete(row.id)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
            <Trash2 className="h-4 w-4" />
          </button>
          {row.status !== "OPEN" ? (
            <button onClick={() => handlePublish(row.id)} className="rounded p-1.5 text-green-600 hover:bg-green-50" title="Công khai">
              <Plus className="h-4 w-4" />
            </button>
          ) : (
            <button onClick={() => handleClose(row.id)} className="rounded p-1.5 text-gray-600 hover:bg-gray-100" title="Đóng">
              <Trash2 className="h-4 w-4" />
            </button>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý đề tài</h1>
          <p className="text-sm text-gray-500">Tạo và quản lý đề tài luận văn</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Tạo đề tài
        </Button>
      </div>

      <DataTable columns={columns} data={topics} loading={loading} rowKey="id" emptyMessage="Chưa có đề tài nào" />

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title={editingTopic ? "Sửa đề tài" : "Tạo đề tài mới"} size="lg">
        <div className="space-y-4">
          <Input
            label="Tên đề tài *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
          />
          <Textarea
            label="Mô tả *"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <div className="grid grid-cols-2 gap-4">
            <Textarea
              label="Mục tiêu"
              value={form.objective}
              onChange={(e) => setForm({ ...form, objective: e.target.value })}
              rows={2}
            />
            <Textarea
              label="Phạm vi"
              value={form.scope}
              onChange={(e) => setForm({ ...form, scope: e.target.value })}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Danh mục *"
              value={form.topicCategoryId}
              onChange={(e) => setForm({ ...form, topicCategoryId: e.target.value })}
              options={categories.map((c) => ({ value: c.id, label: c.name }))}
              placeholder="Chọn danh mục"
            />
            <Select
              label="Bộ môn *"
              value={form.departmentId}
              onChange={(e) => setForm({ ...form, departmentId: e.target.value })}
              options={departments.map((d) => ({ value: d.id, label: d.name }))}
              placeholder="Chọn bộ môn"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Select
              label="Ngành *"
              value={form.majorId}
              onChange={(e) => setForm({ ...form, majorId: e.target.value })}
              options={majors.map((m) => ({ value: m.id, label: m.name }))}
              placeholder="Chọn ngành"
            />
            <Input
              label="Số SV tối đa"
              type="number"
              min={1}
              max={10}
              value={form.maxStudents}
              onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })}
            />
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>
              {editingTopic ? "Lưu thay đổi" : "Tạo đề tài"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết đề tài" size="lg">
        {selectedTopic && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">{selectedTopic.title}</h3>
              <StatusBadge status={selectedTopic.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-gray-500">GV:</span> {selectedTopic.lecturerName}</div>
              <div><span className="font-medium text-gray-500">Danh mục:</span> {selectedTopic.topicCategoryName}</div>
              <div><span className="font-medium text-gray-500">Sĩ số:</span> {selectedTopic.currentStudents}/{selectedTopic.maxStudents}</div>
              <div><span className="font-medium text-gray-500">Bộ môn:</span> {selectedTopic.departmentName}</div>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Mô tả</label>
              <p className="text-sm text-gray-700">{selectedTopic.description}</p>
            </div>
            {selectedTopic.objective && (
              <div>
                <label className="text-xs font-medium text-gray-500">Mục tiêu</label>
                <p className="text-sm text-gray-700">{selectedTopic.objective}</p>
              </div>
            )}
            <div className="flex justify-end">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
