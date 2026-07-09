"use client";

import { useEffect, useState } from "react";
import api from "@/lib/api";
import {
  Users,
  GraduationCap,
  ShieldCheck,
  Briefcase,
  BookMarked,
  ClipboardList,
  Building2,
  Calendar,
  TrendingUp,
  CheckCircle,
} from "lucide-react";
import StatCard from "@/components/head/StatCard";
import ReadOnlyBadge from "@/components/head/ReadOnlyBadge";

interface MajorBreakdown {
  majorId: string;
  majorName: string;
  majorCode: string;
  lecturerCount: number;
  studentCount: number;
  topicCount: number;
}

interface Overview {
  departmentId: string;
  departmentName: string;
  departmentCode: string;
  description?: string;
  majorCount: number;
  lecturerCount: number;
  headCount: number;
  staffCount: number;
  studentCount: number;
  totalUserCount: number;
  topicApprovedCount: number;
  topicOpenCount: number;
  topicInProgressCount: number;
  topicArchivedCount: number;
  topicTotalCount: number;
  councilDraftCount: number;
  councilScheduledCount: number;
  councilInProgressCount: number;
  councilPendingClosureCount: number;
  councilClosedCount: number;
  councilCompletedCount: number;
  councilCancelledCount: number;
  councilTotalCount: number;
  rubricInUseCount: number;
  majorBreakdown: MajorBreakdown[];
}

interface ActivityItem {
  type: string;
  title: string;
  subtitle?: string;
  at: string;
  refId?: string;
}

export default function HeadOverviewPage() {
  const [data, setData] = useState<Overview | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<Overview>("/head/overview"),
      api.get<ActivityItem[]>("/head/overview/activity?take=10"),
    ])
      .then(([ov, act]) => {
        setData(ov.data);
        setActivity(act.data || []);
      })
      .catch(() => {
        setData(null);
      })
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-b-2 border-blue-600" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-700">
        Không thể tải dữ liệu tổng quan khoa.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">{data.departmentName}</h1>
          <p className="mt-1 text-sm text-gray-500">
            Mã khoa: <span className="font-mono">{data.departmentCode}</span>
            {data.description && <> · {data.description}</>}
          </p>
        </div>
        <ReadOnlyBadge />
      </div>

      {/* Thẻ người dùng */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Nhân sự trong khoa
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
          <StatCard label="Giảng viên" value={data.lecturerCount} icon={Users} iconClassName="blue" />
          <StatCard label="Trưởng khoa" value={data.headCount} icon={ShieldCheck} iconClassName="indigo" />
          <StatCard label="Nhân viên" value={data.staffCount} icon={Briefcase} iconClassName="amber" />
          <StatCard label="Sinh viên" value={data.studentCount} icon={GraduationCap} iconClassName="green" />
          <StatCard label="Tổng thành viên" value={data.totalUserCount} icon={Users} iconClassName="gray" />
        </div>
      </section>

      {/* Thẻ đề tài */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Đề tài trong khoa
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-5">
          <StatCard label="Tổng đề tài" value={data.topicTotalCount} icon={BookMarked} iconClassName="gray" />
          <StatCard label="Đang mở" value={data.topicOpenCount} icon={TrendingUp} iconClassName="blue" />
          <StatCard label="Đang thực hiện" value={data.topicInProgressCount} icon={Calendar} iconClassName="amber" />
          <StatCard label="Đã duyệt" value={data.topicApprovedCount} icon={CheckCircle} iconClassName="green" />
          <StatCard label="Đã lưu trữ" value={data.topicArchivedCount} icon={BookMarked} iconClassName="gray" />
        </div>
      </section>

      {/* Thẻ hội đồng */}
      <section>
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Hội đồng trong khoa
        </h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-8">
          <StatCard label="Tổng HĐ" value={data.councilTotalCount} icon={ClipboardList} iconClassName="indigo" />
          <StatCard label="Nháp" value={data.councilDraftCount} icon={ClipboardList} iconClassName="gray" />
          <StatCard label="Đã lên lịch" value={data.councilScheduledCount} icon={Calendar} iconClassName="blue" />
          <StatCard label="Đang diễn ra" value={data.councilInProgressCount} icon={Calendar} iconClassName="amber" />
          <StatCard label="Chờ đóng" value={data.councilPendingClosureCount} icon={ClipboardList} iconClassName="amber" />
          <StatCard label="Đã đóng" value={data.councilClosedCount} icon={ClipboardList} iconClassName="teal" />
          <StatCard label="Hoàn thành" value={data.councilCompletedCount} icon={CheckCircle} iconClassName="green" />
          <StatCard label="Đã hủy" value={data.councilCancelledCount} icon={ClipboardList} iconClassName="red" />
        </div>
      </section>

      {/* Major breakdown + Rubric */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <Building2 className="h-4 w-4" />
            Phân bổ theo chuyên ngành ({data.majorCount})
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left text-gray-500">
                  <th className="py-2 font-medium">Chuyên ngành</th>
                  <th className="py-2 text-right font-medium">Giảng viên</th>
                  <th className="py-2 text-right font-medium">Sinh viên</th>
                  <th className="py-2 text-right font-medium">Đề tài</th>
                </tr>
              </thead>
              <tbody>
                {data.majorBreakdown.map((m) => (
                  <tr key={m.majorId} className="border-b last:border-0">
                    <td className="py-2">
                      <div className="font-medium text-gray-900">{m.majorName}</div>
                      <div className="text-xs text-gray-500">{m.majorCode}</div>
                    </td>
                    <td className="py-2 text-right">{m.lecturerCount}</td>
                    <td className="py-2 text-right">{m.studentCount}</td>
                    <td className="py-2 text-right">{m.topicCount}</td>
                  </tr>
                ))}
                {data.majorBreakdown.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-gray-500">
                      Chưa có chuyên ngành nào trong khoa.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="rounded-xl border border-gray-200 bg-white p-5">
          <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold uppercase tracking-wide text-gray-500">
            <BookMarked className="h-4 w-4" />
            Tiêu chí chấm
          </h2>
          <div className="flex flex-col gap-4">
            <div>
              <p className="text-3xl font-bold text-blue-700">{data.rubricInUseCount}</p>
              <p className="mt-1 text-sm text-gray-500">
                Bộ tiêu chí đang được sử dụng trong các hội đồng thuộc khoa
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Recent activity */}
      <section className="rounded-xl border border-gray-200 bg-white p-5">
        <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-gray-500">
          Hoạt động gần đây
        </h2>
        {activity.length === 0 ? (
          <p className="py-4 text-center text-sm text-gray-500">
            Chưa có hoạt động nào.
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {activity.map((a, i) => (
              <li key={i} className="flex items-center justify-between py-2 text-sm">
                <div>
                  <div className="font-medium text-gray-900">{a.title}</div>
                  {a.subtitle && <div className="text-xs text-gray-500">{a.subtitle}</div>}
                </div>
                <div className="text-xs text-gray-500">
                  {new Date(a.at).toLocaleString("vi-VN")}
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
