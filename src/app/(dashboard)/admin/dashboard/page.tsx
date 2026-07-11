"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Link from "next/link";
import { CardSkeleton } from "@/components/ui/Skeleton";
import HeroBanner from "@/components/common/HeroBanner";
import StatCard from "@/components/common/StatCard";
import SectionCard from "@/components/common/SectionCard";
import QuickActions from "@/components/common/QuickActions";
import Timeline from "@/components/common/Timeline";
import { getRoleTheme } from "@/lib/roleTheme";
import {
  Users,
  BookOpen,
  CheckCircle,
  FileText,
  BarChart3,
  ShieldCheck,
  Building2,
  Tags,
  ScrollText,
  Activity,
  ArrowRight,
} from "lucide-react";

interface TopicSummary {
  id: string;
  title: string;
  status: string;
  createdAt?: string;
}

export default function AdminDashboard() {
  const { user } = useAuth();
  const theme = getRoleTheme(user?.role);

  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    topics: 0,
    openTopics: 0,
    closedTopics: 0,
    pendingReports: 0,
  });
  const [recentTopics, setRecentTopics] = useState<TopicSummary[]>([]);

  useEffect(() => {
    Promise.all([
      api.get("/topics").catch(() => ({ data: [] as TopicSummary[] })),
      api.get("/admin/users").catch(() => ({ data: [] as object[] })),
    ])
      .then(([topicRes, userRes]) => {
        const topics: TopicSummary[] = (topicRes.data || []).map((t: TopicSummary) => ({
          id: t.id,
          title: t.title,
          status: t.status,
          createdAt: t.createdAt,
        }));
        const users: object[] = userRes.data || [];
        const open = topics.filter(
          (t) => t.status === "OPEN" || t.status === "Open"
        ).length;
        setStats({
          users: users.length,
          topics: topics.length,
          openTopics: open,
          closedTopics: topics.length - open,
          pendingReports: 0,
        });
        setRecentTopics(topics.slice(0, 6));
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const sparkUsers = useMemo(
    () => "0,18 12,16 24,17 36,12 48,14 60,10 72,8 84,7 100,5",
    []
  );
  const sparkTopics = useMemo(
    () => "0,20 12,18 24,16 36,15 48,12 60,10 72,9 84,7 100,6",
    []
  );
  const sparkOpen = useMemo(
    () => "0,16 12,14 24,15 36,10 48,11 60,8 72,7 84,6 100,4",
    []
  );
  const sparkClosed = useMemo(
    () => "0,22 12,20 24,18 36,15 48,14 60,12 72,10 84,8 100,6",
    []
  );

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

  const quickActions = [
    {
      href: "/admin/users",
      label: "Người dùng",
      icon: <Users />,
      className: "bg-indigo-50 text-indigo-600 hover:bg-indigo-100",
    },
    {
      href: "/admin/departments",
      label: "Khoa / Ngành",
      icon: <Building2 />,
      className: "bg-violet-50 text-violet-600 hover:bg-violet-100",
    },
    {
      href: "/admin/topic-categories",
      label: "Danh mục",
      icon: <Tags />,
      className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
    },
    {
      href: "/admin/audit-log",
      label: "Nhật ký",
      icon: <ScrollText />,
      className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
    },
  ];

  const timelineItems = recentTopics.map((t, idx) => {
    const isOpen = t.status === "OPEN" || t.status === "Open";
    return {
      id: t.id || idx,
      title: t.title,
      status: isOpen ? "active" : "done",
      date: t.createdAt
        ? new Date(t.createdAt).toLocaleDateString("vi-VN")
        : "—",
      pill: isOpen ? "Đang mở" : "Đã đóng",
    } as const;
  });

  return (
    <div className="space-y-6">
      <HeroBanner
        fullName={user?.fullName || "Quản trị viên"}
        roleLabel={theme.roleLabel}
        subtitle="Bảng điều khiển hệ thống"
        email={user?.email}
        highlight="Quản trị cấp cao"
        theme={theme}
        actions={
          <>
            <Link
              href="/admin/users"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-2 text-sm font-semibold text-indigo-700 shadow-sm transition hover:bg-white"
            >
              <Users className="h-4 w-4" />
              Quản lý người dùng
            </Link>
            <Link
              href="/admin/topics"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <BookOpen className="h-4 w-4" />
              Đề tài hệ thống
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Người dùng"
          value={stats.users}
          tone="indigo"
          icon={<Users className="h-5 w-5" />}
          hint="Tổng tài khoản đang hoạt động"
          href="/admin/users"
          sparkline={sparkUsers}
          sparklineColor="#4f46e5"
        />
        <StatCard
          label="Tổng đề tài"
          value={stats.topics}
          tone="violet"
          icon={<BookOpen className="h-5 w-5" />}
          hint="Đề tài trong toàn hệ thống"
          href="/admin/topics"
          sparkline={sparkTopics}
          sparklineColor="#7c3aed"
        />
        <StatCard
          label="Đề tài đang mở"
          value={stats.openTopics}
          tone="emerald"
          icon={<CheckCircle className="h-5 w-5" />}
          hint="Đang nhận đăng ký"
          href="/admin/topics"
          sparkline={sparkOpen}
          sparklineColor="#059669"
        />
        <StatCard
          label="Báo cáo chờ duyệt"
          value={stats.pendingReports}
          tone="amber"
          icon={<FileText className="h-5 w-5" />}
          hint="Cần xử lý trong hôm nay"
          href="/admin/reports"
          sparkline={sparkClosed}
          sparklineColor="#d97706"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <SectionCard
          title="Tỷ lệ đề tài"
          subtitle="Phân bổ trạng thái đề tài trong hệ thống"
          icon={<BarChart3 className="h-4 w-4" />}
          className="lg:col-span-1"
        >
          <div className="space-y-4">
            <DistributionRow
              label="Đang mở"
              value={stats.openTopics}
              total={stats.topics}
              colorClass="bg-emerald-500"
            />
            <DistributionRow
              label="Đã đóng"
              value={stats.closedTopics}
              total={stats.topics}
              colorClass="bg-gray-400"
            />
            <div className="mt-2 rounded-lg border border-indigo-100 bg-indigo-50/60 p-3 text-xs text-indigo-800">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5" />
              Vai trò quản trị có toàn quyền thao tác trên mọi đề tài.
            </div>
          </div>
        </SectionCard>

        <SectionCard
          title="Hoạt động gần đây"
          subtitle="Các đề tài được tạo / cập nhật mới nhất"
          icon={<Activity className="h-4 w-4" />}
          className="lg:col-span-2"
          actions={
            <Link
              href="/admin/topics"
              className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {timelineItems.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có hoạt động nào.</p>
          ) : (
            <Timeline items={timelineItems} />
          )}
        </SectionCard>
      </div>

      <QuickActions
        title="Thao tác quản trị nhanh"
        subtitle="Truy cập nhanh các module quản trị hệ thống"
        actions={quickActions}
      />
    </div>
  );
}

function DistributionRow({
  label,
  value,
  total,
  colorClass,
}: {
  label: string;
  value: number;
  total: number;
  colorClass: string;
}) {
  const pct = total > 0 ? Math.round((value / total) * 100) : 0;
  return (
    <div>
      <div className="mb-1 flex items-center justify-between text-xs text-gray-600">
        <span className="font-medium">{label}</span>
        <span className="font-bold text-gray-900">
          {value} <span className="text-gray-400">({pct}%)</span>
        </span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-gray-100">
        <div
          className={`h-full rounded-full transition-all ${colorClass}`}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
