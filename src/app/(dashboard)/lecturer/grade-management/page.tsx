"use client";

import { useEffect, useState, useMemo } from "react";
import api from "@/lib/api";
import {
  LecturerGradeManagementResponse,
  LecturerEvaluationItem,
  SendToStaffResponse,
} from "@/types/gradeManagement";
import {
  ClipboardCheck,
  Send,
  RefreshCcw,
  Calendar,
  Users,
  BookOpen,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  AlertCircle,
} from "lucide-react";

type TabKey = "drafts" | "submitted";

export default function LecturerGradeManagementPage() {
  const [data, setData] = useState<LecturerGradeManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<TabKey>("drafts");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<LecturerGradeManagementResponse>(
        "/evaluations/grade-management"
      );
      setData(res.data);
      setSelected(new Set());
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Không thể tải danh sách điểm.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const items = useMemo<LecturerEvaluationItem[]>(() => {
    if (!data) return [];
    return activeTab === "drafts" ? data.drafts : data.submittedToStaff;
  }, [data, activeTab]);

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selected.size === items.length) setSelected(new Set());
    else setSelected(new Set(items.map((i) => i.evaluationId)));
  };

  const handleSend = async () => {
    if (selected.size === 0) {
      alert("Vui lòng chọn ít nhất 1 điểm để gửi về nhân viên khoa.");
      return;
    }
    if (!confirm(`Gửi ${selected.size} bảng điểm về nhân viên khoa?`)) return;

    try {
      setSending(true);
      const res = await api.post<SendToStaffResponse>(
        "/evaluations/grade-management/send-to-staff",
        { evaluationIds: Array.from(selected) }
      );
      const parts: string[] = [`Đã gửi ${res.data.sent} bảng điểm.`];
      if (res.data.skipped > 0) {
        parts.push(`Bỏ qua ${res.data.skipped}: ${res.data.skippedReasons.slice(0, 3).join("; ")}`);
      }
      alert(parts.join("\n"));
      await fetchData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "Gửi thất bại.");
    } finally {
      setSending(false);
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "InProgress":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
            <Clock className="h-3 w-3" /> Bản nháp
          </span>
        );
      case "SubmittedToStaff":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
            <Send className="h-3 w-3" /> Đã gửi Staff
          </span>
        );
      case "SentToStudent":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
            <CheckCircle2 className="h-3 w-3" /> Đã gửi SV
          </span>
        );
      case "Completed":
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            <CheckCircle2 className="h-3 w-3" /> Hoàn tất
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
            {status}
          </span>
        );
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Quản lý điểm</h1>
          <p className="mt-1 text-sm text-gray-500">
            Lưu nháp các bảng điểm trên trang Chấm điểm, sau đó gửi về nhân viên khoa tại đây.
          </p>
        </div>
        <button
          onClick={fetchData}
          className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <RefreshCcw className="h-4 w-4" /> Làm mới
        </button>
      </div>

      {error && (
        <div className="flex items-start gap-2 rounded-lg bg-red-50 p-4 text-sm text-red-600">
          <AlertCircle className="h-4 w-4 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Bản nháp</p>
          <p className="mt-1 text-2xl font-bold text-yellow-600">
            {data?.draftsCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-gray-500">Có thể chỉnh sửa & gửi Staff</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Đã gửi Staff</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">
            {data?.submittedCount ?? 0}
          </p>
          <p className="mt-1 text-xs text-gray-500">Đang chờ nhân viên khoa xử lý</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Đã chọn</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{selected.size}</p>
          <p className="mt-1 text-xs text-gray-500">Để gửi hàng loạt về Staff</p>
        </div>
      </div>

      {/* Tabs + bulk actions */}
      <div className="rounded-xl border border-gray-200 bg-white">
        <div className="flex items-center justify-between border-b border-gray-200 px-4 py-3">
          <div className="flex gap-1">
            <button
              onClick={() => {
                setActiveTab("drafts");
                setSelected(new Set());
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeTab === "drafts"
                  ? "bg-yellow-100 text-yellow-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Bản nháp ({data?.draftsCount ?? 0})
            </button>
            <button
              onClick={() => {
                setActiveTab("submitted");
                setSelected(new Set());
              }}
              className={`rounded-lg px-3 py-1.5 text-sm font-medium ${
                activeTab === "submitted"
                  ? "bg-blue-100 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100"
              }`}
            >
              Đã gửi ({data?.submittedCount ?? 0})
            </button>
          </div>
          <div className="flex items-center gap-2">
            {activeTab === "drafts" && items.length > 0 && (
              <>
                <button
                  onClick={toggleSelectAll}
                  className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                >
                  {selected.size === items.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                </button>
                <button
                  onClick={handleSend}
                  disabled={sending || selected.size === 0}
                  className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                  {sending ? "Đang gửi..." : `Gửi Staff (${selected.size})`}
                </button>
              </>
            )}
          </div>
        </div>

        {/* List */}
        {items.length === 0 ? (
          <div className="px-4 py-12 text-center text-gray-500">
            <ClipboardCheck className="mx-auto h-10 w-10 text-gray-300" />
            <p className="mt-3 text-sm">
              {activeTab === "drafts"
                ? "Chưa có bản nháp nào. Vào trang Chấm điểm để lưu điểm."
                : "Chưa có bảng điểm nào được gửi Staff."}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((item) => {
              const isExpanded = expandedId === item.evaluationId;
              const isChecked = selected.has(item.evaluationId);
              const canSelect = activeTab === "drafts" && item.status === "InProgress";
              return (
                <div key={item.evaluationId} className="px-4 py-3">
                  <div className="flex items-start gap-3">
                    {canSelect && (
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => toggleSelect(item.evaluationId)}
                        className="mt-1 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0 flex-1">
                          <h3 className="font-medium text-gray-900 truncate">
                            {item.topicTitle}
                          </h3>
                          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500">
                            <span className="inline-flex items-center gap-1">
                              <Users className="h-3.5 w-3.5" />
                              {item.studentGroupName}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <BookOpen className="h-3.5 w-3.5" />
                              {item.councilName}
                            </span>
                            <span className="inline-flex items-center gap-1">
                              <Calendar className="h-3.5 w-3.5" />
                              {new Date(item.defenseDate).toLocaleDateString("vi-VN")}
                            </span>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                          {getStatusBadge(item.status)}
                          <p className="text-lg font-bold text-blue-600">
                            {item.totalScore.toFixed(2)} / 10
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => setExpandedId(isExpanded ? null : item.evaluationId)}
                        className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-gray-500 hover:text-gray-700"
                      >
                        {isExpanded ? (
                          <ChevronDown className="h-3.5 w-3.5" />
                        ) : (
                          <ChevronRight className="h-3.5 w-3.5" />
                        )}
                        {isExpanded ? "Ẩn chi tiết" : "Xem chi tiết"}
                      </button>
                      {isExpanded && (
                        <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
                          <h4 className="text-xs font-semibold uppercase text-gray-500">
                            Điểm chi tiết
                          </h4>
                          <div className="mt-2 overflow-x-auto">
                            <table className="w-full text-sm">
                              <thead className="text-left text-xs text-gray-500">
                                <tr>
                                  <th className="py-1 pr-3 font-medium">Tiêu chí</th>
                                  <th className="py-1 pr-3 font-medium">Trọng số</th>
                                  <th className="py-1 pr-3 font-medium">Tối đa</th>
                                  <th className="py-1 pr-3 font-medium">Điểm</th>
                                  <th className="py-1 font-medium">Có trọng số</th>
                                </tr>
                              </thead>
                              <tbody className="divide-y divide-gray-200">
                                {item.scores.map((s) => {
                                  const weighted =
                                    s.maxScore > 0
                                      ? (s.score / s.maxScore) * s.weight * 10
                                      : 0;
                                  return (
                                    <tr key={s.criteriaId}>
                                      <td className="py-1.5 pr-3 text-gray-900">
                                        {s.criteriaName}
                                      </td>
                                      <td className="py-1.5 pr-3 text-gray-600">
                                        {(s.weight * 100).toFixed(0)}%
                                      </td>
                                      <td className="py-1.5 pr-3 text-gray-600">
                                        {s.maxScore}
                                      </td>
                                      <td className="py-1.5 pr-3 font-medium text-gray-900">
                                        {s.score.toFixed(2)}
                                      </td>
                                      <td className="py-1.5 font-medium text-blue-600">
                                        {weighted.toFixed(2)}
                                      </td>
                                    </tr>
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                          {item.comment && (
                            <div className="mt-3">
                              <h4 className="text-xs font-semibold uppercase text-gray-500">
                                Nhận xét
                              </h4>
                              <p className="mt-1 text-sm text-gray-700">{item.comment}</p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}