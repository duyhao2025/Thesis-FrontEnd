"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import { useToast } from "@/components/ui/Toast";
import ImportUsersModal from "@/components/admin/ImportUsersModal";
import { Plus, Pencil, Trash2, Users, Search, Upload, Download } from "lucide-react";
import { UserRole } from "@/types/api";
import { exportUsers, saveBlob } from "@/lib/admin-api";

interface Department {
  id: string;
  name: string;
  code: string;
}

interface Major {
  id: string;
  name: string;
  code: string;
  departmentId: string;
  departmentName: string;
}

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  departmentId?: string;
  departmentName?: string;
  majorId?: string;
  majorName?: string;
  isActive: boolean;
  createdAt: string;
}

const roleLabels: Record<UserRole, string> = {
  Student: "Sinh viên",
  Lecturer: "Giảng viên",
  FacultyStaff: "Nhân viên khoa",
  HeadOfDepartment: "Trưởng bộ môn",
  Admin: "Quản trị viên",
};

const rolesRequiringDepartment = ["Student", "Lecturer", "FacultyStaff"];
const rolesAllowingMajor = ["Student", "Lecturer", "FacultyStaff", "HeadOfDepartment"];
const rolesRequiringMajor = ["Student"];

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [deletingUser, setDeletingUser] = useState<AdminUser | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [exporting, setExporting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    email: "",
    name: "",
    password: "",
    role: "Student" as UserRole,
    departmentId: "",
    majorId: "",
  });

  const load = () => {
    setLoading(true);
    Promise.all([
      api.get("/admin/users"),
      api.get("/admin/departments"),
      api.get("/admin/majors"),
    ])
      .then(([usersRes, deptsRes, majorsRes]) => {
        setUsers(usersRes.data || []);
        setDepartments(deptsRes.data || []);
        setMajors(majorsRes.data || []);
      })
      .catch(() => {
        setUsers([]);
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const loadMajorsByDepartment = (departmentId: string) => {
    if (departmentId) {
      api.get(`/admin/majors?departmentId=${departmentId}`)
        .then((res) => setMajors(res.data || []))
        .catch(() => {});
    }
  };

  const openCreate = () => {
    setEditingUser(null);
    setForm({ email: "", name: "", password: "", role: "Student", departmentId: "", majorId: "" });
    setShowModal(true);
  };

  const openEdit = (user: AdminUser) => {
    setEditingUser(user);
    setForm({
      email: user.email,
      name: user.name,
      password: "",
      role: user.role,
      departmentId: user.departmentId || "",
      majorId: user.majorId || "",
    });
    // Load majors for the user's department
    if (user.departmentId) {
      loadMajorsByDepartment(user.departmentId);
    }
    setShowModal(true);
  };

  const openDelete = (user: AdminUser) => {
    setDeletingUser(user);
    setShowDeleteModal(true);
  };

  const handleRoleChange = (newRole: UserRole) => {
    setForm({ ...form, role: newRole, majorId: "" }); // Reset major when role changes
    if (rolesRequiringDepartment.includes(newRole) && departments.length > 0) {
      setForm((prev) => ({ ...prev, role: newRole, departmentId: departments[0].id }));
    } else {
      setForm((prev) => ({ ...prev, role: newRole, departmentId: "", majorId: "" }));
    }
  };

  const handleDepartmentChange = (departmentId: string) => {
    setForm({ ...form, departmentId, majorId: "" }); // Reset major when department changes
    if (departmentId) {
      api.get(`/admin/majors?departmentId=${departmentId}`)
        .then((res) => setMajors(res.data || []))
        .catch(() => {});
    }
  };

  const handleSubmit = async () => {
    if (!form.email || !form.name || (!editingUser && !form.password)) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    if (rolesRequiringDepartment.includes(form.role) && !form.departmentId) {
      showToast("error", "Vui lòng chọn Khoa");
      return;
    }
    if (rolesRequiringMajor.includes(form.role) && !form.majorId) {
      showToast("error", "Vui lòng chọn Chuyên ngành");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name,
        email: form.email,
        role: form.role,
        departmentId: rolesRequiringDepartment.includes(form.role) ? form.departmentId : null,
        majorId: rolesAllowingMajor.includes(form.role) && form.majorId ? form.majorId : null,
      };
      if (!editingUser) {
        payload.password = form.password;
      }
      if (editingUser) {
        await api.put(`/admin/users/${editingUser.id}`, payload);
        showToast("success", "Cập nhật người dùng thành công!");
      } else {
        await api.post("/admin/users", payload);
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

  const handleExport = async () => {
    setExporting(true);
    try {
      const blob = await exportUsers({
        role: roleFilter || undefined,
        search: search || undefined,
      });
      const filename = `users_export_${new Date().toISOString().slice(0, 10)}.xlsx`;
      saveBlob(blob, filename);
      showToast("success", "Đã xuất file Excel thành công!");
    } catch {
      showToast("error", "Lỗi khi xuất file Excel");
    } finally {
      setExporting(false);
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
      key: "department",
      header: "Khoa",
      render: (r: AdminUser) => r.departmentName || <span className="text-gray-400">-</span>,
    },
    {
      key: "major",
      header: "Ngành",
      render: (r: AdminUser) => r.majorName || <span className="text-gray-400">-</span>,
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
      key: "isActive",
      header: "Trạng thái",
      render: (r: AdminUser) => (
        <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${r.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
          {r.isActive ? "Hoạt động" : "Không hoạt động"}
        </span>
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
        <div className="flex gap-3">
          <Button variant="outline" onClick={handleExport} isLoading={exporting}>
            <Download className="h-4 w-4" />
            Export
          </Button>
          <Button variant="outline" onClick={() => setShowImportModal(true)}>
            <Upload className="h-4 w-4" />
            Import Excel
          </Button>
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Thêm người dùng
          </Button>
        </div>
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
            onChange={(e) => handleRoleChange(e.target.value as UserRole)}
            options={[
              { value: "Student", label: "Sinh viên" },
              { value: "Lecturer", label: "Giảng viên" },
              { value: "FacultyStaff", label: "Nhân viên khoa" },
              { value: "HeadOfDepartment", label: "Trưởng bộ môn" },
              { value: "Admin", label: "Quản trị viên" },
            ]}
          />
          {rolesRequiringDepartment.includes(form.role) && (
            <Select
              label="Khoa *"
              value={form.departmentId}
              onChange={(e) => handleDepartmentChange(e.target.value)}
              options={[
                { value: "", label: "Chọn khoa" },
                ...departments.map((d) => ({ value: d.id, label: `${d.code} - ${d.name}` })),
              ]}
            />
          )}
          {rolesAllowingMajor.includes(form.role) && form.departmentId && (
            <Select
              label={rolesRequiringMajor.includes(form.role) ? "Chuyên ngành *" : "Chuyên ngành (không bắt buộc)"}
              value={form.majorId}
              onChange={(e) => setForm({ ...form, majorId: e.target.value })}
              options={[
                { value: "", label: rolesRequiringMajor.includes(form.role) ? "Chọn chuyên ngành" : "(Không chọn)" },
                ...majors
                  .filter((m) => m.departmentId === form.departmentId)
                  .map((m) => ({ value: m.id, label: `${m.code} - ${m.name}` })),
              ]}
            />
          )}
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

      <ImportUsersModal
        isOpen={showImportModal}
        onClose={() => setShowImportModal(false)}
        onImportComplete={load}
      />
    </div>
  );
}
