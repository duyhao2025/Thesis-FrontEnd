"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  GaleShapleyPreview,
  MatchingItem,
} from "@/types/entities";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Shuffle,
  RotateCw,
  Building2,
  GraduationCap,
  ChevronDown,
  ChevronRight,
  History,
} from "lucide-react";

interface PendingTopic {
  topicId: string;
  title: string;
  description: string;
  lecturerId: string;
  lecturerName: string;
  maxStudents: number;
  currentStudents: number;
  categoryName: string;
  createdAt: string;
}

interface WorkloadTopicItem {
  topicId: string;
  topicTitle: string;
  assignedAt: string;
}

interface LecturerWorkload {
  lecturerId: string;
  lecturerFullName: string;
  lecturerEmail: string;
  assignedCount: number;
  topics: WorkloadTopicItem[];
}

interface MyContext {
  departmentName?: string;
  majorName?: string;
}

export default function StaffAssignmentsPage() {
  const { showToast } = useToast();
  const [topics, setTopics] = useState<PendingTopic[]>([]);
  const [workloads, setWorkloads] = useState<LecturerWorkload[]>([]);
  const [myCtx, setMyCtx] = useState<MyContext>({});
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maxPerLecturer, setMaxPerLecturer] = useState<number>(5);
  const [preview, setPreview] = useState<GaleShapleyPreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [running, setRunning] = useState(false);
  const [committing, setCommitting] = useState(false);

  const [expandedLecturer, setExpandedLecturer] = useState<string | null>(null);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyByLecturer, setHistoryByLecturer] = useState<Record<string, WorkloadTopicItem[]>>({});

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [pendingRes, ctxRes, workloadRes] = await Promise.all([
        api.get("/staff/assignments/pending-assignment").catch(() => ({ data: { topics: [] } })),
        api.get("/shared/me/context").catch(() => ({ data: {} })),
        api.get("/staff/workload").catch(() => ({ data: [] })),
      ]);
      setTopics(pendingRes.data?.topics || []);
      setMyCtx(ctxRes.data || {});
      setWorkloads(workloadRes.data || []);
    } catch {
      showToast("error", "Không thể tải dữ liệu phân công.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const toggleTopic = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === topics.length
        ? new Set()
        : new Set(topics.map((t) => t.topicId))
    );
  };

  const handleRun = async () => {
    if (selected.size === 0) {
      showToast("warning", "Vui lòng chọn ít nhất một đề tài.");
      return;
    }
    setRunning(true);
    try {
      const res = await api.post("/staff/assignments/gale-shapley/preview", {
        topicIds: Array.from(selected),
      });
      setPreview(res.data);
      setShowPreviewModal(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Không thể chạy thuật toán.");
    } finally {
      setRunning(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setCommitting(true);
    try {
      await api.post("/staff/assignments/gale-shapley/commit", {
        matchings: preview.matchings,
      });
      showToast(
        "success",
        `Đã phân công thành công ${preview.matchings.length} đề tài. Sau khi mở kỳ đăng ký, sinh viên Khoa/Chuyên ngành của bạn sẽ thấy đề tài này.`
      );
      setShowPreviewModal(false);
      setPreview(null);
      setSelected(new Set());
      setExpandedLecturer(null);
      setHistoryByLecturer({});
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Xác nhận phân công thất bại.");
    } finally {
      setCommitting(false);
    }
  };

  const toggleExpandLecturer = async (lecId: string) => {
    if (expandedLecturer === lecId) {
      setExpandedLecturer(null);
      return;
    }
    setExpandedLecturer(lecId);

    if (!historyByLecturer[lecId]) {
      setHistoryLoading(true);
      try {
        const res = await api.get(`/staff/workload/${lecId}/topics`);
        const items: WorkloadTopicItem[] = res.data?.topics || [];
        setHistoryByLecturer((prev) => ({ ...prev, [lecId]: items }));
      } catch {
        showToast("error", "Không thể tải lịch sử phân công.");
        setHistoryByLecturer((prev) => ({ ...prev, [lecId]: [] }));
      } finally {
        setHistoryLoading(false);
      }
    }
  };

  const topicColumns = [
    {
      key: "select",
      header: "",
      className: "w-12",
      render: (t: PendingTopic) => (
        <input
          type="checkbox"
          checked={selected.has(t.topicId)}
          onChange={() => toggleTopic(t.topicId)}
          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
      ),
    },
    {
      key: "title",
      header: "Tên đề tài",
      render: (t: PendingTopic) => (
        <span className="font-medium text-gray-900">{t.title}</span>
      ),
    },
    {
      key: "lecturerName",
      header: "GV đề xuất",
      render: (t: PendingTopic) => (
        <span className="text-gray-700">{t.lecturerName || "—"}</span>
      ),
    },
    {
      key: "categoryName",
      header: "Danh mục",
      render: (t: PendingTopic) => (
        <span className="text-gray-700">{t.categoryName || "—"}</span>
      ),
    },
  ];

  const matchingColumns = [
    {
      key: "topicTitle",
      header: "Đề tài",
      render: (m: MatchingItem) => (
        <span className="font-medium text-gray-900">{m.topicTitle}</span>
      ),
    },
    {
      key: "lecturerFullName",
      header: "Giảng viên được phân công",
      render: (m: MatchingItem) => (
        <div>
          <div className="font-medium text-gray-900">{m.lecturerFullName}</div>
          <div className="text-xs text-gray-500">Sau phân công: {m.workloadAfter} đề tài</div>
        </div>
      ),
    },
    {
      key: "priority",
      header: "Ưu tiên",
      render: (m: MatchingItem) => (
        <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700">
          #{m.priorityOrder}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Phân công giảng viên</h1>
          <p className="text-sm text-gray-500">
            Phân công giảng viên hướng dẫn bằng thuật toán Gale-Shapley cho các đề tài thuộc Khoa/Chuyên ngành của bạn
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={loadData}>
            <RotateCw className="h-4 w-4" />
            Tải lại
          </Button>
          <Button
            onClick={handleRun}
            isLoading={running}
            disabled={selected.size === 0}
          >
            <Sparkles className="h-4 w-4" />
            Chạy Gale-Shapley ({selected.size})
          </Button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-200 bg-blue-50/50 p-3 text-sm">
        <Building2 className="h-4 w-4 text-blue-600" />
        <span className="text-gray-600">Khoa:</span>
        <span className="font-medium text-gray-900">{myCtx.departmentName || "(Chưa phân)"}</span>
        <GraduationCap className="h-4 w-4 text-blue-600" />
        <span className="text-gray-600">Chuyên ngành:</span>
        <span className="font-medium text-gray-900">{myCtx.majorName || "(Chưa phân)"}</span>
        <span className="text-xs text-gray-500">· Thuật toán chỉ phân công giảng viên thuộc cùng Khoa/Chuyên ngành.</span>
      </div>

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Shuffle className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Thuật toán Gale-Shapley (Deferred Acceptance)</p>
            <p className="mt-1 text-xs">
              Mỗi đề tài &quot;propose&quot; đến giảng viên đang có ít đề tài nhất
              trong Khoa/Chuyên ngành của bạn. Kết quả là một matching ổn định,
              cân bằng tải. Sau khi phân công, đề tài sẽ chuyển sang trạng thái
              OPEN — sinh viên cùng Khoa/Chuyên ngành mới thấy được khi bạn mở kỳ đăng ký.
            </p>
          </div>
        </div>
      </div>

      <Card
        title={
          <div className="flex items-center justify-between">
            <span>Đề tài chờ phân công ({topics.length})</span>
            {topics.length > 0 && (
              <button onClick={toggleAll} className="text-xs text-amber-600 hover:underline">
                {selected.size === topics.length ? "Bỏ chọn tất cả" : "Chọn tất cả"}
              </button>
            )}
          </div>
        }
      >
        <DataTable
          columns={topicColumns}
          data={topics}
          loading={loading}
          rowKey="topicId"
          emptyMessage="Không có đề tài nào đang chờ phân công."
        />
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <History className="h-4 w-4 text-emerald-600" />
            <span>Lịch sử phân công — Giảng viên Khoa/Chuyên ngành</span>
            <span className="ml-2 rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-700">
              {workloads.length} giảng viên
            </span>
          </div>
        }
      >
        {workloads.length === 0 ? (
          <p className="py-6 text-center text-sm text-gray-500">
            Chưa có giảng viên nào thuộc Khoa/Chuyên ngành của bạn.
          </p>
        ) : (
          <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
            {workloads.map((w) => {
              const isOpen = expandedLecturer === w.lecturerId;
              const items = historyByLecturer[w.lecturerId];
              return (
                <div key={w.lecturerId}>
                  <button
                    type="button"
                    onClick={() => toggleExpandLecturer(w.lecturerId)}
                    className="flex w-full items-center justify-between px-4 py-3 text-left transition hover:bg-gray-50"
                  >
                    <div className="flex items-center gap-3">
                      {isOpen ? (
                        <ChevronDown className="h-4 w-4 text-gray-500" />
                      ) : (
                        <ChevronRight className="h-4 w-4 text-gray-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium text-gray-900">{w.lecturerFullName}</p>
                        <p className="text-xs text-gray-500">{w.lecturerEmail}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span
                        className={
                          w.assignedCount === 0
                            ? "rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600"
                            : "inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-700"
                        }
                      >
                        {w.assignedCount} đề tài
                      </span>
                      {w.assignedCount > 0 && (
                        <span className="text-xs text-emerald-600">Xem lịch sử</span>
                      )}
                    </div>
                  </button>
                  {isOpen && (
                    <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
                      {historyLoading && !items ? (
                        <p className="text-xs text-gray-500">Đang tải...</p>
                      ) : items && items.length === 0 ? (
                        <p className="text-xs text-gray-500">
                          Giảng viên này chưa được phân công đề tài nào.
                        </p>
                      ) : items ? (
                        <ul className="space-y-2">
                          {items.map((t) => (
                            <li
                              key={t.topicId}
                              className="flex items-center justify-between rounded-md border border-gray-200 bg-white px-3 py-2 text-sm"
                            >
                              <span className="font-medium text-gray-800">{t.topicTitle}</span>
                              <span className="text-xs text-gray-500">
                                {t.assignedAt
                                  ? format(new Date(t.assignedAt), "dd/MM/yyyy HH:mm", { locale: vi })
                                  : ""}
                              </span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-amber-600" />
            <span>Lưu ý về phạm vi giảng viên</span>
          </div>
        }
      >
        <p className="text-sm text-gray-600">
          Chỉ giảng viên thuộc Khoa/Chuyên ngành mà bạn được phân sẽ tham gia Gale-Shapley
          và hiển thị trong mục &quot;Lịch sử phân công&quot; ở trên. Nếu danh sách rỗng,
          hãy liên hệ Admin để bổ sung giảng viên.
        </p>
      </Card>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Kết quả Gale-Shapley"
        size="xl"
      >
        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold text-green-700">{preview.matchings.length}</p>
                <p className="text-xs text-green-700">Đề tài được phân công</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <AlertCircle className="mx-auto mb-1 h-5 w-5 text-amber-600" />
                <p className="text-2xl font-bold text-amber-700">{preview.unmatched?.length || 0}</p>
                <p className="text-xs text-amber-700">Không phân công được</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <Building2 className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700">
                  {preview.lecturerWorkloadAfter ? Object.keys(preview.lecturerWorkloadAfter).length : 0}
                </p>
                <p className="text-xs text-blue-700">Giảng viên tham gia</p>
              </div>
            </div>

            <DataTable
              columns={matchingColumns}
              data={preview.matchings}
              rowKey="topicId"
              emptyMessage="Không có matching nào"
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowPreviewModal(false)}>Hủy</Button>
              <Button isLoading={committing} onClick={handleCommit}>
                Xác nhận phân công
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}