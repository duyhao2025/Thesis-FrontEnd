"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/contexts/AuthContext";

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: string[];
}

export default function ProtectedRoute({ children, allowedRoles }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading) {
      if (!isAuthenticated) {
        router.push("/login");
        return;
      }
      if (user?.requirePasswordChange) {
        router.push("/change-password");
        return;
      }
      if (allowedRoles && user && !allowedRoles.includes(user.role)) {
        const roleRoutes: Record<string, string> = {
          Student: "/student/dashboard",
          Lecturer: "/lecturer/dashboard",
          FacultyStaff: "/faculty-staff/dashboard",
          HeadOfDepartment: "/lecturer/dashboard",
          Admin: "/admin/dashboard",
        };
        router.push(roleRoutes[user.role] || "/login");
      }
    }
  }, [isAuthenticated, isLoading, user, allowedRoles, router]);

  if (isLoading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  if (allowedRoles && user && !allowedRoles.includes(user.role)) return null;

  return <>{children}</>;
}
