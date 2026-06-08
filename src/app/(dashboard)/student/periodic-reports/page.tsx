"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import Textarea from "@/components/ui/Textarea";
import Input from "@/components/ui/Input";
import { PeriodicReportResponse, ReportType } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { Plus, FileBarChart, Upload, AlertCircle } from "lucide-react";

const reportTypeLabels: Record<ReportType, string> = {
  Weekly: "Báo cáo 5 phút",
  Monthly: "Báo cáo 1 tháng",
  Quarterly: "Báo cáo 3 tháng",
  Semester: "Báo cáo kết thúc",
};

export default function PeriodicReportsPage() {
  const [reports, setReports] = useState<PeriodicReportResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const [form, setForm] = useState({
    topicId: "",
    reportType: "Monthly" as ReportType,
    fileUrl: "",
    description: "",
  });

  useEffect(() => {
    setLoading(false);
  }, []);

  const handleSubmit = async () => {
    if (!form.topicId) {
      showToast("error", "Vui lòng nhập Topic ID");
      return;
    }
    setSubmitting(true);
    try {
      await api.post("/reports", {
        topicId: form.topicId,
        reportType: form.reportType,
        fileUrl: form.fileUrl || "pending",
      });
      showToast("success", "Nộp báo cáo thành công!");
      setShowModal(false);
      setForm({ topicId: "", reportType: "Monthly", fileUrl: "", description: "" });
    } catch {
      showToast("error", "Nộp báo cáo thất bại.");
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "reportType",
      header: "Loại báo cáo",
      render: (row: PeriodicReportResponse) => (
        <span className="font-medium">{reportTypeLabels[row.reportType] || row.reportType}</span>
      ),
    },
    {
      key: "submittedAt",
      header: "Ngày nộp",
      render: (row: PeriodicReportResponse) =>
        row.submittedAt
          ? format(new Date(row.submittedAt), "dd/MM/yyyy HH:mm", { locale: vi })
          : "—",
    },
    {
      key: "fileUrl",
      header: "File",
      render: (row: PeriodicReportResponse) =>
        row.fileUrl && row.fileUrl !== "pending" ? (
          <a
            href={row.fileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-blue-600 hover:underline"
          >
            Xem file
          </a>
        ) : (
          <span className="text-gray-400">—</span>
        ),
    },
    {
      key: "lecturerFeedback",
      header: "Phản hồi",
      render: (row: PeriodicReportResponse) => (
        <span className={row.lecturerFeedback ? "text-green-600" : "text-gray-400"}>
          {row.lecturerFeedback || "Chưa có"}
        </span>
      ),
    },
    {
      key: "score",
      header: "Điểm",
      render: (row: PeriodicReportResponse) => (
        row.score != null ? <span className="font-semibold text-blue-600">{row.score}/10</span> : "—"
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Báo cáo định kỳ</h1>
          <p className="text-sm text-gray-500">Nộp báo cáo tiến độ theo đợt</p>
        </div>
        <Button onClick={() => setShowModal(true)}>
          <Plus className="h-4 w-4" />
          Nộp báo cáo
        </Button>
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 flex items-start gap-3">
        <AlertCircle className="h-5 w-5 flex-shrink-0 text-amber-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-amber-800">Lưu ý</p>
          <p className="mt-0.5 text-sm text-amber-700">
            Bạn cần có đề tài được duyệt trước khi nộp báo cáo. Nếu chưa có đề tài, vui lòng đăng ký hoặc đề xuất đề tài.
          </p>
        </div>
      </div>

      {reports.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <FileBarChart className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Chưa có báo cáo nào</p>
          <Button className="mt-4" size="sm" onClick={() => setShowModal(true)}>Nộp báo cáo đầu tiên</Button>
        </div>
      ) : (
        <DataTable columns={columns} data={reports} loading={loading} rowKey="id" />
      )}

      <Modal isOpen={showModal} onClose={() => setShowModal(false)} title="Nộp báo cáo định kỳ" size="md">
        <div className="space-y-4">
          <Input
            label="Topic ID của bạn *"
            value={form.topicId}
            onChange={(e) => setForm({ ...form, topicId: e.target.value })}
            placeholder="Nhập ID đề tài đã được duyệt"
          />
          <Select
            label="Loại báo cáo"
            value={form.reportType}
            onChange={(e) => setForm({ ...form, reportType: e.target.value as ReportType })}
            options={[
              { value: "Weekly", label: "Báo cáo 5 phút" },
              { value: "Monthly", label: "Báo cáo 1 tháng" },
              { value: "Quarterly", label: "Báo cáo 3 tháng" },
              { value: "Semester", label: "Báo cáo kết thúc" },
            ]}
          />
          <Input
            label="Đường dẫn file báo cáo"
            value={form.fileUrl}
            onChange={(e) => setForm({ ...form, fileUrl: e.target.value })}
            placeholder="https://... (Google Drive, Dropbox...)"
            helperText="Upload file báo cáo (PDF/Word) lên Google Drive và dán link vào đây"
          />
          <Textarea
            label="Mô tả tóm tắt"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Tóm tắt nội dung báo cáo..."
            rows={3}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
            <Button isLoading={submitting} onClick={handleSubmit}>
              <Upload className="h-4 w-4" />
              Nộp báo cáo
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
