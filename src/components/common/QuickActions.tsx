"use client";

import React from "react";
import Link from "next/link";
import clsx from "clsx";

interface QuickAction {
  href: string;
  label: string;
  icon: React.ReactNode;
  /** Tailwind classes for the resting background, e.g. "bg-rose-50 text-rose-600" */
  className?: string;
}

interface QuickActionsProps {
  title?: string;
  subtitle?: string;
  actions: QuickAction[];
  columns?: 2 | 3 | 4;
}

const DEFAULT_ACTION_CLASS =
  "bg-gray-50 text-gray-600 hover:bg-gray-100 hover:border-gray-200";

export default function QuickActions({
  title = "Hành động nhanh",
  subtitle,
  actions,
  columns = 4,
}: QuickActionsProps) {
  const gridCols =
    columns === 2
      ? "sm:grid-cols-2"
      : columns === 3
        ? "sm:grid-cols-3"
        : "sm:grid-cols-4";

  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h3 className="font-bold text-gray-900">{title}</h3>}
          {subtitle && (
            <p className="mt-0.5 text-xs text-gray-500">{subtitle}</p>
          )}
        </div>
      )}
      <div className={clsx("grid grid-cols-2 gap-3", gridCols)}>
        {actions.map((a) => (
          <Link key={a.href + a.label} href={a.href} className="group">
            <div
              className={clsx(
                "flex flex-col items-center gap-2 rounded-xl border border-transparent p-4 text-center transition-all hover:-translate-y-0.5",
                a.className ?? DEFAULT_ACTION_CLASS
              )}
            >
              <div className="text-xl">{a.icon}</div>
              <span className="text-xs font-semibold sm:text-sm">{a.label}</span>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
