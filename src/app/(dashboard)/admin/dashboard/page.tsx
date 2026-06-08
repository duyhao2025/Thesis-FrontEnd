"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Users, BookOpen, FileText, CheckCircle, BarChart3 } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ users: 0, topics: 0, openTopics: 0, pendingReports: 0 });

  useEffect(() => {
    Promise.all([
      api.get("/topics").catch(() => ({ data: [] })),
    ]).then(([topicRes]) => {
      const topics = topicRes.data || [];
      setStats({
        users: 0,
        topics: topics.length,
        openTopics: topics.filter((t: { status: string }) => t.status === "OPEN").length,
        pendingReports: 0,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    {
      label: "Người dùng",
      value: stats.users,
      icon: <Users className="h-6 w-6 text-blue-600" />,
      color: "bg-blue-50",
      href: "/admin/users",
    },
    {
      label: "Tổng đề tài",
      value: stats.topics,
      icon: <BookOpen className="h-6 w-6 text-indigo-600" />,
      color: "bg-indigo-50",
      href: "/admin/users",
    },
    {
      label: "Đề tài đang mở",
      value: stats.openTopics,
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      color: "bg-green-50",
      href: "/admin/users",
    },
    {
      label: "Báo cáo chờ duyệt",
      value: stats.pendingReports,
      icon: <FileText className="h-6 w-6 text-amber-600" />,
      color: "bg-amber-50",
      href: "/admin/users",
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
        <p className="mt-1 text-sm text-gray-500">Trang quản trị hệ thống</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label} className="cursor-pointer transition-shadow hover:shadow-md">
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
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Thống kê nhanh">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Tổng người dùng</span>
              <span className="font-semibold text-blue-600">{stats.users}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Đề tài đang mở</span>
              <span className="font-semibold text-green-600">{stats.openTopics}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Đề tài đã đóng</span>
              <span className="font-semibold text-gray-600">{stats.topics - stats.openTopics}</span>
            </div>
          </div>
        </Card>

        <Card title="Thao tác quản trị">
          <div className="grid grid-cols-2 gap-3">
            <a href="/admin/users">
              <div className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-blue-300 hover:bg-blue-50">
                <Users className="mx-auto mb-2 h-6 w-6 text-blue-600" />
                <p className="text-sm font-medium text-gray-700">Quản lý người dùng</p>
              </div>
            </a>
            <a href="/admin/users">
              <div className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-indigo-300 hover:bg-indigo-50">
                <BarChart3 className="mx-auto mb-2 h-6 w-6 text-indigo-600" />
                <p className="text-sm font-medium text-gray-700">Xem thống kê</p>
              </div>
            </a>
          </div>
        </Card>
      </div>
    </div>
  );
}
