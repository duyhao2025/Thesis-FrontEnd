"use client";

import React, { useEffect, useState } from "react";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import {
  ClipboardCheck,
  Users,
  BookMarked,
  GraduationCap,
  BookOpen,
} from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";

interface DashboardStats {
  pendingTopics: number;
  councils: number;
  rubrics: number;
  lecturers: number;
}

export default function HeadDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<DashboardStats>({
    pendingTopics: 0,
    councils: 0,
    rubrics: 0,
    lecturers: 0,
  });

  useEffect(() => {
    Promise.all([
      api.get("/topics?status=APPROVED").catch(() => ({ data: [] })),
      api.get("/councils").catch(() => ({ data: [] })),
      api.get("/rubrics").catch(() => ({ data: [] })),
      api.get("/shared/lecturers").catch(() => ({ data: [] })),
    ]).then(([topicsRes, councilsRes, rubricsRes, lecturersRes]) => {
      const topics = topicsRes.data || [];
      setStats({
        pendingTopics: topics.length,
        councils: (councilsRes.data || []).length,
        rubrics: (rubricsRes.data || []).length,
        lecturers: (lecturersRes.data || []).length,
      });
      setLoading(false);
    });
  }, []);

  const cards = [
    {
      label: "Đề tài chờ phân công",
      value: stats.pendingTopics,
      icon: <BookOpen className="h-6 w-6" />,
      colorClass: "bg-amber-50 text-amber-600",
      href: "/head/assignments",
    },
    {
      label: "Hội đồng báo cáo",
      value: stats.councils,
      icon: <Users className="h-6 w-6" />,
      colorClass: "bg-blue-50 text-blue-600",
      href: "/head/councils",
    },
    {
      label: "Bộ tiêu chí chấm",
      value: stats.rubrics,
      icon: <BookMarked className="h-6 w-6" />,
      colorClass: "bg-violet-50 text-violet-600",
      href: "/head/rubrics",
    },
    {
      label: "Giảng viên thuộc khoa",
      value: stats.lecturers,
      icon: <GraduationCap className="h-6 w-6" />,
      colorClass: "bg-emerald-50 text-emerald-600",
      href: "/head/assignments",
    },
  ];

  if (loading) {
    return (
      <div className="space-y-6">
        <h1 className="text-2xl font-bold text-gray-900">
          Xin chào, {user?.fullName}
        </h1>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
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
          Trang tổng quan Trưởng bộ môn
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {cards.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card className="cursor-pointer transition-all hover:-translate-y-0.5 hover:shadow-lg">
              <div className="flex items-center gap-4">
                <div className={`rounded-xl p-3 ${stat.colorClass}`}>
                  {stat.icon}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.value}
                  </p>
                  <p className="text-sm text-gray-500">{stat.label}</p>
                </div>
              </div>
            </Card>
          </Link>
        ))}
      </div>

      <Card title="Hành động nhanh">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/head/assignments">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-amber-200 hover:bg-amber-50">
              <ClipboardCheck className="mx-auto mb-2 h-6 w-6 text-amber-600" />
              <p className="text-sm font-medium text-gray-700">
                Phân công giảng viên
              </p>
            </div>
          </Link>
          <Link href="/head/assignments">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-amber-200 hover:bg-amber-50">
              <ClipboardCheck className="mx-auto mb-2 h-6 w-6 text-amber-600" />
              <p className="text-sm font-medium text-gray-700">
                Phân công giảng viên
              </p>
            </div>
          </Link>
          <Link href="/head/councils">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-blue-200 hover:bg-blue-50">
              <Users className="mx-auto mb-2 h-6 w-6 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">
                Quản lý hội đồng
              </p>
            </div>
          </Link>
          <Link href="/head/rubrics">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-violet-200 hover:bg-violet-50">
              <BookMarked className="mx-auto mb-2 h-6 w-6 text-violet-600" />
              <p className="text-sm font-medium text-gray-700">Tiêu chí chấm</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
