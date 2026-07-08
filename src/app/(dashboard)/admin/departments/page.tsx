"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { useToast } from "@/components/ui/Toast";
import {
  Plus,
  Pencil,
  Trash2,
  Building2,
  Users,
  ChevronDown,
  ChevronRight,
  FolderTree,
  MoreVertical,
} from "lucide-react";

interface Department {
  id: string;
  name: string;
  code: string;
  description?: string;
  majorCount: number;
  createdAt: string;
}

interface Major {
  id: string;
  name: string;
  code: string;
  description?: string;
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  createdAt: string;
}

export default function DepartmentsPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  // Department modal
  const [showDeptModal, setShowDeptModal] = useState(false);
  const [editingDept, setEditingDept] = useState<Department | null>(null);
  const [showDeptDeleteModal, setShowDeptDeleteModal] = useState(false);
  const [deletingDept, setDeletingDept] = useState<Department | null>(null);

  // Major modal (per department context)
  const [showMajorModal, setShowMajorModal] = useState(false);
  const [editingMajor, setEditingMajor] = useState<Major | null>(null);
  const [majorDepartment, setMajorDepartment] = useState<Department | null>(null);
  const [showMajorDeleteModal, setShowMajorDeleteModal] = useState(false);
  const [deletingMajor, setDeletingMajor] = useState<Major | null>(null);

  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [deptForm, setDeptForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const [majorForm, setMajorForm] = useState({
    name: "",
    code: "",
    description: "",
  });

  const loadData = () => {
    setLoading(true);
    Promise.all([
      api.get("/admin/departments"),
      api.get("/admin/majors"),
    ])
      .then(([deptRes, majorRes]) => {
        setDepartments(deptRes.data || []);
        setMajors(majorRes.data || []);
      })
      .catch(() => {
        showToast("error", "Không thể tải dữ liệu");
      })
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadData(); }, []);

  const toggleExpand = (id: string) => {
    const newSet = new Set(expandedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setExpandedIds(newSet);
  };

  const expandAll = () => setExpandedIds(new Set(departments.map((d) => d.id)));
  const collapseAll = () => setExpandedIds(new Set());

  const majorsOfDepartment = (deptId: string) =>
    majors.filter((m) => m.departmentId === deptId);

  // Department handlers
  const openCreateDept = () => {
    setEditingDept(null);
    setDeptForm({ name: "", code: "", description: "" });
    setShowDeptModal(true);
  };

  const openEditDept = (dept: Department) => {
    setEditingDept(dept);
    setDeptForm({
      name: dept.name,
      code: dept.code,
      description: dept.description || "",
    });
    setShowDeptModal(true);
  };

  const handleDeptSubmit = async () => {
    if (!deptForm.name || !deptForm.code) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      if (editingDept) {
        await api.put(`/admin/departments/${editingDept.id}`, deptForm);
        showToast("success", "Cập nhật khoa thành công!");
      } else {
        await api.post("/admin/departments", deptForm);
        showToast("success", "Tạo khoa thành công!");
      }
      setShowDeptModal(false);
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteDept = (dept: Department) => {
    setDeletingDept(dept);
    setShowDeptDeleteModal(true);
  };

  const handleDeleteDept = async () => {
    if (!deletingDept) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/departments/${deletingDept.id}`);
      showToast("success", "Đã xóa khoa!");
      // Remove from expanded
      const newSet = new Set(expandedIds);
      newSet.delete(deletingDept.id);
      setExpandedIds(newSet);
      setShowDeptDeleteModal(false);
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xóa thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  // Major handlers
  const openCreateMajor = (dept: Department) => {
    setEditingMajor(null);
    setMajorDepartment(dept);
    setMajorForm({ name: "", code: "", description: "" });
    setShowMajorModal(true);
  };

  const openEditMajor = (major: Major, dept: Department) => {
    setEditingMajor(major);
    setMajorDepartment(dept);
    setMajorForm({
      name: major.name,
      code: major.code,
      description: major.description || "",
    });
    setShowMajorModal(true);
  };

  const handleMajorSubmit = async () => {
    if (!majorForm.name || !majorForm.code || !majorDepartment) {
      showToast("error", "Vui lòng điền đầy đủ thông tin");
      return;
    }
    setSubmitting(true);
    try {
      const payload = { ...majorForm, departmentId: majorDepartment.id };
      if (editingMajor) {
        await api.put(`/admin/majors/${editingMajor.id}`, payload);
        showToast("success", "Cập nhật chuyên ngành thành công!");
      } else {
        await api.post("/admin/majors", payload);
        showToast("success", "Tạo chuyên ngành thành công!");
      }
      setShowMajorModal(false);
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const openDeleteMajor = (major: Major) => {
    setDeletingMajor(major);
    setShowMajorDeleteModal(true);
  };

  const handleDeleteMajor = async () => {
    if (!deletingMajor) return;
    setSubmitting(true);
    try {
      await api.delete(`/admin/majors/${deletingMajor.id}`);
      showToast("success", "Đã xóa chuyên ngành!");
      setShowMajorDeleteModal(false);
      loadData();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Xóa thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Quản lý Khoa / Chuyên ngành</h1>
          <p className="text-sm text-gray-500">Tạo và quản lý các khoa cùng các chuyên ngành trực thuộc</p>
        </div>
        <Button onClick={openCreateDept}>
          <Plus className="h-4 w-4" />
          Thêm khoa
        </Button>
      </div>

      {/* Toolbar */}
      <div className="flex items-center gap-2 text-sm">
        <button
          onClick={expandAll}
          className="text-blue-600 hover:underline"
          disabled={loading}
        >
          Mở rộng tất cả
        </button>
        <span className="text-gray-300">|</span>
        <button
          onClick={collapseAll}
          className="text-blue-600 hover:underline"
          disabled={loading}
        >
          Thu gọn tất cả
        </button>
        <span className="ml-auto text-gray-500">
          {departments.length} khoa · {majors.length} chuyên ngành
        </span>
      </div>

      {loading ? (
        <div className="rounded-lg border border-gray-200 bg-white p-12 text-center text-gray-500">
          Đang tải...
        </div>
      ) : departments.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <Building2 className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có khoa nào</p>
          <Button className="mt-4" size="sm" onClick={openCreateDept}>Thêm khoa đầu tiên</Button>
        </div>
      ) : (
        <div className="space-y-3">
          {departments.map((dept) => {
            const isExpanded = expandedIds.has(dept.id);
            const deptMajors = majorsOfDepartment(dept.id);
            return (
              <div
                key={dept.id}
                className="rounded-lg border border-gray-200 bg-white shadow-sm overflow-hidden"
              >
                {/* Department Header */}
                <div
                  className={`flex items-center gap-3 px-4 py-3 cursor-pointer transition-colors ${
                    isExpanded ? "bg-blue-50/50" : "bg-white hover:bg-gray-50"
                  }`}
                  onClick={() => toggleExpand(dept.id)}
                >
                  <button
                    className="flex-shrink-0 text-gray-400 hover:text-blue-600"
                    onClick={(e) => { e.stopPropagation(); toggleExpand(dept.id); }}
                  >
                    {isExpanded ? (
                      <ChevronDown className="h-5 w-5" />
                    ) : (
                      <ChevronRight className="h-5 w-5" />
                    )}
                  </button>

                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
                    <Building2 className="h-5 w-5" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-900 truncate">{dept.name}</h3>
                      <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                        {dept.code}
                      </span>
                    </div>
                    {dept.description && (
                      <p className="mt-0.5 text-xs text-gray-500 truncate">{dept.description}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-3 flex-shrink-0">
                    <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                      <Users className="h-3 w-3" />
                      {dept.majorCount} ngành
                    </span>

                    <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                      <button
                        onClick={() => openCreateMajor(dept)}
                        className="flex items-center gap-1 rounded px-2 py-1 text-xs font-medium text-blue-600 hover:bg-blue-50"
                        title="Thêm chuyên ngành"
                      >
                        <Plus className="h-3.5 w-3.5" />
                        <span>Ngành</span>
                      </button>
                      <button
                        onClick={() => openEditDept(dept)}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-blue-600"
                        title="Sửa khoa"
                      >
                        <Pencil className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => openDeleteDept(dept)}
                        className="rounded p-1.5 text-gray-500 hover:bg-gray-100 hover:text-red-600"
                        title="Xóa khoa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Expanded Major List */}
                {isExpanded && (
                  <div className="border-t border-gray-100 bg-gray-50/30">
                    {deptMajors.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-sm">
                        <FolderTree className="mb-2 h-8 w-8 text-gray-300" />
                        <p className="text-gray-500">Khoa này chưa có chuyên ngành nào</p>
                        <button
                          onClick={() => openCreateMajor(dept)}
                          className="mt-2 inline-flex items-center gap-1 text-sm font-medium text-blue-600 hover:underline"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Thêm chuyên ngành
                        </button>
                      </div>
                    ) : (
                      <div className="divide-y divide-gray-100">
                        {deptMajors.map((major) => (
                          <div
                            key={major.id}
                            className="flex items-center gap-3 px-4 py-3 pl-14 hover:bg-white transition-colors"
                          >
                            <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg bg-purple-100 text-purple-600">
                              <Users className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <p className="font-medium text-gray-900 truncate">{major.name}</p>
                                <span className="rounded bg-gray-100 px-1.5 py-0.5 text-xs font-medium text-gray-600">
                                  {major.code}
                                </span>
                              </div>
                              {major.description && (
                                <p className="mt-0.5 text-xs text-gray-500 truncate">{major.description}</p>
                              )}
                            </div>
                            <div className="flex items-center gap-1 flex-shrink-0">
                              <button
                                onClick={() => openEditMajor(major, dept)}
                                className="rounded p-1.5 text-gray-500 hover:bg-blue-50 hover:text-blue-600"
                                title="Sửa"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => openDeleteMajor(major)}
                                className="rounded p-1.5 text-gray-500 hover:bg-red-50 hover:text-red-600"
                                title="Xóa"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Department Modal */}
      <Modal
        isOpen={showDeptModal}
        onClose={() => setShowDeptModal(false)}
        title={editingDept ? "Sửa khoa" : "Thêm khoa mới"}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Tên khoa *"
            value={deptForm.name}
            onChange={(e) => setDeptForm({ ...deptForm, name: e.target.value })}
            placeholder="VD: Khoa Công nghệ thông tin"
          />
          <Input
            label="Mã khoa *"
            value={deptForm.code}
            onChange={(e) => setDeptForm({ ...deptForm, code: e.target.value.toUpperCase() })}
            placeholder="VD: CNTT"
          />
          <Textarea
            label="Mô tả"
            value={deptForm.description}
            onChange={(e) => setDeptForm({ ...deptForm, description: e.target.value })}
            placeholder="Mô tả về khoa (tùy chọn)"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowDeptModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleDeptSubmit}>
              {editingDept ? "Lưu thay đổi" : "Tạo khoa"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Department Delete Modal */}
      <Modal
        isOpen={showDeptDeleteModal}
        onClose={() => setShowDeptDeleteModal(false)}
        title="Xóa khoa"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa khoa <strong>{deletingDept?.name}</strong>?
            {deletingDept && deletingDept.majorCount > 0 && (
              <span className="mt-2 block text-red-600">
                Khoa này đang có {deletingDept.majorCount} chuyên ngành. Hãy xóa hết chuyên ngành trước.
              </span>
            )}
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowDeptDeleteModal(false)}>Hủy</Button>
            <Button
              variant="danger"
              isLoading={submitting}
              onClick={handleDeleteDept}
              disabled={!!(deletingDept && deletingDept.majorCount > 0)}
            >
              Xóa
            </Button>
          </div>
        </div>
      </Modal>

      {/* Major Modal */}
      <Modal
        isOpen={showMajorModal}
        onClose={() => setShowMajorModal(false)}
        title={editingMajor ? `Sửa chuyên ngành${majorDepartment ? ` (${majorDepartment.name})` : ""}` : `Thêm chuyên ngành vào ${majorDepartment?.name || ""}`}
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Tên chuyên ngành *"
            value={majorForm.name}
            onChange={(e) => setMajorForm({ ...majorForm, name: e.target.value })}
            placeholder="VD: Công nghệ phần mềm"
          />
          <Input
            label="Mã chuyên ngành *"
            value={majorForm.code}
            onChange={(e) => setMajorForm({ ...majorForm, code: e.target.value.toUpperCase() })}
            placeholder="VD: CNPM"
          />
          <Textarea
            label="Mô tả"
            value={majorForm.description}
            onChange={(e) => setMajorForm({ ...majorForm, description: e.target.value })}
            placeholder="Mô tả về chuyên ngành (tùy chọn)"
            rows={3}
          />
          <div className="flex justify-end gap-3 pt-2">
            <Button variant="outline" onClick={() => setShowMajorModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleMajorSubmit}>
              {editingMajor ? "Lưu thay đổi" : "Tạo chuyên ngành"}
            </Button>
          </div>
        </div>
      </Modal>

      {/* Major Delete Modal */}
      <Modal
        isOpen={showMajorDeleteModal}
        onClose={() => setShowMajorDeleteModal(false)}
        title="Xóa chuyên ngành"
        size="sm"
      >
        <div className="space-y-4">
          <p className="text-sm text-gray-600">
            Bạn có chắc muốn xóa chuyên ngành <strong>{deletingMajor?.name}</strong> ({deletingMajor?.code})?
          </p>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowMajorDeleteModal(false)}>Hủy</Button>
            <Button variant="danger" isLoading={submitting} onClick={handleDeleteMajor}>
              Xóa
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}