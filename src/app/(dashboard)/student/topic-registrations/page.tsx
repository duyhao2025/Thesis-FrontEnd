"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import DataTable from "@/components/ui/DataTable";
import StatusBadge from "@/components/ui/StatusBadge";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Select from "@/components/ui/Select";
import { AvailableTopicResponse, AvailableTopicsResponse } from "@/types/entities";
import { useToast } from "@/components/ui/Toast";
import { Search, Filter, BookOpen } from "lucide-react";

export default function TopicRegistrationsPage() {
  const [topics, setTopics] = useState<AvailableTopicResponse[]>([]);
  const [registrationInfo, setRegistrationInfo] = useState<{
    isOpen: boolean;
    periodName?: string;
    endDate?: string;
  }>({ isOpen: false });
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [categories, setCategories] = useState<{ value: string; label: string }[]>([]);
  const [selectedTopic, setSelectedTopic] = useState<AvailableTopicResponse | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [priority, setPriority] = useState("1");
  const [submitting, setSubmitting] = useState(false);
  const [myGroup, setMyGroup] = useState<{ id: string; leaderId: string; memberCount: number } | null>(null);
  const { showToast } = useToast();

  const loadTopics = () => {
    setLoading(true);
    Promise.all([
      api.get<AvailableTopicsResponse>("/topic-registrations/available-topics"),
      api.get("/groups/my").catch(() => null),
    ]).then(([topicRes, groupRes]) => {
      const data = topicRes.data;
      setTopics(data.topics || []);
      setRegistrationInfo({
        isOpen: data.isRegistrationPeriodOpen,
        periodName: data.registrationPeriodName,
        endDate: data.registrationPeriodEndDate,
      });
      const cats = Array.from(
        new Set((data.topics || []).map((t: AvailableTopicResponse) => t.topicCategoryName))
      ).map((c) => ({ value: c as string, label: c as string }));
      setCategories(cats);
      if (groupRes?.data) {
        const members = groupRes.data.members || [];
        setMyGroup({
          id: groupRes.data.id,
          leaderId: groupRes.data.leaderId,
          memberCount: members.length,
        });
      }
    }).catch(() => showToast("error", "Không thể tải danh sách đề tài"))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadTopics(); }, []);

  const isLeader = myGroup ? (() => {
    const token = localStorage.getItem("accessToken");
    if (!token) return false;
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      return payload.nameid === myGroup.leaderId;
    } catch { return false; }
  })() : false;

  const canRegister = !myGroup || isLeader;

  const filtered = topics.filter((t) => {
    const matchSearch = !search || t.title.toLowerCase().includes(search.toLowerCase()) || t.lecturerName.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || t.topicCategoryName === categoryFilter;
    return matchSearch && matchCat;
  });

  const handleRegister = (topic: AvailableTopicResponse) => {
    setSelectedTopic(topic);
    setShowModal(true);
  };

  const submitRegistration = async () => {
    if (!selectedTopic) return;
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = { topicId: selectedTopic.id };
      if (myGroup && isLeader) {
        payload.groupId = myGroup.id;
      }
      await api.post("/topic-registrations", payload);
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
      render: (row: AvailableTopicResponse) => (
        <div>
          <p className="font-medium text-gray-900">{row.title}</p>
          <p className="mt-0.5 text-xs text-gray-500 line-clamp-1">{row.description}</p>
        </div>
      ),
    },
    { key: "lecturerName", header: "GV hướng dẫn", render: (r: AvailableTopicResponse) => r.lecturerName || "—"},
    { key: "topicCategoryName", header: "Danh mục" },
    {
      key: "maxStudents",
      header: "Sĩ số",
      render: (r: AvailableTopicResponse) => (
        <span className="text-sm">
          {r.currentStudents}/{r.maxStudents}
          {myGroup && (
            <span className="ml-1 text-xs text-blue-600">(nhóm: {myGroup.memberCount})</span>
          )}
        </span>
      ),
    },
    {
      key: "action",
      header: "",
      className: "w-32",
      render: (row: AvailableTopicResponse) =>
        registrationInfo.isOpen && canRegister ? (
          <Button size="sm" variant="outline" onClick={() => handleRegister(row)}>
            Đăng ký
          </Button>
        ) : !registrationInfo.isOpen ? (
          <span className="text-xs text-gray-400 italic">Chưa mở</span>
        ) : (
          <span className="text-xs text-gray-400 italic">Chờ nhóm trưởng</span>
        ),
    },
  ];

  const showNonLeaderBanner = myGroup && !isLeader;

  return (
    <div className="space-y-4">
      {showNonLeaderBanner && (
        <div className="rounded-lg border border-blue-200 bg-blue-50 px-4 py-3 text-sm text-blue-700">
          <strong>Thảo luận với nhóm trưởng</strong> để chọn đề tài. Nhóm trưởng sẽ đại diện cả nhóm đăng ký đề tài.
        </div>
      )}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Đăng ký đề tài</h1>
          <p className="text-sm text-gray-500">Danh sách đề tài đang mở đăng ký</p>
        </div>
        {registrationInfo.isOpen && registrationInfo.periodName && (
          <div className="rounded-lg bg-green-50 border border-green-200 px-3 py-2">
            <p className="text-sm font-medium text-green-700">{registrationInfo.periodName}</p>
            {registrationInfo.endDate && (
              <p className="text-xs text-green-600">
                Hạn chót: {new Date(registrationInfo.endDate).toLocaleDateString("vi-VN")}
              </p>
            )}
          </div>
        )}
        {!registrationInfo.isOpen && (
          <div className="rounded-lg bg-red-50 border border-red-200 px-3 py-2">
            <p className="text-sm font-medium text-red-700">Kỳ đăng ký chưa mở</p>
            <p className="text-xs text-red-600">Vui lòng chờ nhân viên khoa mở kỳ đăng ký</p>
          </div>
        )}
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

      {/* Overlay when registration period is closed */}
      {!registrationInfo.isOpen && (
        <div className="relative">
          {/* Overlay */}
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center rounded-lg bg-gray-900/70 backdrop-blur-sm">
            <div className="flex flex-col items-center text-center">
              <div className="mb-4 rounded-full bg-gray-100 p-4">
                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="mb-2 text-xl font-bold text-white">Kỳ đăng ký đề tài đã đóng</h3>
              <p className="max-w-sm text-sm text-gray-300">
                Vui lòng đợi nhân viên khoa mở kỳ đăng ký mới để tiếp tục đăng ký đề tài
              </p>
              {registrationInfo.periodName && (
                <p className="mt-3 text-xs text-gray-400">
                  Kỳ gần nhất: {registrationInfo.periodName}
                </p>
              )}
            </div>
          </div>
          
          {/* Hidden content behind overlay */}
          <div className="opacity-30 pointer-events-none">
            {filtered.length === 0 && !loading ? (
              <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
                <BookOpen className="mb-3 h-12 w-12 text-gray-300" />
                <p className="text-gray-500">Không có đề tài nào phù hợp</p>
              </div>
            ) : (
              <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" />
            )}
          </div>
        </div>
      )}

      {registrationInfo.isOpen && (
        <>
          {filtered.length === 0 && !loading ? (
            <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-16">
              <BookOpen className="mb-3 h-12 w-12 text-gray-300" />
              <p className="text-gray-500">Không có đề tài nào phù hợp</p>
            </div>
          ) : (
            <DataTable columns={columns} data={filtered} loading={loading} rowKey="id" />
          )}
        </>
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
              <p className="mt-1 text-sm text-gray-600">GV: {selectedTopic.lecturerName || "—"}</p>
              <p className="text-sm text-gray-600">Danh mục: {selectedTopic.topicCategoryName}</p>
              {myGroup && isLeader && (
                <p className="mt-1 text-sm font-medium text-blue-600">Đăng ký nhóm ({myGroup.id})</p>
              )}
              {myGroup && !isLeader && (
                <p className="mt-1 text-sm text-red-600">Bạn là thành viên, nhóm trưởng sẽ đăng ký.</p>
              )}
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
