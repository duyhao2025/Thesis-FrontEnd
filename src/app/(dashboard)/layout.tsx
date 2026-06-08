"use client";

import ProtectedRoute from "@/components/common/ProtectedRoute";
import DashboardShell from "@/components/common/DashboardShell";

export default function DashboardGroupLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute>
      <DashboardShell>{children}</DashboardShell>
    </ProtectedRoute>
  );
}
