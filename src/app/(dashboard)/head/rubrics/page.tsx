"use client";

import React from "react";
import { BookMarked } from "lucide-react";

export default function RubricsPage() {
  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-xl font-bold text-gray-900">Tiêu chí chấm</h1>
        <p className="text-sm text-gray-500">Quản lý tiêu chí và rubric chấm điểm luận văn</p>
      </div>
      <div className="flex flex-col items-center justify-center rounded-lg border border-dashed border-gray-300 py-20">
        <BookMarked className="mb-3 h-12 w-12 text-gray-300" />
        <p className="font-medium text-gray-500">Tính năng đang được phát triển</p>
        <p className="mt-1 text-sm text-gray-400">Trang quản lý tiêu chí chấm sẽ sớm có mặt tại đây</p>
      </div>
    </div>
  );
}
