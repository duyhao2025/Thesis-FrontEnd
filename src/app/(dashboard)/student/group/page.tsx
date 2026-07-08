"use client";

import React, { useCallback, useEffect, useRef, useState } from "react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import Input from "@/components/ui/Input";
import Textarea from "@/components/ui/Textarea";
import DataTable from "@/components/ui/DataTable";
import { useToast } from "@/components/ui/Toast";
import {
  MyGroupResponse,
  GroupMemberResponse,
  StudentLookupItem,
} from "@/types/entities";
import { useAuth } from "@/contexts/AuthContext";
import {
  Plus,
  Users,
  UserMinus,
  Trash2,
  Crown,
  Search,
  UserPlus,
  AlertCircle,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import { SendInvitationRequest } from "@/types/api";

const statusLabels: Record<string, string> = {
  FORMING: "Đang tạo",
  APPROVED: "Đã duyệt",
  DISSOLVED: "Đã giải tán",
};

const statusStyles: Record<string, string> = {
  FORMING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-green-100 text-green-700",
  DISSOLVED: "bg-red-100 text-red-700",
};

export default function StudentGroupPage() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [group, setGroup] = useState<MyGroupResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [inviting, setInviting] = useState(false);
  const [inviteMessage, setInviteMessage] = useState("");
  const [inviteTitle, setInviteTitle] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState<StudentLookupItem[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] =
    useState<StudentLookupItem | null>(null);
  const searchTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const isLeader = !!group && group.members.some(
    (m) => m.isLeader && m.email === user?.email
  );

  const loadGroup = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/groups/my");
      setGroup(res.data || null);
    } catch (err: unknown) {
      const e = err as { response?: { status?: number } };
      if (e.response?.status === 404) {
        setGroup(null);
      } else {
        showToast("error", "Không thể tải thông tin nhóm.");
      }
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadGroup();
  }, [loadGroup]);

  const handleCreateGroup = async () => {
    setCreating(true);
    try {
      await api.post("/groups", {});
      showToast("success", "Tạo nhóm thành công!");
      setShowCreateModal(false);
      loadGroup();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Tạo nhóm thất bại."
      );
    } finally {
      setCreating(false);
    }
  };

  const handleSearch = (q: string) => {
    setSearchTerm(q);
    if (searchTimer.current) clearTimeout(searchTimer.current);
    if (!q.trim()) {
      setSearchResults([]);
      return;
    }
    searchTimer.current = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await api.get(
          `/shared/students/search?q=${encodeURIComponent(q)}&limit=10`
        );
        const existingIds = new Set(
          (group?.members || []).map((m) => m.studentId)
        );
        setSearchResults(
          (res.data || []).filter(
            (s: StudentLookupItem) =>
              !existingIds.has(s.id) && s.id !== user?.id
          )
        );
      } catch {
        showToast("error", "Không thể tìm kiếm sinh viên.");
      } finally {
        setSearching(false);
      }
    }, 350);
  };

  const handleInvite = async () => {
    if (!group || !selectedStudent) return;
    setInviting(true);
    try {
      const req: SendInvitationRequest = {
        studentId: selectedStudent.id,
        title: inviteTitle,
        message: inviteMessage,
      };
      await api.post(`/groups/${group.id}/invitations`, req);
      showToast("success", "Đã gửi lời mời! Chờ sinh viên phản hồi.");
      setShowInviteModal(false);
      setSelectedStudent(null);
      setSearchTerm("");
      setSearchResults([]);
      setInviteMessage("");
      setInviteTitle("");
      loadGroup();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Gửi lời mời thất bại."
      );
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (studentId: string) => {
    if (!group) return;
    if (!window.confirm("Bạn có chắc muốn xóa thành viên này khỏi nhóm?")) {
      return;
    }
    try {
      await api.delete(`/groups/${group.id}/members/${studentId}`);
      showToast("success", "Đã xóa thành viên.");
      loadGroup();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Xóa thành viên thất bại."
      );
    }
  };

  const handleLeaveGroup = async () => {
    if (!group) return;
    if (!window.confirm("Bạn có chắc muốn rời khỏi nhóm?")) return;
    try {
      await api.post(`/groups/${group.id}/leave`);
      showToast("success", "Đã rời nhóm.");
      setGroup(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Rời nhóm thất bại.");
    }
  };

  const handleDissolveGroup = async () => {
    if (!group) return;
    if (
      !window.confirm(
        "Bạn có chắc muốn giải tán nhóm? Hành động này không thể hoàn tác."
      )
    )
      return;
    try {
      await api.delete(`/groups/${group.id}`);
      showToast("success", "Đã giải tán nhóm.");
      setGroup(null);
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast(
        "error",
        e.response?.data?.message || "Giải tán nhóm thất bại."
      );
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <h1 className="text-xl font-bold text-gray-900">Nhóm của tôi</h1>
        <Card>
          <div className="flex h-48 items-center justify-center">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-emerald-600 border-t-transparent" />
          </div>
        </Card>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Nhóm của tôi</h1>
            <p className="text-sm text-gray-500">
              Tạo nhóm để đăng ký đề tài cùng các bạn
            </p>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="h-4 w-4" />
            Tạo nhóm mới
          </Button>
        </div>

        <Card>
          <div className="flex flex-col items-center justify-center py-16">
            <Users className="mb-3 h-12 w-12 text-gray-300" />
            <p className="font-medium text-gray-600">
              Bạn chưa tham gia nhóm nào
            </p>
            <p className="mt-1 text-sm text-gray-500">
              Tạo nhóm để cùng các bạn đăng ký đề tài làm đồ án
            </p>
            <Button
              className="mt-4"
              onClick={() => setShowCreateModal(true)}
            >
              <Plus className="h-4 w-4" />
              Tạo nhóm ngay
            </Button>
          </div>
        </Card>

        <Modal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          title="Tạo nhóm mới"
          size="md"
        >
          <div className="space-y-4">
            <div className="rounded-lg bg-emerald-50 p-4 text-sm text-emerald-800">
              <div className="flex items-start gap-2">
                <AlertCircle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium">Lưu ý:</p>
                  <ul className="mt-1 list-disc pl-4 space-y-1 text-xs">
                    <li>Bạn sẽ là trưởng nhóm.</li>
                    <li>Sau khi tạo, bạn có thể mời thêm thành viên.</li>
                    <li>
                      Cần có đợt đăng ký đang mở để tạo nhóm.
                    </li>
                  </ul>
                </div>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setShowCreateModal(false)}
              >
                Hủy
              </Button>
              <Button
                isLoading={creating}
                onClick={handleCreateGroup}
              >
                Tạo nhóm
              </Button>
            </div>
          </div>
        </Modal>
      </div>
    );
  }

  const memberColumns = [
    {
      key: "name",
      header: "Thành viên",
      render: (m: GroupMemberResponse) => (
        <div className="flex items-center gap-2">
          <span className="font-medium text-gray-900">{m.fullName}</span>
          {m.isLeader && (
            <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
              <Crown className="h-3 w-3" />
              Trưởng nhóm
            </span>
          )}
        </div>
      ),
    },
    {
      key: "email",
      header: "Email",
      render: (m: GroupMemberResponse) => (
        <span className="text-gray-600">{m.email}</span>
      ),
    },
    {
      key: "actions",
      header: "",
      render: (m: GroupMemberResponse) =>
        m.isLeader ? null : isLeader ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleRemoveMember(m.studentId);
            }}
            className="inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-xs font-medium text-red-600 hover:bg-red-50"
          >
            <UserMinus className="h-3.5 w-3.5" />
            Xóa
          </button>
        ) : null,
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Nhóm của tôi</h1>
          <p className="text-sm text-gray-500">
            Quản lý thành viên nhóm làm đồ án
          </p>
        </div>
        <div className="flex gap-2">
          {isLeader && group.status === "FORMING" && (
            <Button onClick={() => setShowInviteModal(true)}>
              <UserPlus className="h-4 w-4" />
              Mời thành viên
            </Button>
          )}
          {!isLeader && group.status === "FORMING" && (
            <Button variant="outline" onClick={handleLeaveGroup}>
              <UserMinus className="h-4 w-4" />
              Rời nhóm
            </Button>
          )}
          {isLeader && group.status === "FORMING" && (
            <Button variant="danger" onClick={handleDissolveGroup}>
              <Trash2 className="h-4 w-4" />
              Giải tán
            </Button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <Card>
          <p className="text-xs font-medium uppercase text-gray-500">
            Trạng thái
          </p>
          <p className="mt-1">
            <span
              className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                statusStyles[group.status] || "bg-gray-100 text-gray-700"
              }`}
            >
              {statusLabels[group.status] || group.status}
            </span>
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-gray-500">
            Trưởng nhóm
          </p>
          <p className="mt-1 font-semibold text-gray-900">
            {group.leaderFullName}
          </p>
        </Card>
        <Card>
          <p className="text-xs font-medium uppercase text-gray-500">
            Ngày tạo
          </p>
          <p className="mt-1 text-sm text-gray-900">
            {format(new Date(group.createdAt), "dd/MM/yyyy HH:mm", {
              locale: vi,
            })}
          </p>
        </Card>
      </div>

      <Card title="Danh sách thành viên">
        <DataTable
          columns={memberColumns}
          data={group.members}
          rowKey="studentId"
          emptyMessage="Chưa có thành viên"
        />
      </Card>

      <Modal
        isOpen={showInviteModal}
        onClose={() => {
          setShowInviteModal(false);
          setSearchTerm("");
          setSearchResults([]);
          setSelectedStudent(null);
          setInviteMessage("");
      setInviteTitle("");
        }}
        title="Mời thành viên"
        size="md"
      >
        <div className="space-y-4">
          <Input
            label="Tìm kiếm sinh viên"
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Nhập tên hoặc email..."
            helperText="Hệ thống sẽ tìm các sinh viên đang hoạt động chưa tham gia nhóm."
          />

          {searching && (
            <div className="flex justify-center py-4">
              <div className="h-6 w-6 animate-spin rounded-full border-2 border-emerald-600 border-t-transparent" />
            </div>
          )}

          {!searching && searchTerm && searchResults.length === 0 && (
            <div className="flex flex-col items-center justify-center py-6 text-sm text-gray-500">
              <Search className="mb-1 h-6 w-6 text-gray-300" />
              Không tìm thấy sinh viên phù hợp
            </div>
          )}

          {!searching && searchResults.length > 0 && (
            <div className="max-h-64 space-y-1 overflow-y-auto rounded-lg border">
              {searchResults.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSelectedStudent(s)}
                  className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm transition-colors ${
                    selectedStudent?.id === s.id
                      ? "bg-emerald-50"
                      : "hover:bg-gray-50"
                  }`}
                >
                  <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-emerald-100 text-xs font-semibold text-emerald-700">
                    {s.fullName.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate font-medium text-gray-900">
                      {s.fullName}
                    </p>
                    <p className="truncate text-xs text-gray-500">{s.email}</p>
                  </div>
                </button>
              ))}
            </div>
          )}

          {selectedStudent && (
            <div className="space-y-3">
              <Input
                label="Tiêu đề lời mời"
                value={inviteTitle}
                onChange={(e) => setInviteTitle(e.target.value)}
                placeholder="Ví dụ: Lời mời tham gia nhóm của bạn B"
              />
              <Textarea
                label={`Lời nhắn cho ${selectedStudent.fullName} (tùy chọn)`}
                value={inviteMessage}
                onChange={(e) => setInviteMessage(e.target.value)}
                placeholder="Viết lời mời tham gia nhóm của bạn..."
                rows={3}
              />
            </div>
          )}

          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setShowInviteModal(false);
                setSearchTerm("");
                setSearchResults([]);
                setSelectedStudent(null);
                setInviteMessage("");
      setInviteTitle("");
              }}
            >
              Hủy
            </Button>
            <Button
              isLoading={inviting}
              disabled={!selectedStudent || !inviteTitle.trim()}
              onClick={handleInvite}
            >
              Gửi lời mời
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
