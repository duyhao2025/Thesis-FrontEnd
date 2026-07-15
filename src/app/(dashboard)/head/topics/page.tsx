"use client";

import { useEffect, useState, useCallback } from "react";
import api from "@/lib/api";
import { Search, BookMarked, X } from "lucide-react";
import ReadOnlyBadge from "@/components/head/ReadOnlyBadge";

interface TopicItem {
  id: string;
  title: string;
  status: string;
  lecturerName: string;
  maxStudents: number;
  currentStudents: number;
  createdAt: string;
}

interface Major {
  id: string;
  name: string;
  code: string;
}

const STATUS_OPTIONS = [
  { value: "",           label: "Tất cả trạng thái" },
  { value: "OPEN",       label: "Đang mở" },
  { value: "APPROVED",   label: "Đã duyệt" },
  { value: "INPROGRESS", label: "Đang thực hiện" },
  { value: "ARCHIVED",   label: "Lưu trữ" },
  { value: "CLOSED",     label: "Đã đóng" },
  { value: "REJECTED",   label: "Bị từ chối" },
  { value: "DRAFT",      label: "Bản nháp" },
  { value: "CANCELLED",  label: "Đã hủy" },
  { value: "PENDING",    label: "Chờ duyệt" },
];

const statusStyles: Record<string, string> = {
  OPEN:        "bg-blue-100 text-blue-700",
  APPROVED:    "bg-green-100 text-green-700",
  INPROGRESS:  "bg-amber-100 text-amber-700",
  ARCHIVED:    "bg-gray-100 text-gray-700",
  CLOSED:      "bg-gray-200 text-gray-700",
  REJECTED:    "bg-red-100 text-red-700",
  DRAFT:       "bg-gray-100 text-gray-600",
  CANCELLED:   "bg-red-100 text-red-700",
  PENDING:     "bg-yellow-100 text-yellow-800",
};

export default function HeadTopicsPage() {
  const [items, setItems] = useState<TopicItem[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(20);
  const [status, setStatus] = useState("");
  const [majorId, setMajorId] = useState("");
  const [search, setSearch] = useState("");
  const [majors, setMajors] = useState<Major[]>([]);
  const [loading, setLoading] = useState(true);
  const [selected, setSelected] = useState<TopicItem | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (status)  params.set("status", status);
      if (majorId) params.set("majorId", majorId);
      if (search)  params.set("search", search);
      params.set("page", page.toString());
      params.set("pageSize", pageSize.toString());
      const r = await api.get<{ items: TopicItem[]; total: number }>(`/head/topics?${params}`);
      setItems(r.data.items || []);
      setTotal(r.data.total || 0);
    } finally {
      setLoading(false);
    }
  }, [status, majorId, search, page, pageSize]);

  useEffect(() => {
    api.get<Major[]>("/head/departments/me/majors").then((r) => setMajors(r.data || []));
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const totalPages = Math.max(1, Math.ceil(total / pageSize));

  return (
    <div className="space-y-4">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Đề tài trong khoa</h1>
          <p className="mt-1 text-sm text-gray-500">
            Danh sách đề tài đang được quản lý trong khoa
          </p>
        </div>
        <ReadOnlyBadge />
      </div>

      <div className="rounded-xl border border-gray-200 bg-white p-4">
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Trạng thái</label>
            <select
              value={status}
              onChange={(e) => { setPage(1); setStatus(e.target.value); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Chuyên ngành</label>
            <select
              value={majorId}
              onChange={(e) => { setPage(1); setMajorId(e.target.value); }}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm"
            >
              <option value="">Tất cả chuyên ngành</option>
              {majors.map((m) => (
                <option key={m.id} value={m.id}>{m.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600">Tìm kiếm</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                value={search}
                onChange={(e) => { setPage(1); setSearch(e.target.value); }}
                placeholder="Tìm theo tên đề tài..."
                className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2 text-sm"
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 bg-white">
        {loading ? (
          <div className="flex h-64 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
          </div>
        ) : items.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-12 text-gray-500">
            <BookMarked className="h-10 w-10 text-gray-300" />
            <p className="text-sm">Không có đề tài nào khớp với bộ lọc.</p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-gray-50 text-left text-gray-500">
                    <th className="px-4 py-2 font-medium">Tên đề tài</th>
                    <th className="px-4 py-2 font-medium">GV hướng dẫn</th>
                    <th className="px-4 py-2 font-medium">Trạng thái</th>
                    <th className="px-4 py-2 text-right font-medium">SV</th>
                    <th className="px-4 py-2 text-right font-medium">Ngày tạo</th>
                    <th className="px-4 py-2 text-right font-medium">Chi tiết</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((t) => (
                    <tr key={t.id} className="border-b last:border-0 hover:bg-gray-50">
                      <td className="px-4 py-2 font-medium text-gray-900">{t.title}</td>
                      <td className="px-4 py-2 text-gray-700">{t.lecturerName}</td>
                      <td className="px-4 py-2">
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            statusStyles[t.status] || "bg-gray-100 text-gray-700"
                          }`}
                        >
                          {t.status}
                        </span>
                      </td>
                      <td className="px-4 py-2 text-right text-gray-700">
                        {t.currentStudents}/{t.maxStudents}
                      </td>
                      <td className="px-4 py-2 text-right text-gray-500 text-xs">
                        {new Date(t.createdAt).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="px-4 py-2 text-right">
                        <button
                          onClick={() => setSelected(t)}
                          className="text-xs font-medium text-blue-600 hover:text-blue-700"
                        >
                          Xem
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3 text-sm text-gray-600">
              <span>Tổng: {total} · Trang {page}/{totalPages}</span>
              <div className="flex gap-2">
                <button
                  disabled={page <= 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-30"
                >
                  Trước
                </button>
                <button
                  disabled={page >= totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="rounded border border-gray-300 px-3 py-1 hover:bg-gray-50 disabled:opacity-30"
                >
                  Sau
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50"
          onClick={() => setSelected(null)}
        >
          <div
            className="w-full max-w-lg rounded-xl bg-white p-6 shadow-lg m-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold">Chi tiết đề tài</h3>
              <button onClick={() => setSelected(null)}>
                <X className="h-5 w-5 text-gray-500" />
              </button>
            </div>
            <dl className="space-y-2 text-sm">
              <Row label="Tên đề tài" value={selected.title} />
              <Row label="GV hướng dẫn" value={selected.lecturerName} />
              <Row label="Trạng thái" value={selected.status} />
              <Row label="Số SV" value={`${selected.currentStudents}/${selected.maxStudents}`} />
              <Row label="Ngày tạo" value={new Date(selected.createdAt).toLocaleString("vi-VN")} />
            </dl>
          </div>
        </div>
      )}
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="grid grid-cols-3 border-b border-gray-100 pb-2 last:border-0">
      <dt className="text-gray-500">{label}</dt>
      <dd className="col-span-2 text-gray-900">{value}</dd>
    </div>
  );
}
