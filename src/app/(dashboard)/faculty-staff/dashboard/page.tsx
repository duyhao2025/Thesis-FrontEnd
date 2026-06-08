"use client";

import React, { useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import api from "@/lib/api";
import Card from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { CalendarDays, BookOpen, Users, CheckCircle } from "lucide-react";
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
      icon: <CalendarDays className="h-6 w-6 text-blue-600" />,
      color: "bg-blue-50",
    },
    {
      label: "Đợt đang mở",
      value: openPeriods,
      icon: <CheckCircle className="h-6 w-6 text-green-600" />,
      color: "bg-green-50",
    },
    {
      label: "Đợt đã đóng",
      value: closedPeriods,
      icon: <BookOpen className="h-6 w-6 text-gray-600" />,
      color: "bg-gray-50",
    },
    {
      label: "Bản nháp",
      value: draftPeriods,
      icon: <Users className="h-6 w-6 text-amber-600" />,
      color: "bg-amber-50",
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
        <p className="mt-1 text-sm text-gray-500">Trang quản lý đợt đăng ký đề tài</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <Card key={card.label}>
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

      <Card
        title="Đợt gần đây"
        action={
          <Link href="/faculty-staff/registration-periods" className="text-sm text-blue-600 hover:underline">
            Quản lý đợt đăng ký
          </Link>
        }
      >
        {periods.length === 0 ? (
          <p className="text-sm text-gray-400">Chưa có đợt đăng ký nào</p>
        ) : (
          <div className="space-y-3">
            {periods.slice(0, 3).map((period) => (
              <div key={period.id} className="flex items-center justify-between rounded-lg border border-gray-100 p-3">
                <div>
                  <p className="font-medium text-gray-900">{period.name}</p>
                  <p className="mt-0.5 text-xs text-gray-500">
                    {new Date(period.startDate).toLocaleDateString("vi-VN")} - {new Date(period.endDate).toLocaleDateString("vi-VN")}
                  </p>
                </div>
                <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${
                  period.status === "OPEN" ? "bg-green-100 text-green-800" :
                  period.status === "CLOSED" ? "bg-gray-100 text-gray-600" :
                  "bg-amber-100 text-amber-800"
                }`}>
                  {period.status === "OPEN" ? "Mở" : period.status === "CLOSED" ? "Đóng" : "Nháp"}
                </span>
              </div>
            ))}
          </div>
        )}
      </Card>

      <Card title="Thao tác nhanh">
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <Link href="/faculty-staff/registration-periods">
            <div className="rounded-lg border border-gray-200 p-4 text-center transition-colors hover:border-blue-300 hover:bg-blue-50">
              <CalendarDays className="mx-auto mb-2 h-6 w-6 text-blue-600" />
              <p className="text-sm font-medium text-gray-700">Quản lý đợt đăng ký</p>
            </div>
          </Link>
        </div>
      </Card>
    </div>
  );
}
