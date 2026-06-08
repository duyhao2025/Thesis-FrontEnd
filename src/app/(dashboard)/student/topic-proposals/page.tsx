"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import { TopicProposalResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, FileText, Pencil, Trash2 } from "lucide-react";

export default function TopicProposalsPage() {
  const [proposals, setProposals] = useState<TopicProposalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [selectedProposal, setSelectedProposal] = useState<TopicProposalResponse | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [filterStatus, setFilterStatus] = useState("");
  const { showToast } = useToast();

  const [form, setForm] = useState({
    title: "",
    description: "",
    objective: "",
    scope: "",
    suggestedLecturerId: "",
  });

  const loadProposals = () => {
    setLoading(true);
    api.get("/topic-proposals/my")
      .then((res) => setProposals(res.data || []))
      .catch(() => showToast("error", "Không thể tải danh sách đề xuất"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProposals(); }, []);

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
    setSubmitting(true);
    try {
      await api.post("/topic-proposals", form);
      showToast("success", "Gửi đề xuất thành công!");
      setShowModal(false);
      setForm({ title: "", description: "", objective: "", scope: "", suggestedLecturerId: "" });
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
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Tạo đề xuất
        </Button>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <FileText className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có đề xuất nào</p>
          <Button className="mt-4" size="sm" onClick={() => setShowModal(true)}>Tạo đề xuất đầu tiên</Button>
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
