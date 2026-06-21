"use client";

import React from "react";
import { Users } from "lucide-react";

export default function CouncilsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Hội đồng</h1>
        <p className="text-sm text-gray-500">Quản lý hội đồng chấm bảo vệ luận văn</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-20">
        <Users className="mb-3 h-12 w-12 text-gray-300" />
        <p className="font-medium text-gray-500">Tính năng đang được phát triển</p>
        <p className="mt-1 text-sm text-gray-400">Trang quản lý hội đồng sẽ sớm có mặt tại đây</p>
      </div>
    </div>
  );
}
