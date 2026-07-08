"use client";

import { useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import {
  StaffGradeManagementResponse,
  StaffLecturerGroup,
  StaffLecturerEvaluationsResponse,
  StaffEvaluationDetail,
  SendToStudentsResponse,
} from "@/types/gradeManagement";
import {
  Users,
  GraduationCap,
  RefreshCcw,
  ChevronDown,
  ChevronRight,
  Send,
  Download,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  Clock,
  Search,
} from "lucide-react";

function getStatusBadge(status: string) {
  switch (status) {
    case "SubmittedToStaff":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          <Clock className="h-3 w-3" /> Chờ gửi SV
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
    case "InProgress":
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2 py-0.5 text-xs font-medium text-yellow-700">
          <Clock className="h-3 w-3" /> Bản nháp
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
          {status}
        </span>
      );
  }
}

function csvEscape(value: string | number | undefined | null): string {
  if (value === undefined || value === null) return "";
  const str = String(value);
  if (/[",\n]/.test(str)) return `"${str.replace(/"/g, '""')}"`;
  return str;
}

function buildCsv(rows: (string | number)[][]): string {
  return rows.map((row) => row.map(csvEscape).join(",")).join("\n");
}

function downloadCsv(filename: string, csv: string) {
  // Add BOM so Excel reads UTF-8 correctly.
  const blob = new Blob(["\ufeff", csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export default function StaffGradeManagementPage() {
  const [data, setData] = useState<StaffGradeManagementResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState("");

  const [selectedLecturerId, setSelectedLecturerId] = useState<string | null>(null);
  const [detail, setDetail] = useState<StaffLecturerEvaluationsResponse | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [selectedEvalIds, setSelectedEvalIds] = useState<Set<string>>(new Set());
  const [sending, setSending] = useState(false);
  const [expandedEvalId, setExpandedEvalId] = useState<string | null>(null);

  const fetchList = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await api.get<StaffGradeManagementResponse>(
        "/staff/grade-management"
      );
      setData(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Không thể tải danh sách giảng viên.");
    } finally {
      setLoading(false);
    }
  };

  const fetchDetail = async (lecturerId: string) => {
    try {
      setDetailLoading(true);
      setError(null);
      setSelectedEvalIds(new Set());
      setExpandedEvalId(null);
      const res = await api.get<StaffLecturerEvaluationsResponse>(
        `/staff/grade-management/${lecturerId}`
      );
      setDetail(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      setError(e.response?.data?.message || "Không thể tải chi tiết giảng viên.");
      setDetail(null);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchList();
  }, []);

  useEffect(() => {
    if (selectedLecturerId) fetchDetail(selectedLecturerId);
    else setDetail(null);
  }, [selectedLecturerId]);

  const filteredGroups = useMemo<StaffLecturerGroup[]>(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    if (!q) return data.lecturerGroups;
    return data.lecturerGroups.filter(
      (g) =>
        g.lecturerFullName.toLowerCase().includes(q) ||
        (g.lecturerCode ?? "").toLowerCase().includes(q) ||
        g.email?.toLowerCase().includes(q) ||
        g.departmentName.toLowerCase().includes(q) ||
        g.majorName.toLowerCase().includes(q)
    );
  }, [data, search]);

  const toggleSelectEval = (id: string) => {
    setSelectedEvalIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleSelectAllEvals = () => {
    if (!detail) return;
    const submittable = detail.evaluations
      .filter((e) => e.status === "SubmittedToStaff" || e.status === "SentToStudent")
      .map((e) => e.evaluationId);
    if (selectedEvalIds.size === submittable.length) setSelectedEvalIds(new Set());
    else setSelectedEvalIds(new Set(submittable));
  };

  const handleSendToStudents = async () => {
    if (selectedEvalIds.size === 0) {
      alert("Vui lòng chọn ít nhất 1 bảng điểm để gửi về sinh viên.");
      return;
    }
    if (
      !confirm(
        `Gửi ${selectedEvalIds.size} bảng điểm về sinh viên? Điểm sẽ được công bố và sinh viên sẽ nhận thông báo.`
      )
    )
      return;

    try {
      setSending(true);
      const res = await api.post<SendToStudentsResponse>(
        "/staff/grade-management/send-to-students",
        { evaluationIds: Array.from(selectedEvalIds) }
      );
      const parts: string[] = [`Đã gửi ${res.data.sent} bảng điểm về sinh viên.`];
      if (res.data.skipped > 0) {
        parts.push(`Bỏ qua ${res.data.skipped}: ${res.data.skippedReasons.slice(0, 3).join("; ")}`);
      }
      alert(parts.join("\n"));
      if (selectedLecturerId) await fetchDetail(selectedLecturerId);
      await fetchList();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      alert(e.response?.data?.message || "Gửi thất bại.");
    } finally {
      setSending(false);
    }
  };

  const exportLecturerCsv = (lecturer: StaffLecturerGroup) => {
    const header: (string | number)[][] = [
      ["Giảng viên", lecturer.lecturerFullName],
      ["Mã GV", lecturer.lecturerCode ?? ""],
      ["Khoa", lecturer.departmentName],
      ["Ngành", lecturer.majorName],
      ["Email", lecturer.email ?? ""],
      [],
    ];
    const rows: (string | number)[][] = [
      ["Đề tài", "Trạng thái", "Tổng điểm / 10", "Ngày bảo vệ"],
      ...lecturer.evaluations.map((e) => [
        e.topicTitle,
        e.status,
        e.totalScore.toFixed(2),
        e.submittedAt ? new Date(e.submittedAt).toLocaleDateString("vi-VN") : "",
      ]),
    ];
    downloadCsv(
      `BangDiem_${(lecturer.lecturerCode || lecturer.lecturerFullName).replace(/\s+/g, "_")}.csv`,
      buildCsv([...header, ...rows])
    );
  };

  const exportDetailCsv = () => {
    if (!detail) return;
    const header: (string | number)[][] = [
      ["Giảng viên", detail.lecturerFullName],
      ["Mã GV", detail.lecturerCode ?? ""],
      ["Khoa", detail.departmentName],
      ["Ngành", detail.majorName],
      [],
    ];
    const rows: (string | number)[][] = [];
    detail.evaluations.forEach((e) => {
      rows.push([`Đề tài: ${e.topicTitle}`, `Trạng thái: ${e.status}`, `Tổng: ${e.totalScore.toFixed(2)} / 10`]);
      rows.push(["Sinh viên", e.studentNames.join("; ")]);
      rows.push(["Hội đồng", e.councilName, "Ngày bảo vệ", new Date(e.defenseDate).toLocaleDateString("vi-VN")]);
      rows.push([]);
      rows.push(["Tiêu chí", "Trọng số", "Tối đa", "Điểm", "Có trọng số", "Nhận xét"]);
      e.scores.forEach((s) => {
        rows.push([
          s.criteriaName,
          s.weight,
          s.maxScore,
          s.score.toFixed(2),
          s.weightedScore.toFixed(2),
          s.comment ?? "",
        ]);
      });
      rows.push([]);
      if (e.comment) {
        rows.push(["Nhận xét chung", e.comment]);
        rows.push([]);
      }
    });
    downloadCsv(
      `ChiTietDiem_${(detail.lecturerCode || detail.lecturerFullName).replace(/\s+/g, "_")}.csv`,
      buildCsv([...header, ...rows])
    );
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
          <h1 className="text-2xl font-bold text-gray-900">Quản lý điểm bảo vệ</h1>
          <p className="mt-1 text-sm text-gray-500">
            Chọn giảng viên để xem các bảng điểm đã được gửi về, sau đó gửi tới sinh viên hoặc xuất Excel.
          </p>
        </div>
        <button
          onClick={fetchList}
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
          <p className="text-xs uppercase tracking-wide text-gray-500">Giảng viên có điểm</p>
          <p className="mt-1 text-2xl font-bold text-blue-600">{data?.totalLecturers ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Tổng bảng điểm</p>
          <p className="mt-1 text-2xl font-bold text-gray-900">{data?.totalEvaluations ?? 0}</p>
        </div>
        <div className="rounded-xl border border-gray-200 bg-white p-4">
          <p className="text-xs uppercase tracking-wide text-gray-500">Đã chọn gửi SV</p>
          <p className="mt-1 text-2xl font-bold text-green-600">{selectedEvalIds.size}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        {/* Left: lecturer list */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-200 space-y-2">
            <h2 className="font-semibold text-gray-900">Giảng viên</h2>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Tìm theo tên, mã GV, email, khoa..."
                className="w-full rounded-lg border border-gray-300 pl-8 pr-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="divide-y divide-gray-100 max-h-[640px] overflow-y-auto">
            {filteredGroups.length === 0 ? (
              <div className="px-4 py-12 text-center text-gray-500">
                <Users className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-3 text-sm">Chưa có giảng viên nào gửi điểm về.</p>
              </div>
            ) : (
              filteredGroups.map((g) => {
                const isActive = selectedLecturerId === g.lecturerId;
                return (
                  <button
                    key={g.lecturerId}
                    onClick={() => setSelectedLecturerId(g.lecturerId)}
                    className={`w-full px-4 py-3 text-left transition-colors hover:bg-gray-50 ${
                      isActive ? "bg-blue-50 border-l-4 border-blue-600" : ""
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium text-gray-900 truncate">
                          {g.lecturerFullName}
                        </h3>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {g.lecturerCode ? `${g.lecturerCode} • ` : ""}
                          {g.majorName}
                        </p>
                        <p className="text-xs text-gray-400 mt-0.5 truncate">
                          {g.email}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-0.5 whitespace-nowrap text-xs">
                        {g.submittedEvaluationCount > 0 && (
                          <span className="rounded-full bg-blue-100 px-2 py-0.5 text-blue-700">
                            {g.submittedEvaluationCount} chờ gửi
                          </span>
                        )}
                        {g.sentToStudentCount > 0 && (
                          <span className="rounded-full bg-green-100 px-2 py-0.5 text-green-700">
                            {g.sentToStudentCount} đã gửi SV
                          </span>
                        )}
                      </div>
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        exportLecturerCsv(g);
                      }}
                      className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-blue-600 hover:text-blue-700"
                      title="Xuất Excel (CSV) danh sách đề tài của giảng viên"
                    >
                      <Download className="h-3 w-3" /> Xuất Excel
                    </button>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right: detail */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-200 overflow-hidden">
          {!selectedLecturerId ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <GraduationCap className="h-12 w-12 mb-4 text-gray-300" />
              <p>Chọn một giảng viên để xem chi tiết bảng điểm.</p>
            </div>
          ) : detailLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : detail ? (
            <>
              <div className="px-4 py-3 border-b border-gray-200 bg-gray-50 flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="font-semibold text-gray-900 truncate">
                    {detail.lecturerFullName}
                  </h2>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {detail.lecturerCode ? `${detail.lecturerCode} • ` : ""}
                    {detail.departmentName} • {detail.majorName}
                  </p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={exportDetailCsv}
                    className="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
                    title="Xuất toàn bộ chi tiết bảng điểm ra Excel (CSV)"
                  >
                    <FileSpreadsheet className="h-4 w-4" /> Xuất Excel
                  </button>
                  <button
                    onClick={toggleSelectAllEvals}
                    className="text-sm text-blue-600 hover:text-blue-700 font-medium"
                  >
                    {selectedEvalIds.size > 0 ? "Bỏ chọn tất cả" : "Chọn tất cả"}
                  </button>
                  <button
                    onClick={handleSendToStudents}
                    disabled={sending || selectedEvalIds.size === 0}
                    className="inline-flex items-center gap-2 rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <Send className="h-4 w-4" />
                    {sending ? "Đang gửi..." : `Gửi SV (${selectedEvalIds.size})`}
                  </button>
                </div>
              </div>

              {detail.evaluations.length === 0 ? (
                <div className="px-4 py-12 text-center text-gray-500">
                  <p className="text-sm">Giảng viên này chưa có bảng điểm nào được gửi về.</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-100 max-h-[640px] overflow-y-auto">
                  {detail.evaluations.map((ev: StaffEvaluationDetail) => {
                    const canSelect =
                      ev.status === "SubmittedToStaff" || ev.status === "SentToStudent";
                    const isExpanded = expandedEvalId === ev.evaluationId;
                    const isChecked = selectedEvalIds.has(ev.evaluationId);
                    return (
                      <div key={ev.evaluationId} className="px-4 py-3">
                        <div className="flex items-start gap-3">
                          {canSelect && (
                            <input
                              type="checkbox"
                              checked={isChecked}
                              onChange={() => toggleSelectEval(ev.evaluationId)}
                              className="mt-1 h-4 w-4 rounded border-gray-300 text-green-600 focus:ring-green-500"
                            />
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex items-start justify-between gap-3">
                              <div className="min-w-0 flex-1">
                                <h3 className="font-medium text-gray-900 truncate">
                                  {ev.topicTitle}
                                </h3>
                                <p className="text-xs text-gray-500 mt-0.5 truncate">
                                  SV: {ev.studentNames.join(", ") || "—"}
                                </p>
                                <p className="text-xs text-gray-400 mt-0.5">
                                  {ev.councilName} •{" "}
                                  {new Date(ev.defenseDate).toLocaleDateString("vi-VN")}
                                </p>
                              </div>
                              <div className="flex flex-col items-end gap-1 whitespace-nowrap">
                                {getStatusBadge(ev.status)}
                                <p className="text-lg font-bold text-blue-600">
                                  {ev.totalScore.toFixed(2)} / 10
                                </p>
                              </div>
                            </div>
                            <button
                              onClick={() =>
                                setExpandedEvalId(isExpanded ? null : ev.evaluationId)
                              }
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
                                <div className="overflow-x-auto">
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
                                      {ev.scores.map((s) => (
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
                                            {s.weightedScore.toFixed(2)}
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                                {ev.comment && (
                                  <div className="mt-3">
                                    <h4 className="text-xs font-semibold uppercase text-gray-500">
                                      Nhận xét
                                    </h4>
                                    <p className="mt-1 text-sm text-gray-700">{ev.comment}</p>
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
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}