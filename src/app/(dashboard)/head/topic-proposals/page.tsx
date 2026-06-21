"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import Select from "@/components/ui/Select";
import Input from "@/components/ui/Input";
import { TopicProposalResponse, TopicCategoryResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { useAuth } from "@/contexts/AuthContext";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle, XCircle, Eye, BookOpen } from "lucide-react";

export default function HeadTopicProposalsPage() {
  const { user } = useAuth();
  const [proposals, setProposals] = useState<TopicProposalResponse[]>([]);
  const [categories, setCategories] = useState<TopicCategoryResponse[]>([]);
  const [departments, setDepartments] = useState<{ id: string; name: string }[]>([]);
  const [majors, setMajors] = useState<{ id: string; name: string }[]>([]);
  const [lecturers, setLecturers] = useState<{ id: string; fullName: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("LECTURER_APPROVED");
  const [selectedProposal, setSelectedProposal] = useState<TopicProposalResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const { showToast } = useToast();

  const [approveForm, setApproveForm] = useState({
    lecturerId: "",
    topicCategoryId: "",
    departmentId: "",
    majorId: "",
    maxStudents: 3,
  });

  const load = () => {
    setLoading(true);
    const proposalUrl = filterStatus === "LECTURER_APPROVED"
      ? "/head/topic-proposals/lecturer-approved"
      : filterStatus
        ? `/head/topic-proposals?status=${filterStatus}`
        : "/head/topic-proposals";
    Promise.all([
      api.get(proposalUrl),
      api.get("/topic-categories"),
      api.get("/shared/departments"),
      api.get("/shared/majors"),
      api.get("/shared/lecturers"),
    ])
      .then(([proposalRes, catRes, deptRes, majorRes, lectRes]) => {
        const data = proposalRes?.data ?? [];
        setProposals(Array.isArray(data) ? data : []);
        const cats = catRes?.data ?? [];
        const depts = deptRes?.data ?? [];
        const majs = majorRes?.data ?? [];
        const lects = lectRes?.data ?? [];
        setCategories(Array.isArray(cats) ? cats : []);
        setDepartments(Array.isArray(depts) ? depts : []);
        setMajors(Array.isArray(majs) ? majs : []);
        setLecturers(Array.isArray(lects) ? lects : []);
      })
      .catch(() => showToast("error", "Không thể tải đề xuất"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  const openApprove = (proposal: TopicProposalResponse) => {
    setSelectedProposal(proposal);
    setApproveForm({
      lecturerId: proposal.suggestedLecturerId || "",
      topicCategoryId: proposal.topicCategoryId || "",
      departmentId: proposal.departmentId || "",
      majorId: proposal.majorId || "",
      maxStudents: proposal.maxStudents || 3,
    });
    setShowApproveModal(true);
  };

  const openReject = (proposal: TopicProposalResponse) => {
    setSelectedProposal(proposal);
    setRejectReason("");
    setShowRejectModal(true);
  };

  const handleApprove = async () => {
    if (!selectedProposal) return;
    if (!approveForm.lecturerId) {
      showToast("error", "Vui lòng chọn giảng viên hướng dẫn");
      return;
    }
    setActionId(selectedProposal.id);
    try {
      await api.put(`/head/topic-proposals/${selectedProposal.id}/approve`, {
        comment: "",
        lecturerId: approveForm.lecturerId,
        topicCategoryId: approveForm.topicCategoryId || undefined,
        departmentId: approveForm.departmentId || undefined,
        majorId: approveForm.majorId || undefined,
        maxStudents: approveForm.maxStudents,
      });
      showToast("success", "Đề tài đã được phê duyệt và tạo thành công!");
      setShowApproveModal(false);
      load();
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Thao tác thất bại.";
      showToast("error", msg);
    } finally {
      setActionId(null);
    }
  };

  const handleReject = async () => {
    if (!selectedProposal || !rejectReason.trim()) {
      showToast("error", "Vui lòng nhập lý do từ chối");
      return;
    }
    setActionId(selectedProposal.id);
    try {
      await api.put(`/head/topic-proposals/${selectedProposal.id}/reject`, { reason: rejectReason });
      showToast("success", "Đề xuất đã bị từ chối.");
      setShowRejectModal(false);
      setRejectReason("");
      load();
    } catch {
      showToast("error", "Thao tác thất bại.");
    } finally {
      setActionId(null);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Tên đề tài",
      render: (row: TopicProposalResponse) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="mt-0.5 text-xs text-gray-500">SV: {row.studentName}</p>
        </div>
      ),
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
      className: "w-48",
      render: (row: TopicProposalResponse) =>
        row.status === "LECTURER_APPROVED" ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => { setSelectedProposal(row); setShowDetailModal(true); }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="primary"
              isLoading={actionId === row.id}
              onClick={() => openApprove(row)}
            >
              <CheckCircle className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="danger"
              isLoading={actionId === row.id}
              onClick={() => openReject(row)}
            >
              <XCircle className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <Button size="sm" variant="ghost" onClick={() => { setSelectedProposal(row); setShowDetailModal(true); }}>
            Chi tiết
          </Button>
        ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Duyệt đề xuất (Trưởng bộ môn)</h1>
          <p className="text-sm text-gray-500">Phê duyệt cuối cùng và tạo đề tài cho sinh viên</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="LECTURER_APPROVED">GV đã duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Từ chối</option>
          <option value="">Tất cả</option>
        </select>
      </div>

      <DataTable columns={columns} data={proposals} loading={loading} rowKey="id" emptyMessage="Không có đề xuất nào" />

      {/* Detail Modal */}
      <Modal isOpen={showDetailModal} onClose={() => setShowDetailModal(false)} title="Chi tiết đề xuất" size="lg">
        {selectedProposal && (
          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <h3 className="text-lg font-bold text-gray-900">{selectedProposal.title}</h3>
              <StatusBadge status={selectedProposal.status} />
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div><span className="font-medium text-gray-500">Sinh viên:</span> {selectedProposal.studentName}</div>
              <div><span className="font-medium text-gray-500">Ngày tạo:</span> {format(new Date(selectedProposal.createdAt), "dd/MM/yyyy", { locale: vi })}</div>
              {selectedProposal.suggestedLecturerName && (
                <div><span className="font-medium text-gray-500">GV đề xuất:</span> {selectedProposal.suggestedLecturerName}</div>
              )}
              {selectedProposal.topicCategoryName && (
                <div><span className="font-medium text-gray-500">Danh mục:</span> {selectedProposal.topicCategoryName}</div>
              )}
            </div>
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
            {selectedProposal.status === "REJECTED" &&
              (selectedProposal.reason || selectedProposal.rejectReason || selectedProposal.rejectionReason) && (
                <div className="rounded-lg border border-red-200 bg-red-50 p-3">
                  <label className="text-xs font-semibold text-red-700">Lý do từ chối</label>
                  <p className="mt-1 text-sm text-red-900">
                    {selectedProposal.reason || selectedProposal.rejectReason || selectedProposal.rejectionReason}
                  </p>
                  {(selectedProposal.reviewedByName || selectedProposal.reviewedAt) && (
                    <p className="mt-1 text-xs text-red-600">
                      Bởi: {selectedProposal.reviewedByName || "—"}
                      {selectedProposal.reviewedAt && ` • ${format(new Date(selectedProposal.reviewedAt), "dd/MM/yyyy HH:mm", { locale: vi })}`}
                    </p>
                  )}
                </div>
              )}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
              {selectedProposal.status === "LECTURER_APPROVED" && (
                <>
                  <Button variant="danger" onClick={() => { setShowDetailModal(false); openReject(selectedProposal); }}>
                    Từ chối
                  </Button>
                  <Button onClick={() => { setShowDetailModal(false); openApprove(selectedProposal); }}>
                    Duyệt &amp; Tạo đề tài
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* Approve Modal */}
      <Modal isOpen={showApproveModal} onClose={() => setShowApproveModal(false)} title="Phê duyệt &amp; Tạo đề tài" size="lg">
        {selectedProposal && (
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-3">
              <p className="font-medium text-blue-900">{selectedProposal.title}</p>
              <p className="mt-1 text-sm text-blue-700">Sinh viên: {selectedProposal.studentName}</p>
            </div>
            <Select
              label="Giảng viên hướng dẫn *"
              value={approveForm.lecturerId}
              onChange={(e) => setApproveForm({ ...approveForm, lecturerId: e.target.value })}
              options={lecturers.map((l) => ({ value: l.id, label: l.fullName }))}
              placeholder="Chọn giảng viên"
            />
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Danh mục"
                value={approveForm.topicCategoryId}
                onChange={(e) => setApproveForm({ ...approveForm, topicCategoryId: e.target.value })}
                options={categories.map((c) => ({ value: c.id, label: c.name }))}
                placeholder="Chọn danh mục"
              />
              <Select
                label="Bộ môn"
                value={approveForm.departmentId}
                onChange={(e) => setApproveForm({ ...approveForm, departmentId: e.target.value })}
                options={departments.map((d) => ({ value: d.id, label: d.name }))}
                placeholder="Chọn bộ môn"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Select
                label="Ngành"
                value={approveForm.majorId}
                onChange={(e) => setApproveForm({ ...approveForm, majorId: e.target.value })}
                options={majors.map((m) => ({ value: m.id, label: m.name }))}
                placeholder="Chọn ngành"
              />
              <Input
                label="Số SV tối đa"
                type="number"
                min={1}
                max={10}
                value={approveForm.maxStudents}
                onChange={(e) => setApproveForm({ ...approveForm, maxStudents: Number(e.target.value) })}
              />
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowApproveModal(false)}>Hủy</Button>
              <Button isLoading={!!actionId} onClick={handleApprove}>
                <CheckCircle className="h-4 w-4" />
                Phê duyệt &amp; Tạo đề tài
              </Button>
            </div>
          </div>
        )}
      </Modal>

      {/* Reject Modal */}
      <Modal isOpen={showRejectModal} onClose={() => setShowRejectModal(false)} title="Từ chối đề xuất" size="sm">
        <div className="space-y-4">
          <p className="text-sm text-gray-600">Vui lòng nhập lý do từ chối đề xuất.</p>
          <Textarea
            label="Lý do từ chối *"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowRejectModal(false)}>Hủy</Button>
            <Button variant="danger" isLoading={!!actionId} onClick={handleReject}>Xác nhận từ chối</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
