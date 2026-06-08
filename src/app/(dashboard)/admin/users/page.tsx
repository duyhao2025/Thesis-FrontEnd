"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import { Plus, Pencil, Trash2, Users, Search } from "lucide-react";
import { UserRole } from "@/types/api";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

const roleLabels: Record<UserRole, string> = {
  Student: "Sinh viên",
  Lecturer: "Giảng viên",
  FacultyStaff: "Nhân viên khoa",
  HeadOfDepartment: "Trưởng bộ môn",
  Admin: "Quản trị viên",
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const { showToast } = useToast();

  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "Student" as UserRole,
  });

  const load = () => {
    setLoading(true);
    api.get("/admin/users")
      .then((res) => setUsers(res.data || []))
      .catch(() => {
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: "", name: "", password: "", role: "Student" });
    setShowModal(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setForm({ email: user.email, name: user.name, password: "", role: user.role });
    setShowModal(true);
  };

  const openDelete = (user: AdminUser) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleSubmit = async () => {
    if (!form.email || !form.name || (!editingUser && !form.password)) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, { name: form.name, email: form.email, role: form.role });
        showToast("success", "Cập nhật người dùng thành công!");
      } else {
        await api.post("/admin/users", form);
        showToast("success", "Tạo người dùng thành công!");
      }
      setShowModal(false);
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại. Vui lòng thử lại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    if (!deletingUser) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/users/${deletingUser.id}`);
      showToast("success", "Xóa người dùng thành công!");
      setShowDeleteModal(false);
      load();
    } catch {
      showToast("error", "Xóa người dùng thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleChangeRole = async (userId: string, newRole: UserRole) => {
    try {
      await api.patch(`/admin/users/${userId}/role`, { role: newRole });
      showToast("success", "Cập nhật quyền thành công!");
      load();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Cập nhật quyền thất bại.";
      showToast("error", message);
    }
  };

  const filtered = users.filter((u) => {
    const matchSearch = !search ||
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const columns = [
    {
      key: "user",
      header: "Người dùng",
      render: (r: AdminUser) => (
        <div className="flex items-center gap-3">
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-xs font-bold text-white">
            {r.name?.charAt(0)?.toUpperCase() || "?"}
          </div>
          <div>
            <p className="font-medium text-gray-900">{r.name}</p>
            <p className="text-xs text-gray-500">{r.email}</p>
          </div>
        </div>
      ),
    },
    {
      key: "role",
      header: "Vai trò",
      render: (r: AdminUser) => (
        <Select
          options={[
            { value: "Student", label: "Sinh viên" },
            { value: "Lecturer", label: "Giảng viên" },
            { value: "FacultyStaff", label: "Nhân viên khoa" },
            { value: "HeadOfDepartment", label: "Trưởng bộ môn" },
            { value: "Admin", label: "Quản trị viên" },
          ]}
          value={r.role}
          onChange={(e) => handleChangeRole(r.id, e.target.value as UserRole)}
          className="text-xs py-1"
        />
      ),
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (r: AdminUser) => new Date(r.createdAt).toLocaleDateString("vi-VN"),
    },
    {
      key: "actions",
      header: "",
      className: "w-24",
      render: (r: AdminUser) => (
        <div className="flex gap-1">
          <button onClick={() => openEdit(r)} className="rounded p-1.5 text-blue-600 hover:bg-blue-50">
            <Pencil className="h-4 w-4" />
          </button>
          <button onClick={() => openDelete(r)} className="rounded p-1.5 text-red-600 hover:bg-red-50">
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
          <h1 className="text-xl font-bold text-gray-900">Quản lý người dùng</h1>
          <p className="text-sm text-gray-500">Thêm, sửa, xóa và phân quyền người dùng</p>
        </div>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4" />
          Thêm người dùng
        </Button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <Select
          options={[
            { value: "", label: "Tất cả vai trò" },
            { value: "Student", label: "Sinh viên" },
            { value: "Lecturer", label: "Giảng viên" },
            { value: "FacultyStaff", label: "Nhân viên khoa" },
            { value: "HeadOfDepartment", label: "Trưởng bộ môn" },
            { value: "Admin", label: "Quản trị viên" },
          ]}
          value={roleFilter}
          onChange={(e) => setRoleFilter(e.target.value)}
        />
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <Users className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Không có người dùng nào</p>
          <Button className="mt-4" size="sm" onClick={openCreate}>Thêm người dùng đầu tiên</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title={editingUser ? "Sửa người dùng" : "Thêm người dùng mới"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Họ tên *"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <Input
            label="Email *"
            type="email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          {!editingUser && (
            <Input
              label="Mật khẩu *"
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
            />
          )}
          <Select
            label="Vai trò"
            value={form.role}
            onChange={(e) => setForm({ ...form, role: e.target.value as UserRole })}
            options={[
              { value: "Student", label: "Sinh viên" },
              { value: "Lecturer", label: "Giảng viên" },
              { value: "FacultyStaff", label: "Nhân viên khoa" },
              { value: "HeadOfDepartment", label: "Trưởng bộ môn" },
              { value: "Admin", label: "Quản trị viên" },
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>
              {editingUser ? "Lưu thay đổi" : "Tạo người dùng"}
            </Button>
          </div>
        </div>
      </Modal>

      <Modal
        isOpen={showDeleteModal}
        onClose={() => setShowDeleteModal(false)}
        title="Xác nhận xóa người dùng"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa người dùng <strong>{deletingUser?.name}</strong> ({deletingUser?.email})?
            Hành động này không thể hoàn tác.
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeleteModal(false)}>Hủy</Button>
            <Button variant="danger" isLoading={submitting} onClick={handleDelete}>Xóa</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
