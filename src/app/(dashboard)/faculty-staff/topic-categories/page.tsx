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
import { Plus, Pencil, Trash2, FolderKanban, Building2, GraduationCap } from "lucide-react";

interface MyInfo {
  fullName: string;
  departmentId?: string;
  departmentName?: string;
  departmentCode?: string;
  majorId?: string;
  majorName?: string;
  majorCode?: string;
}

export default function StaffTopicCategoriesPage() {
  const [categories, setCategories] = useState<TopicCategoryResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<TopicCategoryResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [myInfo, setMyInfo] = useState<MyInfo | null>(null);
  const { showToast } = useToast();

  const [form, setForm] = useState({ name: "", description: "" });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/topic-categories"),
      api.get("/shared/me/context"),
    ])
      .then(([catRes, ctxRes]) => {
        setCategories(catRes.data || []);
        setMyInfo(ctxRes.data || null);
      })
      .catch(() => showToast("error", "Không thể tải danh mục"))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    load();
  }, []);

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
    if (!form.name.trim()) {
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
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", message);
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
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xóa thất bại.";
      showToast("error", message);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Tên danh mục",
      render: (r: TopicCategoryResponse) => (
        <div>
          <p className="font-medium text-gray-900">{r.name}</p>
          {r.description && <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{r.description}</p>}
        </div>
      ),
    },
    {
      key: "major",
      header: "Chuyên ngành",
      render: (r: TopicCategoryResponse) =>
        r.majorName ? (
          <span className="inline-flex items-center gap-1 text-gray-700">
            <GraduationCap className="h-3.5 w-3.5" />
            {r.majorName}
          </span>
        ) : <span className="text-gray-400">—</span>,
    },
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
          <p className="text-sm text-gray-500">Quản lý danh mục phân loại đề tài thuộc Khoa/Chuyên ngành của bạn</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm danh mục
        </Button>
      </div>

      {myInfo && (
        <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4">
          <p className="text-xs font-medium text-blue-700 mb-2">Phạm vi quản lý của bạn:</p>
          <div className="flex flex-wrap items-center gap-4 text-sm">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 py-1.5">
              <Building2 className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">Khoa:</span>
              <span className="font-medium text-gray-900">
                {myInfo.departmentName || "(Chưa phân)"}
              </span>
            </span>
            <span className="inline-flex items-center gap-1.5 rounded-md border border-blue-200 bg-white px-3 py-1.5">
              <GraduationCap className="h-4 w-4 text-blue-600" />
              <span className="text-gray-600">Chuyên ngành:</span>
              <span className="font-medium text-gray-900">
                {myInfo.majorName ? myInfo.majorName : <span className="text-amber-600">Chưa phân</span>}
              </span>
            </span>
          </div>
          {!myInfo.majorName && (
            <p className="mt-2 text-xs text-amber-600">
              Bạn chưa được phân Chuyên ngành nên chưa thể tạo danh mục. Vui lòng liên hệ quản trị viên.
            </p>
          )}
        </div>
      )}

      {categories.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <FolderKanban className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có danh mục nào trong Khoa/Chuyên ngành của bạn</p>
          {myInfo?.majorName && (
            <Button className="mt-4" size="sm" onClick={openCreate}>Thêm danh mục đầu tiên</Button>
          )}
        </div>
      ) : (
        <DataTable columns={columns} data={categories} loading={loading} rowKey="id" />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editing ? "Sửa danh mục" : "Thêm danh mục mới"}
        size="md"
      >
        <div className="space-y-4">
          <div className="rounded-md border border-blue-100 bg-blue-50/50 p-3 text-xs text-gray-600">
            Danh mục sẽ thuộc Khoa <strong>{myInfo?.departmentName}</strong> và Chuyên ngành <strong>{myInfo?.majorName || "(chưa phân)"}</strong>.
            {!myInfo?.majorName && (
              <p className="mt-1 text-amber-600">Không thể tạo khi chưa được phân Chuyên ngành.</p>
            )}
          </div>
          <Input
            label="Tên danh mục *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="VD: Trí tuệ nhân tạo, Phát triển Web..."
          />
          <Textarea
            label="Mô tả"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            placeholder="Mô tả ngắn về danh mục này..."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit} disabled={!myInfo?.majorName}>
              {editing ? "Lưu" : "Tạo mới"}
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}