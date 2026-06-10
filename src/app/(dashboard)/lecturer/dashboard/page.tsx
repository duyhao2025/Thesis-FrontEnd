"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  BookOpen,
  CheckCircle,
  GraduationCap,
  FileText,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    topics: 0,
    pendingProposals: 0,
    students: 0,
    reports: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get("/topics/my").catch(() => ({ data: [] })),
      api.get("/topic-proposals/pending").catch(() => ({ data: [] })),
    ]).then(([topicRes, propRes]) => {
      const topics = topicRes.data || [];
      const pending = propRes.data || [];
      setStats({
        topics: topics.length,
        pendingProposals: pending.length,
        students: topics.reduce(
          (acc: number, t: { currentStudents: number }) =>
            acc + (t.currentStudents || 0),
          0
        ),
        reports: 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    {
      label: "Đề tài của tôi",
      value: stats.topics,
      icon: <BookOpen className="h-6 w-6" />,
      colorClass: "bg-teal-50 text-teal-600",
      href: "/lecturer/topics",
    },
    {
      label: "Đề xuất chờ duyệt",
      value: stats.pendingProposals,
      icon: <CheckCircle className="h-6 w-6" />,
      colorClass: "bg-amber-50 text-amber-600",
      href: "/lecturer/topic-proposals",
    },
    {
      label: "Sinh viên đang hướng dẫn",
      value: stats.students,
      icon: <GraduationCap className="h-6 w-6" />,
      colorClass: "bg-emerald-50 text-emerald-600",
      href: "/lecturer/students",
    },
    {
      label: "Kế hoạch tiến độ",
      value: "—",
      icon: <FileText className="h-6 w-6" />,
      colorClass: "bg-violet-50 text-violet-600",
      href: "/lecturer/progress-plans",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.fullName}
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.fullName}
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Trang tổng quan giảng viên
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${card.colorClass}`}>
                  {card.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{card.value}</p>
                  <p className="text-sm text-gray-500">{card.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Two column layout */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Đề xuất cần duyệt"
          action={
            <Link
              href="/lecturer/topic-proposals"
              className="flex items-center gap-1 text-sm text-teal-600 hover:underline"
            >
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {stats.pendingProposals === 0 ? (
            <p className="text-sm text-gray-400">
              Không có đề xuất nào cần duyệt
            </p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3">
                <CheckCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">
                  {stats.pendingProposals}
                </p>
                <p className="text-sm text-gray-500">đề xuất đang chờ duyệt</p>
              </div>
            </div>
          )}
        </Card>

        <Card title="Thao tác nhanh">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/lecturer/topics">
              <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-teal-200 hover:bg-teal-50">
                <BookOpen className="mx-auto mb-2 h-6 w-6 text-teal-600" />
                <p className="text-sm font-medium text-gray-700">Quản lý đề tài</p>
              </div>
            </Link>
            <Link href="/lecturer/progress-plans">
              <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50">
                <FileText className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                <p className="text-sm font-medium text-gray-700">Kế hoạch tiến độ</p>
              </div>
            </Link>
            <Link href="/lecturer/students">
              <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-violet-200 hover:bg-violet-50">
                <GraduationCap className="mx-auto mb-2 h-6 w-6 text-violet-600" />
                <p className="text-sm font-medium text-gray-700">Sinh viên</p>
              </div>
            </Link>
            <Link href="/lecturer/topic-proposals">
              <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-amber-200 hover:bg-amber-50">
                <CheckCircle className="mx-auto mb-2 h-6 w-6 text-amber-600" />
                <p className="text-sm font-medium text-gray-700">Duyệt đề xuất</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
