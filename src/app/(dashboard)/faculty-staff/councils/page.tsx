"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Select from "@/components/ui/Select";
import DataTable from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";
import {
  CouncilItem,
  CouncilMemberItem,
  CouncilTopicItem,
  LecturerOption,
  LecturerTopicOption,
} from "@/types/entities";
import {
  Plus,
  Pencil,
  Users,
  CalendarDays,
  MapPin,
  Trash2,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Crown,
  PenLine,
  ClipboardSignature,
  ListChecks,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import clsx from "clsx";

type CouncilRoleKey = "Chairman" | "Secretary" | "Reviewer" | "Member";

interface RoleRow {
  key: CouncilRoleKey;
  label: string;
  description: string;
  icon: React.ReactNode;
  sameDeptOnly: boolean;
}

const ROLE_ROWS: RoleRow[] = [
  {
    key: "Chairman",
    label: "Chủ tịch hội đồng",
    description: "Chỉ được chọn 1. Có thể chọn cả Trưởng khoa.",
    icon: <Crown className="h-4 w-4" />,
    sameDeptOnly: false,
  },
  {
    key: "Secretary",
    label: "Thư ký",
    description: "Chỉ được chọn 1.",
    icon: <ClipboardSignature className="h-4 w-4" />,
    sameDeptOnly: false,
  },
  {
    key: "Reviewer",
    label: "Giảng viên phản biện",
    description: "Có thể chọn nhiều. Lấy GV toàn khoa (gồm cả Trưởng khoa).",
    icon: <PenLine className="h-4 w-4" />,
    sameDeptOnly: false,
  },
  {
    key: "Member",
    label: "Giảng viên hướng dẫn",
    description: "Chỉ lấy GV cùng Khoa & Ngành với bạn. Sau khi chọn sẽ hiện các đề tài của họ.",
    icon: <ListChecks className="h-4 w-4" />,
    sameDeptOnly: true,
  },
];

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

const roleVietnameseLabels: Record<CouncilRoleKey, string> = {
  Chairman: "Chủ tịch",
  Secretary: "Thư ký",
  Reviewer: "Giảng viên phản biện",
  Member: "Giảng viên hướng dẫn",
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

export default function StaffCouncilsPage() {
  const { showToast } = useToast();

  const [councils, setCouncils] = useState<CouncilItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [detailCouncil, setDetailCouncil] = useState<CouncilItem | null>(null);
  const [councilTopics, setCouncilTopics] = useState<CouncilTopicItem[]>([]);
  const [activeTab, setActiveTab] = useState<"info" | "members" | "topics">("info");
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
      const res = await api.get("/councils");
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
      showToast("error", e.response?.data?.message || "Tạo hội đồng thất bại.");
    } finally {
      setCreating(false);
    }
  };

  const openDetail = async (council: CouncilItem) => {
    try {
      const res = await api.get(`/councils/${council.id}`);
      setDetailCouncil(res.data);
      const topicsRes = await api.get(`/councils/${council.id}/topics`);
      setCouncilTopics(topicsRes.data || []);
      setActiveTab("info");
    } catch {
      showToast("error", "Không thể tải chi tiết hội đồng.");
    }
  };

  const closeDetail = () => {
    setDetailCouncil(null);
    setCouncilTopics([]);
    setActiveTab("info");
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
      showToast("error", e.response?.data?.message || "Cập nhật thất bại.");
    } finally {
      setEditing(false);
    }
  };

  const columns = [
    {
      key: "name",
      header: "Tên hội đồng",
      render: (c: CouncilItem) => (
        <span className="font-medium text-gray-900">{c.name}</span>
      ),
    },
    {
      key: "defenseDate",
      header: "Ngày báo cáo",
      render: (c: CouncilItem) => (
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
      render: (c: CouncilItem) => (
        <div className="flex items-center gap-1 text-gray-700">
          <MapPin className="h-3.5 w-3.5 text-gray-400" />
          {c.location}
        </div>
      ),
    },
    {
      key: "members",
      header: "Thành viên",
      render: (c: CouncilItem) => (
        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700">
          {c.members.length}
        </span>
      ),
    },
    {
      key: "status",
      header: "Trạng thái",
      render: (c: CouncilItem) => (
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
            Hội đồng báo cáo
          </h1>
          <p className="text-sm text-gray-500">
            Quản lý các hội đồng chấm báo cáo đồ án (chỉ nhân viên khoa)
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="h-4 w-4" />
          Tạo hội đồng
        </Button>
      </div>

      <Card>
        <DataTable
          columns={columns}
          data={councils}
          loading={loading}
          rowKey="id"
          onRowClick={openDetail}
          emptyMessage="Chưa có hội đồng nào. Hãy tạo hội đồng đầu tiên."
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
            onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
            placeholder="VD: Hội đồng báo cáo 1 - Khóa 2024"
          />
          <div className="grid grid-cols-2 gap-3">
            <Input
              type="date"
              label="Ngày báo cáo"
              value={createForm.date}
              onChange={(e) => setCreateForm({ ...createForm, date: e.target.value })}
            />
            <Input
              type="time"
              label="Giờ"
              value={createForm.time}
              onChange={(e) => setCreateForm({ ...createForm, time: e.target.value })}
            />
          </div>
          <Input
            label="Phòng báo cáo"
            value={createForm.location}
            onChange={(e) => setCreateForm({ ...createForm, location: e.target.value })}
            placeholder="VD: Phòng A.301"
          />
          <div className="rounded-lg bg-blue-50 p-3 text-sm text-blue-700">
            Sau khi tạo, mở chi tiết hội đồng để chọn thành viên và phân công đề tài.
          </div>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowCreateModal(false)}>
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
              onChange={(e) => setEditForm({ ...editForm, date: e.target.value })}
            />
            <Input
              type="time"
              label="Giờ"
              value={editForm.time}
              onChange={(e) => setEditForm({ ...editForm, time: e.target.value })}
            />
          </div>
          <Input
            label="Phòng báo cáo"
            value={editForm.location}
            onChange={(e) => setEditForm({ ...editForm, location: e.target.value })}
          />
          <Select
            label="Trạng thái"
            value={editForm.status}
            onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
            options={Object.entries(statusLabels).map(([k, v]) => ({ value: k, label: v }))}
          />
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setShowEditModal(false)}>
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
                  onClick={() => setActiveTab(tab)}
                  className={clsx(
                    "px-4 py-2 text-sm font-medium transition-colors",
                    activeTab === tab
                      ? "border-b-2 text-amber-700"
                      : "text-gray-500 hover:text-gray-700"
                  )}
                  style={
                    activeTab === tab
                      ? { borderColor: "var(--role-primary)" }
                      : undefined
                  }
                >
                  {tab === "info" && "Thông tin chung"}
                  {tab === "members" &&
                    `Thành viên (${detailCouncil.members.length})`}
                  {tab === "topics" && `Đề tài (${councilTopics.length})`}
                </button>
              ))}
            </div>

            {activeTab === "info" && (
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">Ngày</p>
                    <p className="mt-1 flex items-center gap-1 font-semibold text-gray-900">
                      <CalendarDays className="h-4 w-4 text-gray-400" />
                      {format(new Date(detailCouncil.defenseDate), "dd/MM/yyyy", { locale: vi })}
                    </p>
                  </div>
                  <div className="rounded-lg bg-gray-50 p-3">
                    <p className="text-xs font-medium uppercase text-gray-500">Giờ</p>
                    <p className="mt-1 flex items-center gap-1 font-semibold text-gray-900">
                      <Clock className="h-4 w-4 text-gray-400" />
                      {format(new Date(detailCouncil.defenseDate), "HH:mm", { locale: vi })}
                    </p>
                  </div>
                </div>
                <div className="rounded-lg bg-blue-50 p-3">
                  <p className="text-xs font-medium uppercase text-blue-700">Phòng báo cáo</p>
                  <p className="mt-1 flex items-center gap-1 text-base font-semibold text-blue-900">
                    <MapPin className="h-4 w-4" />
                    {detailCouncil.location}
                  </p>
                </div>
                <div className="flex items-center justify-between rounded-lg bg-gray-50 p-3">
                  <div>
                    <p className="text-xs font-medium uppercase text-gray-500">Trạng thái</p>
                    <p className="mt-1">
                      <span
                        className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                          statusStyles[detailCouncil.status] || "bg-gray-100 text-gray-700"
                        }`}
                      >
                        {statusLabels[detailCouncil.status] || detailCouncil.status}
                      </span>
                    </p>
                  </div>
                  <Button variant="outline" size="sm" onClick={openEdit}>
                    <Pencil className="h-3.5 w-3.5" />
                    Sửa
                  </Button>
                </div>
              </div>
            )}

            {activeTab === "members" && (
              <StaffCouncilMembersTab
                council={detailCouncil}
                onUpdate={async () => {
                  const res = await api.get(`/councils/${detailCouncil.id}`);
                  setDetailCouncil(res.data);
                }}
                showToast={showToast}
              />
            )}

            {activeTab === "topics" && (
              <StaffCouncilTopicsTab
                council={detailCouncil}
                topics={councilTopics}
                onUpdate={async () => {
                  const topicsRes = await api.get(`/councils/${detailCouncil.id}/topics`);
                  setCouncilTopics(topicsRes.data || []);
                  const res = await api.get(`/councils/${detailCouncil.id}`);
                  setDetailCouncil(res.data);
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

// ============================================================
// Members Tab — role-by-role assignment with dropdown hints
// ============================================================
function StaffCouncilMembersTab({
  council,
  onUpdate,
  showToast,
}: {
  council: CouncilItem;
  onUpdate: () => Promise<void>;
  showToast: ReturnType<typeof useToast>["showToast"];
}) {
  const [lecturersByScope, setLecturersByScope] = useState<{
    any: LecturerOption[];
    sameDept: LecturerOption[];
  }>({ any: [], sameDept: [] });
  const [loadingLec, setLoadingLec] = useState(false);
  const [selectedByRole, setSelectedByRole] = useState<Record<CouncilRoleKey, string>>({
    Chairman: "",
    Secretary: "",
    Reviewer: "",
    Member: "",
  });
  const [adding, setAdding] = useState<CouncilRoleKey | null>(null);

  const loadLecturers = useCallback(async () => {
    setLoadingLec(true);
    try {
      const [allRes, sameDeptRes] = await Promise.all([
        api.get("/councils/eligible-lecturers?sameDept=false"),
        api.get("/councils/eligible-lecturers?sameDept=true"),
      ]);
      setLecturersByScope({
        any: allRes.data || [],
        sameDept: sameDeptRes.data || [],
      });
    } catch {
      showToast("error", "Không thể tải danh sách giảng viên.");
    } finally {
      setLoadingLec(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadLecturers();
  }, [loadLecturers]);

  // Filter out lecturers already in the council and lock Chairman/Secretary uniqueness.
  const isAlreadyInCouncil = (id: string) =>
    council.members.some((m) => m.lecturerId === id);

  const memberByRole: Record<CouncilRoleKey, CouncilMemberItem[]> = useMemo(() => ({
    Chairman: council.members.filter((m) => m.role === "Chairman"),
    Secretary: council.members.filter((m) => m.role === "Secretary"),
    Reviewer: council.members.filter((m) => m.role === "Reviewer"),
    Member: council.members.filter((m) => m.role === "Member"),
  }), [council.members]);

  const handleAdd = async (role: CouncilRoleKey) => {
    const lecturerId = selectedByRole[role];
    if (!lecturerId) {
      showToast("warning", "Vui lòng chọn giảng viên trước.");
      return;
    }
    setAdding(role);
    try {
      await api.post(`/councils/${council.id}/members`, {
        lecturerId,
        role,
      });
      showToast("success", `Đã thêm ${roleVietnameseLabels[role]}.`);
      setSelectedByRole((prev) => ({ ...prev, [role]: "" }));
      await onUpdate();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Thêm thất bại.");
    } finally {
      setAdding(null);
    }
  };

  const handleRemove = async (memberId: string) => {
    if (!window.confirm("Xóa thành viên này khỏi hội đồng?")) return;
    try {
      await api.delete(`/councils/${council.id}/members/${memberId}`);
      showToast("success", "Đã xóa thành viên.");
      await onUpdate();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Xóa thất bại.");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Gán từng vai trò cho hội đồng. Lưu ý: <strong>Chủ tịch</strong> và <strong>Thư ký</strong> chỉ chọn 1 người; mỗi vai trò có danh sách GV riêng.
        </p>
        <Button size="sm" variant="outline" onClick={loadLecturers} isLoading={loadingLec}>
          <RefreshCw className="h-3.5 w-3.5" />
          Làm mới
        </Button>
      </div>

      <div className="space-y-3">
        {ROLE_ROWS.map((row) => {
          const pool = row.sameDeptOnly ? lecturersByScope.sameDept : lecturersByScope.any;
          const options = pool
            .filter((l) => !isAlreadyInCouncil(l.id))
            .map((l) => ({
              value: l.id,
              label: `${l.fullName} — ${l.roleLabel} · ${l.departmentName}${l.majorName ? " · " + l.majorName : ""}`,
            }));
          const members = memberByRole[row.key];

          // Roles that only allow 1 (Chairman / Secretary) hide the dropdown once filled
          const singleSlot = row.key === "Chairman" || row.key === "Secretary";
          const showPicker = !singleSlot || members.length === 0;

          return (
            <div key={row.key} className="rounded-lg border border-gray-200 bg-white p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-2">
                  <div className="mt-0.5 text-amber-600">{row.icon}</div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">{row.label}</p>
                    <p className="text-xs text-gray-500">{row.description}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gray-100 px-2 py-0.5 text-xs font-medium text-gray-700">
                  {members.length} người
                </span>
              </div>

              {showPicker && (
                <div className="mt-3 grid grid-cols-1 gap-2 md:grid-cols-[1fr_auto]">
                  <Select
                    value={selectedByRole[row.key]}
                    onChange={(e) =>
                      setSelectedByRole((prev) => ({ ...prev, [row.key]: e.target.value }))
                    }
                    options={options}
                    placeholder={
                      row.sameDeptOnly
                        ? "Chọn giảng viên cùng Khoa & Ngành..."
                        : "Chọn giảng viên (toàn khoa)..."
                    }
                  />
                  <Button
                    isLoading={adding === row.key}
                    disabled={!selectedByRole[row.key]}
                    onClick={() => handleAdd(row.key)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                    Thêm
                  </Button>
                </div>
              )}

              {/* HoD conflict hint (only when the selected candidate is HoD and already used in another active council) */}
              {showPicker && selectedByRole[row.key] && (() => {
                const selected = pool.find((l) => l.id === selectedByRole[row.key]);
                if (!selected) return null;
                if (selected.roleLabel !== "Trưởng khoa") return null;
                if (!selected.currentCouncilRoles || selected.currentCouncilRoles.length === 0) return null;
                return (
                  <div className="mt-2 flex items-start gap-2 rounded-md border border-amber-300 bg-amber-50 p-2 text-xs text-amber-900">
                    <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Người này đang là <strong>{selected.currentCouncilRoles.join(", ")}</strong> ở hội đồng khác. Mỗi trưởng khoa chỉ nên đảm nhận một vai trò trong một hội đồng đang hoạt động.
                    </span>
                  </div>
                );
              })()}

              {/* Picked lecturers list with HoD hint next to them */}
              {members.length > 0 && (
                <ul className="mt-3 space-y-2">
                  {members.map((m) => {
                    const isHoD = (m.lecturerEmail ?? "").includes("hod") ||
                      pool.find((l) => l.id === m.lecturerId)?.roleLabel === "Trưởng khoa";
                    const hint = pool.find((l) => l.id === m.lecturerId)?.currentCouncilRoles ?? [];
                    return (
                      <li
                        key={m.id}
                        className="flex items-center justify-between gap-2 rounded-md bg-gray-50 px-3 py-2"
                      >
                        <div className="flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <div>
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-medium text-gray-900">{m.lecturerFullName}</p>
                              {m.departmentName && (
                                <span className="rounded bg-blue-100 px-1.5 py-0.5 text-[10px] font-medium text-blue-700">
                                  {m.departmentName}{m.majorName ? ` · ${m.majorName}` : ""}
                                </span>
                              )}
                              {hint.length > 0 && (
                                <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-700">
                                  Đang là {hint.join(", ")} ở HĐ khác
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{m.lecturerEmail}</p>
                          </div>
                        </div>
                        <button
                          onClick={() => handleRemove(m.id)}
                          className="rounded p-1 text-red-500 hover:bg-red-50"
                          title="Xóa khỏi hội đồng"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// Topics Tab — multi-select topics of one lecturer
// ============================================================
function StaffCouncilTopicsTab({
  council,
  topics,
  onUpdate,
  showToast,
}: {
  council: CouncilItem;
  topics: CouncilTopicItem[];
  onUpdate: () => Promise<void>;
  showToast: ReturnType<typeof useToast>["showToast"];
}) {
  const [lecturers, setLecturers] = useState<LecturerOption[]>([]);
  const [selectedLecturer, setSelectedLecturer] = useState<string>("");
  const [lecturerTopics, setLecturerTopics] = useState<LecturerTopicOption[]>([]);
  const [selectedTopicIds, setSelectedTopicIds] = useState<string[]>([]);
  const [loadingLec, setLoadingLec] = useState(false);
  const [loadingTopics, setLoadingTopics] = useState(false);
  const [assigning, setAssigning] = useState(false);

  // Load staff's department lecturers once
  useEffect(() => {
    const loadLecs = async () => {
      setLoadingLec(true);
      try {
        const res = await api.get("/councils/eligible-lecturers?sameDept=true");
        setLecturers(res.data || []);
      } catch {
        showToast("error", "Không thể tải danh sách giảng viên.");
      } finally {
        setLoadingLec(false);
      }
    };
    loadLecs();
  }, [showToast]);

  // When lecturer changes, fetch their topics.
  useEffect(() => {
    if (!selectedLecturer) {
      setLecturerTopics([]);
      setSelectedTopicIds([]);
      return;
    }
    const load = async () => {
      setLoadingTopics(true);
      try {
        const res = await api.get(
          `/councils/lecturers/${selectedLecturer}/topics`
        );
        const list: LecturerTopicOption[] = res.data || [];
        const alreadyAssignedIds = new Set(topics.map((t) => t.topicId));
        setLecturerTopics(list);
        setSelectedTopicIds(list.filter((t) => alreadyAssignedIds.has(t.id)).map((t) => t.id));
      } catch {
        setLecturerTopics([]);
      } finally {
        setLoadingTopics(false);
      }
    };
    load();
  }, [selectedLecturer, topics]);

  const handleAssign = async () => {
    if (selectedTopicIds.length === 0) {
      showToast("warning", "Vui lòng chọn ít nhất một đề tài.");
      return;
    }
    setAssigning(true);
    try {
      await api.post(`/councils/${council.id}/topics`, {
        topicIds: selectedTopicIds,
      });
      showToast(
        "success",
        `Đã phân công ${selectedTopicIds.length} đề tài và thông báo đã được gửi.`
      );
      setSelectedTopicIds([]);
      await onUpdate();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Phân công thất bại.");
    } finally {
      setAssigning(false);
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

  const selectedLecturerObj = lecturers.find((l) => l.id === selectedLecturer);

  return (
    <div className="space-y-4">
      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 space-y-4">
        <div>
          <p className="text-sm font-semibold text-amber-900">Phân công đề tài bảo vệ</p>
          <p className="text-xs text-amber-800">
            Chọn 1 giảng viên (cùng Khoa &amp; Ngành của bạn) → đề tài của họ sẽ hiện ra. Bạn có thể chọn nhiều đề tài để lên lịch bảo vệ cùng lúc. Sau khi bấm <strong>Phân công</strong>, thông báo sẽ gửi về cho giảng viên (vào phần Chấm điểm) và các sinh viên của từng đề tài (thông báo lịch bảo vệ).
          </p>
        </div>

        {loadingLec ? (
          <div className="flex justify-center py-3">
            <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
          </div>
        ) : (
          <Select
            label="Giảng viên hướng dẫn"
            value={selectedLecturer}
            onChange={(e) => setSelectedLecturer(e.target.value)}
            options={lecturers.map((l) => ({
              value: l.id,
              label: `${l.fullName} — ${l.roleLabel} · ${l.departmentName}${l.majorName ? " · " + l.majorName : ""}`,
            }))}
            placeholder="Chọn giảng viên..."
          />
        )}

        {selectedLecturerObj && (selectedLecturerObj.currentCouncilRoles?.length ?? 0) > 0 && (
          <div className="flex items-start gap-2 rounded-md border border-amber-300 bg-white p-2 text-xs text-amber-900">
            <AlertTriangle className="h-3.5 w-3.5 flex-shrink-0 mt-0.5" />
            <span>
              Giảng viên này đang giữ vai trò <strong>{selectedLecturerObj.currentCouncilRoles.join(", ")}</strong> ở hội đồng khác. Bạn vẫn có thể phân công đề tài nếu muốn.
            </span>
          </div>
        )}

        {selectedLecturer && (
          <div>
            <p className="text-xs font-medium text-gray-700 mb-2">Đề tài của giảng viên này (trạng thái có thể bảo vệ)</p>
            {loadingTopics ? (
              <div className="flex justify-center py-3">
                <div className="h-5 w-5 animate-spin rounded-full border-2 border-amber-600 border-t-transparent" />
              </div>
            ) : lecturerTopics.length === 0 ? (
              <p className="rounded-md border border-dashed border-gray-300 py-4 text-center text-sm text-gray-400">
                Giảng viên này chưa có đề tài nào ở trạng thái có thể bảo vệ.
              </p>
            ) : (
              <div className="space-y-2 max-h-56 overflow-y-auto rounded-md border border-gray-200 bg-white p-2">
                {lecturerTopics.map((t) => {
                  const checked = selectedTopicIds.includes(t.id);
                  return (
                    <label
                      key={t.id}
                      className={clsx(
                        "flex items-start gap-2 rounded-md p-2 cursor-pointer transition",
                        checked ? "bg-amber-50 border border-amber-300" : "hover:bg-gray-50 border border-transparent"
                      )}
                    >
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={() =>
                          setSelectedTopicIds((prev) =>
                            prev.includes(t.id)
                              ? prev.filter((x) => x !== t.id)
                              : [...prev, t.id]
                          )
                        }
                        className="mt-0.5 rounded border-gray-300"
                      />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{t.title}</p>
                        <p className="text-xs text-gray-500">
                          Trạng thái: {t.status}{t.isPrimary ? " · GV chính" : " · GV hỗ trợ"}
                        </p>
                      </div>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {selectedLecturer && lecturerTopics.length > 0 && (
          <div className="flex justify-end">
            <Button
              isLoading={assigning}
              onClick={handleAssign}
              disabled={selectedTopicIds.length === 0}
            >
              <CheckCircle2 className="h-4 w-4" />
              Phân công ({selectedTopicIds.length})
            </Button>
          </div>
        )}
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold text-gray-900">
          Đề tài đã phân công ({topics.length})
        </p>
        <DataTable
          columns={columns}
          data={topics}
          rowKey="assignmentId"
          emptyMessage="Chưa có đề tài nào trong hội đồng."
        />
      </div>
    </div>
  );
}