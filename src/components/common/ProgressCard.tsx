"use client";

import React from "react";
import clsx from "clsx";

export interface ProgressMilestone {
  id: string | number;
  title: string;
  status: "done" | "active" | "todo";
  date?: string;
  pill?: string;
  pillClass?: string;
}

interface ProgressCardProps {
  title?: string;
  subtitle?: string;
  badge?: string;
  progress: number; // 0..100
  hint?: string;
  gradientFrom?: string;
  gradientTo?: string;
}

export default function ProgressCard({
  title = "Tiến độ đồ án",
  subtitle,
  badge,
  progress,
  hint,
  gradientFrom = "from-emerald-50",
  gradientTo = "to-teal-50",
}: ProgressCardProps) {
  const safe = Math.max(0, Math.min(100, progress));
  return (
    <div
      className={clsx(
        "rounded-xl border border-emerald-100 bg-gradient-to-r p-5",
        gradientFrom,
        gradientTo
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
            {title}
          </p>
          {subtitle && (
            <p className="mt-0.5 truncate text-sm font-bold text-gray-900 sm:text-base">
              {subtitle}
            </p>
          )}
        </div>
        {badge && (
          <span className="hidden rounded-full bg-white/85 px-2.5 py-0.5 text-xs font-medium text-emerald-700 shadow-sm sm:inline-block">
            {badge}
          </span>
        )}
        <p className="text-2xl font-bold text-emerald-700 sm:text-3xl">
          {safe}%
        </p>
      </div>
      <div className="mt-3 h-3 overflow-hidden rounded-full bg-white/70 shadow-inner">
        <div
          className="h-full rounded-full bg-gradient-to-r from-emerald-400 via-emerald-500 to-teal-500 transition-all"
          style={{ width: `${safe}%` }}
        />
      </div>
      {hint && (
        <p className="mt-2 text-xs text-emerald-700 sm:text-sm">{hint}</p>
      )}
    </div>
  );
}
