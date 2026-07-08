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
import { TopicProposalResponse, TopicCategoryResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, FileText, Pencil, Building2, GraduationCap, UserCheck } from "lucide-react";

interface Lecturer {
  id: string;
  fullName: string;
  email: string;
  departmentId: string;
  majorId: string | null;
}

interface StudentContext {
  studentId: string;
  studentName: string;
  departmentId: string | null;
  departmentName: string | null;
  departmentCode: string | null;
  majorId: string | null;
  majorName: string | null;
  majorCode: string | null;
}

export default function TopicProposalsPage() {
  const [proposals, setProposals] = useState<TopicProposalResponse[]>([]);
  const [categories, setCategories] = useState<TopicCategoryResponse[]>([]);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<TopicProposalResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const [studentContext, setStudentContext] = useState<StudentContext | null>(null);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    objective: "",
    scope: "",
    suggestedLecturerId: "",
    topicCategoryId: "",
    maxStudents: 3,
  });

  const loadProposals = () => {
    setLoading(true);
    Promise.all([
      api.get("/student/topic-proposals/my"),
      api.get("/topic-categories"),
      api.get("/shared/me/context"),
    ]).then(([proposalRes, catRes, ctxRes]) => {
      setProposals(proposalRes.data || []);
      setCategories(catRes.data || []);
      setStudentContext(ctxRes.data || null);
    }).catch(() => showToast("error", "Không thể tải danh sách đề xuất"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProposals(); }, []);

  const openCreateModal = async () => {
    if (!studentContext?.departmentId) {
      showToast("error", "Tài khoản chưa được phân Khoa. Vui lòng liên hệ quản trị viên.");
      return;
    }
    setForm({
      title: "",
      description: "",
      objective: "",
      scope: "",
      suggestedLecturerId: "",
      topicCategoryId: "",
      maxStudents: 3,
    });
    setShowModal(true);
    // Load lecturers that match the student's department + major
    try {
      const params = new URLSearchParams();
      if (studentContext.departmentId) params.append("departmentId", studentContext.departmentId);
      if (studentContext.majorId) params.append("majorId", studentContext.majorId);
      const res = await api.get(`/shared/lecturers?${params.toString()}`);
      setLecturers(res.data || []);
    } catch {
      showToast("error", "Không thể tải danh sách giảng viên");
    }
  };

  const filtered = filterStatus
    ? proposals.filter((p) => p.status === filterStatus)
    : proposals;

  const openDetail = (proposal: TopicProposalResponse) => {
    setSelectedProposal(proposal);
    setShowDetailModal(true);
  };

  const handleSubmit = async () => {
    if (!form.title || form.description.length < 50) {
      showToast("error", "Vui lòng điền đầy đủ thông tin (mô tả tối thiểu 50 ký tự)");
      return;
    }
    if (!form.objective.trim() || !form.scope.trim()) {
      showToast("error", "Vui lòng điền đầy đủ thông tin (mục tiêu và phạm vi bắt buộc)");
      return;
    }
    if (!form.suggestedLecturerId) {
      showToast("error", "Vui lòng chọn Giảng viên đề xuất");
      return;
    }
    if (!studentContext?.departmentId) {
      showToast("error", "Tài khoản chưa được phân Khoa");
      return;
    }
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        title: form.title,
        description: form.description,
        objective: form.objective,
        scope: form.scope,
        maxStudents: form.maxStudents,
        suggestedLecturerId: form.suggestedLecturerId,
      };
      if (form.topicCategoryId) {
        payload.topicCategoryId = form.topicCategoryId;
      }
      await api.post("/student/topic-proposals", payload);
      showToast("success", "Gửi đề xuất thành công!");
      setShowModal(false);
      loadProposals();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Gửi đề xuất thất bại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Tên đề tài",
      render: (row: TopicProposalResponse) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    {
      key: "lecturer",
      header: "GV đề xuất",
      render: (row: TopicProposalResponse) =>
        row.suggestedLecturerName || <span className="text-gray-400">—</span>,
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (row: TopicProposalResponse) => <StatusBadge status={row.status} />,
    },
    {
      key: "createdAt",
      header: "Ngày tạo",
      render: (row: TopicProposalResponse) =>
        format(new Date(row.createdAt), "dd/MM/yyyy", { locale: vi }),
    },
    {
      key: "actions",
      header: "",
      className: "w-20",
      render: (row: TopicProposalResponse) =>
        row.status === "PENDING" && (
          <button
            onClick={(e) => { e.stopPropagation(); openDetail(row); }}
            className="rounded p-1 text-blue-600 hover:bg-blue-50"
          >
            <Pencil className="h-4 w-4" />
          </button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đề xuất đề tài</h1>
          <p className="text-sm text-gray-500">Gửi đề xuất đề tài mới cho giảng viên</p>
        </div>
        <Button onClick={openCreateModal} disabled={!studentContext?.departmentId}>
          <Plus className="h-4 w-4" />
          Tạo đề xuất
        </Button>
      </div>

      {studentContext && !studentContext.departmentId && (
        <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
          Tài khoản của bạn chưa được phân Khoa/Chuyên ngành. Vui lòng liên hệ quản trị viên để được phân công trước khi tạo đề xuất.
        </div>
      )}

      {filtered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <FileText className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có đề xuất nào</p>
          <Button className="mt-4" size="sm" onClick={openCreateModal}>Tạo đề xuất đầu tiên</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Tạo đề xuất đề tài" size="lg">
        <div className="space-y-4">
          <Input
            label="Tên đề tài *"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="VD: Hệ thống quản lý..."
          />
          <Textarea
            label="Mô tả * (tối thiểu 50 ký tự)"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Mô tả chi tiết về đề tài, phạm vi nghiên cứu..."
            rows={4}
          />
          <Textarea
            label="Mục tiêu"
            value={form.objective}
            onChange={(e) => setForm({ ...form, objective: e.target.value })}
            placeholder="Mục tiêu cần đạt được..."
            rows={2}
          />
          <Textarea
            label="Phạm vi"
            value={form.scope}
            onChange={(e) => setForm({ ...form, scope: e.target.value })}
            placeholder="Phạm vi thực hiện đề tài..."
            rows={2}
          />

          {/* Auto-filled student context: Khoa & Chuyên ngành do Admin phân */}
          <div className="rounded-lg border border-blue-200 bg-blue-50/50 p-4 space-y-2">
            <p className="text-xs font-medium text-blue-700">
              Thông tin phân công của bạn (do Admin cấp):
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2">
                <Building2 className="h-4 w-4 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Khoa</p>
                  <p className="truncate text-sm font-medium text-gray-900">
                    {studentContext?.departmentName
                      ? `${studentContext.departmentCode} - ${studentContext.departmentName}`
                      : "—"}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 rounded-md border border-blue-200 bg-white px-3 py-2">
                <GraduationCap className="h-4 w-4 text-blue-600" />
                <div className="min-w-0 flex-1">
                  <p className="text-xs text-gray-500">Chuyên ngành</p>
                  <p className="truncate text-sm font-medium text-gray-900">
                    {studentContext?.majorName
                      ? `${studentContext.majorCode} - ${studentContext.majorName}`
                      : <span className="text-gray-400">Chưa phân</span>}
                  </p>
                </div>
              </div>
            </div>
            <p className="text-xs text-gray-500">
              * Chỉ giảng viên thuộc <strong>Khoa {studentContext?.departmentName}</strong>
              {studentContext?.majorName && (
                <> và <strong>Chuyên ngành {studentContext.majorName}</strong></>
              )} mới hiển thị bên dưới.
            </p>
          </div>

          <Select
            label="Giảng viên đề xuất *"
            value={form.suggestedLecturerId}
            onChange={(e) => setForm({ ...form, suggestedLecturerId: e.target.value })}
            options={[
              { value: "", label: lecturers.length > 0 ? "Chọn giảng viên" : "Không có giảng viên phù hợp" },
              ...lecturers.map((l) => ({ value: l.id, label: `${l.fullName} (${l.email})` })),
            ]}
            disabled={lecturers.length === 0}
          />
          {lecturers.length === 0 && (
            <p className="text-xs text-amber-600">
              Hiện chưa có giảng viên nào thuộc Khoa/Chuyên ngành của bạn. Vui lòng liên hệ quản trị viên.
            </p>
          )}

          {categories.length > 0 && (
            <Select
              label="Danh mục đề tài"
              value={form.topicCategoryId}
              onChange={(e) => setForm({ ...form, topicCategoryId: e.target.value })}
              options={[{ value: "", label: "Chọn danh mục (không bắt buộc)" }, ...categories.map((c) => ({ value: c.id, label: c.name }))]}
            />
          )}
          <Select
            label="Số sinh viên tối đa trong nhóm"
            value={String(form.maxStudents)}
            onChange={(e) => setForm({ ...form, maxStudents: Number(e.target.value) })}
            options={[
              { value: "1", label: "1 sinh viên (cá nhân)" },
              { value: "2", label: "2 sinh viên" },
              { value: "3", label: "3 sinh viên" },
              { value: "4", label: "4 sinh viên" },
            ]}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>Gửi đề xuất</Button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết đề xuất" size="lg">
        {selectedProposal && (
          <div className="space-y-3">
            <div>
              <label className="text-xs font-medium text-gray-500">Tên đề tài</label>
              <p className="font-semibold text-gray-900">{selectedProposal.title}</p>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-500">Trạng thái</label>
              <div className="mt-1"><StatusBadge status={selectedProposal.status} /></div>
            </div>
            {selectedProposal.suggestedLecturerName && (
              <div>
                <label className="text-xs font-medium text-gray-500">Giảng viên đề xuất</label>
                <p className="text-sm text-gray-700 inline-flex items-center gap-1">
                  <UserCheck className="h-3.5 w-3.5" />
                  {selectedProposal.suggestedLecturerName}
                </p>
              </div>
            )}
            <div>
              <label className="text-xs font-medium text-gray-500">Mô tả</label>
              <p className="text-sm text-gray-700">{selectedProposal.description}</p>
            </div>
            {selectedProposal.objective && (
              <div>
                <label className="text-xs font-medium text-gray-500">Mục tiêu</label>
                <p className="text-sm text-gray-700">{selectedProposal.objective}</p>
              </div>
            )}
            {selectedProposal.scope && (
              <div>
                <label className="text-xs font-medium text-gray-500">Phạm vi</label>
                <p className="text-sm text-gray-700">{selectedProposal.scope}</p>
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