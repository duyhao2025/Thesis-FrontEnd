"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import DataTable from "@/components/ui/DataTable";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import { useToast } from "@/components/ui/Toast";
import {
  GaleShapleyPreview,
  LecturerWorkload,
  MatchingItem,
  TopicResponse,
} from "@/types/entities";
import {
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Briefcase,
  Shuffle,
  RotateCw,
} from "lucide-react";

export default function HeadAssignmentsPage() {
  const { showToast } = useToast();
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [workload, setWorkload] = useState<LecturerWorkload[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [maxPerLecturer, setMaxPerLecturer] = useState<number>(5);
  const [preview, setPreview] = useState<GaleShapleyPreview | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [running, setRunning] = useState(false);
  const [committing, setCommitting] = useState(false);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [topicsRes, workloadRes] = await Promise.all([
        api.get("/topics?status=PENDING_ASSIGNMENT").catch(() => ({ data: [] })),
        api.get("/assignments/workload").catch(() => ({ data: [] })),
      ]);
      const allPending = topicsRes.data || [];
      const assignedIds = new Set<string>();
      (workloadRes.data || []).forEach((w: LecturerWorkload) =>
        w.topics.forEach((t) => assignedIds.add(t.topicId))
      );
      setTopics(
        allPending.filter((t: TopicResponse) => !assignedIds.has(t.id))
      );
      setWorkload(workloadRes.data || []);
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
        : new Set(topics.map((t) => t.id))
    );
  };

  const handleRun = async () => {
    if (selected.size === 0) {
      showToast("warning", "Vui lòng chọn ít nhất một đề tài.");
      return;
    }
    setRunning(true);
    try {
      const res = await api.post("/assignments/gale-shapley/preview", {
        topicIds: Array.from(selected),
        maxTopicsPerLecturer: maxPerLecturer,
      });
      setPreview(res.data);
      setShowPreviewModal(true);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Không thể chạy thuật toán."
      );
    } finally {
      setRunning(false);
    }
  };

  const handleCommit = async () => {
    if (!preview) return;
    setCommitting(true);
    try {
      await api.post("/assignments/gale-shapley/commit", {
        matchings: preview.matchings,
      });
      showToast(
        "success",
        `Đã phân công thành công ${preview.matchings.length} đề tài.`
      );
      setShowPreviewModal(false);
      setPreview(null);
      setSelected(new Set());
      loadData();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Xác nhận phân công thất bại."
      );
    } finally {
      setCommitting(false);
    }
  };

  const workloadLookup = useMemo(() => {
    const map = new Map<string, LecturerWorkload>();
    workload.forEach((w) => map.set(w.lecturerId, w));
    return map;
  }, [workload]);

  const topicColumns = [
    {
      key: "select",
      header: "",
      className: "w-12",
      render: (t: TopicResponse) => (
        <input
          type="checkbox"
          checked={selected.has(t.id)}
          onChange={() => toggleTopic(t.id)}
          className="h-4 w-4 rounded border-gray-300 text-amber-600 focus:ring-amber-500"
        />
      ),
    },
    {
      key: "title",
      header: "Tên đề tài",
      render: (t: TopicResponse) => (
        <span className="font-medium text-gray-900">{t.title}</span>
      ),
    },
    {
      key: "lecturerName",
      header: "GV đề xuất",
      render: (t: TopicResponse) => (
        <span className="text-gray-700">{t.lecturerName || "—"}</span>
      ),
    },
    {
      key: "departmentName",
      header: "Khoa / Ngành",
      render: (t: TopicResponse) => (
        <div className="text-xs">
          <div className="text-gray-800">{t.departmentName || "—"}</div>
          <div className="text-gray-500">{t.majorName || "—"}</div>
        </div>
      ),
    },
  ];

  const workloadColumns = [
    {
      key: "lecturerFullName",
      header: "Giảng viên",
      render: (w: LecturerWorkload) => (
        <div>
          <div className="font-medium text-gray-900">{w.lecturerFullName}</div>
          <div className="text-xs text-gray-500">{w.lecturerEmail}</div>
        </div>
      ),
    },
    {
      key: "assignedCount",
      header: "Số đề tài",
      render: (w: LecturerWorkload) => (
        <span className="inline-flex items-center rounded-full bg-amber-100 px-2.5 py-0.5 text-sm font-semibold text-amber-700">
          {w.assignedCount}
        </span>
      ),
    },
    {
      key: "topics",
      header: "Đề tài đang phụ trách",
      render: (w: LecturerWorkload) =>
        w.topics.length === 0 ? (
          <span className="text-gray-400">—</span>
        ) : (
          <div className="text-xs text-gray-600">
            {w.topics
              .slice(0, 2)
              .map((t) => t.topicTitle)
              .join(", ")}
            {w.topics.length > 2 && ` +${w.topics.length - 2}`}
          </div>
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
      render: (m: MatchingItem) => {
        const w = workloadLookup.get(m.lecturerId);
        const currentCount = w?.assignedCount ?? 0;
        return (
          <div>
            <div className="font-medium text-gray-900">
              {m.lecturerFullName}
            </div>
            <div className="text-xs text-gray-500">
              Hiện tại: {currentCount} → Sau: {m.workloadAfter}
            </div>
          </div>
        );
      },
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
          <h1 className="text-xl font-bold text-gray-900">
            Phân công giảng viên
          </h1>
          <p className="text-sm text-gray-500">
            Phân công giảng viên hướng dẫn cho các đề tài đã duyệt theo thuật
            toán Gale-Shapley
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

      <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
        <div className="flex items-start gap-3">
          <Shuffle className="h-5 w-5 flex-shrink-0 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <p className="font-medium">Thuật toán Gale-Shapley (Deferred Acceptance)</p>
            <p className="mt-1 text-xs">
              Mỗi đề tài &quot;propose&quot; đến giảng viên đang có ít đề tài nhất.
              Giảng viên sẽ giữ lại đề tài có độ ưu tiên cao nhất (theo priority
              đăng ký và thời gian nộp). Kết quả là một matching ổn định và cân
              bằng tải.
            </p>
          </div>
        </div>
      </div>

      <Card
        title={
          <div className="flex items-center justify-between">
            <span>
              Đề tài PENDING_ASSIGNMENT chưa phân công ({topics.length})
            </span>
            {topics.length > 0 && (
              <button
                onClick={toggleAll}
                className="text-xs text-amber-600 hover:underline"
              >
                {selected.size === topics.length
                  ? "Bỏ chọn tất cả"
                  : "Chọn tất cả"}
              </button>
            )}
          </div>
        }
      >
        <DataTable
          columns={topicColumns}
          data={topics}
          loading={loading}
          rowKey="id"
          emptyMessage="Không có đề tài nào đang chờ phân công."
        />
      </Card>

      <Card
        title={
          <div className="flex items-center gap-2">
            <Briefcase className="h-4 w-4 text-amber-600" />
            <span>Khối lượng công việc hiện tại của giảng viên</span>
          </div>
        }
      >
        <DataTable
          columns={workloadColumns}
          data={workload}
          loading={loading}
          rowKey="lecturerId"
          emptyMessage="Chưa có dữ liệu phân công."
        />
      </Card>

      <Modal
        isOpen={showPreviewModal}
        onClose={() => setShowPreviewModal(false)}
        title="Kết quả thuật toán Gale-Shapley"
        size="xl"
      >
        {preview && (
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-lg bg-green-50 p-3 text-center">
                <CheckCircle2 className="mx-auto mb-1 h-5 w-5 text-green-600" />
                <p className="text-2xl font-bold text-green-700">
                  {preview.matchings.length}
                </p>
                <p className="text-xs text-green-700">Đề tài được phân công</p>
              </div>
              <div className="rounded-lg bg-amber-50 p-3 text-center">
                <AlertCircle className="mx-auto mb-1 h-5 w-5 text-amber-600" />
                <p className="text-2xl font-bold text-amber-700">
                  {preview.unmatched.length}
                </p>
                <p className="text-xs text-amber-700">Đề tài chưa ghép</p>
              </div>
              <div className="rounded-lg bg-blue-50 p-3 text-center">
                <Sparkles className="mx-auto mb-1 h-5 w-5 text-blue-600" />
                <p className="text-2xl font-bold text-blue-700">
                  {new Set(preview.matchings.map((m) => m.lecturerId)).size}
                </p>
                <p className="text-xs text-blue-700">GV được sử dụng</p>
              </div>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-gray-900">
                Kết quả ghép cặp
              </h4>
              <DataTable
                columns={matchingColumns}
                data={preview.matchings}
                rowKey="topicId"
                emptyMessage="Không có kết quả."
              />
            </div>

            {preview.unmatched.length > 0 && (
              <div className="rounded-lg border border-amber-200 bg-amber-50 p-3">
                <p className="text-sm font-medium text-amber-800">
                  Đề tài chưa ghép được:
                </p>
                <ul className="mt-2 space-y-1 text-sm text-amber-700">
                  {preview.unmatched.map((u) => (
                    <li key={u.topicId}>
                      <span className="font-medium">{u.topicTitle}</span> —{" "}
                      <span className="text-xs">{u.reason}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowPreviewModal(false)}
              >
                Hủy
              </Button>
              <Button
                isLoading={committing}
                disabled={preview.matchings.length === 0}
                onClick={handleCommit}
              >
                <CheckCircle2 className="h-4 w-4" />
                Xác nhận phân công ({preview.matchings.length})
              </Button>
            </div>
          </div>
        )}
      </Modal>

      <div className="mt-4 max-w-xs">
        <Input
          type="number"
          label="Giới hạn đề tài/giảng viên"
          value={maxPerLecturer}
          onChange={(e) =>
            setMaxPerLecturer(Math.max(1, Number(e.target.value) || 1))
          }
          min={1}
          max={20}
          helperText="Mặc định: 5. Dùng khi chạy thuật toán."
        />
      </div>
    </div>
  );
}
