"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Users, BookOpen, CheckCircle, FileText, BarChart3 } from "lucide-react";
import Link from "next/link";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    users: 0,
    topics: 0,
    openTopics: 0,
    pendingReports: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get("/topics").catch(() => ({ data: [] as { status: string }[] })),
      api.get("/admin/users").catch(() => ({ data: [] as object[] })),
    ])
      .then(([topicRes, userRes]) => {
        const topics: { status: string }[] = topicRes.data || [];
        const users: object[] = userRes.data || [];
        setStats({
          users: users.length,
          topics: topics.length,
          openTopics: topics.filter(
            (t) => t.status === "OPEN" || t.status === "Open"
          ).length,
          pendingReports: 0,
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const cards = [
    {
      label: "Người dùng",
      value: stats.users,
      icon: <Users className="h-6 w-6" />,
      colorClass: "bg-indigo-50 text-indigo-600",
      href: "/admin/users",
    },
    {
      label: "Tổng đề tài",
      value: stats.topics,
      icon: <BookOpen className="h-6 w-6" />,
      colorClass: "bg-violet-50 text-violet-600",
      href: "/admin/topics",
    },
    {
      label: "Đề tài đang mở",
      value: stats.openTopics,
      icon: <CheckCircle className="h-6 w-6" />,
      colorClass: "bg-emerald-50 text-emerald-600",
      href: "/admin/topics",
    },
    {
      label: "Báo cáo chờ duyệt",
      value: stats.pendingReports,
      icon: <FileText className="h-6 w-6" />,
      colorClass: "bg-amber-50 text-amber-600",
      href: "/admin/reports",
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
          Trang quản trị hệ thống ThesisMS
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
        <Card title="Thống kê nhanh">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng người dùng</span>
              <span className="font-semibold text-indigo-600">{stats.users}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Đề tài đang mở</span>
              <span className="font-semibold text-emerald-600">{stats.openTopics}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Đề tài đã đóng</span>
              <span className="font-semibold text-gray-600">
                {stats.topics - stats.openTopics}
              </span>
            </div>
          </div>
        </Card>

        <Card title="Thao tác quản trị">
          <div className="grid grid-cols-2 gap-3">
            <Link href="/admin/users">
              <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-indigo-200 hover:bg-indigo-50">
                <Users className="mx-auto mb-2 h-6 w-6 text-indigo-600" />
                <p className="text-sm font-medium text-gray-700">Quản lý người dùng</p>
              </div>
            </Link>
            <Link href="/admin/departments">
              <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-violet-200 hover:bg-violet-50">
                <BarChart3 className="mx-auto mb-2 h-6 w-6 text-violet-600" />
                <p className="text-sm font-medium text-gray-700">Khoa / Ngành</p>
              </div>
            </Link>
            <Link href="/admin/topic-categories">
              <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50">
                <BookOpen className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
                <p className="text-sm font-medium text-gray-700">Danh mục đề tài</p>
              </div>
            </Link>
            <Link href="/admin/audit-log">
              <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-amber-200 hover:bg-amber-50">
                <FileText className="mx-auto mb-2 h-6 w-6 text-amber-600" />
                <p className="text-sm font-medium text-gray-700">Nhật ký hệ thống</p>
              </div>
            </Link>
          </div>
        </Card>
      </div>
    </div>
  );
}
