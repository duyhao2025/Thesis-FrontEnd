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
  BarChart3,
  ShieldCheck,
  Building2,
  ClipboardCheck,
  Megaphone,
  BookMarked,
  Bell,
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useNotifications } from "@/hooks/useNotifications";

interface MenuItem {
  id: string;
  label: string;
  href: string;
  icon: React.ReactNode;
}

const menuConfig: Record<string, MenuItem[]> = {
  Student: [
    { id: "student-dashboard", label: "Tổng quan", href: "/student/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "student-group", label: "Nhóm của tôi", href: "/student/group", icon: <Users className="h-5 w-5" /> },
    { id: "student-registrations", label: "Đăng ký đề tài", href: "/student/topic-registrations", icon: <BookOpen className="h-5 w-5" /> },
    { id: "student-proposals", label: "Đề xuất đề tài", href: "/student/topic-proposals", icon: <FileText className="h-5 w-5" /> },
    { id: "student-logs", label: "Nhật ký tiến độ", href: "/student/progress-logs", icon: <ClipboardList className="h-5 w-5" /> },
    { id: "student-reports", label: "Báo cáo định kỳ", href: "/student/periodic-reports", icon: <FileBarChart className="h-5 w-5" /> },
    { id: "student-my-topic", label: "Đề tài của tôi", href: "/student/my-topic", icon: <FolderKanban className="h-5 w-5" /> },
    { id: "student-notifications", label: "Thông báo", href: "/student/notifications", icon: <Bell className="h-5 w-5" /> },
  ],
  Lecturer: [
    { id: "lecturer-dashboard", label: "Tổng quan", href: "/lecturer/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "lecturer-councils", label: "Hội đồng của tôi", href: "/lecturer/councils", icon: <Users className="h-5 w-5" /> },
    { id: "lecturer-topics", label: "Quản lý đề tài", href: "/lecturer/topics", icon: <BookOpen className="h-5 w-5" /> },
    { id: "lecturer-registrations", label: "Duyệt đăng ký", href: "/lecturer/topic-registrations", icon: <ClipboardCheck className="h-5 w-5" /> },
    { id: "lecturer-proposals", label: "Duyệt đề xuất", href: "/lecturer/topic-proposals", icon: <CheckCircle className="h-5 w-5" /> },
    { id: "lecturer-plans", label: "Kế hoạch tiến độ", href: "/lecturer/progress-plans", icon: <ListChecks className="h-5 w-5" /> },
    { id: "lecturer-students", label: "Sinh viên", href: "/lecturer/students", icon: <GraduationCap className="h-5 w-5" /> },
    { id: "lecturer-grading", label: "Chấm điểm", href: "/lecturer/grading", icon: <ClipboardCheck className="h-5 w-5" /> },
    { id: "lecturer-grade-management", label: "Quản lý điểm", href: "/lecturer/grade-management", icon: <ClipboardList className="h-5 w-5" /> },
    { id: "lecturer-notifications", label: "Thông báo", href: "/lecturer/notifications", icon: <Bell className="h-5 w-5" /> },
  ],
  HeadOfDepartment: [
    { id: "hod-dashboard", label: "Tổng quan", href: "/head/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "hod-councils", label: "Hội đồng báo cáo", href: "/head/councils", icon: <Users className="h-5 w-5" /> },
    { id: "hod-rubrics", label: "Tiêu chí chấm", href: "/head/rubrics", icon: <BookMarked className="h-5 w-5" /> },
  ],
  FacultyStaff: [
    { id: "faculty-dashboard", label: "Tổng quan", href: "/faculty-staff/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "faculty-periods", label: "Đợt đăng ký", href: "/faculty-staff/registration-periods", icon: <CalendarDays className="h-5 w-5" /> },
    { id: "faculty-categories", label: "Danh mục đề tài", href: "/faculty-staff/topic-categories", icon: <FolderKanban className="h-5 w-5" /> },
    { id: "faculty-topic-proposals", label: "Duyệt đề xuất", href: "/faculty-staff/topic-proposals", icon: <CheckCircle className="h-5 w-5" /> },
    { id: "faculty-assignments", label: "Phân công giảng viên", href: "/faculty-staff/assignments", icon: <ClipboardCheck className="h-5 w-5" /> },
    { id: "faculty-councils", label: "Hội đồng báo cáo", href: "/faculty-staff/councils", icon: <Users className="h-5 w-5" /> },
    { id: "faculty-rubrics", label: "Tiêu chí chấm", href: "/faculty-staff/rubrics", icon: <BookMarked className="h-5 w-5" /> },
    { id: "faculty-grade-management", label: "Quản lý điểm", href: "/faculty-staff/grade-management", icon: <ClipboardList className="h-5 w-5" /> },
  ],
  Admin: [
    { id: "admin-dashboard", label: "Tổng quan", href: "/admin/dashboard", icon: <LayoutDashboard className="h-5 w-5" /> },
    { id: "admin-users", label: "Quản lý người dùng", href: "/admin/users", icon: <Users className="h-5 w-5" /> },
    { id: "admin-semesters", label: "Học kỳ", href: "/admin/semesters", icon: <BookMarked className="h-5 w-5" /> },
    { id: "admin-departments", label: "Khoa / Ngành", href: "/admin/departments", icon: <Building2 className="h-5 w-5" /> },
    { id: "admin-audit", label: "Nhật ký hệ thống", href: "/admin/audit-log", icon: <ClipboardCheck className="h-5 w-5" /> },
  ],
};

// Role display names
const roleDisplayNames: Record<string, string> = {
  Student: "Sinh viên",
  Lecturer: "Giảng viên",
  HeadOfDepartment: "Trưởng bộ môn",
  FacultyStaff: "Nhân viên khoa",
  Admin: "Quản trị viên",
};

// Role colors for the logo
const roleLogoColors: Record<string, string> = {
  Admin: "text-indigo-400",
  Lecturer: "text-teal-400",
  HeadOfDepartment: "text-teal-400",
  FacultyStaff: "text-amber-400",
  Student: "text-emerald-400",
};

const roleLogoBg: Record<string, string> = {
  Admin: "bg-indigo-900",
  Lecturer: "bg-teal-900",
  HeadOfDepartment: "bg-teal-900",
  FacultyStaff: "bg-amber-900",
  Student: "bg-emerald-900",
};

export default function Sidebar() {
  const [collapsed, setCollapsed] = useState(false);
  const pathname = usePathname();
  const { user } = useAuth();
  const { unreadCount } = useNotifications();

  const role = user?.role || "";
  const menuItems = menuConfig[role] || [];

  return (
    <aside
      className={clsx(
        "flex flex-col border-r transition-all duration-300",
        collapsed ? "w-16" : "w-64"
      )}
      style={{
        backgroundColor: "var(--role-sidebar-bg)",
        borderColor: "var(--role-sidebar-bg)",
      }}
    >
      {/* Logo */}
      <div
        className="flex h-16 items-center border-b px-4"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
      >
        {!collapsed && (
          <div className="flex items-center gap-2">
            <div className={clsx("rounded-lg p-1.5", roleLogoBg[role])}>
              <ShieldCheck className={clsx("h-5 w-5", roleLogoColors[role])} />
            </div>
            <div>
              <span className="text-base font-bold text-white">ThesisMS</span>
              <p className="text-[10px] text-gray-400 leading-tight">
                {roleDisplayNames[role]}
              </p>
            </div>
          </div>
        )}
        {collapsed && (
          <div className={clsx("mx-auto rounded-lg p-1.5", roleLogoBg[role])}>
            <ShieldCheck className={clsx("h-5 w-5", roleLogoColors[role])} />
          </div>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-2 py-4">
        {menuItems.map((item) => {
          const isActive =
            pathname === item.href || pathname.startsWith(item.href + "/");
          return (
            <Link
              key={item.id}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "text-white"
                  : "text-gray-400 hover:bg-white/10 hover:text-white"
              )}
              style={
                isActive
                  ? { backgroundColor: "var(--role-sidebar-active-bg)", color: "var(--role-sidebar-active-text)" }
                  : undefined
              }
              title={collapsed ? item.label : undefined}
            >
              <span
                className={clsx(
                  "relative flex-shrink-0 transition-colors",
                  isActive ? roleLogoColors[role] : ""
                )}
                style={isActive ? { color: "var(--role-accent)" } : undefined}
              >
                {item.icon}
                {(item.id === "student-notifications" || item.id === "lecturer-notifications") && unreadCount > 0 && (
                  <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[9px] font-bold text-white">
                    {unreadCount > 9 ? "9+" : unreadCount}
                  </span>
                )}
              </span>
              {!collapsed && <span>{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Collapse button */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex h-12 items-center justify-center border-t text-gray-500 transition-colors hover:bg-white/5 hover:text-gray-300"
        style={{ borderColor: "rgba(255,255,255,0.1)" }}
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
