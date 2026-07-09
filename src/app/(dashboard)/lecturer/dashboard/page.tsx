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
import ProgressCard from "@/components/common/ProgressCard";
import { getRoleTheme } from "@/lib/roleTheme";
import {
  BookOpen,
  CheckCircle,
  GraduationCap,
  FileText,
  ClipboardList,
  ListChecks,
  Plus,
  ArrowRight,
} from "lucide-react";

interface TopicSummary {
  id: string;
  title: string;
  status?: string;
  currentStudents?: number;
  maxStudents?: number;
}

export default function LecturerDashboard() {
  const { user } = useAuth();
  const theme = getRoleTheme(user?.role);

  const [loading, setLoading] = useState(true);
  const [topics, setTopics] = useState<TopicSummary[]>([]);
  const [pendingProposals, setPendingProposals] = useState(0);

  useEffect(() => {
    Promise.all([
      api.get("/topics/my").catch(() => ({ data: [] })),
      api.get("/topic-proposals/pending").catch(() => ({ data: [] })),
    ]).then(([topicRes, propRes]) => {
      const t: TopicSummary[] = topicRes.data || [];
      setTopics(t);
      setPendingProposals((propRes.data || []).length);
      setLoading(false);
    });
  }, []);

  const totalStudents = useMemo(
    () =>
      topics.reduce(
        (acc, t) => acc + (t.currentStudents || 0),
        0
      ),
    [topics]
  );
  const maxStudents = useMemo(
    () =>
      topics.reduce(
        (acc, t) => acc + (t.maxStudents || 0),
        0
      ),
    [topics]
  );
  const openTopics = topics.filter(
    (t) => t.status === "OPEN" || t.status === "Open"
  ).length;
  // Mocked progress — represents average advancement
  const avgProgress = topics.length
    ? Math.min(100, Math.round(35 + topics.length * 5))
    : 0;

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
        fullName={user?.fullName || "Giảng viên"}
        roleLabel={theme.roleLabel}
        subtitle="Hướng dẫn & phản biện"
        email={user?.email}
        highlight={`${topics.length} đề tài`}
        theme={theme}
        actions={
          <>
            <Link
              href="/lecturer/topics/new"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-2 text-sm font-semibold text-teal-700 shadow-sm transition hover:bg-white"
            >
              <Plus className="h-4 w-4" />
              Tạo đề tài
            </Link>
            <Link
              href="/lecturer/topic-proposals"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <ListChecks className="h-4 w-4" />
              Duyệt đề xuất
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Đề tài của tôi"
          value={topics.length}
          tone="teal"
          icon={<BookOpen className="h-5 w-5" />}
          hint={`${openTopics} đề tài đang mở`}
          href="/lecturer/topics"
          sparkline="0,18 12,17 24,14 36,15 48,12 60,11 72,9 84,8 100,6"
          sparklineColor="#0d9488"
        />
        <StatCard
          label="Đề xuất chờ duyệt"
          value={pendingProposals}
          tone="amber"
          icon={<CheckCircle className="h-5 w-5" />}
          hint="Sinh viên đề xuất cần xem xét"
          href="/lecturer/topic-proposals"
          sparkline="0,20 12,18 24,15 36,12 48,10 60,8 72,6 84,5 100,4"
          sparklineColor="#d97706"
        />
        <StatCard
          label="Sinh viên đang hướng dẫn"
          value={totalStudents}
          tone="emerald"
          icon={<GraduationCap className="h-5 w-5" />}
          hint={
            maxStudents > 0
              ? `Tối đa: ${maxStudents} sinh viên`
              : "Chưa có sinh viên"
          }
          href="/lecturer/students"
          sparkline="0,22 12,20 24,18 36,16 48,14 60,12 72,10 84,8 100,6"
          sparklineColor="#059669"
        />
        <StatCard
          label="Kế hoạch tiến độ"
          value="—"
          tone="violet"
          icon={<ClipboardList className="h-5 w-5" />}
          hint="Theo dõi & cập nhật"
          href="/lecturer/progress-plans"
          sparkline="0,20 12,18 24,16 36,15 48,13 60,12 72,10 84,9 100,7"
          sparklineColor="#7c3aed"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <ProgressCard
          title="Tiến độ hướng dẫn"
          subtitle={`Trung bình ${avgProgress}%`}
          badge="Tổng quan"
          progress={avgProgress}
          hint={`${topics.length} đề tài đang trong giai đoạn thực hiện`}
        />
        <SectionCard
          title="Đề xuất cần duyệt"
          subtitle="Đề xuất từ sinh viên đang chờ"
          icon={<ListChecks className="h-4 w-4" />}
          className="lg:col-span-2"
          actions={
            <Link
              href="/lecturer/topic-proposals"
              className="inline-flex items-center gap-1 text-xs font-semibold text-teal-600 hover:text-teal-800"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {pendingProposals === 0 ? (
            <p className="text-sm text-gray-500">
              Không có đề xuất nào cần duyệt lúc này.
            </p>
          ) : (
            <div className="flex items-center gap-3 rounded-lg border border-amber-100 bg-amber-50 p-4">
              <div className="rounded-full bg-amber-100 p-3">
                <CheckCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {pendingProposals}
                </p>
                <p className="text-sm text-gray-600">
                  đề xuất đang chờ phản hồi của bạn
                </p>
              </div>
              <Link
                href="/lecturer/topic-proposals"
                className="ml-auto rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-amber-700"
              >
                Duyệt ngay
              </Link>
            </div>
          )}
        </SectionCard>
      </div>

      <QuickActions
        title="Thao tác nhanh"
        subtitle="Truy cập nhanh các module giảng viên"
        actions={[
          {
            href: "/lecturer/topics",
            label: "Đề tài",
            icon: <BookOpen />,
            className: "bg-teal-50 text-teal-600 hover:bg-teal-100",
          },
          {
            href: "/lecturer/students",
            label: "Sinh viên",
            icon: <GraduationCap />,
            className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
          },
          {
            href: "/lecturer/topic-proposals",
            label: "Duyệt đề xuất",
            icon: <CheckCircle />,
            className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
          },
          {
            href: "/lecturer/progress-plans",
            label: "Kế hoạch",
            icon: <FileText />,
            className: "bg-violet-50 text-violet-600 hover:bg-violet-100",
          },
        ]}
      />
    </div>
  );
}
