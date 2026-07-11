"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import Link from "next/link";
import { CardSkeleton } from "@/components/ui/Skeleton";
import HeroBanner from "@/components/common/HeroBanner";
import StatCard from "@/components/common/StatCard";
import SectionCard from "@/components/common/SectionCard";
import QuickActions from "@/components/common/QuickActions";
import Timeline from "@/components/common/Timeline";
import { getRoleTheme } from "@/lib/roleTheme";
import { useAuth } from "@/contexts/AuthContext";
import {
  ClipboardCheck,
  Users,
  BookMarked,
  GraduationCap,
  BookOpen,
  CalendarRange,
  ArrowRight,
  CheckSquare,
} from "lucide-react";

interface DashboardStats {
  pendingTopics: number;
  councils: number;
  rubrics: number;
  lecturers: number;
  approvedTopics?: number;
}

export default function HeadDashboard() {
  const { user } = useAuth();
  const theme = getRoleTheme(user?.role);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    pendingTopics: 0,
    councils: 0,
    rubrics: 0,
    lecturers: 0,
  });
  const [recent, setRecent] = useState<{ id: string; title: string; createdAt?: string }[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/topics?status=APPROVED").catch(() => ({ data: [] })),
      api.get("/councils").catch(() => ({ data: [] })),
      api.get("/rubrics").catch(() => ({ data: [] })),
      api.get("/shared/lecturers").catch(() => ({ data: [] })),
    ]).then(([topicsRes, councilsRes, rubricsRes, lecturersRes]) => {
      const topics: { id: string; title: string; createdAt?: string }[] =
        topicsRes.data || [];
      setStats({
        pendingTopics: topics.length,
        councils: (councilsRes.data || []).length,
        rubrics: (rubricsRes.data || []).length,
        lecturers: (lecturersRes.data || []).length,
      });
      setRecent(topics.slice(0, 6));
      setLoading(false);
    });
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <CardSkeleton />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <CardSkeleton />
          <CardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <HeroBanner
        fullName={user?.fullName || "Trưởng bộ môn"}
        roleLabel={theme.roleLabel}
        subtitle="Điều phối & phê duyệt"
        email={user?.email}
        highlight={`${stats.pendingTopics} đề tài chờ`}
        theme={theme}
        actions={
          <>
            <Link
              href="/head/assignments"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-2 text-sm font-semibold text-cyan-700 shadow-sm transition hover:bg-white"
            >
              <ClipboardCheck className="h-4 w-4" />
              Phân công giảng viên
            </Link>
            <Link
              href="/head/councils"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Users className="h-4 w-4" />
              Hội đồng
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Đề tài chờ phân công"
          value={stats.pendingTopics}
          tone="amber"
          icon={<BookOpen className="h-5 w-5" />}
          hint="Đề tài đã duyệt cần phân công"
          href="/head/assignments"
          sparkline="0,18 12,16 24,15 36,12 48,10 60,9 72,7 84,6 100,5"
          sparklineColor="#d97706"
        />
        <StatCard
          label="Hội đồng báo cáo"
          value={stats.councils}
          tone="blue"
          icon={<Users className="h-5 w-5" />}
          hint="Hội đồng đã thành lập"
          href="/head/councils"
          sparkline="0,20 12,18 24,16 36,14 48,12 60,10 72,8 84,7 100,6"
          sparklineColor="#2563eb"
        />
        <StatCard
          label="Bộ tiêu chí chấm"
          value={stats.rubrics}
          tone="violet"
          icon={<BookMarked className="h-5 w-5" />}
          hint="Tiêu chí đang được áp dụng"
          href="/head/rubrics"
          sparkline="0,20 12,18 24,16 36,14 48,12 60,10 72,8 84,6 100,5"
          sparklineColor="#7c3aed"
        />
        <StatCard
          label="Giảng viên thuộc khoa"
          value={stats.lecturers}
          tone="emerald"
          icon={<GraduationCap className="h-5 w-5" />}
          hint="Sẵn sàng phân công"
          href="/head/assignments"
          sparkline="0,22 12,20 24,18 36,16 48,14 60,12 72,10 84,8 100,6"
          sparklineColor="#059669"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Đề tài mới được duyệt"
          subtitle="Đề tài mới đang chờ phân công giảng viên"
          icon={<CheckSquare className="h-4 w-4" />}
          className="lg:col-span-2"
          actions={
            <Link
              href="/head/assignments"
              className="inline-flex items-center gap-1 text-xs font-semibold text-cyan-700 hover:text-cyan-900"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {recent.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có đề tài nào chờ phân công.</p>
          ) : (
            <Timeline
              items={recent.map((t, idx) => ({
                id: t.id || idx,
                title: t.title,
                status: "active",
                pill: "Chờ phân công",
                date: t.createdAt
                  ? new Date(t.createdAt).toLocaleDateString("vi-VN")
                  : "—",
              }))}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Lịch trình học thuật"
          subtitle="Các mốc quan trọng trong học kỳ"
          icon={<CalendarRange className="h-4 w-4" />}
        >
          <Timeline
            items={[
              { id: 1, title: "Mở đăng ký đề tài", status: "done", pill: "Hoàn thành" },
              { id: 2, title: "Phân công giảng viên hướng dẫn", status: "active", pill: "Đang tiến hành" },
              { id: 3, title: "Nộp đề cương chi tiết", status: "todo", pill: "Sắp tới" },
              { id: 4, title: "Báo cáo giữa kỳ", status: "todo", pill: "Sắp tới" },
              { id: 5, title: "Bảo vệ đồ án", status: "todo", pill: "Sắp tới" },
            ]}
          />
        </SectionCard>
      </div>

      <QuickActions
        title="Hành động nhanh"
        subtitle="Truy cập nhanh các module quản lý học thuật"
        actions={[
          {
            href: "/head/assignments",
            label: "Phân công",
            icon: <ClipboardCheck />,
            className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
          },
          {
            href: "/head/councils",
            label: "Hội đồng",
            icon: <Users />,
            className: "bg-blue-50 text-blue-600 hover:bg-blue-100",
          },
          {
            href: "/head/rubrics",
            label: "Tiêu chí",
            icon: <BookMarked />,
            className: "bg-violet-50 text-violet-600 hover:bg-violet-100",
          },
          {
            href: "/head/assignments",
            label: "Giảng viên",
            icon: <GraduationCap />,
            className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
          },
        ]}
      />
    </div>
  );
}
