"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import clsx from "clsx";
import {
  LayoutDashboard,
  BookOpen,
  FileText,
  ClipboardList,
  FileBarChart,
  FolderKanban,
  GraduationCap,
  Users,
  Settings,
  ChevronLeft,
  ChevronRight,
  CalendarDays,
  CheckCircle,
  ListChecks,
  UserCog,
  BarChart3,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const menuConfig: Record<string, MenuItem[]> = {
  Student: [
    { id: "student-dashboard", label: "Tổng quan", href: "/student/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "student-registrations", label: "Đăng ký đề tài", href: "/student/topic-registrations", icon: <BookOpen className="h-5 w-5" /> },
    { id: "student-proposals", label: "Đề xuất đề tài", href: "/student/topic-proposals", icon: <FileText className="h-5 w-5" /> },
    { id: "student-logs", label: "Nhật ký tiến độ", href: "/student/progress-logs", icon: <ClipboardList className="h-5 w-5" /> },
    { id: "student-reports", label: "Báo cáo định kỳ", href: "/student/periodic-reports", icon: <FileBarChart className="h-5 w-5" /> },
    { id: "student-my-topic", label: "Đề tài của tôi", href: "/student/my-topic", icon: <FolderKanban className="h-5 w-5" /> },
  ],
  Lecturer: [
    { id: "lecturer-dashboard", label: "Tổng quan", href: "/lecturer/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "lecturer-topics", label: "Quản lý đề tài", href: "/lecturer/topics", icon: <BookOpen className="h-5 w-5" /> },
    { id: "lecturer-categories", label: "Danh mục đề tài", href: "/lecturer/topic-categories", icon: <FolderKanban className="h-5 w-5" /> },
    { id: "lecturer-proposals", label: "Duyệt đề xuất", href: "/lecturer/topic-proposals", icon: <CheckCircle className="h-5 w-5" /> },
    { id: "lecturer-plans", label: "Kế hoạch tiến độ", href: "/lecturer/progress-plans", icon: <ListChecks className="h-5 w-5" /> },
    { id: "lecturer-students", label: "Sinh viên", href: "/lecturer/students", icon: <GraduationCap className="h-5 w-5" /> },
  ],
  FacultyStaff: [
    { id: "faculty-dashboard", label: "Tổng quan", href: "/faculty-staff/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "faculty-periods", label: "Đợt đăng ký", href: "/faculty-staff/registration-periods", icon: <CalendarDays className="h-5 w-5" /> },
  ],
  Admin: [
    { id: "admin-dashboard", label: "Tổng quan", href: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "admin-users", label: "Quản lý người dùng", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { id: "admin-stats", label: "Thống kê", href: "/admin/dashboard", icon: <BarChart3 className="h-5 w-5" /> },
    { id: "admin-settings", label: "Cài đặt", href: "/admin/settings", icon: <Settings className="h-5 w-5" /> },
  ],
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();

  const menuItems = user?.role ? menuConfig[user.role] || [] : [];

  return (
    <aside
      className={clsx(
        "flex flex-col border-r border-gray-200 bg-white transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
    >
      <div className="flex h-16 items-center border-b border-gray-200 px-4">
        {!collapsed && (
          <span className="text-base font-bold text-blue-600">ThesisMS</span>
        )}
        {collapsed && (
          <span className="mx-auto text-lg font-bold text-blue-600">T</span>
        )}
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {menuItems.map((item) => {
          const isActive = pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
              title={collapsed ? item.label : undefined}
            >
              <span className="flex-shrink-0">{item.icon}</span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t border-gray-200 text-gray-400 hover:bg-gray-50 hover:text-gray-600"
      >
        {collapsed ? (
          <ChevronRight className="h-5 w-5" />
        ) : (
          <ChevronLeft className="h-5 w-5" />
        )}
      </button>
    </aside>
  );
}
