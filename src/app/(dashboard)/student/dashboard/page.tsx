"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  BookOpen,
  FileText,
  ClipboardList,
  Calendar,
  ArrowRight,
} from "lucide-react";
import Link from "next/link";

export default function StudentDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [registrations, setRegistrations] = useState<
    { topicTitle: string; status: string; submittedAt: string }[]
  >([]);
  const [proposals, setProposals] = useState<
    { title: string; status: string; createdAt: string }[]
  >([]);

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

  const pendingProposals = proposals.filter(
    (p) => p.status === "PENDING" || p.status === "Pending"
  );
  const approvedProposals = proposals.filter(
    (p) => p.status === "APPROVED" || p.status === "Approved"
  );

  const cards = [
    {
      label: "Đề tài đã đăng ký",
      value: registrations.length,
      icon: <BookOpen className="h-6 w-6" />,
      colorClass: "bg-emerald-50 text-emerald-600",
      href: "/student/topic-registrations",
    },
    {
      label: "Đề xuất chờ duyệt",
      value: pendingProposals.length,
      icon: <FileText className="h-6 w-6" />,
      colorClass: "bg-amber-50 text-amber-600",
      href: "/student/topic-proposals",
    },
    {
      label: "Đề xuất đã duyệt",
      value: approvedProposals.length,
      icon: <ClipboardList className="h-6 w-6" />,
      colorClass: "bg-green-50 text-green-600",
      href: "/student/topic-proposals",
    },
    {
      label: "Tiến độ học tập",
      value: "—",
      icon: <Calendar className="h-6 w-6" />,
      colorClass: "bg-violet-50 text-violet-600",
      href: "/student/my-topic",
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
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Xin chào, {user?.fullName}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Trang tổng quan sinh viên
          </p>
        </div>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${stat.colorClass}`}>
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

      {/* Recent activity */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <Card
          title="Đăng ký gần đây"
          action={
            <Link
              href="/student/topic-registrations"
              className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
            >
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {registrations.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có đăng ký nào</p>
          ) : (
            <div className="space-y-3">
              {registrations
                .slice(0, 3)
                .map((reg, idx) => (
                  <div
                    key={`${reg.topicTitle}-${idx}`}
                    className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                  >
                    <p className="truncate text-sm font-medium text-gray-800 max-w-[200px]">
                      {reg.topicTitle}
                    </p>
                    <span className="shrink-0 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-700">
                      {reg.status}
                    </span>
                  </div>
                ))}
            </div>
          )}
        </Card>

        <Card
          title="Đề xuất gần đây"
          action={
            <Link
              href="/student/topic-proposals"
              className="flex items-center gap-1 text-sm text-emerald-600 hover:underline"
            >
              Xem tất cả <ArrowRight className="h-4 w-4" />
            </Link>
          }
        >
          {proposals.length === 0 ? (
            <p className="text-sm text-gray-400">Chưa có đề xuất nào</p>
          ) : (
            <div className="space-y-3">
              {proposals.slice(0, 3).map((prop, idx) => (
                <div
                  key={`${prop.title}-${idx}`}
                  className="flex items-center justify-between rounded-lg border border-gray-100 p-3"
                >
                  <p className="truncate text-sm font-medium text-gray-800 max-w-[200px]">
                    {prop.title}
                  </p>
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      prop.status === "PENDING" || prop.status === "Pending"
                        ? "bg-amber-100 text-amber-700"
                        : prop.status === "APPROVED" || prop.status === "Approved"
                        ? "bg-green-100 text-green-700"
                        : "bg-red-100 text-red-700"
                    }`}
                  >
                    {prop.status}
                  </span>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>

      {/* Quick actions */}
      <Card title="Hành động nhanh">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/student/topic-registrations">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-emerald-200 hover:bg-emerald-50">
              <BookOpen className="mx-auto mb-2 h-6 w-6 text-emerald-600" />
              <p className="text-sm font-medium text-gray-700">Đăng ký đề tài</p>
            </div>
          </Link>
          <Link href="/student/topic-proposals">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-amber-200 hover:bg-amber-50">
              <FileText className="mx-auto mb-2 h-6 w-6 text-amber-600" />
              <p className="text-sm font-medium text-gray-700">Đề xuất mới</p>
            </div>
          </Link>
          <Link href="/student/progress-logs">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-green-200 hover:bg-green-50">
              <ClipboardList className="mx-auto mb-2 h-6 w-6 text-green-600" />
              <p className="text-sm font-medium text-gray-700">Nhật ký tiến độ</p>
            </div>
          </Link>
          <Link href="/student/my-topic">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-violet-200 hover:bg-violet-50">
              <Calendar className="mx-auto mb-2 h-6 w-6 text-violet-600" />
              <p className="text-sm font-medium text-gray-700">Đề tài của tôi</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
