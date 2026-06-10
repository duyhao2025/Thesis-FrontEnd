"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Textarea from "@/components/ui/Textarea";
import { TopicProposalResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { CheckCircle, XCircle, Eye } from "lucide-react";

export default function LecturerTopicProposalsPage() {
  const [proposals, setProposals] = useState<TopicProposalResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("");
  const [selectedProposal, setSelectedProposal] = useState<TopicProposalResponse | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [actionId, setActionId] = useState<string | null>(null);
  const { showToast } = useToast();

  const load = () => {
    setLoading(true);
    const url = filterStatus ? `/lecturer/topic-proposals?status=${filterStatus}` : "/lecturer/topic-proposals";
    api.get(url)
      .then((res) => setProposals(res.data || []))
      .catch(() => showToast("error", "Không thể tải đề xuất"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, [filterStatus]);

  const handleApprove = async (id: string) => {
    if (!confirm("Duyệt đề xuất này?")) return;
    setActionId(id);
    try {
      await api.put(`/lecturer/topic-proposals/${id}/approve`, { comment: "" });
      showToast("success", "Đề xuất đã được duyệt!");
      load();
    } catch {
      showToast("error", "Thao tác thất bại.");
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
      await api.put(`/lecturer/topic-proposals/${selectedProposal.id}/reject`, { reason: rejectReason });
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

  const openReject = (proposal: TopicProposalResponse) => {
    setSelectedProposal(proposal);
    setRejectReason("");
    setShowRejectModal(true);
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
        row.status === "PENDING" ? (
          <div className="flex gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setSelectedProposal(row);
                setShowDetailModal(true);
              }}
            >
              <Eye className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="primary"
              isLoading={actionId === row.id}
              onClick={() => handleApprove(row.id)}
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
          <h1 className="text-xl font-bold text-gray-900">Duyệt đề xuất</h1>
          <p className="text-sm text-gray-500">Xem và duyệt đề xuất đề tài từ sinh viên</p>
        </div>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tất cả</option>
          <option value="PENDING">Chờ duyệt</option>
          <option value="APPROVED">Đã duyệt</option>
          <option value="REJECTED">Từ chối</option>
        </select>
      </div>

      <DataTable columns={columns} data={proposals} loading={loading} rowKey="id" emptyMessage="Không có đề xuất nào" />

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
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowDetailModal(false)}>Đóng</Button>
              {selectedProposal.status === "PENDING" && (
                <>
                  <Button variant="danger" onClick={() => { setShowDetailModal(false); openReject(selectedProposal); }}>
                    Từ chối
                  </Button>
                  <Button onClick={() => { handleApprove(selectedProposal.id); setShowDetailModal(false); }}>
                    Duyệt
                  </Button>
                </>
              )}
            </div>
          </div>
        )}
      </Modal>

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
