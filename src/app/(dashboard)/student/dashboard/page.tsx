"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { BookOpen, FileText, ClipboardList, Calendar, ArrowRight } from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<unknown[]>([]);
  const [proposals, setProposals] = useState<unknown[]>([]);
  const [myTopic, setMyTopic] = useState<unknown | null>(null);

  useEffect(() => {
    Promise.all([
      api.get("/topic-registrations/my").catch(() => ({ data: [] })),
      api.get("/topic-proposals/my").catch(() => ({ data: [] })),
    ]).then(([regRes, propRes]) => {
      setRegistrations(regRes.data || []);
      setProposals(propRes.data || []);
      setLoading(false);
    });
  }, []);

  const stats = [
    {
      label: "Đề tài đã đăng ký",
      value: registrations.length,
      icon: <BookOpen className="h-6 w-6 text-blue-600" />,
      color: "bg-blue-50",
      href: "/student/topic-registrations",
    },
    {
      label: "Đề xuất đang chờ",
      value: proposals.filter((p: unknown) => (p as { status: string }).status === "PENDING").length,
      icon: <FileText className="h-6 w-6 text-amber-600" />,
      color: "bg-amber-50",
      href: "/student/topic-proposals",
    },
    {
      label: "Đề xuất đã duyệt",
      value: proposals.filter((p: unknown) => (p as { status: string }).status === "Approved").length,
      icon: <ClipboardList className="h-6 w-6 text-green-600" />,
      color: "bg-green-50",
      href: "/student/topic-proposals",
    },
    {
      label: "Nhật ký tiến độ",
      value: "—",
      icon: <Calendar className="h-6 w-6 text-purple-600" />,
      color: "bg-purple-50",
      href: "/student/progress-logs",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
          <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.fullName}</h1>
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Xin chào, {user?.fullName}</h1>
          <p className="mt-1 text-sm text-gray-500">Đây là trang tổng quan của bạn</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer transition-shadow hover:shadow-md">
              <div className="flex items-center gap-4">
                <div className={`rounded-lg p-3 ${stat.color}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card title="Đăng ký gần đây" action={
          <Link href="/student/topic-registrations" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        }>
          {registrations.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có đăng ký nào</p>
          ) : (
            <div className="space-y-3">
              {(registrations as { topicTitle: string; status: string; submittedAt: string }[]).slice(0, 3).map((reg, idx) => (
                <div key={`${reg.topicTitle}-${idx}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{reg.topicTitle}</p>
                  <span className="text-xs text-gray-500">{reg.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card title="Đề xuất gần đây" action={
          <Link href="/student/topic-proposals" className="text-sm text-blue-600 hover:underline flex items-center gap-1">
            Xem tất cả <ArrowRight className="h-4 w-4" />
          </Link>
        }>
          {proposals.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có đề xuất nào</p>
          ) : (
            <div className="space-y-3">
              {(proposals as { title: string; status: string; createdAt: string }[]).slice(0, 3).map((prop, idx) => (
                <div key={`${prop.title}-${idx}`} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                  <p className="text-sm font-medium text-gray-800 truncate max-w-[200px]">{prop.title}</p>
                  <span className="text-xs text-gray-500">{prop.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      <Card title="Hành động nhanh">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/student/topic-registrations">
            <div className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-blue-300 hover:bg-blue-50">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Đăng ký đề tài</p>
            </div>
          </Link>
          <Link href="/student/topic-proposals">
            <div className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-amber-300 hover:bg-amber-50">
              <FileText className="mx-auto mb-2 h-6 w-6 text-amber-600" />
              <p className="text-sm font-medium text-gray-700">Đề xuất mới</p>
            </div>
          </Link>
          <Link href="/student/progress-logs">
            <div className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-green-300 hover:bg-green-50">
              <ClipboardList className="mx-auto mb-2 h-6 w-6 text-green-600" />
              <p className="text-sm font-medium text-gray-700">Nhật ký tiến độ</p>
            </div>
          </Link>
          <Link href="/student/my-topic">
            <div className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-purple-300 hover:bg-purple-50">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-purple-600" />
              <p className="text-sm font-medium text-gray-700">Đề tài của tôi</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
