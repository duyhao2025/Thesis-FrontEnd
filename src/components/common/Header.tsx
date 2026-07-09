"use client";

import React from "react";
import Link from "next/link";
import { useAuth } from "@/contexts/AuthContext";
import { LogOut, ChevronDown, KeyRound, UserCircle2 } from "lucide-react";
import { Menu, Transition } from "@headlessui/react";
import clsx from "clsx";

const roleLabels: Record<string, string> = {
  Student: "Sinh viên",
  Lecturer: "Giảng viên",
  FacultyStaff: "Nhân viên khoa",
  HeadOfDepartment: "Trưởng bộ môn",
  Admin: "Quản trị viên",
};

const roleAccentColors: Record<string, string> = {
  Admin: "bg-indigo-600",
  Lecturer: "bg-teal-600",
  HeadOfDepartment: "bg-teal-600",
  FacultyStaff: "bg-amber-600",
  Student: "bg-emerald-600",
};

export default function Header() {
  const { user, logout } = useAuth();

  const initials = user?.fullName
    ?.split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2) || "?";

  const role = user?.role || "";
  const accentColor = roleAccentColors[role] || "bg-blue-600";

  return (
    <header
      className="flex h-16 items-center justify-between border-b bg-white px-6"
      style={{ borderColor: "var(--role-card-border)" }}
    >
      <div className="flex items-center gap-2 text-sm text-gray-500">
        <span>{roleLabels[role] || role}</span>
      </div>

      <div className="flex items-center gap-4">
        <Menu as="div" className="relative">
          <Menu.Button className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm hover:bg-gray-50">
            <div
              className={clsx(
                "flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold text-white",
                accentColor
              )}
            >
              {initials}
            </div>
            <div className="hidden text-left md:block">
              <p className="font-medium text-gray-900">
                {user?.fullName || "User"}
              </p>
              <p className="text-xs text-gray-500">{roleLabels[role]}</p>
            </div>
            <ChevronDown className="hidden h-4 w-4 text-gray-400 md:block" />
          </Menu.Button>

          <Transition
            enter="transition ease-out duration-100"
            enterFrom="transform opacity-0 scale-95"
            enterTo="transform opacity-100 scale-100"
            leave="transition ease-in duration-75"
            leaveFrom="transform opacity-100 scale-100"
            leaveTo="transform opacity-0 scale-95"
          >
            <Menu.Items className="absolute right-0 z-50 mt-2 w-48 origin-top-right rounded-xl bg-white shadow-lg ring-1 ring-black/5 focus:outline-none">
              <div className="border-b border-gray-100 px-4 py-3">
                <p className="text-sm font-medium text-gray-900">
                  {user?.fullName}
                </p>
                <p className="text-xs text-gray-500">{user?.email}</p>
              </div>
              <div className="p-1">
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/profile"
                      className={clsx(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      )}
                    >
                      <UserCircle2 className="h-4 w-4" />
                      Hồ sơ cá nhân
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <Link
                      href="/change-password"
                      className={clsx(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                        active ? "bg-gray-100 text-gray-900" : "text-gray-700"
                      )}
                    >
                      <KeyRound className="h-4 w-4" />
                      Đổi mật khẩu
                    </Link>
                  )}
                </Menu.Item>
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={logout}
                      className={clsx(
                        "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm",
                        active ? "bg-red-50 text-red-600" : "text-red-600"
                      )}
                    >
                      <LogOut className="h-4 w-4" />
                      Đăng xuất
                    </button>
                  )}
                </Menu.Item>
              </div>
            </Menu.Items>
          </Transition>
        </Menu>
      </div>
    </header>
  );
}
