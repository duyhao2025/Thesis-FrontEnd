"use client";

import React from "react";
import clsx from "clsx";
import {
  GraduationCap,
  Code2,
  Mail,
  ShieldCheck,
  Sparkles,
  UserCircle2,
} from "lucide-react";
import Link from "next/link";
import type { RoleTheme } from "@/lib/roleTheme";

interface RoleFooterProps {
  theme: RoleTheme;
  fullName?: string;
  email?: string;
}

const PRODUCT_LINKS = [
  { label: "Hồ sơ", href: "/profile", icon: UserCircle2 },
  { label: "Đổi mật khẩu", href: "/change-password", icon: ShieldCheck },
];

const ROLE_QUICK_LINKS: Record<string, { label: string; href: string }[]> = {
  Student: [
    { label: "Dashboard", href: "/student/dashboard" },
    { label: "Đề tài", href: "/student/topics" },
    { label: "Đồ án của tôi", href: "/student/theses" },
  ],
  Lecturer: [
    { label: "Dashboard", href: "/lecturer/dashboard" },
    { label: "Đề tài hướng dẫn", href: "/lecturer/topics" },
    { label: "Sinh viên", href: "/lecturer/students" },
  ],
  HeadOfDepartment: [
    { label: "Dashboard", href: "/head/dashboard" },
    { label: "Phê duyệt", href: "/head/approvals" },
  ],
  FacultyStaff: [
    { label: "Dashboard", href: "/faculty-staff/dashboard" },
    { label: "Đồ án", href: "/faculty-staff/theses" },
  ],
  Admin: [
    { label: "Dashboard", href: "/admin/dashboard" },
    { label: "Người dùng", href: "/admin/users" },
    { label: "Khoa / Bộ môn", href: "/admin/departments" },
  ],
};

export default function RoleFooter({ theme, fullName, email }: RoleFooterProps) {
  const year = new Date().getFullYear();
  const roleLinks = ROLE_QUICK_LINKS[theme.role] ?? [];

  return (
    <footer
      className={clsx(
        "mt-10 overflow-hidden rounded-2xl text-white shadow-md",
        "bg-gradient-to-br",
        theme.footerGradient
      )}
    >
      <div className="pointer-events-none absolute" aria-hidden />
      <div className="relative grid grid-cols-1 gap-8 px-6 py-8 sm:grid-cols-2 lg:grid-cols-4 lg:px-8">
        {/* Brand */}
        <div>
          <div className="flex items-center gap-2">
            <div
              className={clsx(
                "flex h-9 w-9 items-center justify-center rounded-lg",
                theme.logoBg
              )}
            >
              <GraduationCap className={clsx("h-5 w-5", theme.logoFg)} />
            </div>
            <div>
              <p className="text-base font-bold">UEF Thesis</p>
              <p className="text-xs text-white/80">{theme.roleLabel}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-white/85">
            Hệ thống quản lý đồ án tốt nghiệp — kết nối sinh viên, giảng viên
            và ban chủ nhiệm khoa.
          </p>
          {fullName && (
            <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-1 text-xs font-medium backdrop-blur">
              <Sparkles className="h-3 w-3" />
              Xin chào, {fullName}
            </p>
          )}
        </div>

        {/* Quick links */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
            Điều hướng nhanh
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {PRODUCT_LINKS.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="inline-flex items-center gap-2 text-white/90 transition hover:text-white"
                >
                  <l.icon className="h-3.5 w-3.5" />
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Role-specific links */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
            {theme.roleLabel}
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {roleLinks.map((l) => (
              <li key={l.href}>
                <Link
                  href={l.href}
                  className="text-white/90 transition hover:text-white"
                >
                  {l.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Contact */}
        <div>
          <p className="text-[11px] font-semibold uppercase tracking-wide text-white/80">
            Liên hệ
          </p>
          <ul className="mt-3 space-y-2 text-sm">
            {email && (
              <li className="flex items-center gap-2 text-white/90">
                <Mail className="h-4 w-4" />
                <span className="truncate">{email}</span>
              </li>
            )}
            <li className="flex items-center gap-2 text-white/90">
              <Code2 className="h-4 w-4" />
              <span>github.com/uef-thesis</span>
            </li>
            <li className="flex items-center gap-2 text-white/90">
              <ShieldCheck className="h-4 w-4" />
              <span>Phiên đăng nhập an toàn</span>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/20 bg-black/10 px-6 py-3 text-xs text-white/80 sm:flex sm:items-center sm:justify-between lg:px-8">
        <p>© {year} UEF Thesis. All rights reserved.</p>
        <p className="mt-1 sm:mt-0">
          Made with <span className="text-rose-200">♥</span> for students & lecturers.
        </p>
      </div>
    </footer>
  );
}
