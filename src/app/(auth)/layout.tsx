"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  const { isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      const token = localStorage.getItem("accessToken");
      const userStr = localStorage.getItem("user");
      if (token && userStr) {
        try {
          const user = JSON.parse(userStr);
          const roleRoutes: Record<string, string> = {
            Student: "/student/dashboard",
            Lecturer: "/lecturer/dashboard",
            FacultyStaff: "/faculty-staff/dashboard",
            HeadOfDepartment: "/head/dashboard",
            Admin: "/admin/dashboard",
          };
          const target = user.requirePasswordChange
            ? "/change-password"
            : roleRoutes[user.role] || "/student/dashboard";
          router.push(target);
        } catch {
          // invalid user JSON, show login
        }
      }
    }
  }, [isLoading, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  return <>{children}</>;
}
