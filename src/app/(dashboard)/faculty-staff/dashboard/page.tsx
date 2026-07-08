"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import StatusBadge from "@/components/ui/StatusBadge";
import {
  CalendarDays,
  BookOpen,
  CheckCircle,
  Users,
} from "lucide-react";
import Link from "next/link";
import { RegistrationPeriodResponse } from "@/types/entities";

export default function FacultyStaffDashboard() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [periods, setPeriods] = useState<RegistrationPeriodResponse[]>([]);

  useEffect(() => {
    api.get("/registration-periods")
      .then((res) => {
        setPeriods(res.data || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const openPeriods = periods.filter((p) => p.status === "OPEN").length;
  const closedPeriods = periods.filter((p) => p.status === "CLOSED").length;
  const draftPeriods = periods.filter((p) => p.status === "DRAFT").length;

  const cards = [
    {
      label: "Tổng đợt đăng ký",
      value: periods.length,
      icon: <CalendarDays className="h-6 w-6" />,
      colorClass: "bg-amber-50 text-amber-600",
    },
    {
      label: "Đợt đang mở",
      value: openPeriods,
      icon: <CheckCircle className="h-6 w-6" />,
      colorClass: "bg-emerald-50 text-emerald-600",
    },
    {
      label: "Đợt đã đóng",
      value: closedPeriods,
      icon: <BookOpen className="h-6 w-6" />,
      colorClass: "bg-gray-50 text-gray-600",
    },
    {
      label: "Bản nháp",
      value: draftPeriods,
      icon: <Users className="h-6 w-6" />,
      colorClass: "bg-amber-50 text-amber-600",
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
          Trang quản lý đợt đăng ký đề tài
        </p>
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
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
        ))}
      </div>

      {/* Recent periods */}
      <Card
        title="Đợt gần đây"
        action={
          <Link
            href="/faculty-staff/registration-periods"
            className="text-sm text-amber-600 hover:underline"
          >
            Quản lý đợt đăng ký
          </Link>
        }
      >
        {periods.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có đợt đăng ký nào</p>
        ) : (
          <div className="space-y-3">
            {periods.slice(0, 5).map((period) => (
              <div
                key={period.id}
                className="flex items-center justify-between rounded-lg border border-gray-100 p-4"
              >
                <div>
                  <p className="font-medium text-gray-900">{period.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(period.startDate).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(period.endDate).toLocaleDateString("vi-VN")}
                  </p>
                  <p className="mt-0.5 text-xs text-gray-400">
                    HK{period.term}
                  </p>
                </div>
                <StatusBadge status={period.status} />
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* Quick actions */}
      <Card title="Thao tác nhanh">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/faculty-staff/registration-periods">
            <div className="rounded-xl border-2 border-transparent p-4 text-center transition-all hover:border-amber-200 hover:bg-amber-50">
              <CalendarDays className="mx-auto mb-2 h-6 w-6 text-amber-600" />
              <p className="text-sm font-medium text-gray-700">
                Quản lý đợt đăng ký
              </p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
