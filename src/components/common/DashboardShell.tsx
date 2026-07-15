"use client";

import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import RoleFooter from "./RoleFooter";
import { useAuth } from "@/contexts/AuthContext";
import { getRoleTheme } from "@/lib/roleTheme";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const theme = getRoleTheme(user?.role);

  useEffect(() => {
    if (user?.role) {
      document.body.setAttribute("data-theme", user.role);
    } else {
      document.body.removeAttribute("data-theme");
    }
  }, [user?.role]);

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">
      <Sidebar />
      <div className="flex flex-1 flex-col overflow-hidden">
        <Header />
        <main className="flex-1 overflow-y-auto p-6">
          {children}
          <RoleFooter
            theme={theme}
            fullName={user?.fullName}
            email={user?.email}
          />
        </main>
      </div>
    </div>
  );
}
