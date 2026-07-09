"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { CardSkeleton } from "@/components/ui/Skeleton";
import HeroBanner from "@/components/common/HeroBanner";
import StatCard from "@/components/common/StatCard";
import SectionCard from "@/components/common/SectionCard";
import QuickActions from "@/components/common/QuickActions";
import Timeline from "@/components/common/Timeline";
import StatusBadge from "@/components/ui/StatusBadge";
import { getRoleTheme } from "@/lib/roleTheme";
import { RegistrationPeriodResponse } from "@/types/entities";
import {
  CalendarDays,
  CheckCircle,
  BookOpen,
  Users,
  FileSpreadsheet,
  Layers,
  ArrowRight,
  Pencil,
} from "lucide-react";

export default function FacultyStaffDashboard() {
  const { user } = useAuth();
  const theme = getRoleTheme(user?.role);

  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<RegistrationPeriodResponse[]>([]);

  useEffect(() => {
    api
      .get("/registration-periods")
      .then((res) => setPeriods(res.data || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openPeriods = periods.filter((p) => p.status === "OPEN").length;
  const closedPeriods = periods.filter((p) => p.status === "CLOSED").length;
  const draftPeriods = periods.filter((p) => p.status === "DRAFT").length;

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <CardSkeleton />
      </div>
    );
  }

  const recent = periods.slice(0, 6);
  const timelineItems = recent.map((p) => {
    const status =
      p.status === "OPEN" ? "active" : p.status === "CLOSED" ? "done" : "todo";
    return {
      id: p.id,
      title: p.name,
      description: `${new Date(p.startDate).toLocaleDateString("vi-VN")} – ${new Date(p.endDate).toLocaleDateString("vi-VN")} • ${p.semesterName}`,
      status: status as "active" | "done" | "todo",
      pill:
        p.status === "OPEN"
          ? "Đang mở"
          : p.status === "CLOSED"
            ? "Đã đóng"
            : "Bản nháp",
    };
  });

  return (
    <div className="space-y-6">
      <HeroBanner
        fullName={user?.fullName || "Nhân viên khoa"}
        roleLabel={theme.roleLabel}
        subtitle="Vận hành đợt đăng ký"
        email={user?.email}
        highlight={`${openPeriods} đợt đang mở`}
        theme={theme}
        actions={
          <>
            <Link
              href="/faculty-staff/registration-periods"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-2 text-sm font-semibold text-amber-700 shadow-sm transition hover:bg-white"
            >
              <CalendarDays className="h-4 w-4" />
              Quản lý đợt đăng ký
            </Link>
            <Link
              href="/faculty-staff/theses"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <BookOpen className="h-4 w-4" />
              Danh sách đồ án
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Tổng đợt đăng ký"
          value={periods.length}
          tone="amber"
          icon={<CalendarDays className="h-5 w-5" />}
          hint="Tất cả đợt đã tạo trong hệ thống"
          href="/faculty-staff/registration-periods"
          sparkline="0,18 12,16 24,15 36,13 48,11 60,10 72,8 84,7 100,6"
          sparklineColor="#d97706"
        />
        <StatCard
          label="Đợt đang mở"
          value={openPeriods}
          tone="emerald"
          icon={<CheckCircle className="h-5 w-5" />}
          hint="Đang nhận đăng ký từ sinh viên"
          href="/faculty-staff/registration-periods"
          sparkline="0,20 12,18 24,15 36,12 48,10 60,9 72,7 84,6 100,5"
          sparklineColor="#059669"
        />
        <StatCard
          label="Đợt đã đóng"
          value={closedPeriods}
          tone="gray"
          icon={<BookOpen className="h-5 w-5" />}
          hint="Đã kết thúc & lưu trữ"
          sparkline="0,22 12,20 24,18 36,16 48,14 60,12 72,10 84,8 100,6"
          sparklineColor="#6b7280"
        />
        <StatCard
          label="Bản nháp"
          value={draftPeriods}
          tone="orange"
          icon={<Pencil className="h-5 w-5" />}
          hint="Đang chuẩn bị mở"
          href="/faculty-staff/registration-periods"
          sparkline="0,20 12,18 24,16 36,14 48,12 60,10 72,8 84,7 100,5"
          sparklineColor="#ea580c"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Đợt đăng ký gần đây"
          subtitle="Cập nhật mới nhất từ hệ thống"
          icon={<CalendarDays className="h-4 w-4" />}
          className="lg:col-span-2"
          actions={
            <Link
              href="/faculty-staff/registration-periods"
              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 hover:text-amber-900"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {periods.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có đợt đăng ký nào.</p>
          ) : (
            <Timeline items={timelineItems} />
          )}
        </SectionCard>

        <SectionCard
          title="Đợt đang mở"
          subtitle="Đợt đang nhận đăng ký"
          icon={<Layers className="h-4 w-4" />}
        >
          {periods.filter((p) => p.status === "OPEN").length === 0 ? (
            <p className="text-sm text-gray-500">Hiện không có đợt nào đang mở.</p>
          ) : (
            <ul className="space-y-3">
              {periods
                .filter((p) => p.status === "OPEN")
                .slice(0, 4)
                .map((p) => (
                  <li
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-amber-100 bg-amber-50/70 p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-semibold text-gray-900">
                        {p.name}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500">
                        {new Date(p.startDate).toLocaleDateString("vi-VN")} –{" "}
                        {new Date(p.endDate).toLocaleDateString("vi-VN")}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </li>
                ))}
            </ul>
          )}
        </SectionCard>
      </div>

      <QuickActions
        title="Thao tác nhanh"
        subtitle="Truy cập nhanh các module vận hành khoa"
        actions={[
          {
            href: "/faculty-staff/registration-periods",
            label: "Đợt đăng ký",
            icon: <CalendarDays />,
            className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
          },
          {
            href: "/faculty-staff/theses",
            label: "Đồ án",
            icon: <BookOpen />,
            className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
          },
          {
            href: "/faculty-staff/students",
            label: "Sinh viên",
            icon: <Users />,
            className: "bg-blue-50 text-blue-600 hover:bg-blue-100",
          },
          {
            href: "/faculty-staff/import",
            label: "Import",
            icon: <FileSpreadsheet />,
            className: "bg-violet-50 text-violet-600 hover:bg-violet-100",
          },
        ]}
      />
    </div>
  );
}
