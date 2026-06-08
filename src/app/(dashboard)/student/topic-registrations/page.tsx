"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { TopicResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { Search, Filter, BookOpen } from "lucide-react";

export default function TopicRegistrationsPage() {
  const [topics, setTopics] = useState<TopicResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<TopicResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [priority, setPriority] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const { showToast } = useToast();

  const loadTopics = () => {
    setLoading(true);
    api.get("/topics").then((res) => {
      setTopics(res.data || []);
      const cats = Array.from(
        new Set((res.data || []).map((t: TopicResponse) => t.topicCategoryName))
      ).map((c) => ({ value: c as string, label: c as string }));
      setCategories(cats);
    }).catch(() => showToast("error", "Không thể tải danh sách đề tài"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTopics(); }, []);

  const filtered = topics.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.lecturerName.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || t.topicCategoryName === categoryFilter;
    return matchSearch && matchCat && t.status === "OPEN";
  });

  const handleRegister = (topic: TopicResponse) => {
    setSelectedTopic(topic);
    setShowModal(true);
  };

  const submitRegistration = async () => {
    if (!selectedTopic) return;
    setSubmitting(true);
    try {
      await api.post("/topic-registrations", { topicId: selectedTopic.id });
      showToast("success", "Đăng ký thành công!");
      setShowModal(false);
      loadTopics();
    } catch (err: unknown) {
      const message = (err as { response?: { data?: { message?: string } } })?.response?.data?.message || "Đăng ký thất bại. Vui lòng thử lại.";
      showToast("error", message);
    } finally {
      setSubmitting(false);
    }
  };

  const columns = [
    {
      key: "title",
      header: "Tên đề tài",
      render: (row: TopicResponse) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    { key: "lecturerName", header: "Giảng viên" },
    { key: "topicCategoryName", header: "Danh mục" },
    { key: "maxStudents", header: "Sĩ số", render: (r: TopicResponse) => `${r.currentStudents}/${r.maxStudents}` },
    { key: "status", header: "Trạng thái", render: (r: TopicResponse) => <StatusBadge status={r.status} /> },
    {
      key: "action",
      header: "",
      className: "w-24",
      render: (row: TopicResponse) =>
        row.status === "OPEN" ? (
          <Button size="sm" variant="outline" onClick={() => handleRegister(row)}>
            Đăng ký
          </Button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đăng ký đề tài</h1>
          <p className="text-sm text-gray-500">Danh sách đề tài đang mở đăng ký</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-64">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Tìm theo tên đề tài, giảng viên..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 py-2 pl-10 pr-4 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-400" />
          <Select
            options={categories}
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            placeholder="Tất cả danh mục"
          />
        </div>
      </div>

      {filtered.length === 0 && !loading ? (
        <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
          <BookOpen className="mb-3 h-12 w-12 text-gray-300" />
          <p className="text-gray-500">Không có đề tài nào phù hợp</p>
        </div>
      ) : (
        <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" />
      )}

      <Modal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Xác nhận đăng ký đề tài"
        size="md"
      >
        {selectedTopic && (
          <div className="space-y-4">
            <div className="rounded-lg bg-gray-50 p-4">
              <p className="font-semibold text-gray-900">{selectedTopic.title}</p>
              <p className="mt-1 text-sm text-gray-600">GV: {selectedTopic.lecturerName}</p>
              <p className="text-sm text-gray-600">Danh mục: {selectedTopic.topicCategoryName}</p>
            </div>

            <Select
              label="Thứ tự ưu tiên"
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              options={[
                { value: "1", label: "Ưu tiên 1" },
                { value: "2", label: "Ưu tiên 2" },
                { value: "3", label: "Ưu tiên 3" },
              ]}
            />

            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowModal(false)}>Hủy</Button>
              <Button isLoading={submitting} onClick={submitRegistration}>
                Xác nhận đăng ký
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
