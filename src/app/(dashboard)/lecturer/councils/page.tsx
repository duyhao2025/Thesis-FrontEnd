"use client";

import React, { useCallback, useEffect, useState } from "react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import Button from "@/components/ui/Button";
import Modal from "@/components/ui/Modal";
import { useToast } from "@/components/ui/Toast";
import {
  CalendarDays,
  Clock,
  MapPin,
  Crown,
  XCircle,
  CheckCircle2,
  AlertTriangle,
} from "lucide-react";
import { format } from "date-fns";
import { vi } from "date-fns/locale";
import clsx from "clsx";

interface LecturerCouncilItem {
  councilId: string;
  councilName: string;
  defenseDate: string;
  endTime?: string | null;
  location: string;
  status: string;
  myRole: string;
}

const statusLabels: Record<string, string> = {
  Draft: "Nháp",
  Scheduled: "Đã lên lịch",
  InProgress: "Đang diễn ra",
  PendingClosure: "Chờ xác nhận đóng",
  Closed: "Đã đóng",
  Completed: "Hoàn thành",
  Cancelled: "Đã hủy",
};

const statusStyles: Record<string, string> = {
  Draft: "bg-gray-100 text-gray-700",
  Scheduled: "bg-blue-100 text-blue-700",
  InProgress: "bg-amber-100 text-amber-700",
  PendingClosure: "bg-orange-100 text-orange-700",
  Closed: "bg-slate-200 text-slate-700",
  Completed: "bg-green-100 text-green-700",
  Cancelled: "bg-red-100 text-red-700",
};

const closableByChairman = new Set(["Draft", "Scheduled", "InProgress"]);

export default function LecturerCouncilsPage() {
  const { showToast } = useToast();
  const [councils, setCouncils] = useState<LecturerCouncilItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState<string | null>(null);
  const [showClosureModal, setShowClosureModal] = useState<LecturerCouncilItem | null>(null);

  const loadCouncils = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/lecturer/councils");
      setCouncils(res.data || []);
    } catch {
      showToast("error", "Không thể tải danh sách hội đồng của bạn.");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadCouncils();
  }, [loadCouncils]);

  const myCouncils = councils.filter((c) => c.myRole === "Chairman");
  const otherCouncils = councils.filter((c) => c.myRole !== "Chairman");

  const handleRequestClosure = async (council: LecturerCouncilItem) => {
    if (!window.confirm(
      `Gửi yêu cầu đóng hội đồng "${council.councilName}" đến nhân viên khoa? Sau khi được xác nhận, vai trò Chủ tịch của bạn sẽ được giải phóng.`
    )) return;
    setRequesting(council.councilId);
    try {
      await api.post(`/lecturer/councils/${council.councilId}/request-closure`);
      showToast("success", "Đã gửi yêu cầu đóng. Nhân viên khoa sẽ nhận được thông báo.");
      setShowClosureModal(null);
      await loadCouncils();
    } catch (err: unknown) {
      const e = err as { response?: { data?: { message?: string } } };
      showToast("error", e.response?.data?.message || "Gửi yêu cầu thất bại.");
    } finally {
      setRequesting(null);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hội đồng của tôi</h1>
        <p className="text-sm text-gray-500">
          Danh sách các hội đồng bạn đang tham gia. Với vai trò <strong>Chủ tịch</strong>, bạn có
          thể gửi yêu cầu đóng hội đồng để được giải phóng sau khi công việc hoàn tất.
        </p>
      </div>

      {/* Section: councils I chair */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 bg-amber-50/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Crown className="h-4 w-4 text-amber-600" />
            <p className="text-sm font-semibold text-gray-900">
              Hội đồng bạn làm Chủ tịch ({myCouncils.length})
            </p>
          </div>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Đang tải...</p>
          ) : myCouncils.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              Bạn hiện không là Chủ tịch hội đồng nào.
            </p>
          ) : (
            myCouncils.map((c) => (
              <LecturerCouncilRow
                key={c.councilId}
                council={c}
                onRequestClosure={() => setShowClosureModal(c)}
                showToast={showToast}
              />
            ))
          )}
        </div>
      </Card>

      {/* Section: other councils I am in */}
      <Card className="overflow-hidden">
        <div className="border-b border-gray-200 bg-gray-50/50 px-4 py-3">
          <p className="text-sm font-semibold text-gray-900">
            Hội đồng khác bạn tham gia ({otherCouncils.length})
          </p>
        </div>
        <div className="divide-y divide-gray-100">
          {loading ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">Đang tải...</p>
          ) : otherCouncils.length === 0 ? (
            <p className="px-4 py-6 text-center text-sm text-gray-400">
              Bạn không tham gia hội đồng nào khác.
            </p>
          ) : (
            otherCouncils.map((c) => (
              <LecturerCouncilRow
                key={c.councilId}
                council={c}
                onRequestClosure={null}
                showToast={showToast}
              />
            ))
          )}
        </div>
      </Card>

      {/* Closure request modal */}
      <Modal
        isOpen={!!showClosureModal}
        onClose={() => setShowClosureModal(null)}
        title="Yêu cầu đóng hội đồng"
        size="md"
      >
        {showClosureModal && (
          <div className="space-y-4">
            <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <p className="flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 flex-shrink-0 mt-0.5" />
                <span>
                  Khi bạn gửi yêu cầu đóng <strong>{showClosureModal.councilName}</strong>, nhân
                  viên khoa sẽ nhận được thông báo và quyết định thời gian kết thúc chính
                  thức. Sau khi hội đồng đóng, vai trò Chủ tịch của bạn sẽ được giải phóng
                  và bạn có thể tham gia hội đồng khác.
                </span>
              </p>
            </div>
            <div className="rounded-lg bg-gray-50 p-3 text-sm space-y-1">
              <p>
                <span className="text-gray-500">Hội đồng:</span>{" "}
                <strong>{showClosureModal.councilName}</strong>
              </p>
              <p>
                <span className="text-gray-500">Ngày bảo vệ:</span>{" "}
                {format(new Date(showClosureModal.defenseDate), "dd/MM/yyyy HH:mm", { locale: vi })}
              </p>
              {showClosureModal.endTime && (
                <p>
                  <span className="text-gray-500">Thời gian kết thúc dự kiến:</span>{" "}
                  {format(new Date(showClosureModal.endTime), "dd/MM/yyyy HH:mm", { locale: vi })}
                </p>
              )}
              <p>
                <span className="text-gray-500">Vai trò của bạn:</span>{" "}
                <strong>Chủ tịch</strong>
              </p>
            </div>
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setShowClosureModal(null)}>
                Hủy
              </Button>
              <Button
                isLoading={requesting === showClosureModal.councilId}
                onClick={() => handleRequestClosure(showClosureModal)}
                className="bg-amber-600 hover:bg-amber-700"
              >
                <CheckCircle2 className="h-4 w-4" />
                Gửi yêu cầu đóng
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

function LecturerCouncilRow({
  council,
  onRequestClosure,
}: {
  council: LecturerCouncilItem;
  onRequestClosure: (() => void) | null;
  showToast: ReturnType<typeof useToast>["showToast"];
}) {
  const isChair = council.myRole === "Chairman";
  const canRequestClosure = isChair && closableByChairman.has(council.status);
  return (
    <div className="px-4 py-3 hover:bg-gray-50">
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="font-semibold text-gray-900">{council.councilName}</p>
            <span
              className={clsx(
                "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                statusStyles[council.status] || "bg-gray-100 text-gray-700"
              )}
            >
              {statusLabels[council.status] || council.status}
            </span>
            {isChair && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 px-2 py-0.5 text-xs font-semibold text-amber-700">
                <Crown className="h-3 w-3" /> Chủ tịch
              </span>
            )}
            {!isChair && (
              <span className="rounded-full bg-blue-100 px-2 py-0.5 text-xs font-medium text-blue-700">
                {council.myRole}
              </span>
            )}
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-600">
            <span className="flex items-center gap-1">
              <CalendarDays className="h-3.5 w-3.5 text-gray-400" />
              {format(new Date(council.defenseDate), "dd/MM/yyyy", { locale: vi })}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400" />
              {format(new Date(council.defenseDate), "HH:mm", { locale: vi })}
            </span>
            <span className="flex items-center gap-1">
              <MapPin className="h-3.5 w-3.5 text-gray-400" />
              {council.location}
            </span>
            {council.endTime && (
              <span className="flex items-center gap-1 text-xs text-gray-500">
                <span className="text-gray-400">→</span>
                {format(new Date(council.endTime), "dd/MM HH:mm", { locale: vi })}
              </span>
            )}
          </div>
        </div>
        {canRequestClosure && onRequestClosure && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRequestClosure}
            className="border-amber-300 text-amber-700 hover:bg-amber-50"
          >
            <XCircle className="h-3.5 w-3.5" />
            Yêu cầu đóng
          </Button>
        )}
      </div>
    </div>
  );
}
