"use client";

import React, { useEffect } from "react";
import Sidebar from "./Sidebar";
import Header from "./Header";
import { useAuth } from "@/contexts/AuthContext";

export default function DashboardShell({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();

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
        </main>
      </div>
    </div>
  );
}
