"use client";

import ProtectedRoute from "@/components/common/ProtectedRoute";

export default function HeadLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={["HeadOfDepartment"]}>
      {children}
    </ProtectedRoute>
  );
}
