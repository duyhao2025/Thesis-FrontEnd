"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { TopicCategoryResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, FolderKanban } from "lucide-react";

export default function TopicCategoriesPage() {
  const [categories, setCategories] = useState<TopicCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TopicCategoryResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: "", description: "" });

  const load = () => {
    setLoading(true);
    api.get("/topic-categories")
      .then((res) => setCategories(res.data || []))
      .catch(() => showToast("error", "Không thể tải danh mục"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ name: "", description: "" });
    setShowModal(true);
  };

  const openEdit = (cat: TopicCategoryResponse) => {
    setEditing(cat);
    setForm({ name: cat.name, description: cat.description });
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!form.name) {
      showToast("error", "Tên danh mục không được để trống");
      return;
    }
    setSubmitting(true);
    try {
      if (editing) {
        await api.put(`/topic-categories/${editing.id}`, form);
        showToast("success", "Cập nhật thành công!");
      } else {
        await api.post("/topic-categories", form);
        showToast("success", "Tạo danh mục thành công!");
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
    if (!confirm("Xóa danh mục này?")) return;
    try {
      await api.delete(`/topic-categories/${id}`);
      showToast("success", "Xóa thành công!");
      load();
    } catch {
      showToast("error", "Xóa thất bại.");
    }
  };

  const columns = [
    { key: "name", header: "Tên danh mục", render: (r: TopicCategoryResponse) => <span className="font-medium">{r.name}</span> },
    { key: "description", header: "Mô tả" },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (r: TopicCategoryResponse) => (
        <div className="flex gap-1">
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
          <h1 className="text-xl font-bold text-gray-900">Danh mục đề tài</h1>
          <p className="text-sm text-gray-500">Quản lý danh mục phân loại đề tài</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      {categories.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <FolderKanban className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có danh mục nào</p>
          <Button className="mt-4" size="sm" onClick={openCreate}>Thêm danh mục đầu tiên</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={categories} loading={loading} rowKey="id" />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Sửa danh mục" : "Thêm danh mục mới"}
        size="sm"
      >
        <div className="space-y-4">
          <Input
            label="Tên danh mục *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Textarea
            label="Mô tả"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>
              {editing ? "Lưu" : "Tạo mới"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
