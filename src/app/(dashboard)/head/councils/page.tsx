"use client";

import React, { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DataTable from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";
import ReadOnlyBadge from "@/components/head/ReadOnlyBadge";
import {
  CouncilItem,
  CouncilMemberItem,
  CouncilTopicItem,
  HoDCouncilListItem,
  TopicResponse,
} from "@/types/entities";
import {
  Plus,
  Pencil,
  Users,
  CalendarDays,
  MapPin,
  X,
  Trash2,
  BookMarked,
  Clock,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";

interface Lecturer {
  id: string;
  fullName: string;
  email: string;
}

const roleLabels: Record<string, string> = {
  Chairman: "Chủ tịch",
  Secretary: "Thư ký",
  Member: "Thành viên",
  Reviewer: "Phản biện",
};

const statusLabels: Record<string, string> = {
  Draft: "Nháp",
  Scheduled: "Đã lên lịch",
  InProgress: "Đang diễn ra",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

const statusStyles: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Scheduled: "bg-blue-100 text-blue-700",
  InProgress: "bg-amber-100 text-amber-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

function combineDateAndTime(date: string, time: string): string {
  if (!date || !time) return "";
  return `${date}T${time}:00.000Z`;
}

function splitDateTime(iso: string): { date: string; time: string } {
  if (!iso) return { date: "", time: "" };
  const d = new Date(iso);
  if (isNaN(d.getTime())) return { date: "", time: "" };
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const min = String(d.getMinutes()).padStart(2, "0");
  return { date: `${yyyy}-${mm}-${dd}`, time: `${hh}:${min}` };
}

export default function HeadCouncilsPage() {
  const { showToast } = useToast();
  const [councils, setCouncils] = useState<HoDCouncilListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailCouncil, setDetailCouncil] = useState<CouncilItem | null>(null);
  const [councilTopics, setCouncilTopics] = useState<CouncilTopicItem[]>([]);
  const [detailTab, setDetailTab] = useState<"info" | "members" | "topics">(
    "info"
  );
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);

  const [createForm, setCreateForm] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
  });
  const [editForm, setEditForm] = useState({
    name: "",
    date: "",
    time: "",
    location: "",
    status: "Draft",
  });

  const loadCouncils = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/head/councils");
      setCouncils(res.data || []);
    } catch {
      showToast("error", "Không thể tải danh sách hội đồng.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCouncils();
  }, [loadCouncils]);

  const handleCreate = async () => {
    if (!createForm.name || !createForm.date || !createForm.time || !createForm.location) {
      showToast("warning", "Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setCreating(true);
    try {
      await api.post("/councils", {
        name: createForm.name,
        defenseDate: combineDateAndTime(createForm.date, createForm.time),
        location: createForm.location,
      });
      showToast("success", "Tạo hội đồng thành công!");
      setShowCreateModal(false);
      setCreateForm({ name: "", date: "", time: "", location: "" });
      loadCouncils();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Tạo hội đồng thất bại."
      );
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (council: HoDCouncilListItem) => {
    try {
      const res = await api.get(`/head/councils/${council.id}`);
      setDetailCouncil(res.data);
      const topicsRes = await api.get(`/head/councils/${council.id}/topics`);
      setCouncilTopics(topicsRes.data || []);
      setDetailTab("info");
    } catch {
      showToast("error", "Không thể tải chi tiết hội đồng.");
    }
  };

  const closeDetail = () => {
    setDetailCouncil(null);
    setCouncilTopics([]);
  };

  const openEdit = () => {
    if (!detailCouncil) return;
    const { date, time } = splitDateTime(detailCouncil.defenseDate);
    setEditForm({
      name: detailCouncil.name,
      date,
      time,
      location: detailCouncil.location,
      status: detailCouncil.status,
    });
    setShowEditModal(true);
  };

  const handleUpdate = async () => {
    if (!detailCouncil) return;
    if (!editForm.name || !editForm.date || !editForm.time || !editForm.location) {
      showToast("warning", "Vui lòng điền đầy đủ thông tin.");
      return;
    }
    setEditing(true);
    try {
      await api.put(`/councils/${detailCouncil.id}`, {
        name: editForm.name,
        defenseDate: combineDateAndTime(editForm.date, editForm.time),
        location: editForm.location,
        status: editForm.status,
      });
      showToast("success", "Cập nhật hội đồng thành công!");
      setShowEditModal(false);
      loadCouncils();
      const res = await api.get(`/councils/${detailCouncil.id}`);
      setDetailCouncil(res.data);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Cập nhật thất bại."
      );
    } finally {
      setEditing(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Tên hội đồng",
      render: (c: HoDCouncilListItem) => (
        <span className="font-medium text-gray-900">{c.name}</span>
      ),
    },
    {
      key: "defenseDate",
      header: "Ngày báo cáo",
      render: (c: HoDCouncilListItem) => (
        <div className="text-sm">
          <div className="flex items-center gap-1 text-gray-900">
            <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
            {format(new Date(c.defenseDate), "dd/MM/yyyy", { locale: vi })}
          </div>
          <div className="flex items-center gap-1 text-xs text-gray-500">
            <Clock className="h-3 w-3 text-gray-400" />
            {format(new Date(c.defenseDate), "HH:mm", { locale: vi })}
          </div>
        </div>
      ),
    },
    {
      key: "location",
      header: "Phòng",
      render: (c: HoDCouncilListItem) => (
        <div className="flex items-center gap-1 text-gray-700">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          {c.location}
        </div>
      ),
    },
    {
      key: "members",
      header: "Thành viên",
      render: (c: HoDCouncilListItem) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
          {c.memberCount}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (c: HoDCouncilListItem) => (
        <span
          className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
            statusStyles[c.status] || "bg-gray-100 text-gray-700"
          }`}
        >
          {statusLabels[c.status] || c.status}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">
            Quản lý hội đồng
          </h1>
          <p className="text-sm text-gray-500">
            Theo dõi các hội đồng chấm báo cáo đồ án trong khoa
          </p>
        </div>
        <ReadOnlyBadge />
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={councils}
          loading={loading}
          rowKey="id"
          onRowClick={openDetail}
          emptyMessage="Chưa có hội đồng nào trong khoa."
        />
      </Card>

      {/* Create Modal */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        title="Tạo hội đồng mới"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Tên hội đồng"
            value={createForm.name}
            onChange={(e) =>
              setCreateForm({ ...createForm, name: e.target.value })
            }
            placeholder="VD: Hội đồng báo cáo 1 - Khóa 2024"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Ngày báo cáo"
              value={createForm.date}
              onChange={(e) =>
                setCreateForm({ ...createForm, date: e.target.value })
              }
            />
            <Input
              type="time"
              label="Giờ"
              value={createForm.time}
              onChange={(e) =>
                setCreateForm({ ...createForm, time: e.target.value })
              }
            />
          </div>
          <Input
            label="Phòng báo cáo"
            value={createForm.location}
            onChange={(e) =>
              setCreateForm({ ...createForm, location: e.target.value })
            }
            placeholder="VD: Phòng A.301"
          />
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            Sau khi tạo, bạn có thể thêm thành viên và phân công đề tài cho hội
            đồng này.
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowCreateModal(false)}
            >
              Hủy
            </Button>
            <Button isLoading={creating} onClick={handleCreate}>
              Tạo hội đồng
            </Button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        title="Cập nhật hội đồng"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Tên hội đồng"
            value={editForm.name}
            onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Ngày báo cáo"
              value={editForm.date}
              onChange={(e) =>
                setEditForm({ ...editForm, date: e.target.value })
              }
            />
            <Input
              type="time"
              label="Giờ"
              value={editForm.time}
              onChange={(e) =>
                setEditForm({ ...editForm, time: e.target.value })
              }
            />
          </div>
          <Input
            label="Phòng báo cáo"
            value={editForm.location}
            onChange={(e) =>
              setEditForm({ ...editForm, location: e.target.value })
            }
          />
          <Select
            label="Trạng thái"
            value={editForm.status}
            onChange={(e) =>
              setEditForm({ ...editForm, status: e.target.value })
            }
            options={Object.entries(statusLabels).map(([k, v]) => ({
              value: k,
              label: v,
            }))}
          />
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setShowEditModal(false)}
            >
              Hủy
            </Button>
            <Button isLoading={editing} onClick={handleUpdate}>
              Cập nhật
            </Button>
          </div>
        </div>
      </Modal>

      {/* Detail Modal */}
      <Modal
        isOpen={!!detailCouncil}
        onClose={closeDetail}
        title={detailCouncil?.name || "Chi tiết hội đồng"}
        size="xl"
      >
        {detailCouncil && (
          <div className="space-y-4">
            <div className="flex gap-2 border-b">
              {(["info", "members", "topics"] as const).map((tab) => (
                <button
                  key={tab}
                  onClick={() => setDetailTab(tab)}
                  className={`px-4 py-2 text-sm font-medium transition-colors ${
                    detailTab === tab
                      ? "border-b-2 text-blue-600"
                      : "text-gray-500 hover:text-gray-700"
                  }`}
                  style={
                    detailTab === tab
                      ? { borderColor: "var(--role-primary)" }
                      : undefined
                  }
                >
                  {tab === "info" && "Thông tin chung"}
                  {tab === "members" &&
                    `Thành viên (${detailCouncil.members?.length ?? 0})`}
                  {tab === "topics" && `Đề tài (${councilTopics.length})`}
                </button>
              ))}
            </div>

            {detailTab === "info" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      Ngày
                    </p>
                    <p className="mt-1 flex items-center gap-1 font-semibold text-gray-900">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      {format(new Date(detailCouncil.defenseDate), "dd/MM/yyyy", {
                        locale: vi,
                      })}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">
                      Giờ
                    </p>
                    <p className="mt-1 flex items-center gap-1 font-semibold text-gray-900">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {format(new Date(detailCouncil.defenseDate), "HH:mm", {
                        locale: vi,
                      })}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs font-medium uppercase text-blue-700">
                    Phòng báo cáo
                  </p>
                  <p className="mt-1 flex items-center gap-1 text-base font-semibold text-blue-900">
                    <MapPin className="h-4 w-4" />
                    {detailCouncil.location}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">
                      Trạng thái
                    </p>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[detailCouncil.status] ||
                          "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabels[detailCouncil.status] ||
                          detailCouncil.status}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            )}

            {detailTab === "members" && (
              <CouncilMembersTab
                council={detailCouncil}
                onUpdate={async () => {
                  const res = await api.get(`/councils/${detailCouncil.id}`);
                  setDetailCouncil(res.data);
                }}
                showToast={showToast}
              />
            )}

            {detailTab === "topics" && (
              <CouncilTopicsTab
                councilId={detailCouncil.id}
                topics={councilTopics}
                onUpdate={async () => {
                  const topicsRes = await api.get(
                    `/councils/${detailCouncil.id}/topics`
                  );
                  setCouncilTopics(topicsRes.data || []);
                }}
                showToast={showToast}
              />
            )}
          </div>
        )}
      </Modal>
    </div>
  );
}

function CouncilMembersTab({
  council,
  onUpdate,
  showToast,
}: {
  council: CouncilItem & { members: CouncilMemberItem[] };
  onUpdate: () => Promise<void>;
  showToast: ReturnType<typeof useToast>["showToast"];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loadingLec, setLoadingLec] = useState(false);
  const [selectedLecId, setSelectedLecId] = useState("");
  const [selectedRole, setSelectedRole] = useState("Member");
  const [adding, setAdding] = useState(false);

  const openAdd = async () => {
    setShowAdd(true);
    setLoadingLec(true);
    try {
      const res = await api.get("/shared/lecturers");
      const existingIds = new Set(council.members.map((m) => m.lecturerId));
      setLecturers(
        (res.data || []).filter((l: Lecturer) => !existingIds.has(l.id))
      );
    } catch {
      showToast("error", "Không thể tải danh sách giảng viên.");
    } finally {
      setLoadingLec(false);
    }
  };

  const handleAdd = async () => {
    if (!selectedLecId) {
      showToast("warning", "Vui lòng chọn giảng viên.");
      return;
    }
    setAdding(true);
    try {
      await api.post(`/councils/${council.id}/members`, {
        lecturerId: selectedLecId,
        role: selectedRole,
      });
      showToast("success", "Đã thêm thành viên.");
      setShowAdd(false);
      setSelectedLecId("");
      setSelectedRole("Member");
      await onUpdate();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Thêm thất bại.");
    } finally {
      setAdding(false);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này?")) return;
    try {
      await api.delete(`/councils/${council.id}/members/${memberId}`);
      showToast("success", "Đã xóa thành viên.");
      await onUpdate();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Xóa thất bại.");
    }
  };

  const memberColumns = [
    {
      key: "role",
      header: "Vai trò",
      render: (m: CouncilMemberItem) => (
        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-semibold text-indigo-700">
          {roleLabels[m.role] || m.role}
        </span>
      ),
    },
    {
      key: "fullName",
      header: "Giảng viên",
      render: (m: CouncilMemberItem) => (
        <div>
          <div className="font-medium text-gray-900">{m.lecturerFullName}</div>
          <div className="text-xs text-gray-500">{m.lecturerEmail}</div>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <DataTable
        columns={memberColumns}
        data={council.members ?? []}
        rowKey="id"
        emptyMessage="Chưa có thành viên nào."
      />

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Thêm thành viên"
        size="md"
      >
        <div className="space-y-4">
          {loadingLec ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : (
            <Select
              label="Giảng viên"
              value={selectedLecId}
              onChange={(e) => setSelectedLecId(e.target.value)}
              placeholder="Chọn giảng viên..."
              options={lecturers.map((l) => ({
                value: l.id,
                label: `${l.fullName} - ${l.email}`,
              }))}
            />
          )}
          <Select
            label="Vai trò"
            value={selectedRole}
            onChange={(e) => setSelectedRole(e.target.value)}
            options={Object.entries(roleLabels).map(([k, v]) => ({
              value: k,
              label: v,
            }))}
            helperText="Mỗi hội đồng chỉ có 1 Chủ tịch và 1 Thư ký."
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Hủy
            </Button>
            <Button
              isLoading={adding}
              disabled={!selectedLecId}
              onClick={handleAdd}
            >
              Thêm
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}

function CouncilTopicsTab({
  councilId,
  topics,
  onUpdate,
  showToast,
}: {
  councilId: string;
  topics: CouncilTopicItem[];
  onUpdate: () => Promise<void>;
  showToast: ReturnType<typeof useToast>["showToast"];
}) {
  const [showAdd, setShowAdd] = useState(false);
  const [available, setAvailable] = useState<TopicResponse[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState("");
  const [adding, setAdding] = useState(false);

  const openAdd = async () => {
    setShowAdd(true);
    setLoading(true);
    try {
      // Get all topics without status filter - backend will validate eligibility
      const res = await api.get("/topics");
      setAvailable(res.data || []);
    } catch {
      showToast("error", "Không thể tải danh sách đề tài.");
    } finally {
      setLoading(false);
    }
  };

  const handleAdd = async () => {
    console.log("DEBUG selectedTopic:", selectedTopic);
    console.log("DEBUG available:", available);
    if (!selectedTopic) {
      showToast("warning", "Vui lòng chọn đề tài.");
      return;
    }
    setAdding(true);
    try {
      await api.post(`/councils/${councilId}/topics`, {
        topicId: selectedTopic,
      });
      showToast("success", "Đã phân công đề tài vào hội đồng.");
      setShowAdd(false);
      setSelectedTopic("");
      await onUpdate();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Phân công thất bại.");
    } finally {
      setAdding(false);
    }
  };

  const columns = [
    {
      key: "topicTitle",
      header: "Đề tài",
      render: (t: CouncilTopicItem) => (
        <span className="font-medium text-gray-900">{t.topicTitle}</span>
      ),
    },
    {
      key: "studentGroupName",
      header: "Nhóm SV",
      render: (t: CouncilTopicItem) => (
        <span className="text-gray-700">{t.studentGroupName}</span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (t: CouncilTopicItem) => (
        <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
          {t.status}
        </span>
      ),
    },
    {
      key: "assignedAt",
      header: "Ngày phân công",
      render: (t: CouncilTopicItem) => (
        <span className="text-sm text-gray-600">
          {format(new Date(t.assignedAt), "dd/MM/yyyy HH:mm", { locale: vi })}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-3">
      <DataTable
        columns={[
          {
            key: "title",
            header: "Tên đề tài",
            render: (t: CouncilTopicItem) => (
              <span className="font-medium text-gray-900">{t.topicTitle}</span>
            ),
          },
          {
            key: "group",
            header: "Nhóm SV",
            render: (t: CouncilTopicItem) => (
              <span className="text-sm text-gray-700">{t.studentGroupName || "—"}</span>
            ),
          },
          {
            key: "status",
            header: "Trạng thái",
            render: (t: CouncilTopicItem) => (
              <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs text-gray-700">
                {t.status || "—"}
              </span>
            ),
          },
          {
            key: "assignedAt",
            header: "Ngày gán",
            render: (t: CouncilTopicItem) => (
              <span className="text-xs text-gray-500">
                {t.assignedAt
                  ? format(new Date(t.assignedAt), "dd/MM/yyyy HH:mm", { locale: vi })
                  : "—"}
              </span>
            ),
          },
        ]}
        data={topics}
        rowKey="assignmentId"
        emptyMessage="Chưa có đề tài nào được phân công."
      />

      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Phân công đề tài vào hội đồng"
        size="md"
      >
        <div className="space-y-4">
          {loading ? (
            <div className="flex justify-center py-6">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-blue-600 border-t-transparent" />
            </div>
          ) : available.length === 0 ? (
            <p className="text-sm text-gray-500 py-4 text-center">Không có đề tài nào.</p>
          ) : (
            <Select
              label="Đề tài"
              value={selectedTopic}
              onChange={(e) => setSelectedTopic(e.target.value)}
              placeholder="Chọn đề tài..."
              options={available
                .filter((t) => t.id && t.title)
                .map((t) => ({
                  value: t.id,
                  label: t.title,
                }))}
              helperText="Chỉ đề tài có trạng thái 'Đủ điều kiện bảo vệ' hoặc 'Đã bảo vệ' mới có thể gán."
            />
          )}
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowAdd(false)}>
              Hủy
            </Button>
            <Button
              isLoading={adding}
              disabled={!selectedTopic}
              onClick={handleAdd}
            >
              Phân công
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
