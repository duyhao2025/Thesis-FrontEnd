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
import { getRoleTheme } from "@/lib/roleTheme";
import {
  BookOpen,
  FileText,
  ClipboardList,
  Calendar,
  ArrowRight,
  Users,
  MapPin,
  Clock,
  CheckCircle2,
  PlusCircle,
  Send,
  LineChart,
} from "lucide-react";
import { format, parseISO } from "date-fns";
import { vi } from "date-fns/locale";

interface DefenseInfo {
  topicTitle: string;
  defenseDate: string;
  location: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const theme = getRoleTheme(user?.role);

  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<
    { topicTitle: string; status: string; submittedAt: string }[]
  >([]);
  const [proposals, setProposals] = useState<
    { title: string; status: string; createdAt: string }[]
  >([]);
  const [defense, setDefense] = useState<DefenseInfo | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/topic-registrations/my").catch(() => ({ data: [] })),
      api.get("/topic-proposals/my").catch(() => ({ data: [] })),
      api.get("/student/final-results/my").catch(() => ({ data: [] })),
    ]).then(([regRes, propRes, defRes]) => {
      setRegistrations(regRes.data || []);
      setProposals(propRes.data || []);
      const defenseList = defRes.data || [];
      if (defenseList.length > 0 && defenseList[0].defenseDate) {
        setDefense({
          topicTitle: defenseList[0].topicTitle,
          defenseDate: defenseList[0].defenseDate,
          location: defenseList[0].location,
        });
      }
      setLoading(false);
    });
  }, []);

  const pendingProposals = proposals.filter(
    (p) => p.status === "PENDING" || p.status === "Pending"
  );
  const approvedProposals = proposals.filter(
    (p) => p.status === "APPROVED" || p.status === "Approved"
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

  return (
    <div className="space-y-6">
      <HeroBanner
        fullName={user?.fullName || "Sinh viên"}
        roleLabel={theme.roleLabel}
        subtitle="Hành trình đồ án tốt nghiệp"
        email={user?.email}
        highlight={
          approvedProposals.length > 0
            ? "Có đề tài được duyệt"
            : pendingProposals.length > 0
              ? "Có đề xuất đang chờ"
              : "Sẵn sàng đăng ký"
        }
        theme={theme}
        actions={
          <>
            <Link
              href="/student/topic-registrations"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-white/95 px-3.5 py-2 text-sm font-semibold text-emerald-700 shadow-sm transition hover:bg-white"
            >
              <PlusCircle className="h-4 w-4" />
              Đăng ký đề tài
            </Link>
            <Link
              href="/student/topic-proposals"
              className="inline-flex items-center justify-center gap-1.5 rounded-lg border border-white/40 bg-white/10 px-3.5 py-2 text-sm font-semibold text-white backdrop-blur transition hover:bg-white/20"
            >
              <Send className="h-4 w-4" />
              Đề xuất mới
            </Link>
          </>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard
          label="Đề tài đã đăng ký"
          value={registrations.length}
          tone="emerald"
          icon={<BookOpen className="h-5 w-5" />}
          hint="Đề tài đang tham gia"
          href="/student/topic-registrations"
          sparkline="0,18 12,16 24,15 36,13 48,11 60,10 72,8 84,7 100,5"
          sparklineColor="#059669"
        />
        <StatCard
          label="Đề xuất chờ duyệt"
          value={pendingProposals.length}
          tone="amber"
          icon={<FileText className="h-5 w-5" />}
          hint="Đang chờ phản hồi"
          href="/student/topic-proposals"
          sparkline="0,20 12,18 24,15 36,12 48,10 60,9 72,7 84,6 100,4"
          sparklineColor="#d97706"
        />
        <StatCard
          label="Đề xuất đã duyệt"
          value={approvedProposals.length}
          tone="teal"
          icon={<CheckCircle2 className="h-5 w-5" />}
          hint="Sẵn sàng thực hiện"
          href="/student/topic-proposals"
          sparkline="0,22 12,20 24,18 36,16 48,14 60,12 72,10 84,8 100,6"
          sparklineColor="#0d9488"
        />
        <StatCard
          label="Tiến độ học tập"
          value="—"
          tone="violet"
          icon={<LineChart className="h-5 w-5" />}
          hint="Cập nhật nhật ký tiến độ"
          href="/student/my-topic"
          sparkline="0,20 12,18 24,16 36,14 48,12 60,10 72,8 84,6 100,5"
          sparklineColor="#7c3aed"
        />
      </div>

      {defense && (
        <SectionCard
          title={
            <span className="flex items-center gap-2">
              <Users className="h-5 w-5 text-emerald-600" />
              Hội đồng báo cáo
            </span>
          }
          actions={
            <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-semibold text-emerald-700">
              <CheckCircle2 className="h-3 w-3" />
              Đã xếp lịch
            </span>
          }
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div className="rounded-lg border border-emerald-100 bg-emerald-50/50 p-3">
              <p className="text-xs font-medium uppercase text-emerald-700">
                Đề tài
              </p>
              <p className="mt-1 line-clamp-2 text-sm font-medium text-gray-900">
                {defense.topicTitle}
              </p>
            </div>
            <div className="rounded-lg border border-amber-100 bg-amber-50/50 p-3">
              <p className="flex items-center gap-1 text-xs font-medium uppercase text-amber-700">
                <Calendar className="h-3 w-3" />
                Ngày báo cáo
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {format(parseISO(defense.defenseDate), "dd/MM/yyyy", {
                  locale: vi,
                })}
              </p>
              <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-600">
                <Clock className="h-3 w-3" />
                {format(parseISO(defense.defenseDate), "HH:mm", { locale: vi })}
              </p>
            </div>
            <div className="rounded-lg border border-violet-100 bg-violet-50/50 p-3">
              <p className="flex items-center gap-1 text-xs font-medium uppercase text-violet-700">
                <MapPin className="h-3 w-3" />
                Phòng
              </p>
              <p className="mt-1 text-sm font-semibold text-gray-900">
                {defense.location}
              </p>
            </div>
          </div>
        </SectionCard>
      )}

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <SectionCard
          title="Đăng ký gần đây"
          icon={<BookOpen className="h-4 w-4" />}
          actions={
            <Link
              href="/student/topic-registrations"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {registrations.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có đăng ký nào.</p>
          ) : (
            <Timeline
              items={registrations.slice(0, 5).map((r, i) => ({
                id: `${r.topicTitle}-${i}`,
                title: r.topicTitle,
                status: "active",
                pill: r.status,
                date: r.submittedAt
                  ? new Date(r.submittedAt).toLocaleDateString("vi-VN")
                  : "—",
              }))}
            />
          )}
        </SectionCard>

        <SectionCard
          title="Đề xuất gần đây"
          icon={<FileText className="h-4 w-4" />}
          actions={
            <Link
              href="/student/topic-proposals"
              className="inline-flex items-center gap-1 text-xs font-semibold text-emerald-700 hover:text-emerald-900"
            >
              Xem tất cả <ArrowRight className="h-3 w-3" />
            </Link>
          }
        >
          {proposals.length === 0 ? (
            <p className="text-sm text-gray-500">Chưa có đề xuất nào.</p>
          ) : (
            <Timeline
              items={proposals.slice(0, 5).map((p, i) => {
                const isPending =
                  p.status === "PENDING" || p.status === "Pending";
                const isApproved =
                  p.status === "APPROVED" || p.status === "Approved";
                return {
                  id: `${p.title}-${i}`,
                  title: p.title,
                  status: isPending ? "active" : isApproved ? "done" : "todo",
                  pill: p.status,
                  date: p.createdAt
                    ? new Date(p.createdAt).toLocaleDateString("vi-VN")
                    : "—",
                };
              })}
            />
          )}
        </SectionCard>
      </div>

      <QuickActions
        title="Hành động nhanh"
        subtitle="Truy cập nhanh các chức năng sinh viên"
        actions={[
          {
            href: "/student/topic-registrations",
            label: "Đăng ký đề tài",
            icon: <BookOpen />,
            className: "bg-emerald-50 text-emerald-600 hover:bg-emerald-100",
          },
          {
            href: "/student/topic-proposals",
            label: "Đề xuất mới",
            icon: <FileText />,
            className: "bg-amber-50 text-amber-600 hover:bg-amber-100",
          },
          {
            href: "/student/progress-logs",
            label: "Nhật ký tiến độ",
            icon: <ClipboardList />,
            className: "bg-teal-50 text-teal-600 hover:bg-teal-100",
          },
          {
            href: "/student/my-topic",
            label: "Đề tài của tôi",
            icon: <Calendar />,
            className: "bg-violet-50 text-violet-600 hover:bg-violet-100",
          },
        ]}
      />
    </div>
  );
}
