"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { BookOpen, CheckCircle, GraduationCap, FileText, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function LecturerDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ topics: 0, pendingProposals: 0, students: 0, reports: 0 });

  useEffect(() => {
    Promise.all([
      api.get("/topics").catch(() => ({ data: [] })),
      api.get("/topic-proposals/pending").catch(() => ({ data: [] })),
    ]).then(([topicRes, propRes]) => {
      const topics = topicRes.data || [];
      const pending = propRes.data || [];
      setStats({
        topics: topics.length,
        pendingProposals: pending.length,
        students: topics.reduce((acc: number, t: { currentStudents: number }) => acc + (t.currentStudents || 0), 0),
        reports: 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    {
      label: "Đề tài của tôi",
      value: stats.topics,
      icon: <BookOpen className="h-6 w-6 text-blue-600" />,
      color: "bg-blue-50",
      href: "/lecturer/topics",
    },
    {
      label: "Đề xuất chờ duyệt",
      value: stats.pendingProposals,
      icon: <CheckCircle className="h-6 w-6 text-amber-600" />,
      color: "bg-amber-50",
      href: "/lecturer/topic-proposals",
    },
    {
      label: "Sinh viên đang hướng dẫn",
      value: stats.students,
      icon: <GraduationCap className="h-6 w-6 text-green-600" />,
      color: "bg-green-50",
      href: "/lecturer/students",
    },
    {
      label: "Báo cáo chờ duyệt",
      value: stats.reports,
      icon: <FileText className="h-6 w-6 text-purple-600" />,
      color: "bg-purple-50",
      href: "/lecturer/students",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.fullName}</h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((i) => <CardSkeleton key={i} />)}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.fullName}</h1>
        <p className="mt-1 text-sm text-gray-500">Đây là trang tổng quan giảng viên</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Link key={card.label} href={card.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${card.color}`}>
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

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Đề xuất cần duyệt"
          action={
            <Link href="/lecturer/topic-proposals" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {stats.pendingProposals === 0 ? (
            <p className="text-sm text-gray-400">Không có đề xuất nào cần duyệt</p>
          ) : (
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-amber-100 p-3">
                <CheckCircle className="h-6 w-6 text-amber-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-amber-700">{stats.pendingProposals}</p>
                <p className="text-sm text-gray-500">đề xuất đang chờ duyệt</p>
              </div>
            </div>
          )}
        </Card>

        <Card
          title="Thao tác nhanh"
          action={
            <Link href="/lecturer/topics" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
              Quản lý đề tài <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Link href="/lecturer/topics">
              <div className="rounded-lg border border-gray-200 p-3 text-center transition-colors hover:border-blue-300 hover:bg-blue-50">
                <BookOpen className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">Tạo đề tài mới</p>
              </div>
            </Link>
            <Link href="/lecturer/progress-plans">
              <div className="rounded-lg border border-gray-200 p-3 text-center transition-colors hover:border-green-300 hover:bg-green-50">
                <CheckCircle className="mx-auto mb-2 h-6 w-6 text-green-600" />
                <p className="text-sm font-medium text-gray-700">Tạo kế hoạch</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
